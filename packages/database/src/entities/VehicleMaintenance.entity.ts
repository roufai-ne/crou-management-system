/**
 * FICHIER: packages\database\src\entities\VehicleMaintenance.entity.ts
 * ENTITÉ: VehicleMaintenance - Maintenance des véhicules
 * 
 * DESCRIPTION:
 * Entité pour gérer la maintenance des véhicules
 * 
 * RELATIONS:
 * - ManyToOne avec Vehicle (véhicule)
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

import { Vehicle } from './Vehicle.entity';
import { Tenant } from './Tenant.entity';

export enum MaintenanceType {
  PREVENTIVE = 'preventive',     // Maintenance préventive
  CORRECTIVE = 'corrective',     // Maintenance corrective
  REVISION = 'revision',         // Révision
  REPARATION = 'reparation'      // Réparation
}

export enum MaintenanceStatus {
  PLANNED = 'planned',           // Planifiée
  IN_PROGRESS = 'in_progress',   // En cours
  COMPLETED = 'completed',       // Terminée
  CANCELLED = 'cancelled'        // Annulée
}

@Entity('vehicle_maintenances')
@Index(['vehicleId', 'type']) // Index pour requêtes par véhicule
@Index(['tenantId', 'status']) // Index pour requêtes multi-tenant
export class VehicleMaintenance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, vehicle => vehicle.maintenances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'uuid', name: 'tenant_id' })
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

  // Kilométrage
  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  kilometrage: number;

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
  garage: string;

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
