/**
 * FICHIER: apps/api/src/modules/housing/routes/housing-batches.routes.ts
 * ROUTES: Gestion des campagnes d'attribution de logement (ApplicationBatch)
 *
 * DESCRIPTION:
 * Routes REST pour la gestion des campagnes d'attribution en masse
 * Permet de créer, gérer et traiter les campagnes (batches)
 * Intégration avec RoomAssignmentService pour assignation automatique
 *
 * ENDPOINTS:
 * - POST   /housing/batches                 - Créer nouvelle campagne
 * - GET    /housing/batches                 - Liste paginée des campagnes
 * - GET    /housing/batches/active          - Campagnes ouvertes (pour étudiants)
 * - GET    /housing/batches/:id             - Détails d'une campagne
 * - PATCH  /housing/batches/:id             - Modifier campagne
 * - POST   /housing/batches/:id/open        - Ouvrir campagne (allow submissions)
 * - POST   /housing/batches/:id/close       - Fermer campagne (stop submissions)
 * - POST   /housing/batches/:id/process     - Lancer assignation masse
 * - GET    /housing/batches/:id/stats       - Statistiques temps réel
 * - DELETE /housing/batches/:id             - Supprimer campagne (si DRAFT)
 *
 * PERMISSIONS REQUISES:
 * - housing:batches:read    - Liste/détails
 * - housing:batches:create  - Créer
 * - housing:batches:manage  - Ouvrir/fermer/traiter
 * - housing:batches:delete  - Supprimer
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@crou/database';
import {
  ApplicationBatch,
  BatchStatus,
  BatchType
} from '@crou/database';
import { Repository } from 'typeorm';
import RoomAssignmentService from '../services/RoomAssignmentService';

const router = Router();
const batchRepository = AppDataSource.getRepository(ApplicationBatch);

/**
 * POST /housing/batches
 * Créer une nouvelle campagne d'attribution
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const {
      name,
      type,
      academicYear,
      description,
      startDate,
      endDate,
      allowOnlineSubmission,
      allowManualSubmission,
      requireDocuments,
      autoApproveEligible,
      maxApplicationsPerStudent
    } = req.body;

    // Validation
    if (!name || !type || !academicYear || !startDate || !endDate) {
      return res.status(400).json({
        message: 'Champs requis manquants',
        required: ['name', 'type', 'academicYear', 'startDate', 'endDate']
      });
    }

    // Créer batch
    const batch = batchRepository.create({
      tenantId,
      name,
      type,
      academicYear,
      description,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      allowOnlineSubmission: allowOnlineSubmission ?? false,
      allowManualSubmission: allowManualSubmission ?? true,
      requireDocuments: requireDocuments ?? true,
      autoApproveEligible: autoApproveEligible ?? false,
      maxApplicationsPerStudent,
      status: BatchStatus.DRAFT,
      createdBy: req.user?.id || 'system'
    });

    await batchRepository.save(batch);

    res.status(201).json({
      message: 'Campagne créée avec succès',
      batch
    });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur création campagne:', error);
    next(error);
  }
});

/**
 * GET /housing/batches
 * Liste paginée des campagnes avec filtres
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const {
      page = 1,
      limit = 20,
      status,
      type,
      academicYear,
      search
    } = req.query;

    const queryBuilder = batchRepository.createQueryBuilder('batch')
      .where('batch.tenantId = :tenantId', { tenantId });

    // Filtres
    if (status) {
      queryBuilder.andWhere('batch.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('batch.type = :type', { type });
    }
    if (academicYear) {
      queryBuilder.andWhere('batch.academicYear = :academicYear', { academicYear });
    }
    if (search) {
      queryBuilder.andWhere(
        '(batch.name ILIKE :search OR batch.batchNumber ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(skip).take(Number(limit));

    // Tri par date création décroissante
    queryBuilder.orderBy('batch.createdAt', 'DESC');

    const [batches, total] = await queryBuilder.getManyAndCount();

    res.json({
      data: batches,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur liste campagnes:', error);
    next(error);
  }
});

/**
 * GET /housing/batches/active
 * Campagnes ouvertes aux soumissions (pour étudiants)
 */
