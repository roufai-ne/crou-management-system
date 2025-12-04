/**
 * FICHIER: apps\api\src\modules\stocks\stocks.routes.ts
 * ROUTES: Module Stocks - Endpoints API
 * 
 * DESCRIPTION:
 * Routes pour le module de gestion des stocks
 * Inventaires, mouvements, alertes
 * 
 * ENDPOINTS:
 * - GET /stocks - Liste des stocks
 * - POST /stocks - Créer un stock
 * - GET /stocks/:id - Détails d'un stock
 * - PUT /stocks/:id - Modifier un stock
 * - DELETE /stocks/:id - Supprimer un stock
 * - GET /movements - Mouvements de stock
 * - POST /movements - Créer un mouvement
 * - GET /alerts - Alertes de stock
 * - POST /alerts/:id/resolve - Résoudre une alerte
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
import { StocksController, stockValidators } from './stocks.controller';
import { SuppliersController, supplierValidators } from './suppliers.controller';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { injectTenantIdMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Rate limiting pour les opérations sensibles
const stocksLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par 15min
  message: {
    error: 'Trop de requêtes stocks, réessayez plus tard.'
  }
});

// Middleware d'authentification pour toutes les routes
router.use(authenticateJWT);

// Middleware de rate limiting
router.use(stocksLimiter);

// ================================================================================================
// ROUTES STOCKS
// ================================================================================================

/**
 * GET /api/stocks/stocks
 * Liste des stocks avec filtres et pagination
 * Permissions: stocks:read
 */
router.get('/stocks',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getStocks
);

/**
 * POST /api/stocks/stocks
 * Créer un nouveau stock
 * Permissions: stocks:write
 */
router.post('/stocks',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  stockValidators.create,
  StocksController.createStock
);

/**
 * GET /api/stocks/stocks/:id
 * Détails d'un stock
 * Permissions: stocks:read
 */
router.get('/stocks/:id',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  stockValidators.update, // Utilise les validateurs d'update pour l'ID
  StocksController.getStock
);

/**
 * PUT /api/stocks/stocks/:id
 * Modifier un stock
 * Permissions: stocks:write
 */
router.put('/stocks/:id',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  stockValidators.update,
  StocksController.updateStock
);

/**
 * DELETE /api/stocks/stocks/:id
 * Supprimer un stock
 * Permissions: stocks:write
 */
router.delete('/stocks/:id',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  stockValidators.update,
  StocksController.deleteStock
);

// ================================================================================================
// ROUTES MOUVEMENTS DE STOCK
// ================================================================================================

/**
 * GET /api/stocks/movements
 * Liste des mouvements de stock
 * Permissions: stocks:read
 */
router.get('/movements',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getMovements
);

/**
 * POST /api/stocks/movements
 * Créer un mouvement de stock
 * Permissions: stocks:write
 */
router.post('/movements',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  stockValidators.movement,
  StocksController.createMovement
);

/**
 * GET /api/stocks/movements/:id
 * Détails d'un mouvement
 * Permissions: stocks:read
 */
router.get('/movements/:id',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getMovement
);

/**
 * PUT /api/stocks/movements/:id
 * Modifier un mouvement
 * Permissions: stocks:write
 */
router.put('/movements/:id',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.updateMovement
);

/**
 * POST /api/stocks/movements/:id/confirm
 * Confirmer un mouvement
 * Permissions: stocks:write
 */
router.post('/movements/:id/confirm',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.confirmMovement
);

// ================================================================================================
// ROUTES ALERTES DE STOCK
// ================================================================================================

/**
 * GET /api/stocks/alerts
 * Liste des alertes de stock
 * Permissions: stocks:read
 */
router.get('/alerts',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getAlerts
);

/**
 * GET /api/stocks/alerts/:id
 * Détails d'une alerte
 * Permissions: stocks:read
 */
router.get('/alerts/:id',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getAlert
);

/**
 * POST /api/stocks/alerts/:id/resolve
 * Résoudre une alerte (reconnaître ou résoudre)
 * Permissions: stocks:write
 */
router.post('/alerts/:id/resolve',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.resolveAlert
);

/**
 * POST /api/stocks/alerts/:id/escalate
 * Escalader une alerte
 * Permissions: stocks:validate
 */
