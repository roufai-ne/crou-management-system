# Module Transport - Frontend Universal Tickets Implementation

**Date**: 2025-01-21
**Statut**: ✅ Frontend Terminé
**Système**: Tickets Transport Universels avec Tarifs Configurables

---

## 📋 Résumé des Modifications

Le frontend a été entièrement mis à jour pour supporter le système de tickets universels avec tarifs configurables. Les tickets ne sont plus liés à des circuits spécifiques et utilisent maintenant un système de prix administrable.

---

## 🎯 Fichiers Créés

### 1. **TransportPricesTab.tsx** ✅
**Chemin**: `apps/web/src/components/transport/TransportPricesTab.tsx`

Interface complète de gestion des tarifs pour les administrateurs.

**Fonctionnalités**:
- ✅ Liste tous les tarifs configurés avec statistiques
- ✅ Création de nouveaux tarifs (catégories: Standard, Boursier, Réduit, Personnel, Externe)
- ✅ Modification des tarifs existants
- ✅ Activation/Désactivation de tarifs
- ✅ Définition d'un tarif par défaut
- ✅ Suppression de tarifs (si aucun ticket émis)
- ✅ Statistiques par tarif (tickets émis, revenus)
- ✅ Conditions d'application (justificatifs requis, notes)

**UI Composants**:
- Tableau de tarifs avec badges de statut
- Modal de création/édition avec formulaire complet
- Actions rapides (étoile pour défaut, toggle actif/inactif)
- Cartes statistiques (total tarifs, actifs, tickets émis, revenus)

---

### 2. **transportPriceService.ts** ✅
**Chemin**: `apps/web/src/services/api/transportPriceService.ts`

Service API client pour la gestion des tarifs.

**Exports**:
```typescript
export enum TicketPriceCategory {
  STANDARD = 'standard',
  BOURSIER = 'boursier',
  REDUIT = 'reduit',
  PERSONNEL = 'personnel',
  EXTERNE = 'externe'
}

export interface TransportTicketPrice {
  id: string;
  tenantId: string;
  category: TicketPriceCategory;
  name: string;
  description: string;
  amount: number;
  isActive: boolean;
  isDefault: boolean;
  displayOrder: number;
  totalTicketsIssued: number;
  totalRevenue: number;
  conditions: {
    requiresProof: boolean;
    proofType: string;
    notes: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Méthodes**:
- `getActivePrices()`: Récupère les tarifs actifs
- `getAllPrices()`: Récupère tous les tarifs
- `createPrice(data)`: Crée un nouveau tarif
- `updatePrice(id, data)`: Met à jour un tarif
- `setAsDefault(id)`: Définit un tarif par défaut
- `activatePrice(id)`: Active un tarif
- `deactivatePrice(id)`: Désactive un tarif
- `deletePrice(id)`: Supprime un tarif
- `getStatistics()`: Obtient les statistiques

---

### 3. **useTransportPrices.ts** ✅
**Chemin**: `apps/web/src/hooks/useTransportPrices.ts`

Hook React pour la gestion d'état des tarifs.

**Fonctionnalités**:
- ✅ Chargement automatique des tarifs au montage
- ✅ Gestion des états de chargement et erreurs
- ✅ Notifications toast automatiques
- ✅ Refresh manuel disponible
- ✅ Cache des tarifs actifs et tous les tarifs

**Utilisation**:
```typescript
const {
  prices,           // Tous les tarifs
  activePrices,     // Tarifs actifs uniquement
  statistics,       // Statistiques globales
  loading,          // État de chargement
  createPrice,      // Créer un tarif
  updatePrice,      // Mettre à jour
  setAsDefault,     // Définir par défaut
  activatePrice,    // Activer
  deactivatePrice,  // Désactiver
  deletePrice,      // Supprimer
  refresh           // Rafraîchir
} = useTransportPrices();
```

---

## 🔄 Fichiers Modifiés

### 4. **transportTicketService.ts** ✅
**Chemin**: `apps/web/src/services/api/transportTicketService.ts`

**Changements TypeScript**:

#### ❌ Supprimé:
```typescript
// SUPPRIMÉ: Enum CategorieTicketTransport
export enum CategorieTicketTransport {
  PAYANT = 'payant',
  GRATUIT = 'gratuit'
}
```

#### ✅ Interface TicketTransport Mise à Jour:
```typescript
export interface TicketTransport {
  id: string;
  tenantId: string;
  numeroTicket: string;
  qrCode: string;

