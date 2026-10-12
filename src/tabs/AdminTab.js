// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { COUT_VIP } from "../config/constantes.js";
import { abonnementDemandesRef, auth, demandesAnneeRef, demandesFiliereRef, demandesMatriculeRef, matriculesRef, usersRef, vipDemandesRef } from "../firebase.js";
import { useFirebaseList } from "../hooks/useFirebaseList.js";
import { finDeLAnneeActuelle, finDuSemestreActuel, getAbonnementActif } from "../lib/abonnements.js";
import { NETLIFY_BASE_URL, envoyerNotification } from "../services/netlify.js";
import { COLORS } from "../theme.js";

    export function AdminTab({ isOwner, onGivePoints }) {
      const [tousLesUtilisateurs, setTousLesUtilisateurs] = useState(null);
      const [montants, setMontants] = useState({}); // { uid: "montant saisi" }
      // Suppression de compte (propriétaire uniquement) : confirmation en 2 temps, puis fonction serveur.
      const [suppressionUid, setSuppressionUid] = useState(null);
      const [suppressionEnCours, setSuppressionEnCours] = useState(false);
      const [retourSuppression, setRetourSuppression] = useState(null); // { uid, ok, message }
      const supprimerCompte = async (u) => {
        setSuppressionEnCours(true);
        try {
          const idToken = await auth.currentUser.getIdToken();
          const resp = await fetch(NETLIFY_BASE_URL + "/.netlify/functions/supprimer-compte", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken, uid: u.uid })
          });
          const data = await resp.json().catch(() => null);
          setRetourSuppression({ uid: u.uid, ok: !!(data && data.ok), message: (data && data.message) || "Réponse illisible du serveur." });
        } catch (e) {
          setRetourSuppression({ uid: u.uid, ok: false, message: "Serveur injoignable : " + ((e && e.message) || "réseau") });
        }
        setSuppressionEnCours(false);
        setSuppressionUid(null);
      };
      // Tri par filière de la liste complète des utilisateurs, en bas du panneau admin
      const [filiereFiltreAdmin, setFiliereFiltreAdmin] = useState("toutes");
      const [anneeFiltreAdmin, setAnneeFiltreAdmin] = useState("toutes");
      const [annonceTitre, setAnnonceTitre] = useState("");
      const [annonceTexte, setAnnonceTexte] = useState("");
      const [annonceEnvoi, setAnnonceEnvoi] = useState(false);
      const envoyerAnnonce = async () => {
        if (!annonceTexte.trim()) return;
        setAnnonceEnvoi(true);
        await envoyerNotification({ diffusion: true, titre: annonceTitre.trim() || "Annonce Sabi", corps: annonceTexte.trim() });
        setAnnonceEnvoi(false);
        setAnnonceTitre("");
        setAnnonceTexte("");
      };

      useEffect(() => {
        if (!isOwner) return;
        const listener = usersRef.on("value", snapshot => {
          const data = snapshot.val() || {};
          const list = Object.keys(data).map(uid => ({ uid, ...data[uid] })).sort((a, b) => (a.pseudo || "").localeCompare(b.pseudo || ""));
          setTousLesUtilisateurs(list);
        });
        return () => usersRef.off("value", listener);
      }, [isOwner]);

      // Demandes d'abonnement Sabi Pro/Pro+ en attente de validation manuelle
      const demandesBrut = useFirebaseList(abonnementDemandesRef, { actif: isOwner });
      const demandes = React.useMemo(
        () => [...demandesBrut].sort((a, b) => b.timestamp - a.timestamp),
        [demandesBrut]
      );

      // Demandes de changement d'année — même principe, l'utilisateur ne peut pas
      // se le changer lui-même (voir Security Rules), seul le propriétaire valide.
      const demandesAnneeBrut = useFirebaseList(demandesAnneeRef, { actif: isOwner });
      const demandesAnnee = React.useMemo(
        () => [...demandesAnneeBrut].sort((a, b) => b.timestamp - a.timestamp),
        [demandesAnneeBrut]
      );

      // Demandes de changement de filière — même principe que l'année ci-dessus.
      const demandesFiliereBrut = useFirebaseList(demandesFiliereRef, { actif: isOwner });
      const demandesFiliere = React.useMemo(
        () => [...demandesFiliereBrut].sort((a, b) => b.timestamp - a.timestamp),
        [demandesFiliereBrut]
      );

      // Demandes VIP — les points sont déjà débités au moment de la demande (voir
      // handleBuyVip côté client) ; valider active juste le statut, rejeter rembourse.
      const demandesVipBrut = useFirebaseList(vipDemandesRef, { actif: isOwner });
      const demandesVip = React.useMemo(
        () => [...demandesVipBrut].sort((a, b) => b.timestamp - a.timestamp),
        [demandesVipBrut]
      );
      const validerVip = (demande) => {
        usersRef.child(demande.uid).child("vip").set(true);
        vipDemandesRef.child(demande.id).remove();
      };
      const rejeterVip = (demande) => {
        usersRef.child(demande.uid).child("points").transaction(current => (current || 0) + COUT_VIP);
        vipDemandesRef.child(demande.id).remove();
      };

      const validerAbonnement = (demande) => {
        const expireLe = demande.duree === "annee" ? finDeLAnneeActuelle(Date.now()) : finDuSemestreActuel(Date.now());
        usersRef.child(demande.uid).child("abonnement").set({ tier: demande.tier, duree: demande.duree || "semestre", expireLe });
        abonnementDemandesRef.child(demande.id).remove();
      };
      // Réservé au propriétaire : révoque immédiatement l'abonnement d'un utilisateur,
      // même s'il n'est pas encore expiré.
      const retirerAbonnement = (uid) => {
        if (!isOwner) return;
        usersRef.child(uid).child("abonnement").remove();
      };
      // Réservé au propriétaire : offre un abonnement gratuitement (hors passage par
      // une demande de paiement) — jusqu'à la fin de l'année universitaire en cours.
      // Révocable à tout moment via retirerAbonnement, comme un abonnement payant.
      const offrirAbonnement = (uid, tier) => {
        if (!isOwner) return;
        const expireLe = finDeLAnneeActuelle(Date.now());
        usersRef.child(uid).child("abonnement").set({ tier, duree: "offert", expireLe });
      };
      const rejeterAbonnement = (demande) => {
        abonnementDemandesRef.child(demande.id).remove();
      };

      const validerChangementAnnee = (demande) => {
        usersRef.child(demande.uid).child("annee").set(demande.anneeDemandee);
        demandesAnneeRef.child(demande.id).remove();
      };
      const rejeterChangementAnnee = (demande) => {
        demandesAnneeRef.child(demande.id).remove();
      };

      const validerChangementFiliere = (demande) => {
        usersRef.child(demande.uid).child("filiere").set(demande.filiereDemandee);
        demandesFiliereRef.child(demande.id).remove();
      };
      const rejeterChangementFiliere = (demande) => {
        demandesFiliereRef.child(demande.id).remove();
      };

      // Demandes de déverrouillage du matricule — valider efface le matricule actuel (et son
      // entrée dans l'index) pour permettre à l'étudiant d'en ressaisir un nouveau depuis son profil.
      const demandesMatriculeBrut = useFirebaseList(demandesMatriculeRef, { actif: isOwner });
      const demandesMatricule = React.useMemo(
        () => [...demandesMatriculeBrut].sort((a, b) => b.timestamp - a.timestamp),
        [demandesMatriculeBrut]
      );
      const validerDeblocageMatricule = (demande) => {
        const cle = (demande.matriculeActuel || "").replace(/[.#$/\[\]]/g, "_");
        usersRef.child(demande.uid).child("matricule").remove();
        if (cle) matriculesRef.child(cle).remove();
        demandesMatriculeRef.child(demande.id).remove();
      };
      const rejeterDeblocageMatricule = (demande) => {
        demandesMatriculeRef.child(demande.id).remove();
      };

      const toggleAdmin = (uid, actuel) => {
        usersRef.child(uid).child("admin").set(!actuel);
      };

      // Filières/années réellement présentes parmi les utilisateurs (ordre stable)
      // Même correctif que MembresTab : dérivé des utilisateurs réels, pas de la liste figée.
      const filieresPresentesAdmin = [...new Set((tousLesUtilisateurs || []).map(u => u.filiere).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
      const anneesPresentesAdmin = [...new Set((tousLesUtilisateurs || []).map(u => u.annee).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
      const utilisateursAffichesAdmin = (tousLesUtilisateurs || [])
        .filter(u => filiereFiltreAdmin === "toutes" || u.filiere === filiereFiltreAdmin)
        .filter(u => anneeFiltreAdmin === "toutes" || u.annee === anneeFiltreAdmin);

      if (!isOwner) {
        return React.createElement("p", { className: "text-sm text-center py-10", style: { color: COLORS.textFaint } }, "Accès réservé au propriétaire du site.");
      }

      return React.createElement("div", { className: "flex flex-col gap-3" },
        demandes.length > 0 && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon,{name:"crown",size:14}), " Demandes d'abonnement en attente (" + demandes.length + ")"),
          demandes.map(d => React.createElement("div", { key: d.id, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
            React.createElement("div", { className: "flex-1" },
              React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, d.pseudo),
              React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, "Souhaite : " + (d.tier === "proplus" ? "Sabi Pro+" : "Sabi Pro") + ". " + (d.duree === "annee" ? "annuel" : "semestriel"))
            ),
            React.createElement("button", { onClick: () => validerAbonnement(d), className: "text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1", style: { backgroundColor: COLORS.forest, color: COLORS.text } }, React.createElement(Icon,{name:"check",size:11}), " Valider"),
            React.createElement("button", { onClick: () => rejeterAbonnement(d), className: "text-[11px] font-mono px-2.5 py-1.5 rounded-full flex items-center", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } }, React.createElement(Icon,{name:"x",size:11}))
          ))
        ),
        demandesAnnee.length > 0 && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon,{name:"crown",size:14}), " Demandes de changement d'année (" + demandesAnnee.length + ")"),
          demandesAnnee.map(d => React.createElement("div", { key: d.id, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
            React.createElement("div", { className: "flex-1" },
              React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, d.pseudo),
              React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, d.anneeActuelle + " → " + d.anneeDemandee)
            ),
            React.createElement("button", { onClick: () => validerChangementAnnee(d), className: "text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1", style: { backgroundColor: COLORS.forest, color: COLORS.text } }, React.createElement(Icon,{name:"check",size:11}), " Valider"),
            React.createElement("button", { onClick: () => rejeterChangementAnnee(d), className: "text-[11px] font-mono px-2.5 py-1.5 rounded-full flex items-center", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } }, React.createElement(Icon,{name:"x",size:11}))
          ))
        ),
        demandesFiliere.length > 0 && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon,{name:"crown",size:14}), " Demandes de changement de filière (" + demandesFiliere.length + ")"),
          demandesFiliere.map(d => React.createElement("div", { key: d.id, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
            React.createElement("div", { className: "flex-1" },
              React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, d.pseudo),
              React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, d.filiereActuelle + " → " + d.filiereDemandee)
            ),
            React.createElement("button", { onClick: () => validerChangementFiliere(d), className: "text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1", style: { backgroundColor: COLORS.forest, color: COLORS.text } }, React.createElement(Icon,{name:"check",size:11}), " Valider"),
            React.createElement("button", { onClick: () => rejeterChangementFiliere(d), className: "text-[11px] font-mono px-2.5 py-1.5 rounded-full flex items-center", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } }, React.createElement(Icon,{name:"x",size:11}))
          ))
        ),
        demandesMatricule.length > 0 && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon,{name:"lock",size:14}), " Demandes de déverrouillage matricule (" + demandesMatricule.length + ")"),
          demandesMatricule.map(d => React.createElement("div", { key: d.id, className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
            React.createElement("div", null,
              React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, d.pseudo),
              React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, "Matricule actuel : " + d.matriculeActuel),
              React.createElement("p", { className: "text-[11px] mt-1", style: { color: COLORS.textMuted } }, "Motif : " + d.motif)
            ),
            React.createElement("div", { className: "flex gap-2" },
              React.createElement("button", { onClick: () => validerDeblocageMatricule(d), className: "text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1", style: { backgroundColor: COLORS.forest, color: COLORS.text } }, React.createElement(Icon,{name:"check",size:11}), " Déverrouiller"),
              React.createElement("button", { onClick: () => rejeterDeblocageMatricule(d), className: "text-[11px] font-mono px-2.5 py-1.5 rounded-full flex items-center", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } }, React.createElement(Icon,{name:"x",size:11}), " Refuser")
            )
          ))
        ),
        demandesVip.length > 0 && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon,{name:"star",size:14}), " Demandes VIP en attente (" + demandesVip.length + ")"),
          demandesVip.map(d => React.createElement("div", { key: d.id, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
            React.createElement("div", { className: "flex-1" },
              React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, d.pseudo),
              React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, COUT_VIP + " points déjà débités, rejeter les rembourse")
            ),
            React.createElement("button", { onClick: () => validerVip(d), className: "text-[11px] font-mono px-3 py-1.5 rounded-full flex items-center gap-1", style: { backgroundColor: COLORS.forest, color: COLORS.text } }, React.createElement(Icon,{name:"check",size:11}), " Valider"),
            React.createElement("button", { onClick: () => rejeterVip(d), className: "text-[11px] font-mono px-2.5 py-1.5 rounded-full flex items-center", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } }, React.createElement(Icon,{name:"x",size:11}))
          ))
        ),
        React.createElement("div", { className: "flex flex-col gap-2 rounded-lg border p-3", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.06)" } },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon, { name: "bell", size: 14 }), " Annonce push à tous les utilisateurs"),
          React.createElement("input", {
            value: annonceTitre, onChange: e => setAnnonceTitre(e.target.value), placeholder: "Titre (optionnel, ex: Sabi)",
            className: "rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
          }),
          React.createElement("textarea", {
            value: annonceTexte, onChange: e => setAnnonceTexte(e.target.value), placeholder: "Message de la notification…", rows: 2,
            className: "rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
          }),
          React.createElement("button", {
            onClick: envoyerAnnonce, disabled: annonceEnvoi || !annonceTexte.trim(),
            className: "self-end text-xs font-mono px-4 py-2 rounded-full flex items-center gap-1.5",
            style: { backgroundColor: COLORS.gold, color: COLORS.bg, opacity: (annonceEnvoi || !annonceTexte.trim()) ? 0.5 : 1 }
          }, React.createElement(Icon, { name: "bell", size: 12 }), annonceEnvoi ? "Envoi…" : "Envoyer à tous")
        ),
        filieresPresentesAdmin.length > 0 && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.gold } }, React.createElement(Icon, { name: "users", size: 14 }), " Utilisateurs, trier par filière et année"),
          React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" },
            React.createElement("button", {
              onClick: () => setFiliereFiltreAdmin("toutes"),
              className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
              style: filiereFiltreAdmin === "toutes" ? { backgroundColor: COLORS.gold, color: COLORS.bg, borderColor: COLORS.gold } : { color: COLORS.textMuted, borderColor: COLORS.border }
            }, "Toutes (" + (tousLesUtilisateurs || []).length + ")"),
            filieresPresentesAdmin.map(f => React.createElement("button", {
              key: f, onClick: () => setFiliereFiltreAdmin(f),
              className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
              style: filiereFiltreAdmin === f ? { backgroundColor: COLORS.gold, color: COLORS.bg, borderColor: COLORS.gold } : { color: COLORS.textMuted, borderColor: COLORS.border }
            }, f))
          ),
          anneesPresentesAdmin.length > 0 && React.createElement("div", { className: "flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" },
            React.createElement("button", {
              onClick: () => setAnneeFiltreAdmin("toutes"),
              className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
              style: anneeFiltreAdmin === "toutes" ? { backgroundColor: COLORS.forest, color: COLORS.bg, borderColor: COLORS.forest } : { color: COLORS.textMuted, borderColor: COLORS.border }
            }, "Toutes années"),
            anneesPresentesAdmin.map(a => React.createElement("button", {
              key: a, onClick: () => setAnneeFiltreAdmin(a),
              className: "flex-shrink-0 text-xs font-mono uppercase tracking-wide px-3 py-1.5 rounded-full border",
              style: anneeFiltreAdmin === a ? { backgroundColor: COLORS.forest, color: COLORS.bg, borderColor: COLORS.forest } : { color: COLORS.textMuted, borderColor: COLORS.border }
            }, a))
          )
        ),
        !tousLesUtilisateurs
          ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Chargement...")
          : utilisateursAffichesAdmin.length === 0
          ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Aucun utilisateur pour ce filtre.")
          : utilisateursAffichesAdmin.map(u => { const tierActif = getAbonnementActif(u); return React.createElement("div", { key: u.uid, className: "rounded-lg border p-3 flex flex-col gap-2", style: { borderColor: u.admin ? COLORS.gold : COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("div", { className: "flex items-center gap-3" },
                React.createElement("div", { className: "flex-1" },
                  React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, u.pseudo || "(sans pseudo)"),
                  React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, (u.filiere || "") + " · " + (u.annee || "") + " · " + (u.points || 0) + " pts")
                ),
                React.createElement("button", {
                  onClick: () => toggleAdmin(u.uid, u.admin),
                  className: "text-xs font-mono px-3 py-1.5 rounded-full flex-shrink-0",
                  style: u.admin ? { backgroundColor: COLORS.gold, color: COLORS.bg } : { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }
                }, u.admin ? React.createElement(React.Fragment,null,React.createElement(Icon,{name:"check",size:11}), " Admin") : "Nommer admin")
              ),
              tierActif !== "free" && React.createElement("div", { className: "flex items-center justify-between rounded-lg px-2.5 py-1.5", style: { backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
                React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.gold } },
                  (tierActif === "proplus" ? "Sabi Pro+" : "Sabi Pro") + (u.abonnement.duree === "offert" ? " (offert)" : "") + " · expire le " + new Date(u.abonnement.expireLe).toLocaleDateString("fr-FR")
                ),
                React.createElement("button", {
                  onClick: () => retirerAbonnement(u.uid),
                  className: "text-[10px] font-mono px-2 py-1 rounded-full flex items-center gap-1",
                  style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" }
                }, React.createElement(Icon,{name:"x",size:10}), " Retirer")
              ),
              tierActif === "free" && React.createElement("div", { className: "flex gap-2" },
                React.createElement("button", {
                  onClick: () => offrirAbonnement(u.uid, "pro"),
                  className: "flex-1 text-[11px] font-mono py-1.5 rounded-lg flex items-center justify-center gap-1",
                  style: { border: `1px solid ${COLORS.border}`, color: COLORS.textMuted }
                }, React.createElement(Icon,{name:"gift",size:11}), " Offrir Pro"),
                React.createElement("button", {
                  onClick: () => offrirAbonnement(u.uid, "proplus"),
                  className: "flex-1 text-[11px] font-mono py-1.5 rounded-lg flex items-center justify-center gap-1",
                  style: { border: `1px solid ${COLORS.gold}`, color: COLORS.gold }
                }, React.createElement(Icon,{name:"gift",size:11}), " Offrir Pro+")
              ),
              React.createElement("div", { className: "flex gap-2" },
                React.createElement("input", {
                  type: "number",
                  value: montants[u.uid] || "",
                  onChange: e => setMontants({ ...montants, [u.uid]: e.target.value }),
                  placeholder: "Points à offrir",
                  className: "flex-1 rounded-lg px-2 py-1.5 text-sm outline-none border",
                  style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
                }),
                React.createElement("button", {
                  onClick: () => {
                    const n = parseInt(montants[u.uid], 10);
                    if (!n || n <= 0) return;
                    onGivePoints(u.uid, u, n);
                    setMontants({ ...montants, [u.uid]: "" });
                  },
                  className: "px-3 rounded-lg text-xs font-mono",
                  style: { backgroundColor: COLORS.forest, color: COLORS.text }
                }, React.createElement(Icon,{name:"gift",size:12}), " Offrir")
              ),
              isOwner && !(u.admin) && (retourSuppression && retourSuppression.uid === u.uid && retourSuppression.ok
                ? React.createElement("p", { className: "text-[11px]", style: { color: COLORS.forestText } }, retourSuppression.message)
                : suppressionUid === u.uid
                  ? React.createElement("div", { className: "flex flex-col gap-2 rounded-lg p-2.5", style: { border: "1px solid " + COLORS.terra } },
                      React.createElement("p", { className: "text-[11px]", style: { color: COLORS.terraText, lineHeight: 1.5 } },
                        "Supprimer définitivement le compte de " + (u.pseudo || "cet étudiant") + " ? Son profil, sa progression et son accès sont effacés. Impossible à annuler."),
                      React.createElement("div", { className: "flex gap-2" },
                        React.createElement("button", { onClick: () => setSuppressionUid(null), disabled: suppressionEnCours, className: "flex-1 text-[11px] font-mono py-1.5 rounded-lg", style: { border: "1px solid " + COLORS.border, color: COLORS.textMuted } }, "Annuler"),
                        React.createElement("button", { onClick: () => supprimerCompte(u), disabled: suppressionEnCours, className: "flex-1 text-[11px] font-mono py-1.5 rounded-lg", style: { backgroundColor: COLORS.terra, color: COLORS.bg } }, suppressionEnCours ? "Suppression..." : "Oui, supprimer")))
                  : React.createElement("div", { className: "flex flex-col gap-1" },
                      React.createElement("button", { onClick: () => { setRetourSuppression(null); setSuppressionUid(u.uid); }, className: "text-[11px] font-mono py-1.5 rounded-lg flex items-center justify-center gap-1", style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" } },
                        React.createElement(Icon, { name: "trash", size: 11 }), " Supprimer le compte"),
                      retourSuppression && retourSuppression.uid === u.uid && !retourSuppression.ok && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.terraText } }, retourSuppression.message)))
            ); })
      );
    }
