// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import { PRIX_PROPLUS_ANNEE, PRIX_PROPLUS_SEMESTRE, PRIX_PRO_ANNEE, PRIX_PRO_SEMESTRE } from "../config/constantes.js";

    // Calcule la fin du semestre en cours à partir d'une date donnée :
    // - Semestre 1 : septembre à février, coupure fin février
    // - Semestre 2 : mars à juillet, coupure fin juillet
    // Août (entre les deux) compte déjà comme une avance sur le Semestre 1 à venir (coupure
    // fin février) — un abonnement souscrit en août n'est donc jamais perdu ni expiré aussitôt.
    // Un abonnement souscrit à n'importe quel moment expire donc automatiquement
    // à la fin du semestre en cours, jamais après — pas de durée fixe en mois.
    function finDeMois(annee, moisIndex) {
      // Dernier instant (23:59:59.999) du dernier jour du mois donné (moisIndex : 0=janvier)
      return new Date(annee, moisIndex + 1, 0, 23, 59, 59, 999).getTime();
    }
    export function finDuSemestreActuel(timestamp) {
      const d = new Date(timestamp);
      const mois = d.getMonth(); // 0 = janvier ... 11 = décembre
      const annee = d.getFullYear();
      if (mois <= 1) {
        // Janvier ou février : semestre 1 en cours, se termine fin février de cette année
        return finDeMois(annee, 1);
      } else if (mois <= 6) {
        // Mars à juillet : semestre 2 en cours, se termine fin juillet de cette année
        return finDeMois(annee, 6);
      } else {
        // Août (avance sur la rentrée) à décembre : semestre 1 (septembre à février) en cours
        // ou à venir, se termine fin février de l'année suivante
        return finDeMois(annee + 1, 1);
      }
    }
    // Le semestre réellement "en cours" à une date donnée — même découpage que finDuSemestreActuel.
    // Sert à limiter les étudiants (Pro/Pro+) aux épreuves du semestre qu'ils ont effectivement payé :
    // un abonnement souscrit en semestre 1 expire à la fin du semestre 1, donc quand le semestre 2
    // commence sans renouvellement, l'abonnement retombe en "free" (paywall) — et tant qu'il est actif,
    // il ne couvre que le semestre en cours au moment du paiement.
    export function semestreActuel(timestamp) {
      const mois = new Date(timestamp).getMonth();
      return (mois <= 1 || mois >= 7) ? "Semestre 1" : "Semestre 2";
    }

    // "Middleware" côté client : calcule le palier réellement actif d'un utilisateur
    // (jamais périmé silencieusement — un abonnement expiré retombe automatiquement en gratuit)
    export function getAbonnementActif(user) {
      if (!user || !user.abonnement || !user.abonnement.expireLe) return "free";
      if (user.abonnement.expireLe < Date.now()) return "free";
      return user.abonnement.tier || "free"; // "pro" ou "proplus"
    }
    // Horodatage précis d'une actualité, pour trier par vraie fraîcheur plutôt que par "date"
    // (une simple chaîne "AAAA-MM-JJ" sans heure — deux cartes publiées le même jour se
    // départagent sinon au hasard). L'id des cartes ("c-" + Date.now() à la création) porte déjà
    // ce timestamp précis ; on ne retombe sur "date" que pour d'éventuelles cartes plus anciennes
    // dont l'id ne suivrait pas ce format.
    export function timestampDeCarte(c) {
      const brut = typeof c.id === "string" && c.id.startsWith("c-") ? parseInt(c.id.slice(2), 10) : NaN;
      if (Number.isFinite(brut)) return brut;
      return Date.parse(c.date || "") || 0;
    }
    // Fin de l'année en cours pour un abonnement "annuel" (couvre le semestre en cours + le suivant) :
    // on prend la fin du semestre actuel, on avance d'un jour pour entrer dans le semestre suivant,
    // puis on prend sa fin — jamais de durée fixe en mois, toujours calée sur le calendrier académique.
    export function finDeLAnneeActuelle(timestamp) {
      const finSemestre1 = finDuSemestreActuel(timestamp);
      return finDuSemestreActuel(finSemestre1 + 24 * 60 * 60 * 1000);
    }
    // Prix effectif d'un pack (tier: "pro"/"proplus", duree: "semestre"/"annee"), en tenant compte
    // d'une éventuelle promotion active définie par le propriétaire (promos/<tier>/<duree>: {prix, finLe}).
    // Une promo expirée (finLe dépassé) est ignorée automatiquement, jamais besoin de la retirer à la main.
    export function prixEffectif(tier, duree, promos) {
      const base = tier === "proplus"
        ? (duree === "annee" ? PRIX_PROPLUS_ANNEE : PRIX_PROPLUS_SEMESTRE)
        : (duree === "annee" ? PRIX_PRO_ANNEE : PRIX_PRO_SEMESTRE);
      const promo = promos && promos[tier] && promos[tier][duree];
      const promoActive = promo && promo.finLe && promo.finLe > Date.now() && promo.prix > 0;
      return { base, promo: promoActive ? promo.prix : null, finLe: promoActive ? promo.finLe : null, effectif: promoActive ? promo.prix : base };
    }
    export const DUREE_FLASH_MS = 24 * 60 * 60 * 1000; // 24h
    export const DUREE_EPINGLE_MS = 12 * 60 * 60 * 1000;
