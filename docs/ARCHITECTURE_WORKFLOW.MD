# 🏗️ ARCHITECTURE & WORKFLOWS - Intégration Restauration CROU

## 📐 Diagramme Architectural Global

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PLATEFORME CROU - Niger                            │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────┐
│   MODULE RESTAURATION    │       ┌────────────────────────────┐
│      (NOUVEAU)           │◄─────►│   MODULE STOCK             │
├──────────────────────────┤       │   (EXISTANT)               │
│ • Menus & Recettes       │       │ • Produits                 │
│ • Tickets & Catégories   │       │ • Quantités                │
│ • Besoins Quotidiens     │       │ • Mouvements               │
│ • Pertes/Gaspillage      │       │ • Seuils d'alerte          │
│ • Dashboard Restaurant   │       │ • Commandes fournisseurs   │
└──────────────────────────┘       └────────────────────────────┘
         │                                      ▲
         │                                      │
         │          API REST                    │
         └──────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         ▼            ▼            ▼
    ┌─────────┐ ┌──────────┐ ┌──────────────┐
    │ FINANCES│ │COMPTABI- │ │  CALENDRIER  │
    │RECETTES │ │LITÉ      │ │  ACADÉMIQUE  │
    │(EXISTANT)│ │(EXISTANT)│ │ (RÉFÉRENCE)  │
    └─────────┘ └──────────┘ └──────────────┘

┌─────────────────────────────────────────────────────────────┐
│              BASE DE DONNÉES RESTAURATION                    │
├─────────────────────────────────────────────────────────────┤
│ • Menus (composition produits)                               │
│ • Tickets (catégories, émissions)                            │
│ • Besoins Quotidiens (fiche journalière)                     │
│ • Consommation (suivi post-service)                          │
│ • Pertes/Gaspillage (historique mouvements)                  │
│ • Rapports (agrégations, exports)                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 WORKFLOW 1 : Gestion d'un Service Restauration (Journée type)

```
MATIN (J-1 soir ou J matin)
├─ [GESTIONNAIRE RESTO] Crée/Sélectionne menu du jour
│  └─ Système calcule besoins = nombre_rationnaires × rations_menu
│
├─ [SYSTÈME] Affiche tableau besoins avec stock disponible
│  └─ Statut : ✓ OK ou ⚠️ INSUFFISANT pour chaque produit
│
├─ [RESPONSABLE RESTO] Valide & clique "Valider & Déduire du Stock"
│  │  └─ Pop-up confirmation : "Confirmer déduction de X produits ?"
│  │
│  └─ [API CALL] POST /api/stock/mouvements
│     ├─ Type: "Consommation_Restauration"
│     ├─ Produits: [{id, qté, besoin_id}, ...]
│     ├─ Réponse: ✓ OK ou ✗ ERREUR (ex: stock épuisé depuis)
│     └─ Statut besoin passe à : "Stock_Déduit"

MIDI/SOIR (Pendant le service)
├─ [AGENT TICKETING] Émet tickets via interface
│  ├─ Sélectionne catégorie (régulier, gratuit, etc.)
│  ├─ Saisit quantité
│  └─ Système enregistre avec montant
│
└─ [SERVICE DE RESTAURATION] Prépare & sert selon menu

APRÈS SERVICE (J soir)
├─ [AGENT RESTO] Enregistre consommation réelle
│  ├─ Nombre rationnaires effectivement servis
│  ├─ Anomalies (ex: menu demi-portion)
│  └─ Statut besoin passe à : "Consommé"
│
└─ [GÉRANT] Saisit pertes constatées (si nécessaire)
   ├─ Produit, quantité, motif (périmé/gaspillage)
   ├─ [API CALL] POST /api/stock/mouvements (Perte)
   └─ Valeur FCFA calculée & tracée

RAPPORT (J+1 matin)
├─ Dashboard affiche :
│  ├─ Fréquentation hier
│  ├─ Recettes hier
│  ├─ Pertes constatées
│  └─ État stock après déductions
│
└─ Export rapport journalier disponible (PDF/Excel)
```

---

## 🔄 WORKFLOW 2 : Déduction du Stock (Détail technique)

