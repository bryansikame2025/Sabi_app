// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


 // icône + mot "SABI" — utilisé dans l'app (header)

    const firebaseConfig = {
      apiKey: "AIzaSyBCgSKNEcsCNTpzK2Qi11Q9n9xpePJztVc",
      authDomain: "sabi-41823.firebaseapp.com",
      databaseURL: "https://sabi-41823-default-rtdb.firebaseio.com",
      projectId: "sabi-41823",
      storageBucket: "sabi-41823.firebasestorage.app",
      messagingSenderId: "489522682522",
      appId: "1:489522682522:web:7fa9b5749b1be714e05d23"
    };
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database();
    export const auth = firebase.auth();

    // ========== Notifications push (Firebase Cloud Messaging) ==========
    // Clé VAPID générée dans Firebase Console > Paramètres du projet > Cloud Messaging >
    // Certificats Web Push. Publique par nature (elle circule côté client), aucun risque à
    // la garder ici comme le reste de la config Firebase.
    const FCM_VAPID_KEY = "BKLzgxYn74eHyIVwY15P0AlgivsCSTMTI7GIhetWfUqy9J-ulUFNODKjoNje789MjcL8MDuo-Ze7f1k2GIkQjmQ";
    // messaging() jette une exception sur les navigateurs sans support Push (anciens iOS
    // Safari notamment) : on isole donc l'appel pour que le reste de l'app démarre quand même.
    export let messaging = null;
    try { if (firebase.messaging.isSupported()) messaging = firebase.messaging(); } catch {}

    // Demande la permission puis récupère le token de cet appareil, à appeler uniquement sur un
    // geste utilisateur explicite (toggle "Notifications" dans le menu). Le token est rangé sous
    // users/{uid}/fcmToken : un seul appareil actif par compte pour l'instant (un futur
    // multi-appareils demanderait une liste plutôt qu'un champ unique).
    //
    // Deux méthodes selon le contexte : dans l'app native (Capacitor), on passe par le vrai FCM
    // Android (seule méthode qui délivre les notifications même app totalement fermée) ; sur
    // navigateur, on garde le "web push" existant (via service worker, ne marche que app/onglet
    // ouvert au moins en arrière-plan récent).
    export async function activerNotificationsPush(uid) {
      if (!uid) return { ok: false, raison: "non-supporte" };
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        try {
          const { PushNotifications } = window.Capacitor.Plugins;
          if (!PushNotifications) return { ok: false, raison: "non-supporte" };
          const etat = await PushNotifications.requestPermissions();
          if (etat.receive !== "granted") return { ok: false, raison: "refuse" };
          return await new Promise(resolve => {
            PushNotifications.addListener("registration", async (token) => {
              try { await usersRef.child(uid).update({ fcmToken: token.value }); resolve({ ok: true }); }
              catch { resolve({ ok: false, raison: "erreur" }); }
            });
            PushNotifications.addListener("registrationError", () => resolve({ ok: false, raison: "erreur" }));
            PushNotifications.register();
          });
        } catch (err) {
          console.error("Erreur activation push native :", err);
          return { ok: false, raison: "erreur" };
        }
      }
      if (!messaging) return { ok: false, raison: "non-supporte" };
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return { ok: false, raison: "refuse" };
        const registration = await navigator.serviceWorker.ready;
        const token = await messaging.getToken({ vapidKey: FCM_VAPID_KEY, serviceWorkerRegistration: registration });
        if (!token) return { ok: false, raison: "token-vide" };
        await usersRef.child(uid).update({ fcmToken: token });
        return { ok: true };
      } catch (err) {
        console.error("Erreur activation push :", err);
        return { ok: false, raison: "erreur" };
      }
    }

    // Retire le token pour que le serveur arrête d'envoyer des pushs à cet appareil
    // (on ne peut pas révoquer la permission navigateur depuis le code, seulement arrêter
    // d'envoyer — l'utilisateur devra la couper lui-même dans les réglages du site si besoin).
    export async function desactiverNotificationsPush(uid) {
      if (!uid) return;
      try { await usersRef.child(uid).child("fcmToken").remove(); } catch {}
    }
    export const usersRef = db.ref("users");
    export const cardsRef = db.ref("cards");
    export const boussoleRef = db.ref("boussole");
    export const carteRef = db.ref("carte");
    export const chatRef = db.ref("chat");
    export const epreuvesRef = db.ref("epreuves");
    export const pointsLogRef = db.ref("pointsLog");
    export const bountyRef = db.ref("bounties");
    // Assistance privée étudiant <-> propriétaire : support/{uid}/{msgId} = {auteur, texte, timestamp, lu}
    export const supportRef = db.ref("support");
    // Index matricule -> uid, utilisé pour retrouver le compte d'un étudiant à partir de son
    // matricule (lu par l'IA sur une feuille de notes) sans pouvoir lister tous les comptes.
    export const matriculesRef = db.ref("matriculeIndex");
    // Notes attribuées automatiquement (MyScore) : nœud racine séparé de "users", accessible en
    // lecture uniquement par son propriétaire (et les admins), en écriture réservée aux admins.
    export const myscoreRef = db.ref("myscore");
    export const promosRef = db.ref("promotions");
    export const abonnementDemandesRef = db.ref("abonnementDemandes");
    const paiementsRef = db.ref("paiements");
    // VIP n'est plus un achat auto-validé : la demande passe par ce nœud, un
    // admin la valide (débite les points + active le VIP) ou la rejette.
    export const vipDemandesRef = db.ref("vipDemandes");
    export const demandesAnneeRef = db.ref("demandesAnnee");
    export const notificationsRef = db.ref("notifications");
    // Même principe que demandesAnneeRef, mais pour les demandes de changement de filière.
    export const demandesFiliereRef = db.ref("demandesFiliere");
    // Demandes de déverrouillage du matricule (une fois enregistré, il est immuable —
    // voir Security Rules — sauf validation d'une demande par le propriétaire).
    export const demandesMatriculeRef = db.ref("demandesMatricule");
    export const resumesRef = db.ref("resumes");

    // ========== FUN : sons, vibrations, confettis, classements hebdo, badges auto, carnet ==========
    export const classementHebdoRef = db.ref("classementHebdo");
    export const duelsRef = db.ref("duels");
