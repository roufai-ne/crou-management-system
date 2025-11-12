/**
 * FICHIER: packages\database\src\entities\Restaurant.entity.ts
 * ENTITÉ: Restaurant - Gestion des restaurants CROU
 *
 * DESCRIPTION:
 * Entité pour la gestion des restaurants universitaires (RU)
 * Support multi-tenant avec tenant_id
 * Gestion des capacités et statuts
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec Menu (menus planifiés)
 * - OneToMany avec Repas (distributions réelles)
 * - OneToMany avec StockDenree (allocations denrées)
 *
 * TYPES DE RESTAURANTS:
 * - UNIVERSITAIRE: Restaurant universitaire principal
 * - CAFETERIA: Cafétéria étudiante
 * - CANTINE: Cantine administrative
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
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
import { IsEnum, IsNumber, IsString, IsOptional, Min, IsBoolean } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { Menu } from './Menu.entity';
import { Repas } from './Repas.entity';
import { StockDenree } from './StockDenree.entity';

// Types de restaurants
export enum RestaurantType {
  UNIVERSITAIRE = 'universitaire',   // Restaurant universitaire principal
  CAFETERIA = 'cafeteria',           // Cafétéria étudiante
  CANTINE = 'cantine'                // Cantine administrative
}

// Statuts de restaurant
export enum RestaurantStatus {
  ACTIF = 'actif',                   // Restaurant actif
  FERME_TEMPORAIRE = 'ferme_temporaire', // Fermé temporairement
  MAINTENANCE = 'maintenance',       // En maintenance
  INACTIF = 'inactif'               // Inactif/Désactivé
}

@Entity('restaurants')
@Index(['tenantId', 'type'])
@Index(['tenantId', 'status'])
@Index(['code'])
export class Restaurant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant (OBLIGATOIRE pour multi-tenant)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  code: string; // Code unique (ex: RU-NIAMEY-01)

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  nom: string; // Nom du restaurant (ex: "Restaurant Universitaire Principal")

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'enum', enum: RestaurantType })
  @IsEnum(RestaurantType)
  type: RestaurantType;

  // Localisation
  @Column({ type: 'varchar', length: 500 })
  @IsString()
  adresse: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  ville?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  commune?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  @IsOptional()
  latitude?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  @IsOptional()
  longitude?: number;

  // Capacités
  @Column({ type: 'int' })
  @IsNumber()
  @Min(1)
  capaciteTotal: number; // Nombre max de couverts par service

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  nombrePlaces: number; // Nombre de places assises

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  frequentationMoyenne: number; // Fréquentation moyenne par jour

  // Horaires (format JSON)
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  horaires?: {
    petitDejeuner?: { debut: string; fin: string };
    dejeuner?: { debut: string; fin: string };
    diner?: { debut: string; fin: string };
  };

  // Équipements (array JSON)
  @Column({ type: 'jsonb', nullable: true, default: [] })
  @IsOptional()
  equipements?: string[]; // ["cuisine", "four", "refrigerateurs", "garde-manger"]

  // Statut
  @Column({ type: 'enum', enum: RestaurantStatus, default: RestaurantStatus.ACTIF })
  @IsEnum(RestaurantStatus)
  status: RestaurantStatus;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActif: boolean;

  // Informations financières
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  tarifPetitDejeuner?: number; // Tarif en FCFA

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  tarifDejeuner?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  tarifDiner?: number;

  // Responsable
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  responsableNom?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  responsableTelephone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  responsableEmail?: string;

  // Notes additionnelles
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
  createdBy: string; // User ID qui a créé

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy?: string;

  // Relations
  @OneToMany(() => Menu, menu => menu.restaurant)
  menus: Menu[];

  @OneToMany(() => Repas, repas => repas.restaurant)
  repas: Repas[];

  @OneToMany(() => StockDenree, stockDenree => stockDenree.restaurant)
  stocksDenrees: StockDenree[];
}
