/**
 * FICHIER: apps/web/src/pages/financial/BudgetsPage.tsx
 * PAGE: BudgetsPage - Gestion des budgets
 *
 * DESCRIPTION:
 * Page pour la gestion des budgets (création, modification, validation)
 * Interface utilisateur complète avec formulaires et tableaux
 * Support des workflows de validation et permissions
 *
 * FONCTIONNALITÉS:
 * - Liste des budgets avec filtres et recherche
 * - Création et modification de budgets
 * - Workflow de validation multi-niveaux
 * - Exports et rapports
 * - Gestion des permissions par rôle
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Table, Modal, Input, Select, DateInput, Badge, Tabs } from '@/components/ui';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { financialService, Budget, CreateBudgetRequest } from '@/services/api/financialService';

export const BudgetsPage: React.FC = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    category: 'all',
    fiscalYear: 'all'
  });

  // Charger les budgets
  const loadBudgets = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await financialService.getBudgets({
        tenantId: user?.tenantId,
        status: filters.status !== 'all' ? filters.status : undefined,
        category: filters.category !== 'all' ? filters.category : undefined,
        fiscalYear: filters.fiscalYear !== 'all' ? filters.fiscalYear : undefined
      });
      setBudgets(response.budgets);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des budgets');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, [filters, user]);

  // Gestion de la création de budget
  const handleCreateBudget = async (data: CreateBudgetRequest) => {
    try {
      await financialService.createBudget(data);
      setIsCreateModalOpen(false);
      loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du budget');
    }
  };

  // Gestion de la validation de budget
  const handleValidateBudget = async (budgetId: string, status: 'approved' | 'rejected', comment?: string) => {
    try {
      await financialService.validateBudget(budgetId, status, comment);
      loadBudgets();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la validation du budget');
    }
  };

  // Export des budgets
  const handleExportBudgets = () => {
    const exportData = budgets.map(b => ({
      Titre: b.title,
      Catégorie: b.category,
      'Exercice Fiscal': b.fiscalYear,
      'Montant Alloué': `${b.amount.toLocaleString('fr-FR')} XOF`,
      'Montant Dépensé': `${b.spent.toLocaleString('fr-FR')} XOF`,
      'Montant Disponible': `${(b.amount - b.spent).toLocaleString('fr-FR')} XOF`,
      'Taux Utilisation': `${Math.round((b.spent / b.amount) * 100)}%`,
      Statut: b.status,
      'Date Début': new Date(b.startDate).toLocaleDateString('fr-FR'),
      'Date Fin': new Date(b.endDate).toLocaleDateString('fr-FR')
    }));

    const headers = Object.keys(exportData[0] || {});
    const csvContent = [
      headers.join(';'),
      ...exportData.map(row => headers.map(h => row[h as keyof typeof row] || '').join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `budgets_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Colonnes du tableau
  const columns = [
    {
      key: 'title',
      label: 'Titre',
      render: (budget: Budget) => (
        <div>
          <p className="font-medium">{budget.title}</p>
          <p className="text-sm text-gray-500">{budget.category}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Montant',
      render: (budget: Budget) => (
        <div className="text-right">
          <p className="font-medium">{budget.amount.toLocaleString()} XOF</p>
          <p className="text-sm text-gray-500">
            Dépensé: {budget.spent.toLocaleString()} XOF
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (budget: Budget) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'draft':
              return <Badge variant="secondary">Brouillon</Badge>;
            case 'pending':
              return <Badge variant="warning">En attente</Badge>;
            case 'approved':
              return <Badge variant="success">Approuvé</Badge>;
            case 'rejected':
              return <Badge variant="danger">Rejeté</Badge>;
            case 'active':
              return <Badge variant="primary">Actif</Badge>;
            case 'closed':
              return <Badge variant="secondary">Fermé</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(budget.status);
      }
    },
    {
      key: 'fiscalYear',
      label: 'Exercice',
      render: (budget: Budget) => budget.fiscalYear
    },
    {
      key: 'utilization',
      label: 'Utilisation',
      render: (budget: Budget) => {
        const percentage = (budget.spent / budget.amount) * 100;
        return (
          <div className="w-full">
            <div className="flex justify-between text-sm mb-1">
              <span>{percentage.toFixed(1)}%</span>
              <span>{budget.remaining.toLocaleString()} XOF</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  percentage > 90 ? 'bg-red-500' : 
                  percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              ></div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (budget: Budget) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => setSelectedBudget(budget)}
          >
            Voir
          </Button>
          {budget.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<PencilIcon className="h-4 w-4" />}
              onClick={() => {
                setSelectedBudget(budget);
                setIsEditModalOpen(true);
              }}
            >
              Modifier
            </Button>
          )}
          {budget.status === 'pending' && user?.role === 'directeur' && (
            <>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<CheckIcon className="h-4 w-4" />}
                onClick={() => handleValidateBudget(budget.id, 'approved')}
                className="text-green-600 hover:text-green-700"
              >
                Approuver
              </Button>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<XMarkIcon className="h-4 w-4" />}
                onClick={() => handleValidateBudget(budget.id, 'rejected')}
                className="text-red-600 hover:text-red-700"
              >
                Rejeter
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestion des Budgets</h1>
            <p className="text-lg text-gray-600 mt-2">
              Création, suivi et validation des budgets CROU
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
              onClick={handleExportBudgets}
            >
              Exporter
            </Button>
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Nouveau Budget
            </Button>
          </div>
        </div>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <Card.Content>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Rechercher un budget..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            />
            <Select
              value={filters.status}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'draft', label: 'Brouillon' },
                { value: 'pending', label: 'En attente' },
                { value: 'approved', label: 'Approuvé' },
                { value: 'active', label: 'Actif' },
                { value: 'closed', label: 'Fermé' }
              ]}
            />
            <Select
              value={filters.category}
              onChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
              options={[
                { value: 'all', label: 'Toutes les catégories' },
                { value: 'restauration', label: 'Restauration' },
                { value: 'logement', label: 'Logement' },
                { value: 'transport', label: 'Transport' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'personnel', label: 'Personnel' }
              ]}
            />
            <Select
              value={filters.fiscalYear}
              onChange={(value) => setFilters(prev => ({ ...prev, fiscalYear: value }))}
              options={[
                { value: 'all', label: 'Tous les exercices' },
                { value: '2024', label: '2024' },
                { value: '2023', label: '2023' },
                { value: '2022', label: '2022' }
              ]}
            />
          </div>
        </Card.Content>
      </Card>

      {/* Tableau des budgets */}
      <Card>
        <Card.Header>
          <Card.Title>Liste des Budgets</Card.Title>
        </Card.Header>
        <Card.Content>
          <Table
            data={budgets}
            columns={columns}
            loading={isLoading}
            error={error}
            pagination={{ pageSize: 10 }}
            sortable
          />
        </Card.Content>
      </Card>

      {/* Modal de création */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau Budget"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data: CreateBudgetRequest = {
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              category: formData.get('category') as string,
              amount: Number(formData.get('amount')),
              fiscalYear: formData.get('fiscalYear') as string
            };
            handleCreateBudget(data);
          }}
          className="space-y-4"
        >
          <Input
            name="title"
            label="Titre du budget"
            placeholder="Ex: Budget Restauration 2024"
            required
          />
          <Input
            name="description"
            label="Description"
            placeholder="Description du budget..."
            multiline
            rows={3}
          />
          <Select
            name="category"
            label="Catégorie"
            options={[
              { value: 'restauration', label: 'Restauration' },
              { value: 'logement', label: 'Logement' },
              { value: 'transport', label: 'Transport' },
              { value: 'maintenance', label: 'Maintenance' },
              { value: 'personnel', label: 'Personnel' },
              { value: 'autre', label: 'Autre' }
            ]}
            required
          />
          <Input
            name="amount"
            label="Montant (XOF)"
            type="number"
            placeholder="1000000"
            required
          />
          <Select
            name="fiscalYear"
            label="Exercice fiscal"
            options={[
              { value: '2024', label: '2024' },
              { value: '2025', label: '2025' }
            ]}
            required
          />
          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button type="submit" variant="primary">
              Créer le Budget
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de détail */}
      {selectedBudget && (
        <Modal
          isOpen={!!selectedBudget}
          onClose={() => setSelectedBudget(null)}
          title={`Budget: ${selectedBudget.title}`}
          size="lg"
        >
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Catégorie</label>
                <p className="text-lg">{selectedBudget.category}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Exercice</label>
                <p className="text-lg">{selectedBudget.fiscalYear}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Montant total</label>
                <p className="text-lg font-bold">{selectedBudget.amount.toLocaleString()} XOF</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Montant dépensé</label>
                <p className="text-lg text-red-600">{selectedBudget.spent.toLocaleString()} XOF</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Montant restant</label>
                <p className="text-lg text-green-600">{selectedBudget.remaining.toLocaleString()} XOF</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Statut</label>
                <Badge variant="primary">{selectedBudget.status}</Badge>
              </div>
            </div>
            
            {selectedBudget.description && (
              <div>
                <label className="text-sm font-medium text-gray-500">Description</label>
                <p className="text-lg">{selectedBudget.description}</p>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setSelectedBudget(null)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Container>
  );
};

export default BudgetsPage;
