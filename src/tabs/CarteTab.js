// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";
import { Icon } from "../components/Icon.js";
import { CATEGORIES_CARTE } from "../config/constantes.js";
import { COLORS } from "../theme.js";

    // Coordonnées réelles du campus IUT FV Bandjoun (source : OpenStreetMap, way 533568891).
    const IUT_CENTRE = { lat: 5.354369, lng: 10.426265 };

    // Quelques repères de départ, positionnés à partir des distances/directions connues sur OpenStreetMap
    // autour du bâtiment principal. Approximatifs — à corriger par un simple glisser/redépôt une fois sur place.
    const REPERES_CAMPUS_OSM = [
      { nom: "Bâtiment A. Bloc administratif", categorie: "Administration", lat: 5.355364, lng: 10.426265, description: "Position approximative (OSM), à ajuster." },
      { nom: "Salle Travaux Pratiques", categorie: "Salle de cours", lat: 5.354369, lng: 10.425272, description: "Position approximative (OSM), à ajuster." },
      { nom: "Infirmerie", categorie: "Autre", lat: 5.355200, lng: 10.427094, description: "Position approximative (OSM), à ajuster." },
      { nom: "Club 100. Restaurant", categorie: "Restauration", lat: 5.354369, lng: 10.427799, description: "Position approximative (OSM), à ajuster." },
      { nom: "Terrain de football", categorie: "Autre", lat: 5.355456, lng: 10.427350, description: "Position approximative (OSM), à ajuster." },
    ];

    export function CarteTab({ points, onAddPoint, onUpdatePoint, onDeletePoint, isOwner }) {
      const mapDivRef = React.useRef(null);
      const mapObjRef = React.useRef(null);
      const markersRef = React.useRef({}); // id -> L.circleMarker
      const pendingMarkerRef = React.useRef(null);
      const layersRef = React.useRef(null); // { plan, satellite }

      const [leafletReady, setLeafletReady] = useState(!!window.L);
      const [vueSatellite, setVueSatellite] = useState(true);
      const [placementMode, setPlacementMode] = useState(false);
      const [pendingPos, setPendingPos] = useState(null); // { lat, lng }
      const [nom, setNom] = useState("");
      const [categorie, setCategorie] = useState(Object.keys(CATEGORIES_CARTE)[0]);
      const [description, setDescription] = useState("");
      const [selected, setSelected] = useState(null);
      const [editingId, setEditingId] = useState(null); // id du point en cours de modification

      // Leaflet est chargé de façon classique dans le <head> — normalement déjà prêt, mais on patiente
      // un peu au cas où la connexion soit lente.
      useEffect(() => {
        if (leafletReady) return;
        const t = setInterval(() => { if (window.L) { setLeafletReady(true); clearInterval(t); } }, 300);
        const timeout = setTimeout(() => clearInterval(t), 6000);
        return () => { clearInterval(t); clearTimeout(timeout); };
      }, [leafletReady]);

      // Création de la carte une seule fois — tuiles OpenStreetMap (plan) et Esri World Imagery (satellite),
      // toutes deux gratuites et sans clé API.
      useEffect(() => {
        if (!leafletReady || !mapDivRef.current || mapObjRef.current) return;
        const map = window.L.map(mapDivRef.current, { center: [IUT_CENTRE.lat, IUT_CENTRE.lng], zoom: 18 });
        const plan = window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 20, attribution: "© OpenStreetMap"
        });
        const satellite = window.L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
          maxZoom: 20, attribution: "© Esri"
        });
        satellite.addTo(map);
        layersRef.current = { plan, satellite };
        mapObjRef.current = map;
        // Le conteneur est maintenant dimensionné par flexbox (plein écran) plutôt que par un
        // aspect-ratio fixe — Leaflet calcule parfois sa taille avant que le layout final soit prêt.
        setTimeout(() => map.invalidateSize(), 100);
      }, [leafletReady]);

      // Bascule plan / satellite
      useEffect(() => {
        if (!mapObjRef.current || !layersRef.current) return;
        const { plan, satellite } = layersRef.current;
        if (vueSatellite) { mapObjRef.current.removeLayer(plan); satellite.addTo(mapObjRef.current); }
        else { mapObjRef.current.removeLayer(satellite); plan.addTo(mapObjRef.current); }
      }, [vueSatellite]);

      // Active/désactive l'écoute des clics sur la carte selon le mode placement
      useEffect(() => {
        if (!mapObjRef.current) return;
        const handler = e => { setPendingPos({ lat: e.latlng.lat, lng: e.latlng.lng }); setSelected(null); };
        if (placementMode) mapObjRef.current.on("click", handler);
        return () => { if (mapObjRef.current) mapObjRef.current.off("click", handler); };
      }, [placementMode, leafletReady]);

      // Synchronise les marqueurs affichés avec la liste de points (ajout/mise à jour/suppression)
      useEffect(() => {
        if (!mapObjRef.current) return;
        const idsActuels = new Set();
        points.filter(p => p.lat != null && p.lng != null).forEach(p => {
          idsActuels.add(p.id);
          let marker = markersRef.current[p.id];
          if (!marker) {
            marker = window.L.circleMarker([p.lat, p.lng], { radius: 10, color: "#a99bff", weight: 2, fillColor: "#131313", fillOpacity: 1 }).addTo(mapObjRef.current);
            marker.on("click", () => { setSelected(p); setPendingPos(null); setPlacementMode(false); });
            markersRef.current[p.id] = marker;
          } else {
            marker.setLatLng([p.lat, p.lng]);
          }
        });
        Object.keys(markersRef.current).forEach(id => {
          if (!idsActuels.has(id)) { mapObjRef.current.removeLayer(markersRef.current[id]); delete markersRef.current[id]; }
        });
      }, [points, leafletReady]);

      // Marqueur temporaire (rouge) pour le point en train d'être placé/déplacé
      useEffect(() => {
        if (!mapObjRef.current) return;
        if (pendingMarkerRef.current) { mapObjRef.current.removeLayer(pendingMarkerRef.current); pendingMarkerRef.current = null; }
        if (pendingPos) {
          pendingMarkerRef.current = window.L.circleMarker([pendingPos.lat, pendingPos.lng], { radius: 8, color: "#e5e2e1", weight: 2, fillColor: "#ffb4ab", fillOpacity: 1 }).addTo(mapObjRef.current);
          mapObjRef.current.panTo([pendingPos.lat, pendingPos.lng]);
        }
      }, [pendingPos]);

      const pointsSansCoordonnees = points.filter(p => p.lat == null || p.lng == null);
      const nomsExistants = React.useMemo(() => new Set(points.map(p => p.nom.trim().toLowerCase())), [points]);
      const reperesAImporter = REPERES_CAMPUS_OSM.filter(r => !nomsExistants.has(r.nom.trim().toLowerCase()));

      const handleStartEdit = (p) => {
        setEditingId(p.id);
        setNom(p.nom);
        setCategorie(p.categorie);
        setDescription(p.description || "");
        if (p.lat != null && p.lng != null) setPendingPos({ lat: p.lat, lng: p.lng });
        setPlacementMode(p.lat == null); // pas encore de coordonnées réelles → on force le placement au clic
        setSelected(null);
      };

      const handleValidate = () => {
        if (nom.trim().length < 2 || !pendingPos) return;
        const payload = { nom: nom.trim(), categorie, description: description.trim(), lat: pendingPos.lat, lng: pendingPos.lng };
        if (editingId) onUpdatePoint(editingId, payload); else onAddPoint(payload);
        setNom(""); setDescription(""); setPendingPos(null); setPlacementMode(false); setEditingId(null);
      };

      const handleCancelForm = () => {
        setPendingPos(null); setPlacementMode(false); setEditingId(null); setNom(""); setDescription("");
      };

      const importerReperes = () => { reperesAImporter.forEach(r => onAddPoint(r)); };

      if (!leafletReady) {
        return React.createElement("div", { className: "rounded-lg border p-6 flex flex-col items-center gap-2 text-center", style: { borderColor: COLORS.border, backgroundColor: COLORS.surface } },
          React.createElement(Icon, { name: "map", size: 24, color: COLORS.textFaint }),
          React.createElement("p", { className: "text-sm font-semibold", style: { color: COLORS.text } }, "Chargement de la carte..."),
          React.createElement("p", { className: "text-xs", style: { color: COLORS.textFaint } }, "Vérifie ta connexion si ça persiste.")
        );
      }

      const sheetOuvert = !!selected || !!pendingPos;
      const fermerSheet = () => { setSelected(null); handleCancelForm(); };

      return React.createElement("div", { className: "relative w-full h-full" },
        // La carte occupe tout l'espace disponible, bord à bord
        React.createElement("div", { ref: mapDivRef, className: "absolute inset-0 z-0" }),

        // Bandeau haut en overlay (dégradé pour rester lisible sur la carte)
        React.createElement("div", {
          className: "absolute top-0 left-0 right-0 z-[1000] px-5 pt-3 pb-8 pointer-events-none",
          style: { backgroundImage: "linear-gradient(to bottom, rgba(11,15,28,0.88), rgba(11,15,28,0))" }
        },
          React.createElement("div", { className: "flex items-center justify-between gap-2 pointer-events-auto" },
            React.createElement("p", { className: "text-xs flex-1", style: { color: "#fff", textShadow: "0 1px 4px rgba(0,0,0,0.7)" } },
              placementMode ? "Tape sur la carte pour placer ton point ↓" : "Campus IUT FV Bandjoun, tape sur un point"),
            React.createElement("button", {
              onClick: () => setVueSatellite(v => !v),
              className: "flex-shrink-0 text-[10px] font-mono px-2.5 py-1.5 rounded-full",
              style: { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.gold}`, color: COLORS.gold }
            }, vueSatellite ? "Vue plan" : "Vue satellite")
          )
        ),

        // Bouton flottant : ajouter un point (bas gauche — le bas droit est réservé au FAB "Publier")
        !sheetOuvert && React.createElement("button", {
          onClick: () => { setPlacementMode(v => !v); setSelected(null); },
          className: "absolute left-4 bottom-4 z-[1000] px-4 py-3 rounded-full flex items-center gap-2 text-xs font-mono shadow-lg",
          style: placementMode ? { backgroundColor: COLORS.gold, color: COLORS.bg } : { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.text }
        }, React.createElement(Icon, { name: placementMode ? "x" : "map-pin", size: 15 }), placementMode ? "Annuler" : "Ajouter un point"),

        // Bouton flottant : importer les repères connus (propriétaire uniquement)
        isOwner && !sheetOuvert && !placementMode && reperesAImporter.length > 0 && React.createElement("button", {
          onClick: importerReperes,
          className: "absolute left-4 bottom-20 z-[1000] px-3.5 py-2 rounded-full flex items-center gap-1.5 text-[10px] font-mono shadow-lg",
          style: { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.forest}`, color: COLORS.forestText }
        }, React.createElement(Icon, { name: "download", size: 12 }), reperesAImporter.length + " repère(s) à importer"),

        // Feuille (bottom sheet) : détails d'un point sélectionné, ou formulaire de placement
        sheetOuvert && React.createElement("div", {
          className: "absolute left-0 right-0 bottom-0 z-[1100] rounded-t-2xl border-t p-4 pb-6 max-h-[65%] overflow-y-auto flex flex-col gap-3",
          style: { backgroundColor: COLORS.surface, borderColor: COLORS.gold, boxShadow: "0 -8px 24px rgba(0,0,0,0.4)" }
        },
          React.createElement("div", { className: "w-10 h-1 rounded-full self-center", style: { backgroundColor: COLORS.border } }),

          selected && React.createElement(React.Fragment, null,
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement(Icon, { name: CATEGORIES_CARTE[selected.categorie] || "map-pin", size: 17, color: COLORS.gold }),
              React.createElement("p", { className: "text-sm font-semibold flex-1", style: { color: COLORS.text } }, selected.nom),
              React.createElement("button", { onClick: fermerSheet, style: { color: COLORS.textFaint } }, React.createElement(Icon, { name: "x", size: 18 }))
            ),
            React.createElement("p", { className: "text-[10px] font-mono uppercase tracking-wider", style: { color: COLORS.textMuted } }, selected.categorie),
            selected.description && React.createElement("p", { className: "text-sm", style: { color: COLORS.textMuted } }, selected.description),
            isOwner && React.createElement("div", { className: "flex gap-2 mt-1" },
              React.createElement("button", {
                onClick: () => handleStartEdit(selected),
                className: "text-[11px] font-mono px-3 py-1.5 rounded-full",
                style: { backgroundColor: COLORS.border, color: COLORS.text }
              }, React.createElement(Icon, {name:"edit-2", size:12}), " Modifier"),
              React.createElement("button", {
                onClick: () => { if (confirm("Supprimer ce point de la carte ?")) { onDeletePoint(selected.id); setSelected(null); } },
                className: "text-[11px] font-mono px-3 py-1.5 rounded-full",
                style: { color: COLORS.terraText, border: "1px solid rgba(255,180,171,0.4)" }
              }, React.createElement(Icon, {name:"trash", size:12}), " Supprimer")
            )
          ),

          pendingPos && React.createElement(React.Fragment, null,
            React.createElement("div", { className: "flex items-center justify-between" },
              React.createElement("p", { className: "text-xs font-mono uppercase tracking-wider", style: { color: COLORS.gold } }, editingId ? "Modifier ce point" : "Nouveau point"),
              React.createElement("button", { onClick: fermerSheet, style: { color: COLORS.textFaint } }, React.createElement(Icon, { name: "x", size: 18 }))
            ),
            React.createElement("input", { value: nom, onChange: e => setNom(e.target.value), placeholder: "Nom (ex: Amphi B, Photocopie face admin...)", className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
            React.createElement("select", { value: categorie, onChange: e => setCategorie(e.target.value), className: "w-full rounded-lg px-3 py-2 text-sm outline-none border", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } },
              Object.keys(CATEGORIES_CARTE).map(c => React.createElement("option", { key: c }, c))
            ),
            React.createElement("textarea", { value: description, onChange: e => setDescription(e.target.value), placeholder: "Détail utile (optionnel)", rows: 2, className: "w-full rounded-lg px-3 py-2 text-sm outline-none border resize-none", style: { backgroundColor: COLORS.bg, borderColor: COLORS.border, color: COLORS.text } }),
            React.createElement("p", { className: "text-[10px]", style: { color: COLORS.textFaint } }, "Lat/Lng : " + pendingPos.lat.toFixed(6) + ", " + pendingPos.lng.toFixed(6) + ", tape ailleurs sur la carte pour ajuster."),
            React.createElement("div", { className: "flex gap-2" },
              React.createElement("button", { onClick: handleValidate, disabled: nom.trim().length < 2, className: "flex-1 rounded-lg py-2 text-sm font-semibold disabled:opacity-40", style: { backgroundColor: COLORS.gold, color: COLORS.bg } }, editingId ? "Enregistrer les modifications" : "Placer ce point"),
              React.createElement("button", { onClick: handleCancelForm, className: "px-4 rounded-lg py-2 text-sm", style: { color: COLORS.textMuted, border: `1px solid ${COLORS.border}` } }, "Annuler")
            )
          )
        ),

        // Liste des points hérités sans coordonnées GPS (propriétaire) — petit bouton d'accès en overlay haut-droit
        isOwner && pointsSansCoordonnees.length > 0 && !sheetOuvert && React.createElement("button", {
          onClick: () => handleStartEdit(pointsSansCoordonnees[0]),
          className: "absolute right-4 bottom-4 z-[1000] px-3 py-2 rounded-full flex items-center gap-1.5 text-[10px] font-mono shadow-lg",
          style: { backgroundColor: COLORS.surface, border: `1px solid ${COLORS.terra}`, color: COLORS.terraText }
        }, pointsSansCoordonnees.length + " à repositionner")
      );
    }
