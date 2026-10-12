// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { classementHebdoRef, usersRef } from "../firebase.js";
import { notificationsActives } from "../preferences.js";
import { COLORS } from "../theme.js";

    // ========== COMPOSANTS ==========

    // État vide réutilisable — icône + message, plus accueillant qu'une simple ligne grise
    // ===== Notifications en bulle façon WhatsApp =====
    // Bus d'événements minimal : n'importe quel code de l'app peut déclencher une bulle sans avoir
    // à faire passer une fonction en props sur toute la profondeur des composants.
    // Ouvre un lien externe (PDF, WhatsApp...) de façon fiable des deux côtés : sur le web, le
    // comportement normal du navigateur (nouvel onglet) suffit ; dans l'app native, un simple
    // target="_blank" ne fait rien car il n'y a pas de navigateur système accessible de cette
    // façon — il faut passer explicitement par le plugin natif @capacitor/browser.
    export function ouvrirExterne(e, url) {
      if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
        e.preventDefault();
        const { Browser } = window.Capacitor.Plugins || {};
        if (Browser) Browser.open({ url });
      }
    }

    // Sourdine "Focus" : pendant une session Focus, les bulles de Sabi sont mises en attente puis
    // rejouées à la fin (max 5, avec un petit délai entre chaque). Ne concerne QUE les bulles de
    // l'app — une page web ne peut pas couper les notifications du téléphone (WhatsApp, appels...).
    let focusSourdine = false;
    const bullesEnAttente = [];
    export function definirSourdineFocus(active) {
      if (focusSourdine === active) return;
      focusSourdine = active;
      if (active) return;
      const aRejouer = bullesEnAttente.splice(0, bullesEnAttente.length).slice(-5);
      aRejouer.forEach((detail, i) => setTimeout(() => window.dispatchEvent(new CustomEvent("sabi-notif", { detail })), 700 + i * 900));
    }
    export function notifierBulle(texte, options = {}) {
      if (!notificationsActives) return;
      const detail = { texte, ...options };
      if (focusSourdine) { if (bullesEnAttente.length < 20) bullesEnAttente.push(detail); return; }
      window.dispatchEvent(new CustomEvent("sabi-notif", { detail }));
    }

    export function jourCle(d) { return (d || new Date()).toISOString().slice(0, 10); }
    // Même formule que la progression hebdomadaire du Coach (semaine "AAAA-Sn").
    export function semaineCle(d) {
      d = d || new Date();
      const jan1 = new Date(d.getFullYear(), 0, 1);
      const semaine = Math.ceil(((d - jan1) / 86400000 + jan1.getDay() + 1) / 7);
      return d.getFullYear() + "-S" + semaine;
    }

    // Sons doux générés à la volée (aucun fichier audio) — coupables via le menu (clé "sabi_sons").
    export function sonsActifs() { try { return localStorage.getItem("sabi_sons") !== "off"; } catch { return true; } }
    let contexteAudio = null;
    export function jouerSon(type) {
      if (!sonsActifs()) return;
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        contexteAudio = contexteAudio || new AC();
        if (contexteAudio.state === "suspended") contexteAudio.resume();
        const partitions = {
          ding: [[880, 0, 0.18], [1320, 0.12, 0.35]],
          succes: [[523, 0, 0.14], [659, 0.12, 0.14], [784, 0.24, 0.14], [1047, 0.36, 0.4]],
          tick: [[1000, 0, 0.05]],
          roue: [[600, 0, 0.06]],
          oups: [[330, 0, 0.18], [262, 0.16, 0.3]]
        };
        (partitions[type] || partitions.ding).forEach(([freq, debut, duree]) => {
          const o = contexteAudio.createOscillator();
          const g = contexteAudio.createGain();
          o.type = "sine"; o.frequency.value = freq;
          const t0 = contexteAudio.currentTime + debut;
          g.gain.setValueAtTime(0.0001, t0);
          g.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + duree);
          o.connect(g); g.connect(contexteAudio.destination);
          o.start(t0); o.stop(t0 + duree + 0.05);
        });
      } catch {}
    }
    export function haptique(motif) { try { if (navigator.vibrate) navigator.vibrate(motif); } catch {} }

    // Confettis en canvas ajouté directement à <body> (pas de React : échappe au transform du swipe).
    function lancerConfettis() {
      try {
        const canvas = document.createElement("canvas");
        canvas.style.cssText = "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:400;";
        canvas.width = window.innerWidth; canvas.height = window.innerHeight;
        document.body.appendChild(canvas);
        const ctx = canvas.getContext("2d");
        const couleurs = ["#a99bff", "#6ee7a8", "#ff8f9e", "#7c5cf0", "#3b82f6", COLORS.alerte];
        const morceaux = Array.from({ length: 90 }, () => ({
          x: canvas.width / 2 + (Math.random() - 0.5) * 80, y: canvas.height * 0.55,
          vx: (Math.random() - 0.5) * 12, vy: -Math.random() * 14 - 4,
          taille: 5 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4,
          couleur: couleurs[Math.floor(Math.random() * couleurs.length)]
        }));
        const debut = performance.now();
        const image = (now) => {
          const t = now - debut;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          morceaux.forEach(m => {
            m.vy += 0.35; m.x += m.vx; m.y += m.vy; m.rot += m.vr;
            ctx.save(); ctx.translate(m.x, m.y); ctx.rotate(m.rot);
            ctx.globalAlpha = Math.max(0, 1 - t / 2600);
            ctx.fillStyle = m.couleur; ctx.fillRect(-m.taille / 2, -m.taille / 2, m.taille, m.taille * 0.6);
            ctx.restore();
          });
          if (t < 2600) requestAnimationFrame(image); else canvas.remove();
        };
        requestAnimationFrame(image);
      } catch {}
    }
    // Petit combo "victoire" : confettis + son + vibration.
    export function celebrer() { lancerConfettis(); jouerSon("succes"); haptique([80, 40, 80, 40, 160]); }

    // Débloque un badge automatique (une seule fois). La bulle "Tu as débloqué le badge…" et les
    // confettis sont déclenchés par l'écoute des badges dans SabiApp.
    export function debloquerBadgeAuto(uid, badgeId) {
      if (!uid) return;
      usersRef.child(uid).child("badges").child(badgeId).once("value").then(snap => {
        if (!snap.val()) usersRef.child(uid).child("badges").child(badgeId).set(true);
      }).catch(() => {});
    }

    // Statistiques hebdomadaires publiques (classements Quiz et Focus) : classementHebdo/<semaine>/<uid>.
    // `delta` = { focusMinutes, quizBons, quizTotal, quizParfaits } — ajoutés par transaction.
    export function enregistrerActiviteHebdo(uid, infos, delta) {
      if (!uid) return;
      classementHebdoRef.child(semaineCle()).child(uid).transaction(cur => {
        const c = cur || {};
        return {
          pseudo: infos.pseudo || c.pseudo || "Anonyme",
          filiere: infos.filiere || c.filiere || "",
          annee: infos.annee || c.annee || "",
          focusMinutes: (c.focusMinutes || 0) + (delta.focusMinutes || 0),
          quizBons: (c.quizBons || 0) + (delta.quizBons || 0),
          quizTotal: (c.quizTotal || 0) + (delta.quizTotal || 0),
          quizParfaits: (c.quizParfaits || 0) + (delta.quizParfaits || 0),
          quizJour: c.quizJour || "", quizJourNb: c.quizJourNb || 0
        };
      }).catch(() => {});
    }
    // Anti-abus : seuls les 5 premiers quiz de la journée comptent pour le classement. Renvoie
    // une Promise<boolean> (true = ce quiz compte).
    export function quizCompteCeJour(uid) {
      const ref = classementHebdoRef.child(semaineCle()).child(uid);
      const jour = jourCle();
      return new Promise(resolve => {
        ref.transaction(cur => {
          const c = cur || {};
          const nb = c.quizJour === jour ? (c.quizJourNb || 0) : 0;
          if (nb >= 5) return; // abandonne la transaction : ne compte pas
          return { ...c, quizJour: jour, quizJourNb: nb + 1 };
        }, (err, committed) => resolve(!err && committed), false);
      });
    }
