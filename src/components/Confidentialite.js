// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { Icon } from "./Icon.js";
import { COLORS } from "../theme.js";

    // ========== PAGE DE CONFIDENTIALITÉ ==========
    // Écran plein écran, ouvert depuis l'écran d'accueil, la connexion et le Profil par un simple
    // événement ("sabi:confidentialite"). Les champs [À COMPLÉTER] sont des infos que seul le
    // responsable de l'appli peut renseigner (identité, contact) : ne rien inventer ici.
    export function ouvrirConfidentialite() { window.dispatchEvent(new Event("sabi:confidentialite")); }

    export function LienConfidentialite({ className }) {
      return React.createElement("button", {
        onClick: ouvrirConfidentialite, className: "text-[11px] font-mono underline " + (className || ""),
        style: { color: COLORS.textFaint }
      }, "Confidentialité");
    }

    const CONFIDENTIALITE_MAJ = "2 octobre 2026";
    const CONFIDENTIALITE_SECTIONS = [
      { titre: "Qui est responsable de tes données", texte: [
        "Sabi est une application d'entraînement pour les étudiants de l'IUT FV Bandjoun.",
        "Responsable de l'application : l'équipe Sabi.",
        "Pour toute question sur tes données : écris à Bryansikame2023@gmail.com ou contacte le +237 658 68 25 93."
      ] },
      { titre: "Les données que Sabi collecte", liste: [
        "À l'inscription : ton email, ton mot de passe, ton pseudo, ton année et ta filière, plus ton matricule et ton numéro WhatsApp si tu les renseignes (facultatifs).",
        "Quand tu utilises l'appli : tes points, tes badges, tes scores de quiz, tes défis et duels, ton abonnement.",
        "Quand tu payes : la référence du paiement, le forfait choisi, le montant et son statut. Sabi ne voit jamais ton numéro Mobile Money ni ton code secret : tu les saisis uniquement sur la page de NotchPay.",
        "Si tu actives les notifications : un identifiant technique de ton téléphone, sans lequel on ne peut pas t'envoyer de notification.",
        "Sur ton appareil seulement : tes réglages (thème, sons, notifications, durée de focus) et l'état de ton dernier paiement en cours."
      ] },
      { titre: "Pourquoi on les utilise", liste: [
        "Créer ton compte et te reconnaître quand tu te connectes.",
        "Faire fonctionner l'appli : progression, classements, défis, duels, badges.",
        "Gérer ton abonnement et confirmer tes paiements.",
        "T'envoyer les notifications que tu as activées.",
        "Ton matricule sert à t'attribuer automatiquement les notes publiées par l'administration. Une fois enregistré, il ne peut plus être modifié sans validation du propriétaire.",
        "Ton numéro WhatsApp pourra servir plus tard à vérifier ton compte par WhatsApp."
      ], pied: "Ton pseudo et ton score sont visibles par les autres étudiants dans les classements. Ton email, ton matricule et ton numéro WhatsApp ne le sont pas." },
      { titre: "Qui peut y accéder", texte: [
        "Les administrateurs de Sabi voient ton profil pour valider un abonnement, un badge ou une demande de modification.",
        "Pour faire fonctionner l'appli, on s'appuie sur des services externes : Google Firebase (connexion, base de données, notifications), Netlify (hébergement et fonctions serveur), EmailJS et Brevo (envoi du code de vérification par email) et NotchPay (paiement en ligne).",
        "Tes données ne sont pas vendues et il n'y a aucune publicité dans Sabi."
      ] },
      { titre: "Combien de temps on les garde", texte: [
        "Tes données restent tant que ton compte existe. Si tu demandes la suppression de ton compte, le propriétaire de Sabi l'efface définitivement : ton accès, ton profil, ta progression, tes notifications, tes messages d'assistance et tes scores. Les traces de paiement (référence, forfait, montant) peuvent être conservées plus longtemps si la comptabilité l'exige : 6 mois."
      ] },
      { titre: "Tes droits", liste: [
        "Voir et corriger tes informations : tu peux modifier ton pseudo, ton numéro WhatsApp et ton mot de passe dans ton Profil.",
        "Demander une copie de tes données, la correction d'une information que tu ne peux pas changer toi-même, ou la suppression définitive de ton compte.",
        "Refuser les notifications à tout moment dans les réglages de l'appli ou de ton téléphone."
      ], pied: "Pour exercer ces droits, écris au contact indiqué plus haut. On répond dès que possible." },
      { titre: "Sécurité", texte: [
        "Les échanges avec Sabi passent par une connexion chiffrée (HTTPS). Ton mot de passe est géré par Firebase Authentication et n'est jamais lisible par l'équipe. Les paiements sont traités par NotchPay.",
        "Aucun système n'est infaillible : choisis un mot de passe que tu n'utilises nulle part ailleurs."
      ] },
      { titre: "Changements", texte: [
        "Si cette page change de façon importante, on te le dit dans l'appli. Dernière mise à jour : " + CONFIDENTIALITE_MAJ + "."
      ] }
    ];

    export function EcranConfidentialite({ onClose }) {
      return React.createElement("div", {
        role: "dialog", "aria-label": "Politique de confidentialité",
        className: "fixed inset-0 overflow-y-auto", style: { zIndex: 200, backgroundColor: COLORS.bg }
      },
        React.createElement("div", { className: "max-w-xl mx-auto px-5 pb-16", style: { paddingTop: "max(20px, env(safe-area-inset-top))" } },
          React.createElement("button", { onClick: onClose, className: "flex items-center gap-2 text-sm font-mono mb-6", style: { color: COLORS.textMuted } },
            React.createElement(Icon, { name: "arrow-left", size: 16 }), "Retour"),
          React.createElement("h1", { className: "text-2xl font-bold mb-1", style: { color: COLORS.text, letterSpacing: "-0.02em" } }, "Confidentialité"),
          React.createElement("p", { className: "text-xs font-mono mb-8", style: { color: COLORS.textFaint } }, "Mise à jour : " + CONFIDENTIALITE_MAJ),
          CONFIDENTIALITE_SECTIONS.map((sec, i) =>
            React.createElement("section", { key: i, className: "mb-7" },
              React.createElement("h2", { className: "text-base font-semibold mb-2", style: { color: COLORS.gold } }, sec.titre),
              (sec.texte || []).map((t, j) => React.createElement("p", { key: j, className: "text-sm mb-2", style: { color: COLORS.text, lineHeight: 1.6 } }, t)),
              sec.liste && React.createElement("ul", { className: "flex flex-col gap-2 pl-4", style: { listStyle: "disc" } },
                sec.liste.map((t, j) => React.createElement("li", { key: j, className: "text-sm", style: { color: COLORS.text, lineHeight: 1.6 } }, t))),
              sec.pied && React.createElement("p", { className: "text-sm mt-3", style: { color: COLORS.textMuted, lineHeight: 1.6 } }, sec.pied)
            )
          )
        )
      );
    }
