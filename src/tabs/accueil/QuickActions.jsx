import React from "react";
import { Icon } from "../../components/Icon.js";
import { Section } from "./Section";
import { T } from "./ui";

const RACCOURCIS = [
  { id: "classement", label: "Classement", icon: "trophy" },
  { id: "membres", label: "Membres", icon: "users" },
  { id: "carte", label: "Campus", icon: "map" },
  { id: "boussole", label: "Boussole", icon: "compass" },
];
const PHARES = [
  { id: "myscore", label: "MyScore", desc: "Consulte tes notes dès qu'elles tombent", icon: "award" },
  { id: "simulateur", label: "Simulateur de moyenne", desc: "La note qu'il te faut pour valider ton semestre", icon: "calendar" },
  { id: "resumes", label: "Résumés de cours", desc: "Exclusivité Sabi Pro+", icon: "file-text" },
];

export function Raccourcis({ onNavigate }) {
  return (
      <Section>
        <div className="grid grid-cols-4 gap-3">
          {RACCOURCIS.map((r) => (
            <button key={r.id} type="button" onClick={() => onNavigate(r.id)} className="hm-card hm-press hm-focus rounded-2xl py-4 flex flex-col items-center gap-2">
              <Icon name={r.icon} size={20} color="var(--hm-accent)" />
              <span className={"text-[11px] font-medium " + T.muted}>{r.label}</span>
            </button>
          ))}
        </div>
      </Section>
  );
}

// `rond` = thèmes à anneau : icône dans un cercle, bordure/teinte propre à chaque ligne (ex. Ardoise).
export function EnVedette({ onNavigate, rond }) {
  return (
      <Section titre={rond ? null : "En vedette"}>
        <div className="flex flex-col gap-3">
          {PHARES.map((f, i) => (
            <button key={f.id} type="button" onClick={() => onNavigate(f.id)} className={T.row}
              style={rond ? { borderColor: `var(--hm-row-border-${i + 1})` } : undefined}>
              <span className={"w-12 h-12 shrink-0 flex items-center justify-center " + (rond ? "rounded-full" : "rounded-xl")}
                style={{ background: "var(--hm-icon-bg)" }}>
                <Icon name={f.icon} size={20} color={rond ? "var(--hm-icon-fg)" : "var(--hm-accent)"} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={"block text-base font-semibold " + T.text}>{f.label}</span>
                <span className={"block text-sm mt-0.5 " + T.muted}>{f.desc}</span>
              </span>
              <Icon name="arrow-right" size={18} color="var(--hm-muted)" />
            </button>
          ))}
        </div>
      </Section>
  );
}

export function QuickActions({ onNavigate }) {
  return (<><Raccourcis onNavigate={onNavigate} /><EnVedette onNavigate={onNavigate} /></>);
}
