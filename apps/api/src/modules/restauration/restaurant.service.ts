/**
 * FICHIER: apps/api/src/modules/restauration/restaurant.service.ts
 * SERVICE: Restaurant - Gestion des restaurants universitaires
 *
 * DESCRIPTION:
 * Service pour la gestion CRUD des restaurants (RU, cafétérias, cantines)
 * Gestion des capacités, horaires, tarifs et équipements
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Restaurant, RestaurantType, RestaurantStatus } from '../../../../../packages/database/src/entities/Restaurant.entity';
import { Like } from 'typeorm';
import { logger } from '@/shared/utils/logger';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface RestaurantFilters {
  search?: string;
  type?: RestaurantType;
  status?: RestaurantStatus;
  ville?: string;
}

export interface CreateRestaurantDTO {
  code: string;
  nom: string;
  description?: string;
  type: RestaurantType;
  adresse: string;
  ville?: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  capaciteTotal: number;
  nombrePlaces?: number;
  horaires?: {
    petitDejeuner?: { debut: string; fin: string };
    dejeuner?: { debut: string; fin: string };
    diner?: { debut: string; fin: string };
  };
  equipements?: string[];
  tarifPetitDejeuner?: number;
  tarifDejeuner?: number;
  tarifDiner?: number;
  responsableNom?: string;
  responsableTelephone?: string;
  responsableEmail?: string;
  notes?: string;
}

export interface UpdateRestaurantDTO {
  nom?: string;
  description?: string;
  adresse?: string;
  ville?: string;
  commune?: string;
  latitude?: number;
  longitude?: number;
  capaciteTotal?: number;
  nombrePlaces?: number;
  frequentationMoyenne?: number;
  horaires?: {
    petitDejeuner?: { debut: string; fin: string };
    dejeuner?: { debut: string; fin: string };
    diner?: { debut: string; fin: string };
  };
  equipements?: string[];
  status?: RestaurantStatus;
  isActif?: boolean;
  tarifPetitDejeuner?: number;
  tarifDejeuner?: number;
  tarifDiner?: number;
  responsableNom?: string;
  responsableTelephone?: string;
  responsableEmail?: string;
  notes?: string;
}

// ========================================
// SERVICE
// ========================================

export class RestaurantService {
  /**
   * Récupérer tous les restaurants avec filtres
   */
  static async getRestaurants(tenantId: string, filters?: RestaurantFilters) {
    try {
      logger.info('[RestaurantService.getRestaurants] Début - tenantId:', tenantId);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const queryBuilder = restaurantRepo.createQueryBuilder('restaurant')
        .where('restaurant.tenantId = :tenantId', { tenantId });

      // Recherche textuelle
      if (filters?.search) {
        queryBuilder.andWhere(
          '(restaurant.nom ILIKE :search OR restaurant.code ILIKE :search OR restaurant.adresse ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Filtres par type
      if (filters?.type) {
        queryBuilder.andWhere('restaurant.type = :type', { type: filters.type });
      }

      // Filtres par statut
      if (filters?.status) {
        queryBuilder.andWhere('restaurant.status = :status', { status: filters.status });
      }

      // Filtres par ville
      if (filters?.ville) {
        queryBuilder.andWhere('restaurant.ville ILIKE :ville', { ville: `%${filters.ville}%` });
      }

      const restaurants = await queryBuilder
        .orderBy('restaurant.nom', 'ASC')
        .getMany();

      logger.info('[RestaurantService.getRestaurants] Restaurants trouvés:', restaurants.length);

      // Calcul statistiques
      const result = {
        restaurants,
        total: restaurants.length,
        actifs: restaurants.filter(r => r.status === RestaurantStatus.ACTIF).length,
        capaciteTotale: restaurants.reduce((sum, r) => sum + r.capaciteTotal, 0),
        nombrePlacesTotal: restaurants.reduce((sum, r) => sum + r.nombrePlaces, 0),
        repartitionTypes: {
          universitaire: restaurants.filter(r => r.type === RestaurantType.UNIVERSITAIRE).length,
          cafeteria: restaurants.filter(r => r.type === RestaurantType.CAFETERIA).length,
          cantine: restaurants.filter(r => r.type === RestaurantType.CANTINE).length
        }
      };

      return result;
    } catch (error) {
      logger.error('[RestaurantService.getRestaurants] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer un restaurant par ID
   */
  static async getRestaurantById(restaurantId: string, tenantId: string) {
    try {
      logger.info('[RestaurantService.getRestaurantById] Récupération restaurant:', restaurantId);

      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const restaurant = await restaurantRepo.findOne({
        where: { id: restaurantId, tenantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      return restaurant;
    } catch (error) {
      logger.error('[RestaurantService.getRestaurantById] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau restaurant
   */
  static async createRestaurant(
    tenantId: string,
    userId: string,
    data: CreateRestaurantDTO
  ) {
    try {
      logger.info('[RestaurantService.createRestaurant] Création restaurant:', data.nom);

      const restaurantRepo = AppDataSource.getRepository(Restaurant);

      // Vérifier l'unicité du code
      const existingCode = await restaurantRepo.findOne({
        where: { code: data.code }
      });

      if (existingCode) {
        throw new Error(`Le code "${data.code}" est déjà utilisé`);
      }

      // Créer le restaurant
      const newRestaurant = restaurantRepo.create({
        ...data,
        tenantId,
        createdBy: userId,
        status: RestaurantStatus.ACTIF,
        isActif: true,
        nombrePlaces: data.nombrePlaces || 0,
        frequentationMoyenne: 0
      });

      const savedRestaurant = await restaurantRepo.save(newRestaurant);

      logger.info('[RestaurantService.createRestaurant] Restaurant créé:', savedRestaurant.id);

      return savedRestaurant;
    } catch (error) {
      logger.error('[RestaurantService.createRestaurant] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un restaurant
   */
  static async updateRestaurant(
    restaurantId: string,
    tenantId: string,
    userId: string,
    data: UpdateRestaurantDTO
  ) {
    try {
      logger.info('[RestaurantService.updateRestaurant] Mise à jour restaurant:', restaurantId);

      const restaurantRepo = AppDataSource.getRepository(Restaurant);

      // Vérifier l'existence et l'appartenance au tenant
      const restaurant = await restaurantRepo.findOne({
        where: { id: restaurantId, tenantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      // Appliquer les modifications
      Object.assign(restaurant, data);
      restaurant.updatedBy = userId;
      restaurant.updatedAt = new Date();

      const updatedRestaurant = await restaurantRepo.save(restaurant);

      logger.info('[RestaurantService.updateRestaurant] Restaurant mis à jour');

      return updatedRestaurant;
    } catch (error) {
      logger.error('[RestaurantService.updateRestaurant] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Supprimer un restaurant (soft delete)
   */
  static async deleteRestaurant(restaurantId: string, tenantId: string, userId: string) {
    try {
      logger.info('[RestaurantService.deleteRestaurant] Suppression restaurant:', restaurantId);

      const restaurantRepo = AppDataSource.getRepository(Restaurant);

      const restaurant = await restaurantRepo.findOne({
        where: { id: restaurantId, tenantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      // Soft delete: désactiver au lieu de supprimer
      restaurant.isActif = false;
      restaurant.status = RestaurantStatus.INACTIF;
      restaurant.updatedBy = userId;
      restaurant.updatedAt = new Date();

      await restaurantRepo.save(restaurant);

      logger.info('[RestaurantService.deleteRestaurant] Restaurant désactivé');

      return { success: true, message: 'Restaurant désactivé avec succès' };
    } catch (error) {
      logger.error('[RestaurantService.deleteRestaurant] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques d'un restaurant
   */
  static async getRestaurantStatistics(restaurantId: string, tenantId: string) {
    try {
      logger.info('[RestaurantService.getRestaurantStatistics] Statistiques restaurant:', restaurantId);

      const restaurantRepo = AppDataSource.getRepository(Restaurant);

      const restaurant = await restaurantRepo.findOne({
        where: { id: restaurantId, tenantId },
        relations: ['menus', 'repas']
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      // TODO: Calculer statistiques complètes quand menus et repas seront disponibles
      const statistics = {
        restaurantId: restaurant.id,
        nom: restaurant.nom,
        capaciteTotal: restaurant.capaciteTotal,
        nombrePlaces: restaurant.nombrePlaces,
        frequentationMoyenne: restaurant.frequentationMoyenne,
        tauxOccupation: restaurant.frequentationMoyenne > 0
          ? ((restaurant.frequentationMoyenne / restaurant.capaciteTotal) * 100).toFixed(2)
          : '0',
        menusActifs: 0, // À calculer depuis relation menus
        repasServis30Jours: 0, // À calculer depuis relation repas
        recettesMois: 0 // À calculer
      };

      return statistics;
    } catch (error) {
      logger.error('[RestaurantService.getRestaurantStatistics] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la fréquentation moyenne
   */
  static async updateFrequentationMoyenne(
    restaurantId: string,
    tenantId: string,
    frequentation: number
  ) {
    try {
      logger.info('[RestaurantService.updateFrequentationMoyenne] Mise à jour fréquentation');

      const restaurantRepo = AppDataSource.getRepository(Restaurant);

      const restaurant = await restaurantRepo.findOne({
        where: { id: restaurantId, tenantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      restaurant.frequentationMoyenne = frequentation;
      restaurant.updatedAt = new Date();

      await restaurantRepo.save(restaurant);

      logger.info('[RestaurantService.updateFrequentationMoyenne] Fréquentation mise à jour');

      return restaurant;
    } catch (error) {
      logger.error('[RestaurantService.updateFrequentationMoyenne] ERREUR:', error);
      throw error;
    }
  }
}
