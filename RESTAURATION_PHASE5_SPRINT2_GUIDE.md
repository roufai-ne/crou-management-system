# Phase 5 Sprint 2 - Guide d'Intégration

**Date**: Janvier 2025
**Statut**: EN ATTENTE D'INTÉGRATION
**Prérequis**: Sprint 1 complété ✅

---

## 📋 Objectifs du Sprint 2

1. Intégrer les formulaires créés dans Sprint 1 dans tous les tabs
2. Ajouter les Skeleton loaders pour améliorer l'UX
3. Remplacer les `confirm()` natifs par `ConfirmModal`
4. Ajouter les Toast notifications partout

---

## ✅ Exemple d'intégration réussie

### RestaurantsTab (✅ Déjà intégré)

Voici le pattern établi lors de Sprint 1 pour l'intégration de RestaurantForm:

**1. Imports**
```tsx
import { RestaurantForm } from './forms/RestaurantForm';
import toast from 'react-hot-toast';
import { CreateRestaurantRequest } from '@/services/api/restaurationService';
```

**2. État simplifié**
```tsx
// AVANT
const [formData, setFormData] = useState<any>({});

// APRÈS - Plus besoin! Le form gère son état
const [isSubmitting, setIsSubmitting] = useState(false);
```

**3. Handlers avec Toast**
```tsx
const handleCreate = async (data: CreateRestaurantRequest) => {
  setIsSubmitting(true);
  try {
    await createRestaurant(data);
    setIsCreateModalOpen(false);
    toast.success('Restaurant créé avec succès');
    refresh();
  } catch (err) {
    console.error('Erreur création restaurant:', err);
    toast.error('Erreur lors de la création du restaurant');
  } finally {
    setIsSubmitting(false);
  }
};
```

**4. Modal simplifié**
```tsx
<Modal
  isOpen={isCreateModalOpen}
  onClose={() => setIsCreateModalOpen(false)}
  title="Nouveau Restaurant"
  size="xl"
>
  <RestaurantForm
    onSubmit={handleCreate}
    onCancel={() => setIsCreateModalOpen(false)}
    isSubmitting={isSubmitting}
  />
</Modal>
```

**Résultat**: -180 lignes de code, meilleure maintenabilité

---

## 🔧 Intégrations à réaliser

### 1. TicketsTab - TicketEmissionForm

**Fichier**: `apps/web/src/components/restauration/TicketsTab.tsx`

**Problème actuel**:
- Ligne 34: `isEmissionModalOpen` existe mais le modal de création n'est pas implémenté
- Ligne 50: `handleEmission` existe mais prend `any` comme paramètre

**Action requise**:

```tsx
// 1. Importer
import { TicketEmissionForm } from './forms';
import toast from 'react-hot-toast';

// 2. Ajouter état
const [isSubmitting, setIsSubmitting] = useState(false);

// 3. Récupérer données nécessaires
const { restaurants } = useRestaurants(); // Hook à ajouter
const { etudiants } = useEtudiants(); // Hook à ajouter

// 4. Adapter handler
const handleEmission = async (data: EmettrTicketRequest | EmettrTicketRequest[]) => {
  setIsSubmitting(true);
  try {
    if (Array.isArray(data)) {
      // Batch emission
      await Promise.all(data.map(d => emettreTicket(d)));
      toast.success(`${data.length} tickets émis avec succès`);
    } else {
      // Single emission
      await emettreTicket(data);
      toast.success('Ticket émis avec succès');
    }
    setIsEmissionModalOpen(false);
    refresh();
  } catch (err) {
    console.error('Erreur émission ticket:', err);
    toast.error('Erreur lors de l\'émission du ticket');
  } finally {
    setIsSubmitting(false);
  }
};

// 5. Ajouter modal
<Modal
  isOpen={isEmissionModalOpen}
  onClose={() => setIsEmissionModalOpen(false)}
  title="Émettre des tickets"
  size="xl"
>
  <TicketEmissionForm
    restaurants={restaurants}
    etudiants={etudiants}
    onSubmit={handleEmission}
    onCancel={() => setIsEmissionModalOpen(false)}
    isSubmitting={isSubmitting}
  />
</Modal>
```

**⚠️ Dépendances manquantes**:
- Hook `useEtudiants` (ou fetch depuis API Scolarité)
- Liste des restaurants (déjà disponible via `useRestaurants`)

---

### 2. RepasTab - ServiceStatsForm

**Fichier**: `apps/web/src/components/restauration/RepasTab.tsx`

**Action requise**:

