/**
 * FICHIER: apps\api\src\modules\financial\financial.controller.tenant.ts
 * CONTRÔLEUR: Exemple d'utilisation du service multi-tenant
 * 
 * DESCRIPTION:
 * Contrôleur démontrant l'utilisation du service multi-tenant
 * Isolation automatique des données par tenant
 * Gestion des accès cross-tenant pour le ministère
 * 
 * FONCTIONNALITÉS:
 * - Isolation automatique des données financières
 * - Accès cross-tenant pour les utilisateurs ministériels
 * - Validation des permissions tenant
 * - Repository avec filtre tenant automatique
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { 
  TenantIsolated,
  AllowCrossTenant,
  RequireTenantRole,
  tenantIsolationMiddleware
} from '@/shared/decorators/tenant.decorator';
import { 
  extractTenantContext,
  validateAndCleanTenantData,
  paginateWithTenant,
  createTenantRepository,
  validateCrossTenantAccess,
  logTenantOperation
} from '@/shared/utils/tenant.utils';
import { MultiTenantService } from '@/shared/services/multi-tenant.service';
import { logger } from '@/shared/utils/logger';

const router = Router();
const multiTenantService = new MultiTenantService();

/**
 * Classe contrôleur avec isolation multi-tenant
 */
class FinancialTenantController {
  /**
   * GET /api/financial/tenant/budgets
   * Lister les budgets avec isolation tenant automatique
   */
  @TenantIsolated({ strictMode: true })
  static async getBudgets(req: Request, res: Response) {
    try {
      const tenantContext = extractTenantContext(req);
      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant'
        });
      }

      // Simulation de données budgétaires avec isolation tenant
      const mockBudgets = [
        {
          id: '1',
          tenantId: tenantContext.tenantId,
          exercice: 2024,
          type: 'fonctionnement',
          montant: 50000000,
          realise: 35000000,
          status: 'en_cours'
        },
        {
          id: '2',
          tenantId: tenantContext.tenantId,
          exercice: 2024,
          type: 'investissement',
          montant: 25000000,
          realise: 12000000,
          status: 'en_cours'
        }
      ];

      logTenantOperation('list_budgets', tenantContext, {
        budgetCount: mockBudgets.length
      });

      res.json({
        success: true,
        data: {
          budgets: mockBudgets,
          tenant: {
            id: tenantContext.tenantId,
            type: tenantContext.tenantType,
            code: tenantContext.tenantCode
          },
          pagination: {
            total: mockBudgets.length,
            page: 1,
            limit: 10
          }
        }
      });
    } catch (error) {
      logger.error('Erreur récupération budgets tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des budgets'
      });
    }
  }

  /**
   * POST /api/financial/tenant/budgets
   * Créer un budget avec injection tenant automatique
   */
  @TenantIsolated({ strictMode: true })
  static async createBudget(req: Request, res: Response) {
    try {
      const tenantContext = extractTenantContext(req);
      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant'
        });
      }

      // Valider et nettoyer les données avec tenant_id
      const budgetData = validateAndCleanTenantData(
        req.body,
        tenantContext.tenantId,
        tenantContext.tenantType,
        { strictMode: true }
      );

      // Validation des données
      if (!budgetData.exercice || !budgetData.type || !budgetData.montant) {
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Exercice, type et montant sont requis'
        });
      }

      // Simulation de création avec tenant_id automatique
      const newBudget = {
        id: Date.now().toString(),
        ...budgetData,
        realise: 0,
        status: 'brouillon',
        createdBy: tenantContext.userId,
        createdAt: new Date()
      };

      logTenantOperation('create_budget', tenantContext, {
        budgetId: newBudget.id,
        montant: budgetData.montant,
        type: budgetData.type
      });

      res.status(201).json({
        success: true,
        message: 'Budget créé avec succès',
        data: { budget: newBudget }
      });
    } catch (error) {
      logger.error('Erreur création budget tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du budget'
      });
    }
  }

  /**
   * GET /api/financial/tenant/cross-tenant/:tenantId/budgets
   * Accès cross-tenant aux budgets (ministère uniquement)
   */
  @AllowCrossTenant({ requiredRole: 'Ministre' })
  static async getCrossTenantBudgets(req: Request, res: Response) {
    try {
      const tenantContext = extractTenantContext(req);
      const targetTenantId = req.params.tenantId;

      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant'
        });
      }

      // Valider l'accès cross-tenant
      const canAccess = await validateCrossTenantAccess(
        tenantContext,
        targetTenantId,
        'read_budgets'
      );

      if (!canAccess) {
        return res.status(403).json({
          error: 'Accès cross-tenant refusé',
          message: 'Vous n\'avez pas l\'autorisation d\'accéder à ce tenant'
        });
      }

      // Récupérer les informations du tenant cible
      const targetTenant = await multiTenantService.getTenant(targetTenantId);
      if (!targetTenant) {
        return res.status(404).json({
          error: 'Tenant non trouvé',
          message: 'Le tenant demandé n\'existe pas'
        });
      }

      // Simulation de données pour le tenant cible
      const mockBudgets = [
        {
          id: '1',
          tenantId: targetTenantId,
          exercice: 2024,
          type: 'fonctionnement',
          montant: 30000000,
          realise: 20000000,
          status: 'en_cours'
        }
      ];

      logTenantOperation('cross_tenant_access', tenantContext, {
        targetTenantId,
        targetTenantName: targetTenant.name,
        operation: 'read_budgets'
      });

      res.json({
        success: true,
        data: {
          budgets: mockBudgets,
          targetTenant: {
            id: targetTenant.id,
            name: targetTenant.name,
            type: targetTenant.type,
            code: targetTenant.code
          },
          accessedBy: {
            userId: tenantContext.userId,
            tenantId: tenantContext.tenantId,
            tenantType: tenantContext.tenantType
          }
        }
      });
    } catch (error) {
      logger.error('Erreur accès cross-tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de l\'accès cross-tenant'
      });
    }
  }

  /**
   * GET /api/financial/tenant/accessible-tenants
   * Lister les tenants accessibles par l'utilisateur
   */
  @TenantIsolated()
  static async getAccessibleTenants(req: Request, res: Response) {
    try {
      const tenantContext = extractTenantContext(req);
      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant'
        });
      }

      // Récupérer les tenants accessibles
      const accessibleTenants = await multiTenantService.getAccessibleTenants(tenantContext);

      logTenantOperation('list_accessible_tenants', tenantContext, {
        tenantCount: accessibleTenants.length
      });

      res.json({
        success: true,
        data: {
          tenants: accessibleTenants.map(tenant => ({
            id: tenant.id,
            name: tenant.name,
            code: tenant.code,
            type: tenant.type,
            region: tenant.region,
            isActive: tenant.isActive
          })),
          userContext: {
            tenantId: tenantContext.tenantId,
            tenantType: tenantContext.tenantType,
            canCrossTenant: tenantContext.tenantType === 'ministere'
          }
        }
      });
    } catch (error) {
      logger.error('Erreur récupération tenants accessibles:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des tenants'
      });
    }
  }

  /**
   * POST /api/financial/tenant/validate-access
   * Valider l'accès à un tenant spécifique
   */
  static async validateTenantAccess(req: Request, res: Response) {
    try {
      const tenantContext = extractTenantContext(req);
      const { targetTenantId, operation } = req.body;

      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant'
        });
      }

      if (!targetTenantId) {
        return res.status(400).json({
          error: 'Tenant cible manquant',
          message: 'targetTenantId est requis'
        });
      }

      // Valider l'accès
      const validation = await multiTenantService.validateTenantAccess(
        tenantContext,
        targetTenantId,
        { allowCrossTenant: true }
      );

      logTenantOperation('validate_tenant_access', tenantContext, {
        targetTenantId,
        operation,
        allowed: validation.allowed,
        reason: validation.reason
      });

      res.json({
        success: true,
        data: {
          allowed: validation.allowed,
          reason: validation.reason,
          userContext: {
            tenantId: tenantContext.tenantId,
            tenantType: tenantContext.tenantType,
            userRole: tenantContext.userRole
          },
          targetTenantId,
          operation
        }
      });
    } catch (error) {
      logger.error('Erreur validation accès tenant:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la validation d\'accès'
      });
    }
  }
}

