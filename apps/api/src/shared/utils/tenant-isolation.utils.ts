/**
 * FICHIER: apps\api\src\shared\utils\tenant-isolation.utils.ts
 * UTILITAIRES: Utilitaires pour l'isolation multi-tenant
 * 
 * DESCRIPTION:
 * Utilitaires avancés pour l'isolation automatique des données par tenant
 * Helpers pour la validation, le filtrage et la transformation des données
 * 
 * FONCTIONNALITÉS:
 * - Filtrage automatique des requêtes par tenant
 * - Validation des données cross-tenant
 * - Transformation des réponses avec isolation
 * - Helpers pour les permissions tenant
 * - Utilitaires de debug et monitoring
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Request } from 'express';
import { SelectQueryBuilder, Repository } from 'typeorm';
import { TenantContext } from '@/shared/services/multi-tenant.service';
import { logger } from '@/shared/utils/logger';

/**
 * Interface pour les options de filtrage tenant
 */
export interface TenantFilterOptions {
  tenantField?: string;
  allowCrossTenant?: boolean;
  strictMode?: boolean;
  bypassForExtendedAccess?: boolean;
}

/**
 * Interface pour les résultats de validation tenant
 */
export interface TenantValidationResult {
  isValid: boolean;
  tenantId: string;
  isCrossTenant: boolean;
  hasPermission: boolean;
  reason?: string;
}

/**
 * Classe utilitaire pour l'isolation tenant
 */
export class TenantIsolationUtils {
  
  /**
   * Appliquer un filtre tenant automatique à une requête TypeORM
   */
  static applyTenantFilter<T extends Record<string, any>>(
    queryBuilder: SelectQueryBuilder<T>,
    tenantContext: TenantContext,
    options: TenantFilterOptions = {}
  ): SelectQueryBuilder<T> {
    try {
      const tenantField = options.tenantField || 'tenantId';
      const alias = queryBuilder.alias;

      // Ne pas appliquer le filtre si accès étendu et bypass autorisé
      if (options.bypassForExtendedAccess && tenantContext.tenantType === 'ministere') {
        logger.debug('Filtre tenant bypassé pour accès ministériel');
        return queryBuilder;
      }

      // Appliquer le filtre tenant
      queryBuilder.andWhere(`${alias}.${tenantField} = :tenantId`, {
        tenantId: tenantContext.tenantId
      });

      logger.debug('Filtre tenant appliqué:', {
        tenantId: tenantContext.tenantId,
        field: tenantField,
        alias
      });

      return queryBuilder;
    } catch (error) {
      logger.error('Erreur application filtre tenant:', error);
      return queryBuilder;
    }
  }

  /**
   * Créer un repository avec isolation tenant automatique
   */
  static createTenantAwareRepository<T extends Record<string, any>>(
    repository: Repository<T>,
    tenantContext: TenantContext,
    options: TenantFilterOptions = {}
  ): TenantAwareRepository<T> {
    return new TenantAwareRepository(repository, tenantContext, options);
  }

  /**
   * Valider les données d'entrée pour l'isolation tenant
   */
  static validateTenantData(
    data: any,
    tenantContext: TenantContext,
    options: TenantFilterOptions = {}
  ): TenantValidationResult {
    try {
      const tenantField = options.tenantField || 'tenantId';
      const dataTenantId = data[tenantField];

      // Si pas de tenant ID dans les données
      if (!dataTenantId) {
        return {
          isValid: !options.strictMode || false,
          tenantId: tenantContext.tenantId,
          isCrossTenant: false,
          hasPermission: true,
          reason: options.strictMode ? 'Tenant ID requis en mode strict' : undefined
        };
      }

      // Vérifier si c'est cross-tenant
      const isCrossTenant = dataTenantId !== tenantContext.tenantId;

      // Si cross-tenant et pas autorisé
      if (isCrossTenant && !options.allowCrossTenant) {
        return {
          isValid: false,
          tenantId: dataTenantId,
          isCrossTenant: true,
          hasPermission: false,
          reason: 'Accès cross-tenant non autorisé'
        };
      }

      // Vérifier les permissions pour cross-tenant
      const hasPermission = !isCrossTenant || 
                           tenantContext.tenantType === 'ministere' ||
                           options.allowCrossTenant;

      return {
        isValid: hasPermission || false,
        tenantId: dataTenantId,
        isCrossTenant,
        hasPermission: hasPermission || false,
        reason: hasPermission ? undefined : 'Permissions insuffisantes pour accès cross-tenant'
      };

    } catch (error) {
      logger.error('Erreur validation données tenant:', error);
      return {
        isValid: false,
        tenantId: tenantContext.tenantId,
        isCrossTenant: false,
        hasPermission: false,
        reason: 'Erreur lors de la validation'
      };
    }
  }

