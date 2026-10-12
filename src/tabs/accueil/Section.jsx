import React from "react";
import { T } from "./ui";

// En-tête de section uniforme : titre à gauche, lien d'action optionnel à droite.
export function Section({ titre, action, onAction, children }) {
  return (
    <section className="hm-rise flex flex-col gap-3">
      {(titre || action) && (
        <div className="flex items-center justify-between min-h-[28px]">
          {titre && <h3 className={T.eyebrow}>{titre}</h3>}
          {action && <button type="button" onClick={onAction} className={T.link}>{action}</button>}
        </div>
      )}
      {children}
    </section>
  );
}
