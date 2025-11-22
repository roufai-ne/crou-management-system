/**
 * FICHIER: packages/database/src/entities/TicketTransport.entity.ts
 * ENTITÉ: TicketTransport - Gestion des tickets de transport ANONYMES
 *
 * DESCRIPTION:
 * Entité pour la gestion des tickets de transport anonymes (tickets de bus)
 * Émission tickets payants et gratuits pour les circuits de transport
 * Un ticket = un trajet (selon circuit choisi)
 * Utilisable une seule fois avec QR code unique
 * Support multi-tenant strict
 *
 * SIMILAIRE À: TicketRepas (architecture identique)
 * DIFFÉRENCES: Lié à TransportRoute au lieu de Restaurant/Menu
 *
 * AUTEUR: Équipe CROU - Module Transport
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
import { IsEnum, IsNumber, IsString, IsOptional, IsBoolean, IsDate, Min } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { TransportRoute } from './TransportRoute.entity';

// Statuts de tickets transport
export enum TicketTransportStatus {
  ACTIF = 'actif',           // Ticket émis, non utilisé
  UTILISE = 'utilise',       // Ticket utilisé (trajet effectué)
  EXPIRE = 'expire',         // Ticket expiré (date dépassée)
  ANNULE = 'annule'          // Ticket annulé (remboursement ou erreur)
}

// Catégories de tickets transport (ANONYME - comme restauration)
export enum CategorieTicketTransport {
  PAYANT = 'payant',     // Ticket payant (avec tarif)
  GRATUIT = 'gratuit'    // Ticket gratuit (0 F)
}

@Entity('tickets_transport')
@Index(['tenantId', 'numeroTicket'])   // Index pour recherche rapide
@Index(['qrCode'])                     // Index pour scan QR
@Index(['status', 'dateExpiration'])   // Index pour expiration
@Index(['circuitId', 'dateVoyage'])    // Index pour recherche par circuit + date
@Index(['categorie'])                  // Index pour stats par catégorie
@Index(['annee'])                      // Index pour stats annuelles
export class TicketTransport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant (OBLIGATOIRE)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // ========================================
  // INFORMATIONS TICKET ANONYME
  // ========================================

  @Column({ type: 'varchar', length: 50, unique: true, name: 'numero_ticket' })
  @IsString()
  numeroTicket: string; // Format: TKT-TRANS-2025-001234

  @Column({ type: 'enum', enum: CategorieTicketTransport })
  @IsEnum(CategorieTicketTransport)
  categorie: CategorieTicketTransport; // PAYANT ou GRATUIT

  @Column({ type: 'integer', default: 2025 })
  @IsNumber()
  @Min(2020)
  annee: number; // Année d'émission

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsNumber()
  @Min(0)
  tarif: number; // Montant du ticket en FCFA (0 si gratuit)

  // ========================================
  // QR CODE ET IDENTIFICATION
  // ========================================

  @Column({ type: 'varchar', length: 255, unique: true, name: 'qr_code' })
  @IsString()
  qrCode: string; // QR code unique (format: QR-TRANS-[TENANT_PREFIX]-[HASH])

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'message_indication' })
  @IsOptional()
  @IsString()
  messageIndication: string; // Message affiché sur le ticket (ex: "Bon voyage!")

  // ========================================
  // CIRCUIT DE TRANSPORT
  // ========================================

  @Column({ type: 'uuid', name: 'circuit_id' })
  circuitId: string; // Circuit de transport (ex: Centre → Campus)

  @ManyToOne(() => TransportRoute, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'circuit_id' })
  circuit: TransportRoute;

  // ========================================
  // VALIDITÉ
  // ========================================

  @Column({ type: 'date', name: 'date_emission' })
  @IsDate()
  dateEmission: Date; // Date d'émission du ticket

  @Column({ type: 'date', name: 'date_voyage' })
  @IsDate()
  dateVoyage: Date; // Date du voyage prévu

  @Column({ type: 'date', name: 'date_expiration' })
  @IsDate()
  dateExpiration: Date; // Date d'expiration du ticket

  @Column({ type: 'enum', enum: TicketTransportStatus, default: TicketTransportStatus.ACTIF })
  @IsEnum(TicketTransportStatus)
  status: TicketTransportStatus; // Statut du ticket

  @Column({ type: 'boolean', default: false, name: 'est_utilise' })
  @IsBoolean()
  estUtilise: boolean; // Ticket utilisé (trajet effectué)

  @Column({ type: 'timestamp', nullable: true, name: 'date_utilisation' })
  @IsOptional()
  @IsDate()
  dateUtilisation: Date; // Date d'utilisation effective

  // ========================================
  // UTILISATION (Trajet effectué)
  // ========================================

  @Column({ type: 'uuid', nullable: true, name: 'trajet_id' })
  @IsOptional()
  @IsString()
  trajetId: string; // ID du trajet effectué (lien avec ScheduledTrip si existe)

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'vehicule_immatriculation' })
  @IsOptional()
  @IsString()
  vehiculeImmatriculation: string; // Immatriculation du véhicule utilisé

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'conducteur' })
  @IsOptional()
  @IsString()
  conducteur: string; // Nom du conducteur

  // ========================================
  // PAIEMENT (si PAYANT)
  // ========================================

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'methode_paiement' })
  @IsOptional()
  @IsString()
  methodePaiement: string; // ESPECES, CARTE, MOBILE_MONEY, VIREMENT

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'reference_paiement' })
  @IsOptional()
  @IsString()
  referencePaiement: string; // Référence de paiement

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true, name: 'montant_rembourse' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  montantRembourse: number; // Montant remboursé (si annulé)

  // ========================================
  // AUDIT & TRAÇABILITÉ
  // ========================================

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'valide_par' })
  @IsOptional()
  @IsString()
  validePar: string; // Utilisateur ayant validé (scan)

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'annule_par' })
  @IsOptional()
  @IsString()
  annulePar: string; // Utilisateur ayant annulé

  @Column({ type: 'text', nullable: true, name: 'motif_annulation' })
  @IsOptional()
  @IsString()
  motifAnnulation: string; // Motif d'annulation

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes: string; // Notes internes

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Métadonnées additionnelles

  // ========================================
  // TIMESTAMPS
  // ========================================

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

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  /**
   * Vérifier si le ticket est valide pour utilisation
   */
  isValid(): boolean {
    return (
      this.status === TicketTransportStatus.ACTIF &&
      !this.estUtilise &&
      new Date() <= new Date(this.dateExpiration)
    );
  }

  /**
   * Vérifier si le ticket est expiré
   */
  isExpired(): boolean {
    return new Date() > new Date(this.dateExpiration);
  }

  /**
   * Obtenir le label de la catégorie
   */
  getCategorieLabel(): string {
    return this.categorie === CategorieTicketTransport.PAYANT ? 'Payant' : 'Gratuit';
  }

  /**
   * Obtenir le label du statut
   */
  getStatusLabel(): string {
    const labels = {
      [TicketTransportStatus.ACTIF]: 'Actif',
      [TicketTransportStatus.UTILISE]: 'Utilisé',
      [TicketTransportStatus.EXPIRE]: 'Expiré',
      [TicketTransportStatus.ANNULE]: 'Annulé'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Formater le numéro de ticket pour affichage
   */
  formatNumeroTicket(): string {
    return this.numeroTicket.replace('TKT-TRANS-', '');
  }

  /**
   * Obtenir le coût réel (tarif ou 0 si gratuit)
   */
  getCout(): number {
    return this.categorie === CategorieTicketTransport.GRATUIT ? 0 : Number(this.tarif);
  }

  /**
   * Vérifier si le ticket peut être annulé
   */
  canBeCancelled(): boolean {
    return (
      this.status === TicketTransportStatus.ACTIF &&
      !this.estUtilise
    );
  }

  /**
   * Obtenir une description courte
   */
  getShortDescription(): string {
    return `${this.numeroTicket} - ${this.getCategorieLabel()} - ${this.tarif} FCFA`;
  }
}
