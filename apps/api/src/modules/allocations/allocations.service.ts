/**
 * FICHIER: apps/api/src/modules/allocations/allocations.service.ts
 * SERVICE: Gestion des allocations stratégiques
 *
 * DESCRIPTION:
 * Service pour gérer les allocations budgétaires et de stocks
 * du Ministère vers les CROUs (niveau 0 → niveau 1)
 *
 * FONCTIONNALITÉS:
 * - Allocation de budgets du Ministère aux CROUs
 * - Allocation de stocks stratégiques du Ministère aux CROUs
 * - Historique des allocations
 * - Validation et suivi des allocations
 * - Statistiques d'allocation
 *
 * RÈGLES MÉTIER:
 * - Seul le Ministère (niveau 0) peut effectuer des allocations
 * - Les allocations ne peuvent aller que vers les CROUs (niveau 1)
 * - Les allocations sont tracées pour audit
 * - Les allocations peuvent être validées ou rejetées
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource, Repository } from 'typeorm';
import { logger } from '@/shared/utils/logger';
import { TenantHierarchyService } from '../tenants/tenant-hierarchy.service';
import { Tenant, TenantType } from '@database/entities/Tenant.entity';

export enum AllocationType {
  BUDGET = 'budget',
  STOCK = 'stock'
}

export enum AllocationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXECUTED = 'executed',
  CANCELLED = 'cancelled'
}

export interface BudgetAllocation {
  id?: string;
  sourceTenantId: string; // Ministère
  targetTenantId: string; // CROU
  exercice: number;
  montant: number;
  devise: string;
  category?: string;
  description?: string;
  status: AllocationStatus;
  validatedBy?: string;
  validatedAt?: Date;
  executedAt?: Date;
  createdBy: string;
  createdAt?: Date;
}

export interface StockAllocation {
  id?: string;
  sourceTenantId: string; // Ministère
  targetTenantId: string; // CROU
  itemCode: string;
  itemName: string;
  quantity: number;
  unit: string;
  estimatedValue?: number;
  description?: string;
  status: AllocationStatus;
  validatedBy?: string;
  validatedAt?: Date;
  executedAt?: Date;
  createdBy: string;
  createdAt?: Date;
}

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

export class AllocationsService {
  private dataSource: DataSource;
  private tenantRepository: Repository<Tenant>;
  private hierarchyService: TenantHierarchyService;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.tenantRepository = dataSource.getRepository(Tenant);
    this.hierarchyService = new TenantHierarchyService(dataSource);
  }

  /**
   * Allouer un budget du Ministère à un CROU
   */
  async allocateBudget(
    allocation: BudgetAllocation,
    requestingUserId: string
  ): Promise<BudgetAllocation> {
    try {
      // Validation: le tenant source doit être le Ministère
      const sourceTenant = await this.tenantRepository.findOne({
        where: { id: allocation.sourceTenantId }
      });

      if (!sourceTenant || sourceTenant.type !== TenantType.MINISTERE) {
        throw new Error('Les allocations budgétaires ne peuvent provenir que du Ministère');
      }

      // Validation: le tenant cible doit être un CROU
      const targetTenant = await this.tenantRepository.findOne({
        where: { id: allocation.targetTenantId }
      });

      if (!targetTenant || targetTenant.type !== TenantType.CROU) {
        throw new Error('Les allocations budgétaires ne peuvent aller qu\'aux CROUs');
      }

      // Vérifier la hiérarchie
      const canAccess = await this.hierarchyService.canAccessTenant(
        allocation.sourceTenantId,
        allocation.targetTenantId
      );

      if (!canAccess) {
        throw new Error('Hiérarchie invalide pour cette allocation');
      }

      // TODO: Créer l'enregistrement d'allocation dans la table allocation_history
      // Pour l'instant, nous simulons avec un objet
      const createdAllocation: BudgetAllocation = {
        ...allocation,
        id: `alloc-budget-${Date.now()}`,
        status: AllocationStatus.PENDING,
        createdBy: requestingUserId,
        createdAt: new Date()
      };

      logger.info('Allocation budgétaire créée:', {
        allocationId: createdAllocation.id,
        source: sourceTenant.name,
        target: targetTenant.name,
        montant: allocation.montant,
        exercice: allocation.exercice
      });

      return createdAllocation;
    } catch (error) {
      logger.error('Erreur lors de l\'allocation budgétaire:', error);
      throw error;
    }
  }

  /**
   * Allouer du stock du Ministère à un CROU
   */
  async allocateStock(
    allocation: StockAllocation,
    requestingUserId: string
  ): Promise<StockAllocation> {
    try {
      // Validation: le tenant source doit être le Ministère
      const sourceTenant = await this.tenantRepository.findOne({
        where: { id: allocation.sourceTenantId }
      });

      if (!sourceTenant || sourceTenant.type !== TenantType.MINISTERE) {
        throw new Error('Les allocations de stock ne peuvent provenir que du Ministère');
      }

      // Validation: le tenant cible doit être un CROU
      const targetTenant = await this.tenantRepository.findOne({
        where: { id: allocation.targetTenantId }
      });

      if (!targetTenant || targetTenant.type !== TenantType.CROU) {
        throw new Error('Les allocations de stock ne peuvent aller qu\'aux CROUs');
      }

      // Vérifier la hiérarchie
      const canAccess = await this.hierarchyService.canAccessTenant(
        allocation.sourceTenantId,
        allocation.targetTenantId
      );

      if (!canAccess) {
        throw new Error('Hiérarchie invalide pour cette allocation');
      }

      // TODO: Créer l'enregistrement d'allocation dans la table allocation_history
      const createdAllocation: StockAllocation = {
        ...allocation,
        id: `alloc-stock-${Date.now()}`,
        status: AllocationStatus.PENDING,
        createdBy: requestingUserId,
        createdAt: new Date()
      };

      logger.info('Allocation de stock créée:', {
        allocationId: createdAllocation.id,
        source: sourceTenant.name,
        target: targetTenant.name,
        itemCode: allocation.itemCode,
        quantity: allocation.quantity
      });

      return createdAllocation;
    } catch (error) {
      logger.error('Erreur lors de l\'allocation de stock:', error);
      throw error;
    }
  }

  /**
   * Valider une allocation (approuver ou rejeter)
   */
  async validateAllocation(
    allocationId: string,
    action: 'approve' | 'reject',
    validatorUserId: string,
    reason?: string
  ): Promise<void> {
    try {
      // TODO: Récupérer l'allocation depuis allocation_history
      // TODO: Vérifier que le validateur a les permissions
      // TODO: Mettre à jour le statut

      const newStatus = action === 'approve' ? AllocationStatus.APPROVED : AllocationStatus.REJECTED;

      logger.info('Allocation validée:', {
        allocationId,
        action,
        newStatus,
        validatorUserId,
        reason
      });
    } catch (error) {
      logger.error('Erreur lors de la validation d\'allocation:', error);
      throw error;
    }
  }

  /**
   * Exécuter une allocation approuvée
   */
  async executeAllocation(
    allocationId: string,
    executorUserId: string
  ): Promise<void> {
    try {
      // TODO: Récupérer l'allocation
      // TODO: Vérifier le statut (doit être APPROVED)
      // TODO: Créer les enregistrements correspondants (budget ou stock)
      // TODO: Mettre à jour le statut à EXECUTED

      logger.info('Allocation exécutée:', {
        allocationId,
        executorUserId,
        executedAt: new Date()
      });
    } catch (error) {
      logger.error('Erreur lors de l\'exécution d\'allocation:', error);
      throw error;
    }
  }

  /**
   * Récupérer l'historique des allocations
   */
  async getAllocationHistory(filters: {
    sourceTenantId?: string;
    targetTenantId?: string;
    type?: AllocationType;
    status?: AllocationStatus;
    dateFrom?: Date;
    dateTo?: Date;
  }): Promise<Array<BudgetAllocation | StockAllocation>> {
    try {
      // TODO: Requête sur allocation_history avec les filtres
      // Pour l'instant, retourner un tableau vide
      logger.debug('Récupération historique allocations:', filters);
      return [];
    } catch (error) {
      logger.error('Erreur lors de la récupération de l\'historique:', error);
      throw error;
    }
  }

  /**
   * Récupérer le résumé des allocations
   */
  async getAllocationSummary(
    tenantId?: string,
    exercice?: number
  ): Promise<AllocationSummary> {
    try {
      // TODO: Agréger les données depuis allocation_history
      // Pour l'instant, retourner un résumé vide
      const summary: AllocationSummary = {
        totalAllocations: 0,
        pendingAllocations: 0,
        approvedAllocations: 0,
        rejectedAllocations: 0,
        totalBudgetAllocated: 0,
        totalStockAllocations: 0,
        allocationsByTenant: []
      };

      logger.debug('Résumé des allocations:', { tenantId, exercice });
      return summary;
    } catch (error) {
      logger.error('Erreur lors de la récupération du résumé:', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les allocations pour un CROU
   */
  async getAllocationsForCROU(crouId: string): Promise<{
    budgetAllocations: BudgetAllocation[];
    stockAllocations: StockAllocation[];
  }> {
    try {
      // Vérifier que c'est bien un CROU
      const crou = await this.tenantRepository.findOne({
        where: { id: crouId }
      });

      if (!crou || crou.type !== TenantType.CROU) {
        throw new Error('Le tenant spécifié n\'est pas un CROU');
      }

      // TODO: Récupérer les allocations depuis allocation_history
      logger.debug('Récupération allocations pour CROU:', crouId);

      return {
        budgetAllocations: [],
        stockAllocations: []
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération des allocations du CROU:', error);
      throw error;
    }
  }

  /**
   * Annuler une allocation
   */
  async cancelAllocation(
    allocationId: string,
    cancellerUserId: string,
    reason: string
  ): Promise<void> {
    try {
      // TODO: Vérifier le statut (ne peut annuler que PENDING ou APPROVED)
      // TODO: Mettre à jour le statut à CANCELLED

      logger.info('Allocation annulée:', {
        allocationId,
        cancellerUserId,
        reason,
        cancelledAt: new Date()
      });
    } catch (error) {
      logger.error('Erreur lors de l\'annulation d\'allocation:', error);
      throw error;
    }
  }
}
