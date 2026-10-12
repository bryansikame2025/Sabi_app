// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import ReactDOM from "react-dom";
import { COLORS } from "../theme.js";

    // ========== RECADRAGE + COMPRESSION D'IMAGE AVANT IMPORT ==========
    // Composant réutilisable (actualités, épreuves...) : affiche l'image tout juste choisie
    // avec un cadre de recadrage déplaçable et redimensionnable, puis renvoie — une fois validé —
    // un nouveau fichier ne contenant QUE la zone sélectionnée, redimensionné (1600px de large
    // maximum) et réencodé en JPEG à qualité 0.85. Réduit nettement le poids envoyé à Cloudinary,
    // en plus de permettre de couper les bords inutiles.
    export function RecadreurImage({ file, onValider, onAnnuler }) {
      const [url, setUrl] = React.useState(null);
      const [natSize, setNatSize] = React.useState({ w: 0, h: 0 });
      const [dispSize, setDispSize] = React.useState({ w: 0, h: 0 });
      const [crop, setCrop] = React.useState({ x: 10, y: 10, w: 80, h: 80 }); // en % de l'image affichée
      const imgRef = React.useRef(null);
      const dragRef = React.useRef(null);

      React.useEffect(() => {
        const u = URL.createObjectURL(file);
        setUrl(u);
        return () => URL.revokeObjectURL(u);
      }, [file]);

      const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

      const onImgLoad = (e) => {
        setNatSize({ w: e.target.naturalWidth, h: e.target.naturalHeight });
        setDispSize({ w: e.target.clientWidth, h: e.target.clientHeight });
      };

      const demarrerGlisser = (mode) => (e) => {
        e.preventDefault();
        e.stopPropagation();
        const point = e.touches ? e.touches[0] : e;
        dragRef.current = { mode, startX: point.clientX, startY: point.clientY, startCrop: { ...crop } };
        window.addEventListener("mousemove", pendantGlisser);
        window.addEventListener("mouseup", arreterGlisser);
        window.addEventListener("touchmove", pendantGlisser, { passive: false });
        window.addEventListener("touchend", arreterGlisser);
      };

      const pendantGlisser = (e) => {
        if (!dragRef.current || !dispSize.w) return;
        if (e.cancelable) e.preventDefault();
        const point = e.touches ? e.touches[0] : e;
        const dxPct = ((point.clientX - dragRef.current.startX) / dispSize.w) * 100;
        const dyPct = ((point.clientY - dragRef.current.startY) / dispSize.h) * 100;
        const s = dragRef.current.startCrop;
        if (dragRef.current.mode === "move") {
          setCrop(c => ({ ...c, x: clamp(s.x + dxPct, 0, 100 - s.w), y: clamp(s.y + dyPct, 0, 100 - s.h) }));
        } else {
          setCrop(c => ({ ...c, w: clamp(s.w + dxPct, 15, 100 - s.x), h: clamp(s.h + dyPct, 15, 100 - s.y) }));
        }
      };

      const arreterGlisser = () => {
        dragRef.current = null;
        window.removeEventListener("mousemove", pendantGlisser);
        window.removeEventListener("mouseup", arreterGlisser);
        window.removeEventListener("touchmove", pendantGlisser);
        window.removeEventListener("touchend", arreterGlisser);
      };

      const valider = () => {
        if (!natSize.w || !imgRef.current) { onAnnuler(); return; }
        const sx = (crop.x / 100) * natSize.w;
        const sy = (crop.y / 100) * natSize.h;
        const sw = (crop.w / 100) * natSize.w;
        const sh = (crop.h / 100) * natSize.h;
        const MAX_LARGEUR = 1600;
        const echelle = sw > MAX_LARGEUR ? MAX_LARGEUR / sw : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(sw * echelle));
        canvas.height = Math.max(1, Math.round(sh * echelle));
        const ctx = canvas.getContext("2d");
        ctx.drawImage(imgRef.current, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => {
          if (!blob) { onAnnuler(); return; }
          const nomBase = (file.name || "image").replace(/\.[^.]+$/, "");
          onValider(new File([blob], nomBase + ".jpg", { type: "image/jpeg" }));
        }, "image/jpeg", 0.85);
      };

      // Rendu via portail direct dans <body> : ce composant est utilisé depuis des écrans
      // (Épreuves, Résumés...) placés dans un conteneur qui reçoit un `transform` CSS en ligne
      // pendant le balayage entre onglets (voir swipeContentRef plus bas). Un ancêtre avec un
      // `transform` actif devient le "containing block" de tout descendant en `position: fixed`,
      // ce qui empêche ce plein-écran de couvrir vraiment tout l'écran (il restait coincé entre
      // l'en-tête et la barre de navigation du bas). Le portail sort ce rendu de cette hiérarchie.
      return ReactDOM.createPortal(React.createElement("div", { className: "fixed inset-0 z-50 flex flex-col items-center justify-center p-4", style: { backgroundColor: "rgba(10,10,10,0.92)" } },
        React.createElement("div", { className: "relative", style: { lineHeight: 0, touchAction: "none" } },
          url && React.createElement("img", {
            ref: imgRef, src: url, alt: "Page de l'épreuve", onLoad: onImgLoad, draggable: false,
            className: "block", style: { maxWidth: "88vw", maxHeight: "60vh" }
          }),
          dispSize.w > 0 && React.createElement("div", {
            onMouseDown: demarrerGlisser("move"), onTouchStart: demarrerGlisser("move"),
            className: "absolute cursor-move",
            style: {
              left: crop.x + "%", top: crop.y + "%", width: crop.w + "%", height: crop.h + "%",
              border: "2px solid " + COLORS.gold, boxShadow: "0 0 0 999px rgba(0,0,0,0.6)"
            }
          },
            React.createElement("div", {
              onMouseDown: demarrerGlisser("resize"), onTouchStart: demarrerGlisser("resize"),
              className: "absolute -right-2.5 -bottom-2.5 w-6 h-6 rounded-full cursor-nwse-resize",
              style: { backgroundColor: COLORS.gold, border: "2px solid #0b0a12" }
            })
          )
        ),
        React.createElement("p", { className: "text-xs text-center mt-4 max-w-xs", style: { color: "#fff" } }, "Déplace le cadre pour choisir la zone à garder, tire le point doré pour le redimensionner."),
        React.createElement("div", { className: "flex gap-3 mt-4" },
          React.createElement("button", { onClick: onAnnuler, className: "px-4 py-2 rounded-full text-sm font-semibold", style: { backgroundColor: "rgba(255,255,255,0.12)", color: "#fff" } }, "Annuler"),
          React.createElement("button", { onClick: valider, className: "px-5 py-2 rounded-full text-sm font-semibold", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, "Valider le recadrage")
        )
      ), document.body);
    }
