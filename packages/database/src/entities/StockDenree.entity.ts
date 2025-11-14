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
@Index(['denreeId', 'statutAllocation'])
@Index(['dateExpiration'])
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
  @Column({ type: 'uuid', name: 'denree_id' })
  denreeId: string;

  @ManyToOne(() => Stock, { onDelete: 'RESTRICT' }) // RESTRICT pour éviter suppression accidentelle
  @JoinColumn({ name: 'denree_id' })
  stock: Stock;

  // Quantités
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'quantite_allouee' })
  @IsNumber()
  quantiteAllouee: number; // Quantité initialement allouée

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'quantite_utilisee' })
  @IsNumber()
  quantiteUtilisee: number; // Quantité effectivement utilisée

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'quantite_restante' })
  @IsNumber()
  quantiteRestante: number; // Calculé: allouee - utilisee

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  unite: string; // kg, litre, unite, sac, etc.

  // Dates
  @Column({ type: 'date', name: 'date_allocation' })
  dateAllocation: Date;

  @Column({ type: 'date', nullable: true, name: 'date_expiration' })
  @IsOptional()
  dateExpiration?: Date;

  // Informations financières
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cout_unitaire' })
  @IsOptional()
  coutUnitaire?: number; // Coût unitaire en FCFA

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'cout_total' })
  @IsOptional()
  coutTotal?: number; // quantiteAllouee × coutUnitaire

  // Statut
  @Column({ type: 'enum', enum: AllocationStatus, default: AllocationStatus.ALLOUEE, name: 'statut_allocation' })
  @IsEnum(AllocationStatus)
  statutAllocation: AllocationStatus;

  @Column({ type: 'enum', enum: TypeMouvementDenree, default: TypeMouvementDenree.ALLOCATION, name: 'type_mouvement' })
  @IsEnum(TypeMouvementDenree)
  typeMouvement: TypeMouvementDenree;

  @Column({ type: 'uuid', nullable: true, name: 'source_stock_id' })
  @IsOptional()
  sourceStockId?: string;

  // Notes et observations
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

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
