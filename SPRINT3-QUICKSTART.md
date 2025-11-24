# Guide de Démarrage Rapide - Composants Sprint 3

Ce guide vous montre comment intégrer rapidement les nouveaux composants Sprint 3 dans vos pages CROU.

---

## 🚀 Installation

Les dépendances sont déjà installées :
```bash
✅ lucide-react (icônes)
✅ framer-motion (animations)
✅ react-hot-toast (notifications)
```

---

## 📋 ModernTable - Afficher des Données Tabulaires

### Import
```tsx
import { ModernTable, Column } from '@/components/ui/ModernTable';
import { ModernBadge } from '@/components/ui/ModernBadge';
```

### Définir les Colonnes
```tsx
interface Etudiant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: 'actif' | 'inactif';
}

const columns: Column<Etudiant>[] = [
  {
    key: 'nom',
    header: 'Nom',
    sortable: true,
    filterable: true
  },
  {
    key: 'prenom',
    header: 'Prénom',
    sortable: true,
    filterable: true
  },
  {
    key: 'email',
    header: 'Email',
    filterable: true
  },
  {
    key: 'statut',
    header: 'Statut',
    sortable: true,
    render: (value) => (
      <ModernBadge variant={value === 'actif' ? 'success' : 'neutral'}>
        {value}
      </ModernBadge>
    )
  }
];
```

### Utiliser le Composant
```tsx
export function EtudiantsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Etudiant[]>([]);

  return (
    <ModernTable
      data={etudiants}
      columns={columns}
      variant="gradient-crou"
      selectable
      onSelectionChange={setSelectedRows}
      pagination={{
        pageSize: 10,
        currentPage,
        onPageChange: setCurrentPage
      }}
    />
  );
}
```

---

## 🪟 ModernModal - Fenêtres Modales

### Import
```tsx
import { ModernModal } from '@/components/ui/ModernModal';
import { ModernButton } from '@/components/ui/ModernButton';
```

### Utilisation de Base
```tsx
export function EtudiantDetails() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ModernButton onClick={() => setIsOpen(true)}>
        Voir Détails
      </ModernButton>

      <ModernModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Détails de l'étudiant"
        size="lg"
        footer={
          <div className="flex gap-3">
            <ModernButton variant="outline" onClick={() => setIsOpen(false)}>
              Fermer
            </ModernButton>
            <ModernButton variant="gradient-crou">
              Sauvegarder
            </ModernButton>
          </div>
        }
      >
        {/* Votre contenu ici */}
        <div className="space-y-4">
          <p>Contenu du modal...</p>
        </div>
      </ModernModal>
    </>
  );
}
```

### Modal de Confirmation
```tsx
function ConfirmationModal({ isOpen, onClose, onConfirm, title, message }) {
  return (
    <ModernModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <div className="flex gap-3 w-full">
          <ModernButton 
            variant="outline" 
            onClick={onClose}
            className="flex-1"
          >
            Annuler
          </ModernButton>
          <ModernButton 
            variant="danger" 
            onClick={onConfirm}
            className="flex-1"
          >
            Confirmer
          </ModernButton>
        </div>
      }
    >
      <p className="text-gray-700">{message}</p>
    </ModernModal>
  );
}
```

---

## 📱 ModernDrawer - Panneaux Latéraux

### Import
```tsx
import { ModernDrawer } from '@/components/ui/ModernDrawer';
```

### Drawer de Filtres (Right)
```tsx
export function FiltresDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState({});

  return (
    <>
      <ModernButton onClick={() => setIsOpen(true)}>
        Filtres Avancés
      </ModernButton>

      <ModernDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Filtres de Recherche"
        position="right"
        size="md"
        footer={
          <div className="flex gap-3">
            <ModernButton 
              variant="outline" 
              onClick={() => setFilters({})}
              className="flex-1"
            >
              Réinitialiser
            </ModernButton>
            <ModernButton 
              variant="gradient-crou"
              onClick={() => applyFilters(filters)}
              className="flex-1"
            >
              Appliquer
            </ModernButton>
          </div>
        }
      >
        {/* Formulaire de filtres */}
        <div className="space-y-4">
          <ModernInput label="Date de début" type="date" />
          <ModernInput label="Date de fin" type="date" />
          <ModernSelect label="Statut" options={statusOptions} />
        </div>
      </ModernDrawer>
    </>
  );
}
```

### Drawer Menu Mobile (Left)
```tsx
export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ModernDrawer
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      title="Menu"
      position="left"
      size="md"
    >
      <nav className="space-y-2">
        <NavLink to="/dashboard">Dashboard</NavLink>
        <NavLink to="/finances">Finances</NavLink>
        <NavLink to="/logements">Logements</NavLink>
        <NavLink to="/transport">Transport</NavLink>
      </nav>
    </ModernDrawer>
  );
}
```

