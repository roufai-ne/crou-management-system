/**
 * FICHIER: apps\api\src\shared\middlewares\decorator-processor.middleware.ts
 * MIDDLEWARE: Processeur automatique des décorateurs de permissions
 * 
 * DESCRIPTION:
 * Middleware qui traite automatiquement les décorateurs de permissions
 * Intégration transparente avec le système RBAC
 * Support des conditions dynamiques et validations contextuelles
 * 
 * FONCTIONNALITÉS:
 * - Traitement automatique des décorateurs @RequirePermission
 * - Support des permissions multiples (ET/OU)
 * - Validation des rôles et conditions
 * - Gestion des tenants et cross-tenant
 * - Logging et audit automatique
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { RBACService } from '@/modules/auth/rbac.service';
import { logger } from '@/shared/utils/logger';
import {
  getPermissionMetadata,
  getRoleMetadata,
  getTenantMetadata,
  getConditionsMetadata,
  PermissionCondition,
  PERMISSION_METADATA_KEY
} from '@/shared/decorators/permissions.decorator';

const rbacService = new RBACService();

/**
 * Interface pour les options du processeur
 */
interface ProcessorOptions {
  skipAuthentication?: boolean;
  logAccess?: boolean;
  auditSensitive?: boolean;
}

/**
 * Middleware principal pour traiter les décorateurs de permissions
 */
export const processPermissionDecorators = (options?: ProcessorOptions) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Récupérer les informations de la route
      const route = req.route;
      const method = req.method.toLowerCase();
      
      if (!route) {
        return next();
      }

      // Récupérer le contrôleur et la méthode depuis la pile d'appels
      const controllerInfo = getControllerInfo(req);
      
      if (!controllerInfo) {
        return next();
      }

      const { controller, methodName } = controllerInfo;

      // Vérifier l'authentification si nécessaire
      if (!options?.skipAuthentication && !req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      // Traiter les métadonnées de permissions
      await processPermissionMetadata(req, res, next, controller, methodName, options);

    } catch (error) {
      logger.error('Erreur dans le processeur de décorateurs:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors du traitement des permissions'
      });
    }
  };
};

/**
 * Traiter les métadonnées de permissions
 */
