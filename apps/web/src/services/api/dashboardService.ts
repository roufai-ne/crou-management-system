/**
 * FICHIER: apps/web/src/services/api/dashboardService.ts
 * SERVICE: DashboardService - Service de données pour le tableau de bord
 *
 * DESCRIPTION:
 * Service centralisé pour la gestion des données du dashboard
 * Gestion des requêtes API, cache et transformations
 * Support multi-tenant (Ministère vs CROU)
 *
 * FONCTIONNALITÉS:
 * - KPIs temps réel par module
 * - Données d'évolution temporelle
 * - Alertes et notifications
 * - Activités récentes
 * - Filtrage par CROU et période
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { ApiClient } from './apiClient';
import { User } from '@/stores/auth';

// Types pour les données du dashboard
export interface GlobalKPIs {
  totalBudget: number;
  executedBudget: number;
  executionRate: number;
  totalStudents: number;
  housedStudents: number;
  occupancyRate: number;
  satisfaction: number;
  stockValue: number;
  operationalVehicles: number;
  activeAlerts: number;
}

export interface ModuleKPIs {
  financial: {
    budget: number;
    executed: number;
    remaining: number;
    executionRate: number;
    monthlyVariation: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target: number;
  };
  students: {
    total: number;
    housed: number;
    waiting: number;
    housingRate: number;
    newRegistrations: number;
    monthlyVariation: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target: number;
  };
  stocks: {
    totalValue: number;
    itemsCount: number;
    lowStockItems: number;
    stockoutRisk: number;
    monthlyMovements: number;
    rotationRate: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target: number;
  };
  transport: {
    totalVehicles: number;
    operationalVehicles: number;
    maintenanceVehicles: number;
    operationalRate: number;
    monthlyTrips: number;
    efficiency: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target: number;
  };
  housing: {
    totalCapacity: number;
    occupiedBeds: number;
    availableBeds: number;
    occupancyRate: number;
    maintenanceRooms: number;
    satisfactionScore: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
    target: number;
  };
}

export interface EvolutionData {
  period: string;
  budget: number;
  executedBudget: number;
  students: number;
  housedStudents: number;
  satisfaction: number;
  stockValue: number;
  vehicles: number;
  occupancyRate: number;
}

export interface ExpenseBreakdown {
  category: string;
  amount: number;
  percentage: number;
  monthlyVariation: number;
  subcategories?: Array<{
    name: string;
    amount: number;
    percentage: number;
  }>;
}

export interface DashboardAlert {
  id: string;
  type: 'critical' | 'urgent' | 'warning' | 'info';
  priority: 'high' | 'medium' | 'low';
  module: 'finance' | 'stocks' | 'housing' | 'transport' | 'admin';
  title: string;
  message: string;
  actionRequired: boolean;
  actionUrl?: string;
  createdAt: string;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  metadata?: Record<string, any>;
}

export interface RecentActivity {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  description: string;
  status: 'success' | 'pending' | 'error' | 'cancelled';
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface DashboardFilters {
  crouId?: string;
  startDate?: Date;
  endDate?: Date;
  modules?: string[];
  alertTypes?: string[];
  groupBy?: 'day' | 'week' | 'month' | 'quarter';
}

export interface DashboardData {
  globalKPIs: GlobalKPIs;
  moduleKPIs: ModuleKPIs;
  evolution: EvolutionData[];
  expenseBreakdown: ExpenseBreakdown[];
  alerts: DashboardAlert[];
  recentActivities: RecentActivity[];
  lastUpdate: string;
  dataFreshness: {
    kpis: string;
    evolution: string;
    alerts: string;
    activities: string;
  };
}

// Configuration des endpoints API (relatifs au baseURL déjà préfixé par /api)
const API_ENDPOINTS = {
  dashboard: '/dashboard',
  globalKPIs: '/dashboard/kpis/global',
  moduleKPIs: '/dashboard/kpis/modules',
  evolution: '/dashboard/evolution',
  expenses: '/dashboard/expenses',
  alerts: '/dashboard/alerts',
  activities: '/dashboard/activities',
  acknowledge: '/dashboard/alerts/acknowledge'
};

// Service principal
export class DashboardService {
  private static instance: DashboardService;
  private apiClient: ApiClient;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly CACHE_TTL = {
    kpis: 5 * 60 * 1000, // 5 minutes
    evolution: 15 * 60 * 1000, // 15 minutes
    alerts: 1 * 60 * 1000, // 1 minute
    activities: 2 * 60 * 1000 // 2 minutes
  };

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  private constructor() {
    this.apiClient = new ApiClient();
  }

  private getCacheKey(endpoint: string, params?: any): string {
    return `${endpoint}_${JSON.stringify(params || {})}`;
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private async request<T>(endpoint: string, params?: any, cacheTTL?: number): Promise<T> {
    const cacheKey = this.getCacheKey(endpoint, params);

    // Vérifier le cache
    if (cacheTTL) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }

    try {
      const response = await this.apiClient.get(endpoint, { params });
      const data = response.data;

      // Mettre en cache si TTL spécifié
      if (cacheTTL) {
        this.setCache(cacheKey, data, cacheTTL);
      }

      return data;
    } catch (error: any) {
      console.error(`Erreur API ${endpoint}:`, error);

      // En cas d'erreur, essayer de retourner des données cachées même expirées
      const staleCache = this.cache.get(cacheKey);
      if (staleCache) {
        console.warn(`Utilisation données expirées pour ${endpoint}`);
        return staleCache.data;
      }

      throw error;
    }
  }

  // Récupérer toutes les données du dashboard
  async getDashboardData(user: User, filters?: DashboardFilters): Promise<DashboardData> {
    // Mode développement : utiliser des données mockées
    if (import.meta.env.DEV) {
      return this.getMockDashboardData(user, filters);
    }

    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : filters?.crouId,
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString(),
      modules: filters?.modules?.join(','),
      groupBy: filters?.groupBy || 'month'
    };

    try {
      // Charger toutes les données en parallèle
      const [globalKPIs, moduleKPIs, evolution, expenses, alerts, activities] = await Promise.all([
        this.getGlobalKPIs(user, filters),
        this.getModuleKPIs(user, filters),
        this.getEvolutionData(user, filters),
        this.getExpenseBreakdown(user, filters),
        this.getAlerts(user, filters),
        this.getRecentActivities(user, filters)
      ]);

      return {
        globalKPIs,
        moduleKPIs,
        evolution,
        expenseBreakdown: expenses,
        alerts,
        recentActivities: activities,
        lastUpdate: new Date().toISOString(),
        dataFreshness: {
          kpis: new Date().toISOString(),
          evolution: new Date().toISOString(),
          alerts: new Date().toISOString(),
          activities: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      // Fallback vers données mockées en cas d'erreur
      return this.getMockDashboardData(user, filters);
    }
  }

  // Données mockées pour le développement
  private getMockDashboardData(user: User, filters?: DashboardFilters): DashboardData {
    return {
      globalKPIs: {
        totalBudget: 125000000,
        executedBudget: 87500000,
        executionRate: 70,
        totalStudents: 12500,
        housedStudents: 11800,
        occupancyRate: 94.4,
        satisfaction: 88,
        stockValue: 15000000,
        operationalVehicles: 42,
        activeAlerts: 8
      },
      moduleKPIs: {
        financial: {
          budget: 50000000,
          executed: 35000000,
          remaining: 15000000,
          executionRate: 70.0,
          monthlyVariation: 5.2,
          trend: 'up',
          change: 5.2,
          target: 75
        },
        students: {
          total: 12500,
          housed: 11800,
          waiting: 450,
          housingRate: 94.4,
          newRegistrations: 320,
          monthlyVariation: 2.8,
          trend: 'up',
          change: 2.8,
          target: 95
        },
        stocks: {
          totalValue: 15000000,
          itemsCount: 2500,
          lowStockItems: 45,
          stockoutRisk: 1.8,
          monthlyMovements: 850,
          rotationRate: 5.7,
          trend: 'stable',
          change: 0.5,
          target: 6.0
        },
        transport: {
          totalVehicles: 45,
          operationalVehicles: 42,
          maintenanceVehicles: 3,
          operationalRate: 93.3,
          monthlyTrips: 1250,
          efficiency: 87.5,
          trend: 'up',
          change: 3.2,
          target: 90
        },
        housing: {
          totalCapacity: 2500,
          occupiedBeds: 2350,
          availableBeds: 150,
          occupancyRate: 94.0,
          maintenanceRooms: 25,
          satisfactionScore: 88,
          trend: 'stable',
          change: 1.2,
          target: 95
        }
      },
      evolution: [
        { period: 'Jan', budget: 45000000, executedBudget: 40000000, students: 11800, housedStudents: 11200, satisfaction: 85, stockValue: 14000000, vehicles: 42, occupancyRate: 94.9 },
        { period: 'Fév', budget: 52000000, executedBudget: 46000000, students: 12000, housedStudents: 11400, satisfaction: 87, stockValue: 14500000, vehicles: 43, occupancyRate: 95.0 },
        { period: 'Mar', budget: 48000000, executedBudget: 43000000, students: 12150, housedStudents: 11550, satisfaction: 86, stockValue: 14800000, vehicles: 42, occupancyRate: 95.1 },
        { period: 'Avr', budget: 55000000, executedBudget: 49000000, students: 12300, housedStudents: 11700, satisfaction: 88, stockValue: 15000000, vehicles: 44, occupancyRate: 95.1 },
        { period: 'Mai', budget: 51000000, executedBudget: 45000000, students: 12400, housedStudents: 11800, satisfaction: 89, stockValue: 15200000, vehicles: 43, occupancyRate: 95.2 },
        { period: 'Juin', budget: 58000000, executedBudget: 51000000, students: 12500, housedStudents: 11900, satisfaction: 90, stockValue: 15500000, vehicles: 45, occupancyRate: 95.2 }
      ],
      expenseBreakdown: [
        { category: 'Restauration', amount: 35000000, percentage: 40.0, monthlyVariation: 5.2 },
        { category: 'Logement', amount: 25000000, percentage: 28.6, monthlyVariation: 1.8 },
        { category: 'Transport', amount: 15000000, percentage: 17.1, monthlyVariation: -2.3 },
        { category: 'Maintenance', amount: 7500000, percentage: 8.6, monthlyVariation: 3.5 },
        { category: 'Administration', amount: 5000000, percentage: 5.7, monthlyVariation: 0.8 }
      ],
      alerts: [
        {
          id: '1',
          type: 'warning',
          priority: 'high',
          module: 'stocks',
          title: 'Stock faible - Riz',
          message: 'Le stock de riz est en dessous du seuil minimum',
          actionRequired: true,
          actionUrl: '/stocks/items/riz',
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          type: 'info',
          priority: 'medium',
          module: 'transport',
          title: 'Maintenance véhicule',
          message: 'Véhicule #12 nécessite une révision',
          actionRequired: false,
          createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ],
      recentActivities: [
        {
          id: '1',
          userId: 'user123',
          userName: 'Admin CROU',
          userRole: 'admin',
          action: 'CREATE_TRANSACTION',
          module: 'financial',
          entityType: 'transaction',
          entityId: 'txn-001',
          description: 'Paiement fournisseur repas - 2,500,000 FCFA',
          status: 'success',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          userId: 'user456',
          userName: 'Service Logement',
          userRole: 'housing_manager',
          action: 'ASSIGN_ROOM',
          module: 'housing',
          entityType: 'room',
          entityId: 'room-205',
          description: 'Chambre 205 attribuée à étudiant #12345',
          status: 'success',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        }
      ],
      lastUpdate: new Date().toISOString(),
      dataFreshness: {
        kpis: new Date().toISOString(),
        evolution: new Date().toISOString(),
        alerts: new Date().toISOString(),
        activities: new Date().toISOString()
      }
    };
  }

  // KPIs globaux
  async getGlobalKPIs(user: User, filters?: DashboardFilters): Promise<GlobalKPIs> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : filters?.crouId,
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString()
    };

    return this.request<GlobalKPIs>(
      API_ENDPOINTS.globalKPIs,
      params,
      this.CACHE_TTL.kpis
    );
  }

  // KPIs par module
  async getModuleKPIs(user: User, filters?: DashboardFilters): Promise<ModuleKPIs> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : filters?.crouId,
      modules: filters?.modules?.join(','),
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString()
    };

    return this.request<ModuleKPIs>(
      API_ENDPOINTS.moduleKPIs,
      params,
      this.CACHE_TTL.kpis
    );
  }

  // Données d'évolution temporelle
  async getEvolutionData(user: User, filters?: DashboardFilters): Promise<EvolutionData[]> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : filters?.crouId,
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString(),
      groupBy: filters?.groupBy || 'month'
    };

    return this.request<EvolutionData[]>(
      API_ENDPOINTS.evolution,
      params,
      this.CACHE_TTL.evolution
    );
  }

  // Répartition des dépenses
  async getExpenseBreakdown(user: User, filters?: DashboardFilters): Promise<ExpenseBreakdown[]> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : filters?.crouId,
      startDate: filters?.startDate?.toISOString(),
      endDate: filters?.endDate?.toISOString()
    };

    return this.request<ExpenseBreakdown[]>(
      API_ENDPOINTS.expenses,
      params,
      this.CACHE_TTL.evolution
    );
  }

  // Alertes et notifications
  async getAlerts(user: User, filters?: DashboardFilters): Promise<DashboardAlert[]> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : filters?.crouId,
      types: filters?.alertTypes?.join(','),
      limit: 50
    };

    return this.request<DashboardAlert[]>(
      API_ENDPOINTS.alerts,
      params,
      this.CACHE_TTL.alerts
    );
  }

  // Activités récentes
  async getRecentActivities(user: User, filters?: DashboardFilters): Promise<RecentActivity[]> {
    const params = {
      level: user.level,
      crouId: user.level === 'crou' ? user.crouId : filters?.crouId,
      modules: filters?.modules?.join(','),
      limit: 100
    };

    return this.request<RecentActivity[]>(
      API_ENDPOINTS.activities,
      params,
      this.CACHE_TTL.activities
    );
  }

  // Marquer une alerte comme lue
  async acknowledgeAlert(alertId: string, userId: string): Promise<void> {
    try {
      await this.apiClient.post(`${API_ENDPOINTS.acknowledge}/${alertId}`, {
        userId,
        acknowledgedAt: new Date().toISOString()
      });

      // Invalider le cache des alertes
      const alertsCacheKeys = Array.from(this.cache.keys())
        .filter(key => key.includes(API_ENDPOINTS.alerts));
      alertsCacheKeys.forEach(key => this.cache.delete(key));
    } catch (error) {
      console.error('Erreur acknowledgement alerte:', error);
      throw error;
    }
  }

  // Vider le cache
  clearCache(): void {
    this.cache.clear();
  }

  // Vider le cache pour un endpoint spécifique
  clearCacheForEndpoint(endpoint: string): void {
    const keys = Array.from(this.cache.keys())
      .filter(key => key.includes(endpoint));
    keys.forEach(key => this.cache.delete(key));
  }

  // Statistiques du cache (pour debug)
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Instance globale
export const dashboardService = DashboardService.getInstance();

// Utilitaires pour les calculs de KPIs
export const KPICalculators = {
  // Calculer le taux d'exécution budgétaire
  calculateExecutionRate: (executed: number, total: number): number => {
    return total > 0 ? Math.round((executed / total) * 100) : 0;
  },

  // Calculer la tendance basée sur la variation
  calculateTrend: (change: number): 'up' | 'down' | 'stable' => {
    if (Math.abs(change) < 1) return 'stable';
    return change > 0 ? 'up' : 'down';
  },

  // Formater les grandes valeurs
  formatLargeNumber: (value: number): string => {
    if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)}Md`;
    }
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toString();
  },

  // Calculer la variance par rapport à la cible
  calculateVariance: (actual: number, target: number): number => {
    return target > 0 ? Math.round(((actual - target) / target) * 100) : 0;
  }
};

export default dashboardService;
