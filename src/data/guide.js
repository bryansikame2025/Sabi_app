// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


    // ===== Guide d'utilisation =====
    // Contenu du guide, affiché en accordéon dans une modale plutôt que via un lien externe
    // (qui pouvait casser si le lien changeait, et sortait l'utilisateur de l'app).
    export const GUIDE_SECTIONS = [
      {
        icone: "user",
        titre: "1. Créer un compte et se connecter",
        blocs: [
          { type: "p", texte: "À la première ouverture, choisis Créer un compte. Renseigne ton pseudo, ton email, un mot de passe, ton année et ta filière. Le matricule est optionnel à l'inscription, tu pourras le renseigner plus tard depuis ton profil. Une fois enregistré, il devient définitif : pour le modifier, il faut passer par une demande de déblocage." },
          { type: "p", texte: "Un code de vérification (OTP) peut être envoyé à ton email pour confirmer ton inscription. Si tu as déjà un compte, choisis simplement Se connecter avec ton email et ton mot de passe." },
        ],
      },
      {
        icone: "compass",
        titre: "2. Se repérer dans l'application",
        blocs: [
          { type: "p", texte: "En haut de l'écran : le menu (les trois traits) à gauche ouvre les paramètres, l'accès à l'Assistance et aux Crédits ; l'icône de profil à droite mène à ton espace personnel." },
          { type: "p", texte: "En bas de l'écran, cinq onglets principaux :" },
          { type: "list", items: [
            "Actualités. Fil d'infos et astuces de la communauté",
            "Épreuves. Sujets d'examens et corrigés",
            "Accueil. Tableau de bord personnel",
            "Carte. Plan interactif du campus",
            "Chat. Discussion et entraide",
          ]},
          { type: "p", texte: "Tu peux glisser le doigt horizontalement pour passer d'un onglet à l'autre, comme pour tourner une page. Sur un écran secondaire (Profil, Boussole, Boutique...), un glissement depuis le bord gauche fait office de bouton retour." },
        ],
      },
      {
        icone: "file-text",
        titre: "3. Actualités",
        blocs: [
          { type: "p", texte: "Ce fil regroupe les astuces, plans et annonces publiées par la communauté. Deux vues sont possibles : Récentes (les annonces épinglées d'abord, puis les plus récentes) et Tendances (triées par votes). Une carte marquée [VÉRIFIÉ] vient d'un membre Sabi VIP, un bon repère de fiabilité." },
          { type: "p", texte: "Le bouton rond en bas à droite ouvre l'écran Publier pour ajouter ta propre actualité." },
        ],
      },
      {
        icone: "book",
        titre: "4. Épreuves",
        blocs: [
          { type: "p", texte: "Retrouve les anciens sujets d'examen et leurs corrigés, filtrables par année, filière, semestre et matière. Le contenu correspondant à ta promo apparaît en priorité. L'accès complet aux épreuves et à leurs corrections est réservé aux abonnés Sabi Pro." },
        ],
      },
      {
        icone: "home",
        titre: "5. Accueil",
        blocs: [
          { type: "p", texte: "Ton tableau de bord : message du matin, astuce du jour, niveau et points, raccourcis vers le Classement, les Membres, la Carte et la Boussole, ainsi que trois fonctionnalités mises en avant : MyScore, le Simulateur de moyenne et les Résumés de cours." },
          { type: "p", texte: "Tu y trouves aussi la mascotte Sabi (elle t'encourage, et s'inquiète si tu disparais plus de 3 jours), la Roue du jour et ton Carnet d'astuces." },
        ],
      },
      {
        icone: "map",
        titre: "6. Carte du campus",
        blocs: [
          { type: "p", texte: "Une carte interactive (GPS réel) du campus pour te repérer entre les bâtiments, les salles et les points de photocopie." },
        ],
      },
      {
        icone: "message-circle",
        titre: "7. Chat",
        blocs: [
          { type: "p", texte: "Un espace de discussion pour les astuces, les plans et l'entraide entre étudiants." },
        ],
      },
      {
        icone: "user",
        titre: "8. Profil et fonctionnalités secondaires",
        blocs: [
          { type: "p", texte: "L'icône de profil en haut à droite ouvre ton espace personnel : pseudo, points, badges, abonnement, et un accès à toutes les fonctionnalités secondaires, regroupées par thème :" },
          { type: "sous-titre", texte: "Académique" },
          { type: "list", items: [
            "MyScore : consulte tes notes dès qu'elles sont publiées, et exporte-les en PDF",
            "Résumés de cours : fiches réservées aux abonnés Pro+",
            "Simulateur de moyenne : calcule la note qu'il te faut à l'examen pour valider ton semestre",
          ]},
          { type: "sous-titre", texte: "Accompagnement" },
          { type: "list", items: [
            "Coach Réussite : mentor IA réservé aux abonnés Pro+, avec diagnostic, plan de révision et quiz",
            "Boussole : parcours guidé des démarches administratives pour les nouveaux arrivants",
            "Assistance : écris directement au responsable de l'application",
          ]},
          { type: "sous-titre", texte: "Communauté" },
          { type: "list", items: [
            "Classement : top contributeurs de la semaine",
            "Boutique, VIP et Bounty : dépense tes points en badges, demande le statut VIP, ou lance/réponds à des primes (bounty) entre étudiants",
            "Membres inscrits : annuaire des étudiants par filière",
          ]},
          { type: "p", texte: "Chaque contribution utile (astuce, réponse, publication) rapporte des points, qui font progresser ton niveau : Nouveau, Junior de l'IUT, Ancien de l'IUT, puis Griot Suprême." },
        ],
      },
      {
        icone: "crown",
        titre: "9. Sabi Pro et Pro+",
        blocs: [
          { type: "p", texte: "Depuis la Boutique, deux formules au choix, en abonnement semestriel ou annuel :" },
          { type: "sous-titre", texte: "Sabi Pro" },
          { type: "list", items: [
            "Accès complet aux épreuves et corrections",
            "Badge Pro doré",
            "Recherche et filtres illimités",
          ]},
          { type: "sous-titre", texte: "Sabi Pro+" },
          { type: "list", items: [
            "Tous les avantages Pro",
            "Résumés de cours exclusifs",
            "Groupe WhatsApp d'entraide",
            "Badge Pro+ doré",
          ]},
          { type: "p", texte: "Le paiement se fait par Orange Money ou MTN MoMo. Suis les indications affichées sur l'écran de souscription : selon la configuration en place, l'activation est soit automatique après confirmation du paiement, soit manuelle après vérification par un administrateur (quelques heures)." },
        ],
      },
      {
        icone: "bot",
        titre: "10. Coach Réussite : pratique, focus et sauvetage",
        blocs: [
          { type: "p", texte: "Le Coach (réservé aux abonnés Pro+) se divise en trois blocs : Coach & Diagnostic, Pratique & Révision, et Focus Hub." },
          { type: "sous-titre", texte: "Pratique & Révision" },
          { type: "list", items: [
            "Mode Sauvetage : appuie sur « Lancer le plan de crise », le téléphone vibre, l'écran se teinte d'alerte et le plan de crise en 48 h s'affiche juste en dessous. Appuie sur « Terminer » pour couper le mode à tout moment.",
            "Quiz IA : 5 questions générées sur un résumé publié ou un sujet libre. Un score parfait compte dans ta progression et débloque le badge Sans faute.",
            "Quiz duel : après ton quiz, touche « Défier un ami » pour obtenir un code à 6 caractères à partager. Ton ami le saisit dans « Relever un duel » et vous comparez vos scores. Tes duels lancés apparaissent dans « Mes duels ».",
          ]},
          { type: "sous-titre", texte: "Focus Hub" },
          { type: "list", items: [
            "Choisis ta durée (15, 25, 45, 60 min ou la tienne, de 1 à 180 min), puis « Lancer ». Le bouton devient « Terminer » ; tu peux aussi mettre en pause.",
            "Pendant la session : vibration au départ, écran teinté, écran gardé allumé, et les bulles de Sabi sont mises en sourdine (elles reviennent à la fin). Pense à activer « Ne pas déranger » sur ton téléphone : Sabi ne peut pas bloquer les notifications des autres applications.",
            "Seules les minutes réellement travaillées sont comptées. Chaque jour de focus prolonge ta flamme de série.",
          ]},
        ],
      },
      {
        icone: "trophy",
        titre: "11. Jeux, badges et classements",
        blocs: [
          { type: "sous-titre", texte: "Classement" },
          { type: "list", items: [
            "Quiz : les meilleures réponses de la semaine, dans ta filière ou dans toute l'école. Seuls tes 5 premiers quiz de la journée comptent. Remise à zéro chaque semaine.",
            "Focus : les minutes de focus de la semaine, plus le défi entre filières.",
            "Défis : 3 objectifs hebdomadaires (2 h de focus, 10 bonnes réponses, un quiz parfait). Une fois atteints, touche « Réclamer » pour recevoir tes points.",
            "Contributions : les plus actifs de la semaine.",
          ]},
          { type: "sous-titre", texte: "Badges automatiques" },
          { type: "list", items: [
            "Marathonien : 2 h de focus dans la semaine.",
            "Sans faute : un quiz parfait.",
            "Lève-tôt : une session de focus (10 min minimum) lancée avant 7 h.",
            "Flamme 7 jours : 7 jours de focus d'affilée.",
            "Ils apparaissent verrouillés dans la Boutique et se débloquent tout seuls, avec des confettis.",
          ]},
          { type: "sous-titre", texte: "Petits plaisirs" },
          { type: "list", items: [
            "Roue du jour : un tour gratuit par jour depuis l'Accueil (de 0 à 10 points).",
            "Carnet d'astuces : touche le cœur sur une astuce (Accueil ou Focus Hub) pour la garder dans Mon carnet, consultable même hors ligne.",
            "Confettis, sons et vibrations à chaque réussite. Les sons se coupent dans le menu.",
          ]},
        ],
      },
      {
        icone: "wrench",
        titre: "12. Paramètres et assistance",
        blocs: [
          { type: "p", texte: "Le menu (les trois traits) en haut à gauche donne accès au mode clair/sombre, aux notifications, aux sons, à l'Assistance (message direct au responsable), au Guide d'utilisation et aux Crédits de l'application." },
          { type: "p", texte: "Sabi fonctionne aussi hors connexion : les dernières informations enregistrées sur ton appareil restent consultables, un bandeau te prévient quand tu es hors ligne. Une bannière peut te proposer d'installer l'application sur ton téléphone pour un accès plus rapide." },
        ],
      },
    ];
