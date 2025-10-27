/**
 * FICHIER: apps\api\src\shared\decorators\permissions.decorator.ts
 * DECORATORS: Décorateurs avancés pour les permissions RBAC
 * 
 * DESCRIPTION:
 * Décorateurs TypeScript sophistiqués pour simplifier l'utilisation des permissions
 * Support des conditions dynamiques et validations contextuelles
 * Annotations pour les contrôleurs et méthodes avec métadonnées enrichies
 * 
 * FONCTIONNALITÉS:
 * - Décorateurs de permissions avec conditions
 * - Décorateurs de rôles avec validation
 * - Décorateurs spécialisés par module
 * - Support des permissions multiples
 * - Validation des tenants et contexte
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { logger } from '@/shared/utils/logger';

// Clés de métadonnées
export const PERMISSION_METADATA_KEY = Symbol('permissions');
export const ROLE_METADATA_KEY = Symbol('roles');
export const TENANT_METADATA_KEY = Symbol('tenant');
export const CONDITIONS_METADATA_KEY = Symbol('conditions');

// Interfaces enrichies
export interface PermissionMetadata {
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  contextExtractor?: string; // Nom de la méthode pour extraire le contexte
}

export interface RoleMetadata {
  roles: string[];
  strict?: boolean; // Si true, l'utilisateur doit avoir TOUS les rôles
}

export interface TenantMetadata {
  allowCrossTenant?: boolean;
  extractTenantFrom?: 'params' | 'body' | 'query';
  tenantField?: string;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'in' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists';
  value?: any;
  message?: string;
}

/**
 * Décorateur principal pour exiger une permission avec conditions
 */
export function RequirePermission(
  resource: string, 
  action: string, 
  options?: {
    conditions?: PermissionCondition[];
    contextExtractor?: string;
  }
) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: PermissionMetadata = { 
      resource, 
      action,
      conditions: options?.conditions,
      contextExtractor: options?.contextExtractor
    };
    Reflect.defineMetadata(PERMISSION_METADATA_KEY, metadata, target, propertyKey);
    logger.debug(`Permission requise: ${resource}:${action} sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour exiger plusieurs permissions (OU logique)
 */
export function RequireAnyPermission(...permissions: Array<{resource: string, action: string}>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata = permissions;
    Reflect.defineMetadata(String(PERMISSION_METADATA_KEY) + '_any', metadata, target, propertyKey);
    const permList = permissions.map(p => `${p.resource}:${p.action}`).join(' OR ');
    logger.debug(`Permissions requises (OU): ${permList} sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour exiger plusieurs permissions (ET logique)
 */
export function RequireAllPermissions(...permissions: Array<{resource: string, action: string}>) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata = permissions;
    Reflect.defineMetadata(String(PERMISSION_METADATA_KEY) + '_all', metadata, target, propertyKey);
    const permList = permissions.map(p => `${p.resource}:${p.action}`).join(' AND ');
    logger.debug(`Permissions requises (ET): ${permList} sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour exiger un rôle avec options avancées
 */
export function RequireRole(roles: string | string[], options?: { strict?: boolean }) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const roleArray = Array.isArray(roles) ? roles : [roles];
    const metadata: RoleMetadata = { 
      roles: roleArray,
      strict: options?.strict || false
    };
    Reflect.defineMetadata(ROLE_METADATA_KEY, metadata, target, propertyKey);
    const mode = options?.strict ? 'TOUS' : 'AU MOINS UN';
    logger.debug(`Rôles requis (${mode}): ${roleArray.join(', ')} sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour la gestion des tenants
 */
export function RequireTenant(options?: TenantMetadata) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: TenantMetadata = {
      allowCrossTenant: options?.allowCrossTenant || false,
      extractTenantFrom: options?.extractTenantFrom || 'params',
      tenantField: options?.tenantField || 'tenantId'
    };
    Reflect.defineMetadata(TENANT_METADATA_KEY, metadata, target, propertyKey);
    logger.debug(`Tenant requis sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour les conditions personnalisées
 */
export function RequireConditions(...conditions: PermissionCondition[]) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(CONDITIONS_METADATA_KEY, conditions, target, propertyKey);
    logger.debug(`Conditions requises sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateurs spécialisés par module avec conditions
 */
export const RequireFinancialPermission = (
  action: string, 
  conditions?: PermissionCondition[]
) => RequirePermission('financial', action, { conditions });

export const RequireStocksPermission = (
  action: string, 
  conditions?: PermissionCondition[]
) => RequirePermission('stocks', action, { conditions });

export const RequireHousingPermission = (
  action: string, 
  conditions?: PermissionCondition[]
) => RequirePermission('housing', action, { conditions });

export const RequireTransportPermission = (
  action: string, 
  conditions?: PermissionCondition[]
) => RequirePermission('transport', action, { conditions });

export const RequireAdminPermission = (
  action: string, 
  conditions?: PermissionCondition[]
) => RequirePermission('admin', action, { conditions });

/**
 * Décorateurs pour les opérations financières avec montants
 */
export const RequireFinancialApproval = (maxAmount: number) => 
  RequireFinancialPermission('validate', [
    {
      field: 'amount',
      operator: 'lte',
      value: maxAmount,
      message: `Montant supérieur à ${maxAmount} FCFA nécessite une approbation supérieure`
    }
  ]);

/**
 * Décorateurs pour les opérations cross-tenant
 */
export const RequireCrossTenantAccess = () => 
  RequireRole(['ministre', 'directeur_finances'], { strict: false });

/**
 * Décorateur pour les opérations sensibles
 */
export const RequireSensitiveOperation = () => 
  RequireAllPermissions(
    { resource: 'admin', action: 'write' },
    { resource: 'audit', action: 'read' }
  );

/**
 * Utilitaires pour récupérer les métadonnées
 */
export function getPermissionMetadata(target: any, propertyKey: string): PermissionMetadata | undefined {
  return Reflect.getMetadata(PERMISSION_METADATA_KEY, target, propertyKey);
}

export function getRoleMetadata(target: any, propertyKey: string): RoleMetadata | undefined {
  return Reflect.getMetadata(ROLE_METADATA_KEY, target, propertyKey);
}

export function getTenantMetadata(target: any, propertyKey: string): TenantMetadata | undefined {
  return Reflect.getMetadata(TENANT_METADATA_KEY, target, propertyKey);
}

export function getConditionsMetadata(target: any, propertyKey: string): PermissionCondition[] | undefined {
  return Reflect.getMetadata(CONDITIONS_METADATA_KEY, target, propertyKey);
}

/**
 * Middleware pour traiter les décorateurs de permissions
 */
export function processPermissionDecorators(target: any, propertyKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Récupérer toutes les métadonnées
      const permissionMeta = getPermissionMetadata(target, propertyKey);
      const roleMeta = getRoleMetadata(target, propertyKey);
      const tenantMeta = getTenantMetadata(target, propertyKey);
      const conditionsMeta = getConditionsMetadata(target, propertyKey);

      // Vérifier l'authentification
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      // Traitement des métadonnées...
      // (Cette logique sera intégrée avec le service RBAC)
      
      next();
    } catch (error) {
      logger.error('Erreur dans le traitement des décorateurs:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
}