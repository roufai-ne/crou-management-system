/**
 * FICHIER: apps/web/src/services/api/allocationService.ts
 * SERVICE: AllocationService - Gestion des allocations stratégiques
 *
 * DESCRIPTION:
 * Service pour gérer les allocations budgétaires et de stocks
 * du Ministère vers les CROUs (hiérarchie niveau 0 → niveau 1)
 *
 * FONCTIONNALITÉS:
 * - Créer allocations budgétaires Ministère → CROU
 * - Créer allocations stocks Ministère → CROU
 * - Consulter historique allocations
 * - Valider/rejeter allocations
 * - Exécuter allocations approuvées
 * - Annuler allocations
 * - Statistiques et résumés
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// ================================================================================================
// TYPES ET INTERFACES
// ================================================================================================

export type AllocationType = 'budget' | 'stock';

export type AllocationStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'executed'
  | 'cancelled';

/**
 * Allocation budgétaire du Ministère vers un CROU
 */
export interface BudgetAllocation {
  id: string;
  sourceTenantId: string; // ID Ministère
  sourceTenantName?: string;
  targetTenantId: string; // ID CROU
  targetTenantName?: string;

  exercice: number; // Année fiscale
  montant: number;
  devise: string; // 'XOF', 'EUR', etc.
  category?: string; // Catégorie budgétaire
  description?: string;

  status: AllocationStatus;
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string;
  executedAt?: string;

  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Allocation de stock du Ministère vers un CROU
 */
export interface StockAllocation {
  id: string;
  sourceTenantId: string; // ID Ministère
  sourceTenantName?: string;
  targetTenantId: string; // ID CROU
  targetTenantName?: string;

  itemCode: string; // Code article
  itemName: string; // Nom article
  quantity: number;
  unit: string; // 'kg', 'unité', 'tonne', etc.
  estimatedValue?: number; // Valeur estimée
  description?: string;

  status: AllocationStatus;
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string;
  executedAt?: string;

  createdBy: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
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
}

// Export singleton
export const allocationService = new AllocationService();
export default allocationService;
