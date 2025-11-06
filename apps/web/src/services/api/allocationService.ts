/**
 * FICHIER: apps/web/src/services/api/allocationService.ts
 * SERVICE: AllocationService - Gestion des allocations stratégiques
 *
 * DESCRIPTION:
 * Service pour gérer les allocations budgétaires et de stocks
 * avec hiérarchie à 3 niveaux (Ministère → Région → CROU)
 *
 * FONCTIONNALITÉS:
 * - Support hiérarchie à 3 niveaux (ministry → region → crou)
 * - Créer allocations budgétaires et stocks
 * - Flux budgétaires cascadés
 * - Consulter historique allocations
 * - Valider/rejeter allocations
 * - Exécuter allocations approuvées
 * - Annuler allocations
 * - Statistiques et résumés
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 * VERSION: 2.0 (Support hiérarchie 3 niveaux)
 */

import { apiClient } from './apiClient';

// ================================================================================================
// TYPES ET INTERFACES
// ================================================================================================

/**
 * Niveaux hiérarchiques du système
 */
export type HierarchyLevel = 'ministry' | 'region' | 'crou';

export type AllocationType = 'budget' | 'stock';

export type AllocationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'cancelled';

/**
 * Allocation budgétaire avec support hiérarchie à 3 niveaux
 */
export interface BudgetAllocation {
  id: string;

  // Hiérarchie (support 3 niveaux)
  level: HierarchyLevel; // Niveau de l'allocation
  sourceTenantId: string; // ID du tenant source (ministry, region ou crou)
  sourceTenantName?: string;
  sourceTenantLevel?: HierarchyLevel; // Niveau du source
  targetTenantId: string; // ID du tenant cible (region ou crou)
  targetTenantName?: string;
  targetTenantLevel?: HierarchyLevel; // Niveau de la cible

  // Relations hiérarchiques
  parentAllocationId?: string; // ID de l'allocation parent (si cascadée)
  childAllocations?: string[]; // IDs des allocations enfants
  hasChildren?: boolean; // A des allocations enfants
  depth?: number; // Profondeur dans l'arbre (0=root)

  // Budget
  budgetId?: string; // ID du budget source
  budgetName?: string;
  exercice: number; // Année fiscale
  montant: number;
  montantAlloue?: number; // Alias
  montantUtilise?: number; // Montant déjà utilisé
  montantDisponible?: number; // Montant encore disponible
  montantTransfere?: number; // Montant transféré aux enfants
  tauxUtilisation?: number; // Taux d'utilisation (%)
  devise: string; // 'XOF', 'EUR', etc.
  category?: string; // Catégorie budgétaire
  description?: string;
  reference?: string; // Référence administrative

  // Périodes
  dateDebut?: string | Date;
  dateFin?: string | Date;

  // Statut et workflow
  status: AllocationStatus;
  validationLevel?: number; // Niveau de validation actuel
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string;
  executedAt?: string;

  // Métadonnées
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;

  // Tags
  tags?: string[];
  categories?: string[];
  priorite?: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Allocation de stock avec support hiérarchie à 3 niveaux
 */
export interface StockAllocation {
  id: string;

  // Hiérarchie (support 3 niveaux)
  level: HierarchyLevel; // Niveau de l'allocation
  sourceTenantId: string; // ID du tenant source
  sourceTenantName?: string;
  sourceTenantLevel?: HierarchyLevel;
  targetTenantId: string; // ID du tenant cible
  targetTenantName?: string;
  targetTenantLevel?: HierarchyLevel;

  // Relations hiérarchiques
  parentAllocationId?: string;
  childAllocations?: string[];
  hasChildren?: boolean;
  depth?: number;

  // Stock
  itemCode: string; // Code article
  itemName: string; // Nom article
  quantity: number;
  quantityUsed?: number; // Quantité utilisée
  quantityAvailable?: number; // Quantité disponible
  quantityTransferred?: number; // Quantité transférée aux enfants
  unit: string; // 'kg', 'unité', 'tonne', etc.
  estimatedValue?: number; // Valeur estimée
  description?: string;

  // Statut et workflow
  status: AllocationStatus;
  validationLevel?: number;
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string;
  executedAt?: string;

  // Métadonnées
  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;

