/**
 * FICHIER: apps\api\src\modules\housing\housing.controller.ts
 * CONTRÔLEUR: Gestion des logements CROU
 *
 * DESCRIPTION:
 * Contrôleur pour la gestion CRUD des logements (cités universitaires)
 * Gestion des chambres, occupations et maintenance
 *
 * FONCTIONNALITÉS:
 * - CRUD complet des logements
 * - Gestion des chambres par logement
 * - Suivi des occupations
 * - Planification de la maintenance
 * - Calcul des taux d'occupation
 * - Filtrage et recherche avancée
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Request, Response } from 'express';
import { Router } from 'express';
import { authenticateJWT } from '@/shared/middlewares/auth.middleware';
import { checkPermissions } from '@/shared/middlewares/permissions.middleware';
import {
  injectTenantIdMiddleware
} from '@/shared/middlewares/tenant-isolation.middleware';
import { auditMiddleware } from '@/shared/middlewares/audit.middleware';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import {
  Housing,
  HousingType,
  HousingStatus,
  HousingCategory
} from '../../../../../packages/database/src/entities/Housing.entity';
import { Room } from '../../../../../packages/database/src/entities/Room.entity';
import {
  HousingOccupancy,
  OccupancyStatus
} from '../../../../../packages/database/src/entities/HousingOccupancy.entity';
import { MaintenanceStatus } from '../../../../../packages/database/src/entities/HousingMaintenance.entity';
import { AuditService } from '@/shared/services/audit.service';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { logger } from '@/shared/utils/logger';

const router: Router = Router();
const auditService = new AuditService();

/**
 * Interface pour les filtres de recherche logements
 */
