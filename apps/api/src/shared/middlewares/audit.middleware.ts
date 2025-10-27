/**
 * FICHIER: apps\api\src\shared\middlewares\audit.middleware.ts
 * MIDDLEWARE: Audit automatique des requêtes
 * 
 * DESCRIPTION:
 * Middleware pour l'enregistrement automatique des événements d'audit
 * Capture les accès aux ressources, modifications de données
 * Intégration transparente avec les contrôleurs existants
 * 
 * FONCTIONNALITÉS:
 * - Audit automatique des requêtes HTTP
 * - Capture des modifications de données
 * - Logging des accès aux ressources sensibles
 * - Détection d'activités suspectes en temps réel
 * - Configuration flexible par route
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { AuditService } from '@/shared/services/audit.service';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { logger } from '@/shared/utils/logger';

const auditService = new AuditService();

/**
 * Interface pour les options d'audit
 */
interface AuditOptions {
  enabled?: boolean;
  logAllRequests?: boolean;
  logOnlyChanges?: boolean;
  sensitiveResource?: boolean;
  excludeActions?: string[];
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

/**
 * Middleware principal d'audit automatique
 */
export const auditMiddleware = (options: AuditOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Vérifier si l'audit est activé
    if (options.enabled === false) {
      return next();
    }

    const startTime = Date.now();
    const originalSend = res.send;
    let responseBody: any;

    // Capturer la réponse si demandé
    if (options.includeResponseBody) {
      res.send = function(body: any) {
        responseBody = body;
        return originalSend.call(this, body);
      };
    }

    // Continuer avec la requête
    next();

    // Enregistrer l'audit après la réponse
    res.on('finish', async () => {
      try {
        await logRequestAudit(req, res, options, {
          responseTime: Date.now() - startTime,
          responseBody: options.includeResponseBody ? responseBody : undefined
        });
      } catch (error) {
        logger.error('Erreur audit middleware:', error);
      }
    });
  };
};

/**
 * Enregistrer l'audit d'une requête
 */
async function logRequestAudit(
  req: Request, 
  res: Response, 
  options: AuditOptions,
  metadata: { responseTime: number; responseBody?: any }
): Promise<void> {
  try {
    // Déterminer l'action selon la méthode HTTP
    const actionMap: Record<string, AuditAction> = {
      'GET': AuditAction.VIEW,
      'POST': AuditAction.CREATE,
      'PUT': AuditAction.UPDATE,
      'PATCH': AuditAction.UPDATE,
      'DELETE': AuditAction.DELETE
    };

    const action = actionMap[req.method] || AuditAction.VIEW;

    // Exclure certaines actions si configuré
    if (options.excludeActions?.includes(action)) {
      return;
    }

    // Ne logger que les modifications si configuré
    if (options.logOnlyChanges && action === AuditAction.VIEW) {
      return;
    }

    // Extraire la ressource depuis le chemin
    const pathParts = req.path.split('/').filter(part => part);
    const resource = pathParts[1] || 'unknown'; // /api/[resource]/...
    const resourceId = extractResourceId(req);

    // Préparer les données d'audit
    const auditData = {
      userId: req.user?.id,
      action,
      resource,
      resourceId,
      tenantId: req.user?.tenantId || (req as any).tenantContext?.tenantId,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      metadata: {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime: metadata.responseTime,
        requestBody: options.includeRequestBody ? sanitizeRequestBody(req.body) : undefined,
        responseBody: options.includeResponseBody ? sanitizeResponseBody(metadata.responseBody) : undefined,
        query: req.query,
        params: req.params,
        timestamp: new Date().toISOString()
      }
    };

    // Enregistrer l'événement d'audit
    await auditService.logEvent(auditData);

    // Logging spécial pour les ressources sensibles
    if (options.sensitiveResource) {
      logger.warn('Accès ressource sensible:', {
        userId: req.user?.id,
        resource,
        action,
        ipAddress: req.ip,
        statusCode: res.statusCode
      });
    }

  } catch (error) {
    logger.error('Erreur enregistrement audit requête:', error);
  }
}

/**
 * Extraire l'ID de la ressource depuis la requête
 */
function extractResourceId(req: Request): string | undefined {
  // Chercher un ID dans les paramètres
  const idParams = ['id', 'userId', 'tenantId', 'budgetId', 'stockId'];
  
  for (const param of idParams) {
    if (req.params[param]) {
      return req.params[param];
    }
  }

  // Chercher dans le body pour les créations
  if (req.method === 'POST' && req.body?.id) {
    return req.body.id;
  }

  return undefined;
}

