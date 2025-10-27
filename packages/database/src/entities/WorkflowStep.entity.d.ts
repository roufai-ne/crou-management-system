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
import { Workflow } from './Workflow.entity';
import { WorkflowInstance } from './WorkflowInstance.entity';
export declare enum StepType {
    APPROVAL = "approval",// Approbation manuelle
    AUTOMATIC = "automatic",// Traitement automatique
    NOTIFICATION = "notification",// Notification
    CONDITION = "condition"
}
export declare enum StepStatus {
    PENDING = "pending",// En attente
    IN_PROGRESS = "in_progress",// En cours
    COMPLETED = "completed",// Terminée
    SKIPPED = "skipped",// Ignorée
    CANCELLED = "cancelled"
}
export declare enum StepPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare class WorkflowStep {
    id: string;
    workflowId: string;
    name: string;
    description: string;
    order: number;
    type: StepType;
    priority: StepPriority;
    role: string;
    permissions: string[];
    conditions: any;
    actions: any;
    timeoutHours: number;
    isRequired: boolean;
    canSkip: boolean;
    canReject: boolean;
    canDelegate: boolean;
    metadata: any;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    workflow: Workflow;
    instances: WorkflowInstance[];
    /**
     * Vérifier si l'étape est valide
     */
    isValid(): boolean;
    /**
     * Vérifier si l'étape peut être activée
     */
    canBeActivated(): boolean;
    /**
     * Vérifier si l'étape peut être ignorée
     */
    canBeSkipped(): boolean;
    /**
     * Vérifier si l'étape peut rejeter
     */
    canRejectItem(): boolean;
    /**
     * Vérifier si l'étape peut déléguer
     */
    canDelegateTo(): boolean;
    /**
     * Obtenir les permissions requises
     */
    getRequiredPermissions(): string[];
    /**
     * Vérifier si un rôle a les permissions requises
     */
    hasRequiredPermissions(userRole: string, userPermissions: string[]): boolean;
    /**
     * Obtenir les conditions d'activation
     */
    getActivationConditions(): any;
    /**
     * Vérifier si les conditions d'activation sont remplies
     */
    checkActivationConditions(context: any): boolean;
    /**
     * Obtenir les actions à effectuer
     */
    getActions(): any;
    /**
     * Exécuter les actions de l'étape
     */
    executeActions(context: any): Promise<any>;
    /**
     * Obtenir le timeout en millisecondes
     */
    getTimeoutMs(): number | null;
    /**
     * Vérifier si l'étape a expiré
     */
    isExpired(startDate: Date): boolean;
    /**
     * Cloner l'étape
     */
    clone(): Partial<WorkflowStep>;
}
//# sourceMappingURL=WorkflowStep.entity.d.ts.map