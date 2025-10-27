/**
 * FICHIER: apps/web/src/hooks/useStocks.ts
 * HOOKS: Hooks personnalisés pour la gestion des stocks
 *
 * DESCRIPTION:
 * Hooks React personnalisés pour la gestion des stocks
 * Simplification de l'utilisation du store Zustand
 * Gestion automatique du chargement et des erreurs
 *
 * FONCTIONNALITÉS:
 * - Hooks pour articles, mouvements, alertes
 * - Gestion automatique du chargement
 * - Filtres et pagination
 * - Métriques et statistiques
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { 
  useStocks, 
  useStockItems, 
  useStockMovements, 
  useStockAlerts, 
  useStocksMetrics 
} from '@/stores/stocks';
import { StockItem, StockMovement, StockAlert, StocksMetrics } from '@/services/api/stocksService';

// Hook pour les articles de stock
export const useStockItems = () => {
  const { user } = useAuth();
  const { 
    items, 
    loading, 
    error, 
    loadItems, 
    createItem, 
    updateItem, 
    deleteItem 
  } = useStocks();

  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    status: 'all'
  });

  // Charger les articles au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadItems(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadItems]);

  // Fonctions de gestion
  const handleCreateItem = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createItem(data, user.tenantId);
    }
  }, [user?.tenantId, createItem]);

  const handleUpdateItem = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateItem(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateItem]);

  const handleDeleteItem = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteItem(id, user.tenantId);
    }
  }, [user?.tenantId, deleteItem]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      status: 'all'
    });
  }, []);

  return {
    items,
    loading,
    error,
    filters,
    createItem: handleCreateItem,
    updateItem: handleUpdateItem,
    deleteItem: handleDeleteItem,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadItems(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les mouvements de stock
export const useStockMovements = () => {
  const { user } = useAuth();
  const { 
    movements, 
    loading, 
    error, 
    loadMovements, 
    createMovement 
  } = useStocks();

  const [filters, setFilters] = useState({
    type: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les mouvements au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadMovements(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadMovements]);

  // Fonctions de gestion
  const handleCreateMovement = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createMovement(data, user.tenantId);
    }
  }, [user?.tenantId, createMovement]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      type: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    movements,
    loading,
    error,
    filters,
    createMovement: handleCreateMovement,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadMovements(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les alertes de stock
export const useStockAlerts = () => {
  const { user } = useAuth();
  const { 
    alerts, 
    loading, 
    error, 
    loadAlerts, 
    markAlertAsRead, 
    criticalAlerts 
  } = useStocks();

  // Charger les alertes au montage
  useEffect(() => {
    if (user?.tenantId) {
      loadAlerts(user.tenantId);
    }
  }, [user?.tenantId, loadAlerts]);

  // Fonctions de gestion
  const handleMarkAsRead = useCallback(async (alertId: string) => {
    await markAlertAsRead(alertId);
  }, [markAlertAsRead]);

  const unreadAlerts = (alerts || []).filter(alert => !alert.isRead);
  const warningAlerts = (alerts || []).filter(alert => alert.niveau === 'warning');
  const dangerAlerts = (alerts || []).filter(alert => alert.niveau === 'danger');

  return {
    alerts,
    criticalAlerts,
    warningAlerts,
    dangerAlerts,
    unreadAlerts,
    loading,
    error,
    markAsRead: handleMarkAsRead,
    refresh: () => user?.tenantId ? loadAlerts(user.tenantId) : Promise.resolve()
  };
};

// Hook pour les métriques de stock
export const useStocksMetrics = () => {
  const { user } = useAuth();
  const { 
    metrics, 
    loading, 
    error, 
    loadMetrics 
  } = useStocks();

  // Charger les métriques au montage
  useEffect(() => {
    if (user?.tenantId) {
      loadMetrics(user.tenantId);
    }
  }, [user?.tenantId, loadMetrics]);

  return {
    metrics,
    loading,
    error,
    refresh: () => user?.tenantId ? loadMetrics(user.tenantId) : Promise.resolve()
  };
};

// Hook pour les fournisseurs
export const useSuppliers = () => {
  const { user } = useAuth();
  const { 
    suppliers, 
    suppliersLoading, 
    suppliersError, 
    loadSuppliers, 
    createSupplier 
  } = useStocks();

  // Charger les fournisseurs au montage
  useEffect(() => {
    if (user?.tenantId) {
      loadSuppliers(user.tenantId);
    }
  }, [user?.tenantId, loadSuppliers]);

  // Fonctions de gestion
  const handleCreateSupplier = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createSupplier(data, user.tenantId);
    }
  }, [user?.tenantId, createSupplier]);

  return {
    suppliers,
    loading: suppliersLoading,
    error: suppliersError,
    createSupplier: handleCreateSupplier,
    refresh: () => user?.tenantId ? loadSuppliers(user.tenantId) : Promise.resolve()
  };
};

// Hook pour les statistiques avancées
export const useStocksStatistics = () => {
  const { items, movements, alerts } = useStocks();
  const { metrics } = useStocksMetrics();

  // Calculer les statistiques en temps réel
  const statistics = {
    totalItems: (items || []).length,
    totalValue: (items || []).reduce((sum, item) => sum + item.valeurStock, 0),
    lowStockItems: (items || []).filter(item => item.quantiteActuelle <= item.seuilMinimum).length,
    criticalAlerts: (alerts || []).filter(alert => alert.niveau === 'critical').length,
    recentMovements: (movements || []).slice(0, 5),
    topCategories: (items || []).reduce((acc, item) => {
      const category = item.category;
      if (!acc[category]) {
        acc[category] = { count: 0, value: 0 };
      }
      acc[category].count += 1;
      acc[category].value += item.valeurStock;
      return acc;
    }, {} as Record<string, { count: number; value: number }>)
  };

  // Convertir les catégories en tableau trié
  const topCategories = Object.entries(statistics.topCategories)
    .map(([category, data]) => ({
      category,
      count: data.count,
      value: data.value,
      percentage: (data.value / statistics.totalValue) * 100
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    ...statistics,
    topCategories,
    metrics
  };
};

// Hook pour les filtres avancés
export const useStocksFilters = () => {
  const [filters, setFilters] = useState({
    search: '',
    type: 'all',
    category: 'all',
    status: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      type: 'all',
      category: 'all',
      status: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== 'all' && value !== new Date(new Date().setMonth(new Date().getMonth() - 1))
  );

  return {
    filters,
    updateFilters,
    resetFilters,
    hasActiveFilters
  };
};
