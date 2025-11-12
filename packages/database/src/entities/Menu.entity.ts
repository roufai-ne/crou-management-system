/**
 * FICHIER: packages\database\src\entities\Menu.entity.ts
 * ENTITÉ: Menu - Gestion des menus de restauration CROU
 *
 * DESCRIPTION:
 * Entité pour la planification des menus journaliers
 * Support multi-tenant avec tenant_id
 * Composition des plats et calcul coûts
 * Gestion des besoins en denrées
 *
 * RELATIONS:
 * - ManyToOne avec Restaurant
 * - ManyToOne avec Tenant
 * - OneToMany avec Repas (distributions réelles)
 *
 * TYPES DE REPAS:
 * - PETIT_DEJEUNER: 7h-9h (150 FCFA)
 * - DEJEUNER: 12h-14h (350 FCFA)
 * - DINER: 19h-21h (350 FCFA)
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
import { IsEnum, IsNumber, IsString, IsOptional, IsArray, IsObject, IsDateString, IsBoolean } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { Restaurant } from './Restaurant.entity';
import { Repas } from './Repas.entity';

// Types de repas
export enum TypeRepas {
  PETIT_DEJEUNER = 'petit_dejeuner',
  DEJEUNER = 'dejeuner',
  DINER = 'diner'
}

// Statuts de menu
export enum MenuStatus {
  BROUILLON = 'brouillon',           // En cours de création
  PUBLIE = 'publie',                 // Publié et visible
  VALIDE = 'valide',                 // Validé par responsable
  ARCHIVE = 'archive'                // Archivé (passé)
}

// Interface pour les plats du menu
export interface PlatMenu {
  nom: string;                       // Nom du plat (ex: "Riz sauce arachide")
  description?: string;
  ingredients: IngredientMenu[];     // Liste des ingrédients
  categorieApport?: string;          // Féculent, Protéine, Légume, etc.
  valeurNutritionnelle?: {
    calories?: number;
    proteines?: number;
    glucides?: number;
    lipides?: number;
  };
}

// Interface pour les ingrédients
export interface IngredientMenu {
  stockId: string;                   // Lien vers table stocks
  nomDenree: string;                 // Nom de la denrée (ex: "Riz")
  quantiteUnitaire: number;          // Quantité par rationnaire
  unite: string;                     // kg, litre, unite, etc.
  coutUnitaire: number;              // Coût en FCFA
  coutTotal?: number;                // Calculé automatiquement
}

@Entity('menus')
@Index(['tenantId', 'dateService'])
@Index(['restaurantId', 'dateService', 'typeRepas'])
@Index(['status'])
export class Menu {
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

  @ManyToOne(() => Restaurant, restaurant => restaurant.menus, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  // Informations de base
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  nom: string; // Nom du menu (ex: "Menu du jour - Riz sauce arachide")

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'date' })
  @IsDateString()
  dateService: Date; // Date du service

  @Column({ type: 'enum', enum: TypeRepas })
  @IsEnum(TypeRepas)
  typeRepas: TypeRepas;

  // Composition du menu (JSONB pour flexibilité)
  @Column({ type: 'jsonb' })
  @IsArray()
  plats: PlatMenu[]; // Array de plats composant le menu

  // Capacité et réservations
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  nombreRationnairesPrevu: number; // Nombre de rationnaires prévus

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  nombreReservations: number; // Nombre de réservations effectuées

  // Coûts (calculés automatiquement)
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  coutMatierePremiere: number; // Coût total matières premières en FCFA

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  coutUnitaire: number; // Coût par rationnaire en FCFA

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  prixVente?: number; // Prix de vente au rationnaire (150, 350, ou 350 FCFA)

  // Besoins en denrées (pré-calculés pour faciliter déduction stock)
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  besoinsDenrees?: {
    stockId: string;
    nomDenree: string;
    quantiteTotale: number;
    unite: string;
    stockDisponible?: number;
    suffisant?: boolean;
  }[];

  // Statut et validation
  @Column({ type: 'enum', enum: MenuStatus, default: MenuStatus.BROUILLON })
  @IsEnum(MenuStatus)
  status: MenuStatus;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActif: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  stockDeduit: boolean; // Indique si le stock a été déduit

  @Column({ type: 'timestamp', nullable: true, name: 'date_validation' })
  @IsOptional()
  dateValidation?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'valide_par' })
  @IsOptional()
  @IsString()
  validePar?: string; // User ID du validateur

  // Notes et observations
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  allergenesPresents?: string[]; // ["arachide", "gluten", "lactose"]

  // Informations nutritionnelles globales (optionnel)
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  valeursNutritionnelles?: {
    caloriesTotal?: number;
    proteinesTotal?: number;
    glucidesTotal?: number;
    lipidesTotal?: number;
  };

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

  // Relations
  @OneToMany(() => Repas, repas => repas.menu)
  repas: Repas[];
}
