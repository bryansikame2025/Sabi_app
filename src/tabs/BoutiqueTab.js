// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import { Icon } from "../components/Icon.js";
import { AVANTAGES_PRO, AVANTAGES_PROPLUS, BADGES, COUT_VIP, PAIEMENT_MANUEL_NUMERO, PAIEMENT_MANUEL_WHATSAPP, WHATSAPP_PROPLUS_LIEN } from "../config/constantes.js";
import { prixEffectif } from "../lib/abonnements.js";
import { ouvrirExterne } from "../lib/effets.js";
import { COLORS } from "../theme.js";

    export function BoutiqueTab({ points, badges, badgeActif, vip, bounties, pseudo, authUid, abonnement, promos, verifPaiementStatut, verifPaiementDetail, onVerifierPaiement, onBuyBadge, onSetBadgeActif, onBuyVip, onCreateBounty, onRespondBounty, onChooseWinner, onPayerAbonnement, onDemandeAbonnement }) {
      const [section, setSection] = useState("abonnement");
      const [paiementLance, setPaiementLance] = useState(null); // "pro-semestre", "proplus-annee", etc. — le temps de la redirection
      const [erreurPaiement, setErreurPaiement] = useState("");
      const [dureePro, setDureePro] = useState("semestre");
      const [dureeProPlus, setDureeProPlus] = useState("semestre");
      const [demandeVipEnvoyee, setDemandeVipEnvoyee] = useState(false);
      // Suivi des demandes manuelles envoyées (plan B tant que le paiement automatique n'est pas actif) —
      // une entrée par pack "tier-duree", ex. { "pro-semestre": true }.
      const [demandesManuellesEnvoyees, setDemandesManuellesEnvoyees] = useState({});
      const [manuelOuvert, setManuelOuvert] = useState({}); // panneau "paiement manuel" déplié, par pack
      const paiementRetour = new URLSearchParams(window.location.search).get("paiement") === "retour";

      const handlePayer = (tier, duree) => {
        setErreurPaiement("");
        setPaiementLance(tier + "-" + duree);
        onPayerAbonnement(tier, duree).catch(err => {
          setPaiementLance(null);
          setErreurPaiement(err.message || "Impossible de démarrer le paiement. Réessaie.");
        });
      };

      const formatFCFA = n => n.toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ");

      return React.createElement("div", { className: "flex flex-col gap-4" },
        verifPaiementStatut === "en_cours" && React.createElement("div", { className: "rounded-lg border p-3 flex items-center gap-2", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.1)" } },
          React.createElement(Icon, { name: "refresh-cw", size: 14, color: COLORS.gold }),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.gold } }, "Vérification du paiement en cours...")
        ),
        verifPaiementStatut === "ok" && React.createElement("div", { className: "rounded-lg border p-3 flex items-center gap-2", style: { borderColor: COLORS.forest, backgroundColor: "rgba(119,221,106,0.1)" } },
          React.createElement(Icon, { name: "check", size: 14, color: COLORS.forestText }),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.forestText } }, "Paiement confirmé, ton abonnement est actif !")
        ),
        verifPaiementStatut === "erreur" && React.createElement("div", { className: "rounded-lg border p-3 flex items-center gap-2", style: { borderColor: COLORS.terra, backgroundColor: "rgba(255,180,171,0.1)" } },
          React.createElement(Icon, { name: "x", size: 14, color: COLORS.terraText }),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.terraText } }, "Paiement non confirmé pour l'instant. Si tu as bien payé, réessaie dans une minute ou contacte l'assistance." + (verifPaiementDetail ? " (Détail : " + verifPaiementDetail + ")" : "")),
          onVerifierPaiement && React.createElement("button", { onClick: onVerifierPaiement, className: "flex-shrink-0 text-[11px] font-mono px-3 py-1.5 rounded-full border", style: { borderColor: COLORS.terraText, color: COLORS.terraText } }, "Vérifier")
        ),
        erreurPaiement && React.createElement("div", { className: "rounded-lg border p-3 flex items-center gap-2", style: { borderColor: COLORS.terra, backgroundColor: "rgba(255,180,171,0.1)" } },
          React.createElement(Icon, { name: "x", size: 14, color: COLORS.terraText }),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.terraText } }, erreurPaiement)
        ),
        React.createElement("div", { className: "flex items-start justify-between gap-3" },
          React.createElement("div", null,
            React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Boutique Sabi"),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, "Abonnements, badges et avantages")
          ),
          React.createElement("div", { className: "flex-shrink-0 flex items-center gap-1.5 text-sm font-bold font-mono px-3 py-1.5 rounded-full", style: { backgroundColor: "rgba(var(--accent-rgb),0.12)", color: COLORS.gold, border: `1px solid ${COLORS.gold}` } },
            React.createElement(Icon, { name: "star", size: 13 }), points
          )
        ),
        React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" },
          [["abonnement", "crown", "Sabi Pro"], ["badges", "award", "Badges"], ["vip", "star", "VIP"], ["bounty", "gift", "Bounty"]].map(([id, icn, label]) => React.createElement("button", {
            key: id,
            onClick: () => setSection(id),
            className: "flex-shrink-0 flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border transition-colors",
            style: section === id ? { backgroundColor: COLORS.gold, color: COLORS.bg, borderColor: COLORS.gold } : { color: COLORS.textMuted, borderColor: COLORS.border }
          }, React.createElement(Icon, { name: icn, size: 13 }), label))
        ),

        section === "abonnement" && React.createElement("div", { className: "flex flex-col gap-3" },
          abonnement !== "free" && React.createElement("div", { className: "rounded-lg border p-3", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
            React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon,{name:"check",size:14}), " Abonnement " + (abonnement === "proplus" ? "Sabi Pro+" : "Sabi Pro") + " actif")
          ),
          abonnement === "proplus" && React.createElement("a", {
            href: WHATSAPP_PROPLUS_LIEN, target: "_blank", rel: "noopener noreferrer",
            onClick: (e) => ouvrirExterne(e, WHATSAPP_PROPLUS_LIEN),
            className: "rounded-lg border p-3 flex items-center gap-2", style: { borderColor: COLORS.forest, backgroundColor: "rgba(119,221,106,0.1)" }
          },
            React.createElement(Icon, { name: "message-circle", size: 18, color: COLORS.forestText }),
            React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, "Rejoindre le groupe WhatsApp Pro+")
          ),
          (() => {
            // Petite carte de pack réutilisable : sélecteur Semestriel/Annuel, prix (avec promo barrée
            // si active), liste des avantages, et bouton de souscription ou statut de la demande.
            const CartePack = ({ tier, icone, nom, avantages, duree, setDuree }) => {
              const { base, promo, finLe, effectif } = prixEffectif(tier, duree, promos);
              const cleDemande = tier + "-" + duree;
              const dejaInclus = tier === "pro" ? (abonnement === "pro" || abonnement === "proplus") : abonnement === "proplus";
              const estPro = tier === "pro";
              return React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-2.5 relative", style: { borderColor: estPro ? COLORS.border : COLORS.gold, backgroundColor: COLORS.surface } },
                !estPro && React.createElement("span", { className: "absolute -top-2.5 right-4 text-[9px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full", style: { backgroundColor: COLORS.forest, color: "#fff" } }, "Populaire"),
                React.createElement("div", null,
                  React.createElement("p", { className: "text-base font-bold flex items-center gap-1.5", style: { color: estPro ? COLORS.text : COLORS.gold, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, React.createElement(Icon, { name: icone, size: 16 }), " " + nom),
                  React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, estPro ? "Épreuves et corrections, sans limite" : "Pro, plus les résumés de cours et le groupe d'entraide")
                ),
                React.createElement("div", { className: "flex rounded-lg border overflow-hidden", style: { borderColor: COLORS.border } },
                  ["semestre", "annee"].map(d => React.createElement("button", {
                    key: d, onClick: () => setDuree(d),
                    className: "flex-1 py-1.5 text-[11px] font-mono uppercase tracking-wide",
                    style: duree === d ? { backgroundColor: COLORS.gold, color: COLORS.bg } : { color: COLORS.textMuted }
                  }, d === "semestre" ? "Semestre" : "Annuel"))
                ),
                React.createElement("div", { className: "flex items-baseline gap-2" },
                  promo && React.createElement("span", { className: "text-xs line-through", style: { color: COLORS.textFaint } }, formatFCFA(base) + " FCFA"),
                  React.createElement("span", { className: "text-2xl font-bold", style: { color: promo ? COLORS.gold : (estPro ? COLORS.text : COLORS.gold), fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, formatFCFA(effectif)),
                  React.createElement("span", { className: "text-[11px] font-mono uppercase", style: { color: COLORS.textMuted } }, "FCFA / " + (duree === "annee" ? "AN" : "SEM"))
                ),
                promo && React.createElement("p", { className: "text-[10px] font-mono flex items-center gap-1", style: { color: COLORS.gold } }, React.createElement(Icon, { name: "tag", size: 10 }), " Promo jusqu'au " + new Date(finLe).toLocaleDateString("fr-FR")),
                React.createElement("ul", { className: "flex flex-col gap-1.5 mt-1" },
                  avantages.map((a, i) => React.createElement("li", { key: i, className: "text-xs flex items-start gap-1.5", style: { color: COLORS.textMuted } },
                    React.createElement(Icon, { name: "check-circle", size: 14, style: { marginTop: 1, flexShrink: 0 }, color: estPro ? COLORS.forestText : COLORS.gold }), a
                  ))
                ),
                dejaInclus
                  ? React.createElement("p", { className: "text-xs font-mono flex items-center gap-1", style: { color: COLORS.forestText } }, React.createElement(Icon, { name: "check", size: 11 }), " Inclus dans ton abonnement")
                  : React.createElement(React.Fragment, null,
                      paiementLance === cleDemande
                        ? React.createElement("p", { className: "text-xs font-mono", style: { color: COLORS.gold } }, "Redirection vers la page de paiement...")
                        : React.createElement("button", {
                            onClick: () => handlePayer(tier, duree), className: "rounded-lg py-2.5 text-sm font-bold uppercase tracking-wide",
                            style: estPro ? { border: `1px solid ${COLORS.border}`, color: COLORS.text } : { backgroundColor: COLORS.gold, color: COLORS.bg }
                          }, estPro ? "Payer en ligne" : "Payer en ligne (Pro+)"),
                      demandesManuellesEnvoyees[cleDemande]
                        ? React.createElement("p", { className: "text-xs", style: { color: COLORS.forestText } }, "Demande envoyée, en attente de validation par un admin.")
                        : (manuelOuvert[cleDemande]
                            ? React.createElement("div", { className: "flex flex-col gap-2" },
                                React.createElement("div", { className: "rounded-lg p-2.5", style: { backgroundColor: COLORS.surface2 } },
                                  React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textMuted } },
                                    "1. Envoie " + formatFCFA(effectif) + " FCFA par Orange Money / MTN MoMo au ",
                                    React.createElement("span", { style: { color: COLORS.gold, fontWeight: 600 } }, PAIEMENT_MANUEL_NUMERO)
                                  ),
                                  React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.textMuted } }, "2. Tape ci-dessous une fois le transfert envoyé, ton abonnement s'active après vérification (quelques heures)."),
                                  React.createElement("a", {
                                    href: PAIEMENT_MANUEL_WHATSAPP, target: "_blank", rel: "noopener noreferrer",
                                    onClick: (e) => ouvrirExterne(e, PAIEMENT_MANUEL_WHATSAPP),
                                    className: "text-[11px] mt-1.5 flex items-center gap-1 w-fit", style: { color: COLORS.forestText }
                                  }, React.createElement(Icon, { name: "message-circle", size: 12 }), "Envoyer la capture du paiement sur WhatsApp (optionnel, accélère la validation)")
                                ),
                                React.createElement("button", {
                                  onClick: () => { onDemandeAbonnement(tier, duree); setDemandesManuellesEnvoyees(prev => ({ ...prev, [cleDemande]: true })); },
                                  className: "rounded-lg py-2.5 text-sm font-bold uppercase tracking-wide",
                                  style: { border: `1px solid ${COLORS.border}`, color: COLORS.text }
                                }, "J'ai envoyé le paiement")
                              )
                            : React.createElement("button", {
                                onClick: () => setManuelOuvert(prev => ({ ...prev, [cleDemande]: true })),
                                className: "text-[11px] font-mono underline w-fit", style: { color: COLORS.textMuted }
                              }, "Le paiement en ligne ne marche pas ? Payer manuellement"))
                    )
              );
            };
            return React.createElement(React.Fragment, null,
              React.createElement(CartePack, { tier: "pro", icone: "crown", nom: "Sabi Pro", avantages: AVANTAGES_PRO, duree: dureePro, setDuree: setDureePro }),
              React.createElement(CartePack, { tier: "proplus", icone: "gem", nom: "Sabi Pro+", avantages: AVANTAGES_PROPLUS, duree: dureeProPlus, setDuree: setDureeProPlus })
            );
          })(),
          React.createElement("div", { className: "flex items-center gap-1.5 text-[11px] font-mono", style: { color: COLORS.textFaint } },
            React.createElement(Icon, { name: "phone", size: 12 }), "Paiement via Orange Money / MTN MoMo"
          ),
          React.createElement("div", { className: "rounded-lg border p-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mb-1", style: { color: COLORS.textMuted } }, "Comment ça marche"),
            React.createElement(React.Fragment, null,
              React.createElement("p", { className: "text-sm", style: { color: COLORS.text } }, "1. Tape sur \"Payer en ligne\", tu es redirigé vers la page de paiement sécurisée"),
              React.createElement("p", { className: "text-sm", style: { color: COLORS.text } }, "2. Choisis Orange Money ou MTN MoMo et confirme sur ton téléphone"),
              React.createElement("p", { className: "text-sm", style: { color: COLORS.text } }, "3. Ton abonnement s'active tout seul dès que le paiement est confirmé (quelques minutes). Un souci ? Bouton \"Vérifier\", ou paiement manuel validé par un admin.")
            )
          )
        ),

        section === "badges" && React.createElement("div", { className: "flex flex-col gap-3" },
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider flex items-center gap-1.5", style: { color: COLORS.textMuted } }, React.createElement(Icon, { name: "shopping-bag", size: 13 }), " Dépensez vos points"),
          React.createElement("div", { className: "grid grid-cols-2 gap-3" },
            BADGES.map(b => {
              const possede = !!badges[b.id];
              const actif = badgeActif === b.id;
              const c = COLORS[b.couleur] || COLORS.gold;
              return React.createElement("div", { key: b.id, className: "rounded-lg border p-3.5 flex flex-col items-center text-center gap-1.5", style: { borderColor: actif ? c : COLORS.border, backgroundColor: COLORS.surface } },
                React.createElement("div", { className: "w-12 h-12 rounded-full flex items-center justify-center", style: { backgroundColor: c + "1f" } }, React.createElement(Icon, { name: b.emoji, size: 22, color: c })),
                React.createElement("p", { className: "text-xs font-semibold", style: { color: COLORS.text } }, b.nom),
                React.createElement("p", { className: "text-[10px] font-mono", style: { color: COLORS.textMuted } }, possede ? "Débloqué" : (b.auto ? b.condition : b.cout + " points")),
                possede
                  ? React.createElement("button", { onClick: () => onSetBadgeActif(actif ? null : b.id), className: "w-full text-[10px] font-mono py-1.5 rounded-full mt-1", style: actif ? { backgroundColor: c, color: c === COLORS.gold ? COLORS.bg : "#fff" } : { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted } }, actif ? "Actif" : "Activer")
                  : b.auto
                    ? React.createElement("div", { className: "w-full text-[10px] font-mono py-1.5 rounded-full mt-1 text-center", style: { border: `1px dashed ${COLORS.border}`, color: COLORS.textFaint } }, React.createElement("span", { className: "inline-flex items-center justify-center gap-1" }, React.createElement(Icon, { name: "lock", size: 11 }), "À débloquer"))
                    : React.createElement("button", { onClick: () => onBuyBadge(b), disabled: points < b.cout, className: "w-full text-[10px] font-mono py-1.5 rounded-full mt-1 disabled:opacity-30", style: { backgroundColor: c, color: c === COLORS.gold ? COLORS.bg : "#fff" } }, "Acheter")
              );
            })
          )
        ),

        section === "vip" && React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: vip ? COLORS.gold : COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-2", style: { color: COLORS.text } }, React.createElement(Icon,{name:"star",size:15}), " Statut Sabi VIP"),
          React.createElement("p", { className: "text-sm", style: { color: COLORS.textMuted } }, "Débloque le tag [VÉRIFIÉ] que tu peux ajouter à tes cartes et épreuves publiées, pour signaler un contenu fiable."),
          vip
            ? React.createElement("p", { className: "text-xs font-mono flex items-center gap-1", style: { color: COLORS.forestText } }, React.createElement(Icon,{name:"check",size:11}), " Déjà activé")
            : demandeVipEnvoyee
            ? React.createElement("p", { className: "text-xs", style: { color: COLORS.forestText } }, "Demande envoyée, en attente de validation par un admin.")
            : React.createElement("button", { onClick: () => onBuyVip(() => setDemandeVipEnvoyee(true)), disabled: points < COUT_VIP, className: "rounded-lg py-2 text-sm font-semibold disabled:opacity-30", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, "Demander pour " + COUT_VIP + " points")
        ),

        section === "bounty" && React.createElement(BountySection, { bounties: bounties, points: points, pseudo: pseudo, authUid: authUid, onCreateBounty: onCreateBounty, onRespondBounty: onRespondBounty, onChooseWinner: onChooseWinner })
      );
    }

    function BountySection({ bounties, points, pseudo, authUid, onCreateBounty, onRespondBounty, onChooseWinner }) {
      const [showForm, setShowForm] = useState(false);
      const [titre, setTitre] = useState("");
      const [description, setDescription] = useState("");
      const [mise, setMise] = useState("10");
      const [expanded, setExpanded] = useState(null);
      const [reponseTexte, setReponseTexte] = useState("");

      const handleCreate = () => {
        const m = parseInt(mise, 10);
        if (titre.trim().length < 5 || !m || m < 5 || m > points) return;
        onCreateBounty({ titre: titre.trim(), description: description.trim(), mise: m });
        setTitre(""); setDescription(""); setMise("10"); setShowForm(false);
      };

      const ouvertes = bounties.filter(b => b.statut === "ouvert").sort((a, b) => b.mise - a.mise);
      const resolues = bounties.filter(b => b.statut === "resolu");

      return React.createElement("div", { className: "flex flex-col gap-3" },
        React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Mise des points pour demander un document précis. Le premier à fournir une bonne réponse gagne la mise."),

        ouvertes.map(b => {
          const reponses = b.reponses ? Object.entries(b.reponses).map(([id, r]) => ({ id, ...r })) : [];
          const isOpen = expanded === b.id;
          const isOwner = b.uid === authUid;
          return React.createElement("div", { key: b.id, className: "rounded-lg border overflow-hidden", style: { borderColor: COLORS.gold, backgroundColor: COLORS.surface } },
            React.createElement("button", { onClick: () => setExpanded(isOpen ? null : b.id), className: "w-full text-left p-4" },
              React.createElement("div", { className: "flex items-center justify-between mb-1" },
                React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, b.titre),
                React.createElement("span", { className: "text-xs font-mono px-2 py-0.5 rounded-full flex items-center gap-1", style: { backgroundColor: "rgba(var(--accent-rgb),0.15)", color: COLORS.gold } }, React.createElement(Icon,{name:"gift",size:11}), " " + b.mise)
              ),
              b.description && React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, b.description),
              React.createElement("p", { className: "text-[11px] mt-2", style: { color: COLORS.textFaint } }, "par " + b.auteur + " · " + reponses.length + " réponse(s)")
            ),
            isOpen && React.createElement("div", { className: "px-4 pb-4 border-t flex flex-col gap-2", style: { borderColor: COLORS.border } },
              reponses.length === 0
                ? React.createElement("p", { className: "text-xs text-center py-3", style: { color: COLORS.textFaint } }, "Aucune réponse pour l'instant.")
                : reponses.map(r => React.createElement("div", { key: r.id, className: "rounded-lg p-2 mt-2", style: { backgroundColor: COLORS.bg } },
                    React.createElement("p", { className: "text-sm", style: { color: COLORS.text } }, r.texte),
                    React.createElement("div", { className: "flex items-center justify-between mt-1" },
                      React.createElement("p", { className: "text-[10px] font-mono", style: { color: COLORS.textMuted } }, r.auteur),
                      isOwner && React.createElement("button", { onClick: () => onChooseWinner(b, r), className: "text-[10px] font-mono px-2 py-1 rounded-full flex items-center gap-1", style: { backgroundColor: COLORS.forest, color: COLORS.text } }, React.createElement(Icon,{name:"trophy",size:11}), " Choisir")
                    )
                  )),
              React.createElement("div", { className: "flex gap-2 mt-2" },
                React.createElement("input", { value: reponseTexte, onChange: e => setReponseTexte(e.target.value), placeholder: "Ta réponse...", className: "flex-1 rounded-lg px-2 py-1.5 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
                React.createElement("button", { onClick: () => { if (reponseTexte.trim()) { onRespondBounty(b.id, reponseTexte.trim()); setReponseTexte(""); } }, className: "px-3 rounded-lg text-sm", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, React.createElement(Icon, {name:"send", size:16}))
              )
            )
          );
        }),

        resolues.length > 0 && React.createElement("div", { className: "flex flex-col gap-2 opacity-60" },
          React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mt-2", style: { color: COLORS.textFaint } }, "Résolues"),
          resolues.map(b => React.createElement("div", { key: b.id, className: "rounded-lg p-3 text-xs flex items-center gap-1.5", style: { backgroundColor: COLORS.surface, color: COLORS.textFaint } }, React.createElement(Icon,{name:"trophy",size:12}), " " + b.titre + ", gagné par " + b.gagnantPseudo))
        ),

        !showForm
          ? React.createElement("button", { onClick: () => setShowForm(true), className: "flex items-center justify-center gap-2 text-sm font-mono py-2.5 rounded-lg border border-dashed", style: { borderColor: COLORS.border, color: COLORS.textMuted } }, "+ Créer une prime")
          : React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("input", { value: titre, onChange: e => setTitre(e.target.value), placeholder: "Ce que tu cherches (ex: Corrigé Compta S3...)", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("textarea", { value: description, onChange: e => setDescription(e.target.value), placeholder: "Détail (optionnel)", rows: 2, className: "w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("input", { value: mise, onChange: e => setMise(e.target.value), type: "number", placeholder: "Points à miser (min 5)", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
              React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Tu as " + points + " points disponibles."),
              React.createElement("div", { className: "flex gap-2" },
                React.createElement("button", { onClick: handleCreate, className: "flex-1 rounded-lg py-2 text-sm font-semibold", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, "Lancer la prime"),
                React.createElement("button", { onClick: () => setShowForm(false), className: "px-4 rounded-lg py-2 text-sm", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
              )
            )
      );
    }
