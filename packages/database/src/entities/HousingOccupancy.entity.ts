/**
 * FICHIER: packages/database/src/entities/HousingOccupancy.entity.ts
 * ENTITÉ: HousingOccupancy - Occupations de chambres
 *
 * DESCRIPTION:
 * Entité pour gérer les occupations de chambres universitaires
 * Une occupation = un étudiant logé dans une chambre pour une période définie
 *
 * RELATIONS:
 * - ManyToOne avec Student (occupant)
 * - ManyToOne avec Room (chambre occupée)
 * - ManyToOne avec Tenant (CROU)
 * - ManyToOne avec HousingRequest (demande d'origine, optionnel)
 *
 * WORKFLOW STATUTS:
 * 1. ACTIVE: Occupation en cours
 * 2. ENDED: Occupation terminée normalement
 * 3. CANCELLED: Occupation annulée avant terme
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
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
import { IsDate, IsEnum, IsNumber, IsString, IsOptional, IsBoolean, Min } from 'class-validator';

import { Student } from './Student.entity';
import { Room } from './Room.entity';
import { Tenant } from './Tenant.entity';
import { HousingRequest } from './HousingRequest.entity';
import { Bed } from './Bed.entity';

// Statuts d'occupation
export enum OccupancyStatus {
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

@Entity('housing_occupancies')
@Index(['studentId', 'status'])
@Index(['bedId', 'status'])
@Index(['roomId', 'status'])
@Index(['tenantId', 'status'])
@Index(['endDate', 'status'])
export class HousingOccupancy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne('Student', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'bed_id', type: 'uuid' })
  bedId: string;

  @ManyToOne(() => Bed, bed => bed.occupancies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'bed_id' })
  bed: Bed;

  @Column({ name: 'room_id', type: 'uuid' })
  roomId: string;

  @ManyToOne('Room', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'room_id' })
  room: Room;

  @ManyToOne('Housing', { nullable: true })
  @JoinColumn({ name: 'housing_id' })
  housing: any;

  @Column({ name: 'housing_request_id', type: 'uuid', nullable: true })
  housingRequestId: string;

  @ManyToOne(() => HousingRequest, { nullable: true })
  @JoinColumn({ name: 'housing_request_id' })
  housingRequest: HousingRequest;

  @Column({ type: 'date', name: 'dateDebut' })
  @IsDate()
  startDate: Date;

  @Column({ type: 'date', name: 'dateFin' })
  @IsDate()
  endDate: Date;

  @Column({ type: 'enum', enum: OccupancyStatus, default: OccupancyStatus.ACTIVE })
  @IsEnum(OccupancyStatus)
  status: OccupancyStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'loyerMensuel' })
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @Column({ type: 'boolean', default: false, name: 'is_rent_paid' })
  @IsBoolean()
  isRentPaid: boolean;

  @Column({ type: 'timestamp', nullable: true, name: 'last_rent_payment_date' })
  @IsOptional()
  @IsDate()
  lastRentPaymentDate: Date;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'contract_file_url' })
  @IsOptional()
  @IsString()
  contractFileUrl: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes: string;

  @Column({ type: 'timestamp', nullable: true, name: 'actual_end_date' })
  @IsOptional()
  @IsDate()
  actualEndDate: Date;

  @Column({ type: 'text', nullable: true, name: 'cancellation_reason' })
  @IsOptional()
  @IsString()
  cancellationReason: string;

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

  isActive(): boolean {
    return this.status === OccupancyStatus.ACTIVE;
  }

  isEnded(): boolean {
    return this.status === OccupancyStatus.ENDED || this.status === OccupancyStatus.CANCELLED;
  }

  getDaysRemaining(): number {
    if (!this.isActive()) return 0;
    const now = new Date();
    const end = new Date(this.endDate);
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  isExpiringSoon(days: number = 30): boolean {
    if (!this.isActive()) return false;
    return this.getDaysRemaining() <= days;
  }

  getOccupancyDuration(): number {
    const start = new Date(this.startDate);
    const end = this.actualEndDate ? new Date(this.actualEndDate) : new Date(this.endDate);
    const diff = end.getTime() - start.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getOccupancyMonths(): number {
    const days = this.getOccupancyDuration();
    return Math.ceil(days / 30);
  }

  getTotalRentAmount(): number {
    const months = this.getOccupancyMonths();
    return months * this.monthlyRent;
  }

  canBeReleased(): boolean {
    return this.status === OccupancyStatus.ACTIVE;
  }

  canBeCancelled(): boolean {
    return this.status === OccupancyStatus.ACTIVE;
  }

  getStatusLabel(): string {
    const labels: { [key: string]: string } = {
      'active': 'Active',
      'ended': 'Terminée',
      'cancelled': 'Annulée'
    };
    return labels[this.status] || this.status;
  }
}
