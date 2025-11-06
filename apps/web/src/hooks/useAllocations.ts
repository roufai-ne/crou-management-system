/**
 * FICHIER: apps/web/src/hooks/useAllocations.ts
 * HOOKS: Hooks React Query pour le module allocations
 *
 * DESCRIPTION:
 * Hooks personnalisés pour la gestion des allocations budgétaires et stocks
 * Intégration React Query avec support hiérarchie à 3 niveaux
 * Gestion allocations cascadées, flux budgétaire et statistiques
 *
 * HOOKS DISPONIBLES:
 * - useAllocations: Gestion allocations (budget + stock)
 * - useBudgetAllocations: Allocations budgétaires uniquement
 * - useStockAllocations: Allocations de stock uniquement
 * - useAllocationValidation: Validation et exécution des allocations
 * - useHierarchyAllocations: Allocations par niveau hiérarchique
 * - useCascadingAllocation: Création d'allocations cascadées
 * - useBudgetFlowData: Flux budgétaire
 * - useAllocationStats: Statistiques d'allocations
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 * VERSION: 2.0 (Support hiérarchie 3 niveaux)
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/stores/auth';
import allocationService, {
  type Allocation,
  type BudgetAllocation,
  type StockAllocation,
  type AllocationSummary,
  type AllocationFilters,
  type CreateBudgetAllocationRequest,
  type CreateStockAllocationRequest,
  type HierarchyLevel,
  type AllocationStatus
} from '@/services/api/allocationService';
import toast from 'react-hot-toast';

// ================================================================================================
// TYPES POUR LES HOOKS
// ================================================================================================

interface UseAllocationOptions {
  enabled?: boolean;
  refetchInterval?: number;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

interface UseAllocationsReturn {
  allocations: Allocation[] | undefined;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
  totalAllocated: number;
  totalExecuted: number;
  executionRate: number;
  pendingCount: number;
}

interface UseBudgetAllocationsReturn extends UseAllocationsReturn {
  budgetAllocations: BudgetAllocation[] | undefined;
  createBudgetAllocation: (data: CreateBudgetAllocationRequest) => Promise<BudgetAllocation>;
  isCreating: boolean;
}

interface UseStockAllocationsReturn extends UseAllocationsReturn {
  stockAllocations: StockAllocation[] | undefined;
  createStockAllocation: (data: CreateStockAllocationRequest) => Promise<StockAllocation>;
  isCreating: boolean;
}

interface UseAllocationValidationReturn {
  pendingAllocations: Allocation[];
  approveAllocation: (id: string, reason?: string) => Promise<void>;
  rejectAllocation: (id: string, reason: string) => Promise<void>;
  executeAllocation: (id: string) => Promise<void>;
  cancelAllocation: (id: string, reason: string) => Promise<void>;
  isValidating: boolean;
  isExecuting: boolean;
}

interface UseHierarchyAllocationsReturn {
  allocations: Allocation[] | undefined;
  loading: boolean;
  selectedLevel?: HierarchyLevel;
  setSelectedLevel: (level?: HierarchyLevel) => void;
  tenantHierarchy: any;
  loadTenantHierarchy: () => Promise<void>;
}

// ================================================================================================
// HOOK PRINCIPAL - ALLOCATIONS (BUDGET + STOCK)
// ================================================================================================

export const useAllocations = (
  filters?: AllocationFilters,
  options?: UseAllocationOptions
): UseAllocationsReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['allocations', 'all', user?.id, filters];

  // Query principale pour récupérer les allocations
  const allocationsQuery = useQuery(
    queryKey,
    () => allocationService.getAllocationHistory(filters),
    {
      enabled: !!user && (options?.enabled !== false),
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchInterval: options?.refetchInterval,
      onSuccess: options?.onSuccess,
      onError: (error: Error) => {
        console.error('Erreur chargement allocations:', error);
        toast.error('Erreur lors du chargement des allocations');
        options?.onError?.(error);
      }
    }
  );

  // Calculs statistiques
  const allocationStats = useMemo(() => {
    if (!allocationsQuery.data) {
      return { totalAllocated: 0, totalExecuted: 0, executionRate: 0, pendingCount: 0 };
    }

    const budgetAllocations = allocationsQuery.data.filter(
      (a) => a.type === 'budget'
    ) as BudgetAllocation[];

    const totalAllocated = budgetAllocations.reduce((sum, a) => sum + a.montant, 0);
    const executedAllocations = budgetAllocations.filter(a => a.status === 'executed');
    const totalExecuted = executedAllocations.reduce((sum, a) => sum + a.montant, 0);
    const executionRate = totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0;
    const pendingCount = allocationsQuery.data.filter(
      a => a.status === 'pending' || a.status === 'submitted'
    ).length;

    return { totalAllocated, totalExecuted, executionRate, pendingCount };
  }, [allocationsQuery.data]);

  return {
    allocations: allocationsQuery.data,
    loading: allocationsQuery.isLoading,
    error: allocationsQuery.error as Error | null,
    refetch: allocationsQuery.refetch,
    ...allocationStats
  };
};

// ================================================================================================
// HOOK ALLOCATIONS BUDGÉTAIRES
// ================================================================================================

export const useBudgetAllocations = (
  filters?: AllocationFilters,
  options?: UseAllocationOptions
): UseBudgetAllocationsReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['allocations', 'budget', user?.id, filters];

  // Query pour allocations budgétaires uniquement
  const budgetAllocationsQuery = useQuery(
    queryKey,
    () => allocationService.getAllocationHistory({ ...filters, type: 'budget' }),
    {
      enabled: !!user && (options?.enabled !== false),
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error: Error) => {
        console.error('Erreur chargement allocations budgétaires:', error);
        toast.error('Erreur lors du chargement des allocations budgétaires');
      }
    }
  );

  // Mutation pour créer une allocation budgétaire
  const createBudgetAllocationMutation = useMutation(
    (data: CreateBudgetAllocationRequest) => allocationService.createBudgetAllocation(data),
    {
      onSuccess: (newAllocation) => {
        queryClient.invalidateQueries(['allocations']);
        toast.success(`Allocation budgétaire de ${newAllocation.montant.toLocaleString()} CFA créée`);
      },
      onError: (error: Error) => {
        console.error('Erreur création allocation budgétaire:', error);
        toast.error(error.message || 'Erreur lors de la création de l\'allocation budgétaire');
      }
    }
  );

  // Calculs statistiques
  const stats = useMemo(() => {
    if (!budgetAllocationsQuery.data) {
      return { totalAllocated: 0, totalExecuted: 0, executionRate: 0, pendingCount: 0 };
    }

    const budgetAllocations = budgetAllocationsQuery.data as BudgetAllocation[];
    const totalAllocated = budgetAllocations.reduce((sum, a) => sum + a.montant, 0);
    const executedAllocations = budgetAllocations.filter(a => a.status === 'executed');
    const totalExecuted = executedAllocations.reduce((sum, a) => sum + a.montant, 0);
    const executionRate = totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0;
    const pendingCount = budgetAllocations.filter(
      a => a.status === 'pending' || a.status === 'submitted'
    ).length;

    return { totalAllocated, totalExecuted, executionRate, pendingCount };
  }, [budgetAllocationsQuery.data]);

  return {
    budgetAllocations: budgetAllocationsQuery.data as BudgetAllocation[] | undefined,
    allocations: budgetAllocationsQuery.data,
    loading: budgetAllocationsQuery.isLoading,
    error: budgetAllocationsQuery.error as Error | null,
    refetch: budgetAllocationsQuery.refetch,
    createBudgetAllocation: createBudgetAllocationMutation.mutateAsync,
    isCreating: createBudgetAllocationMutation.isLoading,
    ...stats
  };
};

// ================================================================================================
// HOOK ALLOCATIONS DE STOCK
// ================================================================================================

export const useStockAllocations = (
  filters?: AllocationFilters,
  options?: UseAllocationOptions
): UseStockAllocationsReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = ['allocations', 'stock', user?.id, filters];

  // Query pour allocations de stock uniquement
  const stockAllocationsQuery = useQuery(
    queryKey,
    () => allocationService.getAllocationHistory({ ...filters, type: 'stock' }),
    {
      enabled: !!user && (options?.enabled !== false),
      staleTime: 2 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
      onError: (error: Error) => {
        console.error('Erreur chargement allocations stock:', error);
        toast.error('Erreur lors du chargement des allocations de stock');
      }
    }
  );

  // Mutation pour créer une allocation de stock
  const createStockAllocationMutation = useMutation(
    (data: CreateStockAllocationRequest) => allocationService.createStockAllocation(data),
    {
      onSuccess: (newAllocation) => {
        queryClient.invalidateQueries(['allocations']);
        toast.success(`Allocation de stock de ${newAllocation.quantity} unités créée`);
      },
      onError: (error: Error) => {
        console.error('Erreur création allocation stock:', error);
        toast.error(error.message || 'Erreur lors de la création de l\'allocation de stock');
      }
    }
  );

  // Calculs statistiques
  const stats = useMemo(() => {
    if (!stockAllocationsQuery.data) {
      return { totalAllocated: 0, totalExecuted: 0, executionRate: 0, pendingCount: 0 };
    }

    const stockAllocations = stockAllocationsQuery.data as StockAllocation[];
    const totalAllocated = stockAllocations.reduce((sum, a) => sum + a.quantity, 0);
    const executedAllocations = stockAllocations.filter(a => a.status === 'executed');
    const totalExecuted = executedAllocations.reduce((sum, a) => sum + a.quantity, 0);
    const executionRate = totalAllocated > 0 ? (totalExecuted / totalAllocated) * 100 : 0;
    const pendingCount = stockAllocations.filter(
      a => a.status === 'pending' || a.status === 'submitted'
    ).length;

    return { totalAllocated, totalExecuted, executionRate, pendingCount };
  }, [stockAllocationsQuery.data]);

  return {
    stockAllocations: stockAllocationsQuery.data as StockAllocation[] | undefined,
    allocations: stockAllocationsQuery.data,
    loading: stockAllocationsQuery.isLoading,
    error: stockAllocationsQuery.error as Error | null,
    refetch: stockAllocationsQuery.refetch,
    createStockAllocation: createStockAllocationMutation.mutateAsync,
    isCreating: createStockAllocationMutation.isLoading,
    ...stats
  };
};

// ================================================================================================
// HOOK VALIDATION DES ALLOCATIONS
// ================================================================================================

export const useAllocationValidation = (
  level?: HierarchyLevel,
  options?: UseAllocationOptions
): UseAllocationValidationReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Récupérer les allocations en attente de validation
  const pendingQuery = useQuery(
    ['allocations', 'pending', level, user?.id],
    () => allocationService.getPendingAllocations(level),
    {
      enabled: !!user && user.permissions.includes('allocation:validate'),
      staleTime: 1 * 60 * 1000 // 1 minute pour les validations
    }
  );

  // Mutation pour approuver une allocation
  const approveMutation = useMutation(
    ({ id, reason }: { id: string; reason?: string }) =>
      allocationService.validateAllocation(id, 'approve', reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['allocations']);
        toast.success('Allocation approuvée avec succès');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de l\'approbation');
      }
    }
  );

  // Mutation pour rejeter une allocation
  const rejectMutation = useMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      allocationService.validateAllocation(id, 'reject', reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['allocations']);
        toast.success('Allocation rejetée');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors du rejet');
      }
    }
  );

  // Mutation pour exécuter une allocation
  const executeMutation = useMutation(
    (id: string) => allocationService.executeAllocation(id),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['allocations']);
        toast.success('Allocation exécutée avec succès');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de l\'exécution');
      }
    }
  );

  // Mutation pour annuler une allocation
  const cancelMutation = useMutation(
    ({ id, reason }: { id: string; reason: string }) =>
      allocationService.cancelAllocation(id, reason),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['allocations']);
        toast.success('Allocation annulée');
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Erreur lors de l\'annulation');
      }
    }
  );

  return {
    pendingAllocations: pendingQuery.data || [],
    approveAllocation: useCallback(
      (id: string, reason?: string) => approveMutation.mutateAsync({ id, reason }),
      [approveMutation]
    ),
    rejectAllocation: useCallback(
      (id: string, reason: string) => rejectMutation.mutateAsync({ id, reason }),
      [rejectMutation]
    ),
    executeAllocation: useCallback(
      (id: string) => executeMutation.mutateAsync(id),
      [executeMutation]
    ),
    cancelAllocation: useCallback(
      (id: string, reason: string) => cancelMutation.mutateAsync({ id, reason }),
      [cancelMutation]
    ),
    isValidating: approveMutation.isLoading || rejectMutation.isLoading,
    isExecuting: executeMutation.isLoading || cancelMutation.isLoading
  };
};

// ================================================================================================
// HOOK ALLOCATIONS PAR HIÉRARCHIE (NOUVEAU)
// ================================================================================================

export const useHierarchyAllocations = (
  initialLevel?: HierarchyLevel,
  filters?: AllocationFilters
): UseHierarchyAllocationsReturn => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedLevel, setSelectedLevel] = useState<HierarchyLevel | undefined>(initialLevel);

  const queryKey = ['allocations', 'hierarchy', selectedLevel, user?.id, filters];

  // Query pour allocations par niveau hiérarchique
  const allocationsQuery = useQuery(
    queryKey,
    () => {
      if (selectedLevel) {
        return allocationService.getAllocationsByLevel(selectedLevel, filters);
      }
      return allocationService.getAllocationHistory(filters);
    },
    {
      enabled: !!user,
      staleTime: 2 * 60 * 1000
    }
  );

  // Query pour la hiérarchie des tenants
  const hierarchyQuery = useQuery(
    ['allocations', 'tenantHierarchy', user?.id],
    () => allocationService.getTenantHierarchy(),
    {
      enabled: !!user,
      staleTime: 10 * 60 * 1000 // 10 minutes pour la hiérarchie
    }
  );

  const handleSetSelectedLevel = useCallback((level?: HierarchyLevel) => {
    setSelectedLevel(level);
    queryClient.invalidateQueries(['allocations', 'hierarchy']);
  }, [queryClient]);

  return {
    allocations: allocationsQuery.data,
    loading: allocationsQuery.isLoading || hierarchyQuery.isLoading,
    selectedLevel,
    setSelectedLevel: handleSetSelectedLevel,
    tenantHierarchy: hierarchyQuery.data,
    loadTenantHierarchy: hierarchyQuery.refetch
  };
};

// ================================================================================================
// HOOK ALLOCATIONS CASCADÉES (NOUVEAU)
// ================================================================================================

export const useCascadingAllocation = () => {
  const queryClient = useQueryClient();
  const [isCascading, setIsCascading] = useState(false);

  const createCascadingMutation = useMutation(
    (request: {
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
      setIsCascading(true);
      return allocationService.createCascadingAllocation(request);
    },
    {
      onSuccess: (result) => {
        queryClient.invalidateQueries(['allocations']);
        toast.success(
          `Allocation cascadée créée: 1 parent + ${result.children.length} enfants`
        );
        setIsCascading(false);
      },
      onError: (error: Error) => {
        console.error('Erreur création allocation cascadée:', error);
        toast.error(error.message || 'Erreur lors de la création de l\'allocation cascadée');
        setIsCascading(false);
      }
    }
  );

  return {
    createCascadingAllocation: createCascadingMutation.mutateAsync,
    isCascading: isCascading || createCascadingMutation.isLoading
  };
};

// ================================================================================================
// HOOK FLUX BUDGÉTAIRE (NOUVEAU)
// ================================================================================================

export const useBudgetFlowData = (budgetId: string, exercice?: number) => {
  const { user } = useAuth();

  const budgetFlowQuery = useQuery(
    ['allocations', 'budgetFlow', budgetId, exercice],
    () => allocationService.getBudgetFlow(budgetId, exercice),
    {
      enabled: !!user && !!budgetId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  return {
    budgetFlow: budgetFlowQuery.data,
    loading: budgetFlowQuery.isLoading,
    error: budgetFlowQuery.error,
    refetch: budgetFlowQuery.refetch
  };
};

// ================================================================================================
// HOOK STATISTIQUES D'ALLOCATIONS (NOUVEAU)
// ================================================================================================

export const useAllocationStats = (
  filters?: {
    exercice?: number;
    level?: HierarchyLevel;
    tenantId?: string;
  }
) => {
  const { user } = useAuth();

  const statsQuery = useQuery(
    ['allocations', 'statistics', user?.id, filters],
    () => allocationService.getAllocationStatistics(filters),
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  return {
    statistics: statsQuery.data,
    loading: statsQuery.isLoading,
    error: statsQuery.error,
    refetch: statsQuery.refetch
  };
};

// ================================================================================================
// HOOK RÉSUMÉ DES ALLOCATIONS
// ================================================================================================

export const useAllocationSummary = (tenantId?: string, exercice?: number) => {
  const { user } = useAuth();

  const summaryQuery = useQuery(
    ['allocations', 'summary', tenantId || user?.crouId, exercice],
    () => allocationService.getAllocationSummary(tenantId, exercice),
    {
      enabled: !!user,
      staleTime: 5 * 60 * 1000
    }
  );

  return {
    summary: summaryQuery.data,
    loading: summaryQuery.isLoading,
    error: summaryQuery.error,
    refetch: summaryQuery.refetch
  };
};

// ================================================================================================
// HOOK ARBRE D'ALLOCATIONS (NOUVEAU)
// ================================================================================================

export const useAllocationTree = (rootAllocationId?: string) => {
  const { user } = useAuth();

  const treeQuery = useQuery(
    ['allocations', 'tree', rootAllocationId],
    () => {
      if (!rootAllocationId) return null;
      return allocationService.getAllocationTree(rootAllocationId);
    },
    {
      enabled: !!user && !!rootAllocationId,
      staleTime: 5 * 60 * 1000
    }
  );

  return {
    allocationTree: treeQuery.data,
    loading: treeQuery.isLoading,
    error: treeQuery.error,
    refetch: treeQuery.refetch
  };
};

// ================================================================================================
// HOOK UTILITAIRE - PERMISSIONS ALLOCATIONS
// ================================================================================================

export const useAllocationPermissions = () => {
  const { user } = useAuth();

  const permissions = useMemo(() => {
    if (!user) {
      return {
        canRead: false,
        canCreate: false,
        canValidate: false,
        canExecute: false,
        maxAmount: 0
      };
    }

    return {
      canRead: user.permissions.includes('allocation:read') || user.permissions.includes('all'),
      canCreate: user.permissions.includes('allocation:create') || user.permissions.includes('all'),
      canValidate: user.permissions.includes('allocation:validate') || user.permissions.includes('all'),
      canExecute: user.permissions.includes('allocation:execute') || user.permissions.includes('all'),
      maxAmount:
        user.role === 'ministre' ? Number.MAX_SAFE_INTEGER :
        user.role === 'directeur_regional' ? 100000000 :
        user.role === 'directeur' ? 50000000 :
        user.role === 'chef_financier' ? 10000000 : 0
    };
  }, [user]);

  const canApproveAmount = useCallback(
    (amount: number) => {
      return amount <= permissions.maxAmount;
    },
    [permissions.maxAmount]
  );

  return {
    ...permissions,
    canApproveAmount
  };
};
