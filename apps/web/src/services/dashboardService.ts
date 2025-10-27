/**
 * FICHIER: apps/web/src/services/dashboardService.ts
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

import { ApiClient } from './api/apiClient';
import { CROUUser } from '@/stores/auth';

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
  async getDashboardData(user: CROUUser, filters?: DashboardFilters): Promise<DashboardData> {
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
  private getMockDashboardData(user: CROUUser, filters?: DashboardFilters): DashboardData {
    return {
      globalKPIs: {
        totalBudget: 125000000,
        spentBudget: 87500000,
        remainingBudget: 37500000,
        budgetUtilization: 70,
        totalStudents: 12500,
        activeStudents: 11800,
        occupancyRate: 94.4,
        totalVehicles: 45,
        activeVehicles: 42,
        vehicleUtilization: 93.3,
        totalHousing: 2500,
        occupiedHousing: 2350,
        housingOccupancy: 94.0
      },
      moduleKPIs: {
        financial: {
          budget: 50000000,
          spent: 35000000,
          remaining: 15000000,
          utilization: 70.0,
          transactions: 1250,
          averageTransaction: 28000
        },
        stocks: {
          totalItems: 2500,
          lowStockItems: 45,
          outOfStockItems: 8,
          totalValue: 15000000,
          monthlyConsumption: 2500000
        },
        housing: {
          totalRooms: 2500,
          occupiedRooms: 2350,
          availableRooms: 150,
          occupancyRate: 94.0,
          maintenanceRequests: 25,
          pendingRequests: 8
        },
        transport: {
          totalVehicles: 45,
          activeVehicles: 42,
          maintenanceVehicles: 3,
          utilizationRate: 93.3,
          totalTrips: 1250,
          averagePassengers: 35
        }
      },
      evolution: {
        budget: [
          { period: 'Jan', value: 45000000 },
          { period: 'Fév', value: 52000000 },
          { period: 'Mar', value: 48000000 },
          { period: 'Avr', value: 55000000 },
          { period: 'Mai', value: 51000000 },
          { period: 'Juin', value: 58000000 }
        ],
        students: [
          { period: 'Jan', value: 11800 },
          { period: 'Fév', value: 12000 },
          { period: 'Mar', value: 12150 },
          { period: 'Avr', value: 12300 },
          { period: 'Mai', value: 12400 },
          { period: 'Juin', value: 12500 }
        ],
        housing: [
          { period: 'Jan', value: 2300 },
          { period: 'Fév', value: 2320 },
          { period: 'Mar', value: 2340 },
          { period: 'Avr', value: 2360 },
          { period: 'Mai', value: 2355 },
          { period: 'Juin', value: 2350 }
        ]
      },
      expenseBreakdown: {
        meals: { amount: 35000000, percentage: 40.0, trend: 'up' },
        housing: { amount: 25000000, percentage: 28.6, trend: 'stable' },
        transport: { amount: 15000000, percentage: 17.1, trend: 'down' },
        maintenance: { amount: 7500000, percentage: 8.6, trend: 'up' },
        administration: { amount: 5000000, percentage: 5.7, trend: 'stable' }
      },
      alerts: [
        {
          id: '1',
          type: 'warning',
          title: 'Stock faible - Riz',
          message: 'Le stock de riz est en dessous du seuil minimum',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          module: 'stocks',
          priority: 'high'
        },
        {
          id: '2',
          type: 'info',
          title: 'Maintenance véhicule',
          message: 'Véhicule #12 nécessite une révision',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          module: 'transport',
          priority: 'medium'
        }
      ],
      recentActivities: [
        {
          id: '1',
          type: 'transaction',
          title: 'Nouvelle transaction financière',
          description: 'Paiement fournisseur repas - 2,500,000 FCFA',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          user: 'Admin CROU',
          module: 'financial'
        },
        {
          id: '2',
          type: 'housing',
          title: 'Attribution logement',
          description: 'Chambre 205 attribuée à étudiant #12345',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          user: 'Service Logement',
          module: 'housing'
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
  async getGlobalKPIs(user: CROUUser, filters?: DashboardFilters): Promise<GlobalKPIs> {
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
  async getModuleKPIs(user: CROUUser, filters?: DashboardFilters): Promise<ModuleKPIs> {
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
  async getEvolutionData(user: CROUUser, filters?: DashboardFilters): Promise<EvolutionData[]> {
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
  async getExpenseBreakdown(user: CROUUser, filters?: DashboardFilters): Promise<ExpenseBreakdown[]> {
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
  async getAlerts(user: CROUUser, filters?: DashboardFilters): Promise<DashboardAlert[]> {
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
  async getRecentActivities(user: CROUUser, filters?: DashboardFilters): Promise<RecentActivity[]> {
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
      await axios.post(`${API_ENDPOINTS.acknowledge}/${alertId}`, {
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
