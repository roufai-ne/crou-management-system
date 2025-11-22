/**
 * FICHIER: packages\database\src\entities\ApplicationBatch.entity.ts
 * ENTITÃ‰: ApplicationBatch - Campagnes d'attribution de logement
 *
 * DESCRIPTION:
 * EntitÃ© pour gÃ©rer les campagnes d'attribution en masse
 * Permet d'organiser les demandes par pÃ©riode et type
 * Support pour soumissions en ligne et traitement batch
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU)
 * - OneToMany avec HousingRequest (demandes associÃ©es)
 *
 * WORKFLOW:
 * 1. DRAFT: Brouillon (configuration)
 * 2. OPEN: Ouverte (Ã©tudiants peuvent soumettre)
 * 3. CLOSED: FermÃ©e (plus de soumissions)
 * 4. PROCESSING: En cours de traitement (assignation masse)
 * 5. COMPLETED: TerminÃ©e (assignations finalisÃ©es)
 *
 * TYPES:
 * - RENEWAL_CAMPAIGN: Campagne de renouvellement (prioritaire)
 * - NEW_ASSIGNMENT_CAMPAIGN: Campagne nouvelles attributions
 *
 * AUTEUR: Ã‰quipe CROU
 * DATE: Janvier 2025
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index,
  BeforeInsert
} from 'typeorm';
import { IsEnum, IsBoolean, IsString, IsNumber, Length, Min } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { HousingRequest } from './HousingRequest.entity';

// Statuts de la campagne
export enum BatchStatus {
  DRAFT = 'draft',               // Brouillon (en configuration)
  OPEN = 'open',                 // Ouverte (soumissions actives)
  CLOSED = 'closed',             // FermÃ©e (plus de soumissions)
  PROCESSING = 'processing',     // En traitement (assignation en cours)
  COMPLETED = 'completed'        // TerminÃ©e (assignations finalisÃ©es)
}

// Types de campagnes
export enum BatchType {
  RENEWAL_CAMPAIGN = 'renewal_campaign',           // Campagne de renouvellement
  NEW_ASSIGNMENT_CAMPAIGN = 'new_assignment_campaign' // Campagne nouvelles attributions
}

@Entity('application_batches')
@Index(['tenantId', 'academicYear']) // Index pour requÃªtes multi-tenant
@Index(['tenantId', 'status']) // Index pour filtres
@Index(['academicYear', 'status']) // Index pour requÃªtes par annÃ©e
@Index(['batchNumber']) // Index unique pour recherche rapide
export class ApplicationBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Identifiant unique de la campagne
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  @Length(5, 50)
  batchNumber: string; // Ex: "BATCH-2025-RENEWAL-001"

  // Informations de base
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(3, 255)
  name: string; // Nom de la campagne

  @Column({ type: 'enum', enum: BatchType })
  @IsEnum(BatchType)
  type: BatchType;

  @Column({ type: 'varchar', length: 9 })
  @IsString()
  @Length(9, 9)
  academicYear: string; // "2025-2026"

  @Column({ type: 'text', nullable: true })
  description: string; // Description de la campagne

  // Dates importantes
  @Column({ type: 'timestamp' })
  startDate: Date; // Date dÃ©but soumissions

  @Column({ type: 'timestamp' })
  endDate: Date; // Date fin soumissions

  @Column({ type: 'timestamp', nullable: true })
  processingStartedAt: Date; // Date dÃ©but traitement batch

  @Column({ type: 'timestamp', nullable: true })
  processingCompletedAt: Date; // Date fin traitement batch

  // Workflow
  @Column({ type: 'enum', enum: BatchStatus, default: BatchStatus.DRAFT })
  @IsEnum(BatchStatus)
  status: BatchStatus;

  // Configuration
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  allowOnlineSubmission: boolean; // Autoriser soumissions en ligne

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowManualSubmission: boolean; // Autoriser soumissions manuelles (admin)

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  requireDocuments: boolean; // Exiger documents justificatifs

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  autoApproveEligible: boolean; // Approuver automatiquement si Ã©ligible

  @Column({ type: 'int', nullable: true })
  @Min(1)
  maxApplicationsPerStudent: number; // Nombre max de demandes par Ã©tudiant

  // Statistiques (calculÃ©es automatiquement)
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  totalApplications: number; // Total demandes soumises

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  processedApplications: number; // Demandes traitÃ©es

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  approvedCount: number; // Demandes approuvÃ©es

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  rejectedCount: number; // Demandes rejetÃ©es

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  assignedCount: number; // Chambres assignÃ©es

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  confirmedCount: number; // ConfirmÃ©es par Ã©tudiants

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  onlineSubmissionsCount: number; // Soumissions en ligne

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  manualSubmissionsCount: number; // Soumissions manuelles

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  successRate: number; // Taux de succÃ¨s (%)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  onlineSubmissionsRate: number; // Taux soumissions en ligne (%)

  // Relations inversÃ©es
  @OneToMany(() => HousingRequest, request => request.batch)
  housingRequests: HousingRequest[];

  // MÃ©tadonnÃ©es
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string;

  // Hooks
  @BeforeInsert()
  generateBatchNumber() {
    if (!this.batchNumber) {
      const year = this.academicYear.split('-')[0];
      const typePrefix = this.type === BatchType.RENEWAL_CAMPAIGN ? 'RENEWAL' : 'NEW';
      const timestamp = Date.now().toString().slice(-6);
      this.batchNumber = `BATCH-${year}-${typePrefix}-${timestamp}`;
    }
  }

  // MÃ©thodes utilitaires

  /**
   * VÃ©rifier si la campagne est ouverte aux soumissions
   */
  isOpen(): boolean {
    return this.status === BatchStatus.OPEN &&
           new Date() >= this.startDate &&
           new Date() <= this.endDate;
  }

  /**
   * VÃ©rifier si les soumissions en ligne sont autorisÃ©es
   */
  canSubmitOnline(): boolean {
    return this.isOpen() && this.allowOnlineSubmission;
  }

  /**
   * VÃ©rifier si les soumissions manuelles sont autorisÃ©es
   */
  canSubmitManually(): boolean {
    return this.isOpen() && this.allowManualSubmission;
  }

  /**
   * VÃ©rifier si la campagne est en cours de traitement
   */
  isProcessing(): boolean {
    return this.status === BatchStatus.PROCESSING;
  }

  /**
   * VÃ©rifier si la campagne est terminÃ©e
   */
  isCompleted(): boolean {
    return this.status === BatchStatus.COMPLETED;
  }

  /**
   * Calculer le taux de succÃ¨s
   */
  calculateSuccessRate(): number {
    if (this.totalApplications === 0) return 0;
    return (this.assignedCount / this.totalApplications) * 100;
  }

  /**
   * Calculer le taux de soumissions en ligne
   */
  calculateOnlineSubmissionsRate(): number {
    if (this.totalApplications === 0) return 0;
    return (this.onlineSubmissionsCount / this.totalApplications) * 100;
  }

  /**
   * Mettre Ã  jour les statistiques calculÃ©es
   */
  updateStatistics(): void {
    this.successRate = this.calculateSuccessRate();
    this.onlineSubmissionsRate = this.calculateOnlineSubmissionsRate();
  }

  /**
   * IncrÃ©menter le compteur de demandes totales
   */
  incrementTotalApplications(isOnline: boolean = false): void {
    this.totalApplications++;
    if (isOnline) {
      this.onlineSubmissionsCount++;
    } else {
      this.manualSubmissionsCount++;
    }
    this.updateStatistics();
  }

  /**
   * IncrÃ©menter le compteur de demandes approuvÃ©es
   */
  incrementApprovedCount(): void {
    this.approvedCount++;
    this.processedApplications++;
    this.updateStatistics();
  }

  /**
   * IncrÃ©menter le compteur de demandes rejetÃ©es
   */
  incrementRejectedCount(): void {
    this.rejectedCount++;
    this.processedApplications++;
    this.updateStatistics();
  }

  /**
   * IncrÃ©menter le compteur d'assignations
   */
  incrementAssignedCount(): void {
    this.assignedCount++;
    this.updateStatistics();
  }

  /**
   * IncrÃ©menter le compteur de confirmations
   */
  incrementConfirmedCount(): void {
    this.confirmedCount++;
    this.updateStatistics();
  }

  /**
   * Obtenir le label du type de campagne
   */
  getTypeLabel(): string {
    const labels = {
      [BatchType.RENEWAL_CAMPAIGN]: 'Renouvellement',
      [BatchType.NEW_ASSIGNMENT_CAMPAIGN]: 'Nouvelles Attributions'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(): string {
    const labels = {
      [BatchStatus.DRAFT]: 'Brouillon',
      [BatchStatus.OPEN]: 'Ouverte',
      [BatchStatus.CLOSED]: 'FermÃ©e',
      [BatchStatus.PROCESSING]: 'En traitement',
      [BatchStatus.COMPLETED]: 'TerminÃ©e'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir le badge couleur pour le statut
   */
  getStatusBadgeColor(): string {
    const colors = {
      [BatchStatus.DRAFT]: 'gray',
      [BatchStatus.OPEN]: 'green',
      [BatchStatus.CLOSED]: 'yellow',
      [BatchStatus.PROCESSING]: 'blue',
      [BatchStatus.COMPLETED]: 'purple'
    };
    return colors[this.status] || 'gray';
  }

  /**
   * Obtenir les jours restants avant fermeture
   */
  getDaysRemaining(): number {
    const now = new Date();
    const end = new Date(this.endDate);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * VÃ©rifier si la campagne arrive bientÃ´t Ã  expiration
   */
  isClosingSoon(daysThreshold: number = 7): boolean {
    return this.isOpen() && this.getDaysRemaining() <= daysThreshold;
  }

  /**
   * Obtenir le rapport de progression
   */
  getProgressReport(): {
    total: number;
    processed: number;
    assigned: number;
    confirmed: number;
    progressPercentage: number;
  } {
    const progressPercentage = this.totalApplications > 0
      ? (this.processedApplications / this.totalApplications) * 100
      : 0;

    return {
      total: this.totalApplications,
      processed: this.processedApplications,
      assigned: this.assignedCount,
      confirmed: this.confirmedCount,
      progressPercentage
    };
  }
}
