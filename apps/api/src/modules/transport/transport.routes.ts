/**
 * FICHIER: apps/api/src/modules/transport/transport.routes.ts
 * ROUTES: Module Transport - Endpoints API
 *
 * DESCRIPTION:
 * Routes pour le module de gestion du transport
 * Véhicules, utilisations, maintenances, chauffeurs, itinéraires, trajets programmés
 *
 * ENDPOINTS:
 * VÉHICULES:
 * - GET /vehicles - Liste des véhicules
 * - POST /vehicles - Créer un véhicule
 * - GET /vehicles/:id - Détails d'un véhicule
 * - PUT /vehicles/:id - Modifier un véhicule
 * - DELETE /vehicles/:id - Supprimer un véhicule
 *
 * UTILISATIONS:
 * - GET /usages - Liste des utilisations
 * - POST /usages - Créer une utilisation
 * - GET /usages/:id - Détails d'une utilisation
 * - PUT /usages/:id - Modifier une utilisation
 * - DELETE /usages/:id - Supprimer une utilisation
 *
 * MAINTENANCES:
 * - GET /maintenances - Liste des maintenances
 * - POST /maintenances - Créer une maintenance
 * - GET /maintenances/:id - Détails d'une maintenance
 * - PUT /maintenances/:id - Modifier une maintenance
 * - DELETE /maintenances/:id - Supprimer une maintenance
 *
 * CHAUFFEURS:
 * - GET /drivers - Liste des chauffeurs
 * - POST /drivers - Créer un chauffeur
 * - GET /drivers/:id - Détails d'un chauffeur
 * - PUT /drivers/:id - Modifier un chauffeur
 * - DELETE /drivers/:id - Supprimer un chauffeur
 * - POST /drivers/:id/assign-vehicle - Affecter un véhicule
 * - POST /drivers/:id/unassign-vehicle - Retirer l'affectation
 * - GET /drivers/available - Chauffeurs disponibles
 * - GET /drivers/alerts - Alertes chauffeurs
 * - GET /drivers/statistics - Statistiques chauffeurs
 *
 * ITINÉRAIRES:
 * - GET /routes - Liste des itinéraires
 * - POST /routes - Créer un itinéraire
 * - GET /routes/:id - Détails d'un itinéraire
 * - PUT /routes/:id - Modifier un itinéraire
 * - DELETE /routes/:id - Supprimer un itinéraire
 * - GET /routes/active - Itinéraires actifs
 *
 * TRAJETS PROGRAMMÉS:
 * - GET /scheduled-trips - Liste des trajets programmés
 * - POST /scheduled-trips - Créer un trajet programmé
 * - GET /scheduled-trips/:id - Détails d'un trajet
 * - PUT /scheduled-trips/:id - Modifier un trajet
 * - DELETE /scheduled-trips/:id - Supprimer un trajet
 * - POST /scheduled-trips/:id/start - Démarrer un trajet
 * - POST /scheduled-trips/:id/complete - Terminer un trajet
 * - POST /scheduled-trips/:id/cancel - Annuler un trajet
 * - GET /scheduled-trips/statistics - Statistiques trajets
 *
 * MÉTRIQUES:
 * - GET /metrics - Métriques globales du transport
 *
 * SÉCURITÉ:
 * - Authentification JWT obligatoire
 * - Permissions granulaires par rôle
 * - Rate limiting sur les opérations sensibles
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router } from 'express';
import { TransportController, vehicleValidators, usageValidators, maintenanceValidators } from './transport.controller';
import { DriversController, driverValidators } from './drivers.controller';
import { RoutesController, routeValidators } from './routes.controller';
import { ScheduledTripsController, scheduledTripValidators } from './scheduled-trips.controller';
import { TransportMetricsController } from './transport-metrics.controller';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Rate limiting pour les opérations sensibles
const transportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requêtes par 15min
  message: {
    error: 'Trop de requêtes transport, réessayez plus tard.'
  }
});

// Middleware d'authentification pour toutes les routes
router.use(authenticateJWT);

// Middleware de rate limiting
router.use(transportLimiter);

// ================================================================================================
// ROUTES VÉHICULES
// ================================================================================================

/**
 * GET /api/transport/vehicles
 * Liste des véhicules avec filtres et pagination
 * Permissions: transport:read
 */