```tsx
// 1. Importer
import { ServiceStatsForm } from './forms';
import { useConfirmDialog } from '@/components/ui';
import toast from 'react-hot-toast';

// 2. Ajouter états
const [isTerminerModalOpen, setIsTerminerModalOpen] = useState(false);
const [selectedRepas, setSelectedRepas] = useState<Repas | null>(null);
const [isSubmitting, setIsSubmitting] = useState(false);
const { ConfirmDialog, confirm } = useConfirmDialog();

// 3. Handler terminer service
const handleTerminerService = async (repasId: string) => {
  const repas = repas.find(r => r.id === repasId);
  if (!repas) return;

  setSelectedRepas(repas);
  setIsTerminerModalOpen(true);
};

const handleTerminerSubmit = async (data: TerminerServiceRequest) => {
  if (!selectedRepas) return;

  setIsSubmitting(true);
  try {
    await terminerService(selectedRepas.id, data);
    toast.success('Service terminé avec succès');
    setIsTerminerModalOpen(false);
    setSelectedRepas(null);
    refresh();
  } catch (err) {
    console.error('Erreur terminaison service:', err);
    toast.error('Erreur lors de la terminaison du service');
  } finally {
    setIsSubmitting(false);
  }
};

// 4. Ajouter modal
<Modal
  isOpen={isTerminerModalOpen}
  onClose={() => setIsTerminerModalOpen(false)}
  title="Terminer le service"
  size="lg"
>
  {selectedRepas && (
    <ServiceStatsForm
      repas={selectedRepas}
      onSubmit={handleTerminerSubmit}
      onCancel={() => {
        setIsTerminerModalOpen(false);
        setSelectedRepas(null);
      }}
      isSubmitting={isSubmitting}
    />
  )}
</Modal>

// 5. Ajouter bouton dans actions
{repas.status === RepasStatus.EN_COURS && (
  <Button
    size="sm"
    variant="primary"
    onClick={() => handleTerminerService(repas.id)}
  >
    Terminer
  </Button>
)}
```

---

### 3. DenreesTab - AllocationDenreeForm

**Fichier**: `apps/web/src/components/restauration/DenreesTab.tsx`

**Action requise**:

```tsx
// 1. Importer
import { AllocationDenreeForm } from './forms';
import toast from 'react-hot-toast';

// 2. Ajouter états
const [isAllocationModalOpen, setIsAllocationModalOpen] = useState(false);
const [isSubmitting, setIsSubmitting] = useState(false);

// 3. Récupérer données
const { restaurants } = useRestaurants();
const { stocks } = useStocks(); // Stocks disponibles depuis module Stocks

// 4. Handler allocation
const handleAllocation = async (data: AllouerDenreeRequest) => {
  setIsSubmitting(true);
  try {
    await allouerDenree(data);
    toast.success('Denrée allouée avec succès');
    setIsAllocationModalOpen(false);
    refresh();
  } catch (err) {
    console.error('Erreur allocation denrée:', err);
    toast.error('Erreur lors de l\'allocation');
  } finally {
    setIsSubmitting(false);
  }
};

// 5. Ajouter modal
<Modal
  isOpen={isAllocationModalOpen}
  onClose={() => setIsAllocationModalOpen(false)}
  title="Allouer une denrée"
  size="lg"
>
  <AllocationDenreeForm
    restaurants={restaurants}
    availableStocks={stocks}
    onSubmit={handleAllocation}
    onCancel={() => setIsAllocationModalOpen(false)}
    isSubmitting={isSubmitting}
  />
</Modal>

// 6. Ajouter bouton
<Button
  onClick={() => setIsAllocationModalOpen(true)}
  leftIcon={<PlusIcon className="h-4 w-4" />}
>
  Allouer une denrée
</Button>
```

**⚠️ Dépendances manquantes**:
- Intégration avec module Stocks pour récupérer `availableStocks`

---

### 4. MenusTab - MenuForm + PlatEditor

**Fichier**: `apps/web/src/components/restauration/MenusTab.tsx`

**⚠️ ATTENTION**: Cette intégration est plus complexe car les interfaces diffèrent.

**Interfaces actuelles de l'API**:
```tsx
export interface CreateMenuRequest {
  restaurantId: string;
  nom: string;
  description?: string;
  dateService: string; // ISO date
  typeRepas: TypeRepas;
  plats: PlatMenu[];
  nombreRationnairesPrevu: number;
}
```

**Interfaces du MenuForm créé**:
```tsx
export interface CreateMenuRequest {
  nom: string;
  type: TypeMenu; // STANDARD, SPECIAL, RAMADAN, FETE
  dateDebut: string;
  dateFin?: string;
  plats: { nom, type, ingredients }[];
}
```

