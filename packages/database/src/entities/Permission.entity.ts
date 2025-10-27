/**
 * FICHIER: packages\database\src\entities\Permission.entity.ts
 * ENTITÉ: Permission - Permissions granulaires du système RBAC CROU
 * 
 * DESCRIPTION:
 * Entité pour la gestion des permissions granulaires dans le système RBAC
 * Définit les actions autorisées sur les ressources du système
 * Support des conditions dynamiques pour permissions contextuelles
 * 
 * RELATIONS:
 * - ManyToMany avec Role (rôles ayant cette permission)
 * 
 * RESSOURCES SUPPORTÉES:
 * - dashboard: Tableaux de bord
 * - financial: Module financier
 * - stocks: Gestion des stocks
 * - housing: Module logement
 * - transport: Module transport
 * - reports: Rapports et exports
 * - admin: Administration système
 * - users: Gestion des utilisateurs
 * 
 * ACTIONS SUPPORTÉES:
 * - read: Lecture des données
 * - write: Écriture/modification des données
 * - validate: Validation des opérations
 * - delete: Suppression des données
 * - export: Export des données
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToMany,
  CreateDateColumn, 
  UpdateDateColumn
} from 'typeorm';
import { IsString, IsArray, IsOptional, Length, IsIn } from 'class-validator';

// Import différé pour éviter les imports circulaires

// Actions possibles sur les ressources
export enum PermissionAction {
  READ = 'read',
  WRITE = 'write',
  VALIDATE = 'validate',
  DELETE = 'delete',
  EXPORT = 'export'
}

// Ressources du système
export enum PermissionResource {
  DASHBOARD = 'dashboard',
  FINANCIAL = 'financial',
  STOCKS = 'stocks',
  HOUSING = 'housing',
  TRANSPORT = 'transport',
  REPORTS = 'reports',
  ADMIN = 'admin',
  USERS = 'users',
  TENANTS = 'tenants',
  AUDIT = 'audit'
}

// Interface pour les conditions de permissions
export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains';
  value: any;
}

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  @IsString()
  @IsIn(Object.values(PermissionResource))
  @Length(2, 50, { message: 'La ressource doit contenir entre 2 et 50 caractères' })
  resource: string;

  @Column({ type: 'json' })
  @IsArray()
  actions: string[];

  @Column({ type: 'varchar', length: 255, nullable: true })
  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'La description ne peut pas dépasser 255 caractères' })
  description: string | null;

  @Column({ type: 'json', nullable: true })
  @IsOptional()
  conditions: PermissionCondition[] | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Relations - Utilisation de fonction pour éviter les imports circulaires
  @ManyToMany(() => require('./Role.entity').Role, (role: any) => role.permissions)
  roles: any[];

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
   * Vérifier si la permission autorise une action spécifique
   */
  allowsAction(action: string): boolean {
    return this.actions.includes(action);
  }

  /**
   * Vérifier si la permission a des conditions
   */
  hasConditions(): boolean {
    return this.conditions !== null && this.conditions.length > 0;
  }

  /**
   * Évaluer les conditions de la permission
   */
  evaluateConditions(context: Record<string, any>): boolean {
    if (!this.hasConditions()) {
      return true; // Pas de conditions = toujours autorisé
    }

    return this.conditions!.every(condition => {
      const contextValue = context[condition.field];
      
      switch (condition.operator) {
        case 'eq':
          return contextValue === condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'gt':
          return contextValue > condition.value;
        case 'lt':
          return contextValue < condition.value;
        case 'gte':
          return contextValue >= condition.value;
        case 'lte':
          return contextValue <= condition.value;
        case 'contains':
          return typeof contextValue === 'string' && contextValue.includes(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Obtenir une représentation lisible de la permission
   */
  getDisplayName(): string {
    const actionsStr = this.actions.join(', ');
    return `${this.resource}:${actionsStr}`;
  }

  /**
   * Vérifier si la permission est équivalente à une autre
   */
  isEquivalentTo(other: Permission): boolean {
    return (
      this.resource === other.resource &&
      this.actions.length === other.actions.length &&
      this.actions.every(action => other.actions.includes(action))
    );
  }

  /**
   * Créer une permission à partir d'une chaîne de caractères
   * Format: "resource:action1,action2"
   */
  static fromString(permissionString: string): Partial<Permission> {
    const [resource, actionsStr] = permissionString.split(':');
    const actions = actionsStr ? actionsStr.split(',').map(a => a.trim()) : [];
    
    return {
      resource: resource.trim(),
      actions,
      description: `Permission ${resource} avec actions: ${actions.join(', ')}`
    };
  }

  /**
   * Valider que les actions sont valides
   */
  validateActions(): boolean {
    const validActions = Object.values(PermissionAction);
    return this.actions.every(action => validActions.includes(action as PermissionAction));
  }
}