// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


    // Utilise la visionneuse Google Docs pour afficher un PDF de façon fiable dans un <iframe>,
    // y compris sur Chrome mobile où l'affichage direct d'un PDF distant est souvent une page blanche.
    function versLienApercuPdf(url) {
      if (!url) return url;
      return "https://docs.google.com/viewer?url=" + encodeURIComponent(url) + "&embedded=true";
    }

    // Factory générique pour le stockage local — remplace les paires load*/save*
    // dupliquées. Chaque appel crée un store isolé pour une clé donnée, avec le
    // même comportement défensif (try/catch, valeur de repli) qu'avant.
    function createLocalStore(key, fallback) {
      return {
        load() {
          try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
          } catch {
            return fallback;
          }
        },
        save(value) {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch {}
        },
      };
    }

    // Le sens du vote de chacun reste privé — jamais envoyé à Firebase, jamais visible par personne
    const votesStore = createLocalStore("sabi-my-votes", {});
    export function loadMyVotes() { return votesStore.load(); }
    export function saveMyVotes(votes) { votesStore.save(votes); }

    // Progression de la Boussole — privée, jamais partagée
    const boussoleStore = createLocalStore("sabi-boussole-done", {});
    export function loadBoussoleProgress() { return boussoleStore.load(); }
    export function saveBoussoleProgress(progress) { boussoleStore.save(progress); }

    // Carnet d'astuces personnel — stocké sur l'appareil.
    const carnetStore = createLocalStore("sabi-carnet", []);
    export function chargerCarnet() { const v = carnetStore.load(); return Array.isArray(v) ? v : []; }
    export function basculerCarnet(texte) {
      const liste = chargerCarnet();
      const idx = liste.indexOf(texte);
      if (idx >= 0) liste.splice(idx, 1); else liste.unshift(texte);
      carnetStore.save(liste.slice(0, 100));
      return idx < 0; // true = ajoutée
    }

    // ===== Quiz duel : suivi des duels que j'ai lancés (codes mémorisés sur l'appareil) =====
    export const duelsStore = createLocalStore("sabi-mes-duels", []);
    export function chargerMesDuels() { const v = duelsStore.load(); return Array.isArray(v) ? v : []; }
