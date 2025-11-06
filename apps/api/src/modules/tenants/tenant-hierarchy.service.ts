/**
 * FICHIER: apps/api/src/modules/tenants/tenant-hierarchy.service.ts
 * SERVICE: Gestion de la hiérarchie des tenants
 *
 * DESCRIPTION:
 * Service pour gérer la structure hiérarchique à 3 niveaux:
 * - Niveau 0: Ministère (global)
 * - Niveau 1: CROU (régional)
 * - Niveau 2: Services (opérationnel)
 *
 * FONCTIONNALITÉS:
 * - Récupération des descendants (enfants récursifs)
 * - Récupération des ancêtres (parents jusqu'à la racine)
 * - Calcul du scope d'accès (tenants accessibles)
 * - Vérification de l'appartenance hiérarchique
 * - Gestion du path matérialisé
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource, Repository, In } from 'typeorm';
import { Tenant, TenantType } from '../../../../../packages/database/src/entities/Tenant.entity';
import { logger } from '@/shared/utils/logger';

export interface TenantAccessScope {
  tenantId: string;
  accessibleTenantIds: string[];
  level: number;
  type: TenantType;
  canAccessAll: boolean;
}

export interface HierarchyNode {
  id: string;
  name: string;
  code: string;
  type: TenantType;
  level: number;
  path: string;
  parentId: string | null;
  children?: HierarchyNode[];
}

export class TenantHierarchyService {
  private tenantRepository: Repository<Tenant>;
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
    this.tenantRepository = dataSource.getRepository(Tenant);
  }

  /**
   * Récupérer tous les descendants d'un tenant
   * Utilise le path matérialisé pour une requête efficace
   */
  async getDescendants(tenantId: string): Promise<Tenant[]> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantId} non trouvé`);
      }

      // Tous les tenants dont le path commence par "parent.path/"
      const descendants = await this.tenantRepository
        .createQueryBuilder('tenant')
        .where('tenant.path LIKE :pathPattern', {
          pathPattern: `${tenant.path}/%`
        })
        .orderBy('tenant.level', 'ASC')
        .addOrderBy('tenant.name', 'ASC')
        .getMany();

      logger.debug('Descendants récupérés:', {
        tenantId,
        tenantPath: tenant.path,
        count: descendants.length
      });

      return descendants;
    } catch (error) {
      logger.error('Erreur getDescendants:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les ancêtres d'un tenant jusqu'à la racine
   */
  async getAncestors(tenantId: string): Promise<Tenant[]> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantId} non trouvé`);
      }

      // Extraire les segments du path pour trouver les ancêtres
      const pathSegments = tenant.path.split('/');
      const ancestors: Tenant[] = [];

      // Pour chaque niveau, construire le path et trouver le tenant
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const ancestorPath = pathSegments.slice(0, i + 1).join('/');
        const ancestor = await this.tenantRepository.findOne({
          where: { path: ancestorPath }
        });

        if (ancestor) {
          ancestors.push(ancestor);
        }
      }

      logger.debug('Ancêtres récupérés:', {
        tenantId,
        tenantPath: tenant.path,
        count: ancestors.length
      });

      return ancestors;
    } catch (error) {
      logger.error('Erreur getAncestors:', error);
      throw error;
    }
  }

  /**
   * Calculer le scope d'accès pour un tenant
   * Retourne tous les IDs de tenants accessibles selon la hiérarchie
   */
  async getAccessScope(tenantId: string): Promise<TenantAccessScope> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId }
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantId} non trouvé`);
      }

      let accessibleTenantIds: string[] = [tenantId];
      let canAccessAll = false;

      // Niveau 0 (Ministère): Accès à tous les tenants
      if (tenant.level === 0 && tenant.type === TenantType.MINISTERE) {
        const allTenants = await this.tenantRepository.find({
          select: ['id']
        });
        accessibleTenantIds = allTenants.map(t => t.id);
        canAccessAll = true;
      }
      // Niveau 1 (CROU): Accès à ses services (descendants directs)
      else if (tenant.level === 1 && tenant.type === TenantType.CROU) {
        const descendants = await this.getDescendants(tenantId);
        accessibleTenantIds.push(...descendants.map(d => d.id));
      }
      // Niveau 2 (Service): Accès uniquement à lui-même
      else if (tenant.level === 2 && tenant.type === TenantType.SERVICE) {
        // Déjà défini: accessibleTenantIds = [tenantId]
      }

      logger.debug('Access scope calculé:', {
        tenantId,
        level: tenant.level,
        type: tenant.type,
        accessibleCount: accessibleTenantIds.length,
        canAccessAll
      });

      return {
        tenantId,
        accessibleTenantIds,
        level: tenant.level,
        type: tenant.type,
        canAccessAll
      };
    } catch (error) {
      logger.error('Erreur getAccessScope:', error);
      throw error;
    }
  }

  /**
   * Vérifier si un tenant peut accéder à un autre tenant
   */
  async canAccessTenant(
    sourceTenantId: string,
    targetTenantId: string
  ): Promise<boolean> {
    try {
      // Si c'est le même tenant, accès autorisé
      if (sourceTenantId === targetTenantId) {
        return true;
      }

      const accessScope = await this.getAccessScope(sourceTenantId);
      const canAccess = accessScope.accessibleTenantIds.includes(targetTenantId);

      logger.debug('Vérification accès tenant:', {
        sourceTenantId,
        targetTenantId,
        canAccess,
        sourceLevel: accessScope.level,
        sourceType: accessScope.type
      });

      return canAccess;
    } catch (error) {
      logger.error('Erreur canAccessTenant:', error);
      return false;
    }
  }

  /**
   * Récupérer l'arbre hiérarchique complet à partir d'un tenant
   */
  async getHierarchyTree(rootTenantId: string): Promise<HierarchyNode> {
    try {
      const rootTenant = await this.tenantRepository.findOne({
        where: { id: rootTenantId }
      });

      if (!rootTenant) {
        throw new Error(`Tenant ${rootTenantId} non trouvé`);
      }

      // Récupérer tous les descendants
      const descendants = await this.getDescendants(rootTenantId);

      // Construire le nœud racine
      const rootNode: HierarchyNode = {
        id: rootTenant.id,
        name: rootTenant.name,
        code: rootTenant.code,
        type: rootTenant.type,
        level: rootTenant.level,
        path: rootTenant.path,
        parentId: rootTenant.parentId,
        children: []
      };

      // Construire l'arbre récursivement
      const buildTree = (parentNode: HierarchyNode, allDescendants: Tenant[]) => {
        const children = allDescendants.filter(d => d.parentId === parentNode.id);

        parentNode.children = children.map(child => {
          const childNode: HierarchyNode = {
            id: child.id,
            name: child.name,
            code: child.code,
            type: child.type,
            level: child.level,
            path: child.path,
            parentId: child.parentId,
            children: []
          };

          buildTree(childNode, allDescendants);
          return childNode;
        });
      };

      buildTree(rootNode, descendants);

      logger.debug('Arbre hiérarchique construit:', {
        rootTenantId,
        totalNodes: 1 + descendants.length
      });

      return rootNode;
    } catch (error) {
      logger.error('Erreur getHierarchyTree:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les tenants d'un niveau spécifique
   */
  async getTenantsByLevel(level: number): Promise<Tenant[]> {
    try {
      const tenants = await this.tenantRepository.find({
        where: { level },
        order: { name: 'ASC' }
      });

      logger.debug('Tenants récupérés par niveau:', {
        level,
        count: tenants.length
      });

      return tenants;
    } catch (error) {
      logger.error('Erreur getTenantsByLevel:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les tenants d'un type spécifique
   */
  async getTenantsByType(type: TenantType): Promise<Tenant[]> {
    try {
      const tenants = await this.tenantRepository.find({
        where: { type },
        order: { level: 'ASC', name: 'ASC' }
      });

      logger.debug('Tenants récupérés par type:', {
        type,
        count: tenants.length
      });

      return tenants;
    } catch (error) {
      logger.error('Erreur getTenantsByType:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour le path d'un tenant et de tous ses descendants
   */
  async updateTenantPath(tenantId: string, newParentId: string | null): Promise<void> {
    try {
      const tenant = await this.tenantRepository.findOne({
        where: { id: tenantId },
        relations: ['parent']
      });

      if (!tenant) {
        throw new Error(`Tenant ${tenantId} non trouvé`);
      }

      const oldPath = tenant.path;

      // Calculer le nouveau path
      let newPath: string;
      let newLevel: number;

      if (newParentId) {
        const newParent = await this.tenantRepository.findOne({
          where: { id: newParentId }
        });

        if (!newParent) {
          throw new Error(`Parent ${newParentId} non trouvé`);
        }

        newPath = `${newParent.path}/${tenant.code}`;
        newLevel = newParent.level + 1;
      } else {
        newPath = tenant.code;
        newLevel = 0;
      }

      // Mettre à jour le tenant
      await this.tenantRepository.update(tenantId, {
        parentId: newParentId,
        path: newPath,
        level: newLevel
      });

      // Mettre à jour tous les descendants
      const descendants = await this.tenantRepository
        .createQueryBuilder('tenant')
        .where('tenant.path LIKE :pathPattern', {
          pathPattern: `${oldPath}/%`
        })
        .getMany();

      for (const descendant of descendants) {
        const updatedPath = descendant.path.replace(oldPath, newPath);
        const updatedLevel = updatedPath.split('/').length - 1;

        await this.tenantRepository.update(descendant.id, {
          path: updatedPath,
          level: updatedLevel
        });
      }

      logger.info('Path mis à jour:', {
        tenantId,
        oldPath,
        newPath,
        descendantsUpdated: descendants.length
      });
    } catch (error) {
      logger.error('Erreur updateTenantPath:', error);
      throw error;
    }
  }

  /**
   * Récupérer le tenant Ministère (root)
   */
  async getMinistere(): Promise<Tenant | null> {
    try {
      const ministere = await this.tenantRepository.findOne({
        where: {
          type: TenantType.MINISTERE,
          level: 0
        }
      });

      return ministere;
    } catch (error) {
      logger.error('Erreur getMinistere:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les CROU (niveau 1)
   */
  async getAllCROUs(): Promise<Tenant[]> {
    try {
      const crous = await this.tenantRepository.find({
        where: {
          type: TenantType.CROU,
          level: 1
        },
        order: { name: 'ASC' }
      });

      return crous;
    } catch (error) {
      logger.error('Erreur getAllCROUs:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les services d'un CROU
   */
  async getServicesOfCROU(crouId: string): Promise<Tenant[]> {
    try {
      const services = await this.tenantRepository.find({
        where: {
          parentId: crouId,
          type: TenantType.SERVICE,
          level: 2
        },
        order: { name: 'ASC' }
      });

      return services;
    } catch (error) {
      logger.error('Erreur getServicesOfCROU:', error);
      throw error;
    }
  }
}
