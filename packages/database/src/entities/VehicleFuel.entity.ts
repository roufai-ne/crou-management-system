/**
 * FICHIER: packages\database\src\entities\VehicleFuel.entity.ts
 * ENTITÉ: VehicleFuel - Consommation de carburant
 * 
 * DESCRIPTION:
 * Entité pour tracer la consommation de carburant des véhicules
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

export enum FuelType {
  ESSENCE = 'essence',           // Essence
  DIESEL = 'diesel',             // Diesel
  GPL = 'gpl',                   // GPL
  ELECTRIQUE = 'electrique'      // Électrique
}

@Entity('vehicle_fuels')
@Index(['vehicleId', 'date']) // Index pour requêtes par véhicule
@Index(['tenantId', 'type']) // Index pour requêtes multi-tenant
export class VehicleFuel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ type: 'uuid', name: 'vehicle_id' })
  vehicleId: string;

  @ManyToOne(() => Vehicle, vehicle => vehicle.fuels, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'enum', enum: FuelType })
  @IsEnum(FuelType)
  type: FuelType;

  @Column({ type: 'decimal', precision: 8, scale: 2 })
  @IsNumber()
  @Min(0)
  quantite: number; // Quantité en litres

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  prixUnitaire: number; // Prix unitaire en FCFA

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  @IsNumber()
  @Min(0)
  montantTotal: number; // Montant total en FCFA

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string;

  // Station
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  station: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  adresseStation: string;

  // Kilométrage
  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  kilometrage: number;

  // Dates
  @Column({ type: 'date' })
  date: Date;

  // Métadonnées
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  // Méthodes
  calculateTotalAmount(): number {
    return this.quantite * this.prixUnitaire;
  }
}
