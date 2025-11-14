/**
 * FICHIER: apps/api/src/modules/restauration/restaurant.routes.ts
 * ROUTES: Module Restauration - Endpoints API
 *
 * DESCRIPTION:
 * Routes pour le module de gestion de la restauration universitaire
 * Restaurants, menus, tickets repas, distributions, denrées
 *
 * ENDPOINTS:
 * RESTAURANTS:
 * - GET /restaurants - Liste des restaurants
 * - POST /restaurants - Créer un restaurant
 * - GET /restaurants/:id - Détails d'un restaurant
 * - PUT /restaurants/:id - Modifier un restaurant
 * - DELETE /restaurants/:id - Supprimer un restaurant
 * - GET /restaurants/:id/statistics - Statistiques d'un restaurant
 *
 * MENUS:
 * - GET /menus - Liste des menus
 * - POST /menus - Créer un menu
 * - GET /menus/:id - Détails d'un menu
 * - PUT /menus/:id - Modifier un menu
 * - DELETE /menus/:id - Supprimer un menu
 * - POST /menus/:id/publish - Publier un menu
 * - POST /menus/:id/validate - Valider un menu
 * - GET /menus/:id/besoins - Calculer besoins en denrées
 *
 * TICKETS:
 * - GET /tickets - Liste des tickets
 * - POST /tickets - Créer un ticket
 * - POST /tickets/batch - Créer plusieurs tickets
 * - POST /tickets/utiliser - Utiliser un ticket
 * - POST /tickets/:id/annuler - Annuler un ticket
 *
 * REPAS:
 * - GET /repas - Liste des repas
 * - POST /repas - Créer un repas (planification)
 * - GET /repas/:id - Détails d'un repas
 * - POST /repas/:id/demarrer - Démarrer service
 * - POST /repas/:id/terminer - Terminer service
 * - GET /repas/:id/statistiques - Statistiques d'un repas
 *
 * DENRÉES:
 * - GET /denrees - Liste des allocations
 * - POST /denrees/allouer - Allouer une denrée
 * - POST /denrees/:id/utiliser - Utiliser une denrée
 * - POST /denrees/:id/retourner - Retourner au stock
 * - GET /denrees/alertes/expiration - Alertes péremption
 *
 * SÉCURITÉ:
 * - Authentification JWT obligatoire
 * - Permissions granulaires par rôle
 * - Rate limiting sur les opérations sensibles
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { Router } from 'express';
import { RestaurantController } from './restaurant.controller';
import { MenuController } from './menu.controller';
import { TicketController } from './ticket.controller';
import { RepasController } from './repas.controller';
import { DenreeController } from './denree.controller';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Rate limiting pour les opérations sensibles
const restaurationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par 15min
  message: {
    error: 'Trop de requêtes restauration, réessayez plus tard.'
  }
});

// Middleware d'authentification pour toutes les routes
router.use(authenticateJWT);

// Middleware de rate limiting
router.use(restaurationLimiter);

// ================================================================================================
// ROUTES RESTAURANTS
// ================================================================================================

/**
 * GET /api/restauration/restaurants
 * Liste des restaurants avec filtres
 * Permissions: restauration:read
 */
router.get('/restaurants',
  checkPermissions(['restauration:read']),
  RestaurantController.getRestaurants
);

/**
 * POST /api/restauration/restaurants
 * Créer un nouveau restaurant
 * Permissions: restauration:write
 */
router.post('/restaurants',
  checkPermissions(['restauration:write']),
  RestaurantController.createRestaurant
);

/**
 * GET /api/restauration/restaurants/:id
 * Détails d'un restaurant
 * Permissions: restauration:read
 */
router.get('/restaurants/:id',
  checkPermissions(['restauration:read']),
  RestaurantController.getRestaurant
);

/**
 * PUT /api/restauration/restaurants/:id
 * Modifier un restaurant
 * Permissions: restauration:write
 */
router.put('/restaurants/:id',
  checkPermissions(['restauration:write']),
  RestaurantController.updateRestaurant
);

/**
 * DELETE /api/restauration/restaurants/:id
 * Supprimer un restaurant (soft delete)
 * Permissions: restauration:write
 */
router.delete('/restaurants/:id',
  checkPermissions(['restauration:write']),
  RestaurantController.deleteRestaurant
);

/**
 * GET /api/restauration/restaurants/:id/statistics
 * Statistiques d'un restaurant
 * Permissions: restauration:read
 */
router.get('/restaurants/:id/statistics',
  checkPermissions(['restauration:read']),
  RestaurantController.getRestaurantStatistics
);

/**
 * PATCH /api/restauration/restaurants/:id/frequentation
 * Mettre à jour la fréquentation moyenne
 * Permissions: restauration:write
 */
