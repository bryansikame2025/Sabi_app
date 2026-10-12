// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import { Icon } from "../components/Icon.js";
import { BADGES } from "../config/constantes.js";
import { getAbonnementActif } from "../lib/abonnements.js";
import { COLORS } from "../theme.js";

    // Annuaire public — visible par tous, liste tous les utilisateurs inscrits
    export function MembresTab({ membres, isOwner, isAdmin }) {
      const voitCoordonnees = isOwner || isAdmin;
      const [filiereFiltre, setFiliereFiltre] = useState("toutes");
      const [anneeFiltre, setAnneeFiltre] = useState("toutes");
      const sorted = [...membres].sort((a, b) => (b.pointsTotal || 0) - (a.pointsTotal || 0));

      // Filières/années réellement présentes parmi les membres (ordre stable de FILIERES/ANNEES)
      // Dérivées directement des membres réels (pas de la liste figée FILIERES/ANNEES) : si un
      // compte a été enregistré avec une orthographe différente ("Génie Électrique" sans le sigle
      // "(GE)", par exemple), le filtre doit quand même apparaître au lieu de disparaître
      // silencieusement faute de correspondance exacte.
      const filieresPresentes = [...new Set(sorted.map(u => u.filiere).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
      const anneesPresentes = [...new Set(sorted.map(u => u.annee).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));

      // Récapitulatif par filière : nombre de membres + nombre de numéros WhatsApp renseignés
      const statsParFiliere = filieresPresentes.map(f => {
        const membresFiliere = sorted.filter(u => u.filiere === f);
        const avecTelephone = membresFiliere.filter(u => u.whatsapp && u.whatsapp.trim().length > 0).length;
        return { filiere: f, total: membresFiliere.length, avecTelephone };
      });
      const totalTelephones = statsParFiliere.reduce((s, x) => s + x.avecTelephone, 0);

      const affiches = sorted
        .filter(u => filiereFiltre === "toutes" || u.filiere === filiereFiltre)
        .filter(u => anneeFiltre === "toutes" || u.annee === anneeFiltre);

      return React.createElement("div", { className: "flex flex-col gap-4" },
        React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Membres inscrits"),
        React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, sorted.length + " étudiant" + (sorted.length > 1 ? "s" : "") + " inscrit" + (sorted.length > 1 ? "s" : "") + " sur Sabi."),

        voitCoordonnees && statsParFiliere.length > 0 && React.createElement("div", { className: "rounded-lg border p-3.5 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("div", { className: "flex items-center justify-between" },
            React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider flex items-center gap-1.5", style: { color: COLORS.textMuted } }, React.createElement(Icon, { name: "phone", size: 11 }), " Numéros par filière"),
            React.createElement("span", { className: "text-[10px] font-mono", style: { color: COLORS.gold } }, totalTelephones + " au total")
          ),
          React.createElement("div", { className: "flex flex-col gap-1" },
            statsParFiliere.map(s => React.createElement("div", { key: s.filiere, className: "flex items-center justify-between" },
              React.createElement("span", { className: "text-xs", style: { color: COLORS.text } }, s.filiere),
              React.createElement("span", { className: "text-xs font-mono", style: { color: COLORS.textMuted } }, s.avecTelephone + " / " + s.total)
            ))
          )
        ),

        filieresPresentes.length > 0 && React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" },
          React.createElement("button", {
            onClick: () => setFiliereFiltre("toutes"),
            className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
            style: filiereFiltre === "toutes" ? { backgroundColor: COLORS.gold, color: COLORS.bg, borderColor: COLORS.gold } : { color: COLORS.textMuted, borderColor: COLORS.border }
          }, "Toutes (" + sorted.length + ")"),
          filieresPresentes.map(f => React.createElement("button", {
            key: f, onClick: () => setFiliereFiltre(f),
            className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
            style: filiereFiltre === f ? { backgroundColor: COLORS.gold, color: COLORS.bg, borderColor: COLORS.gold } : { color: COLORS.textMuted, borderColor: COLORS.border }
          }, f))
        ),

        anneesPresentes.length > 0 && React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" },
          React.createElement("button", {
            onClick: () => setAnneeFiltre("toutes"),
            className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
            style: anneeFiltre === "toutes" ? { backgroundColor: COLORS.forest, color: COLORS.bg, borderColor: COLORS.forest } : { color: COLORS.textMuted, borderColor: COLORS.border }
          }, "Toutes années"),
          anneesPresentes.map(a => React.createElement("button", {
            key: a, onClick: () => setAnneeFiltre(a),
            className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
            style: anneeFiltre === a ? { backgroundColor: COLORS.forest, color: COLORS.bg, borderColor: COLORS.forest } : { color: COLORS.textMuted, borderColor: COLORS.border }
          }, a))
        ),

        !affiches.length
          ? React.createElement("p", { className: "text-sm text-center py-10", style: { color: COLORS.textFaint } }, sorted.length ? "Aucun membre pour ce filtre." : "Chargement...")
          : affiches.map(u => React.createElement("div", { key: u.uid, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("div", { className: "flex-1" },
                React.createElement("p", { className: "text-sm font-medium flex items-center gap-1.5", style: { color: COLORS.text } },
                  u.pseudo || "(sans pseudo)",
                  u.badgeActif && BADGES.find(b => b.id === u.badgeActif) && React.createElement(Icon, { name: BADGES.find(b => b.id === u.badgeActif).emoji, size: 13, color: COLORS.gold }),
                  u.admin && React.createElement("span", { className: "text-[9px] font-mono px-1.5 py-0.5 rounded-full", style: { backgroundColor: "rgba(var(--accent-rgb),0.15)", color: COLORS.gold } }, "ADMIN"),
                  (() => { const tier = getAbonnementActif(u); return tier !== "free" && React.createElement("span", { className: "text-[9px] font-mono px-1.5 py-0.5 rounded-full", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, tier === "proplus" ? "PRO+" : "PRO"); })()
                ),
                React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, (u.filiere || "-") + " · " + (u.annee || "-")),
                voitCoordonnees && u.whatsapp && React.createElement("p", { className: "text-[11px] font-mono mt-0.5 flex items-center gap-1", style: { color: COLORS.forestText } }, React.createElement(Icon,{name:"phone",size:10}), " " + u.whatsapp)
              ),
              React.createElement("p", { className: "text-xs font-mono", style: { color: COLORS.gold } }, (u.pointsTotal || 0) + " pts")
            ))
      );
    }