interface HousingSearchFilters {
  search?: string;
  type?: HousingType;
  status?: HousingStatus;
  category?: HousingCategory;
  tenantId?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interface pour la création/modification de logement
 */
interface HousingCreateData {
  code: string;
  nom: string;
  description?: string;
  type: HousingType;
  category: HousingCategory;
  status?: HousingStatus;
  adresse: string;
  ville?: string;
  region?: string;
  codePostal?: string;
  latitude?: number;
  longitude?: number;
  nombreChambres: number;
  capaciteTotale: number;
  loyerMensuel?: number;
  caution?: number;
  equipements?: string[];
  services?: string[];
  wifi?: boolean;
  climatisation?: boolean;
  chauffage?: boolean;
  cuisine?: boolean;
  laverie?: boolean;
  parking?: boolean;
  securite?: boolean;
  notes?: string;
}

/**
 * GET /api/housing
 * Liste des logements avec filtres et pagination
 */
router.get('/',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Filtrer les valeurs "all" (même pattern que stocks)
      const typeParam = req.query.type as string;
      const statusParam = req.query.status as string;
      const categoryParam = req.query.category as string;

      // Construire les filtres
      const filters: HousingSearchFilters = {
        search: req.query.search as string,
        type: typeParam && typeParam !== 'all' ? typeParam as HousingType : undefined,
        status: statusParam && statusParam !== 'all' ? statusParam as HousingStatus : undefined,
        category: categoryParam && categoryParam !== 'all' ? categoryParam as HousingCategory : undefined,
        tenantId: req.query.tenantId as string,
        limit: parseInt(req.query.limit as string) || 50,
        offset: parseInt(req.query.offset as string) || 0
      };

      // Si pas d'accès étendu, limiter au tenant de l'utilisateur
      if (!hasExtendedAccess && tenantContext) {
        filters.tenantId = tenantContext.tenantId;
      }

      // Construire la requête
      const housingRepository = AppDataSource.getRepository(Housing);
      const queryBuilder = housingRepository.createQueryBuilder('housing')
        .leftJoinAndSelect('housing.tenant', 'tenant')
        .leftJoinAndSelect('housing.rooms', 'rooms')
        .select([
          'housing.id',
          'housing.code',
          'housing.nom',
          'housing.description',
          'housing.type',
          'housing.category',
          'housing.status',
          'housing.adresse',
          'housing.ville',
          'housing.region',
          'housing.nombreChambres',
          'housing.capaciteTotale',
          'housing.occupationActuelle',
          'housing.tauxOccupation',
          'housing.loyerMensuel',
          'housing.isActif',
          'housing.createdAt',
          'housing.updatedAt',
          'tenant.id',
          'tenant.name',
          'tenant.code',
          'rooms.id',
          'rooms.numero',
          'rooms.occupationActuelle',
          'rooms.isAvailable'
        ]);

      // Appliquer les filtres
      if (filters.search) {
        queryBuilder.andWhere(
          '(housing.nom ILIKE :search OR housing.code ILIKE :search OR housing.adresse ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      if (filters.type) {
        queryBuilder.andWhere('housing.type = :type', { type: filters.type });
      }

      if (filters.status) {
        queryBuilder.andWhere('housing.status = :status', { status: filters.status });
      }

      if (filters.category) {
        queryBuilder.andWhere('housing.category = :category', { category: filters.category });
      }

      if (filters.tenantId) {
        queryBuilder.andWhere('housing.tenantId = :tenantId', { tenantId: filters.tenantId });
      }

      // Pagination
      queryBuilder
        .orderBy('housing.createdAt', 'DESC')
        .skip(filters.offset)
        .take(filters.limit! + 1);

      const housings = await queryBuilder.getMany();
      const hasMore = housings.length > filters.limit!;

      if (hasMore) {
        housings.pop();
      }

      // Compter le total
      const totalQuery = housingRepository.createQueryBuilder('housing');

      if (filters.search) {
        totalQuery.andWhere(
          '(housing.nom ILIKE :search OR housing.code ILIKE :search OR housing.adresse ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }
      if (filters.type) {
        totalQuery.andWhere('housing.type = :type', { type: filters.type });
      }
      if (filters.status) {
        totalQuery.andWhere('housing.status = :status', { status: filters.status });
      }
      if (filters.category) {
        totalQuery.andWhere('housing.category = :category', { category: filters.category });
      }
      if (filters.tenantId) {
        totalQuery.andWhere('housing.tenantId = :tenantId', { tenantId: filters.tenantId });
      }

      const total = await totalQuery.getCount();

      res.json({
        success: true,
        data: {
          housings,
          pagination: {
            total,
            limit: filters.limit,
            offset: filters.offset,
            hasMore
          },
          filters
        }
      });

    } catch (error) {
      logger.error('Erreur récupération logements:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des logements'
      });
    }
  }
);

/**
 * GET /api/housing/metrics
 * Métriques du module logement
 */
router.get('/metrics',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Retourner des métriques par défaut pour le moment
      const metrics = {
        totalComplexes: 0,
        totalRooms: 0,
        availableRooms: 0,
        occupiedRooms: 0,
        maintenanceRooms: 0,
        occupancyRate: 0,
        totalResidents: 0,
        monthlyRevenue: 0,
        pendingMaintenance: 0,
        overduePayments: 0,
        topComplexes: [],
        recentCheckIns: [],
        recentCheckOuts: []
      };

      res.json({
        success: true,
        data: metrics
      });
    } catch (error) {
      logger.error('Erreur récupération métriques logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des métriques'
      });
    }
  }
);

/**
 * GET /api/housing/complexes
 * Liste des cités universitaires (alias pour GET /api/housing)
 */
router.get('/complexes',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const statusParam = req.query.status as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const housingRepository = AppDataSource.getRepository(Housing);
      const queryBuilder = housingRepository.createQueryBuilder('housing')
        .leftJoinAndSelect('housing.tenant', 'tenant')
        .select([
          'housing.id',
          'housing.code',
          'housing.nom',
          'housing.type',
          'housing.category',
          'housing.status',
          'housing.adresse',
          'housing.nombreChambres',
          'housing.capaciteTotale',
          'housing.occupationActuelle',
          'housing.tauxOccupation',
          'tenant.id',
          'tenant.name'
        ]);

      // Filter by tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.where('housing.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      // Filter by status
      if (statusParam && statusParam !== 'all') {
        queryBuilder.andWhere('housing.status = :status', { status: statusParam });
      }

      queryBuilder
        .orderBy('housing.nom', 'ASC')
        .skip(offset)
        .take(limit);

      const [complexes, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: {
          complexes,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Erreur récupération complexes:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des cités',
        statusCode: 500
      });
    }
  }
);

/**
 * GET /api/housing/residents
 * Liste des résidents (occupations actives)
 */
