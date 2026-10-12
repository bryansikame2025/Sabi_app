import React from "react";
import { Icon } from "../../components/Icon.js";
import { Section } from "./Section";
import { T } from "./ui";

const LIENS = [
  { id: "mentor", label: "Coach Réussite", icon: "target", desc: "Exclusivité Sabi Pro+" },
  { id: "epreuves", label: "Épreuves", icon: "book", desc: "Anciens sujets et corrigés" },
  { id: "resumes", label: "Résumés de cours", icon: "file-text", desc: "Exclusivité Sabi Pro+" },
  { id: "carte", label: "Carte du campus", icon: "map", desc: "Salles, bâtiments, photocopies" },
  { id: "chat", label: "Fil & Chat", icon: "message-circle", desc: "Astuces, plans, entraide" },
  { id: "boussole", label: "Boussole", icon: "compass", desc: "Parcours du nouvel arrivant" },
  { id: "classement", label: "Classement", icon: "trophy", desc: "Quiz, Focus et défis" },
  { id: "boutique", label: "Boutique & Bounty", icon: "shopping-bag", desc: "Badges, VIP, primes" },
];

export function ExploreGrid({ onNavigate }) {
  return (
    <Section titre="Explorer">
      <div className="grid grid-cols-2 gap-3">
        {LIENS.map((l) => (
          <button key={l.id} type="button" onClick={() => onNavigate(l.id)} className="hm-card hm-press hm-focus rounded-2xl p-5 flex flex-col items-start gap-3 text-left">
            <Icon name={l.icon} size={20} color="var(--hm-accent)" />
            <span>
              <span className={"block text-sm font-semibold " + T.text}>{l.label}</span>
              <span className={"block text-xs mt-1 leading-snug " + T.muted}>{l.desc}</span>
            </span>
          </button>
        ))}
      </div>
    </Section>
  );
}
