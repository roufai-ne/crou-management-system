/**
 * FICHIER: packages\database\src\entities\WorkflowInstance.entity.ts
 * ENTITÉ: WorkflowInstance - Instance de workflow
 * 
 * DESCRIPTION:
 * Entité pour gérer les instances de workflows
 * Suivi des validations en cours
 * Support multi-tenant avec historique complet
 * 
 * FONCTIONNALITÉS:
 * - Instance d'un workflow pour une entité
 * - Suivi des étapes et validations
 * - Gestion des délégations et escalades
 * - Historique complet des actions
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index
} from 'typeorm';
import { Workflow } from './Workflow.entity';
import { WorkflowStep } from './WorkflowStep.entity';
import { WorkflowAction } from './WorkflowAction.entity';

// Types pour les instances
export enum InstanceStatus {
  PENDING = 'pending',       // En attente
  IN_PROGRESS = 'in_progress', // En cours
  COMPLETED = 'completed',   // Terminée
  REJECTED = 'rejected',     // Rejetée
  CANCELLED = 'cancelled',   // Annulée
  EXPIRED = 'expired'        // Expirée
}

export enum InstancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('workflow_instances')
@Index(['tenantId', 'status'])
@Index(['workflowId', 'status'])
@Index(['entityType', 'entityId'])
@Index(['createdAt'])
export class WorkflowInstance {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'workflow_id' })
  workflowId!: string;

  @Column({ type: 'uuid', name: 'current_step_id', nullable: true })
  currentStepId!: string | null;

  @Column({ type: 'varchar', length: 100 })
  entityType!: string; // Type d'entité (Budget, Transaction, etc.)

  @Column({ type: 'uuid' })
  entityId!: string; // ID de l'entité concernée

  @Column({
    type: 'enum',
    enum: InstanceStatus,
    default: InstanceStatus.PENDING
  })
  status!: InstanceStatus;

  @Column({
    type: 'enum',
    enum: InstancePriority,
    default: InstancePriority.MEDIUM
  })
  priority!: InstancePriority;

  @Column({ type: 'varchar', length: 500, nullable: true })
  title!: string | null; // Titre de l'instance

  @Column({ type: 'text', nullable: true })
  description!: string | null; // Description de l'instance

  @Column({ type: 'jsonb', nullable: true })
  context: any; // Contexte de l'instance

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Métadonnées supplémentaires

  @Column({ type: 'timestamp', nullable: true })
  startedAt!: Date | null; // Date de début

  @Column({ type: 'timestamp', nullable: true })
  completedAt!: Date | null; // Date de fin

  @Column({ type: 'timestamp', nullable: true })
  expiredAt!: Date | null; // Date d'expiration

  @Column({ type: 'uuid', name: 'initiated_by' })
  initiatedBy!: string; // Utilisateur qui a initié

  @Column({ type: 'uuid', name: 'assigned_to', nullable: true })
  assignedTo: string | null; // Utilisateur assigné

  @Column({ type: 'uuid', name: 'delegated_to', nullable: true })
  delegatedTo: string | null; // Utilisateur délégué

  @Column({ type: 'varchar', length: 500, nullable: true })
  rejectionReason!: string | null; // Raison du rejet

  @Column({ type: 'varchar', length: 500, nullable: true })
  cancellationReason!: string | null; // Raison de l'annulation

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy!: string;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updatedBy!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow!: Workflow;

  @ManyToOne(() => WorkflowStep, { nullable: true })
  @JoinColumn({ name: 'current_step_id' })
  currentStep!: WorkflowStep | null;

  @OneToMany(() => WorkflowAction, action => action.instance, { cascade: true })
  actions!: WorkflowAction[];

  // Méthodes métier
  /**
   * Démarrer l'instance
   */
  start(): void {
    if (this.status === InstanceStatus.PENDING) {
      this.status = InstanceStatus.IN_PROGRESS;
      this.startedAt = new Date();
    }
  }

  /**
   * Terminer l'instance
   */
  complete(): void {
    if (this.status === InstanceStatus.IN_PROGRESS) {
      this.status = InstanceStatus.COMPLETED;
      this.completedAt = new Date();
    }
  }

  /**
   * Rejeter l'instance
   */
  reject(reason: string, rejectedBy: string): void {
    if (this.status === InstanceStatus.IN_PROGRESS) {
      this.status = InstanceStatus.REJECTED;
      this.rejectionReason = reason;
      this.completedAt = new Date();
      this.updatedBy = rejectedBy;
    }
  }

  /**
   * Annuler l'instance
   */
  cancel(reason: string, cancelledBy: string): void {
    if (this.status === InstanceStatus.IN_PROGRESS || this.status === InstanceStatus.PENDING) {
      this.status = InstanceStatus.CANCELLED;
      this.cancellationReason = reason;
      this.completedAt = new Date();
      this.updatedBy = cancelledBy;
    }
  }

  /**
   * Marquer comme expirée
   */
  expire(): void {
    if (this.status === InstanceStatus.IN_PROGRESS || this.status === InstanceStatus.PENDING) {
      this.status = InstanceStatus.EXPIRED;
      this.completedAt = new Date();
    }
  }

  /**
   * Assigner à un utilisateur
   */
  assignTo(userId: string): void {
    this.assignedTo = userId;
    this.delegatedTo = null; // Réinitialiser la délégation
  }

  /**
   * Déléguer à un utilisateur
   */
  delegateTo(userId: string): void {
    this.delegatedTo = userId;
  }

  /**
   * Vérifier si l'instance est active
   */
  isActive(): boolean {
    return this.status === InstanceStatus.IN_PROGRESS || this.status === InstanceStatus.PENDING;
  }

  /**
   * Vérifier si l'instance est terminée
   */
  isCompleted(): boolean {
    return this.status === InstanceStatus.COMPLETED || 
           this.status === InstanceStatus.REJECTED || 
           this.status === InstanceStatus.CANCELLED || 
           this.status === InstanceStatus.EXPIRED;
  }

  /**
   * Vérifier si l'instance a expiré
   */
  isExpired(): boolean {
    if (this.expiredAt) {
      return new Date() > this.expiredAt;
    }
    return false;
  }

  /**
   * Obtenir la durée écoulée en millisecondes
   */
  getElapsedTime(): number {
    if (!this.startedAt) {
      return 0;
    }

    const endTime = this.completedAt || new Date();
    return endTime.getTime() - this.startedAt.getTime();
  }

  /**
   * Obtenir la durée écoulée en heures
   */
  getElapsedHours(): number {
    return this.getElapsedTime() / (1000 * 60 * 60);
  }

  /**
   * Obtenir la durée écoulée en jours
   */
  getElapsedDays(): number {
    return this.getElapsedTime() / (1000 * 60 * 60 * 24);
  }

  /**
   * Obtenir le temps restant en millisecondes
   */
  getRemainingTime(): number | null {
    if (!this.expiredAt) {
      return null;
    }

    const now = new Date();
    const remaining = this.expiredAt.getTime() - now.getTime();
    return remaining > 0 ? remaining : 0;
  }

  /**
   * Obtenir le temps restant en heures
   */
  getRemainingHours(): number | null {
    const remaining = this.getRemainingTime();
    return remaining ? remaining / (1000 * 60 * 60) : null;
  }

  /**
   * Obtenir le temps restant en jours
   */
  getRemainingDays(): number | null {
    const remaining = this.getRemainingTime();
    return remaining ? remaining / (1000 * 60 * 60 * 24) : null;
  }

  /**
   * Obtenir l'utilisateur actuellement assigné
   */
  getCurrentAssignee(): string | null {
    return this.delegatedTo || this.assignedTo || null;
  }

  /**
   * Obtenir l'historique des actions
   */
  getActionHistory(): WorkflowAction[] {
    return this.actions?.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()) || [];
  }

  /**
   * Obtenir la dernière action
   */
  getLastAction(): WorkflowAction | null {
    const history = this.getActionHistory();
    return history.length > 0 ? history[history.length - 1] : null;
  }

  /**
   * Vérifier si l'instance peut être modifiée
   */
  canBeModified(): boolean {
    return this.isActive() && !this.isExpired();
  }

  /**
   * Vérifier si l'instance peut être assignée
   */
  canBeAssigned(): boolean {
    return this.isActive() && !this.isExpired();
  }

  /**
   * Vérifier si l'instance peut être déléguée
   */
  canBeDelegated(): boolean {
    return this.isActive() &&
           !this.isExpired() &&
           !!this.currentStep?.canDelegateTo();
  }

  /**
   * Obtenir le contexte de l'instance
   */
  getContext(): any {
    return this.context || {};
  }

  /**
   * Mettre à jour le contexte
   */
  updateContext(newContext: any): void {
    this.context = { ...this.context, ...newContext };
  }

  /**
   * Obtenir les métadonnées
   */
  getMetadata(): any {
    return this.metadata || {};
  }

  /**
   * Mettre à jour les métadonnées
   */
  updateMetadata(newMetadata: any): void {
    this.metadata = { ...this.metadata, ...newMetadata };
  }
}
