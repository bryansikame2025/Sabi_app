// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


    // ========== EmailJS (envoi du code de vérification par email) ==========
    // Compte gratuit sur emailjs.com (200 emails/mois). Remplace les 3 valeurs ci-dessous
    // par les tiennes : Service ID, Template ID (le template doit contenir les variables
    // {{to_email}} et {{code}}), et ta Public Key (Account > API Keys).
    const EMAILJS_PUBLIC_KEY = "MItjt83MpGBJPh-IJ";
    const EMAILJS_SERVICE_ID = "service_ih0v2xr"; // Brevo — meilleure délivrabilité que Gmail vers les domaines stricts (ex. universités)
    const EMAILJS_TEMPLATE_ID = "template_rlqxik3";
    const EMAILJS_CONFIGURE = EMAILJS_PUBLIC_KEY.startsWith("REMPLACE");
    if (!EMAILJS_CONFIGURE && window.emailjs) {
      emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    }

    function genererCodeOtp() {
      return String(Math.floor(100000 + Math.random() * 900000));
    }

    // Génère un code et l'envoie par email via le SDK officiel EmailJS.
    // Le code n'est PAS stocké dans Firebase (l'utilisateur n'a pas encore de session à ce stade,
    // ce qui déclenchait un refus "PERMISSION_DENIED" des règles de sécurité) : il reste en mémoire
    // le temps de l'inscription et est vérifié localement. Retourne le code généré, ou lève une erreur claire.
    export async function envoyerCodeOtp(email) {
      const code = genererCodeOtp();

      if (EMAILJS_CONFIGURE) {
        // Config EmailJS pas encore renseignée : on ne peut pas envoyer de vrai email.
        throw new Error("CONFIG_MANQUANTE");
      }
      if (!window.emailjs) {
        throw new Error("Le SDK EmailJS ne s'est pas chargé (vérifie ta connexion internet).");
      }

      const heureExpiration = new Date(Date.now() + 10 * 60 * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          email: email.trim(), passcode: code, time: heureExpiration
        });
      } catch (err) {
        // err.text (fourni par le SDK EmailJS) contient le vrai motif du refus.
        const detail = (err && (err.text || err.message)) || JSON.stringify(err);
        throw new Error(detail);
      }
      return code;
    }
