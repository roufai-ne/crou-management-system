/**
 * FICHIER: apps/api/src/modules/allocations/allocations.controller.ts
 * CONTRÔLEUR: Gestion des allocations stratégiques
 *
 * DESCRIPTION:
 * Contrôleur pour gérer les endpoints d'allocations
 * Allocations budgétaires et de stocks du Ministère aux CROUs
 *
 * ROUTES:
 * - POST   /api/allocations/budget      - Créer allocation budgétaire
 * - POST   /api/allocations/stock       - Créer allocation de stock
 * - GET    /api/allocations/history     - Historique des allocations
 * - GET    /api/allocations/summary     - Résumé des allocations
 * - POST   /api/allocations/:id/validate - Valider/rejeter une allocation
 * - POST   /api/allocations/:id/execute  - Exécuter une allocation
 * - POST   /api/allocations/:id/cancel   - Annuler une allocation
 * - GET    /api/allocations/crou/:crouId - Allocations d'un CROU
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router, Request, Response } from 'express';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { AllocationsService, AllocationStatus, AllocationType } from './allocations.service';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();
let allocationsService: AllocationsService;

// Initialiser le service
function getAllocationsService(): AllocationsService {
  if (!allocationsService && AppDataSource.isInitialized) {
    allocationsService = new AllocationsService(AppDataSource);
  }
  if (!allocationsService) {
    throw new Error('AllocationsService non initialisé');
  }
  return allocationsService;
}

/**
 * POST /api/allocations/budget
 * Créer une allocation budgétaire du Ministère à un CROU
 */
router.post('/budget',
  authenticateJWT,
  checkPermissions(['financial:write', 'ministry:global_view']),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const {
        sourceTenantId,
        targetTenantId,
        exercice,
        montant,
        devise = 'XOF',
        category,
        description
      } = req.body;

      // Validation des champs requis
      if (!sourceTenantId || !targetTenantId || !exercice || !montant) {
        return res.status(400).json({
          success: false,
          error: 'Champs requis manquants',
          message: 'sourceTenantId, targetTenantId, exercice et montant sont obligatoires'
        });
      }

      const service = getAllocationsService();
      const allocation = await service.allocateBudget({
        sourceTenantId,
        targetTenantId,
        exercice,
        montant: parseFloat(montant),
        devise,
        category,
        description,
        status: AllocationStatus.PENDING,
        createdBy: req.user!.id
      }, req.user!.id);

      res.status(201).json({
        success: true,
        data: allocation,
        message: 'Allocation budgétaire créée avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur création allocation budgétaire:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la création de l\'allocation budgétaire'
      });
    }
  }
);

/**
 * POST /api/allocations/stock
 * Créer une allocation de stock du Ministère à un CROU
 */
router.post('/stock',
  authenticateJWT,
  checkPermissions(['stocks:write', 'ministry:global_view']),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const {
        sourceTenantId,
        targetTenantId,
        itemCode,
        itemName,
        quantity,
        unit,
        estimatedValue,
        description
      } = req.body;

      // Validation des champs requis
      if (!sourceTenantId || !targetTenantId || !itemCode || !itemName || !quantity || !unit) {
        return res.status(400).json({
          success: false,
          error: 'Champs requis manquants',
          message: 'sourceTenantId, targetTenantId, itemCode, itemName, quantity et unit sont obligatoires'
        });
      }

      const service = getAllocationsService();
      const allocation = await service.allocateStock({
        sourceTenantId,
        targetTenantId,
        itemCode,
        itemName,
        quantity: parseFloat(quantity),
        unit,
        estimatedValue: estimatedValue ? parseFloat(estimatedValue) : undefined,
        description,
        status: AllocationStatus.PENDING,
        createdBy: req.user!.id
      }, req.user!.id);

      res.status(201).json({
        success: true,
        data: allocation,
        message: 'Allocation de stock créée avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur création allocation stock:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la création de l\'allocation de stock'
      });
    }
  }
);

/**
 * GET /api/allocations/history
 * Récupérer l'historique des allocations avec filtres
 */