**Options**:

**Option A: Adapter MenuForm** (Recommandé)
- Modifier MenuForm.tsx pour correspondre à l'interface API
- Changer `type` en `typeRepas` (TypeRepas)
- Ajouter `restaurantId` et `nombreRationnairesPrevu`
- Supprimer `dateDebut/dateFin` → un seul `dateService`

**Option B: Créer un adaptateur**
```tsx
const adaptMenuData = (formData: FormMenuData): CreateMenuRequest => {
  return {
    restaurantId: formData.restaurantId,
    nom: formData.nom,
    description: formData.description,
    dateService: formData.dateDebut,
    typeRepas: formData.typeRepas,
    plats: formData.plats.map(adaptPlat),
    nombreRationnairesPrevu: formData.nombreRationnaires,
  };
};
```

**Action recommandée**: Adapter MenuForm après avoir clarifié le modèle de données exact avec le backend.

---

## 🎨 Ajout des Skeleton Loaders

### Pattern d'utilisation

```tsx
import { TableSkeleton } from './skeletons';

export const MyTab: React.FC = () => {
  const { data, loading } = useData();

  return (
    <Card>
      <Card.Content>
        {loading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <Table data={data} columns={columns} />
        )}
      </Card.Content>
    </Card>
  );
};
```

### Intégrations à faire

**RestaurantsTab**:
```tsx
import { TableSkeleton } from './skeletons';

// Dans le Card.Content
{loading ? (
  <TableSkeleton rows={8} columns={7} />
) : (
  <Table data={restaurants} columns={columns} />
)}
```

**MenusTab**:
```tsx
{loading ? (
  <TableSkeleton rows={6} columns={7} />
) : (
  <Table data={menus} columns={columns} />
)}
```

**TicketsTab**:
```tsx
{loading ? (
  <TableSkeleton rows={10} columns={6} />
) : (
  <Table data={tickets} columns={columns} />
)}
```

**RepasTab**:
```tsx
{loading ? (
  <TableSkeleton rows={8} columns={8} />
) : (
  <Table data={repas} columns={columns} />
)}
```

**DenreesTab**:
```tsx
{loading ? (
  <TableSkeleton rows={10} columns={6} />
) : (
  <Table data={denrees} columns={columns} />
)}
```

**DashboardTab** - Utiliser StatsSkeleton:
```tsx
import { StatsSkeleton, CardSkeleton } from './skeletons';

// Pour les KPIs
{loading ? (
  <StatsSkeleton count={4} />
) : (
  <div className="grid grid-cols-4 gap-4">
    {/* KPIs */}
  </div>
)}

// Pour les cartes
{loading ? (
  <CardSkeleton count={3} />
) : (
  <div className="grid grid-cols-3 gap-4">
    {/* Cards */}
  </div>
)}
```

---

## 🔄 Remplacement des confirm() par ConfirmModal

### Pattern avec useConfirmDialog

```tsx
import { useConfirmDialog } from '@/components/ui';

export const MyTab: React.FC = () => {
  const { ConfirmDialog, confirm } = useConfirmDialog();

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Supprimer cet élément ?',
      message: 'Cette action est irréversible. Toutes les données associées seront supprimées.',
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
    });

    if (confirmed) {
      try {
        await deleteItem(id);
        toast.success('Élément supprimé');
        refresh();
      } catch (err) {
        toast.error('Erreur lors de la suppression');
      }
    }
  };

  return (
    <>
      {/* Composant */}
      <ConfirmDialog />
    </>
  );
};
```

### Occurrences à remplacer

**RestaurantsTab** (Déjà fait ✅):
- ✅ Suppression restaurant

**MenusTab**:
- [ ] Ligne 54: Publier menu
- [ ] Ligne 64: Valider menu
- [ ] Ligne 74: Supprimer menu

```tsx
// AVANT
if (!confirm('Publier ce menu ?')) return;

// APRÈS
const confirmed = await confirm({
  title: 'Publier ce menu ?',
  message: 'Le menu sera visible pour tous les restaurants.',
  variant: 'info',
});
if (!confirmed) return;
```

**TicketsTab**:
- [ ] Ligne 72: Annuler ticket

```tsx
const confirmed = await confirm({
  title: 'Annuler ce ticket ?',
  message: 'Le ticket ne pourra plus être utilisé.',
  variant: 'warning',
});
```

**RepasTab**:
- [ ] Annulation de repas (si existe)
- [ ] Suppression de repas (si existe)

**DenreesTab**:
- [ ] Suppression d'allocation (si existe)

---

## 📊 Checklist d'intégration par tab

