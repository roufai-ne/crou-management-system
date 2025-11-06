/**
 * FICHIER: apps/web/src/stores/financial.ts
 * STORE: Financial - Store Zustand pour la gestion financière
 *
 * DESCRIPTION:
 * Store global pour la gestion de l'état financier
 * Budgets, transactions, subventions avec cache et persistence
 *
 * FONCTIONNALITÉS:
 * - Gestion des budgets (CRUD, validation, workflow)
 * - Gestion des transactions (création, validation)
 * - Gestion des subventions gouvernementales
 * - Cache intelligent avec invalidation
 * - Support hiérarchie à 3 niveaux
 * - Synchronisation automatique
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { financialService, type Budget, type Transaction, type FinancialFilters, type FinancialStats } from '@/services/api/financialService';

// ================================================================================================
// TYPES ET INTERFACES
// ================================================================================================

export interface FinancialState {
  // ============================================================================
  // BUDGETS
  // ============================================================================
  budgets: Budget[];
  selectedBudget: Budget | null;
  budgetStats: FinancialStats | null;
  budgetsLoading: boolean;
  budgetsError: string | null;

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================
  transactions: Transaction[];
  selectedTransaction: Transaction | null;
  transactionsLoading: boolean;
  transactionsError: string | null;

  // ============================================================================
  // SUBVENTIONS
  // ============================================================================
  subventions: any[]; // Type à définir selon les besoins
  subventionsLoading: boolean;
  subventionsError: string | null;

  // ============================================================================
  // CACHE ET METADATA
  // ============================================================================
  lastFetch: {
    budgets?: number;
    transactions?: number;
    subventions?: number;
    stats?: number;
  };
  filters: FinancialFilters | null;

  // ============================================================================
  // ACTIONS - BUDGETS
  // ============================================================================
  loadBudgets: (filters?: FinancialFilters) => Promise<void>;
  loadBudgetById: (budgetId: string) => Promise<void>;
  createBudget: (budgetData: any) => Promise<Budget>;
  updateBudget: (budgetId: string, updates: Partial<Budget>) => Promise<Budget>;
  deleteBudget: (budgetId: string) => Promise<void>;
  validateBudget: (budgetId: string, action: 'approve' | 'reject', comment?: string) => Promise<void>;
  submitBudgetForValidation: (budgetId: string) => Promise<void>;
  loadBudgetStats: (filters?: FinancialFilters) => Promise<void>;

  // ============================================================================
  // ACTIONS - TRANSACTIONS
  // ============================================================================
  loadTransactions: (filters?: FinancialFilters) => Promise<void>;
  loadTransactionById: (transactionId: string) => Promise<void>;
  createTransaction: (transactionData: any) => Promise<Transaction>;
  validateTransaction: (transactionId: string, action: 'approve' | 'reject', comment?: string) => Promise<void>;

  // ============================================================================
  // ACTIONS - SUBVENTIONS
  // ============================================================================
  loadSubventions: (filters?: FinancialFilters) => Promise<void>;
  createSubvention: (subventionData: any) => Promise<any>;
  validateSubvention: (subventionId: string, action: 'approve' | 'reject', comment?: string) => Promise<void>;

  // ============================================================================
  // ACTIONS - UTILITAIRES
  // ============================================================================
  setFilters: (filters: FinancialFilters) => void;
  clearFilters: () => void;
  selectBudget: (budget: Budget | null) => void;
  selectTransaction: (transaction: Transaction | null) => void;
  clearErrors: () => void;
  invalidateCache: (entity?: 'budgets' | 'transactions' | 'subventions' | 'all') => void;
  refreshAll: () => Promise<void>;
}

// ================================================================================================
// STORE IMPLEMENTATION
// ================================================================================================

export const useFinancial = create<FinancialState>()(
  persist(
    (set, get) => ({
      // État initial
      budgets: [],
      selectedBudget: null,
      budgetStats: null,
      budgetsLoading: false,
      budgetsError: null,

      transactions: [],
      selectedTransaction: null,
      transactionsLoading: false,
      transactionsError: null,

      subventions: [],
      subventionsLoading: false,
      subventionsError: null,

      lastFetch: {},
      filters: null,

      // ============================================================================
      // ACTIONS - BUDGETS
      // ============================================================================

      loadBudgets: async (filters?: FinancialFilters) => {
        set({ budgetsLoading: true, budgetsError: null });

        try {
          const result = await financialService.getBudgets(filters);

          // Handle both return types (array or paginated response)
          const budgets = Array.isArray(result) ? result : result.budgets;

          set({
            budgets,
            budgetsLoading: false,
            lastFetch: { ...get().lastFetch, budgets: Date.now() },
            filters: filters || null
          });
        } catch (error: any) {
          set({
            budgetsError: error.message || 'Erreur lors du chargement des budgets',
            budgetsLoading: false
          });
        }
      },

      loadBudgetById: async (budgetId: string) => {
        set({ budgetsLoading: true, budgetsError: null });

        try {
          const budget = await financialService.getBudgetById(budgetId);
          set({
            selectedBudget: budget,
            budgetsLoading: false
          });
        } catch (error: any) {
          set({
            budgetsError: error.message || 'Erreur lors du chargement du budget',
            budgetsLoading: false
          });
        }
      },

      createBudget: async (budgetData: any) => {
        set({ budgetsLoading: true, budgetsError: null });

        try {
          const newBudget = await financialService.createBudget(budgetData);

          set((state) => ({
            budgets: [newBudget, ...state.budgets],
            budgetsLoading: false
          }));

          // Invalider le cache
          get().invalidateCache('budgets');

          return newBudget;
        } catch (error: any) {
          set({
            budgetsError: error.message || 'Erreur lors de la création du budget',
            budgetsLoading: false
          });
          throw error;
        }
      },

      updateBudget: async (budgetId: string, updates: Partial<Budget>) => {
        set({ budgetsLoading: true, budgetsError: null });

        try {
          const updatedBudget = await financialService.updateBudget(budgetId, updates);

          set((state) => ({
            budgets: state.budgets.map((b) => (b.id === budgetId ? updatedBudget : b)),
            selectedBudget: state.selectedBudget?.id === budgetId ? updatedBudget : state.selectedBudget,
            budgetsLoading: false
          }));

          return updatedBudget;
        } catch (error: any) {
          set({
            budgetsError: error.message || 'Erreur lors de la mise à jour du budget',
            budgetsLoading: false
          });
          throw error;
        }
      },

      deleteBudget: async (budgetId: string) => {
        set({ budgetsLoading: true, budgetsError: null });

        try {
          await financialService.deleteBudget(budgetId);

          set((state) => ({
            budgets: state.budgets.filter((b) => b.id !== budgetId),
            selectedBudget: state.selectedBudget?.id === budgetId ? null : state.selectedBudget,
            budgetsLoading: false
          }));

          get().invalidateCache('budgets');
        } catch (error: any) {
          set({
            budgetsError: error.message || 'Erreur lors de la suppression du budget',
            budgetsLoading: false
          });
          throw error;
        }
      },

      validateBudget: async (budgetId: string, action: 'approve' | 'reject', comment?: string) => {
        set({ budgetsLoading: true, budgetsError: null });

        try {
          const updatedBudget = await financialService.validateBudget(budgetId, action, comment);

          set((state) => ({
            budgets: state.budgets.map((b) => (b.id === budgetId ? updatedBudget : b)),
            selectedBudget: state.selectedBudget?.id === budgetId ? updatedBudget : state.selectedBudget,
            budgetsLoading: false
          }));
        } catch (error: any) {
          set({
            budgetsError: error.message || 'Erreur lors de la validation du budget',
            budgetsLoading: false
          });
          throw error;
        }
      },

      submitBudgetForValidation: async (budgetId: string) => {
        set({ budgetsLoading: true, budgetsError: null });

        try {
          const updatedBudget = await financialService.submitBudgetForValidation(budgetId);

          set((state) => ({
            budgets: state.budgets.map((b) => (b.id === budgetId ? updatedBudget : b)),
            selectedBudget: state.selectedBudget?.id === budgetId ? updatedBudget : state.selectedBudget,
            budgetsLoading: false
          }));
        } catch (error: any) {
          set({
            budgetsError: error.message || 'Erreur lors de la soumission du budget',
            budgetsLoading: false
          });
          throw error;
        }
      },

      loadBudgetStats: async (filters?: FinancialFilters) => {
        try {
          const stats = await financialService.getFinancialStats(filters);

          set({
            budgetStats: stats,
            lastFetch: { ...get().lastFetch, stats: Date.now() }
          });
        } catch (error: any) {
          console.error('Erreur lors du chargement des statistiques:', error);
        }
      },

      // ============================================================================
      // ACTIONS - TRANSACTIONS
      // ============================================================================

      loadTransactions: async (filters?: FinancialFilters) => {
        set({ transactionsLoading: true, transactionsError: null });

        try {
          const transactions = await financialService.getTransactions(filters);

          set({
            transactions,
            transactionsLoading: false,
            lastFetch: { ...get().lastFetch, transactions: Date.now() }
          });
        } catch (error: any) {
          set({
            transactionsError: error.message || 'Erreur lors du chargement des transactions',
            transactionsLoading: false
          });
        }
      },

      loadTransactionById: async (transactionId: string) => {
        set({ transactionsLoading: true, transactionsError: null });

        try {
          const transaction = await financialService.getTransactionById(transactionId);
          set({
            selectedTransaction: transaction,
            transactionsLoading: false
          });
        } catch (error: any) {
          set({
            transactionsError: error.message || 'Erreur lors du chargement de la transaction',
            transactionsLoading: false
          });
        }
      },

      createTransaction: async (transactionData: any) => {
        set({ transactionsLoading: true, transactionsError: null });

        try {
          const newTransaction = await financialService.createTransaction(transactionData);

          set((state) => ({
            transactions: [newTransaction, ...state.transactions],
            transactionsLoading: false
          }));

          get().invalidateCache('transactions');

          return newTransaction;
        } catch (error: any) {
          set({
            transactionsError: error.message || 'Erreur lors de la création de la transaction',
            transactionsLoading: false
          });
          throw error;
        }
      },

      validateTransaction: async (transactionId: string, action: 'approve' | 'reject', comment?: string) => {
        set({ transactionsLoading: true, transactionsError: null });

        try {
          const updatedTransaction = await financialService.validateTransaction(transactionId, action, comment);

          set((state) => ({
            transactions: state.transactions.map((t) => (t.id === transactionId ? updatedTransaction : t)),
            selectedTransaction: state.selectedTransaction?.id === transactionId ? updatedTransaction : state.selectedTransaction,
            transactionsLoading: false
          }));
        } catch (error: any) {
          set({
            transactionsError: error.message || 'Erreur lors de la validation de la transaction',
            transactionsLoading: false
          });
          throw error;
        }
      },

      // ============================================================================
      // ACTIONS - SUBVENTIONS
      // ============================================================================

      loadSubventions: async (filters?: FinancialFilters) => {
        set({ subventionsLoading: true, subventionsError: null });

        try {
          const subventions = await financialService.getSubventions(filters);

          set({
            subventions,
            subventionsLoading: false,
            lastFetch: { ...get().lastFetch, subventions: Date.now() }
          });
        } catch (error: any) {
          set({
            subventionsError: error.message || 'Erreur lors du chargement des subventions',
            subventionsLoading: false
          });
        }
      },

      createSubvention: async (subventionData: any) => {
        set({ subventionsLoading: true, subventionsError: null });

        try {
          const newSubvention = await financialService.createSubvention(subventionData);

          set((state) => ({
            subventions: [newSubvention, ...state.subventions],
            subventionsLoading: false
          }));

          get().invalidateCache('subventions');

          return newSubvention;
        } catch (error: any) {
          set({
            subventionsError: error.message || 'Erreur lors de la création de la subvention',
            subventionsLoading: false
          });
          throw error;
        }
      },

      validateSubvention: async (subventionId: string, action: 'approve' | 'reject', comment?: string) => {
        set({ subventionsLoading: true, subventionsError: null });

        try {
          const updatedSubvention = await financialService.validateSubvention(subventionId, action, comment);

          set((state) => ({
            subventions: state.subventions.map((s) => (s.id === subventionId ? updatedSubvention : s)),
            subventionsLoading: false
          }));
        } catch (error: any) {
          set({
            subventionsError: error.message || 'Erreur lors de la validation de la subvention',
            subventionsLoading: false
          });
          throw error;
        }
      },

      // ============================================================================
      // ACTIONS - UTILITAIRES
      // ============================================================================

      setFilters: (filters: FinancialFilters) => {
        set({ filters });
      },

      clearFilters: () => {
        set({ filters: null });
      },

      selectBudget: (budget: Budget | null) => {
        set({ selectedBudget: budget });
      },

      selectTransaction: (transaction: Transaction | null) => {
        set({ selectedTransaction: transaction });
      },

      clearErrors: () => {
        set({
          budgetsError: null,
          transactionsError: null,
          subventionsError: null
        });
      },

      invalidateCache: (entity?: 'budgets' | 'transactions' | 'subventions' | 'all') => {
        if (entity === 'all' || !entity) {
          set({ lastFetch: {} });
        } else {
          set((state) => ({
            lastFetch: { ...state.lastFetch, [entity]: undefined }
          }));
        }
      },

      refreshAll: async () => {
        const { filters } = get();
        await Promise.all([
          get().loadBudgets(filters || undefined),
          get().loadTransactions(filters || undefined),
          get().loadSubventions(filters || undefined),
          get().loadBudgetStats(filters || undefined)
        ]);
      }
    }),
    {
      name: 'financial-storage',
      partialize: (state) => ({
        // Ne persister que les filtres et les sélections
        filters: state.filters,
        selectedBudget: state.selectedBudget,
        selectedTransaction: state.selectedTransaction
      })
    }
  )
);

// ================================================================================================
// HOOKS UTILITAIRES
// ================================================================================================

/**
 * Hook pour obtenir les budgets avec chargement automatique
 */
