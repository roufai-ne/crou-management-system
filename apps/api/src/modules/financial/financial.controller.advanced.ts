/**
 * FICHIER: apps/api/src/modules/financial/financial.controller.advanced.ts
 * CONTRÔLEUR: Exemple avancé d'utilisation des guards et décorateurs RBAC
 * 
 * DESCRIPTION:
 * Contrôleur démontrant l'utilisation avancée des nouveaux guards RBAC
 * Utilisation des décorateurs de permissions avec conditions
 * Intégration complète avec le système d'autorisation granulaire
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { 
  requireFinancialOperation,
  requireAdminOperation,
  requireCrossTenantOperation
} from '@/shared/guards/specialized.guards';
import {
  RequireFinancialPermission,
  RequireAllPermissions,
  RequireAnyPermission,
  RequireFinancialApproval,
  RequireCrossTenantAccess,
  RequireSensitiveOperation,
  RequireConditions
} from '@/shared/decorators/permissions.decorator';
import { processPermissionDecorators } from '@/shared/middlewares/decorator-processor.middleware';
import { logger } from '@/shared/utils/logger';

const router = Router();

/**
 * Classe contrôleur avec décorateurs de permissions
 */
class FinancialAdvancedController {
  /**
   * GET /api/financial/advanced/budgets
   * Lister les budgets avec décorateur simple
   */
  @RequireFinancialPermission('read')
  static async getBudgets(req: Request, res: Response) {
    try {
      // Simulation de données budgétaires
      const mockBudgets = [
        {
          id: '1',
          tenantId: req.user?.tenantId,
          exercice: 2024,
          type: 'fonctionnement',
          montant: 50000000,
          realise: 35000000,
          status: 'en_cours'
        },
        {
          id: '2',
          tenantId: req.user?.tenantId,
          exercice: 2024,
          type: 'investissement',
          montant: 25000000,
          realise: 12000000,
          status: 'en_cours'
        }
      ];

      res.json({
        success: true,
        data: {
          budgets: mockBudgets,
          userTenant: req.user?.tenantId,
          timestamp: new Date()
        }
      });
    } catch (error) {
      logger.error('Erreur récupération budgets avancés:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des budgets'
      });
    }
  }

  /**
   * POST /api/financial/advanced/budgets
   * Créer un budget avec validation de montant
   */
  @RequireFinancialApproval(10000000) // Max 10M FCFA sans approbation
  static async createBudget(req: Request, res: Response) {
    try {
      const { exercice, type, montant, description } = req.body;

      // Validation des données
      if (!exercice || !type || !montant) {
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Exercice, type et montant sont requis'
        });
      }

      // Simulation de création avec validation métier
      const newBudget = {
        id: Date.now().toString(),
        tenantId: req.user?.tenantId,
        exercice,
        type,
        montant,
        description,
        realise: 0,
        status: montant > 10000000 ? 'en_attente_approbation' : 'brouillon',
        createdBy: req.user?.id,
        createdAt: new Date()
      };

      logger.info('Budget créé avec décorateur:', {
        budgetId: newBudget.id,
        userId: req.user?.id,
        tenantId: req.user?.tenantId,
        montant,
        requiresApproval: montant > 10000000
      });

      res.status(201).json({
        success: true,
        message: 'Budget créé avec succès',
        data: { budget: newBudget }
      });
    } catch (error) {
      logger.error('Erreur création budget avancé:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du budget'
      });
    }
  }

  /**
   * PUT /api/financial/advanced/budgets/:id/approve
   * Approuver un budget avec conditions multiples
   */
  @RequireAllPermissions(
    { resource: 'financial', action: 'validate' },
    { resource: 'admin', action: 'read' }
  )
  @RequireConditions(
    {
      field: 'body.montant',
      operator: 'gte',
      value: 1000000,
      message: 'Seuls les budgets >= 1M FCFA nécessitent une approbation'
    },
    {
      field: 'body.justification',
      operator: 'exists',
      message: 'Une justification est requise pour l\'approbation'
    }
  )
  static async approveBudget(req: Request, res: Response) {
    try {
      const budgetId = req.params.id;
      const { montant, justification, commentaire } = req.body;

      // Simulation d'approbation avec validation métier
      const approvedBudget = {
        id: budgetId,
        status: 'approuve',
        montant,
        approvedBy: req.user?.id,
        approvedAt: new Date(),
        justification,
        commentaire
      };

      logger.warn('Budget approuvé - Opération sensible:', {
        budgetId,
        approvedBy: req.user?.id,
        tenantId: req.user?.tenantId,
        montant,
        justification
      });

      res.json({
        success: true,
        message: 'Budget approuvé avec succès',
        data: { budget: approvedBudget }
      });
    } catch (error) {
      logger.error('Erreur approbation budget:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'approbation du budget'
      });
    }
  }
}

// Routes avec décorateurs

/**
 * GET /api/financial/advanced/budgets
 * Utilisation du décorateur (traité par le middleware)
 */
router.get('/budgets',
  authenticateJWT,
  processPermissionDecorators({ logAccess: true }),
  FinancialAdvancedController.getBudgets
);

/**
 * POST /api/financial/advanced/budgets
 * Utilisation du décorateur avec validation de montant
 */
router.post('/budgets',
  authenticateJWT,
  processPermissionDecorators({ logAccess: true, auditSensitive: true }),
  FinancialAdvancedController.createBudget
);

/**
 * PUT /api/financial/advanced/budgets/:id/approve
 * Utilisation de décorateurs multiples
 */
router.put('/budgets/:id/approve',
  authenticateJWT,
  processPermissionDecorators({ logAccess: true, auditSensitive: true }),
  FinancialAdvancedController.approveBudget
);

/**
 * Routes avec guards spécialisés traditionnels pour comparaison
 */

/**
 * POST /api/financial/advanced/operations
 * Utilisation du guard financier spécialisé
 */
router.post('/operations',
  authenticateJWT,
  requireFinancialOperation('write', {
    maxAmount: 5000000,
    operationTypes: ['budget', 'depense', 'recette'],
    customValidator: async (req) => {
      // Validation personnalisée
      const { operationType, montant } = req.body;
      
      if (operationType === 'depense' && montant > 1000000) {
        // Vérifier si c'est un jour ouvrable
        const now = new Date();
        const dayOfWeek = now.getDay();
        return dayOfWeek >= 1 && dayOfWeek <= 5; // Lundi à Vendredi
      }
      
      return true;
    }
  }),
  async (req: Request, res: Response) => {
    try {
      const { operationType, montant, description } = req.body;

      const operation = {
        id: Date.now().toString(),
        tenantId: req.user?.tenantId,
        operationType,
        montant,
        description,
        status: 'en_cours',
        createdBy: req.user?.id,
        createdAt: new Date()
      };

      logger.info('Opération financière créée avec guard spécialisé:', {
        operationId: operation.id,
        userId: req.user?.id,
        operationType,
        montant
      });

      res.status(201).json({
        success: true,
        message: 'Opération créée avec succès',
        data: { operation }
      });
    } catch (error) {
      logger.error('Erreur création opération:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création de l\'opération'
      });
    }
  }
);

export { router as financialAdvancedRouter };