```
[INTERFACE RESTAURATION]
        │
        │  Besoin Quotidien créé/validé
        │  + Quantités calculées
        │
        ▼
    ┌───────────────────────────────────────┐
    │ BOUTON "Valider & Déduire du Stock"   │
    │ [ROUGE - Action Critique]             │
    └───────────────────────────────────────┘
        │
        │  User clique
        │
        ▼
    ┌──────────────────────────────────┐
    │ MODAL CONFIRMATION               │
    ├──────────────────────────────────┤
    │ "Êtes-vous sûr ?"               │
    │ Résumé produits à déduire:       │
    │ • Riz: 50 kg                     │
    │ • Sauce: 20 L                    │
    │                                  │
    │ [ANNULER] [CONFIRMER]           │
    └──────────────────────────────────┘
        │
        │  Click [CONFIRMER]
        │
        ▼
    ┌──────────────────────────────────────────────────┐
    │ API REQUEST                                      │
    ├──────────────────────────────────────────────────┤
    │ POST /api/stock/mouvements                       │
    │                                                  │
    │ {                                                │
    │   "type_mouvement": "Consommation_Restauration", │
    │   "date": "2025-04-24",                          │
    │   "reference_restauration": "besoin_id_xyz",     │
    │   "mouvements": [                                │
    │     {                                            │
    │       "produit_id": "prod_riz_123",              │
    │       "quantite": 50,                            │
    │       "unite": "kg",                             │
    │       "motif": "Besoins quotidiens validés"      │
    │     },                                           │
    │     { ... }                                      │
    │   ]                                              │
    │ }                                                │
    └──────────────────────────────────────────────────┘
        │
        ▼ (Module Stock traite)
    ┌──────────────────────────────────────────────────┐
    │ VALIDATION STOCK                                 │
    ├──────────────────────────────────────────────────┤
    │ Pour chaque produit:                             │
    │ 1. Vérifier stock actuel >= quantité demandée    │
    │ 2. Si OK → Créer mouvement de déduction          │
    │ 3. Si KO → Rejeter & retourner erreur            │
    │                                                  │
    │ Vérifications:                                   │
    │ • Riz: 150 kg dispo ≥ 50 kg demandé ✓ OK         │
    │ • Sauce: 30 L dispo ≥ 20 L demandé ✓ OK          │
    └──────────────────────────────────────────────────┘
        │
        ├─ SUCCÈS ──────────────────┐
        │                           │
        │                           ▼
        │                 ┌─────────────────────────────┐
        │                 │ API RESPONSE (200 OK)       │
        │                 ├─────────────────────────────┤
        │                 │ {                           │
        │                 │   "success": true,          │
        │                 │   "mouvements_crees": 2,    │
        │                 │   "total_deduit_fcfa": 5000 │
        │                 │ }                           │
        │                 └─────────────────────────────┘
        │                           │
        │                           ▼
        │                 ┌─────────────────────────────┐
        │                 │ INTERFACE RESTO             │
        │                 ├─────────────────────────────┤
        │                 │ ✓ Déduction confirmée !     │
        │                 │ Statut → "Stock_Déduit"     │
        │                 │ Stock mis à jour             │
        │                 └─────────────────────────────┘
        │
        └─ ERREUR ──────────────────┐
                                    │
                                    ▼
                          ┌─────────────────────────────┐
                          │ API RESPONSE (400/409)      │
                          ├─────────────────────────────┤
                          │ {                           │
                          │   "success": false,         │
                          │   "erreur": "Stock insuffisant pour Riz", │
                          │   "produit_id": "prod_riz_123", │
                          │   "stock_dispo": 30,        │
                          │   "quantite_demandee": 50   │
                          │ }                           │
                          └─────────────────────────────┘
                                    │
                                    ▼
                          ┌─────────────────────────────┐
                          │ INTERFACE RESTO             │
                          ├─────────────────────────────┤
                          │ ⚠️ ERREUR - Stock Insuffisant│
                          │ Riz: 30 kg dispo vs 50 demandé │
                          │                             │
                          │ Options:                    │
                          │ [Réduire qté] [Changer menu]│
                          │ [Confirmer quand même]      │
                          └─────────────────────────────┘

[HISTORIQUE] Tous les mouvements sont enregistrés pour audit
```

---

## 🔄 WORKFLOW 3 : Gestion des Pertes/Gaspillage

