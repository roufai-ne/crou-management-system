# 📋 PROMPT : Intégration Module Gestion de Restauration CROU

## 🎯 Contexte & Objectif Global

**Système** : Plateforme de gestion des Centres Régionaux des Œuvres Universitaires (CROU) - Niger
**Module** : Gestion de la Restauration (intégration avec module Stock existant)
**Objectif** : Créer un système complet permettant de :
- Gérer les menus variés du CROU (Petit déjeuner, Déjeuner, Dîner)
- Suivre les besoins quotidiens avec déduction du stock validée manuellement
- Gérer les tickets de restauration par catégories
- Générer des rapports de fréquentation et financiers
- Exporter les données en PDF et Excel
- Intégrer les données avec les modules existants (Stock, Comptabilité, Finances)

**Devise** : FCFA | **Localisation** : Niger

---

## 📊 SPÉCIFICATIONS FONCTIONNELLES

### 1. GESTION DES MENUS

#### 1.1 Structure des Menus
- **Champs principaux** :
  - `menu_id` (UUID)
  - `nom_menu` (string, ex: "Riz + Sauce arachide")
  - `type_service` (ENUM: Petit_Déjeuner, Déjeuner, Dîner)
  - `date_application` (DATE)
  - `statut` (ENUM: Actif, Inactif, Planifié)
  - `description` (text optionnel)

#### 1.2 Composition du Menu
- **Tableau de détails** : Lier chaque menu à une liste de produits du stock
  - Produit (référence au stock)
  - Quantité_unitaire (kg, litres, nombre)
  - Unité_mesure (kg, litre, portion, etc.)
  - Coût_unitaire (synchronisé du stock)
  - Total_coût (quantité × coût)

#### 1.3 Menus Variés
- Permettre **plusieurs menus par type de service** sur une même date
- Exemple : Lundi déjeuner → Menu A (Riz) OU Menu B (Pâtes)
- **Variation par calendrier** : Plannifier des menus différents sur plusieurs semaines/mois
- Interface : Calendrier visuel avec menus assignés par jour et service

#### 1.4 Gestion des Variations
- Permettre **différents menus** pour une même date/service (variantes)
- Statut de disponibilité pour chaque variante

---

### 2. GESTION DES TICKETS & CATÉGORIES

#### 2.1 Catégories de Tickets
- **Champs** :
  - `categorie_ticket_id` (UUID)
  - `nom_categorie` (string, ex: "Ticket régulier", "Ticket réduit", "Ticket personnel")
  - `type_service` (ENUM: Petit_Déjeuner, Déjeuner, Dîner)
  - `prix_unitaire` (FCFA)
  - `statut` (Actif, Inactif)
  - `description` (optionnel)

#### 2.2 Tickets de Restauration
- **Champs** :
  - `ticket_id` (UUID)
  - `date_emission` (DATETIME)
  - `categorie_ticket_id` (FK)
  - `type_service` (ENUM)
  - `quantite` (nombre de tickets émis)
  - `prix_unitaire` (synchronisé de catégorie)
  - `montant_total` (quantite × prix)
  - `statut_validation` (Non validé, Validé, Encaissé)
  - `date_consommation` (DATE, peut être différente de date_emission)
  - `emis_par` (user_id)
  - `notes` (optionnel)

#### 2.3 Gestion des Gratuités
- Catégorie de tickets spéciale : **"Gratuit"** avec prix_unitaire = 0
- Traçabilité via `numero_serie` ou `code_beneficiaire` (optionnel)
- Rapports distinguant tickets payants vs gratuits

---

### 3. BESOINS QUOTIDIENS & DÉDUCTION DE STOCK

#### 3.1 Fiche de Besoins Quotidiens
- **Champs** :
  - `besoin_id` (UUID)
  - `date` (DATE)
  - `type_service` (ENUM)
  - `menu_id` (FK)
  - `nombre_rationnaires_prevus` (nombre)
  - `statut` (Brouillon, Validé, Stock déduit, Consommé)

