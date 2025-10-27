/**
 * FICHIER: apps\web\src\components\ui\Table.stories.tsx
 * STORYBOOK: Stories pour le composant Table
 * 
 * DESCRIPTION:
 * Documentation interactive du composant Table avec exemples d'utilisation
 * Démontre toutes les fonctionnalités : tri, filtrage, pagination, sélection
 * Cas d'usage spécifiques au contexte CROU
 * 
 * STORIES:
 * - Table de base avec données simples
 * - Table avec tri et filtrage
 * - Table avec pagination et sélection
 * - Table avec lignes extensibles
 * - Table avec colonnes fixes
 * - Exemples CROU (étudiants, budgets, etc.)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  UserIcon,
  AcademicCapIcon,
  CurrencyEuroIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { Table, TableColumn } from './Table';
import { Button } from './Button';
import { cn } from '@/utils/cn';

// Données de test pour les étudiants
interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  age: number;
  scholarship: number;
  enrollmentDate: string;
  isActive: boolean;
  crou: string;
  level: string;
  status: 'active' | 'inactive' | 'suspended';
}

const mockStudents: Student[] = [
  {
    id: 1,
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'jean.dupont@etudiant.fr',
    age: 20,
    scholarship: 450.50,
    enrollmentDate: '2024-09-15',
    isActive: true,
    crou: 'CROU de Paris',
    level: 'L2',
    status: 'active'
  },
  {
    id: 2,
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'marie.martin@etudiant.fr',
    age: 22,
    scholarship: 380.00,
    enrollmentDate: '2024-09-10',
    isActive: false,
    crou: 'CROU de Lyon',
    level: 'M1',
    status: 'inactive'
  },
  {
    id: 3,
    firstName: 'Pierre',
    lastName: 'Bernard',
    email: 'pierre.bernard@etudiant.fr',
    age: 19,
    scholarship: 520.75,
    enrollmentDate: '2024-09-20',
    isActive: true,
    crou: 'CROU de Marseille',
    level: 'L1',
    status: 'active'
  },
  {
    id: 4,
    firstName: 'Sophie',
    lastName: 'Dubois',
    email: 'sophie.dubois@etudiant.fr',
    age: 21,
    scholarship: 0,
    enrollmentDate: '2024-08-30',
    isActive: true,
    crou: 'CROU de Toulouse',
    level: 'L3',
    status: 'suspended'
  },
  {
    id: 5,
    firstName: 'Thomas',
    lastName: 'Moreau',
    email: 'thomas.moreau@etudiant.fr',
    age: 23,
    scholarship: 600.00,
    enrollmentDate: '2024-09-05',
    isActive: true,
    crou: 'CROU de Bordeaux',
    level: 'M2',
    status: 'active'
  }
];

// Données de test pour les budgets
interface BudgetItem {
  id: number;
  category: string;
  description: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentage: number;
  lastUpdated: string;
  responsible: string;
}

const mockBudgets: BudgetItem[] = [
  {
    id: 1,
    category: 'Restauration',
    description: 'Coûts des repas et approvisionnement',
    budgeted: 150000,
    actual: 142500,
    variance: -7500,
    percentage: 95,
    lastUpdated: '2024-12-01',
    responsible: 'Jean Directeur'
  },
  {
    id: 2,
    category: 'Logement',
    description: 'Maintenance et charges des résidences',
    budgeted: 200000,
    actual: 215000,
    variance: 15000,
    percentage: 107.5,
    lastUpdated: '2024-12-01',
    responsible: 'Marie Gestionnaire'
  },
  {
    id: 3,
    category: 'Personnel',
    description: 'Salaires et charges sociales',
    budgeted: 300000,
    actual: 298000,
    variance: -2000,
    percentage: 99.3,
    lastUpdated: '2024-12-01',
    responsible: 'Pierre RH'
  }
];

// Configuration Meta
const meta: Meta<typeof Table> = {
  title: 'Components/Data Display/Table',
  component: Table,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Composant tableau avancé avec tri, filtrage, pagination et sélection pour les données CROU.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du tableau'
    },
    variant: {
      control: 'select',
      options: ['default', 'minimal', 'striped'],
      description: 'Variante visuelle'
    },
    sortable: {
      control: 'boolean',
      description: 'Activer le tri'
    },
    filterable: {
      control: 'boolean',
      description: 'Activer le filtrage'
    },
    selectable: {
      control: 'boolean',
      description: 'Activer la sélection'
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Table>;

// Colonnes pour les étudiants
const studentColumns: TableColumn<Student>[] = [
  {
    key: 'firstName',
    title: 'Prénom',
    type: 'text',
    sortable: true,
    filterable: true,
    width: 120
  },
  {
    key: 'lastName',
    title: 'Nom',
    type: 'text',
    sortable: true,
    filterable: true,
    width: 120
  },
  {
    key: 'email',
    title: 'Email',
    type: 'text',
    sortable: true,
    width: 200
  },
  {
    key: 'age',
    title: 'Âge',
    type: 'number',
    sortable: true,
    align: 'center',
    width: 80
  },
  {
    key: 'scholarship',
    title: 'Bourse',
    type: 'currency',
    sortable: true,
    align: 'right',
    width: 120
  },
  {
    key: 'enrollmentDate',
    title: 'Inscription',
    type: 'date',
    sortable: true,
    width: 120
  },
  {
    key: 'status',
    title: 'Statut',
    type: 'custom',
    align: 'center',
    width: 100,
    render: (value: Student['status']) => {
      const variants = {
        active: { label: 'Actif', color: 'success' as const },
        inactive: { label: 'Inactif', color: 'gray' as const },
        suspended: { label: 'Suspendu', color: 'danger' as const }
      };
      
      const variant = variants[value];
      return (
        <span className={cn(
          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
          variant.color === 'success' && 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400',
          variant.color === 'danger' && 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400',
          variant.color === 'gray' && 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
        )}>
          {variant.label}
        </span>
      );
    }
  },
  {
    key: 'actions',
    title: 'Actions',
    type: 'actions',
    width: 120,
    render: (_, record) => (
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => console.log('Voir', record)}
          aria-label={`Voir ${record.firstName} ${record.lastName}`}
        >
          <EyeIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => console.log('Modifier', record)}
          aria-label={`Modifier ${record.firstName} ${record.lastName}`}
        >
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => console.log('Supprimer', record)}
          aria-label={`Supprimer ${record.firstName} ${record.lastName}`}
        >
          <TrashIcon className="h-4 w-4 text-danger-600" />
        </Button>
      </div>
    )
  }
];

// Colonnes pour les budgets
const budgetColumns: TableColumn<BudgetItem>[] = [
  {
    key: 'category',
    title: 'Catégorie',
    type: 'text',
    sortable: true,
    width: 150,
    render: (value, record) => (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full bg-primary-500"></div>
        <span className="font-medium">{value}</span>
      </div>
    )
  },
  {
    key: 'description',
    title: 'Description',
    type: 'text',
    width: 250
  },
  {
    key: 'budgeted',
    title: 'Budget prévu',
    type: 'currency',
    sortable: true,
    align: 'right',
    width: 130
  },
  {
    key: 'actual',
    title: 'Réalisé',
    type: 'currency',
    sortable: true,
    align: 'right',
    width: 130
  },
  {
    key: 'variance',
    title: 'Écart',
    type: 'custom',
    sortable: true,
    align: 'right',
    width: 120,
    render: (value: number) => (
      <span className={cn(
        'font-medium',
        value > 0 ? 'text-danger-600' : value < 0 ? 'text-success-600' : 'text-gray-600'
      )}>
        {value > 0 ? '+' : ''}{(value / 1000).toFixed(1)}k FCFA
      </span>
    )
  },
  {
    key: 'percentage',
    title: 'Réalisation',
    type: 'custom',
    sortable: true,
    align: 'center',
    width: 120,
    render: (value: number) => (
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={cn(
              'h-2 rounded-full transition-all',
              value > 100 ? 'bg-danger-500' : value > 90 ? 'bg-warning-500' : 'bg-success-500'
            )}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
        <span className="text-sm font-medium w-12">{value}%</span>
      </div>
    )
  }
];

// Stories principales
export const DefaultTable: Story = {
  args: {
    data: mockStudents,
    columns: studentColumns,
    rowKey: 'id'
  }
};

export const SortableTable: Story = {
  args: {
    data: mockStudents,
    columns: studentColumns,
    rowKey: 'id',
    sortable: true
  }
};

export const SelectableTable: Story = {
  render: () => {
    const [selection, setSelection] = useState({ selectedRows: [], selectedRowKeys: [] });
    
    return (
      <div className="space-y-4">
        {selection.selectedRowKeys.length > 0 && (
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p className="text-sm text-primary-700 dark:text-primary-300">
              {selection.selectedRowKeys.length} étudiant(s) sélectionné(s)
            </p>
          </div>
        )}
        
        <Table
          data={mockStudents}
          columns={studentColumns}
          rowKey="id"
          selectable
          sortable
          onSelectionChange={setSelection}
        />
      </div>
    );
  }
};

export const PaginatedTable: Story = {
  args: {
    data: mockStudents,
    columns: studentColumns,
    rowKey: 'id',
    sortable: true,
    pagination: {
      pageSize: 3,
      page: 1,
      total: mockStudents.length,
      pageSizeOptions: [3, 5, 10]
    }
  }
};

export const ExpandableTable: Story = {
  render: () => {
    const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([1]);
    
    const expandableConfig = {
      expandedRowKeys: expandedKeys,
      onExpandedRowsChange: setExpandedKeys,
      expandedRowRender: (record: Student) => (
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="font-semibold mb-3">Détails de l'étudiant</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">CROU:</span> {record.crou}
            </div>
            <div>
              <span className="font-medium">Niveau:</span> {record.level}
            </div>
            <div>
              <span className="font-medium">Email:</span> {record.email}
            </div>
            <div>
              <span className="font-medium">Statut:</span> {record.isActive ? 'Actif' : 'Inactif'}
            </div>
          </div>
        </div>
      )
    };
    
    return (
      <Table
        data={mockStudents}
        columns={studentColumns}
        rowKey="id"
        sortable
        expandable={expandableConfig}
      />
    );
  }
};

export const BudgetTable: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Budget CROU 2024</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <CalendarIcon className="h-4 w-4" />
          Dernière mise à jour: 01/12/2024
        </div>
      </div>
      
      <Table
        data={mockBudgets}
        columns={budgetColumns}
        rowKey="id"
        sortable
        variant="striped"
        size="sm"
      />
    </div>
  )
};

export const LoadingTable: Story = {
  args: {
    data: [],
    columns: studentColumns,
    rowKey: 'id',
    loading: true
  }
};

export const EmptyTable: Story = {
  args: {
    data: [],
    columns: studentColumns,
    rowKey: 'id',
    emptyText: 'Aucun étudiant trouvé'
  }
};

export const CompactTable: Story = {
  args: {
    data: mockStudents,
    columns: studentColumns,
    rowKey: 'id',
    size: 'sm',
    variant: 'minimal'
  }
};

export const FullFeaturedTable: Story = {
  render: () => {
    const [selection, setSelection] = useState({ selectedRows: [], selectedRowKeys: [] });
    const [expandedKeys, setExpandedKeys] = useState<(string | number)[]>([]);
    
    const expandableConfig = {
      expandedRowKeys: expandedKeys,
      onExpandedRowsChange: setExpandedKeys,
      expandedRowRender: (record: Student) => (
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <UserIcon className="h-5 w-5" />
            Profil complet - {record.firstName} {record.lastName}
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900 dark:text-gray-100">Informations personnelles</h5>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">Âge:</span> {record.age} ans</div>
                <div><span className="font-medium">Email:</span> {record.email}</div>
                <div><span className="font-medium">Niveau:</span> {record.level}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900 dark:text-gray-100">Informations CROU</h5>
              <div className="space-y-1 text-sm">
                <div><span className="font-medium">CROU:</span> {record.crou}</div>
                <div><span className="font-medium">Inscription:</span> {new Date(record.enrollmentDate).toLocaleDateString('fr-FR')}</div>
                <div><span className="font-medium">Bourse:</span> {record.scholarship > 0 ? `${record.scholarship} FCFA` : 'Aucune'}</div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h5 className="font-medium text-gray-900 dark:text-gray-100">Actions rapides</h5>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline">
                  <AcademicCapIcon className="h-4 w-4 mr-2" />
                  Dossier académique
                </Button>
                <Button size="sm" variant="outline">
                  <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                  Historique financier
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    };
    
    return (
      <div className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Gestion des étudiants</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {mockStudents.length} étudiants inscrits
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {selection.selectedRowKeys.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selection.selectedRowKeys.length} sélectionné(s)
                </span>
                <Button size="sm" variant="outline">
                  Actions groupées
                </Button>
              </div>
            )}
            
            <Button>
              <UserIcon className="h-4 w-4 mr-2" />
              Nouvel étudiant
            </Button>
          </div>
        </div>
        
        {/* Tableau complet */}
        <Table
          data={mockStudents}
          columns={studentColumns}
          rowKey="id"
          sortable
          selectable
          expandable={expandableConfig}
          pagination={{
            pageSize: 10,
            page: 1,
            total: mockStudents.length,
            pageSizeOptions: [5, 10, 25, 50]
          }}
          onSelectionChange={setSelection}
          onRowClick={(record) => {
            const key = record.id;
            const isExpanded = expandedKeys.includes(key);
            setExpandedKeys(isExpanded 
              ? expandedKeys.filter(k => k !== key)
              : [...expandedKeys, key]
            );
          }}
          className="shadow-lg"
        />
      </div>
    );
  }
};

// Export des stories
export {
  DefaultTable,
  SortableTable,
  SelectableTable,
  PaginatedTable,
  ExpandableTable,
  BudgetTable,
  LoadingTable,
  EmptyTable,
  CompactTable,
  FullFeaturedTable
}; 
