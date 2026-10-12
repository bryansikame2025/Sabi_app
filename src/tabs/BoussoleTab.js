// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import { Icon } from "../components/Icon.js";
import { CATEGORIES_BOUSSOLE } from "../config/constantes.js";
import { COLORS } from "../theme.js";

    export function BoussoleTab({ steps, progress, onToggle, onAddStep }) {
      const [showForm, setShowForm] = useState(false);
      const [titre, setTitre] = useState("");
      const [categorie, setCategorie] = useState(CATEGORIES_BOUSSOLE[0]);
      const [description, setDescription] = useState("");

      const sorted = [...steps].sort((a, b) => (a.ordre || 99) - (b.ordre || 99));
      const total = sorted.length;
      const done = sorted.filter(s => progress[s.id]).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      const handleAdd = () => {
        if (titre.trim().length < 5) return;
        onAddStep({ titre: titre.trim(), categorie, description: description.trim() });
        setTitre("");
        setDescription("");
        setShowForm(false);
      };

      const grouped = CATEGORIES_BOUSSOLE.map(cat => ({
        cat,
        items: sorted.filter(s => s.categorie === cat),
      })).filter(g => g.items.length > 0);

      return React.createElement("div", { className: "flex flex-col gap-4" },
        React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Boussole"),
        React.createElement("div", { className: "rounded-lg p-4 border", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("div", { className: "flex items-center justify-between mb-2" },
            React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Ta progression"),
            React.createElement("p", { className: "font-mono text-sm font-semibold", style: { color: COLORS.gold } }, pct + "%")
          ),
          React.createElement("div", { className: "w-full h-2 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
            React.createElement("div", { className: "h-full rounded-full transition-all", style: { width: pct + "%", backgroundColor: COLORS.gold } })
          ),
          React.createElement("p", { className: "text-[11px] mt-2", style: { color: COLORS.textFaint } }, done + " étapes sur " + total + " complétées")
        ),
        React.createElement("div", { className: "flex flex-col gap-4" },
          grouped.map(g => React.createElement("div", { key: g.cat },
            React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mb-2", style: { color: COLORS.textMuted } }, g.cat),
            React.createElement("div", { className: "flex flex-col gap-2" },
              g.items.map(step => {
                const checked = !!progress[step.id];
                return React.createElement("button", {
                  key: step.id,
                  onClick: () => onToggle(step.id),
                  className: "w-full text-left rounded-lg border p-3 flex items-start gap-3 transition-colors",
                  style: { borderColor: checked ? COLORS.forest : COLORS.border, backgroundColor: checked ? "rgba(119,221,106,0.1)" : COLORS.surface }
                },
                  checked
                    ? React.createElement(Icon, { name: "check-square", size: 19, color: COLORS.forestText })
                    : React.createElement(Icon, { name: "square", size: 19, color: COLORS.textGhost }),
                  React.createElement("div", { className: "flex-1 min-w-0" },
                    React.createElement("p", { className: "text-sm font-medium", style: { color: checked ? COLORS.forestText : COLORS.text, textDecoration: checked ? "line-through" : "none" } }, step.titre),
                    step.description && React.createElement("p", { className: "text-xs mt-0.5", style: { color: COLORS.textFaint } }, step.description)
                  )
                );
              })
            )
          ))
        ),
        !showForm
          ? React.createElement("button", { onClick: () => setShowForm(true), className: "flex items-center justify-center gap-2 text-sm font-mono py-2.5 rounded-lg border border-dashed", style: { borderColor: COLORS.border, color: COLORS.textMuted } }, "+ Ajouter une étape (pour les anciens)")
          : React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("input", { value: titre, onChange: e => setTitre(e.target.value), placeholder: "Titre de l'étape", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("select", { value: categorie, onChange: e => setCategorie(e.target.value), className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } },
                CATEGORIES_BOUSSOLE.map(c => React.createElement("option", { key: c }, c))
              ),
              React.createElement("textarea", { value: description, onChange: e => setDescription(e.target.value), placeholder: "Détail utile (optionnel)", rows: 2, className: "w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("div", { className: "flex gap-2" },
                React.createElement("button", { onClick: handleAdd, disabled: titre.trim().length < 5, className: "flex-1 rounded-lg py-2 text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, "Ajouter"),
                React.createElement("button", { onClick: () => setShowForm(false), className: "px-4 rounded-lg py-2 text-sm", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
              )
            )
      );
    }