/**
 * Nettoyer le body de la requête (enlever les données sensibles)
 */
function sanitizeRequestBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  const sanitized = { ...body };
  
  // Enlever les champs sensibles
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'hash'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  return sanitized;
}

/**
 * Nettoyer le body de la réponse (enlever les données sensibles)
 */
function sanitizeResponseBody(body: any): any {
  if (!body || typeof body !== 'object') {
    return body;
  }

  try {
    const parsed = typeof body === 'string' ? JSON.parse(body) : body;
    const sanitized = { ...parsed };
    
    // Enlever les tokens et données sensibles
    if (sanitized.data?.tokens) {
      sanitized.data.tokens = '[REDACTED]';
    }
    
    if (sanitized.accessToken) {
      sanitized.accessToken = '[REDACTED]';
    }
    
    if (sanitized.refreshToken) {
      sanitized.refreshToken = '[REDACTED]';
    }

    return sanitized;
  } catch (error) {
    return '[PARSE_ERROR]';
  }
}

/**
 * Middleware d'audit pour les ressources sensibles
 */
export const auditSensitiveResource = (resource: string) => {
  return auditMiddleware({
    enabled: true,
    logAllRequests: true,
    sensitiveResource: true,
    includeRequestBody: true,
    includeResponseBody: false // Éviter de logger les réponses sensibles
  });
};

/**
 * Middleware d'audit pour les modifications de données
 */
export const auditDataChanges = auditMiddleware({
  enabled: true,
  logOnlyChanges: true,
  includeRequestBody: true,
  excludeActions: ['view'] // Exclure les lectures simples
});

/**
 * Middleware d'audit complet (pour debug)
 */
export const auditComplete = auditMiddleware({
  enabled: true,
  logAllRequests: true,
  includeRequestBody: true,
  includeResponseBody: true
});

/**
 * Middleware d'audit léger (production)
 */
export const auditLight = auditMiddleware({
  enabled: true,
  logOnlyChanges: true,
  includeRequestBody: false,
  includeResponseBody: false
});

/**
 * Middleware pour les opérations d'authentification
 */
export const auditAuth = async (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  let responseBody: any;

  // Capturer la réponse
  res.send = function(body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  next();

  // Enregistrer l'audit après la réponse
  res.on('finish', async () => {
    try {
      const success = res.statusCode < 400;
      let parsedResponse: any;
      
      try {
        parsedResponse = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
      } catch {
        parsedResponse = {};
      }

      // Déterminer l'action d'auth
      let authAction: string;
      if (req.path.includes('/login')) {
        authAction = 'login';
      } else if (req.path.includes('/logout')) {
        authAction = 'logout';
      } else if (req.path.includes('/refresh')) {
        authAction = 'token_refresh';
      } else {
        authAction = 'auth_operation';
      }

      await auditService.logAuthEvent(
        authAction as any,
        req.user?.id,
        req.body?.email,
        success,
        req.ip,
        req.get('User-Agent'),
        {
          path: req.path,
          method: req.method,
          statusCode: res.statusCode,
          message: parsedResponse.message || parsedResponse.error
        }
      );

    } catch (error) {
      logger.error('Erreur audit auth:', error);
    }
  });
};

/**
 * Middleware pour logger les accès cross-tenant
 */
export const auditCrossTenant = async (req: Request, res: Response, next: NextFunction) => {
  next();

  res.on('finish', async () => {
    try {
      const userTenantId = req.user?.tenantId;
      const targetTenantId = req.params.tenantId || req.body.tenantId;

      // Si c'est un accès cross-tenant
      if (userTenantId && targetTenantId && userTenantId !== targetTenantId) {
        await auditService.logResourceAccess(
          req.user!.id,
          'cross_tenant_access',
          AuditAction.VIEW,
          targetTenantId,
          userTenantId,
          req.ip,
          {
            targetTenant: targetTenantId,
            path: req.path,
            method: req.method,
            statusCode: res.statusCode
          }
        );

        logger.warn('Accès cross-tenant audité:', {
          userId: req.user!.id,
          userTenant: userTenantId,
          targetTenant: targetTenantId,
          path: req.path,
          statusCode: res.statusCode
        });
      }
    } catch (error) {
      logger.error('Erreur audit cross-tenant:', error);
    }
  });
};