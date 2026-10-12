// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect } from "react";

    // ========== HOOK useFirebaseList ==========
    // Écoute un nœud Firebase "à plat" (ref/{id}: {...champs}) en temps réel et le
    // transforme en tableau [{id, ...champs}, ...] dans un état React, avec nettoyage
    // automatique de l'écoute au démontage. Remplace ~8 blocs quasi-identiques dans ce
    // fichier — un seul endroit à corriger si jamais il y a un bug, au lieu de huit.
    //
    // Usage : const cards = useFirebaseList(cardsRef, { actif: !!authUser });
    //   - ref : référence Firebase (peut être construite dynamiquement, ex: epreuvesRef.child(x))
    //   - options.actif : n'écoute que si true (évite de lire avant d'être connecté)
    //   - options.limit : ne garde que les N derniers éléments (ex: chat, journal de points)
    //   - options.onError : callback optionnel en cas de PERMISSION_DENIED ou autre erreur
    export function useFirebaseList(ref, options = {}) {
      const { actif = true, limit = null, onError = null } = options;
      const [liste, setListe] = useState([]);

      useEffect(() => {
        if (!ref || !actif) { setListe([]); return; }
        const cible = limit ? ref.limitToLast(limit) : ref;
        const listener = cible.on("value", snapshot => {
          const data = snapshot.val() || {};
          setListe(Object.keys(data).map(id => ({ id, ...data[id] })));
        }, err => {
          if (onError) onError(err);
          else console.error("useFirebaseList:", err.message);
        });
        return () => cible.off("value", listener);
        // eslint-disable-next-line
      }, [ref && ref.toString(), actif, limit]);

      return liste;
    }
