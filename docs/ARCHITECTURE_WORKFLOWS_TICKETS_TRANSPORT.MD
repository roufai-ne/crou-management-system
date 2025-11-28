# 🏗️ ARCHITECTURE & WORKFLOWS - Tickets Transport + Situations Journalières CROU

## 📐 Diagramme Architectural Global

```
┌──────────────────────────────────────────────────────────────────┐
│              MODULE TRANSPORT CROU - Architecture               │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│   EXISTANT (À préserver)          NOUVEAU (À ajouter)           │
│   ───────────────────             ───────────────────            │
│                                                                  │
│   ✅ Parc automobile        ──────► ❌ Gestion Tickets           │
│   ✅ Journal navettes       ──────► ❌ Situations journalières   │
│   ✅ Suivi carburant                                            │
│   ✅ Maintenance                                                │
│   ✅ Dashboard KPI                                              │
│                                                                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              BASE DE DONNÉES TRANSPORT                    │  │
│  ├──────────────────────────────────────────────────────────┤  │
│  │ Tables EXISTANTES :                                      │  │
│  │ • parc_automobile (bus, état, km, chauffeur)             │  │
│  │ • navettes (journal de bord quotidien)                   │  │
│  │ • consommation_carburant (suivi mensuel)                 │  │
│  │ • maintenance (opérations)                               │  │
│  │                                                          │  │
│  │ Tables À AJOUTER :                                       │  │
│  │ • circuits_transport                                     │  │
│  │ • tarifs_transport                                       │  │
│  │ • categories_tickets_transport                           │  │
│  │ • tickets_transport ⭐                                   │  │
│  │ • situations_journalieres_transport ⭐                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       FRONTEND LAYERS                             │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Pages à AJOUTER :                                               │
│  ├─ /transport/tickets/emettre          [Émission tickets]       │
│  ├─ /transport/tickets/historique       [Consultation]           │
│  └─ /transport/situations               [Situations jour]        │
│                                                                  │
│  Widgets à AJOUTER :                                             │
│  └─ Dashboard Transport [Navettes + Recettes + KPI]             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                       API REST ENDPOINTS                          │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  NOUVEAUX ENDPOINTS :                                            │
│  • POST   /api/transport/tickets                                │
│  • GET    /api/transport/tickets                                │
│  • PATCH  /api/transport/tickets/:id/valider                    │
│  • POST   /api/transport/situations/{date}/generer             │
│  • GET    /api/transport/situations                             │
│                                                                  │
│  ENDPOINTS EXISTANTS (à lire) :                                 │
│  • GET    /api/transport/parc-automobile                        │
│  • GET    /api/transport/navettes                               │
│  • GET    /api/transport/carburant                              │
│  • GET    /api/transport/maintenance                            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW 1 : Émission de Tickets (Détail complet)

```
[INTERFACE] Formulaire "Émettre Tickets"
│
│  Utilisateur saisi :
│  ├─ Date transport : 2025-04-24
│  ├─ Circuit : Centre → Campus
│  ├─ Type ticket : Régulier
│  └─ Quantité : 50
│
▼
[VALIDATION FRONTEND]
├─ Date valide & future/aujourd'hui
├─ Circuit sélectionné
├─ Quantité > 0
└─ Type ticket exists

▼ (Si erreur, afficher message)

[RÉCUPÉRATION TARIF]
│
│  GET /api/transport/tarifs?circuit_id=xxx&type_ticket=Régulier
│  └─ Retourne : prix_unitaire = 500 FCFA
│
│  Calcul : montant_total = 50 × 500 = 25,000 FCFA
│
▼
[AFFICHAGE CONFIRMATION]
│
│  ✓ Prix unitaire : 500 FCFA
│  ✓ Montant total : 25,000 FCFA
│  
│  [Annuler] [Confirmer Émission]

▼ (User clique [Confirmer])

