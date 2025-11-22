/**
 * FICHIER: packages/database/src/entities/HousingOccupancyReport.entity.ts
 * ENTITÃ‰: HousingOccupancyReport - Rapports annuels d'occupation logement
 *
 * DESCRIPTION:
 * EntitÃ© pour stocker les rapports annuels d'occupation des logements
 * GÃ©nÃ©ration automatique le 31 aoÃ»t de chaque annÃ©e acadÃ©mique
 * Permet analyse historique et statistiques multi-annÃ©es
 *
 * STATISTIQUES CAPTURÃ‰ES:
 * - CapacitÃ© totale et occupation par citÃ©/chambre
 * - RÃ©partition par genre (hommes/femmes)
 * - Type de demandes (renouvellement vs nouvelle attribution)
 * - Taux de soumissions en ligne vs manuelles
 * - Taux d'occupation global
 *
 * UTILISATION:
 * - Dashboard admin avec Ã©volution temporelle
 * - Rapports annuels au MinistÃ¨re
 * - Planification capacitÃ©s futures
 * - Analyse tendances attributions
 *
 * AUTEUR: Ã‰quipe CROU
 * DATE: Janvier 2025
 */

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index
} from 'typeorm';
import { IsNumber, IsString, Min, Max } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { Housing } from './Housing.entity';
import { Room } from './Room.entity';
import { GenderRestriction } from './housing.enums';

