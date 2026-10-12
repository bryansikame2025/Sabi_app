// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import { CURRICULUM } from "../data/curriculum.js";
import { NETLIFY_BASE_URL } from "./netlify.js";

    // ========== GEMINI (Corrigé IA) ==========
    // La clé secrète ne vit plus ici : elle est lue côté serveur (Environment variable Netlify
    // GEMINI_API_KEY), uniquement par /.netlify/functions/gemini. Le navigateur envoie sa requête
    // à cette fonction, qui ajoute la clé et relaie vers l'API Gemini — la clé n'apparaît jamais
    // dans le code téléchargé par le navigateur (clic droit → "Afficher le code source" ne la
    // montrera plus).
    const GEMINI_URL = NETLIFY_BASE_URL + "/.netlify/functions/gemini";

    // Convertit une URL de PDF en base64 pour l'envoyer à Gemini en pièce jointe.
    // Utilisé uniquement quand le texte du sujet est trop court pour être fiable seul.
    // Limite dure de 6 Mo par requête imposée par Netlify Functions (infrastructure AWS Lambda,
    // non modifiable même en payant) — le base64 alourdit déjà le fichier de ~33%, d'où une marge
    // de sécurité à 4 Mo. Avant le passage par ce relais serveur (pour cacher GEMINI_API_KEY),
    // Gemini était appelé direct depuis le navigateur et cette limite n'existait pas — c'est ce
    // qui casse silencieusement le traitement des PDF/photos un peu lourds depuis la migration.
    const LIMITE_FICHIER_IA = 4 * 1024 * 1024; // repli inline (Netlify Functions) uniquement
    // Limite générale pour générer un corrigé / résumé : 20 Mo, via l'API File de Gemini (Edge
    // Function, sans la limite de 6 Mo des Functions classiques). Au-delà, on refuse d'emblée
    // avec un message clair plutôt que de laisser l'upload échouer en cours de route.
    const LIMITE_FICHIER_IA_MAX = 20 * 1024 * 1024;
    function verifierTailleAvantEnvoiIA(blob, typeLabel) {
      if (blob.size > LIMITE_FICHIER_IA) {
        const tailleMo = (blob.size / (1024 * 1024)).toFixed(1);
        throw new Error(typeLabel + " trop volumineux (" + tailleMo + " Mo) pour être envoyé à l'IA, limite d'environ 4 Mo en mode de secours. Réessaie dans quelques minutes.");
      }
    }

    // Réduit une photo à une taille raisonnable avant envoi à l'IA (voir LIMITE_FICHIER_IA
    // ci-dessus) — une photo de téléphone brute (souvent 3-8 Mo) dépasse vite la limite ;
    // redimensionnée à 1600px de large max et recompressée en JPEG qualité 0.75, elle reste
    // largement lisible pour l'IA tout en tenant confortablement sous le seuil.
    async function redimensionnerImagePourIA(blob) {
      const bitmap = await createImageBitmap(blob).catch(() => null);
      if (!bitmap) return blob; // navigateur sans support createImageBitmap : tenté tel quel
      const LARGEUR_MAX = 1600;
      const ratio = Math.min(1, LARGEUR_MAX / bitmap.width);
      const largeur = Math.round(bitmap.width * ratio);
      const hauteur = Math.round(bitmap.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = largeur; canvas.height = hauteur;
      canvas.getContext("2d").drawImage(bitmap, 0, 0, largeur, hauteur);
      const recompresse = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", 0.75));
      return recompresse || blob;
    }

    export async function pdfUrlVersBase64(pdfUrl) {
      const res = await fetch(pdfUrl);
      if (!res.ok) throw new Error("Impossible de récupérer le PDF (HTTP " + res.status + ").");
      const blob = await res.blob();
      verifierTailleAvantEnvoiIA(blob, "Le PDF");
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]); // retire le préfixe data:...;base64,
        reader.onerror = () => reject(new Error("Échec de lecture du PDF."));
        reader.readAsDataURL(blob);
      });
    }

    // Convertit une URL d'image en base64, pour l'envoyer à Gemini Vision en pièce jointe —
    // utilisé quand une épreuve n'a qu'une photo du sujet (pas de PDF) et un texte trop court.
    export async function imageUrlVersBase64(imageUrl) {
      const res = await fetch(imageUrl);
      if (!res.ok) throw new Error("Impossible de récupérer la photo (HTTP " + res.status + ").");
      let blob = await res.blob();
      blob = await redimensionnerImagePourIA(blob);
      verifierTailleAvantEnvoiIA(blob, "La photo");
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.onerror = () => reject(new Error("Échec de lecture de la photo."));
        reader.readAsDataURL(blob);
      });
      return { base64, mimeType: blob.type || "image/jpeg" };
    }

    const GEMINI_FICHIER_URL = NETLIFY_BASE_URL + "/api/gemini-fichier"; // Edge Function — pas de limite de 6 Mo (contrairement aux Functions classiques)

    // Envoie un fichier (PDF ou photo, SANS redimensionnement/cap — c'est tout l'intérêt) à l'API
    // File de Gemini via l'Edge Function dédiée, qui relaie les octets en flux continu sans jamais
    // les charger entièrement en mémoire côté serveur. Retourne { uri, mimeType } à référencer via
    // "file_data" plutôt que "inline_data" — la requête de génération elle-même reste minuscule
    // quelle que soit la taille du fichier d'origine, puisqu'elle ne transporte plus le fichier.
    async function uploaderFichierVersGeminiFileAPI(blob, mimeType) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000); // gros fichiers / connexion lente
      let response;
      try {
        response = await fetch(GEMINI_FICHIER_URL, {
          method: "POST",
          headers: { "Content-Type": mimeType },
          body: blob,
          signal: controller.signal
        });
      } catch (err) {
        if (err.name === "AbortError") throw new Error("Upload du fichier vers Gemini trop long.");
        throw new Error("Upload du fichier vers Gemini impossible : " + (err.message || "cause inconnue"));
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || ("Erreur HTTP " + response.status));
      }
      const data = await response.json();
      if (!data?.uri) throw new Error("Réponse d'upload Gemini invalide.");
      return { uri: data.uri, mimeType: data.mimeType || mimeType };
    }

    // Construit la "part" Gemini pour un PDF/photo d'épreuve : tente d'abord l'upload via l'API
    // File (voir ci-dessus) — aucune limite de taille pratique. Si l'Edge Function est
    // indisponible ou refuse (pas encore déployée, panne...), repli sur l'ancien envoi inline en
    // base64, borné à 4 Mo (voir pdfUrlVersBase64/imageUrlVersBase64 — chacun refait son propre
    // fetch(url), pas grave de re-télécharger le fichier une 2e fois dans ce cas rare).
    export async function partieGeminiPourFichier(url, mimeTypePdf) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Impossible de récupérer le fichier (HTTP " + res.status + ").");
        const blobBrut = await res.blob();
        if (blobBrut.size > LIMITE_FICHIER_IA_MAX) {
          const e = new Error("Ce fichier fait " + (blobBrut.size / (1024 * 1024)).toFixed(1) + " Mo, la génération IA est limitée à 20 Mo. Utilise un fichier plus léger.");
          e.tropVolumineux = true;
          throw e;
        }
        const mimeType = mimeTypePdf || blobBrut.type || "image/jpeg";
        const { uri, mimeType: mimeTypeFinal } = await uploaderFichierVersGeminiFileAPI(blobBrut, mimeType);
        return { file_data: { mime_type: mimeTypeFinal, file_uri: uri } };
      } catch (errUpload) {
        if (errUpload.tropVolumineux) throw errUpload;
        if (mimeTypePdf === "application/pdf") {
          const base64 = await pdfUrlVersBase64(url);
          return { inline_data: { mime_type: "application/pdf", data: base64 } };
        }
        const img = await imageUrlVersBase64(url);
        return { inline_data: { mime_type: img.mimeType, data: img.base64 } };
      }
    }

    // Réessaie automatiquement un appel Gemini en cas de surcharge temporaire du modèle
    // ("This model is currently experiencing high demand" / HTTP 503 / 429) — ces pannes sont
    // presque toujours passagères, 1 à 2 nouvelles tentatives avec un court délai suffisent dans
    // la grande majorité des cas, plutôt que de faire échouer la génération dès le premier essai.
    async function fetchGeminiAvecRetry(url, body, timeoutMs, tentatives) {
      tentatives = tentatives || 3;
      for (let essai = 1; essai <= tentatives; essai++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.ok) return response;
          const surchargee = response.status === 503 || response.status === 429;
          if (!surchargee || essai === tentatives) return response;
        } catch (err) {
          clearTimeout(timeoutId);
          if (err.name === "AbortError") throw err; // timeout déjà généreux : inutile de réessayer
          if (essai === tentatives) throw err;
        }
        await new Promise(r => setTimeout(r, 1500 * essai)); // 1.5s, puis 3s avant le dernier essai
      }
    }

    // Appelle Gemini pour générer un corrigé à partir du sujet d'une épreuve.
    // Si sujetTexte est trop court, on essaie d'abord le pdfUrl, puis à défaut l'imageUrl
    // (photo du sujet) — Gemini 2.0 Flash lit nativement les documents et les images —
    // plutôt que de se fier à une description incomplète — évite les hallucinations sur un
    // énoncé qu'on n'a pas vu.
    // Retourne une Promise qui résout le texte du corrigé, ou rejette avec un message d'erreur clair.
    export async function genererCorrigeIA(sujetTexte, matiere, pdfUrl, imageUrl) {
      const texteSuffisant = (sujetTexte || "").trim().length >= 200;
      const parts = [];
      let mode, prompt;

      if (texteSuffisant) {
        mode = "texte";
        prompt = "Tu es un professeur d'IUT au Cameroun. Voici un sujet d'épreuve de " + matiere +
          " destiné à des étudiants. Rédige un corrigé complet, clair, structuré et pédagogique, en traitant " +
          "TOUS les exercices et TOUTES les questions du sujet sans exception, avec les étapes de raisonnement " +
          "quand c'est pertinent. Pour les formules mathématiques, utilise du LaTeX valide entre $ ou $$ " +
          "(ex: $u_{n+1}$, $$\\int_2^{+\\infty} \\frac{dx}{x}$$), en échappant bien les accolades après \\left " +
          "et \\right (ex: \\left\\{ ... \\right\\}, jamais \\left{ sans le backslash). Ne rajoute pas de " +
          "politesse ni d'introduction inutile, va directement au corrigé.\n\nSujet :\n" + sujetTexte;
        parts.push({ text: prompt });
      } else if (pdfUrl) {
        mode = "pdf";
        prompt = "Tu es un professeur d'IUT au Cameroun. Le sujet d'épreuve de " + matiere +
          " destiné à des étudiants se trouve dans le PDF ci-joint. Lis-le attentivement en entier, puis rédige " +
          "un corrigé complet, clair, structuré et pédagogique, en traitant TOUS les exercices et TOUTES les " +
          "questions du sujet sans exception, avec les étapes de raisonnement quand c'est pertinent. Pour les " +
          "formules mathématiques, utilise du LaTeX valide entre $ ou $$ (ex: $u_{n+1}$, " +
          "$$\\int_2^{+\\infty} \\frac{dx}{x}$$), en échappant bien les accolades après \\left et \\right " +
          "(ex: \\left\\{ ... \\right\\}, jamais \\left{ sans le backslash). Ne rajoute pas de politesse ni " +
          "d'introduction inutile, va directement au corrigé. Si le PDF est illisible ou ne contient pas " +
          "d'énoncé exploitable, dis-le clairement au lieu d'inventer un sujet.";
        parts.push({ text: prompt });
        parts.push(await partieGeminiPourFichier(pdfUrl, "application/pdf"));
      } else if (imageUrl) {
        mode = "photo";
        prompt = "Tu es un professeur d'IUT au Cameroun. Le sujet d'épreuve de " + matiere +
          " destiné à des étudiants se trouve sur la photo ci-jointe. Lis-la attentivement en entier, même si " +
          "l'écriture est manuscrite, la photo légèrement inclinée ou l'éclairage imparfait, puis rédige un " +
          "corrigé complet, clair, structuré et pédagogique, en traitant TOUS les exercices et TOUTES les " +
          "questions du sujet sans exception, avec les étapes de raisonnement quand c'est pertinent. Pour les " +
          "formules mathématiques, utilise du LaTeX valide entre $ ou $$ (ex: $u_{n+1}$, " +
          "$$\\int_2^{+\\infty} \\frac{dx}{x}$$), en échappant bien les accolades après \\left et \\right " +
          "(ex: \\left\\{ ... \\right\\}, jamais \\left{ sans le backslash). Ne rajoute pas de politesse ni " +
          "d'introduction inutile, va directement au corrigé. Si la photo est illisible ou ne contient pas " +
          "d'énoncé exploitable, dis-le clairement au lieu d'inventer un sujet.";
        parts.push({ text: prompt });
        for (const u of [].concat(imageUrl)) parts.push(await partieGeminiPourFichier(u, null));
      } else {
        throw new Error("Ni sujet texte suffisant, ni PDF, ni photo disponible pour générer un corrigé.");
      }

      // 1) Gemini d'abord (avec ses propres tentatives en cas de surcharge passagère).
      try {
        return await genererViaGeminiParts(parts, "corrigé");
      } catch (errGemini) {
        // 2) Gemini reste indisponible -> Groq puis OpenRouter prennent le relais (texte : Groq
        // d'abord, plus rapide ; PDF/photo : directement OpenRouter, seul à savoir les lire). Le
        // relais n'a pas accès à l'API File de Gemini : on repart du fichier en base64 (borné à
        // 4 Mo), calculé seulement ici, au moment où on en a vraiment besoin.
        try {
          let base64Repli = null, mimeTypeRepli = null;
          if (mode === "pdf") {
            base64Repli = await pdfUrlVersBase64(pdfUrl);
            mimeTypeRepli = "application/pdf";
          } else if (mode === "photo") {
            const img = await imageUrlVersBase64([].concat(imageUrl)[0]);
            base64Repli = img.base64; mimeTypeRepli = img.mimeType;
          }
          return await genererViaRepliChat(mode, prompt, base64Repli, mimeTypeRepli, "sujet.pdf", "Sabi - Corrige IA");
        } catch (errRepli) {
          throw new Error("Gemini, OpenAI, Groq et OpenRouter sont tous indisponibles pour le moment. Réessaie dans quelques minutes. (" + errRepli.message + ")");
        }
      }
    }

    // Génère un résumé de cours (fiche de révision) à partir d'un contenu déjà saisi et/ou
    // d'un PDF joint — même mécanique que genererCorrigeIA (cache Firebase, quota préservé).
    // Appelle Gemini avec des `parts` déjà prêtes (texte + éventuel PDF/image inline) et renvoie
    // le texte généré. Factorisé pour être réutilisé par corrigé et résumé.
    // Un seul appel à Gemini, sans gestion de la coupure — utilisé en interne par
    // genererViaGeminiParts ci-dessous (boucle de reprise automatique).
    async function appellerGeminiUneFois(contenus) {
      let response;
      try {
        response = await fetchGeminiAvecRetry(GEMINI_URL, {
          contents: contenus,
          // maxOutputTokens à 8192 coupait net les sujets à plusieurs exercices avant la fin
          // (d'où l'impression d'exercices "sautés" ou de pages ignorées — en réalité Gemini
          // n'avait simplement plus de budget pour continuer). thinkingLevel "medium" (au lieu
          // de "low") pousse aussi à traiter chaque exercice plus rigoureusement plutôt que
          // superficiellement pour tenir dans un budget serré.
          generationConfig: { thinkingConfig: { thinkingLevel: "medium" }, maxOutputTokens: 100000 }
        }, 90000);
      } catch (err) {
        if (err.name === "AbortError") throw new Error("L'IA a mis trop de temps à répondre. Réessaie.");
        throw new Error("Impossible de contacter l'IA, vérifie ta connexion.");
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const surchargee = response.status === 503 || response.status === 429;
        throw new Error(surchargee
          ? "Gemini est très sollicité en ce moment."
          : (errData?.error?.message || ("Erreur HTTP " + response.status)));
      }
      const data = await response.json();
      const candidat = data?.candidates?.[0];
      const texte = candidat?.content?.parts?.[0]?.text;
      if (!texte) throw new Error("Réponse vide de l'IA.");
      return { texte, coupe: candidat?.finishReason === "MAX_TOKENS" };
    }

    // Flag de reprise : si la réponse s'arrête pile à la limite de tokens (sujet à beaucoup
    // d'exercices, fiche de révision très détaillée...), on relance automatiquement en renvoyant
    // tout l'historique (question d'origine + réponse partielle déjà reçue) et en demandant à
    // Gemini de reprendre exactement où il s'était arrêté, plutôt que d'infliger un corrigé
    // tronqué à l'utilisateur. Plafonné à 2 relances (3 appels au total) pour éviter une boucle
    // sans fin si le modèle n'arrive jamais à conclure.
    export async function genererViaGeminiParts(parts, nomPourErreurs) {
      let contenus = [{ role: "user", parts }];
      let texteComplet = "";
      const MAX_RELANCES = 2;

      for (let relance = 0; relance <= MAX_RELANCES; relance++) {
        const { texte, coupe } = await appellerGeminiUneFois(contenus);
        texteComplet += texte;

        if (!coupe) return texteComplet.trim();
        if (relance === MAX_RELANCES) {
          return texteComplet.trim() +
            "\n\n---\n*Le " + nomPourErreurs + " a été coupé même après plusieurs relances automatiques, relance la génération, ou demande la suite manuellement.*";
        }

        // Derniers mots de la réponse partielle, pour ancrer précisément la reprise.
        const derniersMots = texte.trim().split(/\s+/).slice(-8).join(" ");
        contenus = [
          ...contenus,
          { role: "model", parts: [{ text: texte }] },
          { role: "user", parts: [{ text: "Continue exactement à partir de : « " + derniersMots + " ». Ne répète rien de ce qui précède, enchaîne directement la suite sans réintroduction ni résumé de ce qui a déjà été dit." }] }
        ];
      }
    }

    // Quand Gemini est indisponible/surchargé, Groq puis OpenRouter prennent le relais :
    // - mode "texte" : Groq d'abord (le plus rapide), puis OpenRouter si Groq échoue aussi.
    // - mode "pdf"/"photo" : directement OpenRouter (type de contenu "file"/"image_url"), car le
    //   modèle configuré sur Groq (openai/gpt-oss-120b) ne lit ni PDF ni image.
    export async function genererViaRepliChat(mode, prompt, base64, mimeType, nomFichierPdf, titrePourEnTete) {
      const entetesOpenRouter = { "HTTP-Referer": window.location.origin, "X-Title": titrePourEnTete };
      const DELAI_FICHIER = 120000; // lire un PDF/photo et rédiger un corrigé complet est plus long qu'un simple chat

      if (mode === "texte") {
        const messages = [{ role: "user", content: prompt }];
        try {
          return await appellerChatIA("groq", GROQ_MODEL, messages);
        } catch (errGroq) {
          try {
            return await appellerChatIA("openai", OPENAI_MODEL, messages);
          } catch (errOpenAI) {
            try {
              return await appellerChatIA("openrouter", OPENROUTER_MODEL, messages, entetesOpenRouter);
            } catch (errOR) {
              return await appellerChatIA("huggingface", HUGGINGFACE_MODEL, messages);
            }
          }
        }
      }

      // mode "pdf"/"photo" : OpenAI d'abord (gpt-4o-mini lit nativement les PDF et les images via
      // le même format "file"/"image_url" en base64 que OpenRouter, sans exiger de solde minimum),
      // puis OpenRouter en dernier recours (il exige au moins 0,50 $ de crédit pour les fichiers).
      // Groq et Hugging Face ne sont pas branchés ici : leurs modèles configurés ne lisent ni
      // PDF ni image.
      let messages;
      if (mode === "pdf") {
        messages = [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "file", file: { filename: nomFichierPdf, file_data: "data:application/pdf;base64," + base64 } }
          ]
        }];
      } else { // mode === "photo"
        messages = [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: "data:" + mimeType + ";base64," + base64 } }
          ]
        }];
      }
      try {
        return await appellerChatIA("openai", OPENAI_MODEL, messages, undefined, DELAI_FICHIER);
      } catch (errOpenAI) {
        console.error("OpenAI (repli fichier) a échoué :", errOpenAI.message);
        try {
          return await appellerChatIA("openrouter", OPENROUTER_MODEL, messages, entetesOpenRouter, DELAI_FICHIER);
        } catch (errOR) {
          throw new Error("OpenAI : " + errOpenAI.message + " | OpenRouter : " + errOR.message);
        }
      }
    }

    export async function genererResumeIA(contenuTexte, matiere, pdfUrl) {
      const texteSuffisant = (contenuTexte || "").trim().length >= 50;
      const parts = [];
      let mode, prompt;
      const consigne = "Rédige une fiche de révision claire, structurée (titres, sous-titres, puces), " +
        "qui synthétise les notions clés à retenir, les définitions importantes et les points souvent " +
        "demandés en examen. Pour les formules mathématiques, utilise du LaTeX valide entre $ ou $$ " +
        "(ex: $u_{n+1}$), en échappant bien les accolades après \\left et \\right. Ne rajoute pas de " +
        "politesse ni d'introduction inutile, va directement à la fiche.";

      if (texteSuffisant) {
        mode = "texte";
        prompt = "Tu es un professeur d'IUT au Cameroun. Voici des notes de cours de " + matiere +
          " destinées à des étudiants. " + consigne + "\n\nNotes :\n" + contenuTexte;
        parts.push({ text: prompt });
      } else if (pdfUrl) {
        mode = "pdf";
        prompt = "Tu es un professeur d'IUT au Cameroun. Le cours de " + matiere +
          " destiné à des étudiants se trouve dans le PDF ci-joint. Lis-le attentivement en entier. " + consigne +
          " Si le PDF est illisible, dis-le clairement au lieu d'inventer un contenu.";
        parts.push({ text: prompt });
        parts.push(await partieGeminiPourFichier(pdfUrl, "application/pdf"));
      } else {
        throw new Error("Ni contenu texte suffisant ni PDF disponible pour générer un résumé.");
      }

      try {
        return await genererViaGeminiParts(parts, "résumé");
      } catch (errGemini) {
        try {
          const base64Repli = mode === "pdf" ? await pdfUrlVersBase64(pdfUrl) : null;
          return await genererViaRepliChat(mode, prompt, base64Repli, null, "cours.pdf", "Sabi - Resume IA");
        } catch (errRepli) {
          throw new Error("Gemini, OpenAI, Groq et OpenRouter sont tous indisponibles pour le moment. Réessaie dans quelques minutes. (" + errRepli.message + ")");
        }
      }
    }


    // Traduit une erreur technique de génération IA (souvent un message de fournisseur, ex.
    // "This request requires at least $0.50 in balance for files") en un message compréhensible
    // pour un·e étudiant·e, qui n'a rien à voir avec un solde de compte fournisseur IA. Le détail
    // technique original reste dans la console (utile pour l'administrateur qui gère les clés API),
    // mais ne s'affiche plus jamais tel quel à l'écran de l'utilisateur.
    export function messageErreurIAConvivial(err) {
      const brut = (err && err.message) || "";
      console.error("Erreur génération IA :", brut);
      const b = brut.toLowerCase();
      if (b.includes("limitée à 20 mo")) return brut; // message déjà clair et destiné à l'étudiant
      if (b.includes("balance") || b.includes("credit") || b.includes("payment") || b.includes("402")) {
        return "Le service IA est momentanément à court de crédit côté serveur. L'administrateur a été prévenu implicitement, réessaie un peu plus tard.";
      }
      if (b.includes("trop de temps") || b.includes("timeout") || b.includes("abort")) {
        return "L'IA a mis trop de temps à répondre. Réessaie, ou réessaie avec une meilleure connexion.";
      }
      if (b.includes("connexion") || b.includes("réseau") || b.includes("network")) {
        return "Impossible de contacter l'IA, vérifie ta connexion internet puis réessaie.";
      }
      if (b.includes("tous indisponibles")) {
        return "Le service IA est surchargé pour le moment. Réessaie dans quelques minutes.";
      }
      return "La génération IA a échoué. Réessaie dans quelques instants.";
    }

    // ========== GROQ & OPENROUTER (Mentor / Diagnostic IA) ==========
    // Les clés secrètes ne sont plus dans ce fichier : elles vivent côté serveur, dans les
    // "Environment variables" du dashboard Netlify (GROQ_API_KEY, OPENROUTER_API_KEY), lues
    // uniquement par la fonction /.netlify/functions/chat-ia. Le navigateur ne voit jamais
    // les clés — seul ce nom de provider ("groq"/"openrouter") transite côté client.
    const GROQ_MODEL = "openai/gpt-oss-120b"; // remplace llama-3.3-70b-versatile, retiré par Groq le 17/06/2026
    const OPENROUTER_MODEL = "openai/gpt-4o-mini"; // plus posé — utilisé pour l'analyse complète et le plan de crise
    // Repli supplémentaire si Groq ET OpenRouter échouent tous les deux (ex. panne réseau générale,
    // pas juste une clé manquante). Vérifie ces deux-là après tout ajout/renommage de modèle côté
    // fournisseur — surtout HUGGINGFACE_MODEL, jamais testé en conditions réelles au moment où j'écris ça.
    const HUGGINGFACE_MODEL = "meta-llama/Llama-3.3-70B-Instruct:novita"; // "id_modele:fournisseur", format Hugging Face Inference Providers
    const OPENAI_MODEL = "gpt-4o-mini"; // équivalent moderne et bon marché à gpt-3.5-turbo
    const CHAT_IA_URL = NETLIFY_BASE_URL + "/.netlify/functions/chat-ia";

    // Appel générique à une API compatible "OpenAI chat completions" via le relais serveur
    // /.netlify/functions/chat-ia — celui-ci choisit Groq ou OpenRouter selon `provider` et
    // ajoute la clé secrète correspondante, invisible du navigateur.
    // extraHeaders permet de transmettre les en-têtes demandés par OpenRouter (référent, titre de l'app).
    async function appellerChatIA(provider, model, messages, extraHeaders, timeoutMs) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs || 45000);
      let response;
      try {
        response = await fetch(CHAT_IA_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider: provider, model: model, messages: messages, extraHeaders: extraHeaders || {} }),
          signal: controller.signal
        });
      } catch (err) {
        if (err.name === "AbortError") throw new Error("L'IA a mis trop de temps à répondre. Réessaie.");
        throw new Error("Requête réseau échouée : " + (err.message || "cause inconnue"));
      } finally {
        clearTimeout(timeoutId);
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const msg = errData?.error?.message || ("Erreur HTTP " + response.status);
        throw new Error(msg);
      }
      const data = await response.json();
      const texte = data?.choices?.[0]?.message?.content;
      if (!texte) throw new Error("Réponse vide de l'IA.");
      return texte.trim();
    }

    // Convertit le format "messages" (system/user, façon OpenAI) en un unique prompt texte pour
    // Gemini — sert de dernier recours si Groq ET OpenRouter échouent tous les deux.
    async function appellerGeminiTexte(messages) {
      const prompt = messages.map(m => (m.role === "system" ? "[Instructions] " : "") + m.content).join("\n\n");
      let response;
      try {
        response = await fetchGeminiAvecRetry(GEMINI_URL, {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { thinkingConfig: { thinkingLevel: "low" }, maxOutputTokens: 2000 }
        }, 45000, 2); // 2 tentatives seulement ici : c'est déjà le 3ème repli (après Groq et OpenRouter)
      } catch (err) {
        throw new Error("Gemini injoignable : " + (err.message || "cause inconnue"));
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        const surchargee = response.status === 503 || response.status === 429;
        throw new Error(surchargee
          ? "Gemini est très sollicité en ce moment."
          : (errData?.error?.message || ("Erreur HTTP " + response.status)));
      }
      const data = await response.json();
      const texte = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!texte) throw new Error("Réponse vide de l'IA.");
      return texte.trim();
    }

    // Groq : réponses rapides — Actions Rapides + boîte "Diagnostic IA" (question libre).
    // Repli automatique sur OpenRouter, puis Hugging Face, puis OpenAI, puis Gemini si tout le
    // reste échoue — l'utilisateur ne voit une erreur que si les CINQ fournisseurs échouent.
    export async function appellerGroq(messages) {
      try {
        return await appellerChatIA("groq", GROQ_MODEL, messages);
      } catch (errGroq) {
        try {
          return await appellerChatIA("openrouter", OPENROUTER_MODEL, messages, {
            "HTTP-Referer": window.location.origin, "X-Title": "Sabi - Coach Reussite"
          });
        } catch (errOR) {
          try {
            return await appellerChatIA("huggingface", HUGGINGFACE_MODEL, messages);
          } catch (errHF) {
            try {
              return await appellerChatIA("openai", OPENAI_MODEL, messages);
            } catch (errOpenAI) {
              try {
                return await appellerGeminiTexte(messages);
              } catch (errGem) {
                throw new Error("Groq, OpenRouter, Hugging Face, OpenAI et Gemini sont tous indisponibles. Dernière cause : " + errGem.message);
              }
            }
          }
        }
      }
    }

    // OpenRouter : réponses plus posées — Démarrer l'Analyse (bilan complet) + Mode Sauvetage (plan de crise).
    // Même logique de repli, dans l'autre sens (OpenRouter -> Groq -> Hugging Face -> OpenAI -> Gemini).
    export async function appellerOpenRouter(messages) {
      try {
        return await appellerChatIA("openrouter", OPENROUTER_MODEL, messages, {
          "HTTP-Referer": window.location.origin, "X-Title": "Sabi - Coach Reussite"
        });
      } catch (errOR) {
        try {
          return await appellerChatIA("groq", GROQ_MODEL, messages);
        } catch (errGroq) {
          try {
            return await appellerChatIA("huggingface", HUGGINGFACE_MODEL, messages);
          } catch (errHF) {
            try {
              return await appellerChatIA("openai", OPENAI_MODEL, messages);
            } catch (errOpenAI) {
              try {
                return await appellerGeminiTexte(messages);
              } catch (errGem) {
                throw new Error("OpenRouter, Groq, Hugging Face, OpenAI et Gemini sont tous indisponibles. Dernière cause : " + errGem.message);
              }
            }
          }
        }
      }
    }

    export const MENTOR_SYSTEM_PROMPT = "Tu es le Coach Réussite de Sabi, un mentor académique pour les étudiants de " +
      "l'IUT FV Bandjoun au Cameroun (système LMD). Tu es direct, bienveillant et concret : pas de blabla, " +
      "des conseils actionnables, en français. Utilise des puces courtes plutôt que de longs paragraphes. " +
      "Tiens compte du contexte de l'étudiant (filière, année, notes) quand il est fourni.";

    // Convertit un fichier image (File) choisi par l'admin en base64, pour l'envoyer à Gemini Vision.
    function fichierImageVersBase64(fichier) {
      return (async () => {
        const blob = await redimensionnerImagePourIA(fichier);
        verifierTailleAvantEnvoiIA(blob, "L'image");
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result.split(",")[1]);
          reader.onerror = () => reject(new Error("Échec de lecture de l'image."));
          reader.readAsDataURL(blob);
        });
      })();
    }

    // Analyse la photo d'une feuille de notes affichée au babillard : détecte la matière et
    // extrait la liste [matricule, note]. Utilise Gemini Vision avec une sortie JSON strictement
    // structurée (responseSchema) pour éviter d'avoir à parser un texte libre imprévisible.
    // Retourne { matiere, dateDePublication, lignes: [{ matricule, note }] }.
    export async function extraireNotesDepuisPhoto(fichier) {
      const base64 = await fichierImageVersBase64(fichier);
      // Liste des matières déjà connues (toutes filières confondues) — sert de référence à l'IA pour
      // orthographier le nom de la matière comme sur le référentiel officiel, plutôt que de retranscrire
      // approximativement ce qu'il y a sur la photo (ex: "Analyse 1" au lieu de "Analyse I").
      const matieresConnues = Object.values(CURRICULUM).flatMap(parFiliere =>
        Object.values(parFiliere).flatMap(parAnnee => Object.values(parAnnee).flatMap(liste =>
          liste.flatMap(u => [u.nom, ...(u.cours || []).map(c => c.nom)])
        ))
      );
      const indiceMatieres = matieresConnues.length > 0
        ? " Si la matière correspond à l'une de ces matières connues, utilise exactement son orthographe officielle : " + matieresConnues.join(", ") + "."
        : "";
      const prompt = "Ce document (photo ou PDF, éventuellement sur plusieurs pages) contient une ou plusieurs feuilles de notes d'un IUT au Cameroun, parcours-le en entier, page par page si besoin. " +
        "Identifie le nom de la matière concernée (déduis-le du titre ou de l'en-tête si présent, sinon " +
        "mets une chaîne vide) et la date de publication si elle est visible (format JJ/MM/AAAA, sinon chaîne vide)." + indiceMatieres + " " +
        "Puis extrait CHAQUE ligne du tableau : le matricule de l'étudiant (tel qu'écrit, sans le modifier ni " +
        "le corriger) et sa note associée (nombre, généralement sur 20). Ignore les lignes d'en-tête. " +
        "Si une note est illisible ou absente pour un matricule, mets note à null plutôt que d'inventer une valeur.";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);
      let response;
      try {
        response = await fetch(GEMINI_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: fichier.type || "image/jpeg", data: base64 } }] }],
            generationConfig: {
              thinkingConfig: { thinkingLevel: "low" },
              maxOutputTokens: 4000,
              responseMimeType: "application/json",
              responseSchema: {
                type: "OBJECT",
                properties: {
                  matiere: { type: "STRING" },
                  dateDePublication: { type: "STRING" },
                  lignes: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: { matricule: { type: "STRING" }, note: { type: "NUMBER", nullable: true } },
                      required: ["matricule", "note"]
                    }
                  }
                },
                required: ["matiere", "lignes"]
              }
            }
          }),
          signal: controller.signal
        });
      } catch (err) {
        if (err.name === "AbortError") throw new Error("L'IA a mis trop de temps à analyser l'image (60s). Réessaie.");
        throw new Error("Impossible de contacter l'IA, vérifie ta connexion.");
      } finally {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        throw new Error(errData?.error?.message || ("Erreur HTTP " + response.status));
      }
      const data = await response.json();
      const brut = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!brut) throw new Error("Réponse vide de l'IA.");
      try {
        const resultat = JSON.parse(brut);
        if (!Array.isArray(resultat.lignes)) throw new Error();
        return resultat;
      } catch {
        throw new Error("L'IA n'a pas réussi à structurer la feuille de notes. Réessaie avec une photo plus nette.");
      }
    }