router.get('/vehicles',
  checkPermissions(['transport:read']),
  TransportController.getVehicles
);

/**
 * POST /api/transport/vehicles
 * Créer un nouveau véhicule
 * Permissions: transport:write
 */
router.post('/vehicles',
  checkPermissions(['transport:write']),
  vehicleValidators.create,
  TransportController.createVehicle
);

/**
 * GET /api/transport/vehicles/:id
 * Détails d'un véhicule
 * Permissions: transport:read
 */
router.get('/vehicles/:id',
  checkPermissions(['transport:read']),
  vehicleValidators.update, // Utilise les validateurs d'update pour l'ID
  TransportController.getVehicle
);

/**
 * PUT /api/transport/vehicles/:id
 * Modifier un véhicule
 * Permissions: transport:write
 */
router.put('/vehicles/:id',
  checkPermissions(['transport:write']),
  vehicleValidators.update,
  TransportController.updateVehicle
);

/**
 * DELETE /api/transport/vehicles/:id
 * Supprimer un véhicule
 * Permissions: transport:write
 */
router.delete('/vehicles/:id',
  checkPermissions(['transport:write']),
  vehicleValidators.update,
  TransportController.deleteVehicle
);

// ================================================================================================
// ROUTES UTILISATIONS
// ================================================================================================

/**
 * GET /api/transport/usages
 * Liste des utilisations avec filtres et pagination
 * Permissions: transport:read
 */
router.get('/usages',
  checkPermissions(['transport:read']),
  TransportController.getUsages
);

/**
 * POST /api/transport/usages
 * Créer une nouvelle utilisation
 * Permissions: transport:write
 */
router.post('/usages',
  checkPermissions(['transport:write']),
  usageValidators.create,
  TransportController.createUsage
);

/**
 * GET /api/transport/usages/:id
 * Détails d'une utilisation
 * Permissions: transport:read
 */
router.get('/usages/:id',
  checkPermissions(['transport:read']),
  TransportController.getUsage
);

/**
 * PUT /api/transport/usages/:id
 * Modifier une utilisation
 * Permissions: transport:write
 */
router.put('/usages/:id',
  checkPermissions(['transport:write']),
  usageValidators.update,
  TransportController.updateUsage
);

/**
 * DELETE /api/transport/usages/:id
 * Supprimer une utilisation
 * Permissions: transport:write
 */
router.delete('/usages/:id',
  checkPermissions(['transport:write']),
  TransportController.deleteUsage
);

// ================================================================================================
// ROUTES MAINTENANCES
// ================================================================================================

/**
 * GET /api/transport/maintenances
 * Liste des maintenances avec filtres et pagination
 * Permissions: transport:read
 */
router.get('/maintenances',
  checkPermissions(['transport:read']),
  TransportController.getMaintenances
);

/**
 * POST /api/transport/maintenances
 * Créer une nouvelle maintenance
 * Permissions: transport:write
 */
router.post('/maintenances',
  checkPermissions(['transport:write']),
  maintenanceValidators.create,
  TransportController.createMaintenance
);

/**
 * GET /api/transport/maintenances/:id
 * Détails d'une maintenance
 * Permissions: transport:read
 */
router.get('/maintenances/:id',
  checkPermissions(['transport:read']),
  TransportController.getMaintenance
);

/**
 * PUT /api/transport/maintenances/:id
 * Modifier une maintenance
 * Permissions: transport:write
 */
router.put('/maintenances/:id',
  checkPermissions(['transport:write']),
  maintenanceValidators.update,
  TransportController.updateMaintenance
);

/**
 * DELETE /api/transport/maintenances/:id
 * Supprimer une maintenance
 * Permissions: transport:write
 */