#### 3.2 Détails des Besoins
- **Tableau dynamique** :
  - Produit_id (FK vers Stock)
  - Ration_unitaire (kg/portion/etc par rationnaire)
  - Quantite_totale = nombre_rationnaires × ration_unitaire
  - Stock_disponible (synchronisé)
  - Suffisance (Stock_disponible ≥ Quantite_totale) → Statut: OK ou Insuffisant

#### 3.3 Déduction du Stock (Processus)
1. **Étape 1** : Agent de restauration remplit la fiche (menu, nombre de rationnaires, date)
2. **Étape 2** : Le système calcule automatiquement les besoins en fonction du menu
3. **Étape 3** : Comparaison avec stock disponible → Afficher les statuts
4. **Étape 4** : **BOUTON "Valider & Déduire du Stock"** → Nécessite confirmation
5. **Étape 5** : Appel API vers module Stock → Mettre à jour les quantités
6. **Historique** : Garder trace des déductions avec timestamps

#### 3.4 Gestion des Anomalies
- **Stock insuffisant** : Afficher avertissement, permettre de :
  - Réduire le nombre de rationnaires
  - Modifier le menu
  - Confirmer quand même (avec trace)
- **Produit non trouvé en stock** : Notification, possibilité d'ajouter à demande d'achat

---

### 4. SUIVI DE CONSOMMATION & PERTES

#### 4.1 Enregistrement de la Consommation
- **Fiche de consommation** (après service) :
  - `consommation_id` (UUID)
  - `besoin_id` (FK)
  - `date` (DATE)
  - `type_service` (ENUM)
  - `nombre_rationnaires_servis` (nombre)
  - `statut` (Servi, Non servi, Partiellement servi)

#### 4.2 Gestion des Pertes/Produits Périmés
- **Champs additionnels** :
  - `perte_id` (UUID)
  - `date_constatation` (DATETIME)
  - `produit_id` (FK Stock)
  - `quantite_perdue` (nombre)
  - `motif` (ENUM: Périmé, Gaspillage, Détérioration, Autre)
  - `date_peremption` (si applicable)
  - `description_detaillee` (text)
  - `photograph` (optionnel, pour traçabilité)
  - `value_fcfa` (quantité × prix unitaire du moment)

#### 4.3 Synchronisation Stock pour Pertes
- Les pertes doivent **mettre à jour automatiquement** le stock via API
- Catégorie de mouvement : "Perte/Gaspillage"
- Historique complet dans le module Stock

---

### 5. GESTION FINANCIÈRE & RAPPORTS

#### 5.1 Synchronisation avec Module Comptabilité/Finances
- **Export données** : 
  - Total recettes par type de service (journalière, mensuelle)
  - Ventilation tickets payants vs gratuits
  - Montants encaissables (tickets validés)
- **API** : Webhook ou endpoint pour transmettre données comptables
- **Réconciliation** : Comparaison tickets émis vs encaissements

#### 5.2 Rapports de Situation

**Rapport Journalier** :
- Date
- Par type de service (Petit déj, Déjeuner, Dîner) :
  - Tickets vendus (par catégorie)
  - Tickets gratuits
  - Total consommateurs
  - Recettes (FCFA)
  - Menu servi
  - Pertes constatées
- Format : Tableau synthétique avec totaux

**Rapport Mensuel** :
- Synthèse par semaine
- Moyennes par jour
- Évolution vs mois précédent (en %)
- Total recettes mois
- Produits les plus consommés
- Taux de gaspillage

**Rapport Annuel** :
- Synthèse par mois
- Tendances annuelles
- Comparaisons par trimestre
- Analyse coûts vs recettes

#### 5.3 Tableaux de Bord
- **Widget Restauration** (à ajouter aux dashboards existants) :
  - Fréquentation du jour (temps réel)
  - Recettes du jour
  - Ruptures de stock anticipées
  - Pertes du jour
  - État général (vert/orange/rouge)
