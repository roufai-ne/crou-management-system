/**
 * FICHIER: apps/api/src/modules/dashboard/dashboard.service.ts
 * SERVICE: Dashboard - Agrégation des données
 *
 * DESCRIPTION:
 * Service d'agrégation des données depuis tous les modules
 * Calcul des KPIs, statistiques et métriques globales
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Budget } from '../../../../../packages/database/src/entities/Budget.entity';
import { Transaction } from '../../../../../packages/database/src/entities/Transaction.entity';
import { Housing } from '../../../../../packages/database/src/entities/Housing.entity';
import { HousingOccupancy, OccupancyStatus } from '../../../../../packages/database/src/entities/HousingOccupancy.entity';
import { Stock } from '../../../../../packages/database/src/entities/Stock.entity';
import { StockAlert } from '../../../../../packages/database/src/entities/StockAlert.entity';
import { AuditLog } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { Between, LessThan, MoreThan } from 'typeorm';

export class DashboardService {
  /**
   * Récupérer les KPIs globaux du système
   */
  static async getGlobalKPIs(tenantId: string, startDate?: Date, endDate?: Date) {
    try {
      const budgetRepo = AppDataSource.getRepository(Budget);
      const housingRepo = AppDataSource.getRepository(Housing);
      const occupancyRepo = AppDataSource.getRepository(HousingOccupancy);
      const stockRepo = AppDataSource.getRepository(Stock);
      const alertRepo = AppDataSource.getRepository(StockAlert);

      // Filtre de date
      const dateFilter = startDate && endDate
        ? { createdAt: Between(startDate, endDate) }
        : {};

      // 1. Budget Total et Exécuté
      const budgets = await budgetRepo.find({
        where: { tenantId, ...dateFilter }
      });

      const totalBudget = budgets.reduce((sum, b) => sum + b.montantInitial, 0);
      const executedBudget = budgets.reduce((sum, b) => sum + b.montantRealise, 0);
      const executionRate = totalBudget > 0 ? (executedBudget / totalBudget) * 100 : 0;

      // 2. Logements et Occupation
      const housings = await housingRepo.find({
        where: { tenantId },
        relations: ['occupancies']
      });

      const totalCapacity = housings.reduce((sum, h) => sum + h.capaciteTotale, 0);
      const occupiedPlaces = housings.reduce((sum, h) => sum + h.occupationActuelle, 0);
      const occupancyRate = totalCapacity > 0 ? (occupiedPlaces / totalCapacity) * 100 : 0;

      // 3. Valeur totale des stocks
      const stocks = await stockRepo.find({
        where: { tenantId }
      });

      const stockValue = stocks.reduce((sum, s) => sum + (s.prixUnitaire * s.quantiteActuelle), 0);

      // 4. Alertes actives (statut différent de RESOLVED)
      const allAlerts = await alertRepo.find({
        where: { tenantId }
      });

      const activeAlerts = allAlerts.filter(a => a.isResolved()).length;

      return {
        totalBudget,
        executedBudget,
        executionRate: Math.round(executionRate * 10) / 10,
        totalCapacity,
        occupiedPlaces,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        stockValue,
        totalStockItems: stocks.length,
        activeAlerts
      };
    } catch (error) {
      console.error('Erreur getGlobalKPIs:', error);
      throw error;
    }
  }

  /**
   * Récupérer les KPIs par module
   */
  static async getModuleKPIs(tenantId: string, startDate?: Date, endDate?: Date) {
    try {
      const budgetRepo = AppDataSource.getRepository(Budget);
      const transactionRepo = AppDataSource.getRepository(Transaction);
      const housingRepo = AppDataSource.getRepository(Housing);
      const stockRepo = AppDataSource.getRepository(Stock);
      const alertRepo = AppDataSource.getRepository(StockAlert);

      // Filtre de date
      const dateFilter = startDate && endDate
        ? { createdAt: Between(startDate, endDate) }
        : {};

      // MODULE FINANCIER
      const budgets = await budgetRepo.find({
        where: { tenantId, ...dateFilter }
      });

      const totalBudget = budgets.reduce((sum, b) => sum + b.montantInitial, 0);
      const executedBudget = budgets.reduce((sum, b) => sum + b.montantRealise, 0);
      const remainingBudget = totalBudget - executedBudget;
      const executionRate = totalBudget > 0 ? (executedBudget / totalBudget) * 100 : 0;

      // Calcul de la variation mensuelle (comparaison avec le mois précédent)
      const lastMonth = new Date();
      lastMonth.setMonth(lastMonth.getMonth() - 1);

      const lastMonthBudgets = await budgetRepo.find({
        where: {
          tenantId,
          createdAt: Between(
            new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
          )
        }
      });

      const lastMonthExecuted = lastMonthBudgets.reduce((sum, b) => sum + b.montantRealise, 0);
      const financialVariation = lastMonthExecuted > 0
        ? ((executedBudget - lastMonthExecuted) / lastMonthExecuted) * 100
        : 0;

      // MODULE LOGEMENT
      const housings = await housingRepo.find({
        where: { tenantId }
      });

      const totalCapacity = housings.reduce((sum, h) => sum + h.capaciteTotale, 0);
      const occupiedPlaces = housings.reduce((sum, h) => sum + h.occupationActuelle, 0);
      const occupancyRate = totalCapacity > 0 ? (occupiedPlaces / totalCapacity) * 100 : 0;

      // MODULE STOCKS
      const stocks = await stockRepo.find({
        where: { tenantId }
      });

      const totalStockValue = stocks.reduce((sum, s) => sum + (s.prixUnitaire * s.quantiteActuelle), 0);

      const lowStockItems = stocks.filter(s => s.quantiteActuelle < s.seuilMinimum).length;
      const outOfStockItems = stocks.filter(s => s.quantiteActuelle === 0).length;

      const allStockAlerts = await alertRepo.find({
        where: { tenantId }
      });

      const activeAlerts = allStockAlerts.filter(a => !a.isResolved()).length;

      return {
        financial: {
          budget: totalBudget,
          executed: executedBudget,
          remaining: remainingBudget,
          executionRate: Math.round(executionRate * 10) / 10,
          monthlyVariation: Math.round(financialVariation * 10) / 10,
          trend: financialVariation > 2 ? 'up' : financialVariation < -2 ? 'down' : 'stable',
          change: Math.round(financialVariation * 10) / 10,
          target: 75.0
        },
        housing: {
          totalCapacity,
          occupiedPlaces,
          vacantPlaces: totalCapacity - occupiedPlaces,
          occupancyRate: Math.round(occupancyRate * 10) / 10,
          totalHousings: housings.length,
          trend: 'stable',
          change: 0,
          target: 95.0
        },
        stocks: {
          totalValue: totalStockValue,
          totalItems: stocks.length,
          lowStockItems,
          outOfStockItems,
          activeAlerts,
          trend: activeAlerts > 5 ? 'down' : 'stable',
          change: -activeAlerts,
          target: totalStockValue * 1.2
        }
      };
    } catch (error) {
      console.error('Erreur getModuleKPIs:', error);
      throw error;
    }
  }

  /**
   * Récupérer les données d'évolution temporelle
   */
  static async getEvolutionData(tenantId: string, startDate: Date, endDate: Date, groupBy: string = 'month') {
    try {
      const budgetRepo = AppDataSource.getRepository(Budget);
      const transactionRepo = AppDataSource.getRepository(Transaction);

      // Pour l'instant, retournons des données agrégées par mois
      const budgets = await budgetRepo
        .createQueryBuilder('budget')
        .select('DATE_TRUNC(\'month\', budget.createdAt)', 'period')
        .addSelect('SUM(budget.montantTotal)', 'totalBudget')
        .addSelect('SUM(budget.montantConsomme)', 'executedBudget')
        .where('budget.tenantId = :tenantId', { tenantId })
        .andWhere('budget.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
        .groupBy('DATE_TRUNC(\'month\', budget.createdAt)')
        .orderBy('period', 'ASC')
        .getRawMany();

      const financial = budgets.map(b => ({
        period: new Date(b.period).toISOString().slice(0, 7),
        budget: parseFloat(b.totalBudget) || 0,
        executed: parseFloat(b.executedBudget) || 0
      }));

      return {
        financial,
        housing: [], // À implémenter avec les données d'occupation
        stocks: []   // À implémenter avec les données de stock
      };
    } catch (error) {
      console.error('Erreur getEvolutionData:', error);
      throw error;
    }
  }

  /**
   * Récupérer les alertes récentes
   */
  static async getRecentAlerts(tenantId: string, limit: number = 50) {
    try {
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const alerts = await alertRepo.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: limit
      });

      return alerts.map(alert => ({
        id: alert.id,
        type: 'stock',
        severity: alert.type === 'rupture' ? 'error' : 'warning',
        title: alert.message,
        message: alert.message,
        module: 'stocks',
        createdAt: alert.createdAt.toISOString(),
        acknowledged: alert.isResolved()
      }));
    } catch (error) {
      console.error('Erreur getRecentAlerts:', error);
      throw error;
    }
  }

  /**
   * Récupérer les activités récentes
   */
  static async getRecentActivities(tenantId: string, limit: number = 100) {
    try {
      const auditRepo = AppDataSource.getRepository(AuditLog);

      // AuditLog n'a pas de tenantId, récupérons toutes les activités récentes
      const activities = await auditRepo.find({
        order: { createdAt: 'DESC' },
        take: limit
      });

      return activities.map(activity => ({
        id: activity.id,
        type: activity.tableName,
        action: activity.action,
        description: `${activity.action} sur ${activity.tableName}`,
        module: activity.tableName,
        user: activity.userId,
        timestamp: activity.createdAt.toISOString(),
        metadata: activity.metadata
      }));
    } catch (error) {
      console.error('Erreur getRecentActivities:', error);
      throw error;
    }
  }

  /**
   * Marquer une alerte comme lue
   */
  static async acknowledgeAlert(alertId: string, userId: string) {
    try {
      const alertRepo = AppDataSource.getRepository(StockAlert);

      const alert = await alertRepo.findOne({
        where: { id: alertId }
      });

      if (!alert) {
        throw new Error('Alerte non trouvée');
      }

      alert.resolve(userId);

      await alertRepo.save(alert);

      return { success: true, message: 'Alerte marquée comme lue' };
    } catch (error) {
      console.error('Erreur acknowledgeAlert:', error);
      throw error;
    }
  }
}
