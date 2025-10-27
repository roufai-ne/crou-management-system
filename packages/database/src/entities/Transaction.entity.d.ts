/**
 * FICHIER: packages\database\src\entities\Transaction.entity.ts
 * ENTITÉ: Transaction - Opérations financières CROU
 *
 * DESCRIPTION:
 * Entité pour toutes les opérations financières du système
 * Support multi-tenant avec tenant_id
 * Liaison avec budgets et catégories
 * Workflow de validation intégré
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - ManyToOne avec Budget (budget concerné)
 * - ManyToOne avec BudgetCategory (catégorie)
 * - ManyToOne avec User (créateur)
 * - OneToMany avec ValidationStep (workflow)
 *
 * TYPES DE TRANSACTIONS:
 * - Dépense: Sortie d'argent
 * - Recette: Entrée d'argent
 * - Engagement: Réservation de budget
 * - Ajustement: Correction budgétaire
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { Tenant } from './Tenant.entity';
import { User } from './User.entity';
import { Budget } from './Budget.entity';
import { BudgetCategory } from './BudgetCategory.entity';
import { ValidationStep } from './ValidationStep.entity';
export declare enum TransactionType {
    DEPENSE = "depense",// Sortie d'argent
    RECETTE = "recette",// Entrée d'argent
    ENGAGEMENT = "engagement",// Réservation de budget
    AJUSTEMENT = "ajustement",// Correction budgétaire
    VIREMENT = "virement"
}
export declare enum TransactionStatus {
    DRAFT = "draft",// Brouillon
    SUBMITTED = "submitted",// Soumis pour validation
    APPROVED = "approved",// Approuvé
    REJECTED = "rejected",// Rejeté
    EXECUTED = "executed",// Exécuté
    CANCELLED = "cancelled"
}
export declare enum TransactionCategory {
    SALAIRES = "salaires",// Salaires et charges
    FOURNITURES = "fournitures",// Fournitures de bureau
    MAINTENANCE = "maintenance",// Maintenance et réparations
    TRANSPORT = "transport",// Frais de transport
    COMMUNICATION = "communication",// Téléphone, internet
    FORMATION = "formation",// Formation du personnel
    EQUIPEMENT = "equipement",// Achat d'équipements
    TRAVAUX = "travaux",// Travaux et aménagements
    LOYERS = "loyers",// Loyers étudiants
    TICKETS = "tickets",// Vente de tickets restaurant
    SUBVENTIONS = "subventions",// Subventions gouvernementales
    AUTRES = "autres"
}
export declare class Transaction {
    id: string;
    tenantId: string;
    tenant: Tenant;
    budgetId: string;
    budget: Budget;
    budgetCategoryId: string;
    budgetCategory: BudgetCategory;
    libelle: string;
    description: string;
    type: TransactionType;
    category: TransactionCategory;
    status: TransactionStatus;
    montant: number;
    devise: string;
    montantDevise: number;
    tauxChange: number;
    numeroPiece: string;
    reference: string;
    beneficiaire: string;
    modePaiement: string;
    date: Date;
    dateEcheance: Date;
    dateExecution: Date;
    validationLevel: number;
    nextValidator: string;
    createdBy: string;
    creator: User;
    approvedBy: string;
    approvedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    updatedBy: string;
    validationSteps: ValidationStep[];
    /**
     * Vérifier si la transaction peut être modifiée
     */
    canBeModified(): boolean;
    /**
     * Vérifier si la transaction peut être soumise
     */
    canBeSubmitted(): boolean;
    /**
     * Vérifier si la transaction peut être approuvée
     */
    canBeApproved(): boolean;
    /**
     * Vérifier si la transaction peut être exécutée
     */
    canBeExecuted(): boolean;
    /**
     * Calculer le montant en FCFA
     */
    getAmountInFCFA(): number;
    /**
     * Vérifier si la transaction est une dépense
     */
    isExpense(): boolean;
    /**
     * Vérifier si la transaction est une recette
     */
    isRevenue(): boolean;
    /**
     * Obtenir le signe du montant selon le type
     */
    getSignedAmount(): number;
}
//# sourceMappingURL=Transaction.entity.d.ts.map