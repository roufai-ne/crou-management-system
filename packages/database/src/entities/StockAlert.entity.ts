/**
 * FICHIER: packages\database\src\entities\StockAlert.entity.ts
 * ENTITÉ: StockAlert - Alertes de stock
 * 
 * DESCRIPTION:
 * Entité pour gérer les alertes de stock automatiques
 * Seuils, ruptures, péremption, approvisionnement
 * Notifications et escalade
 * 
 * RELATIONS:
 * - ManyToOne avec Stock (produit concerné)
 * - ManyToOne avec Tenant (contexte)
 * - ManyToOne avec User (créateur)
 * 
 * TYPES D'ALERTES:
 * - Seuil minimum atteint
 * - Rupture de stock
 * - Approvisionnement urgent
 * - Péremption proche
 * - Surstock
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
import { IsEnum, IsNumber, IsString, IsOptional } from 'class-validator';

import { Stock } from './Stock.entity';
import { Tenant } from './Tenant.entity';
import { User } from './User.entity';

// Types d'alertes de stock
export enum AlertType {
  SEUIL_MINIMUM = 'seuil_minimum',       // Seuil minimum atteint
  RUPTURE = 'rupture',                   // Rupture de stock
  URGENT = 'urgent',                     // Approvisionnement urgent
  PEREMPTION = 'peremption',             // Péremption proche
  SURSTOCK = 'surstock',                 // Surstock
  QUALITE = 'qualite'                    // Problème de qualité
}

export enum AlertPriority {
  LOW = 'low',                           // Faible
  MEDIUM = 'medium',                     // Moyenne
  HIGH = 'high',                         // Élevée
  CRITICAL = 'critical'                  // Critique
}

export enum AlertStatus {
  ACTIVE = 'active',                     // Active
  ACKNOWLEDGED = 'acknowledged',         // Reconnue
  RESOLVED = 'resolved',                 // Résolue
  CANCELLED = 'cancelled'                // Annulée
}

@Entity('stock_alerts')
@Index(['stockId', 'type']) // Index pour requêtes par stock
@Index(['tenantId', 'status']) // Index pour requêtes multi-tenant
@Index(['priority', 'status']) // Index pour tri par priorité
export class StockAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec stock
  @Column({ name: 'stock_id', type: 'uuid' })
  stockId: string;

  @ManyToOne(() => Stock, stock => stock.alerts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'stock_id' })
  stock: Stock;

  // Relation avec tenant
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'enum', enum: AlertType })
  @IsEnum(AlertType)
  type: AlertType;

  @Column({ type: 'enum', enum: AlertPriority })
  @IsEnum(AlertPriority)
  priority: AlertPriority;

  @Column({ type: 'enum', enum: AlertStatus, default: AlertStatus.ACTIVE })
  @IsEnum(AlertStatus)
  status: AlertStatus;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  title: string; // Titre de l'alerte

  @Column({ type: 'text' })
  @IsString()
  message: string; // Message détaillé

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string; // Description complète

  // Données de l'alerte
  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  quantiteActuelle: number; // Quantité actuelle

  @Column({ type: 'decimal', precision: 10, scale: 3, nullable: true })
  @IsOptional()
  @IsNumber()
  seuil: number; // Seuil déclencheur

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  @IsNumber()
  joursRestants: number; // Jours restants (pour péremption)

  // Actions et résolution
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  actionRecommandee: string; // Action recommandée

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  actionEffectuee: string; // Action effectuée

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  resolvedBy: string; // Résolue par

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date; // Date de résolution

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  resolutionNote: string | null; // Note de résolution

  // Notifications
  @Column({ type: 'boolean', default: false })
  emailSent: boolean; // Email envoyé

  @Column({ type: 'boolean', default: false })
  smsSent: boolean; // SMS envoyé

  @Column({ type: 'boolean', default: false })
  inAppSent: boolean; // Notification in-app envoyée

  @Column({ type: 'timestamp', nullable: true })
  lastNotificationSent: Date; // Dernière notification

  // Escalade
  @Column({ type: 'boolean', default: false })
  escalated: boolean; // Escaladée

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  escalatedTo: string; // Escaladée vers

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date; // Date d'escalade

  // Métadonnées
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string;

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Méthodes de gestion
  /**
   * Vérifier si l'alerte est active
   */
  isActive(): boolean {
    return this.status === AlertStatus.ACTIVE;
  }

  /**
   * Vérifier si l'alerte est résolue
   */
  isResolved(): boolean {
    return this.status === AlertStatus.RESOLVED;
  }

  /**
   * Vérifier si l'alerte est critique
   */
  isCritical(): boolean {
    return this.priority === AlertPriority.CRITICAL;
  }

  /**
   * Reconnaître l'alerte
   */
  acknowledge(): void {
    this.status = AlertStatus.ACKNOWLEDGED;
  }

  /**
   * Résoudre l'alerte
   */
  resolve(resolvedBy: string, note?: string): void {
    this.status = AlertStatus.RESOLVED;
    this.resolvedBy = resolvedBy;
    this.resolvedAt = new Date();
    this.resolutionNote = note || null;
  }

  /**
   * Annuler l'alerte
   */
  cancel(): void {
    this.status = AlertStatus.CANCELLED;
  }

  /**
   * Escalader l'alerte
   */
  escalate(escalatedTo: string): void {
    this.escalated = true;
    this.escalatedTo = escalatedTo;
    this.escalatedAt = new Date();
  }

  /**
   * Marquer les notifications comme envoyées
   */
  markNotificationsSent(email: boolean = false, sms: boolean = false, inApp: boolean = false): void {
    this.emailSent = email;
    this.smsSent = sms;
    this.inAppSent = inApp;
    this.lastNotificationSent = new Date();
  }

  /**
   * Obtenir le type formaté
   */
  getTypeLabel(): string {
    const labels = {
      [AlertType.SEUIL_MINIMUM]: 'Seuil minimum',
      [AlertType.RUPTURE]: 'Rupture de stock',
      [AlertType.URGENT]: 'Approvisionnement urgent',
      [AlertType.PEREMPTION]: 'Péremption proche',
      [AlertType.SURSTOCK]: 'Surstock',
      [AlertType.QUALITE]: 'Problème de qualité'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir la priorité formatée
   */
  getPriorityLabel(): string {
    const labels = {
      [AlertPriority.LOW]: 'Faible',
      [AlertPriority.MEDIUM]: 'Moyenne',
      [AlertPriority.HIGH]: 'Élevée',
      [AlertPriority.CRITICAL]: 'Critique'
    };
    return labels[this.priority] || 'Inconnue';
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels = {
      [AlertStatus.ACTIVE]: 'Active',
      [AlertStatus.ACKNOWLEDGED]: 'Reconnue',
      [AlertStatus.RESOLVED]: 'Résolue',
      [AlertStatus.CANCELLED]: 'Annulée'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir la couleur de priorité
   */
  getPriorityColor(): string {
    const colors = {
      [AlertPriority.LOW]: 'green',
      [AlertPriority.MEDIUM]: 'yellow',
      [AlertPriority.HIGH]: 'orange',
      [AlertPriority.CRITICAL]: 'red'
    };
    return colors[this.priority] || 'gray';
  }

  /**
   * Calculer l'âge de l'alerte en heures
   */
  getAgeInHours(): number {
    const now = new Date();
    const diff = now.getTime() - this.createdAt.getTime();
    return Math.floor(diff / (1000 * 60 * 60));
  }

  /**
   * Vérifier si l'alerte doit être escaladée
   */
  shouldEscalate(): boolean {
    if (this.escalated || this.isResolved()) return false;
    
    const ageHours = this.getAgeInHours();
    const escalationThresholds = {
      [AlertPriority.LOW]: 72,      // 3 jours
      [AlertPriority.MEDIUM]: 48,   // 2 jours
      [AlertPriority.HIGH]: 24,     // 1 jour
      [AlertPriority.CRITICAL]: 4   // 4 heures
    };
    
    return ageHours >= (escalationThresholds[this.priority] || 24);
  }
}
