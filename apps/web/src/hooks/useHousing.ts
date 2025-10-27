/**
 * FICHIER: apps/web/src/hooks/useHousing.ts
 * HOOKS: Hooks personnalisés pour la gestion des logements
 *
 * DESCRIPTION:
 * Hooks React personnalisés pour la gestion des logements
 * Simplification de l'utilisation du store Zustand
 * Gestion automatique du chargement et des erreurs
 *
 * FONCTIONNALITÉS:
 * - Hooks pour cités, chambres, résidents
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
  useHousing, 
  useHousingComplexes, 
  useHousingRooms, 
  useHousingResidents, 
  useHousingMaintenance, 
  useHousingPayments, 
  useHousingMetrics 
} from '@/stores/housing';
import { HousingComplex, Room, Resident, MaintenanceRequest, Payment, HousingMetrics } from '@/services/api/housingService';

// Hook pour les cités universitaires
export const useHousingComplexes = () => {
  const { user } = useAuth();
  const { 
    complexes, 
    loading, 
    error, 
    loadComplexes, 
    createComplex, 
    updateComplex, 
    deleteComplex 
  } = useHousing();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    complexId: 'all'
  });

  // Charger les cités au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadComplexes(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadComplexes]);

  // Fonctions de gestion
  const handleCreateComplex = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createComplex(data, user.tenantId);
    }
  }, [user?.tenantId, createComplex]);

  const handleUpdateComplex = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateComplex(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateComplex]);

  const handleDeleteComplex = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteComplex(id, user.tenantId);
    }
  }, [user?.tenantId, deleteComplex]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      complexId: 'all'
    });
  }, []);

  return {
    complexes,
    loading,
    error,
    filters,
    createComplex: handleCreateComplex,
    updateComplex: handleUpdateComplex,
    deleteComplex: handleDeleteComplex,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadComplexes(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les chambres
export const useHousingRooms = () => {
  const { user } = useAuth();
  const { 
    rooms, 
    loading, 
    error, 
    loadRooms, 
    createRoom, 
    updateRoom, 
    deleteRoom 
  } = useHousing();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    complexId: 'all'
  });

  // Charger les chambres au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadRooms(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadRooms]);

  // Fonctions de gestion
  const handleCreateRoom = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createRoom(data, user.tenantId);
    }
  }, [user?.tenantId, createRoom]);

  const handleUpdateRoom = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateRoom(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateRoom]);

  const handleDeleteRoom = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteRoom(id, user.tenantId);
    }
  }, [user?.tenantId, deleteRoom]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      complexId: 'all'
    });
  }, []);

  return {
    rooms,
    loading,
    error,
    filters,
    createRoom: handleCreateRoom,
    updateRoom: handleUpdateRoom,
    deleteRoom: handleDeleteRoom,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadRooms(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les résidents
export const useHousingResidents = () => {
  const { user } = useAuth();
  const { 
    residents, 
    loading, 
    error, 
    loadResidents, 
    createResident, 
    updateResident, 
    deleteResident 
  } = useHousing();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    complexId: 'all'
  });

  // Charger les résidents au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadResidents(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadResidents]);

  // Fonctions de gestion
  const handleCreateResident = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createResident(data, user.tenantId);
    }
  }, [user?.tenantId, createResident]);

  const handleUpdateResident = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateResident(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateResident]);

  const handleDeleteResident = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteResident(id, user.tenantId);
    }
  }, [user?.tenantId, deleteResident]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      complexId: 'all'
    });
  }, []);

  return {
    residents,
    loading,
    error,
    filters,
    createResident: handleCreateResident,
    updateResident: handleUpdateResident,
    deleteResident: handleDeleteResident,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadResidents(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour la maintenance
export const useHousingMaintenance = () => {
  const { user } = useAuth();
  const { 
    maintenanceRequests, 
    loading, 
    error, 
    loadMaintenanceRequests, 
    createMaintenanceRequest, 
    updateMaintenanceRequest 
  } = useHousing();

  const [filters, setFilters] = useState({
    type: 'all',
    priority: 'all',
    status: 'all',
    complexId: 'all'
  });

  // Charger les demandes de maintenance au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadMaintenanceRequests(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadMaintenanceRequests]);

  // Fonctions de gestion
  const handleCreateMaintenanceRequest = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createMaintenanceRequest(data, user.tenantId);
    }
  }, [user?.tenantId, createMaintenanceRequest]);

  const handleUpdateMaintenanceRequest = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateMaintenanceRequest(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateMaintenanceRequest]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      type: 'all',
      priority: 'all',
      status: 'all',
      complexId: 'all'
    });
  }, []);

  return {
    maintenanceRequests,
    loading,
    error,
    filters,
    createMaintenanceRequest: handleCreateMaintenanceRequest,
    updateMaintenanceRequest: handleUpdateMaintenanceRequest,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadMaintenanceRequests(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les paiements
export const useHousingPayments = () => {
  const { user } = useAuth();
  const { 
    payments, 
    loading, 
    error, 
    loadPayments, 
    createPayment 
  } = useHousing();

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les paiements au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadPayments(user.tenantId, filters);
    }
  }, [user?.tenantId, filters, loadPayments]);

  // Fonctions de gestion
  const handleCreatePayment = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createPayment(data, user.tenantId);
    }
  }, [user?.tenantId, createPayment]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      type: 'all',
      status: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    payments,
    loading,
    error,
    filters,
    createPayment: handleCreatePayment,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadPayments(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les métriques
export const useHousingMetrics = () => {
  const { user } = useAuth();
  const { 
    metrics, 
    loading, 
    error, 
    loadMetrics 
  } = useHousing();

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

// Hook pour les statistiques avancées
export const useHousingStatistics = () => {
  const { complexes, rooms, residents, maintenanceRequests, payments } = useHousing();
  const { metrics } = useHousingMetrics();

  // Calculer les statistiques en temps réel
  const statistics = {
    totalComplexes: complexes.length,
    totalRooms: rooms.length,
    availableRooms: rooms.filter(room => room.status === 'available').length,
    occupiedRooms: rooms.filter(room => room.status === 'occupied').length,
    maintenanceRooms: rooms.filter(room => room.status === 'maintenance').length,
    totalResidents: residents.length,
    activeResidents: residents.filter(resident => resident.status === 'active').length,
    pendingMaintenance: maintenanceRequests.filter(req => req.status === 'pending').length,
    overduePayments: payments.filter(payment => 
      payment.status === 'pending' && 
      new Date(payment.dueDate) < new Date()
    ).length,
    monthlyRevenue: residents.reduce((sum, resident) => sum + resident.monthlyRent, 0),
    occupancyRate: rooms.length > 0 ? 
      (rooms.filter(room => room.status === 'occupied').length / rooms.length) * 100 : 0
  };

  // Top cités par occupation
  const topComplexes = complexes.map(complex => {
    const complexRooms = rooms.filter(room => room.complexId === complex.id);
    const occupiedRooms = complexRooms.filter(room => room.status === 'occupied');
    const revenue = residents
      .filter(resident => complexRooms.some(room => room.id === resident.roomId))
      .reduce((sum, resident) => sum + resident.monthlyRent, 0);
    
    return {
      id: complex.id,
      name: complex.name,
      occupancyRate: complexRooms.length > 0 ? 
        (occupiedRooms.length / complexRooms.length) * 100 : 0,
      revenue
    };
  }).sort((a, b) => b.occupancyRate - a.occupancyRate).slice(0, 5);

  // Répartition par type de chambre
  const roomTypeDistribution = rooms.reduce((acc, room) => {
    if (!acc[room.type]) {
      acc[room.type] = { count: 0, occupied: 0 };
    }
    acc[room.type].count += 1;
    if (room.status === 'occupied') {
      acc[room.type].occupied += 1;
    }
    return acc;
  }, {} as Record<string, { count: number; occupied: number }>);

  return {
    ...statistics,
    topComplexes,
    roomTypeDistribution,
    metrics
  };
};

// Hook pour les filtres avancés
export const useHousingFilters = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    complexId: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      complexId: 'all',
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
