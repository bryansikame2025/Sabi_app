// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { EmptyState } from "../components/MenuLateral.js";
import { supportRef, usersRef } from "../firebase.js";
import { COLORS } from "../theme.js";

    // Côté propriétaire : tableau de bord listant chaque étudiant ayant ouvert un fil, avec un
    // badge du nombre de messages non lus, puis vue détail (même look que le chat) pour répondre.
    export function SupportAdminTab({ isOwner }) {
      const [threads, setThreads] = useState({}); // { uid: { messages: [...] } }
      const [pseudos, setPseudos] = useState({}); // uid -> pseudo
      const [uidActif, setUidActif] = useState(null);
      const [reponse, setReponse] = useState("");
      const bottomRef = React.useRef(null);

      useEffect(() => {
        if (!isOwner) return;
        const listener = supportRef.on("value", snapshot => {
          const data = snapshot.val() || {};
          const parsed = {};
          Object.keys(data).forEach(uid => {
            parsed[uid] = Object.keys(data[uid]).map(msgId => ({ id: msgId, ...data[uid][msgId] }));
          });
          setThreads(parsed);
        });
        // Une seule lecture ponctuelle de "users" pour afficher les pseudos — pas d'écoute permanente.
        usersRef.once("value").then(snapshot => {
          const data = snapshot.val() || {};
          const map = {};
          Object.keys(data).forEach(uid => { map[uid] = data[uid].pseudo || "Étudiant"; });
          setPseudos(map);
        });
        return () => supportRef.off("value", listener);
      }, [isOwner]);

      useEffect(() => {
        if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
      }, [uidActif, (threads[uidActif] || []).length]);

      const listeUids = Object.keys(threads).sort((a, b) => {
        const dernierA = Math.max(0, ...threads[a].map(m => m.timestamp || 0));
        const dernierB = Math.max(0, ...threads[b].map(m => m.timestamp || 0));
        return dernierB - dernierA;
      });

      const nonLusPour = uid => threads[uid].filter(m => m.auteur === "etudiant" && !m.lu).length;

      const ouvrirFil = uid => {
        setUidActif(uid);
        // Marque comme lus les messages de l'étudiant dès l'ouverture du fil.
        threads[uid].filter(m => m.auteur === "etudiant" && !m.lu).forEach(m => {
          supportRef.child(uid).child(m.id).child("lu").set(true);
        });
      };

      const envoyerReponse = () => {
        if (reponse.trim().length === 0 || !uidActif) return;
        supportRef.child(uidActif).push({ auteur: "proprietaire", texte: reponse.trim(), timestamp: Date.now(), lu: false });
        setReponse("");
      };

      if (!isOwner) return null;

      if (uidActif) {
        const messages = (threads[uidActif] || []).slice().sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
        return React.createElement("div", { className: "flex flex-col h-full min-h-0" },
          React.createElement("button", { onClick: () => setUidActif(null), className: "flex items-center gap-1 text-xs font-mono mb-2 flex-shrink-0", style: { color: COLORS.textMuted } }, React.createElement(Icon, { name: "arrow-left", size: 14 }), " Retour à la liste"),
          React.createElement("p", { className: "text-sm font-semibold mb-2 flex-shrink-0", style: { color: COLORS.text } }, pseudos[uidActif] || "Étudiant"),
          React.createElement("div", { className: "flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1" },
            messages.map(m => React.createElement("div", {
              key: m.id, className: "rounded-lg px-3 py-2 max-w-[85%]",
              style: { backgroundColor: m.auteur === "proprietaire" ? "rgba(var(--accent-rgb),0.15)" : COLORS.surface, alignSelf: m.auteur === "proprietaire" ? "flex-end" : "flex-start" }
            },
              React.createElement("p", { className: "text-[10px] font-mono mb-0.5", style: { color: COLORS.textMuted } }, m.auteur === "proprietaire" ? "Toi" : (pseudos[uidActif] || "Étudiant")),
              React.createElement("p", { className: "text-sm whitespace-pre-wrap", style: { color: COLORS.text } }, m.texte)
            )),
            React.createElement("div", { ref: bottomRef })
          ),
          React.createElement("div", { className: "flex-shrink-0 flex gap-2 pt-3 mt-1", style: { backgroundColor: COLORS.bg, borderTop: `1px solid ${COLORS.border}` } },
            React.createElement("input", {
              value: reponse, onChange: e => setReponse(e.target.value), onKeyDown: e => { if (e.key === "Enter") envoyerReponse(); },
              placeholder: "Répondre...", className: "flex-1 min-w-0 rounded-lg px-3 py-2 text-sm outline-none border",
              style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
            }),
            React.createElement("button", { onClick: envoyerReponse, disabled: reponse.trim().length === 0, className: "flex-shrink-0 px-4 rounded-lg text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, React.createElement(Icon, { name: "send", size: 16 }))
          )
        );
      }

      return React.createElement("div", { className: "flex flex-col gap-2" },
        React.createElement("p", { className: "text-xs mb-1", style: { color: COLORS.textMuted } }, "Messages reçus, classés par dernière activité."),
        listeUids.length === 0
          ? React.createElement(EmptyState, { icon: "help-circle", text: "Aucun message pour l'instant." })
          : listeUids.map(uid => React.createElement("button", {
              key: uid, onClick: () => ouvrirFil(uid),
              className: "rounded-lg border p-3.5 flex items-center gap-3 text-left",
              style: { borderColor: COLORS.border, backgroundColor: COLORS.surface }
            },
              React.createElement("div", { className: "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", style: { backgroundColor: "rgba(var(--accent-rgb),0.15)" } },
                React.createElement(Icon, { name: "help-circle", size: 16, color: COLORS.gold })
              ),
              React.createElement("span", { className: "text-sm flex-1 truncate", style: { color: COLORS.text } }, pseudos[uid] || "Étudiant"),
              nonLusPour(uid) > 0 && React.createElement("span", { className: "text-[10px] font-mono px-2 py-0.5 rounded-full flex-shrink-0", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, nonLusPour(uid)),
              React.createElement("span", { style: { color: COLORS.textFaint } }, "›")
            ))
      );
    }
