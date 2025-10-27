/**
 * FICHIER: apps\web\src\pages\examples\TableExamples.tsx
 * PAGE: Exemples d'utilisation du composant Table
 * 
 * DESCRIPTION:
 * Page de démonstration du composant Table avec cas d'usage CROU
 * Exemples pratiques de gestion de données tabulaires
 * Intégration avec les fonctionnalités avancées
 * 
 * SECTIONS:
 * - Tableau de base avec données étudiants
 * - Tableau avec tri et filtrage
 * - Tableau avec pagination et sélection
 * - Tableau budgétaire avec indicateurs
 * - Tableau avec lignes extensibles
 * - Performance avec gros datasets
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useMemo } from 'react';
import { 
  UserIcon, 
  CurrencyEuroIcon, 
  ChartBarIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Table, TableColumn } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { cn } from '@/utils/cn';

// Types de données
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
  residence?: string;
  meals: number;
}

interface BudgetItem {
  id: number;
  category: string;
  subcategory: string;
  description: string;
  budgeted: number;
  actual: number;
  variance: number;
  percentage: number;
  lastUpdated: string;
  responsible: string;
  quarter: string;
}

interface Transaction {
  id: number;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  reference: string;
}

// Données de démonstration
const generateStudents = (count: number): Student[] => {
  const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Thomas', 'Emma', 'Lucas', 'Camille', 'Antoine', 'Léa'];
  const lastNames = ['Dupont', 'Martin', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Garcia', 'David'];
  const crous = ['CROU de Paris', 'CROU de Lyon', 'CROU de Marseille', 'CROU de Toulouse', 'CROU de Bordeaux', 'CROU de Lille', 'CROU de Strasbourg', 'CROU de Nantes'];
  const levels = ['L1', 'L2', 'L3', 'M1', 'M2'];
  const statuses: Student['status'][] = ['active', 'inactive', 'suspended'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    firstName: firstNames[i % firstNames.length],
    lastName: lastNames[i % lastNames.length],
    email: `${firstNames[i % firstNames.length].toLowerCase()}.${lastNames[i % lastNames.length].toLowerCase()}@etudiant.fr`,
    age: 18 + (i % 8),
    scholarship: Math.random() > 0.3 ? Math.round((300 + Math.random() * 400) * 100) / 100 : 0,
    enrollmentDate: new Date(2024, 8, 1 + (i % 30)).toISOString().split('T')[0],
    isActive: Math.random() > 0.2,
    crou: crous[i % crous.length],
    level: levels[i % levels.length],
    status: statuses[i % statuses.length],
    residence: Math.random() > 0.4 ? `Résidence ${String.fromCharCode(65 + (i % 10))}` : undefined,
    meals: Math.floor(Math.random() * 20)
  }));
};

const generateBudgets = (): BudgetItem[] => [
  {
    id: 1,
    category: 'Restauration',
    subcategory: 'Approvisionnement',
    description: 'Achats alimentaires et boissons',
    budgeted: 150000,
    actual: 142500,
    variance: -7500,
    percentage: 95,
    lastUpdated: '2024-12-01',
    responsible: 'Jean Directeur',
    quarter: 'Q4 2024'
  },
  {
    id: 2,
    category: 'Restauration',
    subcategory: 'Personnel',
    description: 'Salaires équipe restauration',
    budgeted: 80000,
    actual: 85000,
    variance: 5000,
    percentage: 106.25,
    lastUpdated: '2024-12-01',
    responsible: 'Marie Chef',
    quarter: 'Q4 2024'
  },
  {
    id: 3,
    category: 'Logement',
    subcategory: 'Maintenance',
    description: 'Réparations et entretien',
    budgeted: 120000,
    actual: 115000,
    variance: -5000,
    percentage: 95.8,
    lastUpdated: '2024-12-01',
    responsible: 'Pierre Maintenance',
    quarter: 'Q4 2024'
  },
  {
    id: 4,
    category: 'Logement',
    subcategory: 'Charges',
    description: 'Électricité, eau, chauffage',
    budgeted: 200000,
    actual: 220000,
    variance: 20000,
    percentage: 110,
    lastUpdated: '2024-12-01',
    responsible: 'Sophie Gestionnaire',
    quarter: 'Q4 2024'
  },
  {
    id: 5,
    category: 'Administration',
    subcategory: 'Personnel',
    description: 'Salaires équipe administrative',
    budgeted: 180000,
    actual: 178000,
    variance: -2000,
    percentage: 98.9,
    lastUpdated: '2024-12-01',
    responsible: 'Thomas RH',
    quarter: 'Q4 2024'
  }
];

const TableExamples: React.FC = () => {
  // États pour les différents tableaux
  const [studentsData] = useState(() => generateStudents(50));
  const [budgetsData] = useState(generateBudgets);
  const [selectedStudents, setSelectedStudents] = useState<any>({ selectedRows: [], selectedRowKeys: [] });
  const [expandedRows, setExpandedRows] = useState<(string | number)[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    crou: '',
    level: '',
    status: ''
  });

  // Données filtrées
  const filteredStudents = useMemo(() => {
    return studentsData.filter(student => {
      const matchesSearch = !filters.search || 
        student.firstName.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.lastName.toLowerCase().includes(filters.search.toLowerCase()) ||
        student.email.toLowerCase().includes(filters.search.toLowerCase());
      
      const matchesCrou = !filters.crou || student.crou === filters.crou;
      const matchesLevel = !filters.level || student.level === filters.level;
      const matchesStatus = !filters.status || student.status === filters.status;
      
      return matchesSearch && matchesCrou && matchesLevel && matchesStatus;
    });
  }, [studentsData, filters]);

  // Configuration des colonnes pour les étudiants
  const studentColumns: TableColumn<Student>[] = [
    {
      key: 'firstName',
      title: 'Prénom',
      type: 'text',
      sortable: true,
      width: 120,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
              {value.charAt(0)}
            </span>
          </div>
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'lastName',
      title: 'Nom',
      type: 'text',
      sortable: true,
      width: 120
    },
    {
      key: 'level',
      title: 'Niveau',
      type: 'text',
      sortable: true,
      align: 'center',
      width: 80,
      render: (value) => (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
          {value}
        </span>
      )
    },
    {
      key: 'crou',
      title: 'CROU',
      type: 'text',
      sortable: true,
      width: 150,
      render: (value) => value.replace('CROU de ', '')
    },
    {
      key: 'scholarship',
      title: 'Bourse',
      type: 'currency',
      sortable: true,
      align: 'right',
      width: 120,
      render: (value) => value > 0 ? `${value.toFixed(2)} FCFA` : '-'
    },
    {
      key: 'status',
      title: 'Statut',
      type: 'custom',
      sortable: true,
      align: 'center',
      width: 100,
      render: (value: Student['status']) => {
        const variants = {
          active: { label: 'Actif', color: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400' },
          inactive: { label: 'Inactif', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
          suspended: { label: 'Suspendu', color: 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400' }
        };
        
        const variant = variants[value];
        return (
          <span className={cn('inline-flex items-center px-2 py-1 rounded-full text-xs font-medium', variant.color)}>
            {variant.label}
          </span>
        );
      }
    },
    {
      key: 'meals',
      title: 'Repas/mois',
      type: 'number',
      sortable: true,
      align: 'center',
      width: 100
    }
  ];

  // Configuration des colonnes pour les budgets
  const budgetColumns: TableColumn<BudgetItem>[] = [
    {
      key: 'category',
      title: 'Catégorie',
      type: 'text',
      sortable: true,
      width: 130,
      render: (value, record) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{record.subcategory}</div>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      type: 'text',
      width: 200
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
      width: 140,
      render: (value: number) => (
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all',
                value > 105 ? 'bg-danger-500' : value > 95 ? 'bg-warning-500' : 'bg-success-500'
              )}
              style={{ width: `${Math.min(value, 100)}%` }}
            />
          </div>
          <span className="text-sm font-medium w-12">{value}%</span>
        </div>
      )
    },
    {
      key: 'responsible',
      title: 'Responsable',
      type: 'text',
      width: 120,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-medium">{value.split(' ').map(n => n[0]).join('')}</span>
          </div>
          <span className="text-sm">{value}</span>
        </div>
      )
    }
  ];

  // Configuration des lignes extensibles
  const expandableConfig = {
    expandedRowKeys: expandedRows,
    onExpandedRowsChange: setExpandedRows,
    expandedRowRender: (record: Student) => (
      <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Informations personnelles */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UserIcon className="h-4 w-4" />
              Informations personnelles
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium">{record.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Âge:</span>
                <span className="font-medium">{record.age} ans</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Inscription:</span>
                <span className="font-medium">{new Date(record.enrollmentDate).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
          </div>

          {/* Informations CROU */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BuildingOfficeIcon className="h-4 w-4" />
              Informations CROU
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">CROU:</span>
                <span className="font-medium">{record.crou}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Résidence:</span>
                <span className="font-medium">{record.residence || 'Non logé'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Repas/mois:</span>
                <span className="font-medium">{record.meals}</span>
              </div>
            </div>
          </div>

          {/* Informations financières */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <CurrencyEuroIcon className="h-4 w-4" />
              Informations financières
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Bourse:</span>
                <span className="font-medium">
                  {record.scholarship > 0 ? `${record.scholarship} FCFA` : 'Aucune'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                <span className={cn(
                  'font-medium',
                  record.status === 'active' ? 'text-success-600' : 
                  record.status === 'suspended' ? 'text-danger-600' : 'text-gray-600'
                )}>
                  {record.status === 'active' ? 'Actif' : 
                   record.status === 'suspended' ? 'Suspendu' : 'Inactif'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Button size="sm" variant="outline">
              <AcademicCapIcon className="h-4 w-4 mr-2" />
              Dossier académique
            </Button>
            <Button size="sm" variant="outline">
              <CurrencyEuroIcon className="h-4 w-4 mr-2" />
              Historique financier
            </Button>
            <Button size="sm" variant="outline">
              <DocumentTextIcon className="h-4 w-4 mr-2" />
              Documents
            </Button>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Composant Table - Exemples CROU
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Démonstration du composant Table avec des cas d'usage réels pour la gestion des données CROU.
          </p>
        </div>

        <div className="space-y-12">
          {/* Section 1: Gestion des étudiants */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <UserIcon className="h-6 w-6 text-primary-600" />
                  Gestion des étudiants
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  {filteredStudents.length} étudiant(s) • {selectedStudents.selectedRowKeys.length} sélectionné(s)
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                {selectedStudents.selectedRowKeys.length > 0 && (
                  <Button variant="outline" size="sm">
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Exporter sélection
                  </Button>
                )}
                <Button>
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Nouvel étudiant
                </Button>
              </div>
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Input
                placeholder="Rechercher un étudiant..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                leftIcon={<FunnelIcon className="h-4 w-4" />}
              />
              
              <Select
                placeholder="Tous les CROU"
                value={filters.crou}
                onChange={(value) => setFilters(prev => ({ ...prev, crou: value as string }))}
                options={[
                  { label: 'Tous les CROU', value: '' },
                  { label: 'Paris', value: 'CROU de Paris' },
                  { label: 'Lyon', value: 'CROU de Lyon' },
                  { label: 'Marseille', value: 'CROU de Marseille' },
                  { label: 'Toulouse', value: 'CROU de Toulouse' },
                  { label: 'Bordeaux', value: 'CROU de Bordeaux' }
                ]}
              />
              
              <Select
                placeholder="Tous les niveaux"
                value={filters.level}
                onChange={(value) => setFilters(prev => ({ ...prev, level: value as string }))}
                options={[
                  { label: 'Tous les niveaux', value: '' },
                  { label: 'L1', value: 'L1' },
                  { label: 'L2', value: 'L2' },
                  { label: 'L3', value: 'L3' },
                  { label: 'M1', value: 'M1' },
                  { label: 'M2', value: 'M2' }
                ]}
              />
              
              <Select
                placeholder="Tous les statuts"
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value as string }))}
                options={[
                  { label: 'Tous les statuts', value: '' },
                  { label: 'Actif', value: 'active' },
                  { label: 'Inactif', value: 'inactive' },
                  { label: 'Suspendu', value: 'suspended' }
                ]}
              />
            </div>

            {/* Tableau des étudiants */}
            <Table
              data={filteredStudents}
              columns={studentColumns}
              rowKey="id"
              sortable
              selectable
              expandable={expandableConfig}
              pagination={{
                pageSize: 15,
                page: 1,
                total: filteredStudents.length,
                pageSizeOptions: [10, 15, 25, 50]
              }}
              onSelectionChange={setSelectedStudents}
              onRowClick={(record) => {
                const key = record.id;
                const isExpanded = expandedRows.includes(key);
                setExpandedRows(isExpanded 
                  ? expandedRows.filter(k => k !== key)
                  : [...expandedRows, key]
                );
              }}
              className="shadow-sm"
            />
          </section>

          {/* Section 2: Tableau budgétaire */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <ChartBarIcon className="h-6 w-6 text-primary-600" />
                  Suivi budgétaire Q4 2024
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Analyse des écarts budgétaires par catégorie
                </p>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CalendarIcon className="h-4 w-4" />
                Dernière mise à jour: 01/12/2024
              </div>
            </div>

            {/* Indicateurs de synthèse */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <div className="text-sm text-blue-600 dark:text-blue-400">Budget total</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">730k FCFA</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                <div className="text-sm text-green-600 dark:text-green-400">Réalisé</div>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">740.5k FCFA</div>
              </div>
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                <div className="text-sm text-red-600 dark:text-red-400">Écart</div>
                <div className="text-2xl font-bold text-red-900 dark:text-red-100">+10.5k FCFA</div>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <div className="text-sm text-yellow-600 dark:text-yellow-400">Réalisation</div>
                <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">101.4%</div>
              </div>
            </div>

            {/* Tableau des budgets */}
            <Table
              data={budgetsData}
              columns={budgetColumns}
              rowKey="id"
              sortable
              variant="striped"
              size="sm"
              className="shadow-sm"
            />
          </section>

          {/* Section 3: Performance et gros datasets */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <DocumentTextIcon className="h-6 w-6 text-primary-600" />
                Performance avec gros datasets
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Démonstration des performances avec 1000+ étudiants
              </p>
            </div>

            <Table
              data={generateStudents(1000)}
              columns={studentColumns.slice(0, 5)} // Colonnes réduites pour la performance
              rowKey="id"
              sortable
              selectable
              pagination={{
                pageSize: 50,
                page: 1,
                total: 1000,
                pageSizeOptions: [25, 50, 100, 200]
              }}
              height={400}
              className="shadow-sm"
            />
          </section>
        </div>
      </div>
    </div>
  );
};

export default TableExamples;