- **Vue mensuelle** : Graphiques de fréquentation, recettes, évolution

---

### 6. INTÉGRATIONS SYSTÈME

#### 6.1 Intégration Module Stock
- **Appels API** :
  - `GET /api/stock/produits` → Récupérer produits disponibles
  - `GET /api/stock/produits/{id}/disponibilite` → Quantité disponible
  - `POST /api/stock/mouvements` → Créer mouvement de déduction
    ```json
    {
      "type_mouvement": "Consommation_Restauration",
      "produit_id": "xxx",
      "quantite": 50,
      "unite": "kg",
      "reference_restauration": "besoin_id_xyz",
      "date": "2025-04-24",
      "motif": "Besoins quotidiens validés"
    }
    ```
  - `POST /api/stock/mouvements` (Pertes) :
    ```json
    {
      "type_mouvement": "Perte_Gaspillage",
      "produit_id": "xxx",
      "quantite": 5,
      "motif": "Périmé",
      "date_peremption": "2025-04-20",
      "reference_restauration": "perte_id_xyz"
    }
    ```

#### 6.2 Intégration Module Finances/Comptabilité
- **Export données** :
  - `POST /api/finances/recettes_restauration` → Envoyer recettes validées
  - `GET /api/finances/categories_tickets` → Récupérer si lié ailleurs
- **Réconciliation** : Rapport mensuel comparatif

#### 6.3 Intégration Calendrier Académique
- Récupérer dates de congés/fermetures pour afficher menus inactifs
- Adapter tarifs si nécessaire (périodes spéciales)

---

## 🗄️ STRUCTURE DES DONNÉES / MODÈLES

### Menus
```
- menu_id (UUID, PK)
- nom_menu (string, 255)
- type_service (ENUM: Petit_Déjeuner, Déjeuner, Dîner)
- date_application (DATE)
- statut (ENUM: Actif, Inactif, Planifié)
- description (TEXT)
- created_at, updated_at
```

### Détails Menus (Many-to-Many)
```
- detail_menu_id (UUID, PK)
- menu_id (FK)
- produit_id (FK vers Stock)
- quantite_unitaire (DECIMAL)
- unite_mesure (string: kg, litre, portion, etc.)
- coût_unitaire (DECIMAL, FCFA)
- ordre_affichage (INT)
```

### Catégories de Tickets
```
- categorie_ticket_id (UUID, PK)
- nom_categorie (string, 255)
- type_service (ENUM)
- prix_unitaire (DECIMAL, FCFA)
- statut (ENUM: Actif, Inactif)
- description (TEXT)
- created_at, updated_at
```

### Tickets
```
- ticket_id (UUID, PK)
- categorie_ticket_id (FK)
- date_emission (DATETIME)
- date_consommation (DATE)
- type_service (ENUM)
- quantite (INT)
- prix_unitaire (DECIMAL, FCFA)
- montant_total (DECIMAL, FCFA) → calculé
- statut_validation (ENUM: Non_Validé, Validé, Encaissé)
- emis_par (FK User)
- notes (TEXT)
- created_at, updated_at
```

### Besoins Quotidiens
```
- besoin_id (UUID, PK)
- date (DATE)
- type_service (ENUM)
- menu_id (FK)
- nombre_rationnaires_prevus (INT)
- statut (ENUM: Brouillon, Validé, Stock_Déduit, Consommé)
- validé_par (FK User, nullable)
- date_validation (DATETIME, nullable)
- created_at, updated_at
```

### Détails Besoins
```
- detail_besoin_id (UUID, PK)
- besoin_id (FK)
- produit_id (FK Stock)
- ration_unitaire (DECIMAL)
- quantite_totale (DECIMAL) → calculée
- stock_disponible (DECIMAL) → synchronisé
- statut_disponibilite (ENUM: OK, Insuffisant)
```