  // Tags
  tags?: string[];
  categories?: string[];
}

/**
 * Allocation générique (union des deux types)
 */
export type Allocation = BudgetAllocation | StockAllocation;

/**
 * Requête de création d'allocation budgétaire
 */
export interface CreateBudgetAllocationRequest {
  sourceTenantId: string;
  targetTenantId: string;
  exercice: number;
  montant: number;
  devise?: string;
  category?: string;
  description?: string;
}

/**
 * Requête de création d'allocation de stock
 */
export interface CreateStockAllocationRequest {
  sourceTenantId: string;
  targetTenantId: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
  description?: string;
}

/**
 * Filtres pour historique allocations
 */
export interface AllocationFilters {
  sourceTenantId?: string;
  targetTenantId?: string;
  type?: AllocationType;
  status?: AllocationStatus;
  dateFrom?: string;
  dateTo?: string;
  exercice?: number;
}

/**
 * Résumé statistique des allocations
 */
export interface AllocationSummary {
  totalAllocations: number;
  pendingAllocations: number;
  approvedAllocations: number;
  rejectedAllocations: number;
  totalBudgetAllocated: number;
  totalStockAllocations: number;
  allocationsByTenant: Array<{
    tenantId: string;
    tenantName: string;
    budgetAllocated: number;
    stockAllocations: number;
  }>;
}

/**
 * Résultat de validation
 */
export interface ValidationResult {
  success: boolean;
  message: string;
  allocation?: Allocation;
}

// ================================================================================================
// SERVICE ALLOCATION
// ================================================================================================

class AllocationService {
  private readonly baseUrl = '/allocations';

  /**
   * Créer une allocation budgétaire
   */
  async createBudgetAllocation(
    data: CreateBudgetAllocationRequest
  ): Promise<BudgetAllocation> {
    const response = await apiClient.post<{ data: BudgetAllocation }>(
      `${this.baseUrl}/budget`,
      data
    );
    return response.data.data;
  }

  /**
   * Créer une allocation de stock
   */
  async createStockAllocation(
    data: CreateStockAllocationRequest
  ): Promise<StockAllocation> {
    const response = await apiClient.post<{ data: StockAllocation }>(
      `${this.baseUrl}/stock`,
      data
    );
    return response.data.data;
  }

  /**
   * Récupérer l'historique des allocations
   */
  async getAllocationHistory(
    filters?: AllocationFilters
  ): Promise<Allocation[]> {
    const response = await apiClient.get<{ data: Allocation[]; count: number }>(
      `${this.baseUrl}/history`,
      { params: filters }
    );
    return response.data.data;
  }

  /**
   * Récupérer le résumé des allocations
   */
  async getAllocationSummary(
    tenantId?: string,
    exercice?: number
  ): Promise<AllocationSummary> {
    const response = await apiClient.get<{ data: AllocationSummary }>(
      `${this.baseUrl}/summary`,
      { params: { tenantId, exercice } }
    );
    return response.data.data;
  }

  /**
   * Valider (approuver ou rejeter) une allocation
   */
  async validateAllocation(
    allocationId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      `${this.baseUrl}/${allocationId}/validate`,
      { action, reason }
    );
    return response.data;
  }

