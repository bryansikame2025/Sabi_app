// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";

 // applique dès le chargement, avant le premier rendu React

    // ===== Préférence Notifications (bulles en haut de l'écran) =====
    export let notificationsActives = true;
    try { notificationsActives = localStorage.getItem("sabi_notifs") !== "off"; } catch {}
export function definirNotificationsActives(valeur) { notificationsActives = valeur; }
