import React from "react";
import { Icon } from "../../components/Icon.js";

// Carte « Niveau suivant » des thèmes à anneau : titre + points, barre dégradée avec curseur et repères
// par quart, puis pastille de l'établissement. Mêmes données que LevelProgress.
export function LevelCard({ niveau, profil }) {
  const { suivant, actuel, pct, pts } = niveau;
  const w = Math.round(pct * 100);
  return (
    <section className="hm-rise hm-glass rounded-3xl p-5 flex flex-col gap-4 border"
      style={{ background: "var(--hm-level-bg)", borderColor: "var(--hm-level-border)", boxShadow: "var(--hm-shadow)" }} aria-label="Niveau suivant">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold uppercase" style={{ color: "var(--hm-muted)" }}>
          {suivant ? <>Niveau suivant : <span style={{ color: "var(--hm-accent-2)" }}>{suivant.label}</span></> : <span style={{ color: "var(--hm-accent-2)" }}>{actuel.label}</span>}
        </p>
        <p className="text-sm font-semibold tabular-nums shrink-0" style={{ color: "var(--hm-muted)" }}>{suivant ? `${pts} / ${suivant.seuil}` : `${pts} pts`}</p>
      </div>
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={w} className="relative h-3 rounded-full" style={{ background: "var(--hm-ring-track)" }}>
        <div className="h-full rounded-full hm-seg-grad" style={{ width: w + "%", background: "linear-gradient(90deg,var(--hm-arc-a),var(--hm-arc-b))" }} />
        {[25, 50, 75].map((p) => <span key={p} className="absolute top-1 bottom-1 w-px" style={{ left: p + "%", background: "var(--hm-border)" }} />)}
        <span className="absolute top-1/2 w-5 h-5 rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: w + "%", background: "var(--hm-arc-b)", boxShadow: "0 0 0 4px rgba(128,128,128,.18)" }} />
      </div>
      {(profil?.filiere || profil?.annee) && (
        <div className="hm-glass-in rounded-2xl p-3 flex items-center gap-3" style={{ background: "var(--hm-surface)", border: "1px solid var(--hm-border)" }}>
          <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--hm-icon-bg)" }}>
            <Icon name="landmark" size={18} color="var(--hm-icon-fg)" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold" style={{ color: "var(--hm-text)" }}>IUT FV Bandjoun</p>
            <p className="text-sm" style={{ color: "var(--hm-muted)" }}>{[profil.filiere, profil.annee].filter(Boolean).join(" • ")}</p>
          </div>
        </div>
      )}
    </section>
  );
}
