// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { EmptyState } from "../components/MenuLateral.js";
import { RecadreurImage } from "../components/RecadreurImage.js";
import { BADGES, COUT_EPINGLE, COUT_FLASH } from "../config/constantes.js";
import { timestampDeCarte } from "../lib/abonnements.js";
import { uploaderImageCloudinary, validerTailleImageActu } from "../services/cloudinary.js";
import { COLORS } from "../theme.js";

    function SabiCard({ card, onVote, myVote, onPin, points, isMine, isOwner, onDelete }) {
      const epingleActif = card.epingleJusqua && card.epingleJusqua > Date.now();
      const flashActif = card.flashJusqua && card.flashJusqua > Date.now();

      return React.createElement("div", { className: "rounded-lg border overflow-hidden", style: { borderColor: flashActif ? COLORS.terra : epingleActif ? COLORS.gold : COLORS.border, backgroundColor: COLORS.surface } },
        card.imageUrl && React.createElement("img", { src: card.imageUrl, alt: "", className: "w-full object-cover", style: { maxHeight: 280 } }),
        React.createElement("div", { className: "p-4" },
          (card.filiere || card.verifie || epingleActif || flashActif) && React.createElement("div", { className: "flex items-center gap-1.5 mb-2 flex-wrap" },
            card.filiere && React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.1)" } }, card.filiere),
            card.verifie && React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1", style: { color: COLORS.bg, backgroundColor: COLORS.gold } }, React.createElement(Icon, {name:"star", size:11}), "Vérifié"),
            epingleActif && React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1", style: { color: COLORS.bg, backgroundColor: COLORS.gold } }, React.createElement(Icon, {name:"pin", size:11}), "Épinglée"),
            flashActif && React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1", style: { color: COLORS.text, backgroundColor: COLORS.terra } }, React.createElement(Icon, {name:"help-circle", size:11}), "Flash")
          ),
          card.contenu && React.createElement("p", { className: "text-[15px] leading-relaxed", style: { color: COLORS.text } }, card.contenu),
          React.createElement("div", { className: "mt-3 flex items-center justify-between gap-2" },
            React.createElement("div", { className: "flex items-center gap-1.5 text-xs min-w-0", style: { color: COLORS.textMuted } },
              card.badge && React.createElement(Icon, { name: BADGES.find(b => b.id === card.badge)?.emoji, size: 12 }),
              React.createElement("span", { className: "truncate" }, card.auteur),
              React.createElement("span", null, "·"),
              React.createElement("span", { className: "flex-shrink-0" }, card.date)
            ),
            React.createElement("div", { className: "flex items-center gap-3 flex-shrink-0" },
              React.createElement("button", {
                onClick: () => onVote(card.id, "up"),
                className: "flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all hover:bg-[#4d4635] active:scale-90",
                style: { opacity: myVote && myVote !== "up" ? 0.4 : 1 }
              },
                React.createElement(Icon, { name: "thumbs-up", size: 15, color: myVote === "up" ? COLORS.gold : COLORS.textGhost }),
                React.createElement("span", { className: "font-mono text-[11px] font-semibold", style: { color: myVote === "up" ? COLORS.gold : COLORS.textMuted } }, card.up || 0)
              ),
              React.createElement("button", {
                onClick: () => onVote(card.id, "down"),
                className: "flex items-center gap-1 px-1.5 py-1 rounded-lg transition-all hover:bg-[#4d4635] active:scale-90",
                style: { opacity: myVote && myVote !== "down" ? 0.4 : 1 }
              },
                React.createElement(Icon, { name: "thumbs-up", size: 15, color: myVote === "down" ? COLORS.terraText : COLORS.textGhost, style: { transform: "rotate(180deg)" } }),
                React.createElement("span", { className: "font-mono text-[11px] font-semibold", style: { color: myVote === "down" ? COLORS.terraText : COLORS.textMuted } }, card.down || 0)
              )
            )
          ),
          (isMine && !epingleActif || isOwner) && React.createElement("div", { className: "flex items-center gap-2 mt-2 flex-wrap" },
            isMine && !epingleActif && React.createElement("button", {
              onClick: () => onPin(card.id),
              disabled: points < COUT_EPINGLE,
              className: "text-[11px] font-mono px-2 py-1 rounded-full disabled:opacity-30",
              style: { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }
            }, React.createElement(Icon, {name:"pin", size:12}), " Épingler 12h (" + COUT_EPINGLE + " pts)"),
            isOwner && React.createElement("button", {
              onClick: () => { if (confirm("Supprimer définitivement cette carte ?")) onDelete(card.id); },
              className: "text-[11px] font-mono px-2 py-1 rounded-full",
              style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" }
            }, React.createElement(Icon, {name:"trash", size:12}), " Supprimer")
          )
        )
      );
    }

    export function FilTab({ cards, onVote, myVotes, onPin, points, pseudo, isOwner, isAdmin, onDelete, onClearAll }) {
      const now = Date.now();
      const sorted = [...cards].sort((a, b) => {
        const aFlash = a.flashJusqua && a.flashJusqua > now;
        const bFlash = b.flashJusqua && b.flashJusqua > now;
        if (aFlash && !bFlash) return -1;
        if (bFlash && !aFlash) return 1;
        const aEpingle = a.epingleJusqua && a.epingleJusqua > now;
        const bEpingle = b.epingleJusqua && b.epingleJusqua > now;
        if (aEpingle && !bEpingle) return -1;
        if (bEpingle && !aEpingle) return 1;
        return timestampDeCarte(b) - timestampDeCarte(a);
      });
      return React.createElement("div", null,
        isOwner && cards.length > 0 && React.createElement("div", { className: "flex justify-end mb-3" },
          React.createElement("button", {
            onClick: () => { if (confirm("Supprimer TOUTES les actualités (" + cards.length + ") ? Cette action est irréversible.")) onClearAll(); },
            className: "flex-shrink-0 flex items-center gap-1 text-[11px] font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
            style: { color: COLORS.terraText, borderColor: "rgba(255,180,171,0.4)" }
          }, React.createElement(Icon, { name: "trash", size: 12 }), "Tout supprimer")
        ),
        React.createElement("div", { className: "flex flex-col gap-3 sabi-liste-animee" },
          sorted.length === 0 ? React.createElement(EmptyState, { icon: "radio", text: "Aucune actualité pour l'instant." }) : sorted.map(c => React.createElement(SabiCard, { key: c.id, card: c, onVote: onVote, myVote: myVotes[c.id], onPin: onPin, points: points, isMine: c.auteur === pseudo, isOwner: isOwner, onDelete: onDelete }))
        )
      );
    }

    export function ContribuerTab({ onSubmit, pseudo, vip, filiere, points, isOwner, isAdmin, prefill, prefillImage }) {
      const [contenu, setContenu] = useState(prefill || "");
      const [envoye, setEnvoye] = useState(false);
      const [verifie, setVerifie] = useState(false);
      const [flash, setFlash] = useState(false);
      const [imageFile, setImageFile] = useState(null);
      const [imagePreview, setImagePreview] = useState(null);
      const [imageACadrer, setImageACadrer] = useState(null); // fichier brut en attente de recadrage
      useEffect(() => {
        if (prefillImage) setImageACadrer(prefillImage);
      }, [prefillImage]);
      const [uploadPct, setUploadPct] = useState(null);
      const [erreur, setErreur] = useState("");

      // Ouvert à tous les utilisateurs connectés — la contribution n'est plus réservée
      // aux administrateurs. La modération reste possible a posteriori (suppression de
      // carte par owner/admin, déjà en place dans FilTab).

      // Une carte est valide avec du texte (10 car. min), une image seule, ou les deux —
      // mais jamais complètement vide.
      const peutPublier = contenu.trim().length >= 10 || !!imageFile;

      const publier = (imageUrl) => {
        Promise.resolve(onSubmit({ filiere, contenu: contenu.trim(), verifie: vip && verifie, flash, imageUrl: imageUrl || null }))
          .then(() => {
            setContenu("");
            setFlash(false);
            setImageFile(null);
            setImagePreview(null);
            setUploadPct(null);
            setEnvoye(true);
            setTimeout(() => setEnvoye(false), 2500);
          })
          .catch(err => {
            // La publication a réellement échoué (règles Firebase, réseau...) : on garde le
            // texte/l'image saisis (rien n'est perdu) et on affiche l'erreur au lieu de faire
            // croire que c'est publié.
            setUploadPct(null);
            setErreur("La publication a échoué : " + (err && err.message ? err.message : "vérifie ta connexion."));
          });
      };

      const handleSubmit = () => {
        setErreur("");
        if (!peutPublier) {
          setErreur("Ajoute au moins un texte (10 caractères minimum) ou une image.");
          return;
        }
        if (imageFile) {
          setUploadPct(0);
          uploaderImageCloudinary(imageFile, setUploadPct)
            .then(url => publier(url))
            .catch(err => { setUploadPct(null); setErreur("Échec de l'envoi de l'image : " + err.message); });
        } else {
          publier(null);
        }
      };

      const choisirImage = (f) => {
        setErreur("");
        if (!f) { setImageFile(null); setImagePreview(null); return; }
        const err = validerTailleImageActu(f);
        if (err) { setErreur(err); return; }
        setImageACadrer(f); // ouvre le recadrage avant utilisation
      };

      const onImageRecadree = (fichierRecadre) => {
        setImageACadrer(null);
        setImageFile(fichierRecadre);
        setImagePreview(URL.createObjectURL(fichierRecadre));
      };

      return React.createElement(React.Fragment, null,
        imageACadrer && React.createElement(RecadreurImage, { file: imageACadrer, onValider: onImageRecadree, onAnnuler: () => setImageACadrer(null) }),
        React.createElement("div", { className: "flex flex-col gap-4" },
        React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Publié en tant que " + pseudo + " · " + filiere),
        React.createElement("div", null,
          React.createElement("label", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Ton actualité"),
          React.createElement("textarea", { value: contenu, onChange: e => setContenu(e.target.value), placeholder: "Une info que tu tiens d'un grand, un piège d'examen, une astuce de coefficient...", rows: 4, className: "mt-1 w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text } }),
          React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.textFaint } }, "Texte seul (10 caractères min), image seule, ou les deux. Visible par tous instantanément, seuls tes votes restent privés.")
        ),
        React.createElement("div", null,
          React.createElement("label", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Image (optionnel)"),
          React.createElement("input", {
            type: "file", accept: "image/*",
            onChange: e => choisirImage(e.target.files[0] || null),
            disabled: uploadPct !== null,
            className: "mt-1 w-full text-xs", style: { color: COLORS.textMuted }
          }),
          imagePreview && React.createElement("div", { className: "relative mt-2" },
            React.createElement("img", { src: imagePreview, alt: "", className: "w-full rounded-lg object-cover", style: { maxHeight: 220 } }),
            uploadPct === null && React.createElement("button", {
              onClick: () => choisirImage(null),
              className: "absolute top-2 right-2 text-[10px] font-mono uppercase px-2 py-1 rounded-full",
              style: { backgroundColor: COLORS.bg, color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" }
            }, "Retirer")
          ),
          uploadPct !== null && React.createElement("div", { className: "mt-2" },
            React.createElement("div", { className: "w-full h-1.5 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
              React.createElement("div", { className: "h-full rounded-full transition-all", style: { width: uploadPct + "%", backgroundColor: COLORS.gold } })
            ),
            React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.textMuted } }, "Envoi de l'image... " + uploadPct + "%")
          )
        ),
        erreur && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.terraText } }, erreur),
        vip && React.createElement("label", { className: "flex items-center gap-2 text-sm", style: { color: COLORS.gold } },
          React.createElement("input", { type: "checkbox", checked: verifie, onChange: e => setVerifie(e.target.checked) }),
          "Marquer comme [VÉRIFIÉ] ",
          React.createElement(Icon, { name: "star", size: 13 })
        ),
        React.createElement("label", { className: "flex items-center gap-2 text-sm", style: { color: points >= COUT_FLASH ? COLORS.terraText : COLORS.textFaint } },
          React.createElement("input", { type: "checkbox", checked: flash, disabled: points < COUT_FLASH, onChange: e => setFlash(e.target.checked) }),
          React.createElement(Icon, { name: "help-circle", size: 14 }),
          " Question Flash. " + COUT_FLASH + " pts, en tête du fil pendant 24h"
        ),
        React.createElement("button", { onClick: handleSubmit, disabled: !peutPublier || uploadPct !== null, className: "w-full rounded-lg py-2.5 font-semibold text-sm flex items-center justify-center gap-2 transition-opacity disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, React.createElement(Icon, { name: "sparkles", size: 15 }), " " + (uploadPct !== null ? "Envoi en cours..." : envoye ? "Actualité publiée · +5 points" : "Publier mon actualité"))
        )
      );
    }
