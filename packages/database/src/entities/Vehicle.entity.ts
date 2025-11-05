/**
 * FICHIER: packages\database\src\entities\Vehicle.entity.ts
 * ENTITÉ: Vehicle - Gestion du parc véhicules CROU
 * 
 * DESCRIPTION:
 * Entité pour la gestion du parc de véhicules
 * Support multi-tenant avec tenant_id
 * Gestion de la maintenance et des coûts
 * 
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec VehicleMaintenance (maintenance)
 * - OneToMany avec VehicleUsage (utilisation)
 * - OneToMany avec VehicleFuel (carburant)
 * 
 * TYPES DE VÉHICULES:
 * - Bus: Transport collectif
 * - Minibus: Transport moyen
 * - Utilitaire: Transport de marchandises
 * - Voiture: Transport personnel
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
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { IsEnum, IsNumber, IsString, IsOptional, Min } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { VehicleMaintenance } from './VehicleMaintenance.entity';
import { VehicleUsage } from './VehicleUsage.entity';
import { VehicleFuel } from './VehicleFuel.entity';
import { ScheduledTrip } from './ScheduledTrip.entity';
import { Driver } from './Driver.entity';

// Types de véhicules selon PRD
export enum VehicleType {
  BUS = 'bus',                   // Bus de transport
  MINIBUS = 'minibus',           // Minibus
  UTILITAIRE = 'utilitaire',     // Véhicule utilitaire
  VOITURE = 'voiture',           // Voiture de service
  MOTO = 'moto',                 // Moto
  VELO = 'velo'                  // Vélo
}

export enum VehicleStatus {
  ACTIF = 'actif',               // Actif
  HORS_SERVICE = 'hors_service', // Hors service
  EN_MAINTENANCE = 'en_maintenance', // En maintenance
  EN_PANNE = 'en_panne',         // En panne
  VENDU = 'vendu',               // Vendu
  CASSE = 'casse'                // Cassé
}

export enum FuelType {
  ESSENCE = 'essence',           // Essence
  DIESEL = 'diesel',             // Diesel
  GPL = 'gpl',                   // GPL
  ELECTRIQUE = 'electrique',     // Électrique
  HYBRIDE = 'hybride'            // Hybride
}

@Entity('vehicles')
@Index(['tenantId', 'type']) // Index pour requêtes multi-tenant
@Index(['tenantId', 'status']) // Index pour filtres
@Index(['immatriculation']) // Index pour recherche par immatriculation
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  immatriculation: string; // Numéro d'immatriculation

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  marque: string; // Marque du véhicule

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  modele: string; // Modèle du véhicule

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  version: string; // Version du modèle

  @Column({ type: 'enum', enum: VehicleType })
  @IsEnum(VehicleType)
  type: VehicleType;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.ACTIF })
  @IsEnum(VehicleStatus)
  status: VehicleStatus;

  // Caractéristiques techniques
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  annee: number; // Année de fabrication

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  couleur: string; // Couleur

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  numeroChassis: string; // Numéro de châssis

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  numeroMoteur: string; // Numéro de moteur

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cylindree: number; // Cylindrée en cm³

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  puissance: number; // Puissance en CV

  @Column({ type: 'enum', enum: FuelType, nullable: true })
  @IsOptional()
  @IsEnum(FuelType)
  typeCarburant: FuelType;

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capacitePassagers: number; // Capacité en passagers

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  capaciteCharge: number; // Capacité de charge en kg

  // Kilométrage et utilisation
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  kilometrageActuel: number; // Kilométrage actuel

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kilometrageAchat: number; // Kilométrage à l'achat

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kilometrageMaintenance: number; // Kilométrage dernière maintenance

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  kilometrageRevision: number; // Kilométrage prochaine révision

  // Coûts et valorisation
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixAchat: number; // Prix d'achat en FCFA

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeurActuelle: number; // Valeur actuelle en FCFA

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  consommationMoyenne: number; // Consommation moyenne L/100km

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string; // Devise (FCFA par défaut)

  // Assurance et documents
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  compagnieAssurance: string; // Compagnie d'assurance

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  numeroAssurance: string; // Numéro d'assurance

  @Column({ type: 'date', nullable: true })
  dateExpirationAssurance: Date; // Date d'expiration assurance

  @Column({ type: 'date', nullable: true })
  dateExpirationControle: Date; // Date d'expiration contrôle technique

  @Column({ type: 'date', nullable: true })
  dateExpirationVignette: Date; // Date d'expiration vignette

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  dateAchat: Date; // Date d'achat

  @Column({ type: 'date', nullable: true })
  dateMiseEnService: Date; // Date de mise en service

  @Column({ type: 'date', nullable: true })
  dateDerniereMaintenance: Date; // Date de dernière maintenance

  @Column({ type: 'date', nullable: true })
  dateProchaineMaintenance: Date; // Date de prochaine maintenance

  // Configuration
  @Column({ type: 'boolean', default: true })
  isActif: boolean; // Véhicule actif

  @Column({ type: 'boolean', default: false })
  maintenanceProgrammee: boolean; // Maintenance programmée

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes: string; // Notes internes

  // Métadonnées
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string;

  // Relation inverse pour Driver
  @OneToOne(() => Driver, driver => driver.assignedVehicle, { nullable: true })
  assignedDriver: Driver;

  // Relations
  @OneToMany(() => VehicleMaintenance, maintenance => maintenance.vehicle, { cascade: true })
  maintenances: VehicleMaintenance[];

  @OneToMany(() => VehicleUsage, usage => usage.vehicle, { cascade: true })
  usages: VehicleUsage[];

  @OneToMany(() => VehicleFuel, fuel => fuel.vehicle, { cascade: true })
  fuels: VehicleFuel[];

  @OneToMany(() => ScheduledTrip, trip => trip.vehicle)
  scheduledTrips: ScheduledTrip[];

  // Méthodes de validation
  /**
   * Vérifier si le véhicule est disponible
   */
  isAvailable(): boolean {
    return this.status === VehicleStatus.ACTIF && this.isActif;
  }

  /**
   * Vérifier si le véhicule est en maintenance
   */
  isInMaintenance(): boolean {
    return this.status === VehicleStatus.EN_MAINTENANCE || this.maintenanceProgrammee;
  }

  /**
   * Vérifier si le véhicule est hors service
   */
  isOutOfService(): boolean {
    return [VehicleStatus.HORS_SERVICE, VehicleStatus.EN_PANNE, VehicleStatus.CASSE].includes(this.status);
  }

  /**
   * Vérifier si l'assurance est expirée
   */
  isInsuranceExpired(): boolean {
    if (!this.dateExpirationAssurance) return false;
    return new Date() > this.dateExpirationAssurance;
  }

  /**
   * Vérifier si le contrôle technique est expiré
   */
  isControlExpired(): boolean {
    if (!this.dateExpirationControle) return false;
    return new Date() > this.dateExpirationControle;
  }

  /**
   * Vérifier si la vignette est expirée
   */
  isVignetteExpired(): boolean {
    if (!this.dateExpirationVignette) return false;
    return new Date() > this.dateExpirationVignette;
  }

  /**
   * Vérifier si la maintenance est due
   */
  isMaintenanceDue(): boolean {
    if (!this.dateProchaineMaintenance) return false;
    return new Date() >= this.dateProchaineMaintenance;
  }

  /**
   * Calculer le kilométrage parcouru depuis l'achat
   */
  calculateTotalKilometers(): number {
    return this.kilometrageActuel - (this.kilometrageAchat || 0);
  }

  /**
   * Calculer le kilométrage depuis la dernière maintenance
   */
  calculateKilometersSinceMaintenance(): number {
    return this.kilometrageActuel - (this.kilometrageMaintenance || 0);
  }

  /**
   * Obtenir le type formaté
   */
  getTypeLabel(): string {
    const labels = {
      [VehicleType.BUS]: 'Bus',
      [VehicleType.MINIBUS]: 'Minibus',
      [VehicleType.UTILITAIRE]: 'Utilitaire',
      [VehicleType.VOITURE]: 'Voiture',
      [VehicleType.MOTO]: 'Moto',
      [VehicleType.VELO]: 'Vélo'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels = {
      [VehicleStatus.ACTIF]: 'Actif',
      [VehicleStatus.HORS_SERVICE]: 'Hors service',
      [VehicleStatus.EN_MAINTENANCE]: 'En maintenance',
      [VehicleStatus.EN_PANNE]: 'En panne',
      [VehicleStatus.VENDU]: 'Vendu',
      [VehicleStatus.CASSE]: 'Cassé'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir le type de carburant formaté
   */
  getFuelTypeLabel(): string {
    const labels = {
      [FuelType.ESSENCE]: 'Essence',
      [FuelType.DIESEL]: 'Diesel',
      [FuelType.GPL]: 'GPL',
      [FuelType.ELECTRIQUE]: 'Électrique',
      [FuelType.HYBRIDE]: 'Hybride'
    };
    return labels[this.typeCarburant] || 'Non spécifié';
  }

  /**
   * Obtenir la description complète
   */
  getDescription(): string {
    return `${this.marque} ${this.modele} (${this.immatriculation}) - ${this.getTypeLabel()}`;
  }
}
