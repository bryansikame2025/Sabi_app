// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { createRoot } from "react-dom/client";
import "./styles/sabi.css";
import "./styles/accueil.css";
import { Racine } from "./App.js";
import { messaging } from "./firebase.js";
import { notifierBulle } from "./lib/effets.js";

    // Un message peut arriver alors que l'app est déjà au premier plan : dans ce cas le système
    // ne montre pas sa propre notification — on réutilise le système de bulle existant, en natif
    // comme sur le web, pour rester cohérent des deux côtés.
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      document.addEventListener("deviceready", () => {
        const { PushNotifications } = window.Capacitor.Plugins || {};
        if (!PushNotifications) return;
        PushNotifications.addListener("pushNotificationReceived", (notif) => {
          notifierBulle((notif.body || ""), { titre: notif.title || "Sabi", icone: "bell" });
        });
      });
    }
    if (messaging) {
      messaging.onMessage((payload) => {
        const titre = (payload.notification && payload.notification.title) || "Sabi";
        const texte = (payload.notification && payload.notification.body) || "";
        notifierBulle(texte, { titre, icone: "bell" });
      });
    }

    const root = createRoot(document.getElementById("root"));
    root.render(React.createElement(Racine));
