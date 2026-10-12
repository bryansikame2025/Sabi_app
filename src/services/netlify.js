// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


    // ========== ADRESSE DU SITE NETLIFY ==========
    // À MODIFIER : remplace par l'adresse exacte de ton site Netlify (celle que tu vois
    // dans ton tableau de bord Netlify, ex: "https://sabi-iutfv.netlify.app").
    // Nécessaire pour l'app native (Android/iOS) qui n'a pas d'adresse de site "courante"
    // comme un navigateur — elle doit appeler l'adresse complète. Cette constante ne change
    // rien pour la version web : elle continue de fonctionner normalement.
    export const NETLIFY_BASE_URL = "https://sabi-iut-fv.netlify.app";

    // ========== NOTIFICATIONS PUSH ==========
    // Appelle la fonction serveur qui envoie une vraie notification (reçue même app fermée),
    // soit à un seul utilisateur (cibleUid), soit à tout le monde (diffusion: true).
    // "Best-effort" volontaire : un souci d'envoi ne doit jamais bloquer l'action principale
    // (envoyer un message, publier une épreuve...) — juste un avertissement en console.
    export async function envoyerNotification({ cibleUid, diffusion, titre, corps }) {
      try {
        await fetch(NETLIFY_BASE_URL + "/.netlify/functions/envoyer-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cibleUid, diffusion, titre, corps })
        });
      } catch (e) {
        console.warn("Notification non envoyée :", e.message || e);
      }
    }
