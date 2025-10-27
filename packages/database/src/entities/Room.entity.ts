/**
 * FICHIER: packages\database\src\entities\Room.entity.ts
 * ENTITÉ: Room - Chambres des logements CROU
 * 
 * DESCRIPTION:
 * Entité pour la gestion des chambres individuelles
 * Gestion des lits, occupations et maintenance
 * 
 * RELATIONS:
 * - ManyToOne avec Housing (logement parent)
 * - OneToMany avec HousingOccupancy (occupations)
 * - OneToMany avec HousingMaintenance (maintenance)
 * 
 * TYPES DE CHAMBRES:
 * - Simple: 1 lit
 * - Double: 2 lits
 * - Triple: 3 lits
 * - Quadruple: 4 lits
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

import { Housing } from './Housing.entity';
import { HousingOccupancy } from './HousingOccupancy.entity';
import { HousingMaintenance } from './HousingMaintenance.entity';

// Types de chambres
export enum RoomType {
  SIMPLE = 'simple',             // 1 lit
  DOUBLE = 'double',             // 2 lits
  TRIPLE = 'triple',             // 3 lits
  QUADRUPLE = 'quadruple'        // 4 lits
}

export enum RoomStatus {
  DISPONIBLE = 'disponible',     // Disponible
  OCCUPE = 'occupe',             // Occupée
  MAINTENANCE = 'maintenance',   // En maintenance
  HORS_SERVICE = 'hors_service'  // Hors service
}

@Entity('rooms')
@Index(['housingId', 'numero']) // Index pour requêtes par logement
@Index(['housingId', 'status']) // Index pour filtres
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec logement parent
  @Column({ name: 'housing_id', type: 'uuid' })
  housingId: string;

  @ManyToOne(() => Housing, housing => housing.rooms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'housing_id' })
  housing: Housing;

  // Informations de base
  @Column({ type: 'varchar', length: 20 })
  @IsString()
  numero: string; // Numéro de chambre

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  etage: string; // Étage

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  batiment: string; // Bâtiment

  @Column({ type: 'enum', enum: RoomType })
  @IsEnum(RoomType)
  type: RoomType;

  @Column({ type: 'enum', enum: RoomStatus, default: RoomStatus.DISPONIBLE })
  @IsEnum(RoomStatus)
  status: RoomStatus;

  // Capacité
  @Column({ type: 'int' })
  @IsNumber()
  @Min(1)
  capacite: number; // Nombre de lits

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  occupation: number; // Nombre d'occupants actuels

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  tauxOccupation: number; // Taux d'occupation en %

  // Équipements
  @Column({ type: 'jsonb', nullable: true })
  equipements: string[]; // Liste des équipements

  @Column({ type: 'boolean', default: false })
  climatisation: boolean; // Climatisation

  @Column({ type: 'boolean', default: false })
  chauffage: boolean; // Chauffage

  @Column({ type: 'boolean', default: false })
  wifi: boolean; // WiFi

  @Column({ type: 'boolean', default: false })
  balcon: boolean; // Balcon

  @Column({ type: 'boolean', default: false })
  salleDeBain: boolean; // Salle de bain privée

  @Column({ type: 'boolean', default: false })
  cuisine: boolean; // Cuisine privée

  // Tarification
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  loyerMensuel: number; // Loyer mensuel en FCFA

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caution: number; // Caution en FCFA

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string; // Devise (FCFA par défaut)

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  dateDerniereMaintenance: Date; // Date de dernière maintenance

  @Column({ type: 'date', nullable: true })
  dateProchaineMaintenance: Date; // Date de prochaine maintenance

  // Configuration
  @Column({ type: 'boolean', default: true })
  isActif: boolean; // Chambre active

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
  @OneToMany(() => HousingOccupancy, occupancy => occupancy.room, { cascade: true })
  occupancies: HousingOccupancy[];

  @OneToMany(() => HousingMaintenance, maintenance => maintenance.room, { cascade: true })
  maintenances: HousingMaintenance[];

  // Méthodes de calcul
  /**
   * Calculer le taux d'occupation
   */
  calculateOccupancyRate(): number {
    if (this.capacite === 0) return 0;
    return (this.occupation / this.capacite) * 100;
  }

  /**
   * Calculer le nombre de lits disponibles
   */
  calculateAvailableBeds(): number {
    return Math.max(0, this.capacite - this.occupation);
  }

  /**
   * Mettre à jour les calculs
   */
  updateCalculations(): void {
    this.tauxOccupation = this.calculateOccupancyRate();
  }

  /**
   * Vérifier si la chambre est disponible
   */
  isAvailable(): boolean {
    return this.status === RoomStatus.DISPONIBLE && 
           this.isActif && 
           this.calculateAvailableBeds() > 0;
  }

  /**
   * Vérifier si la chambre est complète
   */
  isFull(): boolean {
    return this.occupation >= this.capacite;
  }

  /**
   * Vérifier si la chambre est en maintenance
   */
  isInMaintenance(): boolean {
    return this.status === RoomStatus.MAINTENANCE;
  }

  /**
   * Vérifier si la chambre est hors service
   */
  isOutOfService(): boolean {
    return this.status === RoomStatus.HORS_SERVICE;
  }

  /**
   * Ajouter un occupant
   */
  addOccupant(): boolean {
    if (this.calculateAvailableBeds() <= 0) return false;
    this.occupation++;
    this.updateCalculations();
    return true;
  }

  /**
   * Retirer un occupant
   */
  removeOccupant(): boolean {
    if (this.occupation <= 0) return false;
    this.occupation--;
    this.updateCalculations();
    return true;
  }

  /**
   * Obtenir le type formaté
   */
  getTypeLabel(): string {
    const labels = {
      [RoomType.SIMPLE]: 'Simple',
      [RoomType.DOUBLE]: 'Double',
      [RoomType.TRIPLE]: 'Triple',
      [RoomType.QUADRUPLE]: 'Quadruple'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels = {
      [RoomStatus.DISPONIBLE]: 'Disponible',
      [RoomStatus.OCCUPE]: 'Occupée',
      [RoomStatus.MAINTENANCE]: 'En maintenance',
      [RoomStatus.HORS_SERVICE]: 'Hors service'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir le numéro complet de la chambre
   */
  getFullNumber(): string {
    const parts = [];
    if (this.batiment) parts.push(this.batiment);
    if (this.etage) parts.push(this.etage);
    parts.push(this.numero);
    return parts.join('-');
  }

  /**
   * Obtenir la description de la chambre
   */
  getDescription(): string {
    return `${this.getTypeLabel()} - ${this.capacite} lit${this.capacite > 1 ? 's' : ''} - ${this.getStatusLabel()}`;
  }
}
