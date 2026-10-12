// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useEffect } from "react";

    // Modal plein écran pour prévisualiser un PDF via <iframe>
    // Affiche un texte de corrigé (venant de l'IA ou saisi à la main) en le convertissant du
    // Markdown brut (**gras**, ### titres, $$formules$$...) vers un rendu lisible — sans ça,
    // les étudiants voient les symboles bruts et ne peuvent rien déchiffrer.
    export function CorrigeRendu({ texte }) {
      const ref = React.useRef(null);
      useEffect(() => {
        if (!ref.current || !texte) return;

        // On protège d'abord les formules ($$...$$, \[...\], \(...\), $...$) AVANT de passer par
        // Markdown : sinon les soulignés (_) et astérisques à l'intérieur d'une formule LaTeX
        // (ex: u_{n+1}, x^{2}) sont interprétés comme de l'italique/gras par Markdown, ce qui casse
        // la syntaxe et fait apparaître le code brut au lieu de la formule rendue.
        const blocsMath = [];
        const texteProtege = texte.replace(
          /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\)|\$[^\n$]+?\$)/g,
          (match) => { blocsMath.push(match); return "@@MATHBLOCK" + (blocsMath.length - 1) + "@@"; }
        );

        let html = texteProtege;
        try {
          html = window.marked ? marked.parse(texteProtege, { breaks: true }) : texteProtege.replace(/\n/g, "<br>");
        } catch { html = texteProtege.replace(/\n/g, "<br>"); }

        // On restitue les formules originales à la place des jetons, une fois Markdown terminé.
        html = html.replace(/@@MATHBLOCK(\d+)@@/g, (_, i) => blocsMath[Number(i)] || "");

        ref.current.innerHTML = html;
        if (window.renderMathInElement) {
          try {
            renderMathInElement(ref.current, {
              delimiters: [
                { left: "$$", right: "$$", display: true },
                { left: "\\[", right: "\\]", display: true },
                { left: "$", right: "$", display: false },
                { left: "\\(", right: "\\)", display: false }
              ],
              throwOnError: false
            });
          } catch {}
        }
      }, [texte]);
      return React.createElement("div", { ref: ref, className: "corrige-rendu text-sm" });
    }
