/**
 * FICHIER: apps/web/src/hooks/useFinancial.ts
 * HOOKS: Hooks React Query pour le module financier
 *
 * DESCRIPTION:
 * Hooks personnalisés pour la gestion des données financières
 * Intégration React Query avec cache intelligent
 * Gestion workflows de validation et mutations
 *
 * HOOKS DISPONIBLES:
 * - useBudgets: Gestion budgets et exécution
 * - useSubventions: Demandes et suivi subventions
 * - useValidationWorkflow: Workflows validation
 * - useFinancialTransactions: Transactions et engagements
 * - useFinancialReports: Génération rapports
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useAuth } from '@/stores/auth';
import {
  financialService,
  Budget,
  Subvention,
  FinancialTransaction,
  FinancialReport,
  FinancialFilters,
  ValidationStep,
  FinancialUtils
} from '@/services/financialService';
import toast from 'react-hot-toast';

// ================================================================================================
// TYPES POUR LES HOOKS
// ================================================================================================

interface UseFinancialOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseBudgetsReturn {
  budgets: Budget[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  totalBudget: number;
  totalRealized: number;
  executionRate: number;
  createBudget: (budget: Partial<Budget>) => Promise<Budget>;
  updateBudget: (id: string, updates: Partial<Budget>) => Promise<Budget>;
  submitForApproval: (id: string, comment?: string) => Promise<Budget>;
  isCreating: boolean;
  isUpdating: boolean;
}

interface UseValidationReturn {
  pendingBudgets: Budget[];
  pendingSubventions: Subvention[];
  approveBudget: (id: string, comment?: string) => Promise<void>;
  rejectBudget: (id: string, comment: string) => Promise<void>;
  approveSubvention: (id: string, montant?: number, comment?: string) => Promise<void>;
  rejectSubvention: (id: string, comment: string) => Promise<void>;
  isApproving: boolean;
  isRejecting: boolean;
  validationHistory: ValidationStep[];
}

// ================================================================================================
// HOOK PRINCIPAL - BUDGETS
// ================================================================================================

export const useBudgets = (
  filters?: FinancialFilters,
  options?: UseFinancialOptions
): UseBudgetsReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['financial', 'budgets', user?.id, filters];

  // Query principale pour récupérer les budgets
  const budgetsQuery = useQuery(
    queryKey,
    () => {
      if (!user) throw new Error('Utilisateur non connecté');
      return financialService.getBudgets(user, filters);
    },
    {
      enabled: !!user && (options?.enabled !== false),
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: options?.refetchInterval,
      onSuccess: options?.onSuccess,
      onError: (error: Error) => {
        console.error('Erreur chargement budgets:', error);
        toast.error('Erreur lors du chargement des budgets');
        options?.onError?.(error);
      }
    }
  );

  // Calculs dérivés
  const financialSummary = useMemo(() => {
    if (!budgetsQuery.data) return { totalBudget: 0, totalRealized: 0, executionRate: 0 };

    const totalBudget = budgetsQuery.data.reduce((sum, budget) => sum + budget.montantInitial, 0);
    const totalRealized = budgetsQuery.data.reduce((sum, budget) => sum + budget.montantRealise, 0);
    const executionRate = FinancialUtils.calculateExecutionRate(totalRealized, totalBudget);

    return { totalBudget, totalRealized, executionRate };
  }, [budgetsQuery.data]);

  // Mutation pour créer un budget
  const createBudgetMutation = useMutation(
    (budget: Partial<Budget>) => financialService.createBudget(budget),
    {
      onSuccess: (newBudget) => {
        queryClient.invalidateQueries(['financial', 'budgets']);
        toast.success(`Budget "${newBudget.libelle}" créé avec succès`);
      },
      onError: (error: Error) => {
        console.error('Erreur création budget:', error);
        toast.error(error.message || 'Erreur lors de la création du budget');
      }
    }
  );

  // Mutation pour mettre à jour un budget
  const updateBudgetMutation = useMutation(
    ({ id, updates }: { id: string; updates: Partial<Budget> }) =>
      financialService.updateBudget(id, updates),
    {
      onSuccess: (updatedBudget) => {
        queryClient.invalidateQueries(['financial', 'budgets']);
        toast.success(`Budget "${updatedBudget.libelle}" mis à jour`);
      },
      onError: (error: Error) => {
        console.error('Erreur mise à jour budget:', error);
        toast.error(error.message || 'Erreur lors de la mise à jour du budget');
      }
    }
  );

  // Mutation pour soumettre un budget pour approbation
  const submitForApprovalMutation = useMutation(
    ({ id, comment }: { id: string; comment?: string }) =>
      financialService.submitBudgetForApproval(id, comment),
    {
      onSuccess: (submittedBudget) => {
        queryClient.invalidateQueries(['financial', 'budgets']);
        queryClient.invalidateQueries(['financial', 'validation']);
        toast.success(`Budget "${submittedBudget.libelle}" soumis pour approbation`);
      },
      onError: (error: Error) => {
        console.error('Erreur soumission budget:', error);
        toast.error(error.message || 'Erreur lors de la soumission du budget');
      }
    }
  );

  return {
    budgets: budgetsQuery.data,
    loading: budgetsQuery.isLoading,
    error: budgetsQuery.error as Error | null,
    refetch: budgetsQuery.refetch,
    ...financialSummary,
    createBudget: createBudgetMutation.mutateAsync,
    updateBudget: useCallback(
      (id: string, updates: Partial<Budget>) =>
        updateBudgetMutation.mutateAsync({ id, updates }),
      [updateBudgetMutation]
    ),
    submitForApproval: useCallback(
      (id: string, comment?: string) =>
        submitForApprovalMutation.mutateAsync({ id, comment }),
      [submitForApprovalMutation]
    ),
    isCreating: createBudgetMutation.isLoading,
    isUpdating: updateBudgetMutation.isLoading
  };
};

// ================================================================================================
// HOOK SUBVENTIONS
// ================================================================================================

export const useSubventions = (
  filters?: FinancialFilters,
  options?: UseFinancialOptions
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['financial', 'subventions', user?.id, filters];

  const subventionsQuery = useQuery(
    queryKey,
    () => {
      if (!user) throw new Error('Utilisateur non connecté');
      return financialService.getSubventions(user, filters);
    },
    {
      enabled: !!user && (options?.enabled !== false),
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error: Error) => {
        console.error('Erreur chargement subventions:', error);
        toast.error('Erreur lors du chargement des subventions');
      }
    }
  );

  const createSubventionMutation = useMutation(
    (subvention: Partial<Subvention>) => financialService.createSubvention(subvention),
    {
      onSuccess: (newSubvention) => {
        queryClient.invalidateQueries(['financial', 'subventions']);
        toast.success(`Demande de subvention "${newSubvention.libelle}" créée`);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de la création de la subvention');
      }
    }
  );

  const submitSubventionMutation = useMutation(
    ({ id, documents, comment }: { id: string; documents: string[]; comment?: string }) =>
      financialService.submitSubventionForApproval(id, documents, comment),
    {
      onSuccess: (subvention) => {
        queryClient.invalidateQueries(['financial', 'subventions']);
        queryClient.invalidateQueries(['financial', 'validation']);
        toast.success(`Subvention "${subvention.libelle}" soumise pour approbation`);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de la soumission de la subvention');
      }
    }
  );

  // Calculs statistiques
  const subventionStats = useMemo(() => {
    if (!subventionsQuery.data) return null;

    const total = subventionsQuery.data.length;
    const approved = subventionsQuery.data.filter(s => s.statut === 'approved').length;
    const pending = subventionsQuery.data.filter(s => s.statut === 'submitted').length;
    const totalDemande = subventionsQuery.data.reduce((sum, s) => sum + s.montantDemande, 0);
    const totalAccorde = subventionsQuery.data.reduce((sum, s) => sum + s.montantAccorde, 0);

    return { total, approved, pending, totalDemande, totalAccorde };
  }, [subventionsQuery.data]);

  return {
    subventions: subventionsQuery.data,
    loading: subventionsQuery.isLoading,
    error: subventionsQuery.error,
    stats: subventionStats,
    createSubvention: createSubventionMutation.mutateAsync,
    submitSubvention: useCallback(
      (id: string, documents: string[], comment?: string) =>
        submitSubventionMutation.mutateAsync({ id, documents, comment }),
      [submitSubventionMutation]
    ),
    isCreating: createSubventionMutation.isLoading,
    isSubmitting: submitSubventionMutation.isLoading,
    refetch: subventionsQuery.refetch
  };
};

// ================================================================================================
// HOOK VALIDATION WORKFLOW
// ================================================================================================

export const useValidationWorkflow = (
  options?: UseFinancialOptions
): UseValidationReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les budgets en attente de validation
  const pendingBudgetsQuery = useQuery(
    ['financial', 'budgets', 'pending', user?.id],
    () => {
      if (!user) throw new Error('Utilisateur non connecté');
      return financialService.getBudgets(user, { statuts: ['submitted'] });
    },
    {
      enabled: !!user && user.permissions.includes('financial:validate'),
      staleTime: 1 * 60 * 1000 // 1 minute pour les validations
    }
  );

  // Récupérer les subventions en attente
  const pendingSubventionsQuery = useQuery(
    ['financial', 'subventions', 'pending', user?.id],
    () => {
      if (!user) throw new Error('Utilisateur non connecté');
      return financialService.getSubventions(user, { statuts: ['submitted', 'reviewed'] });
    },
    {
      enabled: !!user && user.permissions.includes('financial:validate'),
      staleTime: 1 * 60 * 1000
    }
  );

  // Mutation pour approuver un budget
  const approveBudgetMutation = useMutation(
    ({ id, comment }: { id: string; comment?: string }) => {
      if (!user) throw new Error('Utilisateur non connecté');
      return financialService.approveBudget(id, user.id, comment);
    },
    {
      onSuccess: (budget) => {
        queryClient.invalidateQueries(['financial']);
        toast.success(`Budget "${budget.libelle}" approuvé`);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de l\'approbation');
      }
    }
  );

  // Mutation pour rejeter un budget
  const rejectBudgetMutation = useMutation(
    ({ id, comment }: { id: string; comment: string }) => {
      if (!user) throw new Error('Utilisateur non connecté');
      return financialService.rejectBudget(id, user.id, comment);
    },
    {
      onSuccess: (budget) => {
        queryClient.invalidateQueries(['financial']);
        toast.success(`Budget "${budget.libelle}" rejeté`);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors du rejet');
      }
    }
  );

  // Mutation pour approuver une subvention
  const approveSubventionMutation = useMutation(
    ({ id, montant, comment }: { id: string; montant?: number; comment?: string }) => {
      if (!user) throw new Error('Utilisateur non connecté');
      return financialService.approveSubvention(id, user.id, montant, comment);
    },
    {
      onSuccess: (subvention) => {
        queryClient.invalidateQueries(['financial']);
        toast.success(`Subvention "${subvention.libelle}" approuvée`);
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de l\'approbation de la subvention');
      }
    }
  );

  return {
    pendingBudgets: pendingBudgetsQuery.data || [],
    pendingSubventions: pendingSubventionsQuery.data || [],
    approveBudget: useCallback(
      (id: string, comment?: string) =>
        approveBudgetMutation.mutateAsync({ id, comment }),
      [approveBudgetMutation]
    ),
    rejectBudget: useCallback(
      (id: string, comment: string) =>
        rejectBudgetMutation.mutateAsync({ id, comment }),
      [rejectBudgetMutation]
    ),
    approveSubvention: useCallback(
      (id: string, montant?: number, comment?: string) =>
        approveSubventionMutation.mutateAsync({ id, montant, comment }),
      [approveSubventionMutation]
    ),
    rejectSubvention: useCallback(
      (id: string, comment: string) =>
        Promise.reject(new Error('Not implemented')),
      []
    ),
    isApproving: approveBudgetMutation.isLoading || approveSubventionMutation.isLoading,
    isRejecting: rejectBudgetMutation.isLoading,
    validationHistory: [] // TODO: Implémenter historique validation
  };
};

// ================================================================================================
// HOOK TRANSACTIONS
// ================================================================================================

export const useFinancialTransactions = (
  budgetId: string,
  filters?: FinancialFilters
) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery(
    ['financial', 'transactions', budgetId, filters],
    () => financialService.getTransactions(budgetId, filters),
    {
      enabled: !!budgetId,
      staleTime: 1 * 60 * 1000 // 1 minute pour les transactions
    }
  );

  const createTransactionMutation = useMutation(
    (transaction: Partial<FinancialTransaction>) =>
      financialService.createTransaction(transaction),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['financial', 'transactions']);
        queryClient.invalidateQueries(['financial', 'budgets']); // Invalider budgets aussi
        toast.success('Transaction créée avec succès');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de la création de la transaction');
      }
    }
  );

  return {
    transactions: transactionsQuery.data,
    loading: transactionsQuery.isLoading,
    error: transactionsQuery.error,
    createTransaction: createTransactionMutation.mutateAsync,
    isCreating: createTransactionMutation.isLoading,
    refetch: transactionsQuery.refetch
  };
};

// ================================================================================================
// HOOK RAPPORTS
// ================================================================================================

export const useFinancialReports = () => {
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);

  const generateReport = useCallback(async (
    type: FinancialReport['type'],
    periode: { debut: Date; fin: Date },
    crouIds: string[] = [],
    filters?: FinancialFilters
  ): Promise<FinancialReport> => {
    try {
      setGeneratingReport(type);
      const report = await financialService.generateFinancialReport(type, periode, crouIds, filters);
      toast.success('Rapport généré avec succès');
      return report;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la génération du rapport');
      throw error;
    } finally {
      setGeneratingReport(null);
    }
  }, []);

  const exportReport = useCallback(async (
    reportId: string,
    format: 'excel' | 'pdf'
  ): Promise<string> => {
    try {
      const url = await financialService.exportReport(reportId, format);
      toast.success(`Rapport exporté en ${format.toUpperCase()}`);
      return url;
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'export du rapport');
      throw error;
    }
  }, []);

  return {
    generateReport,
    exportReport,
    isGenerating: !!generatingReport,
    generatingType: generatingReport
  };
};

// ================================================================================================
// HOOK FILTRES FINANCIERS
// ================================================================================================

export const useFinancialFilters = (initialFilters?: FinancialFilters) => {
  const [filters, setFilters] = useState<FinancialFilters>(
    initialFilters || {
      exercice: new Date().getFullYear(),
      dateDebut: new Date(new Date().getFullYear(), 0, 1),
      dateFin: new Date()
    }
  );

  const updateFilters = useCallback((updates: Partial<FinancialFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      exercice: new Date().getFullYear(),
      dateDebut: new Date(new Date().getFullYear(), 0, 1),
      dateFin: new Date()
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(
      filters.crouIds?.length ||
      filters.categories?.length ||
      filters.statuts?.length ||
      filters.montantMin ||
      filters.montantMax ||
      filters.trimestre
    );
  }, [filters]);

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters
  };
};

// ================================================================================================
// HOOK UTILITAIRE - PERMISSION FINANCIÈRE
// ================================================================================================

export const useFinancialPermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) return { canRead: false, canWrite: false, canValidate: false, canExport: false };

    return {
      canRead: user.permissions.includes('financial:read') || user.permissions.includes('all'),
      canWrite: user.permissions.includes('financial:write') || user.permissions.includes('all'),
      canValidate: user.permissions.includes('financial:validate') || user.permissions.includes('all'),
      canExport: user.permissions.includes('reports:export') || user.permissions.includes('all'),
      maxAmount: user.role === 'directeur_finances' ? Number.MAX_SAFE_INTEGER :
                 user.role === 'directeur' ? 50000000 :
                 user.role === 'chef_financier' ? 10000000 :
                 user.role === 'comptable' ? 1000000 : 0
    };
  }, [user]);

  const canApproveAmount = useCallback((amount: number) => {
    return amount <= permissions.maxAmount;
  }, [permissions.maxAmount]);

  return {
    ...permissions,
    canApproveAmount
  };
};
