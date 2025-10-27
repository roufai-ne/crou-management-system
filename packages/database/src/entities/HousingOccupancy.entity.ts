/**
 * FICHIER: packages\database\src\entities\HousingOccupancy.entity.ts
 * ENTITÉ: HousingOccupancy - Occupations des logements
 * 
 * DESCRIPTION:
 * Entité pour gérer les occupations des chambres
 * Suivi des étudiants et des paiements
 * 
 * RELATIONS:
 * - ManyToOne avec Housing (logement)
 * - ManyToOne avec Room (chambre)
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

import { Housing } from './Housing.entity';
import { Room } from './Room.entity';
import { Tenant } from './Tenant.entity';

export enum OccupancyStatus {
  ACTIVE = 'active',             // Occupation active
  TERMINATED = 'terminated',     // Occupation terminée
  SUSPENDED = 'suspended'        // Occupation suspendue
}

@Entity('housing_occupancies')
@Index(['housingId', 'roomId']) // Index pour requêtes par logement
@Index(['tenantId', 'status']) // Index pour requêtes multi-tenant
export class HousingOccupancy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ name: 'housing_id', type: 'uuid' })
  housingId: string;

  @ManyToOne(() => Housing, housing => housing.occupancies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'housing_id' })
  housing: Housing;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, room => room.occupancies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de l'occupant
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  nom: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  prenom: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  telephone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  numeroEtudiant: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  universite: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  filiere: string;

  // Dates d'occupation
  @Column({ type: 'date' })
  dateDebut: Date;

  @Column({ type: 'date', nullable: true })
  dateFin: Date;

  @Column({ type: 'enum', enum: OccupancyStatus, default: OccupancyStatus.ACTIVE })
  @IsEnum(OccupancyStatus)
  status: OccupancyStatus;

  // Tarification
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  loyerMensuel: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  caution: number;

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string;

  // Métadonnées
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  // Méthodes
  isActive(): boolean {
    return this.status === OccupancyStatus.ACTIVE;
  }

  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }
}