router.patch('/restaurants/:id/frequentation',
  checkPermissions(['restauration:write']),
  RestaurantController.updateFrequentationMoyenne
);

// ================================================================================================
// ROUTES MENUS
// ================================================================================================

/**
 * GET /api/restauration/menus
 * Liste des menus avec filtres
 * Permissions: restauration:read
 */
router.get('/menus',
  checkPermissions(['restauration:read']),
  MenuController.getMenus
);

/**
 * POST /api/restauration/menus
 * Créer un nouveau menu
 * Permissions: restauration:write
 */
router.post('/menus',
  checkPermissions(['restauration:write']),
  MenuController.createMenu
);

/**
 * GET /api/restauration/menus/:id
 * Détails d'un menu
 * Permissions: restauration:read
 */
router.get('/menus/:id',
  checkPermissions(['restauration:read']),
  MenuController.getMenu
);

/**
 * PUT /api/restauration/menus/:id
 * Modifier un menu
 * Permissions: restauration:write
 */
router.put('/menus/:id',
  checkPermissions(['restauration:write']),
  MenuController.updateMenu
);

/**
 * DELETE /api/restauration/menus/:id
 * Supprimer un menu (soft delete)
 * Permissions: restauration:write
 */
router.delete('/menus/:id',
  checkPermissions(['restauration:write']),
  MenuController.deleteMenu
);

/**
 * POST /api/restauration/menus/:id/publish
 * Publier un menu (rendre visible aux étudiants)
 * Permissions: restauration:write
 */
router.post('/menus/:id/publish',
  checkPermissions(['restauration:write']),
  MenuController.publishMenu
);

/**
 * POST /api/restauration/menus/:id/validate
 * Valider un menu (par responsable)
 * Permissions: restauration:validate
 */
router.post('/menus/:id/validate',
  checkPermissions(['restauration:validate']),
  MenuController.validateMenu
);

/**
 * GET /api/restauration/menus/:id/besoins
 * Calculer les besoins en denrées pour un menu
 * Permissions: restauration:read
 */
router.get('/menus/:id/besoins',
  checkPermissions(['restauration:read']),
  MenuController.calculateBesoins
);

/**
 * GET /api/restauration/menus/restaurant/:restaurantId/date/:date
 * Obtenir les menus d'un restaurant pour une date
 * Permissions: restauration:read
 */
router.get('/menus/restaurant/:restaurantId/date/:date',
  checkPermissions(['restauration:read']),
  MenuController.getMenusByRestaurantAndDate
);

/**
 * POST /api/restauration/menus/:id/duplicate
 * Dupliquer un menu pour une nouvelle date
 * Permissions: restauration:write
 */
router.post('/menus/:id/duplicate',
  checkPermissions(['restauration:write']),
  MenuController.duplicateMenu
);

// ================================================================================================
// ROUTES TICKETS REPAS
// ================================================================================================

/**
 * GET /api/restauration/tickets
 * Liste des tickets avec filtres
 * Permissions: restauration:read
 */
router.get('/tickets',
  checkPermissions(['restauration:read']),
  TicketController.getTickets
);

/**
 * GET /api/restauration/tickets/numero/:numeroTicket
 * Récupérer un ticket par numéro
 * Permissions: restauration:read
 */
router.get('/tickets/numero/:numeroTicket',
  checkPermissions(['restauration:read']),
  TicketController.getTicketByNumero
);

// Route supprimée: /tickets/etudiant/:etudiantId - tickets anonymes

/**
 * POST /api/restauration/tickets
 * Créer un nouveau ticket
 * Permissions: restauration:write
 */
router.post('/tickets',
  checkPermissions(['restauration:write']),
  TicketController.createTicket
);

/**
 * POST /api/restauration/tickets/batch
 * Créer plusieurs tickets (émission en lot)
 * Permissions: restauration:write
 */
router.post('/tickets/batch',
  checkPermissions(['restauration:write']),
  TicketController.createTicketsBatch
);

/**
 * POST /api/restauration/tickets/utiliser
 * Utiliser un ticket pour un repas
 * Permissions: restauration:write
 */
router.post('/tickets/utiliser',
  checkPermissions(['restauration:write']),
  TicketController.utiliserTicket
);

/**
 * POST /api/restauration/tickets/:id/annuler
 * Annuler un ticket
 * Permissions: restauration:write
 */
router.post('/tickets/:id/annuler',
  checkPermissions(['restauration:write']),
  TicketController.annulerTicket
);

/**
 * POST /api/restauration/tickets/expired/update
 * Mettre à jour les tickets expirés (tâche périodique)
 * Permissions: restauration:admin
 */
router.post('/tickets/expired/update',
  checkPermissions(['restauration:admin']),
  TicketController.updateExpiredTickets
);

