// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { Icon } from "./Icon.js";
import { COLORS } from "../theme.js";

    // Paywall générique — affiché quand une fonctionnalité nécessite un abonnement Pro/Pro+
    export function PaywallSabiPro({ setTab, palierRequis }) {
      return React.createElement("div", { className: "flex flex-col items-center gap-3 py-16 text-center px-4" },
        React.createElement(Icon, { name: "lock", size: 36, color: COLORS.textGhost }),
        React.createElement("p", { className: "text-base font-semibold", style: { color: COLORS.text } }, palierRequis === "proplus" ? "Réservé à Sabi Pro+" : "Réservé à Sabi Pro"),
        React.createElement("p", { className: "text-sm max-w-[260px]", style: { color: COLORS.textMuted } }, "Débloque les épreuves, corrections et bien plus en passant à Sabi Pro."),
        React.createElement("button", { onClick: () => setTab("boutique"), className: "mt-2 rounded-full px-5 py-2 text-sm font-semibold", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, "Voir les abonnements")
      );
    }
