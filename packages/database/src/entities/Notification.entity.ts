/**
 * FICHIER: packages\database\src\entities\Notification.entity.ts
 * ENTITÉ: Notification - Système de notifications
 *
 * DESCRIPTION:
 * Entité pour gérer les notifications utilisateurs
 * Support multi-tenant et multi-canal
 * Historique et traçabilité des notifications
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (contexte)
 * - ManyToOne avec User (destinataire)
 * - ManyToOne avec User (créateur)
 *
 * TYPES DE NOTIFICATIONS:
 * - Informations générales
 * - Alertes de stock
 * - Notifications financières
 * - Alertes système
 * - Notifications de workflow
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
import { IsEnum, IsString, IsOptional, IsJSON, IsBoolean } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { User } from './User.entity';

// Types de notifications
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Catégories de notifications
export enum NotificationCategory {
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  HOUSING = 'housing',
  TRANSPORT = 'transport',
  WORKFLOW = 'workflow',
  SYSTEM = 'system',
  SECURITY = 'security'
}

// Priorité des notifications
export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// Statut des notifications
export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed'
}

// Méthodes de livraison
export enum DeliveryMethod {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBSOCKET = 'websocket',
  SSE = 'sse'
}

@Entity('notifications')
@Index(['tenantId', 'userId', 'status']) // Index pour requêtes utilisateur
@Index(['tenantId', 'category', 'createdAt']) // Index pour filtres
@Index(['status', 'createdAt']) // Index pour traitement
@Index(['expiresAt']) // Index pour nettoyage
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Relation avec destinataire (optionnel pour notifications broadcast)
  @Column({ type: 'uuid', name: 'user_id', nullable: true })
  @IsOptional()
  userId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User;

  // Relation avec créateur
  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  // Informations de base
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  title: string;

  @Column({ type: 'text' })
  @IsString()
  message: string;

  // Classification
  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.INFO
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationCategory
  })
  @IsEnum(NotificationCategory)
  category: NotificationCategory;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM
  })
  @IsEnum(NotificationPriority)
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.PENDING
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;

  // Rôle cible (pour notifications broadcast par rôle)
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  role?: string;

  // Données additionnelles (JSON)
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  data?: Record<string, any>;

  // Métadonnées
  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  @IsJSON()
  metadata?: {
    source?: string;
    action?: string;
    entityId?: string;
    entityType?: string;
    url?: string;
    icon?: string;
    color?: string;
    sound?: boolean;
    vibration?: boolean;
    persistent?: boolean;
    autoClose?: boolean;
    duration?: number;
  };

  // Méthode de livraison
  @Column({
    type: 'enum',
    enum: DeliveryMethod,
    array: true,
    default: [DeliveryMethod.IN_APP]
  })
  deliveryMethods: DeliveryMethod[];

  // Dates importantes
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamp', name: 'expires_at', nullable: true })
  @IsOptional()
  expiresAt?: Date;

  @Column({ type: 'timestamp', name: 'read_at', nullable: true })
  @IsOptional()
  readAt?: Date;

  @Column({ type: 'timestamp', name: 'delivered_at', nullable: true })
  @IsOptional()
  deliveredAt?: Date;

  // Flags
  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isRead: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isArchived: boolean;

  // Tentatives de livraison
  @Column({ type: 'integer', default: 0 })
  deliveryAttempts: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  deliveryError?: string;

  /**
   * Méthode helper : Vérifier si la notification est expirée
   */
  isExpired(): boolean {
    if (!this.expiresAt) return false;
    return new Date() > this.expiresAt;
  }

  /**
   * Méthode helper : Vérifier si la notification est lue
   */
  isNotificationRead(): boolean {
    return this.isRead || this.status === NotificationStatus.READ;
  }

  /**
   * Méthode helper : Marquer comme lue
   */
  markAsRead(): void {
    this.isRead = true;
    this.status = NotificationStatus.READ;
    this.readAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Méthode helper : Marquer comme livrée
   */
  markAsDelivered(): void {
    this.status = NotificationStatus.DELIVERED;
    this.deliveredAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Méthode helper : Archiver la notification
   */
  archive(): void {
    this.isArchived = true;
    this.updatedAt = new Date();
  }

  /**
   * Méthode helper : Incrémenter les tentatives de livraison
   */
  incrementDeliveryAttempts(error?: string): void {
    this.deliveryAttempts++;
    if (error) {
      this.deliveryError = error;
    }
    this.updatedAt = new Date();
  }
}