router.delete('/maintenances/:id',
  checkPermissions(['transport:write']),
  TransportController.deleteMaintenance
);

// ================================================================================================
// ROUTES CHAUFFEURS (DRIVERS)
// ================================================================================================

/**
 * GET /api/transport/drivers/available
 * Obtenir les chauffeurs disponibles
 * Permissions: transport:read
 * Note: Cette route doit être AVANT /drivers/:id pour éviter les conflits
 */
router.get('/drivers/available',
  checkPermissions(['transport:read']),
  DriversController.getAvailableDrivers
);

/**
 * GET /api/transport/drivers/alerts
 * Obtenir les alertes chauffeurs (permis expirés, visites médicales)
 * Permissions: transport:read
 * Note: Cette route doit être AVANT /drivers/:id pour éviter les conflits
 */
router.get('/drivers/alerts',
  checkPermissions(['transport:read']),
  DriversController.getDriverAlerts
);

/**
 * GET /api/transport/drivers/statistics
 * Obtenir les statistiques des chauffeurs
 * Permissions: transport:read
 * Note: Cette route doit être AVANT /drivers/:id pour éviter les conflits
 */
router.get('/drivers/statistics',
  checkPermissions(['transport:read']),
  DriversController.getDriverStatistics
);

/**
 * GET /api/transport/drivers
 * Liste des chauffeurs avec filtres et pagination
 * Permissions: transport:read
 */
router.get('/drivers',
  checkPermissions(['transport:read']),
  DriversController.getDrivers
);

/**
 * POST /api/transport/drivers
 * Créer un nouveau chauffeur
 * Permissions: transport:write
 */
router.post('/drivers',
  checkPermissions(['transport:write']),
  driverValidators.create,
  DriversController.createDriver
);

/**
 * GET /api/transport/drivers/:id
 * Détails d'un chauffeur
 * Permissions: transport:read
 */
router.get('/drivers/:id',
  checkPermissions(['transport:read']),
  DriversController.getDriver
);

/**
 * PUT /api/transport/drivers/:id
 * Mettre à jour un chauffeur
 * Permissions: transport:write
 */
router.put('/drivers/:id',
  checkPermissions(['transport:write']),
  driverValidators.update,
  DriversController.updateDriver
);

/**
 * DELETE /api/transport/drivers/:id
 * Supprimer un chauffeur
 * Permissions: transport:write
 */
router.delete('/drivers/:id',
  checkPermissions(['transport:write']),
  DriversController.deleteDriver
);

/**
 * POST /api/transport/drivers/:id/assign-vehicle
 * Affecter un véhicule à un chauffeur
 * Permissions: transport:write
 */
router.post('/drivers/:id/assign-vehicle',
  checkPermissions(['transport:write']),
  DriversController.assignVehicle
);

/**
 * POST /api/transport/drivers/:id/unassign-vehicle
 * Retirer l'affectation d'un véhicule
 * Permissions: transport:write
 */
router.post('/drivers/:id/unassign-vehicle',
  checkPermissions(['transport:write']),
  DriversController.unassignVehicle
);

// ================================================================================================
// ROUTES ITINÉRAIRES (ROUTES)
// ================================================================================================

/**
 * GET /api/transport/routes/active
 * Obtenir les itinéraires actifs
 * Permissions: transport:read
 * Note: Cette route doit être AVANT /routes/:id pour éviter les conflits
 */
router.get('/routes/active',
  checkPermissions(['transport:read']),
  RoutesController.getActiveRoutes
);

/**
 * GET /api/transport/routes
 * Liste des itinéraires avec filtres et pagination
 * Permissions: transport:read
 */
router.get('/routes',
  checkPermissions(['transport:read']),
  RoutesController.getRoutes
);

/**
 * POST /api/transport/routes
 * Créer un nouvel itinéraire
 * Permissions: transport:write
 */
router.post('/routes',
  checkPermissions(['transport:write']),
  routeValidators.create,
  RoutesController.createRoute
);