```
CONSTATATION (Pendant/Après service)
│
▼
[AGENT RESTO] Accède à "Nouvelle Perte"
│
├─ Saisies :
│  ├─ Produit (search/dropdown)
│  ├─ Quantité perdue
│  ├─ Motif (Périmé / Gaspillage / Détérioration / Autre)
│  ├─ Date péremption (si périmé)
│  ├─ Description détaillée
│  └─ Photo (optionnel)
│
▼
[SYSTÈME] Calcule automatiquement :
│  └─ Valeur FCFA = Quantité × Prix_Unitaire_Stock
│
▼
[AGENT RESTO] Click "Enregistrer perte"
│
▼
[API CALL] POST /api/stock/mouvements
│  ├─ Type: "Perte_Gaspillage"
│  ├─ Produit, quantité
│  ├─ Motif
│  ├─ Valeur FCFA
│  └─ Reference: "perte_id_xyz"
│
▼
[MODULE STOCK] Met à jour quantités
│  └─ Stock_Déduit = quantité - perte
│
▼
[HISTORIQUE] Enregistré pour :
   ├─ Audit/Traçabilité
   ├─ Calcul taux gaspillage
   └─ Rapports financiers

RAPPORTS PERTES (Mensuels)
└─ Taux de gaspillage : X% du stock consommé
└─ Coût total pertes : Y FCFA
└─ Produit le plus gaspillé : [Produit]
```

---

## 📊 WORKFLOW 4 : Génération de Rapports

```
[UTILISATEUR] Accède à "Rapports" dans menu
│
├─ Sélectionne :
│  ├─ Plage de dates
│  └─ Type rapport (Journalier / Mensuel / Annuel)
│
▼
[SYSTÈME] Agrège données :
│
├─ RAPPORT JOURNALIER :
│  ├─ Par type_service (Petit déj, Déjeuner, Dîner)
│  ├─ Tickets payants / gratuits
│  ├─ Total consommateurs
│  ├─ Recettes FCFA
│  ├─ Menu servi
│  └─ Pertes constatées
│
├─ RAPPORT MENSUEL :
│  ├─ Synthèse par semaine
│  ├─ Moyennes quotidiennes
│  ├─ Évolution vs mois précédent
│  ├─ Produits consommés
│  └─ Taux de gaspillage
│
└─ RAPPORT ANNUEL :
   ├─ Synthèse par mois
   ├─ Tendances annuelles
   ├─ Comparaisons trimestrielles
   └─ Analyse coûts/recettes

▼
[INTERFACE] Affiche :
│  ├─ Vue tableau (données brutes)
│  ├─ Graphiques (courbes, histogrammes)
│  └─ Statistiques clés
│
▼
[UTILISATEUR] Clique "Exporter"
│
├─ EXPORT PDF :
│  ├─ Mise en forme professionnelle
│  ├─ En-tête MESRIT + CROU
│  ├─ Tableaux + Graphiques
│  ├─ Signatures (si nécessaire)
│  └─ Logo institutionnel
│
└─ EXPORT EXCEL :
   ├─ Feuilles séparées (données, graphiques)
   ├─ Formules Excel (pour analyses ultérieures)
   ├─ Mise en forme (couleurs, bordes)
   └─ Pivot tables (optionnel)

▼
[TÉLÉCHARGEMENT] Fichier PDF ou XLSX
```

---

## 📍 POINTS D'INTÉGRATION CLÉS

### 1. Intégration Stock → Restauration (Lecture)
```
Besoin: Afficher stock disponible sur fiche besoins quotidiens

GET /api/stock/produits?type=Alimentaire
└─ Récupère liste produits disponibles

GET /api/stock/produits/{product_id}/disponibilite
└─ Retourne quantité actuelle + unité de mesure

Fréquence: À chaque chargement de page fiche besoins
Caching: 5-10 min pour optimiser performances
```

### 2. Restauration → Stock (Déduction)
```
Action: Valider & Déduire du Stock

POST /api/stock/mouvements
├─ Input: Besoin ID + Liste produits
├─ Logique: Créer mouvement de type "Consommation_Restauration"
└─ Output: ✓ Succès ou ✗ Erreur détaillée

Validation avant:
├─ Stock suffisant pour tous les produits
├─ Pas de déduction double (idempotence)
└─ Besoin n'est pas déjà déduit

Rollback: En cas d'erreur, aucun produit n'est déduit (transaction)
```

