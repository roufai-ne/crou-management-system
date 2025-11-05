/**
 * FICHIER: packages\database\src\entities\User.entity.ts
 * ENTITÉ: User - Utilisateurs du système CROU
 * 
 * DESCRIPTION:
 * Entité principale pour les 9 profils utilisateurs CROU/Ministère
 * Gestion multi-tenant avec tenant_id
 * Champs sécurisés avec hachage password bcrypt
 * Audit trail intégré (created_at, updated_at)
 * 
 * RELATIONS:
 * - ManyToOne avec Tenant (CROU ou Ministère)
 * - OneToMany avec AuditLog (traçabilité)
 * 
 * PROFILS SUPPORTÉS:
 * - Ministère: ministre, directeur_finances, resp_appro, controleur
 * - CROU: directeur, secretaire, chef_financier, comptable, intendant,
 *         magasinier, chef_transport, chef_logement, chef_restauration
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany,
  CreateDateColumn, 
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  JoinColumn
} from 'typeorm';
import { Exclude, Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsString, MinLength, IsOptional } from 'class-validator';
import bcrypt from 'bcryptjs';

import { Tenant } from './Tenant.entity';
// import { AuditLog } from './AuditLog.entity'; // Temporairement désactivé
import { Role } from './Role.entity';

// Types des rôles utilisateurs selon PRD
export enum UserRole {
  // Niveau Ministère
  MINISTRE = 'ministre',
  DIRECTEUR_FINANCES = 'directeur_finances', 
  RESP_APPRO = 'resp_appro',
  CONTROLEUR = 'controleur',
  
  // Niveau CROU
  DIRECTEUR = 'directeur',
  SECRETAIRE = 'secretaire', 
  CHEF_FINANCIER = 'chef_financier',
  COMPTABLE = 'comptable',
  INTENDANT = 'intendant',
  MAGASINIER = 'magasinier',
  CHEF_TRANSPORT = 'chef_transport',
  CHEF_LOGEMENT = 'chef_logement', 
  CHEF_RESTAURATION = 'chef_restauration'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING = 'pending'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  @IsEmail({}, { message: 'Format email invalide' })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  @Exclude({ toPlainOnly: true }) // Exclure du JSON de sortie
  @IsString()
  @MinLength(6, { message: 'Mot de passe minimum 6 caractères' })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  @IsString()
  name: string;

  // Nom et prénom séparés (pour compatibilité API)
  @Column({ type: 'varchar', length: 100, nullable: true, name: 'first_name' })
  @IsString()
  @IsOptional()
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'last_name' })
  @IsString()
  @IsOptional()
  lastName: string;

  // Statut actif/inactif (pour compatibilité API)
  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive: boolean;

  // Relation avec le rôle RBAC
  @Column({ type: 'uuid', name: 'role_id' })
  roleId: string;

  @ManyToOne(() => Role, role => role.users, {
    onDelete: 'RESTRICT',
    eager: false
  })
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  @IsEnum(UserStatus)
  status: UserStatus;

  // Relation avec tenant (CROU ou Ministère)
  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => Tenant, tenant => tenant.users, {
    onDelete: 'CASCADE',
    eager: true
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  // Informations complémentaires
  @Column({ type: 'varchar', length: 20, nullable: true })
  @IsOptional()
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  avatar: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  department: string;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date | null;

  @Column({ type: 'inet', nullable: true })
  lastLoginIp: string;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number;

  @Column({ type: 'timestamp', nullable: true })
  lockedUntil: Date | null;

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  createdBy: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  updatedBy: string;

  // Relations - Temporairement désactivée pour debug
  // @OneToMany(() => AuditLog, auditLog => auditLog.user)
  // auditLogs: AuditLog[];

  // Méthodes de hachage du mot de passe
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2a$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  // Méthode de vérification du mot de passe
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  // Méthode pour vérifier si le compte est verrouillé
  isLocked(): boolean {
    return !!(this.lockedUntil && this.lockedUntil > new Date());
  }

  // Méthode pour incrémenter les tentatives de connexion
  incLoginAttempts(): void {
    this.loginAttempts += 1;
    
    // Verrouiller le compte après 5 tentatives
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    }
  }

  // Réinitialiser les tentatives après connexion réussie
  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = null;
    this.lastLoginAt = new Date();
  }

  // Méthodes RBAC

  /**
   * Vérifier si l'utilisateur a une permission spécifique
   * TODO: Réimplémenter avec le système RBAC complet
   */
  hasPermission(resource: string, action: string): boolean {
    // Version simplifiée temporaire
    return true; // TODO: Implémenter la logique RBAC
  }

  /**
   * Obtenir toutes les permissions de l'utilisateur
   * TODO: Réimplémenter avec le système RBAC complet
   */
  getAllPermissions(): string[] {
    // Version simplifiée temporaire
    return []; // TODO: Implémenter la logique RBAC
  }

  /**
   * Vérifier si l'utilisateur peut accéder à un tenant spécifique
   */
  canAccessTenant(targetTenantId: string): boolean {
    // L'utilisateur peut toujours accéder à son propre tenant
    if (this.tenantId === targetTenantId) return true;
    
    // Les utilisateurs du ministère peuvent accéder à tous les tenants
    if (this.tenant?.type === 'ministere') return true;
    
    return false;
  }

  /**
   * Obtenir le nom du rôle
   */
  getRoleName(): string {
    return this.role?.name || 'Aucun rôle';
  }

  /**
   * Vérifier si l'utilisateur est administrateur
   */
  isAdmin(): boolean {
    return this.hasPermission('admin', 'read') || this.hasPermission('users', 'write');
  }

  // Transformer pour la sérialisation JSON
  @Transform(({ value }) => value?.id)
  get tenantInfo() {
    return {
      id: this.tenant?.id,
      name: this.tenant?.name,
      type: this.tenant?.type
    };
  }

  @Transform(({ value }) => value?.id)
  get roleInfo() {
    return {
      id: this.role?.id,
      name: this.role?.name,
      tenantType: this.role?.tenantType
    };
  }
}