/**
 * FICHIER: apps\api\src\shared\guards\rbac.guard.ts
 * GUARDS: Guards d'autorisation RBAC avancés
 * 
 * DESCRIPTION:
 * Guards d'autorisation utilisant le service RBAC complet
 * Support des permissions granulaires et conditions dynamiques
 * Guards spécialisés par module métier
 * 
 * FONCTIONNALITÉS:
 * - Guard principal RBAC avec vérifications granulaires
 * - Guards spécialisés par module (financial, stocks, etc.)
 * - Support des conditions contextuelles
 * - Décorateurs pour faciliter l'utilisation
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { RBACService, PermissionCheck, RBACContext } from '@/modules/auth/rbac.service';
import { logger } from '@/shared/utils/logger';

const rbacService = new RBACService();

/**
 * Guard principal RBAC avec vérifications granulaires
 */
export const requirePermission = (resource: string, action: string, contextExtractor?: (req: Request) => Record<string, any>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Vérifier l'authentification
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      // Construire le contexte RBAC
      const context: RBACContext = {
        userId: req.user.id,
        tenantId: req.user.tenantId,
        roleId: req.user.roleId,
        permissions: req.user.permissions || [],
        ipAddress: req.ip
      };

      // Extraire le contexte de vérification si fourni
      const checkContext = contextExtractor ? contextExtractor(req) : undefined;

      // Construire la vérification de permission
      const permissionCheck: PermissionCheck = {
        resource,
        action,
        context: checkContext
      };

      // Vérifier la permission
      const result = await rbacService.checkPermission(context, permissionCheck);

      if (!result.granted) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: result.reason || 'Permissions insuffisantes',
          requiredPermission: result.requiredPermission
        });
      }

      // Permission accordée, continuer
      next();

    } catch (error) {
      logger.error('Erreur dans le guard RBAC:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification des permissions'
      });
    }
  };
};

/**
 * Guard pour vérifier l'accès à un module complet
 */
export const requireModuleAccess = (module: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      const canAccess = rbacService.canAccessModule(req.user.permissions || [], module);

      if (!canAccess) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: `Accès au module ${module} non autorisé`
        });
      }

      next();
    } catch (error) {
      logger.error('Erreur dans le guard d\'accès module:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification d\'accès au module'
      });
    }
  };
};

/**
 * Guard spécialisé pour le module financier
 */
export const requireFinancialPermission = (action: string) => {
  return requirePermission('financial', action, (req) => {
    // Extraire le contexte financier de la requête
    const context: Record<string, any> = {};
    
    // Montant pour les validations
    if (req.body.amount || req.query.amount) {
      context.amount = req.body.amount || req.query.amount;
    }
    
    // Tenant cible pour les opérations cross-tenant
    if (req.body.tenantId || req.query.tenantId) {
      context.targetTenantId = req.body.tenantId || req.query.tenantId;
    }
    
    // Type d'opération financière
    if (req.body.operationType || req.query.operationType) {
      context.operationType = req.body.operationType || req.query.operationType;
    }

    return context;
  });
};

/**
 * Guard spécialisé pour le module stocks
 */
export const requireStocksPermission = (action: string) => {
  return requirePermission('stocks', action, (req) => {
    const context: Record<string, any> = {};
    
    // Produit concerné
    if (req.body.productId || req.params.productId) {
      context.productId = req.body.productId || req.params.productId;
    }
    
    // Quantité pour les mouvements
    if (req.body.quantity) {
      context.quantity = req.body.quantity;
    }
    
    // Type de mouvement (entrée, sortie, transfert)
    if (req.body.movementType) {
      context.movementType = req.body.movementType;
    }

    return context;
  });
};

/**
 * Guard spécialisé pour le module logement
 */
export const requireHousingPermission = (action: string) => {
  return requirePermission('housing', action, (req) => {
    const context: Record<string, any> = {};
    
    // Cité universitaire
    if (req.body.housingId || req.params.housingId) {
      context.housingId = req.body.housingId || req.params.housingId;
    }
    
    // Étudiant concerné
    if (req.body.studentId) {
      context.studentId = req.body.studentId;
    }

    return context;
  });
};

/**
 * Guard spécialisé pour le module transport
 */
export const requireTransportPermission = (action: string) => {
  return requirePermission('transport', action, (req) => {
    const context: Record<string, any> = {};
    
    // Véhicule concerné
    if (req.body.vehicleId || req.params.vehicleId) {
      context.vehicleId = req.body.vehicleId || req.params.vehicleId;
    }
    
    // Type d'intervention
    if (req.body.interventionType) {
      context.interventionType = req.body.interventionType;
    }

    return context;
  });
};

/**
 * Guard spécialisé pour l'administration
 */
export const requireAdminPermission = (action: string) => {
  return requirePermission('admin', action, (req) => {
    const context: Record<string, any> = {};
    
    // Utilisateur cible pour les opérations sur les utilisateurs
    if (req.body.targetUserId || req.params.userId) {
      context.targetUserId = req.body.targetUserId || req.params.userId;
    }
    
    // Tenant cible pour les opérations cross-tenant
    if (req.body.targetTenantId || req.params.tenantId) {
      context.targetTenantId = req.body.targetTenantId || req.params.tenantId;
    }

    return context;
  });
};

/**
 * Guard pour les opérations cross-tenant (réservé au ministère)
 */
export const requireCrossTenantAccess = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      // Seuls les utilisateurs du ministère peuvent faire du cross-tenant
      if (req.user.tenantId !== 'ministere') {
        return res.status(403).json({
          error: 'Accès refusé',
          message: 'Opérations cross-tenant réservées au ministère'
        });
      }

      next();
    } catch (error) {
      logger.error('Erreur dans le guard cross-tenant:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la vérification cross-tenant'
      });
    }
  };
};

/**
 * Décorateur pour créer des guards personnalisés
 */
export const createCustomGuard = (
  resource: string,
  action: string,
  customValidator?: (req: Request, context: RBACContext) => Promise<boolean>
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      const context: RBACContext = {
        userId: req.user.id,
        tenantId: req.user.tenantId,
        roleId: req.user.roleId,
        permissions: req.user.permissions || [],
        ipAddress: req.ip
      };

      // Vérification de permission de base
      const permissionCheck: PermissionCheck = { resource, action };
      const result = await rbacService.checkPermission(context, permissionCheck);

      if (!result.granted) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: result.reason || 'Permissions insuffisantes'
        });
      }

      // Validation personnalisée si fournie
      if (customValidator) {
        const customResult = await customValidator(req, context);
        if (!customResult) {
          return res.status(403).json({
            error: 'Accès refusé',
            message: 'Validation personnalisée échouée'
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Erreur dans le guard personnalisé:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la validation personnalisée'
      });
    }
  };
};