  /**
   * Filtrer un tableau de données par tenant
   */
  static filterDataByTenant<T extends Record<string, any>>(
    data: T[],
    tenantContext: TenantContext,
    options: TenantFilterOptions = {}
  ): T[] {
    try {
      const tenantField = options.tenantField || 'tenantId';

      // Bypass pour accès étendu
      if (options.bypassForExtendedAccess && tenantContext.tenantType === 'ministere') {
        return data;
      }

      return data.filter(item => {
        const itemTenantId = item[tenantField];
        
        // Garder les éléments sans tenant ID si pas en mode strict
        if (!itemTenantId && !options.strictMode) {
          return true;
        }

        // Filtrer par tenant
        return itemTenantId === tenantContext.tenantId;
      });

    } catch (error) {
      logger.error('Erreur filtrage données par tenant:', error);
      return data;
    }
  }

  /**
   * Injecter le tenant ID dans les données
   */
  static injectTenantId<T extends Record<string, any>>(
    data: T,
    tenantContext: TenantContext,
    options: TenantFilterOptions = {}
  ): T {
    try {
      const tenantField = options.tenantField || 'tenantId';

      // Ne pas écraser si déjà présent et différent (pour cross-tenant autorisé)
      if (data[tenantField] && options.allowCrossTenant) {
        return data;
      }

      // Injecter le tenant ID
      return {
        ...data,
        [tenantField]: tenantContext.tenantId
      };

    } catch (error) {
      logger.error('Erreur injection tenant ID:', error);
      return data;
    }
  }

  /**
   * Extraire le contexte tenant depuis une requête
   */
  static extractTenantContext(req: Request): TenantContext | null {
    return (req as any).tenantContext || null;
  }

  /**
   * Vérifier si l'utilisateur a un accès étendu
   */
  static hasExtendedAccess(req: Request): boolean {
    return !!(req as any).hasExtendedAccess;
  }

  /**
   * Créer des conditions WHERE pour l'isolation tenant
   */
  static createTenantWhereConditions(
    tenantContext: TenantContext,
    options: TenantFilterOptions = {}
  ): Record<string, any> {
    const tenantField = options.tenantField || 'tenantId';
    
    // Bypass pour accès étendu
    if (options.bypassForExtendedAccess && tenantContext.tenantType === 'ministere') {
      return {};
    }

    return {
      [tenantField]: tenantContext.tenantId
    };
  }

  /**
   * Transformer une réponse API avec isolation tenant
   */
  static transformApiResponse(
    response: any,
    tenantContext: TenantContext,
    options: TenantFilterOptions = {}
  ): any {
    try {
      if (!response || typeof response !== 'object') {
        return response;
      }

      // Si c'est un objet avec une propriété data
      if (response.data) {
        return {
          ...response,
          data: this.transformDataWithTenantIsolation(response.data, tenantContext, options)
        };
      }

      // Transformer directement
      return this.transformDataWithTenantIsolation(response, tenantContext, options);

    } catch (error) {
      logger.error('Erreur transformation réponse API:', error);
      return response;
    }
  }

  /**
   * Transformer les données avec isolation tenant
   */
  private static transformDataWithTenantIsolation(
    data: any,
    tenantContext: TenantContext,
    options: TenantFilterOptions
  ): any {
    // Bypass pour accès étendu
    if (options.bypassForExtendedAccess && tenantContext.tenantType === 'ministere') {
      return data;
    }

    // Si c'est un tableau
    if (Array.isArray(data)) {
      return this.filterDataByTenant(data, tenantContext, options);
    }

    // Si c'est un objet avec tenant ID
    if (data && typeof data === 'object') {
      const validation = this.validateTenantData(data, tenantContext, options);
      return validation.isValid ? data : null;
    }

    return data;
  }

  /**
   * Logger les accès tenant pour debug
   */
  static logTenantAccess(
    operation: string,
    tenantContext: TenantContext,
    details?: Record<string, any>
  ): void {
    logger.debug(`Accès tenant - ${operation}:`, {
      tenantId: tenantContext.tenantId,
      tenantType: tenantContext.tenantType,
      userId: tenantContext.userId,
      ...details
    });
  }

