/**
 * FICHIER: apps/web/src/stores/transport.ts
 * STORE: TransportStore - Store Zustand pour la gestion du transport
 *
 * DESCRIPTION:
 * Store centralisé pour la gestion de l'état du transport
 * Gestion des véhicules, chauffeurs, routes et maintenance
 * Support multi-tenant avec cache intelligent
 *
 * FONCTIONNALITÉS:
 * - Gestion du parc de véhicules
 * - Gestion des chauffeurs
 * - Planification des trajets
 * - Suivi de la maintenance
 * - Métriques et statistiques
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Vehicle, 
  Driver, 
  Route, 
  ScheduledTrip, 
  MaintenanceRecord, 
  TransportMetrics,
  transportService 
} from '@/services/api/transportService';

// Interface pour l'état du transport
interface TransportState {
  // Véhicules
  vehicles: Vehicle[];
  vehiclesLoading: boolean;
  vehiclesError: string | null;
  
  // Chauffeurs
  drivers: Driver[];
  driversLoading: boolean;
  driversError: string | null;
  
  // Routes
  routes: Route[];
  routesLoading: boolean;
  routesError: string | null;
  
  // Trajets programmés
  scheduledTrips: ScheduledTrip[];
  tripsLoading: boolean;
  tripsError: string | null;
  
  // Maintenance
  maintenanceRecords: MaintenanceRecord[];
  maintenanceLoading: boolean;
  maintenanceError: string | null;

  // Usages
  usages: any[];
  usagesLoading: boolean;
  usagesError: string | null;

  // Maintenances
  maintenances: any[];
  maintenancesLoading: boolean;
  maintenancesError: string | null;
  
  // Métriques
  metrics: TransportMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Filtres et pagination
  filters: {
    search: string;
    status: string;
    type: string;
    dateFrom: Date;
    dateTo: Date;
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
interface TransportActions {
  // Véhicules
  loadVehicles: (tenantId: string, filters?: Partial<TransportState['filters']>) => Promise<void>;
  createVehicle: (data: any, tenantId: string) => Promise<void>;
  updateVehicle: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteVehicle: (id: string, tenantId: string) => Promise<void>;
  
  // Chauffeurs
  loadDrivers: (tenantId: string, filters?: any) => Promise<void>;
  createDriver: (data: any, tenantId: string) => Promise<void>;
  updateDriver: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteDriver: (id: string, tenantId: string) => Promise<void>;
  
  // Routes
  loadRoutes: (tenantId: string, filters?: any) => Promise<void>;
  createRoute: (data: any, tenantId: string) => Promise<void>;
  updateRoute: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteRoute: (id: string, tenantId: string) => Promise<void>;
  
  // Trajets programmés
  loadScheduledTrips: (tenantId: string, filters?: any) => Promise<void>;
  createScheduledTrip: (data: any, tenantId: string) => Promise<void>;
  updateScheduledTrip: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteScheduledTrip: (id: string, tenantId: string) => Promise<void>;
  
  // Maintenance
  loadMaintenanceRecords: (tenantId: string, filters?: any) => Promise<void>;
  createMaintenanceRecord: (data: any, tenantId: string) => Promise<void>;
  updateMaintenanceRecord: (id: string, data: any, tenantId: string) => Promise<void>;
  
  // Métriques
  loadMetrics: (tenantId: string) => Promise<void>;
  
  // Filtres et pagination
  setFilters: (filters: Partial<TransportState['filters']>) => void;
  setPagination: (pagination: Partial<TransportState['pagination']>) => void;
  
  // Cache et synchronisation
  refreshAll: (tenantId: string) => Promise<void>;
  clearCache: () => void;
  
  // Utilitaires
  getVehicleById: (id: string) => Vehicle | undefined;
  getDriverById: (id: string) => Driver | undefined;
  getRouteById: (id: string) => Route | undefined;
  getActiveVehicles: () => Vehicle[];
  getMaintenanceVehicles: () => Vehicle[];
  getActiveDrivers: () => Driver[];
  getUpcomingMaintenance: () => Vehicle[];
  getOverdueMaintenance: () => Vehicle[];
}

// Store principal
export const useTransport = create<TransportState & TransportActions>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        vehicles: [],
        vehiclesLoading: false,
        vehiclesError: null,

        drivers: [],
        driversLoading: false,
        driversError: null,

        routes: [],
        routesLoading: false,
        routesError: null,

        scheduledTrips: [],
        tripsLoading: false,
        tripsError: null,

        maintenanceRecords: [],
        maintenanceLoading: false,
        maintenanceError: null,

        usages: [],
        usagesLoading: false,
        usagesError: null,

        maintenances: [],
        maintenancesLoading: false,
        maintenancesError: null,

        metrics: null,
        metricsLoading: false,
        metricsError: null,
        
        filters: {
          search: '',
          status: 'all',
          type: 'all',
          dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
          dateTo: new Date()
        },
        
        pagination: {
          page: 1,
          limit: 10,
          total: 0
        },
        
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        
        // Actions pour les véhicules
        loadVehicles: async (tenantId: string, filters?: Partial<TransportState['filters']>) => {
          set({ vehiclesLoading: true, vehiclesError: null });

          try {
            const currentFilters = { ...get().filters, ...filters };
            const response = await transportService.getVehicles({
              ...currentFilters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });

            set({
              vehicles: response.vehicles,
              pagination: {
                ...get().pagination,
                total: response.total
              },
              vehiclesLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              vehiclesLoading: false,
              vehiclesError: error.message || 'Erreur lors du chargement des véhicules'
            });
          }
        },
        
        createVehicle: async (data: any, tenantId: string) => {
          try {
            await transportService.createVehicle(data);
            await get().loadVehicles(tenantId);
          } catch (error: any) {
            set({ vehiclesError: error.message || 'Erreur lors de la création du véhicule' });
            throw error;
          }
        },
        
        updateVehicle: async (id: string, data: any, tenantId: string) => {
          try {
            await transportService.updateVehicle(id, data);
            await get().loadVehicles(tenantId);
          } catch (error: any) {
            set({ vehiclesError: error.message || 'Erreur lors de la mise à jour du véhicule' });
            throw error;
          }
        },
        
        deleteVehicle: async (id: string, tenantId: string) => {
          try {
            await transportService.deleteVehicle(id);
            await get().loadVehicles(tenantId);
          } catch (error: any) {
            set({ vehiclesError: error.message || 'Erreur lors de la suppression du véhicule' });
            throw error;
          }
        },
        
        // Actions pour les chauffeurs
        loadDrivers: async (tenantId: string, filters?: any) => {
          set({ driversLoading: true, driversError: null });
          
          try {
            const response = await transportService.getDrivers({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              drivers: response.drivers,
              driversLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              driversLoading: false,
              driversError: error.message || 'Erreur lors du chargement des chauffeurs'
            });
          }
        },
        
        createDriver: async (data: any, tenantId: string) => {
          try {
            await transportService.createDriver(data);
            await get().loadDrivers(tenantId);
          } catch (error: any) {
            set({ driversError: error.message || 'Erreur lors de la création du chauffeur' });
            throw error;
          }
        },
        
        updateDriver: async (id: string, data: any, tenantId: string) => {
          try {
            await transportService.updateDriver(id, data);
            await get().loadDrivers(tenantId);
          } catch (error: any) {
            set({ driversError: error.message || 'Erreur lors de la mise à jour du chauffeur' });
            throw error;
          }
        },
        
        deleteDriver: async (id: string, tenantId: string) => {
          try {
            await transportService.deleteDriver(id);
            await get().loadDrivers(tenantId);
          } catch (error: any) {
            set({ driversError: error.message || 'Erreur lors de la suppression du chauffeur' });
            throw error;
          }
        },
        
        // Actions pour les routes
        loadRoutes: async (tenantId: string, filters?: any) => {
          set({ routesLoading: true, routesError: null });
          
          try {
            const response = await transportService.getRoutes({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              routes: response.routes,
              routesLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              routesLoading: false,
              routesError: error.message || 'Erreur lors du chargement des routes'
            });
          }
        },
        
        createRoute: async (data: any, tenantId: string) => {
          try {
            await transportService.createRoute(data);
            await get().loadRoutes(tenantId);
          } catch (error: any) {
            set({ routesError: error.message || 'Erreur lors de la création de la route' });
            throw error;
          }
        },
        
        updateRoute: async (id: string, data: any, tenantId: string) => {
          try {
            await transportService.updateRoute(id, data);
            await get().loadRoutes(tenantId);
          } catch (error: any) {
            set({ routesError: error.message || 'Erreur lors de la mise à jour de la route' });
            throw error;
          }
        },
        
        deleteRoute: async (id: string, tenantId: string) => {
          try {
            await transportService.deleteRoute(id);
            await get().loadRoutes(tenantId);
          } catch (error: any) {
            set({ routesError: error.message || 'Erreur lors de la suppression de la route' });
            throw error;
          }
        },
        
        // Actions pour les trajets programmés
        loadScheduledTrips: async (tenantId: string, filters?: any) => {
          set({ tripsLoading: true, tripsError: null });
          
          try {
            const response = await transportService.getScheduledTrips({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              scheduledTrips: response.trips,
              tripsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              tripsLoading: false,
              tripsError: error.message || 'Erreur lors du chargement des trajets'
            });
          }
        },
        
        createScheduledTrip: async (data: any, tenantId: string) => {
          try {
            await transportService.createScheduledTrip(data);
            await get().loadScheduledTrips(tenantId);
          } catch (error: any) {
            set({ tripsError: error.message || 'Erreur lors de la création du trajet' });
            throw error;
          }
        },
        
        updateScheduledTrip: async (id: string, data: any, tenantId: string) => {
          try {
            await transportService.updateScheduledTrip(id, data);
            await get().loadScheduledTrips(tenantId);
          } catch (error: any) {
            set({ tripsError: error.message || 'Erreur lors de la mise à jour du trajet' });
            throw error;
          }
        },
        
        deleteScheduledTrip: async (id: string, tenantId: string) => {
          try {
            await transportService.deleteScheduledTrip(id);
            await get().loadScheduledTrips(tenantId);
          } catch (error: any) {
            set({ tripsError: error.message || 'Erreur lors de la suppression du trajet' });
            throw error;
          }
        },
        
        // Actions pour la maintenance
        loadMaintenanceRecords: async (tenantId: string, filters?: any) => {
          set({ maintenanceLoading: true, maintenanceError: null });

          try {
            const response = await transportService.getMaintenances({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });

            set({
              maintenanceRecords: response.maintenances,
              maintenanceLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              maintenanceLoading: false,
              maintenanceError: error.message || 'Erreur lors du chargement des enregistrements de maintenance'
            });
          }
        },

        createMaintenanceRecord: async (data: any, tenantId: string) => {
          try {
            await transportService.createMaintenance(data);
            await get().loadMaintenanceRecords(tenantId);
          } catch (error: any) {
            set({ maintenanceError: error.message || 'Erreur lors de la création de l\'enregistrement de maintenance' });
            throw error;
          }
        },

        updateMaintenanceRecord: async (id: string, data: any, tenantId: string) => {
          try {
            await transportService.updateMaintenance(id, data);
            await get().loadMaintenanceRecords(tenantId);
          } catch (error: any) {
            set({ maintenanceError: error.message || 'Erreur lors de la mise à jour de l\'enregistrement de maintenance' });
            throw error;
          }
        },
        
        // Actions pour les métriques
        loadMetrics: async (tenantId: string) => {
          set({ metricsLoading: true, metricsError: null });
          
          try {
            const metrics = await transportService.getMetrics(tenantId);
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
        setFilters: (filters: Partial<TransportState['filters']>) => {
          set({ filters: { ...get().filters, ...filters } });
        },
        
        setPagination: (pagination: Partial<TransportState['pagination']>) => {
          set({ pagination: { ...get().pagination, ...pagination } });
        },
        
        // Actions pour le cache et la synchronisation
        refreshAll: async (tenantId: string) => {
          set({ lastFetch: null }); // Forcer le rechargement
          await Promise.all([
            get().loadVehicles(tenantId),
            get().loadDrivers(tenantId),
            get().loadRoutes(tenantId),
            get().loadScheduledTrips(tenantId),
            get().loadMaintenanceRecords(tenantId),
            get().loadMetrics(tenantId)
          ]);
        },
        
        clearCache: () => {
          set({
            vehicles: [],
            drivers: [],
            routes: [],
            scheduledTrips: [],
            maintenanceRecords: [],
            metrics: null,
            lastFetch: null
          });
        },
        
        // Utilitaires
        getVehicleById: (id: string) => {
          return get().vehicles.find(vehicle => vehicle.id === id);
        },
        
        getDriverById: (id: string) => {
          return get().drivers.find(driver => driver.id === id);
        },
        
        getRouteById: (id: string) => {
          return get().routes.find(route => route.id === id);
        },
        
        getActiveVehicles: () => {
          return get().vehicles.filter(vehicle => vehicle.status === 'active');
        },
        
        getMaintenanceVehicles: () => {
          return get().vehicles.filter(vehicle => vehicle.status === 'maintenance');
        },
        
        getActiveDrivers: () => {
          return get().drivers.filter(driver => driver.status === 'active');
        },
        
        getUpcomingMaintenance: () => {
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
          return get().vehicles.filter(vehicle => 
            vehicle.nextMaintenanceDate && 
            new Date(vehicle.nextMaintenanceDate) <= nextWeek
          );
        },
        
        getOverdueMaintenance: () => {
          const today = new Date();
          return get().vehicles.filter(vehicle => 
            vehicle.nextMaintenanceDate && 
            new Date(vehicle.nextMaintenanceDate) < today
          );
        }
      }),
      {
        name: 'crou-transport-storage',
        partialize: (state) => ({
          vehicles: state.vehicles,
          drivers: state.drivers,
          routes: state.routes,
          scheduledTrips: state.scheduledTrips,
          maintenanceRecords: state.maintenanceRecords,
          metrics: state.metrics,
          lastFetch: state.lastFetch
        })
      }
    ),
    { name: 'TransportStore' }
  )
);

// Hooks spécialisés pour une utilisation plus facile
export const useTransportVehicles = () => useTransport(state => ({
  vehicles: state.vehicles,
  loading: state.vehiclesLoading,
  error: state.vehiclesError,
  loadVehicles: state.loadVehicles,
  createVehicle: state.createVehicle,
  updateVehicle: state.updateVehicle,
  deleteVehicle: state.deleteVehicle
}));

export const useTransportDrivers = () => useTransport(state => ({
  drivers: state.drivers,
  loading: state.driversLoading,
  error: state.driversError,
  loadDrivers: state.loadDrivers,
  createDriver: state.createDriver,
  updateDriver: state.updateDriver,
  deleteDriver: state.deleteDriver
}));

export const useTransportRoutes = () => useTransport(state => ({
  routes: state.routes,
  loading: state.routesLoading,
  error: state.routesError,
  loadRoutes: state.loadRoutes,
  createRoute: state.createRoute,
  updateRoute: state.updateRoute,
  deleteRoute: state.deleteRoute
}));

export const useTransportTrips = () => useTransport(state => ({
  scheduledTrips: state.scheduledTrips,
  loading: state.tripsLoading,
  error: state.tripsError,
  loadScheduledTrips: state.loadScheduledTrips,
  createScheduledTrip: state.createScheduledTrip,
  updateScheduledTrip: state.updateScheduledTrip,
  deleteScheduledTrip: state.deleteScheduledTrip
}));

export const useTransportMaintenance = () => useTransport(state => ({
  maintenanceRecords: state.maintenanceRecords,
  loading: state.maintenanceLoading,
  error: state.maintenanceError,
  loadMaintenanceRecords: state.loadMaintenanceRecords,
  createMaintenanceRecord: state.createMaintenanceRecord,
  updateMaintenanceRecord: state.updateMaintenanceRecord
}));

export const useTransportMetrics = () => useTransport(state => ({
  metrics: state.metrics,
  loading: state.metricsLoading,
  error: state.metricsError,
  loadMetrics: state.loadMetrics
}));