@Entity('housing_occupancy_reports')
@Index(['year', 'tenantId']) // Index pour requÃªtes multi-tenant
@Index(['year', 'housingId']) // Index pour requÃªtes par citÃ©
@Index(['tenantId', 'year', 'genderRestriction']) // Index pour analyse genre
export class HousingOccupancyReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'housing_id', type: 'uuid' })
  housingId: string;

  @ManyToOne('Housing', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'housing_id' })
  housing: Housing;

  @Column({ name: 'room_id', type: 'uuid', nullable: true })
  roomId: string;

  @ManyToOne('Room', { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  // PÃ©riode du rapport
  @Column({ type: 'int' })
  @IsNumber()
  @Min(2020)
  @Max(2100)
  year: number; // AnnÃ©e acadÃ©mique (ex: 2025 pour 2025-2026)

  @Column({ type: 'varchar', length: 9 })
  @IsString()
  academicYear: string; // "2025-2026"

  // Informations logement (dÃ©normalisÃ©es pour historique)
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  housingName: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  roomNumber: string;

  @Column({ type: 'enum', enum: GenderRestriction })
  genderRestriction: GenderRestriction;

  // Statistiques capacitÃ©
  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  totalBeds: number; // CapacitÃ© totale lits

  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  occupiedBeds: number; // Lits occupÃ©s

  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  availableBeds: number; // Lits disponibles

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  @IsNumber()
  @Min(0)
  @Max(100)
  occupancyRate: number; // Taux d'occupation (%)

  // Statistiques par genre
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  maleCount: number; // Nombre Ã©tudiants hommes

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  femaleCount: number; // Nombre Ã©tudiantes femmes

  // Statistiques types de demandes
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  renewalCount: number; // Renouvellements

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  newAssignmentCount: number; // Nouvelles attributions

  // Statistiques soumissions en ligne
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  onlineSubmissionsCount: number; // Soumissions en ligne

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  manualSubmissionsCount: number; // Soumissions manuelles

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(100)
  onlineSubmissionsRate: number; // Taux soumissions en ligne (%)

  // Statistiques prioritÃ©s
  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  scholarshipHoldersCount: number; // Nombre boursiers

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  scientificBacCount: number; // Nombre BAC scientifiques

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  nonResidentsCount: number; // Nombre non-rÃ©sidents

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  disabledStudentsCount: number; // Nombre Ã©tudiants handicapÃ©s

  // Statistiques financiÃ¨res
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  totalRentCollected: number; // Loyers collectÃ©s (XOF)

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  averageRentPerBed: number; // Loyer moyen par lit (XOF)

  // MÃ©tadonnÃ©es
  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  generatedBy: string; // Utilisateur/systÃ¨me ayant gÃ©nÃ©rÃ© le rapport

  @Column({ type: 'text', nullable: true })
  notes: string; // Notes ou observations

  // MÃ©thodes utilitaires

  /**
   * Calculer le taux d'occupation
   */
  calculateOccupancyRate(): number {
    if (this.totalBeds === 0) return 0;
    return (this.occupiedBeds / this.totalBeds) * 100;
  }

  /**
   * Calculer le taux de soumissions en ligne
   */
  calculateOnlineSubmissionsRate(): number {
    const total = this.onlineSubmissionsCount + this.manualSubmissionsCount;
    if (total === 0) return 0;
    return (this.onlineSubmissionsCount / total) * 100;
  }

  /**
   * Mettre Ã  jour les taux calculÃ©s
   */
  updateCalculatedRates(): void {
    this.occupancyRate = this.calculateOccupancyRate();
    this.onlineSubmissionsRate = this.calculateOnlineSubmissionsRate();
  }

  /**
   * Obtenir le label de restriction genre
   */
  getGenderLabel(): string {
    const labels = {
      [GenderRestriction.MIXTE]: 'Mixte',
      [GenderRestriction.HOMMES]: 'Hommes',
      [GenderRestriction.FEMMES]: 'Femmes'
    };
    return labels[this.genderRestriction] || 'Inconnu';
  }

  /**
   * Obtenir la rÃ©partition genre en pourcentage
   */
  getGenderDistribution(): { male: number; female: number } {
    const total = this.maleCount + this.femaleCount;
    if (total === 0) return { male: 0, female: 0 };

    return {
      male: (this.maleCount / total) * 100,
      female: (this.femaleCount / total) * 100
    };
  }

  /**
   * Obtenir le ratio renouvellement/nouvelle attribution
   */
  getRenewalRatio(): number {
    const total = this.renewalCount + this.newAssignmentCount;
    if (total === 0) return 0;
    return (this.renewalCount / total) * 100;
  }

  /**
   * VÃ©rifier si le logement est sous-occupÃ©
   */
  isUnderOccupied(threshold: number = 70): boolean {
    return this.occupancyRate < threshold;
  }

  /**
   * VÃ©rifier si le logement est sur-occupÃ©
   */
  isOverOccupied(threshold: number = 95): boolean {
    return this.occupancyRate > threshold;
  }

  /**
   * Obtenir le statut d'occupation
   */
  getOccupancyStatus(): 'critical' | 'low' | 'optimal' | 'high' | 'full' {
    const rate = this.occupancyRate;
    if (rate === 0) return 'critical';
    if (rate < 50) return 'low';
    if (rate < 80) return 'optimal';
    if (rate < 95) return 'high';
    return 'full';
  }

  /**
   * Obtenir le badge couleur pour le statut
   */
  getOccupancyStatusColor(): string {
    const status = this.getOccupancyStatus();
    const colors = {
      critical: 'red',
      low: 'orange',
      optimal: 'green',
      high: 'blue',
      full: 'purple'
    };
    return colors[status];
  }

  /**
   * GÃ©nÃ©rer un rÃ©sumÃ© textuel
   */
  getSummary(): string {
    return `${this.housingName} (${this.academicYear}): ${this.occupiedBeds}/${this.totalBeds} lits occupÃ©s (${this.occupancyRate.toFixed(1)}%), ${this.maleCount}H/${this.femaleCount}F, ${this.renewalCount} renouvellements, ${this.newAssignmentCount} nouvelles attributions`;
  }

  /**
   * Comparer avec un autre rapport (Ã©volution)
   */
  compareWith(previousReport: HousingOccupancyReport): {
    occupancyChange: number;
    bedsChange: number;
    onlineRateChange: number;
  } {
    return {
      occupancyChange: this.occupancyRate - previousReport.occupancyRate,
      bedsChange: this.occupiedBeds - previousReport.occupiedBeds,
      onlineRateChange: this.onlineSubmissionsRate - previousReport.onlineSubmissionsRate
    };
  }
}