  // NOUVEAU: Informations de prix (snapshot à l'émission)
  priceId: string;
  priceCategoryName: string;  // Ex: "Standard", "Boursier"
  tarif: number;

  // NOUVEAU: Validité annuelle
  annee: number;
  dateEmission: Date;
  validUntil: Date;            // 31/12/année
  isExpired: boolean;

  // MODIFIÉ: Utilisation
  estUtilise: boolean;
  dateUtilisation?: Date;
  busAssignmentId?: string;    // NOUVEAU: Quel bus utilisé

  // SUPPRIMÉ: circuitId, circuitNom, dateVoyage, dateExpiration, trajetId

  // Statut et métadonnées (inchangés)
  status: TicketTransportStatus;
  // ...
}
```

#### ✅ CreateTicketTransportRequest:
```typescript
// AVANT
export interface CreateTicketTransportRequest {
  circuitId: string;
  categorie: CategorieTicketTransport;
  tarif: number;
  dateVoyage: string;
  dateExpiration: string;
  annee?: number;
}

// APRÈS
export interface CreateTicketTransportRequest {
  priceId: string;           // ID du tarif configuré
  quantite?: number;         // Optionnel: défaut 1
  annee?: number;           // Optionnel: défaut année courante
  methodePaiement?: string;
  referencePaiement?: string;
  messageIndication?: string;
}
```

#### ✅ CreateTicketsTransportBatchRequest:
```typescript
// AVANT
export interface CreateTicketsTransportBatchRequest {
  circuitId: string;
  categorie: CategorieTicketTransport;
  tarif: number;
  dateVoyage: string;
  dateExpiration: string;
  quantite: number;
  annee?: number;
}

// APRÈS
export interface CreateTicketsTransportBatchRequest {
  priceId: string;           // ID du tarif configuré
  quantite: number;         // Max 1000
  annee?: number;           // Optionnel: défaut année courante
  methodePaiement?: string;
  referencePaiement?: string;
}
```

#### ✅ TicketTransportFilters:
```typescript
// AVANT
export interface TicketTransportFilters {
  status?: TicketTransportStatus;
  categorie?: CategorieTicketTransport;  // SUPPRIMÉ
  circuitId?: string;                     // SUPPRIMÉ
  dateVoyageDebut?: string;               // SUPPRIMÉ
  dateVoyageFin?: string;                 // SUPPRIMÉ
  // ...
}

// APRÈS
export interface TicketTransportFilters {
  status?: TicketTransportStatus;
  priceId?: string;                       // NOUVEAU
  priceCategoryName?: string;             // NOUVEAU
  dateEmissionDebut?: string;
  dateEmissionFin?: string;
  dateUtilisationDebut?: string;          // NOUVEAU
  dateUtilisationFin?: string;            // NOUVEAU
  annee?: number;
  estUtilise?: boolean;
  isExpired?: boolean;                    // NOUVEAU
  // ...
}
```

#### ✅ TicketTransportStatistics:
```typescript
// AVANT
export interface TicketTransportStatistics {
  // ...
  totalPayants: number;      // SUPPRIMÉ
  totalGratuits: number;     // SUPPRIMÉ
  ticketsParCircuit: Array<{  // SUPPRIMÉ
    circuitId: string;
    circuitNom: string;
    count: number;
  }>;
}

// APRÈS
export interface TicketTransportStatistics {
  totalEmis: number;
  totalActifs: number;
  totalUtilises: number;
  totalExpires: number;
  totalAnnules: number;
  recettesTotales: number;
  ticketsParCategorie: Array<{  // NOUVEAU
    priceId: string;
    categoryName: string;
    count: number;
    revenue: number;
  }>;
  evolutionMensuelle: Array<{
    mois: string;
    emis: number;
    utilises: number;
  }>;
}
```

---

### 5. **TicketsTransportTab.tsx** ✅
**Chemin**: `apps/web/src/components/transport/TicketsTransportTab.tsx`

**Changements Majeurs**:

#### ✅ Imports:
```typescript
// SUPPRIMÉ
import { useTransportRoutes } from '@/hooks/useTransport';
import { CategorieTicketTransport } from '@/services/api/transportTicketService';
import { DateInput } from '@/components/ui';

