# 📋 PROMPT : Ajout Gestion Tickets & Situations Journalières - Transport CROU

## 🎯 Contexte & Objectif

**Système** : Module Transport CROU (Niger) - Existant
**Scope** : Ajout de 2 composantes manquantes
**Objectif** : 
1. ✅ Gérer les **tickets de transport** vendus aux usagers (étudiants, ayant-droit, etc.)
2. ✅ Générer des **situations journalières** consolidant navettes + recettes + KPIs

**Devise** : FCFA | **Localisation** : Niger

---

## 📊 ÉTAT ACTUEL (Module existant)

Le module Transport gère actuellement :
- ✅ Parc automobile (bus, immatriculation, capacité, état)
- ✅ Journal de bord quotidien (navettes par véhicule, circuits, km, carburant)
- ✅ Suivi consommation carburant (mensuel)
- ✅ Maintenance véhicules
- ✅ Tableau de bord KPIs (disponibilité, consommation, ponctualité, passagers)

**Manquant** :
- ❌ Gestion des **tickets vendus** (types, tarifs, émission, validation)
- ❌ **Situation journalière consolidée** (fréquentation, recettes, état navettes)
- ❌ **Rapports financiers** (recettes transport)

---

## 🔄 WORKFLOWS À IMPLÉMENTER

### WORKFLOW 1 : Émission de Tickets de Transport

```
[AGENT TICKETING] Accède interface "Émettre Tickets Transport"
│
├─ Sélectionne :
│  ├─ Date de transport
│  ├─ Parcours/Circuit (ex: Centre → Campus)
│  ├─ Type ticket (Régulier, Étudiant, Personnel, Ayant-droit, etc.)
│  └─ Quantité tickets
│
▼
[SYSTÈME] Affiche :
│  ├─ Prix unitaire (paramétré par circuit + type)
│  ├─ Montant total calculé
│  └─ Véhicules disponibles (basé sur parc)
│
▼
[AGENT] Clique "Émettre tickets"
│
▼
[SYSTÈME] Enregistre & affiche confirmation
│  ├─ Numéro de série tickets
│  ├─ Montant total
│  └─ Statut : "À encaisser"
│
▼
[RAPPROCHEMENT FINANCIER] Tickets listés en attente d'encaissement
```

### WORKFLOW 2 : Situation Journalière

```
[GESTIONNAIRE TRANSPORT] Accède "Situations Journalières"
│
├─ Sélectionne date
│
▼
[SYSTÈME] Agrège automatiquement :
│
├─ NAVETTES DU JOUR :
│  ├─ Nombre de navettes effectuées
│  ├─ Véhicules utilisés
│  ├─ Total passagers transportés
│  ├─ Carburant consommé (L)
│  └─ Distance totale (km)
│
├─ TICKETS VENDUS :
│  ├─ Par type (régulier, étudiant, personnel, etc.)
│  ├─ Nombre total
│  └─ Recettes total
│
├─ INDICATEURS KPI :
│  ├─ Taux remplissage moyen (% capacité)
│  ├─ Rendement/km (passagers/km)
│  ├─ Coût carburant
│  └─ Ponctualité estimée
│
└─ ANOMALIES :
   ├─ Véhicules non disponibles
   ├─ Navettes annulées
   └─ Dépassements carburant
│
▼
[INTERFACE] Affiche tableau de synthèse (peut exporter PDF/Excel)
```

---

## 🗄️ MODÈLES DE DONNÉES À AJOUTER

### 1. Circuits de Transport

```sql
CREATE TABLE circuits_transport (
  circuit_id UUID PRIMARY KEY,
  nom_circuit VARCHAR(255) NOT NULL,
  trajet_depart VARCHAR(255),
  trajet_arrivee VARCHAR(255),
  distance_km DECIMAL(10,2),
  duree_minutes INT,
  statut ENUM('Actif', 'Inactif', 'Suspendu'),
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Exemple:
-- circuit_1 | Centre → Campus | Centre ville | Campus principal | 15.5 km | 45 min
-- circuit_2 | Campus → Campus | Campus A | Campus B | 8.3 km | 25 min
```

