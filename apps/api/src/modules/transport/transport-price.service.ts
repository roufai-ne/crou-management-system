/**
 * FICHIER: apps/api/src/modules/transport/transport-price.service.ts
 * SERVICE: TransportPrice - Gestion des tarifs de tickets transport
 *
 * DESCRIPTION:
 * Service pour la gestion des tarifs configurables de tickets transport
 * CRUD complet + activation/désactivation
 * Support multi-tenant strict
 *
 * AUTEUR: Équipe CROU - Module Transport
 * DATE: Janvier 2025
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import {
  TransportTicketPrice,
  TicketPriceCategory
} from '../../../../../packages/database/src/entities/TransportTicketPrice.entity';
import { Not } from 'typeorm';
import { logger } from '@/shared/utils/logger';

// ========================================
// INTERFACES & TYPES
// ========================================

export interface CreateTransportPriceDTO {
  category: TicketPriceCategory;
  name: string;
  description?: string;
  amount: number;
  isDefault?: boolean;
  displayOrder?: number;
  conditions?: {
    requiresProof?: boolean;
    proofType?: string;
    validFrom?: string;
    validUntil?: string;
    maxTicketsPerPerson?: number;
    notes?: string;
  };
}

export interface UpdateTransportPriceDTO {
  name?: string;
  description?: string;
  amount?: number;
  isActive?: boolean;
  isDefault?: boolean;
  displayOrder?: number;
  conditions?: any;
}

// ========================================
// SERVICE
// ========================================

export class TransportPriceService {
  /**
   * Récupérer tous les tarifs actifs
   */
  static async getActivePrices(tenantId: string) {
    try {
      logger.info('[TransportPriceService.getActivePrices] Début - tenantId:', tenantId);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const prices = await priceRepo.find({
        where: { tenantId, isActive: true },
        order: { displayOrder: 'ASC', amount: 'ASC' }
      });

      // Filtrer seulement les tarifs valides actuellement
      const validPrices = prices.filter(p => p.isCurrentlyValid());

      logger.info('[TransportPriceService.getActivePrices] Tarifs actifs:', validPrices.length);

      return validPrices;
    } catch (error) {
      logger.error('[TransportPriceService.getActivePrices] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les tarifs (actifs et inactifs)
   */
  static async getAllPrices(tenantId: string) {
    try {
      logger.info('[TransportPriceService.getAllPrices] Début - tenantId:', tenantId);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const prices = await priceRepo.find({
        where: { tenantId },
        order: { displayOrder: 'ASC', isActive: 'DESC', amount: 'ASC' }
      });

      logger.info('[TransportPriceService.getAllPrices] Tarifs trouvés:', prices.length);

      return prices;
    } catch (error) {
      logger.error('[TransportPriceService.getAllPrices] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer un tarif par ID
   */
  static async getPriceById(priceId: string, tenantId: string) {
    try {
      logger.info('[TransportPriceService.getPriceById] ID:', priceId);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const price = await priceRepo.findOne({
        where: { id: priceId, tenantId }
      });

      if (!price) {
        throw new Error('Tarif introuvable');
      }

      return price;
    } catch (error) {
      logger.error('[TransportPriceService.getPriceById] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Récupérer le tarif par défaut
   */
  static async getDefaultPrice(tenantId: string) {
    try {
      logger.info('[TransportPriceService.getDefaultPrice] Début');

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const defaultPrice = await priceRepo.findOne({
        where: { tenantId, isDefault: true, isActive: true }
      });

      if (!defaultPrice) {
        // Si aucun tarif par défaut, retourner le premier tarif actif
        const prices = await this.getActivePrices(tenantId);
        return prices[0] || null;
      }

      return defaultPrice;
    } catch (error) {
      logger.error('[TransportPriceService.getDefaultPrice] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau tarif
   */
  static async createPrice(
    tenantId: string,
    userId: string,
    data: CreateTransportPriceDTO
  ) {
    try {
      logger.info('[TransportPriceService.createPrice] Création tarif:', data.name);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      // Validation montant
      if (data.amount < 0) {
        throw new Error('Le montant ne peut pas être négatif');
      }

      // Si isDefault, retirer le défaut des autres
      if (data.isDefault) {
        await priceRepo.update(
          { tenantId, isDefault: true },
          { isDefault: false }
        );
      }

      // Déterminer l'ordre d'affichage
      const displayOrder = data.displayOrder || 0;

      // Créer le tarif
      const newPrice = priceRepo.create({
        ...data,
        tenantId,
        displayOrder,
        isActive: true,
        totalTicketsIssued: 0,
        totalRevenue: 0,
        createdBy: userId
      });

      const savedPrice = await priceRepo.save(newPrice);

      logger.info('[TransportPriceService.createPrice] Tarif créé:', savedPrice.id);

      return savedPrice;
    } catch (error) {
      logger.error('[TransportPriceService.createPrice] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un tarif
   */
  static async updatePrice(
    priceId: string,
    tenantId: string,
    userId: string,
    data: UpdateTransportPriceDTO
  ) {
    try {
      logger.info('[TransportPriceService.updatePrice] Mise à jour tarif:', priceId);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const price = await priceRepo.findOne({
        where: { id: priceId, tenantId }
      });

      if (!price) {
        throw new Error('Tarif introuvable');
      }

      // Validation montant si modifié
      if (data.amount !== undefined && data.amount < 0) {
        throw new Error('Le montant ne peut pas être négatif');
      }

      // Si isDefault, retirer le défaut des autres
      if (data.isDefault) {
        await priceRepo.update(
          { tenantId, isDefault: true, id: Not(priceId) },
          { isDefault: false }
        );
      }

      // Mettre à jour les champs
      Object.assign(price, data);
      price.updatedBy = userId;
      price.updatedAt = new Date();

      const updatedPrice = await priceRepo.save(price);

      logger.info('[TransportPriceService.updatePrice] Tarif mis à jour');

      return updatedPrice;
    } catch (error) {
      logger.error('[TransportPriceService.updatePrice] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Désactiver un tarif
   */
  static async deactivatePrice(priceId: string, tenantId: string, userId: string) {
    try {
      logger.info('[TransportPriceService.deactivatePrice] Désactivation tarif:', priceId);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const price = await priceRepo.findOne({
        where: { id: priceId, tenantId }
      });

      if (!price) {
        throw new Error('Tarif introuvable');
      }

      if (price.isDefault) {
        throw new Error('Impossible de désactiver le tarif par défaut. Définissez d\'abord un autre tarif par défaut.');
      }

      price.isActive = false;
      price.updatedBy = userId;
      price.updatedAt = new Date();

      await priceRepo.save(price);

      logger.info('[TransportPriceService.deactivatePrice] Tarif désactivé');

      return price;
    } catch (error) {
      logger.error('[TransportPriceService.deactivatePrice] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Activer un tarif
   */
  static async activatePrice(priceId: string, tenantId: string, userId: string) {
    try {
      logger.info('[TransportPriceService.activatePrice] Activation tarif:', priceId);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const price = await priceRepo.findOne({
        where: { id: priceId, tenantId }
      });

      if (!price) {
        throw new Error('Tarif introuvable');
      }

      price.isActive = true;
      price.updatedBy = userId;
      price.updatedAt = new Date();

      await priceRepo.save(price);

      logger.info('[TransportPriceService.activatePrice] Tarif activé');

      return price;
    } catch (error) {
      logger.error('[TransportPriceService.activatePrice] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Supprimer un tarif (soft delete = désactivation)
   */
  static async deletePrice(priceId: string, tenantId: string, userId: string) {
    try {
      logger.info('[TransportPriceService.deletePrice] Suppression tarif:', priceId);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const price = await priceRepo.findOne({
        where: { id: priceId, tenantId }
      });

      if (!price) {
        throw new Error('Tarif introuvable');
      }

      // Vérifier si des tickets ont été émis avec ce tarif
      if (price.totalTicketsIssued > 0) {
        throw new Error(
          `Impossible de supprimer ce tarif. ${price.totalTicketsIssued} tickets ont été émis avec ce tarif. Désactivez-le plutôt.`
        );
      }

      if (price.isDefault) {
        throw new Error('Impossible de supprimer le tarif par défaut');
      }

      // Supprimer définitivement
      await priceRepo.remove(price);

      logger.info('[TransportPriceService.deletePrice] Tarif supprimé');

      return { success: true, message: 'Tarif supprimé avec succès' };
    } catch (error) {
      logger.error('[TransportPriceService.deletePrice] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Définir un tarif comme défaut
   */
  static async setAsDefault(priceId: string, tenantId: string, userId: string) {
    try {
      logger.info('[TransportPriceService.setAsDefault] Définir par défaut:', priceId);

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const price = await priceRepo.findOne({
        where: { id: priceId, tenantId }
      });

      if (!price) {
        throw new Error('Tarif introuvable');
      }

      if (!price.isActive) {
        throw new Error('Impossible de définir un tarif inactif comme défaut');
      }

      // Retirer le défaut des autres
      await priceRepo.update(
        { tenantId, isDefault: true },
        { isDefault: false }
      );

      // Définir comme défaut
      price.isDefault = true;
      price.updatedBy = userId;
      price.updatedAt = new Date();

      await priceRepo.save(price);

      logger.info('[TransportPriceService.setAsDefault] Tarif défini par défaut');

      return price;
    } catch (error) {
      logger.error('[TransportPriceService.setAsDefault] ERREUR:', error);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques des tarifs
   */
  static async getPriceStatistics(tenantId: string) {
    try {
      logger.info('[TransportPriceService.getPriceStatistics] Début');

      const priceRepo = AppDataSource.getRepository(TransportTicketPrice);

      const prices = await priceRepo.find({
        where: { tenantId },
        order: { totalRevenue: 'DESC' }
      });

      const totalTickets = prices.reduce((sum, p) => sum + p.totalTicketsIssued, 0);
      const totalRevenue = prices.reduce((sum, p) => sum + Number(p.totalRevenue), 0);

      return {
        prices: prices.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          amount: p.amount,
          totalTicketsIssued: p.totalTicketsIssued,
          totalRevenue: Number(p.totalRevenue),
          percentage: totalTickets > 0 ? (p.totalTicketsIssued / totalTickets) * 100 : 0,
          isActive: p.isActive,
          isDefault: p.isDefault
        })),
        summary: {
          totalPrices: prices.length,
          activePrices: prices.filter(p => p.isActive).length,
          totalTickets,
          totalRevenue,
          averagePrice: totalTickets > 0 ? totalRevenue / totalTickets : 0
        }
      };
    } catch (error) {
      logger.error('[TransportPriceService.getPriceStatistics] ERREUR:', error);
      throw error;
    }
  }
}
