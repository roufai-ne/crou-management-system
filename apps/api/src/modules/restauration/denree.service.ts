/**
 * FICHIER: apps/api/src/modules/restauration/denree.service.ts
 * SERVICE: Denrée - Gestion des allocations de denrées
 *
 * DESCRIPTION:
 * Service pour la gestion des allocations de denrées aux restaurants
 * Intégration bidirectionnelle avec le module Stocks
 * Suivi des quantités allouées vs utilisées
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { StockDenree, AllocationStatus, TypeMouvementDenree } from '../../../../../packages/database/src/entities/StockDenree.entity';
import { Restaurant } from '../../../../../packages/database/src/entities/Restaurant.entity';
import { Stock } from '../../../../../packages/database/src/entities/Stock.entity';
import { Menu } from '../../../../../packages/database/src/entities/Menu.entity';
import { StocksService } from '../stocks/stocks.service';
import { MovementType } from '../../../../../packages/database/src/entities/StockMovement.entity';
import { Between, LessThan } from 'typeorm';
import { logger } from '@/shared/utils/logger';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface DenreeFilters {
  restaurantId?: string;
  stockId?: string;
  status?: AllocationStatus;
  dateDebut?: Date;
  dateFin?: Date;
  alerteExpiration?: boolean;
}

export interface AllouerDenreeDTO {
  restaurantId: string;
  stockId: string;
  menuId?: string;
  quantiteAllouee: number;
  dateExpiration?: Date;
  motifAllocation?: string;
  necessiteValidation?: boolean;
}

export interface UtiliserDenreeDTO {
  quantite: number;
  notes?: string;
}

// ========================================
// SERVICE
// ========================================

export class DenreeService {
  /**
   * Récupérer toutes les allocations avec filtres
   */
  static async getAllocations(tenantId: string, filters?: DenreeFilters) {
    try {
      logger.info('[DenreeService.getAllocations] Début - tenantId:', tenantId);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const denreeRepo = AppDataSource.getRepository(StockDenree);
      const queryBuilder = denreeRepo.createQueryBuilder('denree')
        .leftJoinAndSelect('denree.restaurant', 'restaurant')
        .leftJoinAndSelect('denree.stock', 'stock')
        .where('denree.tenantId = :tenantId', { tenantId });

      // Filtre par restaurant
      if (filters?.restaurantId) {
        queryBuilder.andWhere('denree.restaurantId = :restaurantId', { restaurantId: filters.restaurantId });
      }

      // Filtre par stock
      if (filters?.stockId) {
        queryBuilder.andWhere('denree.stockId = :stockId', { stockId: filters.stockId });
      }

      // Filtre par statut
      if (filters?.status) {
        queryBuilder.andWhere('denree.status = :status', { status: filters.status });
      }

      // Filtre par date d'allocation
      if (filters?.dateDebut && filters?.dateFin) {
        queryBuilder.andWhere(
          'denree.dateAllocation BETWEEN :dateDebut AND :dateFin',
          { dateDebut: filters.dateDebut, dateFin: filters.dateFin }
        );
      }

      // Filtre alertes expiration
      if (filters?.alerteExpiration) {
        queryBuilder.andWhere('denree.alerteExpiration = :alerte', { alerte: true });
      }

      const allocations = await queryBuilder
        .orderBy('denree.dateAllocation', 'DESC')
        .getMany();

      logger.info('[DenreeService.getAllocations] Allocations trouvées:', allocations.length);

      // Calcul statistiques
      const result = {
        allocations,
        total: allocations.length,
        allouees: allocations.filter(a => a.status === AllocationStatus.ALLOUEE).length,
        utilisees: allocations.filter(a => a.status === AllocationStatus.UTILISEE_TOTALEMENT).length,
        valeurTotale: allocations.reduce((sum, a) => sum + Number(a.valeurTotale || 0), 0),
        valeurRestante: allocations.reduce((sum, a) => {
          return sum + (Number(a.quantiteRestante || 0) * Number(a.prixUnitaire || 0));
        }, 0)
      };

      return result;
    } catch (error) {
      logger.error('[DenreeService.getAllocations] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Alias pour getAllocations (compatibilité contrôleur)
   */
  static async getDenrees(tenantId: string, filters?: DenreeFilters) {
    return this.getAllocations(tenantId, filters);
  }

  /**
   * Récupérer les denrées d'un restaurant spécifique
   */
  static async getDenreesRestaurant(restaurantId: string, tenantId: string) {
    return this.getAllocations(tenantId, { restaurantId });
  }

  /**
   * Allouer une denrée à un restaurant
   * INTÉGRATION CRITIQUE AVEC MODULE STOCKS
   */
  static async allouerDenree(
    tenantId: string,
    userId: string,
    data: AllouerDenreeDTO
  ) {
    try {
      logger.info('[DenreeService.allouerDenree] Allocation denrée');

      const denreeRepo = AppDataSource.getRepository(StockDenree);
      const restaurantRepo = AppDataSource.getRepository(Restaurant);
      const stockRepo = AppDataSource.getRepository(Stock);

      // Vérifier restaurant
      const restaurant = await restaurantRepo.findOne({
        where: { id: data.restaurantId, tenantId }
      });

      if (!restaurant) {
        throw new Error('Restaurant non trouvé');
      }

      // Vérifier stock et disponibilité
      const stock = await stockRepo.findOne({
        where: { id: data.stockId, tenantId }
      });

      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      if (stock.quantiteActuelle < data.quantiteAllouee) {
        throw new Error(`Stock insuffisant. Disponible: ${stock.quantiteActuelle} ${stock.unite}`);
      }

      // ========================================
      // ÉTAPE 1: Créer mouvement dans module Stocks
      // ========================================
      let stockMovementId: string | undefined;

      try {
        const movement = await StocksService.createMovement(tenantId, userId, {
          stockId: data.stockId,
          type: MovementType.SORTIE,
          quantite: data.quantiteAllouee,
          motif: data.motifAllocation || `Allocation restaurant ${restaurant.nom}`,
          destinataire: restaurant.nom,
          reference: `RESTO-${data.restaurantId}`,
          observation: 'Allocation denrée pour service restauration'
        });

        stockMovementId = movement.id;

        logger.info('[DenreeService.allouerDenree] Mouvement stock créé:', stockMovementId);
      } catch (stockError) {
        logger.error('[DenreeService.allouerDenree] ERREUR création mouvement stock:', stockError);
        throw new Error(`Erreur lors de la déduction du stock: ${stockError.message}`);
      }

      // ========================================
      // ÉTAPE 2: Créer allocation dans module Restauration
      // ========================================
      const newAllocation = denreeRepo.create({
        tenantId,
        restaurantId: data.restaurantId,
        stockId: data.stockId,
        menuId: data.menuId,
        nomDenree: stock.libelle,
        codeDenree: stock.code,
        unite: stock.unite,
        quantiteAllouee: data.quantiteAllouee,
        quantiteUtilisee: 0,
        quantiteRestante: data.quantiteAllouee,
        prixUnitaire: Number(stock.prixUnitaire || 0),
        valeurTotale: data.quantiteAllouee * Number(stock.prixUnitaire || 0),
        dateAllocation: new Date(),
        dateExpiration: data.dateExpiration,
        status: AllocationStatus.ALLOUEE,
        mouvementStockCree: true,
        stockMovementId,
        allouePar: userId,
        motifAllocation: data.motifAllocation,
        necessiteValidation: data.necessiteValidation || false,
        estValidee: !data.necessiteValidation, // Auto-validé si pas de validation requise
        valideePar: !data.necessiteValidation ? userId : undefined,
        dateValidation: !data.necessiteValidation ? new Date() : undefined,
        historiqueMouvements: [
          {
            date: new Date().toISOString(),
            type: TypeMouvementDenree.ALLOCATION,
            quantite: data.quantiteAllouee,
            quantiteRestante: data.quantiteAllouee,
            utilisateur: userId,
            notes: 'Allocation initiale'
          }
        ],
        createdBy: userId
      });

      const savedAllocation = await denreeRepo.save(newAllocation);

      logger.info('[DenreeService.allouerDenree] Allocation créée:', savedAllocation.id);

      // Vérifier alerte expiration
      await this.checkAlerteExpiration(savedAllocation);

      return savedAllocation;
    } catch (error) {
      logger.error('[DenreeService.allouerDenree] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Utiliser une partie d'une allocation
   */
  static async utiliserDenree(
    allocationId: string,
    tenantId: string,
    userId: string,
    data: UtiliserDenreeDTO
  ) {
    try {
      logger.info('[DenreeService.utiliserDenree] Utilisation denrée:', allocationId);

      const denreeRepo = AppDataSource.getRepository(StockDenree);

      const allocation = await denreeRepo.findOne({
        where: { id: allocationId, tenantId }
      });

      if (!allocation) {
        throw new Error('Allocation non trouvée');
      }

      // Vérifier quantité disponible
      if (allocation.quantiteRestante < data.quantite) {
        throw new Error(`Quantité insuffisante. Restant: ${allocation.quantiteRestante} ${allocation.unite}`);
      }

      // Mettre à jour quantités
      allocation.quantiteUtilisee += data.quantite;
      allocation.quantiteRestante -= data.quantite;
      allocation.valeurUtilisee = allocation.quantiteUtilisee * allocation.prixUnitaire;

      // Mettre à jour statut
      if (allocation.quantiteRestante === 0) {
        allocation.status = AllocationStatus.UTILISEE_TOTALEMENT;
      } else if (allocation.quantiteUtilisee > 0) {
        allocation.status = AllocationStatus.UTILISEE_PARTIELLEMENT;
      }

      // Dates utilisation
      if (!allocation.datePremiereUtilisation) {
        allocation.datePremiereUtilisation = new Date();
      }
      allocation.dateDerniereUtilisation = new Date();
      allocation.utiliseePar = userId;

      // Historique
      const historique = allocation.historiqueMouvements || [];
      historique.push({
        date: new Date().toISOString(),
        type: TypeMouvementDenree.UTILISATION,
        quantite: data.quantite,
        quantiteRestante: allocation.quantiteRestante,
        utilisateur: userId,
        notes: data.notes
      });
      allocation.historiqueMouvements = historique;

      allocation.updatedBy = userId;
      allocation.updatedAt = new Date();

      await denreeRepo.save(allocation);

      logger.info('[DenreeService.utiliserDenree] Denrée utilisée');

      return allocation;
    } catch (error) {
      logger.error('[DenreeService.utiliserDenree] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Retourner une denrée au stock central
   */
  static async retournerDenree(
    allocationId: string,
    tenantId: string,
    userId: string,
    quantite: number,
    motif: string
  ) {
    try {
      logger.info('[DenreeService.retournerDenree] Retour denrée:', allocationId);

      const denreeRepo = AppDataSource.getRepository(StockDenree);

      const allocation = await denreeRepo.findOne({
        where: { id: allocationId, tenantId }
      });

      if (!allocation) {
        throw new Error('Allocation non trouvée');
      }

      if (allocation.quantiteRestante < quantite) {
        throw new Error('Quantité à retourner supérieure au restant');
      }

      // Créer mouvement ENTRÉE dans module Stocks pour retour
      await StocksService.createMovement(tenantId, userId, {
        stockId: allocation.stockId,
        type: MovementType.ENTREE,
        quantite: quantite,
        motif: `Retour depuis restaurant - ${motif}`,
        reference: `RETOUR-${allocation.id}`,
        observation: 'Retour denrée non utilisée'
      });

      // Mettre à jour allocation
      allocation.quantiteRestante -= quantite;
      allocation.status = AllocationStatus.RETOURNEE;

      // Historique
      const historique = allocation.historiqueMouvements || [];
      historique.push({
        date: new Date().toISOString(),
        type: TypeMouvementDenree.RETOUR,
        quantite,
        quantiteRestante: allocation.quantiteRestante,
        utilisateur: userId,
        notes: motif
      });
      allocation.historiqueMouvements = historique;

      allocation.updatedBy = userId;
      allocation.updatedAt = new Date();

      await denreeRepo.save(allocation);

      logger.info('[DenreeService.retournerDenree] Denrée retournée');

      return allocation;
    } catch (error) {
      logger.error('[DenreeService.retournerDenree] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Enregistrer une perte/gaspillage
   */
  static async enregistrerPerte(
    allocationId: string,
    tenantId: string,
    userId: string,
    quantite: number,
    motif: string
  ) {
    try {
      logger.info('[DenreeService.enregistrerPerte] Enregistrement perte:', allocationId);

      const denreeRepo = AppDataSource.getRepository(StockDenree);

      const allocation = await denreeRepo.findOne({
        where: { id: allocationId, tenantId }
      });

      if (!allocation) {
        throw new Error('Allocation non trouvée');
      }

      // Mettre à jour allocation
      allocation.quantitePerdue = (allocation.quantitePerdue || 0) + quantite;
      allocation.valeurPerdue = allocation.quantitePerdue * allocation.prixUnitaire;
      allocation.quantiteRestante -= quantite;

      // Historique
      const historique = allocation.historiqueMouvements || [];
      historique.push({
        date: new Date().toISOString(),
        type: TypeMouvementDenree.PERTE,
        quantite,
        quantiteRestante: allocation.quantiteRestante,
        utilisateur: userId,
        notes: motif
      });
      allocation.historiqueMouvements = historique;

      allocation.updatedBy = userId;
      allocation.updatedAt = new Date();

      await denreeRepo.save(allocation);

      logger.info('[DenreeService.enregistrerPerte] Perte enregistrée');

      return allocation;
    } catch (error) {
      logger.error('[DenreeService.enregistrerPerte] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Obtenir les allocations d'un restaurant
   */
  static async getAllocationsByRestaurant(restaurantId: string, tenantId: string) {
    try {
      logger.info('[DenreeService.getAllocationsByRestaurant] Restaurant:', restaurantId);

      const denreeRepo = AppDataSource.getRepository(StockDenree);

      const allocations = await denreeRepo.find({
        where: { restaurantId, tenantId },
        relations: ['stock'],
        order: { dateAllocation: 'DESC' }
      });

      return {
        allocations,
        total: allocations.length,
        valeurTotale: allocations.reduce((sum, a) => sum + Number(a.valeurRestante || 0) * Number(a.quantiteRestante || 0), 0)
      };
    } catch (error) {
      logger.error('[DenreeService.getAllocationsByRestaurant] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Obtenir les alertes d'expiration
   */
  static async getAlertesExpiration(tenantId: string, joursAvant: number = 7) {
    try {
      logger.info('[DenreeService.getAlertesExpiration] Vérification alertes expiration');

      const denreeRepo = AppDataSource.getRepository(StockDenree);
      const dateLimite = new Date();
      dateLimite.setDate(dateLimite.getDate() + joursAvant);

      const allocations = await denreeRepo.find({
        where: {
          tenantId,
          status: AllocationStatus.ALLOUEE,
          dateExpiration: Between(new Date(), dateLimite)
        },
        relations: ['restaurant', 'stock'],
        order: { dateExpiration: 'ASC' }
      });

      logger.info('[DenreeService.getAlertesExpiration] Alertes trouvées:', allocations.length);

      return allocations;
    } catch (error) {
      logger.error('[DenreeService.getAlertesExpiration] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Vérifier et activer l'alerte expiration
   */
  private static async checkAlerteExpiration(allocation: StockDenree) {
    try {
      if (!allocation.dateExpiration) return;

      const now = new Date();
      const expiration = new Date(allocation.dateExpiration);
      const joursRestants = Math.ceil((expiration.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (joursRestants <= 7 && joursRestants > 0) {
        allocation.alerteExpiration = true;

        const denreeRepo = AppDataSource.getRepository(StockDenree);
        await denreeRepo.save(allocation);

        logger.warn('[DenreeService.checkAlerteExpiration] Alerte expiration activée:', allocation.id, 'Jours restants:', joursRestants);
      }
    } catch (error) {
      logger.error('[DenreeService.checkAlerteExpiration] ERREUR:', error);
    }
  }
}
