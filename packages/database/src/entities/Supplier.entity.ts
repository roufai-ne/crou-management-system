/**
 * FICHIER: packages/database/src/entities/Supplier.entity.ts
 * ENTITÉ: Supplier - Gestion des fournisseurs
 *
 * DESCRIPTION:
 * Entité pour la gestion des fournisseurs de produits et services
 * Support multi-tenant avec tenant_id
 * Gestion des contacts, adresses et historique
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec Stock (produits fournis)
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
import { IsEmail, IsPhoneNumber, IsString, IsOptional, IsBoolean } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { Stock } from './Stock.entity';

export enum SupplierType {
  FOURNISSEUR = 'fournisseur',           // Fournisseur de produits
  PRESTATAIRE = 'prestataire',           // Prestataire de services
  FABRICANT = 'fabricant',               // Fabricant
  DISTRIBUTEUR = 'distributeur',         // Distributeur
  GROSSISTE = 'grossiste',               // Grossiste
  IMPORTATEUR = 'importateur'            // Importateur
}

export enum SupplierStatus {
  ACTIF = 'actif',                       // Actif
  INACTIF = 'inactif',                   // Inactif
  SUSPENDU = 'suspendu',                 // Suspendu
  BLOQUE = 'bloque'                      // Bloqué
}

@Entity('suppliers')
@Index(['tenantId', 'code']) // Index pour recherche
@Index(['tenantId', 'status']) // Index pour filtres
@Index(['email']) // Index pour email
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relation avec tenant
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations de base
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  code: string; // Code fournisseur unique

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  nom: string; // Nom ou raison sociale

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  nomCommercial: string; // Nom commercial

  @Column({ type: 'enum', enum: SupplierType })
  type: SupplierType;

  @Column({ type: 'enum', enum: SupplierStatus, default: SupplierStatus.ACTIF })
  status: SupplierStatus;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description: string; // Description

  // Identification légale
  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  numeroSIRET: string; // Numéro SIRET / équivalent

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  numeroTVA: string; // Numéro de TVA intracommunautaire

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  registreCommerce: string; // Numéro registre commerce

  // Coordonnées
  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  adresse: string; // Adresse complète

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  ville: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  region: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  pays: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  codePostal: string;

  // Contacts
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  telephone: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  fax: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  siteWeb: string;

  // Contacts principaux
  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  contactPrincipal: string; // Nom du contact

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  emailContact: string; // Email du contact

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  telephoneContact: string; // Téléphone du contact

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  fonctionContact: string; // Fonction du contact

  // Informations financières
  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  iban: string; // IBAN pour paiements

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  bic: string; // Code BIC/SWIFT

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  banque: string; // Nom de la banque

  @Column({ type: 'int', default: 30 })
  delaiPaiement: number; // Délai de paiement en jours

  @Column({ type: 'varchar', length: 3, default: 'XOF' })
  @IsString()
  devise: string; // Devise (FCFA par défaut)

  // Produits/Services fournis
  @Column({ type: 'jsonb', nullable: true })
  categoriesProduits: string[]; // Catégories de produits fournis

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  produitsServices: string; // Description des produits/services

  // Conditions commerciales
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, default: 0 })
  tauxRemise: number; // Taux de remise en %

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  montantMinCommande: number; // Montant minimum de commande

  @Column({ type: 'int', nullable: true })
  delaiLivraison: number; // Délai de livraison en jours

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  conditionsParticulieres: string; // Conditions particulières

  // Évaluation
  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  noteQualite: number; // Note qualité (0-5)

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  noteDelai: number; // Note respect délais (0-5)

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  notePrix: number; // Note compétitivité prix (0-5)

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  noteMoyenne: number; // Note moyenne (0-5)

  @Column({ type: 'int', default: 0 })
  nombreCommandes: number; // Nombre de commandes

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  montantTotalCommandes: number; // Montant total des commandes

  // Dates importantes
  @Column({ type: 'date', nullable: true })
  datePremiereCommande: Date; // Date première commande

  @Column({ type: 'date', nullable: true })
  dateDerniereCommande: Date; // Date dernière commande

  // Configuration
  @Column({ type: 'boolean', default: true })
  isActif: boolean; // Fournisseur actif

  @Column({ type: 'boolean', default: false })
  isPreference: boolean; // Fournisseur préféré

  @Column({ type: 'boolean', default: false })
  isCertifie: boolean; // Fournisseur certifié

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  certifications: string; // Certifications (ISO, etc.)

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
  @OneToMany(() => Stock, stock => stock.supplier)
  stocks: Stock[];

  /**
   * Calculer la note moyenne
   */
  calculateAverageRating(): number {
    const ratings = [this.noteQualite, this.noteDelai, this.notePrix].filter(r => r !== null && r !== undefined);
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r, 0);
    return Math.round((sum / ratings.length) * 100) / 100;
  }

  /**
   * Vérifier si le fournisseur est actif
   */
  isActive(): boolean {
    return this.status === SupplierStatus.ACTIF && this.isActif;
  }

  /**
   * Obtenir le type formaté
   */
  getTypeLabel(): string {
    const labels = {
      [SupplierType.FOURNISSEUR]: 'Fournisseur',
      [SupplierType.PRESTATAIRE]: 'Prestataire',
      [SupplierType.FABRICANT]: 'Fabricant',
      [SupplierType.DISTRIBUTEUR]: 'Distributeur',
      [SupplierType.GROSSISTE]: 'Grossiste',
      [SupplierType.IMPORTATEUR]: 'Importateur'
    };
    return labels[this.type] || 'Inconnu';
  }

  /**
   * Obtenir le statut formaté
   */
  getStatusLabel(): string {
    const labels = {
      [SupplierStatus.ACTIF]: 'Actif',
      [SupplierStatus.INACTIF]: 'Inactif',
      [SupplierStatus.SUSPENDU]: 'Suspendu',
      [SupplierStatus.BLOQUE]: 'Bloqué'
    };
    return labels[this.status] || 'Inconnu';
  }

  /**
   * Obtenir la description complète
   */
  getDescription(): string {
    return `${this.nom} (${this.code}) - ${this.getTypeLabel()}`;
  }
}
