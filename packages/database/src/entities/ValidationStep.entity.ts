/**
 * FICHIER: packages\database\src\entities\ValidationStep.entity.ts
 * ENTITÉ: ValidationStep - Étapes de validation workflow
 * 
 * DESCRIPTION:
 * Entité pour gérer les workflows de validation multiniveau
 * Support des circuits d'approbation selon la matrice PRD
 * Traçabilité complète des validations
 * Escalade automatique et délais
 * 
 * RELATIONS:
 * - ManyToOne avec User (validateur)
 * - ManyToOne avec Budget (si validation budget)
 * - ManyToOne avec Transaction (si validation transaction)
 * - ManyToOne avec Tenant (contexte)
 * 
 * WORKFLOW:
 * - Création automatique des étapes selon seuils
 * - Notifications aux validateurs
 * - Escalade en cas de délai dépassé
 * - Historique complet des décisions
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
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
import { IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';

import { User } from './User.entity';
import { Tenant } from './Tenant.entity';
import { Budget } from './Budget.entity';
import { Transaction } from './Transaction.entity';

// Types d'entités pouvant être validées
export enum ValidationEntityType {
  BUDGET = 'budget',
  TRANSACTION = 'transaction',
  PURCHASE_ORDER = 'purchase_order',
  CONTRACT = 'contract'
}

// Statuts des étapes de validation
export enum ValidationStepStatus {
  PENDING = 'pending',           // En attente
  APPROVED = 'approved',         // Approuvé
  REJECTED = 'rejected',         // Rejeté
  DELEGATED = 'delegated',       // Délégué
  EXPIRED = 'expired',           // Expiré
  CANCELLED = 'cancelled'        // Annulé
}

// Niveaux de validation selon PRD
export enum ValidationLevel {
  CROU_DIRECTOR = 0,             // Directeur CROU
  CROU_FINANCIAL = 1,            // Chef financier CROU
  MINISTRY_FINANCIAL = 2,        // Directeur finances Ministère
  MINISTER = 3                   // Ministre
}

@Entity('validation_steps')
@Index(['entityType', 'entityId']) // Index pour requêtes par entité
@Index(['validatorId', 'status']) // Index pour requêtes par validateur
@Index(['tenantId', 'status']) // Index pour requêtes multi-tenant
export class ValidationStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations sur l'entité à valider
  @Column({ type: 'enum', enum: ValidationEntityType })
  @IsEnum(ValidationEntityType)
  entityType: ValidationEntityType;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  entityId: string; // ID de l'entité (Budget, Transaction, etc.)

  // Relations avec les entités (optionnelles selon le type)
  @Column({ type: 'uuid', name: 'budget_id', nullable: true })
  budgetId: string | null;

  @ManyToOne(() => Budget, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget | null;

  @Column({ type: 'uuid', name: 'transaction_id', nullable: true })
  transactionId: string | null;

  @ManyToOne(() => Transaction, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Transaction | null;

  // Informations de validation
  @Column({ type: 'int' })
  @IsNumber()
  level: ValidationLevel; // Niveau de validation (0, 1, 2, 3)

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  validatorId: string; // ID du validateur

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'validator_id' })
  validator: User;

  @Column({ type: 'enum', enum: ValidationStepStatus, default: ValidationStepStatus.PENDING })
  @IsEnum(ValidationStepStatus)
  status: ValidationStepStatus;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  comment: string | null; // Commentaire du validateur

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  rejectionReason: string | null; // Raison du rejet

  // Délais et escalade
  @Column({ type: 'timestamp' })
  dueDate: Date; // Date limite de validation

  @Column({ type: 'timestamp', nullable: true })
  completedAt: Date; // Date de completion

  @Column({ type: 'boolean', default: false })
  isEscalated: boolean; // Indicateur d'escalade

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  escalatedTo: string; // Validateur d'escalade

  // Délégation
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  delegatedTo: string; // Validateur délégué

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  delegationReason: string; // Raison de la délégation

  // Métadonnées
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string;

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Méthodes de validation
  /**
   * Vérifier si l'étape est en attente
   */
  isPending(): boolean {
    return this.status === ValidationStepStatus.PENDING;
  }

  /**
   * Vérifier si l'étape est expirée
   */
  isExpired(): boolean {
    return new Date() > this.dueDate && this.isPending();
  }

  /**
   * Vérifier si l'étape peut être validée
   */
  canBeValidated(): boolean {
    return this.isPending() && !this.isExpired();
  }

  /**
   * Marquer comme approuvé
   */
  approve(comment?: string): void {
    this.status = ValidationStepStatus.APPROVED;
    this.comment = comment || null;
    this.completedAt = new Date();
  }

  /**
   * Marquer comme rejeté
   */
  reject(reason: string, comment?: string): void {
    this.status = ValidationStepStatus.REJECTED;
    this.rejectionReason = reason;
    this.comment = comment || null;
    this.completedAt = new Date();
  }

  /**
   * Déléguer à un autre validateur
   */
  delegate(delegateId: string, reason: string): void {
    this.status = ValidationStepStatus.DELEGATED;
    this.delegatedTo = delegateId;
    this.delegationReason = reason;
    this.completedAt = new Date();
  }

  /**
   * Marquer comme expiré
   */
  markAsExpired(): void {
    this.status = ValidationStepStatus.EXPIRED;
    this.completedAt = new Date();
  }

  /**
   * Calculer le temps restant en heures
   */
  getTimeRemaining(): number {
    const now = new Date();
    const diff = this.dueDate.getTime() - now.getTime();
    return Math.max(0, diff / (1000 * 60 * 60)); // En heures
  }

  /**
   * Vérifier si l'escalade est nécessaire
   */
  shouldEscalate(): boolean {
    return this.isExpired() && !this.isEscalated;
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels = {
      [ValidationStepStatus.PENDING]: 'En attente',
      [ValidationStepStatus.APPROVED]: 'Approuvé',
      [ValidationStepStatus.REJECTED]: 'Rejeté',
      [ValidationStepStatus.DELEGATED]: 'Délégué',
      [ValidationStepStatus.EXPIRED]: 'Expiré',
      [ValidationStepStatus.CANCELLED]: 'Annulé'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir le niveau de validation formaté
   */
  getLevelLabel(): string {
    const labels: Record<ValidationLevel, string> = {
      [ValidationLevel.CROU_DIRECTOR]: 'Directeur CROU',
      [ValidationLevel.CROU_FINANCIAL]: 'Chef Financier CROU',
      [ValidationLevel.MINISTRY_FINANCIAL]: 'Directeur Finances Ministère',
      [ValidationLevel.MINISTER]: 'Ministre'
    };
    return labels[this.level] || `Niveau ${this.level}`;
  }
}
