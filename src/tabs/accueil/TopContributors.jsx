import React from "react";
import { Section } from "./Section";
import { T } from "./ui";

const MEDAILLES = ["#E9C46A", "#C0C4CC", "#B08D57"];

export function TopContributors({ top, onNavigate }) {
  if (!top.length) return null;
  return (
    <Section titre="Top contributeurs de la semaine" action="Classement" onAction={() => onNavigate("classement")}>
      <div className="flex flex-col gap-3">
        {top.map(([nom, pts], i) => (
          <div key={nom} className="hm-card rounded-2xl p-4 flex items-center gap-4">
            <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{ backgroundColor: MEDAILLES[i] + "26", color: MEDAILLES[i] }}>{i + 1}</span>
            <p className={"flex-1 text-base font-medium truncate " + T.text}>{nom}</p>
            <p className={"text-base font-semibold tabular-nums " + T.accent}>+{pts}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