  /**
   * Exécuter une allocation approuvée
   */
  async executeAllocation(allocationId: string): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      `${this.baseUrl}/${allocationId}/execute`
    );
    return response.data;
  }

  /**
   * Annuler une allocation
   */
  async cancelAllocation(
    allocationId: string,
    reason: string
  ): Promise<ValidationResult> {
    const response = await apiClient.post<ValidationResult>(
      `${this.baseUrl}/${allocationId}/cancel`,
      { reason }
    );
    return response.data;
  }

  /**
   * Récupérer toutes les allocations d'un CROU
   */
  async getAllocationsForCROU(crouId: string): Promise<{
    budgetAllocations: BudgetAllocation[];
    stockAllocations: StockAllocation[];
  }> {
    const response = await apiClient.get<{
      data: {
        budgetAllocations: BudgetAllocation[];
        stockAllocations: StockAllocation[];
      };
      count: {
        budget: number;
        stock: number;
        total: number;
      };
    }>(`${this.baseUrl}/crou/${crouId}`);
    return response.data.data;
  }

  /**
   * Récupérer une allocation par ID
   */
  async getAllocationById(allocationId: string): Promise<Allocation> {
    const response = await apiClient.get<{ data: Allocation }>(
      `${this.baseUrl}/${allocationId}`
    );
    return response.data.data;
  }

  // ==============================================================================================
  // NOUVELLES MÉTHODES - SUPPORT HIÉRARCHIE À 3 NIVEAUX
  // ==============================================================================================

  /**
   * Récupère les allocations par niveau hiérarchique
   */
  async getAllocationsByLevel(
    level: HierarchyLevel,
    filters?: AllocationFilters
  ): Promise<Allocation[]> {
    const response = await apiClient.get<{ data: Allocation[]; count: number }>(
      `${this.baseUrl}/level/${level}`,
      { params: filters }
    );
    return response.data.data;
  }

  /**
   * Récupère les allocations d'un tenant (ministry, region ou crou)
   */
  async getAllocationsForTenant(
    tenantId: string,
    level?: HierarchyLevel
  ): Promise<{
    budgetAllocations: BudgetAllocation[];
    stockAllocations: StockAllocation[];
  }> {
    const response = await apiClient.get<{
      data: {
        budgetAllocations: BudgetAllocation[];
        stockAllocations: StockAllocation[];
      };
    }>(`${this.baseUrl}/tenant/${tenantId}`, {
      params: { level }
    });
    return response.data.data;
  }

  /**
   * Récupère la hiérarchie des tenants
   */
  async getTenantHierarchy(): Promise<{
    ministry: { id: string; name: string };
    regions: Array<{
      id: string;
      name: string;
      crous: Array<{ id: string; name: string }>;
    }>;
  }> {
    const response = await apiClient.get<{
      data: {
        ministry: { id: string; name: string };
        regions: Array<{
          id: string;
          name: string;
          crous: Array<{ id: string; name: string }>;
        }>;
      };
    }>('/tenants/hierarchy');
    return response.data.data;
  }

  /**
   * Récupère les allocations enfants d'une allocation parent
   */
  async getChildAllocations(parentAllocationId: string): Promise<Allocation[]> {
    const response = await apiClient.get<{ data: Allocation[] }>(
      `${this.baseUrl}/${parentAllocationId}/children`
    );
    return response.data.data;
  }

  /**
   * Récupère l'arbre complet d'une allocation et ses descendants
   */
  async getAllocationTree(
    rootAllocationId: string
  ): Promise<Allocation & { children?: Allocation[] }> {
    const response = await apiClient.get<{
      data: Allocation & { children?: Allocation[] };
    }>(`${this.baseUrl}/${rootAllocationId}/tree`);
    return response.data.data;
  }

  /**
   * Crée une allocation cascadée (ministry → regions → crous)
   */
  async createCascadingAllocation(request: {
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
  }): Promise<{
    parent: Allocation;
    children: Allocation[];
  }> {
    const response = await apiClient.post<{
      data: {
        parent: Allocation;
        children: Allocation[];
      };
    }>(`${this.baseUrl}/cascade`, request);
    return response.data.data;
  }

  /**
   * Récupère le flux budgétaire pour un budget donné
   */
  async getBudgetFlow(budgetId: string, exercice?: number): Promise<{
    budgetId: string;
    exercice: number;
    ministryAllocation?: {
      tenantId: string;
      tenantName: string;
      montantTotal: number;
      montantAlloue: number;
      montantDisponible: number;
    };
    regionalAllocations?: Array<{
      allocationId: string;
      tenantId: string;
      tenantName: string;
      montantAlloue: number;
      montantUtilise: number;
      montantDisponible: number;
      crouCount: number;
    }>;
    crouAllocations?: Array<{
      allocationId: string;
      tenantId: string;
      tenantName: string;
      regionId: string;
      regionName: string;
      montantAlloue: number;
      montantUtilise: number;
      montantDisponible: number;
    }>;
    totalAlloue: number;
    totalUtilise: number;
    totalDisponible: number;
  }> {
    const response = await apiClient.get<{ data: any }>(
      '/budget-flow',
      { params: { budgetId, exercice } }
    );
    return response.data.data;
  }

  /**
   * Met à jour le flux budgétaire d'une allocation
   */
  async updateBudgetFlow(
    allocationId: string,
    flowData: {
      montantAlloue?: number;
      montantUtilise?: number;
      montantTransfere?: number;
    }
  ): Promise<Allocation> {
    const response = await apiClient.put<{ data: Allocation }>(
      `${this.baseUrl}/${allocationId}/budget-flow`,
      flowData
    );
    return response.data.data;
  }

  /**
   * Récupère les statistiques d'allocations
   */
  async getAllocationStatistics(filters?: {
    exercice?: number;
    level?: HierarchyLevel;
    tenantId?: string;
  }): Promise<{
    byLevel: {
      ministry: { count: number; totalAlloue: number; totalUtilise: number };
      region: { count: number; totalAlloue: number; totalUtilise: number };
      crou: { count: number; totalAlloue: number; totalUtilise: number };
    };
    byStatus: Record<AllocationStatus, { count: number; totalMontant: number }>;
    trends: Array<{
      periode: string;
      totalAlloue: number;
      totalUtilise: number;
      tauxUtilisation: number;
    }>;
    topAllocations: Allocation[];
    alerts: Array<{
      type: 'underutilized' | 'overutilized' | 'expired' | 'pending_validation';
      count: number;
      allocations: string[];
    }>;
  }> {
    const response = await apiClient.get<{ data: any }>(
      `${this.baseUrl}/statistics`,
      { params: filters }
    );
    return response.data.data;
  }

  /**
   * Récupère les allocations en attente de validation
   */
  async getPendingAllocations(level?: HierarchyLevel): Promise<Allocation[]> {
    const response = await apiClient.get<{ data: Allocation[] }>(
      `${this.baseUrl}/pending`,
      { params: { level } }
    );
    return response.data.data;
  }
}

