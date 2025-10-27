/**
 * FICHIER: packages\database\src\entities\HousingMaintenance.entity.ts
 * ENTITÉ: HousingMaintenance - Maintenance des logements
 * 
 * DESCRIPTION:
 * Entité pour gérer la maintenance des logements et chambres
 * 
 * RELATIONS:
 * - ManyToOne avec Housing (logement)
 * - ManyToOne avec Room (chambre, optionnel)
 * - ManyToOne avec Tenant (CROU)
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

import { Housing } from './Housing.entity';
import { Room } from './Room.entity';
import { Tenant } from './Tenant.entity';

export enum MaintenanceType {
  PREVENTIVE = 'preventive',     // Maintenance préventive
  CORRECTIVE = 'corrective',     // Maintenance corrective
  URGENTE = 'urgente'            // Maintenance urgente
}

export enum MaintenanceStatus {
  PLANNED = 'planned',           // Planifiée
  IN_PROGRESS = 'in_progress',   // En cours
  COMPLETED = 'completed',       // Terminée
  CANCELLED = 'cancelled'        // Annulée
}

@Entity('housing_maintenances')
@Index(['housingId', 'type']) // Index pour requêtes par logement
@Index(['tenantId', 'status']) // Index pour requêtes multi-tenant
export class HousingMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ name: 'housing_id', type: 'uuid' })
  housingId: string;

  @ManyToOne(() => Housing, housing => housing.maintenances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'housing_id' })
  housing: Housing;

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId: string;

  @ManyToOne(() => Room, room => room.maintenances, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  title: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string;

  @Column({ type: 'enum', enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.PLANNED })
  @IsEnum(MaintenanceStatus)
  status: MaintenanceStatus;

  // Coûts
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  coutEstime: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  coutReel: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string;

  // Dates
  @Column({ type: 'date' })
  dateDebut: Date;

  @Column({ type: 'date', nullable: true })
  dateFin: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  prestataire: string;

  // Métadonnées
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  // Méthodes
  isCompleted(): boolean {
    return this.status === MaintenanceStatus.COMPLETED;
  }

  isInProgress(): boolean {
    return this.status === MaintenanceStatus.IN_PROGRESS;
  }
}
