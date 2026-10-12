import React, { useState } from "react";
import { Icon } from "../../components/Icon.js";
import { T } from "./ui";

const MESSAGES = (pseudo) => [
  { icone: "sunrise", titre: "Bonjour " + pseudo, texte: "8h, le meilleur moment pour caler ta première session de révision." },
  { icone: "zap", titre: "Petit rappel", texte: "Une heure de révision ce matin vaut deux heures ce soir." },
  { icone: "target", titre: "Objectif du jour", texte: "Choisis UNE matière prioritaire et donne-lui 25 minutes concentrées." },
  { icone: "flame", titre: "Allez " + pseudo + " !", texte: "Chaque petite session compte. Le Coach Réussite t'attend." },
  { icone: "book-open", titre: "Astuce du matin", texte: "Relire ses notes de la veille au réveil double la mémorisation." },
];

// Le rappel devient une ligne discrète, fermable pour la journée : il n'entre plus en concurrence
// avec le score. Son état "fermé" est mémorisé par jour (localStorage, protégé par try/catch).
export function DailyReminder({ pseudo, variante }) {
  const jour = new Date().toISOString().slice(0, 10);
  const [ferme, setFerme] = useState(() => { try { return localStorage.getItem("sabi_rappel_ferme") === jour; } catch { return false; } });
  const ring = variante === "anneau";
  if (ferme) return null;
  const msg = MESSAGES(pseudo)[new Date().getDate() % 5];
  const fermer = () => { setFerme(true); try { localStorage.setItem("sabi_rappel_ferme", jour); } catch {} };
  return (
    <div className="hm-rise hm-card rounded-2xl p-4 flex items-start gap-3" role="note"
      style={ring ? { background: "var(--hm-reminder-bg)", borderColor: "var(--hm-reminder-border)", boxShadow: "var(--hm-reminder-glow), var(--hm-shadow)" } : undefined}>
      <div className={"w-11 h-11 shrink-0 flex items-center justify-center " + (ring ? "rounded-full" : "rounded-xl bg-[color:var(--hm-surface-2)]")}
        style={ring ? { background: "var(--hm-badge-bg)" } : undefined}>
        <Icon name={msg.icone} size={ring ? 18 : 16} color={ring ? "var(--hm-badge-text)" : "var(--hm-accent)"} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={"text-sm font-semibold " + T.text}>{msg.titre}{ring && <span className="inline-block w-1.5 h-1.5 rounded-full ml-2 align-middle" style={{ background: "var(--hm-badge-text)" }} />}</p>
        <p className={"text-sm leading-relaxed mt-0.5 " + T.muted}>{msg.texte}</p>
      </div>
      <button type="button" onClick={fermer} aria-label="Masquer le rappel" className="hm-focus -mr-1 -mt-1 w-9 h-9 shrink-0 rounded-full flex items-center justify-center">
        <Icon name="x" size={16} color="var(--hm-muted)" />
      </button>
    </div>
  );
}