// AJOUTÉ
import { useTransportPrices } from '@/hooks/useTransportPrices';
```

#### ✅ State du Formulaire:
```typescript
// AVANT
const [formData, setFormData] = useState({
  categorie: CategorieTicketTransport.PAYANT,
  tarif: 0,
  annee: new Date().getFullYear()
});

// APRÈS
const [formData, setFormData] = useState({
  priceId: '',
  annee: new Date().getFullYear()
});
```

#### ✅ Hooks:
```typescript
// AJOUTÉ
const { activePrices } = useTransportPrices();

// SUPPRIMÉ
const { routes = [] } = useTransportRoutes({ status: 'active' });
```

#### ✅ Colonnes du Tableau:
```typescript
// AVANT
{
  key: 'numero',
  label: 'Numéro',
  render: (ticket) => (
    <div>
      <p>{ticket.numeroTicket}</p>
      <p>{getCategorieLabel(ticket.categorie)}</p>  // SUPPRIMÉ
    </div>
  )
},
{
  key: 'circuit',                                    // SUPPRIMÉ
  label: 'Circuit',
  render: (ticket) => (
    <div>
      <p>{ticket.circuitNom || ticket.circuitId}</p>
      <p>{new Date(ticket.dateVoyage).toLocaleDateString()}</p>
    </div>
  )
},

// APRÈS
{
  key: 'numero',
  label: 'Numéro',
  render: (ticket) => (
    <div>
      <p>{ticket.numeroTicket}</p>
      <p>{ticket.priceCategoryName}</p>              // NOUVEAU
    </div>
  )
},
{
  key: 'validite',                                   // NOUVEAU
  label: 'Validité',
  render: (ticket) => (
    <div>
      <p>Jusqu'au {new Date(ticket.validUntil).toLocaleDateString()}</p>
      <p>Émis: {new Date(ticket.dateEmission).toLocaleDateString()}</p>
    </div>
  )
},
```

#### ✅ Filtres:
```typescript
// AVANT
<Select
  value={filters.categorie || ''}
  onChange={(value) => setFilters({ ...filters, categorie: value })}
  options={[
    { value: '', label: 'Toutes catégories' },
    { value: CategorieTicketTransport.PAYANT, label: 'Payant' },
    { value: CategorieTicketTransport.GRATUIT, label: 'Gratuit' }
  ]}
/>

// APRÈS
<Select
  value={filters.priceId || ''}
  onChange={(value) => setFilters({ ...filters, priceId: String(value) })}
  options={[
    { value: '', label: 'Tous les tarifs' },
    ...activePrices.map((price) => ({
      value: price.id,
      label: price.name
    }))
  ]}
/>
```

#### ✅ Modal Émission Individuelle:
```typescript
// AVANT
<Select label="Circuit de transport" ... />
<Select label="Catégorie" ... />
<Input label="Tarif (XOF)" ... />
<DateInput label="Date du voyage" ... />
<DateInput label="Date d'expiration" ... />

// APRÈS
<Select
  label="Tarif *"
  value={formData.priceId || ''}
  onChange={(value) => setFormData({ ...formData, priceId: String(value) })}
  options={[
    { value: '', label: 'Sélectionner un tarif' },
    ...activePrices.map((price) => ({
      value: price.id,
      label: `${price.name} - ${price.amount.toLocaleString()} XOF`
    }))
  ]}
/>

{formData.priceId && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <p>Montant: {getSelectedPriceAmount(formData.priceId).toLocaleString()} XOF</p>
    <p>Valide jusqu'au 31/12/{formData.annee || new Date().getFullYear()}</p>
  </div>
)}

<Input
  label="Année (optionnel)"
  type="number"
  placeholder={String(new Date().getFullYear())}
  value={formData.annee || ''}
