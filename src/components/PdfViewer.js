// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Icon } from "./Icon.js";
import { auth } from "../firebase.js";
import { COLORS } from "../theme.js";

    // ========== LECTEUR PDF INTÉGRÉ (PDF.js) ==========
    // Avant : l'aperçu passait par la visionneuse Google Docs (docs.google.com/viewer), qui doit
    // télécharger puis convertir le PDF avant d'afficher quoi que ce soit. Sur une connexion lente
    // ou quand Google est lent/bloqué, le résultat était un écran blanc ou "ERR_TIMED_OUT".
    // Maintenant : on lit le PDF directement, page par page, avec un pourcentage de chargement.
    // La visionneuse Google ne sert plus que de dernier recours (voir PdfPreviewModal).
    const PDFJS_VERSION = "3.11.174";
    const PDFJS_SOURCES = [
      { lib: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION + "/pdf.min.js", worker: "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/" + PDFJS_VERSION + "/pdf.worker.min.js" },
      { lib: "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + PDFJS_VERSION + "/build/pdf.min.js", worker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@" + PDFJS_VERSION + "/build/pdf.worker.min.js" }
    ];
    function chargerPdfJs() {
      if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
      if (window.__pdfjsPromesse) return window.__pdfjsPromesse;
      window.__pdfjsPromesse = new Promise((resolve, reject) => {
        let i = 0;
        const essayer = () => {
          if (i >= PDFJS_SOURCES.length) { reject(new Error("PDF.js indisponible")); return; }
          const src = PDFJS_SOURCES[i];
          const sc = document.createElement("script");
          sc.src = src.lib;
          sc.onload = () => { window.pdfjsLib.GlobalWorkerOptions.workerSrc = src.worker; resolve(window.pdfjsLib); };
          sc.onerror = () => { i++; essayer(); };
          document.head.appendChild(sc);
        };
        essayer();
      });
      window.__pdfjsPromesse.catch(() => { window.__pdfjsPromesse = null; });
      return window.__pdfjsPromesse;
    }

    // Filigrane : l'adresse email du lecteur est gravée en diagonale sur chaque page. Une capture
    // d'écran ou une photo de l'épreuve porte donc le nom de celui qui l'a diffusée.
    function filigraneTexte() {
      const u = (typeof auth !== "undefined" && auth.currentUser) || null;
      return ((u && (u.email || u.uid)) || "Sabi") + "  ·  " + new Date().toLocaleDateString("fr-FR");
    }
    function dessinerFiligrane(ctx, w, h) {
      const texte = filigraneTexte();
      ctx.save();
      ctx.globalAlpha = 0.16;
      ctx.fillStyle = "#000";
      ctx.font = "bold " + Math.round(w / 26) + "px sans-serif";
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 6);
      const pas = Math.round(w / 6);
      for (let y = -h; y <= h; y += pas) {
        for (let x = -w * 1.2; x <= w * 1.2; x += ctx.measureText(texte).width + pas) ctx.fillText(texte, x + ((y / pas) % 2 ? pas : 0), y);
      }
      ctx.restore();
    }

    function PdfJsVue({ url, onEchec }) {
      const conteneur = React.useRef(null);
      const [pct, setPct] = useState(0);
      const [pret, setPret] = useState(false);
      useEffect(() => {
        let annule = false, tache = null, pdfDoc = null, dernierSigne = Date.now();
        // Pas d'échec arbitraire à 15 s : on n'abandonne que si RIEN n'avance pendant 40 s.
        const garde = setInterval(() => { if (!annule && Date.now() - dernierSigne > 40000) { annule = true; onEchec(); } }, 4000);
        chargerPdfJs().then(lib => {
          tache = lib.getDocument({ url, withCredentials: false });
          tache.onProgress = (p) => { dernierSigne = Date.now(); if (p && p.total) setPct(Math.min(99, Math.round(100 * p.loaded / p.total))); };
          return tache.promise;
        }).then(async (pdf) => {
          pdfDoc = pdf;
          for (let n = 1; n <= pdf.numPages && !annule; n++) {
            const page = await pdf.getPage(n);
            dernierSigne = Date.now();
            if (annule || !conteneur.current) return;
            const base = page.getViewport({ scale: 1 });
            const echelle = conteneur.current.clientWidth / base.width;
            const vp = page.getViewport({ scale: echelle * Math.min(window.devicePixelRatio || 1, 2) });
            const canvas = document.createElement("canvas");
            canvas.width = vp.width; canvas.height = vp.height;
            canvas.style.cssText = "width:100%;display:block;margin-bottom:8px;background:#fff";
            conteneur.current.appendChild(canvas);
            const ctx2d = canvas.getContext("2d");
            await page.render({ canvasContext: ctx2d, viewport: vp }).promise;
            dessinerFiligrane(ctx2d, canvas.width, canvas.height);
            dernierSigne = Date.now();
            if (n === 1) setPret(true);
          }
        }).catch(() => { if (!annule) { annule = true; onEchec(); } });
        return () => {
          annule = true; clearInterval(garde);
          try { if (tache) tache.destroy(); } catch {}
          try { if (pdfDoc) pdfDoc.destroy(); } catch {}
        };
      }, [url]);
      return React.createElement("div", {
        className: "flex-1 relative overflow-y-auto sabi-protege", style: { backgroundColor: COLORS.surface },
        onContextMenu: (e) => e.preventDefault()
      },
        !pret && React.createElement("div", { className: "absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center", style: { pointerEvents: "none" } },
          React.createElement(Icon, { name: "refresh-cw", size: 26, color: COLORS.gold }),
          React.createElement("p", { className: "text-sm font-mono", style: { color: COLORS.text } }, "Chargement du sujet" + (pct ? " : " + pct + " %" : "...")),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Avec une connexion lente, ça peut prendre un moment. Ne ferme pas.")),
        React.createElement("div", { ref: conteneur, className: "w-full" })
      );
    }

    // Aperçu en lecture seule : aucun bouton pour ouvrir, télécharger ou partager le fichier.
    // (Voir PdfJsVue : lecture directe page par page + filigrane au nom du lecteur.)
    export function PdfPreviewModal({ rawUrl, onClose }) {
      const [tentative, setTentative] = useState(0); // incrémenté par "Réessayer"
      const [echec, setEchec] = useState(false);
      const reessayer = () => { setEchec(false); setTentative(t => t + 1); };

      // Portail direct dans <body> : voir l'explication dans RecadreurImage (couvre tout l'écran).
      return ReactDOM.createPortal(React.createElement("div", {
        className: "fixed inset-0 z-50 flex flex-col",
        style: { backgroundColor: "rgba(20,17,15,0.96)" }
      },
        React.createElement("div", { className: "flex items-center justify-between px-4 py-3 border-b gap-2", style: { borderColor: COLORS.border } },
          React.createElement("p", { className: "text-sm font-mono", style: { color: COLORS.text } }, React.createElement(Icon, {name:"eye",size:14}), " Lecture du sujet"),
          React.createElement("button", {
            onClick: onClose,
            className: "text-sm font-mono px-3 py-1.5 rounded-full",
            style: { backgroundColor: COLORS.border, color: COLORS.text }
          }, React.createElement(Icon,{name:"x",size:13}), " Fermer")
        ),
        echec
          ? React.createElement("div", { className: "flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center" },
              React.createElement(Icon, { name: "help-circle", size: 32, color: COLORS.textFaint }),
              React.createElement("p", { className: "text-sm", style: { color: COLORS.textMuted } }, "Le sujet n'a pas pu se charger."),
              React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Ça arrive surtout avec une connexion lente ou coupée. Réessaie quand le réseau est meilleur."),
              React.createElement("button", {
                onClick: reessayer,
                className: "mt-1 flex items-center gap-1.5 text-xs font-mono px-4 py-2 rounded-full",
                style: { backgroundColor: "rgba(var(--accent-rgb),0.15)", color: COLORS.gold }
              }, React.createElement(Icon, { name: "refresh-cw", size: 13 }), "Réessayer")
            )
          : React.createElement(PdfJsVue, { key: "pdfjs-" + tentative, url: rawUrl, onEchec: () => setEchec(true) })
      ), document.body);
    }
