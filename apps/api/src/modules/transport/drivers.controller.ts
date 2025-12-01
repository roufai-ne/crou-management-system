/**
 * FICHIER: apps/api/src/modules/transport/drivers.controller.ts
 * CONTROLLER: DriversController - Gestion des chauffeurs
 *
 * DESCRIPTION:
 * Contrôleur pour les endpoints de gestion des chauffeurs
 * Validation, authentification et permissions
 *
 * ENDPOINTS:
 * - GET    /drivers          - Liste des chauffeurs
 * - POST   /drivers          - Créer un chauffeur
 * - GET    /drivers/:id      - Détails d'un chauffeur
 * - PUT    /drivers/:id      - Mettre à jour un chauffeur
 * - DELETE /drivers/:id      - Supprimer un chauffeur
 * - POST   /drivers/:id/assign-vehicle - Affecter un véhicule
 * - POST   /drivers/:id/unassign-vehicle - Retirer l'affectation
 * - GET    /drivers/available - Chauffeurs disponibles
 * - GET    /drivers/alerts    - Alertes chauffeurs
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { Response } from 'express';
import { TypedRequest } from '@/shared/types/express.types';
import { body, param, validationResult } from 'express-validator';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import { DriversService } from './drivers.service';
import { logger } from '@/shared/utils/logger';
import { LicenseType } from '../../../../../packages/database/src/entities/Driver.entity';

export class DriversController {
  private static driversService = new DriversService();

  /**
   * GET /api/transport/drivers
   * Liste des chauffeurs avec filtres et pagination
   */
  static async getDrivers(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const filters = {
        search: req.query.search as string,
        status: req.query.status as string,
        licenseType: req.query.licenseType as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20
      };

      const result = await DriversController.driversService.getDrivers(effectiveTenantId, filters);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getDrivers:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des chauffeurs',
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      });
    }
  }

  /**
   * GET /api/transport/drivers/:id
   * Détails d'un chauffeur
   */
  static async getDriver(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const { id } = req.params;
      const result = await DriversController.driversService.getDriverById(id, tenantContext.tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getDriver:', error);
      const statusCode = error instanceof Error && error.message === 'Chauffeur non trouvé' ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la récupération du chauffeur'
      });
    }
  }

  /**
   * POST /api/transport/drivers
   * Créer un nouveau chauffeur
   */
  static async createDriver(req: Request, res: Response) {
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

      const result = await DriversController.driversService.createDriver(
        req.body,
        tenantId,
        createdBy
      );

      res.status(201).json(result);
    } catch (error) {
      logger.error('Erreur createDriver:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la création du chauffeur'
      });
    }
  }

  /**
   * PUT /api/transport/drivers/:id
   * Mettre à jour un chauffeur
   */
  static async updateDriver(req: Request, res: Response) {
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
      const result = await DriversController.driversService.updateDriver(
        id,
        req.body,
        tenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur updateDriver:', error);
      const statusCode = error instanceof Error && error.message === 'Chauffeur non trouvé' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du chauffeur'
      });
    }
  }

  /**
   * DELETE /api/transport/drivers/:id
   * Supprimer un chauffeur
   */
  static async deleteDriver(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await DriversController.driversService.deleteDriver(id, tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur deleteDriver:', error);
      const statusCode = error instanceof Error && error.message === 'Chauffeur non trouvé' ? 404 : 400;
      res.status(statusCode).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de la suppression du chauffeur'
      });
    }
  }

  /**
   * POST /api/transport/drivers/:id/assign-vehicle
   * Affecter un véhicule à un chauffeur
   */
  static async assignVehicle(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const updatedBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const { vehicleId } = req.body;

      if (!vehicleId) {
        return res.status(400).json({
          success: false,
          message: 'vehicleId est requis'
        });
      }

      const result = await DriversController.driversService.assignVehicle(
        id,
        vehicleId,
        tenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur assignVehicle:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors de l\'affectation du véhicule'
      });
    }
  }

  /**
   * POST /api/transport/drivers/:id/unassign-vehicle
   * Retirer l'affectation d'un véhicule
   */
  static async unassignVehicle(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const updatedBy = (req as any).user?.email || 'system';

      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const { id } = req.params;
      const result = await DriversController.driversService.unassignVehicle(
        id,
        tenantId,
        updatedBy
      );

      res.json(result);
    } catch (error) {
      logger.error('Erreur unassignVehicle:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Erreur lors du retrait de l\'affectation'
      });
    }
  }

  /**
   * GET /api/transport/drivers/available
   * Obtenir les chauffeurs disponibles
   */
  static async getAvailableDrivers(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const result = await DriversController.driversService.getAvailableDrivers(tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getAvailableDrivers:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des chauffeurs disponibles'
      });
    }
  }

  /**
   * GET /api/transport/drivers/alerts
   * Obtenir les alertes (permis expirés, visites médicales)
   */
  static async getDriverAlerts(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const result = await DriversController.driversService.getDriverAlerts(tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getDriverAlerts:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des alertes'
      });
    }
  }

  /**
   * GET /api/transport/drivers/statistics
   * Obtenir les statistiques des chauffeurs
   */
  static async getDriverStatistics(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({
          success: false,
          message: 'Tenant non identifié'
        });
      }

      const result = await DriversController.driversService.getDriverStatistics(tenantId);
      res.json(result);
    } catch (error) {
      logger.error('Erreur getDriverStatistics:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
}

// Validateurs
export const driverValidators = {
  create: [
    body('employeeId').notEmpty().withMessage('Le matricule est requis'),
    body('firstName').notEmpty().withMessage('Le prénom est requis'),
    body('lastName').notEmpty().withMessage('Le nom est requis'),
    body('email').isEmail().withMessage('Email invalide'),
    body('phone').notEmpty().withMessage('Le téléphone est requis'),
    body('licenseNumber').notEmpty().withMessage('Le numéro de permis est requis'),
    body('licenseType')
      .isIn([LicenseType.A, LicenseType.B, LicenseType.C, LicenseType.D, LicenseType.E])
      .withMessage('Type de permis invalide'),
    body('licenseIssueDate').isISO8601().withMessage('Date d\'obtention du permis invalide'),
    body('licenseExpiryDate').isISO8601().withMessage('Date d\'expiration du permis invalide'),
    body('hireDate').isISO8601().withMessage('Date d\'embauche invalide')
  ],

  update: [
    param('id').isUUID().withMessage('ID invalide'),
    body('email').optional().isEmail().withMessage('Email invalide'),
    body('licenseType')
      .optional()
      .isIn([LicenseType.A, LicenseType.B, LicenseType.C, LicenseType.D, LicenseType.E])
      .withMessage('Type de permis invalide'),
    body('licenseIssueDate').optional().isISO8601().withMessage('Date d\'obtention du permis invalide'),
    body('licenseExpiryDate').optional().isISO8601().withMessage('Date d\'expiration du permis invalide')
  ]
};