### Consommation
```
- consommation_id (UUID, PK)
- besoin_id (FK)
- date (DATE)
- type_service (ENUM)
- nombre_rationnaires_servis (INT)
- statut (ENUM: Servi, Non_Servi, Partiellement_Servi)
- notes (TEXT)
- created_at, updated_at
```

### Pertes/Gaspillage
```
- perte_id (UUID, PK)
- date_constatation (DATETIME)
- produit_id (FK Stock)
- quantite_perdue (DECIMAL)
- unite_mesure (string)
- motif (ENUM: Périmé, Gaspillage, Détérioration, Autre)
- date_peremption (DATE, nullable)
- description_detaillee (TEXT)
- value_fcfa (DECIMAL) → quantité × prix
- created_at, updated_at
```

---

## 🎨 INTERFACES UTILISATEUR (Description)

### 1. Tableau de Bord Restauration
- **Vue d'ensemble** : Récapitulatif jour + mois
- **Widgets** :
  - Fréquentation actuelle
  - Recettes du jour
  - État stock (alertes)
  - Pertes du jour
- **Accès rapide** : Boutons vers gestion menus, tickets, besoins, pertes

### 2. Gestion des Menus
- **Liste des menus** : Tableau avec filtres (date, type_service, statut)
- **Création/Édition** : 
  - Formulaire basique (nom, type_service, date)
  - Tableau dynamique pour ajouter produits (search + qty)
  - Calcul auto du coût total
  - Aperçu des rations par rationnaire
- **Calendrier visuel** : Vue mois/semaine avec menus assignés
- **Actions** : Dupliquer, Inactiver, Prévisualiser

### 3. Gestion des Tickets
- **Liste des catégories** : CRUD simple pour catégories
- **Émission de tickets** :
  - Sélection type_service + catégorie_ticket
  - Saisie quantité
  - Affichage montant total
  - Bouton "Émettre tickets"
- **Historique tickets** : Tableau avec filtres (date, statut, catégorie)
- **Rapprochement** : Comparaison tickets émis vs encaissements

### 4. Besoins Quotidiens
- **Nouvelle fiche** :
  - Sélection date, type_service, menu
  - Saisie nombre rationnaires prévus
  - Affichage automatique produits requis
  - Tableau des besoins avec statut stock
  - **BOUTON ROUGE "Valider & Déduire du Stock"** avec confirmation
- **Historique fiches** : Tableau avec statuts
- **Aperçu déductions** : Journal des appels API verso Stock

### 5. Gestion des Pertes
- **Nouvelle perte** :
  - Sélection produit (search)
  - Saisie quantité perdue + motif
  - Champ date_peremption (si périmé)
  - Zone texte description détaillée
  - Upload photo (optionnel)
  - Calcul automatique valeur FCFA
- **Historique** : Tableau avec filtres (motif, date, produit)
- **Statistiques** : % gaspillage par produit, coût total pertes

### 6. Rapports & Exports
- **Page Rapports** :
  - Sélecteurs : Plage de dates, Type rapport (Journalier/Mensuel/Annuel)
  - **Vue tableau** : Synthèse détaillée
  - **Vue graphiques** : Courbes recettes, histogrammes fréquentation
  - **Boutons export** : 
    - "Exporter en PDF" (mise en forme professionnelle)
    - "Exporter en Excel" (données brutes + graphiques)
- **Rapports pré-générés** : Flux automatique pour derniers 7 jours, 30 jours, année

### 7. Paramètres Restauration
- Gestion tarifs par type_service (edit prix)
- Configuration seuils alerte (coordonnée avec Stock)
- Gestion calendrier spécial (congés, fermetures)

---

## 🔌 INTÉGRATIONS TECHNIQUES

### API Endpoints à Créer

#### Menus
```
GET    /api/restauration/menus?date=YYYY-MM-DD&type_service=...
POST   /api/restauration/menus
GET    /api/restauration/menus/{menu_id}
PUT    /api/restauration/menus/{menu_id}
DELETE /api/restauration/menus/{menu_id}
GET    /api/restauration/menus/{menu_id}/details
```

