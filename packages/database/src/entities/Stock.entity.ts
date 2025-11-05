/**
 * FICHIER: packages\database\src\entities\Stock.entity.ts
 * ENTITÉ: Stock - Gestion des stocks CROU
 * 
 * DESCRIPTION:
 * Entité pour la gestion des stocks et inventaires
 * Support multi-tenant avec tenant_id
 * Gestion des seuils et alertes automatiques
 * Valorisation et traçabilité des mouvements
 * 
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec StockMovement (mouvements)
 * - OneToMany avec StockAlert (alertes)
 * 
 * TYPES DE STOCKS:
 * - Centralisé: Céréales, équipements (Ministère)
 * - Local: Denrées périssables, fournitures (CROU)
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
import { StockMovement } from './StockMovement.entity';
import { StockAlert } from './StockAlert.entity';
import { Supplier } from './Supplier.entity';

// Types de stocks selon PRD
export enum StockType {
  CENTRALISE = 'centralise',     // Stocks centralisés (Ministère)
  LOCAL = 'local'               // Stocks locaux (CROU)
}

export enum StockCategory {
  CEREALES = 'cereales',         // Riz, mil, sorgho, maïs, niébé
  DENREES = 'denrees',           // Denrées périssables
  FOURNITURES = 'fournitures',   // Fournitures de bureau
  EQUIPEMENTS = 'equipements',   // Équipements et mobilier
  VEHICULES = 'vehicules',       // Véhicules et transport
  MAINTENANCE = 'maintenance'    // Pièces de maintenance
}

export enum StockUnit {
  KG = 'kg',                     // Kilogrammes
  TONNE = 'tonne',               // Tonnes
  LITRE = 'litre',               // Litres
  UNITE = 'unite',               // Unités
  CARTON = 'carton',             // Cartons
  SAC = 'sac',                   // Sacs
  BOUTEILLE = 'bouteille'        // Bouteilles
}

export enum StockStatus {
  ACTIF = 'actif',               // Stock actif
  INACTIF = 'inactif',           // Stock inactif
  OBSOLETE = 'obsolete',         // Stock obsolète
  EN_RUPTURE = 'en_rupture'      // En rupture
}

@Entity('stocks')
@Index(['tenantId', 'category']) // Index pour requêtes multi-tenant
@Index(['tenantId', 'type', 'status']) // Index pour filtres
@Index(['code']) // Index pour recherche par code
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 100, unique: true })
  @IsString()
  code: string; // Code produit unique

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  libelle: string; // Nom du produit

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string;

  @Column({ type: 'enum', enum: StockType })
  @IsEnum(StockType)
  type: StockType;

  @Column({ type: 'enum', enum: StockCategory })
  @IsEnum(StockCategory)
  category: StockCategory;

  @Column({ type: 'enum', enum: StockUnit })
  @IsEnum(StockUnit)
  unit: StockUnit;

  @Column({ type: 'enum', enum: StockStatus, default: StockStatus.ACTIF })
  @IsEnum(StockStatus)
  status: StockStatus;

  // Quantités et seuils
  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  @IsNumber()
  @Min(0)
  quantiteActuelle: number; // Quantité actuelle en stock

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  @IsNumber()
  @Min(0)
  quantiteReservee: number; // Quantité réservée

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0 })
  @IsNumber()
  @Min(0)
  quantiteDisponible: number; // Quantité disponible (actuelle - réservée)

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  @IsNumber()
  @Min(0)
  seuilMinimum: number; // Seuil minimum d'alerte

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  seuilMaximum: number; // Seuil maximum (optionnel)

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantiteCommande: number; // Quantité en commande

  // Valorisation
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  prixUnitaire: number; // Prix unitaire en FCFA

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  valeurStock: number; // Valeur totale du stock

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string; // Devise (FCFA par défaut)

  // Informations fournisseur
  @Column({ type: 'uuid', name: 'supplier_id', nullable: true })
  supplierId: string;

  @ManyToOne(() => Supplier, supplier => supplier.stocks, { nullable: true })
  @JoinColumn({ name: 'supplier_id' })
  supplier: Supplier;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  fournisseur: string; // Nom du fournisseur (legacy/backup)

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  referenceFournisseur: string;

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  dateDerniereEntree: Date;

  @Column({ type: 'date', nullable: true })
  dateDerniereSortie: Date;

  @Column({ type: 'date', nullable: true })
  datePeremption: Date; // Date de péremption (si applicable)

  // Configuration
  @Column({ type: 'boolean', default: true })
  isPerissable: boolean; // Produit périssable

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  dureeConservation: number; // Durée de conservation en jours

  @Column({ type: 'boolean', default: false })
  isControle: boolean; // Contrôle qualité requis

  @Column({ type: 'boolean', default: true })
  isActif: boolean; // Stock actif

  // Alertes
  @Column({ type: 'boolean', default: false })
  enAlerte: boolean; // Indicateur d'alerte

  @Column({ type: 'boolean', default: false })
  enRupture: boolean; // Indicateur de rupture

  @Column({ type: 'boolean', default: false })
  approvisionnementUrgent: boolean; // Approvisionnement urgent

  // Métadonnées
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
  @OneToMany(() => StockMovement, movement => movement.stock, { cascade: true })
  movements: StockMovement[];

  @OneToMany(() => StockAlert, alert => alert.stock, { cascade: true })
  alerts: StockAlert[];

  // Méthodes de calcul
  /**
   * Calculer la quantité disponible
   */
  calculateAvailableQuantity(): number {
    return Math.max(0, this.quantiteActuelle - this.quantiteReservee);
  }

  /**
   * Calculer la valeur du stock
   */
  calculateStockValue(): number {
    return this.quantiteActuelle * (this.prixUnitaire || 0);
  }

  /**
   * Vérifier si le stock est en alerte
   */
  checkAlert(): boolean {
    this.enAlerte = this.quantiteDisponible <= this.seuilMinimum;
    return this.enAlerte;
  }

  /**
   * Vérifier si le stock est en rupture
   */
  checkRupture(): boolean {
    this.enRupture = this.quantiteDisponible <= 0;
    return this.enRupture;
  }

  /**
   * Vérifier si l'approvisionnement est urgent
   */
  checkUrgentReplenishment(): boolean {
    this.approvisionnementUrgent = this.quantiteDisponible <= (this.seuilMinimum * 0.5);
    return this.approvisionnementUrgent;
  }

  /**
   * Mettre à jour tous les calculs
   */
  updateCalculations(): void {
    this.quantiteDisponible = this.calculateAvailableQuantity();
    this.valeurStock = this.calculateStockValue();
    this.checkAlert();
    this.checkRupture();
    this.checkUrgentReplenishment();
  }

  /**
   * Ajouter de la quantité au stock
   */
  addQuantity(quantity: number, unitPrice?: number): void {
    this.quantiteActuelle += quantity;
    if (unitPrice) {
      this.prixUnitaire = unitPrice;
    }
    this.dateDerniereEntree = new Date();
    this.updateCalculations();
  }

  /**
   * Retirer de la quantité du stock
   */
  removeQuantity(quantity: number): boolean {
    if (this.quantiteDisponible < quantity) {
      return false; // Pas assez de stock
    }
    this.quantiteActuelle -= quantity;
    this.dateDerniereSortie = new Date();
    this.updateCalculations();
    return true;
  }

  /**
   * Réserver de la quantité
   */
  reserveQuantity(quantity: number): boolean {
    if (this.quantiteDisponible < quantity) {
      return false; // Pas assez de stock disponible
    }
    this.quantiteReservee += quantity;
    this.updateCalculations();
    return true;
  }

  /**
   * Libérer la quantité réservée
   */
  releaseReservedQuantity(quantity: number): void {
    this.quantiteReservee = Math.max(0, this.quantiteReservee - quantity);
    this.updateCalculations();
  }

  /**
   * Vérifier si le produit est périmé
   */
  isExpired(): boolean {
    if (!this.isPerissable || !this.datePeremption) return false;
    return new Date() > this.datePeremption;
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels = {
      [StockStatus.ACTIF]: 'Actif',
      [StockStatus.INACTIF]: 'Inactif',
      [StockStatus.OBSOLETE]: 'Obsolète',
      [StockStatus.EN_RUPTURE]: 'En rupture'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir la catégorie formatée
   */
  getCategoryLabel(): string {
    const labels = {
      [StockCategory.CEREALES]: 'Céréales',
      [StockCategory.DENREES]: 'Denrées',
      [StockCategory.FOURNITURES]: 'Fournitures',
      [StockCategory.EQUIPEMENTS]: 'Équipements',
      [StockCategory.VEHICULES]: 'Véhicules',
      [StockCategory.MAINTENANCE]: 'Maintenance'
    };
    return labels[this.category] || 'Inconnue';
  }
}
