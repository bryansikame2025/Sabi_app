// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { THEMES_PLUS, DEFAULT_FX, ORDRE_THEMES } from "./themes.js";

    // ========== THÈME — reflète les variables CSS de :root ==========
    // Un seul endroit à modifier pour changer une couleur dans toute l'app
    // (avant : chaque composant réécrivait le hex en dur, des centaines de fois).
    export const COLORS = {
      // "Nocturne" : encre sombre à reflets violets, accent lavande lumineux (verre dépoli + néomorphisme).
      bg: "#0b0a12",
      surface: "#14121f",
      surface2: "#1a1728",
      border: "#2b2742",
      borderStrong: "#4b4570",
      text: "#eeebfa",
      textMuted: "#bdb7d9",
      textFaint: "#8f89b0",
      textGhost: "#3a3558",
      gold: "#a99bff",      // nom conservé (utilisé partout) : c'est maintenant l'accent lavande
      goldInk: "#0b0a12",
      forest: "#6ee7a8",
      terra: "#ff8f9e",
      alerte: "#fb923c",
      forestText: "#6ee7a8",
      terraText: "#ff9aa8",
    };

    // ===== Thème clair / sombre =====
    // COLORS est un objet muté en place (plutôt que remplacé) : comme tous les composants lisent
    // COLORS.xxx au moment du rendu (et non une valeur figée à l'import), il suffit de réécrire ses
    // propriétés puis de forcer un re-rendu de l'app (voir themeVersion dans App) pour que tout
    // l'habillage change instantanément, sans avoir à faire transiter un thème en props partout.
    const THEME_SOMBRE = { ...COLORS };
    const THEME_CLAIR = {
      bg: "#e9e7f3",
      surface: "#f3f1fa",
      surface2: "#e0ddef",
      border: "#d0cce4",
      borderStrong: "#9791bb",
      text: "#1d1a2e",
      textMuted: "#4b4668",
      textFaint: "#625d86",
      textGhost: "#d0cce4",
      gold: "#5b3fd6",
      goldInk: "#ffffff",
      forest: "#15803d",
      terra: "#c0392b",
      forestText: "#166534",
      terraText: "#b4232a",
    };
    // Variables CSS propres à chaque thème (ombres néomorphiques, verre dépoli, aurore du fond).
    const VARS_THEME = {
      sombre: {
        "--accent-rgb": "169,155,255",
        "--accent-grad": "linear-gradient(135deg, #c9c0ff 0%, #a99bff 50%, #8d78ff 100%)",
        "--glass-bg": "rgba(26,23,44,0.62)",
        "--glass-border": "rgba(255,255,255,0.09)",
        "--field-bg": "rgba(255,255,255,0.05)",
        "--sh-dark": "rgba(0,0,0,0.55)",
        "--sh-light": "rgba(140,120,255,0.055)",
        "--hl": "rgba(255,255,255,0.055)",
        "--aurora-1": "rgba(124,92,240,0.20)",
        "--aurora-2": "rgba(59,130,246,0.10)",
        "--aurora-3": "rgba(236,72,153,0.07)",
      },
      clair: {
        "--accent-rgb": "91,63,214",
        "--accent-grad": "linear-gradient(135deg, #7a5ff2 0%, #5b3fd6 55%, #4a2fc0 100%)",
        "--glass-bg": "rgba(255,255,255,0.62)",
        "--glass-border": "rgba(255,255,255,0.85)",
        "--field-bg": "rgba(255,255,255,0.65)",
        "--sh-dark": "rgba(143,133,186,0.42)",
        "--sh-light": "rgba(255,255,255,0.95)",
        "--hl": "rgba(255,255,255,0.7)",
        "--aurora-1": "rgba(124,92,240,0.16)",
        "--aurora-2": "rgba(59,130,246,0.10)",
        "--aurora-3": "rgba(236,72,153,0.08)",
      },
    };
    // ===== Registre des thèmes (Sombre / Clair existants + thèmes supplémentaires de themes.js) =====
    const FX_SOMBRE = { muted: "#8f89b0", sheen: "rgba(255,255,255,.04)", "glow-a": "rgba(169,155,255,.16)", "glow-b": "rgba(59,130,246,.10)", shadow: "0 1px 0 rgba(255,255,255,.05) inset, 0 10px 28px -14px rgba(0,0,0,.7)" };
    const FX_CLAIR = { muted: "#625d86", sheen: "transparent", "glow-a": "rgba(91,63,214,.10)", "glow-b": "rgba(59,130,246,.08)", shadow: "0 1px 2px rgba(80,70,140,.08), 0 10px 22px -12px rgba(80,70,140,.25)" };
    export const THEMES = {
      sombre: { label: "Sombre", clair: false, apercu: ["#0b0a12", "#14121f", "#a99bff"], colors: THEME_SOMBRE, fx: FX_SOMBRE },
      clair: { label: "Clair", clair: true, apercu: ["#e9e7f3", "#f3f1fa", "#5b3fd6"], colors: THEME_CLAIR, fx: FX_CLAIR },
      ...THEMES_PLUS,
    };
    export { ORDRE_THEMES };
    export const estThemeClair = (id) => !!(THEMES[id] && THEMES[id].clair);
    function rgbDe(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(","); }

    export let themeActuel = "sombre";
    try { const t = localStorage.getItem("sabi_theme"); themeActuel = THEMES[t] ? t : "sombre"; } catch {}
    export function appliquerTheme(id) {
      const t = THEMES[id] || THEMES.sombre; id = THEMES[id] ? id : "sombre";
      const base = t.clair ? "clair" : "sombre";          // « famille » : pilote les règles [data-theme="clair"] de sabi.css
      Object.assign(COLORS, t.colors);
      themeActuel = id;
      try { localStorage.setItem("sabi_theme", id); } catch {}
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", COLORS.bg);
      // Les variables --bg/--text/... pilotent le fond du <body> (visible en overscroll ou
      // sous l'encoche) — on les garde synchronisées avec l'objet COLORS utilisé par React.
      const html = document.documentElement, root = html.style;
      root.setProperty("--bg", COLORS.bg);
      root.setProperty("--surface", COLORS.surface);
      root.setProperty("--border", COLORS.border);
      root.setProperty("--text", COLORS.text);
      root.setProperty("--gold", COLORS.gold);
      root.setProperty("--surface-2", COLORS.surface2);
      root.setProperty("--border-strong", COLORS.borderStrong);
      root.setProperty("--text-muted", COLORS.textMuted);
      root.setProperty("--text-faint", COLORS.textFaint);
      const vars = { ...VARS_THEME[base] };
      const fx = { ...DEFAULT_FX, ...t.fx };
      if (THEMES_PLUS[id]) {                               // thèmes supplémentaires : accent et aurore du fond propres au thème
        const g = COLORS.gold;
        vars["--accent-rgb"] = rgbDe(g);
        vars["--accent-grad"] = `linear-gradient(135deg, color-mix(in srgb, ${g} 78%, white) 0%, ${g} 55%, color-mix(in srgb, ${g} 78%, black) 100%)`;
        if (fx["blob-a"] !== "transparent") { vars["--aurora-1"] = fx["blob-a"]; vars["--aurora-2"] = fx["blob-b"]; vars["--aurora-3"] = fx["blob-c"]; }
      }
      Object.keys(vars).forEach(k => root.setProperty(k, vars[k]));
      html.setAttribute("data-theme", base);
      html.setAttribute("data-skin", id);                  // identifiant exact du thème (décors de accueil.css)
      html.setAttribute("data-hero", t.hero || "carte");   // « anneau » : héros « Score Actuel » de l'Accueil
      if (t.glass) html.setAttribute("data-glass", "1"); else html.removeAttribute("data-glass");
      html.style.colorScheme = t.clair ? "light" : "dark";
      // Variables --hm-* (Accueil) : valeurs par défaut + surcharges du thème
      root.setProperty("--hm-bg", COLORS.bg); root.setProperty("--hm-surface", COLORS.surface); root.setProperty("--hm-surface-2", COLORS.surface2);
      root.setProperty("--hm-border", COLORS.border); root.setProperty("--hm-text", COLORS.text);
      root.setProperty("--hm-accent", COLORS.gold); root.setProperty("--hm-accent-ink", COLORS.goldInk);
      root.setProperty("--hm-accent-rgb", rgbDe(COLORS.gold).replace(/,/g, " ")); root.setProperty("--hm-ok", COLORS.forestText);
      for (const k in fx) root.setProperty("--hm-" + k, fx[k]);
    }
    appliquerTheme(themeActuel);
