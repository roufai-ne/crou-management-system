# Module Procurement - Gestion des Achats

## 📋 Vue d'ensemble

Le module **Procurement** (Achats) gère le workflow complet des bons de commande (BC) :
- ✅ Création de brouillons par les financiers
- ✅ Soumission pour approbation
- ✅ Approbation par le directeur avec engagement budgétaire
- ✅ Envoi au fournisseur
- ✅ Réception (totale ou partielle) avec mise à jour du stock
- ✅ Clôture automatique quand tout est réceptionné

## 🏗️ Architecture

### Entités créées

#### 1. **PurchaseOrder** (Bon de commande)
```typescript
- id: uuid
- reference: string (BC-{CROU}-{YEAR}-{NUMBER})
- budgetId: uuid (lien Budget)
- supplierId: uuid (lien Fournisseur)
- objet: string
- status: enum (DRAFT, SUBMITTED, APPROVED, ORDERED, PARTIALLY_RECEIVED, FULLY_RECEIVED, CLOSED, CANCELLED)
- montantHT, montantTVA, montantTTC: decimal
- dateCommande, dateEcheance, dateApprobation, dateEnvoi, dateReception: date
- createdBy, approvedBy, receivedBy: string
- items: OneToMany PurchaseOrderItem[]
- stockMovements: OneToMany StockMovement[]
```

**Workflow du statut :**
```
DRAFT → SUBMITTED → APPROVED → ORDERED → PARTIALLY_RECEIVED → FULLY_RECEIVED → CLOSED
                          ↓
                      CANCELLED
```

#### 2. **PurchaseOrderItem** (Ligne de commande)
```typescript
- id: uuid
- purchaseOrderId: uuid
- stockId: uuid (nullable - pour nouveaux articles)
- designation, codeArticle, reference: string
- quantiteCommandee, quantiteRecue, quantiteRestante: decimal
- prixUnitaire, montantTotal, montantTTC: decimal
- tauxTVA: decimal (19% par défaut)
- tauxRemise: decimal
```

**Méthodes :**
- `calculateTotal()`: Calcule montantTotal = (quantité × prix) - remise + TVA
- `recordReception(quantite)`: Enregistre une réception partielle/totale
- `updateRemainingQuantity()`: Met à jour quantiteRestante

### Relations ajoutées

#### Supplier.entity.ts
```typescript
@OneToMany(() => PurchaseOrder, order => order.supplier)
purchaseOrders: PurchaseOrder[];
```

#### StockMovement.entity.ts
```typescript
@Column({ nullable: true })
purchaseOrderId?: string;

@ManyToOne(() => PurchaseOrder)
purchaseOrder?: PurchaseOrder;
```

## 🛣️ Routes API

### Base URL: `/api/procurement`

#### 1. **Liste des bons de commande**
```http
GET /api/procurement/purchase-orders
Authorization: Bearer {token}
Permissions: procurement:read

Query params:
- status: PurchaseOrderStatus (filtrer par statut)
- supplierId: uuid (filtrer par fournisseur)
- budgetId: uuid (filtrer par budget)
- dateFrom: ISO date (date début)
- dateTo: ISO date (date fin)
- search: string (recherche dans référence, objet)

Response 200:
{
  "success": true,
  "data": {
    "orders": [
      {
        "id": "uuid",
        "reference": "BC-NIAMEY-2025-001",
        "objet": "Fournitures de bureau",
        "status": "APPROVED",
        "montantTTC": 500000,
        "dateCommande": "2025-01-15",
        "supplier": { "nom": "Fournisseur ABC" },
        "budget": { "numero": "BUD-2025-001" }
      }
    ]
  },
  "count": 1
}
```

#### 2. **Détails d'un bon de commande**
```http
GET /api/procurement/purchase-orders/:id
Authorization: Bearer {token}
Permissions: procurement:read

Response 200:
{
  "success": true,
  "data": {
    "order": {
      "id": "uuid",
      "reference": "BC-NIAMEY-2025-001",
      "items": [
        {
          "designation": "Stylos BIC",
          "quantiteCommandee": 100,
          "quantiteRecue": 50,
          "quantiteRestante": 50,
          "prixUnitaire": 250,
          "montantTTC": 29750
        }
      ],
      "stockMovements": [...]
    }
  }
}
```

#### 3. **Créer un bon de commande (brouillon)**
```http
POST /api/procurement/purchase-orders
Authorization: Bearer {token}
Permissions: procurement:write
Rate limit: 50/15min

Body:
{
  "budgetId": "uuid",
  "supplierId": "uuid",
  "objet": "Commande de fournitures",
  "description": "Détails optionnels",
  "dateEcheance": "2025-02-15",
  "items": [
    {
      "stockId": "uuid", // Optionnel
      "designation": "Stylos BIC bleus",
      "codeArticle": "STY-001",
      "quantiteCommandee": 100,
      "unite": "pièce",
      "prixUnitaire": 250,
      "tauxTVA": 19,
      "tauxRemise": 0
    }
  ],
  "adresseLivraison": "Campus universitaire...",
  "contactLivraison": "Jean Dupont",
  "telephoneLivraison": "+227 XX XX XX XX"
}

Response 201:
{
  "success": true,
  "message": "Bon de commande créé avec succès",
  "data": {
    "order": {
      "id": "uuid",
      "reference": "BC-NIAMEY-2025-001",
      "status": "DRAFT",
      "montantTTC": 29750
    }
  }
}
```

