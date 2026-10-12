import React, { useState } from "react";
import { Icon } from "../../components/Icon.js";
import { T } from "./ui";

// Recherche + bouton principal d'action (contribuer). Un seul CTA plein sur tout l'écran.
export function SearchAndCta({ cards, epreuves, onNavigate }) {
  const [q, setQ] = useState("");
  const actif = q.trim().length >= 2;
  const bas = q.toLowerCase();
  const resE = actif ? epreuves.filter((e) => e.matiere.toLowerCase().includes(bas)).slice(0, 4) : [];
  const resC = actif ? cards.filter((c) => c.contenu.toLowerCase().includes(bas)).slice(0, 4) : [];
  return (
    <section className="hm-rise flex flex-col gap-3">
      <label className="sr-only" htmlFor="hm-recherche">Rechercher</label>
      <input
        id="hm-recherche" type="search" value={q} onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une épreuve, une astuce…"
        className={"hm-focus w-full rounded-2xl px-5 py-4 text-base outline-none bg-[color:var(--hm-surface)] border border-[color:var(--hm-border)] placeholder:text-[color:var(--hm-muted)] " + T.text}
      />
      {(resE.length > 0 || resC.length > 0) && (
        <div className="flex flex-col gap-2">
          {resE.map((e) => (
            <button key={"e" + e.id} type="button" onClick={() => onNavigate("epreuves")} className={"hm-card hm-press rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 text-left " + T.text}>
              <Icon name="book" size={14} color="var(--hm-muted)" /> {e.matiere}
            </button>
          ))}
          {resC.map((c) => (
            <button key={"c" + c.id} type="button" onClick={() => onNavigate("actualites")} className={"hm-card hm-press rounded-xl px-4 py-3 text-sm flex items-center gap-2.5 text-left " + T.text}>
              <Icon name="message-circle" size={14} color="var(--hm-muted)" /> <span className="truncate">{c.contenu.slice(0, 60)}…</span>
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => onNavigate("contribuer")}
        className="hm-press hm-focus w-full rounded-2xl py-4 text-base font-semibold flex items-center justify-center gap-2 bg-[color:var(--hm-accent)] text-[color:var(--hm-accent-ink)]">
        <Icon name="edit-2" size={16} /> Poser une question / partager une astuce
      </button>
    </section>
  );
}