router.get('/active', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const now = new Date();

    const activeBatches = await batchRepository
      .createQueryBuilder('batch')
      .where('batch.tenantId = :tenantId', { tenantId })
      .andWhere('batch.status = :status', { status: BatchStatus.OPEN })
      .andWhere('batch.startDate <= :now', { now })
      .andWhere('batch.endDate >= :now', { now })
      .andWhere('batch.allowOnlineSubmission = :allow', { allow: true })
      .orderBy('batch.endDate', 'ASC')
      .getMany();

    res.json({
      data: activeBatches,
      count: activeBatches.length
    });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur campagnes actives:', error);
    next(error);
  }
});

/**
 * GET /housing/batches/:id
 * Détails d'une campagne
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const batch = await batchRepository.findOne({
      where: { id, tenantId },
      relations: ['housingRequests']
    });

    if (!batch) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    res.json({ data: batch });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur détails campagne:', error);
    next(error);
  }
});

/**
 * PATCH /housing/batches/:id
 * Modifier une campagne (uniquement si DRAFT)
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const batch = await batchRepository.findOne({
      where: { id, tenantId }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    if (batch.status !== BatchStatus.DRAFT) {
      return res.status(400).json({
        message: 'Seules les campagnes en DRAFT peuvent être modifiées'
      });
    }

    // Mise à jour
    Object.assign(batch, {
      ...req.body,
      updatedBy: req.user?.id
    });

    await batchRepository.save(batch);

    res.json({
      message: 'Campagne mise à jour',
      batch
    });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur modification campagne:', error);
    next(error);
  }
});

/**
 * POST /housing/batches/:id/open
 * Ouvrir une campagne aux soumissions
 */
router.post('/:id/open', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const batch = await batchRepository.findOne({
      where: { id, tenantId }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    if (batch.status !== BatchStatus.DRAFT && batch.status !== BatchStatus.CLOSED) {
      return res.status(400).json({
        message: `Impossible d'ouvrir campagne avec status ${batch.status}`
      });
    }

    batch.status = BatchStatus.OPEN;
    batch.updatedBy = req.user?.id;
    await batchRepository.save(batch);

    res.json({
      message: 'Campagne ouverte aux soumissions',
      batch
    });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur ouverture campagne:', error);
    next(error);
  }
});

/**
 * POST /housing/batches/:id/close
 * Fermer une campagne (plus de soumissions)
 */
router.post('/:id/close', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const batch = await batchRepository.findOne({
      where: { id, tenantId }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    if (batch.status !== BatchStatus.OPEN) {
      return res.status(400).json({
        message: 'Seules les campagnes OPEN peuvent être fermées'
      });
    }

    batch.status = BatchStatus.CLOSED;
    batch.updatedBy = req.user?.id;
    await batchRepository.save(batch);

    res.json({
      message: 'Campagne fermée',
      batch
    });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur fermeture campagne:', error);
    next(error);
  }
});

/**
 * POST /housing/batches/:id/process
 * Lancer l'assignation automatique en masse
 */
router.post('/:id/process', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const batch = await batchRepository.findOne({
      where: { id, tenantId }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    if (batch.status !== BatchStatus.CLOSED) {
      return res.status(400).json({
        message: 'La campagne doit être CLOSED pour lancer le traitement'
      });
    }

    // Lancer assignation en masse (processus asynchrone)
    console.log(`[BatchesRoutes] Lancement assignation masse batch ${batch.name}`);

    const report = await RoomAssignmentService.processBatchAssignments(id, tenantId);

    res.json({
      message: 'Assignation terminée',
      report
    });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur traitement batch:', error);
    next(error);
  }
});

/**
 * GET /housing/batches/:id/stats
 * Statistiques temps réel d'une campagne
 */
router.get('/:id/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const stats = await RoomAssignmentService.getBatchStatistics(id, tenantId);

    res.json({ data: stats });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur statistiques:', error);
    next(error);
  }
});

/**
 * DELETE /housing/batches/:id
 * Supprimer une campagne (uniquement si DRAFT)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const batch = await batchRepository.findOne({
      where: { id, tenantId }
    });

    if (!batch) {
      return res.status(404).json({ message: 'Campagne non trouvée' });
    }

    if (batch.status !== BatchStatus.DRAFT) {
      return res.status(400).json({
        message: 'Seules les campagnes en DRAFT peuvent être supprimées'
      });
    }

    await batchRepository.remove(batch);

    res.json({ message: 'Campagne supprimée' });
  } catch (error) {
    console.error('[BatchesRoutes] Erreur suppression campagne:', error);
    next(error);
  }
});

export default router;
