/**
 * FICHIER: apps/api/src/modules/housing/routes/housing-requests.routes.ts
 * ROUTES: Gestion des demandes de logement (HousingRequest)
 *
 * DESCRIPTION:
 * Routes REST pour la gestion des demandes individuelles de logement
 * Intégration EligibilityService pour validation automatique
 * Support soumissions en ligne et manuelles
 *
 * ENDPOINTS:
 * - POST   /housing/requests              - Soumettre demande (avec validation éligibilité)
 * - POST   /housing/requests/draft        - Sauvegarder brouillon
 * - GET    /housing/requests              - Liste demandes (filtres multiples)
 * - GET    /housing/requests/my           - Mes demandes (étudiant)
 * - GET    /housing/requests/:id          - Détails demande
 * - GET    /housing/requests/ranking/:batchId - Classement par score
 * - PATCH  /housing/requests/:id          - Modifier demande (si DRAFT)
 * - PATCH  /housing/requests/:id/status   - Changer statut (approve/reject)
 * - DELETE /housing/requests/:id          - Supprimer (si DRAFT)
 *
 * PERMISSIONS REQUISES:
 * - housing:applications:submit  - Soumettre
 * - housing:applications:read    - Liste/détails
 * - housing:applications:review  - Réviser
 * - housing:applications:approve - Approuver/rejeter
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { Router, Request, Response, NextFunction } from 'express';
import { AppDataSource } from '@crou/database';
import {
  HousingRequest,
  RequestStatus,
  RequestType,
  RequestPriority,
  SubmissionMethod,
  ApplicationBatch,
  BatchStatus,
  Student
} from '@crou/database';
import { Repository } from 'typeorm';
import EligibilityService from '../services/EligibilityService';

const router = Router();
const requestRepository = AppDataSource.getRepository(HousingRequest);
const batchRepository = AppDataSource.getRepository(ApplicationBatch);
const studentRepository = AppDataSource.getRepository(Student);

/**
 * POST /housing/requests
 * Soumettre une nouvelle demande avec validation éligibilité
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const {
      batchId,
      studentId,
      type,
      typeChambresPreferees,
      motifDemande,
      isUrgent,
      submissionMethod = SubmissionMethod.MANUAL
    } = req.body;

    // Validation champs requis
    if (!studentId || !type || !typeChambresPreferees || typeChambresPreferees.length === 0) {
      return res.status(400).json({
        message: 'Champs requis manquants',
        required: ['studentId', 'type', 'typeChambresPreferees']
      });
    }

    // Vérifier étudiant existe
    const student = await studentRepository.findOne({
      where: { id: studentId, tenantId }
    });

    if (!student) {
      return res.status(404).json({ message: 'Étudiant non trouvé' });
    }

    // Vérifier batch si fourni
    let batch: ApplicationBatch | null = null;
    if (batchId) {
      batch = await batchRepository.findOne({
        where: { id: batchId, tenantId }
      });

      if (!batch) {
        return res.status(404).json({ message: 'Campagne non trouvée' });
      }

      // Vérifier que batch accepte soumissions
      if (submissionMethod === SubmissionMethod.ONLINE && !batch.canSubmitOnline()) {
        return res.status(400).json({
          message: 'Cette campagne n\'accepte pas les soumissions en ligne'
        });
      }
    }

    // Créer demande
    const request = requestRepository.create({
      tenantId,
      studentId,
      batchId: batchId || null,
      anneeUniversitaire: batch?.academicYear || new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      type,
      typeChambresPreferees,
      motifDemande,
      isUrgent: isUrgent || false,
      status: RequestStatus.SUBMITTED,
      priority: RequestPriority.NORMAL,
      dateSubmission: new Date(),
      createdBy: userId || 'system'
    });

    // Valider éligibilité et calculer score
    const eligibility = await EligibilityService.validateEligibility(request, tenantId);

    if (!eligibility.isEligible) {
      return res.status(400).json({
        message: 'Demande non éligible',
        reasons: eligibility.reasons,
        checks: eligibility.checks
      });
    }

    request.priorityScore = eligibility.score;

    // Sauvegarder
    await requestRepository.save(request);

    // Mettre à jour compteurs batch
    if (batch) {
      batch.incrementTotalApplications(submissionMethod === SubmissionMethod.ONLINE);
      await batchRepository.save(batch);
    }

    res.status(201).json({
      message: 'Demande soumise avec succès',
      request,
      eligibility: {
        score: eligibility.score,
        checks: eligibility.checks
      }
    });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur soumission demande:', error);
    next(error);
  }
});

/**
 * POST /housing/requests/draft
 * Sauvegarder un brouillon (sans validation)
 */
