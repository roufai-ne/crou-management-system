/**
 * FICHIER: apps/web/src/stores/dashboard.ts
 * STORE: DashboardStore - Store Zustand pour le dashboard
 *
 * DESCRIPTION:
 * Store pour gérer l'état du dashboard (KPIs, métriques, alertes)
 * Support multi-tenant avec données différenciées
 * Cache intelligent et gestion des erreurs
 *
 * FONCTIONNALITÉS:
 * - État des KPIs par module
 * - Métriques financières, stocks, logement, transport
 * - Alertes critiques et notifications
 * - Données de performance CROU (niveau ministère)
 * - Cache et optimisation des requêtes
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { dashboardService, DashboardKPI, DashboardData, MinistryDashboardData } from '@/services/api/dashboardService';

interface DashboardState {
  // État de chargement
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  error: string | null;

  // Données du dashboard
  data: DashboardData | MinistryDashboardData | null;
  kpis: {
    financial: DashboardKPI[];
    stocks: DashboardKPI[];
    housing: DashboardKPI[];
    transport: DashboardKPI[];
  };

  // Alertes
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    module: string;
    createdAt: Date;
  }>;

  // Actions
  loadDashboard: (level: 'ministere' | 'crou', tenantId?: string) => Promise<void>;
  refreshDashboard: (level: 'ministere' | 'crou', tenantId?: string) => Promise<void>;
  loadKPIs: (module: 'financial' | 'stocks' | 'housing' | 'transport', tenantId?: string) => Promise<void>;
  loadAlerts: (tenantId?: string) => Promise<void>;
  clearError: () => void;
  clearData: () => void;
}

export const useDashboard = create<DashboardState>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        isLoading: false,
        isRefreshing: false,
        lastUpdated: null,
        error: null,

        data: null,
        kpis: {
          financial: [],
          stocks: [],
          housing: [],
          transport: []
        },
        alerts: [],

        // Actions
        loadDashboard: async (level, tenantId) => {
          const { isLoading } = get();
          if (isLoading) return;

          set({ isLoading: true, error: null });

          try {
            const data = await dashboardService.getDashboardData(level, tenantId);
            
            set({
              data,
              lastUpdated: new Date(),
              isLoading: false,
              error: null
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erreur lors du chargement du dashboard',
              isLoading: false
            });
          }
        },

        refreshDashboard: async (level, tenantId) => {
          const { isRefreshing } = get();
          if (isRefreshing) return;

          set({ isRefreshing: true, error: null });

          try {
            const data = await dashboardService.refreshDashboard(tenantId);
            
            set({
              data,
              lastUpdated: new Date(),
              isRefreshing: false,
              error: null
            });
          } catch (error) {
            set({
              error: error instanceof Error ? error.message : 'Erreur lors du refresh du dashboard',
              isRefreshing: false
            });
          }
        },

        loadKPIs: async (module, tenantId) => {
          try {
            let kpis: DashboardKPI[] = [];

            switch (module) {
              case 'financial':
                kpis = await dashboardService.getFinancialKPIs(tenantId);
                break;
              case 'stocks':
                kpis = await dashboardService.getStocksKPIs(tenantId);
                break;
              case 'housing':
                kpis = await dashboardService.getHousingKPIs(tenantId);
                break;
              case 'transport':
                kpis = await dashboardService.getTransportKPIs(tenantId);
                break;
            }

            set(state => ({
              kpis: {
                ...state.kpis,
                [module]: kpis
              }
            }));
          } catch (error) {
            console.error(`Erreur lors du chargement des KPIs ${module}:`, error);
          }
        },

        loadAlerts: async (tenantId) => {
          try {
            // TODO: Implémenter getCriticalAlerts dans dashboardService
            // const alerts = await dashboardService.getCriticalAlerts(tenantId);
            set({ alerts: [] });
          } catch (error) {
            console.error('Erreur lors du chargement des alertes:', error);
          }
        },

        clearError: () => set({ error: null }),

        clearData: () => set({
          data: null,
          kpis: {
            financial: [],
            stocks: [],
            housing: [],
            transport: []
          },
          alerts: [],
          lastUpdated: null,
          error: null
        })
      }),
      {
        name: 'dashboard-store',
        partialize: (state) => ({
          // Ne pas persister les données sensibles, seulement la configuration
          lastUpdated: state.lastUpdated
        })
      }
    ),
    {
      name: 'dashboard-store'
    }
  )
);

// Hooks utilitaires
export const useDashboardData = () => {
  const { data, isLoading, error } = useDashboard();
  return { data, isLoading, error };
};

export const useKPIs = (module: 'financial' | 'stocks' | 'housing' | 'transport') => {
  const { kpis, loadKPIs } = useDashboard();
  return {
    kpis: kpis[module],
    loadKPIs: () => loadKPIs(module)
  };
};

export const useAlerts = () => {
  const { alerts, loadAlerts } = useDashboard();
  return { alerts, loadAlerts };
};

export const useDashboardActions = () => {
  const { loadDashboard, refreshDashboard, clearError, clearData } = useDashboard();
  return { loadDashboard, refreshDashboard, clearError, clearData };
};
