/**
 * FICHIER: packages/database/src/entities/TransportTicketPrice.entity.ts
 * ENTITÃ‰: TransportTicketPrice - Gestion des tarifs de tickets transport
 *
 * DESCRIPTION:
 * EntitÃ© pour gÃ©rer les tarifs des tickets de transport
 * Permet de configurer diffÃ©rents tarifs selon la catÃ©gorie
 * Support multi-tenant avec tenant_id
 * Historisation des changements de tarifs
 *
 * EXEMPLE D'UTILISATION:
 * - Tarif standard: 200 XOF
 * - Tarif Ã©tudiant boursier: 0 XOF (gratuit)
 * - Tarif rÃ©duit: 100 XOF
 * - Tarif personnel CROU: 150 XOF
 *
 * AUTEUR: Ã‰quipe CROU - Module Transport
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
import { IsString, IsNumber, Min, IsBoolean } from 'class-validator';
import { Tenant } from './Tenant.entity';

// CatÃ©gories de tarifs
export enum TicketPriceCategory {
  STANDARD = 'standard',           // Ã‰tudiant standard
  BOURSIER = 'boursier',          // Ã‰tudiant boursier (gratuit)
  REDUIT = 'reduit',              // Tarif rÃ©duit (situations spÃ©ciales)
  PERSONNEL = 'personnel',         // Personnel CROU
  EXTERNE = 'externe'             // Passagers externes (si autorisÃ©)
}

@Entity('transport_ticket_prices')
@Index(['tenantId', 'category'])
@Index(['tenantId', 'isActive'])
export class TransportTicketPrice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // CatÃ©gorie de tarif
  @Column({
    type: 'enum',
    enum: TicketPriceCategory,
    unique: false
  })
  category: TicketPriceCategory;

  // Informations du tarif
  @Column({ type: 'varchar', length: 100 })
  @IsString()
  name: string; // Ex: "Tarif Standard", "Tarif Boursier"

  @Column({ type: 'text', nullable: true })
  @IsString()
  description: string; // Description dÃ©taillÃ©e

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  amount: number; // Montant en FCFA (0 pour gratuit)

  // Configuration
  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean; // Actif ou non

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isDefault: boolean; // Tarif par dÃ©faut lors de l'Ã©mission

  @Column({ type: 'int', default: 0 })
  @IsNumber()
  displayOrder: number; // Ordre d'affichage dans l'interface

  // Conditions d'application (optionnel)
  @Column({ type: 'jsonb', nullable: true })
  conditions: {
    requiresProof?: boolean;       // NÃ©cessite justificatif
    proofType?: string;            // Type de justificatif (carte boursier, etc.)
    validFrom?: string;            // Date dÃ©but validitÃ©
    validUntil?: string;           // Date fin validitÃ©
    maxTicketsPerPerson?: number;  // Limite par personne
    notes?: string;
  };

  // Statistiques
  @Column({ type: 'int', default: 0 })
  totalTicketsIssued: number; // Nombre total de tickets Ã©mis Ã  ce tarif

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalRevenue: number; // Revenu total gÃ©nÃ©rÃ©

  // MÃ©tadonnÃ©es
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsString()
  updatedBy: string;

  // MÃ©thodes utilitaires

  /**
   * VÃ©rifier si le tarif est gratuit
   */
  isFree(): boolean {
    return this.amount === 0;
  }

  /**
   * Obtenir le label complet
   */
  getLabel(): string {
    if (this.isFree()) {
      return `${this.name} (Gratuit)`;
    }
    return `${this.name} (${this.amount.toLocaleString()} XOF)`;
  }

  /**
   * VÃ©rifier si le tarif est actuellement valide
   */
  isCurrentlyValid(): boolean {
    if (!this.isActive) return false;

    const now = new Date();

    if (this.conditions?.validFrom) {
      const validFrom = new Date(this.conditions.validFrom);
      if (now < validFrom) return false;
    }

    if (this.conditions?.validUntil) {
      const validUntil = new Date(this.conditions.validUntil);
      if (now > validUntil) return false;
    }

    return true;
  }

  /**
   * Obtenir la catÃ©gorie en franÃ§ais
   */
  getCategoryLabel(): string {
    const labels: Record<TicketPriceCategory, string> = {
      [TicketPriceCategory.STANDARD]: 'Standard',
      [TicketPriceCategory.BOURSIER]: 'Ã‰tudiant boursier',
      [TicketPriceCategory.REDUIT]: 'Tarif rÃ©duit',
      [TicketPriceCategory.PERSONNEL]: 'Personnel CROU',
      [TicketPriceCategory.EXTERNE]: 'Externe'
    };
    return labels[this.category] || this.category;
  }
}
