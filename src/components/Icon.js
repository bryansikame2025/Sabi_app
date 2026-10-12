// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";

    // Remarque : loadUser/saveUser et loadProfil/saveProfil existaient avant mais
    // n'étaient appelés nulle part (le profil est piloté par Firebase, pas
    // localStorage) — supprimés comme code mort lors de ce refactor.

    // ========== ICÔNES (SVG en ligne, remplacent les emoji) ==========
    // Un seul jeu de tracés (style "trait", 24x24, currentColor) partagé par toute l'app.
    // Utilisation : React.createElement(Icon, { name: "book", size: 18 })
    const ICON_PATHS = {
      sunrise: "M12 2v8 M4.93 10.93l1.41 1.41 M2 18h2 M20 18h2 M19.07 10.93l-1.41 1.41 M22 22H2 M8 6l4-4 4 4 M16 18a4 4 0 0 0-8 0",
      zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
      swords: "M14.5 17.5L3 6V3h3l11.5 11.5 M13 19l6-6 M16 16l4 4 M19 21l2-2 M14.5 6.5L18 3h3v3l-9.5 9.5 M5 14l4 4 M7 17l-3 3 M3 19l2 2",
      headphones: "M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3",
      "bell-off": "M8.7 3A6 6 0 0 1 18 8a21.3 21.3 0 0 0 .6 5 M17 17H3s3-2 3-9a4.67 4.67 0 0 1 .3-1.7 M10.3 21a1.94 1.94 0 0 0 3.4 0 M2 2l20 20",
      lion: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M8.5 10.5h.01 M15.5 10.5h.01 M10.5 14l1.5 1.5 1.5-1.5 M12 12.5V15 M5.5 6.5L8 8.5 M18.5 6.5L16 8.5",
      "triangle-down": "M6 8h12l-6 10z",
      download: "M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2",
      home: "M3 11l9-8 9 8M5 10v10h14V10M9 20v-6h6v6",
      book: "M4 4.5C4 3.7 4.7 3 5.5 3H19v16H5.5c-.8 0-1.5.7-1.5 1.5V4.5zM4 19.5C4 18.7 4.7 18 5.5 18H19",
      "file-text": "M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8l-5-5zM14 3v5h5M8.5 13h7M8.5 16.5h7M8.5 9.5h2",
      map: "M9 3L3.5 5v16L9 19l6 2 5.5-2V3L15 5 9 3zM9 3v16M15 5v16",
      "map-pin": "M20 10.5c0 5.5-8 11.5-8 11.5s-8-6-8-11.5a8 8 0 1 1 16 0z M12 13a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
      pin: "M12 2l1.5 5.5L19 9l-4.5 3.5L16 18l-4-3.5L8 18l1.5-5.5L5 9l5.5-1.5L12 2zM12 13v9",
      "message-circle": "M21 11.5a8.38 8.38 0 0 1-8.9 8.37 8.5 8.5 0 0 1-3.8-.9L3 20l1.03-3.66A8.5 8.5 0 1 1 21 11.5z",
      user: "M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8",
      users: "M9 12a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20c0-3.3 3.1-6 7-6s7 2.7 7 6M17 6.5c1.7.3 3 1.8 3 3.5s-1.3 3.2-3 3.5M23 20c0-2.8-2-5.1-4.7-5.8",
      trophy: "M8 4h8v4a4 4 0 0 1-8 0V4zM8 4H4v2a4 4 0 0 0 4 4M16 4h4v2a4 4 0 0 1-4 4M12 12v4M9 20h6M8.5 20v-2c0-.6.4-1 1-1h5c.6 0 1 .4 1 1v2",
      crown: "M4 8l4 3 4-6 4 6 4-3-2 10H6L4 8zM6 20h12",
      medal: "M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM9 4L6 2 3.5 6.5 7 8M15 4l3-2 2.5 4.5L17 8M9.5 13.5l1.7 3.4a1 1 0 0 0 1.7.1l1.7-3.3",
      gift: "M4 9h16v4H4V9zM6 13v8h12v-8M12 9V21M12 9c-1.5 0-3-1-3-2.8S10.3 3 12 5c1.7-2 4.5-1.6 4.5 1.2S13.5 9 12 9z",
      gem: "M6 3h12l3 5-9 13L3 8l3-5zM3 8h18M9 3l3 5 3-5M12 8l-3 13M12 8l3 13",
      sparkles: "M11 2l1.5 4.5L17 8l-4.5 1.5L11 14l-1.5-4.5L5 8l4.5-1.5L11 2zM18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14z",
      "graduation-cap": "M2 9l10-4 10 4-10 4-10-4zM6 11v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5M22 9v6",
      shield: "M12 2l8 3v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V5l8-3zM9 12l2 2 4-4.5",
      award: "M12 15a5.5 5.5 0 1 0 0-11 5.5 5.5 0 0 0 0 11zM8.5 13.5L6.5 21l5.5-3 5.5 3-2-7.5",
      building: "M5 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17M5 21h14M13 21v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6M8 7h1M8 11h1M8 15h1",
      door: "M5 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16M5 21h11M3 21h16M13 12v.01",
      landmark: "M4 21h16M5 21V10M9 21V10M15 21V10M19 21V10M3 10l9-6 9 6M4 10h16",
      printer: "M7 8V3h10v5M6 8h12a2 2 0 0 1 2 2v6h-4v4H8v-4H4v-6a2 2 0 0 1 2-2zM8 16h8v5H8v-5zM7 11h.01",
      utensils: "M6 2v7a2 2 0 0 0 4 0V2M8 9v13M18 2c-1.7 0-3 2-3 5s1.3 5 3 5v9",
      compass: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM15.5 8.5l-2 5.5-5.5 2 2-5.5 5.5-2z",
      "shopping-bag": "M6 8h12l1 13H5L6 8zM9 8V6a3 3 0 0 1 6 0v2",
      wrench: "M14.5 6.5a4 4 0 0 1-5.4 5.4L4 17l3 3 5.1-5.1a4 4 0 0 1 5.4-5.4L14.5 12.5l-3-3 3-3z",
      lock: "M6 11V7a6 6 0 0 1 12 0v4M5 11h14v9H5v-9zM12 15v2",
      eye: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
      "eye-off": "M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.9 5.2A9.6 9.6 0 0 1 12 5c6.5 0 10 7 10 7a13.2 13.2 0 0 1-3.1 3.9M6.1 6.1C4 7.5 2 9.9 2 9.9s.7 1.5 2.1 3.1c1.6 1.8 3.9 3.5 7 4.4",
      mail: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3.5 6l8.5 7 8.5-7",
      phone: "M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3c0 1-.8 1.8-1.8 1.7C10.9 18.2 5.8 13.1 4.3 5.3 4.2 4.3 5 3.5 6 3.5z",
      "thumbs-up": "M7 11v9H4v-9h3zM7 11l4.5-7.5c.5-.8 1.6-.9 2.3-.3.4.4.6.9.5 1.5L13.5 9H18a2 2 0 0 1 2 2.4l-1.4 6A2 2 0 0 1 16.6 19H9a2 2 0 0 1-2-2v-6z",
      heart: "M12 20s-7.5-4.8-9.5-9.4C1.3 7.4 3 4 6.3 4c1.9 0 3.3 1 4.3 2.4L12 8l1.4-1.6C14.4 5 15.8 4 17.7 4 21 4 22.7 7.4 21.5 10.6 19.5 15.2 12 20 12 20z",
      star: "M12 2l3.1 6.7 7.3.8-5.5 5 1.5 7.2L12 18l-6.4 3.7L7.1 14.5 1.6 9.5l7.3-.8L12 2z",
      "help-circle": "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM9.5 9a2.5 2.5 0 0 1 4.8 1c0 1.7-2.3 2-2.3 3.5M12 17h.01",
      trash: "M4 7h16M9 7V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V7M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M10 11v6M14 11v6",
      "edit-2": "M12 20h9M4 20h1.8L18 7.8a2 2 0 0 0 0-2.8l-1-1a2 2 0 0 0-2.8 0L2 16.2V20h2z",
      "refresh-cw": "M21 12a9 9 0 0 1-15.4 6.4L3 16M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5M3 21v-5h5",
      bot: "M9 3v3M15 3v3M5 8h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1zM9 13v2M15 13v2M9 18h6",
      radio: "M4.9 16.1a8 8 0 0 1 0-11.3M19.1 4.8a8 8 0 0 1 0 11.3M8 12.6a3.5 3.5 0 0 1 0-4.9M16 7.7a3.5 3.5 0 0 1 0 4.9M12 10.2v.01M8 21h8l-2-8.5h-4L8 21z",
      flame: "M12 2c1 3-3 4.5-3 8a3 3 0 0 0 6 0c1 0 2 1.5 2 3.5A5.5 5.5 0 0 1 11.5 22 6 6 0 0 1 6 16c0-4 3-6 3-9.5C9 4.5 10.3 3 12 2z",
      "arrow-right": "M4 12h16M13 5l7 7-7 7",
      "arrow-left": "M20 12H4M11 19l-7-7 7-7",
      "arrow-up": "M12 20V4M5 11l7-7 7 7",
      send: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z",
      x: "M18 6L6 18M6 6l12 12",
      check: "M20 6L9 17l-5-5",
      "check-circle": "M22 11.08V12a10 10 0 1 1-5.93-9.14M22 4L12 14.01l-3-3",
      "check-square": "M9 11l3 3 8-8M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h10",
      square: "M5 5h14v14H5z",
      tag: "M20.6 12.9L12.9 20.6a2 2 0 0 1-2.8 0l-7.1-7.1a2 2 0 0 1 0-2.8L10.7 3H20a1 1 0 0 1 1 1v8.9zM7.5 7.5v.01",
      target: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2z",
      "bar-chart-2": "M18 20L18 10M12 20L12 4M6 20L6 14",
      clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6L12 12L16 14",
      bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
      "trending-up": "M22 7L13.5 15.5 8.5 10.5 2 17M16 7h6v6",
      "trending-down": "M22 17L13.5 8.5 8.5 13.5 2 7M16 17h6v-6",
      calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
      lightbulb: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2.3h6c0-1.1.4-1.8 1-2.3A7 7 0 0 0 12 2z",
      save: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2zM17 21v-8H7v8M7 3v5h8",
      plus: "M12 5v14M5 12h14",
      menu: "M4 6h16 M4 12h16 M4 18h16",
      sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M12 1v2 M12 21v2 M4.2 4.2l1.4 1.4 M18.4 18.4l1.4 1.4 M1 12h2 M21 12h2 M4.2 19.8l1.4-1.4 M18.4 5.6l1.4-1.4",
      moon: "M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z",
      info: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 16v-4 M12 8h.01",
      pause: "M7 4v16M17 4v16",
      play: "M6 3l15 9-15 9V3z",
      "alert-triangle": "M12 2.5L2 21h20L12 2.5zM12 9v5M12 17h.01",
      image: "M3 3h18a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM9 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-4.5-4.5a1.5 1.5 0 0 0-2.1 0L3 21",
      "wifi-off": "M1 1l22 22 M16.72 11.06A10.94 10.94 0 0 1 19 12.55 M5 12.55a10.94 10.94 0 0 1 5.17-2.39 M10.71 5.05A16 16 0 0 1 22.58 9 M1.42 9a15.91 15.91 0 0 1 4.7-2.88 M8.53 16.11a6 6 0 0 1 6.95 0 M12 20h.01",
      "book-open": "M2 5.5C2 4.7 2.7 4 3.5 4H11v16H3.5C2.7 20 2 19.3 2 18.5V5.5zM22 5.5C22 4.7 21.3 4 20.5 4H13v16h7.5c.8 0 1.5-.7 1.5-1.5V5.5zM11 4v16M13 4v16",
      "chevron-down": "M6 9l6 6 6-6",
    };
    export function Icon({ name, size = 16, color = "currentColor", strokeWidth = 2, className, style }) {
      const d = ICON_PATHS[name];
      if (!d) {
        // Filet de sécurité : si le nom ne correspond à aucune icône (ex. un symbole texte comme "∑"),
        // on l'affiche tel quel plutôt que de casser l'affichage.
        return React.createElement("span", { style: { fontSize: size, color, ...style } }, name);
      }
      return React.createElement("svg", {
        width: size, height: size, viewBox: "0 0 24 24", fill: "none",
        stroke: color, strokeWidth: strokeWidth, strokeLinecap: "round", strokeLinejoin: "round",
        className: className, style: { flexShrink: 0, ...style }
      }, d.split(" M").map((seg, i) => React.createElement("path", { key: i, d: (i === 0 ? seg : "M" + seg) })));
    }
