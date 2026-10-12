// Fichier issu du découpage de l'ancien index.html (migration vers un projet React/Vite).


    // ========== DONNÉES DE RÉFÉRENCE ==========
    const FILIERES_BASE = [
      "Maintenance Industrielle et Productique (MIP)",
      "Génie Électrique",
      "Génie Civil (GC)",
      "Génie Thermique, Énergie et Environnement (GTEE)",
      "Génie Télécommunications et Réseaux (GTR)",
      "Génie Informatique (GI)",
      "Mécatronique Automobile (MKA)",
      "Gestion des Entreprises et des Administrations (GEA)",
      "Ingénierie Biomédicale (IBM)",
      "Énergie Solaire (ESO)",
      "Énergie Éolienne (EEO)",
      "Énergie Hydroélectrique (EMY)",
      "Énergie Biomasse (EBM)",
      "Ingénierie des Technologies de l'Eau (ITE)",
    ];
    // Génie Électrique ne se scinde plus en options distinctes en 2ème année (Automatique et
    // Informatique Industrielle / Électrotechnique retirées à la demande de Bryan) — même liste
    // de filières quelle que soit l'année désormais, plus de distinction par niveau.
    export function getFilieresPourAnnee(annee) {
      return FILIERES_BASE;
    }
    // Liste de repli utilisée là où le niveau n'est pas connu (filtres globaux, etc.)
    export const FILIERES = FILIERES_BASE;

    // Référentiel des UE/cours par filière — sert à : pré-remplir le Simulateur avec les vraies UE,
    // proposer une liste de matières lors de la publication d'une épreuve, et aider l'IA à reconnaître
    // les noms de matière lors de l'extraction d'une feuille de notes photographiée (babillard).
    // Génie Électrique, Année 1 : construit à partir du relevé de programme fourni par un étudiant.
    // Crédits vérifiés au niveau UE pour les deux semestres (la somme fait bien 30 dans chaque cas,
    // comme indiqué sur le document officiel). Les sous-cours (champ "cours") ont un code et un nom
    // fiables, mais PAS de crédit propre : les chiffres à ce niveau sur le document ne s'additionnent
    // pas proprement avec le total de l'UE (ce sont probablement des poids internes, pas des crédits
    // indépendants) — je préfère les laisser de côté plutôt que d'afficher un chiffre trompeur.
    export const CURRICULUM = {
      "Génie Électrique": {
        "Année 1": {
          "Semestre 1": [
            { code: "GEL111", nom: "Mathématiques I", credit: 8, cours: [
              { code: "ANA1111", nom: "Analyse I" },
              { code: "ALG1112", nom: "Algèbre" },
            ] },
            { code: "GEL121", nom: "Disciplines Ancillaires I", credit: 4, cours: [
              { code: "ETD1211", nom: "Éthiques et Développement" },
              { code: "ETP1212", nom: "Éthiques et Philosophie" },
              { code: "ETL1213", nom: "Éthiques Droits et Libertés" },
              { code: "EXB1214", nom: "Expression Bilingue I" },
            ] },
            { code: "GEL131", nom: "Physique", credit: 5, cours: [
              { code: "PHY1311", nom: "Physique" },
              { code: "BAE1312", nom: "Bases de l'Électricité" },
            ] },
            { code: "GEL141", nom: "Electronique I et Technologie de Base", credit: 6, cours: [
              { code: "CIE1411", nom: "Circuits électriques" },
              { code: "DES1412", nom: "Technologie Générale et Dessin" },
            ] },
            { code: "GEL151", nom: "Bases de l'électronique numérique", credit: 4, cours: [
              { code: "ALB1511", nom: "Algèbre de Boole" },
              { code: "ALB1512", nom: "Circuits Logiques" },
            ] },
            { code: "GEL161", nom: "Informatique I et TP", credit: 3, cours: [
              { code: "INF1611", nom: "Informatique I" },
              { code: "INF1612", nom: "TP Informatique I" },
            ] },
          ],
          "Semestre 2": [
            { code: "GEL112", nom: "Mathématiques II & Pratiques de Mesures", credit: 8, cours: [
              { code: "ANA1121", nom: "Analyse II" },
              { code: "TPM1122", nom: "TP Technique de Mesures Électriques" },
            ] },
            { code: "GEL122", nom: "Disciplines Ancillaires II", credit: 3, cours: [
              { code: "EOE1221", nom: "Économie et Organisation des Entreprises (E.O.E.)" },
              { code: "TEC1222", nom: "Technique de Communication I" },
            ] },
            { code: "GEL132", nom: "Electronique", credit: 8, cours: [
              { code: "ELB1321", nom: "Électronique de Base" },
              { code: "CIL1322", nom: "Circuits Linéaires" },
            ] },
            { code: "GEL142", nom: "Electrotechnique I", credit: 4, cours: [
              { code: "BME1421", nom: "Bases de Machines Électriques" },
              { code: "MAE1422", nom: "Machines Électriques I" },
            ] },
            { code: "GEL152", nom: "Electronique de Puissance", credit: 4, cours: [
              { code: "BEP1521", nom: "Bases de l'Electronique de Puissance" },
              { code: "EPU1522", nom: "Électronique de Puissance I" },
            ] },
            { code: "GEL162", nom: "Informatique II et TP", credit: 3, cours: [
              { code: "INF1621", nom: "Informatique II" },
              { code: "PIN1622", nom: "TP Informatique II" },
            ] },
          ],
        },
      },
      "Mécatronique Automobile (MKA)": {
        "Année 1": {
          "Semestre 1": [
            { code: "MKA111", nom: "Langues & Communication", credit: 5, cours: [
              { code: "ANT1111", nom: "Anglais Technique I" },
              { code: "ECS1112", nom: "Expression et Communication Scientifique et Technique" },
              { code: "ALL1113", nom: "Allemand I" },
            ] },
            { code: "MKA121", nom: "Mathématiques I", credit: 4, cours: [
              { code: "ANA1211", nom: "Analyse I" },
              { code: "AGE1212", nom: "Algèbre et Géométrie" },
            ] },
            { code: "MKA131", nom: "Informatique I", credit: 4, cours: [
              { code: "ISI1311", nom: "Introduction aux Systèmes Informatiques" },
              { code: "ALG1312", nom: "Algorithmique" },
            ] },
            { code: "MKA141", nom: "Physique", credit: 6, cours: [
              { code: "OGO1411", nom: "Optique Géométrique et Ondulatoire" },
              { code: "MGE1412", nom: "Mécanique Générale I" },
              { code: "ETM1413", nom: "Électromagnétisme" },
            ] },
            { code: "MKA151", nom: "Dessin & Électrotechnique I", credit: 4, cours: [
              { code: "DET1511", nom: "Dessin Technique I" },
              { code: "EEG1512", nom: "Électrotechnique I et Électricité Générale" },
            ] },
            { code: "MKA161", nom: "Technologie Automobile I", credit: 7, cours: [
              { code: "DVA1611", nom: "Développement du Véhicule Automobile" },
              { code: "SFG1612", nom: "Structure et Fonctionnement du Groupe Moto-Propulseur (GMP)" },
              { code: "OCC1613", nom: "Organes de Châssis / Carrosserie" },
            ] },
          ],
          "Semestre 2": [
            { code: "MKA212", nom: "Mathématiques II", credit: 4, cours: [
              { code: "MAT2121", nom: "Analyse II" },
              { code: "MAT2122", nom: "Statistiques / Probabilités" },
            ] },
            { code: "MKA222", nom: "Informatique II", credit: 4, cours: [
              { code: "PPDT2221", nom: "Programmation, Programmation Digitale Technique et TP" },
              { code: "DIA2222", nom: "Développement de l'Informatique Automobile" },
            ] },
            { code: "MKA232", nom: "Électronique I", credit: 4, cours: [
              { code: "GMP2321", nom: "Bases de l'Électronique Générale" },
              { code: "GMP2322", nom: "Bases de l'Électronique Numérique et TP" },
            ] },
            { code: "MKA242", nom: "Dessin & Construction", credit: 8, cours: [
              { code: "GMP2421", nom: "Dessin Technique II et Géométrie Descriptive" },
              { code: "GMP2422", nom: "Méthodologie de Construction" },
              { code: "GMP2423", nom: "Introduction aux Éléments de Machine" },
            ] },
            { code: "MKA252", nom: "Mécanique & CAO", credit: 8, cours: [
              { code: "GMP2521", nom: "Mécanique Générale II" },
              { code: "GMP2522", nom: "Notions de Base en CAO/DAO/CFAO" },
              { code: "GMP2523", nom: "RDM. Résistance des Matériaux" },
            ] },
            { code: "MKA262", nom: "Stage", credit: 2, cours: [
              { code: "GMP2621", nom: "Stage Ouvrier" },
            ] },
          ],
        },
      },
      "Énergie Solaire (ESO)": {
        "Année 1": {
          "Semestre 1": [
            { code: "ESO111", nom: "Mathématiques I", credit: 4, cours: [
              { code: "ANA1111", nom: "Analyse I" },
              { code: "ALG1112", nom: "Algèbre" },
            ] },
            { code: "ESO121", nom: "Disciplines Ancillaires I", credit: 5, cours: [
              { code: "ETD1211", nom: "Éthique et Développement" },
              { code: "ETP1212", nom: "Éthique et Philosophie" },
              { code: "ETL1213", nom: "Éthique et Propriété Intellectuelle" },
              { code: "EXB1214", nom: "Expression Bilingue I" },
            ] },
            { code: "ESO131", nom: "Bases de l'Électricité et de l'Électronique I", credit: 12, cours: [
              { code: "BAE1311", nom: "Bases de l'Électronique" },
              { code: "BEL1312", nom: "Bases de l'Électricité" },
              { code: "BET1313", nom: "Bases de l'Électrotechnique" },
              { code: "CIE1314", nom: "Circuits Électriques" },
              { code: "TPC1315", nom: "TP Circuits Électriques" },
            ] },
            { code: "ESO141", nom: "Bases de la Thermique I", credit: 4, cours: [
              { code: "THE1411", nom: "Thermodynamique" },
              { code: "TTH1412", nom: "Transferts Thermiques" },
            ] },
            { code: "ESO151", nom: "Bases du Dessin", credit: 5, cours: [
              { code: "DTE1511", nom: "Dessin Technique" },
              { code: "CAD1512", nom: "CAO/DAO" },
              { code: "TPD1513", nom: "TP CAO/DAO" },
            ] },
          ],
          "Semestre 2": [
            { code: "ESO112", nom: "Mathématiques II", credit: 4, cours: [
              { code: "ANA1121", nom: "Analyse II" },
              { code: "PST1122", nom: "Probabilités et Statistiques" },
            ] },
            { code: "ESO122", nom: "Disciplines Ancillaires II", credit: 4, cours: [
              { code: "EOE1221", nom: "Économie et Organisation des Entreprises" },
              { code: "CCO1222", nom: "Culture et Communication" },
            ] },
            { code: "ESO132", nom: "Énergies Renouvelables", credit: 4, cours: [
              { code: "IER1321", nom: "Introduction aux Énergies Renouvelables et Enjeux Énergétiques" },
              { code: "MTE1322", nom: "Météorologie et Technologies des Énergies Renouvelables" },
            ] },
            { code: "ESO142", nom: "Bases de la Thermique II", credit: 6, cours: [
              { code: "MEF1421", nom: "Mécanique des Fluides" },
              { code: "TBA1422", nom: "Thermique du Bâtiment" },
              { code: "MTH1423", nom: "Métrologie Thermique" },
            ] },
            { code: "ESO152", nom: "Bases de l'Informatique I", credit: 6, cours: [
              { code: "AOS1521", nom: "Architecture des Ordinateurs et Systèmes d'Exploitation" },
              { code: "APC1522", nom: "Algorithme et Programmation C" },
              { code: "TPI1523", nom: "TP Informatique I" },
            ] },
            { code: "ESO162", nom: "Bases de la Physique I", credit: 6, cours: [
              { code: "MEP1621", nom: "Mécanique du Point" },
              { code: "MES1622", nom: "Mécanique du Solide" },
              { code: "OPG1623", nom: "Optique Géométrique" },
            ] },
          ],
        },
      },
      "Énergie Éolienne (EEO)": {
        "Année 1": {
          "Semestre 1": [
            { code: "EEO111", nom: "Mathématiques I", credit: 4, cours: [
              { code: "ANA1111", nom: "Analyse I" },
              { code: "ALG1112", nom: "Algèbre" },
            ] },
            { code: "EEO121", nom: "Disciplines Ancillaires I", credit: 5, cours: [
              { code: "ETD1211", nom: "Éthique et Développement" },
              { code: "ETP1212", nom: "Éthique et Philosophie" },
              { code: "ETL1213", nom: "Éthique et Propriété Intellectuelle" },
              { code: "EXB1214", nom: "Expression Bilingue I" },
            ] },
            { code: "EEO131", nom: "Bases de l'Électricité et de l'Électronique I", credit: 12, cours: [
              { code: "BAE1311", nom: "Bases de l'Électronique" },
              { code: "BEL1312", nom: "Bases de l'Électricité" },
              { code: "BET1313", nom: "Bases de l'Électrotechnique" },
              { code: "CIE1314", nom: "Circuits Électriques" },
              { code: "TPC1315", nom: "TP Circuits Électriques" },
            ] },
            { code: "EEO141", nom: "Bases de la Thermique I", credit: 4, cours: [
              { code: "THE1411", nom: "Thermodynamique" },
              { code: "TTH1412", nom: "Transferts Thermiques" },
            ] },
            { code: "EEO151", nom: "Bases du Dessin", credit: 5, cours: [
              { code: "DTE1511", nom: "Dessin Technique" },
              { code: "CAD1512", nom: "CAO/DAO" },
              { code: "TPD1513", nom: "TP CAO/DAO" },
            ] },
          ],
        },
      },
      "Énergie Hydroélectrique (EMY)": {
        "Année 1": {
          "Semestre 1": [
            { code: "EHY111", nom: "Mathématiques I", credit: 4, cours: [
              { code: "ANA1111", nom: "Analyse I" },
              { code: "ALG1112", nom: "Algèbre" },
            ] },
            { code: "EHY121", nom: "Disciplines Ancillaires I", credit: 5, cours: [
              { code: "ETD1211", nom: "Éthique et Développement" },
              { code: "ETP1212", nom: "Éthique et Philosophie" },
              { code: "ETL1213", nom: "Éthique et Propriété Intellectuelle" },
              { code: "EXB1214", nom: "Expression Bilingue I" },
            ] },
            { code: "EHY131", nom: "Bases de l'Électricité et de l'Électronique I", credit: 12, cours: [
              { code: "BAE1311", nom: "Bases de l'Électronique" },
              { code: "BEL1312", nom: "Bases de l'Électricité" },
              { code: "BET1313", nom: "Bases de l'Électrotechnique" },
              { code: "CIE1314", nom: "Circuits Électriques" },
              { code: "TPC1315", nom: "TP Circuits Électriques" },
            ] },
            { code: "EHY141", nom: "Bases de la Thermique I", credit: 4, cours: [
              { code: "THE1411", nom: "Thermodynamique" },
              { code: "TTH1412", nom: "Transferts Thermiques" },
            ] },
            { code: "EHY151", nom: "Bases du Dessin", credit: 5, cours: [
              { code: "DTE1511", nom: "Dessin Technique" },
              { code: "CAD1512", nom: "CAO/DAO" },
              { code: "TPD1513", nom: "TP CAO/DAO" },
            ] },
          ],
        },
      },
      "Énergie Biomasse (EBM)": {
        "Année 1": {
          "Semestre 1": [
            { code: "BIO111", nom: "Mathématiques I", credit: 4, cours: [
              { code: "ANA1111", nom: "Analyse I" },
              { code: "ALG1112", nom: "Algèbre" },
            ] },
            { code: "BIO121", nom: "Disciplines Ancillaires I", credit: 5, cours: [
              { code: "ETD1211", nom: "Éthique et Développement" },
              { code: "ETP1212", nom: "Éthique et Philosophie" },
              { code: "ETL1213", nom: "Éthique et Propriété Intellectuelle" },
              { code: "EXB1214", nom: "Expression Bilingue I" },
            ] },
            { code: "BIO131", nom: "Bases de l'Électricité et de l'Électronique I", credit: 12, cours: [
              { code: "BAE1311", nom: "Bases de l'Électronique" },
              { code: "BEL1312", nom: "Bases de l'Électricité" },
              { code: "BET1313", nom: "Bases de l'Électrotechnique" },
              { code: "CIE1314", nom: "Circuits Électriques" },
              { code: "TPC1315", nom: "TP Circuits Électriques" },
            ] },
            { code: "BIO141", nom: "Bases de la Thermique I", credit: 4, cours: [
              { code: "THE1411", nom: "Thermodynamique" },
              { code: "TTH1412", nom: "Transferts Thermiques" },
            ] },
            { code: "BIO151", nom: "Bases du Dessin", credit: 5, cours: [
              { code: "DTE1511", nom: "Dessin Technique" },
              { code: "CAD1512", nom: "CAO/DAO" },
              { code: "TPD1513", nom: "TP CAO/DAO" },
            ] },
          ],
        },
      },
      "Génie Télécommunications et Réseaux (GTR)": {
        "Année 1": {
          "Semestre 1": [
            { code: "GTR111", nom: "Analyse et Algèbre", credit: 6, cours: [
              { code: "ANA1111", nom: "Analyse 1" },
              { code: "ALG1112", nom: "Algèbre" },
            ] },
            { code: "GTR121", nom: "Physique", credit: 5, cours: [
              { code: "FPH1211", nom: "Fondamentaux de Physique" },
              { code: "ECE1212", nom: "Électromagnétisme et CEM" },
              { code: "OPT1213", nom: "Optique Géométrique" },
            ] },
            { code: "GTR131", nom: "Formation Ancillaire 1", credit: 7, cours: [
              { code: "TCF1311", nom: "Techniques de Communication Française 1" },
              { code: "TCA1312", nom: "Techniques de Communication Anglaise 1" },
              { code: "EPH1313", nom: "Éthique et Philosophie" },
              { code: "EDE1314", nom: "Éthique et Développement" },
              { code: "EDL1315", nom: "Éthique, Droits et Libertés" },
            ] },
            { code: "GTR141", nom: "Circuits Électriques", credit: 4, cours: [
              { code: "CEL1411", nom: "Circuits Électriques" },
              { code: "TPM1412", nom: "TP Mesures Électriques et Instrumentation" },
            ] },
            { code: "GTR151", nom: "Électronique de Base et Algèbre de Boole", credit: 3, cours: [
              { code: "EBA1511", nom: "Électronique de Base" },
              { code: "ALB1512", nom: "Algèbre de Boole" },
            ] },
            { code: "GTR161", nom: "Informatique", credit: 5, cours: [
              { code: "IIN1611", nom: "Introduction à l'Informatique" },
              { code: "APR1612", nom: "Algorithme et Programmation" },
              { code: "TPI1613", nom: "TP Informatique 1" },
            ] },
          ],
          "Semestre 2": [
            { code: "GTR112", nom: "Mathématiques 1", credit: 6, cours: [
              { code: "MNU1121", nom: "Méthodes Numériques" },
              { code: "ANA1122", nom: "Analyse 2" },
              { code: "PST1123", nom: "Probabilités et Statistiques" },
            ] },
            { code: "GTR122", nom: "Concepts Généraux des Réseaux", credit: 3, cours: [
              { code: "CGR1221", nom: "Concepts Généraux des Réseaux" },
              { code: "CGR1222", nom: "TP Concepts Généraux des Réseaux" },
            ] },
            { code: "GTR132", nom: "Électronique 2", credit: 6, cours: [
              { code: "FEL1321", nom: "Fonctions Électroniques" },
              { code: "TPF1322", nom: "TP Fonctions Électroniques" },
              { code: "SSY1323", nom: "Signaux et Systèmes" },
            ] },
            { code: "GTR142", nom: "Architecture et Électronique Numérique", credit: 4, cours: [
              { code: "CIL1421", nom: "Circuits Logiques" },
              { code: "AOM1422", nom: "Architecture des Ordinateurs et Micro Contrôleurs" },
            ] },
            { code: "GTR152", nom: "Systèmes d'Exploitation et Programmation WEB", credit: 5, cours: [
              { code: "SEX1521", nom: "Systèmes d'Exploitation" },
              { code: "TPW1522", nom: "TP Programmation WEB" },
              { code: "TPS1523", nom: "TP Systèmes d'Exploitation" },
            ] },
            { code: "GTR162", nom: "Réseaux de Télécoms et Modulations", credit: 6, cours: [
              { code: "IRT1621", nom: "Introduction aux Réseaux de Télécoms" },
              { code: "TTA1622", nom: "Techniques de Transmission Analogique" },
            ] },
          ],
        },
        "Année 2": {
          "Semestre 1": [
            { code: "GTR213", nom: "Techniques de Communication 2", credit: 4, cours: [
              { code: "MRR2131", nom: "Méthodologie de Rédaction de Rapport" },
              { code: "TCA2132", nom: "Techniques de Communication Anglaise 2" },
            ] },
            { code: "GTR223", nom: "Formation Ancillaire 2", credit: 5, cours: [
              { code: "DET2231", nom: "Droit et Économie des Télécoms" },
              { code: "EOE2232", nom: "Économie et Organisation des Entreprises" },
              { code: "ECE2233", nom: "Entreprenariat et Création d'Entreprise" },
            ] },
            { code: "GTR233", nom: "Système d'Information et Bases de Données", credit: 5, cours: [
              { code: "SIN2331", nom: "Système d'Information" },
              { code: "BDO2332", nom: "Bases de Données" },
            ] },
            { code: "GTR243", nom: "TP Réseaux et Protocoles de Communication", credit: 5, cours: [
              { code: "TPR2431", nom: "TP Réseaux" },
              { code: "PCO2432", nom: "Protocoles de Communications" },
            ] },
            { code: "GTR253", nom: "Réseaux Sans Fils et Routage", credit: 4, cours: [
              { code: "RCO2531", nom: "Routage et Commutation" },
              { code: "RSF2532", nom: "Réseaux Sans Fils" },
            ] },
            { code: "GTR263", nom: "Antennes et Transmissions", credit: 7, cours: [
              { code: "ANT2631", nom: "Antennes" },
              { code: "TTN2632", nom: "Techniques de Transmissions Numériques" },
              { code: "STR2633", nom: "Les Supports de Transmissions" },
            ] },
          ],
          "Semestre 2": [
            { code: "GTR214", nom: "Électronique et Télécommunication", credit: 6, cours: [
              { code: "TEL2141", nom: "Téléphonie (RTC-VOIP/TOIP)" },
              { code: "ETE2142", nom: "Électronique pour Télécoms" },
              { code: "TPE2143", nom: "TP Électronique pour Télécoms" },
            ] },
            { code: "GTR224", nom: "Administration et Sécurité des Réseaux", credit: 5, cours: [
              { code: "ASR2241", nom: "Administration et Sécurité des Réseaux" },
              { code: "TPR2243", nom: "TP Administration et Sécurité des Réseaux" },
            ] },
            { code: "GTR234", nom: "Téléphonie Mobile et Sécurité", credit: 5, cours: [
              { code: "CRS2341", nom: "Cryptographie et Sécurité des Systèmes de Télécommunication" },
              { code: "TMO2342", nom: "Téléphonie Mobile" },
            ] },
            { code: "GTR244", nom: "Communications Optiques et Spatiales", credit: 6, cours: [
              { code: "COP2441", nom: "Communications Optiques" },
              { code: "CSP2442", nom: "Communications Spatiales" },
              { code: "CGT2443", nom: "TP Télécoms" },
            ] },
            { code: "GTR254", nom: "Intelligence Artificielle et Cybersécurité", credit: 4, cours: [
              { code: "IIA2541", nom: "Introduction à l'Intelligence Artificielle" },
              { code: "ICY2542", nom: "Introduction à la Cybersécurité" },
            ] },
            { code: "GTR264", nom: "Stage Professionnel", credit: 4, cours: [
              { code: "STA2641", nom: "Stage Professionnel" },
            ] },
          ],
        },
      },
      "Génie Informatique (GI)": {
        "Année 1": {
          "Semestre 1": [
            { code: "GIN111", nom: "Analyse Mathématique et Algèbre Linéaire", credit: 6, cours: [
              { code: "ANM1111", nom: "Analyse Mathématique" },
              { code: "ALL1112", nom: "Algèbre Linéaire" },
            ] },
            { code: "GIN121", nom: "Langues, Communication et Économie", credit: 6, cours: [
              { code: "ANT1211", nom: "Anglais Technique 1 (ou Français)" },
              { code: "TEC1212", nom: "Technique de Communication 1" },
              { code: "EOE1213", nom: "Économie et Organisation des Entreprises" },
            ] },
            { code: "GIN131", nom: "Matériel, Logiciels, Réseaux et Algèbre de Boole", credit: 6, cours: [
              { code: "MLR1311", nom: "Matériels, Logiciels et Réseaux" },
              { code: "ALB1312", nom: "Algèbre de Boole et des Circuits" },
            ] },
            { code: "GIN141", nom: "Algorithmique et Langages de Programmation I", credit: 6, cours: [
              { code: "ALG1411", nom: "Algorithmique 1" },
              { code: "LAP1412", nom: "Langages de Programmation 1 (C)" },
            ] },
            { code: "GIN151", nom: "Projet de Programmation, Système d'Information et Multimédia", credit: 6, cours: [
              { code: "PRP1511", nom: "Projet de Programmation 1" },
              { code: "SYI1512", nom: "Système d'Information 1" },
              { code: "TDM1513", nom: "Traitement des Données Multimédia" },
            ] },
            { code: "GIN161", nom: "Physique Générale et Mécanique", credit: 0, cours: [
              { code: "PHG1611", nom: "Physique Générale 1" },
              { code: "MEC1612", nom: "Mécanique 1" },
            ] },
          ],
          "Semestre 2": [
            { code: "GIN112", nom: "Comptabilité et Relations et Graphes", credit: 5, cours: [
              { code: "CFA1121", nom: "Comptabilité Financière et Analytique" },
              { code: "REG1122", nom: "Relations et Graphes" },
            ] },
            { code: "GIN122", nom: "Droit et Éthique", credit: 5, cours: [
              { code: "DTS1221", nom: "Droit de Travail et des Sociétés" },
              { code: "EDL1222", nom: "Éthique et Développement" },
              { code: "EDL1223", nom: "Éthique et Philosophie" },
              { code: "EDL1224", nom: "Droit et Libertés" },
            ] },
            { code: "GIN132", nom: "Réseaux, Introduction à l'IoT et à la Cyber-Sécurité", credit: 6, cours: [
              { code: "REF1321", nom: "Réseaux Fondamentaux (ccnaRS1)" },
              { code: "IOT1322", nom: "Introduction à l'IoT" },
              { code: "ICS1323", nom: "Introduction à la CyberSécurité" },
            ] },
            { code: "GIN142", nom: "Architecture d'Ordinateurs et Électricité Pratique", credit: 4, cours: [
              { code: "ARO1421", nom: "Architectures des Ordinateurs" },
              { code: "ELP1422", nom: "Électricité Pratique" },
            ] },
            { code: "GIN152", nom: "Algorithmique et Langages de Programmation II", credit: 6, cours: [
              { code: "ALG1521", nom: "Algorithmique 2" },
              { code: "LAP1522", nom: "Langages de Programmation 2 (C et Python)" },
            ] },
            { code: "GIN162", nom: "Projet de Programmation et Bases de Données", credit: 4, cours: [
              { code: "PRP1621", nom: "Projet de Programmation 2" },
              { code: "BAD1622", nom: "Bases de Données 1" },
            ] },
          ],
        },
        "Année 2": {
          "Semestre 1": [
            { code: "GIN213", nom: "Probabilités, Statistiques et Analyse Numérique", credit: 6, cours: [
              { code: "PRS2131", nom: "Probabilités Statistiques et Traitement de Données" },
              { code: "ANN2312", nom: "Analyse Numérique" },
            ] },
            { code: "GIN223", nom: "Langues et Communication", credit: 4, cours: [
              { code: "ANT2231", nom: "Anglais Technique 2 (ou Français)" },
              { code: "TE2232", nom: "Technique de Communication 2" },
            ] },
            { code: "GIN233", nom: "Modélisation et Programmation Orientée Objets", credit: 5, cours: [
              { code: "IMU2331", nom: "Introduction à la Modélisation Objet (UML)" },
              { code: "POJ2332", nom: "Programmation Orientée Objets" },
            ] },
            { code: "GIN243", nom: "Développements Web et Client-Serveur", credit: 4, cours: [
              { code: "DEW2431", nom: "Développement Web/Internet" },
              { code: "SCS2432", nom: "Systèmes Répartis et Client Serveur" },
            ] },
            { code: "ISR253", nom: "Système d'Exploitation et Télécommunications (option ISR)", credit: 5, cours: [
              { code: "TSE2531", nom: "Technique des Systèmes d'Exploitation" },
              { code: "BAT2532", nom: "Bases des Télécommunications" },
            ] },
            { code: "GEL253", nom: "Système d'Exploitation et Ingénierie de Logiciels (option GL)", credit: 5, cours: [
              { code: "PIL2532", nom: "Pratique de l'Ingénierie des Logiciels" },
            ] },
            { code: "ISR263", nom: "Routage, Commutation et Électronique Numérique (option ISR)", credit: 6, cours: [
              { code: "ROC2631", nom: "Routage et Commutation (ccnaRS2)" },
              { code: "ENA2632", nom: "Électronique Numérique et Analogique" },
            ] },
            { code: "GEL263", nom: "Systèmes d'Information et Bases de Données (option GL)", credit: 6, cours: [
              { code: "SYI2631", nom: "Système d'Information 2" },
              { code: "BAD2632", nom: "Bases de Données 2" },
            ] },
            { code: "GIN273", nom: "Informatique Scientifique I", credit: 0, cours: [
              { code: "THC2731", nom: "Théorie des Comportements" },
              { code: "IPF2732", nom: "Introduction à la Programmation Fonctionnelle" },
            ] },
          ],
          "Semestre 2": [
            { code: "GIN214", nom: "Programmation IoT et Applications Mobiles", credit: 5, cours: [
              { code: "PIT2141", nom: "Programmation IoT : Python ou C" },
              { code: "DAM2142", nom: "Développement d'Applications pour Terminaux Mobiles" },
            ] },
            { code: "GIN224", nom: "Entreprenariat, Gestion de Projets et Marketing", credit: 6, cours: [
              { code: "ECE2241", nom: "Entreprenariat & Création Entreprises 1" },
              { code: "GPP2242", nom: "Gestion et Planification de Projets" },
              { code: "MAR2243", nom: "Marketing 1" },
            ] },
            { code: "ISR234", nom: "Réseaux Sans Fil et Cybersécurité (option ISR)", credit: 4, cours: [
              { code: "RSI2341", nom: "Réseaux Sans Fil et Services Innovants" },
              { code: "FCS2342", nom: "Fondamentaux de Cyber-Sécurité" },
            ] },
            { code: "GEL234", nom: "Développement Multimédia, IHM et Qualité (option GL)", credit: 4, cours: [
              { code: "TMW2341", nom: "Développement Multimédia pour le Web" },
              { code: "IHQ2342", nom: "Interface Homme Machine et Assurance Qualité" },
            ] },
            { code: "ISR244", nom: "Réseaux à Grande Échelle et Architectures Mobiles (option ISR)", credit: 5, cours: [
              { code: "IRE2441", nom: "Introduction aux Réseaux à Grande Échelle et Protocoles (ccnaRS3)" },
              { code: "AMM2442", nom: "Architectures et Maintenance des Terminaux Mobiles" },
            ] },
            { code: "GEL244", nom: "Programmation Objet et Projet UML et C++ (option GL)", credit: 5, cours: [
              { code: "POC2441", nom: "Programmation Orientée Objet C++" },
              { code: "PUC2442", nom: "Projet de Synthèse : UML et C++ (ou Java)" },
            ] },
            { code: "GIN254", nom: "Stage et Projet de Synthèse", credit: 10, cours: [
              { code: "STI2541", nom: "Stage Industriel" },
              { code: "PFE2542", nom: "Projet de Fin d'Études" },
              { code: "MRR2543", nom: "Méthodologie de Rédaction de Rapports" },
            ] },
          ],
        },
        "Année 3": {
          "Semestre 1": [
            { code: "QSI315", nom: "Mathématiques et Cryptographie (option QSIR)", credit: 5, cours: [
              { code: "ANF3151", nom: "Analyse Fonctionnelle" },
              { code: "CRY3152", nom: "Cryptographie" },
            ] },
            { code: "QSI325", nom: "Langues, Communication et Droit (option QSIR)", credit: 6, cours: [
              { code: "ANT3251", nom: "Anglais Technique 3 (ou Français)" },
              { code: "TEC3252", nom: "Technique de Communication 3" },
              { code: "DIT3253", nom: "Droit de l'Informatique et des Télécoms" },
            ] },
            { code: "QSI335", nom: "Réseaux à Grande Échelle et Protocoles Multimédia (option QSIR)", credit: 5, cours: [
              { code: "REP3351", nom: "Réseaux à Grande Échelle et Protocoles (ccnaRS3)" },
              { code: "PMQ3352", nom: "Protocoles Multimédia et Qualité" },
            ] },
            { code: "QSI345", nom: "Cyber-Sécurité et Cloud (option QSIR)", credit: 5, cours: [
              { code: "CSO3451", nom: "Cyber-Sécurité Opérationnelle (ccnaCyberOps)" },
              { code: "CLC3452", nom: "Cloud Computing et Sécurité" },
            ] },
            { code: "QSI355", nom: "IoT, Big Data et Microprocesseurs (option QSIR)", credit: 4, cours: [
              { code: "IBD3551", nom: "IoT et Introduction au Big Data" },
              { code: "AME3651", nom: "Architectures Microprocesseurs Embarqués" },
            ] },
            { code: "QSI365", nom: "Java, Sécurité et Administration (option QSIR)", credit: 5, cours: [
              { code: "DJS3552", nom: "Développeur Java Sécurité" },
              { code: "LPS3652", nom: "Linux et Programmation Système" },
              { code: "ADS3653", nom: "Administration Système" },
            ] },
            { code: "QSI375", nom: "Informatique Scientifique II (option QSIR)", credit: 0, cours: [
              { code: "TLC3751", nom: "Théorie des Langages et Compilation" },
              { code: "IIA3752", nom: "Introduction à l'Intelligence Artificielle" },
              { code: "IPF3753", nom: "Introduction à la Programmation Fonctionnelle" },
            ] },
            { code: "SIA315", nom: "Mathématiques et Cryptographie (option SIAD)", credit: 5, cours: [
              { code: "ANF3151", nom: "Analyse Fonctionnelle" },
              { code: "CRY3152", nom: "Cryptographie" },
            ] },
            { code: "SIA325", nom: "Langues, Communication et Droit (option SIAD)", credit: 6, cours: [
              { code: "ANT3251", nom: "Anglais Technique 3 (ou Français)" },
              { code: "TEC3252", nom: "Technique de Communication 3" },
              { code: "DIT3253", nom: "Droit de l'Informatique et des Télécoms" },
            ] },
            { code: "SIA335", nom: "Réseaux à Grande Échelle et Protocoles Multimédia (option SIAD)", credit: 5, cours: [
              { code: "REP3351", nom: "Réseaux à Grande Échelle et Protocoles (ccnaRS3)" },
              { code: "PMQ3352", nom: "Protocoles Multimédia et Qualité" },
            ] },
            { code: "SIA345", nom: "Cloud, Systèmes Décisionnelles et Sécurité (option SIAD)", credit: 5, cours: [
              { code: "SDE3451", nom: "Systèmes Décisionnels et Entrepôt de Données I" },
              { code: "CLC3452", nom: "Cloud Computing et Sécurité" },
            ] },
            { code: "SIA355", nom: "IoT, Big Data et Microprocesseurs (option SIAD)", credit: 4, cours: [
              { code: "IBD3551", nom: "IoT et Introduction au Big Data" },
              { code: "DJS3552", nom: "Architectures Microprocesseurs Embarqués" },
            ] },
            { code: "SIA365", nom: "Java, Sécurité et Administration (option SIAD)", credit: 5, cours: [
              { code: "AME3651", nom: "Développeur Java Sécurité" },
              { code: "LPS3652", nom: "Linux et Programmation Système" },
              { code: "ADS3653", nom: "Administration Système" },
            ] },
            { code: "SIA375", nom: "Informatique Scientifique II (option SIAD)", credit: 0, cours: [
              { code: "TLC3751", nom: "Théorie des Langages et Compilation" },
              { code: "IIA3752", nom: "Introduction à l'Intelligence Artificielle" },
              { code: "IPF3753", nom: "Introduction à la Programmation Fonctionnelle" },
            ] },
            { code: "CDR315", nom: "Mathématiques et Cryptographie (option CDRI)", credit: 5, cours: [
              { code: "ANF3151", nom: "Analyse Fonctionnelle" },
              { code: "CRY3152", nom: "Cryptographie" },
            ] },
            { code: "CDR325", nom: "Langues, Communication et Droit (option CDRI)", credit: 6, cours: [
              { code: "ANT3251", nom: "Anglais Technique 3 (ou Français)" },
              { code: "TEC3252", nom: "Technique de Communication 3" },
              { code: "DIT3553", nom: "Droit de l'Informatique et des Télécoms" },
            ] },
            { code: "CDR335", nom: "Réseaux à Grande Échelle et Protocoles Multimédia (option CDRI)", credit: 5, cours: [
              { code: "REP3351", nom: "Réseaux à Grande Échelle et Protocoles (ccnaRS3)" },
              { code: "PMQ3352", nom: "Protocoles Multimédia et Qualité" },
            ] },
            { code: "CDR345", nom: "Cyber-Sécurité et Cloud (option CDRI)", credit: 5, cours: [
              { code: "MOU3451", nom: "Génie Logiciel, Conception Objet UML et IHM" },
              { code: "CLC3452", nom: "Cloud Computing et Sécurité" },
            ] },
            { code: "CDR355", nom: "IoT, Big Data et Microprocesseurs (option CDRI)", credit: 4, cours: [
              { code: "IBD3551", nom: "IoT et Introduction au Big Data" },
              { code: "DJS3552", nom: "Architectures Microprocesseurs Embarqués" },
            ] },
            { code: "CDR365", nom: "Java, Sécurité et Administration (option CDRI)", credit: 5, cours: [
              { code: "AME3651", nom: "Développeur Java Sécurité" },
              { code: "LPS3652", nom: "Linux et Programmation Système" },
              { code: "ADS3653", nom: "Administration Système" },
            ] },
            { code: "CDR375", nom: "Informatique Scientifique II (option CDRI)", credit: 0, cours: [
              { code: "TLC3751", nom: "Théorie des Langages et Compilation" },
              { code: "IIA3752", nom: "Introduction à l'Intelligence Artificielle" },
              { code: "IPF3753", nom: "Introduction à la Programmation Fonctionnelle" },
            ] },
          ],
          "Semestre 2": [
            { code: "QSI316", nom: "Technologies Web et Administration de SGBD (option QSIR)", credit: 4, cours: [
              { code: "LTW3161", nom: "Langages et Technologies Web Avancés" },
              { code: "ABS3162", nom: "Administration de BD et de SGBD Étendus" },
            ] },
            { code: "QSI326", nom: "Entreprenariat, Métrologie de la Qualité et QoS (option QSIR)", credit: 3, cours: [
              { code: "ECE3261", nom: "Entreprenariat & Création Entreprises 2" },
              { code: "MQM3262", nom: "Métrologie de la Qualité et Mise en Œuvre" },
              { code: "HDQ3263", nom: "Haute Disponibilité et QoS" },
            ] },
            { code: "QSI336", nom: "Interconnexion de Réseaux, Objets Connectés et Projet Pratique (option QSIR)", credit: 5, cours: [
              { code: "INR3361", nom: "Interconnexion de Réseaux (ccnaRS4)" },
              { code: "POC3362", nom: "Projet Pratique Objets Connectés et Applications Mobiles" },
            ] },
            { code: "QSI346", nom: "Administration et Sécurisation des Infrastructures Réseaux (option QSIR)", credit: 6, cours: [
              { code: "SIR3461", nom: "Sécurité Infrastructures Réseaux (ccnaSec)" },
              { code: "ASI3462", nom: "Administration et Sécurité des Services Internet" },
            ] },
            { code: "QSI356", nom: "Projet de Fin d'Études ou Stage Industriel (option QSIR)", credit: 12, cours: [
              { code: "PPP3561", nom: "Projet Personnel et Professionnel" },
              { code: "PRT3562", nom: "Projets Tutorés de Synthèse" },
              { code: "PFE3563", nom: "Projet de Fin d'Études / Stage Industriel" },
              { code: "MRR3564", nom: "Méthodologie de Rédaction de Rapports" },
            ] },
            { code: "SIA316", nom: "Technologies Web et Administration de SGBD (option SIAD)", credit: 4, cours: [
              { code: "LTW3161", nom: "Langages et Technologies Web Avancés" },
              { code: "ABS3162", nom: "Administration de BD et de SGBD Étendus" },
            ] },
            { code: "SIA326", nom: "Entreprenariat, Métrologie de la Qualité et QoS (option SIAD)", credit: 3, cours: [
              { code: "ECE3261", nom: "Entreprenariat & Création Entreprises 2" },
              { code: "MQM3262", nom: "Métrologie de la Qualité et Mise en Œuvre" },
              { code: "HDQ3263", nom: "Haute Disponibilité et QoS" },
            ] },
            { code: "SIA336", nom: "Interconnexion de Réseaux, Objets Connectés et Projet Pratique (option SIAD)", credit: 5, cours: [
              { code: "INR3361", nom: "Interconnexion de Réseaux (ccnaRS4)" },
              { code: "POC3362", nom: "Projet Pratique Objets Connectés et Applications Mobiles" },
              { code: "SDE3363", nom: "Systèmes Décisionnels et Entrepôt de Données II" },
            ] },
            { code: "SIA346", nom: "Administration et Sécurisation des Infrastructures Réseaux (option SIAD)", credit: 6, cours: [
              { code: "SIR3461", nom: "Sécurité Infrastructures Réseaux (ccnaSec)" },
              { code: "ASI3462", nom: "Administration et Sécurité des Services Internet" },
            ] },
            { code: "SIA356", nom: "Projet de Fin d'Études ou Stage Industriel (option SIAD)", credit: 12, cours: [
              { code: "PPP3561", nom: "Projet Personnel et Professionnel" },
              { code: "PRT3562", nom: "Projets Tutorés de Synthèse" },
              { code: "PFE3563", nom: "Projet de Fin d'Études / Stage Industriel" },
              { code: "MRR3564", nom: "Méthodologie de Rédaction de Rapports" },
            ] },
            { code: "CDR316", nom: "Technologies Web et Administration de SGBD (option CDRI)", credit: 4, cours: [
              { code: "LTW3161", nom: "Langages et Technologies Web Avancés" },
              { code: "ABS3162", nom: "Administration de BD et de SGBD Étendus" },
            ] },
            { code: "CDR326", nom: "Entreprenariat, Métrologie de la Qualité et QoS (option CDRI)", credit: 3, cours: [
              { code: "ECE3261", nom: "Entreprenariat & Création Entreprises 2" },
              { code: "MQM3262", nom: "Métrologie de la Qualité et Mise en Œuvre" },
              { code: "HDQ3263", nom: "Haute Disponibilité et QoS" },
            ] },
            { code: "CDR336", nom: "Interconnexion de Réseaux, Objets Connectés et Projet Pratique (option CDRI)", credit: 5, cours: [
              { code: "INR3361", nom: "Interconnexion de Réseaux (ccnaRS4)" },
              { code: "POC3362", nom: "Projet Pratique Objets Connectés et Applications Mobiles" },
              { code: "WEP3362", nom: "Web Mapping et Projet Client Serveur" },
            ] },
            { code: "CDR346", nom: "Administration et Sécurisation des Infrastructures Réseaux (option CDRI)", credit: 6, cours: [
              { code: "SIR3461", nom: "Sécurité Infrastructures Réseaux (ccnaSec)" },
              { code: "ASI3462", nom: "Administration et Sécurité des Services Internet" },
            ] },
            { code: "CDR356", nom: "Projet de Fin d'Études ou Stage Industriel (option CDRI)", credit: 12, cours: [
              { code: "PPP3561", nom: "Projet Personnel et Professionnel" },
              { code: "PRT3562", nom: "Projets Tutorés de Synthèse" },
              { code: "PFE3563", nom: "Projet de Fin d'Études / Stage Industriel" },
              { code: "MRR3564", nom: "Méthodologie de Rédaction de Rapports" },
            ] },
          ],
        },
      },
      "Maintenance Industrielle et Productique (MIP)": {
        "Année 1": {
          "Semestre 1": [
            { code: "MIP111", nom: "Langues et Communication", credit: 4, cours: [
              { code: "ANG1111", nom: "Expression Bilingue I" },
              { code: "ECS1112", nom: "Expression et Communication Scientifique et Technique" },
            ] },
            { code: "MIP121", nom: "Éthique, Droit et Économie", credit: 4, cours: [
              { code: "EDL1211", nom: "Éthique, Droit et Libertés" },
              { code: "ECO1212", nom: "Économie et Organisation des Entreprises" },
            ] },
            { code: "MIP131", nom: "Mathématiques et Informatique I", credit: 6, cours: [
              { code: "ANA1311", nom: "Analyse I" },
              { code: "AGE1312", nom: "Algèbre et Géométrie" },
              { code: "ISI1313", nom: "Introduction aux Systèmes Informatiques" },
            ] },
            { code: "MIP141", nom: "Électricité et Mécanique Générale", credit: 6, cours: [
              { code: "ELG1411", nom: "Électricité Générale" },
              { code: "MEC4142", nom: "Mécanique Générale" },
            ] },
            { code: "MIP151", nom: "Dessin et Organisation de la Maintenance", credit: 5, cours: [
              { code: "DMS1511", nom: "Dessin Mécanique et Schématisation" },
              { code: "COM1512", nom: "Concepts & Organisation de la Maintenance" },
            ] },
            { code: "MIP161", nom: "Électronique et Thermodynamique", credit: 5, cours: [
              { code: "GMP1561", nom: "Composants Électroniques et Fonctions de Base" },
              { code: "TMT1611", nom: "Thermodynamique et Modes de Transfert" },
            ] },
          ],
          "Semestre 2": [
            { code: "MIP212", nom: "Mathématiques et Mécanique des Fluides", credit: 6, cours: [
              { code: "MAT2121", nom: "Analyse II" },
              { code: "MAT2122", nom: "Statistiques / Probabilités" },
              { code: "GMP2123", nom: "Mécanique des Fluides" },
            ] },
            { code: "MIP222", nom: "Électrotechnique et Automatisme", credit: 4, cours: [
              { code: "GMP2221", nom: "Système Triphasé et Transformateurs" },
              { code: "GMP2222", nom: "Asservissements et Régulation" },
            ] },
            { code: "MIP232", nom: "Systèmes Industriels et Matériaux", credit: 5, cours: [
              { code: "GMP2321", nom: "Contrôle, Commande des Systèmes Industriels" },
              { code: "GMP2322", nom: "Propriétés des Matériaux" },
            ] },
            { code: "MIP242", nom: "Diagnostic et Organisation de la Maintenance", credit: 4, cours: [
              { code: "GMP2421", nom: "Avaries, Diagnostic et Détection" },
              { code: "GMP2422", nom: "Organisation et Méthodes de la Maintenance" },
            ] },
            { code: "MIP252", nom: "Conception et Fabrication Mécanique", credit: 9, cours: [
              { code: "GMP2521", nom: "Dessin Assisté par Ordinateur (DAO)" },
              { code: "GMP2522", nom: "Technologie de Construction" },
              { code: "GMP2523", nom: "Fabrication Mécanique 1" },
            ] },
            { code: "MIP262", nom: "Stage", credit: 2, cours: [
              { code: "GMP2621", nom: "Stage Ouvrier" },
            ] },
          ],
        },
      },
    };

    // Aplati les UE d'une filière/année/semestre en liste de "matières filantes"
    // (les sous-cours avec leur code officiel, ex: ANA1111 -> Analyse I) — sert à l'accès
    // rapide par matière dans l'onglet Épreuves : on choisit un code, on tombe directement
    // sur le PDF du sujet. Tant que le programme d'une filière n'est pas encore renseigné
    // dans CURRICULUM, la liste est simplement vide (pas d'erreur).
    export function matieresFilantes(filiere, annee, semestre) {
      const ues = CURRICULUM[filiere]?.[annee]?.[semestre] || [];
      return ues.flatMap(ue => (ue.cours || []).map(c => ({ code: c.code, nom: c.nom, ue: ue.nom })));
    }
