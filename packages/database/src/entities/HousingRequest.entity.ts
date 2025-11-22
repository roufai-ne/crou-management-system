/**
 * FICHIER: packages\database\src\entities\HousingRequest.entity.ts
 * ENTITÃ‰: HousingRequest - Demandes de logement Ã©tudiant
 *
 * DESCRIPTION:
 * EntitÃ© pour gÃ©rer les demandes de logement des Ã©tudiants
 * Workflow: Draft â†’ Submitted â†’ Under Review â†’ Approved â†’ Assigned â†’ Confirmed
 * Support pour l'attribution automatique ou manuelle des chambres
 *
 * RELATIONS:
 * - ManyToOne avec Student (demandeur)
 * - ManyToOne avec Room (chambre assignÃ©e)
 * - ManyToOne avec Tenant (CROU)
 * - ManyToOne avec User (gestionnaire qui traite)
 *
 * WORKFLOW STATUTS:
 * 1. DRAFT: Brouillon (Ã©tudiant peut modifier)
 * 2. SUBMITTED: Soumise (en attente)
 * 3. UNDER_REVIEW: En cours d'examen
 * 4. APPROVED: ApprouvÃ©e (chambre pas encore assignÃ©e)
 * 5. ASSIGNED: Chambre assignÃ©e (attente confirmation Ã©tudiant)
 * 6. CONFIRMED: ConfirmÃ©e par Ã©tudiant (devient HousingOccupancy)
 * 7. REJECTED: RejetÃ©e
 * 8. EXPIRED: ExpirÃ©e (non confirmÃ©e dans les dÃ©lais)
 * 9. CANCELLED: AnnulÃ©e par Ã©tudiant
 *
 * PRIORITÃ‰S:
 * - HANDICAPE: Ã‰tudiants en situation de handicap (prioritÃ© absolue)
 * - BOURSIER: Ã‰tudiants boursiers
 * - RENOUVELLEMENT: Renouvellement (prioritaire sur nouvelle demande)
 * - NORMAL: Demande normale
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
import { IsEnum, IsArray, IsString, IsOptional, IsBoolean, Length } from 'class-validator';

import { Student } from './Student.entity';
import { Room, RoomType } from './Room.entity';
import { Tenant } from './Tenant.entity';
import { User } from './User.entity';
import { ApplicationBatch } from './ApplicationBatch.entity';

// Statuts de la demande
export enum RequestStatus {
  DRAFT = 'draft',                   // Brouillon
  SUBMITTED = 'submitted',           // Soumise
  UNDER_REVIEW = 'under_review',     // En cours d'examen
  APPROVED = 'approved',             // ApprouvÃ©e
  ASSIGNED = 'assigned',             // Chambre assignÃ©e
  CONFIRMED = 'confirmed',           // ConfirmÃ©e par Ã©tudiant
  REJECTED = 'rejected',             // RejetÃ©e
  EXPIRED = 'expired',               // ExpirÃ©e
  CANCELLED = 'cancelled'            // AnnulÃ©e
}

// PrioritÃ©s de demande
export enum RequestPriority {
  NORMAL = 'normal',                 // Demande normale (prioritÃ© 0)
  BOURSIER = 'boursier',             // Ã‰tudiant boursier (prioritÃ© 50)
  RENOUVELLEMENT = 'renouvellement', // Renouvellement (prioritÃ© 75)
  HANDICAPE = 'handicape'            // HandicapÃ© (prioritÃ© 100 - absolue)
}

// Type de demande
export enum RequestType {
  NOUVELLE = 'nouvelle',             // Nouvelle demande (premiÃ¨re fois)
  RENOUVELLEMENT = 'renouvellement', // Renouvellement (dÃ©jÃ  logÃ©)
  MUTATION = 'mutation'              // Changement de chambre
}

// MÃ©thode de soumission
export enum SubmissionMethod {
  ONLINE = 'online',                 // Soumission en ligne par Ã©tudiant
  MANUAL = 'manual'                  // Soumission manuelle par admin
}

@Entity('housing_requests')
@Index(['studentId', 'anneeUniversitaire']) // Index pour requÃªtes par Ã©tudiant
@Index(['tenantId', 'status']) // Index pour requÃªtes multi-tenant
@Index(['status', 'priority']) // Index pour traitement par prioritÃ©
@Index(['anneeUniversitaire', 'status']) // Index pour requÃªtes par annÃ©e
@Index(['batchId', 'status']) // Index pour requÃªtes par campagne
@Index(['batchId', 'priorityScore']) // Index pour tri par score dans campagne
export class HousingRequest {
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

  // Relation avec campagne d'attribution (batch)
  @Column({ name: 'batch_id', type: 'uuid', nullable: true })
  batchId: string;

  @ManyToOne(() => ApplicationBatch, batch => batch.housingRequests, { nullable: true })
  @JoinColumn({ name: 'batch_id' })
  batch: any;

  // Informations de la demande
  @Column({ type: 'varchar', length: 9 })
  @IsString()
  @Length(9, 9)
  anneeUniversitaire: string; // "2024-2025"

  @Column({ type: 'enum', enum: RequestType, default: RequestType.NOUVELLE })
  @IsEnum(RequestType)
  type: RequestType;

  @Column({ type: 'simple-array' })
  @IsArray()
  typeChambresPreferees: RoomType[]; // ['simple', 'double']

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  motifDemande: string;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isUrgent: boolean;

  // MÃ©thode de soumission (en ligne vs manuelle)
  @Column({ type: 'enum', enum: SubmissionMethod, default: SubmissionMethod.MANUAL })
  @IsEnum(SubmissionMethod)
  submissionMethod: SubmissionMethod;

  // VÃ©rifications d'Ã©ligibilitÃ© automatiques (stockage JSON)
  @Column({ type: 'jsonb', nullable: true })
  eligibilityChecks: {
    isBoursier?: boolean;
    hasBacScientifique?: boolean;
    isNonResident?: boolean;
    hasExceededCycleLimit?: boolean;
    hasRentPaid?: boolean;
    hasRequiredDocuments?: boolean;
    checkedAt?: string;
  };

  // Documents uploadÃ©s (URLs sÃ©curisÃ©es)
  @Column({ type: 'jsonb', nullable: true })
  documentsUploaded: {
    rentReceiptUrl?: string;           // Quittance loyer (renouvellement)
    scholarshipProofUrl?: string;      // Preuve bourse
    enrollmentReceiptUrl?: string;     // Quittance inscription
    idCardUrl?: string;                // PiÃ¨ce identitÃ©
    photoUrl?: string;                 // Photo d'identitÃ©
    otherDocuments?: string[];         // Autres documents
  };

  // Workflow
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.DRAFT })
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @Column({ type: 'enum', enum: RequestPriority, default: RequestPriority.NORMAL })
  @IsEnum(RequestPriority)
  priority: RequestPriority;

  @Column({ type: 'int', default: 0 })
  priorityScore: number; // Score calculÃ© automatiquement

  // Dates importantes
  @Column({ type: 'timestamp', nullable: true })
  dateSubmission: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateTraitement: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateAssignation: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateConfirmation: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateExpiration: Date; // Date limite pour confirmer

  // Attribution
  @Column({ name: 'room_assigned_id', type: 'uuid', nullable: true })
  roomAssignedId: string;

  @ManyToOne('Room', { nullable: true })
  @JoinColumn({ name: 'room_assigned_id' })
  roomAssigned: Room;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isAutoAssigned: boolean; // Attribution automatique ou manuelle

  // Traitement
  @Column({ name: 'treated_by_id', type: 'uuid', nullable: true })
  treatedById: string;

  @ManyToOne('User', { nullable: true })
  @JoinColumn({ name: 'treated_by_id' })
  treatedBy: User;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  motifRejet: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  commentaireGestionnaire: string;

  // Documents fournis
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  certificatScolariteFourni: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  pieceIdentiteFournie: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  photoFournie: boolean;

  @Column({ type: 'simple-array', nullable: true })
  @IsOptional()
  documentsUrls: string[]; // URLs des documents uploadÃ©s

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
   * VÃ©rifie si la demande est modifiable (brouillon)
   */
  isEditable(): boolean {
    return this.status === RequestStatus.DRAFT;
  }

  /**
   * VÃ©rifie si la demande est en attente de traitement
   */
  isPending(): boolean {
    return this.status === RequestStatus.SUBMITTED || this.status === RequestStatus.UNDER_REVIEW;
  }

  /**
   * VÃ©rifie si la demande est approuvÃ©e
   */
  isApproved(): boolean {
    return this.status === RequestStatus.APPROVED ||
           this.status === RequestStatus.ASSIGNED ||
           this.status === RequestStatus.CONFIRMED;
  }

  /**
   * VÃ©rifie si la demande est terminÃ©e (success ou Ã©chec)
   */
  isCompleted(): boolean {
    return this.status === RequestStatus.CONFIRMED ||
           this.status === RequestStatus.REJECTED ||
           this.status === RequestStatus.EXPIRED ||
           this.status === RequestStatus.CANCELLED;
  }

  /**
   * VÃ©rifie si tous les documents requis sont fournis
   */
  hasAllDocuments(): boolean {
    return this.certificatScolariteFourni &&
           this.pieceIdentiteFournie &&
           this.photoFournie;
  }

  /**
   * Calcule le score de prioritÃ©
   */
  calculatePriorityScore(): number {
    let score = 0;

    // Base selon prioritÃ©
    switch (this.priority) {
      case RequestPriority.HANDICAPE:
        score += 100;
        break;
      case RequestPriority.RENOUVELLEMENT:
        score += 75;
        break;
      case RequestPriority.BOURSIER:
        score += 50;
        break;
      case RequestPriority.NORMAL:
        score += 0;
        break;
    }

    // Bonus pour demande urgente
    if (this.isUrgent) {
      score += 25;
    }

    // Bonus pour anciennetÃ© de la demande (max +20 points)
    if (this.dateSubmission) {
      const daysOld = Math.floor(
        (new Date().getTime() - this.dateSubmission.getTime()) / (1000 * 60 * 60 * 24)
      );
      score += Math.min(daysOld, 20);
    }

    return score;
  }

  /**
   * VÃ©rifie si la demande est expirÃ©e
   */
  isExpired(): boolean {
    if (this.status === RequestStatus.ASSIGNED && this.dateExpiration) {
      return new Date() > this.dateExpiration;
    }
    return false;
  }

  /**
   * Calcule le nombre de jours restants pour confirmer
   */
  getDaysToConfirm(): number {
    if (this.status === RequestStatus.ASSIGNED && this.dateExpiration) {
      const diff = this.dateExpiration.getTime() - new Date().getTime();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return 0;
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
      'assigned': 'Chambre assignÃ©e',
      'confirmed': 'ConfirmÃ©e',
      'rejected': 'RejetÃ©e',
      'expired': 'ExpirÃ©e',
      'cancelled': 'AnnulÃ©e'
    };
    return labels[this.status] || this.status;
  }

  /**
   * Retourne le label de prioritÃ© en franÃ§ais
   */
  getPriorityLabel(): string {
    const labels: { [key: string]: string } = {
      'normal': 'Normale',
      'boursier': 'Boursier',
      'renouvellement': 'Renouvellement',
      'handicape': 'HandicapÃ©'
    };
    return labels[this.priority] || this.priority;
  }

  /**
   * VÃ©rifie si la demande peut Ãªtre assignÃ©e Ã  une chambre
   */
  canBeAssigned(): boolean {
    return (this.status === RequestStatus.APPROVED || this.status === RequestStatus.UNDER_REVIEW) &&
           this.hasAllDocuments();
  }

  /**
   * VÃ©rifie si la demande peut Ãªtre confirmÃ©e par l'Ã©tudiant
   */
  canBeConfirmed(): boolean {
    return this.status === RequestStatus.ASSIGNED &&
           !this.isExpired() &&
           this.roomAssignedId !== null;
  }
}
