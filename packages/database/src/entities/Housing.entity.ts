/**
 * FICHIER: packages\database\src\entities\Housing.entity.ts
 * ENTITÉ: Housing - Gestion des logements CROU
 * 
 * DESCRIPTION:
 * Entité pour la gestion des cités universitaires et logements
 * Support multi-tenant avec tenant_id
 * Gestion des chambres, occupations et maintenance
 * 
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU)
 * - OneToMany avec Room (chambres)
 * - OneToMany avec HousingOccupancy (occupations)
 * - OneToMany avec HousingMaintenance (maintenance)
 * 
 * TYPES DE LOGEMENTS:
 * - Cité universitaire
 * - Résidence étudiante
 * - Foyer
 * - Logement personnel
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

import { Tenant } from './Tenant.entity';
import { Room } from './Room.entity';
import { HousingOccupancy } from './HousingOccupancy.entity';
import { HousingMaintenance } from './HousingMaintenance.entity';

// Types de logements selon PRD
export enum HousingType {
  CITE_UNIVERSITAIRE = 'cite_universitaire', // Cité universitaire
  RESIDENCE = 'residence',                   // Résidence étudiante
  FOYER = 'foyer',                          // Foyer
  LOGEMENT_PERSONNEL = 'logement_personnel'  // Logement personnel
}

export enum HousingStatus {
  ACTIF = 'actif',               // Actif
  INACTIF = 'inactif',           // Inactif
  EN_CONSTRUCTION = 'en_construction', // En construction
  EN_RENOVATION = 'en_renovation',     // En rénovation
  FERME = 'ferme'                // Fermé
}

export enum HousingCategory {
  STANDARD = 'standard',         // Standard
  CONFORT = 'confort',           // Confort
  LUXE = 'luxe',                 // Luxe
  HANDICAPE = 'handicape'        // Accessible handicapés
}

@Entity('housings')
@Index(['tenantId', 'type']) // Index pour requêtes multi-tenant
@Index(['tenantId', 'status']) // Index pour filtres
@Index(['code']) // Index pour recherche par code
export class Housing {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant (CROU uniquement)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 100, unique: true })
  @IsString()
  code: string; // Code unique du logement

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  nom: string; // Nom du logement

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string;

  @Column({ type: 'enum', enum: HousingType })
  @IsEnum(HousingType)
  type: HousingType;

  @Column({ type: 'enum', enum: HousingCategory })
  @IsEnum(HousingCategory)
  category: HousingCategory;

  @Column({ type: 'enum', enum: HousingStatus, default: HousingStatus.ACTIF })
  @IsEnum(HousingStatus)
  status: HousingStatus;

  // Adresse et localisation
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  adresse: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  ville: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  region: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  codePostal: string;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  @IsOptional()
  @IsNumber()
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 6, nullable: true })
  @IsOptional()
  @IsNumber()
  longitude: number;

  // Capacité et occupation
  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  nombreChambres: number; // Nombre total de chambres

  @Column({ type: 'int' })
  @IsNumber()
  @Min(0)
  capaciteTotale: number; // Capacité totale en lits

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  @Min(0)
  occupationActuelle: number; // Occupation actuelle

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  tauxOccupation: number; // Taux d'occupation en %

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

  // Équipements et services
  @Column({ type: 'jsonb', nullable: true })
  equipements: string[]; // Liste des équipements

  @Column({ type: 'jsonb', nullable: true })
  services: string[]; // Liste des services

  @Column({ type: 'boolean', default: false })
  wifi: boolean; // WiFi disponible

  @Column({ type: 'boolean', default: false })
  climatisation: boolean; // Climatisation

  @Column({ type: 'boolean', default: false })
  chauffage: boolean; // Chauffage

  @Column({ type: 'boolean', default: false })
  cuisine: boolean; // Cuisine commune

  @Column({ type: 'boolean', default: false })
  laverie: boolean; // Laverie

  @Column({ type: 'boolean', default: false })
  parking: boolean; // Parking

  @Column({ type: 'boolean', default: false })
  securite: boolean; // Sécurité 24h/24

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  dateConstruction: Date; // Date de construction

  @Column({ type: 'date', nullable: true })
  dateRenovation: Date; // Date de dernière rénovation

  @Column({ type: 'date', nullable: true })
  dateOuverture: Date; // Date d'ouverture

  @Column({ type: 'date', nullable: true })
  dateFermeture: Date; // Date de fermeture

  // Configuration
  @Column({ type: 'boolean', default: true })
  isActif: boolean; // Logement actif

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

  // Relations
  @OneToMany(() => Room, room => room.housing, { cascade: true })
  rooms: Room[];

  @OneToMany(() => HousingOccupancy, occupancy => occupancy.housing, { cascade: true })
  occupancies: HousingOccupancy[];

  @OneToMany(() => HousingMaintenance, maintenance => maintenance.housing, { cascade: true })
  maintenances: HousingMaintenance[];

  // Méthodes de calcul
  /**
   * Calculer le taux d'occupation
   */
  calculateOccupancyRate(): number {
    if (this.capaciteTotale === 0) return 0;
    return (this.occupationActuelle / this.capaciteTotale) * 100;
  }

  /**
   * Calculer le nombre de chambres disponibles
   */
  calculateAvailableRooms(): number {
    return this.rooms?.filter(room => room.isAvailable()).length || 0;
  }

  /**
   * Calculer le nombre de lits disponibles
   */
  calculateAvailableBeds(): number {
    return this.rooms?.reduce((total, room) => total + room.calculateAvailableBeds(), 0) || 0;
  }

  /**
   * Mettre à jour les calculs
   */
  updateCalculations(): void {
    this.tauxOccupation = this.calculateOccupancyRate();
  }

  /**
   * Vérifier si le logement est disponible
   */
  isAvailable(): boolean {
    return this.status === HousingStatus.ACTIF && this.isActif;
  }

  /**
   * Vérifier si le logement est en maintenance
   */
  isInMaintenance(): boolean {
    return this.status === HousingStatus.EN_RENOVATION || this.maintenanceProgrammee;
  }

  /**
   * Vérifier si le logement est complet
   */
  isFull(): boolean {
    return this.occupationActuelle >= this.capaciteTotale;
  }

  /**
   * Obtenir le type formaté
   */
  getTypeLabel(): string {
    const labels = {
      [HousingType.CITE_UNIVERSITAIRE]: 'Cité universitaire',
      [HousingType.RESIDENCE]: 'Résidence étudiante',
      [HousingType.FOYER]: 'Foyer',
      [HousingType.LOGEMENT_PERSONNEL]: 'Logement personnel'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir la catégorie formatée
   */
  getCategoryLabel(): string {
    const labels = {
      [HousingCategory.STANDARD]: 'Standard',
      [HousingCategory.CONFORT]: 'Confort',
      [HousingCategory.LUXE]: 'Luxe',
      [HousingCategory.HANDICAPE]: 'Accessible handicapés'
    };
    return labels[this.category] || 'Inconnue';
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels = {
      [HousingStatus.ACTIF]: 'Actif',
      [HousingStatus.INACTIF]: 'Inactif',
      [HousingStatus.EN_CONSTRUCTION]: 'En construction',
      [HousingStatus.EN_RENOVATION]: 'En rénovation',
      [HousingStatus.FERME]: 'Fermé'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir l'adresse complète
   */
  getFullAddress(): string {
    const parts = [this.adresse];
    if (this.ville) parts.push(this.ville);
    if (this.region) parts.push(this.region);
    if (this.codePostal) parts.push(this.codePostal);
    return parts.join(', ');
  }
}
