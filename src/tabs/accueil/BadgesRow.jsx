import React from "react";
import { Icon } from "../../components/Icon.js";
import { BADGES } from "../../config/constantes.js";
import { COLORS } from "../../theme.js";
import { Section } from "./Section";
import { T } from "./ui";

export function BadgesRow({ badges, onNavigate }) {
  return (
    <Section titre="Salle des badges" action="Voir tout" onAction={() => onNavigate("boutique")}>
      <div className="grid grid-cols-4 gap-3">
        {BADGES.map((b) => {
          const possede = !!(badges && badges[b.id]);
          const c = COLORS[b.couleur] || COLORS.gold;
          return (
            <div key={b.id} className={"hm-card rounded-2xl p-3 flex flex-col items-center gap-2 text-center " + (possede ? "" : "opacity-60")}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: possede ? c + "26" : "var(--hm-surface-2)" }}>
                <Icon name={b.emoji} size={18} color={possede ? c : "var(--hm-muted)"} />
              </div>
              <p className={"text-xs leading-tight " + (possede ? T.text : T.muted)}>{b.nom}</p>
              {!possede && <span className="sr-only">verrouillé</span>}
            </div>
          );
        })}
      </div>
    </Section>
  );
}