#### 4. **Soumettre pour approbation**
```http
POST /api/procurement/purchase-orders/:id/submit
Authorization: Bearer {token}
Permissions: procurement:write
Rate limit: 50/15min

Response 200:
{
  "success": true,
  "message": "BC soumis pour approbation",
  "data": { "order": {...} }
}

Erreur 400 (budget insuffisant):
{
  "success": false,
  "error": "Budget insuffisant. Disponible: 450000 XOF, Requis: 500000 XOF"
}
```

#### 5. **Approuver un bon de commande (Directeur)**
```http
POST /api/procurement/purchase-orders/:id/approve
Authorization: Bearer {token}
Permissions: procurement:approve
Rate limit: 50/15min

Body:
{
  "commentaire": "Approuvé sous réserve de vérification qualité"
}

Response 200:
{
  "success": true,
  "message": "BC approuvé et budget engagé",
  "data": { "order": { "status": "APPROVED" } }
}
```

**⚠️ Action effectuée :**
- Budget.montantEngage += montantTTC
- Budget.montantDisponible -= montantTTC
- Transaction ENGAGEMENT créée

#### 6. **Marquer comme commandé**
```http
POST /api/procurement/purchase-orders/:id/order
Authorization: Bearer {token}
Permissions: procurement:write

Response 200:
{
  "success": true,
  "message": "BC marqué comme commandé",
  "data": { "order": { "status": "ORDERED" } }
}
```

#### 7. **Réceptionner (Magasinier)**
```http
POST /api/procurement/purchase-orders/:id/receive
Authorization: Bearer {token}
Permissions: procurement:receive
Rate limit: 50/15min

Body:
{
  "receptionDate": "2025-01-20",
  "items": [
    {
      "itemId": "uuid",
      "quantiteRecue": 50
    }
  ],
  "commentaire": "Réception partielle - manque 50 pièces"
}

Response 200 (réception partielle):
{
  "success": true,
  "message": "BC partiellement réceptionné",
  "data": {
    "order": {
      "status": "PARTIALLY_RECEIVED",
      "montantReceptionne": 14875
    }
  }
}

Response 200 (réception totale):
{
  "success": true,
  "message": "BC totalement réceptionné et stock mis à jour",
  "data": {
    "order": {
      "status": "FULLY_RECEIVED",
      "isFullyReceived": true
    }
  }
}
```

**⚠️ Actions effectuées :**
- StockMovement (ENTREE/RECEPTION) créés pour chaque item
- Stock.quantiteActuelle += quantiteRecue
- Stock.quantiteDisponible += quantiteRecue
- Si totalement reçu :
  - Transaction DEPENSE créée
  - Budget.montantEngage -= montantTTC
  - Budget.montantRealise += montantTTC
  - Status → FULLY_RECEIVED

#### 8. **Annuler un bon de commande**
```http
POST /api/procurement/purchase-orders/:id/cancel
Authorization: Bearer {token}
Permissions: procurement:approve
Rate limit: 50/15min

Body:
{
  "motif": "Fournisseur ne peut pas livrer"
}

Response 200:
{
  "success": true,
  "message": "BC annulé",
  "data": { "order": { "status": "CANCELLED" } }
}
```

**⚠️ Action effectuée :**
- Si status = APPROVED ou ORDERED :
  - Budget.montantEngage -= montantTTC
  - Budget.montantDisponible += montantTTC

## 🔐 Permissions requises

| Action | Permission | Rôle typique |
|--------|-----------|--------------|
| Liste/Détails | `procurement:read` | Tous |
| Créer/Modifier | `procurement:write` | Financier, Gestionnaire |
| Soumettre | `procurement:write` | Financier |
| Approuver | `procurement:approve` | Directeur CROU |
| Commander | `procurement:write` | Financier |
| Réceptionner | `procurement:receive` | Magasinier |
| Annuler | `procurement:approve` | Directeur CROU |

## 📊 Intégrations

### Module Financial
- **Lecture** : Vérifie `Budget.montantDisponible` avant soumission
- **Écriture** :
  - Approbation → Engage le budget (`montantEngage += montantTTC`)
  - Réception totale → Crée Transaction DEPENSE et met à jour `montantRealise`
  - Annulation → Libère le budget engagé

### Module Stocks
- **Lecture** : Lie les items aux articles existants via `stockId`
- **Écriture** :
  - Réception → Crée `StockMovement` (ENTREE/RECEPTION)
  - Réception → Met à jour `Stock.quantiteActuelle` et `quantiteDisponible`

