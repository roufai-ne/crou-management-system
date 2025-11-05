/**
 * FICHIER: packages\database\src\entities\VehicleUsage.entity.ts
 * ENTITÉ: VehicleUsage - Utilisation des véhicules
 * 
 * DESCRIPTION:
 * Entité pour tracer l'utilisation des véhicules
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
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';

import { Vehicle } from './Vehicle.entity';
import { Tenant } from './Tenant.entity';
import { Driver } from './Driver.entity';
import { ScheduledTrip } from './ScheduledTrip.entity';

export enum UsageType {
  TRANSPORT_ETUDIANTS = 'transport_etudiants', // Transport étudiants
  MISSION = 'mission',                         // Mission officielle
  MAINTENANCE = 'maintenance',                 // Déplacement maintenance
  PERSONNEL = 'personnel'                      // Transport personnel
}

@Entity('vehicle_usages')
@Index(['vehicleId', 'date']) // Index pour requêtes par véhicule
@Index(['tenantId', 'type']) // Index pour requêtes multi-tenant
export class VehicleUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, vehicle => vehicle.usages, { onDelete: 'CASCADE' })
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
  description: string;

  @Column({ type: 'enum', enum: UsageType })
  @IsEnum(UsageType)
  type: UsageType;

  // Kilométrage
  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  kilometrageDebut: number;

  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  kilometrageFin: number;

  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  kilometrageParcouru: number;

  // Conducteur (legacy - nom en string)
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  conducteur: string;

  // Relation avec Driver (nouveau)
  @Column({ type: 'uuid', name: 'driver_id', nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, driver => driver.usages, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  // Dates
  @Column({ type: 'timestamp' })
  dateDebut: Date;

  @Column({ type: 'timestamp' })
  dateFin: Date;
  
  @Column({ type: 'date' }) // Or 'timestamp', depending on your needs
  date: Date;
  // Métadonnées
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  // Relations
  @OneToMany(() => ScheduledTrip, trip => trip.vehicleUsage)
  scheduledTrips: ScheduledTrip[];

  // Méthodes
  calculateKilometers(): number {
    return this.kilometrageFin - this.kilometrageDebut;
  }
}
