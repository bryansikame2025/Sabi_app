// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { SabiApp } from "./SabiApp.js";
import { EcranConfidentialite } from "./components/Confidentialite.js";

    // Enveloppe l'appli : affiche l'écran de confidentialité par-dessus n'importe quel écran
    // (même déconnecté) et le ferme avec le bouton retour d'Android (voir gerer() dans SabiApp).
    export function Racine() {
      const [ouvert, setOuvert] = useState(false);
      useEffect(() => {
        const ouvrir = () => setOuvert(true);
        const fermer = () => setOuvert(false);
        window.addEventListener("sabi:confidentialite", ouvrir);
        window.addEventListener("sabi:fermer-confidentialite", fermer);
        return () => {
          window.removeEventListener("sabi:confidentialite", ouvrir);
          window.removeEventListener("sabi:fermer-confidentialite", fermer);
        };
      }, []);
      useEffect(() => { window.__sabiConfidentialiteOuverte = ouvert; }, [ouvert]);
      return React.createElement(React.Fragment, null,
        React.createElement(SabiApp),
        ouvert && React.createElement(EcranConfidentialite, { onClose: () => setOuvert(false) })
      );
    }
