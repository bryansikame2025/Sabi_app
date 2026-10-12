# Sabi — projet React (Vite)

Le code de l'ancien `index.html` est maintenant découpé en fichiers dans `src/` :

| Dossier | Contenu |
|---|---|
| `src/main.js` | Point d'entrée (démarre React) |
| `src/App.js`, `src/SabiApp.js` | Application principale |
| `src/tabs/` | Un fichier par onglet (Épreuves, Résumés, Classement, Admin, Mentor…) |
| `src/components/` | Composants réutilisables (Icon, Guide, Login, Menu, PDF…) |
| `src/services/` | IA, e-mail, Cloudinary, Netlify |
| `src/lib/`, `src/data/`, `src/config/` | Fonctions utilitaires, données (CURRICULUM…), constantes |
| `src/firebase.js` | Connexion Firebase et références de la base |
| `src/styles/sabi.css` | Les styles |
| `public/` | Fichiers copiés tels quels (sw.js, manifest.json, logos, icônes) |
| `ancien/index.html` | Sauvegarde de l'ancienne version (un seul fichier) |

Les bibliothèques Firebase, EmailJS, Tailwind, marked, KaTeX et Leaflet restent chargées depuis `index.html`
(comme avant). Seul React vient de npm.

Construction : `npx vite build` (Netlify le fait automatiquement) → dossier `dist/`.