### RestaurantsTab ✅ (100%)
- [x] RestaurantForm intégré
- [x] Toast notifications
- [x] ConfirmModal (suppression)
- [ ] TableSkeleton

### MenusTab (0%)
- [ ] MenuForm intégré ⚠️ (nécessite adaptation)
- [ ] Toast notifications
- [ ] ConfirmModal (publier, valider, supprimer)
- [ ] TableSkeleton

### TicketsTab (0%)
- [ ] TicketEmissionForm intégré ⚠️ (nécessite hook etudiants)
- [ ] Toast notifications
- [ ] ConfirmModal (annuler)
- [ ] TableSkeleton

### RepasTab (0%)
- [ ] ServiceStatsForm intégré
- [ ] Toast notifications
- [ ] ConfirmModal (si suppressions)
- [ ] TableSkeleton

### DenreesTab (0%)
- [ ] AllocationDenreeForm intégré ⚠️ (nécessite intégration Stocks)
- [ ] Toast notifications
- [ ] ConfirmModal (si suppressions)
- [ ] TableSkeleton

### DashboardTab (0%)
- [ ] StatsSkeleton
- [ ] CardSkeleton
- [ ] ChartSkeleton (si charts)

---

## ⚠️ Blocages identifiés

### 1. Module Stocks non intégré
**Impact**: AllocationDenreeForm
**Besoin**: API pour récupérer `availableStocks`
**Solution temporaire**: Mock data ou désactiver l'allocation

### 2. Module Scolarité non intégré
**Impact**: TicketEmissionForm
**Besoin**: API pour récupérer liste des étudiants
**Solution temporaire**: Input manuel ou CSV import

### 3. Divergence interfaces Menu
**Impact**: MenuForm
**Besoin**: Clarifier le modèle de données backend
**Solution**: Adapter MenuForm ou créer un adaptateur

### 4. Types manquants
**Impact**: Divers
**Besoin**:
- `TerminerServiceRequest` complet
- `AllouerDenreeRequest` avec `datePeremption`
- `EmettrTicketRequest` avec tous les champs

---

## 🚀 Plan d'action recommandé

### Phase 1: Quick wins (1-2h)
1. Ajouter TableSkeleton dans tous les tabs ✅ Simple
2. Remplacer tous les `confirm()` par ConfirmModal ✅ Simple
3. Ajouter Toast notifications manquants ✅ Simple

### Phase 2: Intégrations simples (2-3h)
1. ServiceStatsForm dans RepasTab ✅ Pas de dépendances
2. RestaurantsTab: Ajouter TableSkeleton ✅ Finaliser

### Phase 3: Intégrations complexes (4-6h)
1. Clarifier interfaces Menu avec backend
2. Adapter MenuForm et intégrer
3. Créer hook/service pour étudiants
4. Intégrer TicketEmissionForm
5. Intégrer avec module Stocks
6. Intégrer AllocationDenreeForm

---

## 📈 Estimation temps total

- **Phase 1** (Quick wins): 1-2 heures
- **Phase 2** (Simple): 2-3 heures
- **Phase 3** (Complexe): 4-6 heures

**Total Sprint 2**: **7-11 heures**

---

## 📝 Notes pour le développeur

### Bonnes pratiques à suivre

1. **Toujours tester le build** après chaque intégration
2. **Ajouter les imports nécessaires** dès le début
3. **Vérifier les types TypeScript** strictement
4. **Utiliser le pattern établi** (voir RestaurantsTab)
5. **Tester en conditions réelles** avec vraies données

### Ordre recommandé d'intégration

1. TableSkeleton (tous les tabs) - Le plus simple
2. ConfirmModal (tous les tabs) - Simple et impactant
3. Toast notifications (tabs restants) - Simple
4. ServiceStatsForm (RepasTab) - Pas de dépendances
5. AllocationDenreeForm (DenreesTab) - Nécessite Stocks
6. TicketEmissionForm (TicketsTab) - Nécessite Étudiants
7. MenuForm (MenusTab) - Le plus complexe, à faire en dernier

---

## ✅ Validation finale Sprint 2

Une fois toutes les intégrations terminées:

- [ ] Tous les formulaires intégrés et fonctionnels
- [ ] Tous les Skeleton loaders en place
- [ ] Tous les `confirm()` remplacés par ConfirmModal
- [ ] Toast notifications partout
- [ ] Build réussi sans erreurs TypeScript
- [ ] Tests manuels de chaque fonctionnalité
- [ ] Documentation mise à jour

---

**Auteur**: Équipe CROU
**Date**: Janvier 2025
**Version**: 1.0
