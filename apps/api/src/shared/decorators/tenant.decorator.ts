/**
 * FICHIER: apps\api\src\shared\decorators\tenant.decorator.ts
 * DECORATORS: Décorateurs pour l'isolation multi-tenant
 * 
 * DESCRIPTION:
 * Décorateurs TypeScript pour simplifier l'utilisation de l'isolation multi-tenant
 * Injection automatique du contexte tenant
 * Validation des accès cross-tenant
 * 
 * FONCTIONNALITÉS:
 * - @TenantIsolated - Isolation automatique par tenant
 * - @AllowCrossTenant - Autoriser l'accès cross-tenant
 * - @RequireTenantRole - Rôle requis pour l'accès
 * - @InjectTenantContext - Injection du contexte tenant
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import 'reflect-metadata';
import { Request, Response, NextFunction } from 'express';
import { MultiTenantService, TenantAccessRule } from '@/shared/services/multi-tenant.service';
import { logger } from '@/shared/utils/logger';

// Clés de métadonnées
export const TENANT_ISOLATION_KEY = Symbol('tenant_isolation');
export const CROSS_TENANT_KEY = Symbol('cross_tenant');
export const TENANT_ROLE_KEY = Symbol('tenant_role');

// Interfaces
export interface TenantIsolationMetadata {
  enabled: boolean;
  strictMode?: boolean;
  bypassForRoles?: string[];
}

export interface CrossTenantMetadata {
  allowed: boolean;
  restrictedTenants?: string[];
  requiredRole?: string;
}

const multiTenantService = new MultiTenantService();

/**
 * Décorateur pour activer l'isolation tenant automatique
 */
export function TenantIsolated(options?: {
  strictMode?: boolean;
  bypassForRoles?: string[];
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: TenantIsolationMetadata = {
      enabled: true,
      strictMode: options?.strictMode || false,
      bypassForRoles: options?.bypassForRoles || []
    };
    
    Reflect.defineMetadata(TENANT_ISOLATION_KEY, metadata, target, propertyKey);
    logger.debug(`Isolation tenant activée sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour autoriser l'accès cross-tenant
 */
export function AllowCrossTenant(options?: {
  restrictedTenants?: string[];
  requiredRole?: string;
}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const metadata: CrossTenantMetadata = {
      allowed: true,
      restrictedTenants: options?.restrictedTenants,
      requiredRole: options?.requiredRole
    };
    
    Reflect.defineMetadata(CROSS_TENANT_KEY, metadata, target, propertyKey);
    logger.debug(`Accès cross-tenant autorisé sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour exiger un rôle spécifique pour l'accès tenant
 */
export function RequireTenantRole(role: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    Reflect.defineMetadata(TENANT_ROLE_KEY, role, target, propertyKey);
    logger.debug(`Rôle tenant requis: ${role} sur ${target.constructor.name}.${propertyKey}`);
  };
}

/**
 * Décorateur pour injecter le contexte tenant dans la méthode
 */
export function InjectTenantContext(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function (...args: any[]) {
    const req = args.find(arg => arg && arg.user) as Request;
    
    if (req && req.user) {
      const tenantContext = await multiTenantService.getTenantContext(req.user.id);
      
      if (tenantContext) {
        // Ajouter le contexte tenant à la requête
        (req as any).tenantContext = tenantContext;
      }
    }
    
    return originalMethod.apply(this, args);
  };
  
  logger.debug(`Injection contexte tenant sur ${target.constructor.name}.${propertyKey}`);
}

/**
 * Middleware pour traiter les décorateurs tenant
 */
export function processTenantDecorators(target: any, propertyKey: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérifier l'authentification
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise pour l\'accès tenant'
        });
      }

      // Récupérer le contexte tenant
      const tenantContext = await multiTenantService.getTenantContext(req.user.id);
      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant de l\'utilisateur'
        });
      }

      // Ajouter le contexte à la requête
      (req as any).tenantContext = tenantContext;

      // Récupérer les métadonnées
      const isolationMeta = Reflect.getMetadata(TENANT_ISOLATION_KEY, target, propertyKey) as TenantIsolationMetadata;
      const crossTenantMeta = Reflect.getMetadata(CROSS_TENANT_KEY, target, propertyKey) as CrossTenantMetadata;
      const requiredRole = Reflect.getMetadata(TENANT_ROLE_KEY, target, propertyKey) as string;

      // Vérifier le rôle requis
      if (requiredRole && tenantContext.userRole !== requiredRole) {
        return res.status(403).json({
          error: 'Rôle insuffisant',
          message: `Rôle ${requiredRole} requis pour cette opération`
        });
      }

      // Traiter l'isolation tenant
      if (isolationMeta?.enabled) {
        // Vérifier si l'utilisateur peut bypasser l'isolation
        const canBypass = isolationMeta.bypassForRoles?.includes(tenantContext.userRole || '');
        
        if (!canBypass && isolationMeta.strictMode) {
          // En mode strict, vérifier les paramètres de tenant
          const targetTenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;
          
          if (targetTenantId && targetTenantId !== tenantContext.tenantId) {
            // Vérifier l'accès cross-tenant
            if (!crossTenantMeta?.allowed) {
              return res.status(403).json({
                error: 'Accès cross-tenant refusé',
                message: 'Accès limité à votre tenant'
              });
            }

            // Valider l'accès cross-tenant
            const accessRules: TenantAccessRule = {
              allowCrossTenant: true,
              restrictedTenants: crossTenantMeta.restrictedTenants,
              requiredRole: crossTenantMeta.requiredRole
            };

            const accessValidation = await multiTenantService.validateTenantAccess(
              tenantContext,
              targetTenantId as string,
              accessRules
            );

            if (!accessValidation.allowed) {
              return res.status(403).json({
                error: 'Accès cross-tenant refusé',
                message: accessValidation.reason
              });
            }
          }
        }
      }

      // Logger l'accès tenant
      logger.debug('Accès tenant validé:', {
        userId: tenantContext.userId,
        tenantId: tenantContext.tenantId,
        tenantType: tenantContext.tenantType,
        method: req.method,
        path: req.path,
        targetTenant: req.params.tenantId || req.body.tenantId
      });

      next();
    } catch (error) {
      logger.error('Erreur dans le traitement des décorateurs tenant:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la validation tenant'
      });
    }
  };
}

