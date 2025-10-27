/**
 * FICHIER: packages/database/src/enums/budget.enum.ts
 * ENUMS: Énumérations pour les budgets
 * 
 * DESCRIPTION:
 * Définit les types et statuts des budgets
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

export enum BudgetCategoryType {
  PERSONNEL = 'Personnel',
  FONCTIONNEMENT = 'Fonctionnement',
  INVESTISSEMENT = 'Investissement',
  SUBVENTION = 'Subvention',
  RECETTE = 'Recette',
}

export enum BudgetType {
  INITIAL = 'initial',
  SUPPLEMENTAIRE = 'supplementaire',
  RECTIFICATIF = 'rectificatif',
  REPORT = 'report'
}

export enum BudgetStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  EXECUTED = 'executed'
}