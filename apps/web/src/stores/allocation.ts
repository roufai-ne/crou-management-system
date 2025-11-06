/**
 * FICHIER: apps/web/src/stores/allocation.ts
 * STORE: Allocation Store - Gestion état allocations
 *
 * DESCRIPTION:
 * Store Zustand pour gérer l'état des allocations budgétaires et stocks
 * Support hiérarchique à 3 niveaux (Ministère → Région → CROU)
 *
 * FONCTIONNALITÉS:
 * - Gestion allocations budgétaires et stocks
 * - Support hiérarchie 3 niveaux (ministry, region, crou)
 * - Flux budgétaires cascadés
 * - Arbre hiérarchique des allocations
 * - Historique et filtres avancés
 * - Validation et exécution
 * - Statistiques et résumés
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 * VERSION: 2.0 (Support hiérarchie 3 niveaux)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import allocationService, {
  type Allocation,
  type BudgetAllocation,
  type StockAllocation,
  type AllocationSummary,
  type AllocationFilters,
  type CreateBudgetAllocationRequest,
  type CreateStockAllocationRequest,
  type HierarchyLevel,
  AllocationStatus
} from '@/services/api/allocationService';

// ================================================================================================
// TYPES
// ================================================================================================

interface AllocationState {
  // Données
  allocations: Allocation[];
  budgetAllocations: BudgetAllocation[];
  stockAllocations: StockAllocation[];
  summary: AllocationSummary | null;

  // Hiérarchie (nouveau - support 3 niveaux)
  tenantHierarchy: {
    ministry: { id: string; name: string } | null;
    regions: Array<{
      id: string;
      name: string;
      crous: Array<{ id: string; name: string }>;
    }>;
  } | null;
  budgetFlow: any | null; // Flux budgétaire
  allocationTree: (Allocation & { children?: Allocation[] }) | null; // Arbre d'allocations
  statistics: any | null; // Statistiques par niveau

  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isValidating: boolean;
  isExecuting: boolean;
  isCascading: boolean; // Nouveau - pour allocations cascadées
  error: string | null;

  // Filtres
  filters: AllocationFilters;
  selectedLevel?: HierarchyLevel; // Nouveau - niveau sélectionné

  // Dernière mise à jour
  lastUpdated: string | null;
}

interface AllocationActions {
  // Chargement données
  loadAllocations: (filters?: AllocationFilters) => Promise<void>;
  loadBudgetAllocations: (filters?: AllocationFilters) => Promise<void>;
  loadStockAllocations: (filters?: AllocationFilters) => Promise<void>;
  loadSummary: (tenantId?: string, exercice?: number) => Promise<void>;
  loadAllocationsForCROU: (crouId: string) => Promise<void>;

  // Nouveau - Support hiérarchie à 3 niveaux
  loadAllocationsByLevel: (level: HierarchyLevel, filters?: AllocationFilters) => Promise<void>;
  loadAllocationsForTenant: (tenantId: string, level?: HierarchyLevel) => Promise<void>;
  loadTenantHierarchy: () => Promise<void>;
  loadChildAllocations: (parentAllocationId: string) => Promise<void>;
  loadAllocationTree: (rootAllocationId: string) => Promise<void>;
  loadBudgetFlow: (budgetId: string, exercice?: number) => Promise<void>;
  loadStatistics: (filters?: { exercice?: number; level?: HierarchyLevel; tenantId?: string }) => Promise<void>;
  loadPendingAllocations: (level?: HierarchyLevel) => Promise<void>;

  // CRUD Allocations
  createBudgetAllocation: (data: CreateBudgetAllocationRequest) => Promise<BudgetAllocation>;
  createStockAllocation: (data: CreateStockAllocationRequest) => Promise<StockAllocation>;
  validateAllocation: (allocationId: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  executeAllocation: (allocationId: string) => Promise<void>;
  cancelAllocation: (allocationId: string, reason: string) => Promise<void>;

  // Nouveau - Allocations cascadées
  createCascadingAllocation: (request: {
    parentAllocationId: string;
    distributions: Array<{
      targetTenantId: string;
      targetTenantLevel: HierarchyLevel;
      montant?: number;
      quantity?: number;
      libelle?: string;
      description?: string;
    }>;
    validateParent?: boolean;
  }) => Promise<{ parent: Allocation; children: Allocation[] }>;

  // Filtres
  setFilters: (filters: AllocationFilters) => void;
  clearFilters: () => void;
  setSelectedLevel: (level?: HierarchyLevel) => void;

  // UI
  clearError: () => void;
  reset: () => void;
}

type AllocationStore = AllocationState & AllocationActions;

// ================================================================================================
// ÉTAT INITIAL
// ================================================================================================

const initialState: AllocationState = {
  allocations: [],
  budgetAllocations: [],
  stockAllocations: [],
  summary: null,
  tenantHierarchy: null,
  budgetFlow: null,
  allocationTree: null,
  statistics: null,
  isLoading: false,
  isCreating: false,
  isValidating: false,
  isExecuting: false,
  isCascading: false,
  error: null,
  filters: {},
  selectedLevel: undefined,
  lastUpdated: null
};

// ================================================================================================
// STORE
// ================================================================================================

export const useAllocationStore = create<AllocationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // ========================================
      // CHARGEMENT DONNÉES
      // ========================================

      loadAllocations: async (filters?: AllocationFilters) => {
        try {
          set({ isLoading: true, error: null });
          const allocations = await allocationService.getAllocationHistory(filters || get().filters);
          set({
            allocations,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des allocations',
            isLoading: false
          });
        }
      },

      loadBudgetAllocations: async (filters?: AllocationFilters) => {
        try {
          set({ isLoading: true, error: null });
          const allocations = await allocationService.getAllocationHistory({
            ...filters,
            type: 'budget'
          });
          set({
            budgetAllocations: allocations as BudgetAllocation[],
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des allocations budgétaires',
            isLoading: false
          });
        }
      },

      loadStockAllocations: async (filters?: AllocationFilters) => {
        try {
          set({ isLoading: true, error: null });
          const allocations = await allocationService.getAllocationHistory({
            ...filters,
            type: 'stock'
          });
          set({
            stockAllocations: allocations as StockAllocation[],
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des allocations de stock',
            isLoading: false
          });
        }
      },

      loadSummary: async (tenantId?: string, exercice?: number) => {
        try {
          set({ isLoading: true, error: null });
          const summary = await allocationService.getAllocationSummary(tenantId, exercice);
          set({
            summary,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement du résumé',
            isLoading: false
          });
        }
      },

      loadAllocationsForCROU: async (crouId: string) => {
        try {
          set({ isLoading: true, error: null });
          const { budgetAllocations, stockAllocations } = await allocationService.getAllocationsForCROU(crouId);
          set({
            budgetAllocations,
            stockAllocations,
            allocations: [...budgetAllocations, ...stockAllocations],
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des allocations du CROU',
            isLoading: false
          });
        }
      },

      // ========================================
      // HIÉRARCHIE À 3 NIVEAUX (NOUVEAU)
      // ========================================

      loadAllocationsByLevel: async (level: HierarchyLevel, filters?: AllocationFilters) => {
        try {
          set({ isLoading: true, error: null });
          const allocations = await allocationService.getAllocationsByLevel(level, filters);
          set({
            allocations,
            selectedLevel: level,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || `Erreur lors du chargement des allocations pour le niveau ${level}`,
            isLoading: false
          });
        }
      },

      loadAllocationsForTenant: async (tenantId: string, level?: HierarchyLevel) => {
        try {
          set({ isLoading: true, error: null });
          const allocations = await allocationService.getAllocationHistory({
            tenantId,
            level
          });
          set({
            allocations,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des allocations du tenant',
            isLoading: false
          });
        }
      },

      loadTenantHierarchy: async () => {
        try {
          set({ isLoading: true, error: null });
          const hierarchy = await allocationService.getTenantHierarchy();
          set({
            tenantHierarchy: hierarchy,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement de la hiérarchie',
            isLoading: false
          });
        }
      },

      loadChildAllocations: async (parentAllocationId: string) => {
        try {
          set({ isLoading: true, error: null });
          const childAllocations = await allocationService.getChildAllocations(parentAllocationId);

          // Ajouter les allocations enfant à la liste principale
          set((state) => ({
            allocations: [...state.allocations, ...childAllocations],
            isLoading: false,
            lastUpdated: new Date().toISOString()
          }));
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des allocations enfant',
            isLoading: false
          });
        }
      },

      loadAllocationTree: async (rootAllocationId: string) => {
        try {
          set({ isLoading: true, error: null });
          const tree = await allocationService.getAllocationTree(rootAllocationId);
          set({
            allocationTree: tree,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement de l\'arbre d\'allocations',
            isLoading: false
          });
        }
      },

      loadBudgetFlow: async (budgetId: string, exercice?: number) => {
        try {
          set({ isLoading: true, error: null });
          const flow = await allocationService.getBudgetFlow(budgetId, exercice);
          set({
            budgetFlow: flow,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement du flux budgétaire',
            isLoading: false
          });
        }
      },

      loadStatistics: async (filters?: { exercice?: number; level?: HierarchyLevel; tenantId?: string }) => {
        try {
          set({ isLoading: true, error: null });
          const statistics = await allocationService.getAllocationStatistics(filters);
          set({
            statistics,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des statistiques',
            isLoading: false
          });
        }
      },

      loadPendingAllocations: async (level?: HierarchyLevel) => {
        try {
          set({ isLoading: true, error: null });
          const allocations = await allocationService.getPendingAllocations(level);
          set({
            allocations,
            isLoading: false,
            lastUpdated: new Date().toISOString()
          });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors du chargement des allocations en attente',
            isLoading: false
          });
        }
      },

      // ========================================
      // CRUD ALLOCATIONS
      // ========================================

      createBudgetAllocation: async (data: CreateBudgetAllocationRequest) => {
        try {
          set({ isCreating: true, error: null });
          const allocation = await allocationService.createBudgetAllocation(data);

          // Ajouter à la liste
          set((state) => ({
            budgetAllocations: [allocation, ...state.budgetAllocations],
            allocations: [allocation, ...state.allocations],
            isCreating: false
          }));

          return allocation;
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de la création de l\'allocation budgétaire',
            isCreating: false
          });
          throw error;
        }
      },

      createStockAllocation: async (data: CreateStockAllocationRequest) => {
        try {
          set({ isCreating: true, error: null });
          const allocation = await allocationService.createStockAllocation(data);

          // Ajouter à la liste
          set((state) => ({
            stockAllocations: [allocation, ...state.stockAllocations],
            allocations: [allocation, ...state.allocations],
            isCreating: false
          }));

          return allocation;
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de la création de l\'allocation de stock',
            isCreating: false
          });
          throw error;
        }
      },

      validateAllocation: async (allocationId: string, action: 'approve' | 'reject', reason?: string) => {
        try {
          set({ isValidating: true, error: null });
          await allocationService.validateAllocation(allocationId, action, reason);

          // Recharger les allocations
          await get().loadAllocations();

          set({ isValidating: false });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de la validation',
            isValidating: false
          });
          throw error;
        }
      },

      executeAllocation: async (allocationId: string) => {
        try {
          set({ isExecuting: true, error: null });
          await allocationService.executeAllocation(allocationId);

          // Recharger les allocations
          await get().loadAllocations();

          set({ isExecuting: false });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de l\'exécution',
            isExecuting: false
          });
          throw error;
        }
      },

      cancelAllocation: async (allocationId: string, reason: string) => {
        try {
          set({ isLoading: true, error: null });
          await allocationService.cancelAllocation(allocationId, reason);

          // Recharger les allocations
          await get().loadAllocations();

          set({ isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de l\'annulation',
            isLoading: false
          });
          throw error;
        }
      },

      // ========================================
      // ALLOCATIONS CASCADÉES (NOUVEAU)
      // ========================================

      createCascadingAllocation: async (request: {
        parentAllocationId: string;
        distributions: Array<{
          targetTenantId: string;
          targetTenantLevel: HierarchyLevel;
          montant?: number;
          quantity?: number;
          libelle?: string;
          description?: string;
        }>;
        validateParent?: boolean;
      }) => {
        try {
          set({ isCascading: true, error: null });
          const result = await allocationService.createCascadingAllocation(request);

          // Ajouter les nouvelles allocations
          set((state) => ({
            allocations: [result.parent, ...result.children, ...state.allocations],
            isCascading: false,
            lastUpdated: new Date().toISOString()
          }));

          return result;
        } catch (error: any) {
          set({
            error: error.message || 'Erreur lors de la création de l\'allocation cascadée',
            isCascading: false
          });
          throw error;
        }
      },

      // ========================================
      // FILTRES
      // ========================================

      setFilters: (filters: AllocationFilters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: {} });
      },

      setSelectedLevel: (level?: HierarchyLevel) => {
        set({ selectedLevel: level });
      },

      // ========================================
      // UI
      // ========================================

      clearError: () => {
        set({ error: null });
      },

      reset: () => {
        set(initialState);
      }
    }),
    {
      name: 'crou-allocation-storage',
      partialize: (state) => ({
        filters: state.filters,
        lastUpdated: state.lastUpdated
      })
    }
  )
);

// ================================================================================================
// HOOKS HELPER
// ================================================================================================

/**
 * Hook pour récupérer les allocations budgétaires
 */
