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
import { Workflow } from './Workflow.entity';
import { WorkflowStep } from './WorkflowStep.entity';
import { WorkflowAction } from './WorkflowAction.entity';
export declare enum InstanceStatus {
    PENDING = "pending",// En attente
    IN_PROGRESS = "in_progress",// En cours
    COMPLETED = "completed",// Terminée
    REJECTED = "rejected",// Rejetée
    CANCELLED = "cancelled",// Annulée
    EXPIRED = "expired"
}
export declare enum InstancePriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class WorkflowInstance {
    id: string;
    workflowId: string;
    currentStepId: string;
    entityType: string;
    entityId: string;
    status: InstanceStatus;
    priority: InstancePriority;
    title: string;
    description: string;
    context: any;
    metadata: any;
    startedAt: Date;
    completedAt: Date;
    expiredAt: Date;
    initiatedBy: string;
    assignedTo: string;
    delegatedTo: string;
    rejectionReason: string;
    cancellationReason: string;
    tenantId: string;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    workflow: Workflow;
    currentStep: WorkflowStep;
    actions: WorkflowAction[];
    /**
     * Démarrer l'instance
     */
    start(): void;
    /**
     * Terminer l'instance
     */
    complete(): void;
    /**
     * Rejeter l'instance
     */
    reject(reason: string, rejectedBy: string): void;
    /**
     * Annuler l'instance
     */
    cancel(reason: string, cancelledBy: string): void;
    /**
     * Marquer comme expirée
     */
    expire(): void;
    /**
     * Assigner à un utilisateur
     */
    assignTo(userId: string): void;
    /**
     * Déléguer à un utilisateur
     */
    delegateTo(userId: string): void;
    /**
     * Vérifier si l'instance est active
     */
    isActive(): boolean;
    /**
     * Vérifier si l'instance est terminée
     */
    isCompleted(): boolean;
    /**
     * Vérifier si l'instance a expiré
     */
    isExpired(): boolean;
    /**
     * Obtenir la durée écoulée en millisecondes
     */
    getElapsedTime(): number;
    /**
     * Obtenir la durée écoulée en heures
     */
    getElapsedHours(): number;
    /**
     * Obtenir la durée écoulée en jours
     */
    getElapsedDays(): number;
    /**
     * Obtenir le temps restant en millisecondes
     */
    getRemainingTime(): number | null;
    /**
     * Obtenir le temps restant en heures
     */
    getRemainingHours(): number | null;
    /**
     * Obtenir le temps restant en jours
     */
    getRemainingDays(): number | null;
    /**
     * Obtenir l'utilisateur actuellement assigné
     */
    getCurrentAssignee(): string | null;
    /**
     * Obtenir l'historique des actions
     */
    getActionHistory(): WorkflowAction[];
    /**
     * Obtenir la dernière action
     */
    getLastAction(): WorkflowAction | null;
    /**
     * Vérifier si l'instance peut être modifiée
     */
    canBeModified(): boolean;
    /**
     * Vérifier si l'instance peut être assignée
     */
    canBeAssigned(): boolean;
    /**
     * Vérifier si l'instance peut être déléguée
     */
    canBeDelegated(): boolean;
    /**
     * Obtenir le contexte de l'instance
     */
    getContext(): any;
    /**
     * Mettre à jour le contexte
     */
    updateContext(newContext: any): void;
    /**
     * Obtenir les métadonnées
     */
    getMetadata(): any;
    /**
     * Mettre à jour les métadonnées
     */
    updateMetadata(newMetadata: any): void;
}
//# sourceMappingURL=WorkflowInstance.entity.d.ts.map