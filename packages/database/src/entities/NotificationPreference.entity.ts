/**
 * FICHIER: packages\database\src\entities\NotificationPreference.entity.ts
 * ENTITÉ: NotificationPreference - Préférences utilisateur
 *
 * DESCRIPTION:
 * Entité pour gérer les préférences de notification des utilisateurs
 * Configuration des canaux, catégories, horaires
 * Personnalisation par utilisateur et tenant
 *
 * RELATIONS:
 * - ManyToOne avec User (utilisateur)
 * - ManyToOne avec Tenant (contexte)
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
  Index,
  Unique
} from 'typeorm';
import { IsJSON, IsBoolean, IsString } from 'class-validator';

import { User } from './User.entity';
import { Tenant } from './Tenant.entity';

@Entity('notification_preferences')
@Unique(['userId', 'tenantId']) // Une seule préférence par utilisateur/tenant
@Index(['userId'])
@Index(['tenantId'])
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec utilisateur
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Préférences par canal
  @Column({ type: 'jsonb', default: {} })
  @IsJSON()
  channels: {
    in_app: boolean;
    email: boolean;
    sms: boolean;
    push: boolean;
    websocket: boolean;
    sse: boolean;
  };

  // Préférences par catégorie
  @Column({ type: 'jsonb', default: {} })
  @IsJSON()
  categories: {
    financial: boolean;
    stocks: boolean;
    housing: boolean;
    transport: boolean;
    workflow: boolean;
    system: boolean;
    security: boolean;
  };

  // Préférences par type
  @Column({ type: 'jsonb', default: {} })
  @IsJSON()
  types: {
    info: boolean;
    success: boolean;
    warning: boolean;
    error: boolean;
    critical: boolean;
  };

  // Configuration des heures de silence
  @Column({ type: 'jsonb', nullable: true })
  @IsJSON()
  quietHours?: {
    enabled: boolean;
    start: string; // Format HH:mm
    end: string; // Format HH:mm
    timezone: string;
  };

  // Fréquence des notifications
  @Column({ type: 'jsonb', default: {} })
  @IsJSON()
  frequency: {
    immediate: boolean; // Notifications immédiates
    digest: boolean; // Résumé périodique
    digestFrequency: 'hourly' | 'daily' | 'weekly';
  };

  // Flags
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isEnabled: boolean; // Activer/désactiver toutes les notifications

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowSounds: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  allowVibrations: boolean;

  // Langue préférée pour les notifications
  @Column({ type: 'varchar', length: 10, default: 'fr' })
  @IsString()
  language: string;

  // Dates
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  /**
   * Méthode helper : Vérifier si dans les heures de silence
   */
  isInQuietHours(): boolean {
    if (!this.quietHours?.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const { start, end } = this.quietHours;

    // Gérer le cas où les heures traversent minuit
    if (start < end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  }

  /**
   * Méthode helper : Vérifier si le canal est activé
   */
  isChannelEnabled(channel: string): boolean {
    return this.isEnabled && (this.channels as any)[channel] === true;
  }

  /**
   * Méthode helper : Vérifier si la catégorie est activée
   */
  isCategoryEnabled(category: string): boolean {
    return this.isEnabled && (this.categories as any)[category] === true;
  }

  /**
   * Méthode helper : Vérifier si le type est activé
   */
  isTypeEnabled(type: string): boolean {
    return this.isEnabled && (this.types as any)[type] === true;
  }
}
