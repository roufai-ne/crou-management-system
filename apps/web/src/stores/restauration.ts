/**
 * FICHIER: apps/web/src/stores/restauration.ts
 * STORE: RestaurationStore - Store Zustand pour la gestion de la restauration
 *
 * DESCRIPTION:
 * Store centralisé pour la gestion de l'état du module Restauration
 * Gestion restaurants, menus, tickets, repas, denrées
 * Support multi-tenant avec cache intelligent
 *
 * FONCTIONNALITÉS:
 * - Gestion des restaurants universitaires
 * - Planification et composition des menus
 * - Émission et suivi des tickets repas
 * - Suivi des distributions de repas
 * - Allocation et gestion des denrées
 * - Métriques et statistiques
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import {
  Restaurant,
  Menu,
  TicketRepas,
  Repas,
  StockDenree,
  RestaurantFilters,
  MenuFilters,
  TicketFilters,
  RepasFilters,
  DenreeFilters,
  CreateRestaurantRequest,
  UpdateRestaurantRequest,
  CreateMenuRequest,
  UpdateMenuRequest,
  CreateTicketRequest,
  CreateTicketsBatchRequest,
  UtiliserTicketRequest,
  CreateRepasRequest,
  TerminerServiceRequest,
  AllouerDenreeRequest,
  BesoinDenree,
  AlerteExpiration,
  restaurationService,
} from '@/services/api/restaurationService';

// ========================================
// INTERFACES STATE
// ========================================

interface RestaurationState {
  // ========================================
  // RESTAURANTS
  // ========================================
  restaurants: Restaurant[];
  restaurantsLoading: boolean;
  restaurantsError: string | null;
  selectedRestaurant: Restaurant | null;

  // ========================================
  // MENUS
  // ========================================
  menus: Menu[];
  menusLoading: boolean;
  menusError: string | null;
  selectedMenu: Menu | null;
  besoinsDenrees: BesoinDenree[];
  besoinsLoading: boolean;

  // ========================================
  // TICKETS
  // ========================================
  tickets: TicketRepas[];
  ticketsLoading: boolean;
  ticketsError: string | null;
  selectedTicket: TicketRepas | null;

  // ========================================
  // REPAS
  // ========================================
  repas: Repas[];
  repasLoading: boolean;
  repasError: string | null;
  selectedRepas: Repas | null;

  // ========================================
  // DENRÉES
  // ========================================
  denrees: StockDenree[];
  denreesLoading: boolean;
  denreesError: string | null;
  selectedDenree: StockDenree | null;
  alertesExpiration: AlerteExpiration[];
  alertesLoading: boolean;

  // ========================================
  // FILTRES
  // ========================================
  restaurantFilters: RestaurantFilters;
  menuFilters: MenuFilters;
  ticketFilters: TicketFilters;
  repasFilters: RepasFilters;
  denreeFilters: DenreeFilters;

  // ========================================
  // PAGINATION
  // ========================================
  restaurantsPagination: {
    page: number;
    limit: number;
    total: number;
  };
  menusPagination: {
    page: number;
    limit: number;
    total: number;
  };
  ticketsPagination: {
    page: number;
    limit: number;
    total: number;
  };
  repasPagination: {
    page: number;
    limit: number;
    total: number;
  };

  // ========================================
  // CACHE
  // ========================================
  lastFetch: {
    restaurants: number | null;
    menus: number | null;
    tickets: number | null;
    repas: number | null;
    denrees: number | null;
  };
  cacheExpiry: number; // 5 minutes
}

// ========================================
// INTERFACES ACTIONS
// ========================================

interface RestaurationActions {
  // ========================================
  // RESTAURANTS
  // ========================================
  loadRestaurants: (filters?: RestaurantFilters) => Promise<void>;
  loadRestaurant: (id: string) => Promise<void>;
  createRestaurant: (data: CreateRestaurantRequest) => Promise<Restaurant>;
  updateRestaurant: (id: string, data: UpdateRestaurantRequest) => Promise<Restaurant>;
  deleteRestaurant: (id: string) => Promise<void>;
  updateFrequentationMoyenne: (id: string, frequentation: number) => Promise<void>;
  setRestaurantFilters: (filters: Partial<RestaurantFilters>) => void;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;

  // ========================================
  // MENUS
  // ========================================
  loadMenus: (filters?: MenuFilters) => Promise<void>;
  loadMenu: (id: string) => Promise<void>;
  createMenu: (data: CreateMenuRequest) => Promise<Menu>;
  updateMenu: (id: string, data: UpdateMenuRequest) => Promise<Menu>;
  deleteMenu: (id: string) => Promise<void>;
  publishMenu: (id: string) => Promise<Menu>;
  validateMenu: (id: string) => Promise<Menu>;
  duplicateMenu: (id: string, nouvelleDateService: string) => Promise<Menu>;
  calculateBesoins: (id: string, nombreRationnaires: number) => Promise<void>;
  loadMenusByRestaurantAndDate: (restaurantId: string, date: string) => Promise<void>;
  setMenuFilters: (filters: Partial<MenuFilters>) => void;
  setSelectedMenu: (menu: Menu | null) => void;

  // ========================================
  // TICKETS
  // ========================================
  loadTickets: (filters?: TicketFilters) => Promise<void>;
  loadTicketByNumero: (numeroTicket: string) => Promise<void>;
  loadTicketsByEtudiant: (etudiantId: string) => Promise<void>;
  createTicket: (data: CreateTicketRequest) => Promise<TicketRepas>;
  createTicketsBatch: (data: CreateTicketsBatchRequest) => Promise<{ tickets: TicketRepas[]; total: number }>;
  utiliserTicket: (data: UtiliserTicketRequest) => Promise<TicketRepas>;
  annulerTicket: (id: string, motif: string) => Promise<TicketRepas>;
  setTicketFilters: (filters: Partial<TicketFilters>) => void;
  setSelectedTicket: (ticket: TicketRepas | null) => void;

  // ========================================
  // REPAS
  // ========================================
  loadRepas: (filters?: RepasFilters) => Promise<void>;
  loadRepasById: (id: string) => Promise<void>;
  createRepas: (data: CreateRepasRequest) => Promise<Repas>;
  demarrerService: (id: string) => Promise<Repas>;
  terminerService: (id: string, stats: TerminerServiceRequest) => Promise<Repas>;
  annulerRepas: (id: string, motif: string) => Promise<Repas>;
  loadRepasByRestaurantAndPeriode: (restaurantId: string, dateDebut: string, dateFin: string) => Promise<void>;
  setRepasFilters: (filters: Partial<RepasFilters>) => void;
  setSelectedRepas: (repas: Repas | null) => void;

  // ========================================
  // DENRÉES
  // ========================================
  loadDenrees: (filters?: DenreeFilters) => Promise<void>;
  loadDenreesRestaurant: (restaurantId: string) => Promise<void>;
  allouerDenree: (data: AllouerDenreeRequest) => Promise<StockDenree>;
  utiliserDenree: (id: string, quantite: number, menuId?: string, repasId?: string) => Promise<StockDenree>;
  retournerDenree: (id: string, quantite: number, motif: string) => Promise<StockDenree>;
  enregistrerPerte: (id: string, quantite: number, motif: string) => Promise<StockDenree>;
  loadAlertesExpiration: (joursAvance?: number) => Promise<void>;
  setDenreeFilters: (filters: Partial<DenreeFilters>) => void;
  setSelectedDenree: (denree: StockDenree | null) => void;

  // ========================================
  // UTILITAIRES
  // ========================================
  clearErrors: () => void;
  resetFilters: () => void;
  invalidateCache: (module?: 'restaurants' | 'menus' | 'tickets' | 'repas' | 'denrees') => void;
}

// ========================================
// TYPE COMBINÉ
// ========================================

type RestaurationStore = RestaurationState & RestaurationActions;

// ========================================
// ÉTAT INITIAL
// ========================================

const initialState: RestaurationState = {
  // Restaurants
  restaurants: [],
  restaurantsLoading: false,
  restaurantsError: null,
  selectedRestaurant: null,

  // Menus
  menus: [],
  menusLoading: false,
  menusError: null,
  selectedMenu: null,
  besoinsDenrees: [],
  besoinsLoading: false,

  // Tickets
  tickets: [],
  ticketsLoading: false,
  ticketsError: null,
  selectedTicket: null,

  // Repas
  repas: [],
  repasLoading: false,
  repasError: null,
  selectedRepas: null,

  // Denrées
  denrees: [],
  denreesLoading: false,
  denreesError: null,
  selectedDenree: null,
  alertesExpiration: [],
  alertesLoading: false,

  // Filtres
  restaurantFilters: {},
  menuFilters: {},
  ticketFilters: {},
  repasFilters: {},
  denreeFilters: {},

  // Pagination
  restaurantsPagination: { page: 1, limit: 20, total: 0 },
  menusPagination: { page: 1, limit: 20, total: 0 },
  ticketsPagination: { page: 1, limit: 50, total: 0 },
  repasPagination: { page: 1, limit: 20, total: 0 },

  // Cache
  lastFetch: {
    restaurants: null,
    menus: null,
    tickets: null,
    repas: null,
    denrees: null,
  },
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

// ========================================
// STORE ZUSTAND
// ========================================

export const useRestaurationStore = create<RestaurationStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // ========================================
        // RESTAURANTS ACTIONS
        // ========================================

        loadRestaurants: async (filters?: RestaurantFilters) => {
          // Check cache
          const { lastFetch, cacheExpiry } = get();
          const now = Date.now();
          if (
            lastFetch.restaurants &&
            now - lastFetch.restaurants < cacheExpiry &&
            !filters
          ) {
            return;
          }

          set({ restaurantsLoading: true, restaurantsError: null });

          try {
            const data = await restaurationService.getRestaurants(filters);
            set({
              restaurants: data.restaurants,
              restaurantsPagination: {
                ...get().restaurantsPagination,
                total: data.total,
              },
              restaurantsLoading: false,
              lastFetch: { ...get().lastFetch, restaurants: now },
            });
          } catch (error: any) {
            set({
              restaurantsError: error.message || 'Erreur chargement restaurants',
              restaurantsLoading: false,
            });
          }
        },

        loadRestaurant: async (id: string) => {
          set({ restaurantsLoading: true, restaurantsError: null });

          try {
            const restaurant = await restaurationService.getRestaurant(id);
            set({
              selectedRestaurant: restaurant,
              restaurantsLoading: false,
            });
          } catch (error: any) {
            set({
              restaurantsError: error.message || 'Erreur chargement restaurant',
              restaurantsLoading: false,
            });
          }
        },

        createRestaurant: async (data: CreateRestaurantRequest) => {
          set({ restaurantsLoading: true, restaurantsError: null });

          try {
            const restaurant = await restaurationService.createRestaurant(data);
            set({
              restaurants: [...get().restaurants, restaurant],
              restaurantsLoading: false,
            });
            get().invalidateCache('restaurants');
            return restaurant;
          } catch (error: any) {
            set({
              restaurantsError: error.message || 'Erreur création restaurant',
              restaurantsLoading: false,
            });
            throw error;
          }
        },

        updateRestaurant: async (id: string, data: UpdateRestaurantRequest) => {
          set({ restaurantsLoading: true, restaurantsError: null });

          try {
            const updated = await restaurationService.updateRestaurant(id, data);
            set({
              restaurants: get().restaurants.map((r) => (r.id === id ? updated : r)),
              selectedRestaurant:
                get().selectedRestaurant?.id === id ? updated : get().selectedRestaurant,
              restaurantsLoading: false,
            });
            return updated;
          } catch (error: any) {
            set({
              restaurantsError: error.message || 'Erreur modification restaurant',
              restaurantsLoading: false,
            });
            throw error;
          }
        },

        deleteRestaurant: async (id: string) => {
          set({ restaurantsLoading: true, restaurantsError: null });

          try {
            await restaurationService.deleteRestaurant(id);
            set({
              restaurants: get().restaurants.filter((r) => r.id !== id),
              selectedRestaurant:
                get().selectedRestaurant?.id === id ? null : get().selectedRestaurant,
              restaurantsLoading: false,
            });
            get().invalidateCache('restaurants');
          } catch (error: any) {
            set({
              restaurantsError: error.message || 'Erreur suppression restaurant',
              restaurantsLoading: false,
            });
            throw error;
          }
        },

        updateFrequentationMoyenne: async (id: string, frequentation: number) => {
          try {
            const updated = await restaurationService.updateFrequentationMoyenne(id, frequentation);
            set({
              restaurants: get().restaurants.map((r) => (r.id === id ? updated : r)),
              selectedRestaurant:
                get().selectedRestaurant?.id === id ? updated : get().selectedRestaurant,
            });
          } catch (error: any) {
            set({ restaurantsError: error.message });
            throw error;
          }
        },

        setRestaurantFilters: (filters: Partial<RestaurantFilters>) => {
          set({ restaurantFilters: { ...get().restaurantFilters, ...filters } });
        },

        setSelectedRestaurant: (restaurant: Restaurant | null) => {
          set({ selectedRestaurant: restaurant });
        },

        // ========================================
        // MENUS ACTIONS
        // ========================================

        loadMenus: async (filters?: MenuFilters) => {
          const { lastFetch, cacheExpiry } = get();
          const now = Date.now();
          if (lastFetch.menus && now - lastFetch.menus < cacheExpiry && !filters) {
            return;
          }

          set({ menusLoading: true, menusError: null });

          try {
            const data = await restaurationService.getMenus(filters);
            set({
              menus: data.menus,
              menusPagination: { ...get().menusPagination, total: data.total },
              menusLoading: false,
              lastFetch: { ...get().lastFetch, menus: now },
            });
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur chargement menus',
              menusLoading: false,
            });
          }
        },

        loadMenu: async (id: string) => {
          set({ menusLoading: true, menusError: null });

          try {
            const menu = await restaurationService.getMenu(id);
            set({ selectedMenu: menu, menusLoading: false });
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur chargement menu',
              menusLoading: false,
            });
          }
        },

        createMenu: async (data: CreateMenuRequest) => {
          set({ menusLoading: true, menusError: null });

          try {
            const menu = await restaurationService.createMenu(data);
            set({
              menus: [...get().menus, menu],
              menusLoading: false,
            });
            get().invalidateCache('menus');
            return menu;
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur création menu',
              menusLoading: false,
            });
            throw error;
          }
        },

        updateMenu: async (id: string, data: UpdateMenuRequest) => {
          set({ menusLoading: true, menusError: null });

          try {
            const updated = await restaurationService.updateMenu(id, data);
            set({
              menus: get().menus.map((m) => (m.id === id ? updated : m)),
              selectedMenu: get().selectedMenu?.id === id ? updated : get().selectedMenu,
              menusLoading: false,
            });
            return updated;
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur modification menu',
              menusLoading: false,
            });
            throw error;
          }
        },

        deleteMenu: async (id: string) => {
          set({ menusLoading: true, menusError: null });

          try {
            await restaurationService.deleteMenu(id);
            set({
              menus: get().menus.filter((m) => m.id !== id),
              selectedMenu: get().selectedMenu?.id === id ? null : get().selectedMenu,
              menusLoading: false,
            });
            get().invalidateCache('menus');
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur suppression menu',
              menusLoading: false,
            });
            throw error;
          }
        },

        publishMenu: async (id: string) => {
          set({ menusLoading: true, menusError: null });

          try {
            const published = await restaurationService.publishMenu(id);
            set({
              menus: get().menus.map((m) => (m.id === id ? published : m)),
              selectedMenu: get().selectedMenu?.id === id ? published : get().selectedMenu,
              menusLoading: false,
            });
            return published;
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur publication menu',
              menusLoading: false,
            });
            throw error;
          }
        },

        validateMenu: async (id: string) => {
          set({ menusLoading: true, menusError: null });

          try {
            const validated = await restaurationService.validateMenu(id);
            set({
              menus: get().menus.map((m) => (m.id === id ? validated : m)),
              selectedMenu: get().selectedMenu?.id === id ? validated : get().selectedMenu,
              menusLoading: false,
            });
            return validated;
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur validation menu',
              menusLoading: false,
            });
            throw error;
          }
        },

        duplicateMenu: async (id: string, nouvelleDateService: string) => {
          set({ menusLoading: true, menusError: null });

          try {
            const duplicated = await restaurationService.duplicateMenu(id, nouvelleDateService);
            set({
              menus: [duplicated, ...get().menus],
              menusLoading: false,
            });
            get().invalidateCache('menus');
            return duplicated;
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur duplication menu',
              menusLoading: false,
            });
            throw error;
          }
        },

        calculateBesoins: async (id: string, nombreRationnaires: number) => {
          set({ besoinsLoading: true });

          try {
            const besoins = await restaurationService.calculateBesoins(id, nombreRationnaires);
            set({ besoinsDenrees: besoins, besoinsLoading: false });
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur calcul besoins',
              besoinsLoading: false,
            });
            throw error;
          }
        },

        loadMenusByRestaurantAndDate: async (restaurantId: string, date: string) => {
          set({ menusLoading: true, menusError: null });

          try {
            const menus = await restaurationService.getMenusByRestaurantAndDate(restaurantId, date);
            set({ menus, menusLoading: false });
          } catch (error: any) {
            set({
              menusError: error.message || 'Erreur chargement menus',
              menusLoading: false,
            });
          }
        },

        setMenuFilters: (filters: Partial<MenuFilters>) => {
          set({ menuFilters: { ...get().menuFilters, ...filters } });
        },

        setSelectedMenu: (menu: Menu | null) => {
          set({ selectedMenu: menu });
        },

        // ========================================
        // TICKETS ACTIONS
        // ========================================

        loadTickets: async (filters?: TicketFilters) => {
          const { lastFetch, cacheExpiry } = get();
          const now = Date.now();
          if (lastFetch.tickets && now - lastFetch.tickets < cacheExpiry && !filters) {
            return;
          }

          set({ ticketsLoading: true, ticketsError: null });

          try {
            const data = await restaurationService.getTickets(filters);
            set({
              tickets: data.tickets,
              ticketsPagination: { ...get().ticketsPagination, total: data.total },
              ticketsLoading: false,
              lastFetch: { ...get().lastFetch, tickets: now },
            });
          } catch (error: any) {
            set({
              ticketsError: error.message || 'Erreur chargement tickets',
              ticketsLoading: false,
            });
          }
        },

        loadTicketByNumero: async (numeroTicket: string) => {
          set({ ticketsLoading: true, ticketsError: null });

          try {
            const ticket = await restaurationService.getTicketByNumero(numeroTicket);
            set({ selectedTicket: ticket, ticketsLoading: false });
          } catch (error: any) {
            set({
              ticketsError: error.message || 'Ticket non trouvé',
              ticketsLoading: false,
            });
          }
        },

        loadTicketsByEtudiant: async (etudiantId: string) => {
          set({ ticketsLoading: true, ticketsError: null });

          try {
            const data = await restaurationService.getTicketsByEtudiant(etudiantId);
            set({
              tickets: data.tickets,
              ticketsLoading: false,
            });
          } catch (error: any) {
            set({
              ticketsError: error.message || 'Erreur chargement tickets étudiant',
              ticketsLoading: false,
            });
          }
        },

        createTicket: async (data: CreateTicketRequest) => {
          set({ ticketsLoading: true, ticketsError: null });

          try {
            const ticket = await restaurationService.createTicket(data);
            set({
              tickets: [ticket, ...get().tickets],
              ticketsLoading: false,
            });
            get().invalidateCache('tickets');
            return ticket;
          } catch (error: any) {
            set({
              ticketsError: error.message || 'Erreur émission ticket',
              ticketsLoading: false,
            });
            throw error;
          }
        },

        createTicketsBatch: async (data: CreateTicketsBatchRequest) => {
          set({ ticketsLoading: true, ticketsError: null });

          try {
            const result = await restaurationService.createTicketsBatch(data);
            set({
              tickets: [...result.tickets, ...get().tickets],
              ticketsLoading: false,
            });
            get().invalidateCache('tickets');
            return result;
          } catch (error: any) {
            set({
              ticketsError: error.message || 'Erreur émission tickets en lot',
              ticketsLoading: false,
            });
            throw error;
          }
        },

        utiliserTicket: async (data: UtiliserTicketRequest) => {
          set({ ticketsLoading: true, ticketsError: null });

          try {
            const ticket = await restaurationService.utiliserTicket(data);
            set({
              tickets: get().tickets.map((t) => (t.id === ticket.id ? ticket : t)),
              selectedTicket: get().selectedTicket?.id === ticket.id ? ticket : get().selectedTicket,
              ticketsLoading: false,
            });
            return ticket;
          } catch (error: any) {
            set({
              ticketsError: error.message || 'Erreur utilisation ticket',
              ticketsLoading: false,
            });
            throw error;
          }
        },

        annulerTicket: async (id: string, motif: string) => {
          set({ ticketsLoading: true, ticketsError: null });

          try {
            const ticket = await restaurationService.annulerTicket(id, motif);
            set({
              tickets: get().tickets.map((t) => (t.id === id ? ticket : t)),
              selectedTicket: get().selectedTicket?.id === id ? ticket : get().selectedTicket,
              ticketsLoading: false,
            });
            return ticket;
          } catch (error: any) {
            set({
              ticketsError: error.message || 'Erreur annulation ticket',
              ticketsLoading: false,
            });
            throw error;
          }
        },

        setTicketFilters: (filters: Partial<TicketFilters>) => {
          set({ ticketFilters: { ...get().ticketFilters, ...filters } });
        },

        setSelectedTicket: (ticket: TicketRepas | null) => {
          set({ selectedTicket: ticket });
        },

        // ========================================
        // REPAS ACTIONS
        // ========================================

        loadRepas: async (filters?: RepasFilters) => {
          const { lastFetch, cacheExpiry } = get();
          const now = Date.now();
          if (lastFetch.repas && now - lastFetch.repas < cacheExpiry && !filters) {
            return;
          }

          set({ repasLoading: true, repasError: null });

          try {
            const data = await restaurationService.getRepas(filters);
            set({
              repas: data.repas,
              repasPagination: { ...get().repasPagination, total: data.total },
              repasLoading: false,
              lastFetch: { ...get().lastFetch, repas: now },
            });
          } catch (error: any) {
            set({
              repasError: error.message || 'Erreur chargement repas',
              repasLoading: false,
            });
          }
        },

        loadRepasById: async (id: string) => {
          set({ repasLoading: true, repasError: null });

          try {
            const repas = await restaurationService.getRepasById(id);
            set({ selectedRepas: repas, repasLoading: false });
          } catch (error: any) {
            set({
              repasError: error.message || 'Erreur chargement repas',
              repasLoading: false,
            });
          }
        },

        createRepas: async (data: CreateRepasRequest) => {
          set({ repasLoading: true, repasError: null });

          try {
            const repas = await restaurationService.createRepas(data);
            set({
              repas: [repas, ...get().repas],
              repasLoading: false,
            });
            get().invalidateCache('repas');
            return repas;
          } catch (error: any) {
            set({
              repasError: error.message || 'Erreur création repas',
              repasLoading: false,
            });
            throw error;
          }
        },

        demarrerService: async (id: string) => {
          set({ repasLoading: true, repasError: null });

          try {
            const repas = await restaurationService.demarrerService(id);
            set({
              repas: get().repas.map((r) => (r.id === id ? repas : r)),
              selectedRepas: get().selectedRepas?.id === id ? repas : get().selectedRepas,
              repasLoading: false,
            });
            return repas;
          } catch (error: any) {
            set({
              repasError: error.message || 'Erreur démarrage service',
              repasLoading: false,
            });
            throw error;
          }
        },

        terminerService: async (id: string, stats: TerminerServiceRequest) => {
          set({ repasLoading: true, repasError: null });

          try {
            const repas = await restaurationService.terminerService(id, stats);
            set({
              repas: get().repas.map((r) => (r.id === id ? repas : r)),
              selectedRepas: get().selectedRepas?.id === id ? repas : get().selectedRepas,
              repasLoading: false,
            });
            return repas;
          } catch (error: any) {
            set({
              repasError: error.message || 'Erreur fin service',
              repasLoading: false,
            });
            throw error;
          }
        },

        annulerRepas: async (id: string, motif: string) => {
          set({ repasLoading: true, repasError: null });

          try {
            const repas = await restaurationService.annulerRepas(id, motif);
            set({
              repas: get().repas.map((r) => (r.id === id ? repas : r)),
              selectedRepas: get().selectedRepas?.id === id ? repas : get().selectedRepas,
              repasLoading: false,
            });
            return repas;
          } catch (error: any) {
            set({
              repasError: error.message || 'Erreur annulation repas',
              repasLoading: false,
            });
            throw error;
          }
        },

        loadRepasByRestaurantAndPeriode: async (
          restaurantId: string,
          dateDebut: string,
          dateFin: string
        ) => {
          set({ repasLoading: true, repasError: null });

          try {
            const data = await restaurationService.getRepasByRestaurantAndPeriode(
              restaurantId,
              dateDebut,
              dateFin
            );
            set({
              repas: data.repas,
              repasLoading: false,
            });
          } catch (error: any) {
            set({
              repasError: error.message || 'Erreur chargement repas',
              repasLoading: false,
            });
          }
        },

        setRepasFilters: (filters: Partial<RepasFilters>) => {
          set({ repasFilters: { ...get().repasFilters, ...filters } });
        },

        setSelectedRepas: (repas: Repas | null) => {
          set({ selectedRepas: repas });
        },

        // ========================================
        // DENRÉES ACTIONS
        // ========================================

        loadDenrees: async (filters?: DenreeFilters) => {
          const { lastFetch, cacheExpiry } = get();
          const now = Date.now();
          if (lastFetch.denrees && now - lastFetch.denrees < cacheExpiry && !filters) {
            return;
          }

          set({ denreesLoading: true, denreesError: null });

          try {
            const data = await restaurationService.getDenrees(filters);
            set({
              denrees: data.allocations,
              denreesLoading: false,
              lastFetch: { ...get().lastFetch, denrees: now },
            });
          } catch (error: any) {
            set({
              denreesError: error.message || 'Erreur chargement denrées',
              denreesLoading: false,
            });
          }
        },

        loadDenreesRestaurant: async (restaurantId: string) => {
          set({ denreesLoading: true, denreesError: null });

          try {
            const data = await restaurationService.getDenreesRestaurant(restaurantId);
            set({
              denrees: data.allocations,
              denreesLoading: false,
            });
          } catch (error: any) {
            set({
              denreesError: error.message || 'Erreur chargement denrées restaurant',
              denreesLoading: false,
            });
          }
        },

        allouerDenree: async (data: AllouerDenreeRequest) => {
          set({ denreesLoading: true, denreesError: null });

          try {
            const allocation = await restaurationService.allouerDenree(data);
            set({
              denrees: [allocation, ...get().denrees],
              denreesLoading: false,
            });
            get().invalidateCache('denrees');
            return allocation;
          } catch (error: any) {
            set({
              denreesError: error.message || 'Erreur allocation denrée',
              denreesLoading: false,
            });
            throw error;
          }
        },

        utiliserDenree: async (
          id: string,
          quantite: number,
          menuId?: string,
          repasId?: string
        ) => {
          set({ denreesLoading: true, denreesError: null });

          try {
            const denree = await restaurationService.utiliserDenree(id, quantite, menuId, repasId);
            set({
              denrees: get().denrees.map((d) => (d.id === id ? denree : d)),
              selectedDenree: get().selectedDenree?.id === id ? denree : get().selectedDenree,
              denreesLoading: false,
            });
            return denree;
          } catch (error: any) {
            set({
              denreesError: error.message || 'Erreur utilisation denrée',
              denreesLoading: false,
            });
            throw error;
          }
        },

        retournerDenree: async (id: string, quantite: number, motif: string) => {
          set({ denreesLoading: true, denreesError: null });

          try {
            const denree = await restaurationService.retournerDenree(id, quantite, motif);
            set({
              denrees: get().denrees.map((d) => (d.id === id ? denree : d)),
              selectedDenree: get().selectedDenree?.id === id ? denree : get().selectedDenree,
              denreesLoading: false,
            });
            return denree;
          } catch (error: any) {
            set({
              denreesError: error.message || 'Erreur retour denrée',
              denreesLoading: false,
            });
            throw error;
          }
        },

        enregistrerPerte: async (id: string, quantite: number, motif: string) => {
          set({ denreesLoading: true, denreesError: null });

          try {
            const denree = await restaurationService.enregistrerPerte(id, quantite, motif);
            set({
              denrees: get().denrees.map((d) => (d.id === id ? denree : d)),
              selectedDenree: get().selectedDenree?.id === id ? denree : get().selectedDenree,
              denreesLoading: false,
            });
            return denree;
          } catch (error: any) {
            set({
              denreesError: error.message || 'Erreur enregistrement perte',
              denreesLoading: false,
            });
            throw error;
          }
        },

        loadAlertesExpiration: async (joursAvance: number = 7) => {
          set({ alertesLoading: true });

          try {
            const alertes = await restaurationService.getAlertesExpiration(joursAvance);
            set({
              alertesExpiration: alertes,
              alertesLoading: false,
            });
          } catch (error: any) {
            set({
              denreesError: error.message || 'Erreur chargement alertes',
              alertesLoading: false,
            });
          }
        },

        setDenreeFilters: (filters: Partial<DenreeFilters>) => {
          set({ denreeFilters: { ...get().denreeFilters, ...filters } });
        },

        setSelectedDenree: (denree: StockDenree | null) => {
          set({ selectedDenree: denree });
        },

        // ========================================
        // UTILITAIRES
        // ========================================

        clearErrors: () => {
          set({
            restaurantsError: null,
            menusError: null,
            ticketsError: null,
            repasError: null,
            denreesError: null,
          });
        },

        resetFilters: () => {
          set({
            restaurantFilters: {},
            menuFilters: {},
            ticketFilters: {},
            repasFilters: {},
            denreeFilters: {},
          });
        },

        invalidateCache: (
          module?: 'restaurants' | 'menus' | 'tickets' | 'repas' | 'denrees'
        ) => {
          if (module) {
            set({
              lastFetch: {
                ...get().lastFetch,
                [module]: null,
              },
            });
          } else {
            set({
              lastFetch: {
                restaurants: null,
                menus: null,
                tickets: null,
                repas: null,
                denrees: null,
              },
            });
          }
        },
      }),
      {
        name: 'restauration-store',
        partialize: (state) => ({
          // Persist only filters and selected items
          restaurantFilters: state.restaurantFilters,
          menuFilters: state.menuFilters,
          ticketFilters: state.ticketFilters,
          repasFilters: state.repasFilters,
          denreeFilters: state.denreeFilters,
        }),
      }
    ),
    { name: 'Restauration Store' }
  )
);
