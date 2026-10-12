// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import ReactDOM from "react-dom";
import { CorrigeRendu } from "./CorrigeRendu.js";
import { Icon } from "./Icon.js";
import { LIMITE_REVISION_JOUR, genererRevisionIA, parserRevision } from "../services/revision.js";
import { COLORS } from "../theme.js";

    function RevisionModal({ ep, revision, onClose }) {
      const [onglet, setOnglet] = useState("fiche");
      const [file, setFile] = useState(() => revision.cartes.map((_, i) => i)); // cartes restantes à maîtriser
      const [retournee, setRetournee] = useState(false);
      const total = revision.cartes.length;
      const courante = file.length ? revision.cartes[file[0]] : null;
      const savait = () => { setRetournee(false); setFile(f => f.slice(1)); };
      const arevoir = () => { setRetournee(false); setFile(f => f.length > 1 ? [...f.slice(1), f[0]] : f); };
      const recommencer = () => { setRetournee(false); setFile(revision.cartes.map((_, i) => i)); };
      const onglets = [["fiche", "Fiche"], ["cartes", "Flashcards" + (total ? " (" + total + ")" : "")]];
      return ReactDOM.createPortal(React.createElement("div", { className: "fixed inset-0 z-50 flex flex-col", style: { backgroundColor: COLORS.bg } },
        React.createElement("div", { className: "flex items-center justify-between px-4 py-3 border-b gap-2", style: { borderColor: COLORS.border } },
          React.createElement("p", { className: "text-sm font-mono truncate", style: { color: COLORS.text } }, "Révision : " + (ep.matiere || "épreuve")),
          React.createElement("button", { onClick: onClose, className: "text-sm font-mono px-3 py-1.5 rounded-full", style: { backgroundColor: COLORS.border, color: COLORS.text } }, React.createElement(Icon, { name: "x", size: 13 }), " Fermer")),
        React.createElement("div", { className: "flex gap-2 px-4 pt-3" },
          onglets.map(([id, lib]) => React.createElement("button", {
            key: id, onClick: () => setOnglet(id), className: "flex-1 rounded-lg py-2 text-xs font-semibold",
            style: onglet === id ? { backgroundColor: COLORS.gold, color: COLORS.bg } : { border: "1px solid " + COLORS.border, color: COLORS.textMuted }
          }, lib))),
        React.createElement("div", { className: "flex-1 overflow-y-auto px-4 py-4" },
          onglet === "fiche"
            ? React.createElement(CorrigeRendu, { texte: revision.fiche || "Aucune fiche n'a pu être générée." })
            : !total
              ? React.createElement("p", { className: "text-sm", style: { color: COLORS.textMuted } }, "L'IA n'a pas pu créer de flashcards pour cette épreuve. Lis la fiche, ou réessaie plus tard.")
              : !courante
                ? React.createElement("div", { className: "flex flex-col items-center gap-3 py-10 text-center" },
                    React.createElement(Icon, { name: "check-circle", size: 40, color: COLORS.forestText }),
                    React.createElement("p", { className: "text-base font-semibold", style: { color: COLORS.text } }, "Bravo, tu maîtrises les " + total + " cartes"),
                    React.createElement("button", { onClick: recommencer, className: "rounded-lg px-5 py-2.5 text-sm font-semibold flex items-center gap-2", style: { border: "1px solid " + COLORS.border, color: COLORS.text } }, React.createElement(Icon, { name: "refresh-cw", size: 14 }), "Recommencer"))
                : React.createElement("div", { className: "flex flex-col gap-3" },
                    React.createElement("p", { className: "text-[11px] font-mono text-center", style: { color: COLORS.textFaint } }, (total - file.length) + " maîtrisées sur " + total + " · " + file.length + " à revoir"),
                    React.createElement("button", {
                      onClick: () => setRetournee(r => !r),
                      className: "rounded-lg p-5 text-left flex flex-col justify-center",
                      style: { minHeight: 220, backgroundColor: COLORS.surface, border: "1px solid " + (retournee ? COLORS.gold : COLORS.border) }
                    },
                      React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mb-2", style: { color: retournee ? COLORS.gold : COLORS.textFaint } }, retournee ? "Réponse" : "Question"),
                      React.createElement(CorrigeRendu, { texte: retournee ? courante.r : courante.q }),
                      !retournee && React.createElement("p", { className: "text-[11px] mt-4", style: { color: COLORS.textFaint } }, "Touche la carte pour voir la réponse")),
                    retournee && React.createElement("div", { className: "flex gap-2" },
                      React.createElement("button", { onClick: arevoir, className: "flex-1 rounded-lg py-2.5 text-sm font-semibold", style: { border: "1px solid " + COLORS.terra, color: COLORS.terraText } }, "À revoir"),
                      React.createElement("button", { onClick: savait, className: "flex-1 rounded-lg py-2.5 text-sm font-semibold", style: { backgroundColor: COLORS.forest, color: COLORS.bg } }, "Je savais")))
        )
      ), document.body);
    }

    export function BoutonRevision({ ep }) {
      const cleCache = "sabi_revision_" + ep.id;
      const [revision, setRevision] = useState(null);
      const [ouvert, setOuvert] = useState(false);
      const [charge, setCharge] = useState(false);
      const [erreur, setErreur] = useState("");
      const lancer = async () => {
        setErreur("");
        let cache = null; try { cache = JSON.parse(localStorage.getItem(cleCache) || "null"); } catch {}
        if (cache && cache.fiche) { setRevision(cache); setOuvert(true); return; }
        const cleJour = "sabi_revision_jour_" + new Date().toISOString().slice(0, 10);
        let n = 0; try { n = parseInt(localStorage.getItem(cleJour) || "0", 10) || 0; } catch {}
        if (n >= LIMITE_REVISION_JOUR) { setErreur("Limite de " + LIMITE_REVISION_JOUR + " nouvelles fiches par jour atteinte. Reviens demain."); return; }
        setCharge(true);
        try {
          const brut = await genererRevisionIA(ep.contenu, ep.matiere || "cette matière", ep.pdfUrl, ep.imagesUrls || ep.imageUrl);
          const r = parserRevision(brut);
          if (!r.fiche && !r.cartes.length) throw new Error("Réponse de l'IA inexploitable. Réessaie.");
          try { localStorage.setItem(cleCache, JSON.stringify(r)); localStorage.setItem(cleJour, String(n + 1)); } catch {}
          setRevision(r); setOuvert(true);
        } catch (e) { setErreur((e && e.message) || "Impossible de préparer la fiche. Réessaie."); }
        setCharge(false);
      };
      return React.createElement("div", { className: "px-4 pb-3" },
        React.createElement("button", {
          onClick: lancer, disabled: charge,
          className: "w-full flex items-center justify-center gap-1.5 text-xs font-mono py-2 rounded-lg disabled:opacity-60",
          style: { border: "1px solid rgba(139,92,246,0.45)", color: "#c4b5fd" }
        }, React.createElement(Icon, { name: "sparkles", size: 13 }), charge ? "Préparation de ta fiche..." : "Fiche & flashcards"),
        erreur && React.createElement("p", { className: "text-[11px] mt-1.5", style: { color: COLORS.terraText } }, erreur),
        ouvert && revision && React.createElement(RevisionModal, { ep: ep, revision: revision, onClose: () => setOuvert(false) }));
    }