router.get('/residents',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const complexId = req.query.complexId as string;
      const status = req.query.status as string;
      const paymentStatus = req.query.paymentStatus as string;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      const occupancyRepository = AppDataSource.getRepository(HousingOccupancy);
      const queryBuilder = occupancyRepository.createQueryBuilder('occupancy')
        .leftJoinAndSelect('occupancy.student', 'student')
        .leftJoinAndSelect('occupancy.bed', 'bed')
        .leftJoinAndSelect('occupancy.room', 'room')
        .leftJoinAndSelect('occupancy.housing', 'housing')
        .select([
          'occupancy.id',
          'occupancy.startDate',
          'occupancy.endDate',
          'occupancy.status',
          'occupancy.monthlyRent',
          'occupancy.isRentPaid',
          'student.id',
          'student.matricule',
          'student.nom',
          'student.prenom',
          'student.email',
          'bed.id',
          'bed.number',
          'room.id',
          'room.numero',
          'housing.id',
          'housing.nom'
        ]);

      // Filter by tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.where('occupancy.tenantId = :tenantId', { tenantId: tenantContext.tenantId });
      }

      // Filter by complex
      if (complexId && complexId !== 'all') {
        queryBuilder.andWhere('occupancy.housingId = :housingId', { housingId: complexId });
      }

      // Filter by status
      if (status && status !== 'all') {
        queryBuilder.andWhere('occupancy.status = :status', { status });
      }

      // Filter by payment status
      if (paymentStatus && paymentStatus !== 'all') {
        const isPaid = paymentStatus === 'paid';
        queryBuilder.andWhere('occupancy.isRentPaid = :isPaid', { isPaid });
      }

      queryBuilder
        .orderBy('student.nom', 'ASC')
        .skip(offset)
        .take(limit);

      const [residents, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: {
          residents,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Erreur récupération résidents:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des résidents',
        statusCode: 500
      });
    }
  }
);

/**
 * GET /api/housing/maintenance
 * Liste des demandes de maintenance
 */
router.get('/maintenance',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Retourner une liste vide pour le moment
      res.json({
        success: true,
        data: {
          requests: [],
          total: 0,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 10
        }
      });
    } catch (error) {
      logger.error('Erreur récupération maintenance logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des demandes de maintenance'
      });
    }
  }
);

/**
 * GET /api/housing/payments
 * Liste des paiements
 */
router.get('/payments',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      // Retourner une liste vide pour le moment
      res.json({
        success: true,
        data: {
          payments: [],
          total: 0,
          page: parseInt(req.query.page as string) || 1,
          limit: parseInt(req.query.limit as string) || 10
        }
      });
    } catch (error) {
      logger.error('Erreur récupération paiements logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des paiements'
      });
    }
  }
);

/**
 * GET /api/housing/:id
 * Détail d'un logement
 */
router.get('/:id',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true }),
  async (req: Request, res: Response) => {
    try {
      const housingId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const housingRepository = AppDataSource.getRepository(Housing);
      const queryBuilder = housingRepository.createQueryBuilder('housing')
        .leftJoinAndSelect('housing.tenant', 'tenant')
        .leftJoinAndSelect('housing.rooms', 'rooms')
        .where('housing.id = :housingId', { housingId });

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('housing.tenantId = :tenantId', {
          tenantId: tenantContext.tenantId
        });
      }

      const housing = await queryBuilder.getOne();

      if (!housing) {
        return res.status(404).json({
          error: 'Logement non trouvé',
          message: 'Le logement demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      // Audit de l'accès
      await auditService.logResourceAccess(
        req.user!.id,
        'housing_details',
        AuditAction.VIEW,
        housingId,
        tenantContext?.tenantId,
        req.ip,
        { housing: housing.nom }
      );

      res.json({
        success: true,
        data: { housing }
      });

    } catch (error) {
      logger.error('Erreur récupération logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération du logement'
      });
    }
  }
);

/**
 * POST /api/housing
 * Création d'un nouveau logement
 */
