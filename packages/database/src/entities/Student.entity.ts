/**
 * FICHIER: packages\database\src\entities\Student.entity.ts
 * ENTITÃ‰: Student - Gestion des Ã©tudiants
 *
 * DESCRIPTION:
 * EntitÃ© pour gÃ©rer les informations des Ã©tudiants
 * Centralise toutes les donnÃ©es Ã©tudiants du systÃ¨me
 * Support pour les demandes de logement et renouvellements
 *
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU)
 * - OneToMany avec HousingOccupancy (occupations historiques)
 * - OneToMany avec HousingRequest (demandes de logement)
 * - OneToMany avec RenewalRequest (demandes de renouvellement)
 *
 * NIVEAUX ACADÃ‰MIQUES:
 * - L1, L2, L3 (Licence)
 * - M1, M2 (Master)
 * - D (Doctorat)
 *
 * AUTEUR: Ã‰quipe CROU
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
import { IsEnum, IsBoolean, IsEmail, IsString, IsOptional, Length, Matches } from 'class-validator';

import { Tenant } from './Tenant.entity';
import { HousingRequest } from './HousingRequest.entity';
import { RenewalRequest } from './RenewalRequest.entity';

// Niveaux acadÃ©miques
export enum NiveauAcademique {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  M1 = 'M1',
  M2 = 'M2',
  D = 'D'
}

// Statut de l'Ã©tudiant
export enum StudentStatus {
  ACTIF = 'actif',           // Ã‰tudiant actif
  DIPLOME = 'diplome',       // DiplÃ´mÃ©
  SUSPENDU = 'suspendu',     // Suspension acadÃ©mique
  ABANDONNE = 'abandonne',   // Abandon des Ã©tudes
  TRANSFERE = 'transfere'    // Transfert vers autre universitÃ©
}

@Entity('students')
@Index(['matricule']) // Index unique pour recherche rapide
@Index(['tenantId', 'status']) // Index pour requÃªtes multi-tenant
@Index(['email']) // Index pour recherche par email
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relations
  @Column({ name: 'tenant_id', type: 'uuid' })
  tenantId: string;

  @ManyToOne('Tenant', { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // IdentitÃ©
  @Column({ type: 'varchar', length: 50, unique: true })
  @IsString()
  @Length(3, 50)
  @Matches(/^[A-Z0-9-]+$/, { message: 'Matricule doit contenir uniquement majuscules, chiffres et tirets' })
  matricule: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(2, 255)
  nom: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  @Length(2, 255)
  prenom: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,20}$/, { message: 'NumÃ©ro de tÃ©lÃ©phone invalide' })
  telephone: string;

  @Column({ type: 'date', nullable: true })
  dateNaissance: Date;

  @Column({ type: 'varchar', length: 1 })
  @IsString()
  genre: string; // 'M' ou 'F' (obligatoire pour attribution logement)

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  villeOrigine: string; // Ville d'origine (pour prioritÃ© non-rÃ©sidents)

  @Column({ type: 'varchar', length: 100, nullable: true })
  @IsOptional()
  @IsString()
  villeUniversite: string; // Ville de l'universitÃ© (pour calculer rÃ©sidence)

  // Informations acadÃ©miques
  @Column({ type: 'varchar', length: 255 })
  @IsString()
  universite: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  faculte: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  filiere: string;

  @Column({ type: 'enum', enum: NiveauAcademique })
  @IsEnum(NiveauAcademique)
  niveau: NiveauAcademique;

  @Column({ type: 'varchar', length: 9, nullable: true })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{4}$/, { message: 'Format attendu: YYYY-YYYY (ex: 2024-2025)' })
  anneeUniversitaire: string; // "2024-2025"

  @Column({ type: 'varchar', length: 50, nullable: true })
  @IsOptional()
  @IsString()
  serieBac: string; // SÃ©rie BAC (C, D, E = scientifiques prioritaires, A, G, etc.)

  @Column({ type: 'int', nullable: true })
  @IsOptional()
  anneeBac: number; // AnnÃ©e d'obtention du BAC

  @Column({ type: 'varchar', length: 10, nullable: true })
  @IsOptional()
  @IsString()
  cycleMedecine: string; // Si Ã©tudiant en mÃ©decine: "PCEM", "DCEM", "Internat"

  @Column({ type: 'int', default: 0 })
  anneesLogementCumulees: number; // Nombre d'annÃ©es dÃ©jÃ  logÃ©es (pour limite cycle)

  // Statut et particularitÃ©s
  @Column({ type: 'enum', enum: StudentStatus, default: StudentStatus.ACTIF })
  @IsEnum(StudentStatus)
  status: StudentStatus;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isBoursier: boolean;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isHandicape: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  @IsOptional()
  @IsString()
  noteHandicap: string; // Description du handicap si applicable

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  hasQuittanceInscription: boolean; // A fourni quittance d'inscription (requis nouvelles demandes)

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  quittanceInscriptionUrl: string; // URL du document quittance

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActif: boolean;

  // Relations inversées
  // Note: HousingOccupancy ne contient pas de FK vers Student (données dénormalisées)
  // @OneToMany('HousingOccupancy', 'student')
  // occupations: any[];

  @OneToMany(() => HousingRequest, request => request.student)
  housingRequests: HousingRequest[];

  @OneToMany(() => RenewalRequest, renewal => renewal.student)
  renewalRequests: RenewalRequest[];

  // MÃ©tadonnÃ©es
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

  // MÃ©thodes utilitaires

  /**
   * Retourne le nom complet de l'Ã©tudiant
   */
  getFullName(): string {
    return `${this.prenom} ${this.nom}`;
  }

  /**
   * Retourne le nom complet inversÃ© (NOM PrÃ©nom)
   */
  getFullNameReversed(): string {
    return `${this.nom.toUpperCase()} ${this.prenom}`;
  }

  /**
   * VÃ©rifie si l'Ã©tudiant est actif
   */
  isActive(): boolean {
    return this.status === StudentStatus.ACTIF && this.isActif;
  }

  /**
   * VÃ©rifie si l'Ã©tudiant est Ã©ligible pour une demande de logement
   */
  isEligibleForHousing(): boolean {
    return this.isActive() && this.email !== null && this.telephone !== null;
  }

  /**
   * Retourne le niveau acadÃ©mique numÃ©rique (1-6)
   */
  getNiveauNumeric(): number {
    const niveaux: { [key: string]: number } = {
      'L1': 1, 'L2': 2, 'L3': 3,
      'M1': 4, 'M2': 5, 'D': 6
    };
    return niveaux[this.niveau] || 0;
  }

  /**
   * VÃ©rifie si l'Ã©tudiant a une prioritÃ© pour le logement
   */
  hasPriority(): boolean {
    return this.isBoursier || this.isHandicape;
  }

  /**
   * Retourne la prioritÃ© de l'Ã©tudiant (plus Ã©levÃ© = prioritaire)
   */
  getPriorityLevel(): number {
    let priority = 0;
    if (this.isHandicape) priority += 100; // PrioritÃ© absolue
    if (this.isBoursier) priority += 50;
    return priority;
  }

  /**
   * Retourne l'identifiant display (matricule)
   */
  getDisplayId(): string {
    return this.matricule;
  }

  /**
   * VÃ©rifie si l'Ã©tudiant est en derniÃ¨re annÃ©e (M2 ou D)
   */
  isInFinalYear(): boolean {
    return this.niveau === NiveauAcademique.M2 || this.niveau === NiveauAcademique.D;
  }

  /**
   * Calcule l'anciennetÃ© acadÃ©mique (nombre d'annÃ©es depuis L1)
   */
  getAcademicSeniority(): number {
    return this.getNiveauNumeric();
  }

  /**
   * VÃ©rifie si l'Ã©tudiant a un BAC scientifique (prioritaire)
   */
  hasBacScientifique(): boolean {
    if (!this.serieBac) return false;
    const seriesScientifiques = ['C', 'D', 'E'];
    return seriesScientifiques.includes(this.serieBac.toUpperCase());
  }

  /**
   * VÃ©rifie si l'Ã©tudiant est non-rÃ©sident (prioritaire)
   */
  isNonResident(): boolean {
    if (!this.villeOrigine || !this.villeUniversite) return false;
    return this.villeOrigine.toLowerCase() !== this.villeUniversite.toLowerCase();
  }

  /**
   * Calcule la limite d'annÃ©es de logement selon le cycle
   * Licence: 3 ans, Master: 2 ans, MÃ©decine: 8 ans, Doctorat: 3 ans
   */
  getMaxLogementYears(): number {
    const niveau = this.niveau;

    // MÃ©decine (8 ans)
    if (this.cycleMedecine) {
      return 8;
    }

    // Doctorat (3 ans)
    if (niveau === NiveauAcademique.D) {
      return 3;
    }

    // Master (2 ans: M1 + M2)
    if (niveau === NiveauAcademique.M1 || niveau === NiveauAcademique.M2) {
      return 2;
    }

    // Licence (3 ans: L1 + L2 + L3)
    if (niveau === NiveauAcademique.L1 || niveau === NiveauAcademique.L2 || niveau === NiveauAcademique.L3) {
      return 3;
    }

    return 0;
  }

  /**
   * VÃ©rifie si l'Ã©tudiant a Ã©puisÃ© sa limite d'annÃ©es de logement
   */
  hasExceededMaxLogementYears(): boolean {
    return this.anneesLogementCumulees >= this.getMaxLogementYears();
  }

  /**
   * VÃ©rifie si l'Ã©tudiant est Ã©ligible pour RENOUVELLEMENT
   * CritÃ¨res: pas dÃ©passÃ© limite annÃ©es + loyer payÃ© (vÃ©rifiÃ© ailleurs)
   */
  isEligibleForRenewal(): boolean {
    return this.isActive() && !this.hasExceededMaxLogementYears();
  }

  /**
   * VÃ©rifie si l'Ã©tudiant est Ã©ligible pour NOUVELLE ATTRIBUTION
   * CritÃ¨res: boursier + quittance inscription
   */
  isEligibleForNewAssignment(): boolean {
    return this.isActive() &&
           this.isBoursier &&
           this.hasQuittanceInscription;
  }

  /**
   * Calcule le score de prioritÃ© pour NOUVELLE ATTRIBUTION
   * PrioritÃ©s: BAC scientifique + non-rÃ©sident + handicapÃ© + boursier
   */
  getNewAssignmentPriorityScore(): number {
    let score = 0;

    // HandicapÃ© (prioritÃ© absolue)
    if (this.isHandicape) score += 1000;

    // Boursier (requis, base)
    if (this.isBoursier) score += 500;

    // BAC scientifique
    if (this.hasBacScientifique()) score += 200;

    // Non-rÃ©sident de la ville
    if (this.isNonResident()) score += 100;

    // Bonus anciennetÃ© (plus jeune = prioritaire)
    const niveauScore = 6 - this.getNiveauNumeric(); // L1=5, M2=1
    score += niveauScore * 10;

    return score;
  }

  /**
   * Retourne le cycle d'Ã©tudes (Licence, Master, Doctorat, MÃ©decine)
   */
  getCycle(): string {
    if (this.cycleMedecine) return 'MÃ©decine';
    if (this.niveau === NiveauAcademique.D) return 'Doctorat';
    if (this.niveau === NiveauAcademique.M1 || this.niveau === NiveauAcademique.M2) return 'Master';
    return 'Licence';
  }
}
