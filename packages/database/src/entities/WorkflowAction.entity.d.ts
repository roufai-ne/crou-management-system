/**
 * FICHIER: packages\database\src\entities\WorkflowAction.entity.ts
 * ENTITÉ: WorkflowAction - Action de workflow
 *
 * DESCRIPTION:
 * Entité pour enregistrer les actions effectuées
 * Historique complet des validations
 * Support multi-tenant avec traçabilité
 *
 * FONCTIONNALITÉS:
 * - Enregistrement des actions utilisateur
 * - Historique des validations et rejets
 * - Gestion des délégations et escalades
 * - Traçabilité complète des décisions
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { WorkflowInstance } from './WorkflowInstance.entity';
export declare enum ActionType {
    APPROVE = "approve",// Approbation
    REJECT = "reject",// Rejet
    DELEGATE = "delegate",// Délégation
    ESCALATE = "escalate",// Escalade
    SKIP = "skip",// Ignorer
    COMMENT = "comment",// Commentaire
    ASSIGN = "assign",// Assignment
    CANCEL = "cancel",// Annulation
    EXPIRE = "expire",// Expiration
    START = "start",// Démarrage
    COMPLETE = "complete"
}
export declare enum ActionStatus {
    PENDING = "pending",// En attente
    PROCESSING = "processing",// En cours de traitement
    COMPLETED = "completed",// Terminée
    FAILED = "failed"
}
export declare class WorkflowAction {
    id: string;
    instanceId: string;
    type: ActionType;
    status: ActionStatus;
    title: string;
    description: string;
    comment: string;
    data: any;
    metadata: any;
    userId: string;
    userRole: string;
    userName: string;
    targetUserId: string;
    targetUserRole: string;
    targetUserName: string;
    processedAt: Date;
    errorMessage: string;
    tenantId: string;
    createdAt: Date;
    instance: WorkflowInstance;
    /**
     * Marquer l'action comme en cours de traitement
     */
    markAsProcessing(): void;
    /**
     * Marquer l'action comme terminée
     */
    markAsCompleted(): void;
    /**
     * Marquer l'action comme échouée
     */
    markAsFailed(errorMessage: string): void;
    /**
     * Vérifier si l'action est terminée
     */
    isCompleted(): boolean;
    /**
     * Vérifier si l'action a échoué
     */
    isFailed(): boolean;
    /**
     * Vérifier si l'action est en cours
     */
    isProcessing(): boolean;
    /**
     * Vérifier si l'action est en attente
     */
    isPending(): boolean;
    /**
     * Obtenir les données de l'action
     */
    getData(): any;
    /**
     * Mettre à jour les données
     */
    updateData(newData: any): void;
    /**
     * Obtenir les métadonnées
     */
    getMetadata(): any;
    /**
     * Mettre à jour les métadonnées
     */
    updateMetadata(newMetadata: any): void;
    /**
     * Obtenir la durée de traitement en millisecondes
     */
    getProcessingTime(): number | null;
    /**
     * Obtenir la durée de traitement en minutes
     */
    getProcessingTimeMinutes(): number | null;
    /**
     * Vérifier si l'action est une approbation
     */
    isApproval(): boolean;
    /**
     * Vérifier si l'action est un rejet
     */
    isRejection(): boolean;
    /**
     * Vérifier si l'action est une délégation
     */
    isDelegation(): boolean;
    /**
     * Vérifier si l'action est une escalade
     */
    isEscalation(): boolean;
    /**
     * Vérifier si l'action est un commentaire
     */
    isComment(): boolean;
    /**
     * Obtenir le message de l'action
     */
    getMessage(): string;
    /**
     * Obtenir le message complet de l'action
     */
    getFullMessage(): string;
    /**
     * Obtenir l'utilisateur cible
     */
    getTargetUser(): {
        id: string;
        name: string;
        role: string;
    } | null;
    /**
     * Obtenir l'utilisateur qui a effectué l'action
     */
    getUser(): {
        id: string;
        name: string;
        role: string;
    };
}
//# sourceMappingURL=WorkflowAction.entity.d.ts.map