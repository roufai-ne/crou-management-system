/**
 * FICHIER: packages\database\src\entities\BudgetCategory.entity.ts
 * ENTITÉ: BudgetCategory - Catégories budgétaires CROU
 * * DESCRIPTION:
 * Catégories de dépenses pour organiser les budgets
 * Support des types de catégories selon PRD
 * Répartition des montants par catégorie
 * Suivi des écarts et alertes
 * * RELATIONS:
 * - ManyToOne avec Budget (budget parent)
 * - OneToMany avec Transaction (opérations par catégorie)
 * * TYPES DE CATÉGORIES:
 * - Personnel: Salaires et charges sociales
 * - Fonctionnement: Dépenses courantes
 * - Investissement: Équipements et travaux
 * - Subvention: Subventions gouvernementales
 * - Recette: Recettes propres
 * * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany,
  CreateDateColumn, 
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { IsEnum, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

import { Budget } from './Budget.entity';
import { BudgetCategoryType } from '../enums/budget.enum';

import { Transaction } from './Transaction.entity';

@Entity('budget_categories')
@Index(['budgetId', 'type']) // Index pour requêtes par budget
export class BudgetCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec budget parent
  @ManyToOne(() => Budget, budget => budget.categories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ name: 'budget_id', type: 'uuid' }) // La clé étrangère est déclarée explicitement ici.
  budgetId: string;

  // Informations de base
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  libelle: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string;

  @Column({ type: 'enum', enum: BudgetCategoryType })
  @IsEnum(BudgetCategoryType)
  type: BudgetCategoryType;

  @Column({ type: 'varchar', length: 10, nullable: true })
  @IsOptional()
  @IsString()
  code: string; // Code comptable (ex: 601, 602, etc.)

  // Montants par catégorie
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  montantAlloue: number; // Montant alloué à cette catégorie

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantRealise: number; // Montant réalisé

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantEngage: number; // Montant engagé

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantDisponible: number; // Montant disponible

  // Calculs automatiques
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  tauxExecution: number; // Taux d'exécution en %

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  pourcentageBudget: number; // Pourcentage du budget total

  // Configuration
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  ordre: number; // Ordre d'affichage

  // Seuils d'alerte
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  seuilAlerte: number; // Seuil d'alerte en %

  @Column({ type: 'boolean', default: false })
  enAlerte: boolean; // Indicateur d'alerte

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string;

  // Relations
  @OneToMany(() => Transaction, transaction => transaction.budgetCategory)
  transactions: Transaction[];

  // Méthodes de calcul
  /**
   * Calculer le montant disponible
   */
  calculateAvailableAmount(): number {
    return this.montantAlloue - this.montantRealise - this.montantEngage;
  }

  /**
   * Calculer le taux d'exécution
   */
  calculateExecutionRate(): number {
    if (this.montantAlloue === 0) return 0;
    return (this.montantRealise / this.montantAlloue) * 100;
  }

  /**
   * Calculer le pourcentage du budget total
   */
  calculateBudgetPercentage(totalBudget: number): number {
    if (totalBudget === 0) return 0;
    return (this.montantAlloue / totalBudget) * 100;
  }

  /**
   * Vérifier si la catégorie est en alerte
   */
  checkAlert(): boolean {
    const executionRate = this.calculateExecutionRate();
    this.enAlerte = executionRate >= this.seuilAlerte;
    return this.enAlerte;
  }

  /**
   * Mettre à jour tous les calculs
   */
  updateCalculations(totalBudget: number): void {
    this.montantDisponible = this.calculateAvailableAmount();
    this.tauxExecution = this.calculateExecutionRate();
    this.pourcentageBudget = this.calculateBudgetPercentage(totalBudget);
    this.checkAlert();
  }

  /**
   * Ajouter une transaction à cette catégorie
   */
  addTransaction(amount: number, isEngagement: boolean = false): void {
    if (isEngagement) {
      this.montantEngage += amount;
    } else {
      this.montantRealise += amount;
    }
    this.updateCalculations(this.budget?.montantInitial || 0);
  }

  /**
   * Vérifier si la catégorie peut recevoir une transaction
   */
  canReceiveTransaction(amount: number): boolean {
    return this.montantDisponible >= amount;
  }
}