async function processPermissionMetadata(
  req: Request,
  res: Response,
  next: NextFunction,
  controller: any,
  methodName: string,
  options?: ProcessorOptions
) {
  const userId = req.user?.id;
  const userTenantId = req.user?.tenantId;

  // Récupérer toutes les métadonnées
  const permissionMeta = getPermissionMetadata(controller, methodName);
  const roleMeta = getRoleMetadata(controller, methodName);
  const tenantMeta = getTenantMetadata(controller, methodName);
  const conditionsMeta = getConditionsMetadata(controller, methodName);

  // Récupérer les permissions multiples
  const anyPermissions = Reflect.getMetadata(String(PERMISSION_METADATA_KEY) + '_any', controller, methodName);
  const allPermissions = Reflect.getMetadata(String(PERMISSION_METADATA_KEY) + '_all', controller, methodName);

  // Si aucune métadonnée de permission, continuer
  if (!permissionMeta && !roleMeta && !anyPermissions && !allPermissions) {
    return next();
  }

  // Construire le contexte RBAC
  const context = {
    userId: userId!,
    tenantId: userTenantId!,
    requestData: { ...req.body, ...req.query, ...req.params }
  };

  // Traiter les permissions simples
  if (permissionMeta) {
    const rbacContext = {
      userId: userId!,
      tenantId: userTenantId!,
      roleId: req.user?.roleId || '',
      permissions: req.user?.permissions || [],
      ipAddress: req.ip
    };

    const permissionCheck = {
      resource: permissionMeta.resource,
      action: permissionMeta.action,
      context: context.requestData
    };

    const result = await rbacService.checkPermission(rbacContext, permissionCheck);

    if (!result.granted) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: result.reason || `Permission insuffisante: ${permissionMeta.resource}:${permissionMeta.action}`
      });
    }
  }

  // Traiter les permissions multiples (OU logique)
  if (anyPermissions && anyPermissions.length > 0) {
    let hasAnyPermission = false;
    
    for (const perm of anyPermissions) {
      const rbacContext = {
        userId: userId!,
        tenantId: userTenantId!,
        roleId: req.user?.roleId || '',
        permissions: req.user?.permissions || [],
        ipAddress: req.ip
      };

      const permissionCheck = {
        resource: perm.resource,
        action: perm.action,
        context: context.requestData
      };

      const result = await rbacService.checkPermission(rbacContext, permissionCheck);
      
      if (result.granted) {
        hasAnyPermission = true;
        break;
      }
    }

    if (!hasAnyPermission) {
      const requiredPerms = anyPermissions.map((p: any) => `${p.resource}:${p.action}`).join(' OR ');
      return res.status(403).json({
        error: 'Accès refusé',
        message: `Au moins une permission requise: ${requiredPerms}`
      });
    }
  }

  // Traiter les permissions multiples (ET logique)
  if (allPermissions && allPermissions.length > 0) {
    const permissionChecks = allPermissions.map((perm: any) => ({
      resource: perm.resource,
      action: perm.action
    }));

    const rbacContext = {
      userId: userId!,
      tenantId: userTenantId!,
      roleId: req.user?.roleId || '',
      permissions: req.user?.permissions || [],
      ipAddress: req.ip
    };

    const checks = permissionChecks.map((p: any) => ({
      resource: p.resource,
      action: p.action,
      context: context.requestData
    }));

    const results = await rbacService.checkMultiplePermissions(rbacContext, checks);
    const hasAllPermissions = Object.values(results).every(result => result.granted);

    if (!hasAllPermissions) {
      const requiredPerms = allPermissions.map((p: any) => `${p.resource}:${p.action}`).join(' AND ');
      return res.status(403).json({
        error: 'Accès refusé',
        message: `Toutes les permissions requises: ${requiredPerms}`
      });
    }
  }

  // Traiter les métadonnées de rôles
  if (roleMeta) {
    // Pour le moment, utiliser les permissions depuis req.user
    // TODO: Implémenter getUserPermissions dans le service RBAC
    const userPermissions = req.user?.permissions || [];
    
    if (!userPermissions || userPermissions.length === 0) {
      return res.status(403).json({
        error: 'Accès refusé',
        message: 'Permissions utilisateur non trouvées'
      });
    }

    // Mapping des rôles (temporaire)
    const roleMapping: Record<string, string> = {
      'role-ministre': 'ministre',
      'role-directeur-finances': 'directeur_finances',
      'role-directeur-crou': 'directeur_crou',
      'role-comptable': 'comptable'
    };

    const userRole = roleMapping[req.user?.roleId || ''] || 'user';

    if (roleMeta.strict) {
      // Tous les rôles requis
      if (!roleMeta.roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: `Rôle requis: ${roleMeta.roles.join(' ET ')}`
        });
      }
    } else {
      // Au moins un rôle requis
      if (!roleMeta.roles.includes(userRole)) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: `Au moins un rôle requis: ${roleMeta.roles.join(' OU ')}`
        });
      }
    }
  }

  // Traiter les métadonnées de tenant
  if (tenantMeta) {
    const targetTenantId = extractTenantId(req, tenantMeta);
    
    if (targetTenantId && targetTenantId !== userTenantId) {
      // Vérifier si l'accès cross-tenant est autorisé
      if (!tenantMeta.allowCrossTenant) {
        return res.status(403).json({
          error: 'Accès cross-tenant refusé',
          message: 'Accès à un autre tenant non autorisé'
        });
      }

      // Seuls les utilisateurs du ministère peuvent faire du cross-tenant
      if (userTenantId !== 'ministere') {
        return res.status(403).json({
          error: 'Accès cross-tenant refusé',
          message: 'Accès cross-tenant réservé au ministère'
        });
      }
    }
  }

  // Traiter les conditions personnalisées
  if (conditionsMeta && conditionsMeta.length > 0) {
    const conditionsResult = evaluateConditions(conditionsMeta, req, context);
    
    if (!conditionsResult.success) {
      return res.status(403).json({
        error: 'Conditions non satisfaites',
        message: conditionsResult.message || 'Les conditions requises ne sont pas remplies'
      });
    }
  }

  // Logging des accès si activé
  if (options?.logAccess) {
    logger.info('Accès autorisé via décorateurs:', {
      userId,
      method: req.method,
      path: req.path,
      controller: controller.constructor.name,
      methodName: methodName,
      permissions: permissionMeta,
      roles: roleMeta
    });
  }

  // Audit des opérations sensibles
  if (options?.auditSensitive && (permissionMeta?.resource === 'admin' || roleMeta?.roles.includes('ministre'))) {
    logger.warn('Opération sensible détectée:', {
      userId,
      action: `${req.method} ${req.path}`,
      controller: controller.constructor.name,
      method: methodName,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  }

  next();
}

/**
 * Extraire les informations du contrôleur depuis la requête
 */
function getControllerInfo(req: Request): { controller: any, methodName: string } | null {
  // Cette fonction devrait être adaptée selon votre architecture
  // Pour l'instant, on utilise une approche simplifiée
  
  // Récupérer depuis les métadonnées de la route si disponibles
  if (req.route && req.route.stack && req.route.stack.length > 0) {
    const layer = req.route.stack[req.route.stack.length - 1];
    if (layer.handle && layer.handle.constructor) {
      return {
        controller: layer.handle.constructor.prototype,
        methodName: layer.handle.name || 'handler'
      };
    }
  }

  return null;
}

/**
 * Extraire l'ID du tenant selon la configuration
 */
function extractTenantId(req: Request, tenantMeta: any): string | undefined {
  const field = tenantMeta.tenantField || 'tenantId';
  
  switch (tenantMeta.extractTenantFrom) {
    case 'params':
      return req.params[field];
    case 'body':
      return req.body[field];
    case 'query':
      return req.query[field] as string;
    default:
      return req.params[field] || req.body[field] || req.query[field] as string;
  }
}

/**
 * Évaluer les conditions personnalisées
 */
function evaluateConditions(
  conditions: PermissionCondition[],
  req: Request,
  context: any
): { success: boolean, message?: string } {
  for (const condition of conditions) {
    const value = getConditionValue(condition.field, req, context);
    
    let conditionMet = false;
    
    switch (condition.operator) {
      case 'eq':
        conditionMet = value === condition.value;
        break;
      case 'in':
        conditionMet = Array.isArray(condition.value) && condition.value.includes(value);
        break;
      case 'gt':
        conditionMet = value > condition.value;
        break;
      case 'lt':
        conditionMet = value < condition.value;
        break;
      case 'gte':
        conditionMet = value >= condition.value;
        break;
      case 'lte':
        conditionMet = value <= condition.value;
        break;
      case 'contains':
        conditionMet = typeof value === 'string' && value.includes(condition.value);
        break;
      case 'exists':
        conditionMet = value !== undefined && value !== null;
        break;
    }
    
    if (!conditionMet) {
      return {
        success: false,
        message: condition.message || `Condition non satisfaite: ${condition.field} ${condition.operator} ${condition.value}`
      };
    }
  }
  
  return { success: true };
}

/**
 * Obtenir la valeur pour une condition
 */
function getConditionValue(field: string, req: Request, context: any): any {
  // Champs spéciaux
  if (field === 'userId') return context.userId;
  if (field === 'tenantId') return context.tenantId;
  if (field === 'method') return req.method;
  if (field === 'ip') return req.ip;
  
  // Données de requête
  if (field.startsWith('body.')) {
    const bodyField = field.substring(5);
    return req.body[bodyField];
  }
  
  if (field.startsWith('query.')) {
    const queryField = field.substring(6);
    return req.query[queryField];
  }
  
  if (field.startsWith('params.')) {
    const paramField = field.substring(7);
    return req.params[paramField];
  }
  
  // Recherche générale
  return req.body[field] || req.query[field] || req.params[field];
}

/**
 * Middleware pour activer le logging automatique
 */
export const enablePermissionLogging = processPermissionDecorators({
  logAccess: true,
  auditSensitive: true
});

/**
 * Middleware pour les routes publiques (skip authentication)
 */
export const processPublicDecorators = processPermissionDecorators({
  skipAuthentication: true
});