---

## 🔔 ModernToast - Notifications

### Setup Initial (Une Seule Fois)
```tsx
// Dans App.tsx ou votre layout principal
import { ModernToaster } from '@/components/ui/ModernToast';

function App() {
  return (
    <>
      <ModernToaster />
      {/* Votre application */}
    </>
  );
}
```

### Import et Utilisation
```tsx
import { modernToast } from '@/components/ui/ModernToast';

// Toast de succès
modernToast.success('Étudiant enregistré avec succès!');

// Toast d'erreur
modernToast.error('Échec de l\'enregistrement');

// Toast d'avertissement
modernToast.warning('Veuillez vérifier les données');

// Toast d'information
modernToast.info('Nouvelle version disponible');

// Toast avec style CROU Niger
modernToast.gradientCrou('Opération validée - CROU Niger');
```

### Toast avec Action (Undo)
```tsx
async function deleteEtudiant(id: string) {
  await api.delete(`/etudiants/${id}`);
  
  modernToast.withAction(
    'Étudiant supprimé',
    'Annuler',
    async () => {
      await api.restore(`/etudiants/${id}`);
      modernToast.success('Étudiant restauré');
    }
  );
}
```

### Toast avec Promise
```tsx
async function saveEtudiant(data: Etudiant) {
  modernToast.promise(
    api.post('/etudiants', data),
    {
      loading: 'Enregistrement en cours...',
      success: 'Étudiant enregistré avec succès!',
      error: 'Échec de l\'enregistrement'
    }
  );
}
```

---

## ⏳ LoadingSkeleton - États de Chargement

### Import
```tsx
import { 
  TableSkeleton, 
  CardSkeleton, 
  ListSkeleton,
  FormSkeleton,
  DashboardSkeleton
} from '@/components/ui/LoadingSkeleton';
```

### Table avec Loading
```tsx
export function EtudiantsPage() {
  const { data, isLoading } = useQuery('etudiants', fetchEtudiants);

  if (isLoading) {
    return <TableSkeleton rows={10} columns={5} />;
  }

  return <ModernTable data={data} columns={columns} />;
}
```

### Dashboard avec Loading
```tsx
export function DashboardPage() {
  const { data, isLoading } = useQuery('dashboard', fetchDashboard);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* KPIs, Charts, Tables */}
    </div>
  );
}
```

### Liste avec Loading
```tsx
export function EtudiantsList() {
  const { data, isLoading } = useQuery('etudiants', fetchEtudiants);

  return (
    <div>
      {isLoading ? (
        <ListSkeleton items={5} />
      ) : (
        <ul>
          {data.map(etudiant => (
            <EtudiantItem key={etudiant.id} data={etudiant} />
          ))}
        </ul>
      )}
    </div>
  );
}
```

### Formulaire avec Loading
```tsx
export function EtudiantForm() {
  const { data, isLoading } = useQuery('etudiant', fetchEtudiant);

  if (isLoading) {
    return <FormSkeleton fields={6} />;
  }

  return <form>{/* Champs du formulaire */}</form>;
}
```

---

## 🎨 Exemple Complet - Page Gestion Étudiants

```tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ModernTable, Column } from '@/components/ui/ModernTable';
import { ModernModal } from '@/components/ui/ModernModal';
import { ModernDrawer } from '@/components/ui/ModernDrawer';
import { modernToast } from '@/components/ui/ModernToast';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { ModernButton } from '@/components/ui/ModernButton';
import { ModernBadge } from '@/components/ui/ModernBadge';
import { ModernInput } from '@/components/ui/ModernInput';
import { Plus, Filter, Trash2 } from 'lucide-react';

interface Etudiant {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  statut: 'actif' | 'inactif';
}

export function GestionEtudiantsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedRows, setSelectedRows] = useState<Etudiant[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState<Etudiant | null>(null);

  // Récupérer les données
  const { data: etudiants, isLoading } = useQuery(
    ['etudiants', currentPage],
    () => fetchEtudiants(currentPage)
  );

  // Mutation pour supprimer
  const deleteMutation = useMutation(
    (id: string) => deleteEtudiant(id),
    {
      onSuccess: () => {
        modernToast.success('Étudiant supprimé avec succès');
        queryClient.invalidateQueries(['etudiants']);
      },
      onError: () => {
        modernToast.error('Erreur lors de la suppression');
      }
    }
  );

  // Colonnes du tableau
  const columns: Column<Etudiant>[] = [
    {
      key: 'nom',
      header: 'Nom',
      sortable: true,
      filterable: true
    },
    {
      key: 'prenom',
      header: 'Prénom',
      sortable: true,
      filterable: true
    },
    {
      key: 'email',
      header: 'Email',
      filterable: true
    },
    {
      key: 'statut',
      header: 'Statut',
      sortable: true,
      render: (value) => (
        <ModernBadge variant={value === 'actif' ? 'success' : 'neutral'}>
          {value}
        </ModernBadge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, row) => (
        <div className="flex gap-2">
          <ModernButton
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEtudiant(row);
              setIsModalOpen(true);
            }}
          >
            Détails
          </ModernButton>
          <ModernButton
            variant="danger"
            size="sm"
            onClick={() => deleteMutation.mutate(row.id)}
          >
            <Trash2 className="w-4 h-4" />
          </ModernButton>
        </div>
      )
    }
  ];

  // Supprimer plusieurs étudiants
  const handleBulkDelete = () => {
    modernToast.withAction(
      `Supprimer ${selectedRows.length} étudiant(s) ?`,
      'Confirmer',
      async () => {
        await Promise.all(selectedRows.map(row => deleteMutation.mutateAsync(row.id)));
        setSelectedRows([]);
      }
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Étudiants</h1>
          <p className="text-gray-600">Gérer les étudiants du CROU</p>
        </div>
        <div className="flex gap-3">
          <ModernButton
            variant="outline"
            leftIcon={<Filter className="w-4 h-4" />}
            onClick={() => setIsDrawerOpen(true)}
          >
            Filtres
          </ModernButton>
          <ModernButton
            variant="gradient-crou"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsModalOpen(true)}
          >
            Nouvel Étudiant
          </ModernButton>
        </div>
      </div>

      {/* Actions groupées */}
      {selectedRows.length > 0 && (
        <div className="bg-primary-50 p-4 rounded-lg flex items-center justify-between">
          <span className="font-medium text-primary-900">
            {selectedRows.length} étudiant(s) sélectionné(s)
          </span>
          <ModernButton variant="danger" onClick={handleBulkDelete}>
            Supprimer la sélection
          </ModernButton>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={10} columns={5} />
      ) : (
        <ModernTable
          data={etudiants}
          columns={columns}
          variant="gradient-crou"
          selectable
          onSelectionChange={setSelectedRows}
          pagination={{
            pageSize: 10,
            currentPage,
            onPageChange: setCurrentPage
          }}
        />
      )}

      {/* Modal Détails */}
      <ModernModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEtudiant(null);
        }}
        title={selectedEtudiant ? 'Détails Étudiant' : 'Nouvel Étudiant'}
        size="lg"
      >
        {/* Formulaire d'étudiant */}
        <div className="space-y-4">
          <ModernInput label="Nom" placeholder="Entrez le nom" />
          <ModernInput label="Prénom" placeholder="Entrez le prénom" />
          <ModernInput label="Email" type="email" placeholder="email@crou.ne" />
        </div>
      </ModernModal>

      {/* Drawer Filtres */}
      <ModernDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Filtres de Recherche"
        position="right"
        size="md"
        footer={
          <div className="flex gap-3">
            <ModernButton variant="outline" className="flex-1">
              Réinitialiser
            </ModernButton>
            <ModernButton variant="gradient-crou" className="flex-1">
              Appliquer
            </ModernButton>
          </div>
        }
      >
        <div className="space-y-4">
          <ModernInput label="Recherche" placeholder="Nom, prénom..." />
          {/* Autres filtres */}
        </div>
      </ModernDrawer>
    </div>
  );
}
```

---

## 🎯 Bonnes Pratiques

### Performance
```tsx
// ✅ Memoiser les colonnes (éviter recréation à chaque render)
const columns = useMemo(() => [...], []);

// ✅ Memoiser les callbacks
const handlePageChange = useCallback((page) => {
  setCurrentPage(page);
}, []);
```

### Accessibilité
```tsx
// ✅ Toujours fournir des labels
<ModernInput label="Email" />

// ✅ Utiliser des titres pour modals/drawers
<ModernModal title="Confirmation" />

// ✅ Boutons avec icônes ET texte
<ModernButton leftIcon={<Plus />}>Ajouter</ModernButton>
```

### TypeScript
```tsx
// ✅ Typer les données de table
interface MyData {
  id: string;
  name: string;
}

const columns: Column<MyData>[] = [...];
```

---

## 📚 Ressources

- **Démo Complète** : `/examples/sprint3`
- **Documentation Sprint 3** : `DESIGN-SPRINT3-COMPLETE.md`
- **Composants UI** : `apps/web/src/components/ui/`

---

**Bon développement avec les composants Sprint 3 ! 🇳🇪**
