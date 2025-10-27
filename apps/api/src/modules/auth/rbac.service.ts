/**
 * FICHIER: apps\api\src\modules\auth\rbac.service.ts
 * SERVICE: RBAC (Role-Based Access Control) complet
 * 
 * DESCRIPTION:
 * Service pour la gestion complète des rôles et permissions
 * Vérification granulaire des autorisations selon la matrice du PRD
 * Support des conditions dynamiques et du multi-tenant
 * 
 * FONCTIONNALITÉS:
 * - Vérification des permissions granulaires (resource:action)
 * - Gestion des conditions dynamiques
 * - Isolation multi-tenant
 * - Cache des permissions pour performance
 * - Audit des vérifications d'autorisation
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { logger } from '@/shared/utils/logger';

// Interfaces pour le service RBAC
export interface PermissionCheck {
  resource: string;
  action: string;
  context?: Record<string, any>;
}

export interface RBACContext {
  userId: string;
  tenantId: string;
  roleId: string;
  permissions: string[];
  ipAddress?: string;
}

export interface PermissionResult {
  granted: boolean;
  reason?: string;
  requiredPermission?: string;
}

export class RBACService {
  private permissionCache = new Map<string, { permissions: string[]; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Vérifier si un utilisateur a une permission spécifique
   */
  async checkPermission(
    context: RBACContext,
    check: PermissionCheck
  ): Promise<PermissionResult> {
    try {
      const { resource, action, context: checkContext } = check;
      const requiredPermission = `${resource}:${action}`;

      // 1. Vérifier les permissions de base
      const hasBasicPermission = this.hasBasicPermission(context.permissions, resource, action);
      
      if (!hasBasicPermission) {
        await this.logPermissionCheck(context, check, false, 'Permission de base manquante');
        return {
          granted: false,
          reason: 'Permission insuffisante',
          requiredPermission
        };
      }

      // 2. Vérifier les conditions contextuelles si nécessaire
      const contextualCheck = await this.checkContextualPermissions(context, check, checkContext);
      
      if (!contextualCheck.granted) {
        await this.logPermissionCheck(context, check, false, contextualCheck.reason);
        return contextualCheck;
      }

      // 3. Vérifier l'isolation multi-tenant
      const tenantCheck = this.checkTenantAccess(context, checkContext);
      
      if (!tenantCheck.granted) {
        await this.logPermissionCheck(context, check, false, tenantCheck.reason);
        return tenantCheck;
      }

      // Permission accordée
      await this.logPermissionCheck(context, check, true, 'Permission accordée');
      
      return {
        granted: true,
        reason: 'Permission accordée'
      };

    } catch (error) {
      logger.error('Erreur lors de la vérification des permissions:', error);
      return {
        granted: false,
        reason: 'Erreur système lors de la vérification'
      };
    }
  }

  /**
   * Vérifier plusieurs permissions à la fois
   */
  async checkMultiplePermissions(
    context: RBACContext,
    checks: PermissionCheck[]
  ): Promise<{ [key: string]: PermissionResult }> {
    const results: { [key: string]: PermissionResult } = {};

    for (const check of checks) {
      const key = `${check.resource}:${check.action}`;
      results[key] = await this.checkPermission(context, check);
    }

    return results;
  }

  /**
   * Obtenir toutes les permissions d'un utilisateur avec détails
   */
  getDetailedPermissions(permissions: string[]): Array<{ resource: string; actions: string[] }> {
    const permissionMap = new Map<string, Set<string>>();

    permissions.forEach(permission => {
      const [resource, action] = permission.split(':');
      if (resource && action) {
        if (!permissionMap.has(resource)) {
          permissionMap.set(resource, new Set());
        }
        permissionMap.get(resource)!.add(action);
      }
    });

    return Array.from(permissionMap.entries()).map(([resource, actions]) => ({
      resource,
      actions: Array.from(actions)
    }));
  }

  /**
   * Vérifier si un utilisateur peut accéder à un module complet
   */
  canAccessModule(permissions: string[], module: string): boolean {
    return permissions.some(permission => 
      permission.startsWith(`${module}:`) || 
      permission === 'admin:all' ||
      permission === `${module}:read`
    );
  }

  /**
   * Obtenir le niveau d'accès pour un module (read, write, validate)
   */
  getModuleAccessLevel(permissions: string[], module: string): string[] {
    const modulePermissions = permissions.filter(permission => 
      permission.startsWith(`${module}:`) || permission === 'admin:all'
    );

    if (modulePermissions.includes('admin:all')) {
      return ['read', 'write', 'validate', 'delete', 'export'];
    }

    const actions = modulePermissions
      .map(permission => permission.split(':')[1])
      .filter(action => action);

    return [...new Set(actions)];
  }

  /**
   * Vérifier les permissions de base (resource:action)
   */
  private hasBasicPermission(permissions: string[], resource: string, action: string): boolean {
    const requiredPermission = `${resource}:${action}`;
    
    // Vérifier la permission exacte
    if (permissions.includes(requiredPermission)) {
      return true;
    }

    // Vérifier les permissions globales
    if (permissions.includes('admin:all')) {
      return true;
    }

    // Vérifier les permissions de module complet
    if (permissions.includes(`${resource}:all`)) {
      return true;
    }

    return false;
  }

  /**
   * Vérifier les permissions contextuelles
   */
  private async checkContextualPermissions(
    context: RBACContext,
    check: PermissionCheck,
    checkContext?: Record<string, any>
  ): Promise<PermissionResult> {
    // Pour le moment, implémentation basique
    // TODO: Implémenter la logique des conditions dynamiques des permissions
    
    // Exemple de conditions contextuelles :
    if (checkContext) {
      // Vérifier si l'utilisateur peut accéder aux données d'un autre tenant
      if (checkContext.targetTenantId && checkContext.targetTenantId !== context.tenantId) {
        // Seuls les utilisateurs du ministère peuvent accéder aux données d'autres tenants
        const isMinistryUser = context.permissions.some(p => 
          p.includes('admin:') || context.tenantId === 'ministere'
        );
        
        if (!isMinistryUser) {
          return {
            granted: false,
            reason: 'Accès cross-tenant non autorisé'
          };
        }
      }

      // Vérifier les contraintes de montant pour les validations financières
      if (check.resource === 'financial' && check.action === 'validate' && checkContext.amount) {
        const amount = parseFloat(checkContext.amount);
        
        // Exemple de seuils selon le PRD
        if (amount > 2000000) { // > 2M XOF
          const canValidateLargeAmounts = context.permissions.includes('financial:validate:large') ||
                                        context.permissions.includes('admin:all');
          
          if (!canValidateLargeAmounts) {
            return {
              granted: false,
              reason: 'Montant trop élevé pour ce niveau d\'autorisation'
            };
          }
        }
      }
    }

    return { granted: true };
  }

  /**
   * Vérifier l'accès multi-tenant
   */
  private checkTenantAccess(
    context: RBACContext,
    checkContext?: Record<string, any>
  ): PermissionResult {
    // Si pas de contexte spécifique, autoriser
    if (!checkContext || !checkContext.targetTenantId) {
      return { granted: true };
    }

    const targetTenantId = checkContext.targetTenantId;

    // L'utilisateur peut toujours accéder à son propre tenant
    if (context.tenantId === targetTenantId) {
      return { granted: true };
    }

    // Les utilisateurs du ministère peuvent accéder à tous les tenants
    if (context.tenantId === 'ministere') {
      return { granted: true };
    }

    // Vérifier si l'utilisateur a des permissions cross-tenant explicites
    const hasCrossTenantPermission = context.permissions.some(permission =>
      permission.includes('admin:') || permission.includes('cross-tenant:')
    );

    if (hasCrossTenantPermission) {
      return { granted: true };
    }

    return {
      granted: false,
      reason: 'Accès cross-tenant non autorisé pour ce rôle'
    };
  }

  /**
   * Logger les vérifications de permissions pour audit
   */
  private async logPermissionCheck(
    context: RBACContext,
    check: PermissionCheck,
    granted: boolean,
    reason?: string
  ): Promise<void> {
    try {
      logger.info('Vérification permission RBAC:', {
        userId: context.userId,
        tenantId: context.tenantId,
        roleId: context.roleId,
        resource: check.resource,
        action: check.action,
        granted,
        reason,
        ipAddress: context.ipAddress,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error('Erreur lors du logging de la vérification de permission:', error);
    }
  }

  /**
   * Nettoyer le cache des permissions
   */
  private cleanPermissionCache(): void {
    const now = Date.now();
    for (const [key, value] of this.permissionCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.permissionCache.delete(key);
      }
    }
  }

  /**
   * Obtenir les permissions depuis le cache ou les charger
   */
  private async getCachedPermissions(userId: string): Promise<string[]> {
    const cacheKey = `user_permissions_${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.permissions;
    }

    // TODO: Charger les permissions depuis la base de données
    // Pour le moment, retourner un tableau vide
    const permissions: string[] = [];
    
    this.permissionCache.set(cacheKey, {
      permissions,
      timestamp: Date.now()
    });

    return permissions;
  }

  /**
   * Invalider le cache des permissions pour un utilisateur
   */
  invalidateUserPermissions(userId: string): void {
    const cacheKey = `user_permissions_${userId}`;
    this.permissionCache.delete(cacheKey);
  }

  /**
   * Obtenir des statistiques sur l'utilisation des permissions
   */
  getPermissionStats(permissions: string[]): {
    totalPermissions: number;
    moduleBreakdown: Record<string, number>;
    actionBreakdown: Record<string, number>;
  } {
    const moduleBreakdown: Record<string, number> = {};
    const actionBreakdown: Record<string, number> = {};

    permissions.forEach(permission => {
      const [resource, action] = permission.split(':');
      
      if (resource) {
        moduleBreakdown[resource] = (moduleBreakdown[resource] || 0) + 1;
      }
      
      if (action) {
        actionBreakdown[action] = (actionBreakdown[action] || 0) + 1;
      }
    });

    return {
      totalPermissions: permissions.length,
      moduleBreakdown,
      actionBreakdown
    };
  }
}