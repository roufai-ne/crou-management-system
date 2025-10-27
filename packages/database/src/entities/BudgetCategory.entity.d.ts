/**
 * FICHIER: packages\database\src\entities\BudgetCategory.entity.ts
 * ENTITÉ: BudgetCategory - Catégories budgétaires CROU
 *
 * DESCRIPTION:
 * Catégories de dépenses pour organiser les budgets
 * Support des types de catégories selon PRD
 * Répartition des montants par catégorie
 * Suivi des écarts et alertes
 *
 * RELATIONS:
 * - ManyToOne avec Budget (budget parent)
 * - OneToMany avec Transaction (opérations par catégorie)
 *
 * TYPES DE CATÉGORIES:
 * - Personnel: Salaires et charges sociales
 * - Fonctionnement: Dépenses courantes
 * - Investissement: Équipements et travaux
 * - Subvention: Subventions gouvernementales
 * - Recette: Recettes propres
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Budget, BudgetCategoryType } from './Budget.entity';
import { Transaction } from './Transaction.entity';
export declare class BudgetCategory {
    id: string;
    budgetId: string;
    budget: Budget;
    libelle: string;
    description: string;
    type: BudgetCategoryType;
    code: string;
    montantAlloue: number;
    montantRealise: number;
    montantEngage: number;
    montantDisponible: number;
    tauxExecution: number;
    pourcentageBudget: number;
    isActive: boolean;
    ordre: number;
    seuilAlerte: number;
    enAlerte: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    transactions: Transaction[];
    /**
     * Calculer le montant disponible
     */
    calculateAvailableAmount(): number;
    /**
     * Calculer le taux d'exécution
     */
    calculateExecutionRate(): number;
    /**
     * Calculer le pourcentage du budget total
     */
    calculateBudgetPercentage(totalBudget: number): number;
    /**
     * Vérifier si la catégorie est en alerte
     */
    checkAlert(): boolean;
    /**
     * Mettre à jour tous les calculs
     */
    updateCalculations(totalBudget: number): void;
    /**
     * Ajouter une transaction à cette catégorie
     */
    addTransaction(amount: number, isEngagement?: boolean): void;
    /**
     * Vérifier si la catégorie peut recevoir une transaction
     */
    canReceiveTransaction(amount: number): boolean;
}
//# sourceMappingURL=BudgetCategory.entity.d.ts.map