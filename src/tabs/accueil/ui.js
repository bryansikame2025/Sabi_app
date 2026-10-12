// Classes Tailwind partagées. Les couleurs passent par les variables --hm-* (accueil.css) :
// sombre = #0F1016 / #181A20 / bordures white-10 / texte secondaire gray-400, clair = surcharge du thème.
export const T = {
  text:   "text-[color:var(--hm-text)]",
  muted:  "text-[color:var(--hm-muted)]",     // ≥ gray-400 : lisible en plein soleil
  accent: "text-[color:var(--hm-accent)]",
  card:   "hm-card rounded-2xl p-5",          // padding généreux : le contenu respire
  row:    "hm-card hm-press hm-focus rounded-2xl p-4 flex items-center gap-4 text-left w-full",
  eyebrow:"text-xs font-semibold uppercase tracking-wider text-[color:var(--hm-muted)]",
  link:   "text-sm font-medium text-[color:var(--hm-accent)] hm-focus rounded-md px-1 py-1 -mr-1",
};
