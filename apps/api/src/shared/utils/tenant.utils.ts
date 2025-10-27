/**
 * FICHIER: apps\api\src\shared\utils\tenant.utils.ts
 * UTILS: Utilitaires pour la gestion multi-tenant
 * 
 * DESCRIPTION:
 * Utilitaires pour simplifier l'utilisation du système multi-tenant
 * Helpers pour les requêtes, validations et transformations
 * 
 * FONCTIONNALITÉS:
 * - Helpers pour les requêtes avec isolation tenant
 * - Validation des données avec tenant_id
 * - Transformation des réponses avec contexte tenant
 * - Utilitaires de filtrage automatique
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request } from 'express';
import { SelectQueryBuilder, Repository, ObjectLiteral } from 'typeorm';
import { MultiTenantService, TenantContext } from '@/shared/services/multi-tenant.service';
import { TenantType } from '../../../../../packages/database/src/entities/Tenant.entity';
import { logger } from '@/shared/utils/logger';

const multiTenantService = new MultiTenantService();

/**
 * Extraire le contexte tenant depuis une requête
 */
export function extractTenantContext(req: Request): TenantContext | null {
  return (req as any).tenantContext || null;
}

/**
 * Vérifier si un utilisateur peut accéder à un tenant
 */
export function canAccessTenant(
  userTenantId: string,
  userTenantType: TenantType,
  targetTenantId: string
): boolean {
  // Même tenant = accès autorisé
  if (userTenantId === targetTenantId) {
    return true;
  }

  // Ministère peut accéder à tous les tenants
  if (userTenantType === TenantType.MINISTERE) {
    return true;
  }

  return false;
}

/**
 * Appliquer le filtre tenant à un QueryBuilder
 */
export function applyTenantFilter<T extends ObjectLiteral>(
  queryBuilder: SelectQueryBuilder<T>,
  tenantId: string,
  options?: {
    alias?: string;
    fieldName?: string;
  }
): SelectQueryBuilder<T> {
  const alias = options?.alias || queryBuilder.alias;
  const fieldName = options?.fieldName || 'tenantId';
  
  queryBuilder.andWhere(`${alias}.${fieldName} = :tenantId`, { tenantId });
  
  return queryBuilder;
}

/**
 * Créer une condition WHERE pour l'isolation tenant
 */
export function createTenantWhereCondition(
  tenantId: string,
  fieldName: string = 'tenantId'
): Record<string, any> {
  return { [fieldName]: tenantId };
}

/**
 * Valider et nettoyer les données avec tenant_id
 */
export function validateAndCleanTenantData<T extends Record<string, any>>(
  data: T,
  userTenantId: string,
  userTenantType: TenantType,
  options?: {
    allowTenantOverride?: boolean;
    strictMode?: boolean;
  }
): T & { tenantId: string } {
  const result = { ...data };

  // Si tenant_id est fourni dans les données
  if ((data as any).tenantId) {
    // Vérifier si l'utilisateur peut définir ce tenant
    if (!canAccessTenant(userTenantId, userTenantType, (data as any).tenantId)) {
      if (options?.strictMode) {
        throw new Error(`Accès refusé au tenant ${(data as any).tenantId}`);
      } else {
        // Forcer le tenant de l'utilisateur
        (result as any).tenantId = userTenantId;
        logger.warn('Tenant_id forcé:', {
          original: (data as any).tenantId,
          forced: userTenantId,
          userTenantType
        });
      }
    }
  } else {
    // Injecter le tenant de l'utilisateur
    (result as any).tenantId = userTenantId;
  }

  return result as T & { tenantId: string };
}

/**
 * Transformer une réponse avec le contexte tenant
 */
export function transformResponseWithTenantContext<T>(
  data: T,
  tenantContext: TenantContext,
  options?: {
    includeTenantInfo?: boolean;
    includeAccessInfo?: boolean;
  }
): T & { _tenant?: any; _access?: any } {
  const result = { ...data } as any;

  if (options?.includeTenantInfo) {
    result._tenant = {
      id: tenantContext.tenantId,
      type: tenantContext.tenantType,
      code: tenantContext.tenantCode
    };
  }

  if (options?.includeAccessInfo) {
    result._access = {
      canCrossTenant: tenantContext.tenantType === TenantType.MINISTERE,
      userRole: tenantContext.userRole
    };
  }

  return result;
}

/**
 * Créer des options de requête avec isolation tenant
 */