router.post('/alerts/:id/escalate',
  checkPermissions(['stocks:validate']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.escalateAlert
);

// ================================================================================================
// ROUTES INVENTAIRE
// ================================================================================================

/**
 * GET /api/stocks/inventory
 * Inventaire des stocks
 * Permissions: stocks:read
 */
router.get('/inventory',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getInventory
);

/**
 * POST /api/stocks/inventory/start
 * Démarrer un inventaire
 * Permissions: stocks:write
 */
router.post('/inventory/start',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.startInventory
);

/**
 * POST /api/stocks/inventory/:id/complete
 * Finaliser un inventaire
 * Permissions: stocks:write
 */
router.post('/inventory/:id/complete',
  checkPermissions(['stocks:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.completeInventory
);

// ================================================================================================
// ROUTES RAPPORTS STOCKS
// ================================================================================================

/**
 * GET /api/stocks/reports/stock-levels
 * Rapport des niveaux de stock
 * Permissions: stocks:read
 */
router.get('/reports/stock-levels',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getStockLevelsReport
);

/**
 * GET /api/stocks/reports/movements
 * Rapport des mouvements de stock
 * Permissions: stocks:read
 */
router.get('/reports/movements',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getMovementsReport
);

/**
 * GET /api/stocks/reports/alerts
 * Rapport des alertes de stock
 * Permissions: stocks:read
 */
router.get('/reports/alerts',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.getAlertsReport
);

/**
 * GET /api/stocks/reports/export/:format
 * Exporter des rapports stocks (Excel/PDF)
 * Permissions: stocks:read
 */
router.get('/reports/export/:format',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  StocksController.exportReport
);

// ================================================================================================
// ROUTES DASHBOARD STOCKS
// ================================================================================================

/**
 * GET /api/stocks/dashboard/kpis
 * KPIs stocks pour le dashboard
 * Permissions: stocks:read
 */
router.get('/dashboard/kpis',
  checkPermissions(['stocks:read']),
  StocksController.getStocksKPIs
);

/**
 * GET /api/stocks/dashboard/evolution
 * Évolution des indicateurs stocks
 * Permissions: stocks:read
 */
router.get('/dashboard/evolution',
  checkPermissions(['stocks:read']),
  StocksController.getStocksEvolution
);

/**
 * GET /api/stocks/dashboard/alerts
 * Alertes stocks pour le dashboard
 * Permissions: stocks:read
 */
router.get('/dashboard/alerts',
  checkPermissions(['stocks:read']),
  StocksController.getStocksAlerts
);

// ================================================================================================
// ROUTES FOURNISSEURS
// ================================================================================================

/**
 * GET /api/stocks/suppliers
 * Liste des fournisseurs avec filtres
 * Permissions: stocks:read
 */
router.get('/suppliers',
  checkPermissions(['stocks:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  SuppliersController.getSuppliers
);

/**
 * POST /api/stocks/suppliers
 * Créer un nouveau fournisseur
 * Permissions: stocks:write
 */
router.post('/suppliers',
  checkPermissions(['stocks:write']),
  supplierValidators.create,
  SuppliersController.createSupplier
);

/**
 * GET /api/stocks/suppliers/stats/overview
 * Statistiques des fournisseurs
 * Permissions: stocks:read
 */
router.get('/suppliers/stats/overview',
  checkPermissions(['stocks:read']),
  SuppliersController.getSuppliersStats
);

/**
 * GET /api/stocks/suppliers/:id
 * Détails d'un fournisseur
 * Permissions: stocks:read
 */
router.get('/suppliers/:id',
  checkPermissions(['stocks:read']),
  supplierValidators.update,
  SuppliersController.getSupplier
);

/**
 * PUT /api/stocks/suppliers/:id
 * Mettre à jour un fournisseur
 * Permissions: stocks:write
 */
router.put('/suppliers/:id',
  checkPermissions(['stocks:write']),
  supplierValidators.update,
  SuppliersController.updateSupplier
);

/**
 * DELETE /api/stocks/suppliers/:id
 * Supprimer un fournisseur
 * Permissions: stocks:write
 */
router.delete('/suppliers/:id',
  checkPermissions(['stocks:write']),
  supplierValidators.update,
  SuppliersController.deleteSupplier
);

export { router as stocksRoutes };
