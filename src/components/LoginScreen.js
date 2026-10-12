// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { LienConfidentialite, ouvrirConfidentialite } from "./Confidentialite.js";
import { Icon } from "./Icon.js";
import { ChampFlottant } from "./MenuLateral.js";
import { ANNEES, LOGO_SABI } from "../config/constantes.js";
import { FILIERES, getFilieresPourAnnee } from "../data/curriculum.js";
import { auth, matriculesRef, usersRef } from "../firebase.js";
import { envoyerCodeOtp } from "../services/email.js";
import { NETLIFY_BASE_URL } from "../services/netlify.js";
import { COLORS } from "../theme.js";

    // Bouton pleine largeur avec chevron, façon Neero
    function BoutonSuivant({ onClick, disabled, chargement, children }) {
      return React.createElement("button", {
        onClick: onClick, disabled: disabled || chargement, type: "button",
        className: "sabi-btn-gold w-full py-3.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40",
        style: { color: COLORS.bg }
      }, chargement ? "..." : children, !chargement && React.createElement("span", null, "›"));
    }

    // Header commun aux écrans de l'assistant : retour + fermer
    function EnteteEtape({ onBack, onClose }) {
      return React.createElement("div", { className: "flex items-center justify-between mb-3" },
        React.createElement("button", { onClick: onBack, className: "text-2xl leading-none", style: { color: COLORS.text } }, "←"),
        onClose && React.createElement("button", { onClick: onClose, className: "text-2xl leading-none", style: { color: COLORS.text } }, "×")
      );
    }

    // 6 cases pour le code de vérification
    function CasesOtp({ code, onChange }) {
      const refs = React.useRef([]);
      const setDigit = (i, v) => {
        if (!/^[0-9]?$/.test(v)) return;
        const next = code.split("");
        next[i] = v;
        onChange(next.join("").slice(0, 6));
        if (v && refs.current[i + 1]) refs.current[i + 1].focus();
      };
      const onKeyDown = (i, e) => {
        if (e.key === "Backspace" && !code[i] && refs.current[i - 1]) refs.current[i - 1].focus();
      };
      return React.createElement("div", { className: "flex gap-2.5 justify-center" },
        [0, 1, 2, 3, 4, 5].map(i => React.createElement("input", {
          key: i, ref: el => refs.current[i] = el,
          value: code[i] || "", onChange: e => setDigit(i, e.target.value),
          onKeyDown: e => onKeyDown(i, e),
          maxLength: 1, inputMode: "numeric",
          className: "w-11 h-14 text-center text-xl font-bold rounded-lg border outline-none",
          style: { backgroundColor: COLORS.surface, borderColor: code[i] ? COLORS.gold : COLORS.border, color: COLORS.text }
        }))
      );
    }

    // ===== Carrousel de bienvenue affiché avant la première connexion =====
    const ONBOARDING_SLIDES = [
      { emoji: "book", titre: "Le savoir circule entre étudiants", description: "Découvre et partage des astuces \"sabi\" utiles pour réussir à l'IUT, vote pour les meilleures et gagne des points." },
      { emoji: "file-text", titre: "Épreuves et corrigés", description: "Retrouve les sujets d'épreuves passées par filière et année, avec des corrigés, y compris générés par IA." },
      { emoji: "map", titre: "La carte du campus", description: "Repère facilement les bâtiments, salles et services importants de l'IUT FV Bandjoun." },
      { emoji: "medal", titre: "Progresse et débloque des badges", description: "Gagne des points en contribuant, grimpe au classement et débloque des badges au fil de ton parcours." }
    ];

    export function OnboardingCarousel({ onTerminer }) {
      const [index, setIndex] = useState(0);
      const dernier = index === ONBOARDING_SLIDES.length - 1;
      const slide = ONBOARDING_SLIDES[index];

      return React.createElement("div", {
        className: "h-dvh w-full flex justify-center px-5 py-4 overflow-hidden",
        style: {
          backgroundColor: COLORS.bg,
          backgroundImage: "radial-gradient(ellipse 80% 45% at 50% 28%, rgba(var(--accent-rgb),0.30), transparent 70%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(59,130,246,0.20), transparent 65%), radial-gradient(ellipse 55% 35% at 100% 88%, rgba(236,72,153,0.14), transparent 65%)"
        }
      },
        React.createElement("div", { className: "w-full max-w-md h-full flex flex-col" },
          React.createElement("div", { className: "flex justify-end" },
            React.createElement("button", {
              onClick: onTerminer,
              className: "text-xs font-mono uppercase tracking-wide",
              style: { color: COLORS.textMuted, letterSpacing: "0.08em" }
            }, "Passer tout")
          ),
          React.createElement("div", { className: "flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-4" },
            React.createElement("div", {
              className: "w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0",
              style: { backgroundColor: COLORS.surface2 }
            }, React.createElement(Icon, { name: slide.emoji, size: 34, color: COLORS.gold })),
            React.createElement("h1", { className: "text-2xl font-bold px-2", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, slide.titre),
            React.createElement("p", { className: "text-sm px-2", style: { color: COLORS.textMuted } }, slide.description)
          ),
          React.createElement("div", { className: "flex items-center justify-between pt-3 flex-shrink-0" },
            React.createElement("div", { className: "flex gap-1.5" },
              ONBOARDING_SLIDES.map((_, i) => React.createElement("span", {
                key: i, className: "rounded-full transition-all",
                style: { width: i === index ? 20 : 6, height: 6, backgroundColor: i === index ? COLORS.gold : COLORS.border }
              }))
            ),
            React.createElement("button", {
              onClick: () => dernier ? onTerminer() : setIndex(i => i + 1),
              className: "rounded-lg px-6 py-3 text-sm font-semibold",
              style: { backgroundColor: COLORS.gold, color: COLORS.bg }
            }, dernier ? "Commencer !" : "Suivant")
          )
        )
      );
    }

    export function LoginScreen({ onLoggedIn }) {
      // L'OS peut décharger l'onglet en arrière-plan (ex: on quitte l'app pour aller lire le code
      // dans ses emails) et effacer tout l'état React en mémoire au retour. On sauvegarde donc
      // l'avancée de l'inscription dans sessionStorage (propre à cet onglet, effacé à sa fermeture)
      // pour la restaurer automatiquement si la page redémarre pendant l'inscription.
      const brouillon = (() => {
        try { return JSON.parse(sessionStorage.getItem("sabiInscriptionBrouillon") || "null") || {}; } catch { return {}; }
      })();
      const etapeSignupValide = ["credentials", "identite", "verif-choix", "otp", "mdp", "recap"].includes(brouillon.step);

      const [mode, setMode] = useState(etapeSignupValide ? "signup" : "welcome");
      const [step, setStep] = useState(etapeSignupValide ? brouillon.step : "welcome"); // welcome | login | credentials | identite | verif-choix | otp | recap
      const [email, setEmail] = useState(brouillon.email || "");
      const [password, setPassword] = useState(brouillon.password || "");
      const [pseudo, setPseudo] = useState(brouillon.pseudo || "");
      const [matricule, setMatricule] = useState(brouillon.matricule || "");
      const [annee, setAnnee] = useState(brouillon.annee || ANNEES[0]);
      const [filiere, setFiliere] = useState(brouillon.filiere || FILIERES[0]);
      const [whatsapp, setWhatsapp] = useState(brouillon.whatsapp || "");
      const [accepteConfidentialite, setAccepteConfidentialite] = useState(!!brouillon.accepteConfidentialite);
      const [erreur, setErreur] = useState("");
      const [chargement, setChargement] = useState(false);
      const [showPassword, setShowPassword] = useState(false);
      const [methodeVerif, setMethodeVerif] = useState("email");
      const [otpCode, setOtpCode] = useState("");
      const [otpMinuteur, setOtpMinuteur] = useState(() => {
        if (etapeSignupValide && brouillon.step === "otp" && brouillon.otpAttendu) {
          return Math.max(0, Math.floor((brouillon.otpAttendu.expiresAt - Date.now()) / 1000));
        }
        return 0;
      });
      const [confirmPassword, setConfirmPassword] = useState(brouillon.confirmPassword || "");
      const [showConfirmPassword, setShowConfirmPassword] = useState(false);
      const [otpAttendu, setOtpAttendu] = useState(brouillon.otpAttendu || null); // { code, expiresAt } gardé en mémoire (+ sessionStorage), pas en base

      // Sauvegarde continue du brouillon pendant toute l'inscription — effacé dès qu'on revient
      // à l'accueil/connexion ou qu'un compte est créé avec succès.
      useEffect(() => {
        if (!["credentials", "identite", "verif-choix", "otp", "mdp", "recap"].includes(step)) {
          try { sessionStorage.removeItem("sabiInscriptionBrouillon"); } catch {}
          return;
        }
        try {
          sessionStorage.setItem("sabiInscriptionBrouillon", JSON.stringify({
            step, email, password, pseudo, matricule, annee, filiere, whatsapp, confirmPassword, otpAttendu
          }));
        } catch {}
      }, [step, email, password, pseudo, matricule, annee, filiere, whatsapp, confirmPassword, otpAttendu]);

      useEffect(() => {
        if (otpMinuteur <= 0) return;
        const t = setTimeout(() => setOtpMinuteur(s => s - 1), 1000);
        return () => clearTimeout(t);
      }, [otpMinuteur]);

      const messageErreur = (code) => {
        if (code === "auth/email-already-in-use") return "Cet email a déjà un compte. Essaie de te connecter.";
        if (code === "auth/invalid-email") return "Adresse email invalide.";
        if (code === "auth/weak-password") return "Mot de passe trop court (6 caractères minimum).";
        if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") return "Email ou mot de passe incorrect.";
        return "Une erreur est survenue. Réessaie.";
      };

      const formatMinuteur = (s) => String(Math.floor(s / 60)).padStart(2, "0") + ":" + String(s % 60).padStart(2, "0");

      const envoyerEtPasserAOtp = async () => {
        setErreur("");
        setChargement(true);
        try {
          const code = await envoyerCodeOtp(email);
          setOtpAttendu({ code, expiresAt: Date.now() + 10 * 60 * 1000 });
          setOtpCode("");
          setOtpMinuteur(80);
          setStep("otp");
        } catch (e) {
          // L'envoi d'email peut échouer (config EmailJS manquante, quota gratuit épuisé,
          // pas de connexion...). Plutôt que de bloquer l'inscription, on ignore la vérification
          // par email et on passe directement à l'étape suivante.
          console.warn("Vérification OTP ignorée (échec d'envoi) :", e.message || e);
          setOtpAttendu(null);
          setStep("mdp");
        } finally {
          setChargement(false);
        }
      };

      const verifierOtp = () => {
        setErreur("");
        if (!otpAttendu) { setErreur("Aucun code n'a été envoyé. Demande-en un nouveau."); return; }
        if (Date.now() > otpAttendu.expiresAt) { setErreur("Ce code a expiré. Demande-en un nouveau."); return; }
        if (otpCode !== otpAttendu.code) { setErreur("Code incorrect."); return; }
        setStep("mdp");
      };

      const confirmerInscription = async () => {
        setErreur("");
        setChargement(true);
        try {
          // Le compte ET le profil sont créés côté serveur, en une seule fois, avec les droits
          // admin — voir netlify/functions/inscription.js. Le téléphone n'a plus qu'à envoyer
          // les informations et à attendre une réponse claire : succès, ou erreur précise.
          const estNatif = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
          // Web : même domaine que l'appli (pas de CORS). Appli native : adresse complète.
          const resp = await fetch((estNatif ? NETLIFY_BASE_URL : "") + "/.netlify/functions/inscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email.trim(), password,
              pseudo: pseudo.trim(), matricule: matricule.trim(), annee, filiere, whatsapp: whatsapp.trim()
            })
          });
          const data = await resp.json().catch(() => ({}));
          if (!resp.ok || !data.ok) {
            setErreur((data.erreur || "Une erreur est survenue, réessaie.") + (data.detail ? " [" + data.detail + "]" : ""));
            setChargement(false);
            return;
          }
          // Compte et profil confirmés existants côté serveur : on se connecte maintenant
          // normalement, sans aucun risque de tomber sur un profil vide entre-temps.
          try {
            await auth.signInWithEmailAndPassword(email.trim(), password);
          } catch (e2) {
            setErreur("Compte créé, mais la connexion a échoué (" + ((e2 && (e2.code || e2.message)) || "inconnu") + "). Essaie de te connecter.");
            setChargement(false);
            return;
          }
          // Trace de l'acceptation (date). "Au mieux" : si les règles Firebase refusent l'écriture,
          // l'inscription n'est pas bloquée pour autant.
          try { await usersRef.child(auth.currentUser.uid).child("confidentialiteAcceptee").set(Date.now()); } catch {}
          try { sessionStorage.removeItem("sabiInscriptionBrouillon"); } catch {}
        } catch (e) {
          setErreur("Impossible de contacter le serveur, vérifie ta connexion et réessaie. [" + ((e && e.message) || "réseau") + "]");
          setChargement(false);
        }
      };

      const handleLogin = async () => {
        setErreur("");
        setChargement(true);
        try {
          await auth.signInWithEmailAndPassword(email.trim(), password);
        } catch (e) {
          setErreur(messageErreur(e.code));
          setChargement(false);
        }
      };

      const enveloppe = (contenu, avecHeader) => React.createElement("div", {
        className: "h-dvh w-full flex justify-center overflow-y-auto px-5 py-6",
        style: {
          backgroundColor: COLORS.bg,
          // Fond "aurore" façon écran de connexion en verre : halo violet central, reflets bleu et rose.
          backgroundImage: "radial-gradient(ellipse 80% 45% at 50% 30%, rgba(var(--accent-rgb),0.34), transparent 70%), radial-gradient(ellipse 60% 40% at 0% 100%, rgba(59,130,246,0.22), transparent 65%), radial-gradient(ellipse 55% 35% at 100% 85%, rgba(236,72,153,0.16), transparent 65%)"
        }
      }, React.createElement("div", { className: "w-full max-w-md flex flex-col my-auto" },
        avecHeader,
        React.createElement("div", { className: "sabi-glass-card" }, contenu)
      ));

      // ---- Écran d'accueil : logo + choix connexion/inscription ----
      if (step === "welcome") {
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("div", { className: "text-center mb-6" },
              React.createElement("div", { className: "sabi-emblem w-24 h-24 mx-auto mb-4 p-2" },
                React.createElement("img", { src: LOGO_SABI, alt: "Sabi", className: "w-full h-full object-contain" })
              ),
              React.createElement("h1", { className: "text-4xl font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Sabi"),
              React.createElement("p", { className: "text-[10px] font-mono uppercase mt-2", style: { color: COLORS.textMuted, letterSpacing: "0.12em" } }, "IUT FV Bandjoun"),
              React.createElement("p", { className: "text-xs mt-1 italic", style: { color: COLORS.textFaint, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 400 } }, "Épreuves, corrections et suivi de tes notes pour les étudiants de l'IUT FV.")
            ),
            React.createElement("button", {
              onClick: () => { setMode("signup"); setStep("credentials"); setErreur(""); },
              className: "sabi-btn-gold w-full py-3.5 text-sm font-semibold", style: { color: COLORS.bg }
            }, "Créer un compte"),
            React.createElement("button", {
              onClick: () => { setMode("login"); setStep("login"); setErreur(""); },
              className: "w-full rounded-lg py-3.5 text-sm font-semibold border", style: { borderColor: "rgba(var(--accent-rgb),0.45)", backgroundColor: "var(--field-bg)", color: COLORS.text }
            }, "Se connecter"),
            React.createElement("div", { className: "text-center mt-2" }, React.createElement(LienConfidentialite))
          ), null
        );
      }

      // ---- Connexion classique ----
      if (step === "login") {
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("div", { className: "text-center mb-2" },
              React.createElement("div", { className: "sabi-emblem w-20 h-20 mx-auto mb-3 p-1.5" },
                React.createElement("img", { src: LOGO_SABI, alt: "Sabi", className: "w-full h-full object-contain" })
              ),
              React.createElement("h1", { className: "text-2xl font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Bienvenue"),
              React.createElement("p", { className: "text-sm mt-1", style: { color: COLORS.textMuted } }, "Connecte-toi à ton compte")
            ),
            React.createElement(ChampFlottant, { label: "Email", value: email, onChange: e => setEmail(e.target.value), type: "email", autoFocus: true }),
            React.createElement(ChampFlottant, {
              label: "Mot de passe", value: password, onChange: e => setPassword(e.target.value),
              type: showPassword ? "text" : "password",
              rightSlot: React.createElement("button", { type: "button", onClick: () => setShowPassword(v => !v), style: { color: COLORS.textMuted } }, showPassword ? React.createElement(Icon, { name: "eye-off", size: 17 }) : React.createElement(Icon, { name: "eye", size: 17 }))
            }),
            React.createElement("button", {
              onClick: async () => {
                if (!email.trim()) { setErreur("Renseigne ton email d'abord."); return; }
                try { await auth.sendPasswordResetEmail(email.trim()); setErreur("Email de réinitialisation envoyé."); }
                catch { setErreur("Impossible d'envoyer l'email de réinitialisation."); }
              },
              className: "text-xs self-end", style: { color: COLORS.gold }
            }, "Mot de passe oublié ?"),
            erreur && React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.terraText } }, erreur),
            React.createElement(BoutonSuivant, {
              onClick: handleLogin, chargement: chargement,
              disabled: email.trim().length < 3 || password.length === 0
            }, "Se connecter"),
            React.createElement("button", {
              onClick: () => { setStep("welcome"); setErreur(""); },
              className: "text-xs text-center mt-2", style: { color: COLORS.textMuted }
            }, "← Retour"),
            React.createElement("div", { className: "text-center" }, React.createElement(LienConfidentialite))
          ), null
        );
      }

      // ---- Inscription étape 1 : email + WhatsApp ----
      if (step === "credentials") {
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("h1", { className: "text-2xl font-bold mb-1", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Tes identifiants"),
            React.createElement("p", { className: "text-sm mb-2", style: { color: COLORS.textMuted } }, "Ils te permettront de te reconnecter plus tard."),
            React.createElement(ChampFlottant, { label: "Email", value: email, onChange: e => setEmail(e.target.value), type: "email", autoFocus: true }),
            React.createElement(ChampFlottant, { label: "Numéro WhatsApp (optionnel)", value: whatsapp, onChange: e => setWhatsapp(e.target.value), type: "tel" }),
            React.createElement("p", { className: "text-xs -mt-2", style: { color: COLORS.textFaint } }, "Pourra servir plus tard pour la vérification par WhatsApp."),
            React.createElement("div", { className: "flex items-start gap-3", style: { color: COLORS.textMuted } },
              React.createElement("button", {
                type: "button", role: "checkbox", "aria-checked": accepteConfidentialite, "aria-label": "Accepter la politique de confidentialité",
                onClick: () => setAccepteConfidentialite(v => !v),
                className: "flex-shrink-0 flex items-center justify-center",
                style: { width: 22, height: 22, marginTop: 1, borderRadius: 6, border: "1.5px solid " + (accepteConfidentialite ? COLORS.gold : COLORS.border), backgroundColor: accepteConfidentialite ? COLORS.gold : "transparent", color: COLORS.bg }
              }, accepteConfidentialite && React.createElement(Icon, { name: "check", size: 14 })),
              React.createElement("p", { className: "text-xs", style: { lineHeight: 1.5 } },
                "J'ai lu la ", React.createElement("button", { type: "button", onClick: ouvrirConfidentialite, className: "underline", style: { color: COLORS.gold } }, "politique de confidentialité"),
                " et j'accepte que Sabi utilise mes données comme elle l'explique.")
            ),
            erreur && React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.terraText } }, erreur),
            React.createElement(BoutonSuivant, {
              onClick: () => {
                setErreur("");
                if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setErreur("Adresse email invalide."); return; }
                if (!accepteConfidentialite) { setErreur("Accepte la politique de confidentialité pour continuer."); return; }
                setStep("identite");
              },
              disabled: !accepteConfidentialite
            }, "Suivant")
          ), React.createElement(EnteteEtape, { onBack: () => setStep("welcome") })
        );
      }

      // ---- Inscription étape 2 : pseudo, année, filière ----
      if (step === "identite") {
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("h1", { className: "text-2xl font-bold mb-1", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Qui es-tu ?"),
            React.createElement(ChampFlottant, { label: "Ton pseudo sur le campus", value: pseudo, onChange: e => setPseudo(e.target.value), autoFocus: true }),
            React.createElement(ChampFlottant, { label: "Ton matricule (optionnel)", value: matricule, onChange: e => setMatricule(e.target.value.toUpperCase()) }),
            React.createElement("p", { className: "text-[11px] -mt-2", style: { color: COLORS.textFaint } }, "Sert à t'attribuer automatiquement tes notes publiées par l'administration. Tu peux le laisser vide et le renseigner plus tard depuis ton profil, une fois enregistré, il ne pourra plus être modifié sans validation du propriétaire."),
            React.createElement("div", { className: "grid grid-cols-2 gap-3" },
              React.createElement("select", {
                value: annee,
                onChange: e => {
                  const nouvelleAnnee = e.target.value;
                  setAnnee(nouvelleAnnee);
                  const options = getFilieresPourAnnee(nouvelleAnnee);
                  if (!options.includes(filiere)) setFiliere(options[0]);
                },
                className: "rounded-lg px-3 py-3.5 text-sm outline-none border", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text }
              }, ANNEES.map(a => React.createElement("option", { key: a }, a))),
              React.createElement("select", { value: filiere, onChange: e => setFiliere(e.target.value), className: "rounded-lg px-3 py-3.5 text-sm outline-none border", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border, color: COLORS.text } }, getFilieresPourAnnee(annee).map(f => React.createElement("option", { key: f }, f)))
            ),
            erreur && React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.terraText } }, erreur),
            React.createElement(BoutonSuivant, {
              chargement: chargement,
              onClick: async () => {
                setErreur("");
                if (pseudo.trim().length < 2) { setErreur("Choisis un pseudo (2 caractères minimum)."); return; }
                const matriculeNorm = matricule.trim().toUpperCase();
                // Le matricule est désormais optionnel à l'inscription (saisie différée) —
                // on ne vérifie l'unicité que s'il a été renseigné.
                if (matriculeNorm.length > 0 && matriculeNorm.length < 3) { setErreur("Matricule trop court (ou laisse le champ vide pour le renseigner plus tard)."); return; }
                setChargement(true);
                if (matriculeNorm.length > 0) {
                  try {
                    const snap = await matriculesRef.child(matriculeNorm.replace(/[.#$/\[\]]/g, "_")).get();
                    if (snap.exists()) { setErreur("Ce matricule est déjà associé à un autre compte."); setChargement(false); return; }
                  } catch {
                    // La lecture peut échouer si les règles Firebase ne sont pas encore à jour ;
                    // on laisse alors passer plutôt que de bloquer l'inscription (l'unicité sera
                    // simplement vérifiée côté serveur au moment de l'écriture finale).
                  }
                }
                setChargement(false);
                setStep("verif-choix");
              }
            }, "Continuer")
          ), React.createElement(EnteteEtape, { onBack: () => setStep("credentials") })
        );
      }

      // ---- Inscription étape 3 : choix du moyen de vérification ----
      if (step === "verif-choix") {
        const Option = ({ id, icone, titre, description, disponible }) => React.createElement("button", {
          onClick: () => disponible && setMethodeVerif(id), disabled: !disponible,
          className: "w-full flex items-center gap-3 rounded-lg border px-4 py-2.5 text-left disabled:opacity-40",
          style: { backgroundColor: COLORS.surface, borderColor: methodeVerif === id ? COLORS.gold : COLORS.border }
        },
          React.createElement(Icon, { name: icone, size: 20 }),
          React.createElement("div", { className: "flex-1" },
            React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, titre),
            React.createElement("p", { className: "text-xs", style: { color: COLORS.textMuted } }, disponible ? description : "Bientôt disponible")
          ),
          React.createElement("span", {
            className: "w-5 h-5 rounded-full border-2 flex-shrink-0",
            style: { borderColor: methodeVerif === id ? COLORS.gold : COLORS.borderStrong, backgroundColor: methodeVerif === id ? COLORS.gold : "transparent" }
          })
        );
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-3" },
            React.createElement("h1", { className: "text-2xl font-bold mb-1", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Vérification"),
            React.createElement("p", { className: "text-sm", style: { color: COLORS.textMuted } }, "Choisis comment recevoir ton code de vérification."),
            React.createElement(Option, { id: "email", icone: "mail", titre: "Par email", description: "Recevoir le code par email", disponible: true }),
            React.createElement(Option, { id: "whatsapp", icone: "message-circle", titre: "Par WhatsApp", disponible: false }),
            React.createElement(Option, { id: "sms", icone: "mail", titre: "Par SMS", disponible: false }),
            erreur && React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.terraText } }, erreur),
            React.createElement(BoutonSuivant, { onClick: envoyerEtPasserAOtp, chargement: chargement }, "Suivant")
          ), React.createElement(EnteteEtape, { onBack: () => setStep("identite") })
        );
      }

      // ---- Inscription étape 4 : saisie du code ----
      if (step === "otp") {
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-5" },
            React.createElement("h1", { className: "text-2xl font-bold mb-1", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Saisis le code"),
            React.createElement("p", { className: "text-sm", style: { color: COLORS.textMuted } }, "Un code à 6 chiffres a été envoyé à ", React.createElement("span", { style: { color: COLORS.text, fontWeight: 600 } }, email)),
            React.createElement(CasesOtp, { code: otpCode, onChange: setOtpCode }),
            React.createElement("div", { className: "flex flex-col items-center gap-2 mt-1" },
              otpMinuteur > 0
                ? React.createElement("span", { className: "text-xs font-mono px-3 py-1.5 rounded-full", style: { backgroundColor: COLORS.surface, color: COLORS.textMuted } }, "⏱ " + formatMinuteur(otpMinuteur))
                : React.createElement("button", { onClick: envoyerEtPasserAOtp, className: "text-xs", style: { color: COLORS.gold } }, "Renvoyer le code")
            ),
            erreur && React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.terraText } }, erreur),
            React.createElement(BoutonSuivant, { onClick: verifierOtp, chargement: chargement, disabled: otpCode.length !== 6 }, "Vérifier"),
            // Si l'email n'arrive pas (spam, service de mail capricieux...), pas de raison de
            // bloquer l'inscription — cette vérification reste secondaire par rapport au compte
            // lui-même (déjà sécurisé par mot de passe à l'étape suivante).
            React.createElement("button", { onClick: () => { setOtpAttendu(null); setStep("mdp"); }, className: "text-xs self-center", style: { color: COLORS.textFaint } }, "Passer cette étape")
          ), React.createElement(EnteteEtape, { onBack: () => setStep("verif-choix") })
        );
      }

      // ---- Inscription étape 5 : sécurise ton compte (mot de passe + confirmation) ----
      if (step === "mdp") {
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-4" },
            React.createElement("h1", { className: "text-2xl font-bold mb-1", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Sécurise ton compte"),
            React.createElement("p", { className: "text-sm mb-2", style: { color: COLORS.textMuted } }, "Crée un mot de passe pour tes prochaines connexions."),
            React.createElement(ChampFlottant, {
              label: "Nouveau mot de passe", value: password, onChange: e => setPassword(e.target.value),
              type: showPassword ? "text" : "password", autoFocus: true,
              rightSlot: React.createElement("button", { type: "button", onClick: () => setShowPassword(v => !v), style: { color: COLORS.textMuted } }, showPassword ? React.createElement(Icon, { name: "eye-off", size: 17 }) : React.createElement(Icon, { name: "eye", size: 17 }))
            }),
            React.createElement(ChampFlottant, {
              label: "Confirmer le mot de passe", value: confirmPassword, onChange: e => setConfirmPassword(e.target.value),
              type: showConfirmPassword ? "text" : "password",
              rightSlot: React.createElement("button", { type: "button", onClick: () => setShowConfirmPassword(v => !v), style: { color: COLORS.textMuted } }, showConfirmPassword ? React.createElement(Icon, { name: "eye-off", size: 17 }) : React.createElement(Icon, { name: "eye", size: 17 }))
            }),
            erreur && React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.terraText } }, erreur),
            React.createElement(BoutonSuivant, {
              onClick: () => {
                setErreur("");
                if (password.length < 6) { setErreur("Mot de passe trop court (6 caractères minimum)."); return; }
                if (password !== confirmPassword) { setErreur("Les deux mots de passe ne correspondent pas."); return; }
                setStep("recap");
              }
            }, "Continuer")
          ), React.createElement(EnteteEtape, { onBack: () => setStep("otp") })
        );
      }

      // ---- Inscription étape 6 : récapitulatif avant validation ----
      if (step === "recap") {
        return enveloppe(
          React.createElement("div", { className: "flex flex-col gap-5" },
            React.createElement("div", { className: "text-center" },
              React.createElement("div", {
                className: "w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4",
                style: { backgroundColor: COLORS.surface2 }
              }, React.createElement(Icon, { name: "user", size: 26, color: COLORS.gold })),
              React.createElement("h1", { className: "text-2xl font-bold", style: { color: COLORS.text, fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif", fontWeight: 700, letterSpacing: "-0.02em" } }, "Vérifie tes informations"),
              React.createElement("p", { className: "text-sm mt-2", style: { color: COLORS.textMuted } }, "Assure-toi que tout est correct avant de valider.")
            ),
            React.createElement("div", { className: "rounded-lg border divide-y", style: { backgroundColor: COLORS.surface, borderColor: COLORS.border } },
              [["Pseudo", pseudo], ["Matricule", matricule.trim() ? matricule.trim().toUpperCase() : "à renseigner plus tard"], ["Email", email], ["Année", annee], ["Filière", filiere]].concat(whatsapp.trim() ? [["WhatsApp", whatsapp.trim()]] : []).map(([label, val]) =>
                React.createElement("div", { key: label, className: "flex items-center justify-between px-4 py-3", style: { borderColor: COLORS.border } },
                  React.createElement("span", { className: "text-xs", style: { color: COLORS.textMuted } }, label),
                  React.createElement("span", { className: "text-sm font-semibold text-right", style: { color: COLORS.text } }, val)
                )
              )
            ),
            erreur && React.createElement("p", { className: "text-xs text-center", style: { color: COLORS.terraText } }, erreur),
            React.createElement("div", { className: "flex gap-3" },
              React.createElement("button", {
                onClick: () => setStep("mdp"),
                className: "flex-1 rounded-lg py-3.5 text-sm font-semibold border", style: { borderColor: COLORS.border, color: COLORS.text }
              }, "Modifier"),
              React.createElement("button", {
                onClick: confirmerInscription, disabled: chargement,
                className: "flex-1 rounded-lg py-3.5 text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg }
              }, chargement ? "..." : "Confirmer")
            )
          ), null
        );
      }

      return null;
    }
