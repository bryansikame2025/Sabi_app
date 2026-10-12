// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import { genererViaGeminiParts, genererViaRepliChat, imageUrlVersBase64, partieGeminiPourFichier, pdfUrlVersBase64 } from "./ia.js";

    // ========== FICHE DE RÉVISION + FLASHCARDS (IA) à partir d'une épreuve ==========
    // Même sources et mêmes relais de secours que le corrigé IA (texte, PDF ou photo du sujet).
    // Résultat gardé sur l'appareil (localStorage) : une épreuve n'est générée qu'une fois.
    export const LIMITE_REVISION_JOUR = 8; // nouvelles générations par appareil et par jour (protège le quota IA)

    export async function genererRevisionIA(sujetTexte, matiere, pdfUrl, imageUrl) {
      const texteSuffisant = (sujetTexte || "").trim().length >= 200;
      const parts = [];
      let mode, source;
      if (texteSuffisant) { mode = "texte"; source = "Voici le sujet :\n" + sujetTexte; }
      else if (pdfUrl) { mode = "pdf"; source = "Le sujet se trouve dans le PDF ci-joint. Lis-le en entier."; }
      else if (imageUrl) { mode = "photo"; source = "Le sujet se trouve sur la photo ci-jointe. Lis-la en entier, même si elle est un peu inclinée."; }
      else throw new Error("Aucun sujet exploitable (ni texte, ni PDF, ni photo) pour préparer une fiche.");

      const prompt = "Tu es un professeur d'IUT au Cameroun. À partir de l'épreuve de " + matiere + " ci-dessous, prépare la révision d'un étudiant sur les notions que cette épreuve fait travailler. " + source + "\n\n" +
        "Réponds EXACTEMENT avec ce format, sans rien avant ni après :\n" +
        "===FICHE===\n" +
        "Une fiche de révision en Markdown, concise (environ 40 lignes au maximum), avec les titres : ## Notions clés, ## Formules et définitions à retenir, ## Méthodes types (étapes numérotées), ## Pièges fréquents. Formules en LaTeX valide entre $ ou $$.\n" +
        "===CARTES===\n" +
        "10 à 12 flashcards sur les points essentiels. Pour chaque carte, exactement :\n" +
        "Q: une question courte\n" +
        "R: une réponse courte (1 à 3 phrases, formule en LaTeX si utile)\n" +
        "et une ligne contenant seulement --- entre deux cartes.\n" +
        "Si le sujet est illisible ou inexploitable, dis-le clairement dans la fiche au lieu d'inventer.";
      parts.push({ text: prompt });
      if (mode === "pdf") parts.push(await partieGeminiPourFichier(pdfUrl, "application/pdf"));
      if (mode === "photo") { for (const u of [].concat(imageUrl)) parts.push(await partieGeminiPourFichier(u, null)); }

      try {
        return await genererViaGeminiParts(parts, "fiche de révision");
      } catch (errGemini) {
        try {
          let b64 = null, mime = null;
          if (mode === "pdf") { b64 = await pdfUrlVersBase64(pdfUrl); mime = "application/pdf"; }
          else if (mode === "photo") { const img = await imageUrlVersBase64([].concat(imageUrl)[0]); b64 = img.base64; mime = img.mimeType; }
          return await genererViaRepliChat(mode, prompt, b64, mime, "sujet.pdf", "Sabi - Fiche de revision");
        } catch (errRepli) {
          throw new Error("L'IA est indisponible pour le moment. Réessaie dans quelques minutes.");
        }
      }
    }

    export function parserRevision(brut) {
      const t = String(brut || "");
      const iCartes = t.indexOf("===CARTES===");
      const fiche = (iCartes >= 0 ? t.slice(0, iCartes) : t).replace("===FICHE===", "").trim();
      const cartes = [];
      if (iCartes >= 0) {
        t.slice(iCartes + 12).split(/\n\s*-{3,}\s*\n/).forEach(bloc => {
          const m = bloc.match(/Q\s*:\s*([\s\S]*?)\n\s*R\s*:\s*([\s\S]*)/i);
          if (m && m[1].trim() && m[2].trim()) cartes.push({ q: m[1].trim(), r: m[2].trim().replace(/\n-{3,}\s*$/, "") });
        });
      }
      return { fiche, cartes };
    }
