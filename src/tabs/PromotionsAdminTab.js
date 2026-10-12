// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { PRIX_PROPLUS_ANNEE, PRIX_PROPLUS_SEMESTRE, PRIX_PRO_ANNEE, PRIX_PRO_SEMESTRE } from "../config/constantes.js";
import { promosRef } from "../firebase.js";
import { COLORS } from "../theme.js";

    export function PromotionsAdminTab({ isOwner }) {
      // Promotions sur les packs Sabi Pro/Pro+ — le propriétaire fixe un prix réduit
      // et une date de fin ; la promo redevient inactive automatiquement une fois cette date passée.
      const [promosAdmin, setPromosAdmin] = useState({});
      useEffect(() => {
        if (!isOwner) return;
        const listener = promosRef.on("value", snap => setPromosAdmin(snap.val() || {}));
        return () => promosRef.off("value", listener);
      }, [isOwner]);
      const [champsPromo, setChampsPromo] = useState({}); // { "pro-semestre": { prix, fin } }
      const appliquerPromo = (tier, duree) => {
        const cle = tier + "-" + duree;
        const saisie = champsPromo[cle] || {};
        const prix = parseInt(saisie.prix, 10);
        if (!prix || prix <= 0 || !saisie.fin) return;
        promosRef.child(tier).child(duree).set({ prix, finLe: new Date(saisie.fin).getTime() });
      };
      const retirerPromo = (tier, duree) => promosRef.child(tier).child(duree).remove();

      if (!isOwner) {
        return React.createElement("p", { className: "text-sm text-center py-10", style: { color: COLORS.textFaint } }, "Accès réservé au propriétaire du site.");
      }

      return React.createElement("div", { className: "flex flex-col gap-3" },
        React.createElement("div", null,
          React.createElement("p", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Promotions"),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Prix réduits temporaires sur les packs Sabi Pro / Pro+.")
        ),
        // Gestion des promotions : prix réduit + date de fin, indépendamment pour chaque pack/durée
        React.createElement("div", { className: "flex flex-col gap-2 rounded-lg border p-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon, { name: "tag", size: 14 }), " Promotions Sabi Pro / Pro+"),
          [["pro", "semestre", "Sabi Pro. Semestriel", PRIX_PRO_SEMESTRE], ["pro", "annee", "Sabi Pro. Annuel", PRIX_PRO_ANNEE], ["proplus", "semestre", "Sabi Pro+. Semestriel", PRIX_PROPLUS_SEMESTRE], ["proplus", "annee", "Sabi Pro+. Annuel", PRIX_PROPLUS_ANNEE]].map(([tier, duree, label, prixNormal]) => {
            const cle = tier + "-" + duree;
            const promoActuelle = promosAdmin && promosAdmin[tier] && promosAdmin[tier][duree];
            const promoActive = promoActuelle && promoActuelle.finLe > Date.now();
            return React.createElement("div", { key: cle, className: "rounded-lg p-2.5 flex flex-col gap-1.5", style: { backgroundColor: COLORS.bg } },
              React.createElement("p", { className: "text-xs font-medium", style: { color: COLORS.text } }, label + " (normalement " + prixNormal + " FCFA)"),
              promoActive && React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.gold } }, "Promo active : " + promoActuelle.prix + " FCFA jusqu'au " + new Date(promoActuelle.finLe).toLocaleDateString("fr-FR")),
              React.createElement("div", { className: "flex gap-2" },
                React.createElement("input", {
                  type: "number", placeholder: "Prix promo",
                  value: (champsPromo[cle] && champsPromo[cle].prix) || "",
                  onChange: e => setChampsPromo(prev => ({ ...prev, [cle]: { ...prev[cle], prix: e.target.value } })),
                  className: "flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs outline-none border", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
                }),
                React.createElement("input", {
                  type: "date",
                  value: (champsPromo[cle] && champsPromo[cle].fin) || "",
                  onChange: e => setChampsPromo(prev => ({ ...prev, [cle]: { ...prev[cle], fin: e.target.value } })),
                  className: "flex-1 min-w-0 rounded-lg px-2 py-1.5 text-xs outline-none border", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
                })
              ),
              React.createElement("div", { className: "flex gap-2" },
                React.createElement("button", { onClick: () => appliquerPromo(tier, duree), className: "flex-1 text-[11px] font-mono py-1.5 rounded-lg", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, "Appliquer"),
                promoActive && React.createElement("button", { onClick: () => retirerPromo(tier, duree), className: "flex-1 text-[11px] font-mono py-1.5 rounded-lg", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } }, "Retirer")
              )
            );
          })
        ),
      );
    }
