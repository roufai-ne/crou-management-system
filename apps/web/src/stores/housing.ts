/**
 * FICHIER: apps/web/src/stores/housing.ts
 * STORE: HousingStore - Store Zustand pour la gestion des logements
 *
 * DESCRIPTION:
 * Store centralisé pour la gestion de l'état des logements
 * Gestion des cités, chambres, résidents et maintenance
 * Support multi-tenant avec cache intelligent
 *
 * FONCTIONNALITÉS:
 * - Gestion des cités universitaires
 * - Attribution des chambres
 * - Suivi des résidents
 * - Gestion de la maintenance
 * - Paiements et revenus
 * - Métriques et statistiques
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  HousingComplex, 
  Room, 
  Resident, 
  MaintenanceRequest, 
  Payment, 
  HousingMetrics,
  housingService 
} from '@/services/api/housingService';

// Interface pour l'état des logements
interface HousingState {
  // Cités universitaires
  complexes: HousingComplex[];
  complexesLoading: boolean;
  complexesError: string | null;
  
  // Chambres
  rooms: Room[];
  roomsLoading: boolean;
  roomsError: string | null;
  
  // Résidents
  residents: Resident[];
  residentsLoading: boolean;
  residentsError: string | null;
  
  // Maintenance
  maintenanceRequests: MaintenanceRequest[];
  maintenanceLoading: boolean;
  maintenanceError: string | null;
  
  // Paiements
  payments: Payment[];
  paymentsLoading: boolean;
  paymentsError: string | null;
  
  // Métriques
  metrics: HousingMetrics | null;
  metricsLoading: boolean;
  metricsError: string | null;
  
  // Filtres et pagination
  filters: {
    search: string;
    status: string;
    type: string;
    complexId: string;
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
interface HousingActions {
  // Cités universitaires
  loadComplexes: (tenantId: string, filters?: Partial<HousingState['filters']>) => Promise<void>;
  createComplex: (data: any, tenantId: string) => Promise<void>;
  updateComplex: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteComplex: (id: string, tenantId: string) => Promise<void>;
  
  // Chambres
  loadRooms: (tenantId: string, filters?: any) => Promise<void>;
  createRoom: (data: any, tenantId: string) => Promise<void>;
  updateRoom: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteRoom: (id: string, tenantId: string) => Promise<void>;
  
  // Résidents
  loadResidents: (tenantId: string, filters?: any) => Promise<void>;
  createResident: (data: any, tenantId: string) => Promise<void>;
  updateResident: (id: string, data: any, tenantId: string) => Promise<void>;
  deleteResident: (id: string, tenantId: string) => Promise<void>;
  
  // Maintenance
  loadMaintenanceRequests: (tenantId: string, filters?: any) => Promise<void>;
  createMaintenanceRequest: (data: any, tenantId: string) => Promise<void>;
  updateMaintenanceRequest: (id: string, data: any, tenantId: string) => Promise<void>;
  
  // Paiements
  loadPayments: (tenantId: string, filters?: any) => Promise<void>;
  createPayment: (data: any, tenantId: string) => Promise<void>;
  
  // Métriques
  loadMetrics: (tenantId: string) => Promise<void>;
  
  // Filtres et pagination
  setFilters: (filters: Partial<HousingState['filters']>) => void;
  setPagination: (pagination: Partial<HousingState['pagination']>) => void;
  
  // Cache et synchronisation
  refreshAll: (tenantId: string) => Promise<void>;
  clearCache: () => void;
  
  // Utilitaires
  getComplexById: (id: string) => HousingComplex | undefined;
  getRoomsByComplex: (complexId: string) => Room[];
  getResidentsByRoom: (roomId: string) => Resident[];
  getAvailableRooms: () => Room[];
  getOccupiedRooms: () => Room[];
  getMaintenanceRooms: () => Room[];
  getOverduePayments: () => Payment[];
}

// Store principal
export const useHousing = create<HousingState & HousingActions>()(
  devtools(
    persist(
      (set, get) => ({
        // État initial
        complexes: [],
        complexesLoading: false,
        complexesError: null,
        
        rooms: [],
        roomsLoading: false,
        roomsError: null,
        
        residents: [],
        residentsLoading: false,
        residentsError: null,
        
        maintenanceRequests: [],
        maintenanceLoading: false,
        maintenanceError: null,
        
        payments: [],
        paymentsLoading: false,
        paymentsError: null,
        
        metrics: null,
        metricsLoading: false,
        metricsError: null,
        
        filters: {
          search: '',
          status: 'all',
          type: 'all',
          complexId: 'all'
        },
        
        pagination: {
          page: 1,
          limit: 10,
          total: 0
        },
        
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000, // 5 minutes
        
        // Actions pour les cités
        loadComplexes: async (tenantId: string, filters?: Partial<HousingState['filters']>) => {
          set({ complexesLoading: true, complexesError: null });
          
          try {
            const currentFilters = { ...get().filters, ...filters };
            const response = await housingService.getComplexes({
              tenantId,
              ...currentFilters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              complexes: response.complexes,
              pagination: {
                ...get().pagination,
                total: response.total
              },
              complexesLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              complexesLoading: false,
              complexesError: error.message || 'Erreur lors du chargement des cités'
            });
          }
        },
        
        createComplex: async (data: any, tenantId: string) => {
          try {
            await housingService.createComplex(data);
            await get().loadComplexes(tenantId);
          } catch (error: any) {
            set({ complexesError: error.message || 'Erreur lors de la création de la cité' });
            throw error;
          }
        },
        
        updateComplex: async (id: string, data: any, tenantId: string) => {
          try {
            await housingService.updateComplex(id, data);
            await get().loadComplexes(tenantId);
          } catch (error: any) {
            set({ complexesError: error.message || 'Erreur lors de la mise à jour de la cité' });
            throw error;
          }
        },
        
        deleteComplex: async (id: string, tenantId: string) => {
          try {
            await housingService.deleteComplex(id);
            await get().loadComplexes(tenantId);
          } catch (error: any) {
            set({ complexesError: error.message || 'Erreur lors de la suppression de la cité' });
            throw error;
          }
        },
        
        // Actions pour les chambres
        loadRooms: async (tenantId: string, filters?: any) => {
          set({ roomsLoading: true, roomsError: null });
          
          try {
            const response = await housingService.getRooms({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              rooms: response.rooms,
              roomsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              roomsLoading: false,
              roomsError: error.message || 'Erreur lors du chargement des chambres'
            });
          }
        },
        
        createRoom: async (data: any, tenantId: string) => {
          try {
            await housingService.createRoom(data);
            await get().loadRooms(tenantId);
          } catch (error: any) {
            set({ roomsError: error.message || 'Erreur lors de la création de la chambre' });
            throw error;
          }
        },
        
        updateRoom: async (id: string, data: any, tenantId: string) => {
          try {
            await housingService.updateRoom(id, data);
            await get().loadRooms(tenantId);
          } catch (error: any) {
            set({ roomsError: error.message || 'Erreur lors de la mise à jour de la chambre' });
            throw error;
          }
        },
        
        deleteRoom: async (id: string, tenantId: string) => {
          try {
            await housingService.deleteRoom(id);
            await get().loadRooms(tenantId);
          } catch (error: any) {
            set({ roomsError: error.message || 'Erreur lors de la suppression de la chambre' });
            throw error;
          }
        },
        
        // Actions pour les résidents
        loadResidents: async (tenantId: string, filters?: any) => {
          set({ residentsLoading: true, residentsError: null });
          
          try {
            const response = await housingService.getResidents({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              residents: response.residents,
              residentsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              residentsLoading: false,
              residentsError: error.message || 'Erreur lors du chargement des résidents'
            });
          }
        },
        
        createResident: async (data: any, tenantId: string) => {
          try {
            await housingService.createResident(data);
            await Promise.all([
              get().loadResidents(tenantId),
              get().loadRooms(tenantId)
            ]);
          } catch (error: any) {
            set({ residentsError: error.message || 'Erreur lors de la création du résident' });
            throw error;
          }
        },
        
        updateResident: async (id: string, data: any, tenantId: string) => {
          try {
            await housingService.updateResident(id, data);
            await get().loadResidents(tenantId);
          } catch (error: any) {
            set({ residentsError: error.message || 'Erreur lors de la mise à jour du résident' });
            throw error;
          }
        },
        
        deleteResident: async (id: string, tenantId: string) => {
          try {
            await housingService.deleteResident(id);
            await Promise.all([
              get().loadResidents(tenantId),
              get().loadRooms(tenantId)
            ]);
          } catch (error: any) {
            set({ residentsError: error.message || 'Erreur lors de la suppression du résident' });
            throw error;
          }
        },
        
        // Actions pour la maintenance
        loadMaintenanceRequests: async (tenantId: string, filters?: any) => {
          set({ maintenanceLoading: true, maintenanceError: null });
          
          try {
            const response = await housingService.getMaintenanceRequests({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              maintenanceRequests: response.requests,
              maintenanceLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              maintenanceLoading: false,
              maintenanceError: error.message || 'Erreur lors du chargement des demandes de maintenance'
            });
          }
        },
        
        createMaintenanceRequest: async (data: any, tenantId: string) => {
          try {
            await housingService.createMaintenanceRequest(data);
            await get().loadMaintenanceRequests(tenantId);
          } catch (error: any) {
            set({ maintenanceError: error.message || 'Erreur lors de la création de la demande de maintenance' });
            throw error;
          }
        },
        
        updateMaintenanceRequest: async (id: string, data: any, tenantId: string) => {
          try {
            await housingService.updateMaintenanceRequest(id, data);
            await get().loadMaintenanceRequests(tenantId);
          } catch (error: any) {
            set({ maintenanceError: error.message || 'Erreur lors de la mise à jour de la demande de maintenance' });
            throw error;
          }
        },
        
        // Actions pour les paiements
        loadPayments: async (tenantId: string, filters?: any) => {
          set({ paymentsLoading: true, paymentsError: null });
          
          try {
            const response = await housingService.getPayments({
              tenantId,
              ...filters,
              page: get().pagination.page,
              limit: get().pagination.limit
            });
            
            set({
              payments: response.payments,
              paymentsLoading: false,
              lastFetch: Date.now()
            });
          } catch (error: any) {
            set({
              paymentsLoading: false,
              paymentsError: error.message || 'Erreur lors du chargement des paiements'
            });
          }
        },
        
        createPayment: async (data: any, tenantId: string) => {
          try {
            await housingService.createPayment(data);
            await Promise.all([
              get().loadPayments(tenantId),
              get().loadResidents(tenantId)
            ]);
          } catch (error: any) {
            set({ paymentsError: error.message || 'Erreur lors de la création du paiement' });
            throw error;
          }
        },
        
        // Actions pour les métriques
        loadMetrics: async (tenantId: string) => {
          set({ metricsLoading: true, metricsError: null });
          
          try {
            const metrics = await housingService.getMetrics(tenantId);
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
        setFilters: (filters: Partial<HousingState['filters']>) => {
          set({ filters: { ...get().filters, ...filters } });
        },
        
        setPagination: (pagination: Partial<HousingState['pagination']>) => {
          set({ pagination: { ...get().pagination, ...pagination } });
        },
        
        // Actions pour le cache et la synchronisation
        refreshAll: async (tenantId: string) => {
          set({ lastFetch: null }); // Forcer le rechargement
          await Promise.all([
            get().loadComplexes(tenantId),
            get().loadRooms(tenantId),
            get().loadResidents(tenantId),
            get().loadMaintenanceRequests(tenantId),
            get().loadPayments(tenantId),
            get().loadMetrics(tenantId)
          ]);
        },
        
        clearCache: () => {
          set({
            complexes: [],
            rooms: [],
            residents: [],
            maintenanceRequests: [],
            payments: [],
            metrics: null,
            lastFetch: null
          });
        },
        
        // Utilitaires
        getComplexById: (id: string) => {
          return get().complexes.find(complex => complex.id === id);
        },
        
        getRoomsByComplex: (complexId: string) => {
          return get().rooms.filter(room => room.complexId === complexId);
        },
        
        getResidentsByRoom: (roomId: string) => {
          return get().residents.filter(resident => resident.roomId === roomId);
        },
        
        getAvailableRooms: () => {
          return get().rooms.filter(room => room.status === 'available');
        },
        
        getOccupiedRooms: () => {
          return get().rooms.filter(room => room.status === 'occupied');
        },
        
        getMaintenanceRooms: () => {
          return get().rooms.filter(room => room.status === 'maintenance');
        },
        
        getOverduePayments: () => {
          const today = new Date();
          return get().payments.filter(payment => 
            payment.status === 'pending' && 
            new Date(payment.dueDate) < today
          );
        }
      }),
      {
        name: 'crou-housing-storage',
        partialize: (state) => ({
          complexes: state.complexes,
          rooms: state.rooms,
          residents: state.residents,
          maintenanceRequests: state.maintenanceRequests,
          payments: state.payments,
          metrics: state.metrics,
          lastFetch: state.lastFetch
        })
      }
    ),
    { name: 'HousingStore' }
  )
);

// Hooks spécialisés pour une utilisation plus facile
export const useHousingComplexes = () => useHousing(state => ({
  complexes: state.complexes,
  loading: state.complexesLoading,
  error: state.complexesError,
  loadComplexes: state.loadComplexes,
  createComplex: state.createComplex,
  updateComplex: state.updateComplex,
  deleteComplex: state.deleteComplex
}));

export const useHousingRooms = () => useHousing(state => ({
  rooms: state.rooms,
  loading: state.roomsLoading,
  error: state.roomsError,
  loadRooms: state.loadRooms,
  createRoom: state.createRoom,
  updateRoom: state.updateRoom,
  deleteRoom: state.deleteRoom
}));

export const useHousingResidents = () => useHousing(state => ({
  residents: state.residents,
  loading: state.residentsLoading,
  error: state.residentsError,
  loadResidents: state.loadResidents,
  createResident: state.createResident,
  updateResident: state.updateResident,
  deleteResident: state.deleteResident
}));

export const useHousingMaintenance = () => useHousing(state => ({
  maintenanceRequests: state.maintenanceRequests,
  loading: state.maintenanceLoading,
  error: state.maintenanceError,
  loadMaintenanceRequests: state.loadMaintenanceRequests,
  createMaintenanceRequest: state.createMaintenanceRequest,
  updateMaintenanceRequest: state.updateMaintenanceRequest
}));

export const useHousingPayments = () => useHousing(state => ({
  payments: state.payments,
  loading: state.paymentsLoading,
  error: state.paymentsError,
  loadPayments: state.loadPayments,
  createPayment: state.createPayment
}));

export const useHousingMetrics = () => useHousing(state => ({
  metrics: state.metrics,
  loading: state.metricsLoading,
  error: state.metricsError,
  loadMetrics: state.loadMetrics
}));
