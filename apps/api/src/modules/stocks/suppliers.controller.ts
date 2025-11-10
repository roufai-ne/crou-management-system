/**
 * FICHIER: apps/api/src/modules/stocks/suppliers.controller.ts
 * CONTROLLER: Suppliers - Gestion des fournisseurs
 *
 * DESCRIPTION:
 * Contrôleur pour la gestion CRUD des fournisseurs
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import {
  SuppliersService,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  SupplierFilters
} from './suppliers.service';
import { SupplierType, SupplierStatus } from '../../../../../packages/database/src/entities/Supplier.entity';
import { logger } from '@/shared/utils/logger';

export const supplierValidators = {
  create: [
    body('code').notEmpty().withMessage('Code fournisseur requis'),
    body('nom').notEmpty().withMessage('Nom fournisseur requis'),
    body('type').isIn(Object.values(SupplierType)).withMessage('Type fournisseur invalide'),
  ],
  update: [
    param('id').isUUID().withMessage('ID fournisseur invalide'),
  ],
};

export class SuppliersController {
  /**
   * GET /api/stocks/suppliers
   * Liste des fournisseurs avec filtres
   */
  static async getSuppliers(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant non identifié' });
      }

      const filters: SupplierFilters = {
        search: req.query.search as string,
        type: req.query.type as SupplierType,
        status: req.query.status as SupplierStatus,
        isPreference: req.query.isPreference === 'true',
        isCertifie: req.query.isCertifie === 'true'
      };

      const result = await SuppliersService.getSuppliers(tenantId, filters);

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Erreur getSuppliers:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/stocks/suppliers/:id
   * Détails d'un fournisseur
   */
  static async getSupplier(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant non identifié' });
      }

      const supplier = await SuppliersService.getSupplierById(tenantId, id);

      res.json({ success: true, data: { supplier } });
    } catch (error: any) {
      logger.error('Erreur getSupplier:', error);
      res.status(404).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/stocks/suppliers
   * Créer un nouveau fournisseur
   */
  static async createSupplier(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;

      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const supplierData: CreateSupplierDTO = req.body;
      const supplier = await SuppliersService.createSupplier(tenantId, userId, supplierData);

      res.status(201).json({ success: true, data: { supplier } });
    } catch (error: any) {
      logger.error('Erreur createSupplier:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * PUT /api/stocks/suppliers/:id
   * Mettre à jour un fournisseur
   */
  static async updateSupplier(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const userId = (req as any).user?.userId;
      const { id } = req.params;

      if (!tenantId || !userId) {
        return res.status(401).json({ success: false, error: 'Authentification manquante' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const updateData: UpdateSupplierDTO = req.body;
      const supplier = await SuppliersService.updateSupplier(tenantId, userId, id, updateData);

      res.json({ success: true, data: { supplier } });
    } catch (error: any) {
      logger.error('Erreur updateSupplier:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/stocks/suppliers/:id
   * Supprimer un fournisseur
   */
  static async deleteSupplier(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;
      const { id } = req.params;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant non identifié' });
      }

      const result = await SuppliersService.deleteSupplier(tenantId, id);

      res.json({ success: true, data: result });
    } catch (error: any) {
      logger.error('Erreur deleteSupplier:', error);
      res.status(400).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/stocks/suppliers/stats/overview
   * Statistiques des fournisseurs
   */
  static async getSuppliersStats(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({ success: false, error: 'Tenant non identifié' });
      }

      const stats = await SuppliersService.getSuppliersStats(tenantId);

      res.json({ success: true, data: stats });
    } catch (error: any) {
      logger.error('Erreur getSuppliersStats:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
