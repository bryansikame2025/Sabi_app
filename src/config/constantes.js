// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


    // ========== FIREBASE ==========
    export const LOGO_SABI = "logo-icon.png";           // icône seule (flamme + livre) — écrans d'authentification
    export const LOGO_SABI_WORDMARK = "logo-wordmark.png";

    export const SEED_CARDS = {
      "seed-1": {
        filiere: "Génie Informatique",
        contenu: "En Algorithmique S2, le TP du jeudi compte réellement pour 20% de la note finale même si ce n'est jamais annoncé à l'oral. Ne le séchez pas.",
        auteur: "Griot_Ada",
        up: 34,
        down: 2,
        date: "2026-07-12",
      },
      "seed-2": {
        filiere: "Comptabilité-Gestion",
        contenu: "En Compta Générale, le prof sanctionne lourdement l'absence de brouillon d'écritures visible, même quand le résultat final est juste.",
        auteur: "SabiDe237",
        up: 21,
        down: 0,
        date: "2026-07-20",
      },
      "seed-3": {
        filiere: "Génie Civil",
        contenu: "Beaucoup ignorent qu'avec le système LMD, une UE à 8/20 peut être validée si la moyenne pondérée du semestre dépasse 10. Ne paniquez pas pour une seule mauvaise note.",
        auteur: "MamaEco",
        up: 58,
        down: 3,
        date: "2026-06-30",
      },
    };

    export const CATEGORIES_BOUSSOLE = ["Administratif", "Logement", "Académique", "Vie pratique"];

    export const SEED_BOUSSOLE = {
      "b-1": { titre: "Retirer sa carte d'étudiant", categorie: "Administratif", description: "Au service de la scolarité, avec le reçu de paiement.", auteur: "Ancien_IUT", ordre: 1 },
      "b-2": { titre: "Valider son dossier d'inscription", categorie: "Administratif", description: "Frais de scolarité payés + dossier complet déposé.", auteur: "Ancien_IUT", ordre: 2 },
      "b-3": { titre: "Récupérer l'emploi du temps", categorie: "Académique", description: "Auprès du chef de département ou du délégué de classe.", auteur: "Ancien_IUT", ordre: 3 },
      "b-4": { titre: "Trouver un logement près du campus", categorie: "Logement", description: "Les quartiers autour de Bandjoun-centre sont les plus proches à pied.", auteur: "Ancien_IUT", ordre: 4 },
      "b-5": { titre: "Repérer les points de restauration pas chers", categorie: "Vie pratique", description: "Le mess et les gargotes autour du campus.", auteur: "Ancien_IUT", ordre: 5 },
      "b-6": { titre: "Localiser la bibliothèque et ses horaires", categorie: "Académique", description: "Utile dès les premières semaines pour les travaux dirigés.", auteur: "Ancien_IUT", ordre: 6 },
      "b-7": { titre: "Rejoindre le groupe WhatsApp de ta filière", categorie: "Vie pratique", description: "Demande au délégué de classe dès le premier jour.", auteur: "Ancien_IUT", ordre: 7 },
      "b-8": { titre: "Repérer les zones où le wifi campus fonctionne", categorie: "Vie pratique", description: "Généralement mieux capté près de l'administration et de la bibliothèque.", auteur: "Ancien_IUT", ordre: 8 },
    };

    export const CATEGORIES_CARTE = {
      "Salle de cours": "door",
      "Bâtiment": "building",
      "Photocopie": "printer",
      "Restauration": "utensils",
      "Administration": "landmark",
      "Bibliothèque": "book",
      "Autre": "map-pin",
    };

    export const ANNEES = ["Année 1", "Année 2", "Année 3"];
    export const SEMESTRES = ["Semestre 1", "Semestre 2"];
    export const TYPES_EPREUVE = ["Devoir / CC", "Examen", "TP noté", "Session de rattrapage"];

    export const BADGES = [
      { id: "etoile", nom: "Étoile brillante", emoji: "sparkles", cout: 20, couleur: "gold" },
      { id: "diplome", nom: "Diplômé d'honneur", emoji: "graduation-cap", cout: 40, couleur: "forest" },
      { id: "lion", nom: "Lion de Bandjoun", emoji: "shield", cout: 60, couleur: "terra" },
      { id: "couronne", nom: "Légende du campus", emoji: "crown", cout: 100, couleur: "gold" },
      // Badges automatiques : jamais achetables, débloqués par l'activité (voir debloquerBadgeAuto).
      { id: "marathonien", nom: "Marathonien", emoji: "clock", cout: 0, couleur: "forest", auto: true, condition: "2 h de focus dans la semaine" },
      { id: "sans_faute", nom: "Sans faute", emoji: "target", cout: 0, couleur: "gold", auto: true, condition: "Un quiz parfait (5/5)" },
      { id: "leve_tot", nom: "Lève-tôt", emoji: "sun", cout: 0, couleur: "terra", auto: true, condition: "Une session de focus avant 7 h" },
      { id: "flamme7", nom: "Flamme 7 jours", emoji: "flame", cout: 0, couleur: "terra", auto: true, condition: "7 jours de focus d'affilée" },
    ];
    export const COUT_VIP = 75;
    export const OWNER_EMAILS = ["bryansikame2026@gmail.com", "bryansikame2025@gmail.com"];
    export const COUT_EPINGLE = 20;
    export const COUT_FLASH = 30;

    // ========== ABONNEMENT SABI PRO / PRO+ ==========
    // Paiement manuel Orange Money (pas d'API automatique possible sans backend/contrat marchand) :
    // l'étudiant paie sur ce numéro, soumet une demande, le propriétaire l'active en 1 clic.
    const ORANGE_MONEY_NUMERO = "658 682 593";
    const ORANGE_MONEY_TITULAIRE = "TAGNE SIKAME ANGE BRYAN";
    export const PRIX_PRO_SEMESTRE = 2000;
    export const PRIX_PRO_ANNEE = 3000;
    export const PRIX_PROPLUS_SEMESTRE = 5000;
    export const PRIX_PROPLUS_ANNEE = 8000;
    // Avantages listés sous chaque pack (même contenu pour semestriel/annuel, seule la durée change)
    export const AVANTAGES_PRO = ["Accès à toutes les épreuves et leurs corrections", "Badge Pro doré sur ton profil", "Filtres et recherche illimités dans les épreuves"];
    export const AVANTAGES_PROPLUS = ["Tous les avantages Sabi Pro", "Résumés de cours exclusifs", "Groupe WhatsApp d'entraide Pro+", "Badge Pro+ doré sur ton profil"];
    export const WHATSAPP_PROPLUS_LIEN = "https://chat.whatsapp.com/LY3aEZivtZ7Ht6Bl4kPdLz?s=cl&p=a&ilr=4";

    // ========== PAIEMENT (NotchPay + secours manuel) ==========
    // Le paiement en ligne passe entièrement par des Netlify Functions : creer-paiement (calcule le
    // prix et crée la transaction avec la clé SECRÈTE NotchPay), webhook-notchpay (NotchPay prévient
    // le serveur, qui active l'abonnement) et verifier-paiement (bouton "Vérifier", filet de
    // sécurité). Aucune clé NotchPay n'est stockée dans l'appli. En secours, l'étudiant peut payer
    // à la main par Orange Money / MTN MoMo : le propriétaire valide dans le panneau Admin.
    const PAIEMENT_AUTO_ACTIF = true;
    // À REMPLACER : le numéro Orange Money / MTN MoMo qui reçoit les paiements manuels.
    export const PAIEMENT_MANUEL_NUMERO = "658 68 25 93";
    // Même numéro, joignable sur WhatsApp — utilisé pour que les étudiants envoient
    // facilement leur preuve de paiement (capture d'écran) après un virement manuel.
    export const PAIEMENT_MANUEL_WHATSAPP = "https://wa.me/237658682593";
