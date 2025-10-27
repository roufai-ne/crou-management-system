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

import { Tenant } from './Tenant.entity';
import { User } from './User.entity';
import { BudgetCategoryType } from '../enums/budget.enum';
import { BudgetCategory } from './BudgetCategory.entity';
import { BudgetTrimester } from './BudgetTrimester.entity';
import { Transaction } from './Transaction.entity';
import { ValidationStep } from './ValidationStep.entity';

// Types des budgets selon PRD
export enum BudgetType {
  NATIONAL = 'national',      // Budget national Ministère
  CROU = 'crou',             // Budget CROU régional
  SERVICE = 'service'         // Budget par service (restauration, logement, etc.)
}

export enum BudgetStatus {
  DRAFT = 'draft',           // Brouillon
  SUBMITTED = 'submitted',   // Soumis pour validation
  APPROVED = 'approved',     // Approuvé
  REJECTED = 'rejected',     // Rejeté
  ACTIVE = 'active',         // En cours d'exécution
  CLOSED = 'closed'          // Clôturé
}
export { BudgetCategoryType };


@Entity('budgets')
@Index(['tenantId', 'exercice']) // Index pour requêtes multi-tenant
@Index(['tenantId', 'type', 'status']) // Index pour filtres
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant (CROU ou Ministère)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'int' })
  @IsNumber()
  exercice: number; // Année budgétaire

  @Column({ type: 'enum', enum: BudgetType })
  @IsEnum(BudgetType)
  type: BudgetType;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  libelle: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string;

  // Montants budgétaires
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  montantInitial: number; // Montant initial alloué

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantRealise: number; // Montant réalisé

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantEngage: number; // Montant engagé (commandes)

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

  // Statut et workflow
  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.DRAFT })
  @IsEnum(BudgetStatus)
  status: BudgetStatus;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  validationLevel: number; // Niveau de validation (0=CROU, 1=Ministère)

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  nextValidator: string; // Prochain validateur

  // Métadonnées
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string;

  // Relations
  @OneToMany(() => BudgetCategory, category => category.budget, { cascade: true })
  categories: BudgetCategory[];

  @OneToMany(() => BudgetTrimester, trimester => trimester.budget, { cascade: true })
  trimestres: BudgetTrimester[];

  @OneToMany(() => Transaction, transaction => transaction.budget)
  transactions: Transaction[];

  @OneToMany(() => ValidationStep, step => step.budget, { cascade: true })
  validationSteps: ValidationStep[];

  // Méthodes de calcul
  /**
   * Calculer le montant disponible
   */
  calculateAvailableAmount(): number {
    return this.montantInitial - this.montantRealise - this.montantEngage;
  }

  /**
   * Calculer le taux d'exécution
   */
  calculateExecutionRate(): number {
    if (this.montantInitial === 0) return 0;
    return (this.montantRealise / this.montantInitial) * 100;
  }

  /**
   * Vérifier si le budget peut être modifié
   */
  canBeModified(): boolean {
    return [BudgetStatus.DRAFT, BudgetStatus.REJECTED].includes(this.status);
  }

  /**
   * Vérifier si le budget peut être soumis
   */
  canBeSubmitted(): boolean {
    return this.status === BudgetStatus.DRAFT && this.montantInitial > 0;
  }

  /**
   * Vérifier si le budget peut être approuvé
   */
  canBeApproved(): boolean {
    return this.status === BudgetStatus.SUBMITTED;
  }

  /**
   * Mettre à jour les calculs automatiques
   */
  updateCalculations(): void {
    this.montantDisponible = this.calculateAvailableAmount();
    this.tauxExecution = this.calculateExecutionRate();
  }

  /**
   * Vérifier si le budget est en alerte
   */
  isInAlert(): boolean {
    return this.tauxExecution > 90 || this.montantDisponible < (this.montantInitial * 0.1);
  }
}
