/**
 * FICHIER: apps/web/src/stores/allocation.ts
 * STORE: Allocation Store - Gestion état allocations
 *
 * DESCRIPTION:
 * Store Zustand pour gérer l'état des allocations budgétaires et stocks
 * Support hiérarchique Ministère → CROU
 *
 * FONCTIONNALITÉS:
 * - Gestion allocations budgétaires
 * - Gestion allocations stocks
 * - Historique et filtres
 * - Validation et exécution
 * - Statistiques
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
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

  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isValidating: boolean;
  isExecuting: boolean;
  error: string | null;

  // Filtres
  filters: AllocationFilters;

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

  // CRUD Allocations
  createBudgetAllocation: (data: CreateBudgetAllocationRequest) => Promise<BudgetAllocation>;
  createStockAllocation: (data: CreateStockAllocationRequest) => Promise<StockAllocation>;
  validateAllocation: (allocationId: string, action: 'approve' | 'reject', reason?: string) => Promise<void>;
  executeAllocation: (allocationId: string) => Promise<void>;
  cancelAllocation: (allocationId: string, reason: string) => Promise<void>;

  // Filtres
  setFilters: (filters: AllocationFilters) => void;
  clearFilters: () => void;

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
  isLoading: false,
  isCreating: false,
  isValidating: false,
  isExecuting: false,
  error: null,
  filters: {},
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
      // FILTRES
      // ========================================

      setFilters: (filters: AllocationFilters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: {} });
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

export default useAllocationStore;
