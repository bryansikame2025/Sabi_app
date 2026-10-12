// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { ANNEES, SEMESTRES } from "../config/constantes.js";
import { CURRICULUM } from "../data/curriculum.js";
import { myscoreRef, usersRef } from "../firebase.js";
import { JaugeCirculaire } from "./MyScoreTab.js";
import { COLORS } from "../theme.js";

    export function SimulateurTab({ authUid, profilAnnee, profilFiliere }) {
      const [annee, setAnnee] = useState(profilAnnee || ANNEES[0]);
      const [semestre, setSemestre] = useState(SEMESTRES[0]);
      const [pctCC, setPctCC] = useState(40);
      const [objectifVise, setObjectifVise] = useState(16);

      // Si un référentiel existe pour la filière/année/semestre de l'étudiant, on préremplit avec les
      // vraies UE (code + nom + coefficient) plutôt que des UE1/UE2 génériques.
      const ueReference = CURRICULUM[profilFiliere]?.[annee]?.[semestre] || null;
      const lignesParDefaut = () => ueReference
        ? ueReference.map((ue, i) => ({ id: i + 1, nom: ue.code + ". " + ue.nom, noteCC: "", noteExamen: "", coef: String(ue.credit || 1) }))
        : [
            { id: 1, nom: "UE1", noteCC: "", noteExamen: "", coef: "3" },
            { id: 2, nom: "UE2", noteCC: "", noteExamen: "", coef: "2" },
          ];

      const [rows, setRows] = useState(lignesParDefaut());
      const [loaded, setLoaded] = useState(false);
      const [moyennePrecedente, setMoyennePrecedente] = useState(null);

      const cleKey = annee.replace(/\s+/g, "") + "_" + semestre.replace(/\s+/g, "");
      const simRef = React.useMemo(() => usersRef.child(authUid).child("simulateur").child(cleKey), [authUid, cleKey]);

      // Charge la simulation existante à chaque changement d'année/semestre
      useEffect(() => {
        setLoaded(false);
        simRef.once("value").then(snapshot => {
          const data = snapshot.val();
          if (data && data.rows) {
            setRows(data.rows);
            setPctCC(data.pctCC || 40);
            setObjectifVise(data.objectifVise || 16);
          } else {
            setRows(lignesParDefaut());
            setPctCC(40);
            setObjectifVise(16);
          }
          setLoaded(true);
        }).catch(() => setLoaded(true)); // même en cas d'échec, on sort de l'état "Chargement..." plutôt que de rester bloqué
      }, [authUid, cleKey]);

      // Calcule la moyenne du semestre précédent (même année si Semestre 2, sinon année d'avant)
      // pour afficher un delta — purement local, aucun appel réseau supplémentaire à l'IA.
      useEffect(() => {
        const idxSemestre = SEMESTRES.indexOf(semestre);
        const idxAnnee = ANNEES.indexOf(annee);
        let anneePrec = annee, semestrePrec = null;
        if (idxSemestre > 0) semestrePrec = SEMESTRES[idxSemestre - 1];
        else if (idxAnnee > 0) { anneePrec = ANNEES[idxAnnee - 1]; semestrePrec = SEMESTRES[SEMESTRES.length - 1]; }
        if (!semestrePrec) { setMoyennePrecedente(null); return; }
        const clePrec = anneePrec.replace(/\s+/g, "") + "_" + semestrePrec.replace(/\s+/g, "");
        usersRef.child(authUid).child("simulateur").child(clePrec).once("value").then(snapshot => {
          const data = snapshot.val();
          if (!data || !data.rows) { setMoyennePrecedente(null); return; }
          const pct = data.pctCC || 40;
          const valides = data.rows.map(r => {
            const cc = parseFloat(r.noteCC), ex = parseFloat(r.noteExamen), coef = parseFloat(r.coef);
            if (isNaN(coef)) return null;
            let final = null;
            if (!isNaN(cc) && !isNaN(ex)) final = (cc * pct + ex * (100 - pct)) / 100;
            else if (!isNaN(ex)) final = ex;
            else if (!isNaN(cc)) final = cc;
            return final !== null ? { final, coef } : null;
          }).filter(Boolean);
          const totalCoef = valides.reduce((s, r) => s + r.coef, 0);
          setMoyennePrecedente(totalCoef > 0 ? valides.reduce((s, r) => s + r.final * r.coef, 0) / totalCoef : null);
        });
      }, [cleKey, authUid]);

      // Sauvegarde automatique (avec un léger délai pour ne pas spammer Firebase à chaque frappe)
      useEffect(() => {
        if (!loaded) return;
        const t = setTimeout(() => {
          simRef.set({ rows, pctCC, objectifVise });
        }, 700);
        return () => clearTimeout(t);
      }, [rows, pctCC, objectifVise, loaded]);

      const addRow = () => setRows(r => [...r, { id: Date.now(), nom: `UE${r.length + 1}`, noteCC: "", noteExamen: "", coef: "1" }]);
      const removeRow = id => setRows(r => r.filter(row => row.id !== id));
      const updateRow = (id, field, value) => setRows(r => r.map(row => row.id === id ? { ...row, [field]: value } : row));

      const [sauvegardeMyScore, setSauvegardeMyScore] = useState(false);
      const sauvegarderDansMyScore = () => {
        const updates = {};
        validRows.forEach(r => {
          const cleUE = String(r.nom).trim().replace(/[.#$/\[\]]/g, "_") || ("ue" + r.id);
          const cleEntree = "sim_" + cleKey + "_" + cleUE;
          updates[cleEntree] = {
            matiere: r.nom + " (" + annee + " · " + semestre + ")",
            note: Math.round(r.final * 100) / 100,
            source: "simulateur",
            dateDePublication: "Simulé",
            publieLe: Date.now(),
          };
        });
        myscoreRef.child(authUid).update(updates).then(() => {
          setSauvegardeMyScore(true);
          setTimeout(() => setSauvegardeMyScore(false), 3000);
        });
      };

      const calc = (row) => {
        const cc = parseFloat(row.noteCC);
        const ex = parseFloat(row.noteExamen);
        const coef = parseFloat(row.coef);
        if (isNaN(coef)) return null;
        if (!isNaN(cc) && !isNaN(ex)) return (cc * pctCC + ex * (100 - pctCC)) / 100;
        if (!isNaN(ex)) return ex; // pas de CC renseigné → on prend juste l'examen
        if (!isNaN(cc)) return cc; // pas d'examen renseigné → on prend juste le CC
        return null;
      };

      const validRows = rows.map(r => ({ ...r, final: calc(r) })).filter(r => r.final !== null && !isNaN(parseFloat(r.coef)));
      const totalCoef = validRows.reduce((s, r) => s + parseFloat(r.coef), 0);
      const totalPoints = validRows.reduce((s, r) => s + r.final * parseFloat(r.coef), 0);
      const moyenne = totalCoef > 0 ? totalPoints / totalCoef : null;
      const valide = moyenne !== null && moyenne >= 10;

      // Simulateur d'objectif — 100% calcul local (aucun appel IA) : détermine la moyenne
      // nécessaire dans les UE encore vides pour atteindre l'objectif visé, en conservant
      // les UE déjà renseignées à leur valeur actuelle.
      const rowsVides = rows.filter(r => calc(r) === null && !isNaN(parseFloat(r.coef)));
      const coefVides = rowsVides.reduce((s, r) => s + parseFloat(r.coef), 0);
      const coefTotalTout = rows.reduce((s, r) => !isNaN(parseFloat(r.coef)) ? s + parseFloat(r.coef) : s, 0);
      const noteRequisePourVides = coefVides > 0
        ? (objectifVise * coefTotalTout - totalPoints) / coefVides
        : null;
      let statutObjectif, messageObjectif;
      if (moyenne !== null && rowsVides.length === 0) {
        statutObjectif = moyenne >= objectifVise ? "Atteint" : "Manqué";
        messageObjectif = moyenne >= objectifVise
          ? "Objectif déjà atteint avec les notes renseignées."
          : "Toutes les UE sont renseignées : l'objectif ne peut plus être atteint ce semestre.";
      } else if (noteRequisePourVides !== null) {
        if (noteRequisePourVides > 20) { statutObjectif = "Hors de portée"; messageObjectif = "Même 20/20 partout ne suffirait pas à atteindre cet objectif."; }
        else if (noteRequisePourVides <= 0) { statutObjectif = "Déjà assuré"; messageObjectif = "L'objectif est atteint quelle que soit la suite."; }
        else {
          statutObjectif = noteRequisePourVides > 14 ? "Ambitieux" : "Atteignable";
          messageObjectif = "Pour atteindre " + objectifVise.toFixed(1) + "/20, il te faut une moyenne de " +
            noteRequisePourVides.toFixed(1) + "/20 dans : " + rowsVides.map(r => r.nom).join(", ") + ".";
        }
      } else {
        statutObjectif = "-"; messageObjectif = "Renseigne au moins une UE pour voir la projection.";
      }

      return React.createElement("div", { className: "flex flex-col gap-4" },
        React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Simulateur de moyenne"),
        React.createElement("p", { className: "text-sm", style: { color: COLORS.textMuted } }, "Ton simulateur personnel, sauvegardé automatiquement sur ton compte, par année et semestre."),

        ueReference && ueReference.some(ue => !ue.credit) && React.createElement("div", { className: "rounded-lg border p-2.5 flex items-start gap-2", style: { borderColor: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.08)" } },
          React.createElement(Icon, { name: "help-circle", size: 13, color: COLORS.gold, style: { marginTop: 1, flexShrink: 0 } }),
          React.createElement("p", { className: "text-[11px]", style: { color: COLORS.gold } }, "Les noms d'UE sont préremplis, mais les coefficients de ce semestre ne sont pas encore vérifiés (mis à 1 par défaut), corrige-les avec ton relevé officiel si besoin.")
        ),

        React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("div", { className: "rounded-lg border px-4 py-3 flex items-center justify-between gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("span", { className: "flex items-center gap-2 text-sm font-semibold", style: { color: COLORS.text } },
              React.createElement(Icon, { name: "calendar", size: 15, color: COLORS.gold }), "Année"
            ),
            React.createElement("select", { value: annee, onChange: e => setAnnee(e.target.value), className: "rounded-lg px-3 py-1.5 text-sm outline-none border font-mono", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, ANNEES.map(a => React.createElement("option", { key: a }, a)))
          ),
          React.createElement("div", { className: "rounded-lg border px-4 py-3 flex items-center justify-between gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("span", { className: "flex items-center gap-2 text-sm font-semibold", style: { color: COLORS.text } },
              React.createElement(Icon, { name: "calendar", size: 15, color: COLORS.gold }), "Semestre"
            ),
            React.createElement("select", { value: semestre, onChange: e => setSemestre(e.target.value), className: "rounded-lg px-3 py-1.5 text-sm outline-none border font-mono", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }, SEMESTRES.map(s => React.createElement("option", { key: s }, s)))
          )
        ),

        React.createElement("div", { className: "flex items-center gap-3" },
          React.createElement("label", { className: "text-xs font-mono uppercase tracking-wider whitespace-nowrap", style: { color: COLORS.textMuted } }, "Poids du CC"),
          React.createElement("input", { type: "range", min: 0, max: 100, step: 5, value: pctCC, onChange: e => setPctCC(parseInt(e.target.value, 10)), className: "flex-1" }),
          React.createElement("span", { className: "font-mono text-xs", style: { color: COLORS.gold } }, pctCC + "% / " + (100 - pctCC) + "%")
        ),

        !loaded ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Chargement...") : React.createElement(React.Fragment, null,
          React.createElement("div", { className: "flex flex-col gap-3 min-w-0" },
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, "Unités d'Enseignement"),
              React.createElement("button", { onClick: addRow, className: "w-7 h-7 rounded-full flex items-center justify-center", style: { backgroundColor: "rgba(var(--accent-rgb),0.12)" } },
                React.createElement(Icon, { name: "plus", size: 15, color: COLORS.gold })
              )
            ),
            rows.map(row => React.createElement("div", { key: row.id, className: "rounded-lg border p-3.5 flex flex-col gap-2.5", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("div", { className: "flex items-center justify-between gap-2 pb-2 border-b", style: { borderColor: COLORS.border } },
                React.createElement("input", { value: row.nom, onChange: e => updateRow(row.id, "nom", e.target.value), className: "flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none", style: { color: COLORS.text } }),
                React.createElement("button", { onClick: () => removeRow(row.id), className: "w-6 h-6 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-[#4d4635]" },
                  React.createElement(Icon, { name: "x", size: 13, color: COLORS.textFaint })
                )
              ),
              React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                React.createElement("div", { className: "flex flex-col gap-1" },
                  React.createElement("span", { className: "text-[9px] font-mono uppercase", style: { color: COLORS.textFaint } }, "Note CC"),
                  React.createElement("input", { value: row.noteCC, onChange: e => updateRow(row.id, "noteCC", e.target.value), type: "number", placeholder: "--", className: "w-full rounded-lg px-2 py-2 text-sm outline-none border font-mono text-center", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } })
                ),
                React.createElement("div", { className: "flex flex-col gap-1" },
                  React.createElement("span", { className: "text-[9px] font-mono uppercase", style: { color: COLORS.textFaint } }, "Examen"),
                  React.createElement("input", { value: row.noteExamen, onChange: e => updateRow(row.id, "noteExamen", e.target.value), type: "number", placeholder: "--", className: "w-full rounded-lg px-2 py-2 text-sm outline-none border font-mono text-center", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } })
                ),
                React.createElement("div", { className: "flex flex-col gap-1" },
                  React.createElement("span", { className: "text-[9px] font-mono uppercase", style: { color: COLORS.textFaint } }, "Coef"),
                  React.createElement("input", { value: row.coef, onChange: e => updateRow(row.id, "coef", e.target.value), type: "number", className: "w-full rounded-lg px-2 py-2 text-sm outline-none border font-mono text-center", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.gold } })
                )
              )
            )),
            React.createElement("button", { onClick: addRow, className: "rounded-lg border border-dashed p-3.5 flex flex-col gap-2.5 text-left", style: { borderColor: COLORS.border } },
              React.createElement("div", { className: "flex items-center justify-between pb-2 border-b", style: { borderColor: COLORS.border } },
                React.createElement("span", { className: "text-sm font-semibold", style: { color: COLORS.textFaint } }, "Nouvelle Matière"),
                React.createElement(Icon, { name: "plus", size: 13, color: COLORS.textFaint })
              ),
              React.createElement("div", { className: "grid grid-cols-3 gap-2" },
                ["Note CC", "Examen", "Coef"].map((lbl, i) => React.createElement("div", { key: lbl, className: "flex flex-col gap-1" },
                  React.createElement("span", { className: "text-[9px] font-mono uppercase", style: { color: COLORS.textFaint } }, lbl),
                  React.createElement("div", { className: "w-full rounded-lg px-2 py-2 text-sm text-center border font-mono", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.textFaint } }, i === 2 ? "1" : "--")
                ))
              )
            )
          ),

          // Jauge circulaire "Moyenne actuelle" + delta vs semestre précédent
          React.createElement("div", { className: "rounded-lg border p-5 flex flex-col items-center gap-2.5", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Moyenne Estimée · " + annee + " " + semestre),
            React.createElement(JaugeCirculaire, { valeur: moyenne, couleur: valide ? COLORS.forest : moyenne === null ? COLORS.border : COLORS.terra }),
            moyenne !== null && moyennePrecedente !== null && React.createElement("p", {
              className: "text-xs font-mono flex items-center gap-1",
              style: { color: moyenne >= moyennePrecedente ? COLORS.forestText : COLORS.terra }
            }, React.createElement(Icon, { name: moyenne >= moyennePrecedente ? "trending-up" : "trending-down", size: 12 }),
              (moyenne - moyennePrecedente >= 0 ? "+" : "") + (moyenne - moyennePrecedente).toFixed(1) + " depuis le semestre précédent"),
            moyenne !== null && React.createElement("span", {
              className: "text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full border",
              style: valide
                ? { color: COLORS.forestText, borderColor: COLORS.forest, backgroundColor: "rgba(119,221,106,0.12)" }
                : { color: COLORS.terraText, borderColor: COLORS.terra, backgroundColor: "rgba(255,180,171,0.1)" }
            }, valide ? "Semestre Validé" : "Semestre Non Validé")
          ),

          // Simulateur d'objectif
          React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("p", { className: "text-sm font-semibold flex items-center gap-1.5", style: { color: COLORS.text } }, React.createElement(Icon, { name: "target", size: 14, color: COLORS.gold }), " Simulateur d'objectif"),
              React.createElement("span", { className: "text-[10px] font-mono uppercase px-2 py-1 rounded-full", style: { color: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.12)" } }, statutObjectif)
            ),
            React.createElement("div", { className: "flex items-center gap-3" },
              React.createElement("span", { className: "text-[10px] font-mono uppercase", style: { color: COLORS.textFaint } }, "Objectif visé"),
              React.createElement("input", {
                type: "number", step: "0.5", min: 0, max: 20, value: objectifVise,
                onChange: e => setObjectifVise(parseFloat(e.target.value) || 0),
                className: "w-16 rounded-lg px-2 py-1 text-sm font-mono outline-none border text-center", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.gold }
              }),
              React.createElement("span", { className: "text-xs font-mono", style: { color: COLORS.textFaint } }, "/20")
            ),
            React.createElement("p", { className: "text-xs leading-relaxed", style: { color: COLORS.textMuted } }, messageObjectif)
          ),

          React.createElement("div", { className: "rounded-lg p-5 flex items-center justify-between border", style: { backgroundColor: valide ? "rgba(119,221,106,0.12)" : "rgba(255,180,171,0.1)", borderColor: valide ? COLORS.forest : COLORS.terra } },
            React.createElement("div", null,
              React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Moyenne pondérée · " + annee + " " + semestre),
              React.createElement("p", { className: "text-3xl font-bold font-mono", style: { color: valide ? COLORS.forestText : COLORS.terra } }, (moyenne !== null ? moyenne.toFixed(2) : "-") + React.createElement("span", { className: "text-base", style: { color: COLORS.textMuted } }, " /20"))
            ),
            React.createElement("span", { className: "text-xs font-mono uppercase tracking-wider px-3 py-1.5 rounded-full", style: { color: valide ? COLORS.forestText : COLORS.terra, backgroundColor: valide ? "rgba(119,221,106,0.15)" : "rgba(255,180,171,0.15)" } }, moyenne === null ? "En attente" : valide ? "Validé" : "Non validé")
          ),

          React.createElement("button", {
            onClick: sauvegarderDansMyScore,
            disabled: validRows.length === 0,
            className: "w-full rounded-lg py-3 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-30",
            style: { backgroundColor: COLORS.gold, color: COLORS.bg }
          }, React.createElement(Icon, { name: sauvegardeMyScore ? "check" : "save", size: 15 }), sauvegardeMyScore ? "Enregistré dans MyScore" : "Sauvegarder dans MyScore"),
          React.createElement("p", { className: "text-[10px] text-center", style: { color: COLORS.textFaint } }, "Ces notes simulées apparaîtront dans MyScore avec la mention \"Simulé\", elles ne remplacent pas les notes officielles publiées par l'administration.")
        )
      );
    }
