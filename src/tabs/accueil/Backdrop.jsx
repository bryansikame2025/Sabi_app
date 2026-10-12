import React from "react";
import { THEMES, themeActuel } from "../../theme.js";

// Fond de l'Accueil. Toujours présent (dégradé/teinte du thème via --hm-stage) ; les trois blobs
// animés n'apparaissent que pour les thèmes qui les demandent (blobs: true, ex. « Verre »).
export function Backdrop() {
  const blobs = !!(THEMES[themeActuel] || {}).blobs;
  return (
    <div className="hm-stage" aria-hidden="true">
      {blobs && (<><span className="hm-blob hm-blob-a" /><span className="hm-blob hm-blob-b" /><span className="hm-blob hm-blob-c" /></>)}
    </div>
  );
}
