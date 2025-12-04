import { Response } from 'express';
import { TypedRequest } from '@/shared/types/express.types';
import { body, param, validationResult } from 'express-validator';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import {
  TransportService
} from './transport.service';
import { CreateVehicleDto, UpdateVehicleDto } from './dtos/vehicle.dto';
import { CreateUsageDto, UpdateUsageDto } from './dtos/usage.dto';
import { CreateMaintenanceDto, UpdateMaintenanceDto } from './dtos/maintenance.dto';

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
    body('kilometrageDebut').isInt({ min: 0 }).withMessage('Kilométrage début'),
    body('kilometrageFin').isInt({ min: 0 }).withMessage('Kilométrage fin'),
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
    body('kilometrage').isInt({ min: 0 }).withMessage('Kilométrage'),
    body('dateDebut').notEmpty(),
  ],
  update: [
    param('id').isUUID().withMessage('ID maintenance invalide'),
  ],
};

export class TransportController {
  static async getVehicles(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req as any);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId
        ? targetTenantId
        : tenantContext.tenantId;

      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const data = await TransportService.getVehicles(effectiveTenantId, { page: Number(page), limit: Number(limit), filters });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  static async getVehicle(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const { id } = req.params;
      const vehicle = await TransportService.getVehicleById(tenantContext.tenantId, id);
      res.json({ success: true, data: { vehicle } });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
  static async createVehicle(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const userId = req.user?.userId;
      if (!userId) throw new Error('User ID missing');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const vehicle = await TransportService.createVehicle(tenantContext.tenantId, userId, req.body);
      res.status(201).json({ success: true, data: { vehicle } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async updateVehicle(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const userId = req.user?.userId;
      if (!userId) throw new Error('User ID missing');
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const vehicle = await TransportService.updateVehicle(tenantContext.tenantId, userId, id, req.body);
      res.json({ success: true, data: { vehicle } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async deleteVehicle(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const { id } = req.params;
      await TransportService.deleteVehicle(tenantContext.tenantId, id);
      res.json({ success: true, message: 'Véhicule supprimé' });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  static async getUsages(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req as any);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId
        ? targetTenantId
        : tenantContext.tenantId;

      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const data = await TransportService.getUsages(effectiveTenantId, { page: Number(page), limit: Number(limit), filters });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  static async getUsage(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const { id } = req.params;
      const usage = await TransportService.getUsageById(tenantContext.tenantId, id);
      res.json({ success: true, data: { usage } });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
  static async createUsage(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const userId = req.user?.userId;
      if (!userId) throw new Error('User ID missing');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const usage = await TransportService.createUsage(tenantContext.tenantId, userId, req.body);
      res.status(201).json({ success: true, data: { usage } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async updateUsage(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const userId = req.user?.userId;
      if (!userId) throw new Error('User ID missing');
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const usage = await TransportService.updateUsage(tenantContext.tenantId, userId, id, req.body);
      res.json({ success: true, data: { usage } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async deleteUsage(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const { id } = req.params;
      await TransportService.deleteUsage(tenantContext.tenantId, id);
      res.json({ success: true, message: 'Usage supprimé' });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }

  static async getMaintenances(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req as any);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId
        ? targetTenantId
        : tenantContext.tenantId;

      const { page = 1, limit = 20 } = req.query;
      const filters = req.query;
      const data = await TransportService.getMaintenances(effectiveTenantId, { page: Number(page), limit: Number(limit), filters });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
  static async getMaintenance(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const { id } = req.params;
      const maintenance = await TransportService.getMaintenanceById(tenantContext.tenantId, id);
      res.json({ success: true, data: { maintenance } });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
  static async createMaintenance(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const userId = req.user?.userId;
      if (!userId) throw new Error('User ID missing');
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const maintenance = await TransportService.createMaintenance(tenantContext.tenantId, userId, req.body);
      res.status(201).json({ success: true, data: { maintenance } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async updateMaintenance(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const userId = req.user?.userId;
      if (!userId) throw new Error('User ID missing');
      const { id } = req.params;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const maintenance = await TransportService.updateMaintenance(tenantContext.tenantId, userId, id, req.body);
      res.json({ success: true, data: { maintenance } });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }
  static async deleteMaintenance(req: TypedRequest, res: Response) {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req as any);
      if (!tenantContext) throw new Error('Tenant context missing');
      const { id } = req.params;
      await TransportService.deleteMaintenance(tenantContext.tenantId, id);
      res.json({ success: true, message: 'Maintenance supprimée' });
    } catch (error: any) {
      res.status(404).json({ success: false, error: error.message });
    }
  }
}