// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState } from "react";
import { GriotRing, TierBadge } from "../components/Badges.js";
import { LienConfidentialite } from "../components/Confidentialite.js";
import { Icon } from "../components/Icon.js";
import { ANNEES, BADGES } from "../config/constantes.js";
import { FILIERES } from "../data/curriculum.js";
import { COLORS } from "../theme.js";

    export function InfosPersoSection({ pseudo, profil, isOwner, email, whatsapp, matricule, onUpdatePseudo, onUpdateWhatsapp, onUpdatePassword, onSetMatricule, onDemandeChangementAnnee, onDemandeChangementFiliere, onDemandeDeblocageMatricule }) {
      const [nomEdit, setNomEdit] = useState(pseudo || "");
      const [nomMsg, setNomMsg] = useState(null); // { type: "ok" | "err", texte }
      const [nomSaving, setNomSaving] = useState(false);

      // Changement d'année/filière : jamais direct, passe par une demande que seul le
      // propriétaire peut valider (voir AdminTab et les Security Rules).
      const [demandeAnneeOuverte, setDemandeAnneeOuverte] = useState(false);
      const [anneeChoisie, setAnneeChoisie] = useState(profil.annee || ANNEES[0]);
      const [demandeAnneeEnvoyee, setDemandeAnneeEnvoyee] = useState(false);
      const [demandeAnneeMsg, setDemandeAnneeMsg] = useState(null);
      const [demandeFiliereOuverte, setDemandeFiliereOuverte] = useState(false);
      const [filiereChoisie, setFiliereChoisie] = useState(profil.filiere || FILIERES[0]);
      const [demandeFiliereEnvoyee, setDemandeFiliereEnvoyee] = useState(false);
      const [demandeFiliereMsg, setDemandeFiliereMsg] = useState(null);

      const [waEdit, setWaEdit] = useState(whatsapp || "");
      const [waMsg, setWaMsg] = useState(null);
      const [waSaving, setWaSaving] = useState(false);

      const [matEdit, setMatEdit] = useState("");
      const [matMsg, setMatMsg] = useState(null);
      const [matSaving, setMatSaving] = useState(false);

      // Demande de déverrouillage du matricule (une fois enregistré, il est immuable —
      // il faut repasser par le propriétaire pour le modifier).
      const [deblocageOuvert, setDeblocageOuvert] = useState(false);
      const [deblocageConfirmation, setDeblocageConfirmation] = useState("");
      const [deblocageMotif, setDeblocageMotif] = useState("");
      const [deblocageMsg, setDeblocageMsg] = useState(null);
      const [deblocageSaving, setDeblocageSaving] = useState(false);
      const [deblocageEnvoyee, setDeblocageEnvoyee] = useState(false);

      const [pwdActuel, setPwdActuel] = useState("");
      const [pwdNouveau, setPwdNouveau] = useState("");
      const [pwdConfirm, setPwdConfirm] = useState("");
      const [pwdMsg, setPwdMsg] = useState(null);
      const [pwdSaving, setPwdSaving] = useState(false);

      const nomInchange = nomEdit.trim() === (pseudo || "").trim();
      const waInchange = waEdit.trim() === (whatsapp || "").trim();

      const soumettreNom = () => {
        setNomMsg(null);
        const clean = nomEdit.trim();
        if (clean.length < 2) { setNomMsg({ type: "err", texte: "2 caractères minimum." }); return; }
        setNomSaving(true);
        onUpdatePseudo(clean)
          .then(() => setNomMsg({ type: "ok", texte: "Nom mis à jour." }))
          .catch(err => setNomMsg({ type: "err", texte: err.message || "Erreur." }))
          .finally(() => setNomSaving(false));
      };

      const soumettreWhatsapp = () => {
        setWaMsg(null);
        setWaSaving(true);
        onUpdateWhatsapp(waEdit.trim())
          .then(() => setWaMsg({ type: "ok", texte: "Numéro WhatsApp mis à jour." }))
          .catch(err => setWaMsg({ type: "err", texte: err.message || "Erreur." }))
          .finally(() => setWaSaving(false));
      };

      const soumettreMatricule = () => {
        setMatMsg(null);
        const clean = matEdit.trim().toUpperCase();
        if (clean.length < 3) { setMatMsg({ type: "err", texte: "Matricule trop court." }); return; }
        setMatSaving(true);
        onSetMatricule(clean)
          .then(() => setMatMsg({ type: "ok", texte: "Matricule enregistré." }))
          .catch(err => setMatMsg({ type: "err", texte: err.message || "Erreur." }))
          .finally(() => setMatSaving(false));
      };

      const soumettreDeblocageMatricule = () => {
        setDeblocageMsg(null);
        if (deblocageConfirmation.trim().toUpperCase() !== (matricule || "").toUpperCase()) {
          setDeblocageMsg({ type: "err", texte: "Le matricule saisi ne correspond pas à celui enregistré sur ton compte." });
          return;
        }
        if (deblocageMotif.trim().length < 5) { setDeblocageMsg({ type: "err", texte: "Explique brièvement le motif (5 caractères minimum)." }); return; }
        setDeblocageSaving(true);
        onDemandeDeblocageMatricule(deblocageMotif.trim())
          .then(() => { setDeblocageEnvoyee(true); setDeblocageOuvert(false); })
          .catch(err => setDeblocageMsg({ type: "err", texte: err.message || "Erreur." }))
          .finally(() => setDeblocageSaving(false));
      };

      const soumettrePwd = () => {
        setPwdMsg(null);
        if (!pwdActuel) { setPwdMsg({ type: "err", texte: "Saisis ton mot de passe actuel." }); return; }
        if (pwdNouveau.length < 6) { setPwdMsg({ type: "err", texte: "6 caractères minimum pour le nouveau mot de passe." }); return; }
        if (pwdNouveau !== pwdConfirm) { setPwdMsg({ type: "err", texte: "La confirmation ne correspond pas." }); return; }
        setPwdSaving(true);
        onUpdatePassword(pwdActuel, pwdNouveau)
          .then(() => {
            setPwdMsg({ type: "ok", texte: "Mot de passe mis à jour." });
            setPwdActuel(""); setPwdNouveau(""); setPwdConfirm("");
          })
          .catch(err => setPwdMsg({ type: "err", texte: err.message || "Erreur." }))
          .finally(() => setPwdSaving(false));
      };

      const inputStyle = { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text };
      const inputDisabledStyle = { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.textGhost };
      const labelStyle = { color: COLORS.textMuted };

      return React.createElement("div", { className: "flex flex-col gap-4 rounded-lg border p-4", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
        React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Informations personnelles"),

        // Nom / pseudo
        React.createElement("div", { className: "flex flex-col gap-1.5" },
          React.createElement("label", { className: "text-[10px] font-mono uppercase", style: labelStyle }, "Nom"),
          React.createElement("div", { className: "flex gap-2" },
            React.createElement("input", {
              value: nomEdit, onChange: e => setNomEdit(e.target.value), maxLength: 30,
              className: "flex-1 min-w-0 rounded-lg px-3 py-2.5 text-sm outline-none border", style: inputStyle
            }),
            React.createElement("button", {
              onClick: soumettreNom, disabled: nomSaving || nomInchange,
              className: "flex-shrink-0 px-3 rounded-lg text-xs font-mono uppercase",
              style: { backgroundColor: (nomSaving || nomInchange) ? COLORS.border : COLORS.gold, color: (nomSaving || nomInchange) ? COLORS.textFaint : COLORS.bg }
            }, nomSaving ? "..." : "Modifier")
          ),
          nomMsg && React.createElement("p", { className: "text-[11px]", style: { color: nomMsg.type === "ok" ? COLORS.forestText : COLORS.terra } }, nomMsg.texte)
        ),

        // Année d'étude
        !isOwner && React.createElement("div", { className: "flex flex-col gap-1.5" },
          React.createElement("label", { className: "text-[10px] font-mono uppercase", style: labelStyle }, "Année d'étude"),
          demandeAnneeEnvoyee
            ? React.createElement("p", { className: "text-[11px]", style: { color: COLORS.forestText } }, "Demande envoyée, en attente de validation par le propriétaire.")
            : !demandeAnneeOuverte
            ? React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("p", { className: "text-sm", style: { color: COLORS.text } }, profil.annee),
                React.createElement("button", { onClick: () => setDemandeAnneeOuverte(true), className: "text-[11px] font-mono px-2.5 py-1 rounded-full", style: { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted } }, "Demander un changement")
              )
            : React.createElement("div", { className: "flex flex-col gap-2" },
                React.createElement("select", { value: anneeChoisie, onChange: e => setAnneeChoisie(e.target.value), className: "rounded-lg px-2 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, ANNEES.map(a => React.createElement("option", { key: a }, a))),
                React.createElement("div", { className: "flex gap-2" },
                  React.createElement("button", {
                    onClick: () => {
                      if (anneeChoisie === profil.annee) { setDemandeAnneeOuverte(false); return; }
                      setDemandeAnneeMsg(null);
                      onDemandeChangementAnnee(anneeChoisie)
                        .then(() => { setDemandeAnneeEnvoyee(true); setDemandeAnneeOuverte(false); })
                        .catch(err => setDemandeAnneeMsg(err.message || "Échec de l'envoi, réessaie."));
                    },
                    className: "flex-1 rounded-lg py-2 text-sm font-semibold", style: { backgroundColor: COLORS.gold, color: COLORS.bg }
                  }, "Envoyer la demande"),
                  React.createElement("button", { onClick: () => setDemandeAnneeOuverte(false), className: "px-4 rounded-lg py-2 text-sm", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
                ),
                demandeAnneeMsg && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.terra } }, demandeAnneeMsg)
              )
        ),

        // Filière
        !isOwner && React.createElement("div", { className: "flex flex-col gap-1.5" },
          React.createElement("label", { className: "text-[10px] font-mono uppercase", style: labelStyle }, "Filière"),
          demandeFiliereEnvoyee
            ? React.createElement("p", { className: "text-[11px]", style: { color: COLORS.forestText } }, "Demande envoyée, en attente de validation par le propriétaire.")
            : !demandeFiliereOuverte
            ? React.createElement("div", { className: "flex items-center justify-between gap-2" },
                React.createElement("p", { className: "text-sm truncate", style: { color: COLORS.text } }, profil.filiere),
                React.createElement("button", { onClick: () => setDemandeFiliereOuverte(true), className: "flex-shrink-0 text-[11px] font-mono px-2.5 py-1 rounded-full", style: { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted } }, "Demander un changement")
              )
            : React.createElement("div", { className: "flex flex-col gap-2" },
                React.createElement("select", { value: filiereChoisie, onChange: e => setFiliereChoisie(e.target.value), className: "rounded-lg px-2 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, FILIERES.map(f => React.createElement("option", { key: f }, f))),
                React.createElement("div", { className: "flex gap-2" },
                  React.createElement("button", {
                    onClick: () => {
                      if (filiereChoisie === profil.filiere) { setDemandeFiliereOuverte(false); return; }
                      setDemandeFiliereMsg(null);
                      onDemandeChangementFiliere(filiereChoisie)
                        .then(() => { setDemandeFiliereEnvoyee(true); setDemandeFiliereOuverte(false); })
                        .catch(err => setDemandeFiliereMsg(err.message || "Échec de l'envoi, réessaie."));
                    },
                    className: "flex-1 rounded-lg py-2 text-sm font-semibold", style: { backgroundColor: COLORS.gold, color: COLORS.bg }
                  }, "Envoyer la demande"),
                  React.createElement("button", { onClick: () => setDemandeFiliereOuverte(false), className: "px-4 rounded-lg py-2 text-sm", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
                ),
                demandeFiliereMsg && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.terra } }, demandeFiliereMsg)
              )
        ),

        // Matricule — verrouillé une fois défini (sert de clé pour l'attribution automatique des notes)
        React.createElement("div", { className: "flex flex-col gap-1.5" },
          React.createElement("label", { className: "text-[10px] font-mono uppercase", style: labelStyle }, "Matricule"),
          matricule
            ? React.createElement(React.Fragment, null,
                React.createElement("input", { value: matricule, disabled: true, className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none border cursor-not-allowed", style: inputDisabledStyle }),
                deblocageEnvoyee
                  ? React.createElement("p", { className: "text-[11px]", style: { color: COLORS.forestText } }, "Demande envoyée, en attente de validation par le propriétaire.")
                  : !deblocageOuvert
                  ? React.createElement("button", {
                      onClick: () => setDeblocageOuvert(true),
                      className: "text-[11px] font-mono w-fit px-2.5 py-1 rounded-full", style: { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }
                    }, "Demander une modification")
                  : React.createElement("div", { className: "flex flex-col gap-2 mt-1" },
                      React.createElement("p", { className: "text-[10px]", style: { color: COLORS.textFaint } }, "Ressaisis ton matricule actuel pour confirmer, puis explique le motif du changement. Le propriétaire valide ou refuse la demande."),
                      React.createElement("input", {
                        value: deblocageConfirmation, onChange: e => setDeblocageConfirmation(e.target.value.toUpperCase()), placeholder: "Ton matricule actuel",
                        className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none border", style: inputStyle
                      }),
                      React.createElement("textarea", {
                        value: deblocageMotif, onChange: e => setDeblocageMotif(e.target.value), placeholder: "Motif (ex : erreur de saisie, changement de filière...)", rows: 2,
                        className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none border resize-none", style: inputStyle
                      }),
                      deblocageMsg && React.createElement("p", { className: "text-[11px]", style: { color: deblocageMsg.type === "ok" ? COLORS.forestText : COLORS.terra } }, deblocageMsg.texte),
                      React.createElement("div", { className: "flex gap-2" },
                        React.createElement("button", {
                          onClick: soumettreDeblocageMatricule, disabled: deblocageSaving,
                          className: "flex-1 rounded-lg py-2 text-xs font-mono uppercase",
                          style: { backgroundColor: deblocageSaving ? COLORS.border : COLORS.gold, color: deblocageSaving ? COLORS.textFaint : COLORS.bg }
                        }, deblocageSaving ? "..." : "Envoyer la demande"),
                        React.createElement("button", { onClick: () => setDeblocageOuvert(false), className: "px-3 rounded-lg py-2 text-xs", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
                      )
                    )
              )
            : React.createElement(React.Fragment, null,
                React.createElement("p", { className: "text-[10px]", style: { color: COLORS.textFaint } }, "Optionnel pour l'instant, mais nécessaire pour recevoir automatiquement tes notes (rubrique MyScore), tu peux le renseigner plus tard. Une fois enregistré, il devient définitif sauf validation du propriétaire."),
                React.createElement("div", { className: "flex gap-2" },
                  React.createElement("input", {
                    value: matEdit, onChange: e => setMatEdit(e.target.value.toUpperCase()), placeholder: "Ex: 23GTR0123",
                    className: "flex-1 min-w-0 rounded-lg px-3 py-2.5 text-sm outline-none border", style: inputStyle
                  }),
                  React.createElement("button", {
                    onClick: soumettreMatricule, disabled: matSaving,
                    className: "flex-shrink-0 px-3 rounded-lg text-xs font-mono uppercase",
                    style: { backgroundColor: matSaving ? COLORS.border : COLORS.gold, color: matSaving ? COLORS.textFaint : COLORS.bg }
                  }, matSaving ? "..." : "Enregistrer")
                ),
                matMsg && React.createElement("p", { className: "text-[11px]", style: { color: matMsg.type === "ok" ? COLORS.forestText : COLORS.terra } }, matMsg.texte)
              )
        ),

        // Numéro WhatsApp
        React.createElement("div", { className: "flex flex-col gap-1.5" },
          React.createElement("label", { className: "text-[10px] font-mono uppercase", style: labelStyle }, "Numéro WhatsApp"),
          React.createElement("p", { className: "text-[10px]", style: { color: COLORS.textFaint } }, "Visible uniquement par le propriétaire et les administrateurs."),
          React.createElement("div", { className: "flex gap-2" },
            React.createElement("input", {
              value: waEdit, onChange: e => setWaEdit(e.target.value), placeholder: "Ex: 6XX XXX XXX",
              className: "flex-1 min-w-0 rounded-lg px-3 py-2.5 text-sm outline-none border", style: inputStyle
            }),
            React.createElement("button", {
              onClick: soumettreWhatsapp, disabled: waSaving || waInchange,
              className: "flex-shrink-0 px-3 rounded-lg text-xs font-mono uppercase",
              style: { backgroundColor: (waSaving || waInchange) ? COLORS.border : COLORS.gold, color: (waSaving || waInchange) ? COLORS.textFaint : COLORS.bg }
            }, waSaving ? "..." : "Modifier")
          ),
          waMsg && React.createElement("p", { className: "text-[11px]", style: { color: waMsg.type === "ok" ? COLORS.forestText : COLORS.terra } }, waMsg.texte)
        ),

        // Email verrouillé
        React.createElement("div", { className: "flex flex-col gap-1.5" },
          React.createElement("label", { className: "text-[10px] font-mono uppercase", style: labelStyle }, "Adresse e-mail"),
          React.createElement("input", { value: email || "", disabled: true, className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none border cursor-not-allowed", style: inputDisabledStyle })
        ),

        React.createElement("div", { className: "kente-rule" }),

        // Mot de passe
        React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("label", { className: "text-[10px] font-mono uppercase", style: labelStyle }, "Changer le mot de passe"),
          React.createElement("input", {
            type: "password", value: pwdActuel, onChange: e => setPwdActuel(e.target.value), placeholder: "Mot de passe actuel",
            className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none border", style: inputStyle
          }),
          React.createElement("input", {
            type: "password", value: pwdNouveau, onChange: e => setPwdNouveau(e.target.value), placeholder: "Nouveau mot de passe (6 caractères min.)",
            className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none border", style: inputStyle
          }),
          React.createElement("input", {
            type: "password", value: pwdConfirm, onChange: e => setPwdConfirm(e.target.value), placeholder: "Confirme le nouveau mot de passe",
            className: "w-full rounded-lg px-3 py-2.5 text-sm outline-none border", style: inputStyle
          }),
          pwdMsg && React.createElement("p", { className: "text-[11px]", style: { color: pwdMsg.type === "ok" ? COLORS.forestText : COLORS.terra } }, pwdMsg.texte),
          React.createElement("button", {
            onClick: soumettrePwd, disabled: pwdSaving,
            className: "w-full py-2.5 rounded-lg text-xs font-mono uppercase",
            style: { backgroundColor: pwdSaving ? COLORS.border : COLORS.gold, color: pwdSaving ? COLORS.textFaint : COLORS.bg }
          }, pwdSaving ? "Mise à jour..." : "Mettre à jour le mot de passe")
        )
      );
    }

    export function ProfilTab({ pseudo, profil, points, pointsTotal, badgeActif, badges, vip, isOwner, isAdmin, abonnement, whatsapp, matricule, demandesEnAttente, onSetBadgeActif, onNavigate, onLogout, email, onUpdatePseudo, onUpdateWhatsapp, onUpdatePassword, onSetMatricule, onDemandeDeblocageMatricule }) {
      const badgesPossedes = BADGES.filter(b => badges[b.id]);
      // Les 8-9 fonctionnalités secondaires sont regroupées en familles logiques
      // (plutôt qu'une liste plate) pour rester lisibles au premier coup d'œil.
      const groupesLiens = [
        {
          titre: "Académique",
          liens: [
            { id: "myscore", label: "MyScore, mes notes", icon: "award" },
            { id: "resumes", label: "Résumés de cours (Pro+)", icon: "file-text" },
            { id: "simulateur", label: "Simulateur de moyenne", icon: "∑" },
          ],
        },
        {
          titre: "Accompagnement",
          liens: [
            { id: "mentor", label: "Coach Réussite (Pro+)", icon: "target" },
            { id: "boussole", label: "Boussole, parcours du nouvel arrivant", icon: "compass" },
            { id: "assistance", label: "Assistance, écrire au propriétaire", icon: "help-circle" },
          ],
        },
        {
          titre: "Communauté",
          liens: [
            { id: "classement", label: "Classement", icon: "trophy" },
            { id: "boutique", label: "Boutique, VIP & Bounty", icon: "shopping-bag" },
            { id: "membres", label: "Membres inscrits", icon: "users" },
          ],
        },
        ...(isOwner ? [{
          titre: "Administration",
          liens: [
            { id: "admin", label: "Administration", icon: "wrench" },
            { id: "myscoreAdmin", label: "MyScore. Administration", icon: "bar-chart-2" },
            { id: "promoAdmin", label: "Promotions", icon: "tag" },
            { id: "supportAdmin", label: "Messagerie Assistance", icon: "message-circle" },
          ],
        }] : []),
      ];

      return React.createElement("div", { className: "flex flex-col gap-5" },
        React.createElement("div", { className: "rounded-lg border p-5 flex items-center gap-4", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("div", { className: "w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0", style: { border: `1.5px solid ${COLORS.gold}`, backgroundColor: "rgba(var(--accent-rgb),0.1)" } },
            React.createElement("span", { className: "text-xl font-bold", style: { color: COLORS.gold, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, (pseudo || "?").charAt(0).toUpperCase())
          ),
          React.createElement("div", { className: "flex-1 min-w-0" },
            React.createElement("p", { className: "text-base font-semibold truncate", style: { color: COLORS.text } }, pseudo),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, (profil.filiere || "") + " · " + (profil.annee || "")),
            React.createElement("div", { className: "flex gap-1.5 flex-wrap mt-1" },
              isOwner && React.createElement("span", { className: "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1", style: { color: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.15)" } }, React.createElement(Icon,{name:"crown",size:9}), " Propriétaire"),
              (abonnement === "pro" || abonnement === "proplus") && React.createElement("span", { className: "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full inline-flex items-center gap-1", style: { color: COLORS.bg, backgroundColor: COLORS.gold } }, React.createElement(Icon,{name: abonnement === "proplus" ? "gem" : "crown", size:9}), abonnement === "proplus" ? " Sabi Pro+" : " Sabi Pro")
            )
          ),
          React.createElement(GriotRing, { points: pointsTotal, size: 50 })
        ),

        React.createElement("div", { className: "grid grid-cols-2 gap-3" },
          React.createElement("div", { className: "rounded-lg border p-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("p", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textMuted } }, "Solde"),
            React.createElement("p", { className: "text-xl font-bold font-mono", style: { color: COLORS.gold } }, isOwner ? "∞" : points)
          ),
          React.createElement("div", { className: "rounded-lg border p-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("p", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textMuted } }, "Grade"),
            React.createElement(TierBadge, { points: pointsTotal })
          )
        ),

        // Le changement d'année/filière se fait maintenant depuis "Modifier mes informations",
        // pas ici — voir InfosPersoSection.

        badgesPossedes.length > 0 && React.createElement("div", null,
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider mb-2", style: { color: COLORS.textMuted } }, "Mes badges"),
          React.createElement("div", { className: "flex gap-2 flex-wrap" },
            badgesPossedes.map(b => React.createElement("button", {
              key: b.id,
              onClick: () => onSetBadgeActif(badgeActif === b.id ? null : b.id),
              className: "w-12 h-12 rounded-full flex items-center justify-center",
              style: { border: badgeActif === b.id ? `2px solid ${COLORS.gold}` : `1px solid ${COLORS.border}`, backgroundColor: COLORS.surface }
            }, React.createElement(Icon, { name: b.emoji, size: 20, color: COLORS.gold })))
          )
        ),

        React.createElement("div", null,
          React.createElement("button", {
            onClick: () => onNavigate("boutique"),
            className: "w-full rounded-lg border p-3.5 flex items-center gap-3 text-left",
            style: abonnement !== "free" ? { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } : { borderColor: COLORS.border, backgroundColor: COLORS.surface }
          },
            React.createElement("div", { className: "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", style: { backgroundColor: abonnement !== "free" ? "rgba(var(--accent-rgb),0.18)" : COLORS.border } },
              React.createElement(Icon, { name: "gem", size: 16, color: abonnement !== "free" ? COLORS.gold : COLORS.textMuted })
            ),
            React.createElement("div", { className: "flex-1" },
              React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, "Abonnement"),
              React.createElement("p", { className: "text-xs font-mono", style: abonnement !== "free" ? { color: COLORS.gold } : { color: COLORS.textFaint } },
                abonnement === "proplus" ? "Sabi Pro+ actif" : abonnement === "pro" ? "Sabi Pro actif" : "Aucun abonnement")
            ),
            React.createElement("span", { style: { color: COLORS.textFaint } }, "›")
          )
        ),

        React.createElement("div", null,
          React.createElement("button", {
            onClick: () => onNavigate("infosperso"),
            className: "w-full rounded-lg border p-3.5 flex items-center gap-3 text-left",
            style: { borderColor: COLORS.border, backgroundColor: COLORS.surface }
          },
            React.createElement(Icon, { name: "edit-2", size: 17, color: COLORS.textMuted }),
            React.createElement("span", { className: "flex-1 text-sm font-medium", style: { color: COLORS.text } }, "Modifier mes informations"),
            React.createElement("span", { style: { color: COLORS.textFaint } }, "›")
          )
        ),

        React.createElement("div", { className: "flex flex-col gap-5" },
          groupesLiens.map(groupe => React.createElement("div", { key: groupe.titre, className: "flex flex-col gap-2" },
            React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider px-1", style: { color: COLORS.textFaint } }, groupe.titre),
            groupe.liens.map(l => React.createElement("button", { key: l.id, onClick: () => onNavigate(l.id), className: "rounded-lg border p-3.5 flex items-center gap-3 text-left", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement(Icon, { name: l.icon, size: 18, color: COLORS.gold }),
              React.createElement("span", { className: "text-sm flex-1", style: { color: COLORS.text } }, l.label),
              l.id === "admin" && demandesEnAttente > 0 && React.createElement("span", {
                className: "text-[10px] font-mono min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center",
                style: { backgroundColor: COLORS.terra, color: COLORS.bg }
              }, demandesEnAttente > 9 ? "9+" : demandesEnAttente),
              React.createElement("span", { style: { color: COLORS.textFaint } }, "›")
            ))
          ))
        ),

        React.createElement("div", { className: "text-center" }, React.createElement(LienConfidentialite)),
        React.createElement("button", { onClick: onLogout, className: "text-sm font-mono py-3 rounded-lg border", style: { borderColor: COLORS.terra, color: COLORS.terraText } }, "Déconnexion")
      );
    }
