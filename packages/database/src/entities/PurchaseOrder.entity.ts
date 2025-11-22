/**
 * FICHIER: packages\database\src\entities\PurchaseOrder.entity.ts
 * ENTITÃ‰: PurchaseOrder - Bons de commande CROU
 * 
 * DESCRIPTION:
 * EntitÃ© pour la gestion des bons de commande (achats)
 * Pont entre le module Financial (budget) et Stocks (rÃ©ception)
 * Support multi-tenant avec workflow de validation
 * 
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU)
 * - ManyToOne avec Budget (engagement budgÃ©taire)
 * - ManyToOne avec Supplier (fournisseur)
 * - OneToMany avec PurchaseOrderItem (lignes de commande)
 * - OneToMany avec StockMovement (rÃ©ceptions)
 * 
 * WORKFLOW:
 * - draft â†’ submitted â†’ approved â†’ ordered â†’ received â†’ closed
 * - PossibilitÃ© d'annulation Ã  chaque Ã©tape
 * 
 * AUTEUR: Ã‰quipe CROU
 * DATE: Novembre 2025
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
import { Supplier } from './Supplier.entity';
import { PurchaseOrderItem } from './PurchaseOrderItem.entity';
import { StockMovement } from './StockMovement.entity';

// Statuts du bon de commande
export enum PurchaseOrderStatus {
  DRAFT = 'draft',               // Brouillon (en cours de rÃ©daction)
  SUBMITTED = 'submitted',       // Soumis pour validation
  APPROVED = 'approved',         // ApprouvÃ© (budget engagÃ©)
  ORDERED = 'ordered',           // CommandÃ© (envoyÃ© au fournisseur)
  PARTIALLY_RECEIVED = 'partially_received', // Partiellement rÃ©ceptionnÃ©
  RECEIVED = 'received',         // Totalement rÃ©ceptionnÃ©
  CLOSED = 'closed',             // ClÃ´turÃ©
  CANCELLED = 'cancelled'        // AnnulÃ©
}

// Types de commande
export enum PurchaseOrderType {
  STANDARD = 'standard',         // Commande standard
  URGENT = 'urgent',            // Commande urgente
  RECURRING = 'recurring',      // Commande rÃ©currente
  FRAMEWORK = 'framework'       // Commande cadre (marchÃ©)
}

// Mode de paiement
export enum PaymentMethod {
  VIREMENT = 'virement',        // Virement bancaire
  CHEQUE = 'cheque',            // ChÃ¨que
  ESPECES = 'especes',          // EspÃ¨ces (< seuil)
  MANDAT = 'mandat'             // Mandat administratif
}

@Entity('purchase_orders')
@Index(['tenantId', 'status']) // Index pour requÃªtes multi-tenant
@Index(['tenantId', 'reference']) // Index pour recherche par rÃ©fÃ©rence
@Index(['supplierId', 'status']) // Index pour requÃªtes par fournisseur
@Index(['dateCommande', 'status']) // Index pour rapports
export class PurchaseOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant (CROU)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // RÃ©fÃ©rence unique
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  reference: string; // BC-2025-001, BC-NIAMEY-001

  // Relation avec budget
  @Column({ type: 'uuid', name: 'budget_id' })
  budgetId: string;

  @ManyToOne('Budget', { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  // Relation avec fournisseur
  @Column({ type: 'uuid', name: 'supplier_id' })
  supplierId: string;

  @ManyToOne(() => Supplier, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier: any;

  // Informations de base
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  objet: string; // Objet de la commande

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;

  @Column({ type: 'enum', enum: PurchaseOrderType, default: PurchaseOrderType.STANDARD })
  @IsEnum(PurchaseOrderType)
  type: PurchaseOrderType;

  @Column({ type: 'enum', enum: PurchaseOrderStatus, default: PurchaseOrderStatus.DRAFT })
  @IsEnum(PurchaseOrderStatus)
  status: PurchaseOrderStatus;

  // Dates
  @Column({ type: 'date' })
  dateCommande: Date; // Date de crÃ©ation de la commande

  @Column({ type: 'date', nullable: true })
  dateEcheance: Date | null; // Date de livraison prÃ©vue

  @Column({ type: 'date', nullable: true })
  dateApprobation: Date | null;

  @Column({ type: 'date', nullable: true })
  dateEnvoi: Date | null; // Date d'envoi au fournisseur

  @Column({ type: 'date', nullable: true })
  dateReception: Date | null; // Date de rÃ©ception complÃ¨te

  // Montants
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  montantHT: number; // Montant hors taxes

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantTVA: number; // Montant TVA

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  montantTTC: number; // Montant toutes taxes comprises

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantReceptionne: number; // Montant dÃ©jÃ  rÃ©ceptionnÃ©

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string; // FCFA par dÃ©faut

  // Conditions de paiement
  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.VIREMENT })
  @IsEnum(PaymentMethod)
  modePaiement: PaymentMethod;

  @Column({ type: 'int', default: 30 })
  @IsNumber()
  delaiPaiement: number; // DÃ©lai de paiement en jours

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  conditionsParticulieres: string | null;

  // Livraison
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  adresseLivraison: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  contactLivraison: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  telephoneLivraison: string | null;

  // Workflow et validation
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string; // Financier qui crÃ©e le BC

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  approvedBy: string | null; // Directeur qui approuve

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  receivedBy: string | null; // Gestionnaire stock qui rÃ©ceptionne

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  commentaireApprobation: string | null;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  commentaireReception: string | null;

  // Statut de rÃ©ception
  @Column({ type: 'boolean', default: false })
  isPartiallyReceived: boolean;

  @Column({ type: 'boolean', default: false })
  isFullyReceived: boolean;

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  nombreReceptions: number; // Nombre de rÃ©ceptions partielles

  // Annulation
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  cancelledBy: string;

  @Column({ type: 'date', nullable: true })
  dateCancellation: Date;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  motifAnnulation: string;

  // Relations inverses
  @OneToMany(() => PurchaseOrderItem, item => item.purchaseOrder, { cascade: true })
  items: PurchaseOrderItem[];

  @OneToMany('StockMovement', 'purchaseOrder')
  receptions: any[];

  // MÃ©tadonnÃ©es
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // MÃ©thodes utilitaires
  /**
   * VÃ©rifier si le BC peut Ãªtre modifiÃ©
   */
  canBeModified(): boolean {
    return this.status === PurchaseOrderStatus.DRAFT;
  }

  /**
   * VÃ©rifier si le BC peut Ãªtre soumis
   */
  canBeSubmitted(): boolean {
    return this.status === PurchaseOrderStatus.DRAFT && this.items && this.items.length > 0;
  }

  /**
   * VÃ©rifier si le BC peut Ãªtre approuvÃ©
   */
  canBeApproved(): boolean {
    return this.status === PurchaseOrderStatus.SUBMITTED;
  }

  /**
   * VÃ©rifier si le BC peut Ãªtre annulÃ©
   */
  canBeCancelled(): boolean {
    return [
      PurchaseOrderStatus.DRAFT,
      PurchaseOrderStatus.SUBMITTED,
      PurchaseOrderStatus.APPROVED,
      PurchaseOrderStatus.ORDERED
    ].includes(this.status);
  }

  /**
   * Calculer le montant total
   */
  calculateTotal(): void {
    if (this.items && this.items.length > 0) {
      this.montantHT = this.items.reduce((sum, item) => sum + item.montantTotal, 0);
      this.montantTVA = this.montantHT * 0.19; // TVA 19% Niger
      this.montantTTC = this.montantHT + this.montantTVA;
    }
  }

  /**
   * VÃ©rifier si complÃ¨tement rÃ©ceptionnÃ©
   */
  checkFullyReceived(): void {
    if (this.items && this.items.length > 0) {
      const allReceived = this.items.every(item => item.quantiteRecue >= item.quantiteCommandee);
      this.isFullyReceived = allReceived;
      
      const someReceived = this.items.some(item => item.quantiteRecue > 0);
      this.isPartiallyReceived = someReceived && !allReceived;

      if (this.isFullyReceived) {
        this.status = PurchaseOrderStatus.RECEIVED;
      } else if (this.isPartiallyReceived) {
        this.status = PurchaseOrderStatus.PARTIALLY_RECEIVED;
      }
    }
  }
}
