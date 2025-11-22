/**
 * FICHIER: packages\database\src\entities\PurchaseOrderItem.entity.ts
 * ENTITÃ‰: PurchaseOrderItem - Lignes de bon de commande
 * 
 * DESCRIPTION:
 * EntitÃ© pour les articles d'un bon de commande
 * DÃ©tail des quantitÃ©s, prix et rÃ©ceptions
 * 
 * RELATIONS:
 * - ManyToOne avec PurchaseOrder (bon de commande parent)
 * - ManyToOne avec Stock (article commandÃ©)
 * 
 * AUTEUR: Ã‰quipe CROU
 * DATE: Novembre 2025
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
import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

import { PurchaseOrder } from './PurchaseOrder.entity';
import { Stock } from './Stock.entity';

@Entity('purchase_order_items')
@Index(['purchaseOrderId']) // Index pour requÃªtes par commande
@Index(['stockId']) // Index pour requÃªtes par article
export class PurchaseOrderItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec bon de commande
  @Column({ type: 'uuid', name: 'purchase_order_id' })
  purchaseOrderId: string;

  @ManyToOne(() => PurchaseOrder, order => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_order_id' })
  purchaseOrder: any;

  // Relation avec article de stock (optionnelle pour nouveaux articles)
  @Column({ type: 'uuid', name: 'stock_id', nullable: true })
  @IsOptional()
  stockId: string | null;

  @ManyToOne('Stock', { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  // NumÃ©ro de ligne
  @Column({ type: 'int' })
  @IsNumber()
  numeroLigne: number;

  // Informations article
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  codeArticle: string | null; // Code article (peut Ãªtre diffÃ©rent du stock si nouvel article)

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  designation: string; // DÃ©signation de l'article

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  reference: string | null; // RÃ©fÃ©rence fournisseur

  // QuantitÃ©s
  @Column({ type: 'decimal', precision: 10, scale: 3 })
  @IsNumber()
  @Min(0)
  quantiteCommandee: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  @IsNumber()
  @Min(0)
  quantiteRecue: number;

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  @IsNumber()
  @Min(0)
  quantiteRestante: number; // QuantitÃ© restant Ã  recevoir

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  unite: string; // kg, unitÃ©, carton, etc.

  // Prix
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  prixUnitaire: number; // Prix unitaire HT

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  montantTotal: number; // Montant total ligne (quantitÃ© Ã— prix)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 19 })
  @IsNumber()
  @Min(0)
  tauxTVA: number; // Taux TVA en %

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantTVA: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantTTC: number;

  // Remise
  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  tauxRemise: number; // Remise en %

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  montantRemise: number;

  // DÃ©lais et statut
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  delaiLivraison: number | null; // DÃ©lai de livraison en jours

  @Column({ type: 'boolean', default: false })
  isReceived: boolean; // Ligne complÃ¨tement reÃ§ue

  @Column({ type: 'boolean', default: false })
  isPartiallyReceived: boolean; // Ligne partiellement reÃ§ue

  // Notes
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes: string | null;

  // MÃ©tadonnÃ©es
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // MÃ©thodes utilitaires
  /**
   * Calculer le montant total
   */
  calculateTotal(): void {
    // Appliquer la remise
    const montantAvantRemise = this.quantiteCommandee * this.prixUnitaire;
    this.montantRemise = montantAvantRemise * (this.tauxRemise / 100);
    this.montantTotal = montantAvantRemise - this.montantRemise;

    // Calculer TVA
    this.montantTVA = this.montantTotal * (this.tauxTVA / 100);
    this.montantTTC = this.montantTotal + this.montantTVA;
  }

  /**
   * Mettre Ã  jour la quantitÃ© restante
   */
  updateRemainingQuantity(): void {
    this.quantiteRestante = this.quantiteCommandee - this.quantiteRecue;
    this.isReceived = this.quantiteRecue >= this.quantiteCommandee;
    this.isPartiallyReceived = this.quantiteRecue > 0 && !this.isReceived;
  }

  /**
   * Enregistrer une rÃ©ception
   */
  recordReception(quantite: number): void {
    this.quantiteRecue += quantite;
    this.updateRemainingQuantity();
  }
}