export const useBudgetAllocations = () => {
  const budgetAllocations = useAllocationStore((state) => state.budgetAllocations);
  const isLoading = useAllocationStore((state) => state.isLoading);
  const error = useAllocationStore((state) => state.error);
  const loadBudgetAllocations = useAllocationStore((state) => state.loadBudgetAllocations);

  return { budgetAllocations, isLoading, error, loadBudgetAllocations };
};

/**
 * Hook pour récupérer les allocations de stock
 */
export const useStockAllocations = () => {
  const stockAllocations = useAllocationStore((state) => state.stockAllocations);
  const isLoading = useAllocationStore((state) => state.isLoading);
  const error = useAllocationStore((state) => state.error);
  const loadStockAllocations = useAllocationStore((state) => state.loadStockAllocations);

  return { stockAllocations, isLoading, error, loadStockAllocations };
};

/**
 * Hook pour les actions d'allocation
 */
export const useAllocationActions = () => {
  const createBudgetAllocation = useAllocationStore((state) => state.createBudgetAllocation);
  const createStockAllocation = useAllocationStore((state) => state.createStockAllocation);
  const validateAllocation = useAllocationStore((state) => state.validateAllocation);
  const executeAllocation = useAllocationStore((state) => state.executeAllocation);
  const cancelAllocation = useAllocationStore((state) => state.cancelAllocation);
  const isCreating = useAllocationStore((state) => state.isCreating);
  const isValidating = useAllocationStore((state) => state.isValidating);
  const isExecuting = useAllocationStore((state) => state.isExecuting);

  return {
    createBudgetAllocation,
    createStockAllocation,
    validateAllocation,
    executeAllocation,
    cancelAllocation,
    isCreating,
    isValidating,
    isExecuting
  };
};

