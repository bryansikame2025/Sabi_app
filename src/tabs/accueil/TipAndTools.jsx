import React from "react";
import { Icon } from "../../components/Icon.js";
import { BoutonCarnet } from "../../components/widgets.js";
import { T } from "./ui";

const ASTUCES = [
  "Avec le système LMD, une UE en dessous de 10/20 peut quand même être validée si la moyenne pondérée du semestre dépasse 10.",
  "Pense à activer ton badge actif dans la Boutique : il s'affiche à côté de ton pseudo sur toutes tes contributions.",
  "Le classement de la semaine se réinitialise chaque lundi, chaque astuce ou réponse utile te fait gagner des points.",
  "Utilise le Simulateur pour savoir exactement quelle note il te faut à l'examen pour valider ton semestre.",
  "Les cartes marquées [VÉRIFIÉ] viennent d'un profil Sabi VIP, un bon repère pour les astuces fiables.",
  "La Boussole du nouvel arrivant regroupe toutes les démarches administratives dans l'ordre où les faire.",
];

export function TipCard() {
  const astuce = ASTUCES[new Date().getDate() % ASTUCES.length];
  return (
    <section className="hm-rise hm-card rounded-2xl p-5 flex items-start gap-4">
      <div className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center bg-[color:var(--hm-surface-2)]"><Icon name="lightbulb" size={18} color="var(--hm-accent)" /></div>
      <div className="flex-1 min-w-0">
        <p className={"text-sm font-semibold mb-1 " + T.text}>Le saviez-vous ?</p>
        <p className={"text-sm leading-relaxed " + T.muted}>{astuce}</p>
      </div>
      <BoutonCarnet texte={astuce} />
    </section>
  );
}

export function VipBanner({ onNavigate }) {
  return (
    <section className="hm-rise hm-card rounded-2xl p-5 flex items-center gap-4">
      <Icon name="star" size={22} color="var(--hm-accent)" />
      <div className="flex-1 min-w-0">
        <p className={"text-base font-semibold " + T.text}>Passe VIP</p>
        <p className={"text-sm " + T.muted}>Plus de visibilité, tag [VÉRIFIÉ], plus d'impact.</p>
      </div>
      <button type="button" onClick={() => onNavigate("boutique")} className="hm-press hm-focus shrink-0 rounded-full px-4 py-2 text-sm font-semibold bg-[color:var(--hm-accent)] text-[color:var(--hm-accent-ink)]">Découvrir</button>
    </section>
  );
}

export function RoueEtCarnet({ onRoue, onCarnet }) {
  const tuile = (onClick, icon, titre, sous) => (
    <button type="button" onClick={onClick} className="hm-card hm-press hm-focus rounded-2xl p-5 flex flex-col items-center gap-2 text-center">
      <Icon name={icon} size={26} color="var(--hm-accent)" />
      <span className={"text-sm font-semibold " + T.text}>{titre}</span>
      <span className={"text-xs " + T.muted}>{sous}</span>
    </button>
  );
  return (
    <div className="hm-rise grid grid-cols-2 gap-3">
      {tuile(onRoue, "target", "Roue du jour", "1 tour gratuit / jour")}
      {tuile(onCarnet, "book", "Mon carnet", "Tes astuces sauvegardées")}
    </div>
  );
}