router.post('/draft', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId) {
      return res.status(401).json({ message: 'Tenant non identifié' });
    }

    const { studentId, batchId, type, typeChambresPreferees, motifDemande } = req.body;

    if (!studentId || !type) {
      return res.status(400).json({
        message: 'Champs minimaux requis',
        required: ['studentId', 'type']
      });
    }

    const request = requestRepository.create({
      tenantId,
      studentId,
      batchId: batchId || null,
      anneeUniversitaire: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
      type,
      typeChambresPreferees: typeChambresPreferees || [],
      motifDemande,
      status: RequestStatus.DRAFT,
      createdBy: userId || 'system'
    });

    await requestRepository.save(request);

    res.status(201).json({
      message: 'Brouillon sauvegardé',
      request
    });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur sauvegarde brouillon:', error);
    next(error);
  }
});

/**
 * GET /housing/requests
 * Liste des demandes avec filtres multiples
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
      batchId,
      status,
      type,
      submissionMethod,
      studentId,
      search
    } = req.query;

    const queryBuilder = requestRepository.createQueryBuilder('request')
      .leftJoinAndSelect('request.student', 'student')
      .leftJoinAndSelect('request.batch', 'batch')
      .leftJoinAndSelect('request.roomAssigned', 'room')
      .where('request.tenantId = :tenantId', { tenantId });

    // Filtres
    if (batchId) {
      queryBuilder.andWhere('request.batchId = :batchId', { batchId });
    }
    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }
    if (type) {
      queryBuilder.andWhere('request.type = :type', { type });
    }
    if (submissionMethod) {
      queryBuilder.andWhere('request.submissionMethod = :submissionMethod', { submissionMethod });
    }
    if (studentId) {
      queryBuilder.andWhere('request.studentId = :studentId', { studentId });
    }
    if (search) {
      queryBuilder.andWhere(
        '(student.nom ILIKE :search OR student.prenom ILIKE :search OR student.matricule ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    queryBuilder.skip(skip).take(Number(limit));

    // Tri par date soumission décroissante
    queryBuilder.orderBy('request.dateSubmission', 'DESC');

    const [requests, total] = await queryBuilder.getManyAndCount();

    res.json({
      data: requests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur liste demandes:', error);
    next(error);
  }
});

/**
 * GET /housing/requests/my
 * Mes demandes (pour étudiant connecté)
 */
router.get('/my', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const userId = req.user?.id;

    if (!tenantId || !userId) {
      return res.status(401).json({ message: 'Utilisateur non identifié' });
    }

    // Trouver l'étudiant associé à cet utilisateur
    // Note: À adapter selon votre modèle User-Student
    const student = await studentRepository.findOne({
      where: { tenantId /*, userId */ } // Décommenter si relation userId existe
    });

    if (!student) {
      return res.status(404).json({ message: 'Profil étudiant non trouvé' });
    }

    const requests = await requestRepository.find({
      where: {
        tenantId,
        studentId: student.id
      },
      relations: ['batch', 'roomAssigned', 'roomAssigned.housing'],
      order: {
        dateSubmission: 'DESC'
      }
    });

    res.json({ data: requests, count: requests.length });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur mes demandes:', error);
    next(error);
  }
});

/**
 * GET /housing/requests/:id
 * Détails d'une demande
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const request = await requestRepository.findOne({
      where: { id, tenantId },
      relations: ['student', 'batch', 'roomAssigned', 'roomAssigned.housing', 'treatedBy']
    });

    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    res.json({ data: request });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur détails demande:', error);
    next(error);
  }
});

/**
 * GET /housing/requests/ranking/:batchId
 * Classement des demandes par score de priorité
 */
