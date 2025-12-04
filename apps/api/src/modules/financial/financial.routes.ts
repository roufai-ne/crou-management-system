/**
 * FICHIER: apps\api\src\modules\financial\financial.routes.ts
 * ROUTES: Module Financier - Endpoints API
 * 
 * DESCRIPTION:
 * Routes pour le module de gestion financière
 * Budgets, transactions, validations, rapports
 * 
 * ENDPOINTS:
 * - GET /budgets - Liste des budgets
 * - POST /budgets - Créer un budget
 * - GET /budgets/:id - Détails d'un budget
 * - PUT /budgets/:id - Modifier un budget
 * - DELETE /budgets/:id - Supprimer un budget
 * - POST /budgets/:id/validate - Valider un budget
 * - GET /transactions - Liste des transactions
 * - POST /transactions - Créer une transaction
 * - GET /reports - Rapports financiers
 * 
 * SÉCURITÉ:
 * - Authentification JWT obligatoire
 * - Permissions granulaires par rôle
 * - Rate limiting sur les opérations sensibles
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router } from 'express';
import { FinancialController, budgetValidators, transactionValidators } from './financial.controller';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { injectTenantIdMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Rate limiting pour les opérations sensibles
const financialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requêtes par 15min
  message: {
    error: 'Trop de requêtes financières, réessayez plus tard.'
  }
});

// Middleware d'authentification pour toutes les routes
router.use(authenticateJWT);

// Middleware de rate limiting
router.use(financialLimiter);

// ================================================================================================
// ROUTES BUDGETS
// ================================================================================================

/**
 * GET /api/financial/budgets
 * Liste des budgets avec filtres et pagination
 * Permissions: financial:read
 */
router.get('/budgets',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getBudgets
);

/**
 * POST /api/financial/budgets
 * Créer un nouveau budget
 * Permissions: financial:write
 */
router.post('/budgets',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  budgetValidators.create,
  FinancialController.createBudget
);

/**
 * GET /api/financial/budgets/:id
 * Détails d'un budget
 * Permissions: financial:read
 */
router.get('/budgets/:id',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  budgetValidators.update, // Utilise les validateurs d'update pour l'ID
  FinancialController.getBudget
);

/**
 * PUT /api/financial/budgets/:id
 * Modifier un budget
 * Permissions: financial:write
 */
router.put('/budgets/:id',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  budgetValidators.update,
  FinancialController.updateBudget
);

/**
 * DELETE /api/financial/budgets/:id
 * Supprimer un budget (seulement en draft)
 * Permissions: financial:write
 */
router.delete('/budgets/:id',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  budgetValidators.update,
  FinancialController.deleteBudget
);

/**
 * POST /api/financial/budgets/:id/validate
 * Valider un budget (approbation/rejet)
 * Permissions: financial:validate
 */
router.post('/budgets/:id/validate',
  checkPermissions(['financial:validate']),
  injectTenantIdMiddleware({ strictMode: false }),
  budgetValidators.validate,
  FinancialController.validateBudget
);

/**
 * POST /api/financial/budgets/:id/submit
 * Soumettre un budget pour validation
 * Permissions: financial:write
 */
router.post('/budgets/:id/submit',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  budgetValidators.update,
  FinancialController.submitBudget
);

// ================================================================================================
// ROUTES TRANSACTIONS
// ================================================================================================

/**
 * GET /api/financial/transactions
 * Liste des transactions avec filtres et pagination
 * Permissions: financial:read
 */
router.get('/transactions',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getTransactions
);

/**
 * POST /api/financial/transactions
 * Créer une nouvelle transaction
 * Permissions: financial:write
 */
router.post('/transactions',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  transactionValidators.create,
  FinancialController.createTransaction
);

/**
 * GET /api/financial/transactions/stats
 * Statistiques des transactions
 * Permissions: financial:read
 */
router.get('/transactions/stats',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getTransactionStats
);

/**
 * GET /api/financial/transactions/:id
 * Détails d'une transaction
 * Permissions: financial:read
 */
router.get('/transactions/:id',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getTransaction
);

/**
 * PUT /api/financial/transactions/:id
 * Modifier une transaction
 * Permissions: financial:write
 */
router.put('/transactions/:id',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.updateTransaction
);

/**
 * POST /api/financial/transactions/:id/validate
 * Valider une transaction
 * Permissions: financial:validate
 */
router.post('/transactions/:id/validate',
  checkPermissions(['financial:validate']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.validateTransaction
);

// ================================================================================================
// ROUTES CATÉGORIES BUDGÉTAIRES
// ================================================================================================

/**
 * GET /api/financial/categories
 * Liste des catégories budgétaires
 * Permissions: financial:read
 */
router.get('/categories',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getCategories
);

/**
 * POST /api/financial/categories
 * Créer une catégorie budgétaire
 * Permissions: financial:write
 */
router.post('/categories',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.createCategory
);

/**
 * PUT /api/financial/categories/:id
 * Modifier une catégorie budgétaire
 * Permissions: financial:write
 */
router.put('/categories/:id',
  checkPermissions(['financial:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.updateCategory
);

// ================================================================================================
// ROUTES RAPPORTS
// ================================================================================================

/**
 * GET /api/financial/reports
 * Générer des rapports financiers
 * Permissions: financial:read
 */
router.get('/reports',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getReports
);

/**
 * GET /api/financial/reports/budget-execution
 * Rapport d'exécution budgétaire
 * Permissions: financial:read
 */
router.get('/reports/budget-execution',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getBudgetExecutionReport
);

/**
 * GET /api/financial/reports/transactions
 * Rapport des transactions
 * Permissions: financial:read
 */
router.get('/reports/transactions',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getTransactionsReport
);

/**
 * GET /api/financial/reports/export/:format
 * Exporter des rapports (Excel/PDF)
 * Permissions: financial:read
 */
router.get('/reports/export/:format',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.exportReport
);

// ================================================================================================
// ROUTES VALIDATION WORKFLOW
// ================================================================================================

/**
 * GET /api/financial/validations/pending
 * Liste des validations en attente
 * Permissions: financial:validate
 */
router.get('/validations/pending',
  checkPermissions(['financial:validate']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getPendingValidations
);

/**
 * GET /api/financial/validations/history
 * Historique des validations
 * Permissions: financial:read
 */
router.get('/validations/history',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getValidationHistory
);

// ================================================================================================
// ROUTES DASHBOARD FINANCIER
// ================================================================================================

/**
 * GET /api/financial/dashboard/kpis
 * KPIs financiers pour le dashboard
 * Permissions: financial:read
 */
router.get('/dashboard/kpis',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getFinancialKPIs
);

/**
 * GET /api/financial/dashboard/evolution
 * Évolution des indicateurs financiers
 * Permissions: financial:read
 */
router.get('/dashboard/evolution',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getFinancialEvolution
);

/**
 * GET /api/financial/dashboard/alerts
 * Alertes financières
 * Permissions: financial:read
 */
router.get('/dashboard/alerts',
  checkPermissions(['financial:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  FinancialController.getFinancialAlerts
);

export { router as financialRoutes };
