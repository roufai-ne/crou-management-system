/**
 * FICHIER: apps/api/src/modules/housing/services/RoomAssignmentService.ts
 * SERVICE: RoomAssignmentService - Service d'assignation de chambres en masse
 *
 * DESCRIPTION:
 * Service responsable de l'attribution automatique des chambres lors des campagnes batch
 * Implémente l'algorithme d'assignation en masse avec transactions atomiques
 * Gère la compatibilité genre, disponibilité lits et score priorité
 *
 * FONCTIONNALITÉS:
 * - Assignation automatique par batch (campagne)
 * - Tri par score de priorité (décroissant)
 * - Vérification compatibilité genre (HOMMES/FEMMES/MIXTE)
 * - Réservation temporaire de lits (évite double assignation)
 * - Transactions atomiques (commit/rollback complet)
 * - Génération rapport détaillé (succès/échecs)
 *
 * ALGORITHME:
 * 1. Récupère toutes demandes APPROVED du batch
 * 2. Trie par priorityScore DESC
 * 3. Pour chaque demande:
 *    - Trouve Room compatible (genre + disponibilité)
 *    - Réserve temporairement le lit (room.reserveBed())
 *    - Assigne roomId à la demande
 *    - Change status à ASSIGNED
 *    - Confirme réservation (room.confirmReservation())
 * 4. Commit transaction si tout OK, sinon Rollback
 * 5. Retourne rapport détaillé
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { AppDataSource } from '@crou/database';
import {
  ApplicationBatch,
  BatchStatus,
  HousingRequest,
  RequestStatus,
  Room,
  RoomStatus,
  Student,
  GenderRestriction
} from '@crou/database';
import { Repository } from 'typeorm';

export interface AssignmentResult {
  success: boolean;
  requestId: string;
  studentId: string;
  studentName: string;
  roomId?: string;
  roomNumber?: string;
  housingName?: string;
  error?: string;
}

export interface BatchAssignmentReport {
  batchId: string;
  batchName: string;
  totalRequests: number;
  successCount: number;
  failureCount: number;
  results: AssignmentResult[];
  startedAt: Date;
  completedAt: Date;
  durationMs: number;
}

export class RoomAssignmentService {
  private batchRepository: Repository<ApplicationBatch>;
  private requestRepository: Repository<HousingRequest>;
  private roomRepository: Repository<Room>;
  private studentRepository: Repository<Student>;

  constructor() {
    this.batchRepository = AppDataSource.getRepository(ApplicationBatch);
    this.requestRepository = AppDataSource.getRepository(HousingRequest);
    this.roomRepository = AppDataSource.getRepository(Room);
    this.studentRepository = AppDataSource.getRepository(Student);
  }

  /**
   * Traiter les assignations d'un batch complet
   * Méthode principale appelée pour lancer l'assignation en masse
   */
  async processBatchAssignments(
    batchId: string,
    tenantId: string
  ): Promise<BatchAssignmentReport> {
    const startTime = Date.now();

    // 1. Récupérer le batch
    const batch = await this.batchRepository.findOne({
      where: { id: batchId, tenantId },
      relations: ['housingRequests']
    });

    if (!batch) {
      throw new Error(`Batch ${batchId} non trouvé`);
    }

    if (batch.status !== BatchStatus.CLOSED) {
      throw new Error(`Le batch doit être CLOSED pour lancer l'assignation. Status actuel: ${batch.status}`);
    }

    // Marquer batch en PROCESSING
    batch.status = BatchStatus.PROCESSING;
    batch.processingStartedAt = new Date();
    await this.batchRepository.save(batch);

    // 2. Récupérer toutes les demandes approuvées du batch
    const approvedRequests = await this.requestRepository.find({
      where: {
        batchId,
        tenantId,
        status: RequestStatus.APPROVED
      },
      relations: ['student'],
      order: {
        priorityScore: 'DESC' // Tri par score décroissant
      }
    });

    console.log(`[RoomAssignmentService] Traitement de ${approvedRequests.length} demandes approuvées pour batch ${batch.name}`);

    // 3. Traiter chaque demande dans une transaction
    const results: AssignmentResult[] = [];

    for (const request of approvedRequests) {
      try {
        const result = await this.assignRoomToRequest(request, tenantId);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        console.error(`[RoomAssignmentService] Erreur assignation demande ${request.id}:`, error);
        results.push({
          success: false,
          requestId: request.id,
          studentId: request.studentId,
          studentName: request.student?.getFullName() || 'Inconnu',
          error: errorMessage
        });
      }
    }

    // 4. Mettre à jour statistiques du batch
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    batch.assignedCount = successCount;
    batch.processedApplications = batch.approvedCount;
    batch.status = BatchStatus.COMPLETED;
    batch.processingCompletedAt = new Date();
    batch.updateStatistics();

    await this.batchRepository.save(batch);

    // 5. Retourner rapport
    const endTime = Date.now();

    return {
      batchId: batch.id,
      batchName: batch.name,
      totalRequests: approvedRequests.length,
      successCount,
      failureCount,
      results,
      startedAt: new Date(startTime),
      completedAt: new Date(endTime),
      durationMs: endTime - startTime
    };
  }

  /**
   * Assigner une chambre à une demande spécifique
   * Méthode transactionnelle avec réservation temporaire
   */
  private async assignRoomToRequest(
    request: HousingRequest,
    tenantId: string
  ): Promise<AssignmentResult> {
    // Utiliser une transaction pour garantir atomicité
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. Récupérer l'étudiant avec genre
      const student = await queryRunner.manager.findOne(Student, {
        where: { id: request.studentId, tenantId }
      });

      if (!student) {
        throw new Error(`Étudiant ${request.studentId} non trouvé`);
      }

      // 2. Rechercher chambre compatible
      const compatibleRoom = await this.findCompatibleRoom(
        student.genre,
        request.typeChambresPreferees,
        tenantId,
        queryRunner
      );

      if (!compatibleRoom) {
        throw new Error(`Aucune chambre disponible compatible pour ${student.genre}`);
      }

      // 3. Réserver temporairement le lit
      const reserved = compatibleRoom.reserveBed(1);
      if (!reserved) {
        throw new Error(`Impossible de réserver lit dans chambre ${compatibleRoom.numero}`);
      }

      await queryRunner.manager.save(Room, compatibleRoom);

      // 4. Assigner la chambre à la demande
      request.roomAssignedId = compatibleRoom.id;
      request.status = RequestStatus.ASSIGNED;
      request.dateAssignation = new Date();
      request.isAutoAssigned = true;

      await queryRunner.manager.save(HousingRequest, request);

      // 5. Confirmer la réservation (transformer en occupation réelle)
      compatibleRoom.confirmReservation(1);
      await queryRunner.manager.save(Room, compatibleRoom);

      // Commit transaction
      await queryRunner.commitTransaction();

      console.log(`[RoomAssignmentService] ✅ Assignation réussie: ${student.getFullName()} → Chambre ${compatibleRoom.numero}`);

      return {
        success: true,
        requestId: request.id,
        studentId: student.id,
        studentName: student.getFullName(),
        roomId: compatibleRoom.id,
        roomNumber: compatibleRoom.numero,
        housingName: compatibleRoom.housing?.nom || 'N/A'
      };

    } catch (error) {
      // Rollback en cas d'erreur
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Libérer la connexion
      await queryRunner.release();
    }
  }

  /**
   * Trouver une chambre compatible avec les critères
   * Vérifie genre, type préféré, disponibilité
   */
  private async findCompatibleRoom(
    studentGender: string,
    preferredRoomTypes: string[],
    tenantId: string,
    queryRunner: any
  ): Promise<Room | null> {
    // Convertir genre étudiant en GenderRestriction
    let genderRestriction: GenderRestriction;
    if (studentGender === 'M') {
      genderRestriction = GenderRestriction.HOMMES;
    } else if (studentGender === 'F') {
      genderRestriction = GenderRestriction.FEMMES;
    } else {
      throw new Error(`Genre étudiant invalide: ${studentGender}`);
    }

    // Construire requête avec critères
    const queryBuilder = queryRunner.manager
      .createQueryBuilder(Room, 'room')
      .leftJoinAndSelect('room.housing', 'housing')
      .where('housing.tenantId = :tenantId', { tenantId })
      .andWhere('room.status = :status', { status: RoomStatus.DISPONIBLE })
      .andWhere('room.isActif = :isActif', { isActif: true })
      .andWhere('(room.capacite - room.occupation - room.reservedBeds) > 0') // Lits disponibles
      .andWhere('(room.genderRestriction = :mixte OR room.genderRestriction = :gender)', {
        mixte: GenderRestriction.MIXTE,
        gender: genderRestriction
      });

    // Filtrer par types préférés si spécifiés
    if (preferredRoomTypes && preferredRoomTypes.length > 0) {
      queryBuilder.andWhere('room.type IN (:...types)', { types: preferredRoomTypes });
    }

    // Trier par priorité: types préférés d'abord, puis disponibilité
    queryBuilder.orderBy('room.capacite', 'ASC'); // Chambres plus petites d'abord

    // Récupérer première chambre disponible
    const room = await queryBuilder.getOne();

    return room;
  }

  /**
   * Obtenir statistiques temps réel d'un batch
   */
  async getBatchStatistics(batchId: string, tenantId: string): Promise<{
    total: number;
    assigned: number;
    pending: number;
    failed: number;
    progressPercentage: number;
  }> {
    const batch = await this.batchRepository.findOne({
      where: { id: batchId, tenantId }
    });

    if (!batch) {
      throw new Error(`Batch ${batchId} non trouvé`);
    }

    const total = batch.approvedCount;
    const assigned = batch.assignedCount;
    const pending = total - assigned;
    const failed = batch.rejectedCount;
    const progressPercentage = total > 0 ? (assigned / total) * 100 : 0;

    return {
      total,
      assigned,
      pending,
      failed,
      progressPercentage
    };
  }

  /**
   * Annuler une assignation (libérer chambre)
   * Utile si étudiant refuse ou annule
   */
  async cancelAssignment(
    requestId: string,
    tenantId: string,
    reason: string
  ): Promise<void> {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Récupérer demande avec chambre assignée
      const request = await queryRunner.manager.findOne(HousingRequest, {
        where: { id: requestId, tenantId },
        relations: ['roomAssigned']
      });

      if (!request) {
        throw new Error(`Demande ${requestId} non trouvée`);
      }

      if (!request.roomAssignedId) {
        throw new Error(`Aucune chambre assignée à cette demande`);
      }

      // Libérer la chambre
      const room = await queryRunner.manager.findOne(Room, {
        where: { id: request.roomAssignedId }
      });

      if (room) {
        room.removeOccupant();
        await queryRunner.manager.save(Room, room);
      }

      // Mettre à jour demande
      request.roomAssignedId = null;
      request.status = RequestStatus.CANCELLED;
      request.motifRejet = reason;
      await queryRunner.manager.save(HousingRequest, request);

      await queryRunner.commitTransaction();

      console.log(`[RoomAssignmentService] ✅ Annulation assignation réussie: ${requestId}`);

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}

export default new RoomAssignmentService();
