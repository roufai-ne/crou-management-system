/**
 * FICHIER: packages\database\src\entities\StockDenree.entity.ts
 * ENTITÉ: StockDenree - Allocation de denrées aux restaurants
 *
 * DESCRIPTION:
 * Entité pour gérer l'allocation et l'utilisation des denrées du module Stocks
 * Permet le suivi des quantités allouées vs utilisées par restaurant
 * Intégration bidirectionnelle avec le module Stocks existant
 *
 * RELATIONS:
 * - ManyToOne avec Tenant
 * - ManyToOne avec Restaurant
 * - ManyToOne avec Stock (module Stocks) via stockId
 * - ManyToOne avec Menu (si allocation pour menu spécifique)
 *
 * WORKFLOW:
 * 1. Responsable Stock alloue denrées → Création StockDenree
 * 2. Module Stocks crée mouvement SORTIE
 * 3. Service Restauration utilise denrées → Mise à jour quantiteUtilisee
 * 4. Réconciliation périodique des écarts
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
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
import { IsEnum, IsNumber, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { Restaurant } from './Restaurant.entity';
import { Stock } from './Stock.entity';
import { Menu } from './Menu.entity';

// Statuts d'allocation
export enum AllocationStatus {
  ALLOUEE = 'allouee',               // Denrée allouée au restaurant
  UTILISEE_PARTIELLEMENT = 'utilisee_partiellement', // Utilisation partielle
  UTILISEE_TOTALEMENT = 'utilisee_totalement',      // Totalement utilisée
  EXPIREE = 'expiree',               // Denrée expirée avant utilisation
  RETOURNEE = 'retournee'            // Retournée au stock central
}

// Types de mouvements (pour historique)
export enum TypeMouvementDenree {
  ALLOCATION = 'allocation',          // Allocation initiale
  UTILISATION = 'utilisation',        // Utilisation pour un repas
  RETOUR = 'retour',                 // Retour au stock
  AJUSTEMENT = 'ajustement',         // Ajustement d'inventaire
  PERTE = 'perte'                    // Perte/gaspillage
}

@Entity('stock_denrees')
@Index(['tenantId', 'restaurantId'])
@Index(['stockId', 'restaurantId'])
@Index(['status'])
@Index(['dateAllocation'])
export class StockDenree {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations tenant (OBLIGATOIRE)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Relation restaurant
  @Column({ type: 'uuid', name: 'restaurant_id' })
  restaurantId: string;

  @ManyToOne(() => Restaurant, restaurant => restaurant.stocksDenrees, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  // Relation avec module Stocks (CRITIQUE)
  @Column({ type: 'uuid', name: 'stock_id' })
  stockId: string;

  @ManyToOne(() => Stock, { onDelete: 'RESTRICT' }) // RESTRICT pour éviter suppression accidentelle
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  // Menu associé (optionnel - si allocation pour menu spécifique)
  @Column({ type: 'uuid', nullable: true, name: 'menu_id' })
  @IsOptional()
  menuId?: string;

  @ManyToOne(() => Menu, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'menu_id' })
  menu?: Menu;

  // Informations denrée (dénormalisées pour performance)
  @Column({ type: 'varchar', length: 255, name: 'nom_denree' })
  @IsString()
  nomDenree: string; // Copié depuis Stock.libelle

  @Column({ type: 'varchar', length: 50, name: 'code_denree' })
  @IsString()
  codeDenree: string; // Copié depuis Stock.code

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  unite: string; // kg, litre, unite, sac, etc. (depuis Stock.unite)

  // Quantités
  @Column({ type: 'decimal', precision: 10, scale: 3, name: 'quantite_allouee' })
  @IsNumber()
  quantiteAllouee: number; // Quantité initialement allouée

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, name: 'quantite_utilisee' })
  @IsNumber()
  quantiteUtilisee: number; // Quantité effectivement utilisée

  @Column({ type: 'decimal', precision: 10, scale: 3, default: 0, name: 'quantite_restante' })
  @IsNumber()
  quantiteRestante: number; // Calculé: allouee - utilisee

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true, name: 'quantite_perdue' })
  @IsOptional()
  quantitePerdue?: number; // Perte/gaspillage

  // Informations financières
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'prix_unitaire' })
  @IsNumber()
  prixUnitaire: number; // Prix unitaire en FCFA au moment de l'allocation

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'valeur_totale' })
  @IsNumber()
  valeurTotale: number; // quantiteAllouee × prixUnitaire

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'valeur_utilisee' })
  @IsOptional()
  valeurUtilisee?: number; // quantiteUtilisee × prixUnitaire

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'valeur_perdue' })
  @IsOptional()
  valeurPerdue?: number; // quantitePerdue × prixUnitaire

  // Dates
  @Column({ type: 'date', name: 'date_allocation' })
  @IsDateString()
  dateAllocation: Date;

  @Column({ type: 'date', nullable: true, name: 'date_expiration' })
  @IsOptional()
  @IsDateString()
  dateExpiration?: Date; // Date de péremption de la denrée

  @Column({ type: 'timestamp', nullable: true, name: 'date_premiere_utilisation' })
  @IsOptional()
  datePremiereUtilisation?: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'date_derniere_utilisation' })
  @IsOptional()
  dateDerniereUtilisation?: Date;

  // Statut
  @Column({ type: 'enum', enum: AllocationStatus, default: AllocationStatus.ALLOUEE })
  @IsEnum(AllocationStatus)
  status: AllocationStatus;

  @Column({ type: 'boolean', default: false, name: 'mouvement_stock_cree' })
  @IsBoolean()
  mouvementStockCree: boolean; // Indique si mouvement dans module Stocks créé

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'stock_movement_id' })
  @IsOptional()
  @IsString()
  stockMovementId?: string; // ID du mouvement dans module Stocks

  // Traçabilité
  @Column({ type: 'varchar', length: 255, name: 'alloue_par' })
  @IsString()
  allouePar: string; // User ID qui a effectué l'allocation

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'utilisee_par' })
  @IsOptional()
  @IsString()
  utiliseePar?: string; // User ID qui a enregistré l'utilisation

  @Column({ type: 'text', nullable: true, name: 'motif_allocation' })
  @IsOptional()
  @IsString()
  motifAllocation?: string; // Raison de l'allocation

  // Validation et contrôle
  @Column({ type: 'boolean', default: false, name: 'necessite_validation' })
  @IsBoolean()
  necessiteValidation: boolean;

  @Column({ type: 'boolean', default: false, name: 'est_validee' })
  @IsBoolean()
  estValidee: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'validee_par' })
  @IsOptional()
  @IsString()
  valideePar?: string;

  @Column({ type: 'timestamp', nullable: true, name: 'date_validation' })
  @IsOptional()
  dateValidation?: Date;

  // Historique des mouvements (JSONB pour flexibilité)
  @Column({ type: 'jsonb', nullable: true, default: [] })
  @IsOptional()
  historiqueMouvements?: {
    date: string;
    type: TypeMouvementDenree;
    quantite: number;
    quantiteRestante: number;
    utilisateur: string;
    notes?: string;
  }[];

  // Notes et observations
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: {
    conditions_stockage?: string;
    temperature?: number;
    lot_numero?: string;
    fournisseur?: string;
    [key: string]: any;
  };

  // Alertes
  @Column({ type: 'boolean', default: false, name: 'alerte_expiration' })
  @IsBoolean()
  alerteExpiration: boolean; // Si proche de la date d'expiration

  @Column({ type: 'boolean', default: false, name: 'alerte_surconsommation' })
  @IsBoolean()
  alerteSurconsommation: boolean; // Si utilisation > allocation

  // Audit
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