### 3. Restauration → Stock (Pertes)
```
Action: Enregistrer perte/gaspillage

POST /api/stock/mouvements
├─ Type: "Perte_Gaspillage"
├─ Motif: Périmé / Gaspillage / Détérioration
├─ Valeur FCFA: Calculée localement
└─ Reference: Lien vers perte_id

Synchronisation: Temps réel (pas de buffering)
Historique: Conservé pour audits ultérieurs
```

### 4. Restauration → Finances (Recettes)
```
Action: Exporter données financières

POST /api/finances/recettes_restauration
├─ Recettes du jour (par type_service)
├─ Tickets payants vs gratuits
├─ Montant total encaissable
└─ Comparaison vs tickets émis

Fréquence: Quotidienne (soir après service)
Format: JSON ou directement dans BD Finances
```

### 5. Restauration → Calendrier Académique
```
Utilisation: Afficher menus inactifs les jours de congé

GET /api/calendrier/periodes-fermeture?annee=2025
└─ Retourne dates de congés/fermetures

Impact: Menus automatiquement marqués "Inactifs" ces jours
Interface: Affichage visuel sur calendrier restauration
```

---

## ⚠️ GESTION DES ERREURS & EDGE CASES

| Scénario | Comportement | Résolution |
|----------|-------------|-----------|
| **Stock insuffisant** | Alerte avant déduction | Réduire rationnaires ou changer menu |
| **Produit non trouvé en stock** | API retourne erreur 404 | Option d'ajouter à demande d'achat |
| **Déduction double** | Système détecte (même besoin_id) | Popup "Déjà déduit" |
| **Perte > stock disponible** | Accepter quand même (audit) | Logged comme anomalie |
| **Pertes massives** | Alerter manager | Dashboard rouge si > X% |
| **Données synchronisation cassées** | Logs détaillés + notification | Admin : Reconciliator manuel |
| **Tarifs changent en cours jour** | Utiliser tarif du jour | Rapports affichent tarifs appliqués |
| **Export PDF timeout** | Générer en background | Notification email quand prêt |

---

## 🔐 SÉCURITÉ & PERMISSIONS

### Rôles d'Accès

| Rôle | Lecture | Création | Modification | Validation | Suppression |
|------|---------|----------|-------------|-----------|------------|
| **Admin** | ✓ Tout | ✓ Tout | ✓ Tout | ✓ Tout | ✓ Tout |
| **Responsable Resto** | ✓ Tout | ✓ Menus/Tickets | ✓ Menus/Pertes | ✓ Déductions | ✗ |
| **Agent Resto** | ✓ Consultation | ✓ Tickets/Pertes | ✓ Ses données | ✗ | ✗ |
| **Comptable** | ✓ Rapports | ✗ | ✗ | ✗ | ✗ |

### Audit Trail
- Tous les mouvements = log avec (User, Action, Timestamp, Avant/Après)
- Immuable : Pas de suppression directe (soft-delete ou archive)
- Export audit : Pour conformité MESRIT

---

## 📦 DÉPENDANCES EXTERNES

```
Frontend:
├─ React + Next.js (assumé existant)
├─ React Table / AG-Grid (tableaux)
├─ Chart.js / Recharts (graphiques)
├─ jsPDF (export PDF)
└─ xlsx (export Excel)

Backend:
├─ API REST framework (Django/FastAPI/Express)
├─ ORM (Django ORM / SQLAlchemy / Sequelize)
├─ PostgreSQL / MySQL (BD)
├─ Bull (task queue pour exports longs)
└─ Logger (Winston / Pino)

Intégrations:
├─ API Stock (existante)
├─ API Finances (existante)
└─ Calendrier Académique (existant)
```

---

## 🎯 CHECKLIST AVANT DÉMARRAGE IMPLÉMENTATION

- [ ] Accès aux sources du module Stock confirmé
- [ ] Documentation API Stock disponible & testée
- [ ] Schéma BD restauration finalisé
- [ ] Permissions/Rôles définis
- [ ] Environnement dev setup (DB, API mocks)
- [ ] Tests unitaires framework choisi
- [ ] Design UI approuvé par MESRIT
- [ ] Calendrier académique 2025 intégré
- [ ] Tarifs restauration confirmés (150/350/350)
- [ ] Plan de migration données existantes
- [ ] Procédure de backup & disaster recovery

---

**Prêt à démarrer l'implémentation ! 🚀**