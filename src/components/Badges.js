// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { COLORS } from "../theme.js";

    export function GriotRing({ points, size = 44 }) {
      const max = 5000;
      const pct = Math.min(points / max, 1);
      const r = (size - 6) / 2;
      const c = 2 * Math.PI * r;
      const tier = points >= 5000 ? { label: "Griot Suprême", color: COLORS.gold } : points >= 1000 ? { label: "Ancien de l'IUT", color: COLORS.terraText } : points >= 100 ? { label: "Junior de l'IUT", color: COLORS.forestText } : { label: "Nouveau", color: COLORS.textFaint };

      return React.createElement(
        "div",
        { className: "relative flex-shrink-0", style: { width: size, height: size } },
        React.createElement("svg", { width: size, height: size, style: { transform: "rotate(-90deg)" } },
          React.createElement("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: COLORS.border, strokeWidth: "4" }),
          React.createElement("circle", { cx: size / 2, cy: size / 2, r: r, fill: "none", stroke: tier.color, strokeWidth: "4", strokeDasharray: c, strokeDashoffset: c - pct * c, strokeLinecap: "round", style: { transition: "stroke-dashoffset 0.6s ease" } })
        ),
        React.createElement("div", { className: "absolute inset-0 flex items-center justify-center" },
          React.createElement("span", { className: "font-mono text-[9px] font-semibold", style: { color: tier.color } }, points)
        )
      );
    }

    export function TierBadge({ points }) {
      const tier = points >= 5000 ? { label: "Griot Suprême", color: COLORS.gold, bg: "rgba(var(--accent-rgb),0.12)" } : points >= 1000 ? { label: "Ancien de l'IUT", color: COLORS.terraText, bg: "rgba(255,180,171,0.12)" } : points >= 100 ? { label: "Junior de l'IUT", color: COLORS.forestText, bg: "rgba(119,221,106,0.15)" } : { label: "Nouveau", color: COLORS.textMuted, bg: "rgba(139,147,168,0.12)" };
      return React.createElement("span", { className: "text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full", style: { color: tier.color, backgroundColor: tier.bg } }, tier.label);
    }
