/**
 * FICHIER: apps/web/src/stores/stocks.ts
 * STORE: StocksStore - Store Zustand pour la gestion des stocks
 *
 * DESCRIPTION:
 * Store centralisé pour la gestion de l'état des stocks
 * Gestion des articles, mouvements, alertes et fournisseurs
 * Support multi-tenant avec cache intelligent
 *
 * FONCTIONNALITÉS:
 * - Gestion des articles de stock
 * - Mouvements d'entrée/sortie
 * - Alertes de stock bas
 * - Gestion des fournisseurs
 * - Métriques et statistiques
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  StockItem, 
  StockMovement, 
  StockAlert, 
  Supplier, 
  StocksMetrics,
  stocksService 
} from '@/services/api/stocksService';

// Interface pour l'état des stocks
interface StocksState {
  // Articles de stock
  items: StockItem[];
  itemsLoading: boolean;
  itemsError: string | null;
  
  // Mouvements de stock
  movements: StockMovement[];
  movementsLoading: boolean;
  movementsError: string | null;
  
  // Alertes
  alerts: StockAlert[];
  alertsLoading: boolean;
  alertsError: string | null;
  
  // Fournisseurs
  suppliers: Supplier[];
  suppliersLoading: boolean;
  suppliersError: string | null;
  
  // Métriques
  metrics: StocksMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Filtres et pagination
  filters: {
    search: string;
    type: string;
    category: string;
    status: string;
  };
  
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  
  // Cache
  lastFetch: number | null;
  cacheExpiry: number; // 5 minutes
}

// Interface pour les actions
interface StocksActions {
  // Articles de stock
  loadItems: (tenantId: string, filters?: Partial<StocksState['filters']>) => Promise<void>;
  createItem: (data: any, tenantId: string) => Promise<void>;
  updateItem: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteItem: (id: string, tenantId: string) => Promise<void>;
  
  // Mouvements de stock
  loadMovements: (tenantId: string, filters?: any) => Promise<void>;
  createMovement: (data: any, tenantId: string) => Promise<void>;
  
  // Alertes
  loadAlerts: (tenantId: string) => Promise<void>;
  markAlertAsRead: (alertId: string) => Promise<void>;
  
  // Fournisseurs
  loadSuppliers: (tenantId: string) => Promise<void>;
  createSupplier: (data: any, tenantId: string) => Promise<void>;
  
  // Métriques
  loadMetrics: (tenantId: string) => Promise<void>;
  
  // Filtres et pagination
  setFilters: (filters: Partial<StocksState['filters']>) => void;
  setPagination: (pagination: Partial<StocksState['pagination']>) => void;
  
  // Cache et synchronisation
  refreshAll: (tenantId: string) => Promise<void>;
  clearCache: () => void;
  
  // Utilitaires
  getItemById: (id: string) => StockItem | undefined;
  getItemsByCategory: (category: string) => StockItem[];
  getCriticalAlerts: () => StockAlert[];
  getLowStockItems: () => StockItem[];
}

// Store principal
export const useStocks = create<StocksState & StocksActions>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        items: [],
        itemsLoading: false,
        itemsError: null,
        
        movements: [],
        movementsLoading: false,
        movementsError: null,
        
        alerts: [],
        alertsLoading: false,
        alertsError: null,
        
        suppliers: [],
        suppliersLoading: false,
        suppliersError: null,
        
        metrics: null,
        metricsLoading: false,
        metricsError: null,
        
        filters: {
          search: '',
          type: 'all',
          category: 'all',
          status: 'all'
        },
        
        pagination: {
          page: 1,
          limit: 10,
          total: 0
        },
        
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        
        // Actions pour les articles
        loadItems: async (tenantId: string, filters?: Partial<StocksState['filters']>) => {
          set({ itemsLoading: true, itemsError: null });
          
          try {
            const currentFilters = { ...get().filters, ...filters };
            const response = await stocksService.getStockItems({
              tenantId,
              ...currentFilters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            // Valider que response.items est un tableau
            const itemsData = Array.isArray(response.items) ? response.items : [];
            set({
              items: itemsData,
              pagination: {
                ...get().pagination,
                total: response.total || 0
              },
              itemsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              items: [], // Initialiser avec tableau vide en cas d'erreur
              itemsLoading: false,
              itemsError: error.message || 'Erreur lors du chargement des articles'
            });
          }
        },
        
        createItem: async (data: any, tenantId: string) => {
          try {
            await stocksService.createStockItem(data);
            // Recharger les articles après création
            await get().loadItems(tenantId);
          } catch (error: any) {
            set({ itemsError: error.message || 'Erreur lors de la création de l\'article' });
            throw error;
          }
        },
        
        updateItem: async (id: string, data: any, tenantId: string) => {
          try {
            await stocksService.updateStockItem(id, data);
            // Recharger les articles après mise à jour
            await get().loadItems(tenantId);
          } catch (error: any) {
            set({ itemsError: error.message || 'Erreur lors de la mise à jour de l\'article' });
            throw error;
          }
        },
        
        deleteItem: async (id: string, tenantId: string) => {
          try {
            await stocksService.deleteStockItem(id);
            // Recharger les articles après suppression
            await get().loadItems(tenantId);
          } catch (error: any) {
            set({ itemsError: error.message || 'Erreur lors de la suppression de l\'article' });
            throw error;
          }
        },
        
        // Actions pour les mouvements
        loadMovements: async (tenantId: string, filters?: any) => {
          set({ movementsLoading: true, movementsError: null });
          
          try {
            const response = await stocksService.getStockMovements({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            // Valider que response.movements est un tableau
            const movementsData = Array.isArray(response.movements) ? response.movements : [];
            set({
              movements: movementsData,
              movementsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              movements: [], // Initialiser avec tableau vide en cas d'erreur
              movementsLoading: false,
              movementsError: error.message || 'Erreur lors du chargement des mouvements'
            });
          }
        },
        
        createMovement: async (data: any, tenantId: string) => {
          try {
            await stocksService.createStockMovement(data);
            // Recharger les mouvements et articles après création
            await Promise.all([
              get().loadMovements(tenantId),
              get().loadItems(tenantId)
            ]);
          } catch (error: any) {
            set({ movementsError: error.message || 'Erreur lors de la création du mouvement' });
            throw error;
          }
        },
        
        // Actions pour les alertes
        loadAlerts: async (tenantId: string) => {
          set({ alertsLoading: true, alertsError: null });

          try {
            const response = await stocksService.getStockAlerts({ tenantId });
            // Valider que la réponse est un tableau
            const alertsData = Array.isArray(response) ? response : (response as any)?.alerts || [];
            set({
              alerts: alertsData,
              alertsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              alerts: [], // Initialiser avec tableau vide en cas d'erreur
              alertsLoading: false,
              alertsError: error.message || 'Erreur lors du chargement des alertes'
            });
          }
        },
        
        markAlertAsRead: async (alertId: string) => {
          try {
            await stocksService.markAlertAsRead(alertId);
            // Mettre à jour l'alerte localement
            set({
              alerts: get().alerts.map(alert =>
                alert.id === alertId ? { ...alert, isRead: true } : alert
              )
            });
          } catch (error: any) {
            set({ alertsError: error.message || 'Erreur lors de la mise à jour de l\'alerte' });
            throw error;
          }
        },
        
        // Actions pour les fournisseurs
        loadSuppliers: async (tenantId: string) => {
          set({ suppliersLoading: true, suppliersError: null });
          
          try {
            const response = await stocksService.getSuppliers({ tenantId });
            // Valider que response.suppliers est un tableau
            const suppliersData = Array.isArray(response.suppliers) ? response.suppliers : [];
            set({
              suppliers: suppliersData,
              suppliersLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              suppliers: [], // Initialiser avec tableau vide en cas d'erreur
              suppliersLoading: false,
              suppliersError: error.message || 'Erreur lors du chargement des fournisseurs'
            });
          }
        },
        
        createSupplier: async (data: any, tenantId: string) => {
          try {
            await stocksService.createSupplier(data);
            // Recharger les fournisseurs après création
            await get().loadSuppliers(tenantId);
          } catch (error: any) {
            set({ suppliersError: error.message || 'Erreur lors de la création du fournisseur' });
            throw error;
          }
        },
        
        // Actions pour les métriques
        loadMetrics: async (tenantId: string) => {
          set({ metricsLoading: true, metricsError: null });
          
          try {
            const metrics = await stocksService.getMetrics(tenantId);
            set({
              metrics,
              metricsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              metricsLoading: false,
              metricsError: error.message || 'Erreur lors du chargement des métriques'
            });
          }
        },
        
        // Actions pour les filtres et pagination
        setFilters: (filters: Partial<StocksState['filters']>) => {
          set({ filters: { ...get().filters, ...filters } });
        },
        
        setPagination: (pagination: Partial<StocksState['pagination']>) => {
          set({ pagination: { ...get().pagination, ...pagination } });
        },
        
        // Actions pour le cache et la synchronisation
        refreshAll: async (tenantId: string) => {
          set({ lastFetch: null }); // Forcer le rechargement
          await Promise.all([
            get().loadItems(tenantId),
            get().loadMovements(tenantId),
            get().loadAlerts(tenantId),
            get().loadSuppliers(tenantId),
            get().loadMetrics(tenantId)
          ]);
        },
        
        clearCache: () => {
          set({
            items: [],
            movements: [],
            alerts: [],
            suppliers: [],
            metrics: null,
            lastFetch: null
          });
        },
        
        // Utilitaires
        getItemById: (id: string) => {
          return get().items.find(item => item.id === id);
        },
        
        getItemsByCategory: (category: string) => {
          return get().items.filter(item => item.category === category);
        },
        
        getCriticalAlerts: () => {
          return get().alerts.filter(alert => alert.niveau === 'critical');
        },
        
        getLowStockItems: () => {
          return get().items.filter(item => 
            item.quantiteActuelle <= item.seuilMinimum
          );
        }
      }),
      {
        name: 'crou-stocks-storage',
        partialize: (state) => ({
          items: state.items,
          movements: state.movements,
          alerts: state.alerts,
          suppliers: state.suppliers,
          metrics: state.metrics,
          lastFetch: state.lastFetch
        })
      }
    ),
    { name: 'StocksStore' }
  )
);

// Hooks spécialisés pour une utilisation plus facile
export const useStockItems = () => useStocks(state => ({
  items: state.items,
  loading: state.itemsLoading,
  error: state.itemsError,
  loadItems: state.loadItems,
  createItem: state.createItem,
  updateItem: state.updateItem,
  deleteItem: state.deleteItem
}));

export const useStockMovements = () => useStocks(state => ({
  movements: state.movements,
  loading: state.movementsLoading,
  error: state.movementsError,
  loadMovements: state.loadMovements,
  createMovement: state.createMovement
}));

export const useStockAlerts = () => useStocks(state => ({
  alerts: state.alerts,
  loading: state.alertsLoading,
  error: state.alertsError,
  loadAlerts: state.loadAlerts,
  markAlertAsRead: state.markAlertAsRead,
  criticalAlerts: state.getCriticalAlerts()
}));

export const useStocksMetrics = () => useStocks(state => ({
  metrics: state.metrics,
  loading: state.metricsLoading,
  error: state.metricsError,
  loadMetrics: state.loadMetrics
}));
