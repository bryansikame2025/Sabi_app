// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { Icon } from "./Icon.js";
import { LOGO_SABI_WORDMARK } from "../config/constantes.js";
import { duelsRef, usersRef } from "../firebase.js";
import { celebrer, haptique, jouerSon, jourCle } from "../lib/effets.js";
import { basculerCarnet, chargerCarnet, chargerMesDuels } from "../lib/stockage.js";
import { COLORS } from "../theme.js";

    export function SuiviDuels({ authUid }) {
      const [codes] = useState(() => chargerMesDuels());
      const [duels, setDuels] = useState({});
      useEffect(() => {
        const refs = codes.map(c => duelsRef.child(c));
        const ecouteurs = refs.map((r, i) => r.on("value", snap => setDuels(d => ({ ...d, [codes[i]]: snap.val() })), () => {}));
        return () => refs.forEach((r, i) => r.off("value", ecouteurs[i]));
      }, [codes]);
      const visibles = codes.filter(c => duels[c]);
      if (visibles.length === 0) return null;
      return React.createElement("div", { className: "flex flex-col gap-2 mt-3" },
        React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textFaint } }, "Mes duels"),
        visibles.slice(0, 5).map(c => {
          const d = duels[c];
          const joueurs = Object.values(d.joueurs || {});
          return React.createElement("div", { key: c, className: "rounded-lg border p-3 flex flex-col gap-1.5", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("p", { className: "text-xs font-semibold", style: { color: COLORS.text } }, (d.sujet || "Quiz") + " · " + c),
              React.createElement("span", { className: "text-[11px] font-mono", style: { color: COLORS.gold } }, "Toi : " + d.createur.score + "/" + d.createur.total)
            ),
            joueurs.length === 0
              ? React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Personne n'a encore relevé ton défi.")
              : joueurs.map((j, i) => React.createElement("p", { key: i, className: "text-[11px] font-mono", style: { color: j.score > d.createur.score ? COLORS.terra : j.score === d.createur.score ? COLORS.textMuted : COLORS.forest } },
                  j.pseudo + " : " + j.score + "/" + j.total + (j.score > d.createur.score ? ", te bat !" : j.score === d.createur.score ? ", égalité" : ", tu gagnes !")))
          );
        })
      );
    }

    // ===== Mascotte Sabi : un lion qui réagit (encourage, félicite, s'inquiète) =====
    export function MascotteSabi({ message, humeur = "content", compact = false }) {
      const iconeHumeur = humeur === "triste" ? "moon" : humeur === "fete" ? "sparkles" : humeur === "focus" ? "headphones" : null;
      return React.createElement("div", { className: "flex items-center gap-3 w-full" },
        React.createElement("div", {
          className: "relative flex-shrink-0 flex items-center justify-center rounded-full",
          style: { width: compact ? 44 : 56, height: compact ? 44 : 56, fontSize: compact ? 18 : 22, backgroundColor: "rgba(var(--accent-rgb),0.14)", border: "1px solid rgba(var(--accent-rgb),0.4)", animation: "sabi-flame-bounce 1.6s ease-in-out infinite" }
        },
          React.createElement(Icon, { name: "lion", size: compact ? 22 : 28, color: COLORS.gold }),
          iconeHumeur && React.createElement("span", { className: "absolute", style: { right: -2, bottom: -2, display: "flex", backgroundColor: COLORS.bg, borderRadius: "9999px", padding: 2 } },
            React.createElement(Icon, { name: iconeHumeur, size: 12, color: COLORS.gold }))
        ),
        React.createElement("div", { className: "relative flex-1 rounded-lg px-3 py-2", style: { backgroundColor: COLORS.surface2 || COLORS.surface, border: "1px solid " + COLORS.border } },
          React.createElement("p", { className: "text-xs leading-relaxed", style: { color: COLORS.text } }, message)
        )
      );
    }

    // ===== Roue du jour : un tour gratuit par jour pour gagner des points =====
    const SEGMENTS_ROUE = [2, 5, 1, 10, 3, 0, 2, 5];
    const POIDS_ROUE = [3, 2, 3, 0.5, 3, 1.5, 3, 2]; // le 10 est rare
    export function RoueDuJour({ ouvert, onFermer, authUid, onGain }) {
      const [dejaJoue, setDejaJoue] = useState(null); // null = chargement
      const [rotation, setRotation] = useState(0);
      const [enCours, setEnCours] = useState(false);
      const [gain, setGain] = useState(null);
      useEffect(() => {
        if (!ouvert || !authUid) return;
        setGain(null); setEnCours(false);
        usersRef.child(authUid).child("derniereRoue").once("value")
          .then(snap => setDejaJoue(snap.val() === jourCle()))
          .catch(() => setDejaJoue(false));
      }, [ouvert, authUid]);
      if (!ouvert) return null;

      const tourner = () => {
        if (enCours || dejaJoue) return;
        setEnCours(true);
        usersRef.child(authUid).child("derniereRoue").set(jourCle()); // enregistré AVANT de tourner : pas de triche en rechargeant
        const total = POIDS_ROUE.reduce((a, b) => a + b, 0);
        let r = Math.random() * total, idx = 0;
        for (let i = 0; i < POIDS_ROUE.length; i++) { r -= POIDS_ROUE[i]; if (r <= 0) { idx = i; break; } }
        const angle = 360 * 6 + (360 - (idx + 0.5) * 45);
        setRotation(angle);
        let ticks = 0;
        const tk = setInterval(() => { jouerSon("roue"); if (++ticks > 18) clearInterval(tk); }, 200);
        setTimeout(() => {
          const pts = SEGMENTS_ROUE[idx];
          setGain(pts); setEnCours(false); setDejaJoue(true);
          if (pts > 0) { onGain(pts); celebrer(); } else { jouerSon("oups"); haptique(120); }
        }, 4300);
      };

      const couleurs = ["#a99bff", "#6ee7a8", "#ff8f9e", "#7c5cf0"];
      const part = (i) => {
        const a0 = (i * 45 - 90) * Math.PI / 180, a1 = ((i + 1) * 45 - 90) * Math.PI / 180;
        const x0 = 100 * Math.cos(a0), y0 = 100 * Math.sin(a0), x1 = 100 * Math.cos(a1), y1 = 100 * Math.sin(a1);
        return "M0 0 L" + x0 + " " + y0 + " A100 100 0 0 1 " + x1 + " " + y1 + " Z";
      };
      return ReactDOM.createPortal(React.createElement("div", {
        className: "fixed inset-0 z-[250] flex items-center justify-center p-5",
        style: { backgroundColor: "rgba(0,0,0,0.75)" }, onClick: () => { if (!enCours) onFermer(); }
      },
        React.createElement("div", {
          className: "w-full max-w-sm rounded-lg p-5 flex flex-col items-center gap-4",
          style: { backgroundColor: COLORS.surface, border: "1px solid " + COLORS.border }, onClick: e => e.stopPropagation()
        },
          React.createElement("p", { className: "text-base font-semibold", style: { color: COLORS.text } }, React.createElement("span", { className: "inline-flex items-center gap-2" }, React.createElement(Icon, { name: "target", size: 16, color: COLORS.gold }), "Roue du jour")),
          React.createElement("div", { className: "relative", style: { width: 240, height: 240 } },
            React.createElement("div", { className: "absolute left-1/2 -top-2 z-10", style: { transform: "translateX(-50%)", lineHeight: 1 } }, React.createElement(Icon, { name: "triangle-down", size: 26, color: COLORS.gold })),
            React.createElement("svg", {
              viewBox: "-104 -104 208 208", width: 240, height: 240,
              style: { transform: "rotate(" + rotation + "deg)", transition: "transform 4.2s cubic-bezier(0.12, 0.6, 0.1, 1)" }
            },
              SEGMENTS_ROUE.map((pts, i) => React.createElement("g", { key: i },
                React.createElement("path", { d: part(i), fill: couleurs[i % 4], stroke: "#0b0a12", strokeWidth: 1.5 }),
                React.createElement("text", {
                  x: 0, y: -66, textAnchor: "middle", fontSize: 17, fontWeight: 700, fill: "#0b0a12",
                  transform: "rotate(" + (i * 45 + 22.5) + ")"
                }, pts === 0 ? React.createElement(Icon, { name: "moon", size: 14 }) : "+" + pts)
              )),
              React.createElement("circle", { r: 14, fill: "#0b0a12" })
            )
          ),
          gain !== null
            ? React.createElement("p", { className: "text-sm font-semibold text-center", style: { color: gain > 0 ? COLORS.gold : COLORS.textMuted } },
                gain > 0 ? "Tu gagnes +" + gain + " point" + (gain > 1 ? "s" : "") + " !" : "Pas de chance aujourd'hui… reviens demain")
            : React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.textMuted } },
                dejaJoue === null ? "Chargement…" : dejaJoue ? "Tu as déjà tourné la roue aujourd'hui. Reviens demain !" : "Un tour gratuit par jour. Tente ta chance !"),
          React.createElement("div", { className: "flex gap-2 w-full" },
            React.createElement("button", {
              onClick: tourner, disabled: enCours || dejaJoue !== false,
              className: "flex-1 rounded-full py-2.5 text-sm font-semibold disabled:opacity-40",
              style: { background: "linear-gradient(135deg, #a99bff, #ec4899)", color: "#0b0a12" }
            }, enCours ? "Ça tourne…" : "Tourner la roue"),
            React.createElement("button", { onClick: onFermer, disabled: enCours, className: "rounded-full px-4 py-2.5 text-sm border disabled:opacity-40", style: { borderColor: COLORS.border, color: COLORS.textMuted } }, "Fermer")
          )
        )
      ), document.body);
    }

    // ===== Carnet d'astuces : les astuces sauvegardées (sur l'appareil) =====
    export function CarnetModal({ ouvert, onFermer }) {
      const [liste, setListe] = useState([]);
      useEffect(() => { if (ouvert) setListe(chargerCarnet()); }, [ouvert]);
      if (!ouvert) return null;
      return ReactDOM.createPortal(React.createElement("div", {
        className: "fixed inset-0 z-[250] flex items-end sm:items-center justify-center",
        style: { backgroundColor: "rgba(0,0,0,0.6)" }, onClick: onFermer
      },
        React.createElement("div", {
          className: "w-full max-w-md rounded-t-2xl sm:rounded-lg p-5 flex flex-col gap-3 max-h-[80vh] overflow-y-auto",
          style: { backgroundColor: COLORS.surface, border: "1px solid " + COLORS.border }, onClick: e => e.stopPropagation()
        },
          React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("p", { className: "text-base font-semibold flex items-center gap-2", style: { color: COLORS.text } }, React.createElement(Icon, { name: "heart", size: 16, color: COLORS.terraText }), "Mon carnet d'astuces"),
            React.createElement("button", { onClick: onFermer, "aria-label": "Fermer" }, React.createElement(Icon, { name: "x", size: 18, color: COLORS.textMuted }))
          ),
          liste.length === 0
            ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Ton carnet est vide. Touche le cœur sur une astuce pour la garder ici.")
            : liste.map((t, i) => React.createElement("div", { key: i, className: "rounded-lg p-3 flex items-start gap-2", style: { backgroundColor: COLORS.bg, border: "1px solid " + COLORS.border } },
                React.createElement("p", { className: "flex-1 text-xs leading-relaxed", style: { color: COLORS.textMuted } }, t),
                React.createElement("button", {
                  onClick: () => { basculerCarnet(t); setListe(chargerCarnet()); }, "aria-label": "Retirer du carnet"
                }, React.createElement(Icon, { name: "trash", size: 14, color: COLORS.textFaint }))
              ))
        )
      ), document.body);
    }

    // Bouton pour ajouter/retirer une astuce du carnet.
    export function BoutonCarnet({ texte }) {
      const [dans, setDans] = useState(() => chargerCarnet().includes(texte));
      return React.createElement("button", {
        onClick: (e) => { e.stopPropagation(); const ajoutee = basculerCarnet(texte); setDans(ajoutee); jouerSon("ding"); haptique(30); },
        "aria-label": dans ? "Retirer du carnet" : "Ajouter au carnet", className: "flex-shrink-0 p-1"
      }, React.createElement(Icon, { name: "heart", size: 16, color: dans ? COLORS.terra : COLORS.textFaint, style: dans ? { fill: COLORS.terra } : undefined }));
    }

    // Une bulle unique, avec la petite pointe façon message WhatsApp, qui glisse et s'efface seule.
    export function BulleNotif({ notif, onFermer }) {
      const [sortie, setSortie] = useState(false);
      useEffect(() => {
        const t1 = setTimeout(() => setSortie(true), 3800);
        const t2 = setTimeout(onFermer, 4200);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }, []);
      return React.createElement("div", {
        onClick: () => { setSortie(true); setTimeout(onFermer, 300); },
        className: "pointer-events-auto flex items-start gap-2.5 rounded-lg rounded-tl-sm px-3.5 py-3 shadow-lg cursor-pointer",
        style: {
          backgroundColor: "#2a2a2a", border: "1px solid " + COLORS.border, maxWidth: 340,
          transform: sortie ? "translateY(-12px) scale(0.96)" : "translateY(0) scale(1)",
          opacity: sortie ? 0 : 1, transition: "all 0.3s ease"
        }
      },
        React.createElement("div", { className: "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0", style: { backgroundColor: "rgba(var(--accent-rgb),0.15)" } },
          React.createElement(Icon, { name: notif.icone || "bell", size: 15, color: COLORS.gold })
        ),
        React.createElement("div", { className: "min-w-0" },
          notif.titre && React.createElement("p", { className: "text-xs font-semibold", style: { color: COLORS.text } }, notif.titre),
          React.createElement("p", { className: "text-xs leading-snug", style: { color: COLORS.textMuted } }, notif.texte)
        )
      );
    }

    // Empile les bulles en haut de l'écran (au-dessus de tout, comme les notifications WhatsApp).
    // Petit interrupteur réutilisable (on/off), style iOS discret.
    export function ToggleSwitch({ actif, onChange, label }) {
      return React.createElement("button", {
        onClick: () => onChange(!actif),
        role: "switch", "aria-checked": actif, "aria-label": label,
        className: "flex-shrink-0 rounded-full relative transition-colors",
        style: { width: 42, height: 24, backgroundColor: actif ? COLORS.gold : COLORS.border }
      },
        React.createElement("div", {
          className: "absolute top-0.5 rounded-full transition-all",
          style: { width: 18, height: 18, left: actif ? 21 : 3, backgroundColor: actif ? COLORS.goldInk : COLORS.textFaint }
        })
      );
    }

    // Modal "Crédits" — but de l'app, créateur, contact.
    export function CreditsModal({ ouvert, onFermer, onOuvrirAssistance }) {
      if (!ouvert) return null;
      return React.createElement("div", {
        className: "fixed inset-0 z-[200] flex items-end sm:items-center justify-center",
        style: { backgroundColor: "rgba(0,0,0,0.6)" },
        onClick: onFermer
      },
        React.createElement("div", {
          className: "w-full max-w-md rounded-t-2xl sm:rounded-lg p-6 flex flex-col gap-4 max-h-[85vh] overflow-y-auto",
          style: { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` },
          onClick: e => e.stopPropagation()
        },
          React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement(Icon, { name: "info", size: 18, color: COLORS.gold }),
              React.createElement("p", { className: "text-base font-semibold", style: { color: COLORS.text } }, "À propos de Sabi")
            ),
            React.createElement("button", { onClick: onFermer, "aria-label": "Fermer" }, React.createElement(Icon, { name: "x", size: 18, color: COLORS.textMuted }))
          ),
          React.createElement("img", { src: LOGO_SABI_WORDMARK, alt: "Sabi", className: "h-12 w-auto self-center my-1" }),
          React.createElement("div", { className: "flex flex-col gap-3 text-sm", style: { color: COLORS.textMuted } },
            React.createElement("p", null, "Sabi est l'application de la vie étudiante de l'IUT Fotso Victor de Bandjoun : archives d'épreuves corrigées, résumés de cours, carte du campus, classement, chat, et accompagnement pour réussir l'année."),
            React.createElement("p", null, "Le nom \"Sabi\" vient du mot pidgin/nigérian signifiant \"savoir\", l'objectif est de donner à chaque étudiant l'accès aux ressources et aux repères qui lui manquent parfois en arrivant sur le campus.")
          ),
          React.createElement("div", { className: "rounded-lg p-3 flex flex-col gap-1", style: { backgroundColor: COLORS.surface2, border: `1px solid ${COLORS.border}` } },
            React.createElement("p", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textFaint } }, "Équipe"),
            React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, "Équipe Sabi"),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, "Étudiants de l'IUT FV de Bandjoun, au service de la réussite de tous.")
          ),
          React.createElement("button", {
            onClick: () => { onOuvrirAssistance(); onFermer(); },
            className: "flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium",
            style: { backgroundColor: COLORS.gold, color: COLORS.goldInk }
          }, React.createElement(Icon, { name: "help-circle", size: 15 }), "Une question ? Nous écrire")
        )
      );
    }