router.post('/',
  authenticateJWT,
  checkPermissions(['housing:create']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const housingData: HousingCreateData = req.body;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      // Validation des données
      if (!housingData.code || !housingData.nom || !housingData.type ||
          !housingData.category || !housingData.adresse ||
          housingData.nombreChambres === undefined || housingData.capaciteTotale === undefined) {
        return res.status(400).json({
          error: 'Données manquantes',
          message: 'Code, nom, type, catégorie, adresse, nombre de chambres et capacité totale sont requis'
        });
      }

      // Vérifier que le code n'existe pas déjà
      const housingRepository = AppDataSource.getRepository(Housing);
      const existingHousing = await housingRepository.findOne({
        where: { code: housingData.code }
      });

      if (existingHousing) {
        return res.status(409).json({
          error: 'Code déjà utilisé',
          message: 'Un logement avec ce code existe déjà'
        });
      }

      // Créer le logement
      const newHousing = housingRepository.create({
        ...housingData,
        tenantId: tenantContext!.tenantId,
        status: housingData.status || HousingStatus.ACTIF,
        occupationActuelle: 0,
        tauxOccupation: 0,
        isActif: true,
        createdBy: req.user!.id
      });

      const savedHousing = await housingRepository.save(newHousing);

      // Audit de la création
      await auditService.logResourceAccess(
        req.user!.id,
        'housing',
        AuditAction.CREATE,
        savedHousing.id,
        tenantContext?.tenantId,
        req.ip,
        {
          newHousing: {
            code: savedHousing.code,
            nom: savedHousing.nom,
            type: savedHousing.type
          }
        }
      );

      res.status(201).json({
        success: true,
        data: { housing: savedHousing },
        message: 'Logement créé avec succès'
      });

    } catch (error) {
      logger.error('Erreur création logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la création du logement'
      });
    }
  }
);

/**
 * PUT /api/housing/:id
 * Modification d'un logement
 */
router.put('/:id',
  authenticateJWT,
  checkPermissions(['housing:update']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const housingId = req.params.id;
      const updateData: Partial<HousingCreateData> = req.body;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const housingRepository = AppDataSource.getRepository(Housing);

      const queryBuilder = housingRepository.createQueryBuilder('housing')
        .where('housing.id = :housingId', { housingId });

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('housing.tenantId = :tenantId', {
          tenantId: tenantContext.tenantId
        });
      }

      const existingHousing = await queryBuilder.getOne();

      if (!existingHousing) {
        return res.status(404).json({
          error: 'Logement non trouvé',
          message: 'Le logement demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      // Sauvegarder les anciennes valeurs pour l'audit
      const oldValues = {
        code: existingHousing.code,
        nom: existingHousing.nom,
        type: existingHousing.type,
        status: existingHousing.status
      };

      // Vérifier le code unique si modifié
      if (updateData.code && updateData.code !== existingHousing.code) {
        const codeExists = await housingRepository.findOne({
          where: { code: updateData.code }
        });

        if (codeExists) {
          return res.status(409).json({
            error: 'Code déjà utilisé',
            message: 'Un autre logement utilise déjà ce code'
          });
        }
      }

      // Appliquer les modifications
      Object.assign(existingHousing, {
        ...updateData,
        updatedBy: req.user!.id,
        updatedAt: new Date()
      });

      const updatedHousing = await housingRepository.save(existingHousing);

      // Audit de la modification
      await auditService.logResourceAccess(
        req.user!.id,
        'housing',
        AuditAction.UPDATE,
        housingId,
        tenantContext?.tenantId,
        req.ip,
        {
          oldValues,
          newValues: updateData,
          housing: updatedHousing.nom
        }
      );

      res.json({
        success: true,
        data: { housing: updatedHousing },
        message: 'Logement modifié avec succès'
      });

    } catch (error) {
      logger.error('Erreur modification logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la modification du logement'
      });
    }
  }
);

/**
 * DELETE /api/housing/:id
 * Suppression d'un logement
 */