[API CALL] POST /api/transport/tickets
│
│  Payload:
│  {
│    "circuit_id": "circuit_xyz",
│    "date_transport": "2025-04-24",
│    "categorie_id": "cat_regulier",
│    "quantite": 50,
│    "prix_unitaire": 500,
│    "emis_par": "user_123"
│  }
│
▼
[BACKEND PROCESSING]
│
│  1. Validation requête (acl, données)
│  2. Calculer montant_total = 50 × 500
│  3. Générer numero_serie_debut & numero_serie_fin
│     └─ Ex: DB.max_serie = 500 → new serie: 501-550
│  4. Créer record Ticket
│     ├─ statut = "Émis"
│     ├─ numero_serie_debut = 501
│     ├─ numero_serie_fin = 550
│     └─ timestamp = now()
│  5. Commit en BD
│  6. Logger action (audit trail)
│
▼
[RESPONSE SUCCESS]
│
│  {
│    "success": true,
│    "ticket_id": "ticket_abc123",
│    "numero_serie_debut": 501,
│    "numero_serie_fin": 550,
│    "montant_total": 25000,
│    "statut": "Émis",
│    "message": "50 tickets émis avec succès"
│  }
│
▼
[FRONTEND AFFICHAGE]
│
│  ✓ 50 tickets émis (#501-550)
│  Montant: 25,000 FCFA
│  Statut: À encaisser
│  
│  [Télécharger liste] [Continuer]

HISTORIQUE AUDIT
└─ User: Agent123, Action: Émettre tickets (50×Régulier, 25,000 FCFA)
   Date: 2025-04-24 14:30:15, Reference: ticket_abc123
```

---

## 🔄 WORKFLOW 2 : Génération Situation Journalière

```
TRIGGER : Minuit (automtique) OU Demande manuelle
│
│  Si manuel :
│  [User] Clique "Générer situation du 24/04"
│
▼
[API CALL] POST /api/transport/situations/2025-04-24/generer
│
▼
[BACKEND : AGRÉGATION DONNÉES]
│
│  1️⃣ NAVETTES DU JOUR
│  └─ GET local navettes WHERE date = 2025-04-24
│     ├─ nb_navettes = COUNT(*)
│     ├─ nb_vehicules = COUNT(DISTINCT vehicule_id)
│     ├─ total_passagers = SUM(nombre_passagers)
│     ├─ total_km = SUM(distance_km)
│     └─ total_carburant = SUM(carburant_consomme)
│
│  2️⃣ TICKETS DU JOUR
│  └─ GET local tickets WHERE date_transport = 2025-04-24
│     ├─ Par type ticket :
│     │  ├─ Régulier : 400 tickets
│     │  ├─ Étudiant : 350 tickets
│     │  ├─ Personnel : 100 tickets
│     │  └─ Gratuit : 0 tickets
│     ├─ tickets_emis = 850
│     └─ montant_total = 322,500 FCFA
│
│  3️⃣ CALCUL KPI
│  ├─ taux_remplissage_moyen
│  │  = (SUM(nombre_passagers) / SUM(capacite_vehicule)) × 100
│  │  = (850 / 1050) × 100 = 80.95% → 81%
│  │
│  ├─ taux_disponibilite_flotte
│  │  = (nb_vehicules_disponibles_cejour / total_parc) × 100
│  │  = (3 / 3) × 100 = 100%
│  │
│  ├─ cout_carburant_journalier
│  │  = total_carburant × prix_carburant_unitaire
│  │  = 47.3 L × 155.5 FCFA/L = 7,355 FCFA
│  │
│  └─ ponctualite_moyenne
│     = (nb_navettes_pontuellas / total_navettes) × 100
│     = (11 / 12) × 100 = 91.67% → 92%
│
│  4️⃣ DÉTECTION ANOMALIES
│  └─ Chercher anomalies dans navettes du jour :
│     ├─ Retards > 15 min ?
│     ├─ Dépassement carburant habituel ?
│     ├─ Basse disponibilité (<80%) ?
│     ├─ Remplissage critique (<50%) ?
│     └─ Véhicules en maintenance ?
│
│  5️⃣ CRÉATION RECORD SITUATION
│  └─ Insérer dans BD:
│     {
│       "date_situation": "2025-04-24",
│       "nombre_navettes": 12,
│       "nombre_vehicules_utilises": 3,
│       "total_passagers": 850,
│       "total_km": 187.5,
│       "total_carburant": 47.3,
│       "tickets_emis": 850,
│       "montant_recettes": 322500,
│       "taux_remplissage_moyen": 81,
│       "taux_disponibilite_flotte": 100,
│       "cout_carburant_journalier": 7355,
│       "ponctualite_moyenne": 92,
│       "nb_anomalies": 0,
│       "anomalies_detail": [],
│       "statut": "Validé"
│     }
│
▼
[RESPONSE]
│
│  {
│    "success": true,
│    "situation_id": "sit_20250424_xyz",
│    "date": "2025-04-24",
│    "summary": {
│      "navettes": 12,
│      "passagers": 850,
│      "recettes": 322500,
│      "kpi": {
│        "remplissage": 81,
│        "disponibilite": 100,
│        "ponctualite": 92
│      }
│    }
│  }
│
▼
[FRONTEND AFFICHAGE]
│
│  ✓ Situation journalière générée
│  
│  [Consulter détail] [Exporter PDF] [Exporter Excel]
```

---

## 📊 WORKFLOW 3 : Consultation Situation Journalière

```
[USER] Accède page Situations Journalières
│
│  Sélectionne date : [24/04/2025]
│  Clique [Charger]
│
▼
[API CALL] GET /api/transport/situations?date=2025-04-24
│
▼
[BACKEND RETOURNE]
│
│  {
│    "situation_id": "sit_20250424_xyz",
│    "date": "2025-04-24",
│    "navettes": {
│      "nombre": 12,
│      "vehicules_utilises": 3,
│      "passagers": 850,
│      "km_total": 187.5,
│      "carburant": 47.3
│    },
│    "tickets": {
│      "regulier": { "quantite": 400, "montant": 200000 },
│      "etudiant": { "quantite": 350, "montant": 87500 },
│      "personnel": { "quantite": 100, "montant": 35000 },
│      "gratuit": { "quantite": 0, "montant": 0 },
│      "total_montant": 322500
│    },
│    "kpi": {
│      "remplissage_percent": 81,
│      "disponibilite_percent": 100,
│      "cout_carburant": 7355,
│      "ponctualite_percent": 92,
│      "rendement_passagers_km": 4.53
│    },
│    "anomalies": []
│  }
│
▼
[FRONTEND AFFICHAGE TABLEAU]
│
│  ┌──────────────────────────────────────────┐
│  │ SITUATION JOURNALIÈRE - 24 Avril 2025    │
│  ├──────────────────────────────────────────┤
│  │                                          │
│  │ 📊 NAVETTES & FRÉQUENTATION             │
│  │ ├─ Navettes réalisées: 12               │
│  │ ├─ Véhicules utilisés: 3                │
│  │ ├─ Passagers transportés: 850           │
│  │ ├─ Distance totale: 187.5 km            │
│  │ └─ Carburant consommé: 47.3 L           │
│  │                                          │
│  │ 💰 RECETTES & TICKETS                    │
│  │ ├─ Tickets émis: 850                    │
│  │ │  ├─ Régulier (400): 200,000 FCFA      │
│  │ │  ├─ Étudiant (350): 87,500 FCFA       │
│  │ │  └─ Personnel (100): 35,000 FCFA      │
│  │ └─ Montant total: 322,500 FCFA          │
│  │                                          │
│  │ 📈 KPI JOURNALIER                        │
│  │ ├─ Taux remplissage: 81% ✓              │
│  │ ├─ Disponibilité flotte: 100% ✓         │
│  │ ├─ Ponctualité: 92% ✓                   │
│  │ ├─ Coût carburant: 7,355 FCFA           │
│  │ └─ Rendement: 4.53 pass./km             │
│  │                                          │
│  │ ⚠️ ANOMALIES: Aucune ✓                   │
│  │                                          │
│  │ [PDF] [Excel] [Imprimer]                │
│  └──────────────────────────────────────────┘
│
▼
[EXPORT PDF]
│
│  Appelé endpoint POST /api/transport/situations/sit_20250424_xyz/export-pdf
│  │
│  ├─ Utilise template PDF (jsPDF + html2canvas)
│  ├─ Ajoute : Logo MESRIT/CROU, En-têtes, Tableaux, Graphiques
│  ├─ Génère PDF en mémoire
│  └─ Retourne : fichier PDF téléchargeable
│
▼
[EXPORT EXCEL]
│
│  Appelé endpoint POST /api/transport/situations/sit_20250424_xyz/export-excel
│  │
│  ├─ Utilise SheetJS (xlsx)
│  ├─ Feuille 1 : Données brutes (tableaux)
│  ├─ Feuille 2 : Graphiques (si possible)
│  ├─ Feuille 3 : Synthèse (KPI)
│  └─ Retourne : fichier XLSX téléchargeable
```

---

## ⚙️ LOGIQUE DE CALCUL KPI (Détail)

### 1. Taux de Remplissage Moyen

```javascript
// Formule
taux_remplissage = (total_passagers_jour / capacite_totale_vehicules) × 100

// Exemple :
// Navette 1 : 45 passagers / 70 capacité = 64%
// Navette 2 : 38 passagers / 70 capacité = 54%
// Navette 3 : 50 passagers / 70 capacité = 71%
// ... (12 navettes total)
// 
// Moyenne = (64 + 54 + 71 + ...) / 12 = 81%

// Code
const calculateRemplissageMoyen = (navettes) => {
  const tauxParNavette = navettes.map(n => 
    (n.nombre_passagers / n.vehicule.capacite) * 100
  );
  return Math.round(tauxParNavette.reduce((a,b) => a+b, 0) / navettes.length);
};
```

### 2. Taux de Disponibilité de Flotte

```javascript
// Formule
disponibilite = (nb_vehicules_utilises_jour / total_parc) × 100

// Exemple :
// Parc total : 3 bus
// Utilisés jour : 3 bus
// Disponibilité = (3/3) × 100 = 100%

// Code
const calculateDisponibilite = async (date) => {
  const totalParc = await BD.parc.count();
  const navettesDay = await BD.navettes.distinct('vehicule_id')
    .where({ date_navette: date });
  
  return (navettesDay.length / totalParc) * 100;
};
```

### 3. Coût Carburant Journalier

```javascript
// Formule
cout_carburant = total_carburant_consomme × prix_carburant_unitaire

// Exemple :
// Carburant consommé : 47.3 L
// Prix unitaire (paramètre) : 155.5 FCFA/L
// Coût = 47.3 × 155.5 = 7,355 FCFA

// Code
const calculateCoutCarburant = async (date) => {
  const config = await BD.parametres_transport.findOne();
  const navettes = await BD.navettes.where({ date_navette: date });
  
  const totalLitres = navettes.reduce((sum, n) => 
    sum + n.carburant_consomme, 0);
  
  return totalLitres * config.prix_carburant_fcfa_par_litre;
};
```

### 4. Ponctualité Moyenne

```javascript
// Formule
ponctualite = (nb_navettes_ponctuelles / total_navettes) × 100
// Où "ponctuelle" = retard ≤ 15 minutes

// Exemple :
// Total navettes : 12
// Ponctuelles (retard ≤ 15min) : 11
// Ponctualité = (11/12) × 100 = 91.67% → 92%

// Code
const calculatePonctualite = (navettes) => {
  const seuilMinutes = 15;
  const ponctuelles = navettes.filter(n => 
    Math.abs(n.ponctualite_minutes) <= seuilMinutes
  );
  return (ponctuelles.length / navettes.length) * 100;
};
```

### 5. Rendement (Passagers/km)

```javascript
// Formule
rendement = total_passagers / total_km

// Exemple :
// Passagers : 850
// Km : 187.5
// Rendement = 850 / 187.5 = 4.53 passagers/km

// Code
const calculateRendement = (navettes) => {
  const totalPassagers = navettes.reduce((sum, n) => 
    sum + n.nombre_passagers, 0);
  const totalKm = navettes.reduce((sum, n) => 
    sum + n.distance_km, 0);
  
  return (totalPassagers / totalKm).toFixed(2);
};
```

---

## 🚨 DÉTECTION ANOMALIES

### Règles d'Alerte

```javascript
const detectAnomalies = (situation) => {
  const anomalies = [];
  
  // Alerte 1 : Remplissage très faible
  if (situation.taux_remplissage_moyen < 50) {
    anomalies.push({
      type: "REMPLISSAGE_FAIBLE",
      severity: "WARNING",
      message: `Remplissage faible (${situation.taux_remplissage_moyen}%)`
    });
  }
  
  // Alerte 2 : Disponibilité basse
  if (situation.taux_disponibilite_flotte < 80) {
    anomalies.push({
      type: "DISPONIBILITE_BASSE",
      severity: "CRITICAL",
      message: `Disponibilité critique (${situation.taux_disponibilite_flotte}%)`
    });
  }
  
  // Alerte 3 : Ponctualité mauvaise
  if (situation.ponctualite_moyenne < 80) {
    anomalies.push({
      type: "PONCTUALITE_MAUVAISE",
      severity: "WARNING",
      message: `Ponctualité dégradée (${situation.ponctualite_moyenne}%)`
    });
  }
  
  // Alerte 4 : Consommation carburant anormale
  const moyenneHisto = 7000; // FCFA (à calibrer)
  if (situation.cout_carburant > moyenneHisto * 1.2) {
    anomalies.push({
      type: "CARBURANT_ELEVE",
      severity: "WARNING",
      message: `Consommation élevée (${situation.cout_carburant} FCFA)`
    });
  }
  
  // Alerte 5 : Rendement suspect
  const seuil_min = 3; // passagers/km
  if (situation.rendement < seuil_min) {
    anomalies.push({
      type: "RENDEMENT_BAS",
      severity: "INFO",
      message: `Rendement bas (${situation.rendement} pass./km)`
    });
  }
  
  return anomalies;
};
```

---

## 🔗 INTÉGRATION AVEC MODULE EXISTANT

### Points de Lecture (API GET)

**1. Récupérer Navettes du Jour**
```javascript
// Le système appelle cet endpoint existant
GET /api/transport/navettes?date=2025-04-24

// Retour attendu :
{
  "navettes": [
    {
      "navette_id": "nav_001",
      "date_navette": "2025-04-24",
      "vehicule_id": "veh_bus1",
      "heure_depart": "06:30",
      "heure_arrivee": "07:15",
      "nombre_passagers": 45,
      "km_depart": 5200,
      "km_arrivee": 5215,
      "carburant_consomme": 3.9,
      "ponctualite_minutes": 2  // +2 = 2 min en retard
    },
    { ... }
  ]
}
```

**2. Récupérer Véhicules (Parc Automobile)**
```javascript
// Pour calcul disponibilité
GET /api/transport/parc-automobile?date=2025-04-24

// Retour :
{
  "parc": [
    {
      "vehicule_id": "veh_bus1",
      "designation": "Bus 1",
      "capacite": 70,
      "etat": "Bon état",
      "en_maintenance": false,
      "derniere_utilisation": "2025-04-24T17:30:00"
    },
    { ... }
  ]
}
```

**3. Récupérer Tarifs Carburant**
```javascript
// Pour calcul coût carburant
GET /api/transport/parametres

// Retour :
{
  "parametres": {
    "prix_carburant_fcfa_par_litre": 155.5
  }
}
```

---

## 📊 EXEMPLE DE SITUATION COMPLÈTE (JSON)

```json
{
  "situation_id": "sit_20250424_001",
  "date_situation": "2025-04-24",
  "crou": "CROU Niamey",
  "timestamp_generation": "2025-04-24T23:00:00Z",
  
  "navettes": {
    "nombre_total": 12,
    "nombre_vehicules_utilises": 3,
    "detail": [
      {
        "num": 1,
        "vehicule": "Bus 1",
        "circuit": "Centre → Campus",
        "heure_depart": "06:30",
        "heure_arrivee": "07:15",
        "passagers": 45,
        "distance_km": 15.5,
        "carburant": 3.9,
        "taux_remplissage": "64%",
        "retard_minutes": 2
      },
      { ... }
    ],
    "statistiques": {
      "total_passagers": 850,
      "total_km": 187.5,
      "total_carburant_litres": 47.3
    }
  },
  
  "tickets": {
    "par_type": {
      "regulier": {
        "quantite": 400,
        "prix_unitaire": 500,
        "montant": 200000,
        "statut": "Validé"
      },
      "etudiant": {
        "quantite": 350,
        "prix_unitaire": 250,
        "montant": 87500,
        "statut": "Validé"
      },
      "personnel": {
        "quantite": 100,
        "prix_unitaire": 350,
        "montant": 35000,
        "statut": "Validé"
      },
      "gratuit": {
        "quantite": 0,
        "prix_unitaire": 0,
        "montant": 0,
        "statut": "N/A"
      }
    },
    "totaux": {
      "tickets_emis": 850,
      "tickets_valides": 850,
      "tickets_encaisses": 0,
      "montant_total": 322500,
      "montant_encaisse": 0,
      "montant_en_attente": 322500
    }
  },
  
  "kpi": {
    "taux_remplissage_moyen_percent": 81,
    "taux_disponibilite_flotte_percent": 100,
    "cout_carburant_journalier_fcfa": 7355,
    "consommation_moyenne_l_100km": 25.2,
    "ponctualite_moyenne_percent": 92,
    "rendement_passagers_km": 4.53,
    "tendance_vs_hier": {
      "passagers": "+5%",
      "recettes": "+8%",
      "carburant": "-2%"
    }
  },
  
  "anomalies": [],
  
  "statut": "Validé",
  "validé_par": "admin_transport",
  "date_validation": "2025-04-24T23:05:00Z"
}
```

---

## ✅ CHECKLIST D'INTÉGRATION

- [ ] Accès API navettes confirmé + testée
- [ ] Accès parc automobile confirmé
- [ ] Tarifs carburant paramétrisables
- [ ] Migrations BD en place
- [ ] Seed data (circuits, tarifs) chargée
- [ ] Tests API tickets fonctionnels
- [ ] Tests génération situation OK
- [ ] Exports PDF/Excel générés correctement
- [ ] Dashboard widget intégré
- [ ] Permissions et rôles configurés
- [ ] Audit trail fonctionnel

---

**Document généré le** : 2025-04-24
**Version** : 1.0
**Scope** : Architecture Tickets + Situations (Module Transport)