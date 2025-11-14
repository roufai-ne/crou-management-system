/**
 * FICHIER: apps/web/src/hooks/useRestauration.ts
 * HOOKS: Hooks personnalisés pour la gestion de la restauration
 *
 * DESCRIPTION:
 * Hooks React personnalisés pour la gestion du module Restauration
 * Simplification de l'utilisation du store Zustand
 * Gestion automatique du chargement et des erreurs
 *
 * FONCTIONNALITÉS:
 * - Hooks pour restaurants, menus, tickets, repas, denrées
 * - Gestion automatique du chargement
 * - Filtres et pagination
 * - Métriques et statistiques
 * - Cache et synchronisation
 *
 * AUTEUR: Équipe CROU - Module Restauration
 * DATE: Janvier 2025
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/stores/auth';
import { useRestaurationStore } from '@/stores/restauration';
import {
  Restaurant,
  Menu,
  TicketRepas,
  Repas,
  StockDenree,
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
} from '@/services/api/restaurationService';

// ========================================
// HOOK: RESTAURANTS
// ========================================

export const useRestaurants = () => {
  const { user } = useAuth();
  const {
    restaurants,
    restaurantsLoading,
    restaurantsError,
    loadRestaurants,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    setRestaurantFilters,
    restaurantFilters,
  } = useRestaurationStore();

  const [filters, setFilters] = useState(restaurantFilters);

  // Charger les restaurants au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadRestaurants(filters);
    }
  }, [filters, loadRestaurants, user?.tenantId]);

  // Fonctions de gestion
  const handleCreateRestaurant = useCallback(
    async (data: CreateRestaurantRequest) => {
      return await createRestaurant(data);
    },
    [createRestaurant]
  );

  const handleUpdateRestaurant = useCallback(
    async (id: string, data: UpdateRestaurantRequest) => {
      return await updateRestaurant(id, data);
    },
    [updateRestaurant]
  );

  const handleDeleteRestaurant = useCallback(
    async (id: string) => {
      await deleteRestaurant(id);
    },
    [deleteRestaurant]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      setRestaurantFilters(updated);
    },
    [filters, setRestaurantFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setRestaurantFilters({});
  }, [setRestaurantFilters]);

  return {
    restaurants,
    loading: restaurantsLoading,
    error: restaurantsError,
    filters,
    createRestaurant: handleCreateRestaurant,
    updateRestaurant: handleUpdateRestaurant,
    deleteRestaurant: handleDeleteRestaurant,
    updateFilters,
    resetFilters,
    refresh: () => loadRestaurants(filters),
  };
};

// ========================================
// HOOK: RESTAURANT DETAIL
// ========================================

export const useRestaurant = (id?: string) => {
  const { user } = useAuth();
  const {
    selectedRestaurant,
    restaurantsLoading,
    restaurantsError,
    loadRestaurant,
    updateRestaurant,
    updateFrequentationMoyenne,
    setSelectedRestaurant,
  } = useRestaurationStore();

  useEffect(() => {
    if (id && user?.tenantId) {
      loadRestaurant(id);
    }

    // Cleanup
    return () => {
      if (!id) {
        setSelectedRestaurant(null);
      }
    };
  }, [id, user?.tenantId, loadRestaurant, setSelectedRestaurant]);

  const handleUpdate = useCallback(
    async (data: UpdateRestaurantRequest) => {
      if (!id) return;
      return await updateRestaurant(id, data);
    },
    [id, updateRestaurant]
  );

  const handleUpdateFrequentation = useCallback(
    async (frequentation: number) => {
      if (!id) return;
      await updateFrequentationMoyenne(id, frequentation);
    },
    [id, updateFrequentationMoyenne]
  );

  return {
    restaurant: selectedRestaurant,
    loading: restaurantsLoading,
    error: restaurantsError,
    updateRestaurant: handleUpdate,
    updateFrequentation: handleUpdateFrequentation,
    refresh: () => (id ? loadRestaurant(id) : Promise.resolve()),
  };
};

// ========================================
// HOOK: MENUS
// ========================================

export const useMenus = () => {
  const { user } = useAuth();
  const {
    menus,
    menusLoading,
    menusError,
    loadMenus,
    createMenu,
    updateMenu,
    deleteMenu,
    publishMenu,
    validateMenu,
    duplicateMenu,
    setMenuFilters,
    menuFilters,
  } = useRestaurationStore();

  const [filters, setFilters] = useState(menuFilters);

  // Charger les menus au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadMenus(filters);
    }
  }, [filters, loadMenus, user?.tenantId]);

  // Fonctions de gestion
  const handleCreateMenu = useCallback(
    async (data: CreateMenuRequest) => {
      return await createMenu(data);
    },
    [createMenu]
  );

  const handleUpdateMenu = useCallback(
    async (id: string, data: UpdateMenuRequest) => {
      return await updateMenu(id, data);
    },
    [updateMenu]
  );

  const handleDeleteMenu = useCallback(
    async (id: string) => {
      await deleteMenu(id);
    },
    [deleteMenu]
  );

  const handlePublishMenu = useCallback(
    async (id: string) => {
      return await publishMenu(id);
    },
    [publishMenu]
  );

  const handleValidateMenu = useCallback(
    async (id: string) => {
      return await validateMenu(id);
    },
    [validateMenu]
  );

  const handleDuplicateMenu = useCallback(
    async (id: string, nouvelleDateService: string) => {
      return await duplicateMenu(id, nouvelleDateService);
    },
    [duplicateMenu]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      setMenuFilters(updated);
    },
    [filters, setMenuFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setMenuFilters({});
  }, [setMenuFilters]);

  return {
    menus,
    loading: menusLoading,
    error: menusError,
    filters,
    createMenu: handleCreateMenu,
    updateMenu: handleUpdateMenu,
    deleteMenu: handleDeleteMenu,
    publishMenu: handlePublishMenu,
    validateMenu: handleValidateMenu,
    duplicateMenu: handleDuplicateMenu,
    updateFilters,
    resetFilters,
    refresh: () => loadMenus(filters),
  };
};

// ========================================
// HOOK: MENU DETAIL
// ========================================

export const useMenu = (id?: string) => {
  const { user } = useAuth();
  const {
    selectedMenu,
    menusLoading,
    menusError,
    besoinsDenrees,
    besoinsLoading,
    loadMenu,
    updateMenu,
    publishMenu,
    validateMenu,
    calculateBesoins,
    setSelectedMenu,
  } = useRestaurationStore();

  useEffect(() => {
    if (id && user?.tenantId) {
      loadMenu(id);
    }

    // Cleanup
    return () => {
      if (!id) {
        setSelectedMenu(null);
      }
    };
  }, [id, user?.tenantId, loadMenu, setSelectedMenu]);

  const handleUpdate = useCallback(
    async (data: UpdateMenuRequest) => {
      if (!id) return;
      return await updateMenu(id, data);
    },
    [id, updateMenu]
  );

  const handlePublish = useCallback(async () => {
    if (!id) return;
    return await publishMenu(id);
  }, [id, publishMenu]);

  const handleValidate = useCallback(async () => {
    if (!id) return;
    return await validateMenu(id);
  }, [id, validateMenu]);

  const handleCalculateBesoins = useCallback(
    async (nombreRationnaires: number) => {
      if (!id) return;
      await calculateBesoins(id, nombreRationnaires);
    },
    [id, calculateBesoins]
  );

  return {
    menu: selectedMenu,
    loading: menusLoading,
    error: menusError,
    besoinsDenrees,
    besoinsLoading,
    updateMenu: handleUpdate,
    publishMenu: handlePublish,
    validateMenu: handleValidate,
    calculateBesoins: handleCalculateBesoins,
    refresh: () => (id ? loadMenu(id) : Promise.resolve()),
  };
};

// ========================================
// HOOK: TICKETS
// ========================================

export const useTickets = () => {
  const { user } = useAuth();
  const {
    tickets,
    ticketsLoading,
    ticketsError,
    loadTickets,
    loadTicketByNumero,
    createTicket,
    createTicketsBatch,
    utiliserTicket,
    annulerTicket,
    setTicketFilters,
    ticketFilters,
  } = useRestaurationStore();

  const [filters, setFilters] = useState(ticketFilters);

  // Charger les tickets au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadTickets(filters);
    }
  }, [filters, loadTickets, user?.tenantId]);

  // Fonctions de gestion
  const handleCreateTicket = useCallback(
    async (data: CreateTicketRequest) => {
      return await createTicket(data);
    },
    [createTicket]
  );

  const handleCreateTicketsBatch = useCallback(
    async (data: CreateTicketsBatchRequest) => {
      return await createTicketsBatch(data);
    },
    [createTicketsBatch]
  );

  const handleUtiliserTicket = useCallback(
    async (data: UtiliserTicketRequest) => {
      return await utiliserTicket(data);
    },
    [utiliserTicket]
  );

  const handleAnnulerTicket = useCallback(
    async (id: string, motif: string) => {
      return await annulerTicket(id, motif);
    },
    [annulerTicket]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      setTicketFilters(updated);
    },
    [filters, setTicketFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setTicketFilters({});
  }, [setTicketFilters]);

  // Fonctions supplémentaires pour le système anonyme
  const handleRechercherParNumero = useCallback(
    async (numeroTicket: string): Promise<TicketRepas | null> => {
      try {
        await loadTicketByNumero(numeroTicket);
        // Le ticket sera dans le store après le chargement
        const ticket = tickets?.find(t => t.numeroTicket === numeroTicket);
        return ticket || null;
      } catch (error) {
        console.error('Erreur recherche par numéro:', error);
        return null;
      }
    },
    [loadTicketByNumero, tickets]
  );

  const handleRechercherParQRCode = useCallback(
    async (qrCode: string): Promise<TicketRepas | null> => {
      try {
        // Rechercher dans les tickets chargés ou faire une requête API
        const ticket = tickets?.find(t => t.qrCode === qrCode);
        return ticket || null;
      } catch (error) {
        console.error('Erreur recherche par QR:', error);
        return null;
      }
    },
    [tickets]
  );

  const handleTelechargerTicketPDF = useCallback(
    async (ticketId: string) => {
      try {
        // TODO: Implémenter le téléchargement PDF
        console.log('Téléchargement PDF ticket:', ticketId);
      } catch (error) {
        console.error('Erreur téléchargement PDF:', error);
      }
    },
    []
  );

  const handleExporterTickets = useCallback(
    async (format: 'csv' | 'excel' | 'pdf' = 'csv') => {
      try {
        // TODO: Implémenter l'export
        console.log('Export tickets format:', format);
      } catch (error) {
        console.error('Erreur export:', error);
      }
    },
    []
  );

  return {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    filters,
    setFilters: updateFilters,
    emettreTicket: handleCreateTicket,
    emettreTicketsBatch: handleCreateTicketsBatch,
    utiliserTicket: handleUtiliserTicket,
    annulerTicket: handleAnnulerTicket,
    rechercherParNumero: handleRechercherParNumero,
    rechercherParQRCode: handleRechercherParQRCode,
    telechargerTicketPDF: handleTelechargerTicketPDF,
    exporterTickets: handleExporterTickets,
    updateFilters,
    resetFilters,
    refresh: () => loadTickets(filters),
  };
};

// ========================================
// HOOK: TICKET DETAIL
// ========================================

export const useTicket = (numeroTicket?: string) => {
  const { user } = useAuth();
  const {
    selectedTicket,
    ticketsLoading,
    ticketsError,
    loadTicketByNumero,
    utiliserTicket,
    annulerTicket,
    setSelectedTicket,
  } = useRestaurationStore();

  useEffect(() => {
    if (numeroTicket && user?.tenantId) {
      loadTicketByNumero(numeroTicket);
    }

    // Cleanup
    return () => {
      if (!numeroTicket) {
        setSelectedTicket(null);
      }
    };
  }, [numeroTicket, user?.tenantId, loadTicketByNumero, setSelectedTicket]);

  const handleUtiliser = useCallback(
    async (repasId: string, restaurantId: string) => {
      if (!numeroTicket) return;
      return await utiliserTicket({ numeroTicket, repasId, restaurantId });
    },
    [numeroTicket, utiliserTicket]
  );

  const handleAnnuler = useCallback(
    async (motif: string) => {
      if (!selectedTicket?.id) return;
      return await annulerTicket(selectedTicket.id, motif);
    },
    [selectedTicket?.id, annulerTicket]
  );

  return {
    ticket: selectedTicket,
    loading: ticketsLoading,
    error: ticketsError,
    utiliserTicket: handleUtiliser,
    annulerTicket: handleAnnuler,
    refresh: () => (numeroTicket ? loadTicketByNumero(numeroTicket) : Promise.resolve()),
  };
};

// ========================================
// HOOK: REPAS
// ========================================

export const useRepas = () => {
  const { user } = useAuth();
  const {
    repas,
    repasLoading,
    repasError,
    loadRepas,
    createRepas,
    demarrerService,
    terminerService,
    annulerRepas,
    setRepasFilters,
    repasFilters,
  } = useRestaurationStore();

  const [filters, setFilters] = useState(repasFilters);

  // Charger les repas au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadRepas(filters);
    }
  }, [filters, loadRepas, user?.tenantId]);

  // Fonctions de gestion
  const handleCreateRepas = useCallback(
    async (data: CreateRepasRequest) => {
      return await createRepas(data);
    },
    [createRepas]
  );

  const handleDemarrerService = useCallback(
    async (id: string) => {
      return await demarrerService(id);
    },
    [demarrerService]
  );

  const handleTerminerService = useCallback(
    async (id: string, stats: TerminerServiceRequest) => {
      return await terminerService(id, stats);
    },
    [terminerService]
  );

  const handleAnnulerRepas = useCallback(
    async (id: string, motif: string) => {
      return await annulerRepas(id, motif);
    },
    [annulerRepas]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      setRepasFilters(updated);
    },
    [filters, setRepasFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setRepasFilters({});
  }, [setRepasFilters]);

  return {
    repas,
    loading: repasLoading,
    error: repasError,
    filters,
    createRepas: handleCreateRepas,
    demarrerService: handleDemarrerService,
    terminerService: handleTerminerService,
    annulerRepas: handleAnnulerRepas,
    updateFilters,
    resetFilters,
    refresh: () => loadRepas(filters),
  };
};

// ========================================
// HOOK: REPAS DETAIL
// ========================================

export const useRepasDetail = (id?: string) => {
  const { user } = useAuth();
  const {
    selectedRepas,
    repasLoading,
    repasError,
    loadRepasById,
    demarrerService,
    terminerService,
    annulerRepas,
    setSelectedRepas,
  } = useRestaurationStore();

  useEffect(() => {
    if (id && user?.tenantId) {
      loadRepasById(id);
    }

    // Cleanup
    return () => {
      if (!id) {
        setSelectedRepas(null);
      }
    };
  }, [id, user?.tenantId, loadRepasById, setSelectedRepas]);

  const handleDemarrer = useCallback(async () => {
    if (!id) return;
    return await demarrerService(id);
  }, [id, demarrerService]);

  const handleTerminer = useCallback(
    async (stats: TerminerServiceRequest) => {
      if (!id) return;
      return await terminerService(id, stats);
    },
    [id, terminerService]
  );

  const handleAnnuler = useCallback(
    async (motif: string) => {
      if (!id) return;
      return await annulerRepas(id, motif);
    },
    [id, annulerRepas]
  );

  return {
    repas: selectedRepas,
    loading: repasLoading,
    error: repasError,
    demarrerService: handleDemarrer,
    terminerService: handleTerminer,
    annulerRepas: handleAnnuler,
    refresh: () => (id ? loadRepasById(id) : Promise.resolve()),
  };
};

// ========================================
// HOOK: DENRÉES
// ========================================

export const useDenrees = () => {
  const { user } = useAuth();
  const {
    denrees,
    denreesLoading,
    denreesError,
    loadDenrees,
    allouerDenree,
    utiliserDenree,
    retournerDenree,
    enregistrerPerte,
    setDenreeFilters,
    denreeFilters,
  } = useRestaurationStore();

  const [filters, setFilters] = useState(denreeFilters);

  // Charger les denrées au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadDenrees(filters);
    }
  }, [filters, loadDenrees, user?.tenantId]);

  // Fonctions de gestion
  const handleAllouerDenree = useCallback(
    async (data: AllouerDenreeRequest) => {
      return await allouerDenree(data);
    },
    [allouerDenree]
  );

  const handleUtiliserDenree = useCallback(
    async (id: string, quantite: number, menuId?: string, repasId?: string) => {
      return await utiliserDenree(id, quantite, menuId, repasId);
    },
    [utiliserDenree]
  );

  const handleRetournerDenree = useCallback(
    async (id: string, quantite: number, motif: string) => {
      return await retournerDenree(id, quantite, motif);
    },
    [retournerDenree]
  );

  const handleEnregistrerPerte = useCallback(
    async (id: string, quantite: number, motif: string) => {
      return await enregistrerPerte(id, quantite, motif);
    },
    [enregistrerPerte]
  );

  const updateFilters = useCallback(
    (newFilters: Partial<typeof filters>) => {
      const updated = { ...filters, ...newFilters };
      setFilters(updated);
      setDenreeFilters(updated);
    },
    [filters, setDenreeFilters]
  );

  const resetFilters = useCallback(() => {
    setFilters({});
    setDenreeFilters({});
  }, [setDenreeFilters]);

  return {
    denrees,
    loading: denreesLoading,
    error: denreesError,
    filters,
    allouerDenree: handleAllouerDenree,
    utiliserDenree: handleUtiliserDenree,
    retournerDenree: handleRetournerDenree,
    enregistrerPerte: handleEnregistrerPerte,
    updateFilters,
    resetFilters,
    refresh: () => loadDenrees(filters),
  };
};

// ========================================
// HOOK: ALERTES EXPIRATION
// ========================================

export const useAlertesExpiration = (joursAvance: number = 7) => {
  const { user } = useAuth();
  const { alertesExpiration, alertesLoading, loadAlertesExpiration } = useRestaurationStore();

  // Charger les alertes au montage
  useEffect(() => {
    if (user?.tenantId) {
      loadAlertesExpiration(joursAvance);
    }
  }, [user?.tenantId, joursAvance, loadAlertesExpiration]);

  return {
    alertes: alertesExpiration,
    loading: alertesLoading,
    refresh: () => loadAlertesExpiration(joursAvance),
  };
};

// ========================================
// HOOK: MENUS PAR RESTAURANT ET DATE
// ========================================

export const useMenusByRestaurantAndDate = (restaurantId?: string, date?: string) => {
  const { user } = useAuth();
  const { menus, menusLoading, menusError, loadMenusByRestaurantAndDate } = useRestaurationStore();

  useEffect(() => {
    if (restaurantId && date && user?.tenantId) {
      loadMenusByRestaurantAndDate(restaurantId, date);
    }
  }, [restaurantId, date, user?.tenantId, loadMenusByRestaurantAndDate]);

  return {
    menus,
    loading: menusLoading,
    error: menusError,
    refresh: () =>
      restaurantId && date ? loadMenusByRestaurantAndDate(restaurantId, date) : Promise.resolve(),
  };
};

// ========================================
// HOOK: TICKETS PAR ÉTUDIANT
// ========================================

export const useTicketsByEtudiant = (etudiantId?: string) => {
  const { user } = useAuth();
  const { tickets, ticketsLoading, ticketsError, loadTicketsByEtudiant } = useRestaurationStore();

  useEffect(() => {
    if (etudiantId && user?.tenantId) {
      loadTicketsByEtudiant(etudiantId);
    }
  }, [etudiantId, user?.tenantId, loadTicketsByEtudiant]);

  return {
    tickets,
    loading: ticketsLoading,
    error: ticketsError,
    refresh: () => (etudiantId ? loadTicketsByEtudiant(etudiantId) : Promise.resolve()),
  };
};

// ========================================
// HOOK: DENRÉES PAR RESTAURANT
// ========================================

export const useDenreesRestaurant = (restaurantId?: string) => {
  const { user } = useAuth();
  const { denrees, denreesLoading, denreesError, loadDenreesRestaurant } = useRestaurationStore();

  useEffect(() => {
    if (restaurantId && user?.tenantId) {
      loadDenreesRestaurant(restaurantId);
    }
  }, [restaurantId, user?.tenantId, loadDenreesRestaurant]);

  return {
    denrees,
    loading: denreesLoading,
    error: denreesError,
    refresh: () => (restaurantId ? loadDenreesRestaurant(restaurantId) : Promise.resolve()),
  };
};

// ========================================
// HOOK: STATISTIQUES GLOBALES
// ========================================

export const useRestaurationStatistics = () => {
  const [statistics, setStatistics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Implémenter l'appel API pour les statistiques globales
      // Pour l'instant, retourner des données mockées
      setStatistics({
        totalRestaurants: 0,
        servicesEnCours: 0,
        ticketsVendus: 0,
        denreesStock: 0,
      });
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    statistics,
    loading,
    error,
    loadStatistics,
  };
};

// ========================================
// HOOK: SERVICES EN COURS
// ========================================

export const useServiceEnCours = () => {
  const [servicesEnCours, setServicesEnCours] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadServicesEnCours = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implémenter l'appel API pour les services en cours
      setServicesEnCours([]);
    } catch (err) {
      console.error('Erreur chargement services en cours:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    servicesEnCours,
    loading,
    loadServicesEnCours,
  };
};

// ========================================
// HOOK: ALERTES DENRÉES
// ========================================

export const useDenreeAlerts = () => {
  const [alertesCritiques, setAlertesCritiques] = useState<any[]>([]);
  const [alertesAvertissement, setAlertesAvertissement] = useState<any[]>([]);
  const [denreesPerimerSoon, setDenreesPerimerSoon] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadAlerts = useCallback(async () => {
    setLoading(true);
    try {
      // TODO: Implémenter l'appel API pour les alertes denrées
      setAlertesCritiques([]);
      setAlertesAvertissement([]);
      setDenreesPerimerSoon([]);
    } catch (err) {
      console.error('Erreur chargement alertes denrées:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    alertesCritiques,
    alertesAvertissement,
    denreesPerimerSoon,
    loading,
    loadAlerts,
  };
};
