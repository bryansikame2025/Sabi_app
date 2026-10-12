import React, { useEffect, useRef, useState } from "react";
import { Icon } from "../../components/Icon.js";
import { Section } from "./Section";
import { timestampDeCarte } from "../../lib/abonnements.js";
import { T } from "./ui";

const LARGEUR = 232; // 220 de carte + 12 d'écart

// Actualités / Tendances. Défilement auto toutes les 4 s, mis en pause dès que l'utilisateur touche le carrousel.
export function FeedCarousel({ cards, onNavigate }) {
  const [vue, setVue] = useState("recentes");
  const [actif, setActif] = useState(0);
  const [pause, setPause] = useState(false);
  const ref = useRef(null);
  const now = Date.now();

  const recentes = [...cards].sort((a, b) => {
    const ea = a.epingleJusqua && a.epingleJusqua > now ? 1 : 0, eb = b.epingleJusqua && b.epingleJusqua > now ? 1 : 0;
    return ea !== eb ? eb - ea : timestampDeCarte(b) - timestampDeCarte(a);
  }).slice(0, 4);
  const tendances = [...cards].sort((a, b) => (b.up - b.down) - (a.up - a.down)).slice(0, 4);
  const liste = vue === "recentes" ? recentes : tendances;

  useEffect(() => {
    if (liste.length <= 1 || pause) return;
    const t = setInterval(() => setActif((i) => {
      const n = (i + 1) % liste.length;
      ref.current && ref.current.scrollTo({ left: n * LARGEUR, behavior: "smooth" });
      return n;
    }), 4000);
    return () => clearInterval(t);
  }, [liste.length, pause]);

  const onglet = (id, label, icon) => (
    <button type="button" onClick={() => { setVue(id); setActif(0); ref.current && ref.current.scrollTo({ left: 0 }); }} aria-pressed={vue === id}
      className={"hm-focus text-sm font-medium px-3.5 py-2 rounded-full flex items-center gap-1.5 " + (vue === id ? "bg-[color:var(--hm-surface-2)] text-[color:var(--hm-text)]" : T.muted)}>
      <Icon name={icon} size={14} /> {label}
    </button>
  );

  return (
    <Section titre={null}>
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-full p-1 border border-[color:var(--hm-border)] bg-[color:var(--hm-surface)]">
          {onglet("recentes", "Actualités", "bell")}{onglet("tendances", "Tendances", "flame")}
        </div>
        <button type="button" onClick={() => onNavigate("actualites")} className={T.link}>Voir tout</button>
      </div>
      {liste.length === 0 ? <p className={"text-sm " + T.muted}>Rien pour l'instant.</p> : (
        <>
          <div ref={ref} onTouchStart={() => setPause(true)} className="hm-no-scrollbar flex gap-3 overflow-x-auto -mx-5 px-5 pb-1" style={{ scrollSnapType: "x mandatory" }}>
            {liste.map((c) => {
              const ep = c.epingleJusqua && c.epingleJusqua > now;
              return (
                <button key={c.id} type="button" onClick={() => onNavigate("actualites")} style={{ width: 220, scrollSnapAlign: "start" }}
                  className="hm-card hm-press hm-focus text-left rounded-2xl overflow-hidden shrink-0 flex flex-col">
                  <div className="h-24 w-full flex items-center justify-center bg-[color:var(--hm-surface-2)] overflow-hidden">
                    {c.imageUrl ? <img src={c.imageUrl} alt="" className="w-full h-full object-cover" /> : <Icon name={ep ? "pin" : "message-circle"} size={26} color="var(--hm-muted)" />}
                  </div>
                  <div className="p-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={"text-xs font-semibold uppercase tracking-wide truncate " + T.accent}>{c.filiere}</span>
                      {ep && <span className={"text-xs shrink-0 " + T.muted}>Épinglée</span>}
                    </div>
                    <p className={"text-sm leading-snug " + T.text}>{c.contenu.slice(0, 70) + (c.contenu.length > 70 ? "…" : "")}</p>
                    <span className={"text-xs " + T.muted}>{vue === "recentes" ? (c.date || "") : "▲ " + (c.up - c.down)}</span>
                  </div>
                </button>
              );
            })}
          </div>
          {liste.length > 1 && (
            <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
              {liste.map((c, i) => <span key={c.id} className="h-1.5 rounded-full transition-all" style={{ width: i === actif ? 16 : 6, backgroundColor: i === actif ? "var(--hm-accent)" : "var(--hm-border)" }} />)}
            </div>
          )}
        </>
      )}
    </Section>
  );
}
