/**
 * FICHIER: apps/api/src/shared/guards/specialized.guards.ts
 * GUARDS: Guards spécialisés avancés par module
 * 
 * DESCRIPTION:
 * Guards d'autorisation spécialisés pour chaque module métier
 * Logique de validation contextuelle et conditions dynamiques
 * Intégration avec le système RBAC complet
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { RBACService } from '@/modules/auth/rbac.service';
import { logger } from '@/shared/utils/logger';

const rbacService = new RBACService();

/**
 * Interface pour les options de guard spécialisé
 */
interface SpecializedGuardOptions {
  extractTenantFrom?: 'params' | 'body' | 'query';
  tenantField?: string;
  allowCrossTenant?: boolean;
  customValidator?: (req: Request) => Promise<boolean>;
}

/**
 * Guard financier avancé avec validation de montants
 */
export const requireFinancialOperation = (
  action: string,
  options?: SpecializedGuardOptions & {
    maxAmount?: number;
    requireApproval?: boolean;
    operationTypes?: string[];
  }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      const userId = req.user.id;
      const userTenantId = req.user.tenantId;

      // Construire le contexte financier
      const context = {
        userId,
        tenantId: userTenantId,
        requestData: { ...req.body, ...req.query }
      };

      // Vérifier la permission de base
      const hasPermission = await rbacService.hasPermission(
        userId,
        'financial',
        action,
        context
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: `Permission insuffisante pour l'opération financière: ${action}`
        });
      }

      // Validations spécifiques au module financier
      const amount = req.body.amount || req.query.amount;
      const operationType = req.body.operationType || req.query.operationType;

      // Vérification du montant maximum
      if (options?.maxAmount && amount && parseFloat(amount) > options.maxAmount) {
        const canApprove = await rbacService.hasPermission(
          userId,
          'financial',
          'validate',
          context
        );

        if (!canApprove) {
          return res.status(403).json({
            error: 'Montant trop élevé',
            message: `Montant de ${amount} FCFA dépasse la limite autorisée de ${options.maxAmount} FCFA`,
            requiredPermission: 'financial:validate'
          });
        }
      }

      // Vérification du type d'opération
      if (options?.operationTypes && operationType && !options.operationTypes.includes(operationType)) {
        return res.status(400).json({
          error: 'Type d\'opération non autorisé',
          message: `Type d'opération '${operationType}' non autorisé`,
          allowedTypes: options.operationTypes
        });
      }

      // Validation personnalisée
      if (options?.customValidator) {
        const customResult = await options.customValidator(req);
        if (!customResult) {
          return res.status(403).json({
            error: 'Validation personnalisée échouée',
            message: 'Les conditions spécifiques ne sont pas remplies'
          });
        }
      }

      logger.debug('Guard financier validé:', {
        userId,
        action,
        amount,
        operationType
      });

      next();
    } catch (error) {
      logger.error('Erreur dans le guard financier:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la validation financière'
      });
    }
  };
};

/**
 * Guard administration avec contrôles renforcés
 */
export const requireAdminOperation = (
  action: string,
  options?: SpecializedGuardOptions & {
    requireAuditLog?: boolean;
    sensitiveOperation?: boolean;
    targetUserValidation?: boolean;
  }
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: 'Non authentifié',
          message: 'Authentification requise'
        });
      }

      const userId = req.user.id;
      const context = {
        userId,
        tenantId: req.user.tenantId,
        requestData: { ...req.body, ...req.query }
      };

      // Vérifier la permission de base
      const hasPermission = await rbacService.hasPermission(
        userId,
        'admin',
        action,
        context
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Accès refusé',
          message: `Permission insuffisante pour l'opération admin: ${action}`
        });
      }

      // Contrôles renforcés pour les opérations sensibles
      if (options?.sensitiveOperation) {
        const canAudit = await rbacService.hasPermission(
          userId,
          'audit',
          'read',
          context
        );

        if (!canAudit) {
          return res.status(403).json({
            error: 'Opération sensible refusée',
            message: 'Les opérations sensibles nécessitent l\'accès aux logs d\'audit',
            requiredPermission: 'audit:read'
          });
        }
      }

      // Validation de l'utilisateur cible
      if (options?.targetUserValidation) {
        const targetUserId = req.body.targetUserId || req.params.userId;
        
        if (targetUserId === userId) {
          return res.status(400).json({
            error: 'Auto-modification interdite',
            message: 'Impossible de modifier ses propres permissions'
          });
        }
      }

      // Validation personnalisée
      if (options?.customValidator) {
        const customResult = await options.customValidator(req);
        if (!customResult) {
          return res.status(403).json({
            error: 'Validation personnalisée échouée',
            message: 'Les conditions spécifiques ne sont pas remplies'
          });
        }
      }

      logger.info('Opération admin autorisée:', {
        userId,
        action,
        sensitive: options?.sensitiveOperation,
        targetUser: req.body.targetUserId || req.params.userId
      });

      next();
    } catch (error) {
      logger.error('Erreur dans le guard admin:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la validation admin'
      });
    }
  };
};

/**
 * Guard pour les opérations cross-tenant (ministère uniquement)
 */
export const requireCrossTenantOperation = (resource: string, action: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
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
          error: 'Accès cross-tenant refusé',
          message: 'Les opérations cross-tenant sont réservées au ministère'
        });
      }

      const userId = req.user.id;
      const context = {
        userId,
        tenantId: req.user.tenantId,
        requestData: { ...req.body, ...req.query }
      };

      // Vérifier la permission pour l'opération cross-tenant
      const hasPermission = await rbacService.hasPermission(
        userId,
        resource,
        action,
        context
      );

      if (!hasPermission) {
        return res.status(403).json({
          error: 'Permission cross-tenant refusée',
          message: `Permission insuffisante pour l'opération cross-tenant: ${resource}:${action}`
        });
      }

      logger.info('Opération cross-tenant autorisée:', {
        userId,
        resource,
        action,
        targetTenant: req.body.tenantId || req.params.tenantId
      });

      next();
    } catch (error) {
      logger.error('Erreur dans le guard cross-tenant:', error);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Erreur lors de la validation cross-tenant'
      });
    }
  };
};