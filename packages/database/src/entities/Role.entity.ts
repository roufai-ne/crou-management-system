/**
 * FICHIER: packages\database\src\entities\Role.entity.ts
 * ENTITÉ: Role - Rôles du système RBAC CROU
 * 
 * DESCRIPTION:
 * Entité pour la gestion des rôles dans le système RBAC
 * Support des rôles ministériels et CROU avec permissions granulaires
 * Liaison avec les permissions via table de jointure
 * 
 * RELATIONS:
 * - OneToMany avec User (utilisateurs ayant ce rôle)
 * - ManyToMany avec Permission (permissions du rôle)
 * 
 * TYPES DE RÔLES:
 * - Ministère: ministre, directeur_finances, resp_appro, controleur
 * - CROU: directeur, secretaire, chef_financier, comptable, intendant,
 *         magasinier, chef_transport, chef_logement, chef_restauration
 * - Système: rôles prédéfinis non modifiables
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany,
  ManyToMany,
  JoinTable,
  CreateDateColumn, 
  UpdateDateColumn
} from 'typeorm';
import { IsString, IsEnum, IsBoolean, IsOptional, Length } from 'class-validator';

import { User } from './User.entity';
import { Permission } from './Permission.entity';

// Types de tenants pour les rôles
export enum RoleTenantType {
  MINISTERE = 'ministere',
  CROU = 'crou',
  BOTH = 'both'
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  @IsString()
  @Length(2, 100, { message: 'Le nom du rôle doit contenir entre 2 et 100 caractères' })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'La description ne peut pas dépasser 255 caractères' })
  description: string | null;

  @Column({ type: 'enum', enum: RoleTenantType, default: RoleTenantType.CROU })
  @IsEnum(RoleTenantType)
  tenantType: RoleTenantType;

  @Column({ type: 'boolean', default: false })
  @IsBoolean()
  isSystemRole: boolean;

  @Column({ type: 'boolean', default: true })
  @IsBoolean()
  isActive: boolean;

  // Relations
  @OneToMany(() => User, user => user.role)
  users: User[];

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
    eager: false
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id'
    }
  })
  permissions: Permission[];

  // Audit trail
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  createdBy: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  updatedBy: string | null;

  // Méthodes utilitaires
  
  /**
   * Vérifier si le rôle a une permission spécifique
   */
  hasPermission(resource: string, action: string): boolean {
    if (!this.permissions) return false;
    
    return this.permissions.some(permission => 
      permission.resource === resource && 
      permission.actions.includes(action)
    );
  }

  /**
   * Obtenir toutes les actions autorisées pour une ressource
   */
  getActionsForResource(resource: string): string[] {
    if (!this.permissions) return [];
    
    const permission = this.permissions.find(p => p.resource === resource);
    return permission ? permission.actions : [];
  }

  /**
   * Vérifier si le rôle est compatible avec un type de tenant
   */
  isCompatibleWithTenant(tenantType: 'ministere' | 'crou'): boolean {
    return this.tenantType === 'both' || this.tenantType === tenantType;
  }

  /**
   * Obtenir le nombre d'utilisateurs ayant ce rôle
   */
  getUserCount(): number {
    return this.users ? this.users.length : 0;
  }
}