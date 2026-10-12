// Logique pure (testable) : paliers de niveau. Mêmes seuils que GriotRing / TierBadge.
export const PALIERS = [
  { niv: 1, label: "Nouveau",         court: "Nouveau", seuil: 0 },
  { niv: 2, label: "Junior de l'IUT", court: "Junior",  seuil: 100 },
  { niv: 3, label: "Ancien de l'IUT", court: "Ancien",  seuil: 1000 },
  { niv: 4, label: "Griot Suprême",   court: "Griot",   seuil: 5000 },
];

export function calculerNiveau(pointsTotal) {
  const pts = Math.max(0, Number(pointsTotal) || 0);
  const idx = PALIERS.reduce((acc, p, i) => (pts >= p.seuil ? i : acc), 0);
  const actuel = PALIERS[idx];
  const suivant = PALIERS[idx + 1] || null;
  const pct = suivant ? Math.min(1, (pts - actuel.seuil) / (suivant.seuil - actuel.seuil)) : 1;
  return { idx, actuel, suivant, pct, restants: suivant ? suivant.seuil - pts : 0, pts };
}
