/**
 * FICHIER: apps\api\src\shared\middlewares\tenant-isolation.middleware.ts
 * MIDDLEWARE: Isolation automatique multi-tenant avec hiérarchie
 *
 * DESCRIPTION:
 * Middlewares pour l'isolation automatique des données par tenant
 * Injection automatique du tenant_id dans les requêtes
 * Validation des accès cross-tenant avec support hiérarchique
 *
 * FONCTIONNALITÉS:
 * - Injection automatique du tenant_id dans les requêtes/réponses
 * - Validation stricte des accès cross-tenant
 * - Support de la hiérarchie tenant (Ministère → CROU → Services)
 * - Validation hiérarchique avec TenantHierarchyService
 * - Filtrage automatique des données par tenant
 * - Permissions spéciales pour les utilisateurs ministériels
 * - Audit des accès cross-tenant
 *
 * HIÉRARCHIE:
 * - Niveau 0 (Ministère): Accès à tous les tenants
 * - Niveau 1 (CROU): Accès à ses services (descendants)
 * - Niveau 2 (Service): Accès uniquement à lui-même
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request, Response, NextFunction } from 'express';
import { MultiTenantService, TenantContext, TenantAccessRule } from '@/shared/services/multi-tenant.service';
import { AuditService } from '@/shared/services/audit.service';
import { AuditAction } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { logger } from '@/shared/utils/logger';
import { TenantHierarchyService } from '@/modules/tenants/tenant-hierarchy.service';
import { AppDataSource } from '@/config/database';

const multiTenantService = new MultiTenantService();
const auditService = new AuditService();

// TenantHierarchyService sera initialisé lors de la première utilisation
let tenantHierarchyService: TenantHierarchyService | null = null;

/**
 * Récupérer ou initialiser le service de hiérarchie tenant
 */
function getTenantHierarchyService(): TenantHierarchyService {
  if (!tenantHierarchyService && AppDataSource.isInitialized) {
    tenantHierarchyService = new TenantHierarchyService(AppDataSource);
  }
  if (!tenantHierarchyService) {
    throw new Error('TenantHierarchyService non initialisé - DataSource non disponible');
  }
  return tenantHierarchyService;
}

/**
 * Interface pour les options d'isolation tenant
 */
export interface TenantIsolationOptions {
    enabled?: boolean;
    strictMode?: boolean;
    allowCrossTenant?: boolean;
    injectTenantId?: boolean;
    auditCrossTenant?: boolean;
    bypassRoles?: string[];
    restrictedTenants?: string[];
    requiredPermissions?: string[];
}

/**
 * Middleware principal d'injection automatique du tenant_id
 */
export const injectTenantIdMiddleware = (options: TenantIsolationOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Vérifier l'authentification
            if (!req.user) {
                return next(); // Laisser passer, l'auth middleware gérera l'erreur
            }

            // Récupérer le contexte tenant
            const tenantContext = await multiTenantService.getTenantContext(req.user.id);
            if (!tenantContext) {
                // Si le tenant est optionnel (par défaut), logger et continuer
                if (options.strictMode !== true) {
                    logger.warn(`Utilisateur ${req.user.id} sans tenant - mode permissif activé`);
                    return next();
                }

                // En mode strict uniquement, bloquer la requête
                return res.status(403).json({
                    error: 'Contexte tenant manquant',
                    message: 'Votre compte n\'est pas associé à un tenant. Veuillez contacter l\'administrateur.',
                    help: 'Les utilisateurs doivent être associés à un CROU ou au Ministère.',
                    userId: req.user.id
                });
            }

            // Ajouter le contexte tenant à la requête
            (req as any).tenantContext = tenantContext;

            // Injection automatique du tenant_id si activée
            if (options.injectTenantId !== false) {
                await injectTenantIdInRequest(req, tenantContext);
            }

            // Validation des accès si en mode strict
            if (options.strictMode) {
                const validation = await validateTenantAccess(req, tenantContext, options);
                if (!validation.allowed) {
                    return res.status(403).json({
                        error: 'Accès tenant refusé',
                        message: validation.reason
                    });
                }

                // Audit des accès cross-tenant
                if (validation.isCrossTenant && options.auditCrossTenant !== false && validation.targetTenantId) {
                    await auditCrossTenantAccess(req, tenantContext, validation.targetTenantId);
                }
            }

            // Intercepter la réponse pour filtrer les données
            if (options.enabled !== false) {
                interceptResponseForTenantFiltering(req, res, tenantContext);
            }

            next();
        } catch (error) {
            logger.error('Erreur dans le middleware d\'injection tenant:', error);
            return res.status(500).json({
                error: 'Erreur serveur',
                message: 'Erreur lors du traitement tenant'
            });
        }
    };
};

