/**
 * FICHIER: apps/web/src/services/api/dashboardService.ts
 * SERVICE: DashboardService - Service pour les données du dashboard
 *
 * DESCRIPTION:
 * Service pour récupérer les données du dashboard (KPIs, métriques, alertes)
 * Support multi-tenant avec données différenciées selon le niveau
 * Cache intelligent et gestion des erreurs
 *
 * FONCTIONNALITÉS:
 * - KPIs financiers (budgets, dépenses, recettes)
 * - Métriques stocks (quantités, alertes, valeur)
 * - Indicateurs logement (occupation, maintenance)
 * - Données transport (véhicules, kilométrage, coûts)
 * - Alertes critiques et notifications
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les KPIs du dashboard
export interface DashboardKPI {
  id: string;
  title: string;
  value: string | number;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
  format: 'currency' | 'number' | 'percentage';
}

export interface FinancialMetrics {
  totalBudget: number;
  totalSpent: number;
  totalRevenue: number;
  balance: number;
  budgetUtilization: number;
  monthlyTrend: Array<{
    month: string;
    budget: number;
    spent: number;
    revenue: number;
  }>;
}

export interface StocksMetrics {
  totalItems: number;
  totalValue: number;
  lowStockAlerts: number;
  pendingOrders: number;
  topCategories: Array<{
    category: string;
    count: number;
    value: number;
  }>;
}

export interface HousingMetrics {
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  occupancyRate: number;
  maintenancePending: number;
  monthlyRevenue: number;
}

export interface TransportMetrics {
  totalVehicles: number;
  activeVehicles: number;
  maintenanceDue: number;
  totalKm: number;
  fuelCost: number;
  efficiency: number;
}

export interface DashboardData {
  financial: FinancialMetrics;
  stocks: StocksMetrics;
  housing: HousingMetrics;
  transport: TransportMetrics;
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    module: string;
    createdAt: Date;
  }>;
  lastUpdated: Date;
}

export interface MinistryDashboardData extends DashboardData {
  crouPerformance: Array<{
    crouId: string;
    crouName: string;
    financialScore: number;
    stocksScore: number;
    housingScore: number;
    transportScore: number;
    overallScore: number;
    alerts: number;
  }>;
  nationalTrends: {
    totalStudents: number;
    totalBudget: number;
    totalRevenue: number;
    averageOccupancy: number;
  };
}

class DashboardService {
  private baseUrl = '/api/dashboard';

  /**
   * Récupère les données du dashboard selon le niveau utilisateur
   */
  async getDashboardData(level: 'ministere' | 'crou', tenantId?: string): Promise<DashboardData | MinistryDashboardData> {
    try {
      const params = new URLSearchParams();
      if (tenantId) params.append('tenantId', tenantId);
      
      const response = await apiClient.get(`${this.baseUrl}/data?level=${level}&${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des données dashboard:', error);
      throw error;
    }
  }

  /**
   * Récupère les KPIs financiers
   */
  async getFinancialKPIs(tenantId?: string): Promise<DashboardKPI[]> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/financial/kpis${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des KPIs financiers:', error);
      throw error;
    }
  }

  /**
   * Récupère les métriques de stocks
   */
  async getStocksKPIs(tenantId?: string): Promise<DashboardKPI[]> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/stocks/kpis${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des KPIs stocks:', error);
      throw error;
    }
  }

  /**
   * Récupère les métriques de logement
   */
  async getHousingKPIs(tenantId?: string): Promise<DashboardKPI[]> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/housing/kpis${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des KPIs logement:', error);
      throw error;
    }
  }

  /**
   * Récupère les métriques de transport
   */
  async getTransportKPIs(tenantId?: string): Promise<DashboardKPI[]> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/transport/kpis${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des KPIs transport:', error);
      throw error;
    }
  }

  /**
   * Récupère les alertes critiques
   */
  async getCriticalAlerts(tenantId?: string): Promise<Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    module: string;
    createdAt: Date;
  }>> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/alerts${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des alertes:', error);
      throw error;
    }
  }

  /**
   * Récupère les données de performance des CROU (niveau ministère)
   */
  async getCROUPerformance(): Promise<Array<{
    crouId: string;
    crouName: string;
    financialScore: number;
    stocksScore: number;
    housingScore: number;
    transportScore: number;
    overallScore: number;
    alerts: number;
  }>> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/crou-performance`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des performances CROU:', error);
      throw error;
    }
  }

  /**
   * Récupère les tendances nationales (niveau ministère)
   */
  async getNationalTrends(): Promise<{
    totalStudents: number;
    totalBudget: number;
    totalRevenue: number;
    averageOccupancy: number;
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/national-trends`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tendances nationales:', error);
      throw error;
    }
  }

  /**
   * Met à jour les données du dashboard (refresh)
   */
  async refreshDashboard(tenantId?: string): Promise<DashboardData | MinistryDashboardData> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}&refresh=true` : '?refresh=true';
      const response = await apiClient.post(`${this.baseUrl}/refresh${params}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors du refresh du dashboard:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
