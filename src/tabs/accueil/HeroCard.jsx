import React from "react";
import { Icon } from "../../components/Icon.js";
import { LevelProgress } from "./LevelProgress";
import { useCountUp } from "./useCountUp";
import { T } from "./ui";

// Carte héros = unique point d'ancrage visuel de l'écran : identité, score en très grand
// (points cumulés), niveau, progression et trois chiffres clés. Rien d'autre ne rivalise avec elle.
export function HeroCard({ pseudo, matricule, profil, niveau, pointsTotal, pointsSemaine, contributions }) {
  const affiche = useCountUp(pointsTotal);
  const initiale = (pseudo || "?").charAt(0).toUpperCase();
  const stats = [
    { label: "Cette semaine", valeur: "+" + pointsSemaine, icon: "trending-up", ok: pointsSemaine > 0 },
    { label: "Posts", valeur: contributions, icon: "message-circle" },
    { label: "Rang", valeur: niveau.actuel.niv + "/4", icon: "award" },
  ];
  return (
    <section className="hm-rise hm-hero relative overflow-hidden rounded-3xl border border-[color:var(--hm-border)] p-6 flex flex-col gap-6" aria-label="Mon profil">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 bg-[color:var(--hm-surface-2)] border border-[color:var(--hm-border)] text-[color:var(--hm-accent)]" aria-hidden="true">
          {initiale}
        </div>
        <div className="min-w-0 flex-1">
          <p className={"text-lg font-semibold truncate " + T.text}>{pseudo}</p>
          {matricule && <p className={"text-sm font-mono tracking-wide truncate " + T.muted}>MAT : {matricule}</p>}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className={T.eyebrow}>Mes points</p>
          <span className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold border border-[color:var(--hm-border)] bg-[color:var(--hm-surface-2)] text-[color:var(--hm-accent)]">
            Niv. {niveau.actuel.niv} · {niveau.actuel.label}
          </span>
        </div>
        <p className="flex items-baseline gap-2 mt-1">
          <span className={"text-6xl font-extrabold tracking-tight tabular-nums leading-none " + T.text} aria-label={pointsTotal + " points"}>{affiche}</span>
          <span className={"text-lg font-medium " + T.muted}>pts</span>
        </p>
      </div>

      <LevelProgress niveau={niveau} />

      <div className="grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl p-3 bg-[color:var(--hm-surface-2)] border border-[color:var(--hm-border)] flex flex-col gap-1.5">
            <Icon name={s.icon} size={16} color={s.ok ? "var(--hm-ok)" : "var(--hm-muted)"} />
            <p className={"text-base font-bold tabular-nums " + (s.ok ? "text-[color:var(--hm-ok)]" : T.text)}>{s.valeur}</p>
            <p className={"text-xs leading-tight " + T.muted}>{s.label}</p>
          </div>
        ))}
      </div>

      {(profil?.filiere || profil?.annee) && (
        <div className="flex items-center gap-3 pt-5 border-t border-[color:var(--hm-border)]">
          <Icon name="landmark" size={16} color="var(--hm-muted)" />
          <p className={"text-sm " + T.muted}>
            <span className={T.text + " font-medium"}>IUT FV Bandjoun</span>
            {" · "}{[profil.filiere, profil.annee].filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
    </section>
  );
}