/**
 * Middleware de validation des accès cross-tenant
 */
export const validateCrossTenantMiddleware = (options: TenantIsolationOptions = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantContext = (req as any).tenantContext as TenantContext;

            if (!tenantContext) {
                return res.status(403).json({
                    error: 'Contexte tenant manquant',
                    message: 'Middleware d\'injection tenant requis en amont'
                });
            }

            // Détecter les tentatives d'accès cross-tenant
            const targetTenantId = extractTargetTenantId(req);

            if (targetTenantId && targetTenantId !== tenantContext.tenantId) {
                // Vérifier si l'accès cross-tenant est autorisé
                if (!options.allowCrossTenant) {
                    return res.status(403).json({
                        error: 'Accès cross-tenant interdit',
                        message: 'Cette opération est limitée à votre tenant'
                    });
                }

                // Vérifier les permissions cross-tenant
                const accessRules: TenantAccessRule = {
                    allowCrossTenant: true,
                    restrictedTenants: options.restrictedTenants
                };

                const validation = await multiTenantService.validateTenantAccess(
                    tenantContext,
                    targetTenantId,
                    accessRules
                );

                if (!validation.allowed) {
                    return res.status(403).json({
                        error: 'Accès cross-tenant refusé',
                        message: validation.reason
                    });
                }

                // Audit de l'accès cross-tenant
                if (targetTenantId) {
                    await auditCrossTenantAccess(req, tenantContext, targetTenantId);
                }

                logger.warn('Accès cross-tenant autorisé:', {
                    userId: tenantContext.userId,
                    sourceTenant: tenantContext.tenantId,
                    targetTenant: targetTenantId,
                    path: req.path,
                    method: req.method
                });
            }

            next();
        } catch (error) {
            logger.error('Erreur dans la validation cross-tenant:', error);
            return res.status(500).json({
                error: 'Erreur serveur',
                message: 'Erreur lors de la validation cross-tenant'
            });
        }
    };
};

/**
 * Middleware pour les utilisateurs ministériels (accès étendu)
 */
export const ministerialAccessMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenantContext = (req as any).tenantContext as TenantContext;

            if (!tenantContext) {
                return res.status(403).json({
                    error: 'Contexte tenant manquant',
                    message: 'Authentification tenant requise'
                });
            }

            // Vérifier si l'utilisateur est du ministère
            if (tenantContext.tenantType !== 'ministere') {
                return res.status(403).json({
                    error: 'Accès ministériel requis',
                    message: 'Cette opération est réservée aux utilisateurs du ministère'
                });
            }

            // Les utilisateurs ministériels ont accès à tous les tenants
            // Marquer la requête comme ayant un accès étendu
            (req as any).hasExtendedAccess = true;

            logger.debug('Accès ministériel accordé:', {
                userId: tenantContext.userId,
                tenantId: tenantContext.tenantId,
                path: req.path
            });

            next();
        } catch (error) {
            logger.error('Erreur dans le middleware d\'accès ministériel:', error);
            return res.status(500).json({
                error: 'Erreur serveur',
                message: 'Erreur lors de la validation d\'accès ministériel'
            });
        }
    };
};

/**
 * Middleware de filtrage automatique par tenant
 */
export const autoTenantFilterMiddleware = (options: {
    enabled?: boolean;
    strictMode?: boolean;
    allowBypass?: boolean;
} = {}) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (options.enabled === false) {
                return next();
            }

            const tenantContext = (req as any).tenantContext as TenantContext;
            const hasExtendedAccess = (req as any).hasExtendedAccess;

            if (!tenantContext) {
                return next(); // Laisser passer si pas de contexte tenant
            }

            // Bypass pour les utilisateurs avec accès étendu
            if (hasExtendedAccess && options.allowBypass !== false) {
                logger.debug('Filtrage tenant bypassé pour accès étendu');
                return next();
            }

            // Ajouter le filtre tenant aux paramètres de requête
            if (!req.query.tenantId && options.strictMode !== false) {
                req.query.tenantId = tenantContext.tenantId;
            }

            // Ajouter le filtre tenant au body pour les POST/PUT
            if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
                if (!req.body.tenantId) {
                    req.body.tenantId = tenantContext.tenantId;
                } else if (req.body.tenantId !== tenantContext.tenantId && !hasExtendedAccess) {
                    return res.status(403).json({
                        error: 'Tenant ID invalide',
                        message: 'Vous ne pouvez créer/modifier que des données de votre tenant'
                    });
                }
            }

            next();
        } catch (error) {
            logger.error('Erreur dans le filtrage automatique tenant:', error);
            return res.status(500).json({
                error: 'Erreur serveur',
                message: 'Erreur lors du filtrage tenant'
            });
        }
    };
};

