// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { CorrigeRendu } from "../components/CorrigeRendu.js";
import { Icon } from "../components/Icon.js";
import { PaywallSabiPro } from "../components/PaywallSabiPro.js";
import { BoutonCarnet, MascotteSabi, SuiviDuels } from "../components/widgets.js";
import { duelsRef, myscoreRef, usersRef } from "../firebase.js";
import { celebrer, debloquerBadgeAuto, definirSourdineFocus, enregistrerActiviteHebdo, haptique, jouerSon, jourCle, quizCompteCeJour } from "../lib/effets.js";
import { chargerMesDuels, duelsStore } from "../lib/stockage.js";
import { MENTOR_SYSTEM_PROMPT, appellerGroq, appellerOpenRouter, genererViaGeminiParts, genererViaRepliChat } from "../services/ia.js";
import { JaugeCirculaire } from "./MyScoreTab.js";
import { COLORS } from "../theme.js";

    // ========== MENTOR / DIAGNOSTIC & PLAN IA ==========

    // ========== COACH : PHOTO D'EXERCICE ==========
    // L'étudiant photographie un exercice (caméra ou galerie). Le Coach lit l'image, explique la
    // méthode étape par étape, puis termine par le corrigé. Photo réduite avant envoi (≈ 200 Ko)
    // pour passer même sur une connexion lente. Gemini d'abord ; OpenRouter en secours.
    const LIMITE_PHOTO_EXERCICE_JOUR = 5; // limite par appareil et par jour (protège le quota IA)

    function compresserPhoto(fichier, maxCote) {
      return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(fichier);
        const img = new Image();
        img.onload = () => {
          const k = Math.min(1, (maxCote || 1400) / Math.max(img.width, img.height));
          const c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          URL.revokeObjectURL(url);
          const dataUrl = c.toDataURL("image/jpeg", 0.75);
          resolve({ apercu: dataUrl, base64: dataUrl.split(",")[1] });
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Photo illisible.")); };
        img.src = url;
      });
    }

    // Rendu minimal du texte du Coach : titres "## ", gras **mot**, listes, paragraphes.
    function TexteCoach({ texte }) {
      const enGras = (ligne) => ligne.split(/(\*\*[^*]+\*\*)/g).map((m, i) =>
        /^\*\*[^*]+\*\*$/.test(m) ? React.createElement("strong", { key: i }, m.slice(2, -2)) : m);
      return React.createElement("div", { className: "flex flex-col gap-2" },
        texte.split("\n").map((l, i) => {
          const t = l.trim();
          if (!t) return null;
          if (/^#{1,4}\s/.test(t)) return React.createElement("p", { key: i, className: "text-sm font-semibold mt-2", style: { color: COLORS.gold } }, enGras(t.replace(/^#{1,4}\s+/, "")));
          if (/^[-*]\s/.test(t)) return React.createElement("p", { key: i, className: "text-sm pl-3", style: { color: COLORS.text, lineHeight: 1.6 } }, "• ", enGras(t.replace(/^[-*]\s+/, "")));
          return React.createElement("p", { key: i, className: "text-sm", style: { color: COLORS.text, lineHeight: 1.6 } }, enGras(t));
        }));
    }

    function PhotoExercice({ profil }) {
      const [photo, setPhoto] = useState(null);       // { apercu, base64 }
      const [precision, setPrecision] = useState("");
      const [etat, setEtat] = useState("repos");      // repos | analyse | ok | erreur
      const [reponse, setReponse] = useState("");
      const [erreur, setErreur] = useState("");
      const refCamera = React.useRef(null), refGalerie = React.useRef(null);

      const choisir = async (e) => {
        const f = e.target.files && e.target.files[0];
        e.target.value = "";
        if (!f) return;
        setErreur(""); setReponse(""); setEtat("repos");
        try { setPhoto(await compresserPhoto(f, 1400)); } catch { setErreur("Impossible de lire cette photo. Essaie-en une autre."); }
      };

      const expliquer = async () => {
        if (!photo) return;
        const cle = "sabi_photo_exercice_" + new Date().toISOString().slice(0, 10);
        let n = 0; try { n = parseInt(localStorage.getItem(cle) || "0", 10) || 0; } catch {}
        if (n >= LIMITE_PHOTO_EXERCICE_JOUR) { setErreur("Tu as atteint la limite de " + LIMITE_PHOTO_EXERCICE_JOUR + " photos pour aujourd'hui. Reviens demain."); setEtat("erreur"); return; }
        setEtat("analyse"); setErreur(""); setReponse("");
        const contexte = profil && (profil.filiere || profil.annee) ? " L'étudiant est en " + [profil.filiere, profil.annee].filter(Boolean).join(", ") + "." : "";
        const consigne =
          "Tu es le Coach de réussite de Sabi, pour des étudiants d'IUT au Cameroun." + contexte + " La photo montre un exercice. Réponds en français, en tutoyant, sans emoji, avec cette structure exacte :\n" +
          "## Énoncé lu\nRecopie brièvement l'énoncé que tu lis sur la photo.\n" +
          "## Méthode, étape par étape\nExplique comment résoudre l'exercice, étape numérotée par étape, en expliquant le pourquoi de chaque étape.\n" +
          "## Corrigé\nDonne la réponse finale complète et le résultat.\n" +
          "Si la photo est floue, coupée ou illisible, dis-le clairement, demande une photo plus nette et n'invente jamais l'énoncé." +
          (precision.trim() ? "\nPrécision de l'étudiant : " + precision.trim() : "");
        try {
          let texte;
          try {
            texte = await genererViaGeminiParts([{ text: consigne }, { inline_data: { mime_type: "image/jpeg", data: photo.base64 } }], "corrigé");
          } catch (e1) {
            texte = await genererViaRepliChat("photo", consigne, photo.base64, "image/jpeg", null, "Sabi Coach");
          }
          if (!texte || !String(texte).trim()) throw new Error("Réponse vide.");
          try { localStorage.setItem(cle, String(n + 1)); } catch {}
          setReponse(String(texte)); setEtat("ok");
        } catch (e) {
          setErreur((e && e.message) || "Le Coach n'a pas pu répondre. Réessaie dans quelques instants."); setEtat("erreur");
        }
      };

      const bouton = (libelle, icone, onClick, plein) => React.createElement("button", {
        onClick, disabled: etat === "analyse",
        className: "flex-1 rounded-lg py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50",
        style: plein ? { background: "#7c5cf0", color: "#fff" } : { border: "1px solid rgba(139,92,246,0.35)", color: "#c4b5fd" }
      }, React.createElement(Icon, { name: icone, size: 14 }), libelle);

      return React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: "rgba(139,92,246,0.35)", backgroundColor: "rgba(139,92,246,0.06)" } },
        React.createElement("div", { className: "flex items-center gap-2" },
          React.createElement(Icon, { name: "eye", size: 16, color: "#c4b5fd" }),
          React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, "Un exercice te bloque ?")),
        React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted, lineHeight: 1.5 } },
          "Prends-le en photo : le Coach explique la méthode étape par étape et termine par le corrigé."),
        React.createElement("input", { ref: refCamera, type: "file", accept: "image/*", capture: "environment", className: "hidden", onChange: choisir }),
        React.createElement("input", { ref: refGalerie, type: "file", accept: "image/*", className: "hidden", onChange: choisir }),
        React.createElement("div", { className: "flex gap-2" },
          bouton("Prendre une photo", "eye", () => refCamera.current && refCamera.current.click(), !photo),
          bouton("Galerie", "file-text", () => refGalerie.current && refGalerie.current.click(), false)),
        photo && React.createElement("div", { className: "flex flex-col gap-2" },
          React.createElement("img", { src: photo.apercu, alt: "Photo de l'exercice à expliquer", className: "w-full rounded-lg", style: { maxHeight: 260, objectFit: "contain", backgroundColor: COLORS.surface } }),
          React.createElement("input", {
            value: precision, onChange: (e) => setPrecision(e.target.value), maxLength: 200,
            placeholder: "Une précision ? (ex : exercice 3 seulement)", className: "rounded-lg px-3 py-2 text-xs",
            style: { backgroundColor: COLORS.surface, color: COLORS.text, border: "1px solid " + COLORS.border }
          }),
          bouton(etat === "analyse" ? "Le Coach lit ton exercice..." : "Expliquer et corriger", "send", expliquer, true)),
        erreur && React.createElement("p", { className: "text-xs", style: { color: COLORS.terraText } }, erreur),
        etat === "ok" && reponse && React.createElement("div", { className: "rounded-lg p-3", style: { backgroundColor: COLORS.surface, border: "1px solid " + COLORS.border } },
          React.createElement(TexteCoach, { texte: reponse }),
          React.createElement("p", { className: "text-[10px] mt-3", style: { color: COLORS.textFaint } }, "Le Coach peut se tromper : vérifie toujours avec ton cours.")));
      }

    export function MentorTab({ authUid, profil, pseudo, abonnement, isOwner, isAdmin, setTab, resumes }) {
      const acces = isOwner || isAdmin || abonnement === "proplus";
      const [scoresOfficiels, setScoresOfficiels] = useState(null);
      const [reponse, setReponse] = useState(""); // texte affiché (rendu Markdown via CorrigeRendu)
      const [chargement, setChargement] = useState(null); // id de l'action en cours, ou null
      const [erreur, setErreur] = useState("");
      const [actionReponse, setActionReponse] = useState(null); // id de l'action ayant produit la réponse/l'erreur affichée (ex. "sauvetage")
      const [question, setQuestion] = useState("");
      const [focusActif, setFocusActif] = useState(false); // le minuteur tourne (faux = en pause ou pas lancé)
      const [focusSession, setFocusSession] = useState(false); // une session est en cours (lancée, éventuellement en pause)
      const [focusDuree, setFocusDuree] = useState(() => {
        try { const v = parseInt(localStorage.getItem("sabi_focus_duree"), 10); if (v >= 1 && v <= 180) return v; } catch {}
        return 25;
      }); // durée choisie, en minutes (mémorisée sur l'appareil)
      const [focusRestant, setFocusRestant] = useState(() => {
        try { const v = parseInt(localStorage.getItem("sabi_focus_duree"), 10); if (v >= 1 && v <= 180) return v * 60; } catch {}
        return 25 * 60;
      });
      const [focusSaisie, setFocusSaisie] = useState(""); // texte du champ "durée personnalisée" ("" = suit la durée choisie)
      const [focusPhrase, setFocusPhrase] = useState(0);
      const [focusBilan, setFocusBilan] = useState(null); // { minutes, complet } — message affiché après une session
      const [focusStreak, setFocusStreak] = useState(0); // jours de focus d'affilée
      const focusDebutHeureRef = React.useRef(12); // heure de lancement de la session (pour le badge Lève-tôt)
      const focusFinRef = React.useRef(0); // instant de fin prévu (robuste quand le navigateur ralentit les timers en arrière-plan)
      const wakeLockRef = React.useRef(null);
      const [progression, setProgression] = useState({ focusMinutes: 0, focusObjectif: 600, quizReussis: 0, quizObjectif: 15 });
      const [diagnostic, setDiagnostic] = useState(null); // { scoreGlobal, competences:{logique,synthese,memorisation}, forces:[], lacunes:[], badge }

      // Quiz IA — généré à partir du contenu d'un résumé de cours (ou d'un sujet libre si aucun résumé)
      const [quizSourceId, setQuizSourceId] = useState("libre");
      const [quizCompte, setQuizCompte] = useState(null); // null | true | false : ce quiz compte-t-il pour le classement hebdo ?
      const [duelActif, setDuelActif] = useState(null); // duel que je joue : { code, sujet, createur }
      const [duelResultat, setDuelResultat] = useState(null); // { moi, adversaire, pseudoAdv }
      const [duelCree, setDuelCree] = useState(null); // code du duel que je viens de lancer
      const [duelCodeSaisi, setDuelCodeSaisi] = useState("");
      const [quizSujetCourant, setQuizSujetCourant] = useState("");
      const [quizSujetLibre, setQuizSujetLibre] = useState("");
      const [quiz, setQuiz] = useState(null); // [{ question, options:[4], correctIndex, explication }]
      const [quizReponses, setQuizReponses] = useState({}); // { [indexQuestion]: indexOptionChoisie }
      const [quizValide, setQuizValide] = useState(false);

      if (!acces) return React.createElement(PaywallSabiPro, { setTab: setTab, palierRequis: "proplus" });

      const [plan, setPlan] = useState(null); // [{ titre, priorite, description }]
      const [objectifJour, setObjectifJour] = useState(null); // { taches: [{id, texte, fait}] }
      const CONSEILS_SABI = [
        "Coupe ton téléphone en mode avion pendant la session, chaque notification te coûte ~5 min de concentration perdue.",
        "Une session de 25 min avec une vraie pause de 5 min vaut mieux que 2h en continu sans pause.",
        "Relis tes notes juste après la session : la mémorisation à chaud est bien plus efficace.",
        "Bois de l'eau avant de démarrer, la déshydratation réduit la concentration de façon mesurable.",
        "Choisis UNE seule matière par session de focus, pas plusieurs à la fois.",
      ];
      const conseilDuJour = CONSEILS_SABI[new Date().getDate() % CONSEILS_SABI.length];

      // Charge les notes officielles (MyScore) pour donner du contexte réel à l'IA
      useEffect(() => {
        if (!authUid) return;
        myscoreRef.child(authUid).once("value").then(snap => {
          const val = snap.val() || {};
          const liste = Object.values(val).filter(s => s.source !== "simulateur");
          setScoresOfficiels(liste);
        });
      }, [authUid]);

      // Progression hebdomadaire — clé par semaine ISO pour repartir à zéro chaque lundi
      const semaineKey = React.useMemo(() => {
        const d = new Date();
        const jan1 = new Date(d.getFullYear(), 0, 1);
        const semaine = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
        return d.getFullYear() + "-S" + semaine;
      }, []);
      const progressionRef = React.useMemo(() => usersRef.child(authUid).child("progressionHebdo").child(semaineKey), [authUid, semaineKey]);
      useEffect(() => {
        if (!authUid) return;
        const listener = progressionRef.on("value", snap => {
          const v = snap.val();
          if (v) setProgression(p => ({ ...p, focusMinutes: v.focusMinutes || 0, quizReussis: v.quizReussis || 0 }));
        });
        return () => progressionRef.off("value", listener);
      }, [authUid, semaineKey]);

      // Objectif du Jour — clé par date (AAAA-MM-JJ), remis à zéro chaque jour
      const jourKey = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
      const objectifRef = React.useMemo(() => usersRef.child(authUid).child("objectifJour").child(jourKey), [authUid, jourKey]);
      useEffect(() => {
        if (!authUid) return;
        const listener = objectifRef.on("value", snap => setObjectifJour(snap.val()));
        return () => objectifRef.off("value", listener);
      }, [authUid, jourKey]);

      // Série de jours consécutifs (streak) sur l'onglet Coach — simple lecture/écriture Firebase à
      // l'ouverture de l'onglet, sans appel IA : si le dernier passage était hier, +1 ; sinon repart à 1.
      const [streak, setStreak] = useState(0);
      const streakRef = React.useMemo(() => usersRef.child(authUid).child("coachStreak"), [authUid]);
      useEffect(() => {
        if (!authUid) return;
        streakRef.once("value").then(snap => {
          const v = snap.val() || {};
          const hier = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
          if (v.dernierJour === jourKey) { setStreak(v.count || 1); return; }
          const nouveauCount = v.dernierJour === hier ? (v.count || 0) + 1 : 1;
          streakRef.set({ count: nouveauCount, dernierJour: jourKey });
          setStreak(nouveauCount);
        });
      }, [authUid, jourKey]);

      // ===== Session Focus : durée modifiable, Lancer / Terminer, effets fun =====
      const PHRASES_FOCUS = [
        "Téléphone en mode zen, cerveau en mode turbo",
        "Une session à la fois, et le semestre est à toi",
        "Les distractions attendront, tes examens non",
        "Respire, concentre-toi, tu gères",
        "Chaque minute ici compte dans ta progression"
      ];
      const vibrer = (motif) => { try { if (navigator.vibrate) navigator.vibrate(motif); } catch {} };
      const activerVeille = async () => { // garde l'écran allumé pendant la session (si le navigateur le permet)
        try { if (navigator.wakeLock && !wakeLockRef.current) wakeLockRef.current = await navigator.wakeLock.request("screen"); } catch {}
      };
      const relacherVeille = () => {
        try { if (wakeLockRef.current) { wakeLockRef.current.release(); wakeLockRef.current = null; } } catch { wakeLockRef.current = null; }
      };
      const changerDureeFocus = (minutes) => {
        if (focusSession) return; // pas de changement pendant une session
        const m = Math.max(1, Math.min(180, Math.round(Number(minutes) || 0)));
        if (!m) return;
        setFocusDuree(m);
        setFocusSaisie("");
        setFocusRestant(m * 60);
        try { localStorage.setItem("sabi_focus_duree", String(m)); } catch {}
      };
      const lancerFocus = () => {
        focusFinRef.current = Date.now() + focusDuree * 60 * 1000;
        setFocusRestant(focusDuree * 60);
        setFocusPhrase(Math.floor(Math.random() * PHRASES_FOCUS.length));
        setFocusBilan(null);
        setFocusSession(true);
        setFocusActif(true);
        focusDebutHeureRef.current = new Date().getHours();
        vibrer([100, 50, 100]);
        jouerSon("ding");
        activerVeille();
      };
      const pauseFocus = () => { setFocusActif(false); relacherVeille(); };
      const reprendreFocus = () => { focusFinRef.current = Date.now() + focusRestant * 1000; setFocusActif(true); activerVeille(); };
      // Termine la session (à la main ou quand le temps est écoulé). Ne comptabilise que les
      // minutes réellement travaillées : durée complète si le minuteur est arrivé à zéro.
      const terminerFocus = (complet) => {
        const minutes = complet ? focusDuree : Math.floor((focusDuree * 60 - focusRestant) / 60);
        if (minutes > 0) {
          progressionRef.transaction(v => ({ focusMinutes: ((v && v.focusMinutes) || 0) + minutes, quizReussis: (v && v.quizReussis) || 0 }));
          // Classement Focus de la semaine
          enregistrerActiviteHebdo(authUid, { pseudo: pseudo, filiere: profil.filiere || "", annee: profil.annee || "" }, { focusMinutes: minutes });
          // Série de jours de focus d'affilée
          const jour = jourCle();
          const hier = jourCle(new Date(Date.now() - 86400000));
          focusStreakRef.once("value").then(snap => {
            const v = snap.val() || {};
            let count = v.count || 0;
            if (v.dernierJour !== jour) { count = v.dernierJour === hier ? count + 1 : 1; focusStreakRef.set({ count, dernierJour: jour }); }
            else count = Math.max(1, count);
            setFocusStreak(count);
            if (count >= 7) debloquerBadgeAuto(authUid, "flamme7");
          }).catch(() => {});
          // Badges automatiques
          if (focusDebutHeureRef.current < 7 && minutes >= 10) debloquerBadgeAuto(authUid, "leve_tot");
          if ((progression.focusMinutes || 0) + minutes >= 120) debloquerBadgeAuto(authUid, "marathonien");
        }
        setFocusActif(false);
        setFocusSession(false);
        setFocusRestant(focusDuree * 60);
        setFocusBilan({ minutes, complet });
        relacherVeille();
        if (complet) celebrer(); else { vibrer(60); jouerSon("ding"); }
      };
      const terminerFocusRef = React.useRef(terminerFocus);
      terminerFocusRef.current = terminerFocus;

      // Le temps restant se calcule à partir de l'heure de fin prévue, pas en soustrayant 1 s à chaque tick :
      // sinon un téléphone qui ralentit les timers (écran verrouillé, autre appli) faisait dériver le minuteur.
      useEffect(() => {
        if (!focusActif) return;
        const id = setInterval(() => {
          const r = Math.max(0, Math.ceil((focusFinRef.current - Date.now()) / 1000));
          setFocusRestant(r);
          if (r <= 0) terminerFocusRef.current(true);
        }, 500);
        return () => clearInterval(id);
      }, [focusActif]);
      useEffect(() => () => relacherVeille(), []); // libère l'écran si on quitte l'écran Coach
      const focusStreakRef = React.useMemo(() => usersRef.child(authUid).child("focusStreak"), [authUid]);
      useEffect(() => {
        if (!authUid) return;
        focusStreakRef.once("value").then(snap => {
          const v = snap.val() || {};
          const hier = jourCle(new Date(Date.now() - 86400000));
          // la série n'est valable que si le dernier jour de focus est aujourd'hui ou hier
          setFocusStreak(v.dernierJour === jourCle() || v.dernierJour === hier ? (v.count || 0) : 0);
        }).catch(() => {});
      }, [authUid]);
      // Bulles Sabi en sourdine pendant la session (rejouées à la fin ou en quittant l'écran).
      useEffect(() => {
        definirSourdineFocus(focusSession);
        return () => definirSourdineFocus(false);
      }, [focusSession]);

      const contexteEtudiant = () => {
        let ctx = "Étudiant : " + pseudo + ", filière " + (profil.filiere || "non renseignée") + ", " + (profil.annee || "année non renseignée") + ".";
        if (scoresOfficiels && scoresOfficiels.length > 0) {
          ctx += " Notes officielles (MyScore) : " + scoresOfficiels.map(s => s.matiere + " = " + s.note + "/20").join(", ") + ".";
        } else {
          ctx += " Aucune note publiée pour l'instant dans MyScore.";
        }
        return ctx;
      };

      // Ton du coach adapté au score du dernier diagnostic — pur texte de prompt, aucun appel en plus.
      const tonCoach = () => {
        if (!diagnostic) return "";
        if (diagnostic.scoreGlobal >= 80) return " Le score de l'étudiant est excellent : sois complice et un peu taquin, félicite-le sincèrement avant de donner des conseils.";
        if (diagnostic.scoreGlobal <= 40) return " Le score de l'étudiant est faible : sois particulièrement encourageant et rassurant, insiste sur le fait que c'est réversible avec de l'action, sans dramatiser.";
        return "";
      };

      const lancerAction = async (id, appel, promptUtilisateur) => {
        setChargement(id);
        setActionReponse(id);
        setErreur("");
        setReponse("");
        try {
          const texte = await appel([
            { role: "system", content: MENTOR_SYSTEM_PROMPT + tonCoach() },
            { role: "user", content: contexteEtudiant() + "\n\n" + promptUtilisateur }
          ]);
          setReponse(texte);
        } catch (err) {
          setErreur(err.message || "Une erreur est survenue.");
        } finally {
          setChargement(null);
        }
      };

      const demarrerAnalyse = () => lancerAction("analyse", appellerOpenRouter,
        "Fais un diagnostic complet de ma situation académique à partir de mes notes, puis propose un plan " +
        "d'action sur les 2 prochaines semaines, structuré par matière si possible. Sois concret.");

      const analyseNiveau = () => lancerAction("niveau", appellerGroq,
        "Fais un bilan rapide de mes acquis actuels (points forts / points faibles visibles dans mes notes) " +
        "en 5 lignes maximum.");

      const methodologie = () => lancerAction("methodo", appellerGroq,
        "Donne-moi 4 conseils de méthodologie de travail adaptés à ma filière pour optimiser mes prochaines révisions.");

      const modeSauvetage = () => lancerAction("sauvetage", appellerOpenRouter,
        "URGENCE ACADÉMIQUE. Propose-moi un plan de crise sur 48h, heure par heure si utile, pour redresser " +
        "la situation avant une échéance imminente (examen, rendu). Sois direct et réaliste.");

      const envoyerQuestion = () => {
        if (question.trim().length === 0) return;
        lancerAction("question", appellerGroq, question.trim());
        setQuestion("");
      };

      // Extrait un objet JSON d'une réponse IA (au cas où le modèle entoure le JSON de ```json ... ``` ou de texte).
      const extraireJSON = (texte) => {
        const nettoye = texte.trim().replace(/^```json\s*/i, "").replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
        const idxAccolade = nettoye.indexOf("{");
        const idxCrochet = nettoye.indexOf("[");
        // On prend le crochet ouvrant qui apparaît en premier dans le texte (et pas toujours "{" par défaut) —
        // sinon une réponse en tableau ("[{...}, {...}]") se faisait tronquer au premier "{" et cassait le JSON.
        let debut, caractereFin;
        if (idxCrochet !== -1 && (idxAccolade === -1 || idxCrochet < idxAccolade)) {
          debut = idxCrochet; caractereFin = "]";
        } else {
          debut = idxAccolade; caractereFin = "}";
        }
        const fin = nettoye.lastIndexOf(caractereFin);
        return JSON.parse(debut >= 0 && fin >= 0 ? nettoye.slice(debut, fin + 1) : nettoye);
      };

      const lancerDiagnostic = async () => {
        setChargement("diagnostic");
        setErreur("");
        setDiagnostic(null);
        try {
          const texte = await appellerOpenRouter([
            { role: "system", content: MENTOR_SYSTEM_PROMPT + tonCoach() + " Tu réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown." },
            { role: "user", content: contexteEtudiant() +
              "\n\nFais un diagnostic de niveau à partir de mes notes. Réponds STRICTEMENT avec ce format JSON : " +
              '{"scoreGlobal": <0-100>, "competences": {"logique": <0-100>, "synthese": <0-100>, "memorisation": <0-100>}, ' +
              '"forces": ["...", "..."], "lacunes": ["...", "..."], "badge": "<un court label du type Maîtrise Confirmée / Maîtrise Partielle / À Renforcer>"}. ' +
              "2 à 3 éléments max dans forces et lacunes, courts (5-8 mots)." }
          ]);
          setDiagnostic(extraireJSON(texte));
        } catch (err) {
          setErreur(err.message || "Impossible de générer le diagnostic. Réessaie.");
        } finally {
          setChargement(null);
        }
      };

      const genererPlan = async () => {
        setChargement("plan");
        setErreur("");
        setPlan(null);
        try {
          const texte = await appellerOpenRouter([
            { role: "system", content: MENTOR_SYSTEM_PROMPT + tonCoach() + " Tu réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown." },
            { role: "user", content: contexteEtudiant() +
              "\n\nPropose un plan d'action de révision à partir de mes notes. Réponds STRICTEMENT avec ce format JSON : " +
              '[{"titre": "...", "priorite": "haute", "description": "..."}, {"titre": "...", "priorite": "recommande", "description": "..."}]. ' +
              '"priorite" doit être exactement "haute" ou "recommande". 3 à 4 éléments, description en une phrase courte et concrète.' }
          ]);
          setPlan(extraireJSON(texte));
        } catch (err) {
          setErreur(err.message || "Impossible de générer le plan d'action. Réessaie.");
        } finally {
          setChargement(null);
        }
      };

      const genererObjectifJour = async () => {
        setChargement("objectif");
        setErreur("");
        try {
          const texte = await appellerGroq([
            { role: "system", content: "Tu réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown." },
            { role: "user", content: contexteEtudiant() +
              '\n\nPropose 5 tâches concrètes et courtes (5-8 mots) à faire aujourd\'hui pour progresser académiquement, ' +
              'adaptées à mes matières les plus faibles si j\'ai des notes. Réponds STRICTEMENT avec ce format JSON : ' +
              '["tâche 1", "tâche 2", "tâche 3", "tâche 4", "tâche 5"].' }
          ]);
          const taches = extraireJSON(texte).map((t, i) => ({ id: i + 1, texte: t, fait: false }));
          await objectifRef.set({ taches });
        } catch (err) {
          setErreur(err.message || "Impossible de générer les priorités du jour. Réessaie.");
        } finally {
          setChargement(null);
        }
      };

      const toggleTacheJour = (id) => {
        if (!objectifJour) return;
        const taches = objectifJour.taches.map(t => t.id === id ? { ...t, fait: !t.fait } : t);
        objectifRef.set({ taches });
      };

      // Résumés utilisables comme source de quiz — filtrés par filière/année de l'étudiant quand c'est possible.
      const resumesUtilisables = (resumes || []).filter(r => !profil.filiere || !r.filiere || r.filiere === profil.filiere);
      const resumeChoisi = resumesUtilisables.find(r => r.id === quizSourceId);

      const genererQuiz = async () => {
        const sourceTexte = resumeChoisi ? resumeChoisi.contenu : null;
        const sujet = resumeChoisi ? resumeChoisi.matiere : quizSujetLibre.trim();
        setActionReponse("quiz");
        if (!sourceTexte && sujet.length < 2) { setErreur("Choisis un résumé ou précise un sujet pour générer le quiz."); return; }
        setChargement("quiz");
        setErreur("");
        setQuiz(null);
        setQuizReponses({});
        setQuizValide(false);
        setDuelActif(null); setDuelResultat(null); setDuelCree(null); setQuizCompte(null);
        setQuizSujetCourant(sujet);
        try {
          const consigne = sourceTexte
            ? "Génère un quiz de 5 questions à choix multiples UNIQUEMENT à partir du contenu de cours suivant (matière : " + sujet + "). " +
              "Ne sors pas du contenu fourni.\n\n--- CONTENU DU COURS ---\n" + sourceTexte.slice(0, 6000) + "\n--- FIN DU CONTENU ---"
            : "Génère un quiz de 5 questions à choix multiples de niveau IUT sur le sujet : " + sujet + ".";
          const texte = await appellerGroq([
            { role: "system", content: "Tu es un générateur de quiz pour des étudiants d'IUT au Cameroun. Tu réponds UNIQUEMENT en JSON valide, sans texte autour, sans balises markdown." },
            { role: "user", content: consigne +
              '\n\nRéponds STRICTEMENT avec ce format JSON (tableau de 5 objets) : ' +
              '[{"question": "...", "options": ["...", "...", "...", "..."], "correctIndex": 0, "explication": "..."}]. ' +
              "4 options par question, correctIndex entre 0 et 3, explication en une phrase courte." }
          ]);
          const parsed = extraireJSON(texte);
          if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("Format de quiz invalide, réessaie.");
          setQuiz(parsed);
        } catch (err) {
          setErreur(err.message || "Impossible de générer le quiz. Réessaie.");
        } finally {
          setChargement(null);
        }
      };

      const choisirReponseQuiz = (indexQuestion, indexOption) => {
        if (quizValide) return;
        setQuizReponses(prev => ({ ...prev, [indexQuestion]: indexOption }));
      };

      const scoreQuiz = quiz ? quiz.reduce((acc, q, i) => acc + (quizReponses[i] === q.correctIndex ? 1 : 0), 0) : 0;

      const infosPublic = { pseudo: pseudo, filiere: profil.filiere || "", annee: profil.annee || "" };

      const validerQuiz = () => {
        setQuizValide(true);
        if (!quiz) return;
        const parfait = scoreQuiz === quiz.length;
        if (parfait) {
          progressionRef.transaction(v => ({ focusMinutes: (v && v.focusMinutes) || 0, quizReussis: ((v && v.quizReussis) || 0) + 1 }));
          debloquerBadgeAuto(authUid, "sans_faute");
          celebrer();
        } else if (scoreQuiz >= Math.ceil(quiz.length / 2)) { jouerSon("ding"); haptique(40); }
        else { jouerSon("oups"); haptique(120); }
        // Classement hebdo des bonnes réponses (5 premiers quiz de la journée seulement)
        quizCompteCeJour(authUid).then(compte => {
          setQuizCompte(compte);
          if (compte) enregistrerActiviteHebdo(authUid, infosPublic, { quizBons: scoreQuiz, quizTotal: quiz.length, quizParfaits: parfait ? 1 : 0 });
        });
        // Duel : j'enregistre mon score et je compare avec le créateur
        if (duelActif) {
          duelsRef.child(duelActif.code).child("joueurs").child(authUid).set({ pseudo: pseudo, score: scoreQuiz, total: quiz.length, date: Date.now() }).catch(() => {});
          setDuelResultat({ moi: scoreQuiz, adversaire: duelActif.createur.score, pseudoAdv: duelActif.createur.pseudo, total: quiz.length });
        }
      };

      const recommencerQuiz = () => { setQuiz(null); setQuizReponses({}); setQuizValide(false); setDuelActif(null); setDuelResultat(null); setDuelCree(null); setQuizCompte(null); };

      // ----- Quiz duel : lancer un défi (après avoir fini son quiz) ou relever celui d'un ami via un code -----
      const creerDuel = () => {
        if (!quiz || !quizValide || duelActif) return;
        const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        const code = Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
        duelsRef.child(code).set({
          sujet: quizSujetCourant || "Quiz", questions: quiz, createdAt: Date.now(),
          createur: { uid: authUid, pseudo: pseudo, score: scoreQuiz, total: quiz.length }
        }).then(() => {
          duelsStore.save([code, ...chargerMesDuels()].slice(0, 20));
          setDuelCree(code); jouerSon("ding"); haptique(40);
        }).catch(() => setErreur("Impossible de créer le duel pour l'instant. Réessaie."));
      };
      const partagerDuel = (code) => {
        const texte = "Relève mon défi Sabi ! Score à battre : " + scoreQuiz + "/" + (quiz ? quiz.length : 5) + ". Code du duel : " + code + " (Coach → Pratique → Quiz IA → Relever un duel)";
        if (navigator.share) navigator.share({ text: texte }).catch(() => {});
        else window.open("https://wa.me/?text=" + encodeURIComponent(texte), "_blank");
      };
      const rejoindreDuel = async () => {
        const code = duelCodeSaisi.trim().toUpperCase();
        setActionReponse("quiz");
        if (code.length < 4) { setErreur("Entre le code à 6 caractères de ton ami."); return; }
        setErreur("");
        try {
          const snap = await duelsRef.child(code).once("value");
          const d = snap.val();
          if (!d) { setErreur("Aucun duel avec ce code."); return; }
          if (d.createur && d.createur.uid === authUid) { setErreur("C'est ton propre duel ! Envoie-le à un ami."); return; }
          if (d.joueurs && d.joueurs[authUid]) { setErreur("Tu as déjà joué ce duel."); return; }
          setQuiz(d.questions); setQuizReponses({}); setQuizValide(false); setQuizCompte(null); setDuelCree(null); setDuelResultat(null);
          setQuizSujetCourant(d.sujet || "Quiz");
          setDuelActif({ code, sujet: d.sujet, createur: d.createur });
          setDuelCodeSaisi("");
          jouerSon("ding");
        } catch (err) {
          setErreur("Impossible de charger ce duel. Vérifie ta connexion.");
        }
      };

      const mmss = s => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

      const BLOCS_COACH = [
        { id: "coach", label: "Coach & Diagnostic", icone: "compass" },
        { id: "pratique", label: "Pratique & Révision", icone: "bot" },
        { id: "focus", label: "Focus Hub", icone: "clock" },
      ];
      const [blocActif, setBlocActif] = useState("coach");
      // Mode Sauvetage : "Lancer" fait vibrer le téléphone, génère le plan et teinte tout l'écran
      // aux couleurs d'alerte jusqu'à ce que l'étudiant appuie sur "Terminer".
      const PHRASES_SAUVETAGE = [
        "Respire, on s'occupe de tout",
        "Même les légendes révisaient la veille",
        "Le Griot Suprême est en route",
        "48h, c'est largement assez. Allez, go !",
        "Cette épreuve ne sait pas ce qui l'attend"
      ];
      const [sauvetageActif, setSauvetageActif] = useState(false);
      const [phraseSauvetage, setPhraseSauvetage] = useState(0);
      const declencherSauvetage = () => {
        setPhraseSauvetage(Math.floor(Math.random() * PHRASES_SAUVETAGE.length));
        setSauvetageActif(true);
        vibrer([120, 60, 120, 60, 200]);
        modeSauvetage();
      };
      const terminerSauvetage = () => {
        setSauvetageActif(false);
        vibrer(0); // coupe toute vibration en cours
        vibrer(60);
      };
      // Couleurs dédiées à cet écran : indigo/violet pour tout ce qui touche à l'IA (Coach,
      // Diagnostic, Plan, Quiz), au lieu du seul jaune répété partout — le jaune redevient un
      // accent ponctuel plutôt que la couleur de la moindre action.
      const IA = { txt: "#c4b5fd", soft: "rgba(139,92,246,0.12)", border: "rgba(139,92,246,0.35)", solide: "#7c5cf0" };
      const URGENCE = { txt: "#ffb199", soft: "rgba(249,115,22,0.14)", border: COLORS.alerte, solide: "linear-gradient(135deg, #ef4444, #f97316)" };
      const BoutonGhost = (props, ...enfants) => React.createElement("button", {
        ...props,
        className: "text-xs font-mono px-3 py-1.5 rounded-full flex items-center gap-1.5 disabled:opacity-40 " + (props.className || ""),
        style: { color: IA.txt, border: `1px solid ${IA.border}`, backgroundColor: IA.soft, ...(props.style || {}) }
      }, ...enfants);

      return React.createElement("div", { className: "flex flex-col gap-5" },
        React.createElement("div", { className: "flex items-center justify-between" },
          React.createElement("div", null,
            React.createElement("h2", { className: "text-lg font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Coach Réussite"),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Ton copilote de révision, propulsé par l'IA")
          ),
          streak > 1 && React.createElement("div", { className: "flex items-center gap-1 rounded-full px-2.5 py-1 flex-shrink-0", style: { backgroundColor: "rgba(249,115,22,0.15)", border: "1px solid #f97316" } },
            React.createElement(Icon, { name: "flame", size: 12, color: "#fb923c" }),
            React.createElement("span", { className: "text-[11px] font-mono font-semibold", style: { color: COLORS.alerte } }, streak + " jours")
          )
        ),

        // Sélecteur des 3 blocs thématiques
        React.createElement("div", { className: "grid grid-cols-3 gap-1.5 p-1 rounded-lg", style: { backgroundColor: COLORS.surface } },
          BLOCS_COACH.map(b => React.createElement("button", {
            key: b.id, onClick: () => setBlocActif(b.id),
            className: "flex flex-col items-center gap-1 py-2 rounded-lg text-center",
            style: blocActif === b.id ? { backgroundColor: IA.solide, color: "#fff" } : { color: COLORS.textFaint }
          }, React.createElement(Icon, { name: b.icone, size: 15, color: blocActif === b.id ? "#fff" : COLORS.textFaint }),
             React.createElement("span", { className: "text-[9px] font-medium leading-tight" }, b.label)))
        ),

        // ========== BLOC 1 : COACH & DIAGNOSTIC ==========
        blocActif === "coach" && React.createElement(React.Fragment, null,
          React.createElement("div", {
            className: "rounded-lg p-5 flex flex-col gap-3 relative overflow-hidden",
            style: { background: "linear-gradient(135deg, rgba(124,92,240,0.18), rgba(99,102,241,0.08))", border: `1px solid ${IA.border}`, backdropFilter: "blur(6px)" }
          },
            React.createElement("p", { className: "text-xs leading-relaxed", style: { color: COLORS.text } },
              "Ton coach analyse tes notes MyScore et te propose un plan d'action concret, adapté à ta filière et à ton année."),
            React.createElement("button", {
              onClick: demarrerAnalyse, disabled: chargement !== null,
              className: "self-start rounded-full px-4 py-2.5 text-sm font-semibold flex items-center gap-2 disabled:opacity-50",
              style: { background: IA.solide, color: "#fff" }
            }, chargement === "analyse" ? "Analyse en cours..." : "Démarrer l'Analyse →")
          ),

          React.createElement(PhotoExercice, { profil: profil }),

          React.createElement("div", { className: "grid grid-cols-2 gap-3" },
            React.createElement("button", { onClick: analyseNiveau, disabled: chargement !== null, className: "rounded-lg border p-3.5 flex flex-col items-start gap-1.5 text-left disabled:opacity-50", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement(Icon, { name: "target", size: 18, color: IA.txt }),
              React.createElement("p", { className: "text-xs font-semibold", style: { color: COLORS.text } }, "Analyse Niveau"),
              React.createElement("p", { className: "text-[10px]", style: { color: COLORS.textFaint } }, "Bilan des acquis")
            ),
            React.createElement("button", { onClick: methodologie, disabled: chargement !== null, className: "rounded-lg border p-3.5 flex flex-col items-start gap-1.5 text-left disabled:opacity-50", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement(Icon, { name: "compass", size: 18, color: IA.txt }),
              React.createElement("p", { className: "text-xs font-semibold", style: { color: COLORS.text } }, "Méthodologie"),
              React.createElement("p", { className: "text-[10px]", style: { color: COLORS.textFaint } }, "Optimisation")
            )
          ),

          React.createElement("div", null,
            React.createElement("div", { className: "flex items-center justify-between mb-2" },
              React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textFaint } }, "Objectif du Jour"),
              BoutonGhost({ onClick: genererObjectifJour, disabled: chargement !== null }, chargement === "objectif" ? "Génération..." : (objectifJour ? "Régénérer" : "Générer"))
            ),
            !objectifJour
              ? React.createElement("div", { className: "rounded-lg border p-4 text-center", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
                  React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Pas encore de priorités pour aujourd'hui, clique sur \"Générer\".")
                )
              : React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
                  (() => {
                    const total = objectifJour.taches.length;
                    const faites = objectifJour.taches.filter(t => t.fait).length;
                    return React.createElement(React.Fragment, null,
                      faites === total && total > 0 && React.createElement("p", { className: "text-xs font-semibold text-center", style: { color: COLORS.forest } }, "Journée terminée, toutes les tâches sont faites !"),
                      React.createElement("div", { className: "flex items-center justify-between" },
                        React.createElement("span", { className: "text-xs", style: { color: COLORS.text } }, faites + " sur " + total + " tâches terminées"),
                        React.createElement("span", { className: "text-xs font-mono", style: { color: IA.txt } }, Math.round((faites / total) * 100) + "%")
                      ),
                      React.createElement("div", { className: "w-full h-2 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
                        React.createElement("div", { className: "h-full rounded-full", style: { width: (faites / total * 100) + "%", background: IA.solide, transition: "width 0.4s ease" } })
                      )
                    );
                  })(),
                  React.createElement("div", { className: "flex flex-col gap-2" },
                    objectifJour.taches.map(t => React.createElement("div", { key: t.id, className: "flex items-center justify-between gap-2 rounded-lg px-3 py-2", style: { backgroundColor: COLORS.bg } },
                      React.createElement("p", { className: "text-xs flex-1 min-w-0", style: t.fait ? { color: "#71717a", textDecoration: "line-through" } : { color: COLORS.text } }, t.texte),
                      React.createElement("button", {
                        onClick: () => toggleTacheJour(t.id),
                        className: "flex-shrink-0 text-[10px] font-mono uppercase px-2.5 py-1 rounded-full",
                        style: t.fait ? { color: COLORS.forest, border: "1px solid #4ade80" } : { background: IA.solide, color: "#fff" }
                      }, t.fait ? React.createElement("span", { className: "inline-flex items-center gap-1" }, React.createElement(Icon, { name: "check", size: 12 }), "Fait") : "Démarrer")
                    ))
                  )
                )
          ),

          // Diagnostic de Niveau + Plan d'Action — fusionnés dans le même flux (fini le doublon
          // avec la carte du haut) : un seul déclencheur ghost chacun, résultats juste en dessous.
          React.createElement("div", null,
            React.createElement("div", { className: "flex items-center justify-between mb-2" },
              React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textFaint } }, "Diagnostic de Niveau"),
              BoutonGhost({ onClick: lancerDiagnostic, disabled: chargement !== null }, chargement === "diagnostic" ? "Analyse..." : (diagnostic ? "Relancer" : "Lancer le Diagnostic"))
            ),
            diagnostic && React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-4", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("div", { className: "flex items-center gap-4" },
                React.createElement(JaugeCirculaire, { valeur: diagnostic.scoreGlobal / 5, max: 20, taille: 84, epaisseur: 8, couleur: IA.solide }),
                React.createElement("div", { className: "flex-1 flex flex-col gap-1" },
                  React.createElement("p", { className: "text-lg font-bold font-mono", style: { color: COLORS.text } }, diagnostic.scoreGlobal + "%"),
                  React.createElement("span", { className: "text-[10px] font-mono uppercase px-2 py-1 rounded-full inline-block w-fit", style: { color: IA.txt, backgroundColor: IA.soft } }, diagnostic.badge || "-")
                )
              ),
              React.createElement("div", { className: "flex flex-col gap-2" },
                Object.entries(diagnostic.competences || {}).map(([nom, val]) => React.createElement("div", { key: nom },
                  React.createElement("div", { className: "flex items-center justify-between mb-1" },
                    React.createElement("span", { className: "text-xs capitalize", style: { color: COLORS.text } }, nom),
                    React.createElement("span", { className: "text-xs font-mono", style: { color: COLORS.textFaint } }, val + "%")
                  ),
                  React.createElement("div", { className: "w-full h-1.5 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
                    React.createElement("div", { className: "h-full rounded-full", style: { width: val + "%", background: IA.solide } })
                  )
                ))
              ),
              React.createElement("div", { className: "grid grid-cols-2 gap-3" },
                React.createElement("div", null,
                  React.createElement("p", { className: "text-[10px] font-mono uppercase mb-1.5", style: { color: COLORS.forest } }, "Forces"),
                  React.createElement("ul", { className: "flex flex-col gap-1" },
                    (diagnostic.forces || []).map((f, i) => React.createElement("li", { key: i, className: "text-xs flex items-start gap-1.5", style: { color: COLORS.textFaint } },
                      React.createElement(Icon, { name: "check", size: 11, style: { marginTop: 2, flexShrink: 0 }, color: COLORS.forest }), f
                    ))
                  )
                ),
                React.createElement("div", null,
                  React.createElement("p", { className: "text-[10px] font-mono uppercase mb-1.5", style: { color: "#fb923c" } }, "Lacunes"),
                  React.createElement("ul", { className: "flex flex-col gap-1" },
                    (diagnostic.lacunes || []).map((l, i) => React.createElement("li", { key: i, className: "text-xs flex items-start gap-1.5", style: { color: COLORS.textFaint } },
                      React.createElement(Icon, { name: "alert-triangle", size: 11, style: { marginTop: 2, flexShrink: 0 }, color: "#fb923c" }), l
                    ))
                  )
                )
              )
            )
          ),

          React.createElement("div", null,
            React.createElement("div", { className: "flex items-center justify-between mb-2" },
              React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.textFaint } }, "Plan d'Action"),
              BoutonGhost({ onClick: genererPlan, disabled: chargement !== null }, chargement === "plan" ? "Génération..." : (plan ? "Régénérer" : "Générer le Plan"))
            ),
            plan && React.createElement("div", { className: "flex flex-col gap-2.5" },
              plan.map((item, i) => {
                const haute = item.priorite === "haute";
                return React.createElement("div", { key: i, className: "rounded-lg border p-3.5 flex flex-col gap-1.5", style: { borderColor: haute ? COLORS.alerte : COLORS.border, backgroundColor: haute ? "rgba(249,115,22,0.08)" : COLORS.surface } },
                  React.createElement("div", { className: "flex items-center justify-between gap-2" },
                    React.createElement("p", { className: "text-sm font-semibold flex-1 min-w-0", style: { color: COLORS.text } }, item.titre),
                    React.createElement("span", {
                      className: "text-[9px] font-mono uppercase px-2 py-0.5 rounded-full flex-shrink-0",
                      style: haute ? { color: "#fff", backgroundColor: COLORS.alerte } : { color: IA.txt, backgroundColor: IA.soft }
                    }, haute ? "Priorité Haute" : "Recommandé")
                  ),
                  React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, item.description)
                );
              })
            )
          ),

          chargement !== null && chargement !== "sauvetage" && chargement !== "quiz" && React.createElement("div", { className: "rounded-lg border p-4 flex items-center gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement(Icon, { name: "refresh-cw", size: 14, color: IA.txt }),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Le coach réfléchit...")
          ),
          erreur && actionReponse !== "sauvetage" && actionReponse !== "quiz" && React.createElement("div", { className: "rounded-lg border p-3.5", style: { borderColor: COLORS.alerte, backgroundColor: "rgba(249,115,22,0.1)" } },
            React.createElement("p", { className: "text-xs", style: { color: COLORS.alerte } }, erreur)
          ),
          reponse && actionReponse !== "sauvetage" && React.createElement("div", { className: "rounded-lg border p-4", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement(CorrigeRendu, { texte: reponse })
          ),

          // Discussion avec le Coach — libellé explicite, zone clairement identifiée.
          React.createElement("div", { className: "rounded-lg border p-3.5 flex flex-col gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement("p", { className: "text-xs font-semibold flex items-center gap-1.5", style: { color: COLORS.text } }, React.createElement(Icon, { name: "message-circle", size: 14 }), "Discussion avec le Coach : une question rapide ?"),
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement("textarea", {
                value: question, onChange: e => setQuestion(e.target.value), rows: 2,
                placeholder: "Ex : comment je m'organise pour l'examen de Compta ?",
                className: "flex-1 rounded-lg px-3 py-2.5 text-sm outline-none border resize-none",
                style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
              }),
              React.createElement("button", {
                onClick: envoyerQuestion, disabled: chargement !== null || question.trim().length === 0,
                className: "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30",
                style: { background: IA.solide, color: "#fff" }
              }, React.createElement(Icon, { name: "send", size: 16 }))
            )
          )
        ),

        // ========== BLOC 2 : PRATIQUE & RÉVISION ==========
        blocActif === "pratique" && React.createElement(React.Fragment, null,
          // Teinte plein écran (portail vers <body>, sans bloquer les clics) tant que le mode est actif.
          sauvetageActif && ReactDOM.createPortal(
            React.createElement("div", { className: "sabi-sauvetage-teinte fixed inset-0 z-[45]", style: { pointerEvents: "none" } }),
            document.body
          ),
          // Mode Sauvetage — palette d'urgence rouge/orange vive (contraste WCAG AA), plus le
          // ton saumon fade d'avant qui ne se distinguait pas assez du reste de l'écran.
          React.createElement("div", { className: "rounded-lg p-4 flex flex-col gap-2.5", style: { background: "linear-gradient(135deg, rgba(239,68,68,0.16), rgba(249,115,22,0.10))", border: "1px solid #f97316" } },
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement(Icon, { name: "flame", size: 18, color: "#fca5a5" }),
              React.createElement("p", { className: "text-sm font-bold", style: { color: "#fecaca" } }, "Mode Sauvetage")
            ),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.text } }, sauvetageActif ? PHRASES_SAUVETAGE[phraseSauvetage] : "Urgence académique ? Plan de crise en 48h."),
            sauvetageActif
              ? React.createElement("button", {
                  onClick: terminerSauvetage,
                  className: "self-start rounded-full px-4 py-2 text-xs font-bold",
                  style: { backgroundColor: "rgba(255,255,255,0.14)", border: "1px solid #fff", color: "#fff" }
                }, "Terminer")
              : React.createElement("button", {
                  onClick: declencherSauvetage, disabled: chargement !== null,
                  className: "self-start rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50",
                  style: { background: "linear-gradient(135deg, #ef4444, #f97316)", color: "#fff" }
                }, "Lancer le plan de crise")
          ),

          // Réponse du Mode Sauvetage — affichée ici (onglet Pratique), pas dans Coach & Diagnostic.
          chargement === "sauvetage" && React.createElement("div", { className: "rounded-lg border p-4 flex items-center gap-2", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement(Icon, { name: "refresh-cw", size: 14, color: IA.txt }),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Le coach prépare ton plan de crise...")
          ),
          erreur && actionReponse === "sauvetage" && React.createElement("div", { className: "rounded-lg border p-3.5", style: { borderColor: COLORS.alerte, backgroundColor: "rgba(249,115,22,0.1)" } },
            React.createElement("p", { className: "text-xs", style: { color: COLORS.alerte } }, erreur)
          ),
          reponse && actionReponse === "sauvetage" && React.createElement("div", { className: "rounded-lg border p-4", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
            React.createElement(CorrigeRendu, { texte: reponse })
          ),

          // Quiz IA
          React.createElement("div", null,
            React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider mb-2", style: { color: COLORS.textFaint } }, "Quiz IA"),
            erreur && actionReponse === "quiz" && React.createElement("div", { className: "rounded-lg border p-3.5 mb-2", style: { borderColor: COLORS.alerte, backgroundColor: "rgba(249,115,22,0.1)" } },
              React.createElement("p", { className: "text-xs", style: { color: COLORS.alerte } }, erreur)
            ),
            !quiz && React.createElement("div", { className: "rounded-lg border p-4 flex flex-col gap-3", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
              React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Teste-toi sur un résumé de cours déjà publié, ou sur un sujet libre."),
              React.createElement("select", {
                value: quizSourceId, onChange: e => setQuizSourceId(e.target.value),
                className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
              },
                React.createElement("option", { value: "libre" }, "Sujet libre..."),
                resumesUtilisables.map(r => React.createElement("option", { key: r.id, value: r.id }, r.matiere + " (" + r.annee + ")"))
              ),
              quizSourceId === "libre" && React.createElement("input", {
                value: quizSujetLibre, onChange: e => setQuizSujetLibre(e.target.value),
                placeholder: "Ex : les lois de Kirchhoff, la comptabilité générale...",
                className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
              }),
              resumesUtilisables.length === 0 && quizSourceId === "libre" && React.createElement("p", { className: "text-[10px]", style: { color: "#71717a" } }, "Aucun résumé de cours publié pour l'instant dans ta filière, précise un sujet toi-même."),
              React.createElement("button", {
                onClick: genererQuiz, disabled: chargement !== null,
                className: "rounded-lg py-2.5 text-sm font-semibold disabled:opacity-50",
                style: { background: IA.solide, color: "#fff" }
              }, chargement === "quiz" ? "Génération du quiz..." : "Générer un quiz (5 questions)"),
              React.createElement("div", { className: "flex flex-col gap-2 pt-3 mt-1", style: { borderTop: "1px dashed " + COLORS.border } },
                React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Relever un duel : entre le code d'un ami."),
                React.createElement("div", { className: "flex gap-2" },
                  React.createElement("input", {
                    value: duelCodeSaisi, onChange: e => setDuelCodeSaisi(e.target.value.toUpperCase()), maxLength: 6, placeholder: "CODE",
                    className: "flex-1 rounded-lg px-3 py-2 text-sm font-mono tracking-widest text-center outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text }
                  }),
                  React.createElement("button", { onClick: rejoindreDuel, className: "rounded-lg px-4 py-2 text-sm font-semibold", style: { border: "1px solid " + IA.solide, color: IA.txt } }, "Relever")
                )
              )
            ),
            !quiz && React.createElement(SuiviDuels, { authUid: authUid }),
            quiz && duelActif && React.createElement("div", { className: "rounded-lg border p-3 text-center", style: { borderColor: IA.border, backgroundColor: IA.soft } },
              React.createElement("p", { className: "text-xs font-semibold", style: { color: IA.txt } }, "Duel contre " + duelActif.createur.pseudo + ", il a fait " + duelActif.createur.score + "/" + duelActif.createur.total)
            ),
            quiz && React.createElement("div", { className: "flex flex-col gap-3" },
              quiz.map((q, i) => {
                const choix = quizReponses[i];
                return React.createElement("div", { key: i, className: "rounded-lg border p-4 flex flex-col gap-2.5", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
                  React.createElement("p", { className: "text-sm font-medium", style: { color: COLORS.text } }, (i + 1) + ". " + q.question),
                  React.createElement("div", { className: "flex flex-col gap-1.5" },
                    q.options.map((opt, j) => {
                      let style = { borderColor: COLORS.border, color: COLORS.text };
                      if (quizValide) {
                        if (j === q.correctIndex) style = { borderColor: COLORS.forest, backgroundColor: "rgba(74,222,128,0.12)", color: COLORS.forest };
                        else if (j === choix) style = { borderColor: COLORS.terra, backgroundColor: "rgba(248,113,113,0.1)", color: COLORS.terra };
                      } else if (choix === j) {
                        style = { borderColor: IA.solide, backgroundColor: IA.soft, color: IA.txt };
                      }
                      return React.createElement("button", {
                        key: j, onClick: () => choisirReponseQuiz(i, j), disabled: quizValide,
                        className: "text-left text-xs rounded-lg px-3 py-2 border", style: style
                      }, opt);
                    })
                  ),
                  quizValide && React.createElement("p", { className: "text-[11px] flex items-start gap-1.5", style: { color: COLORS.textFaint } },
                    React.createElement(Icon, { name: choix === q.correctIndex ? "check" : "x", size: 12, color: choix === q.correctIndex ? COLORS.forest : COLORS.terra, style: { marginTop: 1, flexShrink: 0 } }),
                    q.explication)
                );
              }),
              !quizValide
                ? React.createElement("button", {
                    onClick: validerQuiz, disabled: Object.keys(quizReponses).length < quiz.length,
                    className: "rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40",
                    style: { background: IA.solide, color: "#fff" }
                  }, "Valider le quiz (" + Object.keys(quizReponses).length + "/" + quiz.length + ")")
                : React.createElement("div", { className: "rounded-lg border p-4 flex flex-col items-center gap-3 text-center", style: { borderColor: scoreQuiz === quiz.length ? COLORS.forest : COLORS.border, backgroundColor: COLORS.surface } },
                    React.createElement("p", { className: "text-2xl font-bold font-mono", style: { color: scoreQuiz === quiz.length ? COLORS.forest : IA.txt } }, (scoreQuiz === quiz.length ? "" : "") + scoreQuiz + "/" + quiz.length),
                    React.createElement(MascotteSabi, {
                      compact: true, humeur: scoreQuiz === quiz.length ? "fete" : scoreQuiz >= Math.ceil(quiz.length / 2) ? "content" : "triste",
                      message: scoreQuiz === quiz.length ? "Sans faute, bravo " + pseudo + " ! Tu es en feu" : scoreQuiz >= Math.ceil(quiz.length / 2) ? "Pas mal du tout ! Encore un petit effort pour le sans-faute" : "Aïe… mais c'est en révisant qu'on progresse. Relis les explications et retente !"
                    }),
                    React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } },
                      scoreQuiz === quiz.length ? "Score parfait, quiz réussi du 1er coup, comptabilisé dans ta progression !" : "Continue à réviser, tu peux relancer un quiz quand tu veux."),
                    quizCompte === true && React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.gold } }, "+" + scoreQuiz + " au classement Quiz de la semaine"),
                    quizCompte === false && React.createElement("p", { className: "text-[11px] font-mono", style: { color: COLORS.textFaint } }, "Limite de 5 quiz comptés par jour atteinte, celui-ci ne compte pas pour le classement."),
                    duelResultat && React.createElement("p", { className: "text-sm font-semibold", style: { color: duelResultat.moi > duelResultat.adversaire ? COLORS.forest : duelResultat.moi === duelResultat.adversaire ? COLORS.textMuted : COLORS.terra } },
                      duelResultat.moi > duelResultat.adversaire ? "Victoire contre " + duelResultat.pseudoAdv + " (" + duelResultat.moi + "-" + duelResultat.adversaire + ") !" : duelResultat.moi === duelResultat.adversaire ? "Égalité avec " + duelResultat.pseudoAdv + " (" + duelResultat.moi + "-" + duelResultat.adversaire + ")" : "" + duelResultat.pseudoAdv + " gagne (" + duelResultat.adversaire + "-" + duelResultat.moi + ")… revanche ?"),
                    !duelActif && !duelCree && React.createElement("button", { onClick: creerDuel, className: "rounded-full px-4 py-2 text-xs font-semibold", style: { border: "1px solid " + IA.solide, color: IA.txt } }, "Défier un ami avec ce quiz"),
                    duelCree && React.createElement("div", { className: "flex flex-col items-center gap-2" },
                      React.createElement("p", { className: "text-[11px]", style: { color: COLORS.textFaint } }, "Code de ton duel :"),
                      React.createElement("p", { className: "text-2xl font-mono font-bold tracking-widest", style: { color: COLORS.gold } }, duelCree),
                      React.createElement("button", { onClick: () => partagerDuel(duelCree), className: "rounded-full px-4 py-2 text-xs font-semibold", style: { backgroundColor: IA.solide, color: "#fff" } }, "Partager le défi")
                    ),
                    BoutonGhost({ onClick: recommencerQuiz, className: "mt-1" }, "Nouveau quiz")
                  )
            )
          )
        ),

        // ========== BLOC 3 : FOCUS HUB ==========
        // Fusion de l'ancien "Timer de Concentration" et de "Progression Hebdomadaire" en un
        // seul composant : le timer au centre (pièce maîtresse), les jauges d'objectifs juste
        // en dessous — un seul endroit pour tout ce qui concerne la concentration du jour.
        blocActif === "focus" && React.createElement("div", { className: "rounded-lg border p-6 flex flex-col items-center gap-5", style: { borderColor: focusSession ? IA.border : COLORS.border, backgroundColor: COLORS.surface, backdropFilter: "blur(6px)" } },
          // Teinte d'ambiance plein écran (portail vers <body>, clics non bloqués) tant que la session est en cours.
          focusSession && ReactDOM.createPortal(
            React.createElement("div", { className: "sabi-focus-teinte fixed inset-0 z-[45]", style: { pointerEvents: "none" } }),
            document.body
          ),
          (() => {
            const pct = Math.min(100, ((progression.focusMinutes / progression.focusObjectif) + (progression.quizReussis / progression.quizObjectif)) / 2 * 100);
            const label = pct >= 75 ? "Warrior de la révision" : pct >= 40 ? "Sur la bonne voie" : "Débutant motivé";
            return React.createElement("span", { className: "text-[10px] font-mono px-2.5 py-1 rounded-full self-center", style: { color: IA.txt, backgroundColor: IA.soft } }, label);
          })(),
          React.createElement("p", {
            className: "font-mono font-bold tabular-nums",
            style: { fontSize: 64, letterSpacing: "0.02em", color: focusSession ? IA.txt : COLORS.text, lineHeight: 1 }
          }, mmss(focusRestant)),

          // Série de jours de focus : la flamme grandit avec la série
          focusStreak > 0 && React.createElement("div", { className: "flex items-center gap-2 rounded-full px-3 py-1.5", style: { backgroundColor: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.5)" } },
            React.createElement(Icon, { name: "flame", size: Math.min(30, 16 + focusStreak * 2), color: COLORS.gold }),
            React.createElement("span", { className: "text-xs font-mono font-semibold", style: { color: COLORS.alerte } }, focusStreak + " jour" + (focusStreak > 1 ? "s" : "") + " de focus d'affilée")
          ),

          // Mascotte : encourage pendant la session, motive avant de lancer
          React.createElement(MascotteSabi, {
            compact: true, humeur: focusSession ? "focus" : "content",
            message: focusSession ? (focusActif ? PHRASES_FOCUS[focusPhrase] : "Session en pause, reprends quand tu es prêt·e.") : (focusStreak > 0 ? "Ta flamme de " + focusStreak + " jour" + (focusStreak > 1 ? "s" : "") + " t'attend, ne la laisse pas s'éteindre !" : "Choisis ta durée et lance une session : on commence ta première flamme")
          }),
          focusSession && React.createElement("p", { className: "text-[11px] text-center", style: { color: COLORS.textFaint } }, React.createElement(Icon, { name: "bell-off", size: 12, style: { display: "inline", verticalAlign: "-2px", marginRight: 4 } }), "Notifications Sabi en sourdine, pense à activer « Ne pas déranger » sur ton téléphone."),

          // Bilan après une session
          !focusSession && focusBilan && React.createElement("div", {
            className: "sabi-focus-fin w-full rounded-lg p-3 text-center",
            style: { backgroundColor: IA.soft, border: "1px solid " + IA.border }
          },
            React.createElement("p", { className: "text-sm font-semibold", style: { color: IA.txt } },
              focusBilan.complet ? "Session terminée, bravo !" : (focusBilan.minutes > 0 ? "Session arrêtée" : "Session trop courte pour compter")),
            React.createElement("p", { className: "text-xs mt-0.5", style: { color: COLORS.text } },
              focusBilan.minutes > 0 ? ("+" + focusBilan.minutes + " min ajoutée" + (focusBilan.minutes > 1 ? "s" : "") + " à ta progression.") : "Ce qui compte, c'est d'essayer")
          ),

          // Choix de la durée (avant de lancer)
          !focusSession && React.createElement("div", { className: "w-full flex flex-col gap-2" },
            React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider text-center", style: { color: COLORS.textMuted } }, "Durée de la session"),
            React.createElement("div", { className: "flex items-center justify-center gap-2 flex-wrap" },
              [15, 25, 45, 60].map(m => React.createElement("button", {
                key: m, onClick: () => changerDureeFocus(m),
                className: "rounded-full px-3 py-1.5 text-xs font-mono border",
                style: focusDuree === m
                  ? { borderColor: IA.solide, backgroundColor: IA.soft, color: IA.txt }
                  : { borderColor: COLORS.border, color: COLORS.textMuted }
              }, m + " min")),
              React.createElement("div", { className: "flex items-center gap-1" },
                React.createElement("input", {
                  type: "number", min: 1, max: 180, inputMode: "numeric",
                  value: focusSaisie !== "" ? focusSaisie : focusDuree,
                  onChange: e => {
                    const v = e.target.value;
                    setFocusSaisie(v);
                    if (v !== "" && Number(v) >= 1) changerDureeFocus(v);
                    setFocusSaisie(v); // changerDureeFocus vide la saisie : on la remet pour ne pas gêner la frappe
                  },
                  onBlur: () => setFocusSaisie(""),
                  className: "w-16 rounded-lg px-2 py-1.5 text-xs font-mono text-center outline-none border",
                  style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text },
                  "aria-label": "Durée personnalisée en minutes"
                }),
                React.createElement("span", { className: "text-xs", style: { color: COLORS.textMuted } }, "min")
              )
            )
          ),

          // Lancer <-> Terminer (+ Pause/Reprendre en secondaire)
          focusSession
            ? React.createElement("div", { className: "flex items-center gap-2" },
                React.createElement("button", {
                  onClick: () => terminerFocus(false),
                  className: "rounded-full px-6 py-2.5 text-sm font-semibold flex items-center gap-2",
                  style: { border: "1px solid #f87171", color: COLORS.terra }
                }, React.createElement(Icon, { name: "x", size: 14 }), "Terminer"),
                React.createElement("button", {
                  onClick: focusActif ? pauseFocus : reprendreFocus,
                  className: "rounded-full px-4 py-2.5 text-sm font-semibold flex items-center gap-2 border",
                  style: { borderColor: COLORS.border, color: COLORS.textMuted }
                }, React.createElement(Icon, { name: focusActif ? "pause" : "play", size: 14 }), focusActif ? "Pause" : "Reprendre")
              )
            : React.createElement("button", {
                onClick: lancerFocus,
                className: "rounded-full px-6 py-2.5 text-sm font-semibold flex items-center gap-2",
                style: { background: IA.solide, color: "#fff" }
              }, React.createElement(Icon, { name: "play", size: 14 }), "Lancer"),

          React.createElement("div", { className: "w-full flex flex-col gap-3 pt-1" },
            React.createElement("div", null,
              React.createElement("div", { className: "flex items-center justify-between mb-1" },
                React.createElement("span", { className: "text-xs", style: { color: COLORS.text } }, "Minutes de focus"),
                React.createElement("span", { className: "text-xs font-mono", style: { color: IA.txt } }, progression.focusMinutes + "/" + progression.focusObjectif)
              ),
              React.createElement("div", { className: "w-full h-2 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
                React.createElement("div", { className: "h-full rounded-full", style: { width: Math.min(100, progression.focusMinutes / progression.focusObjectif * 100) + "%", background: IA.solide } })
              )
            ),
            React.createElement("div", null,
              React.createElement("div", { className: "flex items-center justify-between mb-1" },
                React.createElement("span", { className: "text-xs", style: { color: COLORS.text } }, "Quiz réussis du 1er coup"),
                React.createElement("span", { className: "text-xs font-mono", style: { color: COLORS.forest } }, progression.quizReussis + "/" + progression.quizObjectif)
              ),
              React.createElement("div", { className: "w-full h-2 rounded-full overflow-hidden", style: { backgroundColor: COLORS.border } },
                React.createElement("div", { className: "h-full rounded-full", style: { width: Math.min(100, progression.quizReussis / progression.quizObjectif * 100) + "%", backgroundColor: COLORS.forest } })
              )
            )
          ),

          React.createElement("div", { className: "w-full rounded-lg p-3 flex items-start gap-2", style: { backgroundColor: IA.soft } },
            React.createElement(Icon, { name: "lightbulb", size: 14, color: IA.txt, style: { marginTop: 1, flexShrink: 0 } }),
            React.createElement("div", { className: "flex-1" },
              React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider mb-0.5", style: { color: IA.txt } }, "Conseil Sabi"),
              React.createElement("p", { className: "text-xs leading-relaxed", style: { color: COLORS.text } }, conseilDuJour)
            ),
            React.createElement(BoutonCarnet, { texte: conseilDuJour })
          )
        )
      );
    }