  /**
   * Créer un décorateur de méthode pour l'isolation tenant
   */
  static createTenantIsolationDecorator(options: TenantFilterOptions = {}) {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args: any[]) {
        const req = args.find(arg => arg && arg.user);
        
        if (req) {
          const tenantContext = TenantIsolationUtils.extractTenantContext(req);
          
          if (tenantContext) {
            TenantIsolationUtils.logTenantAccess(
              `${target.constructor.name}.${propertyKey}`,
              tenantContext,
              { method: req.method, path: req.path }
            );
          }
        }

        return originalMethod.apply(this, args);
      };
    };
  }
}

/**
 * Classe Repository avec isolation tenant automatique
 */
export class TenantAwareRepository<T extends Record<string, any>> {
  constructor(
    private repository: Repository<T>,
    private tenantContext: TenantContext,
    private options: TenantFilterOptions = {}
  ) {}

  /**
   * Find avec filtre tenant automatique
   */
  async find(options?: any): Promise<T[]> {
    const whereConditions = TenantIsolationUtils.createTenantWhereConditions(
      this.tenantContext,
      this.options
    );

    return this.repository.find({
      ...options,
      where: {
        ...whereConditions,
        ...(options?.where || {})
      }
    });
  }

  /**
   * FindOne avec filtre tenant automatique
   */
  async findOne(options?: any): Promise<T | null> {
    const whereConditions = TenantIsolationUtils.createTenantWhereConditions(
      this.tenantContext,
      this.options
    );

    return this.repository.findOne({
      ...options,
      where: {
        ...whereConditions,
        ...(options?.where || {})
      }
    });
  }

  /**
   * Save avec injection tenant automatique
   */
  async save(entity: T): Promise<T> {
    const entityWithTenant = TenantIsolationUtils.injectTenantId(
      entity,
      this.tenantContext,
      this.options
    );

    return this.repository.save(entityWithTenant);
  }

  /**
   * Create query builder avec filtre tenant
   */
  createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    const queryBuilder = this.repository.createQueryBuilder(alias);
    
    return TenantIsolationUtils.applyTenantFilter(
      queryBuilder,
      this.tenantContext,
      this.options
    );
  }

  /**
   * Count avec filtre tenant
   */
  async count(options?: any): Promise<number> {
    const whereConditions = TenantIsolationUtils.createTenantWhereConditions(
      this.tenantContext,
      this.options
    );

    return this.repository.count({
      ...options,
      where: {
        ...whereConditions,
        ...(options?.where || {})
      }
    });
  }

  /**
   * Delete avec validation tenant
   */
  async delete(criteria: any): Promise<any> {
    // Ajouter le filtre tenant aux critères de suppression
    const whereConditions = TenantIsolationUtils.createTenantWhereConditions(
      this.tenantContext,
      this.options
    );

    return this.repository.delete({
      ...whereConditions,
      ...criteria
    });
  }

  /**
   * Update avec validation tenant
   */
  async update(criteria: any, partialEntity: any): Promise<any> {
    // Ajouter le filtre tenant aux critères de mise à jour
    const whereConditions = TenantIsolationUtils.createTenantWhereConditions(
      this.tenantContext,
      this.options
    );

    return this.repository.update(
      {
        ...whereConditions,
        ...criteria
      },
      partialEntity
    );
  }
}

/**
 * Décorateurs utilitaires
 */

/**
 * Décorateur pour l'isolation tenant automatique sur les méthodes
 */
export const WithTenantIsolation = (options: TenantFilterOptions = {}) => {
  return TenantIsolationUtils.createTenantIsolationDecorator(options);
};

/**
 * Décorateur pour logger les accès tenant
 */
export const LogTenantAccess = (operation?: string) => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const req = args.find(arg => arg && arg.user);
      
      if (req) {
        const tenantContext = TenantIsolationUtils.extractTenantContext(req);
        
        if (tenantContext) {
          TenantIsolationUtils.logTenantAccess(
            operation || `${target.constructor.name}.${propertyKey}`,
            tenantContext,
            { 
              method: req.method, 
              path: req.path,
              timestamp: new Date().toISOString()
            }
          );
        }
      }

      return originalMethod.apply(this, args);
    };
  };
};

/**
 * Helpers pour les types TypeScript
 */
export type TenantAwareEntity<T> = T & { tenantId: string };
export type TenantFilteredResponse<T> = {
  data: T[];
  total: number;
  tenantId: string;
  filtered: boolean;
};

/**
 * Constantes utiles
 */
export const TENANT_ISOLATION_CONSTANTS = {
  DEFAULT_TENANT_FIELD: 'tenantId',
  MINISTERE_TENANT_TYPE: 'ministere',
  CROU_TENANT_TYPE: 'crou',
  EXTENDED_ACCESS_HEADER: 'x-extended-access',
  TENANT_CONTEXT_KEY: 'tenantContext'
} as const;