### 2. Tarifs de Transport

```sql
CREATE TABLE tarifs_transport (
  tarif_id UUID PRIMARY KEY,
  circuit_id FK circuits_transport,
  type_ticket ENUM('Régulier', 'Étudiant', 'Personnel', 'Ayant_Droit', 'Gratuit'),
  prix_unitaire DECIMAL(10,2) NOT NULL,  -- FCFA
  statut ENUM('Actif', 'Inactif'),
  date_debut DATE,
  date_fin DATE,
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Exemple:
-- circuit_1 | Régulier | 500 FCFA
-- circuit_1 | Étudiant | 250 FCFA
-- circuit_1 | Personnel | 350 FCFA
```

### 3. Catégories de Tickets de Transport

```sql
CREATE TABLE categories_tickets_transport (
  categorie_id UUID PRIMARY KEY,
  nom_categorie VARCHAR(255),
  prix_unitaire DECIMAL(10,2),
  description TEXT,
  statut ENUM('Actif', 'Inactif'),
  couleur_badge VARCHAR(50),  -- Pour affichage UI
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 4. Tickets de Transport Émis

```sql
CREATE TABLE tickets_transport (
  ticket_id UUID PRIMARY KEY,
  circuit_id FK circuits_transport,
  date_transport DATE,
  categorie_id FK categories_tickets_transport,
  quantite INT NOT NULL,
  prix_unitaire DECIMAL(10,2),
  montant_total DECIMAL(10,2),  -- Calculé
  statut_validation ENUM('Émis', 'Validé', 'Encaissé', 'Annulé'),
  numero_serie_debut INT,
  numero_serie_fin INT,
  emis_par FK users,
  validé_par FK users (nullable),
  date_emission DATETIME,
  date_validation DATETIME (nullable),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Index sur :
-- (circuit_id, date_transport)
-- (statut_validation, date_emission)
```

### 5. Navettes Réalisées (Lien avec parc automobile existant)

```sql
CREATE TABLE navettes_transport (
  navette_id UUID PRIMARY KEY,
  date_navette DATE,
  circuit_id FK circuits_transport,
  vehicule_id FK parc_automobile (existant),
  chauffeur_id FK users,
  heure_depart TIME,
  heure_arrivee TIME,
  nombre_passagers INT,
  km_depart INT,
  km_arrivee INT,
  distance_km DECIMAL(10,2),  -- Calculé
  carburant_consomme DECIMAL(10,2),  -- L
  taux_remplissage_percent DECIMAL(5,2),  -- (passagers / capacité_vehicule * 100)
  ponctualite_minutes INT,  -- Retard (+) ou avance (-)
  statut ENUM('Planifiée', 'En cours', 'Complétée', 'Annulée'),
  observations TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Index sur :
-- (date_navette, circuit_id)
-- (vehicule_id, date_navette)
```

### 6. Situation Journalière (Vue Agrégée)

```sql
CREATE TABLE situations_journalieres_transport (
  situation_id UUID PRIMARY KEY,
  date_situation DATE UNIQUE,
  crou_id FK crou,
  
  -- Navettes
  nombre_navettes INT,
  nombre_vehicules_utilises INT,
  total_passagers INT,
  total_km DECIMAL(10,2),
  total_carburant DECIMAL(10,2),
  
  -- Tickets & Recettes
  tickets_emis INT,
  montant_recettes DECIMAL(12,2),
  tickets_encaisses INT,
  montant_encaisse DECIMAL(12,2),
  
  -- KPIs
  taux_remplissage_moyen DECIMAL(5,2),  -- %
  taux_disponibilite_flotte DECIMAL(5,2),  -- %
  cout_carburant_journalier DECIMAL(10,2),
  ponctualite_moyenne DECIMAL(5,2),  -- %
  
  -- Anomalies
  nb_anomalies INT,
  anomalies_detail JSON,  -- [{type, description}, ...]
  
  statut ENUM('Brouillon', 'Validé', 'Finalisé'),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🎨 INTERFACES UTILISATEUR

### 1. Émission de Tickets Transport

```
┌──────────────────────────────────────────────────┐
│  Émettre Tickets de Transport                    │
├──────────────────────────────────────────────────┤
│                                                  │
│  Date transport:        [24/04/2025]            │
│  Circuit:              [Sélectionner ▼]         │
│                        → Centre → Campus (15km) │
│                                                  │
│  Type ticket:          [Régulier ▼]             │
│  Prix unitaire:        500 FCFA                 │
│                                                  │
│  Quantité:             [___50___]               │
│  Montant total:        25,000 FCFA ✓            │
│                                                  │
│  ┌─────────────────────────────────────────┐   │
│  │ [Annuler]  [Émettre Tickets]            │   │
│  └─────────────────────────────────────────┘   │
│                                                  │
├──────────────────────────────────────────────────┤
│ ✓ 50 tickets émis (#000501-000550)              │
│   Montant: 25,000 FCFA - Statut: À encaisser   │
└──────────────────────────────────────────────────┘
```

### 2. Tableau Historique Tickets

```
┌────────────────────────────────────────────────────────────────┐
│  Historique Tickets de Transport                               │
├────────────────────────────────────────────────────────────────┤
│ Filtres: [Date ▼] [Circuit ▼] [Statut ▼]  [Rechercher...]    │
├────────────────────────────────────────────────────────────────┤
│ Date      Circuit           Type      Qty   Montant   Statut  │
├────────────────────────────────────────────────────────────────┤
│ 24/04     Centre→Campus    Régulier   50    25,000   Encaissé │
│ 24/04     Campus A→B       Étudiant   30    7,500    Validé   │
│ 24/04     Centre→Campus    Gratuit    5     0        Validé   │
└────────────────────────────────────────────────────────────────┘
```

### 3. Situation Journalière

```
┌───────────────────────────────────────────────────────────────┐
│  SITUATION JOURNALIÈRE - 24 Avril 2025                        │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  📊 NAVETTES DU JOUR                                          │
│  ├─ Navettes réalisées : 12                                   │
│  ├─ Véhicules utilisés : 3                                    │
│  ├─ Total passagers : 850                                     │
│  ├─ Distance totale : 187.5 km                                │
│  └─ Carburant consommé : 47.3 L                               │
│                                                               │
│  💰 TICKETS & RECETTES                                        │
│  ├─ Tickets régulier : 400 × 500 = 200,000 FCFA              │
│  ├─ Tickets étudiant : 350 × 250 = 87,500 FCFA               │
│  ├─ Tickets personnel : 100 × 350 = 35,000 FCFA              │
│  ├─ Gratuités : 0 FCFA                                        │
│  └─ TOTAL RECETTES : 322,500 FCFA                             │
│                                                               │
│  📈 INDICATEURS KPI                                           │
│  ├─ Taux remplissage moyen : 81% ✓                            │
│  ├─ Taux disponibilité flotte : 100% ✓                        │
│  ├─ Coût carburant/jour : ~7,360 FCFA                         │
│  ├─ Ponctualité moyenne : 92% ✓                               │
│  └─ Rendement moyen : 4.5 passagers/km                        │
│                                                               │
│  ⚠️ ANOMALIES                                                 │
│  └─ Aucune                                                    │
│                                                               │
│  [Exporter PDF] [Exporter Excel] [Imprimer]                   │
└───────────────────────────────────────────────────────────────┘
```

### 4. Dashboard Transport Widget

```
┌─────────────────────────────┐
│ 🚌 TRANSPORT AUJOURD'HUI     │
├─────────────────────────────┤
│ Navettes : 12               │
│ Passagers : 850             │
│ Recettes : 322,500 FCFA     │
│ État : ✓ Normal             │
└─────────────────────────────┘
```

---

## 🔌 INTÉGRATIONS AVEC MODULE EXISTANT

### 1. Récupération Véhicules Disponibles
```javascript
// Avant d'émettre tickets, récupérer véhicules pour affichage
GET /api/transport/parc-automobile?statut=Disponible&date=YYYY-MM-DD
└─ Retourne liste bus disponibles + capacité
```

### 2. Récupération Journal de Bord du Jour
```javascript
// Pour construire situation journalière
GET /api/transport/navettes?date=YYYY-MM-DD
└─ Retourne toutes navettes du jour avec passagers, km, carburant
```

### 3. Récupération Données Carburant
```javascript
// Pour calculs KPI
GET /api/transport/carburant/jour?date=YYYY-MM-DD
└─ Retourne consommation + coûts du jour
```

### 4. Récupération Maintenance
```javascript
// Pour alertes disponibilité
GET /api/transport/maintenance/alerts?date=YYYY-MM-DD
└─ Retourne véhicules en maintenance ce jour
```

---

## 📋 SPÉCIFICATIONS FONCTIONNELLES

### Gestion Tickets

| Feature | Détail |
|---------|--------|
| **Créer catégories** | Types tickets : Régulier, Étudiant, Personnel, Ayant-Droit, Gratuit |
| **Paramétrer tarifs** | Par circuit + type ticket |
| **Émettre tickets** | Batch (50, 100, etc.) ou individuels |
| **Validation statuts** | Émis → Validé → Encaissé |
| **Numérotation** | Automatique (série contiguë) |
| **Historique** | Tous les mouvements tracés |
| **Rapprochement** | Tickets émis vs encaissements |

### Situations Journalières

| Feature | Détail |
|---------|--------|
| **Génération auto** | À minuit ou à la demande |
| **Agrégation** | Navettes + Tickets + Carburant + Maintenance |
| **Calcul KPI** | Automatique (% remplissage, ponctualité, etc.) |
| **Anomalies** | Détection auto (retards, anomalies) |
| **Historique** | Garde situation pour chaque jour |
| **Exports** | PDF + Excel avec mise en forme |
| **Rapports** | Journalier, hebdo, mensuel |

---

## 🔐 PERMISSIONS & AUDIT

### Rôles
| Rôle | Tickets | Situations |
|------|---------|-----------|
| **Admin Transport** | ✓ CRUD | ✓ CRUD |
| **Gestionnaire Transport** | ✓ Lecture + Émission | ✓ Lecture + Génération |
| **Agent Ticketing** | ✓ Émettre seulement | ✓ Lecture seulement |
| **Comptable** | ✓ Lecture (rapprochement) | ✓ Lecture (rapprochement) |

### Audit Trail
- Logging : User + Action + Timestamp + Avant/Après
- Immuable : Pas de suppression directe (soft-delete)
- Export audit : Mensuel pour conformité

---

## 🔌 API ENDPOINTS À CRÉER

### Circuits & Tarifs
```javascript
GET    /api/transport/circuits
POST   /api/transport/circuits
PUT    /api/transport/circuits/{circuit_id}
DELETE /api/transport/circuits/{circuit_id}

GET    /api/transport/tarifs?circuit_id=
POST   /api/transport/tarifs
PUT    /api/transport/tarifs/{tarif_id}
```

### Catégories Tickets
```javascript
GET    /api/transport/categories-tickets
POST   /api/transport/categories-tickets
PUT    /api/transport/categories-tickets/{id}
DELETE /api/transport/categories-tickets/{id}
```

### Tickets Transport
```javascript
GET    /api/transport/tickets?date_from=&date_to=&circuit=
POST   /api/transport/tickets                    // Émettre
GET    /api/transport/tickets/{ticket_id}
PATCH  /api/transport/tickets/{ticket_id}/valider
PATCH  /api/transport/tickets/{ticket_id}/encaisser
DELETE /api/transport/tickets/{ticket_id}       // Soft-delete (annulation)
```

### Navettes
```javascript
GET    /api/transport/navettes?date=
POST   /api/transport/navettes                  // Créer (intégration journal bord)
```

### Situations Journalières
```javascript
GET    /api/transport/situations?date=&mois=&annee=
POST   /api/transport/situations/{date}/generer
GET    /api/transport/situations/{situation_id}
POST   /api/transport/situations/{situation_id}/export-pdf
POST   /api/transport/situations/{situation_id}/export-excel
```

---

## 📊 RAPPORTS À GÉNÉRER

### 1. Rapport Journalier (JSON)
```json
{
  "date": "2025-04-24",
  "navettes": {
    "total": 12,
    "vehicules_utilises": 3,
    "passagers": 850,
    "km_total": 187.5,
    "carburant_total_litres": 47.3
  },
  "tickets": {
    "par_type": [
      { "type": "Régulier", "quantite": 400, "montant": 200000 },
      { "type": "Étudiant", "quantite": 350, "montant": 87500 }
    ],
    "montant_total": 322500
  },
  "kpi": {
    "taux_remplissage_percent": 81,
    "taux_disponibilite_percent": 100,
    "ponctualite_percent": 92,
    "cout_carburant": 7360
  }
}
```

### 2. Rapport Mensuel
- Synthèse par jour
- Moyennes journalières
- Tendances (vs mois précédent)
- Top circuits (par fréquentation)
- Anomalies récurrentes

### 3. Rapport Annuel
- Synthèse par mois
- Tendances annuelles
- Évolution tarifs/recettes
- Analyse flotte (utilisation, âge, maintenance)

---

## ✅ CRITÈRES DE SUCCÈS

- ✅ Émission de tickets simple & fiable (batch)
- ✅ Situation journalière auto-générée avec données exactes
- ✅ KPI calculés correctement (% remplissage, ponctualité, etc.)
- ✅ Rapprochement tickets vs encaissements transparent
- ✅ Exports PDF/Excel professionnels
- ✅ Intégration fluide avec parc automobile existant
- ✅ Audit trail complet (traçabilité tickets)
- ✅ Dashboard intégré aux dashboards existants
- ✅ Tarifs paramétrables par circuit + type
- ✅ Aucune perte de données lors des opérations

---

## 📝 PARAMÈTRES INITIAUX (À CONFIRMER)

**Circuits Transport** :
```
- Circuit 1 : Centre → Campus (15 km)
- Circuit 2 : Campus A → Campus B (8 km)
- (À compléter avec autre circuits)
```

**Tarifs Actuels** :
```
À définir par circuit et type ticket
Exemple:
- Régulier : 500 FCFA
- Étudiant : 250 FCFA
- Personnel : 350 FCFA
- Gratuit : 0 FCFA
```

**Véhicules** :
```
- Bus 1 : Capacité 70 pers (imm1)
- Bus 2 : Capacité 70 pers (imm2)
(Récupérés du parc automobile existant)
```

---

## 📅 PHASES D'IMPLÉMENTATION

### Phase 1 : Fondations (1 sem)
- [ ] Modèles BD (Circuits, Tarifs, Catégories, Tickets, Navettes, Situations)
- [ ] Migrations
- [ ] Seed data (circuits, tarifs, catégories)

### Phase 2 : API Tickets (1 sem)
- [ ] CRUD Circuits + Tarifs
- [ ] CRUD Catégories Tickets
- [ ] Émission & validation tickets
- [ ] Tests

### Phase 3 : Situation Journalière (1 sem)
- [ ] API génération situations
- [ ] Calculs KPI
- [ ] Détection anomalies
- [ ] Tests

### Phase 4 : Frontend & Exports (1 sem)
- [ ] Pages émission tickets
- [ ] Historique tickets
- [ ] Affichage situation journalière
- [ ] Exports PDF/Excel

### Phase 5 : Integration & Dashboard (0.5 sem)
- [ ] Widget dashboard transport
- [ ] Intégration avec parc automobile
- [ ] Rapprochement financier (si module finances existe)
- [ ] Polish & tests

**Total : ~4.5 semaines**

---

## 🎁 DELIVERABLES

```
├─ Code source
│  ├─ API endpoints (Express/FastAPI)
│  ├─ Frontend (React/Next.js pages)
│  └─ Tests (unitaires + intégration)
├─ Documentation
│  ├─ README
│  ├─ API specs (Swagger)
│  └─ Diagrammes
├─ Database
│  ├─ Migrations
│  ├─ Seed data
│  └─ Index perfs
└─ Rapports
   ├─ PDF templates
   └─ Excel exports
```

---

**Document généré le** : 2025-04-24
**Version** : 1.0 Final
**Scope** : Ajout tickets + situations journalières (Module Transport existant)