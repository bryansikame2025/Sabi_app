import { useEffect, useRef, useState } from "react";

// Compteur animé (0 -> valeur). Désactivé si l'utilisateur réduit les animations ou en mode économe.
export function useCountUp(cible, duree = 900) {
  const [val, setVal] = useState(cible);
  const depart = useRef(0);
  useEffect(() => {
    const reduit = (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      || document.documentElement.classList.contains("sabi-lite");
    if (reduit) { setVal(cible); depart.current = cible; return; }
    const de = depart.current, t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duree);
      setVal(Math.round(de + (cible - de) * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick); else depart.current = cible;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [cible, duree]);
  return val;
}
