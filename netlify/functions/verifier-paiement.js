// Vérifie un paiement NotchPay et active l'abonnement Sabi Pro/Pro+ correspondant.
// Étapes : 1) relit /paiements/{reference} dans Firebase pour connaître le VRAI uid/tier/durée
// (jamais celui envoyé par le client — sinon n'importe qui pourrait s'attribuer l'abonnement de
// quelqu'un d'autre en trafiquant la requête), 2) demande à NotchPay le statut réel du paiement
// avec la clé SECRÈTE (jamais côté client), 3) si "complete", active l'abonnement en s'authentifiant
// auprès de Firebase comme compte de service (accès admin, ignore les Security Rules).
//
// Variables d'environnement Netlify requises :
// - NOTCHPAY_SECRET_KEY    : clé secrète NotchPay (Dashboard NotchPay > Réglages > Clés API)
// - FIREBASE_DB_URL        : ex. https://sabi-41823-default-rtdb.firebaseio.com
// - FIREBASE_PROJECT_ID    : depuis le JSON du compte de service (champ "project_id")
// - FIREBASE_CLIENT_EMAIL  : depuis le JSON du compte de service (champ "client_email")
// - FIREBASE_PRIVATE_KEY   : depuis le JSON du compte de service (champ "private_key", avec ses \n)

const crypto = require("crypto");

// Durée approximative des abonnements, en jours — simplification volontaire par rapport à
// l'alignement exact sur le calendrier semestriel utilisé ailleurs dans l'app (finDuSemestreActuel) :
// suffisant pour une activation automatique, un admin peut toujours ajuster manuellement en cas
// de besoin (voir panneau Administration).
const DUREE_JOURS = { semestre: 182, annuel: 365 };

function base64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// S'authentifie auprès de Google en tant que compte de service (JWT signé RS256, sans
// dépendance externe — le module "crypto" intégré à Node suffit) pour obtenir un access token
// utilisable sur l'API REST Firebase, avec les mêmes droits qu'un accès admin (Admin SDK).
async function obtenirAccessToken(clientEmail, privateKey) {
  const maintenant = Math.floor(Date.now() / 1000);
  const entete = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const revendications = base64url(JSON.stringify({
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/firebase.database",
    aud: "https://oauth2.googleapis.com/token",
    iat: maintenant,
    exp: maintenant + 3600
  }));
  const nonSigne = entete + "." + revendications;
  const signature = base64url(crypto.sign("RSA-SHA256", Buffer.from(nonSigne), privateKey));
  const jwt = nonSigne + "." + signature;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=" + jwt
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error("Échec d'authentification Google : " + (data.error_description || JSON.stringify(data)));
  return data.access_token;
}

// En-têtes CORS : indispensables depuis que l'app existe aussi en version native (Capacitor) —
// voir explication détaillée dans gemini.js.
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: CORS_HEADERS, body: "" };
  }
  const reponse = await gererRequete(event);
  return { ...reponse, headers: { ...CORS_HEADERS, ...(reponse.headers || {}) } };
};

async function gererRequete(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ ok: false, message: "Méthode non autorisée." }) };
  }

  const NOTCHPAY_SECRET_KEY = process.env.NOTCHPAY_SECRET_KEY;
  const FIREBASE_DB_URL = process.env.FIREBASE_DB_URL;
  const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
  // Netlify (comme la plupart des hébergeurs) stocke les variables d'environnement en une seule
  // ligne : les retours à la ligne réels de la clé privée arrivent sous forme de "\n" littéraux
  // (deux caractères, pas un vrai saut de ligne) — il faut les reconvertir avant de signer.
  const FIREBASE_PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
  if (!NOTCHPAY_SECRET_KEY || !FIREBASE_DB_URL || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, message: "Configuration serveur incomplète (clé NotchPay ou identifiants Firebase manquants)." })
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: "Requête invalide." }) };
  }
  const reference = payload.reference;
  if (!reference || typeof reference !== "string") {
    return { statusCode: 400, body: JSON.stringify({ ok: false, message: "Référence de paiement manquante." }) };
  }

  try {
    const accessToken = await obtenirAccessToken(FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY);
    const entetesFirebase = { Authorization: "Bearer " + accessToken };

    // 1) Relit l'enregistrement de paiement en base — source de vérité pour uid/tier/durée.
    const paiementResp = await fetch(`${FIREBASE_DB_URL}/paiements/${reference}.json`, { headers: entetesFirebase });
    const paiement = await paiementResp.json();
    if (!paiement) {
      return { statusCode: 404, body: JSON.stringify({ ok: false, message: "Paiement introuvable." }) };
    }
    if (paiement.statut === "confirme") {
      return { statusCode: 200, body: JSON.stringify({ ok: true, message: "Déjà confirmé." }) };
    }

    // 2) Demande à NotchPay le statut réel de ce paiement (clé secrète, jamais côté client).
    const notchResp = await fetch(`https://api.notchpay.co/payments/${reference}`, {
      headers: { Authorization: NOTCHPAY_SECRET_KEY }
    });
    const notchData = await notchResp.json();
    const statutNotchPay = notchData && notchData.payment && notchData.payment.status;
    if (statutNotchPay !== "complete") {
      return { statusCode: 200, body: JSON.stringify({ ok: false, message: "Paiement pas encore confirmé par NotchPay (statut : " + (statutNotchPay || "inconnu") + ")." }) };
    }

    // 3) Paiement confirmé : active l'abonnement + marque le paiement comme traité.
    const jours = DUREE_JOURS[paiement.duree] || DUREE_JOURS.semestre;
    const expireLe = Date.now() + jours * 24 * 60 * 60 * 1000;
    await fetch(`${FIREBASE_DB_URL}/users/${paiement.uid}/abonnement.json`, {
      method: "PUT",
      headers: entetesFirebase,
      body: JSON.stringify({ tier: paiement.tier, expireLe })
    });
    await fetch(`${FIREBASE_DB_URL}/paiements/${reference}.json`, {
      method: "PATCH",
      headers: entetesFirebase,
      body: JSON.stringify({ statut: "confirme", confirmeLe: Date.now() })
    });

    return { statusCode: 200, body: JSON.stringify({ ok: true, message: "Abonnement activé." }) };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ ok: false, message: "Erreur de vérification : " + (err && err.message) }) };
  }
};