/>
```

#### ✅ Modal Émission en Lot:
```typescript
// Mêmes changements que modal individuelle, plus:
{batchFormData.quantite && batchFormData.priceId && (
  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
    <p>Montant total: {(batchFormData.quantite * getSelectedPriceAmount(batchFormData.priceId)).toLocaleString()} XOF</p>
    <p>{batchFormData.quantite} ticket(s) × {getSelectedPriceAmount(batchFormData.priceId).toLocaleString()} XOF</p>
    <p>Valides jusqu'au 31/12/{batchFormData.annee || new Date().getFullYear()}</p>
  </div>
)}
```

#### ✅ Modal Utilisation:
```typescript
// AVANT
<div>Circuit: {selectedTicket.circuitNom}</div>
<div>Date voyage: {new Date(selectedTicket.dateVoyage).toLocaleDateString()}</div>

// APRÈS
<div>Catégorie: {selectedTicket.priceCategoryName}</div>
<div>Valide jusqu'au: {new Date(selectedTicket.validUntil).toLocaleDateString()}</div>
```

---

## 📊 Comparaison Avant/Après

### Workflow Émission de Tickets

#### ❌ AVANT (Circuit-Based):
1. Sélectionner un circuit
2. Choisir catégorie (Payant/Gratuit)
3. Saisir tarif manuellement
4. Saisir date de voyage
5. Saisir date d'expiration
6. Émettre

**Problèmes**:
- Tarifs non standardisés
- Tickets liés aux circuits
- Dates manuelles, risque d'erreur
- Pas de flexibilité tarifaire

#### ✅ APRÈS (Universal Tickets):
1. Sélectionner un tarif prédéfini
2. (Optionnel) Ajuster l'année
3. Émettre

**Avantages**:
- Tarifs centralisés et cohérents
- Tickets utilisables sur tous les bus
- Validité automatique (31/12/année)
- Tarifs configurables par admin
- Support multi-catégories (Standard, Boursier, etc.)

---

## 🎨 Interface Utilisateur

### Page Transport - Onglet Tarifs (NOUVEAU)
```
┌─────────────────────────────────────────────────────────┐
│  Gestion des Tarifs                   [+ Nouveau Tarif] │
├─────────────────────────────────────────────────────────┤
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │ Total: 5 │ │ Actifs:4 │ │Tickets:  │ │ Revenu:  │   │
│  │          │ │          │ │  12,450  │ │2,490,000 │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
├─────────────────────────────────────────────────────────┤
│ Tarif            │Catégorie │ Montant  │ Tickets │ Rev │
│ ⭐ Standard      │ Standard │  200 XOF │  8,000  │1.6M │
│ Boursier         │ Boursier │    0 XOF │  4,000  │  0  │
│ Réduit           │ Réduit   │  100 XOF │    350  │ 35K │
│ Personnel        │ Personnel│  150 XOF │     85  │12.7K│
│ 🔒 Externe       │ Externe  │  300 XOF │     15  │4.5K │
└─────────────────────────────────────────────────────────┘
```

### Modal Émission Ticket (AVANT vs APRÈS)

#### ❌ AVANT:
```
┌─────────────────────────────────┐
│ Émettre un Ticket               │
├─────────────────────────────────┤
│ Circuit:    [Sélectionner ▼]    │
│ Catégorie:  [Payant      ▼]    │
│ Tarif:      [200         ]     │
│ Date voyage:[15/01/2025  ]     │
│ Expiration: [31/12/2025  ]     │
│                                 │
│       [Annuler] [Émettre]      │
└─────────────────────────────────┘
```

#### ✅ APRÈS:
```
┌─────────────────────────────────┐
│ Émettre un Ticket               │
├─────────────────────────────────┤
│ Tarif: [Standard - 200 XOF ▼]  │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ Montant: 200 XOF            │ │
│ │ Valide jusqu'au 31/12/2025  │ │
│ └─────────────────────────────┘ │
│                                 │
│ Année:  [2025        ] (opt.)  │
│                                 │
│       [Annuler] [Émettre]      │
└─────────────────────────────────┘
```

---

## ✅ Tests à Effectuer

### 1. Gestion des Tarifs
- [ ] Créer un nouveau tarif Standard (200 XOF)
- [ ] Créer un tarif Boursier (0 XOF)
- [ ] Modifier un tarif existant
- [ ] Définir un tarif par défaut (étoile)
- [ ] Activer/Désactiver un tarif
- [ ] Tenter de supprimer un tarif avec tickets émis (doit échouer)
- [ ] Supprimer un tarif sans tickets émis

### 2. Émission de Tickets
- [ ] Émettre un ticket avec tarif Standard
- [ ] Émettre un ticket avec tarif Boursier (gratuit)
- [ ] Émettre un lot de 100 tickets
- [ ] Vérifier que validUntil = 31/12/année
- [ ] Vérifier snapshot du tarif dans le ticket

### 3. Affichage et Filtres
- [ ] Afficher liste des tickets
- [ ] Filtrer par tarif (Standard, Boursier, etc.)
- [ ] Filtrer par statut (Actif, Utilisé, Expiré)
- [ ] Vérifier colonne "Validité" au lieu de "Circuit"
- [ ] Vérifier catégorie affichée (priceCategoryName)

### 4. Utilisation de Tickets
- [ ] Scanner/Saisir numéro ticket
- [ ] Vérifier affichage: catégorie, validité, tarif
- [ ] Valider utilisation
- [ ] Vérifier qu'un ticket utilisé ne peut plus être réutilisé

### 5. Statistiques
- [ ] Vérifier statistiques globales (cartes)
- [ ] Vérifier statistiques par tarif
- [ ] Vérifier recettes totales
- [ ] Vérifier évolution mensuelle

---

## 🚀 Prochaines Étapes Backend

Les modifications frontend sont **terminées**. Le backend doit maintenant être mis à jour :

### Backend À Faire:
1. ✅ Migrations déjà créées:
   - `1737400000000-RemoveCircuitFromTickets.ts`
   - `1737400100000-CreateTransportTicketPrices.ts`

2. ⏳ À Activer:
   - Remplacer `ticket-transport.service.ts` par `.NEW.ts`
   - Créer `transport-price.controller.ts`
   - Mettre à jour `transport.routes.ts`
   - Exécuter les migrations
   - Tester les endpoints

### Routes Backend Nécessaires:
```
GET    /api/transport/prices              # Tous les tarifs
GET    /api/transport/prices/active       # Tarifs actifs
POST   /api/transport/prices              # Créer tarif
PUT    /api/transport/prices/:id          # Modifier tarif
PUT    /api/transport/prices/:id/default  # Définir défaut
PUT    /api/transport/prices/:id/activate # Activer
PUT    /api/transport/prices/:id/deactivate # Désactiver
DELETE /api/transport/prices/:id          # Supprimer
GET    /api/transport/prices/statistics   # Statistiques

