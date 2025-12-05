/**
 * FICHIER: apps/api/src/modules/stocks/stocks.service.ts
 * SERVICE: Stocks - Gestion complète des stocks
 *
 * DESCRIPTION:
 * Service pour la gestion CRUD des stocks, mouvements, alertes et inventaires
 * Gestion automatique des alertes et des seuils
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Stock, StockStatus, StockType, StockCategory, StockUnit } from '../../../../../packages/database/src/entities/Stock.entity';
import { StockMovement, MovementType } from '../../../../../packages/database/src/entities/StockMovement.entity';
import { StockAlert, AlertType, AlertStatus } from '../../../../../packages/database/src/entities/StockAlert.entity';
import { Between, LessThan, MoreThan, Like } from 'typeorm';
import { logger } from '@/shared/utils/logger';

export interface StockFilters {
  search?: string;
  category?: StockCategory;
  type?: StockType;
  status?: StockStatus;
  lowStock?: boolean;
  outOfStock?: boolean;
}

export interface CreateStockDTO {
  code?: string; // Optionnel, sera généré automatiquement si absent
  libelle: string;
  description?: string;
  type?: StockType;
  category?: StockCategory;
  unit?: StockUnit;
  quantiteActuelle?: number;
  seuilMinimum?: number;
  seuilMaximum?: number;
  prixUnitaire?: number;
  emplacement?: string;
  fournisseur?: string;
}

export interface UpdateStockDTO {
  libelle?: string;
  description?: string;
  category?: StockCategory;
  seuilMinimum?: number;
  seuilMaximum?: number;
  prixUnitaire?: number;
  emplacement?: string;
  fournisseur?: string;
  status?: StockStatus;
}

export interface CreateMovementDTO {
  stockId: string;
  type: MovementType;
  quantite: number;
  motif: string;
  reference?: string;
  description?: string;
  destinataire?: string;
  observation?: string;
  prixUnitaire?: number;
  date?: string;
}

export class StocksService {
  /**
   * Récupérer tous les stocks avec filtres
   */
  static async getStocks(tenantId: string, filters?: StockFilters) {
    try {
      logger.info('[StocksService.getStocks] Début - tenantId:', tenantId);
      logger.info('[StocksService.getStocks] AppDataSource initialized:', AppDataSource.isInitialized);

      if (!AppDataSource.isInitialized) {
        throw new Error('AppDataSource non initialisé');
      }

      const stockRepo = AppDataSource.getRepository(Stock);
      logger.info('[StocksService.getStocks] Repository obtenu:', !!stockRepo);

      const queryBuilder = stockRepo.createQueryBuilder('stock')
        .where('stock.tenantId = :tenantId', { tenantId });

      logger.info('[StocksService.getStocks] QueryBuilder créé');

      // Recherche textuelle
      if (filters?.search) {
        queryBuilder.andWhere(
          '(stock.libelle ILIKE :search OR stock.code ILIKE :search OR stock.description ILIKE :search)',
          { search: `%${filters.search}%` }
        );
      }

      // Filtres par catégorie, type, statut
      if (filters?.category) {
        queryBuilder.andWhere('stock.category = :category', { category: filters.category });
      }

      if (filters?.type) {
        queryBuilder.andWhere('stock.type = :type', { type: filters.type });
      }

      if (filters?.status) {
        queryBuilder.andWhere('stock.status = :status', { status: filters.status });
      }

      // Filtre stock faible
      if (filters?.lowStock) {
        queryBuilder.andWhere('stock.quantiteActuelle < stock.seuilMinimum');
      }

      // Filtre rupture de stock
      if (filters?.outOfStock) {
        queryBuilder.andWhere('stock.quantiteActuelle = 0');
      }

      logger.info('[StocksService.getStocks] Exécution de la requête...');
      const stocks = await queryBuilder
        .orderBy('stock.libelle', 'ASC')
        .getMany();

      logger.info('[StocksService.getStocks] Requête réussie - stocks trouvés:', stocks.length);

      const result = {
        stocks,
        total: stocks.length,
        lowStockCount: stocks.filter(s => s.quantiteActuelle < s.seuilMinimum).length,
        outOfStockCount: stocks.filter(s => s.quantiteActuelle === 0).length,
        totalValue: stocks.reduce((sum, s) => {
          // Protection contre prixUnitaire null (P0 #1)
          const prix = s.prixUnitaire || 0;
          const quantite = s.quantiteActuelle || 0;
          return sum + (Number(prix) * Number(quantite));
        }, 0)
      };

      logger.info('[StocksService.getStocks] Résultat calculé:', result);
      return result;
    } catch (error) {
      logger.error('[StocksService.getStocks] ERREUR:', error);
      logger.error('[StocksService.getStocks] Stack:', error instanceof Error ? error.stack : 'N/A');
      throw error;
    }
  }

  /**
   * Récupérer un stock par ID
   */
  static async getStockById(stockId: string, tenantId: string) {
    try {
      const stockRepo = AppDataSource.getRepository(Stock);

      const stock = await stockRepo.findOne({
        where: { id: stockId, tenantId },
        relations: ['movements', 'alerts']
      });

      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      // Calculer les statistiques
      const movements = stock.movements || [];
      const recentMovements = movements.slice(0, 10);

      return {
        stock,
        statistics: {
          totalMovements: movements.length,
          lastMovementDate: movements[0]?.createdAt,
          totalEntries: movements.filter(m => m.type === MovementType.ENTREE).length,
          totalExits: movements.filter(m => m.type === MovementType.SORTIE).length,
          activeAlerts: stock.alerts?.filter(a => a.status !== AlertStatus.RESOLVED).length || 0
        },
        recentMovements
      };
    } catch (error) {
      logger.error('Erreur getStockById:', error);
      throw error;
    }
  }

  /**
   * Créer un nouveau stock
   */
  static async createStock(tenantId: string, userId: string, data: CreateStockDTO) {
    try {
      const stockRepo = AppDataSource.getRepository(Stock);

      // Générer un code automatiquement s'il n'est pas fourni
      let code = data.code;
      if (!code) {
        // Utiliser la catégorie ou un préfixe par défaut
        const category = data.category || 'GENERAL';
        const prefix = category.substring(0, 3).toUpperCase();
        const timestamp = Date.now().toString().slice(-6);
        code = `${prefix}-${timestamp}`;
        
        // Vérifier l'unicité et ajouter un suffixe si nécessaire
        let counter = 1;
        let finalCode = code;
        while (await stockRepo.findOne({ where: { code: finalCode, tenantId } })) {
          finalCode = `${code}-${counter}`;
          counter++;
        }
        code = finalCode;
      } else {
        // Vérifier si le code existe déjà
        const existing = await stockRepo.findOne({
          where: { code, tenantId }
        });

        if (existing) {
          throw new Error('Un stock avec ce code existe déjà');
        }
      }

      // Créer l'objet stock avec les valeurs définies
      const stockData: any = {
        code,
        libelle: data.libelle,
        type: data.type || StockType.MATERIEL,
        category: data.category || StockCategory.GENERAL,
        unit: data.unit || StockUnit.UNITE,
        quantiteActuelle: data.quantiteActuelle || 0,
        seuilMinimum: data.seuilMinimum || 0,
        seuilMaximum: data.seuilMaximum || 100,
        prixUnitaire: data.prixUnitaire || 0,
        tenantId,
        createdBy: userId,
        status: StockStatus.ACTIF
      };

      // Ajouter les champs optionnels seulement s'ils sont définis
      if (data.description) stockData.description = data.description;
      if (data.emplacement) stockData.emplacement = data.emplacement;
      if (data.fournisseur) stockData.fournisseur = data.fournisseur;

      const stock = stockRepo.create(stockData);

      await stockRepo.save(stock);

      // Créer une alerte si nécessaire
      await this.checkAndCreateAlert(stock, userId);

      return stock;
    } catch (error) {
      logger.error('Erreur createStock:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un stock
   */
  static async updateStock(stockId: string, tenantId: string, userId: string, data: UpdateStockDTO) {
    try {
      const stockRepo = AppDataSource.getRepository(Stock);

      const stock = await stockRepo.findOne({
        where: { id: stockId, tenantId }
      });

      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      // Mettre à jour les champs
      Object.assign(stock, {
        ...data,
        updatedBy: userId,
        updatedAt: new Date()
      });

      await stockRepo.save(stock);

      // Vérifier les alertes
      await this.checkAndCreateAlert(stock, userId);

      return stock;
    } catch (error) {
      logger.error('Erreur updateStock:', error);
      throw error;
    }
  }

  /**
   * Supprimer un stock
   */
  static async deleteStock(stockId: string, tenantId: string) {
    try {
      const stockRepo = AppDataSource.getRepository(Stock);

      const stock = await stockRepo.findOne({
        where: { id: stockId, tenantId }
      });

      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      // Soft delete - changer le statut au lieu de supprimer
      stock.status = StockStatus.OBSOLETE;
      await stockRepo.save(stock);

      return { success: true, message: 'Stock archivé avec succès' };
    } catch (error) {
      logger.error('Erreur deleteStock:', error);
      throw error;
    }
  }

  /**
   * Créer un mouvement de stock
   */
  static async createMovement(tenantId: string, userId: string, data: CreateMovementDTO) {
    try {
      const stockRepo = AppDataSource.getRepository(Stock);
      const movementRepo = AppDataSource.getRepository(StockMovement);

      const stock = await stockRepo.findOne({
        where: { id: data.stockId, tenantId }
      });

      if (!stock) {
        throw new Error('Stock non trouvé');
      }

      // Vérifier la quantité disponible pour les sorties
      if (data.type === MovementType.SORTIE && stock.quantiteActuelle < data.quantite) {
        throw new Error('Quantité insuffisante en stock');
      }

      // Créer le mouvement
      const movement = movementRepo.create({
        ...data,
        tenantId,
        createdBy: userId
      });

      await movementRepo.save(movement);

      // Mettre à jour la quantité du stock
      if (data.type === MovementType.ENTREE) {
        stock.quantiteActuelle += data.quantite;
      } else if (data.type === MovementType.SORTIE) {
        stock.quantiteActuelle -= data.quantite;
      }

      stock.updatedBy = userId;
      stock.updatedAt = new Date();
      await stockRepo.save(stock);

      // Vérifier et créer des alertes si nécessaire
      await this.checkAndCreateAlert(stock, userId);

      return { movement, stock };
    } catch (error) {
      logger.error('Erreur createMovement:', error);
      throw error;
    }
  }

  /**
   * Récupérer les mouvements
   */
  static async getMovements(tenantId: string, filters?: any) {
    try {
      const movementRepo = AppDataSource.getRepository(StockMovement);

      const queryBuilder = movementRepo.createQueryBuilder('movement')
        .leftJoinAndSelect('movement.stock', 'stock')
        .where('movement.tenantId = :tenantId', { tenantId });

      if (filters?.stockId) {
        queryBuilder.andWhere('movement.stockId = :stockId', { stockId: filters.stockId });
      }

      if (filters?.type) {
        queryBuilder.andWhere('movement.type = :type', { type: filters.type });
      }

      if (filters?.startDate && filters?.endDate) {
        queryBuilder.andWhere('movement.createdAt BETWEEN :startDate AND :endDate', {
          startDate: filters.startDate,
          endDate: filters.endDate
        });
      }

      const movements = await queryBuilder
        .orderBy('movement.createdAt', 'DESC')
        .take(filters?.limit || 100)
        .getMany();

      return {
        movements,
        total: movements.length
      };
    } catch (error) {
      logger.error('Erreur getMovements:', error);
      throw error;
    }
  }

  /**
   * Récupérer les alertes
   */
  static async getAlerts(tenantId: string, filters?: any) {
    try {
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const queryBuilder = alertRepo.createQueryBuilder('alert')
        .leftJoinAndSelect('alert.stock', 'stock')
        .where('alert.tenantId = :tenantId', { tenantId });

      if (filters?.status) {
        queryBuilder.andWhere('alert.status = :status', { status: filters.status });
      }

      if (filters?.type) {
        queryBuilder.andWhere('alert.type = :type', { type: filters.type });
      }

      // Par défaut, ne montrer que les alertes non résolues
      if (filters?.showResolved !== true) {
        queryBuilder.andWhere('alert.status != :resolved', { resolved: AlertStatus.RESOLVED });
      }

      const alerts = await queryBuilder
        .orderBy('alert.createdAt', 'DESC')
        .getMany();

      return {
        alerts,
        total: alerts.length,
        critical: alerts.filter(a => a.type === AlertType.RUPTURE).length,
        warning: alerts.filter(a => a.type === AlertType.SEUIL_MINIMUM).length
      };
    } catch (error) {
      logger.error('Erreur getAlerts:', error);
      throw error;
    }
  }

  /**
   * Résoudre une alerte
   */
  static async resolveAlert(alertId: string, tenantId: string, userId: string, note?: string) {
    try {
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const alert = await alertRepo.findOne({
        where: { id: alertId, tenantId }
      });

      if (!alert) {
        throw new Error('Alerte non trouvée');
      }

      alert.resolve(userId, note);
      await alertRepo.save(alert);

      return { success: true, message: 'Alerte résolue avec succès' };
    } catch (error) {
      logger.error('Erreur resolveAlert:', error);
      throw error;
    }
  }

  /**
   * Récupérer les KPIs des stocks
   */
  static async getStocksKPIs(tenantId: string) {
    try {
      const stockRepo = AppDataSource.getRepository(Stock);
      const movementRepo = AppDataSource.getRepository(StockMovement);
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const stocks = await stockRepo.find({ where: { tenantId } });

      const totalValue = stocks.reduce((sum, s) => {
        // Protection contre prixUnitaire null (P0 #1)
        const prix = s.prixUnitaire || 0;
        const quantite = s.quantiteActuelle || 0;
        return sum + (Number(prix) * Number(quantite));
      }, 0);
      const lowStockCount = stocks.filter(s => s.quantiteActuelle < s.seuilMinimum).length;
      const outOfStockCount = stocks.filter(s => s.quantiteActuelle === 0).length;

      // Mouvements des 30 derniers jours
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentMovements = await movementRepo.count({
        where: {
          tenantId,
          createdAt: MoreThan(thirtyDaysAgo)
        }
      });

      const activeAlerts = await alertRepo.count({
        where: {
          tenantId,
          status: AlertStatus.ACTIVE
        }
      });

      return {
        totalItems: stocks.length,
        totalValue,
        lowStockCount,
        outOfStockCount,
        recentMovementsCount: recentMovements,
        activeAlertsCount: activeAlerts,
        averageValue: stocks.length > 0 ? totalValue / stocks.length : 0
      };
    } catch (error) {
      logger.error('Erreur getStocksKPIs:', error);
      throw error;
    }
  }

  /**
   * Vérifier et créer une alerte si nécessaire
   */
  private static async checkAndCreateAlert(stock: Stock, userId: string) {
    try {
      const alertRepo = AppDataSource.getRepository(StockAlert);

      // Vérifier si une alerte active existe déjà
      const existingAlert = await alertRepo.findOne({
        where: {
          stockId: stock.id,
          status: AlertStatus.ACTIVE
        }
      });

      // Rupture de stock
      if (stock.quantiteActuelle === 0 && !existingAlert) {
        const alert = alertRepo.create({
          stockId: stock.id,
          tenantId: stock.tenantId,
          type: AlertType.RUPTURE,
          message: `Rupture de stock: ${stock.libelle}`,
          status: AlertStatus.ACTIVE,
          createdBy: userId
        });

        await alertRepo.save(alert);
      }
      // Stock en dessous du seuil minimum
      else if (stock.quantiteActuelle < stock.seuilMinimum && stock.quantiteActuelle > 0 && !existingAlert) {
        const alert = alertRepo.create({
          stockId: stock.id,
          tenantId: stock.tenantId,
          type: AlertType.SEUIL_MINIMUM,
          message: `Stock faible: ${stock.libelle} (${stock.quantiteActuelle}/${stock.seuilMinimum})`,
          status: AlertStatus.ACTIVE,
          createdBy: userId
        });

        await alertRepo.save(alert);
      }
      // Résoudre l'alerte si le stock est revenu à la normale
      else if (stock.quantiteActuelle >= stock.seuilMinimum && existingAlert) {
        existingAlert.resolve(userId, 'Stock réapprovisionné');
        await alertRepo.save(existingAlert);
      }
    } catch (error) {
      logger.error('Erreur checkAndCreateAlert:', error);
      // Ne pas faire échouer l'opération principale si la création d'alerte échoue
    }
  }
}
