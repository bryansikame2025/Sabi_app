// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import { Icon } from "./Icon.js";
import { GUIDE_SECTIONS } from "../data/guide.js";
import { COLORS } from "../theme.js";

    function GuideBloc({ bloc }) {
      if (bloc.type === "p") {
        return React.createElement("p", { className: "text-sm leading-relaxed", style: { color: COLORS.textMuted } }, bloc.texte);
      }
      if (bloc.type === "sous-titre") {
        return React.createElement("p", { className: "text-[10px] font-mono uppercase mt-1", style: { color: COLORS.textFaint, letterSpacing: "0.08em" } }, bloc.texte);
      }
      if (bloc.type === "list") {
        return React.createElement("ul", { className: "flex flex-col gap-1.5" },
          bloc.items.map((it, i) => React.createElement("li", {
            key: i, className: "text-sm leading-relaxed flex gap-2", style: { color: COLORS.textMuted }
          },
            React.createElement("span", { style: { color: COLORS.gold, flexShrink: 0 } }, "•"),
            React.createElement("span", null, it)
          ))
        );
      }
      return null;
    }

    function GuideSection({ section, ouverte, onToggle }) {
      return React.createElement("div", {
        className: "rounded-lg overflow-hidden", style: { border: `1px solid ${COLORS.border}` }
      },
        React.createElement("button", {
          onClick: onToggle,
          className: "w-full flex items-center justify-between gap-2.5 p-3.5 text-left",
          style: { backgroundColor: COLORS.surface2 }
        },
          React.createElement("div", { className: "flex items-center gap-2.5 min-w-0" },
            React.createElement(Icon, { name: section.icone, size: 16, color: COLORS.gold }),
            React.createElement("span", { className: "text-sm font-medium truncate", style: { color: COLORS.text } }, section.titre)
          ),
          React.createElement(Icon, {
            name: "chevron-down", size: 15, color: COLORS.textFaint,
            style: { flexShrink: 0, transition: "transform 0.15s", transform: ouverte ? "rotate(180deg)" : "rotate(0deg)" }
          })
        ),
        ouverte && React.createElement("div", { className: "flex flex-col gap-2.5 p-3.5 pt-0.5" },
          section.blocs.map((bloc, i) => React.createElement(GuideBloc, { key: i, bloc }))
        )
      );
    }

    export function GuideModal({ ouvert, onFermer }) {
      const [sectionOuverte, setSectionOuverte] = useState(0);
      if (!ouvert) return null;
      return React.createElement("div", {
        className: "fixed inset-0 z-[200] flex items-end sm:items-center justify-center",
        style: { backgroundColor: "rgba(0,0,0,0.6)" },
        onClick: onFermer
      },
        React.createElement("div", {
          className: "w-full max-w-md rounded-t-2xl sm:rounded-lg p-5 flex flex-col gap-4 max-h-[88vh] overflow-y-auto",
          style: { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` },
          onClick: e => e.stopPropagation()
        },
          React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement(Icon, { name: "book-open", size: 18, color: COLORS.gold }),
              React.createElement("div", null,
                React.createElement("p", { className: "text-base font-semibold", style: { color: COLORS.text } }, "Guide d'utilisation"),
                React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Sabi. IUT FV Bandjoun")
              )
            ),
            React.createElement("button", { onClick: onFermer, "aria-label": "Fermer" }, React.createElement(Icon, { name: "x", size: 18, color: COLORS.textMuted }))
          ),
          React.createElement("div", { className: "flex flex-col gap-2" },
            GUIDE_SECTIONS.map((section, i) => React.createElement(GuideSection, {
              key: i, section, ouverte: sectionOuverte === i,
              onToggle: () => setSectionOuverte(sectionOuverte === i ? -1 : i)
            }))
          )
        )
      );
    }
