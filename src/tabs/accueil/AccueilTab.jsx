import React, { useEffect, useState } from "react";
import { MascotteSabi, RoueDuJour, CarnetModal } from "../../components/widgets.js";
import { calculerNiveau } from "./niveaux";
import { HeroCard } from "./HeroCard";
import { DailyReminder } from "./DailyReminder";
import { QuickActions, Raccourcis, EnVedette } from "./QuickActions";
import { HeroRing } from "./HeroRing";
import { LevelCard } from "./LevelCard";
import { Backdrop } from "./Backdrop";
import { THEMES, themeActuel } from "../../theme.js";
import { SearchAndCta } from "./SearchAndCta";
import { FeedCarousel } from "./FeedCarousel";
import { BadgesRow } from "./BadgesRow";
import { TopContributors } from "./TopContributors";
import { TipCard, VipBanner, RoueEtCarnet } from "./TipAndTools";
import { ExploreGrid } from "./ExploreGrid";

// Même signature que l'ancien AccueilTab : aucune modification nécessaire dans SabiApp.
export function AccueilTab({ cards, epreuves, pseudo, matricule, pointsTotal, profil, vip, pointsLogs, badges, onNavigate, authUid, onGagnerPoints }) {
  const [roueOuverte, setRoueOuverte] = useState(false);
  const [carnetOuvert, setCarnetOuvert] = useState(false);

  // Mascotte : s'inquiète après 3 jours d'absence (dernière visite stockée sur l'appareil).
  const [joursAbsence] = useState(() => {
    try { const d = parseInt(localStorage.getItem("sabi_derniere_visite"), 10); return d ? Math.floor((Date.now() - d) / 86400000) : 0; } catch { return 0; }
  });
  useEffect(() => { try { localStorage.setItem("sabi_derniere_visite", String(Date.now())); } catch {} }, []);
  const message = joursAbsence >= 3
    ? `Tu m'as manqué, ${pseudo} ! Ça fait ${joursAbsence} jours… Une petite session de focus pour reprendre ?`
    : `Salut ${pseudo} ! Tourne la roue du jour, puis lance une session de focus`;

  const niveau = calculerNiveau(pointsTotal);
  const seuil = Date.now() - 7 * 86400000;
  const parPseudo = {};
  (pointsLogs || []).filter((l) => l.timestamp >= seuil).forEach((l) => { parPseudo[l.pseudo] = (parPseudo[l.pseudo] || 0) + l.n; });
  const top = Object.entries(parPseudo).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const contributions = cards.filter((c) => c.auteur === pseudo).length;

  const anneau = (THEMES[themeActuel] || {}).hero === "anneau";   // thèmes à anneau : Aurore, Dune, Savane, Ardoise, Néon
  const debutJour = new Date().setHours(0, 0, 0, 0);
  const gainJour = (pointsLogs || []).filter((l) => l.pseudo === pseudo && l.timestamp >= debutJour && l.n > 0).reduce((a, l) => a + l.n, 0);

  return (
    <div className="hm-stage-wrap relative isolate flex flex-col gap-8 pb-4">
      <Backdrop />
      {anneau ? (
        <>
          <HeroRing pseudo={pseudo} matricule={matricule} niveau={niveau} gainJour={gainJour} />
          <DailyReminder pseudo={pseudo} variante="anneau" />
          <LevelCard niveau={niveau} profil={profil || {}} />
          <EnVedette onNavigate={onNavigate} rond />
          <Raccourcis onNavigate={onNavigate} />
        </>
      ) : (
        <>
          <HeroCard pseudo={pseudo} matricule={matricule} profil={profil || {}} niveau={niveau} pointsTotal={niveau.pts} pointsSemaine={parPseudo[pseudo] || 0} contributions={contributions} />
          <QuickActions onNavigate={onNavigate} />
        </>
      )}
      <SearchAndCta cards={cards} epreuves={epreuves} onNavigate={onNavigate} />
      {!vip && <VipBanner onNavigate={onNavigate} />}
      <FeedCarousel cards={cards} onNavigate={onNavigate} />
      {!anneau && <DailyReminder pseudo={pseudo} />}
      <BadgesRow badges={badges} onNavigate={onNavigate} />
      <TopContributors top={top} onNavigate={onNavigate} />
      <MascotteSabi message={message} humeur={joursAbsence >= 3 ? "triste" : "content"} />
      <TipCard />
      <RoueEtCarnet onRoue={() => setRoueOuverte(true)} onCarnet={() => setCarnetOuvert(true)} />
      <RoueDuJour ouvert={roueOuverte} onFermer={() => setRoueOuverte(false)} authUid={authUid} onGain={onGagnerPoints} />
      <CarnetModal ouvert={carnetOuvert} onFermer={() => setCarnetOuvert(false)} />
      <ExploreGrid onNavigate={onNavigate} />
    </div>
  );
}
export default AccueilTab;