/**
 * Hook pour le résumé des allocations
 */
export const useAllocationSummary = () => {
  const summary = useAllocationStore((state) => state.summary);
  const isLoading = useAllocationStore((state) => state.isLoading);
  const loadSummary = useAllocationStore((state) => state.loadSummary);

  return { summary, isLoading, loadSummary };
};

/**
 * Hook pour la hiérarchie à 3 niveaux (nouveau)
 */
export const useAllocationHierarchy = () => {
  const tenantHierarchy = useAllocationStore((state) => state.tenantHierarchy);
  const selectedLevel = useAllocationStore((state) => state.selectedLevel);
  const isLoading = useAllocationStore((state) => state.isLoading);
  const loadTenantHierarchy = useAllocationStore((state) => state.loadTenantHierarchy);
  const loadAllocationsByLevel = useAllocationStore((state) => state.loadAllocationsByLevel);
  const setSelectedLevel = useAllocationStore((state) => state.setSelectedLevel);

  return {
    tenantHierarchy,
    selectedLevel,
    isLoading,
    loadTenantHierarchy,
    loadAllocationsByLevel,
    setSelectedLevel
  };
};

/**
 * Hook pour les allocations cascadées (nouveau)
 */
export const useCascadingAllocations = () => {
  const isCascading = useAllocationStore((state) => state.isCascading);
  const createCascadingAllocation = useAllocationStore((state) => state.createCascadingAllocation);
  const loadChildAllocations = useAllocationStore((state) => state.loadChildAllocations);
  const loadAllocationTree = useAllocationStore((state) => state.loadAllocationTree);
  const allocationTree = useAllocationStore((state) => state.allocationTree);

  return {
    isCascading,
    createCascadingAllocation,
    loadChildAllocations,
    loadAllocationTree,
    allocationTree
  };
};

/**
 * Hook pour le flux budgétaire (nouveau)
 */
export const useBudgetFlow = () => {
  const budgetFlow = useAllocationStore((state) => state.budgetFlow);
  const isLoading = useAllocationStore((state) => state.isLoading);
  const loadBudgetFlow = useAllocationStore((state) => state.loadBudgetFlow);

  return { budgetFlow, isLoading, loadBudgetFlow };
};

/**
 * Hook pour les statistiques d'allocations (nouveau)
 */
export const useAllocationStatistics = () => {
  const statistics = useAllocationStore((state) => state.statistics);
  const isLoading = useAllocationStore((state) => state.isLoading);
  const loadStatistics = useAllocationStore((state) => state.loadStatistics);

  return { statistics, isLoading, loadStatistics };
};

export default useAllocationStore;
