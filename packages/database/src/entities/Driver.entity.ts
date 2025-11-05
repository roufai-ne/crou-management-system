/**
 * FICHIER: packages/database/src/entities/Driver.entity.ts
 * ENTITÉ: Driver - Gestion des chauffeurs CROU
 *
 * DESCRIPTION:
 * Entité pour la gestion des chauffeurs de véhicules
 * Support multi-tenant avec tenant_id
 * Gestion des permis et affectations
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToOne avec Vehicle (véhicule affecté)
 * - OneToMany avec VehicleUsage (historique utilisations)
 *
 * TYPES DE PERMIS:
 * - A: Moto
 * - B: Voiture
 * - C: Poids lourds
 * - D: Bus
 * - E: Ensemble de véhicules
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { IsEnum, IsEmail, IsString, IsOptional, IsDate } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { Vehicle } from './Vehicle.entity';
import { VehicleUsage } from './VehicleUsage.entity';
import { ScheduledTrip } from './ScheduledTrip.entity';

// Types de permis selon classification internationale
export enum LicenseType {
  A = 'A',     // Moto
  B = 'B',     // Voiture
  C = 'C',     // Poids lourds
  D = 'D',     // Bus/Transport en commun
  E = 'E'      // Ensemble de véhicules
}

export enum DriverStatus {
  ACTIF = 'active',           // Actif
  INACTIF = 'inactive',       // Inactif
  SUSPENDU = 'suspended',     // Suspendu temporairement
  EN_CONGE = 'on_leave',      // En congé
  DEMISSIONNE = 'resigned'    // Démissionné
}

@Entity('drivers')
@Index(['tenantId', 'status']) // Index pour requêtes multi-tenant
@Index(['employeeId'])         // Index pour recherche par matricule
@Index(['licenseNumber'])      // Index pour recherche par permis
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations personnelles
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  employeeId: string; // Matricule employé

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  firstName: string; // Prénom

  @Column({ type: 'varchar', length: 100 })
  @IsString()
  lastName: string; // Nom de famille

  @Column({ type: 'varchar', length: 150, unique: true })
  @IsEmail()
  email: string; // Email professionnel

  @Column({ type: 'varchar', length: 20 })
  @IsString()
  phone: string; // Téléphone

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  alternatePhone: string; // Téléphone alternatif

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  address: string; // Adresse complète

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  dateOfBirth: Date; // Date de naissance

  // Informations permis de conduire
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  licenseNumber: string; // Numéro de permis

  @Column({ type: 'enum', enum: LicenseType })
  @IsEnum(LicenseType)
  licenseType: LicenseType; // Type de permis

  @Column({ type: 'date' })
  @IsDate()
  licenseIssueDate: Date; // Date d'obtention du permis

  @Column({ type: 'date' })
  @IsDate()
  licenseExpiryDate: Date; // Date d'expiration du permis

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  licenseIssuingAuthority: string; // Autorité de délivrance

  // Informations emploi
  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.ACTIF })
  @IsEnum(DriverStatus)
  status: DriverStatus;

  @Column({ type: 'date' })
  @IsDate()
  hireDate: Date; // Date d'embauche

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  @IsDate()
  terminationDate: Date; // Date de fin de contrat

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  position: string; // Poste (ex: Chauffeur principal, Chauffeur adjoint)

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  department: string; // Département/Service

  // Affectation véhicule
  @Column({ type: 'uuid', nullable: true, name: 'assigned_vehicle_id' })
  assignedVehicleId: string | null;

  @OneToOne(() => Vehicle, vehicle => vehicle.assignedDriver, { nullable: true })
  @JoinColumn({ name: 'assigned_vehicle_id' })
  assignedVehicle: Vehicle;

  // Expérience et qualifications
  @Column({ type: 'int', nullable: true })
  yearsOfExperience: number; // Années d'expérience

  @Column({ type: 'json', nullable: true })
  certifications: string[]; // Certifications additionnelles (JSON array)

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  specializations: string; // Spécialisations (ex: Transport longue distance)

  // Dossier médical
  @Column({ type: 'date', nullable: true })
  lastMedicalCheckup: Date; // Date dernière visite médicale

  @Column({ type: 'date', nullable: true })
  nextMedicalCheckup: Date; // Date prochaine visite médicale

  @Column({ type: 'boolean', default: true })
  medicallyFit: boolean; // Apte médicalement

  // Statistiques
  @Column({ type: 'int', default: 0 })
  totalTrips: number; // Nombre total de trajets

  @Column({ type: 'int', default: 0 })
  totalKilometers: number; // Kilométrage total parcouru

  @Column({ type: 'int', default: 0 })
  accidentCount: number; // Nombre d'accidents

  @Column({ type: 'int', default: 0 })
  violationCount: number; // Nombre d'infractions

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  performanceRating: number; // Note de performance (0-5)

  // Disponibilité
  @Column({ type: 'boolean', default: true })
  isAvailable: boolean; // Disponible pour affectation

  @Column({ type: 'varchar', length: 50, nullable: true })
  currentStatus: string; // Statut actuel (ex: "En mission", "Disponible")

  // Configuration
  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Actif dans le système

  @Column({ type: 'boolean', default: false })
  canDriveAtNight: boolean; // Autorisé à conduire la nuit

  @Column({ type: 'boolean', default: false })
  canDriveLongDistance: boolean; // Autorisé longue distance

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

  // Relations
  @OneToMany(() => VehicleUsage, usage => usage.driver)
  usages: VehicleUsage[];

  @OneToMany(() => ScheduledTrip, trip => trip.driver)
  scheduledTrips: ScheduledTrip[];

  // Méthodes utilitaires

  /**
   * Obtenir le nom complet
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Vérifier si le chauffeur est disponible
   */
  checkIsAvailable(): boolean {
    return this.status === DriverStatus.ACTIF && this.isActive && this.isAvailable;
  }

  /**
   * Vérifier si le permis est expiré
   */
  isLicenseExpired(): boolean {
    return new Date() > this.licenseExpiryDate;
  }

  /**
   * Vérifier si le permis expire bientôt (dans les 30 jours)
   */
  isLicenseExpiringSoon(): boolean {
    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    return this.licenseExpiryDate <= thirtyDaysFromNow && this.licenseExpiryDate > today;
  }

  /**
   * Vérifier si la visite médicale est due
   */
  isMedicalCheckupDue(): boolean {
    if (!this.nextMedicalCheckup) return false;
    return new Date() >= this.nextMedicalCheckup;
  }

  /**
   * Vérifier si le chauffeur peut conduire un type de véhicule
   */
  canDriveVehicleType(vehicleType: string): boolean {
    const licenseCapabilities = {
      [LicenseType.A]: ['moto', 'velo'],
      [LicenseType.B]: ['voiture', 'velo'],
      [LicenseType.C]: ['voiture', 'utilitaire', 'velo'],
      [LicenseType.D]: ['bus', 'minibus', 'voiture', 'velo'],
      [LicenseType.E]: ['bus', 'minibus', 'voiture', 'utilitaire', 'velo']
    };

    const allowedTypes = licenseCapabilities[this.licenseType] || [];
    return allowedTypes.includes(vehicleType.toLowerCase());
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(): string {
    const labels = {
      [DriverStatus.ACTIF]: 'Actif',
      [DriverStatus.INACTIF]: 'Inactif',
      [DriverStatus.SUSPENDU]: 'Suspendu',
      [DriverStatus.EN_CONGE]: 'En congé',
      [DriverStatus.DEMISSIONNE]: 'Démissionné'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir le label du type de permis
   */
  getLicenseTypeLabel(): string {
    const labels = {
      [LicenseType.A]: 'Permis A (Moto)',
      [LicenseType.B]: 'Permis B (Voiture)',
      [LicenseType.C]: 'Permis C (Poids lourds)',
      [LicenseType.D]: 'Permis D (Bus)',
      [LicenseType.E]: 'Permis E (Ensemble)'
    };
    return labels[this.licenseType] || 'Non spécifié';
  }

  /**
   * Calculer l'ancienneté en années
   */
  calculateSeniority(): number {
    const today = new Date();
    const years = (today.getTime() - this.hireDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    return Math.floor(years);
  }

  /**
   * Calculer le kilométrage moyen par trajet
   */
  calculateAverageKilometersPerTrip(): number {
    if (this.totalTrips === 0) return 0;
    return Math.round(this.totalKilometers / this.totalTrips);
  }
}