#### Tickets
```
GET    /api/restauration/tickets?date_from=...&date_to=...
POST   /api/restauration/tickets
GET    /api/restauration/tickets/{ticket_id}
PATCH  /api/restauration/tickets/{ticket_id}/valider
GET    /api/restauration/categories-tickets
POST   /api/restauration/categories-tickets
```

#### Besoins
```
GET    /api/restauration/besoins?date=...&type_service=...
POST   /api/restauration/besoins
GET    /api/restauration/besoins/{besoin_id}
POST   /api/restauration/besoins/{besoin_id}/deduire-stock
PATCH  /api/restauration/besoins/{besoin_id}/valider
```

#### Consommation
```
POST   /api/restauration/consommation
GET    /api/restauration/consommation?date=...
PATCH  /api/restauration/consommation/{consommation_id}
```

#### Pertes
```
POST   /api/restauration/pertes
GET    /api/restauration/pertes?date_from=...&date_to=...
GET    /api/restauration/pertes/statistiques?mois=...
DELETE /api/restauration/pertes/{perte_id}
```

#### Rapports
```
GET    /api/restauration/rapports/journalier?date=YYYY-MM-DD
GET    /api/restauration/rapports/mensuel?mois=YYYY-MM
GET    /api/restauration/rapports/annuel?annee=YYYY
POST   /api/restauration/rapports/export-pdf
POST   /api/restauration/rapports/export-excel
```

---

## 📈 PHASES D'IMPLÉMENTATION

### Phase 1 : Fondations (Priorité 1)
- [ ] Modèles & migrations (Menus, Catégories Tickets, Besoins)
- [ ] API CRUD de base
- [ ] Interface gestion menus (calendrier simple)
- [ ] Interface émission tickets

### Phase 2 : Intégration Stock (Priorité 1)
- [ ] Endpoint déduction stock avec validation
- [ ] Gestion des erreurs & rollback
- [ ] Fiche besoins quotidiens (display + bouton déduction)
- [ ] Historique des mouvements

### Phase 3 : Pertes & Suivi (Priorité 2)
- [ ] Gestion pertes/gaspillage
- [ ] Synchronisation vers Stock
- [ ] Statistiques gaspillage

### Phase 4 : Rapports & Export (Priorité 2)
- [ ] Rapports journalier/mensuel/annuel
- [ ] Export PDF professionnel
- [ ] Export Excel
- [ ] Dashboard avec widgets

### Phase 5 : Polish & Synchronisation Finances (Priorité 3)
- [ ] Intégration finale module Finances
- [ ] Tableaux de bord améliorés
- [ ] Notifications/alertes
- [ ] Tests & optimisations

---

## ✅ CRITÈRES DE SUCCÈS

- ✅ Menus variés gérables avec composition produits détaillée
- ✅ Déduction du stock **validée manuellement** via bouton
- ✅ Synchronisation bidirectionnelle avec module Stock (API)
- ✅ Gestion des pertes + gaspillage integrated dans Stock
- ✅ Rapports situation (journalière, mensuelle, annuelle) disponibles
- ✅ Exports PDF/Excel fonctionnels
- ✅ Dashboard intégré aux dashboards existants
- ✅ Système de catégories tickets flexible
- ✅ Aucune perte de données lors des synchronisations
- ✅ Traçabilité complète des mouvements

---

## 📝 Notes Additionnelles

1. **Tarifs** : Actuels = 150 FCFA (Petit déj), 350 FCFA (Déj & Dîner) → À paramétrer
2. **Devises** : FCFA uniquement
3. **Langues** : Français prioritaire
4. **Permissions** : À définir (Admin, Agent Resto, Responsable Resto, Comptable)
5. **Audit** : Logger tous les mouvements (qui, quoi, quand, changements)
6. **Sécurité** : Valider les quantités, empêcher montants négatifs, authentification requise

---

**Document généré le** : 2025-04-24
**Version** : 1.0 Final