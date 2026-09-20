# Activer les notifications push natives

Une seule étape manuelle à faire une fois, depuis ton téléphone, sur console.firebase.google.com :

1. Ouvre ton projet Firebase existant (celui de Sabi — `sabi-41823`).
2. En haut à gauche, à côté de "Vue d'ensemble du projet" → l'icône ⚙️ → **Paramètres du projet**.
3. Descends jusqu'à **"Vos applications"** → **Ajouter une application** → choisis l'icône **Android**.
4. Dans **"Nom du package Android"**, tape exactement :
   ```
   com.sabi.app
   ```
5. Le surnom de l'app (optionnel) : "Sabi Android". Pas besoin de la clé SHA-1 pour l'instant — passe à l'étape suivante.
6. Firebase te propose de **télécharger `google-services.json`** — télécharge-le.
7. Reviens sur GitHub, dépôt `Sabi_app` → **Add file → Upload files** → sélectionne ce fichier `google-services.json` → il doit atterrir **à la racine du dépôt** (pas dans un sous-dossier) → **Commit changes**.
8. Relance le workflow.

C'est tout — pas besoin de suivre les étapes 4 à 6 proposées ensuite par Firebase ("ajouter le SDK" etc.), le workflow GitHub Actions s'en charge automatiquement.

## Côté serveur (site Netlify)

Le fichier `envoyer-notification.js` doit être ajouté dans `netlify/functions/` sur **l'autre dépôt**, celui connecté à Netlify (pas celui-ci) — il réutilise les mêmes variables d'environnement Firebase déjà en place pour `verifier-paiement.js` (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`, `FIREBASE_DB_URL`), rien de plus à configurer côté Netlify.
