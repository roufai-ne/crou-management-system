/**
 * FICHIER: packages\database\src\entities\TicketRepas.entity.ts
 * ENTITÉ: TicketRepas - Gestion des tickets de restauration CROU
 *
 * DESCRIPTION:
 * Entité pour la gestion des tickets repas ANONYMES
 * Support multi-tenant avec tenant_id
 * Tickets unitaires pour un repas selon le service (déjeuner, dîner, petit déjeuner)
 * Utilisables une seule fois avec QR code et numéro unique
 *
 * RELATIONS:
 * - ManyToOne avec Tenant
 * - ManyToOne avec Restaurant (si utilisé)
 * - ManyToOne avec Repas (si utilisé)
 *
 * CATÉGORIES DE TICKETS:
 * - PAYANT: Ticket avec tarif (selon type de repas)
 * - GRATUIT: Ticket gratuit (0 F)
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
import { Repas } from './Repas.entity';
import { TypeRepas } from './Menu.entity';

// Catégories de tickets (simplifié)
export enum CategorieTicket {
  PAYANT = 'payant',     // Ticket avec tarif selon type de repas
  GRATUIT = 'gratuit'    // Ticket gratuit (0 F)
}

// Statuts de ticket
export enum TicketStatus {
  ACTIF = 'actif',       // Ticket valide et non utilisé
  UTILISE = 'utilise',   // Ticket utilisé pour un repas
  EXPIRE = 'expire',     // Ticket expiré
  ANNULE = 'annule'      // Ticket annulé (remboursement)
}

@Entity('tickets_repas')
@Index(['tenantId', 'numeroTicket'])
@Index(['numeroTicket'], { unique: true })
@Index(['status', 'dateExpiration'])
@Index(['restaurantId', 'dateUtilisation'])
@Index(['qrCode'], { unique: true })
export class TicketRepas {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations tenant (OBLIGATOIRE)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations du ticket
  @Column({ type: 'varchar', length: 50, unique: true, name: 'numero_ticket' })
  @IsString()
  numeroTicket: string; // Format: TKT-2025-001234 (auto-généré)

  @Column({ type: 'enum', enum: CategorieTicket })
  @IsEnum(CategorieTicket)
  categorie: CategorieTicket; // PAYANT ou GRATUIT

  @Column({ type: 'enum', enum: TypeRepas })
  @IsEnum(TypeRepas)
  typeRepas: TypeRepas; // PETIT_DEJEUNER, DEJEUNER, ou DINER

  @Column({ type: 'int', default: 2025 })
  @IsNumber()
  annee: number; // Année du ticket (ex: 2025)

  // Informations financières
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  tarif: number; // Tarif du ticket en FCFA (0 si gratuit)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  montantRembourse?: number; // Si annulé avec remboursement

  // Validité
  @Column({ type: 'date', name: 'date_emission' })
  @IsDateString()
  dateEmission: Date;

  @Column({ type: 'date', name: 'date_expiration' })
  @IsDateString()
  dateExpiration: Date;

  // Utilisation
  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.ACTIF })
  @IsEnum(TicketStatus)
  status: TicketStatus;

  @Column({ type: 'boolean', default: false, name: 'est_utilise' })
  @IsBoolean()
  estUtilise: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'date_utilisation' })
  @IsOptional()
  dateUtilisation?: Date;

  // Restaurant où le ticket a été utilisé
  @Column({ type: 'uuid', nullable: true, name: 'restaurant_id' })
  @IsOptional()
  restaurantId?: string;

  @ManyToOne(() => Restaurant, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'restaurant_id' })
  restaurant?: Restaurant;

  // Repas associé (si utilisé)
  @Column({ type: 'uuid', nullable: true, name: 'repas_id' })
  @IsOptional()
  repasId?: string;

  @ManyToOne(() => Repas, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'repas_id' })
  repas?: Repas;

  // Méthode de paiement (pour tickets payants)
  @Column({ type: 'varchar', length: 50, nullable: true, name: 'methode_paiement' })
  @IsOptional()
  @IsString()
  methodePaiement?: string; // ESPECES, CARTE, MOBILE_MONEY, VIREMENT

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_paiement' })
  @IsOptional()
  @IsString()
  referencePaiement?: string; // Référence transaction

  // QR Code pour scan rapide (OBLIGATOIRE)
  @Column({ type: 'varchar', length: 255, unique: true, name: 'qr_code' })
  @IsString()
  qrCode: string; // Données encodées pour QR code (unique)

  // Message d'indication sur le ticket
  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  messageIndication?: string; // Message affiché sur le ticket (ex: "Bon appétit!")

  // Validation et contrôle
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'valide_par' })
  @IsOptional()
  @IsString()
  validePar?: string; // User ID qui a validé l'utilisation

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'annule_par' })
  @IsOptional()
  @IsString()
  annulePar?: string; // User ID qui a annulé

  @Column({ type: 'text', nullable: true, name: 'motif_annulation' })
  @IsOptional()
  @IsString()
  motifAnnulation?: string;

  // Notes additionnelles
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  metadata?: Record<string, any>; // Métadonnées additionnelles flexibles

  // Audit
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string; // Agent qui a émis le ticket

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}
