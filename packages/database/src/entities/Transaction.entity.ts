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
import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { User } from './User.entity';
import { Budget } from './Budget.entity';
import { BudgetCategory } from './BudgetCategory.entity';
import { ValidationStep } from './ValidationStep.entity';

// Types de transactions selon PRD
export enum TransactionType {
  DEPENSE = 'depense',           // Sortie d'argent
  RECETTE = 'recette',           // Entrée d'argent
  ENGAGEMENT = 'engagement',     // Réservation de budget
  AJUSTEMENT = 'ajustement',     // Correction budgétaire
  VIREMENT = 'virement'          // Virement interne
}

export enum TransactionStatus {
  DRAFT = 'draft',               // Brouillon
  SUBMITTED = 'submitted',       // Soumis pour validation
  APPROVED = 'approved',         // Approuvé
  REJECTED = 'rejected',         // Rejeté
  EXECUTED = 'executed',         // Exécuté
  CANCELLED = 'cancelled'        // Annulé
}

export enum TransactionCategory {
  // Dépenses
  SALAIRES = 'salaires',         // Salaires et charges
  FOURNITURES = 'fournitures',   // Fournitures de bureau
  MAINTENANCE = 'maintenance',   // Maintenance et réparations
  TRANSPORT = 'transport',       // Frais de transport
  COMMUNICATION = 'communication', // Téléphone, internet
  FORMATION = 'formation',       // Formation du personnel
  EQUIPEMENT = 'equipement',     // Achat d'équipements
  TRAVAUX = 'travaux',           // Travaux et aménagements
  
  // Recettes
  LOYERS = 'loyers',             // Loyers étudiants
  TICKETS = 'tickets',           // Vente de tickets restaurant
  SUBVENTIONS = 'subventions',   // Subventions gouvernementales
  AUTRES = 'autres'              // Autres recettes
}

@Entity('transactions')
@Index(['tenantId', 'date']) // Index pour requêtes multi-tenant
@Index(['budgetId', 'status']) // Index pour requêtes par budget
@Index(['type', 'status']) // Index pour filtres
export class Transaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant (CROU ou Ministère)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Relations avec budget et catégorie
  @Column({ type: 'uuid', name: 'budget_id' })
  budgetId: string;

  @ManyToOne(() => Budget, budget => budget.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @Column({ type: 'uuid', name: 'budget_category_id', nullable: true })
  budgetCategoryId: string;

  @ManyToOne(() => BudgetCategory, category => category.transactions, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'budget_category_id' })
  budgetCategory: BudgetCategory;

  // Informations de base
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  libelle: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string;

  @Column({ type: 'enum', enum: TransactionType })
  @IsEnum(TransactionType)
  type: TransactionType;

  @Column({ type: 'enum', enum: TransactionCategory })
  @IsEnum(TransactionCategory)
  category: TransactionCategory;

  @Column({ type: 'enum', enum: TransactionStatus, default: TransactionStatus.DRAFT })
  @IsEnum(TransactionStatus)
  status: TransactionStatus;

  // Montants
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  montant: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string; // FCFA par défaut

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  montantDevise: number; // Montant dans la devise d'origine

  @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
  @IsOptional()
  @IsNumber()
  tauxChange: number; // Taux de change si devise différente

  // Informations de paiement
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  numeroPiece: string; // Numéro de pièce comptable

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  reference: string; // Référence externe

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  beneficiaire: string; // Bénéficiaire du paiement

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  modePaiement: string; // Virement, chèque, espèces

  // Dates importantes
  @Column({ type: 'date' })
  date: Date; // Date de l'opération

  @Column({ type: 'date', nullable: true })
  dateEcheance: Date; // Date d'échéance pour les engagements

  @Column({ type: 'date', nullable: true })
  dateExecution: Date; // Date d'exécution effective

  // Workflow de validation
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  validationLevel: number; // Niveau de validation requis

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  nextValidator: string; // Prochain validateur

  // Métadonnées
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

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
  @OneToMany(() => ValidationStep, step => step.transaction, { cascade: true })
  validationSteps: ValidationStep[];

  // Méthodes de validation
  /**
   * Vérifier si la transaction peut être modifiée
   */
  canBeModified(): boolean {
    return [TransactionStatus.DRAFT, TransactionStatus.REJECTED].includes(this.status);
  }

  /**
   * Vérifier si la transaction peut être soumise
   */
  canBeSubmitted(): boolean {
    return this.status === TransactionStatus.DRAFT && this.montant > 0;
  }

  /**
   * Vérifier si la transaction peut être approuvée
   */
  canBeApproved(): boolean {
    return this.status === TransactionStatus.SUBMITTED;
  }

  /**
   * Vérifier si la transaction peut être exécutée
   */
  canBeExecuted(): boolean {
    return this.status === TransactionStatus.APPROVED;
  }

  /**
   * Calculer le montant en FCFA
   */
  getAmountInFCFA(): number {
    if (this.devise === 'XOF') return this.montant;
    return this.montantDevise * (this.tauxChange || 1);
  }

  /**
   * Vérifier si la transaction est une dépense
   */
  isExpense(): boolean {
    return [TransactionType.DEPENSE, TransactionType.ENGAGEMENT].includes(this.type);
  }

  /**
   * Vérifier si la transaction est une recette
   */
  isRevenue(): boolean {
    return this.type === TransactionType.RECETTE;
  }

  /**
   * Obtenir le signe du montant selon le type
   */
  getSignedAmount(): number {
    return this.isExpense() ? -Math.abs(this.montant) : Math.abs(this.montant);
  }
}
