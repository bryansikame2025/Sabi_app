// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import { CorrigeRendu } from "../components/CorrigeRendu.js";
import { Icon } from "../components/Icon.js";
import { EmptyState } from "../components/MenuLateral.js";
import { PaywallSabiPro } from "../components/PaywallSabiPro.js";
import { PdfPreviewModal } from "../components/PdfViewer.js";
import { ANNEES, SEMESTRES } from "../config/constantes.js";
import { FILIERES } from "../data/curriculum.js";
import { semestreActuel } from "../lib/abonnements.js";
import { uploaderPdfCloudinary } from "../services/cloudinary.js";
import { messageErreurIAConvivial } from "../services/ia.js";
import { COLORS } from "../theme.js";

    // Résumés de cours — contenu exclusif Sabi Pro+ (au-delà des épreuves, réservées à Pro)
    export function ResumesTab({ resumes, isAdmin, isOwner, abonnement, setTab, onAddResume, onDeleteResume, onGenerateResumeIA, onClearResumeIA }) {
      const acces = isOwner || isAdmin || abonnement === "proplus";
      const [showForm, setShowForm] = useState(false);
      const [expanded, setExpanded] = useState(null);
      const [matiere, setMatiere] = useState("");
      const [annee, setAnnee] = useState(ANNEES[0]);
      const [semestre, setSemestre] = useState(SEMESTRES[0]);
      const [filiere, setFiliere] = useState(FILIERES[0]);
      const [contenu, setContenu] = useState("");
      const [pdfFile, setPdfFile] = useState(null);
      const [uploadPct, setUploadPct] = useState(null);
      const [uploadErreur, setUploadErreur] = useState("");
      const [previewUrl, setPreviewUrl] = useState(null);
      const [iaLoading, setIaLoading] = useState(null); // id du résumé en cours de génération
      const [iaErreur, setIaErreur] = useState(null);
      // Filtres — même principe que l'onglet Épreuves : trier par année/filière, puis accès
      // rapide à une matière précise parmi celles réellement publiées (pas le programme complet,
      // seulement ce qui existe déjà comme résumé).
      const [filtreAnneeRes, setFiltreAnneeRes] = useState("Toutes");
      const [filtreFiliereRes, setFiltreFiliereRes] = useState("Toutes");
      const [filtreSemestreRes, setFiltreSemestreRes] = useState("Toutes");
      const [matiereRapideRes, setMatiereRapideRes] = useState("");

      if (!acces) return React.createElement(PaywallSabiPro, { setTab: setTab, palierRequis: "proplus" });

      // Même restriction que pour les épreuves (voir EpreuvesTab) : un étudiant Pro+ normal ne
      // voit que les résumés du semestre EN COURS. Son abonnement "semestre" expire à la fin de
      // celui pour lequel il a payé ; sans ce filtre, il pourrait consulter les résumés de
      // l'autre semestre pendant que son abonnement est encore valide pour le sien.
      const resumesVisibles = (isOwner || isAdmin) ? resumes : resumes.filter(r => r.semestre === semestreActuel(Date.now()));

      const resumesFiltres = resumesVisibles.filter(r =>
        (filtreAnneeRes === "Toutes" || r.annee === filtreAnneeRes) &&
        (filtreFiliereRes === "Toutes" || r.filiere === filtreFiliereRes) &&
        (filtreSemestreRes === "Toutes" || r.semestre === filtreSemestreRes) &&
        (!matiereRapideRes || r.matiere === matiereRapideRes)
      );
      const matieresDisponibles = [...new Set(
        resumesVisibles.filter(r => (filtreAnneeRes === "Toutes" || r.annee === filtreAnneeRes) && (filtreFiliereRes === "Toutes" || r.filiere === filtreFiliereRes) && (filtreSemestreRes === "Toutes" || r.semestre === filtreSemestreRes)).map(r => r.matiere)
      )].sort((a, b) => a.localeCompare(b));

      const CONTENU_MIN_POUR_IA_RESUME = 50;
      const handleGenererResumeIA = (r) => {
        setIaErreur(null);
        const texteSuffisant = (r.contenu || "").trim().length >= CONTENU_MIN_POUR_IA_RESUME;
        if (!texteSuffisant && !r.pdfUrl) {
          setIaErreur({ id: r.id, message: "Désolé, ce fichier ne dispose pas de résumé : pas assez de contenu et aucun PDF joint." });
          return;
        }
        setIaLoading(r.id);
        onGenerateResumeIA(r)
          .catch(err => setIaErreur({ id: r.id, message: "Désolé, ce fichier ne dispose pas de résumé pour l'instant : " + messageErreurIAConvivial(err) }))
          .finally(() => setIaLoading(null));
      };

      const handleAdd = () => {
        setUploadErreur("");
        if (matiere.trim().length < 2) {
          setUploadErreur("Renseigne la matière (2 caractères minimum).");
          return;
        }
        if (contenu.trim().length < 10) {
          setUploadErreur("Le contenu du résumé doit faire au moins 10 caractères.");
          return;
        }
        const publier = (pdfUrl) => {
          Promise.resolve(onAddResume({ matiere: matiere.trim(), annee, semestre, filiere, contenu: contenu.trim(), pdfUrl: pdfUrl || null }))
            .then(() => { setMatiere(""); setContenu(""); setPdfFile(null); setShowForm(false); setUploadPct(null); })
            .catch(err => {
              setUploadPct(null);
              setUploadErreur("Échec de la publication (les données ne sont pas enregistrées) : " + (err && err.message ? err.message : "vérifie ta connexion."));
            });
        };
        if (pdfFile) {
          if (pdfFile.size > 100 * 1024 * 1024) { setUploadErreur("PDF trop lourd (max 100 Mo)."); return; }
          setUploadPct(0);
          uploaderPdfCloudinary(pdfFile, setUploadPct).then(url => publier(url)).catch(err => { setUploadPct(null); setUploadErreur("Échec : " + err.message); });
        } else publier(null);
      };

      return React.createElement("div", { className: "flex flex-col gap-4" },
        React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Résumés de cours"),
        React.createElement("p", { className: "text-xs flex items-center gap-1.5", style: { color: COLORS.textFaint } }, React.createElement(Icon,{name:"gem",size:13}), " Exclusivité Sabi Pro+"),

        // Formulaire de publication — remonté en haut, avant la liste (plus visible, plus rapide
        // d'accès pour l'admin plutôt que de devoir descendre tout le fil).
        isAdmin && (
          !showForm
            ? React.createElement("button", { onClick: () => setShowForm(true), className: "flex items-center justify-center gap-2 text-sm font-mono py-2.5 rounded-lg border border-dashed", style: { borderColor: COLORS.border, color: COLORS.textMuted } }, "+ Publier un résumé")
            : React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
                React.createElement("input", { value: matiere, onChange: e => setMatiere(e.target.value), placeholder: "Matière", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
                React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                  React.createElement("select", { value: annee, onChange: e => setAnnee(e.target.value), className: "rounded-lg px-2 py-2 text-xs outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, ANNEES.map(a => React.createElement("option", { key: a }, a))),
                  React.createElement("select", { value: semestre, onChange: e => setSemestre(e.target.value), className: "rounded-lg px-2 py-2 text-xs outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, SEMESTRES.map(s => React.createElement("option", { key: s }, s))),
                  React.createElement("select", { value: filiere, onChange: e => setFiliere(e.target.value), className: "rounded-lg px-2 py-2 text-xs outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, FILIERES.map(f => React.createElement("option", { key: f }, f)))
                ),
                React.createElement("textarea", { value: contenu, onChange: e => setContenu(e.target.value), placeholder: "Contenu du résumé...", rows: 5, className: "w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
                React.createElement("input", { type: "file", accept: ".pdf,application/pdf", onChange: e => setPdfFile(e.target.files[0] || null), disabled: uploadPct !== null, className: "text-xs", style: { color: COLORS.textMuted } }),
                uploadPct !== null && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textMuted } }, "Envoi... " + uploadPct + "%"),
                uploadErreur && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textMuted } }, uploadErreur),
                React.createElement("div", { className: "flex gap-2" },
                  React.createElement("button", { onClick: handleAdd, disabled: uploadPct !== null, className: "flex-1 rounded-lg py-2 text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, "Publier"),
                  React.createElement("button", { onClick: () => setShowForm(false), className: "px-4 rounded-lg py-2 text-sm", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
                )
              )
        ),

        // Filtres — année / filière / semestre, comme sur l'onglet Épreuves.
        React.createElement("div", { className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Trier par année, filière et semestre"),
          React.createElement("div", { className: "grid grid-cols-2 gap-2" },
            React.createElement("select", {
              value: filtreAnneeRes,
              onChange: e => { setFiltreAnneeRes(e.target.value); setMatiereRapideRes(""); },
              className: "rounded-lg px-2 py-1.5 text-sm outline-none border",
              style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
            }, ["Toutes", ...ANNEES].map(a => React.createElement("option", { key: a }, a))),
            React.createElement("select", {
              value: filtreFiliereRes,
              onChange: e => { setFiltreFiliereRes(e.target.value); setMatiereRapideRes(""); },
              className: "rounded-lg px-2 py-1.5 text-sm outline-none border",
              style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
            }, ["Toutes", ...FILIERES].map(f => React.createElement("option", { key: f }, f)))
          ),
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mt-1", style: { color: COLORS.textMuted } }, "Semestre"),
          React.createElement("div", { className: "grid grid-cols-3 gap-2" },
            ["Toutes", ...SEMESTRES].map(sem => {
              const actif = filtreSemestreRes === sem;
              return React.createElement("button", {
                key: sem,
                onClick: () => { setFiltreSemestreRes(sem); setMatiereRapideRes(""); },
                className: "rounded-lg px-2 py-2 text-xs font-mono border",
                style: {
                  backgroundColor: actif ? "rgba(var(--accent-rgb),0.15)" : COLORS.bg,
                  borderColor: actif ? COLORS.gold : COLORS.border,
                  color: actif ? COLORS.gold : COLORS.textMuted
                }
              }, sem === "Toutes" ? "Tous" : sem.replace("Semestre ", "Semestre "));
            })
          )
        ),

        // Accès rapide à une matière précise, parmi celles qui ont déjà un résumé publié.
        matieresDisponibles.length > 0 && React.createElement("div", { className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Matière"),
          React.createElement("select", {
            value: matiereRapideRes,
            onChange: e => setMatiereRapideRes(e.target.value),
            className: "w-full rounded-lg px-2 py-1.5 text-sm outline-none border",
            style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
          }, ["Toutes les matières", ...matieresDisponibles].map(m => React.createElement("option", { key: m, value: m === "Toutes les matières" ? "" : m }, m)))
        ),

        resumesFiltres.length === 0
          ? React.createElement(EmptyState, { icon: "file-text", text: resumes.length === 0 ? "Aucun résumé publié pour l'instant." : "Désolé, aucun résumé ne correspond à ce filtre." })
          : resumesFiltres.map(r => {
              const isOpen = expanded === r.id;
              return React.createElement("div", { key: r.id, className: "rounded-lg border overflow-hidden", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
                React.createElement("button", { onClick: () => setExpanded(isOpen ? null : r.id), className: "w-full text-left p-4" },
                  React.createElement("div", { className: "flex items-center gap-2 mb-1 flex-wrap" },
                    React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.1)" } }, r.annee),
                    r.semestre && React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: COLORS.textMuted, backgroundColor: COLORS.border } }, r.semestre),
                    r.filiere && React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: COLORS.forestText, backgroundColor: "rgba(119,221,106,0.15)" } }, r.filiere)
                  ),
                  React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, r.matiere),
                  React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.textFaint } }, isOpen ? "▲ Réduire" : "▼ Voir le résumé")
                ),
                isOpen && React.createElement("div", { className: "px-4 pb-4 border-t", style: { borderColor: COLORS.border } },
                  r.pdfUrl && React.createElement("button", { onClick: () => setPreviewUrl(r.pdfUrl), className: "mt-3 mb-1 text-xs font-mono px-3 py-1.5 rounded-full", style: { backgroundColor: "rgba(var(--accent-rgb),0.12)", color: COLORS.gold } }, React.createElement(Icon, {name:"eye",size:14}), " Aperçu PDF"),
                  React.createElement("p", { className: "text-sm whitespace-pre-wrap mt-2", style: { color: COLORS.text } }, r.contenu),
                  r.resumeIA
                    ? React.createElement("div", { className: "mt-3" },
                        React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mb-1 flex items-center gap-1", style: { color: COLORS.gold } }, React.createElement(Icon, {name:"bot", size:11}), " Résumé IA"),
                        React.createElement(CorrigeRendu, { texte: r.resumeIA }),
                        isOwner && React.createElement("button", {
                          onClick: () => onClearResumeIA(r),
                          className: "mt-2 text-[11px] font-mono flex items-center gap-1",
                          style: { color: COLORS.textMuted }
                        }, React.createElement(Icon, {name:"refresh-cw", size:11}), " Effacer et permettre une régénération")
                      )
                    : React.createElement("button", {
                        onClick: () => handleGenererResumeIA(r),
                        disabled: iaLoading === r.id,
                        className: "mt-3 flex items-center justify-center gap-1.5 text-xs font-mono py-2 px-3 rounded-lg disabled:opacity-50",
                        style: { backgroundColor: COLORS.gold, color: COLORS.bg }
                      }, iaLoading === r.id ? "Génération…" : React.createElement(React.Fragment, null, React.createElement(Icon, { name: "sparkles", size: 13 }), " Générer un résumé IA")),
                  iaLoading === r.id && React.createElement("p", { className: "text-[11px] mt-2 flex items-center gap-1.5", style: { color: COLORS.textFaint } }, React.createElement(Icon, { name: "clock", size: 11 }), "Ça peut prendre 1 à 2 minutes pour un cours complet, reste sur la page."),
                  iaErreur && iaErreur.id === r.id && React.createElement("p", { className: "text-[11px] mt-2", style: { color: COLORS.textMuted } }, iaErreur.message),
                  React.createElement("div", { className: "flex items-center justify-between mt-3" },
                    React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Publié par " + r.auteur),
                    isOwner && React.createElement("button", { onClick: () => { if (confirm("Supprimer ce résumé ?")) onDeleteResume(r.id); }, className: "text-[10px] font-mono px-2.5 py-1 rounded-full", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } }, React.createElement(Icon,{name:"trash",size:11}), " Supprimer")
                  )
                )
              );
            }),
        previewUrl && React.createElement(PdfPreviewModal, { rawUrl: previewUrl, onClose: () => setPreviewUrl(null) })
      );
    }