export const useBudgets = (autoLoad = true, filters?: FinancialFilters) => {
  const budgets = useFinancial((state) => state.budgets);
  const loading = useFinancial((state) => state.budgetsLoading);
  const error = useFinancial((state) => state.budgetsError);
  const loadBudgets = useFinancial((state) => state.loadBudgets);

  React.useEffect(() => {
    if (autoLoad) {
      loadBudgets(filters);
    }
  }, [autoLoad, filters]);

  return { budgets, loading, error, reload: () => loadBudgets(filters) };
};

/**
 * Hook pour obtenir les transactions avec chargement automatique
 */
export const useTransactions = (autoLoad = true, filters?: FinancialFilters) => {
  const transactions = useFinancial((state) => state.transactions);
  const loading = useFinancial((state) => state.transactionsLoading);
  const error = useFinancial((state) => state.transactionsError);
  const loadTransactions = useFinancial((state) => state.loadTransactions);

  React.useEffect(() => {
    if (autoLoad) {
      loadTransactions(filters);
    }
  }, [autoLoad, filters]);

  return { transactions, loading, error, reload: () => loadTransactions(filters) };
};

/**
 * Hook pour obtenir les statistiques financières
 */
export const useFinancialStats = (autoLoad = true, filters?: FinancialFilters) => {
  const stats = useFinancial((state) => state.budgetStats);
  const loadStats = useFinancial((state) => state.loadBudgetStats);

  React.useEffect(() => {
    if (autoLoad) {
      loadStats(filters);
    }
  }, [autoLoad, filters]);

  return { stats, reload: () => loadStats(filters) };
};

// ================================================================================================
// EXPORTS
// ================================================================================================

export default useFinancial;

// Import React pour les hooks
import React from 'react';
