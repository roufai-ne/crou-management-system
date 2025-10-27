/**
 * FICHIER: apps\api\src\modules\workflows\workflow.service.ts
 * SERVICE: WorkflowService - Gestion des workflows
 * 
 * DESCRIPTION:
 * Service pour gérer les workflows de validation
 * Création, exécution, suivi des instances
 * Support multi-tenant avec permissions granulaires
 * 
 * FONCTIONNALITÉS:
 * - Gestion des workflows et étapes
 * - Exécution des instances
 * - Suivi des validations
 * - Gestion des délégations et escalades
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workflow, WorkflowType, WorkflowStatus, WorkflowModule } from '../../../../../packages/database/src/entities/Workflow.entity';
import { WorkflowStep, StepType, StepStatus } from '../../../../../packages/database/src/entities/WorkflowStep.entity';
import { WorkflowInstance, InstanceStatus, InstancePriority } from '../../../../../packages/database/src/entities/WorkflowInstance.entity';
import { WorkflowAction, ActionType, ActionStatus } from '../../../../../packages/database/src/entities/WorkflowAction.entity';
import { logger } from '@/shared/utils/logger';

// Interface pour la création de workflows
export interface CreateWorkflowDto {
  name: string;
  description?: string;
  module: WorkflowModule;
  type: WorkflowType;
  entityType?: string;
  triggerEvent?: string;
  conditions?: any;
  metadata?: any;
  steps: CreateWorkflowStepDto[];
}

export interface CreateWorkflowStepDto {
  name: string;
  description?: string;
  order: number;
  type: StepType;
  priority?: string;
  role?: string;
  permissions?: string[];
  conditions?: any;
  actions?: any;
  timeoutHours?: number;
  isRequired?: boolean;
  canSkip?: boolean;
  canReject?: boolean;
  canDelegate?: boolean;
  metadata?: any;
}

// Interface pour la création d'instances
export interface CreateInstanceDto {
  workflowId: string;
  entityType: string;
  entityId: string;
  title: string;
  description?: string;
  priority?: InstancePriority;
  context?: any;
  metadata?: any;
  assignedTo?: string;
}

// Interface pour les actions
export interface WorkflowActionDto {
  instanceId: string;
  type: ActionType;
  comment?: string;
  data?: any;
  targetUserId?: string;
}

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowStep)
    private stepRepository: Repository<WorkflowStep>,
    @InjectRepository(WorkflowInstance)
    private instanceRepository: Repository<WorkflowInstance>,
    @InjectRepository(WorkflowAction)
    private actionRepository: Repository<WorkflowAction>
  ) {}

  // ================================================================================================
  // GESTION DES WORKFLOWS
  // ================================================================================================

  /**
   * Créer un nouveau workflow
   */
  async createWorkflow(tenantId: string, userId: string, dto: CreateWorkflowDto): Promise<Workflow> {
    try {
      // Créer le workflow
      const workflow = this.workflowRepository.create({
        ...dto,
        tenantId,
        createdBy: userId,
        status: WorkflowStatus.DRAFT,
        isActive: true,
        version: 1
      });

      const savedWorkflow = await this.workflowRepository.save(workflow);

      // Créer les étapes
      const steps = dto.steps.map(stepDto => 
        this.stepRepository.create({
          ...stepDto,
          workflowId: savedWorkflow.id,
          isActive: true
        })
      );

      await this.stepRepository.save(steps);

      // Recharger le workflow avec les étapes
      return await this.workflowRepository.findOne({
        where: { id: savedWorkflow.id },
        relations: ['steps']
      });

    } catch (error) {
      logger.error('Erreur création workflow:', error);
      throw error;
    }
  }

  /**
   * Obtenir les workflows d'un tenant
   */
  async getWorkflows(tenantId: string, module?: WorkflowModule): Promise<Workflow[]> {
    const where: any = { tenantId, isActive: true };
    if (module) {
      where.module = module;
    }

    return await this.workflowRepository.find({
      where,
      relations: ['steps'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Obtenir un workflow par ID
   */
  async getWorkflow(id: string, tenantId: string): Promise<Workflow | null> {
    return await this.workflowRepository.findOne({
      where: { id, tenantId },
      relations: ['steps']
    });
  }

  /**
   * Activer un workflow
   */
  async activateWorkflow(id: string, tenantId: string, userId: string): Promise<Workflow> {
    const workflow = await this.getWorkflow(id, tenantId);
    if (!workflow) {
      throw new Error('Workflow non trouvé');
    }

    workflow.activate();
    workflow.updatedBy = userId;
    
    return await this.workflowRepository.save(workflow);
  }

  /**
   * Désactiver un workflow
   */
  async deactivateWorkflow(id: string, tenantId: string, userId: string): Promise<Workflow> {
    const workflow = await this.getWorkflow(id, tenantId);
    if (!workflow) {
      throw new Error('Workflow non trouvé');
    }

    workflow.deactivate();
    workflow.updatedBy = userId;
    
    return await this.workflowRepository.save(workflow);
  }

  // ================================================================================================
  // GESTION DES INSTANCES
  // ================================================================================================

  /**
   * Créer une nouvelle instance
   */
  async createInstance(tenantId: string, userId: string, dto: CreateInstanceDto): Promise<WorkflowInstance> {
    try {
      // Vérifier que le workflow existe
      const workflow = await this.getWorkflow(dto.workflowId, tenantId);
      if (!workflow) {
        throw new Error('Workflow non trouvé');
      }

      if (workflow.status !== WorkflowStatus.ACTIVE) {
        throw new Error('Workflow non actif');
      }

      // Créer l'instance
      const instance = this.instanceRepository.create({
        ...dto,
        tenantId,
        createdBy: userId,
        initiatedBy: userId,
        status: InstanceStatus.PENDING,
        priority: dto.priority || InstancePriority.MEDIUM
      });

      const savedInstance = await this.instanceRepository.save(instance);

      // Démarrer l'instance
      await this.startInstance(savedInstance.id, tenantId, userId);

      return savedInstance;

    } catch (error) {
      logger.error('Erreur création instance:', error);
      throw error;
    }
  }

  /**
   * Démarrer une instance
   */
  async startInstance(instanceId: string, tenantId: string, userId: string): Promise<WorkflowInstance> {
    const instance = await this.instanceRepository.findOne({
      where: { id: instanceId, tenantId },
      relations: ['workflow', 'workflow.steps']
    });

    if (!instance) {
      throw new Error('Instance non trouvée');
    }

    if (instance.status !== InstanceStatus.PENDING) {
      throw new Error('Instance déjà démarrée');
    }

    // Démarrer l'instance
    instance.start();
    instance.updatedBy = userId;

    // Assigner à la première étape
    const firstStep = instance.workflow.getFirstStep();
    if (firstStep) {
      instance.currentStepId = firstStep.id;
      instance.assignedTo = dto.assignedTo || userId;
    }

    // Enregistrer l'action de démarrage
    await this.createAction(instanceId, tenantId, userId, {
      type: ActionType.START,
      title: 'Démarrage du workflow',
      description: `Workflow "${instance.workflow.name}" démarré`
    });

    return await this.instanceRepository.save(instance);
  }

  /**
   * Obtenir les instances d'un utilisateur
   */
  async getUserInstances(tenantId: string, userId: string, status?: InstanceStatus): Promise<WorkflowInstance[]> {
    const where: any = { tenantId };
    
    if (status) {
      where.status = status;
    } else {
      where.status = InstanceStatus.IN_PROGRESS;
    }

    // Instances assignées à l'utilisateur ou déléguées
    where.assignedTo = userId;

    return await this.instanceRepository.find({
      where,
      relations: ['workflow', 'currentStep', 'actions'],
      order: { createdAt: 'DESC' }
    });
  }

  /**
   * Obtenir une instance par ID
   */
  async getInstance(id: string, tenantId: string): Promise<WorkflowInstance | null> {
    return await this.instanceRepository.findOne({
      where: { id, tenantId },
      relations: ['workflow', 'workflow.steps', 'currentStep', 'actions']
    });
  }

  // ================================================================================================
  // GESTION DES ACTIONS
  // ================================================================================================

  /**
   * Créer une action
   */
  async createAction(
    instanceId: string, 
    tenantId: string, 
    userId: string, 
    actionData: Partial<WorkflowActionDto>
  ): Promise<WorkflowAction> {
    const action = this.actionRepository.create({
      ...actionData,
      instanceId,
      tenantId,
      userId,
      status: ActionStatus.COMPLETED,
      processedAt: new Date()
    });

    return await this.actionRepository.save(action);
  }

  /**
   * Approuver une instance
   */
  async approveInstance(
    instanceId: string, 
    tenantId: string, 
    userId: string, 
    comment?: string
  ): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId, tenantId);
    if (!instance) {
      throw new Error('Instance non trouvée');
    }

    if (!instance.canBeModified()) {
      throw new Error('Instance non modifiable');
    }

    // Vérifier les permissions
    const currentStep = instance.currentStep;
    if (currentStep && !currentStep.hasRequiredPermissions(userId, [])) {
      throw new Error('Permissions insuffisantes');
    }

    // Enregistrer l'action d'approbation
    await this.createAction(instanceId, tenantId, userId, {
      type: ActionType.APPROVE,
      title: 'Approbation',
      comment,
      description: `Instance approuvée${comment ? `: ${comment}` : ''}`
    });

    // Passer à l'étape suivante ou terminer
    await this.moveToNextStep(instance, userId);

    return instance;
  }

  /**
   * Rejeter une instance
   */
  async rejectInstance(
    instanceId: string, 
    tenantId: string, 
    userId: string, 
    reason: string
  ): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId, tenantId);
    if (!instance) {
      throw new Error('Instance non trouvée');
    }

    if (!instance.canBeModified()) {
      throw new Error('Instance non modifiable');
    }

    // Vérifier les permissions
    const currentStep = instance.currentStep;
    if (currentStep && !currentStep.canRejectItem()) {
      throw new Error('Rejet non autorisé');
    }

    // Enregistrer l'action de rejet
    await this.createAction(instanceId, tenantId, userId, {
      type: ActionType.REJECT,
      title: 'Rejet',
      comment: reason,
      description: `Instance rejetée: ${reason}`
    });

    // Rejeter l'instance
    instance.reject(reason, userId);
    await this.instanceRepository.save(instance);

    return instance;
  }

  /**
   * Déléguer une instance
   */
  async delegateInstance(
    instanceId: string, 
    tenantId: string, 
    userId: string, 
    targetUserId: string,
    comment?: string
  ): Promise<WorkflowInstance> {
    const instance = await this.getInstance(instanceId, tenantId);
    if (!instance) {
      throw new Error('Instance non trouvée');
    }

    if (!instance.canBeDelegated()) {
      throw new Error('Délégation non autorisée');
    }

    // Enregistrer l'action de délégation
    await this.createAction(instanceId, tenantId, userId, {
      type: ActionType.DELEGATE,
      title: 'Délégation',
      comment,
      targetUserId,
      description: `Instance déléguée${comment ? `: ${comment}` : ''}`
    });

    // Déléguer l'instance
    instance.delegateTo(targetUserId);
    await this.instanceRepository.save(instance);

    return instance;
  }

  /**
   * Passer à l'étape suivante
   */
  private async moveToNextStep(instance: WorkflowInstance, userId: string): Promise<void> {
    const workflow = instance.workflow;
    const currentStep = instance.currentStep;

    if (!currentStep) {
      // Pas d'étape actuelle, terminer
      instance.complete();
      await this.createAction(instance.id, instance.tenantId, userId, {
        type: ActionType.COMPLETE,
        title: 'Finalisation',
        description: 'Workflow terminé'
      });
      return;
    }

    const nextStep = workflow.getNextStep(currentStep);
    
    if (nextStep) {
      // Passer à l'étape suivante
      instance.currentStepId = nextStep.id;
      instance.assignedTo = nextStep.role || instance.assignedTo;
      
      await this.createAction(instance.id, instance.tenantId, userId, {
        type: ActionType.APPROVE,
        title: 'Passage à l\'étape suivante',
        description: `Passage de "${currentStep.name}" à "${nextStep.name}"`
      });
    } else {
      // Dernière étape, terminer
      instance.complete();
      await this.createAction(instance.id, instance.tenantId, userId, {
        type: ActionType.COMPLETE,
        title: 'Finalisation',
        description: 'Workflow terminé'
      });
    }

    await this.instanceRepository.save(instance);
  }

  // ================================================================================================
  // MÉTHODES UTILITAIRES
  // ================================================================================================

  /**
   * Obtenir les statistiques des workflows
   */
  async getWorkflowStats(tenantId: string): Promise<any> {
    const totalWorkflows = await this.workflowRepository.count({ where: { tenantId } });
    const activeWorkflows = await this.workflowRepository.count({ 
      where: { tenantId, status: WorkflowStatus.ACTIVE } 
    });
    const totalInstances = await this.instanceRepository.count({ where: { tenantId } });
    const pendingInstances = await this.instanceRepository.count({ 
      where: { tenantId, status: InstanceStatus.IN_PROGRESS } 
    });

    return {
      totalWorkflows,
      activeWorkflows,
      totalInstances,
      pendingInstances
    };
  }

  /**
   * Nettoyer les instances expirées
   */
  async cleanupExpiredInstances(tenantId: string): Promise<number> {
    const expiredInstances = await this.instanceRepository.find({
      where: { 
        tenantId, 
        status: InstanceStatus.IN_PROGRESS,
        expiredAt: { $lt: new Date() } as any
      }
    });

    for (const instance of expiredInstances) {
      instance.expire();
      await this.createAction(instance.id, tenantId, 'system', {
        type: ActionType.EXPIRE,
        title: 'Expiration',
        description: 'Instance expirée automatiquement'
      });
    }

    await this.instanceRepository.save(expiredInstances);
    return expiredInstances.length;
  }
}
