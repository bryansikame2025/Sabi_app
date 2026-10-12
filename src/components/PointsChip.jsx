import React, { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon.js";

// Puce de points persistante pour l'en-tête. Quand `points` augmente, un "+N" se déploie
// DANS la puce pendant 1,8 s (plus de badge flottant en absolu qui déborde de l'écran),
// la puce pulse, puis tout revient au repos. Accessible : annonce via aria-live.
export function PointsChip({ points, onClick }) {
  const prec = useRef(points);
  const [gain, setGain] = useState(0);
  useEffect(() => {
    const delta = (points || 0) - (prec.current || 0);
    prec.current = points;
    if (delta > 0) {
      setGain(delta);
      const t = setTimeout(() => setGain(0), 1800);
      return () => clearTimeout(t);
    }
  }, [points]);
  return (
    <button type="button" onClick={onClick} aria-label={`${points || 0} points`}
      className={"hm-chip hm-focus h-9 pl-2.5 pr-3 rounded-full flex items-center gap-1.5 text-sm font-semibold tabular-nums border border-[color:var(--hm-border)] bg-[color:var(--hm-surface)] text-[color:var(--hm-text)] " + (gain ? "is-pop" : "")}>
      <Icon name="star" size={14} color="var(--hm-accent)" />
      <span>{points || 0}</span>
      <span className={"hm-chip-gain text-[color:var(--hm-ok)] " + (gain ? "is-on" : "")} aria-live="polite">{gain ? "+" + gain : ""}</span>
    </button>
  );
}
