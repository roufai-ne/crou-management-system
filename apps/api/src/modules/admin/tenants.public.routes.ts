/**
 * FICHIER: apps/api/src/modules/admin/tenants.public.routes.ts
 * ROUTES PUBLIQUES: Endpoints tenants accessibles à tous les utilisateurs authentifiés
 *
 * DESCRIPTION:
 * Routes publiques pour les tenants (hiérarchie, etc.)
 * Nécessitent authentification JWT mais pas de permissions spéciales
 *
 * ROUTES:
 * - GET /hierarchy - Hiérarchie Ministère → Régions → CROUs
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router, Request, Response } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Tenant, TenantType } from '../../../../../packages/database/src/entities/Tenant.entity';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();

/**
 * GET /hierarchy
 * Récupérer la hiérarchie complète des tenants (Ministère → Régions → CROUs)
 * Accessible à tous les utilisateurs authentifiés
 */
router.get('/hierarchy',
  authenticateJWT,
  async (req: Request, res: Response) => {
    try {
      const tenantRepo = AppDataSource.getRepository(Tenant);

      // Récupérer le ministère (tenant racine)
      const ministry = await tenantRepo.findOne({
        where: { type: TenantType.MINISTRY, isActive: true }
      });

      if (!ministry) {
        return res.status(404).json({
          success: false,
          error: 'Ministère non trouvé',
          message: 'Aucun tenant de type ministère trouvé'
        });
      }

      // Récupérer toutes les régions
      const regions = await tenantRepo.find({
        where: { type: TenantType.REGION, isActive: true },
        order: { name: 'ASC' }
      });

      // Récupérer tous les CROUs
      const crous = await tenantRepo.find({
        where: { type: TenantType.CROU, isActive: true },
        order: { name: 'ASC' }
      });

      // Construire la hiérarchie
      const hierarchy = {
        ministry: {
          id: ministry.id,
          name: ministry.name,
          code: ministry.code
        },
        regions: regions.map(region => ({
          id: region.id,
          name: region.name,
          code: region.code,
          crous: crous
            .filter(crou => crou.parentId === region.id)
            .map(crou => ({
              id: crou.id,
              name: crou.name,
              code: crou.code
            }))
        }))
      };

      res.json({
        success: true,
        data: hierarchy
      });
    } catch (error) {
      logger.error('Erreur récupération hiérarchie tenants:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la hiérarchie'
      });
    }
  }
);

export default router;
