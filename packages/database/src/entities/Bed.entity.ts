/**
 * FICHIER: packages/database/src/entities/Bed.entity.ts
 * ENTITÉ: Bed - Lits dans les chambres
 *
 * DESCRIPTION:
 * Entité pour gérer les lits individuels dans les chambres
 * Chaque lit peut être occupé individuellement
 * Support pour capacité paramétrable (1-10+ lits par chambre)
 *
 * RELATIONS:
 * - ManyToOne avec Room (chambre parent)
 * - OneToMany avec HousingOccupancy (occupations du lit)
 *
 * WORKFLOW STATUTS:
 * 1. AVAILABLE: Lit disponible
 * 2. OCCUPIED: Lit occupé
 * 3. RESERVED: Lit réservé (occupation à venir)
 * 4. MAINTENANCE: Lit en maintenance
 * 5. OUT_OF_SERVICE: Lit hors service
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
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
import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';

import { Room } from './Room.entity';
import { HousingOccupancy } from './HousingOccupancy.entity';

// Statuts des lits
export enum BedStatus {
  AVAILABLE = 'available',       // Disponible (libre)
  OCCUPIED = 'occupied',          // Occupé (attribué à un étudiant)
  MAINTENANCE = 'maintenance',    // En maintenance
  OUT_OF_SERVICE = 'out_of_service' // Hors service (inutilisable)
}

@Entity('beds')
@Index(['roomId', 'status'])
@Index(['roomId', 'number'])
export class Bed {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne(() => Room, room => room.beds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @Column({ type: 'varchar', length: 10 })
  @IsString()
  number: string; // Numéro du lit (A, B, C, 1, 2, 3, etc.)

  @Column({ type: 'enum', enum: BedStatus, default: BedStatus.AVAILABLE })
  @IsEnum(BedStatus)
  status: BedStatus;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string; // Description (ex: "Lit supérieur près de la fenêtre")

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes: string; // Notes internes

  @Column({ name: 'is_active', type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean; // Lit actif

  @OneToMany(() => HousingOccupancy, occupancy => occupancy.bed)
  occupancies: HousingOccupancy[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, name: 'created_by' })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'updated_by' })
  @IsOptional()
  @IsString()
  updatedBy: string;

  /**
   * Vérifier si le lit est disponible
   */
  isAvailable(): boolean {
    return this.status === BedStatus.AVAILABLE && this.isActive;
  }

  /**
   * Vérifier si le lit est occupé
   */
  isOccupied(): boolean {
    return this.status === BedStatus.OCCUPIED;
  }

  /**
   * Vérifier si le lit est en maintenance
   */
  isInMaintenance(): boolean {
    return this.status === BedStatus.MAINTENANCE;
  }

  /**
   * Vérifier si le lit est hors service
   */
  isOutOfService(): boolean {
    return this.status === BedStatus.OUT_OF_SERVICE;
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels: { [key: string]: string } = {
      'available': 'Disponible',
      'occupied': 'Occupé',
      'maintenance': 'En maintenance',
      'out_of_service': 'Hors service'
    };
    return labels[this.status] || this.status;
  }

  /**
   * Obtenir la classe CSS pour le badge de statut
   */
  getStatusBadgeClass(): string {
    const classes: { [key: string]: string } = {
      'available': 'badge-success',
      'occupied': 'badge-error',
      'maintenance': 'badge-warning',
      'out_of_service': 'badge-neutral'
    };
    return classes[this.status] || 'badge-neutral';
  }

  /**
   * Obtenir l'icône pour le statut
   */
  getStatusIcon(): string {
    const icons: { [key: string]: string } = {
      'available': '🟢',
      'occupied': '🔴',
      'maintenance': '🟠',
      'out_of_service': '⚫'
    };
    return icons[this.status] || '⚪';
  }

  /**
   * Obtenir le numéro complet du lit (Chambre + Lit)
   */
  getFullNumber(room?: Room): string {
    if (room) {
      return `${room.numero}-${this.number}`;
    }
    return this.number;
  }
}