POST   /api/transport/tickets             # Émettre (nouveau DTO)
POST   /api/transport/tickets/batch       # Lot (nouveau DTO)
GET    /api/transport/tickets             # Liste (nouveaux filtres)
```

---

## 📝 Notes Importantes

### Rétrocompatibilité
⚠️ **Breaking Changes**: Les anciennes requêtes d'émission ne fonctionneront plus.
- Les DTOs ont changé (priceId au lieu de circuitId, categorie, tarif)
- Les anciennes données de tickets doivent être migrées
- Migration SQL met `validUntil = '2025-12-31'` pour tickets actifs existants

### Données Migration
La migration SQL `1737400000000` met à jour automatiquement:
- `validUntil` = `dateExpiration` pour tickets utilisés
- `validUntil` = '2025-12-31' pour tickets actifs
- Supprime `circuit_id`, `date_voyage`
- Renomme `date_expiration` → `valid_until`

### Performance
- Hook `useTransportPrices` charge les tarifs UNE FOIS au montage
- `activePrices` filtrés côté client (pas de requête supplémentaire)
- Statistiques cachées dans le composant TransportPricesTab

---

## 🎉 Résultat Final

### ✅ Fonctionnalités Complètes:
1. **Gestion Tarifs**: Interface admin complète
2. **Émission Simplifiée**: 2 champs au lieu de 5
3. **Tickets Universels**: Utilisables sur tous les bus
4. **Validité Automatique**: 31/12/année
5. **Multi-Catégories**: Standard, Boursier, Réduit, Personnel, Externe
6. **Statistiques**: Par tarif et globales
7. **Flexibilité**: Admins peuvent créer leurs propres tarifs

### ✅ UX Améliorée:
- Moins de champs à remplir
- Moins d'erreurs possibles
- Tarifs cohérents
- Interface intuitive
- Feedback visuel (badges, couleurs)

---

**Prêt pour tests et intégration backend!** 🚀
