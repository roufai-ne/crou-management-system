/**
 * FICHIER: apps\api\src\modules\financial\financial.controller.isolated.ts
 * CONTRÔLEUR: Exemple d'utilisation de l'isolation tenant
 * 
 * DESCRIPTION:
 * Contrôleur financier avec isolation tenant complète
 * Démontre l'utilisation des middlewares et décorateurs d'isolation
 * 
 * FONCTIONNALITÉS:
 * - Isolation automatique des données par tenant
 * - Validation des accès cross-tenant
 * - Permissions spéciales pour le ministère
 * - Audit des accès cross-tenant
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { 
  injectTenantIdMiddleware,
  validateCrossTenantMiddleware,
  ministerialAccessMiddleware,
  autoTenantFilterMiddleware,
  strictTenantIsolation,
  flexibleTenantIsolation,
  ministerialTenantAccess
} from '@/shared/middlewares/tenant-isolation.middleware';
import { 
  TenantIsolated,
  AllowCrossTenant,
  RequireTenantRole,
  InjectTenantContext
} from '@/shared/decorators/tenant.decorator';
import { 
  TenantIsolationUtils,
  WithTenantIsolation,
  LogTenantAccess
} from '@/shared/utils/tenant-isolation.utils';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();

/**
 * Exemple d'entité Budget (simulée)
 */
interface Budget {
  id: string;
  tenantId: string;
  name: string;
  amount: number;
  year: number;
  category: string;
  createdAt: Date;
}

/**
 * Classe contrôleur avec isolation tenant
 */
class FinancialControllerIsolated {
  
  /**
   * GET /api/financial/budgets
   * Liste des budgets avec isolation stricte
   */
  @TenantIsolated({ strictMode: true })
  @LogTenantAccess('Liste des budgets')
  static async getBudgets(req: Request, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      
      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant'
        });
      }

      // Simulation de récupération des budgets avec filtre tenant
      const budgets: Budget[] = [
        {
          id: '1',
          tenantId: tenantContext.tenantId,
          name: 'Budget Restauration 2024',
          amount: 500000,
          year: 2024,
          category: 'restauration',
          createdAt: new Date()
        },
        {
          id: '2',
          tenantId: tenantContext.tenantId,
          name: 'Budget Logement 2024',
          amount: 300000,
          year: 2024,
          category: 'logement',
          createdAt: new Date()
        }
      ];

      res.json({
        success: true,
        data: {
          budgets,
          tenantId: tenantContext.tenantId,
          total: budgets.length
        }
      });

    } catch (error) {
      logger.error('Erreur récupération budgets:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des budgets'
      });
    }
  }

  /**
   * GET /api/financial/budgets/:id
   * Détail d'un budget avec validation tenant
   */
  @WithTenantIsolation({ strictMode: true })
  static async getBudgetById(req: Request, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const budgetId = req.params.id;

      // Simulation de récupération avec validation tenant
      const budget: Budget = {
        id: budgetId,
        tenantId: tenantContext!.tenantId,
        name: 'Budget Restauration 2024',
        amount: 500000,
        year: 2024,
        category: 'restauration',
        createdAt: new Date()
      };

      // Validation tenant
      const validation = TenantIsolationUtils.validateTenantData(
        budget,
        tenantContext!,
        { strictMode: true }
      );

      if (!validation.isValid) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: validation.reason
        });
      }

      res.json({
        success: true,
        data: { budget }
      });

    } catch (error) {
      logger.error('Erreur récupération budget:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du budget'
      });
    }
  }

  /**
   * POST /api/financial/budgets
   * Création d'un budget avec injection tenant automatique
   */
  @InjectTenantContext
  static async createBudget(req: Request, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      
      // Injection automatique du tenant ID
      const budgetData = TenantIsolationUtils.injectTenantId(
        req.body,
        tenantContext!,
        { strictMode: true }
      );

      // Simulation de création
      const newBudget: Budget = {
        id: `budget_${Date.now()}`,
        ...budgetData,
        createdAt: new Date()
      };

      res.status(201).json({
        success: true,
        data: { budget: newBudget },
        message: 'Budget créé avec succès'
      });

    } catch (error) {
      logger.error('Erreur création budget:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du budget'
      });
    }
  }

  /**
   * GET /api/financial/cross-tenant/:tenantId/budgets
   * Accès cross-tenant avec permissions spéciales
   */
  @AllowCrossTenant({ requiredRole: 'MINISTERE_ADMIN' })
  @RequireTenantRole('MINISTERE_ADMIN')
  static async getCrossTenantBudgets(req: Request, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const targetTenantId = req.params.tenantId;

      // Simulation de récupération cross-tenant
      const budgets: Budget[] = [
        {
          id: '1',
          tenantId: targetTenantId,
          name: 'Budget Cross-Tenant',
          amount: 750000,
          year: 2024,
          category: 'cross-tenant',
          createdAt: new Date()
        }
      ];

      res.json({
        success: true,
        data: {
          budgets,
          sourceTenant: tenantContext!.tenantId,
          targetTenant: targetTenantId,
          crossTenantAccess: true
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
   * GET /api/financial/ministry/all-budgets
   * Vue globale pour le ministère
   */
  static async getMinistryGlobalView(req: Request, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      // Simulation de vue globale ministérielle
      const allBudgets: Budget[] = [
        {
          id: '1',
          tenantId: 'crou-paris',
          name: 'Budget Paris',
          amount: 1000000,
          year: 2024,
          category: 'global',
          createdAt: new Date()
        },
        {
          id: '2',
          tenantId: 'crou-lyon',
          name: 'Budget Lyon',
          amount: 800000,
          year: 2024,
          category: 'global',
          createdAt: new Date()
        }
      ];

      res.json({
        success: true,
        data: {
          budgets: allBudgets,
          viewType: 'ministry_global',
          accessLevel: 'extended',
          totalBudgets: allBudgets.length
        }
      });

    } catch (error) {
      logger.error('Erreur vue globale ministère:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la vue globale'
      });
    }
  }
}

// Routes avec middlewares d'isolation tenant

/**
 * Routes avec isolation stricte (CROU uniquement)
 */
router.get('/budgets', 
  authenticateJWT,
  checkPermissions(['financial:read']),
  ...strictTenantIsolation,
  FinancialControllerIsolated.getBudgets
);

router.get('/budgets/:id',
  authenticateJWT,
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: true }),
  FinancialControllerIsolated.getBudgetById
);

