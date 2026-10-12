// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "./Icon.js";
import { BulleNotif, ToggleSwitch } from "./widgets.js";
import { LOGO_SABI } from "../config/constantes.js";
import { jouerSon, sonsActifs } from "../lib/effets.js";
import { COLORS, estThemeClair } from "../theme.js";
import { ThemePicker } from "./ThemePicker.jsx";

    // Menu hamburger — tiroir latéral qui ne recouvre qu'une partie de l'écran (le reste reste
    // visible, assombri, et cliquable pour fermer). Regroupe Paramètres, Assistance et Crédits.
    export function MenuLateral({ ouvert, onFermer, themeMode, onToggleTheme, onChoisirTheme, notifsActives, onToggleNotifs, onOuvrirAssistance, onOuvrirCredits, onOuvrirGuide }) {
      const [sonsOn, setSonsOn] = useState(() => sonsActifs());
      return React.createElement("div", {
        className: "fixed inset-0 z-[150] transition-opacity",
        style: { pointerEvents: ouvert ? "auto" : "none", opacity: ouvert ? 1 : 0 }
      },
        React.createElement("div", {
          className: "absolute inset-0",
          style: { backgroundColor: "rgba(0,0,0,0.55)" },
          onClick: onFermer
        }),
        React.createElement("div", {
          className: "absolute top-0 left-0 bottom-0 flex flex-col gap-5 p-5 overflow-y-auto transition-transform",
          style: {
            width: "78%", maxWidth: 320,
            backgroundColor: COLORS.bg, borderRight: `1px solid ${COLORS.border}`,
            transform: ouvert ? "translateX(0)" : "translateX(-100%)"
          }
        },
          React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("div", { className: "flex items-center gap-2.5" },
              React.createElement("img", { src: LOGO_SABI, alt: "Sabi", className: "h-9 w-auto" }),
              React.createElement("div", null,
                React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, "Sabi"),
                React.createElement("p", { className: "text-[9px] font-mono uppercase", style: { color: COLORS.textFaint, letterSpacing: "0.08em" } }, "IUT FV Bandjoun")
              )
            ),
            React.createElement("button", { onClick: onFermer, "aria-label": "Fermer le menu" }, React.createElement(Icon, { name: "x", size: 18, color: COLORS.textMuted }))
          ),
          React.createElement("div", { style: { borderTop: `1px solid ${COLORS.border}` } }),

          React.createElement("div", { className: "flex flex-col gap-3" },
            React.createElement("p", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textFaint, letterSpacing: "0.08em" } }, "Paramètres"),
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("div", { className: "flex items-center gap-2.5" },
                React.createElement(Icon, { name: estThemeClair(themeMode) ? "sun" : "moon", size: 16, color: COLORS.textMuted }),
                React.createElement("span", { className: "text-sm", style: { color: COLORS.text } }, "Mode clair")
              ),
              React.createElement(ToggleSwitch, { actif: estThemeClair(themeMode), onChange: onToggleTheme, label: "Mode clair" })
            ),
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("div", { className: "flex items-center gap-2.5" },
                React.createElement(Icon, { name: "bell", size: 16, color: COLORS.textMuted }),
                React.createElement("span", { className: "text-sm", style: { color: COLORS.text } }, "Notifications")
              ),
              React.createElement(ToggleSwitch, { actif: notifsActives, onChange: onToggleNotifs, label: "Notifications" })
            ),
            React.createElement("div", { className: "flex flex-col gap-3 pt-1" },
              React.createElement("div", { className: "flex items-center gap-2.5" },
                React.createElement(Icon, { name: "sparkles", size: 16, color: COLORS.textMuted }),
                React.createElement("span", { className: "text-sm", style: { color: COLORS.text } }, "Thèmes")
              ),
              React.createElement(ThemePicker, { themeId: themeMode, onChoisir: onChoisirTheme })
            ),
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("div", { className: "flex items-center gap-2.5" },
                React.createElement(Icon, { name: "radio", size: 16, color: COLORS.textMuted }),
                React.createElement("span", { className: "text-sm", style: { color: COLORS.text } }, "Sons")
              ),
              React.createElement(ToggleSwitch, { actif: sonsOn, onChange: () => { const v = !sonsOn; setSonsOn(v); try { localStorage.setItem("sabi_sons", v ? "on" : "off"); } catch {} if (v) jouerSon("ding"); }, label: "Sons" })
            )
          ),

          React.createElement("div", { style: { borderTop: `1px solid ${COLORS.border}` } }),

          React.createElement("div", { className: "flex flex-col gap-1" },
            React.createElement("button", {
              onClick: () => { onOuvrirAssistance(); onFermer(); },
              className: "flex items-center gap-2.5 py-2.5 text-sm text-left", style: { color: COLORS.text }
            }, React.createElement(Icon, { name: "help-circle", size: 16, color: COLORS.textMuted }), "Assistance"),
            React.createElement("button", {
              onClick: () => { onOuvrirGuide(); onFermer(); },
              className: "flex items-center gap-2.5 py-2.5 text-sm text-left", style: { color: COLORS.text }
            }, React.createElement(Icon, { name: "book-open", size: 16, color: COLORS.textMuted }), "Guide d'utilisation"),
            React.createElement("button", {
              onClick: onOuvrirCredits,
              className: "flex items-center gap-2.5 py-2.5 text-sm text-left", style: { color: COLORS.text }
            }, React.createElement(Icon, { name: "info", size: 16, color: COLORS.textMuted }), "Crédits")
          )
        )
      );
    }

    export function EmpileNotifs() {
      const [notifs, setNotifs] = useState([]);
      useEffect(() => {
        const handler = (e) => {
          const id = Date.now() + "_" + Math.random().toString(36).slice(2);
          setNotifs(prev => [...prev.slice(-2), { id, ...e.detail }]); // max 3 bulles visibles à la fois
        };
        window.addEventListener("sabi-notif", handler);
        return () => window.removeEventListener("sabi-notif", handler);
      }, []);
      const retirer = (id) => setNotifs(prev => prev.filter(n => n.id !== id));
      if (notifs.length === 0) return null;
      return React.createElement("div", {
        className: "fixed top-3 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none"
      }, notifs.map(n => React.createElement(BulleNotif, { key: n.id, notif: n, onFermer: () => retirer(n.id) })));
    }

    export function EmptyState({ icon, text }) {
      return React.createElement("div", { className: "flex flex-col items-center gap-3 py-14 text-center" },
        React.createElement(Icon, { name: icon, size: 30, color: COLORS.textFaint, style: { opacity: 0.6 } }),
        React.createElement("p", { className: "text-sm max-w-[240px]", style: { color: COLORS.textFaint } }, text)
      );
    }

    // ===== Petits composants réutilisables, style "assistant d'inscription" (écrans successifs) =====

    // Champ avec label flottant : le label remonte au-dessus dès que le champ a une valeur ou le focus
    export function ChampFlottant({ label, value, onChange, type = "text", rightSlot, autoFocus }) {
      const [focus, setFocus] = useState(false);
      const flotte = focus || (value && value.length > 0);
      // Champ "verre" : fond translucide, contour fin, halo lavande à la sélection (cf. maquette de connexion).
      return React.createElement("div", {
        className: "relative w-full border px-4 pt-2",
        style: {
          borderRadius: 16, minHeight: 58, backgroundColor: "var(--field-bg)",
          borderColor: focus ? COLORS.gold : "var(--glass-border)",
          boxShadow: focus ? "0 0 0 3px rgba(var(--accent-rgb),0.18)" : "none"
        }
      },
        React.createElement("label", {
          className: "absolute left-4 transition-all pointer-events-none",
          style: {
            top: flotte ? 8 : 18,
            fontSize: flotte ? 10 : 14,
            color: flotte ? COLORS.gold : COLORS.textFaint,
            fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
            fontWeight: flotte ? 600 : 400,
            letterSpacing: flotte ? "0.04em" : "0"
          }
        }, label),
        React.createElement("input", {
          value: value, onChange: onChange, type: type, autoFocus: autoFocus,
          onFocus: () => setFocus(true), onBlur: () => setFocus(false),
          className: "w-full bg-transparent outline-none text-sm pb-2",
          style: { color: COLORS.text, paddingTop: flotte ? 16 : 8, paddingRight: rightSlot ? 32 : 0, boxShadow: "none" }
        }),
        rightSlot && React.createElement("div", { className: "absolute right-3 top-0 h-full flex items-center" }, rightSlot)
      );
    }
