/**
 * FICHIER: apps/web/src/pages/financial/AllocationsPage.tsx
 * PAGE: AllocationsPage - Gestion complète des allocations budgétaires
 *
 * DESCRIPTION:
 * Interface complète pour la gestion des allocations budgétaires
 * à travers la hiérarchie à 3 niveaux (Ministry → Region → CROU)
 *
 * FONCTIONNALITÉS:
 * - Création d'allocations (budget et stock)
 * - Validation workflow (approve/reject)
 * - Visualisation du flux budgétaire
 * - Arbre hiérarchique des tenants
 * - Statistiques et KPIs
 * - Filtrage par niveau hiérarchique
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Filter,
  RefreshCw,
  Download,
  TrendingUp,
  Building2,
  ArrowRightLeft,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { KPICard } from '@/components/ui/KPICard';
import { Tabs } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import toast from 'react-hot-toast';

// Composants d'allocations
import {
  AllocationForm,
  AllocationTable,
  BudgetFlowDiagram,
  HierarchicalTenantTree
} from '@/components/allocation';

// Hooks et stores
import { useAllocationHierarchy, useCascadingAllocations, useBudgetFlow, useAllocationStatistics } from '@/stores/allocation';
import { useHierarchyLevel, useAllocationPermissions, useCurrentTenant } from '@/hooks/useAuthHierarchy';
import type { HierarchyLevel } from '@/stores/auth';

// ================================================================================================
// TYPES
// ================================================================================================

interface AllocationFilters {
  level?: HierarchyLevel;
  status?: 'pending' | 'approved' | 'rejected' | 'executed' | 'cancelled' | 'all';
  type?: 'budget' | 'stock' | 'all';
  dateFrom?: string;
  dateTo?: string;
}

// ================================================================================================
// COMPOSANT PRINCIPAL
// ================================================================================================

export const AllocationsPage: React.FC = () => {
  // État local
  const [activeTab, setActiveTab] = useState<'manage' | 'validate' | 'visualize' | 'hierarchy'>('manage');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allocationType, setAllocationType] = useState<'budget' | 'stock'>('budget');
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | undefined>();
  const [filters, setFilters] = useState<AllocationFilters>({
    level: undefined,
    status: 'all',
    type: 'all'
  });

  // Hooks d'authentification et permissions
  const { level: userLevel, isMinistry, isRegion, isCrou } = useHierarchyLevel();
  const { canCreate, canValidate, canManageBudget } = useAllocationPermissions();
  const { tenantId, tenantName, hierarchyLevel } = useCurrentTenant();

  // Hooks de données
  const {
    tenantHierarchy,
    loadTenantHierarchy,
    isLoading: hierarchyLoading
  } = useAllocationHierarchy();

  const {
    allocations,
    isLoading: allocationsLoading,
    loadAllocations,
    loadPendingAllocations
  } = useCascadingAllocations();

  const {
    budgetFlow,
    loadBudgetFlow,
    isLoading: flowLoading
  } = useBudgetFlow(selectedBudgetId);

  const {
    statistics,
    loadStatistics,
    isLoading: statsLoading
  } = useAllocationStatistics(filters);

  // Charger les données au montage
  useEffect(() => {
    loadTenantHierarchy();
    loadStatistics(filters);

    if (activeTab === 'validate') {
      loadPendingAllocations(hierarchyLevel || undefined);
    } else {
      loadAllocations(filters);
    }
  }, [activeTab, filters, hierarchyLevel]);

  // Gestionnaires d'événements
  const handleCreateAllocation = () => {
    if (!canCreate) {
      toast.error('Vous n\'avez pas la permission de créer des allocations');
      return;
    }
    setShowCreateForm(true);
  };

  const handleAllocationCreated = () => {
    setShowCreateForm(false);
    toast.success('Allocation créée avec succès');
    loadAllocations(filters);
    loadStatistics(filters);
  };

  const handleValidateAllocation = async (
    allocationId: string,
    action: 'approve' | 'reject',
    reason?: string
  ) => {
    try {
      // Appeler l'API de validation via le store
      await useAllocationHierarchy.getState().validateAllocation(allocationId, action, reason);
      toast.success(`Allocation ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`);

      // Recharger les données
      if (activeTab === 'validate') {
        loadPendingAllocations(hierarchyLevel || undefined);
      } else {
        loadAllocations(filters);
      }
      loadStatistics(filters);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la validation');
    }
  };

  const handleExecuteAllocation = async (allocationId: string) => {
    try {
      await useAllocationHierarchy.getState().executeAllocation(allocationId);
      toast.success('Allocation exécutée avec succès');
      loadAllocations(filters);
      loadStatistics(filters);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'exécution');
    }
  };

  const handleRefresh = () => {
    loadTenantHierarchy();
    loadAllocations(filters);
    loadStatistics(filters);
    if (selectedBudgetId) {
      loadBudgetFlow(selectedBudgetId);
    }
    toast.success('Données actualisées');
  };

  const handleExport = () => {
    toast.info('Export en cours de développement');
  };

  // Filtrer les allocations selon l'onglet actif
  const filteredAllocations = React.useMemo(() => {
    if (!allocations) return [];

    let filtered = [...allocations];

    // Filtre par statut
    if (activeTab === 'validate') {
      filtered = filtered.filter(a => a.status === 'pending');
    } else if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(a => a.status === filters.status);
    }

    // Filtre par type
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(a => a.type === filters.type);
    }

    // Filtre par niveau
    if (filters.level) {
      filtered = filtered.filter(a => a.level === filters.level);
    }

    return filtered;
  }, [allocations, filters, activeTab]);

  // Calcul des statistiques d'affichage
  const displayStats = React.useMemo(() => {
    if (!statistics) {
      return {
        total: 0,
        pending: 0,
        approved: 0,
        totalAmount: 0
      };
    }

    return {
      total: statistics.total || 0,
      pending: statistics.byStatus?.pending || 0,
      approved: statistics.byStatus?.approved || 0,
      totalAmount: statistics.totalAmount || 0
    };
  }, [statistics]);

  // ==============================================================================================
  // RENDER
  // ==============================================================================================

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Allocations
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {tenantName} • {userLevel ? userLevel.charAt(0).toUpperCase() + userLevel.slice(1) : 'N/A'}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleRefresh}
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualiser</span>
          </Button>

          <Button
            variant="outline"
            onClick={handleExport}
            className="flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Exporter</span>
          </Button>

          {canCreate && (
            <Button
              onClick={handleCreateAllocation}
              className="flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Nouvelle Allocation</span>
            </Button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Allocations"
          value={displayStats.total}
          trend="stable"
          trendValue={`${filteredAllocations.length} affichées`}
          icon={<ArrowRightLeft className="h-5 w-5" />}
          variant="primary"
        />

        <KPICard
          title="En Attente"
          value={displayStats.pending}
          trend={displayStats.pending > 0 ? 'up' : 'stable'}
          trendValue="À valider"
          icon={<Clock className="h-5 w-5" />}
          variant="warning"
        />

        <KPICard
          title="Approuvées"
          value={displayStats.approved}
          trend="up"
          trendValue="Validées"
          icon={<CheckCircle className="h-5 w-5" />}
          variant="success"
        />

        <KPICard
          title="Montant Total"
          value={`${(displayStats.totalAmount / 1000000).toFixed(1)}M`}
          trend="up"
          trendValue="FCFA"
          icon={<TrendingUp className="h-5 w-5" />}
          variant="secondary"
        />
      </div>

      {/* Filtres */}
      <Card className="p-4">
        <div className="flex items-center space-x-4">
          <Filter className="h-5 w-5 text-gray-400" />

          <Select
            value={filters.level || 'all'}
            onChange={(e) => setFilters({ ...filters, level: e.target.value === 'all' ? undefined : e.target.value as HierarchyLevel })}
            className="w-48"
          >
            <option value="all">Tous les niveaux</option>
            <option value="ministry">Ministère</option>
            <option value="region">Région</option>
            <option value="crou">CROU</option>
          </Select>

          <Select
            value={filters.status || 'all'}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            className="w-48"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvées</option>
            <option value="rejected">Rejetées</option>
            <option value="executed">Exécutées</option>
            <option value="cancelled">Annulées</option>
          </Select>

          <Select
            value={filters.type || 'all'}
            onChange={(e) => setFilters({ ...filters, type: e.target.value as any })}
            className="w-48"
          >
            <option value="all">Tous les types</option>
            <option value="budget">Budget</option>
            <option value="stock">Stock</option>
          </Select>

          {Object.keys(filters).some(key => filters[key as keyof AllocationFilters] && filters[key as keyof AllocationFilters] !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({ level: undefined, status: 'all', type: 'all' })}
            >
              Réinitialiser
            </Button>
          )}
        </div>
      </Card>

      {/* Onglets principaux */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)} className="w-full">
        <Tabs.List>
          <Tabs.Trigger value="manage">
            Gestion
          </Tabs.Trigger>

          {canValidate && (
            <Tabs.Trigger value="validate">
              Validation
              {displayStats.pending > 0 && (
                <Badge variant="warning" className="ml-2">
                  {displayStats.pending}
                </Badge>
              )}
            </Tabs.Trigger>
          )}

          <Tabs.Trigger value="visualize">
            Visualisation
          </Tabs.Trigger>

          <Tabs.Trigger value="hierarchy">
            Hiérarchie
          </Tabs.Trigger>
        </Tabs.List>

        {/* ONGLET: GESTION */}
        <Tabs.Content value="manage" className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Liste des Allocations
              </h3>

              <AllocationTable
                allocations={filteredAllocations}
                onValidate={canValidate ? handleValidateAllocation : undefined}
                onExecute={canValidate ? handleExecuteAllocation : undefined}
                showFilters={false}
                showActions={canValidate}
              />
            </div>
          </Card>
        </Tabs.Content>

        {/* ONGLET: VALIDATION */}
        {canValidate && (
          <Tabs.Content value="validate" className="space-y-6">
            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Allocations en Attente de Validation
                  </h3>
                  <Badge variant="warning">
                    {displayStats.pending} en attente
                  </Badge>
                </div>

                {filteredAllocations.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">
                      Aucune allocation en attente de validation
                    </p>
                  </div>
                ) : (
                  <AllocationTable
                    allocations={filteredAllocations}
                    onValidate={handleValidateAllocation}
                    onExecute={handleExecuteAllocation}
                    showFilters={false}
                    showActions={true}
                  />
                )}
              </div>
            </Card>
          </Tabs.Content>
        )}

        {/* ONGLET: VISUALISATION */}
        <Tabs.Content value="visualize" className="space-y-6">
          {selectedBudgetId && budgetFlow ? (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Flux Budgétaire
                </h3>
                <BudgetFlowDiagram
                  data={budgetFlow}
                  onSelectRegion={(regionId) => console.log('Region selected:', regionId)}
                  onSelectCROU={(crouId) => console.log('CROU selected:', crouId)}
                />
              </div>
            </Card>
          ) : (
            <Card>
              <div className="p-12 text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Sélectionnez un budget pour visualiser le flux budgétaire
                </p>
              </div>
            </Card>
          )}
        </Tabs.Content>

        {/* ONGLET: HIÉRARCHIE */}
        <Tabs.Content value="hierarchy" className="space-y-6">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Arbre Hiérarchique des Tenants
              </h3>

              {tenantHierarchy ? (
                <HierarchicalTenantTree
                  hierarchy={tenantHierarchy}
                  selectedTenantId={tenantId || undefined}
                  onSelectTenant={(id, level) => {
                    console.log('Tenant selected:', id, level);
                    setFilters({ ...filters, level });
                  }}
                  showSearch={true}
                  loading={hierarchyLoading}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    Chargement de la hiérarchie...
                  </p>
                </div>
              )}
            </div>
          </Card>
        </Tabs.Content>
      </Tabs>

      {/* Modal de création d'allocation */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Nouvelle Allocation
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type d'allocation
                </label>
                <div className="flex space-x-4">
                  <Button
                    variant={allocationType === 'budget' ? 'primary' : 'outline'}
                    onClick={() => setAllocationType('budget')}
                  >
                    Budget
                  </Button>
                  <Button
                    variant={allocationType === 'stock' ? 'primary' : 'outline'}
                    onClick={() => setAllocationType('stock')}
                  >
                    Stock
                  </Button>
                </div>
              </div>

              <AllocationForm
                type={allocationType}
                onSuccess={handleAllocationCreated}
                onCancel={() => setShowCreateForm(false)}
                sourceLevel={hierarchyLevel || undefined}
                sourceTenantId={tenantId || undefined}
              />
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AllocationsPage;
