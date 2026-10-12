// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import { CorrigeRendu } from "../components/CorrigeRendu.js";
import { Icon } from "../components/Icon.js";
import { EmptyState } from "../components/MenuLateral.js";
import { PaywallSabiPro } from "../components/PaywallSabiPro.js";
import { PdfPreviewModal } from "../components/PdfViewer.js";
import { RecadreurImage } from "../components/RecadreurImage.js";
import { BoutonRevision } from "../components/Revision.js";
import { ANNEES, SEMESTRES, TYPES_EPREUVE } from "../config/constantes.js";
import { CURRICULUM, FILIERES, matieresFilantes } from "../data/curriculum.js";
import { semestreActuel } from "../lib/abonnements.js";
import { uploaderImageCloudinary, uploaderPdfCloudinary, validerTailleImageActu } from "../services/cloudinary.js";
import { messageErreurIAConvivial } from "../services/ia.js";
import { COLORS } from "../theme.js";

    export function EpreuvesTab({ epreuves, profil, setProfil, onAddEpreuve, onGenerateCorrigeIA, onClearCorrigeIA, isAdmin, isOwner, onDeleteEpreuve, onReplacePdf, onReplaceImage, abonnement, setTab }) {
      const acces = isOwner || isAdmin || abonnement === "pro" || abonnement === "proplus";
      const [showForm, setShowForm] = useState(false);
      const [expanded, setExpanded] = useState(null);
      const [matiere, setMatiere] = useState("");
      const [code, setCode] = useState("");
      const [annee, setAnnee] = useState(profil.annee || ANNEES[0]);
      const [anneeSujet, setAnneeSujet] = useState("");
      const [semestre, setSemestre] = useState(SEMESTRES[0]);
      const [type, setType] = useState(TYPES_EPREUVE[0]);
      const [filiereEpreuve, setFiliereEpreuve] = useState(profil.filiere || FILIERES[0]);
      const [contenu, setContenu] = useState("");
      const [corrige, setCorrige] = useState("");
      const [pdfFile, setPdfFile] = useState(null);
      const [imagesSujet, setImagesSujet] = useState([]); // [{ file, preview }] — plusieurs pages possibles
      const [imageSujetACadrer, setImageSujetACadrer] = useState(null); // fichier brut en attente de recadrage
      const [uploadPct, setUploadPct] = useState(null); // null = pas en cours
      const [uploadErreur, setUploadErreur] = useState("");
      const [previewUrl, setPreviewUrl] = useState(null);
      // Remplacement de la photo du sujet d'une épreuve déjà publiée (propriétaire uniquement)
      const [remplacerImageId, setRemplacerImageId] = useState(null);
      const [remplacerImagePct, setRemplacerImagePct] = useState(null);
      const [remplacerImageErreur, setRemplacerImageErreur] = useState("");
      const [imageACadrerRemplacement, setImageACadrerRemplacement] = useState(null); // { ep, file }
      const [iaLoading, setIaLoading] = useState(null); // id de l'épreuve en cours de génération
      const [iaErreur, setIaErreur] = useState(null);
      // Remplacement du PDF d'une épreuve déjà publiée (propriétaire uniquement)
      const [remplacerId, setRemplacerId] = useState(null);
      const [remplacerPct, setRemplacerPct] = useState(null);
      const [remplacerErreur, setRemplacerErreur] = useState("");
      // Sélecteurs de tri — réservés au propriétaire (année + filière, aucune restriction)
      // et à l'admin (année seulement, sa filière étant déjà fixée par les règles Firebase).
      const [filtreAnneeEp, setFiltreAnneeEp] = useState("Toutes");
      const [filtreFiliereEp, setFiltreFiliereEp] = useState("Toutes");
      // Filtre par type d'épreuve (Devoir / CC, Examen, TP noté) — visible pour tout le
      // monde (propriétaire, admin, étudiant), en plus des filtres année/filière ci-dessus.
      const [filtreTypeEp, setFiltreTypeEp] = useState("Toutes");
      // Filtre semestre pour l'accès rapide par matière (Semestre 1 / Semestre 2) — détermine
      // quelle liste de matières (CURRICULUM) est proposée dans le menu déroulant ci-dessous.
      // Initialisé sur le semestre en cours, mais modifiable manuellement.
      const [filtreSemestreEp, setFiltreSemestreEp] = useState(semestreActuel(Date.now()));
      // Accès rapide : choisir une matière filante (code officiel) pour tomber
      // directement sur son sujet PDF, sans parcourir toute la liste.
      const [matiereRapide, setMatiereRapide] = useState("");

      // Le fetch (SabiApp) scope déjà les épreuves reçues selon le rôle
      // (propriétaire : tout / admin : sa filière, toutes années / étudiant : sa promo) —
      // ici on applique en plus :
      // - le tri manuel (année + filière pour le propriétaire, année seule pour l'admin) ;
      // - le tri par type (CC/Examen/TP noté), pour tout le monde ;
      // - pour un étudiant Pro/Pro+ normal, la restriction au semestre EN COURS uniquement :
      //   son abonnement expire à la fin du semestre pour lequel il a payé, donc il ne doit
      //   jamais voir les épreuves de l'autre semestre sans payer à nouveau.
      const filtered = (isOwner
        ? epreuves.filter(e =>
            (filtreAnneeEp === "Toutes" || e.annee === filtreAnneeEp) &&
            (filtreFiliereEp === "Toutes" || e.filiere === filtreFiliereEp)
          )
        : isAdmin
        ? epreuves.filter(e => filtreAnneeEp === "Toutes" || e.annee === filtreAnneeEp)
        : epreuves.filter(e => e.semestre === semestreActuel(Date.now()))
      ).filter(e => filtreTypeEp === "Toutes" || e.type === filtreTypeEp);

      // Un admin (non-propriétaire) ne peut publier que pour SA filière, mais librement
      // pour n'importe quelle année (il a accès en lecture à toutes les années de sa filière).
      // Le propriétaire n'a aucune restriction, ni sur l'année ni sur la filière.
      const filiereVerrouillee = isAdmin && !isOwner;

      // Filière/année de référence pour l'accès rapide par matière : celles du tri choisi
      // par le propriétaire/admin, sinon celles du profil de l'étudiant.
      const filiereActive = isOwner
        ? (filtreFiliereEp !== "Toutes" ? filtreFiliereEp : (profil.filiere || FILIERES[0]))
        : (profil.filiere || FILIERES[0]);
      const anneeActive = filtreAnneeEp !== "Toutes" ? filtreAnneeEp : (profil.annee || ANNEES[0]);
      const filantes = matieresFilantes(filiereActive, anneeActive, filtreSemestreEp);

      const filteredParMatiere = matiereRapide ? filtered.filter(ep => ep.code === matiereRapide) : filtered;

      const allerVersMatiere = (codeChoisi) => {
        setMatiereRapide(codeChoisi);
        if (!codeChoisi) return;
        const trouvees = epreuves.filter(ep => ep.code === codeChoisi);
        const avecPdf = trouvees.find(ep => ep.pdfUrl);
        if (avecPdf) setPreviewUrl(avecPdf.pdfUrl);
        else if (trouvees.length > 0) setExpanded(trouvees[0].id);
      };

      // Changer de semestre change la liste des matières disponibles (filantes) —
      // on réinitialise donc la matière choisie pour éviter un code qui n'existe pas
      // dans le nouveau semestre.
      const changerSemestreEp = (s) => {
        setFiltreSemestreEp(s);
        setMatiereRapide("");
      };

      const resetForm = () => {
        setMatiere(""); setCode(""); setContenu(""); setCorrige(""); setPdfFile(null); setAnneeSujet("");
        setImagesSujet([]);
        setShowForm(false); setUploadPct(null); setUploadErreur("");
      };

      // Plusieurs photos d'un coup (pages d'une même épreuve). Une seule photo -> recadrage comme avant ;
      // plusieurs -> ajoutées telles quelles (5 Mo max chacune), l'ordre de sélection est conservé.
      const choisirImagesSujet = (liste) => {
        setUploadErreur("");
        const fichiers = Array.from(liste || []);
        if (!fichiers.length) return;
        for (const f of fichiers) {
          const err = validerTailleImageActu(f);
          if (err) { setUploadErreur(f.name + " : " + err); return; }
        }
        if (fichiers.length === 1) { setImageSujetACadrer(fichiers[0]); return; }
        setImagesSujet(prev => prev.concat(fichiers.map(f => ({ file: f, preview: URL.createObjectURL(f) }))));
      };
      const retirerImageSujet = (i) => setImagesSujet(prev => prev.filter((_, k) => k !== i));

      const onImageSujetRecadree = (fichierRecadre) => {
        setImageSujetACadrer(null);
        setImagesSujet(prev => prev.concat([{ file: fichierRecadre, preview: URL.createObjectURL(fichierRecadre) }]));
      };

      // Limite appliquée côté app avant même d'envoyer à Cloudinary — évite d'attendre l'échec du
      // serveur pour un fichier visiblement trop lourd. Vérifie que ton compte Cloudinary (plan
      // gratuit) accepte bien des fichiers "raw" jusqu'à cette taille : la limite réelle dépend de
      // ton préréglage d'upload (Settings > Upload > Upload presets) et de ton compte.
      const TAILLE_MAX_PDF = 100 * 1024 * 1024;
      const validerTaillePdf = (file) => {
        if (file.size > TAILLE_MAX_PDF) {
          return "Ce PDF fait " + (file.size / 1024 / 1024).toFixed(1) + " Mo, la limite est de 100 Mo. Essaie de le compresser (par ex. sur ilovepdf.com).";
        }
        return null;
      };

      const handleAdd = () => {
        setUploadErreur("");
        if (matiere.trim().length < 2) {
          setUploadErreur("Renseigne la matière (2 caractères minimum).");
          return;
        }
        if (contenu.trim().length < 10) {
          setUploadErreur("Décris le sujet en au moins 10 caractères (même bref), nécessaire même si tu joins un PDF.");
          return;
        }

        if (pdfFile) {
          const erreurTaille = validerTaillePdf(pdfFile);
          if (erreurTaille) { setUploadErreur(erreurTaille); return; }
        }

        const publier = (pdfUrl, imageUrls) => {
          const anneeAPublier = annee;
          const filiereAPublier = filiereVerrouillee ? (profil.filiere || filiereEpreuve) : filiereEpreuve;
          Promise.resolve(onAddEpreuve({ matiere: matiere.trim(), code: code.trim(), annee: anneeAPublier, anneeSujet: anneeSujet.trim(), semestre, type, filiere: filiereAPublier, contenu: contenu.trim(), corrige: corrige.trim(), pdfUrl: pdfUrl || null, imageUrl: (imageUrls && imageUrls[0]) || null, imagesUrls: imageUrls && imageUrls.length > 1 ? imageUrls : null }))
            .then(() => resetForm())
            .catch(err => {
              setUploadPct(null);
              setUploadErreur("Échec de la publication (les données ne sont pas enregistrées) : " + (err && err.message ? err.message : "vérifie ta connexion."));
            });
        };

        if (pdfFile || imagesSujet.length) {
          setUploadPct(0);
          (async () => {
            let pdfUrl = null;
            if (pdfFile) pdfUrl = await uploaderPdfCloudinary(pdfFile, setUploadPct);
            const urls = [];
            for (let i = 0; i < imagesSujet.length; i++) {
              urls.push(await uploaderImageCloudinary(imagesSujet[i].file, p => setUploadPct(Math.round((i * 100 + p) / imagesSujet.length))));
            }
            publier(pdfUrl, urls);
          })().catch(err => { setUploadPct(null); setUploadErreur("Échec de l'envoi : " + err.message); });
        } else {
          publier(null, []);
        }
      };

      // Remplace le PDF d'une épreuve déjà publiée sans toucher au reste (sujet, corrigé...)
      const handleRemplacerPdf = (ep, file) => {
        setRemplacerErreur("");
        const erreurTaille = validerTaillePdf(file);
        if (erreurTaille) { setRemplacerErreur(erreurTaille); return; }
        setRemplacerId(ep.id);
        setRemplacerPct(0);
        uploaderPdfCloudinary(file, setRemplacerPct)
          .then(url => {
            onReplacePdf(ep, url);
            setRemplacerId(null);
            setRemplacerPct(null);
          })
          .catch(err => {
            setRemplacerPct(null);
            setRemplacerErreur("Échec de l'envoi : " + err.message);
          });
      };

      // Remplace la photo du sujet d'une épreuve déjà publiée sans toucher au reste
      const handleRemplacerImage = (ep, file) => {
        setRemplacerImageErreur("");
        const erreurTaille = validerTailleImageActu(file);
        if (erreurTaille) { setRemplacerImageErreur(erreurTaille); return; }
        setImageACadrerRemplacement({ ep, file });
      };

      const onImageRemplacementRecadree = (fichierRecadre) => {
        const { ep } = imageACadrerRemplacement;
        setImageACadrerRemplacement(null);
        setRemplacerImageId(ep.id);
        setRemplacerImagePct(0);
        uploaderImageCloudinary(fichierRecadre, setRemplacerImagePct)
          .then(url => {
            onReplaceImage(ep, url);
            setRemplacerImageId(null);
            setRemplacerImagePct(null);
          })
          .catch(err => {
            setRemplacerImagePct(null);
            setRemplacerImageErreur("Échec de l'envoi : " + err.message);
          });
      };

      const CONTENU_MIN_POUR_IA = 200;
      const handleGenererIA = (ep) => {
        setIaErreur(null);
        const texteSuffisant = (ep.contenu || "").trim().length >= CONTENU_MIN_POUR_IA;
        if (!texteSuffisant && !ep.pdfUrl && !ep.imageUrl) {
          setIaErreur({ id: ep.id, message: "Le sujet renseigné est trop court (moins de " + CONTENU_MIN_POUR_IA + " caractères) et aucun PDF ni photo n'est joint, impossible de générer un corrigé fiable sans voir le vrai sujet." });
          return;
        }
        setIaLoading(ep.id);
        onGenerateCorrigeIA(ep)
          .catch(err => setIaErreur({ id: ep.id, message: messageErreurIAConvivial(err) }))
          .finally(() => setIaLoading(null));
      };

      if (!acces) {
        return React.createElement(PaywallSabiPro, { setTab: setTab, palierRequis: "pro" });
      }

      return React.createElement(React.Fragment, null,
        imageSujetACadrer && React.createElement(RecadreurImage, { file: imageSujetACadrer, onValider: onImageSujetRecadree, onAnnuler: () => setImageSujetACadrer(null) }),
        imageACadrerRemplacement && React.createElement(RecadreurImage, { file: imageACadrerRemplacement.file, onValider: onImageRemplacementRecadree, onAnnuler: () => setImageACadrerRemplacement(null) }),
        React.createElement("div", { className: "flex flex-col gap-4" },
        !isAdmin
          ? React.createElement("p", { className: "text-xs text-center py-3", style: { color: COLORS.textFaint } }, "Seuls les administrateurs désignés peuvent publier des épreuves.")
          : !showForm
          ? React.createElement("button", { onClick: () => setShowForm(true), className: "flex items-center justify-center gap-2 text-sm font-mono py-2.5 rounded-lg border border-dashed", style: { borderColor: COLORS.border, color: COLORS.textMuted } }, "+ Publier une ancienne épreuve")
          : React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              (() => {
                const referenceMatieres = CURRICULUM[profil.filiere]?.[annee]?.[semestre] || null;
                if (!referenceMatieres) {
                  return React.createElement("input", { value: matiere, onChange: e => setMatiere(e.target.value), placeholder: "Matière (ex: Algorithmique, Compta Générale...)", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } });
                }
                const toutesLesOptions = referenceMatieres.flatMap(u => [u.nom, ...(u.cours || []).map(c => c.nom)]);
                const estAutre = matiere !== "" && !toutesLesOptions.includes(matiere);
                return React.createElement(React.Fragment, null,
                  React.createElement("select", {
                    value: estAutre ? "__autre__" : matiere,
                    onChange: e => setMatiere(e.target.value === "__autre__" ? "" : e.target.value),
                    className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
                  },
                    React.createElement("option", { value: "" }, "Choisir une matière (" + profil.filiere + ")"),
                    referenceMatieres.map(u => React.createElement("optgroup", { key: u.code, label: u.code + ". " + u.nom },
                      (u.cours || []).map(c => React.createElement("option", { key: c.code, value: c.nom }, c.code + ". " + c.nom))
                    )),
                    React.createElement("option", { value: "__autre__" }, "Autre (saisie libre)")
                  ),
                  estAutre && React.createElement("input", {
                    value: matiere, onChange: e => setMatiere(e.target.value), placeholder: "Nom de la matière",
                    className: "w-full rounded-lg px-3 py-2 text-sm outline-none border mt-2", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
                  })
                );
              })(),
              React.createElement("input", { value: code, onChange: e => setCode(e.target.value), placeholder: "Code de l'épreuve (ex: INFO0301), optionnel", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("input", { value: anneeSujet, onChange: e => setAnneeSujet(e.target.value.replace(/[^0-9]/g, "").slice(0, 4)), inputMode: "numeric", placeholder: "Année du sujet (ex: 2024), optionnel", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border font-mono", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                React.createElement("select", { value: annee, onChange: e => setAnnee(e.target.value), className: "rounded-lg px-2 py-2 text-xs outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, ANNEES.map(a => React.createElement("option", { key: a }, a))),
                React.createElement("select", { value: semestre, onChange: e => setSemestre(e.target.value), className: "rounded-lg px-2 py-2 text-xs outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, SEMESTRES.map(s => React.createElement("option", { key: s }, s))),
                React.createElement("select", { value: type, onChange: e => setType(e.target.value), className: "rounded-lg px-2 py-2 text-xs outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, TYPES_EPREUVE.map(t => React.createElement("option", { key: t }, t)))
              ),
              React.createElement("div", null,
                React.createElement("label", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Filière concernée"),
                React.createElement("select", { value: filiereEpreuve, onChange: e => setFiliereEpreuve(e.target.value), disabled: filiereVerrouillee, className: "mt-1 w-full rounded-lg px-2 py-2 text-sm outline-none border disabled:opacity-50", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, FILIERES.map(f => React.createElement("option", { key: f }, f))),
                filiereVerrouillee && React.createElement("p", { className: "text-[10px] mt-1", style: { color: COLORS.textFaint } }, "En tant qu'admin, tu ne peux publier que pour ta propre filière, mais pour n'importe quelle année. Seul le propriétaire peut publier pour toutes les filières.")
              ),
              React.createElement("textarea", { value: contenu, onChange: e => setContenu(e.target.value), placeholder: "Recopie ou décris le sujet ici (questions, énoncé...)", rows: 4, className: "w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("textarea", { value: corrige, onChange: e => setCorrige(e.target.value), placeholder: "Corrigé ou piste de réponse (optionnel, très apprécié)", rows: 3, className: "w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("div", null,
                React.createElement("label", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "PDF du sujet (optionnel)"),
                React.createElement("input", {
                  type: "file",
                  accept: ".pdf,application/pdf",
                  onChange: e => {
                    const f = e.target.files[0] || null;
                    if (f) {
                      const erreur = validerTaillePdf(f);
                      if (erreur) { setUploadErreur(erreur); setPdfFile(null); return; }
                    }
                    setUploadErreur("");
                    setPdfFile(f);
                  },
                  disabled: uploadPct !== null,
                  className: "mt-1 w-full text-xs",
                  style: { color: COLORS.textMuted }
                }),
                pdfFile && uploadPct === null && React.createElement("p", { className: "text-[11px] mt-1 flex items-center gap-1", style: { color: COLORS.forestText } }, React.createElement(Icon,{name:"check",size:11}), " " + pdfFile.name + " prêt à être envoyé"),
                uploadPct !== null && React.createElement("div", { className: "mt-2" },
                  React.createElement("div", { className: "w-full h-1.5 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
                    React.createElement("div", { className: "h-full rounded-full transition-all", style: { width: uploadPct + "%", backgroundColor: COLORS.gold } })
                  ),
                  React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.textMuted } }, "Envoi du PDF... " + uploadPct + "%")
                ),
                uploadErreur && React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.terraText } }, uploadErreur)
              ),
              React.createElement("div", null,
                React.createElement("label", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Photos du sujet (optionnel), plusieurs pages possibles"),
                React.createElement("input", {
                  type: "file",
                  // Plusieurs types listés (et pas seulement "image/*") : certaines WebView Android
                  // (appli installée) ouvrent sinon un sélecteur photo limité à UN seul choix.
                  accept: "image/jpeg,image/png,image/webp,image/heic,image/*",
                  multiple: true,
                  onChange: e => { choisirImagesSujet(e.target.files); e.target.value = ""; },
                  disabled: uploadPct !== null,
                  className: "mt-1 w-full text-xs",
                  style: { color: COLORS.textMuted }
                }),
                React.createElement("p", { className: "text-[10px] mt-1", style: { color: COLORS.textFaint } }, "Plusieurs pages : sélectionne-les d'un coup, ou ajoute-les une par une, chaque photo s'ajoute à la suite."),
                imagesSujet.length > 0 && React.createElement("div", { className: "grid grid-cols-3 gap-2 mt-2" },
                  imagesSujet.map((im, i) => React.createElement("div", { key: i, className: "relative" },
                    React.createElement("img", { src: im.preview, alt: "", className: "w-full rounded-lg object-cover", style: { height: 90 } }),
                    React.createElement("span", { className: "absolute bottom-1 left-1 text-[9px] font-mono px-1.5 rounded-full", style: { backgroundColor: COLORS.bg, color: COLORS.gold } }, "p." + (i + 1)),
                    uploadPct === null && React.createElement("button", {
                      onClick: () => retirerImageSujet(i),
                      className: "absolute top-1 right-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full",
                      style: { backgroundColor: COLORS.bg, color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" }
                    }, "×")
                  ))
                ),
                uploadPct !== null && imagesSujet.length > 0 && React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.textMuted } }, "Envoi en cours... " + uploadPct + "%")
              ),
              React.createElement("div", { className: "flex gap-2" },
                React.createElement("button", { onClick: handleAdd, disabled: uploadPct !== null, className: "flex-1 rounded-lg py-2 text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, uploadPct !== null ? "Envoi en cours..." : "Publier · +15 points"),
                React.createElement("button", { onClick: resetForm, disabled: uploadPct !== null, className: "px-4 rounded-lg py-2 text-sm disabled:opacity-40", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
              )
            ),
        isOwner && React.createElement("div", { className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Trier, toutes années, toutes filières"),
          React.createElement("div", { className: "grid grid-cols-2 gap-2" },
            React.createElement("select", {
              value: filtreAnneeEp,
              onChange: e => setFiltreAnneeEp(e.target.value),
              className: "rounded-lg px-2 py-1.5 text-sm outline-none border",
              style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
            }, ["Toutes", ...ANNEES].map(a => React.createElement("option", { key: a }, a))),
            React.createElement("select", {
              value: filtreFiliereEp,
              onChange: e => setFiltreFiliereEp(e.target.value),
              className: "rounded-lg px-2 py-1.5 text-sm outline-none border",
              style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
            }, ["Toutes", ...FILIERES].map(f => React.createElement("option", { key: f }, f)))
          )
        ),

        (isAdmin && !isOwner) && React.createElement("div", { className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Trier par année, filière : " + (profil.filiere || "-")),
          React.createElement("select", {
            value: filtreAnneeEp,
            onChange: e => setFiltreAnneeEp(e.target.value),
            className: "w-full rounded-lg px-2 py-1.5 text-sm outline-none border",
            style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
          }, ["Toutes", ...ANNEES].map(a => React.createElement("option", { key: a }, a)))
        ),

        (!isOwner && !isAdmin) && React.createElement("div", { className: "rounded-lg border p-3 flex items-center gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement(Icon, { name: "map-pin", size: 14, color: COLORS.textMuted }),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, "Épreuves de ta promo. " + (profil.annee || "-") + " · " + (profil.filiere || "-") + " · " + semestreActuel(Date.now()))
        ),

        React.createElement("div", { className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Trier par type d'épreuve"),
          React.createElement("select", {
            value: filtreTypeEp,
            onChange: e => setFiltreTypeEp(e.target.value),
            className: "w-full rounded-lg px-2 py-1.5 text-sm outline-none border",
            style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
          }, ["Toutes", ...TYPES_EPREUVE].map(t => React.createElement("option", { key: t }, t)))
        ),

        (matieresFilantes(filiereActive, anneeActive, "Semestre 1").length > 0 ||
         matieresFilantes(filiereActive, anneeActive, "Semestre 2").length > 0) &&
        React.createElement("div", { className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Accès rapide. " + filiereActive),
          React.createElement("select", {
            value: filtreSemestreEp,
            onChange: e => changerSemestreEp(e.target.value),
            className: "w-full rounded-lg px-2 py-1.5 text-sm outline-none border",
            style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
          }, ["Semestre 1", "Semestre 2"].map(s => React.createElement("option", { key: s }, s))),
          React.createElement("select", {
            value: matiereRapide,
            onChange: e => allerVersMatiere(e.target.value),
            className: "w-full rounded-lg px-2 py-2 text-sm outline-none border",
            style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
          },
            React.createElement("option", { value: "" }, "Choisir une matière"),
            [...filantes].sort((a, b) => a.nom.localeCompare(b.nom)).map(f => React.createElement("option", { key: f.code, value: f.code }, f.nom))
          ),
          filantes.length === 0 && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Aucune matière renseignée pour ce semestre pour le moment."),
          matiereRapide && filteredParMatiere.length === 0 && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Aucune épreuve n'est disponible pour le moment."),
          matiereRapide && React.createElement("button", { onClick: () => allerVersMatiere(""), className: "self-start text-[10px] font-mono uppercase", style: { color: COLORS.gold } }, "Réinitialiser")
        ),

        React.createElement("div", { className: "flex flex-col gap-3 sabi-liste-animee" },
          filteredParMatiere.length === 0
            ? React.createElement(EmptyState, { icon: "book", text: matiereRapide ? "Aucune épreuve pour cette matière." : "Aucune épreuve pour l'instant. Si tu es un ancien, sois le premier à en publier une." })
            : filteredParMatiere.map((ep, idx) => {
                const isOpen = expanded === ep.id;
                const accent = [COLORS.forest, COLORS.terra, COLORS.gold][idx % 3];
                return React.createElement("div", { key: ep.id, className: "rounded-lg overflow-hidden border relative", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, borderLeftWidth: 4, borderLeftColor: accent } },
                  isOwner && React.createElement("button", {
                    onClick: (e) => { e.stopPropagation(); if (confirm("Supprimer définitivement cette épreuve (" + ep.matiere + ") ?")) onDeleteEpreuve(ep); },
                    className: "absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full",
                    style: { color: COLORS.terraText, backgroundColor: "rgba(255,180,171,0.12)", border: "1px solid rgba(255,180,171,0.4)" },
                    "aria-label": "Supprimer cette épreuve"
                  }, React.createElement(Icon, { name: "trash", size: 13 })),
                  React.createElement("button", {
                    onClick: () => setExpanded(isOpen ? null : ep.id),
                    className: "w-full text-left p-4" + (isOwner ? " pr-11" : "")
                  },
                    React.createElement("div", { className: "flex items-start justify-between gap-2" },
                      React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, ep.matiere),
                      React.createElement("span", { className: "text-[9px] font-mono uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 flex-shrink-0", style: { color: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.12)", border: `1px solid ${COLORS.gold}` } }, React.createElement(Icon, { name: "award", size: 10 }), "Pro")
                    ),
                    React.createElement("p", { className: "text-[11px] font-mono mt-0.5", style: { color: accent } }, (ep.code ? ep.code + " · " : "") + ep.annee + (ep.anneeSujet ? " · " + ep.anneeSujet : "")),
                    React.createElement("div", { className: "flex items-center gap-2 mt-2 flex-wrap" },
                      React.createElement("span", { className: "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: COLORS.textMuted, backgroundColor: COLORS.border } }, ep.semestre),
                      React.createElement("span", { className: "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: COLORS.textMuted, backgroundColor: COLORS.border } }, ep.type),
                      ep.filiere && React.createElement("span", { className: "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: COLORS.textMuted, backgroundColor: COLORS.border } }, ep.filiere)
                    ),
                    !isOpen && React.createElement("p", { className: "text-xs mt-2 leading-relaxed", style: { color: COLORS.textMuted, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" } }, ep.contenu)
                  ),
                  React.createElement("div", { className: "px-4 pb-4 flex items-center gap-2" },
                    ep.pdfUrl
                      ? React.createElement("button", {
                          onClick: (e) => { e.stopPropagation(); setPreviewUrl(ep.pdfUrl); },
                          className: "flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg border",
                          style: { borderColor: COLORS.border, color: COLORS.textMuted }
                        }, React.createElement(Icon, { name: "file-text", size: 13 }), "Sujet PDF")
                      : ep.imageUrl
                      ? React.createElement("button", {
                          onClick: () => setExpanded(isOpen ? null : ep.id),
                          className: "flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg border",
                          style: { borderColor: COLORS.border, color: COLORS.textMuted }
                        }, React.createElement(Icon, { name: "image", size: 13 }), isOpen ? "Réduire" : "Photo du sujet")
                      : React.createElement("button", {
                          onClick: () => setExpanded(isOpen ? null : ep.id),
                          className: "flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg border",
                          style: { borderColor: COLORS.border, color: COLORS.textMuted }
                        }, React.createElement(Icon, { name: "book", size: 13 }), isOpen ? "Réduire" : "Voir le sujet"),
                    ep.corrigeIA
                      ? React.createElement("button", {
                          onClick: () => setExpanded(isOpen ? null : ep.id),
                          className: "flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg",
                          style: { backgroundColor: "rgba(var(--accent-rgb),0.15)", color: COLORS.gold }
                        }, React.createElement(Icon, { name: "bot", size: 13 }), "Corrigé IA")
                      : React.createElement("button", {
                          onClick: () => handleGenererIA(ep),
                          disabled: iaLoading === ep.id,
                          className: "flex-1 flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg disabled:opacity-50",
                          style: { backgroundColor: COLORS.gold, color: COLORS.bg }
                        }, iaLoading === ep.id ? "Génération…" : React.createElement(React.Fragment, null, React.createElement(Icon, { name: "sparkles", size: 13 }), "Générer IA"))
                  ),
                  React.createElement(BoutonRevision, { ep: ep }),
                  iaLoading === ep.id && React.createElement("p", { className: "text-[11px] px-4 pb-3 flex items-center gap-1.5", style: { color: COLORS.textFaint } }, React.createElement(Icon, { name: "clock", size: 11 }), "Ça peut prendre 1 à 2 minutes pour un sujet complet à plusieurs exercices, reste sur la page."),
                  iaErreur && iaErreur.id === ep.id && React.createElement("p", { className: "text-[11px] px-4 pb-3", style: { color: COLORS.terraText } }, iaErreur.message),
                  isOpen && React.createElement("div", { className: "px-4 pb-4 border-t", style: { borderColor: COLORS.border } },
                    isOwner && React.createElement("label", {
                      className: "mt-3 inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full cursor-pointer",
                      style: { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }
                    },
                      remplacerId === ep.id && remplacerPct !== null ? "Envoi... " + remplacerPct + "%" : React.createElement(React.Fragment, null, React.createElement(Icon, { name: ep.pdfUrl ? "refresh-cw" : "file-text", size: 13 }), " " + (ep.pdfUrl ? "Remplacer le PDF" : "Ajouter un PDF")),
                      React.createElement("input", {
                        type: "file", accept: ".pdf,application/pdf", className: "hidden",
                        disabled: remplacerPct !== null,
                        onChange: e => { const f = e.target.files[0]; if (f) handleRemplacerPdf(ep, f); e.target.value = ""; }
                      })
                    ),
                    remplacerId === ep.id && remplacerErreur && React.createElement("p", { className: "text-[11px] mt-1.5", style: { color: COLORS.terraText } }, remplacerErreur),
                    isOwner && React.createElement("label", {
                      className: "mt-2 ml-2 inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-full cursor-pointer",
                      style: { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }
                    },
                      remplacerImageId === ep.id && remplacerImagePct !== null ? "Envoi... " + remplacerImagePct + "%" : React.createElement(React.Fragment, null, React.createElement(Icon, { name: ep.imageUrl ? "refresh-cw" : "image", size: 13 }), " " + (ep.imageUrl ? "Remplacer la photo" : "Ajouter une photo")),
                      React.createElement("input", {
                        type: "file", accept: "image/*", className: "hidden",
                        disabled: remplacerImagePct !== null,
                        onChange: e => { const f = e.target.files[0]; if (f) handleRemplacerImage(ep, f); e.target.value = ""; }
                      })
                    ),
                    remplacerImageId === ep.id && remplacerImageErreur && React.createElement("p", { className: "text-[11px] mt-1.5", style: { color: COLORS.terraText } }, remplacerImageErreur),
                    React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mt-3 mb-1", style: { color: COLORS.textMuted } }, "Sujet"),
                    React.createElement("p", { className: "text-sm whitespace-pre-wrap", style: { color: COLORS.text } }, ep.contenu),
                    (ep.imagesUrls && ep.imagesUrls.length ? ep.imagesUrls : (ep.imageUrl ? [ep.imageUrl] : [])).map((u, i) => React.createElement("img", { key: i, src: u, alt: "Photo du sujet " + (i + 1), className: "w-full rounded-lg mt-2", style: { maxHeight: 420, objectFit: "contain", backgroundColor: COLORS.bg } })),
                    ep.corrige && React.createElement("div", null,
                      React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mt-3 mb-1", style: { color: COLORS.forestText } }, "Corrigé"),
                      React.createElement(CorrigeRendu, { texte: ep.corrige })
                    ),
                    ep.corrigeIA && React.createElement("div", { className: "mt-3" },
                      React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mb-1 flex items-center gap-1", style: { color: COLORS.gold } }, React.createElement(Icon, {name:"bot", size:11}), " Corrigé IA"),
                      React.createElement(CorrigeRendu, { texte: ep.corrigeIA }),
                      isOwner && React.createElement("button", {
                        onClick: () => onClearCorrigeIA(ep),
                        className: "mt-2 text-[11px] font-mono flex items-center gap-1",
                        style: { color: COLORS.textMuted }
                      }, React.createElement(Icon, {name:"refresh-cw", size:11}), " Effacer et permettre une régénération")
                    ),
                    React.createElement("div", { className: "flex items-center justify-between mt-3" },
                      React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Publié par " + ep.auteur)
                    )
                  )
                );
              })
        ),

        previewUrl && React.createElement(PdfPreviewModal, { rawUrl: previewUrl, onClose: () => setPreviewUrl(null) })
        )
      );
    }
