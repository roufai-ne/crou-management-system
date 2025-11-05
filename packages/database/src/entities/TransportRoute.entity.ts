/**
 * FICHIER: packages/database/src/entities/TransportRoute.entity.ts
 * ENTITÉ: TransportRoute - Gestion des itinéraires de transport
 *
 * DESCRIPTION:
 * Entité pour la gestion des itinéraires de transport
 * Définit les trajets réguliers avec arrêts et horaires
 * Support multi-tenant avec tenant_id
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec ScheduledTrip (trajets programmés)
 *
 * TYPES D'ITINÉRAIRES:
 * - Campus: Trajets internes au campus
 * - InterCampus: Trajets entre campus
 * - City: Trajets en ville
 * - Intercity: Trajets entre villes
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
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

import { Tenant } from './Tenant.entity';
import { ScheduledTrip } from './ScheduledTrip.entity';

// Types d'itinéraires
export enum RouteType {
  CAMPUS = 'campus',               // Trajet interne campus
  INTER_CAMPUS = 'inter_campus',   // Entre campus
  CITY = 'city',                   // En ville
  INTERCITY = 'intercity'          // Entre villes
}

export enum RouteStatus {
  ACTIF = 'active',       // Actif
  INACTIF = 'inactive',   // Inactif
  MAINTENANCE = 'maintenance', // En maintenance (route temporairement fermée)
  ARCHIVE = 'archived'    // Archivé
}

// Interface pour les arrêts (stocké en JSON)
export interface RouteStop {
  id: string;
  name: string;           // Nom de l'arrêt
  address: string;        // Adresse complète
  order: number;          // Ordre dans la séquence
  latitude?: number;      // Coordonnées GPS
  longitude?: number;
  estimatedTime?: number; // Temps estimé depuis le départ (minutes)
  isPickupPoint?: boolean; // Point de ramassage
  isDropoffPoint?: boolean; // Point de dépose
}

@Entity('transport_routes')
@Index(['tenantId', 'type'])   // Index pour requêtes multi-tenant
@Index(['tenantId', 'status']) // Index pour filtres par statut
@Index(['code'])               // Index pour recherche par code
export class TransportRoute {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 20, unique: true })
  @IsString()
  code: string; // Code unique de l'itinéraire (ex: "RT-001")

  @Column({ type: 'varchar', length: 200 })
  @IsString()
  name: string; // Nom de l'itinéraire

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string; // Description détaillée

  @Column({ type: 'enum', enum: RouteType, default: RouteType.CITY })
  @IsEnum(RouteType)
  type: RouteType;

  @Column({ type: 'enum', enum: RouteStatus, default: RouteStatus.ACTIF })
  @IsEnum(RouteStatus)
  status: RouteStatus;

  // Points de départ et d'arrivée
  @Column({ type: 'varchar', length: 200 })
  @IsString()
  startLocation: string; // Lieu de départ

  @Column({ type: 'varchar', length: 200 })
  @IsString()
  endLocation: string; // Lieu d'arrivée

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  startLatitude: number; // Latitude départ

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  startLongitude: number; // Longitude départ

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  endLatitude: number; // Latitude arrivée

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  endLongitude: number; // Longitude arrivée

  // Arrêts intermédiaires (JSON)
  @Column({ type: 'json', nullable: true })
  stops: RouteStop[]; // Liste des arrêts

  // Caractéristiques de l'itinéraire
  @Column({ type: 'decimal', precision: 8, scale: 2 })
  @IsNumber()
  @Min(0)
  distance: number; // Distance en kilomètres

  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  estimatedDuration: number; // Durée estimée en minutes

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  roadCondition: string; // État de la route (ex: "Bon", "Moyen", "Mauvais")

  // Planning et fréquence
  @Column({ type: 'json', nullable: true })
  operatingDays: string[]; // Jours d'opération (ex: ["lundi", "mardi", ...])

  @Column({ type: 'varchar', length: 10, nullable: true })
  startTime: string; // Heure de début (format HH:MM)

  @Column({ type: 'varchar', length: 10, nullable: true })
  endTime: string; // Heure de fin (format HH:MM)

  @Column({ type: 'int', nullable: true })
  frequencyMinutes: number; // Fréquence en minutes (ex: 30 = toutes les 30 minutes)

  @Column({ type: 'int', nullable: true })
  dailyTrips: number; // Nombre de trajets par jour

  // Capacité et ressources
  @Column({ type: 'int', nullable: true })
  maxPassengers: number; // Capacité maximale de passagers

  @Column({ type: 'varchar', length: 50, nullable: true })
  recommendedVehicleType: string; // Type de véhicule recommandé

  // Coûts
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fuelCostEstimate: number; // Coût carburant estimé par trajet (FCFA)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maintenanceCostEstimate: number; // Coût maintenance estimé par trajet (FCFA)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  ticketPrice: number; // Prix du ticket (FCFA)

  // Statistiques
  @Column({ type: 'int', default: 0 })
  totalTripsCompleted: number; // Nombre total de trajets complétés

  @Column({ type: 'int', default: 0 })
  totalPassengersTransported: number; // Nombre total de passagers transportés

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  averageOccupancyRate: number; // Taux d'occupation moyen (%)

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 5.0 })
  rating: number; // Note moyenne (0-5)

  // Configuration
  @Column({ type: 'boolean', default: true })
  isActive: boolean; // Itinéraire actif

  @Column({ type: 'boolean', default: false })
  requiresReservation: boolean; // Réservation obligatoire

  @Column({ type: 'boolean', default: false })
  isRoundTrip: boolean; // Aller-retour

  @Column({ type: 'int', nullable: true })
  priority: number; // Priorité (1=haute, 5=basse)

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
  @OneToMany(() => ScheduledTrip, trip => trip.route)
  scheduledTrips: ScheduledTrip[];

  // Méthodes utilitaires

  /**
   * Vérifier si l'itinéraire est actif
   */
  checkIsActive(): boolean {
    return this.status === RouteStatus.ACTIF && this.isActive;
  }

  /**
   * Obtenir le nombre d'arrêts
   */
  getStopCount(): number {
    return this.stops ? this.stops.length : 0;
  }

  /**
   * Obtenir les points de ramassage
   */
  getPickupPoints(): RouteStop[] {
    return this.stops ? this.stops.filter(stop => stop.isPickupPoint) : [];
  }

  /**
   * Obtenir les points de dépose
   */
  getDropoffPoints(): RouteStop[] {
    return this.stops ? this.stops.filter(stop => stop.isDropoffPoint) : [];
  }

  /**
   * Calculer le coût total estimé par trajet
   */
  calculateEstimatedCostPerTrip(): number {
    const fuel = this.fuelCostEstimate || 0;
    const maintenance = this.maintenanceCostEstimate || 0;
    return fuel + maintenance;
  }

  /**
   * Calculer le revenu potentiel par trajet
   */
  calculatePotentialRevenue(): number {
    if (!this.ticketPrice || !this.maxPassengers) return 0;
    return this.ticketPrice * this.maxPassengers * (this.averageOccupancyRate / 100);
  }

  /**
   * Vérifier si l'itinéraire opère un jour donné
   */
  operatesOnDay(day: string): boolean {
    if (!this.operatingDays) return false;
    return this.operatingDays.includes(day.toLowerCase());
  }

  /**
   * Obtenir le label du type d'itinéraire
   */
  getTypeLabel(): string {
    const labels = {
      [RouteType.CAMPUS]: 'Campus',
      [RouteType.INTER_CAMPUS]: 'Inter-Campus',
      [RouteType.CITY]: 'Ville',
      [RouteType.INTERCITY]: 'Inter-Villes'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(): string {
    const labels = {
      [RouteStatus.ACTIF]: 'Actif',
      [RouteStatus.INACTIF]: 'Inactif',
      [RouteStatus.MAINTENANCE]: 'En maintenance',
      [RouteStatus.ARCHIVE]: 'Archivé'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir une description courte
   */
  getShortDescription(): string {
    return `${this.code} - ${this.startLocation} → ${this.endLocation} (${this.distance}km)`;
  }

  /**
   * Calculer le taux de rentabilité estimé
   */
  calculateProfitabilityRate(): number {
    const cost = this.calculateEstimatedCostPerTrip();
    const revenue = this.calculatePotentialRevenue();
    if (cost === 0) return 0;
    return ((revenue - cost) / cost) * 100;
  }
}
