// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).

import React from "react";
import { useState, useEffect, useCallback } from "react";
import { GuideModal } from "./components/Guide.js";
import { Icon } from "./components/Icon.js";
import { LoginScreen, OnboardingCarousel } from "./components/LoginScreen.js";
import { EmpileNotifs, MenuLateral } from "./components/MenuLateral.js";
import { CreditsModal } from "./components/widgets.js";
import { ANNEES, BADGES, COUT_EPINGLE, COUT_FLASH, COUT_VIP, OWNER_EMAILS, SEED_BOUSSOLE, SEED_CARDS } from "./config/constantes.js";
import { abonnementDemandesRef, activerNotificationsPush, auth, bountyRef, boussoleRef, cardsRef, carteRef, chatRef, demandesAnneeRef, demandesFiliereRef, demandesMatriculeRef, desactiverNotificationsPush, epreuvesRef, matriculesRef, myscoreRef, notificationsRef, pointsLogRef, promosRef, resumesRef, supportRef, usersRef, vipDemandesRef } from "./firebase.js";
import { useFirebaseList } from "./hooks/useFirebaseList.js";
import { DUREE_EPINGLE_MS, DUREE_FLASH_MS, getAbonnementActif } from "./lib/abonnements.js";
import { celebrer, notifierBulle } from "./lib/effets.js";
import { loadBoussoleProgress, loadMyVotes, saveBoussoleProgress, saveMyVotes } from "./lib/stockage.js";
import { definirNotificationsActives, notificationsActives } from "./preferences.js";
import { genererCorrigeIA, genererResumeIA } from "./services/ia.js";
import { NETLIFY_BASE_URL, envoyerNotification } from "./services/netlify.js";
import { AccueilTab } from "./tabs/AccueilTab.js";
import { AdminTab } from "./tabs/AdminTab.js";
import { AssistanceTab } from "./tabs/AssistanceTab.js";
import { BoussoleTab } from "./tabs/BoussoleTab.js";
import { BoutiqueTab } from "./tabs/BoutiqueTab.js";
import { CarteTab } from "./tabs/CarteTab.js";
import { ChatTab } from "./tabs/ChatTab.js";
import { ClassementTab } from "./tabs/ClassementTab.js";
import { EpreuvesTab } from "./tabs/EpreuvesTab.js";
import { ContribuerTab, FilTab } from "./tabs/FilTab.js";
import { MembresTab } from "./tabs/MembresTab.js";
import { MentorTab } from "./tabs/MentorTab.js";
import { MyScoreAdminTab } from "./tabs/MyScoreAdminTab.js";
import { MyScoreTab } from "./tabs/MyScoreTab.js";
import { InfosPersoSection, ProfilTab } from "./tabs/ProfilTab.js";
import { PromotionsAdminTab } from "./tabs/PromotionsAdminTab.js";
import { ResumesTab } from "./tabs/ResumesTab.js";
import { SimulateurTab } from "./tabs/SimulateurTab.js";
import { SupportAdminTab } from "./tabs/SupportAdminTab.js";
import { COLORS, appliquerTheme, themeActuel, estThemeClair } from "./theme.js";
import { PointsChip } from "./components/PointsChip.jsx";

    // ========== APP PRINCIPALE ==========
    export function SabiApp() {
      const [authUser, setAuthUser] = useState(null);
      const [authChecked, setAuthChecked] = useState(false);
      const [onboardingVu, setOnboardingVu] = useState(() => {
        try { return localStorage.getItem("sabi_onboarding_vu") === "1"; } catch { return false; }
      });
      // Propriétaire reconnu par email — calculé tôt car spendPoints en a besoin.
      const isOwner = !!(authUser && OWNER_EMAILS.includes(authUser.email));
      const [tab, setTab] = useState(() => {
        // Permet aux raccourcis du manifest (icône maintenue sur l'app) d'ouvrir directement
        // un onglet précis via ?tab=epreuves — liste blanche pour ignorer toute valeur invalide.
        // "contribuer" est inclus pour le partage (share_target) : partager un lien/texte depuis
        // une autre app amène directement sur le formulaire de publication d'actualité.
        const TABS_VALIDES = ["accueil", "boussole", "epreuves", "resumes", "carte", "actualites", "chat", "mentor", "contribuer", "myscoreAdmin"];
        const params = new URLSearchParams(window.location.search);
        const demande = params.get("tab");
        // web+sabi://... (protocol_handlers) arrive en ?lien=... sans ?tab= : on route vers
        // Contribuer, comme un lien partagé classique (voir partagePrefill juste en dessous).
        if (!demande && params.get("lien")) return "contribuer";
        return TABS_VALIDES.includes(demande) ? demande : "accueil";
      });
      // Expose l'onglet actif au script de filigrane (hors React, en bas de page) : le
      // filigrane se densifie automatiquement sur l'onglet Épreuves, contenu le plus
      // sensible aux fuites (voir bloc anti-capture en fin de fichier).
      useEffect(() => {
        window.__sabiTabActif = tab;
        if (window.__sabiActualiserFiligrane) window.__sabiActualiserFiligrane();
      }, [tab]);
      // Contenu reçu via le partage natif du téléphone (share_target dans manifest.json) —
      // ex: partager un texte ou un lien depuis WhatsApp "vers" Sabi pré-remplit l'actualité.
      // "lien" (sans suffixe) vient plutôt d'un lien web+sabi:// ouvert via protocol_handlers.
      const [partagePrefill] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const titre = params.get("titre_partage") || "";
        const texte = params.get("texte_partage") || "";
        const lien = params.get("lien_partage") || params.get("lien") || "";
        return [titre, texte, lien].filter(Boolean).join("\n").trim() || null;
      });
      // Image reçue via le partage natif (voir sw.js : le service worker intercepte le POST
      // du partage et dépose l'image dans un cache temporaire, le temps que cet effet la relise).
      const [partageImagePrefill, setPartageImagePrefill] = useState(null);
      useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("partage_image") !== "1" || !("caches" in window)) return;
        caches.open("sabi-share-target").then(cache =>
          cache.match("/partage-image-en-attente").then(res => {
            if (!res) return;
            return res.blob().then(blob => {
              setPartageImagePrefill(new File([blob], "partage.jpg", { type: blob.type || "image/jpeg" }));
              cache.delete("/partage-image-en-attente");
            });
          })
        ).catch(() => {});
      }, []);
      // Fichiers ouverts depuis l'OS ("Ouvrir avec Sabi" sur un PDF/photo de relevé de notes —
      // voir file_handlers dans manifest.json). Redirige vers MyScoreAdminTab, seul endroit de
      // l'app qui consomme déjà ce type de fichier (import de feuilles de notes par lot).
      const [fichiersLances, setFichiersLances] = useState(null);
      useEffect(() => {
        if (!("launchQueue" in window)) return; // API récente, absente sur navigateurs plus anciens
        window.launchQueue.setConsumer((launchParams) => {
          if (!launchParams.files || launchParams.files.length === 0) return;
          Promise.all(launchParams.files.map(handle => handle.getFile())).then(setFichiersLances);
        });
      }, []);
      // Bannière d'installation "faite maison" : Chrome ne propose plus de banderole
      // automatique depuis plusieurs années — il se contente de rendre l'option disponible dans
      // son menu ⋮, sauf si l'app capture l'événement "beforeinstallprompt" et affiche elle-même
      // une invite. C'est ce qu'on fait ici, pour que ce soit visible sans creuser dans le menu.
      const [promptInstallation, setPromptInstallation] = useState(null);
      const [installBanniereFermee, setInstallBanniereFermee] = useState(() => {
        try { return localStorage.getItem("sabi_install_banniere_fermee") === "1"; } catch { return false; }
      });
      useEffect(() => {
        const surPropose = (e) => { e.preventDefault(); setPromptInstallation(e); };
        const surInstalle = () => setPromptInstallation(null);
        window.addEventListener("beforeinstallprompt", surPropose);
        window.addEventListener("appinstalled", surInstalle);
        return () => {
          window.removeEventListener("beforeinstallprompt", surPropose);
          window.removeEventListener("appinstalled", surInstalle);
        };
      }, []);
      // Retient l'onglet actif avant d'ouvrir Profil, pour que le bouton retour du profil
      // ramène exactement là où l'utilisateur était (au lieu d'un onglet fixe).
      const [tabAvantProfil, setTabAvantProfil] = useState("accueil");
      // Menu hamburger (Paramètres / Assistance / Crédits) + son état thème/notifications.
      const [menuOuvert, setMenuOuvert] = useState(false);
      const [creditsOuverts, setCreditsOuverts] = useState(false);
      const [guideOuvert, setGuideOuvert] = useState(false);
      const [themeMode, setThemeMode] = useState(themeActuel);
      const [notifsActivesState, setNotifsActivesState] = useState(notificationsActives);
      // themeMode contient maintenant l'identifiant du thème (sombre, clair, verre, aurore, dune, savane, ardoise, neon).
      const handleChoisirTheme = useCallback((id) => {
        appliquerTheme(id);
        setThemeMode(id); // force le re-rendu de tout l'arbre pour prendre en compte COLORS muté
      }, []);
      // Interrupteur « Mode clair » : bascule entre les thèmes Sombre et Clair d'origine.
      const handleToggleTheme = useCallback(() => {
        handleChoisirTheme(estThemeClair(themeMode) ? "sombre" : "clair");
      }, [themeMode, handleChoisirTheme]);
      // Un seul interrupteur pour l'utilisateur ("Notifications" dans le menu) pilote à la fois
      // les bulles internes (notifierBulle, actives dès que l'onglet est ouvert) et les pushs
      // FCM (reçus même app fermée) — plus simple à comprendre qu'avoir deux réglages séparés.
      const handleToggleNotifs = useCallback((actif) => {
        definirNotificationsActives(actif);
        try { localStorage.setItem("sabi_notifs", actif ? "on" : "off"); } catch {}
        setNotifsActivesState(actif);
        if (!authUser) return;
        if (actif) {
          activerNotificationsPush(authUser.uid).then((res) => {
            if (!res.ok && res.raison === "refuse") {
              notifierBulle("Les notifications ont été bloquées dans les réglages du navigateur.", { titre: "Sabi", icone: "bell" });
            }
          });
        } else {
          desactiverNotificationsPush(authUser.uid);
        }
      }, [authUser]);
      // Pour les comptes déjà connectés où "Notifications" est resté sur ON par défaut (valeur
      // initiale) sans que l'utilisateur n'ait retouché l'interrupteur : on tente une activation
      // silencieuse une fois la session ouverte, plutôt que d'attendre qu'il bascule le toggle
      // off/on pour obtenir son premier token. Sans effet si la permission a déjà été tranchée
      // (déjà accordée -> token repris, déjà refusée -> le navigateur répond immédiatement sans re-prompt).
      useEffect(() => {
        if (authUser && notificationsActives) activerNotificationsPush(authUser.uid);
      }, [!!authUser]);
      const cards = useFirebaseList(cardsRef, { actif: !!authUser, onError: () => setConnexionOk(false) });
      const [myVotes, setMyVotes] = useState({});
      const boussoleSteps = useFirebaseList(boussoleRef, { actif: !!authUser });
      const [boussoleProgress, setBoussoleProgress] = useState({});
      const cartePoints = useFirebaseList(carteRef, { actif: !!authUser });
      const chatMessagesBrut = useFirebaseList(chatRef, { actif: !!authUser, limit: 100 });
      // Fil privé Assistance de l'étudiant connecté (support/{uid}) — non chargé pour le propriétaire,
      // qui utilise sa propre écoute complète dans SupportAdminTab.
      const supportMessages = useFirebaseList(authUser ? supportRef.child(authUser.uid) : null, { actif: !!authUser && !isOwner });
      const chatMessages = React.useMemo(() => [...chatMessagesBrut].sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0)), [chatMessagesBrut]);
      const dernierMsgIdRef = React.useRef(null);
      const [epreuves, setEpreuves] = useState([]);
      const resumes = useFirebaseList(resumesRef, { actif: !!authUser });
      const pointsLogs = useFirebaseList(pointsLogRef, { actif: !!authUser, limit: 500 });
      const [badges, setBadges] = useState({});
      const [badgeActif, setBadgeActif] = useState(null);
      const [vip, setVip] = useState(false);
      const [abonnement, setAbonnement] = useState("free"); // "free" | "pro" | "proplus"
      const [isAdmin, setIsAdmin] = useState(false);
      const isAdminEffectif = isOwner || isAdmin;
      // Accès aux épreuves = admin/propriétaire OU abonnement pro/pro+ actif
      const accesEpreuves = isAdminEffectif || abonnement === "pro" || abonnement === "proplus";
      const [profilCharge, setProfilCharge] = useState(false);
      const bounties = useFirebaseList(bountyRef, { actif: !!authUser });
      const [promos, setPromos] = useState({});
      useEffect(() => {
        if (!authUser) { setPromos({}); return; }
        const listener = promosRef.on("value", snap => setPromos(snap.val() || {}));
        return () => promosRef.off("value", listener);
      }, [!!authUser]);
      const [membresList, setMembresList] = useState([]);
      const [profil, setProfilState] = useState({ annee: "", filiere: "" });
      const [pseudo, setPseudo] = useState("");

      // Bulle façon WhatsApp sur les nouveaux messages, uniquement quand on ne regarde pas déjà le chat
      useEffect(() => {
        if (chatMessages.length === 0) return;
        const dernier = chatMessages[chatMessages.length - 1];
        const estNouveau = dernierMsgIdRef.current !== null && dernier.id !== dernierMsgIdRef.current;
        const regardeLeChat = tab === "chat";
        if (estNouveau && dernier.pseudo !== pseudo && !regardeLeChat) {
          notifierBulle(dernier.texte, { titre: dernier.pseudo, icone: "message-circle" });
        }
        dernierMsgIdRef.current = dernier.id;
      }, [chatMessages, tab, pseudo]);
      const [whatsapp, setWhatsapp] = useState("");
      const [matricule, setMatriculeState] = useState("");
      const [points, setPoints] = useState(0);
      const pointsRef = React.useRef(0);
      const badgesRef = React.useRef({});
      const abonnementRef = React.useRef(null);
      const myscoreCountRef = React.useRef(null); // null tant qu'on n'a pas encore reçu l'état initial
      const profilChargeRef = React.useRef(false);
      const [pointsTotal, setPointsTotal] = useState(0);
      const [loading, setLoading] = useState(true);
      const [connexionOk, setConnexionOk] = useState(true);

      // Écoute l'état de connexion — redirige vers l'écran de connexion si pas connecté
      useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(u => {
          setAuthUser(u);
          setAuthChecked(true);
        });
        return unsubscribe;
      }, []);

      // Connexion Firebase temps réel + chargement du profil (une fois connecté)
      useEffect(() => {
        if (!authUser) return;

        setMyVotes(loadMyVotes());
        setBoussoleProgress(loadBoussoleProgress());

        // Profil (pseudo, année, filière, points) — stocké sur le compte, synchronisé entre appareils
        const userRef = usersRef.child(authUser.uid);
        const userListener = userRef.on("value", snapshot => {
          const data = snapshot.val();
          if (data) {
            setPseudo(data.pseudo || "");
            setWhatsapp(data.whatsapp || "");
            setMatriculeState(data.matricule || "");
            setPoints(data.points || 0);
            setPointsTotal(data.pointsTotal || 0);
            setProfilState({ annee: data.annee || "", filiere: data.filiere || "" });
            setBadges(data.badges || {});
            setBadgeActif(data.badgeActif || null);
            setVip(!!data.vip);
            setIsAdmin(!!data.admin);
            setAbonnement(getAbonnementActif(data));
            setProfilCharge(true);

            // Bulles de notification sur les changements réels — jamais au tout premier
            // chargement (on ne veut pas "féliciter" quelqu'un pour son solde déjà existant).
            if (profilChargeRef.current) {
              const nouveauxPoints = data.points || 0;
              if (nouveauxPoints > pointsRef.current) {
                notifierBulle("+" + (nouveauxPoints - pointsRef.current) + " points gagnés !", { titre: "Sabi", icone: "award" });
              }
              const nouveauxBadges = data.badges || {};
              const badgeGagne = Object.keys(nouveauxBadges).find(id => nouveauxBadges[id] && !badgesRef.current[id]);
              if (badgeGagne) {
                const b = BADGES.find(x => x.id === badgeGagne);
                notifierBulle("Tu as débloqué le badge " + (b ? b.nom : badgeGagne) + " !", { titre: "Sabi", icone: "star" });
                celebrer();
              }
              // Passage de niveau (Nouveau → Junior → Ancien → Griot Suprême) : bulle + confettis
              const paliers = ["Nouveau", "Junior de l'IUT", "Ancien de l'IUT", "Griot Suprême"];
              const indexPalier = (pt) => pt >= 5000 ? 3 : pt >= 1000 ? 2 : pt >= 100 ? 1 : 0;
              const nouveauPalier = indexPalier(data.pointsTotal || 0);
              if (typeof window.__sabiPalier === "number" && nouveauPalier > window.__sabiPalier) {
                notifierBulle("Niveau supérieur : " + paliers[nouveauPalier] + " !", { titre: "Sabi", icone: "trophy" });
                celebrer();
              }
              const nouvelAbo = getAbonnementActif(data);
              if (nouvelAbo && !abonnementRef.current) {
                notifierBulle("Ton abonnement " + (nouvelAbo === "proplus" ? "Sabi Pro+" : "Sabi Pro") + " est actif !", { titre: "Sabi", icone: "crown" });
              }
            }
            window.__sabiPalier = (data.pointsTotal || 0) >= 5000 ? 3 : (data.pointsTotal || 0) >= 1000 ? 2 : (data.pointsTotal || 0) >= 100 ? 1 : 0;
            pointsRef.current = data.points || 0;
            badgesRef.current = data.badges || {};
            abonnementRef.current = getAbonnementActif(data);
            profilChargeRef.current = true;
          }
          setLoading(false);
        }, () => {
          setConnexionOk(false);
          setLoading(false);
        });

        // Bulle façon WhatsApp dès qu'une nouvelle note MyScore est publiée pour ce compte —
        // écoute globale (fonctionne même si l'étudiant n'a pas l'écran MyScore ouvert).
        const myscoreListener = myscoreRef.child(authUser.uid).on("value", snap => {
          const val = snap.val() || {};
          const entrees = Object.values(val);
          const officielles = entrees.filter(e => e.source !== "simulateur");
          if (myscoreCountRef.current !== null && officielles.length > myscoreCountRef.current) {
            // Notifie chaque nouvelle note individuellement (matière + note), le cas le plus
            // fréquent étant l'ajout d'une seule note à la fois.
            const nouvelles = entrees
              .filter(e => e.source !== "simulateur")
              .sort((a, b) => (b.publieLe || 0) - (a.publieLe || 0))
              .slice(0, officielles.length - myscoreCountRef.current);
            nouvelles.reverse().forEach(e => {
              notifierBulle((e.matiere || "Une matière") + " : " + e.note + "/20", { titre: "Nouvelle note MyScore", icone: "award" });
            });
          }
          myscoreCountRef.current = officielles.length;
        });

        // Vérifie si des cartes existent déjà, sinon initialise avec les cartes d'exemple (une seule fois)
        cardsRef.once("value").then(snapshot => {
          if (!snapshot.exists()) {
            cardsRef.set(SEED_CARDS);
          }
        });
        boussoleRef.once("value").then(snapshot => {
          if (!snapshot.exists()) {
            boussoleRef.set(SEED_BOUSSOLE);
          }
        });

        // cards / boussoleSteps / cartePoints / chatMessages / resumes / pointsLogs / bounties
        // sont désormais chargés directement via useFirebaseList (voir déclarations plus haut) —
        // plus besoin de gérer manuellement les listeners .on()/.off() pour ces 7 collections ici.

        return () => {
          userRef.off("value", userListener);
          myscoreRef.child(authUser.uid).off("value", myscoreListener);
        };
      }, [authUser]);

      // Épreuves — cloisonnées par année + filière (structure epreuves/$annee/$filiere/$id,
      // exactement ce qu'attendent les règles Firebase publiées).
      // - Propriétaire : aucune restriction, toutes années et toutes filières.
      // - Admin (non-propriétaire) : toutes les années, mais UNIQUEMENT sa propre filière.
      // - Compte Pro/Pro+ (non-admin) : uniquement sa propre année + sa propre filière.
      // - Compte gratuit : rien (paywall côté écran).
      useEffect(() => {
        if (!authUser || !profilCharge) return;
        if (!accesEpreuves) { setEpreuves([]); return; }

        if (isOwner) {
          const listenerOwner = epreuvesRef.on("value", snapshot => {
            const data = snapshot.val() || {};
            const list = [];
            Object.keys(data).forEach(annee => {
              if (data[annee] && data[annee].matiere) return; // reste d'ancien format non migré, ignoré
              Object.keys(data[annee] || {}).forEach(filiere => {
                if (typeof data[annee][filiere] !== "object") return;
                Object.keys(data[annee][filiere] || {}).forEach(id => {
                  list.push({ id, annee, filiere, ...data[annee][filiere][id] });
                });
              });
            });
            setEpreuves(list);
          }, err => console.error("Épreuves (propriétaire) :", err.message));
          return () => epreuvesRef.off("value", listenerOwner);
        } else if (isAdmin) {
          // Un listener par année, tous scopés sur la filière de l'admin — fusionnés en une seule liste.
          const parAnnee = {};
          let monte = true;
          const listeners = ANNEES.map(annee => {
            const ref = epreuvesRef.child(annee).child(profil.filiere);
            const cb = snapshot => {
              const data = snapshot.val() || {};
              parAnnee[annee] = Object.keys(data).map(id => ({ id, annee, filiere: profil.filiere, ...data[id] }));
              if (monte) setEpreuves(Object.keys(parAnnee).flatMap(a => parAnnee[a]));
            };
            ref.on("value", cb, err => console.error("Épreuves (admin) :", err.message));
            return { ref, cb };
          });
          return () => { monte = false; listeners.forEach(({ ref, cb }) => ref.off("value", cb)); };
        } else {
          const scopedRef = epreuvesRef.child(profil.annee).child(profil.filiere);
          const listenerEtudiant = scopedRef.on("value", snapshot => {
            const data = snapshot.val() || {};
            const list = Object.keys(data).map(id => ({ id, annee: profil.annee, filiere: profil.filiere, ...data[id] }));
            setEpreuves(list);
          }, err => console.error("Épreuves :", err.message));
          return () => scopedRef.off("value", listenerEtudiant);
        }
      }, [authUser, profilCharge, isOwner, isAdmin, accesEpreuves, profil.annee, profil.filiere]);

      // Toast léger pour les retours visuels immédiats (points gagnés, confirmations rapides...).
      // Un seul toast à la fois : un nouveau remplace l'ancien plutôt que de s'empiler.
      const [toast, setToast] = useState(null); // { message, leaving }
      const toastTimerRef = React.useRef(null);
      const showToast = useCallback((message) => {
        if (toastTimerRef.current) { clearTimeout(toastTimerRef.current.hide); clearTimeout(toastTimerRef.current.clear); }
        setToast({ message, leaving: false });
        const hide = setTimeout(() => setToast(t => t ? { ...t, leaving: true } : t), 1800);
        const clear = setTimeout(() => setToast(null), 2050);
        toastTimerRef.current = { hide, clear };
      }, []);

      // Ajoute des points sur le compte Firebase (transaction = jamais de conflit même avec plusieurs actions rapides)
      // + enregistre l'événement pour le classement hebdomadaire
      const addPoints = useCallback((n) => {
        if (!authUser) return;
        usersRef.child(authUser.uid).child("points").transaction(current => (current || 0) + n);
        usersRef.child(authUser.uid).child("pointsTotal").transaction(current => (current || 0) + n);
        pointsLogRef.push({ uid: authUser.uid, pseudo, filiere: profil.filiere, n, timestamp: Date.now() });
        // Plus de toast « +N points » : la puce de points de l'en-tête (PointsChip) affiche le gain elle-même.
      }, [authUser, pseudo, profil.filiere, showToast]);

      // Bonus quotidien de 5 points — une fois par jour, à la connexion
      useEffect(() => {
        if (!authUser) return;
        const aujourdhui = new Date().toISOString().slice(0, 10);
        usersRef.child(authUser.uid).child("dernierBonus").once("value").then(snap => {
          if (snap.val() !== aujourdhui) {
            addPoints(5);
            usersRef.child(authUser.uid).child("dernierBonus").set(aujourdhui);
          }
        });
      }, [authUser]);

      // Annuaire public des membres — chargé seulement quand l'onglet "Membres" est ouvert,
      // visible par tous les utilisateurs (pas réservé au propriétaire)
      useEffect(() => {
        if (tab !== "membres" || !authUser) return;
        const listener = usersRef.on("value", snapshot => {
          const data = snapshot.val() || {};
          // Projection : whatsapp n'est inclus que pour owner/admin — pour tout le monde
          // d'autre, le champ n'atteint jamais le navigateur (pas juste caché à l'écran).
          setMembresList(Object.entries(data).map(([uid, u]) => ({
            uid,
            pseudo: u.pseudo,
            annee: u.annee,
            filiere: u.filiere,
            admin: !!u.admin,
            badgeActif: u.badgeActif,
            pointsTotal: u.pointsTotal,
            abonnement: u.abonnement,
            ...(isAdminEffectif ? { whatsapp: u.whatsapp } : {}),
          })));
        });
        return () => usersRef.off("value", listener);
      }, [tab, authUser, isAdminEffectif]);

      // Dépense sécurisée — la transaction vérifie le solde réel côté serveur avant de déduire,
      // impossible de se retrouver en négatif même avec des clics rapides.
      // Le propriétaire a des points illimités : aucune déduction, succès immédiat.
      const spendPoints = useCallback((cost, onSuccess) => {
        if (!authUser) return;
        if (isOwner) { onSuccess(); return; }
        usersRef.child(authUser.uid).child("points").transaction(current => {
          if ((current || 0) < cost) return; // abandonne la transaction si solde insuffisant
          return (current || 0) - cost;
        }).then(result => {
          if (result.committed) onSuccess();
        });
      }, [authUser, isOwner]);

      const handleVote = useCallback((id, direction) => {
        const current = loadMyVotes();
        const previous = current[id];
        if (previous === direction) return; // déjà voté dans ce sens, rien à faire

        // Sauvegarde locale privée du sens du vote
        const updatedVotes = { ...current, [id]: direction };
        saveMyVotes(updatedVotes);
        setMyVotes(updatedVotes);

        // Annule l'ancien vote s'il y en avait un, puis applique le nouveau
        if (previous) {
          const oldField = previous === "up" ? "up" : "down";
          cardsRef.child(id).child(oldField).transaction(c => Math.max(0, (c || 0) - 1));
        }
        const newField = direction === "up" ? "up" : "down";
        cardsRef.child(id).child(newField).transaction(c => (c || 0) + 1);

        if (!previous) addPoints(1); // points seulement pour un premier vote sur cette carte
      }, [addPoints]);

      // Réservé au propriétaire : supprime définitivement une carte du Fil
      const handleDeleteCard = useCallback((id) => {
        if (!isOwner) return;
        cardsRef.child(id).remove();
      }, [isOwner]);

      // Réservé au propriétaire : vide entièrement le Fil (Actualités) — utile pour
      // nettoyer les anciennes cartes de test.
      const handleClearAllCards = useCallback(() => {
        if (!isOwner) return;
        cardsRef.remove();
      }, [isOwner]);

      const handleContribute = useCallback(({ filiere, contenu, verifie, flash, imageUrl }) => {
        const newCardId = "c-" + Date.now();
        const publier = (flashJusqua) => {
          // auteurUid est exigé par la règle Firebase du nœud "cards" (elle vérifie que le
          // créateur d'une carte est bien l'utilisateur connecté) — son absence ici faisait
          // échouer TOUTE la publication avec "PERMISSION_DENIED", pas seulement ce champ.
          const newCard = { auteurUid: authUser.uid, filiere, contenu, verifie: !!verifie, auteur: pseudo, badge: badgeActif, up: 1, down: 0, date: new Date().toISOString().slice(0, 10) };
          if (imageUrl) newCard.imageUrl = imageUrl;
          if (flashJusqua) newCard.flashJusqua = flashJusqua;
          return cardsRef.child(newCardId).set(newCard).then(() => {
            const updatedVotes = { ...loadMyVotes(), [newCardId]: "up" };
            saveMyVotes(updatedVotes);
            setMyVotes(updatedVotes);
            addPoints(5);
          }).catch(err => {
            // Sans ce .catch, un échec d'écriture (règles Firebase, quota dépassé, coupure
            // réseau...) passait inaperçu : le message "Actualité publiée" s'affichait quand
            // même côté UI alors que rien n'était réellement enregistré en base. On prévient
            // maintenant clairement, ET on relance l'erreur pour que ContribuerTab sache que
            // la publication a échoué (et ne vide pas le formulaire, ni n'affiche "publiée").
            showToast("Échec de la publication : " + (err.message || "erreur inconnue"));
            throw err;
          });
        };
        if (flash) {
          return new Promise((resolve, reject) => {
            spendPoints(COUT_FLASH, () => { publier(Date.now() + DUREE_FLASH_MS).then(resolve, reject); });
          });
        }
        return publier(null);
      }, [pseudo, badgeActif, addPoints, spendPoints, showToast, authUser]);

      const handleToggleBoussole = useCallback((stepId) => {
        setBoussoleProgress(prev => {
          const updated = { ...prev, [stepId]: !prev[stepId] };
          saveBoussoleProgress(updated);
          return updated;
        });
      }, []);

      const handleAddBoussoleStep = useCallback(({ titre, categorie, description }) => {
        const stepId = "b-" + Date.now();
        const ordre = boussoleSteps.length + 1;
        boussoleRef.child(stepId).set({ titre, categorie, description, auteur: pseudo, ordre });
        addPoints(3);
      }, [pseudo, boussoleSteps, addPoints]);

      const handleAddCartePoint = useCallback(({ nom, categorie, description, lat, lng }) => {
        const pointId = "p-" + Date.now();
        carteRef.child(pointId).set({ nom, categorie, description, lat, lng, auteur: pseudo });
        addPoints(3);
      }, [pseudo, addPoints]);

      // Réservé au propriétaire : modifie un point existant de la carte du campus
      const handleUpdateCartePoint = useCallback((id, { nom, categorie, description, lat, lng }) => {
        if (!isOwner) return;
        carteRef.child(id).update({ nom, categorie, description, lat, lng });
      }, [isOwner]);

      // Réservé au propriétaire : supprime un point de la carte du campus
      const handleDeleteCartePoint = useCallback((id) => {
        if (!isOwner) return;
        carteRef.child(id).remove();
      }, [isOwner]);

      const handleSendMessage = useCallback((texte) => {
        const msgId = "m-" + Date.now();
        chatRef.child(msgId).set({ pseudo, texte, badge: badgeActif, timestamp: Date.now() });
        envoyerNotification({ diffusion: true, titre: pseudo + " (Chat Sabi)", corps: texte.slice(0, 120) });
      }, [pseudo, badgeActif]);

      // Assistance — l'étudiant envoie un message au propriétaire ; "lu: false" fait apparaître
      // le badge non-lu côté SupportAdminTab.
      const handleSendSupportMessage = useCallback(texte => {
        if (!authUser) return;
        supportRef.child(authUser.uid).push({ auteur: "etudiant", texte, timestamp: Date.now(), lu: false });
      }, [authUser]);

      // Marque comme lues les réponses du propriétaire une fois vues par l'étudiant.
      const handleMarkSupportLu = useCallback(msgIds => {
        if (!authUser) return;
        const updates = {};
        msgIds.forEach(id => { updates[id + "/lu"] = true; });
        supportRef.child(authUser.uid).update(updates);
      }, [authUser]);

      const setProfil = useCallback((newProfil) => {
        setProfilState(newProfil);
        if (authUser) usersRef.child(authUser.uid).update(newProfil);
      }, [authUser]);

      const handleAddEpreuve = useCallback(({ matiere, code, annee, anneeSujet, semestre, type, filiere, contenu, corrige, pdfUrl, imageUrl, imagesUrls }) => {
        const epId = "e-" + Date.now();
        const data = { matiere, annee, semestre, type, filiere, contenu, corrige, auteur: pseudo, date: new Date().toISOString().slice(0, 10) };
        if (code) data.code = code;
        if (anneeSujet) data.anneeSujet = anneeSujet;
        if (pdfUrl) data.pdfUrl = pdfUrl;
        if (imageUrl) data.imageUrl = imageUrl;
        if (imagesUrls && imagesUrls.length > 1) data.imagesUrls = imagesUrls;
        return epreuvesRef.child(annee).child(filiere).child(epId).set(data).then(() => {
          addPoints(15);
          envoyerNotification({ diffusion: true, titre: "Nouvelle épreuve : " + matiere, corps: pseudo + " a ajouté une épreuve pour " + filiere + " " + annee });
        });
      }, [pseudo, addPoints]);

      // Réservé aux admins/propriétaire : publie un résumé de cours (contenu Pro+)
      const handleAddResume = useCallback(({ matiere, annee, semestre, filiere, contenu, pdfUrl }) => {
        if (!isAdminEffectif) return Promise.reject(new Error("Accès non autorisé."));
        const id = "r-" + Date.now();
        const data = { matiere, annee, filiere, contenu, auteur: pseudo, date: new Date().toISOString().slice(0, 10) };
        if (semestre) data.semestre = semestre;
        if (pdfUrl) data.pdfUrl = pdfUrl;
        return resumesRef.child(id).set(data).then(() => {
          envoyerNotification({ diffusion: true, titre: "Nouveau résumé : " + matiere, corps: "Disponible pour " + filiere + " " + annee });
        });
      }, [pseudo, isAdminEffectif]);

      // Réservé au propriétaire : supprime définitivement un résumé
      const handleDeleteResume = useCallback((id) => {
        if (!isOwner) return;
        resumesRef.child(id).remove();
      }, [isOwner]);

      // Génère un résumé IA pour un résumé de cours et le met en cache dans Firebase
      // (resumeIA) — même mécanique que handleGenererCorrigeIA pour les épreuves.
      const handleGenererResumeIA = useCallback((r) => {
        if (r.resumeIA) return Promise.resolve(r.resumeIA);
        return genererResumeIA(r.contenu, r.matiere, r.pdfUrl).then(texte => {
          resumesRef.child(r.id).child("resumeIA").set(texte);
          return texte;
        });
      }, []);

      // Réservé au propriétaire : efface un résumé IA raté/halluciné pour permettre une régénération
      const handleClearResumeIA = useCallback((r) => {
        if (!isOwner) return;
        resumesRef.child(r.id).child("resumeIA").remove();
      }, [isOwner]);


      // Réservé au propriétaire : supprime définitivement une épreuve publiée
      const handleDeleteEpreuve = useCallback((ep) => {
        if (!isOwner) return;
        epreuvesRef.child(ep.annee).child(ep.filiere).child(ep.id).remove();
      }, [isOwner]);

      // Réservé au propriétaire : efface un corrigé IA raté/halluciné pour permettre une régénération
      const handleClearCorrigeIA = useCallback((ep) => {
        if (!isOwner) return;
        epreuvesRef.child(ep.annee).child(ep.filiere).child(ep.id).child("corrigeIA").remove();
      }, [isOwner]);

      // Réservé au propriétaire : remplace le PDF d'une épreuve déjà publiée sans toucher au reste
      const handleReplacePdf = useCallback((ep, newUrl) => {
        if (!isOwner) return;
        epreuvesRef.child(ep.annee).child(ep.filiere).child(ep.id).child("pdfUrl").set(newUrl);
      }, [isOwner]);

      // Réservé au propriétaire : remplace la photo du sujet d'une épreuve déjà publiée
      const handleReplaceImage = useCallback((ep, newUrl) => {
        if (!isOwner) return;
        epreuvesRef.child(ep.annee).child(ep.filiere).child(ep.id).child("imageUrl").set(newUrl);
        epreuvesRef.child(ep.annee).child(ep.filiere).child(ep.id).child("imagesUrls").remove(); // la photo remplacée devient l'unique photo
      }, [isOwner]);

      // Génère un corrigé IA pour une épreuve et le met en cache dans Firebase (corrigeIA)
      // pour ne jamais le regénérer deux fois — préserve le quota gratuit de l'API.
      const handleGenererCorrigeIA = useCallback((ep) => {
        if (ep.corrigeIA) return Promise.resolve(ep.corrigeIA); // déjà en cache, rien à faire
        return genererCorrigeIA(ep.contenu, ep.matiere, ep.pdfUrl, ep.imagesUrls || ep.imageUrl).then(texte => {
          epreuvesRef.child(ep.annee).child(ep.filiere).child(ep.id).child("corrigeIA").set(texte);
          return texte;
        });
      }, []);

      const handleBuyBadge = useCallback((badge) => {
        if (badge.auto) return; // badges automatiques : jamais achetables
        spendPoints(badge.cout, () => {
          usersRef.child(authUser.uid).child("badges").child(badge.id).set(true);
          usersRef.child(authUser.uid).child("badgeActif").set(badge.id);
        });
      }, [spendPoints, authUser]);

      const handleSetBadgeActif = useCallback((badgeId) => {
        if (!authUser) return;
        usersRef.child(authUser.uid).child("badgeActif").set(badgeId);
      }, [authUser]);

      // Le VIP n'est plus un déblocage automatique : les points sont débités, puis
      // la demande attend la validation d'un admin (voir AdminTab et Security Rules).
      const handleBuyVip = useCallback((onEnvoyee) => {
        spendPoints(COUT_VIP, () => {
          vipDemandesRef.push({ uid: authUser.uid, pseudo, timestamp: Date.now() });
          if (onEnvoyee) onEnvoyee();
        });
      }, [spendPoints, authUser, pseudo]);

      // Envoie une demande d'abonnement Sabi Pro/Pro+ — le propriétaire valide manuellement
      // après vérification du paiement Orange Money (voir panneau Admin)
      const handleDemandeAbonnement = useCallback((tier, duree) => {
        if (!authUser) return;
        abonnementDemandesRef.push({ uid: authUser.uid, pseudo, tier, duree: duree || "semestre", timestamp: Date.now() });
      }, [authUser, pseudo]);

      // Lance un paiement NotchPay (Orange Money / MTN MoMo / carte). L'appli n'envoie que le pack
      // choisi + son jeton de connexion : c'est le SERVEUR (creer-paiement) qui calcule le prix,
      // enregistre le paiement et parle à NotchPay avec la clé secrète. Aucune clé ni aucun montant
      // ne transite par l'appli. L'abonnement est activé par le webhook NotchPay, pas par ce retour.
      const handleDemarrerPaiement = useCallback((tier, duree) => {
        if (!authUser) return Promise.reject(new Error("Non connecté."));
        return authUser.getIdToken().then(idToken =>
          fetch(NETLIFY_BASE_URL + "/.netlify/functions/creer-paiement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken, tier, duree: duree || "semestre" })
          })
        ).then(res => res.json().catch(() => null).then(data => {
          if (!data || !data.ok || !data.authorization_url) throw new Error((data && data.message) || "Échec de l'initialisation du paiement.");
          // On mémorise la référence : au retour dans l'app on relance une vérification (filet de
          // sécurité si le webhook tarde) — même si NotchPay ne peut pas rouvrir l'appli native.
          try { localStorage.setItem("sabi_paiement_en_attente", JSON.stringify({ ref: data.reference, uid: authUser.uid, ts: Date.now() })); } catch {}
          const { Browser } = (window.Capacitor && window.Capacitor.Plugins) || {};
          if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform() && Browser) {
            Browser.open({ url: data.authorization_url });
          } else {
            window.location.href = data.authorization_url;
          }
        }));
      }, [authUser]);

      // Au retour de NotchPay (?paiement=retour&ref=...), demande à la Netlify Function de
      // vérifier réellement le paiement (avec la clé secrète, jamais côté client) et d'activer
      // l'abonnement si c'est confirmé. Tant que la fonction n'a pas répondu, l'abonnement
      // n'est pas considéré comme actif — pas de confiance aveugle dans le retour d'URL.
      const [verifPaiementStatut, setVerifPaiementStatut] = useState(null); // null | "en_cours" | "ok" | "erreur"
      const [verifPaiementDetail, setVerifPaiementDetail] = useState("");
      const verifierPaiement = useCallback((ref) => {
        if (!authUser || !ref) return;
        setVerifPaiementStatut("en_cours");
        authUser.getIdToken().then(idToken => fetch(NETLIFY_BASE_URL + "/.netlify/functions/verifier-paiement", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reference: ref, idToken })
        })).then(res => res.json()).then(data => {
          const ok = !!(data && data.ok);
          setVerifPaiementStatut(ok ? "ok" : "erreur");
          setVerifPaiementDetail(ok ? "" : String((data && data.message) || "Réponse vide du serveur."));
          if (ok || /pas le tien|introuvable/i.test(String((data && data.message) || ""))) { try { localStorage.removeItem("sabi_paiement_en_attente"); } catch {} }
        }).catch((e) => { setVerifPaiementStatut("erreur"); setVerifPaiementDetail("Serveur injoignable : " + ((e && e.message) || "réseau")); });
      }, [authUser]);

      const reverifierPaiement = useCallback(() => {
        try {
          const p = JSON.parse(localStorage.getItem("sabi_paiement_en_attente") || "null");
          if (p && p.ref && authUser && p.uid === authUser.uid) verifierPaiement(p.ref);
        } catch {}
      }, [verifierPaiement, authUser]);

      // Cas web : retour de NotchPay avec ?paiement=retour&ref=...
      useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get("paiement") !== "retour" || !params.get("ref") || !authUser) return;
        verifierPaiement(params.get("ref"));
      }, [authUser, verifierPaiement]);

      // Cas app native : dès que l'utilisateur revient dans Sabi (fermeture du navigateur de
      // paiement ou bascule d'appli), on vérifie le paiement en attente (valable 24 h).
      useEffect(() => {
        if (!authUser) return;
        const enAttente = () => {
          try {
            const p = JSON.parse(localStorage.getItem("sabi_paiement_en_attente") || "null");
            return p && p.ref && p.uid === authUser.uid && Date.now() - p.ts < 24 * 60 * 60 * 1000 ? p.ref : null;
          } catch { return null; }
        };
        const ref0 = enAttente();
        if (ref0) verifierPaiement(ref0);
        const { App, Browser } = (window.Capacitor && window.Capacitor.Plugins) || {};
        const handles = [];
        const surRetour = () => { const r = enAttente(); if (r) { if (Browser && Browser.close) { try { Browser.close(); } catch {} } verifierPaiement(r); } };
        if (App && App.addListener) handles.push(App.addListener("appStateChange", st => { if (st && st.isActive) surRetour(); }));
        if (Browser && Browser.addListener) handles.push(Browser.addListener("browserFinished", surRetour));
        return () => { handles.forEach(h => { try { Promise.resolve(h).then(x => x && x.remove && x.remove()); } catch {} }); };
      }, [authUser, verifierPaiement]);

      // L'utilisateur ne peut pas changer son année directement — il soumet une demande,
      // seul le propriétaire peut la valider (voir Security Rules : "annee" n'est plus
      // auto-modifiable par le propriétaire du compte lui-même).
      // Retourne la Promise du push (au lieu de l'ignorer) : sans ça, un rejet par les Security
      // Rules passait inaperçu et l'UI affichait "Demande envoyée" même quand rien n'avait
      // réellement été écrit en base — exactement le problème que tu décrivais.
      const handleDemandeChangementAnnee = useCallback((anneeDemandee) => {
        if (!authUser) return Promise.reject(new Error("Non connecté."));
        return demandesAnneeRef.push({ uid: authUser.uid, pseudo, anneeActuelle: profil.annee, anneeDemandee, timestamp: Date.now() });
      }, [authUser, pseudo, profil.annee]);

      // Même principe pour la filière : jamais modifiable directement par l'utilisateur,
      // seul le propriétaire peut valider le changement.
      const handleDemandeChangementFiliere = useCallback((filiereDemandee) => {
        if (!authUser) return Promise.reject(new Error("Non connecté."));
        return demandesFiliereRef.push({ uid: authUser.uid, pseudo, filiereActuelle: profil.filiere, filiereDemandee, timestamp: Date.now() });
      }, [authUser, pseudo, profil.filiere]);

      // Une fois le matricule enregistré, il est verrouillé (voir Security Rules) — pour le
      // modifier, l'étudiant soumet une demande (avec motif) que seul le propriétaire valide,
      // ce qui efface le matricule actuel et permet d'en ressaisir un nouveau.
      const handleDemandeDeblocageMatricule = useCallback((motif) => {
        return new Promise((resolve, reject) => {
          if (!authUser) { reject(new Error("Non connecté.")); return; }
          if (!matricule) { reject(new Error("Aucun matricule enregistré à modifier.")); return; }
          if (!motif || motif.trim().length < 5) { reject(new Error("Explique brièvement le motif (5 caractères minimum).")); return; }
          demandesMatriculeRef.push({ uid: authUser.uid, pseudo, matriculeActuel: matricule, motif: motif.trim(), timestamp: Date.now() })
            .then(() => resolve())
            .catch(err => reject(err));
        });
      }, [authUser, pseudo, matricule]);

      const handleCreateBounty = useCallback(({ titre, description, mise }) => {
        spendPoints(mise, () => {
          const bountyId = "bt-" + Date.now();
          bountyRef.child(bountyId).set({ titre, description, mise, auteur: pseudo, uid: authUser.uid, statut: "ouvert", date: new Date().toISOString().slice(0, 10) });
        });
      }, [spendPoints, pseudo, authUser]);

      const handleRespondBounty = useCallback((bountyId, texte) => {
        bountyRef.child(bountyId).child("reponses").push({ texte, auteur: pseudo, uid: authUser.uid, date: new Date().toISOString().slice(0, 10) });
        const bounty = bounties.find(b => b.id === bountyId);
        if (bounty && bounty.uid && bounty.uid !== authUser.uid) {
          envoyerNotification({ cibleUid: bounty.uid, titre: "Nouvelle réponse à ton Bounty", corps: pseudo + " a répondu à \"" + bounty.titre + "\"" });
        }
      }, [pseudo, authUser, bounties]);

      const handleChooseWinner = useCallback((bounty, reponse) => {
        // Le créateur désigne juste le gagnant — c'est le gagnant lui-même qui réclamera
        // ses points (voir plus bas), pour que personne n'ait jamais à écrire dans le
        // compte d'un autre utilisateur.
        bountyRef.child(bounty.id).update({ statut: "resolu", gagnantUid: reponse.uid, gagnantPseudo: reponse.auteur, reclame: false });
        if (reponse.uid) {
          envoyerNotification({ cibleUid: reponse.uid, titre: "Tu as gagné un Bounty", corps: "\"" + bounty.titre + "\" : " + bounty.mise + " points t'attendent" });
        }
      }, []);

      // Réclame automatiquement les primes gagnées — chacun ne crédite que son propre compte
      useEffect(() => {
        if (!authUser) return;
        bounties.forEach(b => {
          if (b.statut === "resolu" && b.gagnantUid === authUser.uid && !b.reclame) {
            usersRef.child(authUser.uid).child("points").transaction(current => (current || 0) + b.mise);
            usersRef.child(authUser.uid).child("pointsTotal").transaction(current => (current || 0) + b.mise);
            pointsLogRef.push({ uid: authUser.uid, pseudo, n: b.mise, timestamp: Date.now() });
            bountyRef.child(b.id).child("reclame").set(true);
          }
        });
      }, [bounties, authUser, pseudo]);

      const handleEpingle = useCallback((cardId) => {
        spendPoints(COUT_EPINGLE, () => {
          cardsRef.child(cardId).child("epingleJusqua").set(Date.now() + DUREE_EPINGLE_MS);
        });
      }, [spendPoints]);

      // Réservé au propriétaire : partage/offre des points à n'importe quel utilisateur pour le récompenser
      const handleGivePoints = useCallback((uid, cibleData, montant) => {
        if (!isOwner || !montant || montant <= 0) return;
        usersRef.child(uid).child("points").transaction(current => (current || 0) + montant);
        usersRef.child(uid).child("pointsTotal").transaction(current => (current || 0) + montant);
        pointsLogRef.push({ uid, pseudo: cibleData.pseudo, filiere: cibleData.filiere || "", n: montant, timestamp: Date.now(), offert: true, offertPar: pseudo });
      }, [isOwner, pseudo]);

      const handleLogout = useCallback(() => {
        auth.signOut();
      }, []);

      // Modification du pseudo (nom affiché) — mis à jour dans Firebase et localement
      const handleUpdatePseudo = useCallback((newPseudo) => {
        return new Promise((resolve, reject) => {
          const clean = (newPseudo || "").trim();
          if (clean.length < 2) { reject(new Error("Le nom doit contenir au moins 2 caractères.")); return; }
          if (clean.length > 30) { reject(new Error("Le nom ne doit pas dépasser 30 caractères.")); return; }
          if (!authUser) { reject(new Error("Non connecté.")); return; }
          usersRef.child(authUser.uid).child("pseudo").set(clean)
            .then(() => { setPseudo(clean); resolve(); })
            .catch(err => reject(err));
        });
      }, [authUser]);

      // Numéro WhatsApp — visible seulement par le propriétaire et les admins (voir MembresTab)
      const handleUpdateWhatsapp = useCallback((newWhatsapp) => {
        return new Promise((resolve, reject) => {
          if (!authUser) { reject(new Error("Non connecté.")); return; }
          const clean = (newWhatsapp || "").trim();
          usersRef.child(authUser.uid).child("whatsapp").set(clean)
            .then(() => { setWhatsapp(clean); resolve(); })
            .catch(err => reject(err));
        });
      }, [authUser]);

      // Renseigne le matricule d'un compte créé avant l'existence de ce champ (obligatoire depuis,
      // mais les comptes existants ne l'avaient pas). Ne peut être défini qu'une seule fois par ce
      // biais — une fois posé, il redevient verrouillé (voir InfosPersoSection) pour ne jamais
      // perdre le lien avec des notes déjà attribuées.
      const handleSetMatricule = useCallback((nouveauMatricule) => {
        return new Promise(async (resolve, reject) => {
          if (!authUser) { reject(new Error("Non connecté.")); return; }
          const clean = (nouveauMatricule || "").trim().toUpperCase();
          if (clean.length < 3) { reject(new Error("Matricule trop court.")); return; }
          const cle = clean.replace(/[.#$/\[\]]/g, "_");
          try {
            const snap = await matriculesRef.child(cle).get();
            if (snap.exists() && snap.val() !== authUser.uid) { reject(new Error("Ce matricule est déjà associé à un autre compte.")); return; }
            await usersRef.child(authUser.uid).child("matricule").set(clean);
            await matriculesRef.child(cle).set(authUser.uid);
            setMatriculeState(clean);
            resolve();
          } catch (err) { reject(err); }
        });
      }, [authUser]);

      // Modification du mot de passe — nécessite une ré-authentification récente
      const handleUpdatePassword = useCallback((currentPassword, newPassword) => {
        return new Promise((resolve, reject) => {
          if (!authUser || !authUser.email) { reject(new Error("Non connecté.")); return; }
          if (!currentPassword) { reject(new Error("Saisis ton mot de passe actuel.")); return; }
          if (!newPassword || newPassword.length < 6) { reject(new Error("Le nouveau mot de passe doit contenir au moins 6 caractères.")); return; }
          const credential = firebase.auth.EmailAuthProvider.credential(authUser.email, currentPassword);
          authUser.reauthenticateWithCredential(credential)
            .then(() => authUser.updatePassword(newPassword))
            .then(() => resolve())
            .catch(err => {
              if (err && err.code === "auth/wrong-password") reject(new Error("Mot de passe actuel incorrect."));
              else if (err && err.code === "auth/too-many-requests") reject(new Error("Trop de tentatives. Réessaie plus tard."));
              else reject(new Error("Impossible de modifier le mot de passe. Réessaie."));
            });
        });
      }, [authUser]);

      const tabs = [
        { id: "actualites", label: "Actualités", icon: "radio" },
        { id: "epreuves", label: "Épreuves", icon: "book" },
        { id: "accueil", label: "Accueil", icon: "home" },
        { id: "carte", label: "Carte", icon: "map" },
        { id: "chat", label: "Chat", icon: "message-circle" },
      ];
      // Titres affichés dans le header à la place du logo — un par onglet, y compris les onglets
      // secondaires (accessibles depuis Profil) qui ne sont pas dans la barre de nav du bas.
      const TITRES_ONGLETS = {
        actualites: "Actualités", epreuves: "Épreuves", accueil: "Accueil", carte: "Carte", chat: "Chat",
        boussole: "Boussole", classement: "Classement", boutique: "Boutique & Bounty", simulateur: "Simulateur de moyenne",
        mentor: "Coach Réussite", membres: "Membres", admin: "Administration", resumes: "Résumés de cours",
        myscore: "MyScore", assistance: "Assistance", supportAdmin: "Messagerie Assistance", contribuer: "Publier",
        infosperso: "Mes informations",
      };
      // Navigation par glissement (swipe) horizontal entre les 5 onglets principaux, dans l'ordre
      // où ils apparaissent dans la barre du bas : actualités ↔ épreuves ↔ accueil ↔ carte ↔ chat.
      // La carte est exclue en tant que point de DÉPART du glissé (elle a son propre glissé Leaflet
      // pour se déplacer sur le plan) — mais on peut quand même y arriver depuis "épreuves" ou "chat".
      //
      // Le contenu suit le doigt en direct (translateX appliqué directement sur le DOM via ref,
      // sans passer par setState à chaque pixel — indispensable pour rester fluide sur un fichier
      // aussi volumineux). Au relâchement : au-delà du seuil, on termine la sortie puis on bascule
      // d'onglet (qui rejoue l'animation d'entrée existante) ; en dessous du seuil, le contenu
      // revient à sa place avec un petit ressort.
      //
      // Sur les écrans secondaires (profil, boussole, boutique, etc.), un balayage démarré près du
      // bord gauche et tiré vers la droite déclenche le même retour que le bouton "← Retour" — geste
      // de retour façon Android/iOS, en plus du bouton (qui reste affiché).
      const SWIPE_TABS = ["actualites", "epreuves", "accueil", "carte", "chat"];
      const LARGEUR_BORD_RETOUR = 28; // px depuis le bord gauche pour déclencher le balayage retour
      const swipeContentRef = React.useRef(null);
      const swipeStartRef = React.useRef(null);
      const [swipeAnim, setSwipeAnim] = useState(null); // "left" | "right" | null — sens d'entrée de l'onglet

      const appliquerTransform = (dx, avecTransition) => {
        const el = swipeContentRef.current;
        if (!el) return;
        el.style.transition = avecTransition ? "transform 180ms cubic-bezier(0.22, 0.61, 0.36, 1)" : "none";
        el.style.transform = "translateX(" + dx + "px)";
      };

      const onSwipeTouchStart = e => {
        const t = e.touches[0];
        swipeStartRef.current = {
          x: t.clientX,
          y: t.clientY,
          horizontal: null, // décidé au premier mouvement net (évite de bloquer un scroll vertical)
          peutGlisserTab: tab !== "carte" && SWIPE_TABS.includes(tab),
          peutRetourBord: (afficherRetour || estProfil) && t.clientX <= LARGEUR_BORD_RETOUR,
        };
        appliquerTransform(0, false);
      };

      const onSwipeTouchMove = e => {
        const start = swipeStartRef.current;
        if (!start || (!start.peutGlisserTab && !start.peutRetourBord)) return;
        const t = e.touches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (start.horizontal === null) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return; // pas encore assez de mouvement pour trancher
          start.horizontal = Math.abs(dx) > Math.abs(dy) * 1.3;
        }
        if (!start.horizontal) return;
        e.preventDefault(); // empêche le scroll vertical de "voler" le geste une fois l'horizontal confirmé

        const idx = SWIPE_TABS.indexOf(tab);
        const limiteGauche = start.peutRetourBord || (start.peutGlisserTab && idx > 0);
        const limiteDroite = start.peutGlisserTab && idx < SWIPE_TABS.length - 1;
        // Petite résistance ("rubber-band") si on pousse vers un côté sans destination.
        let dxAffiche = dx;
        if (dx > 0 && !limiteGauche) dxAffiche = dx * 0.25;
        if (dx < 0 && !limiteDroite) dxAffiche = dx * 0.25;
        appliquerTransform(dxAffiche, false);
      };

      const onSwipeTouchEnd = e => {
        const start = swipeStartRef.current;
        swipeStartRef.current = null;
        if (!start || !start.horizontal) { appliquerTransform(0, false); return; }
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const SEUIL = 70;
        const idx = SWIPE_TABS.indexOf(tab);
        const largeur = (swipeContentRef.current && swipeContentRef.current.offsetWidth) || 360;

        // Balayage retour (bord gauche → droite) sur un écran secondaire.
        if (start.peutRetourBord && dx > SEUIL) {
          appliquerTransform(largeur, true);
          setTimeout(() => { setSwipeAnim("right"); setTab(estProfil ? tabAvantProfil : retourVers); appliquerTransform(0, false); }, 180);
          return;
        }
        // Glissement entre les 4 onglets principaux.
        if (start.peutGlisserTab && dx < -SEUIL && idx < SWIPE_TABS.length - 1) {
          appliquerTransform(-largeur, true);
          setTimeout(() => { setSwipeAnim("left"); setTab(SWIPE_TABS[idx + 1]); appliquerTransform(0, false); }, 180);
          return;
        }
        if (start.peutGlisserTab && dx > SEUIL && idx > 0) {
          appliquerTransform(largeur, true);
          setTimeout(() => { setSwipeAnim("right"); setTab(SWIPE_TABS[idx - 1]); appliquerTransform(0, false); }, 180);
          return;
        }
        // Sous le seuil : petit ressort de retour à zéro.
        appliquerTransform(0, true);
      };
      // touchmove attaché en natif (pas via la prop React onTouchMove) : React rend ses écouteurs
      // tactiles passifs par défaut, ce qui empêche preventDefault() de fonctionner et laisserait
      // le scroll vertical du navigateur "voler" le geste horizontal. Réattaché à chaque changement
      // d'onglet car le conteneur (key: tab) est un tout nouveau nœud DOM à chaque fois.
      useEffect(() => {
        const el = swipeContentRef.current;
        if (!el) return;
        el.addEventListener("touchmove", onSwipeTouchMove, { passive: false });
        return () => el.removeEventListener("touchmove", onSwipeTouchMove);
      }, [tab]);
      const secondaryIds = ["boussole", "classement", "boutique", "simulateur", "mentor", "membres", "admin", "myscoreAdmin", "promoAdmin", "resumes", "myscore", "assistance", "supportAdmin", "infosperso"];
      const activeBottom = tabs.some(t => t.id === tab) ? tab : null;
      const afficherRetour = secondaryIds.includes(tab) || tab === "contribuer";
      // Total des demandes en attente (changement d'année/filière/matricule, VIP, abonnement) —
      // sert uniquement à afficher une pastille sur "Administration" dans le menu Profil, pour
      // que le propriétaire sache d'un coup d'œil qu'il y a des choses à traiter. N'est chargé
      // que pour le propriétaire (actif: isOwner) : aucun coût pour les autres utilisateurs.
      const demandesAnneeCount = useFirebaseList(demandesAnneeRef, { actif: isOwner }).length;
      const demandesFiliereCount = useFirebaseList(demandesFiliereRef, { actif: isOwner }).length;
      const demandesMatriculeCount = useFirebaseList(demandesMatriculeRef, { actif: isOwner }).length;
      const vipDemandesCount = useFirebaseList(vipDemandesRef, { actif: isOwner }).length;
      const abonnementDemandesCount = useFirebaseList(abonnementDemandesRef, { actif: isOwner }).length;
      const demandesEnAttente = demandesAnneeCount + demandesFiliereCount + demandesMatriculeCount + vipDemandesCount + abonnementDemandesCount;
      // Notifications personnelles non lues — pour tout le monde cette fois (pas seulement le
      // propriétaire) : c'est ce qui allume la pastille sur l'icône profil du header. Le compte
      // "demandesEnAttente" ci-dessus reste, lui, réservé au badge du menu Administration.
      const mesNotifications = useFirebaseList(authUser ? notificationsRef.child(authUser.uid) : null, { actif: !!authUser });
      const notifsNonLues = mesNotifications.filter(n => !n.lu).length;
      const totalPastilleHeader = demandesEnAttente + notifsNonLues;
      // Marque tout comme lu dès que l'étudiant ouvre son Profil — geste naturel de consultation,
      // pas besoin d'un écran dédié "liste des notifications" pour l'instant.
      useEffect(() => {
        if (tab !== "profil" || !authUser || notifsNonLues === 0) return;
        mesNotifications.filter(n => !n.lu).forEach(n => notificationsRef.child(authUser.uid).child(n.id).update({ lu: true }).catch(() => {}));
      }, [tab, authUser, notifsNonLues]);
      const retourVers = tab === "contribuer" ? "accueil" : "profil";
      const estProfil = tab === "profil";

      // Le bouton/geste "retour" du système Android ferme l'app par défaut dès qu'il n'y a pas
      // d'historique de navigateur — ce qui est toujours le cas ici puisque le changement d'onglet
      // se fait par état React, jamais par l'URL. Sans ce branchement, appuyer sur retour quitte
      // Sabi immédiatement, peu importe l'écran affiché. On intercepte donc l'événement natif pour
      // reproduire une hiérarchie de navigation cohérente : écran secondaire -> écran d'origine ;
      // onglet principal -> Accueil ; déjà sur Accueil -> quitter seulement après un 2ᵉ appui
      // rapproché (évite les sorties accidentelles).
      // Placé ICI, avant tout "return" conditionnel (écran de chargement / connexion) : un Hook
      // doit toujours s'exécuter dans le même ordre à chaque rendu, sans quoi React plante
      // ("Rendered more hooks than during the previous render") dès que l'utilisateur se connecte.
      const dernierAppuiRetour = React.useRef(0);
      useEffect(() => {
        if (!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) return;
        const { App } = window.Capacitor.Plugins || {};
        if (!App) return;
        const gerer = () => {
          if (window.__sabiConfidentialiteOuverte) { window.dispatchEvent(new Event("sabi:fermer-confidentialite")); return; }
          if (menuOuvert) { setMenuOuvert(false); return; }
          if (estProfil) { setTab(tabAvantProfil); return; }
          if (afficherRetour) { setTab(retourVers); return; }
          if (tab !== "accueil") { setTab("accueil"); return; }
          const maintenant = Date.now();
          if (maintenant - dernierAppuiRetour.current < 2000) { App.exitApp(); return; }
          dernierAppuiRetour.current = maintenant;
          showToast("Appuie encore sur retour pour quitter");
        };
        const handle = App.addListener("backButton", gerer);
        return () => { Promise.resolve(handle).then(x => x && x.remove && x.remove()); };
      }, [tab, estProfil, afficherRetour, retourVers, tabAvantProfil, menuOuvert]);

      // Tant qu'on ne sait pas si l'utilisateur est connecté, on attend
      if (!authChecked) {
        return React.createElement("div", { className: "min-h-screen w-full flex flex-col items-center justify-center gap-3", style: { backgroundColor: COLORS.bg } },
          React.createElement("div", { className: "sabi-skeleton w-14 h-14 rounded-full", style: { backgroundColor: COLORS.gold + "33" } }),
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-widest", style: { color: COLORS.textFaint } }, "Sabi")
        );
      }

      // Pas connecté → carrousel de bienvenue (une fois), puis écran de connexion
      if (!authUser) {
        if (!onboardingVu) {
          return React.createElement(OnboardingCarousel, {
            onTerminer: () => {
              try { localStorage.setItem("sabi_onboarding_vu", "1"); } catch {}
              setOnboardingVu(true);
            }
          });
        }
        return React.createElement(LoginScreen, { onLoggedIn: () => {} });
      }

      // Connecté, mais une inscription est peut-être encore en train d'écrire le profil
      // (voir confirmerInscription) : on affiche une attente plutôt que l'écran principal
      // avec un pseudo vide et une filière par défaut pendant cette fraction de seconde.
      let inscriptionEnCours = false;
      try { inscriptionEnCours = localStorage.getItem("sabi_inscription_en_cours") === "1"; } catch {}
      if (inscriptionEnCours && !profilCharge) {
        return React.createElement("div", { className: "min-h-screen w-full flex flex-col items-center justify-center gap-3", style: { backgroundColor: COLORS.bg } },
          React.createElement("div", { className: "sabi-skeleton w-14 h-14 rounded-full", style: { backgroundColor: COLORS.gold + "33" } }),
          React.createElement("p", { className: "text-xs font-mono uppercase tracking-widest", style: { color: COLORS.textFaint } }, "Création de ton compte...")
        );
      }

      // Table de routage des onglets — remplace la ternaire de 15 branches.
      // Chaque entrée est une fonction (pas un élément déjà créé) pour ne construire
      // que celle réellement affichée, avec les mêmes props qu'avant.
      const TAB_RENDERERS = {
        accueil: () => React.createElement(AccueilTab, { cards: cards, epreuves: epreuves, pseudo: pseudo, matricule: matricule, points: points, pointsTotal: pointsTotal, profil: profil, vip: vip, pointsLogs: pointsLogs, badges: badges, onNavigate: setTab, authUid: authUser.uid, onGagnerPoints: addPoints }),
        profil: () => React.createElement(ProfilTab, { pseudo: pseudo, profil: profil, points: points, pointsTotal: pointsTotal, badgeActif: badgeActif, badges: badges, vip: vip, isOwner: isOwner, isAdmin: isAdminEffectif, abonnement: abonnement, whatsapp: whatsapp, matricule: matricule, demandesEnAttente: demandesEnAttente, onSetBadgeActif: handleSetBadgeActif, onNavigate: setTab, onLogout: handleLogout, email: authUser.email, onUpdatePseudo: handleUpdatePseudo, onUpdateWhatsapp: handleUpdateWhatsapp, onUpdatePassword: handleUpdatePassword, onSetMatricule: handleSetMatricule, onDemandeDeblocageMatricule: handleDemandeDeblocageMatricule }),
        myscore: () => React.createElement(MyScoreTab, { authUid: authUser.uid }),
        boussole: () => React.createElement(BoussoleTab, { steps: boussoleSteps, progress: boussoleProgress, onToggle: handleToggleBoussole, onAddStep: handleAddBoussoleStep }),
        epreuves: () => React.createElement(EpreuvesTab, { epreuves: epreuves, profil: profil, setProfil: setProfil, onAddEpreuve: handleAddEpreuve, onGenerateCorrigeIA: handleGenererCorrigeIA, onClearCorrigeIA: handleClearCorrigeIA, isAdmin: isAdminEffectif, isOwner: isOwner, onDeleteEpreuve: handleDeleteEpreuve, onReplacePdf: handleReplacePdf, onReplaceImage: handleReplaceImage, abonnement: abonnement, setTab: setTab }),
        resumes: () => React.createElement(ResumesTab, { resumes: resumes, isAdmin: isAdminEffectif, isOwner: isOwner, abonnement: abonnement, setTab: setTab, onAddResume: handleAddResume, onDeleteResume: handleDeleteResume, onGenerateResumeIA: handleGenererResumeIA, onClearResumeIA: handleClearResumeIA }),
        admin: () => React.createElement(AdminTab, { isOwner: isOwner, onGivePoints: handleGivePoints }),
        myscoreAdmin: () => React.createElement(MyScoreAdminTab, { isOwner: isOwner, fichiersLances: fichiersLances }),
        promoAdmin: () => React.createElement(PromotionsAdminTab, { isOwner: isOwner }),
        assistance: () => React.createElement(AssistanceTab, { messages: supportMessages, onSend: handleSendSupportMessage, onMarkLu: handleMarkSupportLu }),
        supportAdmin: () => React.createElement(SupportAdminTab, { isOwner: isOwner }),
        classement: () => React.createElement(ClassementTab, { logs: pointsLogs, authUid: authUser.uid, pseudo: pseudo, profil: profil, onGagnerPoints: addPoints }),
        membres: () => React.createElement(MembresTab, { membres: membresList, isOwner: isOwner, isAdmin: isAdminEffectif }),
        boutique: () => React.createElement(BoutiqueTab, { points: points, badges: badges, badgeActif: badgeActif, vip: vip, bounties: bounties, pseudo: pseudo, authUid: authUser.uid, abonnement: abonnement, promos: promos, verifPaiementStatut: verifPaiementStatut, verifPaiementDetail: verifPaiementDetail, onVerifierPaiement: reverifierPaiement, onBuyBadge: handleBuyBadge, onSetBadgeActif: handleSetBadgeActif, onBuyVip: handleBuyVip, onCreateBounty: handleCreateBounty, onRespondBounty: handleRespondBounty, onChooseWinner: handleChooseWinner, onDemandeAbonnement: handleDemandeAbonnement, onPayerAbonnement: handleDemarrerPaiement }),
        carte: () => React.createElement(CarteTab, { points: cartePoints, onAddPoint: handleAddCartePoint, onUpdatePoint: handleUpdateCartePoint, onDeletePoint: handleDeleteCartePoint, isOwner: isOwner }),
        actualites: () => React.createElement(FilTab, { cards: cards, onVote: handleVote, myVotes: myVotes, onPin: handleEpingle, points: points, pseudo: pseudo, isOwner: isOwner, isAdmin: isAdminEffectif, onDelete: handleDeleteCard, onClearAll: handleClearAllCards }),
        chat: () => React.createElement(ChatTab, { messages: chatMessages, pseudo: pseudo, onSend: handleSendMessage }),
        contribuer: () => React.createElement(ContribuerTab, { onSubmit: handleContribute, pseudo: pseudo, vip: vip, filiere: profil.filiere, points: points, isOwner: isOwner, isAdmin: isAdminEffectif, prefill: partagePrefill, prefillImage: partageImagePrefill }),
        infosperso: () => React.createElement(InfosPersoSection, { pseudo: pseudo, profil: profil, isOwner: isOwner, email: authUser.email, whatsapp: whatsapp, matricule: matricule, onUpdatePseudo: handleUpdatePseudo, onUpdateWhatsapp: handleUpdateWhatsapp, onUpdatePassword: handleUpdatePassword, onSetMatricule: handleSetMatricule, onDemandeChangementAnnee: handleDemandeChangementAnnee, onDemandeChangementFiliere: handleDemandeChangementFiliere, onDemandeDeblocageMatricule: handleDemandeDeblocageMatricule }),
        simulateur: () => React.createElement(SimulateurTab, { authUid: authUser.uid, profilAnnee: profil.annee, profilFiliere: profil.filiere }),
        mentor: () => React.createElement(MentorTab, { authUid: authUser.uid, profil: profil, pseudo: pseudo, abonnement: abonnement, isOwner: isOwner, isAdmin: isAdminEffectif, setTab: setTab, resumes: resumes }),
      };

      return React.createElement("div", { className: "h-screen w-full flex justify-center overflow-hidden", style: { backgroundColor: COLORS.bg } },
        React.createElement("div", { className: "w-full max-w-md h-screen flex flex-col relative overflow-hidden", style: { backgroundColor: COLORS.bg } },
          // Bannière "Installer Sabi" — visible seulement si Chrome a confirmé que l'app est
          // installable (promptInstallation) et que l'utilisateur ne l'a pas déjà fermée.
          promptInstallation && !installBanniereFermee && React.createElement("div", {
            className: "absolute top-0 left-0 right-0 z-50 flex items-center gap-2.5 px-4 py-2.5",
            style: { backgroundColor: COLORS.gold, color: COLORS.bg }
          },
            React.createElement(Icon, { name: "download", size: 15 }),
            React.createElement("p", { className: "flex-1 text-xs font-medium" }, "Installe Sabi sur ton téléphone pour un accès plus rapide."),
            React.createElement("button", {
              onClick: () => {
                promptInstallation.prompt();
                promptInstallation.userChoice.finally(() => setPromptInstallation(null));
              },
              className: "text-xs font-bold px-3 py-1.5 rounded-full flex-shrink-0",
              style: { backgroundColor: COLORS.bg, color: COLORS.gold }
            }, "Installer"),
            React.createElement("button", {
              onClick: () => {
                setInstallBanniereFermee(true);
                try { localStorage.setItem("sabi_install_banniere_fermee", "1"); } catch {}
              },
              "aria-label": "Fermer", className: "flex-shrink-0"
            }, React.createElement(Icon, { name: "x", size: 16 }))
          ),
          (estProfil || afficherRetour)
            // Écrans secondaires (profil + boussole/classement/boutique/etc.) : pas de header
            // complet (menu, profil) qui n'a pas de sens ici — juste un vrai bouton retour,
            // clair et bien visible, qui ramène à l'écran quitté.
            ? React.createElement("button", {
                onClick: () => setTab(estProfil ? tabAvantProfil : retourVers),
                className: "flex items-center gap-1.5 text-xs font-mono px-5 pt-5 pb-2 flex-shrink-0",
                style: { color: COLORS.textMuted }
              }, React.createElement(Icon, { name: "arrow-left", size: 14 }), " Retour")
            : React.createElement(React.Fragment, null,
                React.createElement("div", {
                  className: "sabi-header px-5 pt-4 pb-2.5 border-b relative overflow-hidden",
                  style: { borderColor: "var(--glass-border)" }
                },
                  React.createElement("div", { className: "sabi-header-glow" }),
                  React.createElement("div", { className: "flex items-center justify-between relative", style: { zIndex: 1 } },
                    React.createElement("div", { className: "flex items-center gap-2" },
                      React.createElement("button", {
                        onClick: () => setMenuOuvert(true),
                        className: "w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full -ml-1.5",
                        "aria-label": "Ouvrir le menu"
                      }, React.createElement(Icon, { name: "menu", size: 18, color: COLORS.textMuted })),
                      React.createElement("p", { className: "text-base font-semibold truncate", style: { color: COLORS.text } }, TITRES_ONGLETS[tab] || "Sabi")
                    ),
                    React.createElement("div", { className: "flex items-center gap-2 flex-shrink-0" },
                      React.createElement(PointsChip, { points: points, onClick: () => setTab("classement") }),
                    React.createElement("button", {
                      onClick: () => { setTabAvantProfil(tab); setTab("profil"); },
                      className: "w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-full relative",
                      style: { backgroundColor: "var(--field-bg)", border: "1px solid var(--glass-border)" },
                      "aria-label": "Profil"
                    },
                      React.createElement(Icon, { name: "user", size: 16, color: COLORS.textMuted }),
                      totalPastilleHeader > 0 && React.createElement("span", {
                        className: "absolute top-0 right-0 w-2.5 h-2.5 rounded-full",
                        style: { backgroundColor: COLORS.terra, border: `1.5px solid ${COLORS.bg}` }
                      })
                    )
                    )
                  )
                ),
                React.createElement("div", { className: "kente-rule kente-rule-shimmer" })
              ),
          React.createElement("div", {
            key: tab,
            ref: swipeContentRef,
            onTouchStart: onSwipeTouchStart,
            onTouchEnd: onSwipeTouchEnd,
            onAnimationEnd: () => setSwipeAnim(null),
            style: { touchAction: "pan-y" },
            className: "flex-1 min-h-0 " +
              (SWIPE_TABS.includes(tab) && swipeAnim ? (swipeAnim === "left" ? "sabi-swipe-in-left" : "sabi-swipe-in-right") : "sabi-tab-fade") + " " +
              (tab === "carte"
                ? "relative overflow-hidden"
                : "px-5 pt-4 " + (tab === "chat"
                    ? "overflow-hidden flex flex-col pb-3"
                    : "overflow-y-auto " + (tab === "accueil" || tab === "actualites" ? "pb-28" : "pb-8")))
          },
            !connexionOk && React.createElement("div", {
              className: "flex items-center gap-2 text-xs font-mono px-3 py-2 rounded-lg mb-3",
              style: { backgroundColor: COLORS.border, color: COLORS.textMuted }
            },
              React.createElement(Icon, { name: "wifi-off", size: 13 }),
              "Hors connexion, tu vois les dernières infos enregistrées sur cet appareil."
            ),
            loading
              ? React.createElement("div", { className: "flex flex-col gap-3 pt-2" },
                  [0, 1, 2].map(i => React.createElement("div", { key: i, className: "sabi-skeleton h-20 w-full", style: { backgroundColor: COLORS.border } }))
                )
              : (TAB_RENDERERS[tab] || TAB_RENDERERS.simulateur)()
          ),
          // Toast de retour rapide (points gagnés, confirmations) — ancré en haut, sous le header.
          toast && React.createElement("div", {
            className: "sabi-toast" + (toast.leaving ? " sabi-toast-leaving" : "") + " fixed left-1/2 z-[1200] px-4 py-2 rounded-full text-sm font-semibold shadow-lg",
            style: { top: 76, backgroundColor: COLORS.gold, color: COLORS.bg }
          }, toast.message),

          // FAB ouvert à tous (la contribution n'est plus réservée à owner/admin) —
          // accès rapide à "Publier", visible uniquement sur l'onglet Actualités.
          !loading && connexionOk && tab === "actualites" && React.createElement("button", {
            onClick: () => setTab("contribuer"),
            className: "sabi-fab absolute right-5 w-14 h-14 flex items-center justify-center text-2xl z-10",
            style: { color: COLORS.bg, bottom: 112 },
            "aria-label": "Publier une actualité"
          }, React.createElement(Icon, { name: "edit-2", size: 22 })),

          // Navigation — ancrée en bas de l'écran (comme la plupart des apps mobiles).
          // Masquée sur l'écran Profil, qui n'a pas de nav (voir bouton retour ci-dessus).
          !estProfil && React.createElement("div", { className: "sabi-nav-wrap" },
            React.createElement("nav", { className: "sabi-nav", "aria-label": "Navigation principale" },
              tabs.map((t, i) => {
                const active = activeBottom === t.id;
                // Le 3e onglet (Accueil) devient le bouton central surélevé, comme dans la maquette.
                if (i === 2) {
                  return React.createElement("button", { key: t.id, onClick: () => setTab(t.id), className: "sabi-nav-center", "aria-label": t.label },
                    React.createElement("div", { className: "sabi-nav-orb" + (active ? " actif" : "") },
                      React.createElement(Icon, { name: t.icon, size: 24, color: COLORS.bg })
                    ),
                    React.createElement("span", { style: { color: active ? COLORS.gold : COLORS.textFaint } }, t.label)
                  );
                }
                return React.createElement("button", { key: t.id, onClick: () => setTab(t.id), className: "sabi-nav-item" },
                  React.createElement("div", { className: "sabi-nav-chip" + (active ? " actif" : "") },
                    React.createElement(Icon, { name: t.icon, size: 19, color: active ? COLORS.gold : COLORS.textFaint })
                  ),
                  React.createElement("span", { style: { color: active ? COLORS.gold : COLORS.textFaint } }, t.label)
                );
              })
            )
          )
        ),
        React.createElement(EmpileNotifs, null),
        React.createElement(MenuLateral, {
          ouvert: menuOuvert, onFermer: () => setMenuOuvert(false),
          themeMode: themeMode, onToggleTheme: handleToggleTheme, onChoisirTheme: handleChoisirTheme,
          notifsActives: notifsActivesState, onToggleNotifs: handleToggleNotifs,
          onOuvrirAssistance: () => setTab("assistance"),
          onOuvrirCredits: () => { setMenuOuvert(false); setCreditsOuverts(true); },
          onOuvrirGuide: () => { setMenuOuvert(false); setGuideOuvert(true); }
        }),
        React.createElement(CreditsModal, {
          ouvert: creditsOuverts, onFermer: () => setCreditsOuverts(false),
          onOuvrirAssistance: () => setTab("assistance")
        }),
        React.createElement(GuideModal, {
          ouvert: guideOuvert, onFermer: () => setGuideOuvert(false)
        })
      );
    }
