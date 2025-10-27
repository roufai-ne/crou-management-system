/**
 * FICHIER: packages\database\src\entities\StockMovement.entity.ts
 * ENTITÉ: StockMovement - Mouvements de stock
 * 
 * DESCRIPTION:
 * Entité pour tracer tous les mouvements de stock
 * Entrées, sorties, ajustements, transferts
 * Traçabilité complète avec justificatifs
 * 
 * RELATIONS:
 * - ManyToOne avec Stock (produit concerné)
 * - ManyToOne avec Tenant (contexte)
 * - ManyToOne avec User (utilisateur)
 * 
 * TYPES DE MOUVEMENTS:
 * - Entrée: Réception de marchandises
 * - Sortie: Distribution ou vente
 * - Ajustement: Correction d'inventaire
 * - Transfert: Mouvement entre CROU
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
import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { MovementStatus } from '../enums/movementStatus.enum';
import { Stock } from './Stock.entity';
import { Tenant } from './Tenant.entity';
import { User } from './User.entity';

// Types de mouvements de stock
export enum MovementType {
  ENTREE = 'entree',             // Entrée de stock
  SORTIE = 'sortie',             // Sortie de stock
  AJUSTEMENT = 'ajustement',     // Ajustement d'inventaire
  TRANSFERT = 'transfert',       // Transfert entre CROU
  PERTE = 'perte',               // Perte ou casse
  RETOUR = 'retour'              // Retour fournisseur
}

// Motifs des mouvements
export enum MovementReason {
  // Entrées
  RECEPTION = 'reception',       // Réception de commande
  DON = 'don',                   // Don ou subvention
  TRANSFERT_ENTREE = 'transfert_entree', // Transfert entrant
  INVENTAIRE_PLUS = 'inventaire_plus',   // Ajustement inventaire (+)
  
  // Sorties
  DISTRIBUTION = 'distribution', // Distribution aux étudiants
  VENTE = 'vente',               // Vente de tickets
  CONSOMMATION = 'consommation', // Consommation interne
  TRANSFERT_SORTIE = 'transfert_sortie', // Transfert sortant
  MAINTENANCE = 'maintenance',   // Utilisation maintenance
  INVENTAIRE_MOINS = 'inventaire_moins', // Ajustement inventaire (-)
  
  // Autres
  PERTE = 'perte',               // Perte ou casse
  VOL = 'vol',                   // Vol ou détournement
  PERTE_QUALITE = 'perte_qualite', // Perte qualité
  RETOUR_FOURNISSEUR = 'retour_fournisseur' // Retour fournisseur
}

export { MovementStatus };

@Entity('stock_movements')
@Index(['stockId', 'date']) // Index pour requêtes par stock
@Index(['tenantId', 'type']) // Index pour requêtes multi-tenant
@Index(['date', 'type']) // Index pour rapports
export class StockMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec stock
  @Column({ name: 'stock_id', type: 'uuid', nullable: false })
  stockId: string;

  @ManyToOne(() => Stock, stock => stock.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  // Relation avec tenant
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 100 })
  @IsString()
  numero: string; // Numéro de mouvement unique

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  libelle: string; // Libellé du mouvement

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string;

  @Column({ type: 'enum', enum: MovementType })
  @IsEnum(MovementType)
  type: MovementType;

  @Column({ type: 'enum', enum: MovementReason })
  @IsEnum(MovementReason)
  reason: MovementReason;

  @Column({ type: 'enum', enum: MovementStatus, default: MovementStatus.DRAFT })
  @IsEnum(MovementStatus)
  status: MovementStatus;

  // Quantités
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  @IsNumber()
  quantite: number; // Quantité du mouvement

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  quantiteAvant: number; // Quantité avant mouvement

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  quantiteApres: number; // Quantité après mouvement

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  unit: string; // Unité de mesure

  // Valorisation
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  prixUnitaire: number; // Prix unitaire en FCFA

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  valeurTotale: number; // Valeur totale du mouvement

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string; // Devise (FCFA par défaut)

  // Informations de traçabilité
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  numeroBon: string; // Numéro de bon de livraison

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  numeroFacture: string; // Numéro de facture

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  fournisseur: string; // Fournisseur

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  beneficiaire: string; // Bénéficiaire (pour sorties)

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  destinataire: string; // Destinataire (pour transferts)

  // Dates
  @Column({ type: 'date' })
  date: Date; // Date du mouvement

  @Column({ type: 'timestamp', nullable: true })
  dateConfirmation: Date; // Date de confirmation

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
  confirmedBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string;

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Méthodes de validation
  /**
   * Vérifier si le mouvement peut être modifié
   */
  canBeModified(): boolean {
    return this.status === MovementStatus.DRAFT;
  }

  /**
   * Vérifier si le mouvement peut être confirmé
   */
  canBeConfirmed(): boolean {
    return this.status === MovementStatus.DRAFT && this.quantite > 0;
  }

  /**
   * Confirmer le mouvement
   */
  confirm(confirmedBy: string): void {
    this.status = MovementStatus.CONFIRMED;
    this.confirmedBy = confirmedBy;
    this.dateConfirmation = new Date();
  }

  /**
   * Annuler le mouvement
   */
  cancel(): void {
    this.status = MovementStatus.CANCELLED;
  }

  /**
   * Calculer la valeur totale
   */
  calculateTotalValue(): number {
    return this.quantite * (this.prixUnitaire || 0);
  }

  /**
   * Mettre à jour les calculs
   */
  updateCalculations(): void {
    this.valeurTotale = this.calculateTotalValue();
  }

  /**
   * Obtenir le signe de la quantité selon le type
   */
  getSignedQuantity(): number {
    const positiveTypes = [MovementType.ENTREE, MovementType.RETOUR];
    return positiveTypes.includes(this.type) ? Math.abs(this.quantite) : -Math.abs(this.quantite);
  }

  /**
   * Vérifier si c'est une entrée
   */
  isEntry(): boolean {
    return [MovementType.ENTREE, MovementType.RETOUR].includes(this.type);
  }

  /**
   * Vérifier si c'est une sortie
   */
  isExit(): boolean {
    return [MovementType.SORTIE, MovementType.PERTE, MovementType.TRANSFERT].includes(this.type);
  }

  /**
   * Obtenir le type formaté
   */
  getTypeLabel(): string {
    const labels = {
      [MovementType.ENTREE]: 'Entrée',
      [MovementType.SORTIE]: 'Sortie',
      [MovementType.AJUSTEMENT]: 'Ajustement',
      [MovementType.TRANSFERT]: 'Transfert',
      [MovementType.PERTE]: 'Perte',
      [MovementType.RETOUR]: 'Retour'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir le motif formaté
   */
  getReasonLabel(): string {
    const labels = {
      [MovementReason.RECEPTION]: 'Réception',
      [MovementReason.DON]: 'Don',
      [MovementReason.TRANSFERT_ENTREE]: 'Transfert entrant',
      [MovementReason.INVENTAIRE_PLUS]: 'Inventaire (+)',
      [MovementReason.DISTRIBUTION]: 'Distribution',
      [MovementReason.VENTE]: 'Vente',
      [MovementReason.CONSOMMATION]: 'Consommation',
      [MovementReason.TRANSFERT_SORTIE]: 'Transfert sortant',
      [MovementReason.MAINTENANCE]: 'Maintenance',
      [MovementReason.INVENTAIRE_MOINS]: 'Inventaire (-)',
      [MovementReason.PERTE]: 'Perte',
      [MovementReason.VOL]: 'Vol',
      [MovementReason.PERTE_QUALITE]: 'Perte qualité',
      [MovementReason.RETOUR_FOURNISSEUR]: 'Retour fournisseur'
    };
    return labels[this.reason] || 'Inconnu';
  }
}