router.post('/budgets',
  authenticateJWT,
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ injectTenantId: true }),
  autoTenantFilterMiddleware({ strictMode: true }),
  FinancialControllerIsolated.createBudget
);

/**
 * Routes avec accès cross-tenant flexible
 */
router.get('/cross-tenant/:tenantId/budgets',
  authenticateJWT,
  checkPermissions(['financial:read', 'cross_tenant:access']),
  ...flexibleTenantIsolation,
  validateCrossTenantMiddleware({
    allowCrossTenant: true,
    requiredPermissions: ['cross_tenant:access']
  }),
  FinancialControllerIsolated.getCrossTenantBudgets
);

/**
 * Routes avec accès ministériel étendu
 */
router.get('/ministry/all-budgets',
  authenticateJWT,
  checkPermissions(['financial:read', 'ministry:global_view']),
  ...ministerialTenantAccess,
  FinancialControllerIsolated.getMinistryGlobalView
);

/**
 * Route de test pour l'isolation tenant
 */
router.get('/test/isolation',
  authenticateJWT,
  injectTenantIdMiddleware({ strictMode: true }),
  async (req: Request, res: Response) => {
    const tenantContext = TenantIsolationUtils.extractTenantContext(req);
    const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

    res.json({
      success: true,
      data: {
        tenantContext,
        hasExtendedAccess,
        headers: {
          tenantId: req.headers['x-tenant-id'],
          tenantType: req.headers['x-tenant-type']
        },
        isolation: {
          enabled: true,
          strictMode: true,
          crossTenantAllowed: hasExtendedAccess
        }
      }
    });
  }
);

export default router;