// ================================================================================================
// UTILITAIRES
// ================================================================================================

export const AllocationUtils = {
  /**
   * Calcule le taux d'utilisation d'une allocation
   */
  calculateUtilizationRate: (montantUtilise: number, montantAlloue: number): number => {
    return montantAlloue > 0 ? Math.round((montantUtilise / montantAlloue) * 100) : 0;
  },

  /**
   * Détermine le niveau d'alerte selon le taux d'utilisation
   */
  getUtilizationAlert: (
    tauxUtilisation: number
  ): 'normal' | 'low' | 'warning' | 'critical' => {
    if (tauxUtilisation < 30) return 'low';
    if (tauxUtilisation > 90) return 'critical';
    if (tauxUtilisation > 75) return 'warning';
    return 'normal';
  },

  /**
   * Vérifie si une allocation est expirée
   */
  isExpired: (allocation: BudgetAllocation | StockAllocation): boolean => {
    if (!('dateFin' in allocation) || !allocation.dateFin) return false;
    const now = new Date();
    const dateFin = new Date(allocation.dateFin);
    return dateFin < now;
  },

  /**
   * Calcule le montant disponible pour répartition
   */
  getAvailableForDistribution: (allocation: BudgetAllocation): number => {
    const montantUtilise = allocation.montantUtilise || 0;
    const montantTransfere = allocation.montantTransfere || 0;
    const montantAlloue = allocation.montantAlloue || allocation.montant;
    return montantAlloue - montantTransfere - montantUtilise;
  },

  /**
   * Formate le libellé d'une allocation selon son niveau
   */
  formatAllocationLabel: (allocation: BudgetAllocation | StockAllocation): string => {
    const levelPrefix = {
      ministry: 'Ministère',
      region: 'Région',
      crou: 'CROU'
    };

    const level = allocation.level || 'crou';
    const tenantName = allocation.targetTenantName || 'Inconnu';
    const reference = 'reference' in allocation ? allocation.reference : '';

    return `${levelPrefix[level]} - ${tenantName}${reference ? ` - ${reference}` : ''}`;
  },

  /**
   * Valide qu'une répartition est valide
   */
  validateDistribution: (
    parentMontant: number,
    distributions: Array<{ montant?: number; quantity?: number }>
  ): { valid: boolean; message?: string } => {
    const totalDistribution = distributions.reduce(
      (sum, d) => sum + (d.montant || d.quantity || 0),
      0
    );

    if (totalDistribution > parentMontant) {
      return {
        valid: false,
        message: `Le total des distributions (${totalDistribution}) dépasse le montant parent (${parentMontant})`
      };
    }

    if (distributions.some(d => (d.montant || d.quantity || 0) <= 0)) {
      return {
        valid: false,
        message: 'Toutes les distributions doivent avoir un montant positif'
      };
    }

    return { valid: true };
  },

  /**
   * Formatte un montant en FCFA
   */
  formatCurrency: (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
};

// Export singleton
export const allocationService = new AllocationService();
export default allocationService;