## 📁 Fichiers créés

```
packages/database/src/entities/
├── PurchaseOrder.entity.ts (310 lignes)
└── PurchaseOrderItem.entity.ts (195 lignes)

apps/api/src/modules/procurement/
├── procurement.service.ts (614 lignes)
├── procurement.controller.ts (354 lignes)
└── procurement.routes.ts (134 lignes)

apps/api/src/main.ts (modifié)
└── Route /api/procurement ajoutée avec rate limiter
```

## 🧪 Tests recommandés

### Workflow complet
```bash
# 1. Créer un BC brouillon
POST /api/procurement/purchase-orders

# 2. Soumettre pour approbation
POST /api/procurement/purchase-orders/{id}/submit

# 3. Approuver (Directeur)
POST /api/procurement/purchase-orders/{id}/approve

# 4. Marquer comme commandé
POST /api/procurement/purchase-orders/{id}/order

# 5. Réceptionner partiellement
POST /api/procurement/purchase-orders/{id}/receive
Body: { items: [{ itemId, quantiteRecue: 50 }] }

# 6. Réceptionner le reste
POST /api/procurement/purchase-orders/{id}/receive
Body: { items: [{ itemId, quantiteRecue: 50 }] }

# Vérifier le stock
GET /api/stocks/{stockId}
# quantiteActuelle doit avoir augmenté de 100

# Vérifier le budget
GET /api/financial/budgets/{budgetId}
# montantEngage = 0, montantRealise = montantTTC du BC
```

### Tests d'erreur
```bash
# Tester budget insuffisant
POST /api/procurement/purchase-orders/{id}/submit
# Avec montantTTC > Budget.montantDisponible

# Tester réception excessive
POST /api/procurement/purchase-orders/{id}/receive
Body: { items: [{ itemId, quantiteRecue: 150 }] }
# Doit échouer si quantiteCommandee = 100
```

## 🚀 Prochaines étapes (Frontend)

### Pages à créer

1. **Liste des bons de commande** (`/procurement/purchase-orders`)
   - Table avec filtres (statut, fournisseur, budget, dates)
   - Badges de statut colorés
   - Actions rapides (voir, modifier, soumettre)

2. **Création/Modification BC** (`/procurement/purchase-orders/new`)
   - Formulaire multi-étapes
   - Sélection budget avec affichage disponible
   - Sélection fournisseur avec infos contact
   - Tableau dynamique pour ajouter/retirer items
   - Calcul automatique des montants (HT, TVA, TTC)

3. **Détails BC** (`/procurement/purchase-orders/:id`)
   - Affichage complet du BC
   - Timeline du workflow (brouillon → approuvé → reçu)
   - Actions contextuelles selon statut et permissions
   - Liste des mouvements de stock associés

4. **Approbation BC** (`/procurement/approvals`)
   - Liste des BC en attente d'approbation
   - Vue détaillée avec vérification budget
   - Formulaire d'approbation/rejet avec commentaire

5. **Réception BC** (`/procurement/receptions`)
   - Liste des BC commandés à réceptionner
   - Formulaire de réception avec contrôle quantités
   - Photos/documents de réception (upload)

## 📈 Statistiques possibles

```typescript
// Dashboard Procurement
{
  "totalBCs": 156,
  "enCours": 23,
  "montantEngage": 45000000,
  "montantReceptionne": 38000000,
  "tauxReception": 84.4,
  "bcEnRetard": 5,
  "topFournisseurs": [...]
}
```

## 🎯 Avantages du module

✅ **Traçabilité complète** : De la demande d'achat à la réception physique  
✅ **Contrôle budgétaire** : Vérification automatique des budgets disponibles  
✅ **Workflow validé** : Approbations obligatoires avec piste d'audit  
✅ **Intégration stocks** : Mise à jour automatique des inventaires  
✅ **Multi-tenant** : Chaque CROU gère ses propres achats  
✅ **Réceptions partielles** : Support des livraisons échelonnées  

## 🛠️ Configuration requise

### Variables d'environnement
Aucune variable supplémentaire requise - utilise la config existante.

### Base de données
```bash
# Générer la migration
pnpm run migration:generate

# Appliquer la migration
pnpm run migration:run
```

### Permissions à ajouter dans la base
```sql
INSERT INTO permissions (code, nom, description) VALUES
  ('procurement:read', 'Voir les achats', 'Consultation des bons de commande'),
  ('procurement:write', 'Gérer les achats', 'Créer et modifier des bons de commande'),
  ('procurement:approve', 'Approuver les achats', 'Approuver et annuler des bons de commande'),
  ('procurement:receive', 'Réceptionner', 'Réceptionner les commandes');
```

---

**Module complété le** : Janvier 2025  
**Auteur** : GitHub Copilot  
**Statut** : ✅ Backend complet - Frontend à développer
