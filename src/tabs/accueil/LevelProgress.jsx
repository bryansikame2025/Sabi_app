import React from "react";
import { PALIERS } from "./niveaux";
import { T } from "./ui";

// Barre de progression segmentée : un segment par niveau (4). Les niveaux passés sont pleins,
// le niveau en cours se remplit selon `pct`, les suivants restent vides. On lit en un coup d'œil
// "où j'en suis" et "ce qu'il reste", avec un message d'encouragement concret.
export function LevelProgress({ niveau }) {
  const { idx, actuel, suivant, pct, restants, pts } = niveau;
  const pourcent = Math.round(pct * 100);
  return (
    <div className="flex flex-col gap-3">
      <div
        role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pourcent}
        aria-label={suivant ? `Progression vers ${suivant.label}` : "Niveau maximum"}
        className="flex gap-1.5"
      >
        {PALIERS.map((p, i) => {
          const largeur = i < idx ? 100 : i === idx ? pourcent : 0;
          return (
            <div key={p.niv} className="flex-1 h-2.5 rounded-full overflow-hidden bg-[color:var(--hm-surface-2)]">
              <div className="hm-seg-fill h-full rounded-full" style={{ width: largeur + "%" }} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between gap-3 text-xs">
        <span className={T.muted}>{actuel.court} · {actuel.seuil} pts</span>
        <span className={T.muted}>{suivant ? `${suivant.court} · ${suivant.seuil} pts` : "Niveau max"}</span>
      </div>

      <p className={"text-sm leading-snug " + T.text}>
        {suivant ? (
          <>
            Plus que <strong className={T.accent + " font-bold tabular-nums"}>{restants} pts</strong> pour devenir{" "}
            <strong className="font-semibold">{suivant.label}</strong>
            <span className={T.muted}> · {pourcent}%</span>
          </>
        ) : (
          <>Tu as atteint le rang <strong className={T.accent}>{actuel.label}</strong> avec {pts} pts. Bravo !</>
        )}
      </p>
    </div>
  );
}
