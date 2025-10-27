/**
 * FICHIER: packages/database/src/entities/Role.simple.entity.ts
 * ENTITÉ: Role - Version simplifiée sans relations ManyToMany
 * 
 * DESCRIPTION:
 * Version temporaire de Role sans les relations complexes
 * Pour résoudre les problèmes de métadonnées TypeORM
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany,
  CreateDateColumn, 
  UpdateDateColumn
} from 'typeorm';
import { IsString, IsEnum, IsBoolean, IsOptional, Length } from 'class-validator';

import { User } from './User.entity';

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

  // Relations - Seulement OneToMany avec User
  @OneToMany(() => User, user => user.role)
  users: User[];

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

  // Méthodes utilitaires simplifiées
  
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