router.delete('/:id',
  authenticateJWT,
  checkPermissions(['housing:delete']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const housingId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);

      const housingRepository = AppDataSource.getRepository(Housing);
      const queryBuilder = housingRepository.createQueryBuilder('housing')
        .where('housing.id = :housingId', { housingId });

      // Si pas d'accès étendu, vérifier le tenant
      if (!hasExtendedAccess && tenantContext) {
        queryBuilder.andWhere('housing.tenantId = :tenantId', {
          tenantId: tenantContext.tenantId
        });
      }

      const housing = await queryBuilder.getOne();

      if (!housing) {
        return res.status(404).json({
          error: 'Logement non trouvé',
          message: 'Le logement demandé n\'existe pas ou vous n\'avez pas les permissions'
        });
      }

      // Vérifier s'il y a des occupations actives avec une query COUNT
      const occupancyRepository = AppDataSource.getRepository(HousingOccupancy);
      const activeOccupanciesCount = await occupancyRepository.count({
        where: {
          housingId: housingId,
          status: OccupancyStatus.ACTIVE
        }
      });

      const hasActiveOccupancies = activeOccupanciesCount > 0;

      if (hasActiveOccupancies) {
        return res.status(400).json({
          error: 'Suppression impossible',
          message: 'Ce logement a des occupations actives'
        });
      }

      // Sauvegarder les données pour l'audit
      const deletedHousingData = {
        code: housing.code,
        nom: housing.nom,
        type: housing.type
      };

      // Supprimer le logement
      await housingRepository.remove(housing);

      // Audit de la suppression
      await auditService.logResourceAccess(
        req.user!.id,
        'housing',
        AuditAction.DELETE,
        housingId,
        tenantContext?.tenantId,
        req.ip,
        { deletedHousing: deletedHousingData }
      );

      res.json({
        success: true,
        message: 'Logement supprimé avec succès'
      });

    } catch (error) {
      logger.error('Erreur suppression logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la suppression du logement'
      });
    }
  }
);

/**
 * GET /api/housing/:id/stats
 * Statistiques d'un logement
 */
router.get('/:id/stats',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  async (req: Request, res: Response) => {
    try {
      const housingId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      const housingRepository = AppDataSource.getRepository(Housing);
      const housing = await housingRepository.findOne({
        where: {
          id: housingId,
          tenantId: tenantContext!.tenantId
        }
      });

      if (!housing) {
        return res.status(404).json({
          error: 'Logement non trouvé'
        });
      }

      // Calculer les statistiques avec des queries COUNT
      const occupancyRepository = AppDataSource.getRepository(HousingOccupancy);

      const [totalOccupancies, activeOccupancies, terminatedOccupancies] = await Promise.all([
        occupancyRepository.count({ where: { housingId } }),
        occupancyRepository.count({ where: { housingId, status: OccupancyStatus.ACTIVE } }),
        occupancyRepository.count({ where: { housingId, status: OccupancyStatus.ENDED } })
      ]);

      // Calculer les statistiques
      const stats = {
        capacite: {
          nombreChambres: housing.nombreChambres,
          capaciteTotale: housing.capaciteTotale,
          occupationActuelle: housing.occupationActuelle || activeOccupancies,
          tauxOccupation: housing.tauxOccupation || 0
        },
        occupations: {
          total: totalOccupancies,
          actives: activeOccupancies,
          terminees: terminatedOccupancies,
          suspendues: 0
        },
        maintenance: {
          total: 0,
          enCours: 0,
          programmees: 0
        },
        financier: {
          loyerMensuel: housing.loyerMensuel,
          revenuMensuelPotentiel: housing.loyerMensuel ? housing.loyerMensuel * housing.capaciteTotale : 0,
          revenuMensuelActuel: housing.loyerMensuel ? housing.loyerMensuel * activeOccupancies : 0
        }
      };

      res.json({
        success: true,
        data: { stats }
      });

    } catch (error) {
      logger.error('Erreur récupération statistiques logement:', error);
      res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération des statistiques'
      });
    }
  }
);

/**
 * GET /api/housing/rooms
 * Liste des chambres avec filtres (endpoint stub)
 * TODO: Implémenter la logique complète de gestion des chambres
 */
