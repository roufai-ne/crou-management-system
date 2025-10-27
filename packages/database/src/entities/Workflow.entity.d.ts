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
import { Tenant } from './Tenant.entity';
import { WorkflowStep } from './WorkflowStep.entity';
import { WorkflowInstance } from './WorkflowInstance.entity';
export declare enum WorkflowType {
    SEQUENTIAL = "sequential",// Séquentiel (étape par étape)
    PARALLEL = "parallel",// Parallèle (toutes les étapes en même temps)
    CONDITIONAL = "conditional"
}
export declare enum WorkflowStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    INACTIVE = "inactive",
    ARCHIVED = "archived"
}
export declare enum WorkflowModule {
    FINANCIAL = "financial",
    STOCKS = "stocks",
    HOUSING = "housing",
    TRANSPORT = "transport",
    REPORTS = "reports"
}
export declare class Workflow {
    id: string;
    name: string;
    description: string;
    module: WorkflowModule;
    type: WorkflowType;
    status: WorkflowStatus;
    entityType: string;
    triggerEvent: string;
    conditions: any;
    metadata: any;
    isActive: boolean;
    version: number;
    tenantId: string;
    createdBy: string;
    updatedBy: string;
    createdAt: Date;
    updatedAt: Date;
    tenant: Tenant;
    steps: WorkflowStep[];
    instances: WorkflowInstance[];
    /**
     * Vérifier si le workflow peut être activé
     */
    canBeActivated(): boolean;
    /**
     * Activer le workflow
     */
    activate(): void;
    /**
     * Désactiver le workflow
     */
    deactivate(): void;
    /**
     * Archiver le workflow
     */
    archive(): void;
    /**
     * Obtenir les étapes dans l'ordre
     */
    getOrderedSteps(): WorkflowStep[];
    /**
     * Obtenir la première étape
     */
    getFirstStep(): WorkflowStep | null;
    /**
     * Obtenir la dernière étape
     */
    getLastStep(): WorkflowStep | null;
    /**
     * Obtenir l'étape suivante
     */
    getNextStep(currentStep: WorkflowStep): WorkflowStep | null;
    /**
     * Obtenir l'étape précédente
     */
    getPreviousStep(currentStep: WorkflowStep): WorkflowStep | null;
    /**
     * Vérifier si le workflow est valide
     */
    isValid(): boolean;
    /**
     * Cloner le workflow
     */
    clone(): Partial<Workflow>;
}
//# sourceMappingURL=Workflow.entity.d.ts.map