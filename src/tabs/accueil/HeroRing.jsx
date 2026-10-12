import React, { useEffect, useState } from "react";
import { Icon } from "../../components/Icon.js";

const R = 96, C = 2 * Math.PI * R, CX = 130;

// Badge « +N points » : posé DANS la carte (absolute top/right à l'intérieur), il ne peut plus déborder.
function PointsBadge({ n }) {
  return (
    <div className="absolute top-4 right-4 z-10" aria-label={`+${n} points aujourd'hui`}>
      <div className="relative w-[76px] h-[76px] rounded-full flex flex-col items-center justify-center leading-none"
        style={{ background: "var(--hm-badge-bg)", color: "var(--hm-badge-text)", boxShadow: "var(--hm-badge-shadow)" }}>
        <span className="text-2xl font-extrabold tabular-nums">+{n}</span>
        <span className="text-xs mt-1 opacity-80">points</span>
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "var(--hm-orb-text)", color: "var(--hm-bg)" }}>
          <Icon name="plus" size={11} strokeWidth={3} />
        </span>
      </div>
    </div>
  );
}

// Héros « anneau » des thèmes Aurore / Dune / Savane / Ardoise / Néon : anneau de niveau, disque central
// « 1.0 /4 Score Actuel », nom + matricule, badge des points gagnés aujourd'hui. Tout est piloté par les
// variables --hm-* du thème (couleurs d'arc, disque, badge) : un seul composant pour 5 looks.
export function HeroRing({ pseudo, matricule, niveau, gainJour }) {
  const cible = Math.min(1, niveau.actuel.niv / 4);
  const [monte, setMonte] = useState(false);          // l'arc se dessine à l'arrivée sur l'écran
  useEffect(() => { const r = requestAnimationFrame(() => setMonte(true)); return () => cancelAnimationFrame(r); }, []);
  const frac = monte ? cible : 0;
  const ang = cible * 2 * Math.PI - Math.PI / 2;
  const ex = CX + R * Math.cos(ang), ey = CX + R * Math.sin(ang);
  return (
    <section className="hm-rise hm-hero-ring relative overflow-hidden rounded-3xl px-5 pt-6 pb-6 flex flex-col items-center gap-3" aria-label="Mon score">
      {gainJour > 0 && <PointsBadge n={gainJour} />}
      <div className="relative" style={{ width: 260, height: 260, maxWidth: "100%" }}>
        <svg viewBox="0 0 260 260" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <linearGradient id="hm-arc" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" style={{ stopColor: "var(--hm-arc-a)" }} /><stop offset="1" style={{ stopColor: "var(--hm-arc-b)" }} />
            </linearGradient>
            <filter id="hm-blur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="5" /></filter>
          </defs>
          <g className="hm-ring-spin">
            <circle cx={CX} cy={CX} r="124" fill="none" strokeWidth="1.5" strokeLinecap="round" style={{ stroke: "var(--hm-ring-outer)", strokeDasharray: "var(--hm-ring-dash)" }} />
            <circle cx={CX} cy={CX} r="113" fill="none" strokeWidth="1" opacity=".55" style={{ stroke: "var(--hm-ring-outer)" }} />
          </g>
          <circle cx={CX} cy={CX} r={R} fill="none" strokeWidth="14" style={{ stroke: "var(--hm-ring-track)" }} />
          <g transform={`rotate(-90 ${CX} ${CX})`}>
            <circle cx={CX} cy={CX} r={R} fill="none" strokeWidth="14" strokeLinecap="round" stroke="url(#hm-arc)" opacity=".55" filter="url(#hm-blur)" strokeDasharray={`${C * frac} ${C}`} />
            <circle cx={CX} cy={CX} r={R} fill="none" strokeWidth="14" strokeLinecap="round" stroke="url(#hm-arc)" strokeDasharray={`${C * frac} ${C}`} style={{ transition: "stroke-dasharray .9s cubic-bezier(.22,1,.36,1)" }} />
          </g>
          <circle cx={ex} cy={ey} r="4.5" style={{ fill: "var(--hm-orb-text)", opacity: monte ? .9 : 0, transition: "opacity .9s" }} />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="rounded-full flex flex-col items-center justify-center text-center" style={{ width: 166, height: 166, background: "var(--hm-orb)", boxShadow: "var(--hm-orb-shadow)", color: "var(--hm-orb-text)" }}>
            <p className="leading-none flex items-baseline justify-center">
              <span className="text-[64px] font-bold tracking-tight tabular-nums">{niveau.actuel.niv.toFixed(1)}</span>
              <span className="text-xl ml-1" style={{ color: "var(--hm-orb-muted)" }}>/4</span>
            </p>
            <p className="text-lg mt-1.5" style={{ color: "var(--hm-orb-muted)" }}>Score Actuel</p>
          </div>
        </div>
      </div>
      <p className="text-lg" style={{ color: "var(--hm-text)" }}>
        <strong className="font-bold">{pseudo}</strong>{matricule && <span style={{ color: "var(--hm-muted)" }}>, MAT: {matricule}</span>}
      </p>
    </section>
  );
}