/**
 * GET /api/transport/routes/:id
 * Détails d'un itinéraire
 * Permissions: transport:read
 */
router.get('/routes/:id',
  checkPermissions(['transport:read']),
  RoutesController.getRoute
);

/**
 * PUT /api/transport/routes/:id
 * Mettre à jour un itinéraire
 * Permissions: transport:write
 */
router.put('/routes/:id',
  checkPermissions(['transport:write']),
  routeValidators.update,
  RoutesController.updateRoute
);

/**
 * DELETE /api/transport/routes/:id
 * Supprimer un itinéraire
 * Permissions: transport:write
 */
router.delete('/routes/:id',
  checkPermissions(['transport:write']),
  RoutesController.deleteRoute
);

// ================================================================================================
// ROUTES TRAJETS PROGRAMMÉS (SCHEDULED TRIPS)
// ================================================================================================

/**
 * GET /api/transport/scheduled-trips/statistics
 * Obtenir les statistiques des trajets programmés
 * Permissions: transport:read
 * Note: Cette route doit être AVANT /scheduled-trips/:id pour éviter les conflits
 */
router.get('/scheduled-trips/statistics',
  checkPermissions(['transport:read']),
  ScheduledTripsController.getTripsStatistics
);

/**
 * GET /api/transport/scheduled-trips
 * Liste des trajets programmés avec filtres et pagination
 * Permissions: transport:read
 */
router.get('/scheduled-trips',
  checkPermissions(['transport:read']),
  ScheduledTripsController.getScheduledTrips
);

/**
 * POST /api/transport/scheduled-trips
 * Créer un nouveau trajet programmé
 * Permissions: transport:write
 */
router.post('/scheduled-trips',
  checkPermissions(['transport:write']),
  scheduledTripValidators.create,
  ScheduledTripsController.createScheduledTrip
);

/**
 * GET /api/transport/scheduled-trips/:id
 * Détails d'un trajet programmé
 * Permissions: transport:read
 */
router.get('/scheduled-trips/:id',
  checkPermissions(['transport:read']),
  ScheduledTripsController.getScheduledTrip
);

/**
 * PUT /api/transport/scheduled-trips/:id
 * Mettre à jour un trajet programmé
 * Permissions: transport:write
 */
router.put('/scheduled-trips/:id',
  checkPermissions(['transport:write']),
  scheduledTripValidators.update,
  ScheduledTripsController.updateScheduledTrip
);

/**
 * DELETE /api/transport/scheduled-trips/:id
 * Supprimer un trajet programmé
 * Permissions: transport:write
 */
router.delete('/scheduled-trips/:id',
  checkPermissions(['transport:write']),
  ScheduledTripsController.deleteScheduledTrip
);

/**
 * POST /api/transport/scheduled-trips/:id/start
 * Démarrer un trajet programmé
 * Permissions: transport:write
 */
router.post('/scheduled-trips/:id/start',
  checkPermissions(['transport:write']),
  scheduledTripValidators.start,
  ScheduledTripsController.startTrip
);

/**
 * POST /api/transport/scheduled-trips/:id/complete
 * Terminer un trajet programmé
 * Permissions: transport:write
 */
router.post('/scheduled-trips/:id/complete',
  checkPermissions(['transport:write']),
  scheduledTripValidators.complete,
  ScheduledTripsController.completeTrip
);

/**
 * POST /api/transport/scheduled-trips/:id/cancel
 * Annuler un trajet programmé
 * Permissions: transport:write
 */
router.post('/scheduled-trips/:id/cancel',
  checkPermissions(['transport:write']),
  scheduledTripValidators.cancel,
  ScheduledTripsController.cancelTrip
);

// ================================================================================================
// ROUTES MÉTRIQUES GLOBALES
// ================================================================================================

/**
 * GET /api/transport/metrics
 * Obtenir toutes les métriques du module transport
 * Permissions: transport:read
 */
router.get('/metrics',
  authenticateJWT,
  checkPermissions(['transport:read']),
  TransportMetricsController.getMetrics
);

export { router as transportRoutes };
