/**
 * FICHIER: packages\database\src\entities\RenewalRequest.entity.ts
 * ENTITÃ‰: RenewalRequest - Demandes de renouvellement de logement
 *
 * DESCRIPTION:
 * EntitÃ© pour gÃ©rer les demandes de renouvellement annuel de logement
 * Les Ã©tudiants dÃ©jÃ  logÃ©s peuvent demander Ã  renouveler pour l'annÃ©e suivante
 * PrioritÃ© sur les nouvelles demandes (RequestPriority.RENOUVELLEMENT)
 *
 * RELATIONS:
 * - ManyToOne avec Student (demandeur)
 * - ManyToOne avec HousingOccupancy (occupation actuelle)
 * - ManyToOne avec Room (nouvelle chambre si changement)
 * - ManyToOne avec Tenant (CROU)
 * - ManyToOne avec User (gestionnaire qui traite)
 *
 * WORKFLOW:
 * 1. DRAFT: Brouillon
 * 2. SUBMITTED: Soumise (en attente)
 * 3. UNDER_REVIEW: En cours d'examen
 * 4. APPROVED: ApprouvÃ©e (renouvellement accordÃ©)
 * 5. ASSIGNED: Chambre assignÃ©e (si changement demandÃ©)
 * 6. CONFIRMED: ConfirmÃ©e (nouvelle occupation crÃ©Ã©e)
 * 7. REJECTED: RejetÃ©e (raisons acadÃ©miques, comportementales, etc.)
 * 8. EXPIRED: ExpirÃ©e
 *
 * CAS D'USAGE:
 * - Ã‰tudiant veut rester dans la mÃªme chambre (keepSameRoom = true)
 * - Ã‰tudiant veut changer de chambre (keepSameRoom = false, raison = confort/conflits/etc)
 * - Renouvellement automatique si bon standing et paiements Ã  jour
 *
 * AUTEUR: Ã‰quipe CROU
 * DATE: Janvier 2025
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { IsEnum, IsBoolean, IsString, IsOptional, Length } from 'class-validator';

import { Student } from './Student.entity';
import { HousingOccupancy } from './HousingOccupancy.entity';
import { Room, RoomType } from './Room.entity';
import { Tenant } from './Tenant.entity';
import { User } from './User.entity';
import { RequestStatus } from './HousingRequest.entity';

// Raisons de demande de changement de chambre
export enum ChangeReason {
  CONFORT = 'confort',                       // Meilleur confort
  CONFLITS = 'conflits',                     // Conflits avec colocataires
  SANTE = 'sante',                           // Raisons de santÃ©
  RAPPROCHEMENT_COURS = 'rapprochement_cours', // Plus proche des cours
  HANDICAP = 'handicap',                     // Adaptation handicap
  AUTRE = 'autre'
}

// Motifs de rejet
export enum RejectionReason {
  IMPAYE = 'impaye',                         // Loyers impayÃ©s
  MAUVAIS_COMPORTEMENT = 'mauvais_comportement', // ProblÃ¨mes disciplinaires
  NON_RENOUVELLEMENT_INSCRIPTION = 'non_renouvellement_inscription', // Pas rÃ©inscrit
  CAPACITE_INSUFFISANTE = 'capacite_insuffisante', // Pas assez de places
  DIPLOME = 'diplome',                       // Ã‰tudiant a obtenu son diplÃ´me
  AUTRE = 'autre'
}

@Entity('renewal_requests')
@Index(['studentId', 'anneeUniversitaire']) // Index pour requÃªtes par Ã©tudiant
@Index(['tenantId', 'status']) // Index pour requÃªtes multi-tenant
@Index(['currentOccupancyId']) // Index pour requÃªtes par occupation
@Index(['status', 'dateSubmission']) // Index pour traitement par ordre
export class RenewalRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne('Student', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'current_occupancy_id', type: 'uuid' })
  currentOccupancyId: string;

  @ManyToOne('HousingOccupancy', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'current_occupancy_id' })
  currentOccupancy: HousingOccupancy;

  // Informations de la demande
  @Column({ type: 'varchar', length: 9 })
  @IsString()
  @Length(9, 9)
  anneeUniversitaire: string; // "2025-2026" (annÃ©e suivante)

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  keepSameRoom: boolean; // Souhaite garder la mÃªme chambre

  @Column({ type: 'enum', enum: ChangeReason, nullable: true })
  @IsOptional()
  @IsEnum(ChangeReason)
  changeReason: ChangeReason; // Raison si changement demandÃ©

  @Column({ type: 'simple-array', nullable: true })
  @IsOptional()
  typeChambresPreferees: RoomType[]; // Si changement demandÃ©

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  motifChangement: string; // DÃ©tails de la raison

  // Workflow
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.DRAFT })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  // Dates importantes
  @Column({ type: 'timestamp', nullable: true })
  dateSubmission: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateTraitement: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateConfirmation: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateExpiration: Date; // Date limite pour confirmer

  // Attribution si changement de chambre
  @Column({ name: 'new_room_id', type: 'uuid', nullable: true })
  newRoomId: string;

  @ManyToOne('Room', { nullable: true })
  @JoinColumn({ name: 'new_room_id' })
  newRoom: Room;

  // Traitement
  @Column({ type: 'boolean', nullable: true })
  @IsOptional()
  @IsBoolean()
  isApproved: boolean; // null = en attente, true = approuvÃ©, false = rejetÃ©

  @Column({ name: 'treated_by_id', type: 'uuid', nullable: true })
  treatedById: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'treated_by_id' })
  treatedBy: User;

  @Column({ type: 'enum', enum: RejectionReason, nullable: true })
  @IsOptional()
  @IsEnum(RejectionReason)
  rejectionReason: RejectionReason;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  motifRejet: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  commentaireGestionnaire: string;

  // VÃ©rifications automatiques
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  hasPendingPayments: boolean; // A des paiements en attente

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pendingAmount: number; // Montant dÃ»

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  hasInscriptionConfirmed: boolean; // Inscription universitaire confirmÃ©e

  @Column({ type: 'int', default: 0 })
  behaviorScore: number; // Score de comportement (0-100)

  @Column({ type: 'int', default: 0 })
  maintenanceIssuesCount: number; // Nombre de problÃ¨mes de maintenance causÃ©s

  // Renouvellement automatique
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isAutoRenewal: boolean; // Renouvellement automatique (bon standing)

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  requiresManualReview: boolean; // NÃ©cessite examen manuel

  // MÃ©tadonnÃ©es
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string;

  // MÃ©thodes utilitaires

  /**
   * VÃ©rifie si la demande est modifiable
   */
  isEditable(): boolean {
    return this.status === RequestStatus.DRAFT;
  }

  /**
   * VÃ©rifie si la demande est en attente de traitement
   */
  isPending(): boolean {
    return this.status === RequestStatus.SUBMITTED ||
           this.status === RequestStatus.UNDER_REVIEW;
  }

  /**
   * VÃ©rifie si la demande est approuvÃ©e
   */
  isApprovedStatus(): boolean {
    return this.isApproved === true ||
           this.status === RequestStatus.APPROVED ||
           this.status === RequestStatus.ASSIGNED ||
           this.status === RequestStatus.CONFIRMED;
  }

  /**
   * VÃ©rifie si la demande est rejetÃ©e
   */
  isRejected(): boolean {
    return this.isApproved === false || this.status === RequestStatus.REJECTED;
  }

  /**
   * VÃ©rifie si l'Ã©tudiant est Ã©ligible pour renouvellement automatique
   */
  isEligibleForAutoRenewal(): boolean {
    return !this.hasPendingPayments &&
           this.hasInscriptionConfirmed &&
           this.behaviorScore >= 70 &&
           this.maintenanceIssuesCount === 0;
  }

  /**
   * Calcule le score de prioritÃ© (renouvellements prioritaires)
   */
  getPriorityScore(): number {
    let score = 75; // Base pour renouvellement

    // Bonus pour bon comportement
    if (this.behaviorScore >= 90) {
      score += 10;
    } else if (this.behaviorScore >= 70) {
      score += 5;
    }

    // Bonus si reste dans la mÃªme chambre (plus facile Ã  gÃ©rer)
    if (this.keepSameRoom) {
      score += 5;
    }

    // PÃ©nalitÃ© si impayÃ©s
    if (this.hasPendingPayments) {
      score -= 30;
    }

    // PÃ©nalitÃ© si problÃ¨mes de maintenance
    score -= this.maintenanceIssuesCount * 5;

    return Math.max(0, score);
  }

  /**
   * VÃ©rifie si la demande nÃ©cessite un examen manuel
   */
  needsManualReview(): boolean {
    return this.requiresManualReview ||
           this.hasPendingPayments ||
           !this.hasInscriptionConfirmed ||
           this.behaviorScore < 70 ||
           this.maintenanceIssuesCount > 0 ||
           !this.keepSameRoom; // Changement de chambre = examen manuel
  }

  /**
   * VÃ©rifie si la demande est expirÃ©e
   */
  isExpired(): boolean {
    if (this.dateExpiration) {
      return new Date() > this.dateExpiration;
    }
    return false;
  }

  /**
   * Retourne le label de statut en franÃ§ais
   */
  getStatusLabel(): string {
    const labels: { [key: string]: string } = {
      'draft': 'Brouillon',
      'submitted': 'Soumise',
      'under_review': 'En examen',
      'approved': 'ApprouvÃ©e',
      'assigned': 'Nouvelle chambre assignÃ©e',
      'confirmed': 'ConfirmÃ©e',
      'rejected': 'RejetÃ©e',
      'expired': 'ExpirÃ©e'
    };
    return labels[this.status] || this.status;
  }

  /**
   * Retourne le label de raison de changement en franÃ§ais
   */
  getChangeReasonLabel(): string {
    if (!this.changeReason) return 'N/A';

    const labels: { [key: string]: string } = {
      'confort': 'Meilleur confort',
      'conflits': 'Conflits avec colocataires',
      'sante': 'Raisons de santÃ©',
      'rapprochement_cours': 'Rapprochement des cours',
      'handicap': 'Adaptation handicap',
      'autre': 'Autre'
    };
    return labels[this.changeReason] || this.changeReason;
  }

  /**
   * Retourne le label de raison de rejet en franÃ§ais
   */
  getRejectionReasonLabel(): string {
    if (!this.rejectionReason) return 'N/A';

    const labels: { [key: string]: string } = {
      'impaye': 'Loyers impayÃ©s',
      'mauvais_comportement': 'ProblÃ¨mes disciplinaires',
      'non_renouvellement_inscription': 'Inscription non renouvelÃ©e',
      'capacite_insuffisante': 'CapacitÃ© insuffisante',
      'diplome': 'Ã‰tudiant diplÃ´mÃ©',
      'autre': 'Autre'
    };
    return labels[this.rejectionReason] || this.rejectionReason;
  }

  /**
   * VÃ©rifie si tous les critÃ¨res sont OK pour approbation automatique
   */
  canBeAutoApproved(): boolean {
    return this.isEligibleForAutoRenewal() &&
           this.keepSameRoom &&
           !this.requiresManualReview;
  }
}
