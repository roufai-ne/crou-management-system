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

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  CreateDateColumn, 
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { IsEnum, IsNumber, IsString, Min, Max } from 'class-validator';

import { Budget } from './Budget.entity';

// Trimestres de l'année
export enum Trimester {
  T1 = 1, // Janvier-Mars
  T2 = 2, // Avril-Juin
  T3 = 3, // Juillet-Septembre
  T4 = 4  // Octobre-Décembre
}

@Entity('budget_trimesters')
@Index(['budgetId', 'trimester']) // Index pour requêtes par budget
@Index(['budgetId', 'exercice']) // Index pour requêtes par exercice
export class BudgetTrimester {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec budget parent
  @Column({ name: 'budget_id', type: 'uuid' })
  budgetId: string;

  @ManyToOne(() => Budget, budget => budget.trimestres, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  // Informations de base
  @Column({ type: 'int' })
  @IsNumber()
  exercice: number; // Année budgétaire

  @Column({ type: 'enum', enum: Trimester })
  @IsEnum(Trimester)
  trimester: Trimester;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  libelle: string; // Ex: "T1 2024", "T2 2024"

  // Montants trimestriels
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  montantAlloue: number; // Montant alloué pour ce trimestre

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
  @Max(100)
  tauxExecution: number; // Taux d'exécution en %

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  pourcentageBudget: number; // Pourcentage du budget annuel

  // Dates du trimestre
  @Column({ type: 'date' })
  dateDebut: Date; // Date de début du trimestre

  @Column({ type: 'date' })
  dateFin: Date; // Date de fin du trimestre

  // Alertes et seuils
  @Column({ type: 'boolean', default: false })
  enAlerte: boolean; // Indicateur d'alerte

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 90 })
  @IsNumber()
  @Min(0)
  @Max(100)
  seuilAlerte: number; // Seuil d'alerte en %

  @Column({ type: 'boolean', default: false })
  depasse: boolean; // Indicateur de dépassement

  // Métadonnées
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  updatedBy: string;

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
   * Calculer le pourcentage du budget annuel
   */
  calculateBudgetPercentage(totalBudget: number): number {
    if (totalBudget === 0) return 0;
    return (this.montantAlloue / totalBudget) * 100;
  }

  /**
   * Vérifier si le trimestre est en alerte
   */
  checkAlert(): boolean {
    const executionRate = this.calculateExecutionRate();
    this.enAlerte = executionRate >= this.seuilAlerte;
    return this.enAlerte;
  }

  /**
   * Vérifier si le trimestre est dépassé
   */
  checkOverrun(): boolean {
    this.depasse = this.montantRealise > this.montantAlloue;
    return this.depasse;
  }

  /**
   * Mettre à jour tous les calculs
   */
  updateCalculations(totalBudget: number): void {
    this.montantDisponible = this.calculateAvailableAmount();
    this.tauxExecution = this.calculateExecutionRate();
    this.pourcentageBudget = this.calculateBudgetPercentage(totalBudget);
    this.checkAlert();
    this.checkOverrun();
  }

  /**
   * Obtenir le libellé du trimestre
   */
  getTrimesterLabel(): string {
    const labels = {
      [Trimester.T1]: 'T1',
      [Trimester.T2]: 'T2',
      [Trimester.T3]: 'T3',
      [Trimester.T4]: 'T4'
    };
    return `${labels[this.trimester]} ${this.exercice}`;
  }

  /**
   * Obtenir les mois du trimestre
   */
  getTrimesterMonths(): string[] {
    const months = {
      [Trimester.T1]: ['Janvier', 'Février', 'Mars'],
      [Trimester.T2]: ['Avril', 'Mai', 'Juin'],
      [Trimester.T3]: ['Juillet', 'Août', 'Septembre'],
      [Trimester.T4]: ['Octobre', 'Novembre', 'Décembre']
    };
    return months[this.trimester] || [];
  }

  /**
   * Vérifier si le trimestre est en cours
   */
  isCurrentTrimester(): boolean {
    const now = new Date();
    return now >= this.dateDebut && now <= this.dateFin;
  }

  /**
   * Vérifier si le trimestre est terminé
   */
  isCompleted(): boolean {
    const now = new Date();
    return now > this.dateFin;
  }

  /**
   * Obtenir le nombre de jours restants
   */
  getDaysRemaining(): number {
    const now = new Date();
    const diff = this.dateFin.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Obtenir le pourcentage de temps écoulé
   */
  getTimeElapsedPercentage(): number {
    const now = new Date();
    const total = this.dateFin.getTime() - this.dateDebut.getTime();
    const elapsed = now.getTime() - this.dateDebut.getTime();
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  }
}