router.get('/rooms',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      // Filtrer les valeurs "all" (même pattern que stocks)
      const complexId = req.query.complexId as string;
      const type = req.query.type as string;
      const status = req.query.status as string;

      const roomRepository = AppDataSource.getRepository(Room);
      const queryBuilder = roomRepository.createQueryBuilder('room')
        .leftJoin('room.housing', 'housing')
        .where('housing.tenantId = :tenantId', { tenantId: tenantContext!.tenantId })
        .select([
          'room.id',
          'room.numero',
          'room.type',
          'room.capacite',
          'room.status',
          'room.description',
          'room.occupationActuelle',
          'room.isAvailable',
          'housing.id',
          'housing.nom'
        ]);

      // Appliquer les filtres (ignorer "all")
      if (complexId && complexId !== 'all') {
        queryBuilder.andWhere('room.housingId = :housingId', { housingId: complexId });
      }

      if (type && type !== 'all') {
        queryBuilder.andWhere('room.type = :type', { type });
      }

      if (status && status !== 'all') {
        queryBuilder.andWhere('room.status = :status', { status });
      }

      // Recherche textuelle
      if (req.query.search) {
        queryBuilder.andWhere(
          '(room.numero ILIKE :search OR room.description ILIKE :search)',
          { search: `%${req.query.search}%` }
        );
      }

      // Pagination
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      queryBuilder
        .orderBy('room.numero', 'ASC')
        .skip(offset)
        .take(limit);

      const [rooms, total] = await queryBuilder.getManyAndCount();

      res.json({
        success: true,
        data: {
          rooms,
          total,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        }
      });

    } catch (error) {
      logger.error('Erreur récupération chambres:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la récupération des chambres'
      });
    }
  }
);

/**
 * GET /api/housing/rooms/:id
 * Détail d'une chambre
 */
router.get('/rooms/:id',
  authenticateJWT,
  checkPermissions(['housing:read']),
  injectTenantIdMiddleware({ strictMode: false }),
  async (req: Request, res: Response) => {
    try {
      const roomId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      const roomRepository = AppDataSource.getRepository(Room);
      const room = await roomRepository.findOne({
        where: { id: roomId },
        relations: ['housing', 'occupancies']
      });

      if (!room || room.housing.tenantId !== tenantContext!.tenantId) {
        return res.status(404).json({
          success: false,
          error: 'Chambre non trouvée'
        });
      }

      res.json({
        success: true,
        data: { room }
      });

    } catch (error) {
      logger.error('Erreur récupération chambre:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: 'Erreur lors de la récupération de la chambre'
      });
    }
  }
);

/**
 * POST /api/housing/rooms
 * Créer une chambre (endpoint stub)
 */
router.post('/rooms',
  authenticateJWT,
  checkPermissions(['housing:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const roomRepository = AppDataSource.getRepository(Room);

      const room = roomRepository.create({
        ...req.body,
        createdBy: req.user!.id
      });

      await roomRepository.save(room);

      res.status(201).json({
        success: true,
        data: { room },
        message: 'Chambre créée avec succès'
      });

    } catch (error) {
      logger.error('Erreur création chambre:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la création de la chambre'
      });
    }
  }
);

/**
 * PUT /api/housing/rooms/:id
 * Modifier une chambre (endpoint stub)
 */
router.put('/rooms/:id',
  authenticateJWT,
  checkPermissions(['housing:write']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const roomId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      const roomRepository = AppDataSource.getRepository(Room);
      const room = await roomRepository.findOne({
        where: { id: roomId },
        relations: ['housing']
      });

      if (!room || room.housing.tenantId !== tenantContext!.tenantId) {
        return res.status(404).json({
          success: false,
          error: 'Chambre non trouvée'
        });
      }

      Object.assign(room, req.body);
      room.updatedBy = req.user!.id;
      await roomRepository.save(room);

      res.json({
        success: true,
        data: { room },
        message: 'Chambre modifiée avec succès'
      });

    } catch (error) {
      logger.error('Erreur modification chambre:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la modification de la chambre'
      });
    }
  }
);

/**
 * DELETE /api/housing/rooms/:id
 * Supprimer une chambre (endpoint stub)
 */
router.delete('/rooms/:id',
  authenticateJWT,
  checkPermissions(['housing:delete']),
  injectTenantIdMiddleware({ strictMode: false }),
  auditMiddleware({ enabled: true, sensitiveResource: true }),
  async (req: Request, res: Response) => {
    try {
      const roomId = req.params.id;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);

      const roomRepository = AppDataSource.getRepository(Room);
      const room = await roomRepository.findOne({
        where: { id: roomId },
        relations: ['housing']
      });

      if (!room || room.housing.tenantId !== tenantContext!.tenantId) {
        return res.status(404).json({
          success: false,
          error: 'Chambre non trouvée'
        });
      }

      await roomRepository.remove(room);

      res.json({
        success: true,
        message: 'Chambre supprimée avec succès'
      });

    } catch (error) {
      logger.error('Erreur suppression chambre:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur serveur',
        message: error.message || 'Erreur lors de la suppression de la chambre'
      });
    }
  }
);

export default router;
