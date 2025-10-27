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
import { User } from './User.entity';
import { Tenant } from './Tenant.entity';
import { Budget } from './Budget.entity';
import { Transaction } from './Transaction.entity';
export declare enum ValidationEntityType {
    BUDGET = "budget",
    TRANSACTION = "transaction",
    PURCHASE_ORDER = "purchase_order",
    CONTRACT = "contract"
}
export declare enum ValidationStepStatus {
    PENDING = "pending",// En attente
    APPROVED = "approved",// Approuvé
    REJECTED = "rejected",// Rejeté
    DELEGATED = "delegated",// Délégué
    EXPIRED = "expired",// Expiré
    CANCELLED = "cancelled"
}
export declare enum ValidationLevel {
    CROU_DIRECTOR = 0,// Directeur CROU
    CROU_FINANCIAL = 1,// Chef financier CROU
    MINISTRY_FINANCIAL = 2,// Directeur finances Ministère
    MINISTER = 3
}
export declare class ValidationStep {
    id: string;
    tenantId: string;
    tenant: Tenant;
    entityType: ValidationEntityType;
    entityId: string;
    budgetId: string;
    budget: Budget;
    transactionId: string;
    transaction: Transaction;
    level: number;
    validatorId: string;
    validator: User;
    status: ValidationStepStatus;
    comment: string;
    rejectionReason: string;
    dueDate: Date;
    completedAt: Date;
    isEscalated: boolean;
    escalatedTo: string;
    delegatedTo: string;
    delegationReason: string;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    /**
     * Vérifier si l'étape est en attente
     */
    isPending(): boolean;
    /**
     * Vérifier si l'étape est expirée
     */
    isExpired(): boolean;
    /**
     * Vérifier si l'étape peut être validée
     */
    canBeValidated(): boolean;
    /**
     * Marquer comme approuvé
     */
    approve(comment?: string): void;
    /**
     * Marquer comme rejeté
     */
    reject(reason: string, comment?: string): void;
    /**
     * Déléguer à un autre validateur
     */
    delegate(delegateId: string, reason: string): void;
    /**
     * Marquer comme expiré
     */
    markAsExpired(): void;
    /**
     * Calculer le temps restant en heures
     */
    getTimeRemaining(): number;
    /**
     * Vérifier si l'escalade est nécessaire
     */
    shouldEscalate(): boolean;
    /**
     * Obtenir le statut formaté
     */
    getStatusLabel(): string;
    /**
     * Obtenir le niveau de validation formaté
     */
    getLevelLabel(): string;
}
//# sourceMappingURL=ValidationStep.entity.d.ts.map