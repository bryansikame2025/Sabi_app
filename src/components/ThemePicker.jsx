import React from "react";
import { THEMES, ORDRE_THEMES } from "../theme.js";
import { Icon } from "./Icon.js";

// Sélecteur de thèmes pour le menu latéral : une vignette par thème (fond, carte, couleur d'accent).
// Les couleurs de la vignette viennent de THEMES[id].apercu : elles restent identiques quel que soit
// le thème actif, pour que l'utilisateur voie à quoi ressemblera chaque thème avant de le choisir.
export function ThemePicker({ themeId, onChoisir }) {
  return (
    <div role="radiogroup" aria-label="Thèmes" className="grid grid-cols-2 gap-2.5">
      {ORDRE_THEMES.map((id) => {
        const t = THEMES[id], [fond, carte, accent] = t.apercu, actif = id === themeId;
        return (
          <button key={id} type="button" role="radio" aria-checked={actif} onClick={() => onChoisir(id)}
            className="hm-press hm-focus rounded-2xl p-2 flex flex-col gap-2 text-left"
            style={{ border: actif ? "2px solid var(--hm-accent)" : "1px solid var(--hm-border)", background: "var(--hm-surface)" }}>
            <span className="relative block h-14 rounded-xl overflow-hidden" style={{ background: fond }} aria-hidden="true">
              <span className="absolute left-2 right-2 top-2.5 h-5 rounded-md" style={{ background: carte, border: "1px solid rgba(128,128,128,.25)" }} />
              <span className="absolute left-2 top-[34px] h-2 w-9 rounded-full" style={{ background: accent }} />
              <span className="absolute right-2 top-[34px] h-2 w-5 rounded-full" style={{ background: carte, border: "1px solid rgba(128,128,128,.25)" }} />
            </span>
            <span className="flex items-center justify-between gap-1 px-0.5">
              <span className="text-sm font-medium" style={{ color: "var(--hm-text)" }}>{t.label}</span>
              {actif && <Icon name="check-circle" size={16} color="var(--hm-accent)" />}
            </span>
          </button>
        );
      })}
    </div>
  );
}