router.get('/ranking/:batchId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { batchId } = req.params;

    const requests = await requestRepository.find({
      where: {
        batchId,
        tenantId,
        status: RequestStatus.APPROVED
      },
      relations: ['student'],
      order: {
        priorityScore: 'DESC'
      }
    });

    const ranking = requests.map((request, index) => ({
      rank: index + 1,
      requestId: request.id,
      student: {
        id: request.student.id,
        nom: request.student.nom,
        prenom: request.student.prenom,
        matricule: request.student.matricule
      },
      priorityScore: request.priorityScore,
      type: request.type,
      status: request.status
    }));

    res.json({
      data: ranking,
      count: ranking.length
    });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur classement:', error);
    next(error);
  }
});

/**
 * PATCH /housing/requests/:id
 * Modifier une demande (uniquement si DRAFT)
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const request = await requestRepository.findOne({
      where: { id, tenantId }
    });

    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (!request.isEditable()) {
      return res.status(400).json({
        message: 'Seules les demandes en DRAFT peuvent être modifiées'
      });
    }

    // Mise à jour
    Object.assign(request, {
      ...req.body,
      updatedBy: req.user?.id
    });

    await requestRepository.save(request);

    res.json({
      message: 'Demande mise à jour',
      request
    });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur modification demande:', error);
    next(error);
  }
});

/**
 * PATCH /housing/requests/:id/status
 * Changer statut (approuver/rejeter)
 */
router.patch('/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;
    const { status, motifRejet, commentaireGestionnaire } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status requis' });
    }

    const request = await requestRepository.findOne({
      where: { id, tenantId },
      relations: ['batch']
    });

    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    // Valider transition de statut
    const allowedTransitions: { [key: string]: RequestStatus[] } = {
      [RequestStatus.SUBMITTED]: [RequestStatus.UNDER_REVIEW, RequestStatus.REJECTED],
      [RequestStatus.UNDER_REVIEW]: [RequestStatus.APPROVED, RequestStatus.REJECTED],
      [RequestStatus.APPROVED]: [RequestStatus.ASSIGNED],
      [RequestStatus.ASSIGNED]: [RequestStatus.CONFIRMED, RequestStatus.CANCELLED]
    };

    if (!allowedTransitions[request.status]?.includes(status)) {
      return res.status(400).json({
        message: `Transition ${request.status} → ${status} non autorisée`
      });
    }

    // Mise à jour
    request.status = status;
    request.treatedById = req.user?.id;
    request.dateTraitement = new Date();

    if (motifRejet) {
      request.motifRejet = motifRejet;
    }
    if (commentaireGestionnaire) {
      request.commentaireGestionnaire = commentaireGestionnaire;
    }

    await requestRepository.save(request);

    // Mettre à jour compteurs batch
    if (request.batch) {
      if (status === RequestStatus.APPROVED) {
        request.batch.incrementApprovedCount();
      } else if (status === RequestStatus.REJECTED) {
        request.batch.incrementRejectedCount();
      }
      await batchRepository.save(request.batch);
    }

    res.json({
      message: `Demande ${status === RequestStatus.APPROVED ? 'approuvée' : status === RequestStatus.REJECTED ? 'rejetée' : 'mise à jour'}`,
      request
    });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur changement statut:', error);
    next(error);
  }
});

/**
 * DELETE /housing/requests/:id
 * Supprimer une demande (uniquement si DRAFT)
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = req.user?.tenantId;
    const { id } = req.params;

    const request = await requestRepository.findOne({
      where: { id, tenantId }
    });

    if (!request) {
      return res.status(404).json({ message: 'Demande non trouvée' });
    }

    if (!request.isEditable()) {
      return res.status(400).json({
        message: 'Seules les demandes en DRAFT peuvent être supprimées'
      });
    }

    await requestRepository.remove(request);

    res.json({ message: 'Demande supprimée' });
  } catch (error) {
    console.error('[RequestsRoutes] Erreur suppression demande:', error);
    next(error);
  }
});

export default router;