// Routes avec middleware d'isolation tenant

/**
 * GET /api/financial/tenant/budgets
 * Budgets avec isolation tenant automatique
 */
router.get('/budgets',
  authenticateJWT,
  tenantIsolationMiddleware({ strictMode: true }),
  FinancialTenantController.getBudgets
);

/**
 * POST /api/financial/tenant/budgets
 * Création budget avec injection tenant
 */
router.post('/budgets',
  authenticateJWT,
  tenantIsolationMiddleware({ strictMode: true }),
  FinancialTenantController.createBudget
);

/**
 * GET /api/financial/tenant/cross-tenant/:tenantId/budgets
 * Accès cross-tenant (ministère uniquement)
 */
router.get('/cross-tenant/:tenantId/budgets',
  authenticateJWT,
  tenantIsolationMiddleware({ 
    allowCrossTenant: true,
    requiredRole: 'Ministre'
  }),
  FinancialTenantController.getCrossTenantBudgets
);

/**
 * GET /api/financial/tenant/accessible-tenants
 * Tenants accessibles
 */
router.get('/accessible-tenants',
  authenticateJWT,
  tenantIsolationMiddleware(),
  FinancialTenantController.getAccessibleTenants
);

/**
 * POST /api/financial/tenant/validate-access
 * Validation d'accès tenant
 */
router.post('/validate-access',
  authenticateJWT,
  tenantIsolationMiddleware(),
  FinancialTenantController.validateTenantAccess
);

export { router as financialTenantRouter };