// ================================================================================================
// ROUTES REPAS (DISTRIBUTIONS)
// ================================================================================================

/**
 * GET /api/restauration/repas
 * Liste des repas avec filtres
 * Permissions: restauration:read
 */
router.get('/repas',
  checkPermissions(['restauration:read']),
  RepasController.getRepas
);

/**
 * GET /api/restauration/repas/:id
 * Détails d'un repas
 * Permissions: restauration:read
 */
router.get('/repas/:id',
  checkPermissions(['restauration:read']),
  RepasController.getRepasById
);

/**
 * POST /api/restauration/repas
 * Créer une distribution de repas (planification)
 * Permissions: restauration:write
 */
router.post('/repas',
  checkPermissions(['restauration:write']),
  RepasController.createRepas
);

/**
 * POST /api/restauration/repas/:id/demarrer
 * Démarrer un service de repas
 * Permissions: restauration:write
 */
router.post('/repas/:id/demarrer',
  checkPermissions(['restauration:write']),
  RepasController.demarrerService
);

/**
 * POST /api/restauration/repas/:id/terminer
 * Terminer un service et enregistrer les statistiques
 * Permissions: restauration:write
 */
router.post('/repas/:id/terminer',
  checkPermissions(['restauration:write']),
  RepasController.terminerService
);

/**
 * GET /api/restauration/repas/:id/statistiques
 * Calculer les statistiques d'un repas
 * Permissions: restauration:read
 */
router.get('/repas/:id/statistiques',
  checkPermissions(['restauration:read']),
  RepasController.calculerStatistiques
);

/**
 * GET /api/restauration/repas/restaurant/:restaurantId/periode
 * Obtenir les repas d'un restaurant pour une période
 * Permissions: restauration:read
 */
router.get('/repas/restaurant/:restaurantId/periode',
  checkPermissions(['restauration:read']),
  RepasController.getRepasByRestaurantAndPeriode
);

/**
 * POST /api/restauration/repas/:id/annuler
 * Annuler un repas
 * Permissions: restauration:write
 */
router.post('/repas/:id/annuler',
  checkPermissions(['restauration:write']),
  RepasController.annulerRepas
);

// ================================================================================================
// ROUTES DENRÉES (INTÉGRATION STOCKS)
// ================================================================================================

/**
 * GET /api/restauration/denrees
 * Liste des allocations de denrées avec filtres
 * Permissions: restauration:read
 */
router.get('/denrees',
  checkPermissions(['restauration:read']),
  DenreeController.getDenrees
);

/**
 * GET /api/restauration/denrees/restaurant/:restaurantId
 * Récupérer les denrées allouées à un restaurant
 * Permissions: restauration:read
 */
router.get('/denrees/restaurant/:restaurantId',
  checkPermissions(['restauration:read']),
  DenreeController.getDenreesRestaurant
);

/**
 * POST /api/restauration/denrees/allouer
 * Allouer une denrée à un restaurant
 * INTÉGRATION CRITIQUE: Crée mouvement SORTIE dans module Stocks
 * Permissions: restauration:write, stocks:write
 */
router.post('/denrees/allouer',
  checkPermissions(['restauration:write', 'stocks:write']),
  DenreeController.allouerDenree
);

/**
 * POST /api/restauration/denrees/:id/utiliser
 * Enregistrer l'utilisation d'une denrée
 * Permissions: restauration:write
 */
router.post('/denrees/:id/utiliser',
  checkPermissions(['restauration:write']),
  DenreeController.utiliserDenree
);

/**
 * POST /api/restauration/denrees/:id/retourner
 * Retourner une denrée au stock central
 * INTÉGRATION CRITIQUE: Crée mouvement ENTRÉE dans module Stocks
 * Permissions: restauration:write, stocks:write
 */
router.post('/denrees/:id/retourner',
  checkPermissions(['restauration:write', 'stocks:write']),
  DenreeController.retournerDenree
);

/**
 * POST /api/restauration/denrees/:id/perte
 * Enregistrer une perte de denrée
 * Permissions: restauration:write
 */
router.post('/denrees/:id/perte',
  checkPermissions(['restauration:write']),
  DenreeController.enregistrerPerte
);

/**
 * GET /api/restauration/denrees/alertes/expiration
 * Obtenir les alertes de péremption
 * Permissions: restauration:read
 */
router.get('/denrees/alertes/expiration',
  checkPermissions(['restauration:read']),
  DenreeController.getAlertesExpiration
);

/**
 * GET /api/restauration/denrees/:id/historique
 * Obtenir l'historique des mouvements d'une allocation
 * Permissions: restauration:read
 */
router.get('/denrees/:id/historique',
  checkPermissions(['restauration:read']),
  DenreeController.getHistoriqueMouvements
);

export { router as restaurationRoutes };
