/**
 * FICHIER: apps/api/src/modules/reports/reports.service.ts
 * SERVICE: Reports - Génération et gestion des rapports
 *
 * DESCRIPTION:
 * Service pour la génération, stockage et export de rapports
 * Support de multiples formats (PDF, Excel, CSV)
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { AppDataSource } from '../../../../../packages/database/src/config/datasource';
import { Budget } from '../../../../../packages/database/src/entities/Budget.entity';
import { Transaction } from '../../../../../packages/database/src/entities/Transaction.entity';
import { Housing } from '../../../../../packages/database/src/entities/Housing.entity';
import { Stock } from '../../../../../packages/database/src/entities/Stock.entity';
import { AuditLog } from '../../../../../packages/database/src/entities/AuditLog.entity';
import { Between } from 'typeorm';

export interface ReportConfig {
  id: string;
  type: 'financial' | 'housing' | 'stocks' | 'audit' | 'custom';
  title: string;
  description?: string;
  createdAt: Date;
  createdBy: string;
  tenantId: string;
  filters?: Record<string, any>;
  format?: 'pdf' | 'excel' | 'csv' | 'json';
  status: 'draft' | 'generating' | 'completed' | 'failed';
}

export class ReportsService {
  private static reports: Map<string, ReportConfig> = new Map();

  /**
   * Générer un rapport financier
   */
  static async generateFinancialReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ) {
    try {
      const budgetRepo = AppDataSource.getRepository(Budget);
      const transactionRepo = AppDataSource.getRepository(Transaction);

      // Récupérer les budgets
      const budgets = await budgetRepo.find({
        where: {
          tenantId,
          createdAt: Between(startDate, endDate)
        },
        order: { createdAt: 'DESC' }
      });

      // Récupérer les transactions
      const transactions = await transactionRepo.find({
        where: {
          tenantId,
          date: Between(startDate, endDate)
        },
        relations: ['budget'],
        order: { date: 'DESC' }
      });

      // Calcul des totaux
      const totalBudget = budgets.reduce((sum, b) => sum + b.montantInitial, 0);
      const totalExecuted = budgets.reduce((sum, b) => sum + b.montantRealise, 0);
      const totalTransactions = transactions.reduce((sum, t) => sum + t.montant, 0);

      const executionRate = totalBudget > 0 ? (totalExecuted / totalBudget) * 100 : 0;

      // Créer le rapport
      const report: ReportConfig = {
        id: `report_${Date.now()}`,
        type: 'financial',
        title: `Rapport Financier ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        description: `Budget total: ${totalBudget} FCFA, Exécuté: ${totalExecuted} FCFA (${executionRate.toFixed(2)}%)`,
        createdAt: new Date(),
        createdBy: userId,
        tenantId,
        filters: { startDate, endDate },
        format: 'json',
        status: 'completed'
      };

      this.reports.set(report.id, report);

      return {
        reportId: report.id,
        metadata: report,
        data: {
          period: {
            start: startDate,
            end: endDate
          },
          summary: {
            totalBudget,
            totalExecuted,
            totalRemaining: totalBudget - totalExecuted,
            executionRate: Math.round(executionRate * 10) / 10,
            totalTransactions: transactions.length,
            totalTransactionsAmount: totalTransactions
          },
          budgets: budgets.map(b => ({
            id: b.id,
            exercice: b.exercice,
            montantInitial: b.montantInitial,
            montantRealise: b.montantRealise,
            montantDisponible: b.montantDisponible,
            status: b.status
          })),
          transactions: transactions.slice(0, 100).map(t => ({
            id: t.id,
            reference: t.reference,
            montant: t.montant,
            libelle: t.libelle,
            date: t.date,
            type: t.type,
            status: t.status,
            budgetId: t.budgetId
          }))
        }
      };
    } catch (error) {
      console.error('Erreur generateFinancialReport:', error);
      throw error;
    }
  }

  /**
   * Générer un rapport de logement
   */
  static async generateHousingReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ) {
    try {
      const housingRepo = AppDataSource.getRepository(Housing);

      const housings = await housingRepo.find({
        where: { tenantId },
        relations: ['occupancies', 'rooms']
      });

      const totalCapacity = housings.reduce((sum, h) => sum + h.capaciteTotale, 0);
      const occupiedPlaces = housings.reduce((sum, h) => sum + h.occupationActuelle, 0);
      const occupancyRate = totalCapacity > 0 ? (occupiedPlaces / totalCapacity) * 100 : 0;

      const report: ReportConfig = {
        id: `report_${Date.now()}`,
        type: 'housing',
        title: `Rapport Logement ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        description: `Taux d'occupation: ${occupancyRate.toFixed(2)}%, ${occupiedPlaces}/${totalCapacity} places`,
        createdAt: new Date(),
        createdBy: userId,
        tenantId,
        filters: { startDate, endDate },
        format: 'json',
        status: 'completed'
      };

      this.reports.set(report.id, report);

      return {
        reportId: report.id,
        metadata: report,
        data: {
          period: {
            start: startDate,
            end: endDate
          },
          summary: {
            totalHousings: housings.length,
            totalCapacity,
            occupiedPlaces,
            vacantPlaces: totalCapacity - occupiedPlaces,
            occupancyRate: Math.round(occupancyRate * 10) / 10
          },
          housings: housings.map(h => ({
            id: h.id,
            nom: h.nom,
            type: h.type,
            capaciteTotale: h.capaciteTotale,
            occupationActuelle: h.occupationActuelle,
            tauxOccupation: h.tauxOccupation,
            status: h.status
          }))
        }
      };
    } catch (error) {
      console.error('Erreur generateHousingReport:', error);
      throw error;
    }
  }

  /**
   * Générer un rapport de stocks
   */
  static async generateStocksReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ) {
    try {
      const stockRepo = AppDataSource.getRepository(Stock);

      const stocks = await stockRepo.find({
        where: { tenantId },
        order: { libelle: 'ASC' }
      });

      const totalValue = stocks.reduce((sum, s) => sum + (s.prixUnitaire * s.quantiteActuelle), 0);
      const lowStockItems = stocks.filter(s => s.quantiteActuelle < s.seuilMinimum);
      const outOfStockItems = stocks.filter(s => s.quantiteActuelle === 0);

      const report: ReportConfig = {
        id: `report_${Date.now()}`,
        type: 'stocks',
        title: `Rapport Stocks ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        description: `Valeur totale: ${totalValue} FCFA, ${stocks.length} articles`,
        createdAt: new Date(),
        createdBy: userId,
        tenantId,
        filters: { startDate, endDate },
        format: 'json',
        status: 'completed'
      };

      this.reports.set(report.id, report);

      return {
        reportId: report.id,
        metadata: report,
        data: {
          period: {
            start: startDate,
            end: endDate
          },
          summary: {
            totalItems: stocks.length,
            totalValue,
            lowStockItems: lowStockItems.length,
            outOfStockItems: outOfStockItems.length
          },
          stocks: stocks.map(s => ({
            id: s.id,
            libelle: s.libelle,
            code: s.code,
            quantite: s.quantiteActuelle,
            prixUnitaire: s.prixUnitaire,
            valeurTotale: s.prixUnitaire * s.quantiteActuelle,
            category: s.category
          }))
        }
      };
    } catch (error) {
      console.error('Erreur generateStocksReport:', error);
      throw error;
    }
  }

  /**
   * Générer un rapport d'audit
   */
  static async generateAuditReport(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    userId: string
  ) {
    try {
      const auditRepo = AppDataSource.getRepository(AuditLog);

      const auditLogs = await auditRepo.find({
        where: {
          createdAt: Between(startDate, endDate)
        },
        order: { createdAt: 'DESC' },
        take: 1000 // Limiter à 1000 entrées
      });

      // Statistiques par action
      const actionStats: Record<string, number> = {};
      const tableStats: Record<string, number> = {};
      const userStats: Record<string, number> = {};

      auditLogs.forEach(log => {
        actionStats[log.action] = (actionStats[log.action] || 0) + 1;
        tableStats[log.tableName] = (tableStats[log.tableName] || 0) + 1;
        userStats[log.userId] = (userStats[log.userId] || 0) + 1;
      });

      const report: ReportConfig = {
        id: `report_${Date.now()}`,
        type: 'audit',
        title: `Rapport d'Audit ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
        description: `${auditLogs.length} entrées d'audit`,
        createdAt: new Date(),
        createdBy: userId,
        tenantId,
        filters: { startDate, endDate },
        format: 'json',
        status: 'completed'
      };

      this.reports.set(report.id, report);

      return {
        reportId: report.id,
        metadata: report,
        data: {
          period: {
            start: startDate,
            end: endDate
          },
          summary: {
            totalEntries: auditLogs.length,
            actionStats,
            tableStats,
            userStats
          },
          entries: auditLogs.slice(0, 100).map(log => ({
            id: log.id,
            action: log.action,
            tableName: log.tableName,
            userId: log.userId,
            ipAddress: log.ipAddress,
            createdAt: log.createdAt
          }))
        }
      };
    } catch (error) {
      console.error('Erreur generateAuditReport:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les rapports
   */
  static async getAllReports(tenantId: string, filters?: any) {
    try {
      const allReports = Array.from(this.reports.values())
        .filter(r => r.tenantId === tenantId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return {
        reports: allReports,
        total: allReports.length
      };
    } catch (error) {
      console.error('Erreur getAllReports:', error);
      throw error;
    }
  }

  /**
   * Récupérer un rapport spécifique
   */
  static async getReport(reportId: string, tenantId: string) {
    try {
      const report = this.reports.get(reportId);

      if (!report || report.tenantId !== tenantId) {
        throw new Error('Rapport non trouvé');
      }

      return report;
    } catch (error) {
      console.error('Erreur getReport:', error);
      throw error;
    }
  }

  /**
   * Supprimer un rapport
   */
  static async deleteReport(reportId: string, tenantId: string) {
    try {
      const report = this.reports.get(reportId);

      if (!report || report.tenantId !== tenantId) {
        throw new Error('Rapport non trouvé');
      }

      this.reports.delete(reportId);

      return { success: true, message: 'Rapport supprimé avec succès' };
    } catch (error) {
      console.error('Erreur deleteReport:', error);
      throw error;
    }
  }

  /**
   * Exporter un rapport (format simplifié pour l'instant)
   */
  static async exportReport(reportId: string, tenantId: string, format: 'pdf' | 'excel' | 'csv' = 'pdf') {
    try {
      const report = this.reports.get(reportId);

      if (!report || report.tenantId !== tenantId) {
        throw new Error('Rapport non trouvé');
      }

      // TODO: Implémenter la génération réelle de PDF/Excel/CSV
      return {
        success: true,
        message: `Rapport exporté au format ${format}`,
        downloadUrl: `/api/reports/${reportId}/download?format=${format}`
      };
    } catch (error) {
      console.error('Erreur exportReport:', error);
      throw error;
    }
  }
}
