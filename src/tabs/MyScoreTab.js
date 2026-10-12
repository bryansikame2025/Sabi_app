// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { EmptyState } from "../components/MenuLateral.js";
import { myscoreRef, usersRef } from "../firebase.js";
import { COLORS } from "../theme.js";

    // ===== Export PDF (impression navigateur — gratuit, sans dépendance externe, sans appel réseau) =====
    // Ouvre une fenêtre avec un document HTML propre puis déclenche window.print() ;
    // l'utilisateur choisit "Enregistrer en PDF" dans la boîte de dialogue d'impression.
    export function imprimerPDF(titre, contenuHTML) {
      const fenetre = window.open("", "_blank");
      if (!fenetre) { alert("Autorise les pop-ups de ce site pour exporter en PDF."); return; }
      fenetre.document.write(
        "<html><head><title>" + titre + "</title><meta charset='utf-8'><style>" +
        "body{font-family:Georgia,serif;padding:32px;color:#1a1a1a;}" +
        "h1{font-size:20px;border-bottom:2px solid #5b3fd6;padding-bottom:8px;margin-bottom:4px;}" +
        "p.meta{color:#555;font-size:12px;margin:2px 0;}" +
        "table{width:100%;border-collapse:collapse;margin-top:16px;}" +
        "th,td{text-align:left;padding:8px;border-bottom:1px solid #ddd;font-size:13px;}" +
        "th{color:#888;text-transform:uppercase;font-size:10px;letter-spacing:0.05em;}" +
        "td.note{font-weight:bold;color:#B8860B;}" +
        "@media print{body{padding:16px;}}" +
        "</style></head><body>" + contenuHTML + "<script>window.onload=function(){setTimeout(function(){window.print();},300);}<\/script></body></html>"
      );
      fenetre.document.close();
      fenetre.focus();
    }
    function ligneNoteHTML(n) {
      return "<tr><td>" + (n.matiere || "") + "</td><td>" + (n.dateDePublication || "") + "</td><td class='note'>" + (n.note != null ? n.note : "-") + "/20</td></tr>";
    }
    // Étudiant — relevé complet (bouton global)
    function exporterReleveEtudiant(pseudo, matricule, notes) {
      imprimerPDF("Relevé de notes",
        "<h1>Relevé de notes. Sabi</h1>" +
        "<p class='meta'>Étudiant : " + (pseudo || "") + "</p>" +
        "<p class='meta'>Matricule : " + (matricule || "-") + "</p>" +
        "<p class='meta'>Édité le " + new Date().toLocaleDateString("fr-FR") + "</p>" +
        "<table><thead><tr><th>Matière</th><th>Date</th><th>Note</th></tr></thead><tbody>" + notes.map(ligneNoteHTML).join("") + "</tbody></table>"
      );
    }
    // Étudiant — une seule note (bouton par ligne)
    function exporterNoteUnique(pseudo, matricule, note) {
      imprimerPDF("Note. " + (note.matiere || ""),
        "<h1>Attestation de note. Sabi</h1>" +
        "<p class='meta'>Étudiant : " + (pseudo || "") + "</p>" +
        "<p class='meta'>Matricule : " + (matricule || "-") + "</p>" +
        "<p class='meta'>Édité le " + new Date().toLocaleDateString("fr-FR") + "</p>" +
        "<table><thead><tr><th>Matière</th><th>Date</th><th>Note</th></tr></thead><tbody>" + ligneNoteHTML(note) + "</tbody></table>"
      );
    }

    // Affiche les notes attribuées automatiquement à l'étudiant connecté (Matière | Note | Date),
    // publiées par l'administration via l'import de feuille de notes (voir AdminTab).
    export function MyScoreTab({ authUid }) {
      const [scores, setScores] = useState(null); // null = chargement
      const [monProfil, setMonProfil] = useState({ pseudo: "", matricule: "" });
      useEffect(() => {
        if (!authUid) return;
        const ref = usersRef.child(authUid);
        const listener = ref.on("value", snap => {
          const v = snap.val() || {};
          setMonProfil({ pseudo: v.pseudo || "", matricule: v.matricule || "" });
        });
        return () => ref.off("value", listener);
      }, [authUid]);
      useEffect(() => {
        if (!authUid) return;
        const ref = myscoreRef.child(authUid);
        const listener = ref.on("value", snap => {
          const val = snap.val() || {};
          const liste = Object.entries(val).map(([id, s]) => ({ id, ...s })).sort((a, b) => (b.publieLe || 0) - (a.publieLe || 0));
          setScores(liste);
        });
        return () => ref.off("value", listener);
      }, [authUid]);

      const scoresOfficiels = scores ? scores.filter(s => s.source !== "simulateur") : null;
      const moyenneGenerale = scoresOfficiels && scoresOfficiels.length > 0
        ? (scoresOfficiels.reduce((s, x) => s + (Number(x.note) || 0), 0) / scoresOfficiels.length).toFixed(2)
        : null;

      return React.createElement("div", { className: "flex flex-col gap-4" },
        React.createElement("div", { className: "flex items-center gap-2" },
          React.createElement(Icon, { name: "award", size: 18, color: COLORS.gold }),
          React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "MyScore")
        ),
        React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, "Tes notes, attribuées automatiquement à partir des feuilles publiées par l'administration, visibles uniquement par toi."),
        moyenneGenerale !== null && React.createElement("div", { className: "rounded-lg border p-3 flex items-center justify-between", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("span", { className: "text-xs font-mono uppercase", style: { color: COLORS.textMuted } }, "Moyenne générale (officielle)"),
          React.createElement("span", { className: "text-lg font-bold font-mono", style: { color: COLORS.gold } }, moyenneGenerale + "/20")
        ),
        scoresOfficiels && scoresOfficiels.length > 0 && React.createElement("button", {
          onClick: () => exporterReleveEtudiant(monProfil.pseudo, monProfil.matricule, scoresOfficiels),
          className: "text-xs font-mono py-2.5 rounded-lg border flex items-center justify-center gap-1.5",
          style: { borderColor: COLORS.border, color: COLORS.textMuted }
        }, React.createElement(Icon, { name: "printer", size: 13 }), "Exporter le relevé complet en PDF"),
        scores === null
          ? React.createElement("p", { className: "text-xs text-center py-6", style: { color: COLORS.textFaint } }, "Chargement...")
          : scores.length === 0
          ? React.createElement(EmptyState, { icon: "award", text: "Aucune note publiée pour l'instant." })
          : React.createElement("div", { className: "flex flex-col gap-2" },
              scores.map(s => {
                const estSimule = s.source === "simulateur";
                return React.createElement("div", { key: s.id, className: "rounded-lg border p-3.5 flex items-center justify-between", style: { borderColor: estSimule ? COLORS.border : COLORS.border, borderStyle: estSimule ? "dashed" : "solid", backgroundColor: COLORS.surface } },
                  React.createElement("div", { className: "min-w-0" },
                    React.createElement("div", { className: "flex items-center gap-1.5" },
                      React.createElement("p", { className: "text-sm font-semibold truncate", style: { color: COLORS.text } }, s.matiere),
                      estSimule && React.createElement("span", { className: "text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-full flex-shrink-0", style: { color: COLORS.textMuted, backgroundColor: "rgba(139,147,168,0.15)" } }, "Simulé")
                    ),
                    React.createElement("p", { className: "text-[10px] font-mono", style: { color: COLORS.textFaint } }, s.dateDePublication || new Date(s.publieLe).toLocaleDateString("fr-FR"))
                  ),
                  React.createElement("div", { className: "flex items-center gap-2 flex-shrink-0 ml-3" },
                    React.createElement("span", { className: "text-base font-bold font-mono", style: { color: s.note >= 10 ? COLORS.forestText : COLORS.terra } }, (s.note != null ? s.note : "-") + "/20"),
                    !estSimule && React.createElement("button", {
                      onClick: () => exporterNoteUnique(monProfil.pseudo, monProfil.matricule, s),
                      style: { color: COLORS.textFaint }
                    }, React.createElement(Icon, { name: "printer", size: 14 }))
                  )
                );
              })
            )
      );
    }


    // Jauge circulaire (façon "Moyenne actuelle" avec anneau de progression)
    export function JaugeCirculaire({ valeur, max = 20, taille = 200, epaisseur = 16, couleur = COLORS.gold, sousTexte }) {
      const rayon = (taille - epaisseur) / 2;
      const circonference = 2 * Math.PI * rayon;
      const pct = Math.max(0, Math.min(1, (valeur || 0) / max));
      return React.createElement("div", { className: "relative flex items-center justify-center flex-shrink-0", style: { width: taille, height: taille } },
        React.createElement("svg", { width: taille, height: taille, style: { transform: "rotate(-90deg)" } },
          React.createElement("circle", { cx: taille / 2, cy: taille / 2, r: rayon, fill: "none", stroke: COLORS.border, strokeWidth: epaisseur }),
          React.createElement("circle", {
            cx: taille / 2, cy: taille / 2, r: rayon, fill: "none", stroke: couleur, strokeWidth: epaisseur,
            strokeDasharray: circonference, strokeDashoffset: circonference * (1 - pct), strokeLinecap: "round",
            style: { transition: "stroke-dashoffset 0.5s ease" }
          })
        ),
        React.createElement("div", { className: "absolute flex flex-col items-center" },
          React.createElement("span", { className: "font-bold font-mono", style: { color: COLORS.text, fontSize: taille * 0.22 } }, valeur !== null && valeur !== undefined ? valeur.toFixed(1) : "-"),
          React.createElement("span", { className: "text-xs font-mono", style: { color: COLORS.textFaint } }, "/" + max),
          sousTexte
        )
      );
    }
