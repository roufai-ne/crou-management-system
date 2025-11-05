/**
 * FICHIER: packages\database\src\entities\WorkflowStep.entity.ts
 * ENTITÉ: WorkflowStep - Étape de validation
 * 
 * DESCRIPTION:
 * Entité pour définir les étapes d'un workflow
 * Rôles, permissions, conditions et actions
 * Support des étapes parallèles et conditionnelles
 * 
 * FONCTIONNALITÉS:
 * - Définition des rôles autorisés
 * - Configuration des permissions requises
 * - Gestion des conditions d'activation
 * - Actions automatiques et manuelles
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
import { WorkflowInstance } from './WorkflowInstance.entity';

// Types pour les étapes
export enum StepType {
  APPROVAL = 'approval',     // Approbation manuelle
  AUTOMATIC = 'automatic',   // Traitement automatique
  NOTIFICATION = 'notification', // Notification
  CONDITION = 'condition'    // Étape conditionnelle
}

export enum StepStatus {
  PENDING = 'pending',       // En attente
  IN_PROGRESS = 'in_progress', // En cours
  COMPLETED = 'completed',   // Terminée
  SKIPPED = 'skipped',       // Ignorée
  CANCELLED = 'cancelled'    // Annulée
}

export enum StepPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

@Entity('workflow_steps')
@Index(['workflowId', 'order'])
@Index(['workflowId', 'status'])
export class WorkflowStep {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', name: 'workflow_id' })
  workflowId!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({ type: 'int' })
  order!: number;

  @Column({
    type: 'enum',
    enum: StepType,
    default: StepType.APPROVAL
  })
  type!: StepType;

  @Column({
    type: 'enum',
    enum: StepPriority,
    default: StepPriority.MEDIUM
  })
  priority!: StepPriority;

  @Column({
    type: 'enum',
    enum: StepStatus,
    default: StepStatus.PENDING
  })
  status!: StepStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  role!: string | null; // Rôle autorisé pour cette étape

  @Column({ type: 'jsonb', nullable: true })
  permissions!: string[] | null; // Permissions requises

  @Column({ type: 'jsonb', nullable: true })
  conditions: any; // Conditions d'activation

  @Column({ type: 'jsonb', nullable: true })
  actions: any; // Actions à effectuer

  @Column({ type: 'int', nullable: true })
  timeoutHours!: number | null; // Timeout en heures

  @Column({ type: 'boolean', default: false })
  isRequired!: boolean; // Étape obligatoire

  @Column({ type: 'boolean', default: false })
  canSkip!: boolean; // Peut être ignorée

  @Column({ type: 'boolean', default: false })
  canReject!: boolean; // Peut rejeter

  @Column({ type: 'boolean', default: true })
  canDelegate!: boolean; // Peut déléguer

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Métadonnées supplémentaires

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Workflow, workflow => workflow.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workflow_id' })
  workflow!: Workflow;

  @OneToMany(() => WorkflowInstance, instance => instance.currentStep)
  instances!: WorkflowInstance[];

  // Méthodes métier
  /**
   * Vérifier si l'étape est valide
   */
  isValid(): boolean {
    return !!(this.name && 
           this.order >= 0 && 
           this.type && 
           this.priority);
  }

  /**
   * Vérifier si l'étape peut être activée
   */
  canBeActivated(): boolean {
    return this.isActive && 
           this.isValid() && 
           this.workflow?.status === 'active';
  }

  /**
   * Vérifier si l'étape peut être ignorée
   */
  canBeSkipped(): boolean {
    return this.canSkip && 
           this.type === StepType.APPROVAL;
  }

  /**
   * Vérifier si l'étape peut rejeter
   */
  canRejectItem(): boolean {
    return this.canReject && 
           this.type === StepType.APPROVAL;
  }

  /**
   * Vérifier si l'étape peut déléguer
   */
  canDelegateTo(): boolean {
    return this.canDelegate && 
           this.type === StepType.APPROVAL;
  }

  /**
   * Obtenir les permissions requises
   */
  getRequiredPermissions(): string[] {
    return this.permissions || [];
  }

  /**
   * Vérifier si un rôle a les permissions requises
   */
  hasRequiredPermissions(userRole: string, userPermissions: string[]): boolean {
    if (this.role && this.role !== userRole) {
      return false;
    }

    const requiredPermissions = this.getRequiredPermissions();
    if (requiredPermissions.length === 0) {
      return true;
    }

    return requiredPermissions.every(permission => 
      userPermissions.includes(permission)
    );
  }

  /**
   * Obtenir les conditions d'activation
   */
  getActivationConditions(): any {
    return this.conditions || {};
  }

  /**
   * Vérifier si les conditions d'activation sont remplies
   */
  checkActivationConditions(context: any): boolean {
    const conditions = this.getActivationConditions();
    if (!conditions || Object.keys(conditions).length === 0) {
      return true;
    }

    // Logique de vérification des conditions
    // À implémenter selon les besoins spécifiques
    return true;
  }

  /**
   * Obtenir les actions à effectuer
   */
  getActions(): any {
    return this.actions || {};
  }

  /**
   * Exécuter les actions de l'étape
   */
  async executeActions(context: any): Promise<any> {
    const actions = this.getActions();
    if (!actions || Object.keys(actions).length === 0) {
      return {};
    }

    // Logique d'exécution des actions
    // À implémenter selon les besoins spécifiques
    return {};
  }

  /**
   * Obtenir le timeout en millisecondes
   */
  getTimeoutMs(): number | null {
    return this.timeoutHours ? this.timeoutHours * 60 * 60 * 1000 : null;
  }

  /**
   * Vérifier si l'étape a expiré
   */
  isExpired(startDate: Date): boolean {
    const timeoutMs = this.getTimeoutMs();
    if (!timeoutMs) {
      return false;
    }

    const now = new Date();
    const elapsed = now.getTime() - startDate.getTime();
    return elapsed > timeoutMs;
  }

  /**
   * Cloner l'étape
   */
  clone(): Partial<WorkflowStep> {
    return {
      name: `${this.name} (Copie)`,
      description: this.description,
      order: this.order,
      type: this.type,
      priority: this.priority,
      role: this.role,
      permissions: this.permissions,
      conditions: this.conditions,
      actions: this.actions,
      timeoutHours: this.timeoutHours,
      isRequired: this.isRequired,
      canSkip: this.canSkip,
      canReject: this.canReject,
      canDelegate: this.canDelegate,
      metadata: this.metadata,
      isActive: true
    };
  }
}
