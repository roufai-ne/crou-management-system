/**
 * FICHIER: packages\database\src\entities\Repas.entity.ts
 * ENTITÉ: Repas - Gestion des distributions de repas CROU
 *
 * DESCRIPTION:
 * Entité pour le suivi des distributions réelles de repas
 * Enregistrement post-service avec statistiques
 * Liaison avec Menu (planifié) et fréquentation réelle
 *
 * RELATIONS:
 * - ManyToOne avec Tenant
 * - ManyToOne avec Restaurant
 * - ManyToOne avec Menu (menu planifié)
 * - OneToMany avec TicketRepas (tickets utilisés)
 *
 * OBJECTIF:
 * Comparer prévisions (Menu.nombreRationnairesPrevu) vs réalité (Repas.nombreServis)
 * Calculer taux de fréquentation, recettes, gaspillage
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
import { IsEnum, IsNumber, IsString, IsOptional, IsBoolean, IsDateString } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { Restaurant } from './Restaurant.entity';
import { Menu } from './Menu.entity';
import { TicketRepas } from './TicketRepas.entity';

// Types de repas (défini ici pour éviter les imports circulaires)
export enum TypeRepas {
  PETIT_DEJEUNER = 'petit_dejeuner',
  DEJEUNER = 'dejeuner',
  DINER = 'diner'
}

// Statuts de distribution
export enum RepasStatus {
  PLANIFIE = 'planifie',             // Repas planifié (avant service)
  EN_COURS = 'en_cours',             // Service en cours
  TERMINE = 'termine',               // Service terminé
  ANNULE = 'annule'                  // Service annulé (grève, fermeture)
}

@Entity('repas')
@Index(['tenantId', 'dateService'])
@Index(['restaurantId', 'dateService', 'typeRepas'])
@Index(['menuId'])
@Index(['status'])
export class Repas {
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

  @ManyToOne(() => Restaurant, restaurant => restaurant.repas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant: Restaurant;

  // Relation menu (planification)
  @Column({ type: 'uuid', name: 'menu_id' })
  menuId: string;

  @ManyToOne(() => Menu, menu => menu.repas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'menu_id' })
  menu: Menu;

  // Informations service
  @Column({ type: 'date', name: 'date_service' })
  @IsDateString()
  dateService: Date;

  @Column({ type: 'enum', enum: TypeRepas })
  @IsEnum(TypeRepas)
  typeRepas: TypeRepas;

  @Column({ type: 'time', nullable: true, name: 'heure_debut' })
  @IsOptional()
  heureDebut?: string; // Format: HH:mm (ex: "12:00")

  @Column({ type: 'time', nullable: true, name: 'heure_fin' })
  @IsOptional()
  heureFin?: string; // Format: HH:mm (ex: "14:00")

  // Statistiques fréquentation
  @Column({ type: 'int', default: 0, name: 'nombre_prevus' })
  @IsNumber()
  nombrePrevus: number; // Copié depuis Menu.nombreRationnairesPrevu

  @Column({ type: 'int', default: 0, name: 'nombre_servis' })
  @IsNumber()
  nombreServis: number; // Nombre réel de repas servis

  @Column({ type: 'int', default: 0, name: 'nombre_tickets_utilises' })
  @IsNumber()
  nombreTicketsUtilises: number; // Nombre de tickets utilisés pour ce repas

  // Répartition par catégorie
  @Column({ type: 'jsonb', nullable: true, name: 'repartition_categories' })
  @IsOptional()
  repartitionCategories?: {
    etudiantsReguliers: number;
    etudiantsBoursiers: number;
    personnel: number;
    invites: number;
  };

  // Statistiques financières
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'recettes_totales' })
  @IsNumber()
  recettesTotales: number; // Recettes en FCFA

  // Coûts et rentabilité
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'cout_matieres_premieres' })
  @IsNumber()
  coutMatieresPremières: number; // Copié depuis Menu.coutMatierePremiere

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'marge_brute' })
  @IsOptional()
  margeBrute?: number; // recettesTotales - coutMatieresPremières

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, name: 'taux_frequentation' })
  @IsOptional()
  tauxFrequentation?: number; // (nombreServis / nombrePrevus) × 100

  // Gaspillage et pertes
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'quantite_gaspillee' })
  @IsOptional()
  quantiteGaspillee?: number; // En kg

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'valeur_gaspillage' })
  @IsOptional()
  valeurGaspillage?: number; // Valeur en FCFA

  @Column({ type: 'text', nullable: true, name: 'raison_gaspillage' })
  @IsOptional()
  @IsString()
  raisonGaspillage?: string;

  // Statut
  @Column({ type: 'enum', enum: RepasStatus, default: RepasStatus.PLANIFIE })
  @IsEnum(RepasStatus)
  status: RepasStatus;

  @Column({ type: 'boolean', default: false, name: 'stock_deduit' })
  @IsBoolean()
  stockDeduit: boolean; // Indique si déduction stock effectuée

  @Column({ type: 'timestamp', nullable: true, name: 'date_deduction_stock' })
  @IsOptional()
  dateDeductionStock?: Date;

  // Observations et incidents
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  observations?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  incidents?: {
    type: string;           // RUPTURE_STOCK, PANNE_EQUIPEMENT, RETARD, etc.
    description: string;
    heure: string;
    gravite: 'faible' | 'moyenne' | 'elevee';
  }[];

  // Qualité et satisfaction (optionnel)
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true, name: 'note_satisfaction' })
  @IsOptional()
  noteSatisfaction?: number; // Note sur 5

  @Column({ type: 'int', nullable: true, name: 'nombre_avis' })
  @IsOptional()
  nombreAvis?: number;

  @Column({ type: 'text', nullable: true, name: 'commentaires_clients' })
  @IsOptional()
  @IsString()
  commentairesClients?: string;

  // Responsables
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'chef_service' })
  @IsOptional()
  @IsString()
  chefService?: string; // User ID du chef de service

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'valide_par' })
  @IsOptional()
  @IsString()
  validePar?: string; // User ID qui a validé le rapport

  @Column({ type: 'timestamp', nullable: true, name: 'date_validation' })
  @IsOptional()
  dateValidation?: Date;

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
  @OneToMany(() => TicketRepas, ticket => ticket.repas)
  tickets: TicketRepas[];
}
