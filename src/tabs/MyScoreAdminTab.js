// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { matriculesRef, myscoreRef, usersRef } from "../firebase.js";
import { extraireNotesDepuisPhoto } from "../services/ia.js";
import { imprimerPDF } from "./MyScoreTab.js";
import { COLORS } from "../theme.js";

    export function MyScoreAdminTab({ isOwner, fichiersLances }) {
      const [tousLesUtilisateurs, setTousLesUtilisateurs] = useState(null);
      useEffect(() => {
        if (!isOwner) return;
        const listener = usersRef.on("value", snapshot => {
          const data = snapshot.val() || {};
          const list = Object.keys(data).map(uid => ({ uid, ...data[uid] }));
          setTousLesUtilisateurs(list);
        });
        return () => usersRef.off("value", listener);
      }, [isOwner]);

      // ===== Import de feuilles de notes (photos et/ou PDF, un ou plusieurs à la fois) =====
      // Flux : l'admin choisit un ou plusieurs fichiers (chaque PDF peut contenir plusieurs pages,
      // l'IA les lit en entier) -> chaque fichier est analysé séparément (matière propre à chacun) ->
      // on résout chaque matricule vers un compte via /matriculeIndex -> l'admin VÉRIFIE chaque liste
      // avant de confirmer -> écriture groupée dans /myscore/<uid>.
      const [notesDocs, setNotesDocs] = useState([]); // [{ id, fichier, apercu, statut, erreur, matiere, dateDePublication, lignes }]
      const [notesAnalyseEnCours, setNotesAnalyseEnCours] = useState(false);
      const [notesPublication, setNotesPublication] = useState(false);
      const [notesMsg, setNotesMsg] = useState("");

      // Statistiques globales pour le panneau MyScore Admin (notes détectées, moyenne générale)
      const [myscoreStats, setMyscoreStats] = useState({ total: 0, moyenne: null, nouveauxCeMois: 0 });
      useEffect(() => {
        if (!isOwner) return;
        const listener = myscoreRef.on("value", snap => {
          const val = snap.val() || {};
          let total = 0, somme = 0, nouveaux = 0;
          const debutMois = new Date(); debutMois.setDate(1); debutMois.setHours(0, 0, 0, 0);
          Object.values(val).forEach(entriesParUid => {
            Object.values(entriesParUid || {}).forEach(e => {
              if (e.source === "simulateur") return; // ne compte que les notes officielles
              total++;
              somme += Number(e.note) || 0;
              if (e.publieLe && e.publieLe >= debutMois.getTime()) nouveaux++;
            });
          });
          setMyscoreStats({ total, moyenne: total > 0 ? somme / total : null, nouveauxCeMois: nouveaux });
        });
        return () => myscoreRef.off("value", listener);
      }, [isOwner]);

      const choisirFichiersNotes = (fichiers) => {
        const liste = Array.from(fichiers || []).map(fichier => ({
          id: fichier.name + "_" + fichier.size + "_" + Math.random().toString(36).slice(2),
          fichier,
          apercu: fichier.type.startsWith("image/") ? URL.createObjectURL(fichier) : null,
          statut: "attente", // attente | analyse | ok | erreur
          erreur: "", matiere: "", dateDePublication: "", lignes: []
        }));
        setNotesDocs(liste);
        setNotesMsg("");
      };

      // Fichier(s) ouverts directement depuis l'OS (file_handlers) : préremplit l'import dès
      // l'arrivée sur cet onglet, comme si l'admin venait de les choisir via "Parcourir".
      useEffect(() => {
        if (isOwner && fichiersLances && fichiersLances.length > 0) choisirFichiersNotes(fichiersLances);
      }, [fichiersLances, isOwner]);

      const resoudreLignes = async (lignesBrutes) => Promise.all(lignesBrutes.map(async (ligne) => {
        const matNorm = (ligne.matricule || "").trim().toUpperCase();
        const cle = matNorm.replace(/[.#$/\[\]]/g, "_");
        let uid = null, pseudo = null;
        try {
          const snap = await matriculesRef.child(cle).get();
          if (snap.exists()) {
            uid = snap.val();
            const u = (tousLesUtilisateurs || []).find(x => x.uid === uid);
            pseudo = u ? u.pseudo : null;
          }
        } catch {}
        return { matricule: matNorm, note: ligne.note, uid, pseudo };
      }));

      // Analyse chaque document l'un après l'autre (évite de saturer l'API en cas de gros lot)
      // et met à jour son statut au fur et à mesure, pour un retour visuel progressif.
      const analyserTousLesDocs = async () => {
        setNotesAnalyseEnCours(true);
        for (const doc of notesDocs) {
          setNotesDocs(prev => prev.map(d => d.id === doc.id ? { ...d, statut: "analyse" } : d));
          try {
            const resultat = await extraireNotesDepuisPhoto(doc.fichier);
            const lignesResolues = await resoudreLignes(resultat.lignes);
            setNotesDocs(prev => prev.map(d => d.id === doc.id ? {
              ...d, statut: "ok", matiere: resultat.matiere || "", dateDePublication: resultat.dateDePublication || "", lignes: lignesResolues
            } : d));
          } catch (err) {
            setNotesDocs(prev => prev.map(d => d.id === doc.id ? { ...d, statut: "erreur", erreur: err.message || "Échec de l'analyse." } : d));
          }
        }
        setNotesAnalyseEnCours(false);
      };

      const modifierChampDoc = (docId, champ, valeur) => {
        setNotesDocs(prev => prev.map(d => d.id === docId ? { ...d, [champ]: valeur } : d));
      };

      // Permet à l'admin de corriger une ligne à la main avant publication (matricule mal lu, note)
      const modifierLigneNotes = (docId, index, champ, valeur) => {
        setNotesDocs(prev => prev.map(d => {
          if (d.id !== docId) return d;
          const lignes = [...d.lignes];
          lignes[index] = { ...lignes[index], [champ]: valeur };
          if (champ === "matricule") {
            const cle = valeur.trim().toUpperCase().replace(/[.#$/\[\]]/g, "_");
            const u = (tousLesUtilisateurs || []).find(x => (x.matricule || "").replace(/[.#$/\[\]]/g, "_") === cle);
            lignes[index].uid = u ? u.uid : null;
            lignes[index].pseudo = u ? u.pseudo : null;
          }
          return { ...d, lignes };
        }));
      };

      const retirerDoc = (docId) => setNotesDocs(prev => prev.filter(d => d.id !== docId));

      const [filtreErreurs, setFiltreErreurs] = useState({}); // { [docId]: boolean }
      const toggleFiltreErreurs = (docId) => setFiltreErreurs(prev => ({ ...prev, [docId]: !prev[docId] }));

      // Statut de vérification d'une ligne : correspondance exacte / conflit (matricule connu mais note à vérifier) / nouvel élève (matricule inconnu)
      const statutLigne = (l) => !l.uid ? "nouveau" : (l.note == null || l.note === "") ? "conflit" : "exact";
      const STATUT_LIGNE_STYLE = {
        exact: { label: "OK", color: COLORS.forestText, bg: "rgba(58,107,66,0.08)" },
        conflit: { label: "Note manquante", color: COLORS.gold, bg: "rgba(var(--accent-rgb),0.1)" },
        nouveau: { label: "Nouveau matricule", color: COLORS.terraText, bg: "rgba(255,180,171,0.1)" }
      };

      // Export PDF d'un document importé (lignes reconnues, avant ou après publication)
      const exporterDocAdmin = (doc) => {
        const lignes = doc.lignes.filter(l => l.note != null && l.note !== "").map(l =>
          "<tr><td>" + l.matricule + "</td><td>" + (l.pseudo || "-") + "</td><td class='note'>" + l.note + "/20</td></tr>"
        ).join("");
        imprimerPDF("Import. " + (doc.matiere || "Notes"),
          "<h1>" + (doc.matiere || "Notes") + "</h1>" +
          "<p class='meta'>Date : " + (doc.dateDePublication || "-") + "</p>" +
          "<p class='meta'>Édité le " + new Date().toLocaleDateString("fr-FR") + "</p>" +
          "<table><thead><tr><th>Matricule</th><th>Étudiant</th><th>Note</th></tr></thead><tbody>" + lignes + "</tbody></table>"
        );
      };

      // Export PDF de la liste complète : tous les étudiants et toutes leurs notes officielles publiées
      const exporterListeCompleteAdmin = async () => {
        const snap = await myscoreRef.once("value");
        const val = snap.val() || {};
        const lignes = (tousLesUtilisateurs || []).flatMap(u => {
          const notesUid = Object.values(val[u.uid] || {}).filter(n => n.source !== "simulateur");
          return notesUid.map(n =>
            "<tr><td>" + (u.matricule || "-") + "</td><td>" + (u.pseudo || "") + "</td><td>" + (n.matiere || "") + "</td><td class='note'>" + n.note + "/20</td></tr>"
          );
        }).join("");
        imprimerPDF("Liste complète. MyScore",
          "<h1>Liste complète des notes. Sabi</h1>" +
          "<p class='meta'>Édité le " + new Date().toLocaleDateString("fr-FR") + "</p>" +
          "<table><thead><tr><th>Matricule</th><th>Étudiant</th><th>Matière</th><th>Note</th></tr></thead><tbody>" + lignes + "</tbody></table>"
        );
      };

      // Publie uniquement les lignes valides d'un seul document (bouton "Tout valider" par carte)
      const publierUnDoc = async (doc) => {
        setNotesPublication(true);
        setNotesMsg("");
        try {
          const lignesValides = doc.lignes.filter(l => l.uid && l.note != null && l.note !== "");
          await Promise.all(lignesValides.map(l =>
            myscoreRef.child(l.uid).push({
              matiere: doc.matiere.trim() || "Matière", note: Number(l.note),
              dateDePublication: doc.dateDePublication || "", publieLe: Date.now()
            })
          ));
          setNotesMsg(lignesValides.length + " note(s) publiée(s) pour " + (doc.matiere || "ce document") + ".");
          setNotesDocs(prev => prev.filter(d => d.id !== doc.id));
        } catch (err) {
          setNotesMsg("Erreur : " + (err.message || "échec de la publication."));
        } finally {
          setNotesPublication(false);
        }
      };

      // Publie d'un coup toutes les notes valides de TOUS les documents analysés.
      const publierNotes = async () => {
        setNotesPublication(true);
        setNotesMsg("");
        const publieLe = Date.now();
        let total = 0;
        try {
          for (const doc of notesDocs) {
            if (doc.statut !== "ok") continue;
            const lignesValides = doc.lignes.filter(l => l.uid && l.note != null && l.note !== "");
            await Promise.all(lignesValides.map(l =>
              myscoreRef.child(l.uid).push({
                matiere: doc.matiere.trim() || "Matière", note: Number(l.note),
                dateDePublication: doc.dateDePublication || "", publieLe
              })
            ));
            total += lignesValides.length;
          }
          setNotesMsg(total + " note(s) publiée(s) avec succès, sur " + notesDocs.length + " document(s).");
          setNotesDocs([]);
        } catch (err) {
          setNotesMsg("Erreur : " + (err.message || "échec de la publication."));
        } finally {
          setNotesPublication(false);
        }
      };

      if (!isOwner) {
        return React.createElement("p", { className: "text-sm text-center py-10", style: { color: COLORS.textFaint } }, "Accès réservé au propriétaire du site.");
      }

      return React.createElement("div", { className: "flex flex-col gap-3" },
        React.createElement("div", { className: "flex flex-col gap-3 rounded-lg border p-4", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement("div", null,
            React.createElement("p", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Panneau d'Administration MyScore"),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Gestion et numérisation des résultats académiques.")
          ),
          React.createElement("div", { className: "grid grid-cols-2 gap-2.5" },
            React.createElement("div", { className: "rounded-lg border p-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.bg } },
              React.createElement("p", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textFaint } }, "Notes détectées"),
              React.createElement("p", { className: "text-xl font-bold font-mono", style: { color: COLORS.gold } }, myscoreStats.total),
              myscoreStats.nouveauxCeMois > 0 && React.createElement("p", { className: "text-[10px] font-mono flex items-center gap-1", style: { color: COLORS.forestText } }, React.createElement(Icon, { name: "trending-up", size: 10 }), "+" + myscoreStats.nouveauxCeMois + " ce mois")
            ),
            React.createElement("div", { className: "rounded-lg border p-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.bg } },
              React.createElement("p", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textFaint } }, "Moyenne générale"),
              React.createElement("p", { className: "text-xl font-bold font-mono", style: { color: COLORS.text } }, myscoreStats.moyenne !== null ? myscoreStats.moyenne.toFixed(1) : "-"),
              React.createElement("div", { className: "w-full h-1.5 rounded-full overflow-hidden mt-1", style: { backgroundColor: COLORS.border } },
                React.createElement("div", { className: "h-full rounded-full", style: { width: (myscoreStats.moyenne !== null ? Math.min(100, myscoreStats.moyenne / 20 * 100) : 0) + "%", backgroundColor: COLORS.forest } })
              )
            )
          ),
          myscoreStats.total > 0 && React.createElement("button", {
            onClick: exporterListeCompleteAdmin,
            className: "text-xs font-mono py-2 rounded-lg border flex items-center justify-center gap-1.5",
            style: { borderColor: COLORS.border, color: COLORS.textMuted }
          }, React.createElement(Icon, { name: "printer", size: 13 }), "Exporter la liste complète en PDF"),
          React.createElement("div", null,
            React.createElement("div", { className: "flex items-center justify-between mb-1.5" },
              React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, "Nouvel Import"),
              React.createElement(Icon, { name: "save", size: 15, color: COLORS.textFaint })
            ),
            React.createElement("label", {
              className: "rounded-lg border border-dashed flex flex-col items-center gap-2 py-6 cursor-pointer",
              style: { borderColor: COLORS.border }
            },
              React.createElement(Icon, { name: "file-text", size: 26, color: COLORS.textFaint }),
              React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.textMuted } }, "Déposez les relevés ici"),
              React.createElement("p", { className: "text-[10px] font-mono", style: { color: COLORS.textFaint } }, "PDF, JPG, PNG (Max 10MB)"),
              React.createElement("span", { className: "text-[10px] font-mono uppercase px-3 py-1.5 rounded-lg mt-1", style: { backgroundColor: COLORS.bg, color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Parcourir"),
              React.createElement("input", {
                type: "file", accept: "image/*,application/pdf", multiple: true,
                onChange: e => choisirFichiersNotes(e.target.files),
                className: "hidden"
              })
            )
          ),
          notesMsg && React.createElement("p", { className: "text-xs", style: { color: notesMsg.startsWith("Erreur") ? COLORS.terraText : COLORS.forest } }, notesMsg),

          notesDocs.length > 0 && React.createElement("button", {
            onClick: analyserTousLesDocs, disabled: notesAnalyseEnCours || notesDocs.every(d => d.statut !== "attente"),
            className: "rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40",
            style: { backgroundColor: notesAnalyseEnCours ? COLORS.border : COLORS.gold, color: notesAnalyseEnCours ? COLORS.textFaint : COLORS.bg }
          }, React.createElement(Icon, { name: "sparkles", size: 14 }), notesAnalyseEnCours ? "Analyse en cours… (jusqu'à 1 min par document)" : "Analyser avec Gemini IA"),

          React.createElement("div", { className: "flex flex-col gap-3" },
            notesDocs.map(doc => React.createElement("div", {
              key: doc.id, className: "rounded-lg border p-2.5 flex flex-col gap-2",
              style: { borderColor: doc.statut === "erreur" ? COLORS.terra : COLORS.border, backgroundColor: COLORS.bg }
            },
              React.createElement("div", { className: "flex items-center gap-2" },
                doc.apercu
                  ? React.createElement("img", { src: doc.apercu, alt: "Aperçu du document", loading: "lazy", decoding: "async", className: "w-10 h-10 object-cover rounded-lg flex-shrink-0", style: { border: `1px solid ${COLORS.border}` } })
                  : React.createElement(Icon, { name: "file-text", size: 22, color: COLORS.textFaint, style: { flexShrink: 0 } }),
                React.createElement("p", { className: "text-xs truncate flex-1", style: { color: COLORS.textMuted } }, doc.fichier.name),
                React.createElement("span", { className: "text-[10px] font-mono flex-shrink-0", style: {
                  color: doc.statut === "ok" ? COLORS.forestText : doc.statut === "erreur" ? COLORS.terra : doc.statut === "analyse" ? COLORS.gold : COLORS.textFaint
                } }, doc.statut === "ok" ? "Analysé" : doc.statut === "erreur" ? "Échec" : doc.statut === "analyse" ? "Analyse…" : "En attente"),
                doc.statut === "ok" && React.createElement("button", { onClick: () => exporterDocAdmin(doc), className: "flex-shrink-0", style: { color: COLORS.textFaint } }, React.createElement(Icon, { name: "printer", size: 14 })),
                React.createElement("button", { onClick: () => retirerDoc(doc.id), className: "flex-shrink-0", style: { color: COLORS.textFaint } }, React.createElement(Icon, { name: "x", size: 14 }))
              ),
              doc.statut === "erreur" && React.createElement("p", { className: "text-[11px]", style: { color: COLORS.terraText } }, doc.erreur),

              doc.statut === "ok" && React.createElement("div", { className: "flex flex-col gap-2" },
                React.createElement("div", { className: "grid grid-cols-2 gap-2" },
                  React.createElement("input", {
                    value: doc.matiere, placeholder: "Matière",
                    onChange: e => modifierChampDoc(doc.id, "matiere", e.target.value),
                    className: "rounded-lg px-2 py-1.5 text-xs outline-none border", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
                  }),
                  React.createElement("input", {
                    value: doc.dateDePublication, placeholder: "Date (JJ/MM/AAAA)",
                    onChange: e => modifierChampDoc(doc.id, "dateDePublication", e.target.value),
                    className: "rounded-lg px-2 py-1.5 text-xs outline-none border", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
                  })
                ),
                React.createElement("div", { className: "flex items-center justify-between gap-2" },
                  React.createElement("p", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textFaint } },
                    doc.lignes.filter(l => statutLigne(l) === "exact").length + " / " + doc.lignes.length + " lignes vérifiées"
                  ),
                  doc.lignes.some(l => statutLigne(l) !== "exact") && React.createElement("button", {
                    onClick: () => toggleFiltreErreurs(doc.id),
                    className: "text-[10px] font-mono px-2 py-1 rounded-full flex-shrink-0",
                    style: { color: filtreErreurs[doc.id] ? COLORS.bg : COLORS.terraText, backgroundColor: filtreErreurs[doc.id] ? COLORS.terra : "rgba(255,180,171,0.1)" }
                  }, filtreErreurs[doc.id] ? "Tout afficher" : "Voir erreurs seulement (" + doc.lignes.filter(l => statutLigne(l) !== "exact").length + ")")
                ),
                React.createElement("div", { className: "flex flex-col gap-1.5 max-h-56 overflow-y-auto" },
                  doc.lignes.filter(l => !filtreErreurs[doc.id] || statutLigne(l) !== "exact").map((l, i0) => {
                    const i = doc.lignes.indexOf(l);
                    const s = STATUT_LIGNE_STYLE[statutLigne(l)];
                    return React.createElement("div", {
                      key: i, className: "flex flex-col gap-1 rounded-lg p-1.5",
                      style: { backgroundColor: s.bg, border: `1px solid ${s.color}` }
                    },
                      React.createElement("div", { className: "flex items-center gap-1.5" },
                        React.createElement("input", {
                          value: l.matricule, onChange: e => modifierLigneNotes(doc.id, i, "matricule", e.target.value),
                          className: "flex-1 min-w-0 bg-transparent text-xs font-mono outline-none", style: { color: COLORS.text }
                        }),
                        React.createElement("span", { className: "text-[10px] truncate flex-shrink-0 max-w-[90px]", style: { color: l.uid ? COLORS.forestText : COLORS.terra } }, l.pseudo || (l.uid ? "?" : "non trouvé")),
                        React.createElement("input", {
                          type: "number", value: l.note != null ? l.note : "", onChange: e => modifierLigneNotes(doc.id, i, "note", e.target.value === "" ? null : Number(e.target.value)),
                          className: "w-12 flex-shrink-0 bg-transparent text-xs font-mono outline-none text-center", style: { color: COLORS.gold }
                        })
                      ),
                      React.createElement("span", { className: "text-[9px] font-mono uppercase", style: { color: s.color } }, s.label)
                    );
                  })
                )
              )
            ))
          ),

          notesDocs.some(d => d.statut === "ok") && React.createElement("div", { className: "flex gap-2" },
            React.createElement("button", { onClick: () => setNotesDocs([]), className: "flex-1 text-[11px] font-mono py-2 rounded-lg", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Tout annuler"),
            React.createElement("button", {
              onClick: publierNotes,
              disabled: notesPublication || notesDocs.filter(d => d.statut === "ok").every(d => d.lignes.filter(l => l.uid && l.note != null).length === 0),
              className: "flex-1 text-[11px] font-mono py-2 rounded-lg disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg }
            }, notesPublication ? "Publication..." : "Confirmer et publier toutes les notes")
          )
        ),
      );
    }
