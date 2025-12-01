/**
 * FICHIER: apps/api/src/modules/dashboard/dashboard.controller.ts
 * CONTROLLER: Module Dashboard - Contrôleur centralisé
 *
 * DESCRIPTION:
 * Contrôleur centralisé pour le dashboard principal
 * Agrégation des données de tous les modules
 *
 * ENDPOINTS:
 * - GET /kpis/global - KPIs globaux
 * - GET /kpis/modules - KPIs par module
 * - GET /evolution - Évolution temporelle
 * - GET /expenses - Répartition des dépenses
 * - GET /alerts - Alertes récentes
 * - GET /activities - Activités récentes
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Response } from 'express';
import { TypedRequest } from '@/shared/types/express.types';
import { TenantIsolationUtils } from '@/shared/utils/tenant-isolation.utils';
import { DashboardService } from './dashboard.service';

export class DashboardController {
  /**
   * GET /api/dashboard/kpis/global
   * KPIs globaux du système
   */
  static async getGlobalKPIs(req: TypedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

      const globalKPIs = await DashboardService.getGlobalKPIs(
        effectiveTenantId,
        parsedStartDate,
        parsedEndDate
      );

      res.json({
        success: true,
        data: globalKPIs
      });
    } catch (error) {
      console.error('Erreur getGlobalKPIs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des KPIs globaux'
      });
    }
  }

  /**
   * GET /api/dashboard/kpis/modules
   * KPIs par module
   */
  static async getModuleKPIs(req: TypedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

      const moduleKPIs = await DashboardService.getModuleKPIs(
        effectiveTenantId,
        parsedStartDate,
        parsedEndDate
      );

      res.json({
        success: true,
        data: moduleKPIs
      });
    } catch (error) {
      console.error('Erreur getModuleKPIs:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des KPIs par module'
      });
    }
  }

  /**
   * GET /api/dashboard/evolution
   * Évolution temporelle des indicateurs
   */
  static async getEvolutionData(req: TypedRequest, res: Response) {
    try {
      const { startDate, endDate, groupBy = 'month' } = req.query;
      
      // TODO: Implémenter avec le service
      const evolutionData = {
        financial: [],
        students: [],
        stocks: []
      };

      res.json({
        success: true,
        data: evolutionData
      });
    } catch (error) {
      console.error('Erreur getEvolutionData:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données d evolution'
      });
    }
  }

  /**
   * GET /api/dashboard/expenses
   * Répartition des dépenses par catégorie
   */
  static async getExpenseBreakdown(req: TypedRequest, res: Response) {
    try {
      const { startDate, endDate } = req.query;
      
      // TODO: Implémenter avec le service
      const expenseBreakdown = {
        categories: [
          { name: 'Logement', amount: 20000000, percentage: 57.1, color: '#3B82F6' },
          { name: 'Transport', amount: 8000000, percentage: 22.9, color: '#10B981' },
          { name: 'Stocks', amount: 5000000, percentage: 14.3, color: '#F59E0B' },
          { name: 'Maintenance', amount: 2000000, percentage: 5.7, color: '#EF4444' }
        ],
        total: 35000000,
        period: {
          start: startDate || '2024-01-01',
          end: endDate || '2024-12-31'
        }
      };

      res.json({
        success: true,
        data: expenseBreakdown
      });
    } catch (error) {
      console.error('Erreur getExpenseBreakdown:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération de la répartition des dépenses'
      });
    }
  }

  /**
   * GET /api/dashboard/alerts
   * Alertes récentes
   */
  static async getAlerts(req: TypedRequest, res: Response) {
    try {
      const { limit = 50 } = req.query;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const alerts = await DashboardService.getRecentAlerts(
        effectiveTenantId,
        Number(limit)
      );

      res.json({
        success: true,
        data: alerts
      });
    } catch (error) {
      console.error('Erreur getAlerts:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des alertes'
      });
    }
  }

  /**
   * GET /api/dashboard/activities
   * Activités récentes
   */
  static async getRecentActivities(req: TypedRequest, res: Response) {
    try {
      const { limit = 100 } = req.query;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const activities = await DashboardService.getRecentActivities(
        effectiveTenantId,
        Number(limit)
      );

      res.json({
        success: true,
        data: activities
      });
    } catch (error) {
      console.error('Erreur getRecentActivities:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des activités récentes'
      });
    }
  }

  /**
   * POST /api/dashboard/alerts/:alertId/acknowledge
   * Marquer une alerte comme lue
   */
  static async acknowledgeAlert(req: TypedRequest, res: Response) {
    try {
      const { alertId } = req.params;
      const userId = req.user?.userId;

      const result = await DashboardService.acknowledgeAlert(alertId, userId);

      res.json(result);
    } catch (error) {
      console.error('Erreur acknowledgeAlert:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la reconnaissance de l alerte'
      });
    }
  }

  /**
   * GET /api/dashboard/data
   * Données agrégées complètes du dashboard
   */
  static async getData(req: TypedRequest, res: Response) {
    try {
      const { level, startDate, endDate } = req.query;
      const tenantContext = TenantIsolationUtils.extractTenantContext(req);
      const hasExtendedAccess = TenantIsolationUtils.hasExtendedAccess(req);
      const targetTenantId = req.query.tenantId as string;

      const effectiveTenantId = hasExtendedAccess && targetTenantId 
        ? targetTenantId 
        : tenantContext.tenantId;

      const parsedStartDate = startDate ? new Date(startDate as string) : undefined;
      const parsedEndDate = endDate ? new Date(endDate as string) : undefined;

      // Agréger toutes les données du dashboard
      const [globalKPIs, moduleKPIs, evolution, expenses, alerts, activities] = await Promise.all([
        DashboardService.getGlobalKPIs(effectiveTenantId, parsedStartDate, parsedEndDate),
        DashboardService.getModuleKPIs(effectiveTenantId, parsedStartDate, parsedEndDate),
        DashboardService.getEvolutionData(effectiveTenantId, parsedStartDate, parsedEndDate),
        DashboardService.getExpenseBreakdown(effectiveTenantId, parsedStartDate, parsedEndDate),
        DashboardService.getAlerts(effectiveTenantId, 10),
        DashboardService.getRecentActivities(effectiveTenantId, 10)
      ]);

      res.json({
        success: true,
        data: {
          level: level || 'crou',
          globalKPIs,
          moduleKPIs,
          evolution,
          expenses,
          alerts,
          activities,
          tenantId
        }
      });
    } catch (error) {
      console.error('Erreur getData:', error);
      res.status(500).json({
        success: false,
        error: 'Erreur lors de la récupération des données dashboard'
      });
    }
  }
}
