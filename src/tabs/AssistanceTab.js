// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { EmptyState } from "../components/MenuLateral.js";
import { COLORS } from "../theme.js";

    // ===== Assistance — chat privé étudiant <-> propriétaire =====
    // Côté étudiant : ne voit que sa propre conversation (support/{authUid}). À l'ouverture,
    // on marque comme lues les réponses du propriétaire pour faire retomber l'indicateur côté admin.
    export function AssistanceTab({ messages, onSend, onMarkLu }) {
      const [texte, setTexte] = useState("");
      const bottomRef = React.useRef(null);

      useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }, [messages.length]);

      // Marque comme lues les réponses du propriétaire non encore vues, dès l'ouverture de l'onglet.
      useEffect(() => {
        const nonLues = messages.filter(m => m.auteur === "proprietaire" && !m.lu);
        if (nonLues.length > 0) onMarkLu(nonLues.map(m => m.id));
        // eslint-disable-next-line
      }, [messages.length]);

      const handleSend = () => {
        if (texte.trim().length === 0) return;
        onSend(texte.trim());
        setTexte("");
      };

      return React.createElement("div", { className: "flex flex-col h-full min-h-0" },
        React.createElement("p", { className: "text-[11px] mb-3 flex-shrink-0", style: { color: COLORS.textFaint } }, "Échange privé et confidentiel avec le propriétaire de Sabi, lui seul voit ce fil."),
        React.createElement("div", { className: "flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1" },
          messages.length === 0
            ? React.createElement(EmptyState, { icon: "help-circle", text: "Une question, un bug, une suggestion ? Écris ton message ci-dessous." })
            : messages.slice().sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)).map(m => React.createElement("div", {
                key: m.id, className: "rounded-lg px-3 py-2 max-w-[85%]",
                style: { backgroundColor: m.auteur === "etudiant" ? "rgba(var(--accent-rgb),0.15)" : COLORS.surface, alignSelf: m.auteur === "etudiant" ? "flex-end" : "flex-start" }
              },
                React.createElement("p", { className: "text-[10px] font-mono mb-0.5", style: { color: COLORS.textMuted } }, m.auteur === "etudiant" ? "Toi" : "Propriétaire"),
                React.createElement("p", { className: "text-sm whitespace-pre-wrap", style: { color: COLORS.text } }, m.texte)
              )),
          React.createElement("div", { ref: bottomRef })
        ),
        React.createElement("div", {
          className: "flex-shrink-0 flex gap-2 pt-3 mt-1",
          style: { backgroundColor: COLORS.bg, borderTop: `1px solid ${COLORS.border}` }
        },
          React.createElement("input", {
            value: texte,
            onChange: e => setTexte(e.target.value),
            onKeyDown: e => { if (e.key === "Enter") handleSend(); },
            placeholder: "Écris ton message...",
            className: "flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border",
            style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
          }),
          React.createElement("button", { onClick: handleSend, disabled: texte.trim().length === 0, className: "flex-shrink-0 px-4 rounded-lg text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, React.createElement(Icon, { name: "send", size: 16 }))
        )
      );
    }
