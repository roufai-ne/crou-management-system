/**
 * FICHIER: apps/api/src/modules/dashboard/dashboard.routes.ts
 * ROUTES: Module Dashboard - Routes centralisées
 * 
 * DESCRIPTION:
 * Routes centralisées pour le dashboard principal
 * Agrégation des données de tous les modules
 * 
 * ENDPOINTS:
 * - GET /kpis/global - KPIs globaux
 * - GET /kpis/modules - KPIs par module
 * - GET /evolution - Évolution temporelle
 * - GET /expenses - Répartition des dépenses
 * - GET /alerts - Alertes récentes
 * - GET /activities - Activités récentes
 * - POST /alerts/:id/acknowledge - Marquer alerte comme lue
 * 
 * SÉCURITÉ:
 * - Authentification JWT obligatoire
 * - Permissions granulaires par rôle
 * - Rate limiting sur les requêtes
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { injectTenantIdMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Rate limiting pour les requêtes dashboard
const dashboardLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requêtes par minute
  message: {
    error: 'Trop de requêtes dashboard, réessayez plus tard.'
  }
});

// Activer l'auth uniquement hors développement
const requireAuth = process.env.NODE_ENV !== 'development';

// Helper pour activer conditionnellement un middleware
const maybe = (mw: any) => (req: any, res: any, next: any) => requireAuth ? mw(req, res, next) : next();

// Middleware d'authentification (désactivé en développement)
if (requireAuth) {
  router.use(authenticateJWT);
}

// Middleware de rate limiting
router.use(dashboardLimiter);

// ================================================================================================
// ROUTE AGRÉGÉE
// ================================================================================================

/**
 * GET /api/dashboard/data
 * Données agrégées complètes du dashboard
 * Permissions: dashboard:read
 */
router.get('/data',
  maybe(checkPermissions(['dashboard:read'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.getData
);

// ================================================================================================
// ROUTES KPIs
// ================================================================================================

/**
 * GET /api/dashboard/kpis/global
 * KPIs globaux du système
 * Permissions: dashboard:read
 */
router.get('/kpis/global',
  maybe(checkPermissions(['dashboard:read'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.getGlobalKPIs
);

/**
 * GET /api/dashboard/kpis/modules
 * KPIs par module
 * Permissions: dashboard:read
 */
router.get('/kpis/modules',
  maybe(checkPermissions(['dashboard:read'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.getModuleKPIs
);

// ================================================================================================
// ROUTES DONNÉES TEMPORELLES
// ================================================================================================

/**
 * GET /api/dashboard/evolution
 * Évolution temporelle des indicateurs
 * Permissions: dashboard:read
 */
router.get('/evolution',
  maybe(checkPermissions(['dashboard:read'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.getEvolutionData
);

/**
 * GET /api/dashboard/expenses
 * Répartition des dépenses par catégorie
 * Permissions: dashboard:read
 */
router.get('/expenses',
  maybe(checkPermissions(['dashboard:read'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.getExpenseBreakdown
);

// ================================================================================================
// ROUTES ALERTES ET ACTIVITÉS
// ================================================================================================

/**
 * GET /api/dashboard/alerts
 * Alertes récentes
 * Permissions: dashboard:read
 */
router.get('/alerts',
  maybe(checkPermissions(['dashboard:read'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.getAlerts
);

/**
 * GET /api/dashboard/activities
 * Activités récentes
 * Permissions: dashboard:read
 */
router.get('/activities',
  maybe(checkPermissions(['dashboard:read'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.getRecentActivities
);

/**
 * POST /api/dashboard/alerts/:id/acknowledge
 * Marquer une alerte comme lue
 * Permissions: dashboard:write
 */
router.post('/alerts/:alertId/acknowledge',
  maybe(checkPermissions(['dashboard:write'])),
  injectTenantIdMiddleware({ strictMode: false }),
  DashboardController.acknowledgeAlert
);

export { router as dashboardRoutes };
