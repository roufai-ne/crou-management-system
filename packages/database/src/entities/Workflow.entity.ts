/**
 * FICHIER: packages\database\src\entities\Workflow.entity.ts
 * ENTITÉ: Workflow - Circuit de validation
 * 
 * DESCRIPTION:
 * Entité pour définir les circuits de validation
 * Workflows configurables par module et type
 * Support multi-tenant avec permissions granulaires
 * 
 * FONCTIONNALITÉS:
 * - Définition des étapes de validation
 * - Configuration des rôles et permissions
 * - Gestion des conditions et règles
 * - Support des workflows parallèles et séquentiels
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
import { Tenant } from './Tenant.entity';
import { WorkflowStep } from './WorkflowStep.entity';
import { WorkflowInstance } from './WorkflowInstance.entity';

// Types pour les workflows
export enum WorkflowType {
  SEQUENTIAL = 'sequential', // Séquentiel (étape par étape)
  PARALLEL = 'parallel',     // Parallèle (toutes les étapes en même temps)
  CONDITIONAL = 'conditional' // Conditionnel (selon les conditions)
}

export enum WorkflowStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived'
}

export enum WorkflowModule {
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  HOUSING = 'housing',
  TRANSPORT = 'transport',
  REPORTS = 'reports'
}

@Entity('workflows')
@Index(['tenantId', 'module', 'type'])
@Index(['tenantId', 'status'])
export class Workflow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: WorkflowModule,
    name: 'module'
  })
  module: WorkflowModule;

  @Column({
    type: 'enum',
    enum: WorkflowType,
    default: WorkflowType.SEQUENTIAL
  })
  type: WorkflowType;

  @Column({
    type: 'enum',
    enum: WorkflowStatus,
    default: WorkflowStatus.DRAFT
  })
  status: WorkflowStatus;

  @Column({ type: 'varchar', length: 100, nullable: true })
  entityType: string; // Type d'entité concernée (Budget, Transaction, etc.)

  @Column({ type: 'varchar', length: 100, nullable: true })
  triggerEvent: string; // Événement déclencheur (create, update, delete)

  @Column({ type: 'jsonb', nullable: true })
  conditions: any; // Conditions d'activation du workflow

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Métadonnées supplémentaires

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  version: number;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'uuid', name: 'updated_by', nullable: true })
  updatedBy: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @OneToMany(() => WorkflowStep, step => step.workflow, { cascade: true })
  steps: WorkflowStep[];

  @OneToMany(() => WorkflowInstance, instance => instance.workflow)
  instances: WorkflowInstance[];

  // Méthodes métier
  /**
   * Vérifier si le workflow peut être activé
   */
  canBeActivated(): boolean {
    return this.status === WorkflowStatus.DRAFT && 
           this.steps && 
           this.steps.length > 0 &&
           this.steps.every(step => step.isValid());
  }

  /**
   * Activer le workflow
   */
  activate(): void {
    if (this.canBeActivated()) {
      this.status = WorkflowStatus.ACTIVE;
      this.isActive = true;
    }
  }

  /**
   * Désactiver le workflow
   */
  deactivate(): void {
    this.status = WorkflowStatus.INACTIVE;
    this.isActive = false;
  }

  /**
   * Archiver le workflow
   */
  archive(): void {
    this.status = WorkflowStatus.ARCHIVED;
    this.isActive = false;
  }

  /**
   * Obtenir les étapes dans l'ordre
   */
  getOrderedSteps(): WorkflowStep[] {
    return this.steps?.sort((a, b) => a.order - b.order) || [];
  }

  /**
   * Obtenir la première étape
   */
  getFirstStep(): WorkflowStep | null {
    const orderedSteps = this.getOrderedSteps();
    return orderedSteps.length > 0 ? orderedSteps[0] : null;
  }

  /**
   * Obtenir la dernière étape
   */
  getLastStep(): WorkflowStep | null {
    const orderedSteps = this.getOrderedSteps();
    return orderedSteps.length > 0 ? orderedSteps[orderedSteps.length - 1] : null;
  }

  /**
   * Obtenir l'étape suivante
   */
  getNextStep(currentStep: WorkflowStep): WorkflowStep | null {
    const orderedSteps = this.getOrderedSteps();
    const currentIndex = orderedSteps.findIndex(step => step.id === currentStep.id);
    
    if (currentIndex === -1 || currentIndex >= orderedSteps.length - 1) {
      return null;
    }
    
    return orderedSteps[currentIndex + 1];
  }

  /**
   * Obtenir l'étape précédente
   */
  getPreviousStep(currentStep: WorkflowStep): WorkflowStep | null {
    const orderedSteps = this.getOrderedSteps();
    const currentIndex = orderedSteps.findIndex(step => step.id === currentStep.id);
    
    if (currentIndex <= 0) {
      return null;
    }
    
    return orderedSteps[currentIndex - 1];
  }

  /**
   * Vérifier si le workflow est valide
   */
  isValid(): boolean {
    return !!(this.name && 
           this.module && 
           this.type && 
           this.steps && 
           this.steps.length > 0 &&
           this.steps.every(step => step.isValid()));
  }

  /**
   * Cloner le workflow
   */
  clone(): Partial<Workflow> {
    return {
      name: `${this.name} (Copie)`,
      description: this.description,
      module: this.module,
      type: this.type,
      entityType: this.entityType,
      triggerEvent: this.triggerEvent,
      conditions: this.conditions,
      metadata: this.metadata,
      status: WorkflowStatus.DRAFT,
      isActive: false,
      version: 0
    };
  }
}