/**
 * Middleware combiné pour l'isolation complète
 */
export const fullTenantIsolationMiddleware = (options: TenantIsolationOptions = {}) => {
    return [
        injectTenantIdMiddleware({
            ...options,
            injectTenantId: true,
            strictMode: true
        }),
        validateCrossTenantMiddleware(options),
        autoTenantFilterMiddleware({
            enabled: true,
            strictMode: options.strictMode,
            allowBypass: true
        })
    ];
};

/**
 * Injecter le tenant_id dans la requête
 */
async function injectTenantIdInRequest(req: Request, tenantContext: TenantContext): Promise<void> {
    try {
        // Ajouter aux headers pour les middlewares suivants
        req.headers['x-tenant-id'] = tenantContext.tenantId;
        req.headers['x-tenant-type'] = tenantContext.tenantType;

        // Ajouter aux paramètres si pas déjà présent
        if (!req.params.tenantId && req.method === 'GET') {
            (req.params as any).tenantId = tenantContext.tenantId;
        }

        logger.debug('Tenant ID injecté:', {
            tenantId: tenantContext.tenantId,
            method: req.method,
            path: req.path
        });
    } catch (error) {
        logger.error('Erreur injection tenant ID:', error);
    }
}

/**
 * Valider l'accès tenant avec support hiérarchique
 */
async function validateTenantAccess(
    req: Request,
    tenantContext: TenantContext,
    options: TenantIsolationOptions
): Promise<{
    allowed: boolean;
    reason?: string;
    isCrossTenant: boolean;
    targetTenantId?: string;
}> {
    try {
        const targetTenantId = extractTargetTenantId(req);
        const isCrossTenant = targetTenantId && targetTenantId !== tenantContext.tenantId;

        // Vérifier les rôles de bypass
        if (options.bypassRoles?.includes(tenantContext.userRole || '')) {
            return { allowed: true, isCrossTenant: !!isCrossTenant, targetTenantId };
        }

        // ========================================
        // VALIDATION HIÉRARCHIQUE (NOUVEAU)
        // ========================================

        // Si accès au même tenant, toujours autorisé
        if (!isCrossTenant) {
            return { allowed: true, isCrossTenant: false, targetTenantId: tenantContext.tenantId };
        }

        try {
            // Utiliser le service de hiérarchie pour valider l'accès
            const hierarchyService = getTenantHierarchyService();
            const canAccess = await hierarchyService.canAccessTenant(
                tenantContext.tenantId,
                targetTenantId!
            );

            if (canAccess) {
                logger.debug('Accès cross-tenant autorisé via hiérarchie:', {
                    userId: tenantContext.userId,
                    sourceTenant: tenantContext.tenantId,
                    targetTenant: targetTenantId,
                    tenantType: tenantContext.tenantType
                });
                return { allowed: true, isCrossTenant: true, targetTenantId };
            }
        } catch (hierarchyError) {
            logger.warn('Erreur lors de la vérification hiérarchique, fallback vers validation simple:', hierarchyError);

            // FALLBACK: Les utilisateurs du Ministère ont automatiquement accès cross-tenant
            if (tenantContext.tenantType === 'ministere') {
                logger.debug('Accès cross-tenant autorisé pour utilisateur ministériel (fallback):', {
                    userId: tenantContext.userId,
                    sourceTenant: tenantContext.tenantId,
                    targetTenant: targetTenantId
                });
                return { allowed: true, isCrossTenant: !!isCrossTenant, targetTenantId };
            }
        }

        // Si la hiérarchie n'autorise pas l'accès
        if (isCrossTenant && !options.allowCrossTenant) {
            return {
                allowed: false,
                reason: 'Accès cross-tenant non autorisé - vous ne pouvez accéder qu\'aux tenants de votre scope hiérarchique',
                isCrossTenant: true,
                targetTenantId
            };
        }

        // Validation des permissions requises
        if (options.requiredPermissions?.length) {
            logger.debug('Validation des permissions requises:', options.requiredPermissions);
            // TODO: Implémenter la validation des permissions via le service RBAC
        }

        return { allowed: true, isCrossTenant: !!isCrossTenant, targetTenantId };
    } catch (error) {
        logger.error('Erreur validation accès tenant:', error);
        return {
            allowed: false,
            reason: 'Erreur lors de la validation d\'accès',
            isCrossTenant: false
        };
    }
}

