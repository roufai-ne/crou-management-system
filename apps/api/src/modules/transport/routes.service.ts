/**
 * FICHIER: apps/api/src/modules/transport/routes.service.ts
 * SERVICE: RoutesService - Logique métier pour les itinéraires
 *
 * DESCRIPTION:
 * Service pour la gestion des itinéraires de transport
 * CRUD complet avec gestion des arrêts et statistiques
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { TransportRoute, RouteStatus } from '../../../../../packages/database/src/entities/TransportRoute.entity';
import { Repository } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export class RoutesService {
  private routeRepository: Repository<TransportRoute>;

  constructor() {
    this.routeRepository = AppDataSource.getRepository(TransportRoute);
  }

  /**
   * Récupérer tous les itinéraires
   */
  async getRoutes(
    tenantId: string,
    filters: {
      search?: string;
      status?: string;
      type?: string;
      page?: number;
      limit?: number;
    } = {}
  ) {
    try {
      const {
        search = '',
        status = 'all',
        type = 'all',
        page = 1,
        limit = 20
      } = filters;

      const query = this.routeRepository
        .createQueryBuilder('route')
        .where('route.tenantId = :tenantId', { tenantId });

      if (search) {
        query.andWhere(
          '(route.name ILIKE :search OR route.code ILIKE :search OR route.startLocation ILIKE :search OR route.endLocation ILIKE :search)',
          { search: `%${search}%` }
        );
      }

      if (status !== 'all') {
        query.andWhere('route.status = :status', { status });
      }

      if (type !== 'all') {
        query.andWhere('route.type = :type', { type });
      }

      const skip = (page - 1) * limit;
      query.skip(skip).take(limit).orderBy('route.createdAt', 'DESC');

      const [routes, total] = await query.getManyAndCount();

      return {
        success: true,
        data: routes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Erreur getRoutes:', error);
      throw new Error('Erreur lors de la récupération des itinéraires');
    }
  }

  /**
   * Récupérer un itinéraire par ID
   */
  async getRouteById(id: string, tenantId: string) {
    try {
      const route = await this.routeRepository.findOne({
        where: { id, tenantId },
        relations: ['scheduledTrips']
      });

      if (!route) {
        throw new Error('Itinéraire non trouvé');
      }

      return {
        success: true,
        data: route
      };
    } catch (error) {
      logger.error('Erreur getRouteById:', error);
      throw error;
    }
  }

  /**
   * Créer un nouvel itinéraire
   */
  async createRoute(data: any, tenantId: string, createdBy: string) {
    try {
      // Validation unicité code
      const existingByCode = await this.routeRepository.findOne({
        where: { code: data.code, tenantId }
      });
      if (existingByCode) {
        throw new Error('Un itinéraire avec ce code existe déjà');
      }

      const route = this.routeRepository.create({
        ...data,
        tenantId,
        createdBy,
        status: data.status || RouteStatus.ACTIF,
        isActive: true
      });

      const savedRoutes = await this.routeRepository.save(route);
      const savedRoute = Array.isArray(savedRoutes) ? savedRoutes[0] : savedRoutes;

      logger.info(`Itinéraire créé: ${savedRoute.id} par ${createdBy}`);

      return {
        success: true,
        message: 'Itinéraire créé avec succès',
        data: savedRoute
      };
    } catch (error) {
      logger.error('Erreur createRoute:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un itinéraire
   */
  async updateRoute(id: string, data: any, tenantId: string, updatedBy: string) {
    try {
      const route = await this.routeRepository.findOne({
        where: { id, tenantId }
      });

      if (!route) {
        throw new Error('Itinéraire non trouvé');
      }

      // Validation code si modifié
      if (data.code && data.code !== route.code) {
        const existingByCode = await this.routeRepository.findOne({
          where: { code: data.code, tenantId }
        });
        if (existingByCode && existingByCode.id !== id) {
          throw new Error('Un itinéraire avec ce code existe déjà');
        }
      }

      Object.assign(route, {
        ...data,
        updatedBy,
        updatedAt: new Date()
      });

      const updatedRoute = await this.routeRepository.save(route);

      logger.info(`Itinéraire mis à jour: ${id} par ${updatedBy}`);

      return {
        success: true,
        message: 'Itinéraire mis à jour avec succès',
        data: updatedRoute
      };
    } catch (error) {
      logger.error('Erreur updateRoute:', error);
      throw error;
    }
  }

  /**
   * Supprimer un itinéraire
   */
  async deleteRoute(id: string, tenantId: string) {
    try {
      const route = await this.routeRepository.findOne({
        where: { id, tenantId },
        relations: ['scheduledTrips']
      });

      if (!route) {
        throw new Error('Itinéraire non trouvé');
      }

      // Vérifier s'il y a des trajets programmés actifs
      if (route.scheduledTrips && route.scheduledTrips.length > 0) {
        throw new Error('Impossible de supprimer un itinéraire avec des trajets programmés. Supprimez d\'abord les trajets.');
      }

      await this.routeRepository.remove(route);

      logger.info(`Itinéraire supprimé: ${id}`);

      return {
        success: true,
        message: 'Itinéraire supprimé avec succès'
      };
    } catch (error) {
      logger.error('Erreur deleteRoute:', error);
      throw error;
    }
  }

  /**
   * Obtenir les itinéraires actifs
   */
  async getActiveRoutes(tenantId: string) {
    try {
      const routes = await this.routeRepository.find({
        where: {
          tenantId,
          status: RouteStatus.ACTIF,
          isActive: true
        }
      });

      return {
        success: true,
        data: routes
      };
    } catch (error) {
      logger.error('Erreur getActiveRoutes:', error);
      throw error;
    }
  }
}
