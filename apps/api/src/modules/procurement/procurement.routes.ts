/**
 * FICHIER: apps/api/src/modules/procurement/procurement.routes.ts
 * ROUTES: API Procurement (achats)
 * 
 * DESCRIPTION:
 * Configuration des routes pour le module procurement
 * Authentification, permissions et rate limiting
 * 
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2025
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  ProcurementController,
  purchaseOrderValidators
} from './procurement.controller';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import { injectTenantIdMiddleware } from '@/shared/middlewares/tenant-isolation.middleware';

const router: Router = Router();

// Rate limiter pour les opérations sensibles
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: 'Trop de requêtes, réessayez plus tard'
});

// Appliquer l'authentification JWT à toutes les routes
router.use(authenticateJWT);

/**
 * GET /api/procurement/purchase-orders
 * Liste des bons de commande
 * Permissions: procurement:read
 */
router.get(
  '/purchase-orders',
  checkPermissions(['procurement:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  ProcurementController.getPurchaseOrders
);

/**
 * GET /api/procurement/purchase-orders/:id
 * Détails d'un bon de commande
 * Permissions: procurement:read
 */
router.get(
  '/purchase-orders/:id',
  checkPermissions(['procurement:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  ProcurementController.getPurchaseOrder
);

/**
 * POST /api/procurement/purchase-orders
 * Créer un nouveau bon de commande
 * Permissions: procurement:write
 */
router.post(
  '/purchase-orders',
  limiter,
  checkPermissions(['procurement:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  purchaseOrderValidators.create,
  ProcurementController.createPurchaseOrder
);

/**
 * POST /api/procurement/purchase-orders/:id/submit
 * Soumettre un BC pour approbation
 * Permissions: procurement:write
 */
router.post(
  '/purchase-orders/:id/submit',
  limiter,
  checkPermissions(['procurement:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  purchaseOrderValidators.submit,
  ProcurementController.submitPurchaseOrder
);

/**
 * POST /api/procurement/purchase-orders/:id/approve
 * Approuver un BC (Directeur uniquement)
 * Permissions: procurement:approve
 */
router.post(
  '/purchase-orders/:id/approve',
  limiter,
  checkPermissions(['procurement:approve']),
  injectTenantIdMiddleware({ strictMode: false }),
  purchaseOrderValidators.approve,
  ProcurementController.approvePurchaseOrder
);

/**
 * POST /api/procurement/purchase-orders/:id/order
 * Marquer comme commandé
 * Permissions: procurement:write
 */
router.post(
  '/purchase-orders/:id/order',
  limiter,
  checkPermissions(['procurement:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  ProcurementController.markAsOrdered
);

/**
 * POST /api/procurement/purchase-orders/:id/receive
 * Réceptionner un BC (magasinier)
 * Permissions: procurement:receive
 */
router.post(
  '/purchase-orders/:id/receive',
  limiter,
  checkPermissions(['procurement:receive']),
  injectTenantIdMiddleware({ strictMode: false }),
  purchaseOrderValidators.receive,
  ProcurementController.receivePurchaseOrder
);

/**
 * POST /api/procurement/purchase-orders/:id/cancel
 * Annuler un BC
 * Permissions: procurement:approve (seul le directeur peut annuler)
 */
router.post(
  '/purchase-orders/:id/cancel',
  limiter,
  checkPermissions(['procurement:approve']),
  injectTenantIdMiddleware({ strictMode: false }),
  purchaseOrderValidators.cancel,
  ProcurementController.cancelPurchaseOrder
);

export default router;
