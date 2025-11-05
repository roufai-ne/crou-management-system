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
   */
  hasPermission(resource: string, action: string): boolean {
    // Vérifier que l'utilisateur a un rôle et des permissions
    if (!this.role || !this.role.permissions) {
      return false;
    }

    // Chercher la permission correspondante
    return this.role.permissions.some((permission: any) => {
      const permResource = permission.resource || permission.name?.split(':')[0];

      // Permission.actions est un ARRAY ["read", "write", "validate"]
      let permActions: string[] = [];

      if (Array.isArray(permission.actions)) {
        permActions = permission.actions;
      } else if (permission.action) {
        // Fallback pour format legacy
        permActions = [permission.action];
      } else if (permission.name?.includes(':')) {
        // Extraire de "resource:action"
        permActions = [permission.name.split(':')[1]];
      }

      // Vérifier chaque action dans le tableau
      for (const permAction of permActions) {
        // Correspondance exacte
        if (permResource === resource && permAction === action) {
          return true;
        }

        // Wildcards
        if (permResource === resource && permAction === '*') {
          return true;
        }

        if (permResource === '*' && permAction === action) {
          return true;
        }

        if (permResource === '*' && permAction === '*') {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Obtenir toutes les permissions de l'utilisateur
   */
  getAllPermissions(): string[] {
    if (!this.role || !this.role.permissions) {
      return [];
    }

    const permissionStrings: string[] = [];

    for (const permission of this.role.permissions) {
      const resource = permission.resource || permission.name?.split(':')[0] || '';

      // Permission.actions est un ARRAY ["read", "write", "validate"]
      // Il faut créer une permission string par action
      if (Array.isArray(permission.actions) && permission.actions.length > 0) {
        for (const action of permission.actions) {
          permissionStrings.push(`${resource}:${action}`);
        }
      } else {
        // Fallback pour les permissions au format "resource:action" (legacy)
        const action = permission.action || permission.name?.split(':')[1] || '';
        permissionStrings.push(`${resource}:${action}`);
      }
    }

    return permissionStrings;
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