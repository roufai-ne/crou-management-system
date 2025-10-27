/**
 * FICHIER: apps\api\src\shared\services\multi-tenant.service.ts
 * SERVICE: Multi-Tenant - Isolation automatique des données par tenant
 * 
 * DESCRIPTION:
 * Service pour la gestion de l'isolation multi-tenant automatique
 * Filtrage automatique des données par tenant_id
 * Validation des accès cross-tenant
 * Utilitaires pour l'injection automatique du tenant_id
 * 
 * FONCTIONNALITÉS:
 * - Isolation automatique des données par tenant
 * - Validation des accès aux ressources par tenant
 * - Filtrage automatique par tenant_id
 * - Gestion des permissions cross-tenant (ministère)
 * - Utilitaires de requête avec isolation
 * - Cache des informations de tenant
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../../packages/database/src/config/typeorm.config';
import { Tenant, TenantType } from '../../../../../packages/database/src/entities/Tenant.entity';
import { User } from '../../../../../packages/database/src/entities/User.entity';
import { Repository, SelectQueryBuilder, ObjectLiteral } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export interface TenantContext {
  tenantId: string;
  tenantType: TenantType;
  tenantCode: string;
  userId?: string;
  userRole?: string;
}

export interface TenantAccessRule {
  allowCrossTenant: boolean;
  restrictedTenants?: string[];
  requiredRole?: string;
}

export interface QueryOptions {
  includeCrossTenant?: boolean;
  targetTenantId?: string;
  bypassTenantFilter?: boolean;
}

export class MultiTenantService {
  private tenantRepository = AppDataSource.getRepository(Tenant);
  private userRepository = AppDataSource.getRepository(User);
  private tenantCache = new Map<string, Tenant>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  /**
   * Obtenir le contexte tenant d'un utilisateur
   */
  async getTenantContext(userId: string): Promise<TenantContext | null> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
        relations: ['tenant', 'role']
      });

      if (!user || !user.tenant) {
        return null;
      }

      return {
        tenantId: user.tenant.id,
        tenantType: user.tenant.type,
        tenantCode: user.tenant.code,
        userId: user.id,
        userRole: user.role?.name
      };
    } catch (error) {
      logger.error('Erreur lors de la récupération du contexte tenant:', error);
      return null;
    }
  }

  /**
   * Valider l'accès à un tenant spécifique
   */
  async validateTenantAccess(
    userContext: TenantContext,
    targetTenantId: string,
    accessRules?: TenantAccessRule
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      // 1. Accès au même tenant toujours autorisé
      if (userContext.tenantId === targetTenantId) {
        return { allowed: true };
      }

      // 2. Vérifier si l'accès cross-tenant est autorisé
      if (!accessRules?.allowCrossTenant) {
        return {
          allowed: false,
          reason: 'Accès cross-tenant non autorisé pour cette ressource'
        };
      }

      // 3. Les utilisateurs du ministère peuvent accéder à tous les tenants
      if (userContext.tenantType === TenantType.MINISTERE) {
        return { allowed: true };
      }

      // 4. Vérifier les tenants restreints
      if (accessRules.restrictedTenants?.includes(targetTenantId)) {
        return {
          allowed: false,
          reason: 'Accès restreint à ce tenant'
        };
      }

      // 5. Vérifier le rôle requis
      if (accessRules.requiredRole && userContext.userRole !== accessRules.requiredRole) {
        return {
          allowed: false,
          reason: `Rôle ${accessRules.requiredRole} requis pour l'accès cross-tenant`
        };
      }

      return { allowed: true };
    } catch (error) {
      logger.error('Erreur lors de la validation d\'accès tenant:', error);
      return {
        allowed: false,
        reason: 'Erreur lors de la validation d\'accès'
      };
    }
  }

  /**
   * Appliquer le filtre tenant à un QueryBuilder
   */
  applyTenantFilter<T extends ObjectLiteral>(
    queryBuilder: SelectQueryBuilder<T>,
    tenantContext: TenantContext,
    options?: QueryOptions
  ): SelectQueryBuilder<T> {
    // Bypass du filtre si demandé (pour les super admins)
    if (options?.bypassTenantFilter) {
      return queryBuilder;
    }

    const alias = queryBuilder.alias;

    // Si un tenant cible est spécifié et l'accès cross-tenant est autorisé
    if (options?.targetTenantId && options?.includeCrossTenant) {
      if (tenantContext.tenantType === TenantType.MINISTERE) {
        queryBuilder.andWhere(`${alias}.tenantId = :targetTenantId`, {
          targetTenantId: options.targetTenantId
        });
      } else {
        // Pour les non-ministériels, limiter au tenant de l'utilisateur
        queryBuilder.andWhere(`${alias}.tenantId = :userTenantId`, {
          userTenantId: tenantContext.tenantId
        });
      }
    } else {
      // Filtre standard : limiter au tenant de l'utilisateur
      queryBuilder.andWhere(`${alias}.tenantId = :tenantId`, {
        tenantId: tenantContext.tenantId
      });
    }

    return queryBuilder;
  }

  /**
   * Créer un repository avec isolation tenant automatique
   */
  createTenantRepository<T extends ObjectLiteral>(
    entityClass: new () => T,
    tenantContext: TenantContext
  ): TenantRepository<T> {
    const repository = AppDataSource.getRepository(entityClass);
    return new TenantRepository(repository, tenantContext, this);
  }

  /**
   * Obtenir les informations d'un tenant (avec cache)
   */
  async getTenant(tenantId: string): Promise<Tenant | null> {
    try {
      // Vérifier le cache
      const cached = this.tenantCache.get(tenantId);
      if (cached && this.isCacheValid(cached)) {
        return cached;
      }

      // Récupérer depuis la base
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (tenant) {
        // Mettre en cache
        this.tenantCache.set(tenantId, tenant);
      }

      return tenant;
    } catch (error) {
      logger.error('Erreur lors de la récupération du tenant:', error);
      return null;
    }
  }

  /**
   * Obtenir tous les tenants accessibles par un utilisateur
   */
  async getAccessibleTenants(userContext: TenantContext): Promise<Tenant[]> {
    try {
      const queryBuilder = this.tenantRepository.createQueryBuilder('tenant');

      // Les utilisateurs du ministère peuvent voir tous les tenants
      if (userContext.tenantType === TenantType.MINISTERE) {
        queryBuilder.where('tenant.isActive = :isActive', { isActive: true });
      } else {
        // Les autres ne voient que leur tenant
        queryBuilder.where('tenant.id = :tenantId AND tenant.isActive = :isActive', {
          tenantId: userContext.tenantId,
          isActive: true
        });
      }

      return await queryBuilder.getMany();
    } catch (error) {
      logger.error('Erreur lors de la récupération des tenants accessibles:', error);
      return [];
    }
  }

  /**
   * Valider et injecter le tenant_id dans les données
   */
  injectTenantId<T extends Record<string, any>>(
    data: T,
    tenantContext: TenantContext,
    options?: { allowOverride?: boolean }
  ): T & { tenantId: string } {
    // Si tenant_id déjà présent et override non autorisé
    if (data.tenantId && !options?.allowOverride) {
      // Vérifier que c'est le bon tenant
      if (data.tenantId !== tenantContext.tenantId && 
          tenantContext.tenantType !== TenantType.MINISTERE) {
        throw new Error('Tentative d\'injection de tenant_id non autorisée');
      }
    }

    // Injecter le tenant_id
    return {
      ...data,
      tenantId: data.tenantId || tenantContext.tenantId
    };
  }

  /**
   * Nettoyer le cache des tenants
   */
  clearTenantCache(): void {
    this.tenantCache.clear();
    logger.debug('Cache des tenants nettoyé');
  }

  /**
   * Obtenir les statistiques du cache
   */
  getCacheStats(): { size: number; tenants: string[] } {
    return {
      size: this.tenantCache.size,
      tenants: Array.from(this.tenantCache.keys())
    };
  }

  /**
   * Vérifier si le cache est valide
   */
  private isCacheValid(tenant: Tenant): boolean {
    const now = Date.now();
    const cacheTime = tenant.updatedAt.getTime();
    return (now - cacheTime) < this.CACHE_TTL;
  }
}

