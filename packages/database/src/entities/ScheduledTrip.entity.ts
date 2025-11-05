/**
 * FICHIER: packages/database/src/entities/ScheduledTrip.entity.ts
 * ENTITÉ: ScheduledTrip - Gestion des trajets programmés
 *
 * DESCRIPTION:
 * Entité pour la gestion des trajets programmés
 * Un trajet programmé est une instance d'un itinéraire à une date/heure donnée
 * Support multi-tenant avec tenant_id
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - ManyToOne avec TransportRoute (itinéraire)
 * - ManyToOne avec Vehicle (véhicule assigné)
 * - ManyToOne avec Driver (chauffeur assigné)
 * - ManyToOne avec VehicleUsage (enregistrement d'utilisation)
 *
 * STATUTS:
 * - Scheduled: Programmé
 * - InProgress: En cours
 * - Completed: Terminé
 * - Cancelled: Annulé
 * - Delayed: Retardé
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
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
import { IsEnum, IsNumber, IsString, IsOptional, Min, Max } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { TransportRoute } from './TransportRoute.entity';
import { Vehicle } from './Vehicle.entity';
import { Driver } from './Driver.entity';
import { VehicleUsage } from './VehicleUsage.entity';

// Statuts des trajets programmés
export enum TripStatus {
  SCHEDULED = 'scheduled',     // Programmé
  IN_PROGRESS = 'in_progress', // En cours
  COMPLETED = 'completed',     // Terminé
  CANCELLED = 'cancelled',     // Annulé
  DELAYED = 'delayed',         // Retardé
  NO_SHOW = 'no_show'         // Non effectué
}

// Raisons d'annulation
export enum CancellationReason {
  WEATHER = 'weather',               // Météo
  VEHICLE_BREAKDOWN = 'vehicle_breakdown', // Panne véhicule
  DRIVER_UNAVAILABLE = 'driver_unavailable', // Chauffeur indisponible
  LOW_DEMAND = 'low_demand',         // Faible demande
  ROAD_CLOSED = 'road_closed',       // Route fermée
  OTHER = 'other'                    // Autre
}

@Entity('scheduled_trips')
@Index(['tenantId', 'scheduledDate'])   // Index pour requêtes par date
@Index(['tenantId', 'status'])          // Index pour filtres par statut
@Index(['routeId', 'scheduledDate'])    // Index pour trajets par itinéraire
@Index(['vehicleId', 'scheduledDate'])  // Index pour trajets par véhicule
@Index(['driverId', 'scheduledDate'])   // Index pour trajets par chauffeur
export class ScheduledTrip {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Relations principales
  @Column({ type: 'uuid', name: 'route_id' })
  routeId: string;

  @ManyToOne(() => TransportRoute, route => route.scheduledTrips, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'route_id' })
  route: TransportRoute;

  @Column({ type: 'uuid', name: 'vehicle_id', nullable: true })
  vehicleId: string;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @Column({ type: 'uuid', name: 'driver_id', nullable: true })
  driverId: string;

  @ManyToOne(() => Driver, driver => driver.usages, { nullable: true })
  @JoinColumn({ name: 'driver_id' })
  driver: Driver;

  @Column({ type: 'uuid', name: 'vehicle_usage_id', nullable: true })
  vehicleUsageId: string;

  @ManyToOne(() => VehicleUsage, { nullable: true })
  @JoinColumn({ name: 'vehicle_usage_id' })
  vehicleUsage: VehicleUsage;

  // Informations de planification
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  tripNumber: string; // Numéro unique du trajet (ex: "TRIP-20250131-001")

  @Column({ type: 'date' })
  scheduledDate: Date; // Date du trajet

  @Column({ type: 'time' })
  scheduledDepartureTime: string; // Heure de départ prévue (HH:MM:SS)

  @Column({ type: 'time', nullable: true })
  scheduledArrivalTime: string; // Heure d'arrivée prévue (HH:MM:SS)

  // Horaires réels
  @Column({ type: 'timestamp', nullable: true })
  actualDepartureTime: Date; // Heure de départ réelle

  @Column({ type: 'timestamp', nullable: true })
  actualArrivalTime: Date; // Heure d'arrivée réelle

  // Statut
  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.SCHEDULED })
  @IsEnum(TripStatus)
  status: TripStatus;

  // Passagers
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  passengersCount: number; // Nombre de passagers

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  seatsAvailable: number; // Sièges disponibles

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reservationsCount: number; // Nombre de réservations

  // Kilométrage
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  startKilometers: number; // Kilométrage au départ

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  endKilometers: number; // Kilométrage à l'arrivée

  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distanceCovered: number; // Distance parcourue (km)

  // Coûts et revenus
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuelCost: number; // Coût carburant (FCFA)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tollCost: number; // Coût péages (FCFA)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  otherCosts: number; // Autres coûts (FCFA)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  revenue: number; // Revenu généré (FCFA)

  // Performance
  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  delayMinutes: number; // Retard en minutes

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number; // Note du trajet (0-5)

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  occupancyRate: number; // Taux d'occupation (%)

  // Annulation
  @Column({ type: 'enum', enum: CancellationReason, nullable: true })
  @IsOptional()
  @IsEnum(CancellationReason)
  cancellationReason: CancellationReason;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  cancellationDetails: string; // Détails de l'annulation

  @Column({ type: 'timestamp', nullable: true })
  cancelledAt: Date; // Date/heure d'annulation

  @Column({ type: 'varchar', length: 255, nullable: true })
  cancelledBy: string; // Annulé par

  // Incidents
  @Column({ type: 'boolean', default: false })
  hasIncident: boolean; // Incident signalé

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  incidentDescription: string; // Description de l'incident

  // Météo et conditions
  @Column({ type: 'varchar', length: 50, nullable: true })
  weatherCondition: string; // Conditions météo (ex: "Ensoleillé", "Pluie")

  @Column({ type: 'varchar', length: 50, nullable: true })
  roadCondition: string; // État de la route

  // Configuration
  @Column({ type: 'boolean', default: false })
  isRecurring: boolean; // Trajet récurrent

  @Column({ type: 'varchar', length: 50, nullable: true })
  recurringPattern: string; // Pattern de récurrence (ex: "daily", "weekly")

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes: string; // Notes du trajet

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  driverNotes: string; // Notes du chauffeur

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

  // Méthodes utilitaires

  /**
   * Vérifier si le trajet peut démarrer
   */
  canStart(): boolean {
    return this.status === TripStatus.SCHEDULED && !!this.vehicleId && !!this.driverId;
  }

  /**
   * Vérifier si le trajet est en cours
   */
  isInProgress(): boolean {
    return this.status === TripStatus.IN_PROGRESS;
  }

  /**
   * Vérifier si le trajet est terminé
   */
  isCompleted(): boolean {
    return this.status === TripStatus.COMPLETED;
  }

  /**
   * Vérifier si le trajet est annulé
   */
  isCancelled(): boolean {
    return this.status === TripStatus.CANCELLED;
  }

  /**
   * Calculer la durée réelle en minutes
   */
  calculateActualDuration(): number | null {
    if (!this.actualDepartureTime || !this.actualArrivalTime) return null;
    const diffMs = this.actualArrivalTime.getTime() - this.actualDepartureTime.getTime();
    return Math.round(diffMs / (1000 * 60));
  }

  /**
   * Calculer le coût total
   */
  calculateTotalCost(): number {
    const fuel = this.fuelCost || 0;
    const toll = this.tollCost || 0;
    const other = this.otherCosts || 0;
    return fuel + toll + other;
  }

  /**
   * Calculer le profit
   */
  calculateProfit(): number {
    const revenue = this.revenue || 0;
    const cost = this.calculateTotalCost();
    return revenue - cost;
  }

  /**
   * Calculer le taux d'occupation
   */
  calculateOccupancyRate(): number {
    if (!this.seatsAvailable || this.seatsAvailable === 0) return 0;
    return (this.passengersCount / this.seatsAvailable) * 100;
  }

  /**
   * Vérifier si le trajet est en retard
   */
  isDelayed(): boolean {
    return this.status === TripStatus.DELAYED || (this.delayMinutes || 0) > 0;
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(): string {
    const labels = {
      [TripStatus.SCHEDULED]: 'Programmé',
      [TripStatus.IN_PROGRESS]: 'En cours',
      [TripStatus.COMPLETED]: 'Terminé',
      [TripStatus.CANCELLED]: 'Annulé',
      [TripStatus.DELAYED]: 'Retardé',
      [TripStatus.NO_SHOW]: 'Non effectué'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir le label de la raison d'annulation
   */
  getCancellationReasonLabel(): string {
    if (!this.cancellationReason) return '';
    const labels = {
      [CancellationReason.WEATHER]: 'Météo',
      [CancellationReason.VEHICLE_BREAKDOWN]: 'Panne véhicule',
      [CancellationReason.DRIVER_UNAVAILABLE]: 'Chauffeur indisponible',
      [CancellationReason.LOW_DEMAND]: 'Faible demande',
      [CancellationReason.ROAD_CLOSED]: 'Route fermée',
      [CancellationReason.OTHER]: 'Autre'
    };
    return labels[this.cancellationReason] || 'Non spécifié';
  }
}