/**
 * Middleware pour l'isolation tenant automatique
 */
export const tenantIsolationMiddleware = (options?: {
  strictMode?: boolean;
  allowCrossTenant?: boolean;
  requiredRole?: string;
}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      // Récupérer le contexte tenant
      const tenantContext = await multiTenantService.getTenantContext(req.user.id);
      if (!tenantContext) {
        return res.status(403).json({
          error: 'Contexte tenant manquant',
          message: 'Impossible de déterminer le tenant'
        });
      }

      // Ajouter le contexte à la requête
      (req as any).tenantContext = tenantContext;

      // Vérifier le rôle si requis
      if (options?.requiredRole && tenantContext.userRole !== options.requiredRole) {
        return res.status(403).json({
          error: 'Rôle insuffisant',
          message: `Rôle ${options.requiredRole} requis`
        });
      }

      // Validation cross-tenant si nécessaire
      const targetTenantId = req.params.tenantId || req.body.tenantId;
      if (targetTenantId && targetTenantId !== tenantContext.tenantId) {
        if (!options?.allowCrossTenant) {
          return res.status(403).json({
            error: 'Accès cross-tenant refusé',
            message: 'Accès limité à votre tenant'
          });
        }

        // Valider l'accès cross-tenant
        const accessValidation = await multiTenantService.validateTenantAccess(
          tenantContext,
          targetTenantId,
          { allowCrossTenant: true }
        );

        if (!accessValidation.allowed) {
          return res.status(403).json({
            error: 'Accès cross-tenant refusé',
            message: accessValidation.reason
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Erreur dans le middleware d\'isolation tenant:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la validation tenant'
      });
    }
  };
};

/**
 * Utilitaires pour récupérer les métadonnées
 */
export function getTenantIsolationMetadata(target: any, propertyKey: string): TenantIsolationMetadata | undefined {
  return Reflect.getMetadata(TENANT_ISOLATION_KEY, target, propertyKey);
}

export function getCrossTenantMetadata(target: any, propertyKey: string): CrossTenantMetadata | undefined {
  return Reflect.getMetadata(CROSS_TENANT_KEY, target, propertyKey);
}

export function getTenantRoleMetadata(target: any, propertyKey: string): string | undefined {
  return Reflect.getMetadata(TENANT_ROLE_KEY, target, propertyKey);
}

// Extension de Request pour inclure le contexte tenant
declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        tenantId: string;
        tenantType: string;
        tenantCode: string;
        userId?: string;
        userRole?: string;
      };
    }
  }
}