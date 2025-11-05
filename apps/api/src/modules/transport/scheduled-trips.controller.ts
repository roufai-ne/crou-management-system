/**
 * FICHIER: apps/api/src/modules/transport/scheduled-trips.controller.ts
 * CONTROLLER: ScheduledTripsController - Gestion des trajets programmés
 *
 * DESCRIPTION:
 * Contrôleur pour les endpoints de gestion des trajets programmés
 * Validation, authentification et permissions
 *
 * ENDPOINTS:
 * - GET    /scheduled-trips            - Liste des trajets programmés
 * - POST   /scheduled-trips            - Créer un trajet programmé
 * - GET    /scheduled-trips/:id        - Détails d'un trajet
 * - PUT    /scheduled-trips/:id        - Mettre à jour un trajet
 * - DELETE /scheduled-trips/:id        - Supprimer un trajet
 * - POST   /scheduled-trips/:id/start  - Démarrer un trajet
 * - POST   /scheduled-trips/:id/complete - Terminer un trajet
 * - POST   /scheduled-trips/:id/cancel - Annuler un trajet
 * - GET    /scheduled-trips/statistics - Statistiques des trajets
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { ScheduledTripsService } from './scheduled-trips.service';
import { logger } from '@/shared/utils/logger';
import { TripStatus, CancellationReason } from '../../../../../packages/database/src/entities/ScheduledTrip.entity';

export class ScheduledTripsController {
  private static scheduledTripsService = new ScheduledTripsService();

  /**
   * GET /api/transport/scheduled-trips
   * Liste des trajets programmés avec filtres et pagination
   */
  static async getScheduledTrips(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        routeId: req.query.routeId as string,
        vehicleId: req.query.vehicleId as string,
        driverId: req.query.driverId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await ScheduledTripsController.scheduledTripsService.getScheduledTrips(
        tenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      logger.error('Erreur getScheduledTrips:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des trajets programmés',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * GET /api/transport/scheduled-trips/:id
   * Détails d'un trajet programmé
   */
  static async getScheduledTrip(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await ScheduledTripsController.scheduledTripsService.getScheduledTripById(
        id,
        tenantId
      );
      res.json(result);
    } catch (error) {
      logger.error('Erreur getScheduledTrip:', error);
      const statusCode = error instanceof Error && error.message === 'Trajet programmé non trouvé' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération du trajet'
      });
    }
  }

  /**
   * POST /api/transport/scheduled-trips
   * Créer un nouveau trajet programmé
   */
  static async createScheduledTrip(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const createdBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const result = await ScheduledTripsController.scheduledTripsService.createScheduledTrip(
        req.body,
        tenantId,
        createdBy
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur createScheduledTrip:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création du trajet programmé'
      });
    }
  }

  /**
   * PUT /api/transport/scheduled-trips/:id
   * Mettre à jour un trajet programmé
   */
  static async updateScheduledTrip(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const updatedBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await ScheduledTripsController.scheduledTripsService.updateScheduledTrip(
        id,
        req.body,
        tenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur updateScheduledTrip:', error);
      const statusCode = error instanceof Error && error.message === 'Trajet programmé non trouvé' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du trajet programmé'
      });
    }
  }

  /**
   * DELETE /api/transport/scheduled-trips/:id
   * Supprimer un trajet programmé
   */
  static async deleteScheduledTrip(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await ScheduledTripsController.scheduledTripsService.deleteScheduledTrip(
        id,
        tenantId
      );
      res.json(result);
    } catch (error) {
      logger.error('Erreur deleteScheduledTrip:', error);
      const statusCode = error instanceof Error && error.message === 'Trajet programmé non trouvé' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression du trajet programmé'
      });
    }
  }

  /**
   * POST /api/transport/scheduled-trips/:id/start
   * Démarrer un trajet programmé
   */
  static async startTrip(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const updatedBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const { startKilometers } = req.body;

      if (startKilometers === undefined || startKilometers === null) {
        return res.status(400).json({
          success: false,
          message: 'Le kilométrage de départ (startKilometers) est requis'
        });
      }

      const result = await ScheduledTripsController.scheduledTripsService.startTrip(
        id,
        { startKilometers },
        tenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur startTrip:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du démarrage du trajet'
      });
    }
  }

  /**
   * POST /api/transport/scheduled-trips/:id/complete
   * Terminer un trajet programmé
   */
  static async completeTrip(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const updatedBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const { endKilometers, passengersCount, fuelCost, tollCost, otherCosts, revenue, rating, notes } = req.body;

      if (endKilometers === undefined || endKilometers === null) {
        return res.status(400).json({
          success: false,
          message: 'Le kilométrage de fin (endKilometers) est requis'
        });
      }

      const result = await ScheduledTripsController.scheduledTripsService.completeTrip(
        id,
        {
          endKilometers,
          passengersCount,
          fuelCost,
          tollCost,
          otherCosts,
          revenue,
          rating,
          notes
        },
        tenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur completeTrip:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la finalisation du trajet'
      });
    }
  }

  /**
   * POST /api/transport/scheduled-trips/:id/cancel
   * Annuler un trajet programmé
   */
  static async cancelTrip(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const tenantId = (req as any).user?.tenantId;
      const cancelledBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const { reason, details } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'La raison d\'annulation est requise'
        });
      }

      const result = await ScheduledTripsController.scheduledTripsService.cancelTrip(
        id,
        { reason, details },
        tenantId,
        cancelledBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur cancelTrip:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'annulation du trajet'
      });
    }
  }

  /**
   * GET /api/transport/scheduled-trips/statistics
   * Obtenir les statistiques des trajets programmés
   */
  static async getTripsStatistics(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const filters = {
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string
      };

      const result = await ScheduledTripsController.scheduledTripsService.getTripsStatistics(
        tenantId,
        filters
      );
      res.json(result);
    } catch (error) {
      logger.error('Erreur getTripsStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
}

// Validateurs
export const scheduledTripValidators = {
  create: [
    body('routeId').isUUID().withMessage('L\'ID de l\'itinéraire est invalide'),
    body('scheduledDate').isISO8601().withMessage('La date programmée est invalide'),
    body('scheduledDepartureTime').notEmpty().withMessage('L\'heure de départ est requise'),
    body('scheduledArrivalTime').optional().isString(),
    body('vehicleId').optional().isUUID().withMessage('L\'ID du véhicule est invalide'),
    body('driverId').optional().isUUID().withMessage('L\'ID du chauffeur est invalide'),
    body('passengersCount').optional().isInt({ min: 0 }).withMessage('Le nombre de passagers doit être positif'),
    body('seatsAvailable').optional().isInt({ min: 0 }).withMessage('Le nombre de sièges disponibles doit être positif')
  ],

  update: [
    param('id').isUUID().withMessage('ID invalide'),
    body('routeId').optional().isUUID().withMessage('L\'ID de l\'itinéraire est invalide'),
    body('scheduledDate').optional().isISO8601().withMessage('La date programmée est invalide'),
    body('vehicleId').optional().isUUID().withMessage('L\'ID du véhicule est invalide'),
    body('driverId').optional().isUUID().withMessage('L\'ID du chauffeur est invalide'),
    body('passengersCount').optional().isInt({ min: 0 }).withMessage('Le nombre de passagers doit être positif')
  ],

  start: [
    param('id').isUUID().withMessage('ID invalide'),
    body('startKilometers').isNumeric().withMessage('Le kilométrage de départ est requis et doit être numérique')
  ],

  complete: [
    param('id').isUUID().withMessage('ID invalide'),
    body('endKilometers').isNumeric().withMessage('Le kilométrage de fin est requis et doit être numérique'),
    body('passengersCount').optional().isInt({ min: 0 }).withMessage('Le nombre de passagers doit être positif'),
    body('fuelCost').optional().isNumeric().withMessage('Le coût du carburant doit être numérique'),
    body('tollCost').optional().isNumeric().withMessage('Le coût du péage doit être numérique'),
    body('otherCosts').optional().isNumeric().withMessage('Les autres coûts doivent être numériques'),
    body('revenue').optional().isNumeric().withMessage('Le revenu doit être numérique'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('La note doit être entre 0 et 5')
  ],

  cancel: [
    param('id').isUUID().withMessage('ID invalide'),
    body('reason')
      .isIn([
        CancellationReason.WEATHER,
        CancellationReason.VEHICLE_BREAKDOWN,
        CancellationReason.DRIVER_UNAVAILABLE,
        CancellationReason.LOW_DEMAND,
        CancellationReason.ROAD_CLOSED,
        CancellationReason.OTHER
      ])
      .withMessage('Raison d\'annulation invalide'),
    body('details').optional().isString().withMessage('Les détails doivent être une chaîne de caractères')
  ]
};
