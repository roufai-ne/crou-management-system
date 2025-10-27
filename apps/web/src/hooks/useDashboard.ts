/**
 * FICHIER: apps/web/src/hooks/useDashboard.ts
 * HOOKS: Hooks personnalisés pour le dashboard
 *
 * DESCRIPTION:
 * Hooks personnalisés pour gérer l'état et les données du dashboard
 * Abstraction des appels API et gestion des états de chargement
 *
 * FONCTIONNALITÉS:
 * - useDashboardData: Données principales du dashboard
 * - useDashboardFilters: Filtres et paramètres
 * - useAlerts: Gestion des alertes
 * - useKPIs: Gestion des KPIs par module
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useDashboard, useKPIs } from '@/stores/dashboard';
import { useAlerts as useAlertsStore } from '@/stores/dashboard';
import { DashboardKPI } from '@/services/api/dashboardService';

// Hook pour les données principales du dashboard
export const useDashboardData = () => {
  const { user } = useAuth();
  const { data, isLoading, error, loadDashboard } = useDashboard();

  useEffect(() => {
    if (user) {
      const level = user.level === 'ministere' ? 'ministere' : 'crou';
      const tenantId = user.tenantId;
      loadDashboard(level, tenantId);
    }
  }, [user, loadDashboard]);

  return {
    data,
    isLoading,
    error,
    user
  };
};

// Hook pour les filtres du dashboard
export const useDashboardFilters = () => {
  const [filters, setFilters] = useState({
    dateRange: {
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // Début du mois
      to: new Date() // Aujourd'hui
    },
    period: 'month' as 'day' | 'week' | 'month' | 'quarter' | 'year',
    module: 'all' as 'all' | 'financial' | 'stocks' | 'housing' | 'transport'
  });

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      dateRange: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date()
      },
      period: 'month',
      module: 'all'
    });
  }, []);

  return {
    filters,
    updateFilters,
    resetFilters
  };
};

// Hook pour les alertes
export const useAlerts = () => {
  const { user } = useAuth();
  const { alerts, loadAlerts } = useAlertsStore();

  useEffect(() => {
    if (user) {
      const tenantId = user.tenantId;
      loadAlerts(tenantId);
    }
  }, [user, loadAlerts]);

  const criticalAlerts = alerts.filter(alert => alert.type === 'critical');
  const warningAlerts = alerts.filter(alert => alert.type === 'warning');
  const infoAlerts = alerts.filter(alert => alert.type === 'info');

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    infoAlerts,
    totalAlerts: alerts.length
  };
};

// Hook pour les KPIs par module
export const useKPIs = (module: 'financial' | 'stocks' | 'housing' | 'transport') => {
  const { user } = useAuth();
  const { kpis, loadKPIs } = useKPIs(module);

  useEffect(() => {
    if (user) {
      const tenantId = user.tenantId;
      loadKPIs(tenantId);
    }
  }, [user, loadKPIs]);

  return {
    kpis,
    loadKPIs: () => loadKPIs(user?.tenantId)
  };
};

// Hook pour les métriques financières
export const useFinancialMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalBudget: 0,
    totalSpent: 0,
    totalRevenue: 0,
    balance: 0,
    budgetUtilization: 0,
    monthlyTrend: [] as Array<{
      month: string;
      budget: number;
      spent: number;
      revenue: number;
    }>
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulation de données pour le développement
      // En production, ceci sera remplacé par un appel API réel
      const mockMetrics = {
        totalBudget: 2500000, // 2.5M XOF
        totalSpent: 1800000,  // 1.8M XOF
        totalRevenue: 1200000, // 1.2M XOF
        balance: 700000,      // 700K XOF
        budgetUtilization: 72, // 72%
        monthlyTrend: [
          { month: 'Jan', budget: 200000, spent: 150000, revenue: 100000 },
          { month: 'Fév', budget: 200000, spent: 180000, revenue: 120000 },
          { month: 'Mar', budget: 200000, spent: 160000, revenue: 110000 },
          { month: 'Avr', budget: 200000, spent: 190000, revenue: 130000 },
          { month: 'Mai', budget: 200000, spent: 170000, revenue: 125000 },
          { month: 'Juin', budget: 200000, spent: 200000, revenue: 140000 }
        ]
      };

      setMetrics(mockMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des métriques');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    loadMetrics
  };
};

// Hook pour les métriques de stocks
export const useStocksMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalItems: 0,
    totalValue: 0,
    lowStockAlerts: 0,
    pendingOrders: 0,
    topCategories: [] as Array<{
      category: string;
      count: number;
      value: number;
    }>
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulation de données pour le développement
      const mockMetrics = {
        totalItems: 1247,
        totalValue: 45200000, // 45.2M XOF
        lowStockAlerts: 12,
        pendingOrders: 8,
        topCategories: [
          { category: 'Céréales', count: 450, value: 25000000 },
          { category: 'Produits d\'entretien', count: 320, value: 8000000 },
          { category: 'Équipements cuisine', count: 180, value: 6000000 },
          { category: 'Matériel bureau', count: 150, value: 3000000 },
          { category: 'Pièces maintenance', count: 100, value: 2000000 },
          { category: 'Fournitures diverses', count: 47, value: 1200000 }
        ]
      };

      setMetrics(mockMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des métriques stocks');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    loadMetrics
  };
};

// Hook pour les métriques de logement
export const useHousingMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalRooms: 0,
    occupiedRooms: 0,
    availableRooms: 0,
    occupancyRate: 0,
    maintenancePending: 0,
    monthlyRevenue: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulation de données pour le développement
      const mockMetrics = {
        totalRooms: 1400,
        occupiedRooms: 1244,
        availableRooms: 156,
        occupancyRate: 88.7,
        maintenancePending: 8,
        monthlyRevenue: 1800000 // 1.8M XOF
      };

      setMetrics(mockMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des métriques logement');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    loadMetrics
  };
};

// Hook pour les métriques de transport
export const useTransportMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceDue: 0,
    totalKm: 0,
    fuelCost: 0,
    efficiency: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simulation de données pour le développement
      const mockMetrics = {
        totalVehicles: 24,
        activeVehicles: 20,
        maintenanceDue: 3,
        totalKm: 125000, // 125K km
        fuelCost: 450000, // 450K XOF
        efficiency: 85.2 // 85.2%
      };

      setMetrics(mockMetrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des métriques transport');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return {
    metrics,
    isLoading,
    error,
    loadMetrics
  };
};