export function createTenantQueryOptions(
  tenantContext: TenantContext,
  baseOptions?: any
): any {
  const tenantWhere = createTenantWhereCondition(tenantContext.tenantId);
  
  if (baseOptions?.where) {
    return {
      ...baseOptions,
      where: {
        ...baseOptions.where,
        ...tenantWhere
      }
    };
  }

  return {
    ...baseOptions,
    where: tenantWhere
  };
}

/**
 * Paginer des résultats avec isolation tenant
 */
export async function paginateWithTenant<T extends ObjectLiteral>(
  repository: Repository<T>,
  tenantContext: TenantContext,
  options: {
    page?: number;
    limit?: number;
    where?: any;
    relations?: string[];
    orderBy?: Record<string, 'ASC' | 'DESC'>;
  } = {}
): Promise<{
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> {
  const page = options.page || 1;
  const limit = options.limit || 10;
  const skip = (page - 1) * limit;

  const queryBuilder = repository.createQueryBuilder('entity');

  // Appliquer le filtre tenant
  applyTenantFilter(queryBuilder, tenantContext.tenantId);

  // Appliquer les conditions WHERE
  if (options.where) {
    Object.entries(options.where).forEach(([key, value]) => {
      queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
    });
  }

  // Appliquer les relations
  if (options.relations) {
    options.relations.forEach(relation => {
      queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
    });
  }

  // Appliquer l'ordre
  if (options.orderBy) {
    Object.entries(options.orderBy).forEach(([field, direction]) => {
      queryBuilder.addOrderBy(`entity.${field}`, direction);
    });
  }

  // Pagination
  queryBuilder.skip(skip).take(limit);

  const [data, total] = await queryBuilder.getManyAndCount();

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Créer un repository avec isolation tenant
 */
export function createTenantRepository<T extends ObjectLiteral>(
  entityClass: new () => T,
  tenantContext: TenantContext
) {
  return multiTenantService.createTenantRepository(entityClass, tenantContext);
}

/**
 * Middleware helper pour extraire le tenant depuis les paramètres
 */
export function extractTenantFromRequest(
  req: Request,
  sources: ('params' | 'body' | 'query')[] = ['params', 'body', 'query']
): string | null {
  for (const source of sources) {
    const tenantId = req[source]?.tenantId;
    if (tenantId) {
      return tenantId;
    }
  }
  return null;
}

/**
 * Valider l'accès cross-tenant avec logging
 */
export async function validateCrossTenantAccess(
  userContext: TenantContext,
  targetTenantId: string,
  operation: string
): Promise<boolean> {
  try {
    const validation = await multiTenantService.validateTenantAccess(
      userContext,
      targetTenantId,
      { allowCrossTenant: true }
    );

    logger.info('Validation accès cross-tenant:', {
      userId: userContext.userId,
      userTenant: userContext.tenantId,
      targetTenant: targetTenantId,
      operation,
      allowed: validation.allowed,
      reason: validation.reason
    });

    return validation.allowed;
  } catch (error) {
    logger.error('Erreur validation cross-tenant:', error);
    return false;
  }
}

/**
 * Créer des filtres de recherche avec tenant
 */
export function createTenantSearchFilters(
  tenantContext: TenantContext,
  searchParams: Record<string, any>
): Record<string, any> {
  const filters = { ...searchParams };
  
  // Toujours inclure le filtre tenant
  filters.tenantId = tenantContext.tenantId;
  
  // Nettoyer les paramètres vides
  Object.keys(filters).forEach(key => {
    if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
      delete filters[key];
    }
  });
  
  return filters;
}

/**
 * Formater une erreur d'accès tenant
 */
export function createTenantAccessError(
  operation: string,
  targetTenant?: string,
  reason?: string
): {
  error: string;
  message: string;
  details?: any;
} {
  return {
    error: 'Accès tenant refusé',
    message: `Accès refusé pour l'opération: ${operation}`,
    details: {
      targetTenant,
      reason: reason || 'Permissions insuffisantes'
    }
  };
}

/**
 * Logger les opérations tenant
 */
export function logTenantOperation(
  operation: string,
  tenantContext: TenantContext,
  details?: Record<string, any>
): void {
  logger.info('Opération tenant:', {
    operation,
    userId: tenantContext.userId,
    tenantId: tenantContext.tenantId,
    tenantType: tenantContext.tenantType,
    userRole: tenantContext.userRole,
    ...details
  });
}

/**
 * Vérifier si un tenant est actif
 */
export async function isTenantActive(tenantId: string): Promise<boolean> {
  try {
    const tenant = await multiTenantService.getTenant(tenantId);
    return tenant?.isActive || false;
  } catch (error) {
    logger.error('Erreur vérification tenant actif:', error);
    return false;
  }
}