router.get('/history',
  authenticateJWT,
  checkPermissions(['financial:read']),
  async (req: Request, res: Response) => {
    try {
      const {
        sourceTenantId,
        targetTenantId,
        type,
        status,
        dateFrom,
        dateTo
      } = req.query;

      const filters: any = {};
      if (sourceTenantId) filters.sourceTenantId = sourceTenantId as string;
      if (targetTenantId) filters.targetTenantId = targetTenantId as string;
      if (type) filters.type = type as AllocationType;
      if (status) filters.status = status as AllocationStatus;
      if (dateFrom) filters.dateFrom = new Date(dateFrom as string);
      if (dateTo) filters.dateTo = new Date(dateTo as string);

      const service = getAllocationsService();
      const history = await service.getAllocationHistory(filters);

      res.json({
        success: true,
        data: history,
        count: history.length
      });
    } catch (error: any) {
      logger.error('Erreur récupération historique:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération de l\'historique'
      });
    }
  }
);

/**
 * GET /api/allocations/summary
 * Récupérer le résumé des allocations
 */
router.get('/summary',
  authenticateJWT,
  checkPermissions(['financial:read']),
  async (req: Request, res: Response) => {
    try {
      const { tenantId, exercice } = req.query;

      const service = getAllocationsService();
      const summary = await service.getAllocationSummary(
        tenantId as string | undefined,
        exercice ? parseInt(exercice as string) : undefined
      );

      res.json({
        success: true,
        data: summary
      });
    } catch (error: any) {
      logger.error('Erreur récupération résumé:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération du résumé'
      });
    }
  }
);

/**
 * POST /api/allocations/:id/validate
 * Valider ou rejeter une allocation
 */
router.post('/:id/validate',
  authenticateJWT,
  checkPermissions(['financial:validate']),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;

      if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({
          success: false,
          error: 'Action invalide',
          message: 'L\'action doit être "approve" ou "reject"'
        });
      }

      const service = getAllocationsService();
      await service.validateAllocation(id, action, req.user!.id, reason);

      res.json({
        success: true,
        message: `Allocation ${action === 'approve' ? 'approuvée' : 'rejetée'} avec succès`
      });
    } catch (error: any) {
      logger.error('Erreur validation allocation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la validation de l\'allocation'
      });
    }
  }
);

/**
 * POST /api/allocations/:id/execute
 * Exécuter une allocation approuvée
 */
router.post('/:id/execute',
  authenticateJWT,
  checkPermissions(['financial:write']),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const service = getAllocationsService();
      await service.executeAllocation(id, req.user!.id);

      res.json({
        success: true,
        message: 'Allocation exécutée avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur exécution allocation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de l\'exécution de l\'allocation'
      });
    }
  }
);

/**
 * POST /api/allocations/:id/cancel
 * Annuler une allocation
 */
router.post('/:id/cancel',
  authenticateJWT,
  checkPermissions(['financial:write']),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Raison requise',
          message: 'La raison de l\'annulation est obligatoire'
        });
      }

      const service = getAllocationsService();
      await service.cancelAllocation(id, req.user!.id, reason);

      res.json({
        success: true,
        message: 'Allocation annulée avec succès'
      });
    } catch (error: any) {
      logger.error('Erreur annulation allocation:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de l\'annulation de l\'allocation'
      });
    }
  }
);

/**
 * GET /api/allocations/crou/:crouId
 * Récupérer toutes les allocations d'un CROU
 */
router.get('/crou/:crouId',
  authenticateJWT,
  checkPermissions(['financial:read']),
  async (req: Request, res: Response) => {
    try {
      const { crouId } = req.params;

      const service = getAllocationsService();
      const allocations = await service.getAllocationsForCROU(crouId);

      res.json({
        success: true,
        data: allocations,
        count: {
          budget: allocations.budgetAllocations.length,
          stock: allocations.stockAllocations.length,
          total: allocations.budgetAllocations.length + allocations.stockAllocations.length
        }
      });
    } catch (error: any) {
      logger.error('Erreur récupération allocations CROU:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération des allocations'
      });
    }
  }
);

/**
 * GET /api/allocations/statistics
 * Récupérer les statistiques des allocations
 */
router.get('/statistics',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      // Filtrer la valeur "all" pour status et type
      const statusParam = req.query.status as string;
      const typeParam = req.query.type as string;

      const stats = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        executed: 0,
        byType: {
          budget: 0,
          stock: 0,
          resource: 0,
          staff: 0
        },
        totalAmounts: {
          budget: 0,
          stock: 0
        }
      };

      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Erreur récupération statistiques allocations:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

export default router;
