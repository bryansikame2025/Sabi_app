// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { classementHebdoRef, usersRef } from "../firebase.js";
import { celebrer, semaineCle } from "../lib/effets.js";
import { COLORS } from "../theme.js";

    function ClassementContributions({ logs }) {
      const uneSemaine = 7 * 24 * 60 * 60 * 1000;
      const seuil = Date.now() - uneSemaine;
      const recents = logs.filter(l => l.timestamp >= seuil);

      const parPseudo = {};
      const parFiliere = {};
      recents.forEach(l => {
        parPseudo[l.pseudo] = (parPseudo[l.pseudo] || 0) + l.n;
        if (l.filiere) parFiliere[l.filiere] = (parFiliere[l.filiere] || 0) + l.n;
      });

      const topContributeurs = Object.entries(parPseudo).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const topFilieres = Object.entries(parFiliere).sort((a, b) => b[1] - a[1]);
      const medailles = [COLORS.gold, "#C0C0C0", "#B08D57"];

      return React.createElement("div", { className: "flex flex-col gap-5" },
        React.createElement("div", null,
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider mb-2", style: { color: COLORS.textMuted } }, "Top contributeurs cette semaine"),
          topContributeurs.length === 0
            ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Pas encore assez d'activité cette semaine.")
            : React.createElement("div", { className: "flex flex-col gap-2" },
                topContributeurs.map(([nom, pts], i) => React.createElement("div", { key: nom, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
                  React.createElement(Icon, { name: "medal", size: 22, color: medailles[i] || COLORS.textMuted }),
                  React.createElement("p", { className: "flex-1 text-sm font-medium", style: { color: COLORS.text } }, nom),
                  React.createElement("p", { className: "font-mono text-sm font-semibold", style: { color: COLORS.gold } }, "+" + pts)
                ))
              )
        ),
        React.createElement("div", null,
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider mb-2", style: { color: COLORS.textMuted } }, "Filière la plus active"),
          topFilieres.length === 0
            ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Pas encore de données cette semaine.")
            : React.createElement("div", { className: "flex flex-col gap-2" },
                topFilieres.map(([fil, pts], i) => React.createElement("div", { key: fil, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: i === 0 ? COLORS.gold : COLORS.border, backgroundColor: COLORS.surface } },
                  React.createElement("p", { className: "flex-1 text-sm", style: { color: i === 0 ? COLORS.gold : COLORS.text } }, fil),
                  React.createElement("p", { className: "font-mono text-xs", style: { color: COLORS.textMuted } }, pts + " pts")
                ))
              )
        ),
        React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Basé sur les 7 derniers jours d'activité (publications, votes, contributions).")
      );
    }

    // ===== Classement : Contributions / Quiz / Focus / Défis =====
    const DEFIS_SEMAINE = [
      { id: "focus120", titre: "2 h de focus", detail: "Cumule 120 min de focus cette semaine", cible: 120, champ: "focusMinutes", unite: "min", recompense: 10 },
      { id: "quiz10", titre: "10 bonnes réponses", detail: "Réponds juste à 10 questions de quiz", cible: 10, champ: "quizBons", unite: "", recompense: 10 },
      { id: "parfait1", titre: "Un quiz parfait", detail: "Fais un 5/5 à un quiz", cible: 1, champ: "quizParfaits", unite: "", recompense: 15 },
    ];
    export function ClassementTab({ logs, authUid, pseudo, profil, onGagnerPoints }) {
      const [vue, setVue] = useState("quiz");
      const [portee, setPortee] = useState("filiere"); // "filiere" | "ecole"
      const [stats, setStats] = useState({});
      const [reclames, setReclames] = useState({});
      const [erreurLecture, setErreurLecture] = useState(false);
      const semaine = React.useMemo(() => semaineCle(), []);
      useEffect(() => {
        const ref = classementHebdoRef.child(semaine);
        const l = ref.on("value", snap => { setErreurLecture(false); setStats(snap.val() || {}); }, () => setErreurLecture(true));
        return () => ref.off("value", l);
      }, [semaine]);
      useEffect(() => {
        if (!authUid) return;
        const ref = usersRef.child(authUid).child("defisReclames").child(semaine);
        const l = ref.on("value", snap => setReclames(snap.val() || {}), () => {});
        return () => ref.off("value", l);
      }, [authUid, semaine]);

      const medailles = [COLORS.gold, "#C0C0C0", "#B08D57"];
      const moi = stats[authUid] || {};
      const lignes = Object.entries(stats).map(([uid, v]) => ({ uid, ...v }))
        .filter(l => portee === "ecole" || !profil.filiere || l.filiere === profil.filiere);

      const ligneClassement = (l, i, valeurPrincipale, valeurSecondaire) => React.createElement("div", {
        key: l.uid, className: "rounded-lg border p-3 flex items-center gap-3",
        style: { borderColor: l.uid === authUid ? COLORS.gold : COLORS.border, backgroundColor: l.uid === authUid ? "rgba(var(--accent-rgb),0.08)" : COLORS.surface }
      },
        i < 3 ? React.createElement(Icon, { name: "medal", size: 22, color: medailles[i] }) : React.createElement("span", { className: "w-[22px] text-center text-xs font-mono", style: { color: COLORS.textFaint } }, i + 1),
        React.createElement("div", { className: "flex-1 min-w-0" },
          React.createElement("p", { className: "text-sm font-medium truncate", style: { color: COLORS.text } }, l.pseudo + (l.uid === authUid ? " (toi)" : "")),
          React.createElement("p", { className: "text-[10px] font-mono truncate", style: { color: COLORS.textFaint } }, [l.filiere, l.annee].filter(Boolean).join(" · "))
        ),
        React.createElement("div", { className: "text-right" },
          React.createElement("p", { className: "font-mono text-sm font-semibold", style: { color: COLORS.gold } }, valeurPrincipale),
          valeurSecondaire && React.createElement("p", { className: "text-[10px] font-mono", style: { color: COLORS.textMuted } }, valeurSecondaire)
        )
      );

      const topQuiz = lignes.filter(l => (l.quizBons || 0) > 0).sort((a, b) =>
        (b.quizBons || 0) - (a.quizBons || 0) || (b.quizParfaits || 0) - (a.quizParfaits || 0) ||
        ((b.quizBons || 0) / Math.max(1, b.quizTotal || 1)) - ((a.quizBons || 0) / Math.max(1, a.quizTotal || 1))).slice(0, 10);
      const topFocus = lignes.filter(l => (l.focusMinutes || 0) > 0).sort((a, b) => (b.focusMinutes || 0) - (a.focusMinutes || 0)).slice(0, 10);
      // Défi entre filières : total des minutes de focus de chaque filière (toute l'école).
      const parFiliere = {};
      Object.values(stats).forEach(v => { if (v.filiere && v.focusMinutes) parFiliere[v.filiere] = (parFiliere[v.filiere] || 0) + v.focusMinutes; });
      const topFilieresFocus = Object.entries(parFiliere).sort((a, b) => b[1] - a[1]).slice(0, 5);

      const reclamer = (d) => {
        if (reclames[d.id] || (moi[d.champ] || 0) < d.cible) return;
        usersRef.child(authUid).child("defisReclames").child(semaine).child(d.id).set(true).then(() => {
          onGagnerPoints(d.recompense); celebrer();
        }).catch(() => {});
      };

      const onglets = [["quiz", "Quiz"], ["focus", "Focus"], ["defis", "Défis"], ["contrib", "Contrib."]];
      return React.createElement("div", { className: "flex flex-col gap-4" },
        React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Classement"),
        React.createElement("div", { className: "grid grid-cols-4 gap-1.5 p-1 rounded-lg", style: { backgroundColor: COLORS.surface, border: "1px solid " + COLORS.border } },
          onglets.map(([id, label]) => React.createElement("button", {
            key: id, onClick: () => setVue(id),
            className: "rounded-lg py-2 text-[11px] font-mono",
            style: vue === id ? { backgroundColor: COLORS.gold, color: COLORS.bg, fontWeight: 700 } : { color: COLORS.textMuted }
          }, label))
        ),

        erreurLecture && React.createElement("p", { className: "text-xs rounded-lg border p-3", style: { color: COLORS.gold, borderColor: COLORS.gold } }, "Impossible de lire le classement : les règles Firebase (classementHebdo) ne sont pas encore publiées."),

        (vue === "quiz" || vue === "focus") && React.createElement("div", { className: "flex gap-2" },
          [["filiere", "Ma filière"], ["ecole", "Toute l'école"]].map(([id, label]) => React.createElement("button", {
            key: id, onClick: () => setPortee(id),
            className: "rounded-full px-3 py-1 text-[11px] font-mono border",
            style: portee === id ? { borderColor: COLORS.gold, color: COLORS.gold, backgroundColor: "rgba(var(--accent-rgb),0.1)" } : { borderColor: COLORS.border, color: COLORS.textMuted }
          }, label))
        ),

        vue === "quiz" && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Meilleures réponses au quiz cette semaine"),
          topQuiz.length === 0
            ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Personne n'a encore répondu à un quiz cette semaine. Sois le premier !")
            : topQuiz.map((l, i) => ligneClassement(l, i, (l.quizBons || 0) + " bonnes", Math.round(((l.quizBons || 0) / Math.max(1, l.quizTotal || 1)) * 100) + "% · " + (l.quizParfaits || 0) + " parfait" + ((l.quizParfaits || 0) > 1 ? "s" : ""))),
          React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Nombre de bonnes réponses aux quiz de la semaine (les 5 premiers quiz de chaque jour comptent). Remise à zéro chaque semaine.")
        ),

        vue === "focus" && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Minutes de focus cette semaine"),
          topFocus.length === 0
            ? React.createElement("p", { className: "text-sm text-center py-6", style: { color: COLORS.textFaint } }, "Aucune session de focus cette semaine pour l'instant.")
            : topFocus.map((l, i) => ligneClassement(l, i, (l.focusMinutes || 0) + " min", null)),
          topFilieresFocus.length > 0 && React.createElement("div", { className: "mt-3 flex flex-col gap-2" },
            React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Défi entre filières"),
            topFilieresFocus.map(([fil, min], i) => React.createElement("div", { key: fil, className: "rounded-lg border p-3 flex items-center gap-3", style: { borderColor: i === 0 ? COLORS.gold : COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("p", { className: "flex-1 text-sm", style: { color: i === 0 ? COLORS.gold : COLORS.text } }, [i === 0 ? React.createElement(Icon, { key: "c", name: "crown", size: 14, color: COLORS.gold, style: { display: "inline", verticalAlign: "-2px", marginRight: 6 } }) : null, fil]),
              React.createElement("p", { className: "font-mono text-xs", style: { color: COLORS.textMuted } }, min + " min")
            ))
          )
        ),

        vue === "defis" && React.createElement("div", { className: "flex flex-col gap-3" },
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, "Défis de la semaine"),
          DEFIS_SEMAINE.map(d => {
            const val = Math.min(d.cible, moi[d.champ] || 0);
            const fini = val >= d.cible;
            const pris = !!reclames[d.id];
            return React.createElement("div", { key: d.id, className: "rounded-lg border p-3.5 flex flex-col gap-2", style: { borderColor: fini ? COLORS.forest : COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("div", { className: "flex items-center justify-between gap-2" },
                React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, d.titre),
                React.createElement("span", { className: "text-[10px] font-mono", style: { color: COLORS.gold } }, "+" + d.recompense + " pts")
              ),
              React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, d.detail),
              React.createElement("div", { className: "w-full h-2 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
                React.createElement("div", { className: "h-full rounded-full", style: { width: (val / d.cible * 100) + "%", backgroundColor: fini ? COLORS.forest : COLORS.gold } })
              ),
              React.createElement("div", { className: "flex items-center justify-between" },
                React.createElement("span", { className: "text-[11px] font-mono", style: { color: COLORS.textMuted } }, val + "/" + d.cible + (d.unite ? " " + d.unite : "")),
                pris
                  ? React.createElement("span", { className: "text-[11px] font-mono", style: { color: COLORS.forestText } }, React.createElement("span", { className: "inline-flex items-center gap-1" }, React.createElement(Icon, { name: "check", size: 12 }), "Récompense reçue"))
                  : React.createElement("button", {
                      onClick: () => reclamer(d), disabled: !fini,
                      className: "rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-30",
                      style: { backgroundColor: COLORS.gold, color: COLORS.bg }
                    }, "Réclamer")
              )
            );
          }),
          React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Les défis se remettent à zéro chaque semaine.")
        ),

        vue === "contrib" && React.createElement(ClassementContributions, { logs: logs })
      );
    }
