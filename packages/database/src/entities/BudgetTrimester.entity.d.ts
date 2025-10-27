/**
 * FICHIER: packages\database\src\entities\BudgetTrimester.entity.ts
 * ENTITÉ: BudgetTrimester - Suivi trimestriel des budgets
 *
 * DESCRIPTION:
 * Entité pour le suivi trimestriel des budgets CROU
 * Répartition des montants par trimestre
 * Suivi des réalisations et écarts
 * Alertes de dépassement
 *
 * RELATIONS:
 * - ManyToOne avec Budget (budget parent)
 *
 * TRIMESTRES:
 * - T1: Janvier-Mars
 * - T2: Avril-Juin
 * - T3: Juillet-Septembre
 * - T4: Octobre-Décembre
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Budget } from './Budget.entity';
export declare enum Trimester {
    T1 = 1,// Janvier-Mars
    T2 = 2,// Avril-Juin
    T3 = 3,// Juillet-Septembre
    T4 = 4
}
export declare class BudgetTrimester {
    id: string;
    budgetId: string;
    budget: Budget;
    exercice: number;
    trimester: Trimester;
    libelle: string;
    montantAlloue: number;
    montantRealise: number;
    montantEngage: number;
    montantDisponible: number;
    tauxExecution: number;
    pourcentageBudget: number;
    dateDebut: Date;
    dateFin: Date;
    enAlerte: boolean;
    seuilAlerte: number;
    depasse: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    /**
     * Calculer le montant disponible
     */
    calculateAvailableAmount(): number;
    /**
     * Calculer le taux d'exécution
     */
    calculateExecutionRate(): number;
    /**
     * Calculer le pourcentage du budget annuel
     */
    calculateBudgetPercentage(totalBudget: number): number;
    /**
     * Vérifier si le trimestre est en alerte
     */
    checkAlert(): boolean;
    /**
     * Vérifier si le trimestre est dépassé
     */
    checkOverrun(): boolean;
    /**
     * Mettre à jour tous les calculs
     */
    updateCalculations(totalBudget: number): void;
    /**
     * Obtenir le libellé du trimestre
     */
    getTrimesterLabel(): string;
    /**
     * Obtenir les mois du trimestre
     */
    getTrimesterMonths(): string[];
    /**
     * Vérifier si le trimestre est en cours
     */
    isCurrentTrimester(): boolean;
    /**
     * Vérifier si le trimestre est terminé
     */
    isCompleted(): boolean;
    /**
     * Obtenir le nombre de jours restants
     */
    getDaysRemaining(): number;
    /**
     * Obtenir le pourcentage de temps écoulé
     */
    getTimeElapsedPercentage(): number;
}
//# sourceMappingURL=BudgetTrimester.entity.d.ts.map