/**
 * Extraire le tenant ID cible de la requête
 */
function extractTargetTenantId(req: Request): string | undefined {
    // Import de la validation
    const { validateTenantId } = require('@/shared/utils/validation');

    // Essayer d'extraire le tenant ID de différentes sources
    const rawTenantId = req.params.tenantId ||
        req.body?.tenantId ||
        req.query.tenantId ||
        req.headers['x-target-tenant-id'];

    // Valider que c'est un UUID valide
    const validatedTenantId = validateTenantId(rawTenantId);

    return validatedTenantId || undefined;
}

/**
 * Auditer les accès cross-tenant
 */
async function auditCrossTenantAccess(
    req: Request,
    tenantContext: TenantContext,
    targetTenantId: string
): Promise<void> {
    try {
        await auditService.logResourceAccess(
            tenantContext.userId!,
            'cross_tenant_access',
            AuditAction.VIEW,
            targetTenantId,
            tenantContext.tenantId,
            req.ip,
            {
                sourceTenant: tenantContext.tenantId,
                targetTenant: targetTenantId,
                path: req.path,
                method: req.method,
                userAgent: req.get('User-Agent')
            }
        );
    } catch (error) {
        logger.error('Erreur audit accès cross-tenant:', error);
    }
}

/**
 * Intercepter la réponse pour filtrer les données par tenant
 */
function interceptResponseForTenantFiltering(
    req: Request,
    res: Response,
    tenantContext: TenantContext
): void {
    const originalSend = res.send;
    const hasExtendedAccess = (req as any).hasExtendedAccess;

    res.send = function (body: any) {
        try {
            // Ne pas filtrer si accès étendu
            if (hasExtendedAccess) {
                return originalSend.call(this, body);
            }

            // Filtrer les données de réponse par tenant
            const filteredBody = filterResponseByTenant(body, tenantContext.tenantId);
            return originalSend.call(this, filteredBody);
        } catch (error) {
            logger.error('Erreur filtrage réponse tenant:', error);
            return originalSend.call(this, body);
        }
    };
}

/**
 * Filtrer les données de réponse par tenant
 */
function filterResponseByTenant(data: any, tenantId: string): any {
    try {
        if (!data || typeof data !== 'object') {
            return data;
        }

        // Si c'est un tableau, filtrer chaque élément
        if (Array.isArray(data)) {
            return data.filter(item => {
                if (item && typeof item === 'object' && item.tenantId) {
                    return item.tenantId === tenantId;
                }
                return true; // Garder les éléments sans tenantId
            });
        }

        // Si c'est un objet avec une propriété data (format API standard)
        if (data.data) {
            return {
                ...data,
                data: filterResponseByTenant(data.data, tenantId)
            };
        }

        // Si l'objet a un tenantId, vérifier qu'il correspond
        if (data.tenantId && data.tenantId !== tenantId) {
            return null; // Filtrer cet objet
        }

        return data;
    } catch (error) {
        logger.error('Erreur lors du filtrage des données:', error);
        return data;
    }
}

/**
 * Middleware de développement pour logger les accès tenant
 */
export const tenantAccessLoggerMiddleware = () => {
    return (req: Request, res: Response, next: NextFunction) => {
        const tenantContext = (req as any).tenantContext as TenantContext;

        if (tenantContext) {
            logger.debug('Accès tenant:', {
                userId: tenantContext.userId,
                tenantId: tenantContext.tenantId,
                tenantType: tenantContext.tenantType,
                method: req.method,
                path: req.path,
                targetTenant: extractTargetTenantId(req),
                hasExtendedAccess: (req as any).hasExtendedAccess
            });
        }

        next();
    };
};

// Middlewares pré-configurés pour différents cas d'usage
export const strictTenantIsolation = fullTenantIsolationMiddleware({
    strictMode: true,
    allowCrossTenant: false,
    auditCrossTenant: true
});

export const flexibleTenantIsolation = fullTenantIsolationMiddleware({
    strictMode: false,
    allowCrossTenant: true,
    auditCrossTenant: true,
    bypassRoles: ['MINISTERE_ADMIN', 'MINISTERE_VIEWER']
});

export const ministerialTenantAccess = [
    injectTenantIdMiddleware({ strictMode: false }),
    ministerialAccessMiddleware(),
    autoTenantFilterMiddleware({ allowBypass: true })
];