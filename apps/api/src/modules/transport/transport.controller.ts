import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  TransportService,
  CreateVehicleDTO,
  UpdateVehicleDTO,
  CreateUsageDTO,
  UpdateUsageDTO,
  CreateMaintenanceDTO,
  UpdateMaintenanceDTO
} from './transport.service';

export const vehicleValidators = {
  create: [
    body('immatriculation').notEmpty().withMessage('Numéro immatriculation requis'),
    body('marque').notEmpty().withMessage('Marque requise'),
    body('modele').notEmpty().withMessage('Modèle requis'),
    body('type').notEmpty().withMessage('Type requis'),
  ],
  update: [
    param('id').isUUID().withMessage('ID véhicule invalide'),
  ],
};

export const usageValidators = {
  create: [
    body('vehicleId').notEmpty().withMessage('Véhicule obligatoire'),
    body('conducteur').notEmpty().withMessage('Conducteur obligatoire'),
    body('kilometrageDebut').isInt({min:0}).withMessage('Kilométrage début'),
    body('kilometrageFin').isInt({min:0}).withMessage('Kilométrage fin'),
    body('description').notEmpty().withMessage('Description obligatoire'),
    body('type').notEmpty().withMessage('Type obligatoire'),
    body('dateDebut').notEmpty(),
    body('dateFin').notEmpty(),
    body('date').notEmpty(),
  ],
  update: [
    param('id').isUUID().withMessage('ID usage invalide'),
  ],
};

export const maintenanceValidators = {
  create: [
    body('vehicleId').notEmpty().withMessage('Véhicule obligatoire'),
    body('title').notEmpty().withMessage('Titre obligatoire'),
    body('type').notEmpty().withMessage('Type obligatoire'),
    body('kilometrage').isInt({min:0}).withMessage('Kilométrage'),
    body('dateDebut').notEmpty(),
  ],
  update: [
    param('id').isUUID().withMessage('ID maintenance invalide'),
  ],
};

export class TransportController {
  static async getVehicles(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const data = await TransportService.getVehicles(tenantId, { page, limit, filters });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  static async getVehicle(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      const vehicle = await TransportService.getVehicleById(tenantId, id);
      res.json({ success: true, data: { vehicle }});
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
  static async createVehicle(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const vehicle = await TransportService.createVehicle(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: { vehicle }});
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async updateVehicle(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const vehicle = await TransportService.updateVehicle(tenantId, userId, id, req.body);
      res.json({ success: true, data: { vehicle }});
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async deleteVehicle(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      await TransportService.deleteVehicle(tenantId, id);
      res.json({ success: true, message: 'Véhicule supprimé' });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  static async getUsages(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const data = await TransportService.getUsages(tenantId, { page, limit, filters });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  static async getUsage(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      const usage = await TransportService.getUsageById(tenantId, id);
      res.json({ success: true, data: { usage } });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
  static async createUsage(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const usage = await TransportService.createUsage(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: { usage } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async updateUsage(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const usage = await TransportService.updateUsage(tenantId, userId, id, req.body);
      res.json({ success: true, data: { usage } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async deleteUsage(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      await TransportService.deleteUsage(tenantId, id);
      res.json({ success: true, message: 'Usage supprimé' });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  static async getMaintenances(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const data = await TransportService.getMaintenances(tenantId, { page, limit, filters });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  static async getMaintenance(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      const maintenance = await TransportService.getMaintenanceById(tenantId, id);
      res.json({ success: true, data: { maintenance } });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
  static async createMaintenance(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const maintenance = await TransportService.createMaintenance(tenantId, userId, req.body);
      res.status(201).json({ success: true, data: { maintenance } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async updateMaintenance(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const maintenance = await TransportService.updateMaintenance(tenantId, userId, id, req.body);
      res.json({ success: true, data: { maintenance } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async deleteMaintenance(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;
      await TransportService.deleteMaintenance(tenantId, id);
      res.json({ success: true, message: 'Maintenance supprimée' });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
}