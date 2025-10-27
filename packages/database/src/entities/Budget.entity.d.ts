/**
 * FICHIER: packages\database\src\entities\Budget.entity.ts
 * ENTITÉ: Budget - Gestion budgétaire CROU
 *
 * DESCRIPTION:
 * Entité principale pour la gestion des budgets CROU
 * Support multi-tenant avec tenant_id (Ministère ou CROU)
 * Workflow de validation multiniveau intégré
 * Catégorisation et suivi trimestriel
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec BudgetCategory (catégories)
 * - OneToMany avec BudgetTrimester (trimestres)
 * - OneToMany avec Transaction (opérations)
 * - OneToMany avec ValidationStep (workflow)
 *
 * WORKFLOW:
 * - draft → submitted → approved → active → closed
 * - Validation selon seuils et niveaux
 * - Audit trail complet
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Tenant } from './Tenant.entity';
import { BudgetCategory } from './BudgetCategory.entity';
import { BudgetTrimester } from './BudgetTrimester.entity';
import { Transaction } from './Transaction.entity';
import { ValidationStep } from './ValidationStep.entity';
export declare enum BudgetType {
    NATIONAL = "national",// Budget national Ministère
    CROU = "crou",// Budget CROU régional
    SERVICE = "service"
}
export declare enum BudgetStatus {
    DRAFT = "draft",// Brouillon
    SUBMITTED = "submitted",// Soumis pour validation
    APPROVED = "approved",// Approuvé
    REJECTED = "rejected",// Rejeté
    ACTIVE = "active",// En cours d'exécution
    CLOSED = "closed"
}
export declare enum BudgetCategoryType {
    PERSONNEL = "personnel",// Salaires et charges
    FONCTIONNEMENT = "fonctionnement",// Dépenses courantes
    INVESTISSEMENT = "investissement",// Équipements et travaux
    SUBVENTION = "subvention",// Subventions gouvernementales
    RECETTE = "recette"
}
export declare class Budget {
    id: string;
    tenantId: string;
    tenant: Tenant;
    exercice: number;
    type: BudgetType;
    libelle: string;
    description: string;
    montantInitial: number;
    montantRealise: number;
    montantEngage: number;
    montantDisponible: number;
    tauxExecution: number;
    status: BudgetStatus;
    validationLevel: number;
    nextValidator: string;
    createdBy: string;
    approvedBy: string;
    approvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
    categories: BudgetCategory[];
    trimestres: BudgetTrimester[];
    transactions: Transaction[];
    validationSteps: ValidationStep[];
    /**
     * Calculer le montant disponible
     */
    calculateAvailableAmount(): number;
    /**
     * Calculer le taux d'exécution
     */
    calculateExecutionRate(): number;
    /**
     * Vérifier si le budget peut être modifié
     */
    canBeModified(): boolean;
    /**
     * Vérifier si le budget peut être soumis
     */
    canBeSubmitted(): boolean;
    /**
     * Vérifier si le budget peut être approuvé
     */
    canBeApproved(): boolean;
    /**
     * Mettre à jour les calculs automatiques
     */
    updateCalculations(): void;
    /**
     * Vérifier si le budget est en alerte
     */
    isInAlert(): boolean;
}
//# sourceMappingURL=Budget.entity.d.ts.map