/**
 * Repository avec isolation tenant automatique
 */
export class TenantRepository<T extends ObjectLiteral> {
  constructor(
    private repository: Repository<T>,
    private tenantContext: TenantContext,
    private multiTenantService: MultiTenantService
  ) {}

  /**
   * Find avec filtre tenant automatique
   */
  async find(options?: any): Promise<T[]> {
    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    // Appliquer le filtre tenant
    this.multiTenantService.applyTenantFilter(queryBuilder, this.tenantContext);
    
    // Appliquer les autres options
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
      });
    }
    
    if (options?.relations) {
      options.relations.forEach((relation: string) => {
        queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
      });
    }
    
    return await queryBuilder.getMany();
  }

  /**
   * FindOne avec filtre tenant automatique
   */
  async findOne(options?: any): Promise<T | null> {
    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    // Appliquer le filtre tenant
    this.multiTenantService.applyTenantFilter(queryBuilder, this.tenantContext);
    
    // Appliquer les conditions
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
      });
    }
    
    if (options?.relations) {
      options.relations.forEach((relation: string) => {
        queryBuilder.leftJoinAndSelect(`entity.${relation}`, relation);
      });
    }
    
    return await queryBuilder.getOne();
  }

  /**
   * Save avec injection tenant automatique
   */
  async save(entity: any): Promise<T> {
    // Injecter le tenant_id
    const entityWithTenant = this.multiTenantService.injectTenantId(
      entity,
      this.tenantContext
    );
    
    return await this.repository.save(entityWithTenant as any);
  }

  /**
   * Create avec injection tenant automatique
   */
  create(entityData: any): T {
    // Injecter le tenant_id
    const entityWithTenant = this.multiTenantService.injectTenantId(
      entityData,
      this.tenantContext
    );
    
    return this.repository.create(entityWithTenant);
  }

  /**
   * Count avec filtre tenant automatique
   */
  async count(options?: any): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    // Appliquer le filtre tenant
    this.multiTenantService.applyTenantFilter(queryBuilder, this.tenantContext);
    
    // Appliquer les conditions
    if (options?.where) {
      Object.entries(options.where).forEach(([key, value]) => {
        queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
      });
    }
    
    return await queryBuilder.getCount();
  }

  /**
   * Delete avec filtre tenant automatique
   */
  async delete(criteria: any): Promise<any> {
    const queryBuilder = this.repository.createQueryBuilder('entity');
    
    // Appliquer le filtre tenant
    this.multiTenantService.applyTenantFilter(queryBuilder, this.tenantContext);
    
    // Appliquer les critères
    Object.entries(criteria).forEach(([key, value]) => {
      queryBuilder.andWhere(`entity.${key} = :${key}`, { [key]: value });
    });
    
    return await queryBuilder.delete().execute();
  }

  /**
   * Accès au repository original (pour les cas spéciaux)
   */
  getOriginalRepository(): Repository<T> {
    return this.repository;
  }

  /**
   * Créer un QueryBuilder avec filtre tenant
   */
  createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    const queryBuilder = this.repository.createQueryBuilder(alias);
    return this.multiTenantService.applyTenantFilter(queryBuilder, this.tenantContext);
  }
}