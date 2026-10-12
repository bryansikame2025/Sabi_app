// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { EmptyState } from "../components/MenuLateral.js";
import { BADGES } from "../config/constantes.js";
import { COLORS } from "../theme.js";

    export function ChatTab({ messages, pseudo, onSend }) {
      const [texte, setTexte] = useState("");
      const bottomRef = React.useRef(null);

      useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }, [messages.length]);

      const handleSend = () => {
        if (texte.trim().length === 0) return;
        onSend(texte.trim());
        setTexte("");
      };

      return React.createElement("div", { className: "flex flex-col h-full min-h-0" },
        React.createElement("p", { className: "text-[11px] mb-3 flex-shrink-0", style: { color: COLORS.textFaint } }, "Chat public IUT FV Bandjoun, visible par tous, contrairement aux votes."),
        React.createElement("div", { className: "flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1 sabi-liste-animee" },
          messages.length === 0
            ? React.createElement(EmptyState, { icon: "message-circle", text: "Aucun message pour l'instant. Lance la discussion." })
            : messages.map(m => React.createElement("div", { key: m.id, className: "rounded-lg px-3 py-2 max-w-[85%]", style: { backgroundColor: m.pseudo === pseudo ? "rgba(var(--accent-rgb),0.15)" : COLORS.surface, alignSelf: m.pseudo === pseudo ? "flex-end" : "flex-start" } },
                React.createElement("p", { className: "text-[10px] font-mono mb-0.5 flex items-center gap-1", style: { color: COLORS.textMuted } }, m.badge && React.createElement(Icon, { name: BADGES.find(b => b.id === m.badge)?.emoji, size: 11 }), m.pseudo),
                React.createElement("p", { className: "text-sm", style: { color: COLORS.text } }, m.texte)
              )),
          React.createElement("div", { ref: bottomRef })
        ),
        // Barre de saisie fixe en bas — vraie mise en page flex, plus jamais besoin de dérouler la page pour la voir
        React.createElement("div", {
          className: "flex-shrink-0 flex gap-2 pt-3 mt-1",
          style: { backgroundColor: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }
        },
          React.createElement("input", {
            value: texte,
            onChange: e => setTexte(e.target.value),
            onKeyDown: e => { if (e.key === "Enter") handleSend(); },
            placeholder: "Écris un message...",
            className: "flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border",
            style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
          }),
          React.createElement("button", { onClick: handleSend, disabled: texte.trim().length === 0, className: "flex-shrink-0 px-4 rounded-lg text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, React.createElement(Icon, {name:"send", size:16}))
        )
      );
    }
