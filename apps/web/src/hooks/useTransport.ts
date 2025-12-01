/**
 * FICHIER: apps/web/src/hooks/useTransport.ts
 * HOOKS: Hooks personnalisés pour la gestion du transport
 *
 * DESCRIPTION:
 * Hooks React personnalisés pour la gestion du transport
 * Simplification de l'utilisation du store Zustand
 * Gestion automatique du chargement et des erreurs
 *
 * FONCTIONNALITÉS:
 * - Hooks pour véhicules, chauffeurs, routes
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
import { useTenantFilter } from '@/stores/tenantFilter';
import { 
  useTransport, 
  useTransportVehicles, 
  useTransportDrivers, 
  useTransportRoutes, 
  useTransportTrips, 
  useTransportMaintenance, 
  useTransportMetrics 
} from '@/stores/transport';
import { Vehicle, Driver, Route, ScheduledTrip, MaintenanceRecord, TransportMetrics } from '@/services/api/transportService';

// Hook pour les véhicules
export const useTransportVehicles = () => {
  const { user } = useAuth();
  const { selectedTenantId } = useTenantFilter();
  const { 
    vehicles, 
    loading, 
    error, 
    loadVehicles, 
    createVehicle, 
    updateVehicle, 
    deleteVehicle 
  } = useTransport();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les véhicules au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadVehicles(user.tenantId, filters);
    }
  }, [user?.tenantId, selectedTenantId, filters, loadVehicles]);

  // Fonctions de gestion
  const handleCreateVehicle = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createVehicle(data, user.tenantId);
    }
  }, [user?.tenantId, createVehicle]);

  const handleUpdateVehicle = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateVehicle(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateVehicle]);

  const handleDeleteVehicle = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteVehicle(id, user.tenantId);
    }
  }, [user?.tenantId, deleteVehicle]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    vehicles,
    loading,
    error,
    filters,
    createVehicle: handleCreateVehicle,
    updateVehicle: handleUpdateVehicle,
    deleteVehicle: handleDeleteVehicle,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadVehicles(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les chauffeurs
export const useTransportDrivers = () => {
  const { user } = useAuth();
  const { selectedTenantId } = useTenantFilter();
  const { 
    drivers, 
    loading, 
    error, 
    loadDrivers, 
    createDriver, 
    updateDriver, 
    deleteDriver 
  } = useTransport();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les chauffeurs au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadDrivers(user.tenantId, filters);
    }
  }, [user?.tenantId, selectedTenantId, filters, loadDrivers]);

  // Fonctions de gestion
  const handleCreateDriver = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createDriver(data, user.tenantId);
    }
  }, [user?.tenantId, createDriver]);

  const handleUpdateDriver = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateDriver(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateDriver]);

  const handleDeleteDriver = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteDriver(id, user.tenantId);
    }
  }, [user?.tenantId, deleteDriver]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    drivers,
    loading,
    error,
    filters,
    createDriver: handleCreateDriver,
    updateDriver: handleUpdateDriver,
    deleteDriver: handleDeleteDriver,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadDrivers(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les routes
export const useTransportRoutes = () => {
  const { user } = useAuth();
  const { selectedTenantId } = useTenantFilter();
  const { 
    routes, 
    loading, 
    error, 
    loadRoutes, 
    createRoute, 
    updateRoute, 
    deleteRoute 
  } = useTransport();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les routes au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadRoutes(user.tenantId, filters);
    }
  }, [user?.tenantId, selectedTenantId, filters, loadRoutes]);

  // Fonctions de gestion
  const handleCreateRoute = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createRoute(data, user.tenantId);
    }
  }, [user?.tenantId, createRoute]);

  const handleUpdateRoute = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateRoute(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateRoute]);

  const handleDeleteRoute = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteRoute(id, user.tenantId);
    }
  }, [user?.tenantId, deleteRoute]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    routes,
    loading,
    error,
    filters,
    createRoute: handleCreateRoute,
    updateRoute: handleUpdateRoute,
    deleteRoute: handleDeleteRoute,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadRoutes(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les trajets programmés
export const useTransportTrips = () => {
  const { user } = useAuth();
  const { selectedTenantId } = useTenantFilter();
  const { 
    scheduledTrips, 
    loading, 
    error, 
    loadScheduledTrips, 
    createScheduledTrip, 
    updateScheduledTrip, 
    deleteScheduledTrip 
  } = useTransport();

  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les trajets au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadScheduledTrips(user.tenantId, filters);
    }
  }, [user?.tenantId, selectedTenantId, filters, loadScheduledTrips]);

  // Fonctions de gestion
  const handleCreateScheduledTrip = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createScheduledTrip(data, user.tenantId);
    }
  }, [user?.tenantId, createScheduledTrip]);

  const handleUpdateScheduledTrip = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateScheduledTrip(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateScheduledTrip]);

  const handleDeleteScheduledTrip = useCallback(async (id: string) => {
    if (user?.tenantId) {
      await deleteScheduledTrip(id, user.tenantId);
    }
  }, [user?.tenantId, deleteScheduledTrip]);

  const updateFilters = useCallback((newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({
      search: '',
      status: 'all',
      type: 'all',
      dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
      dateTo: new Date()
    });
  }, []);

  return {
    scheduledTrips,
    loading,
    error,
    filters,
    createScheduledTrip: handleCreateScheduledTrip,
    updateScheduledTrip: handleUpdateScheduledTrip,
    deleteScheduledTrip: handleDeleteScheduledTrip,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadScheduledTrips(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour la maintenance
export const useTransportMaintenance = () => {
  const { user } = useAuth();
  const { selectedTenantId } = useTenantFilter();
  const { 
    maintenanceRecords, 
    loading, 
    error, 
    loadMaintenanceRecords, 
    createMaintenanceRecord, 
    updateMaintenanceRecord 
  } = useTransport();

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date()
  });

  // Charger les enregistrements de maintenance au montage et quand les filtres changent
  useEffect(() => {
    if (user?.tenantId) {
      loadMaintenanceRecords(user.tenantId, filters);
    }
  }, [user?.tenantId, selectedTenantId, filters, loadMaintenanceRecords]);

  // Fonctions de gestion
  const handleCreateMaintenanceRecord = useCallback(async (data: any) => {
    if (user?.tenantId) {
      await createMaintenanceRecord(data, user.tenantId);
    }
  }, [user?.tenantId, createMaintenanceRecord]);

  const handleUpdateMaintenanceRecord = useCallback(async (id: string, data: any) => {
    if (user?.tenantId) {
      await updateMaintenanceRecord(id, data, user.tenantId);
    }
  }, [user?.tenantId, updateMaintenanceRecord]);

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
    maintenanceRecords,
    loading,
    error,
    filters,
    createMaintenanceRecord: handleCreateMaintenanceRecord,
    updateMaintenanceRecord: handleUpdateMaintenanceRecord,
    updateFilters,
    resetFilters,
    refresh: () => user?.tenantId ? loadMaintenanceRecords(user.tenantId, filters) : Promise.resolve()
  };
};

// Hook pour les métriques
export const useTransportMetrics = () => {
  const { user } = useAuth();
  const { 
    metrics, 
    loading, 
    error, 
    loadMetrics 
  } = useTransport();

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
export const useTransportStatistics = () => {
  const { vehicles, drivers, routes, scheduledTrips, maintenanceRecords } = useTransport();
  const { metrics } = useTransportMetrics();

  // Calculer les statistiques en temps réel
  const statistics = {
    totalVehicles: vehicles.length,
    activeVehicles: vehicles.filter(vehicle => vehicle.status === 'active').length,
    maintenanceVehicles: vehicles.filter(vehicle => vehicle.status === 'maintenance').length,
    totalDrivers: drivers.length,
    activeDrivers: drivers.filter(driver => driver.status === 'active').length,
    totalRoutes: routes.length,
    activeRoutes: routes.filter(route => route.status === 'active').length,
    totalTrips: scheduledTrips.length,
    completedTrips: scheduledTrips.filter(trip => trip.status === 'completed').length,
    totalMileage: vehicles.reduce((sum, vehicle) => sum + vehicle.mileage, 0),
    maintenanceCost: maintenanceRecords.reduce((sum, record) => sum + record.cost, 0),
    averageEfficiency: vehicles.length > 0 ? 
      vehicles.reduce((sum, vehicle) => sum + (vehicle.mileage / 1000), 0) / vehicles.length : 0
  };

  // Top routes par nombre de trajets
  const topRoutes = routes.map(route => {
    const routeTrips = scheduledTrips.filter(trip => trip.routeId === route.id);
    const completedTrips = routeTrips.filter(trip => trip.status === 'completed');
    const totalPassengers = completedTrips.reduce((sum, trip) => sum + trip.passengersCount, 0);
    
    return {
      id: route.id,
      name: route.name,
      tripCount: routeTrips.length,
      passengerCount: totalPassengers,
      distance: route.distance
    };
  }).sort((a, b) => b.tripCount - a.tripCount).slice(0, 5);

  // Répartition par type de véhicule
  const vehicleTypeDistribution = vehicles.reduce((acc, vehicle) => {
    if (!acc[vehicle.type]) {
      acc[vehicle.type] = { count: 0, active: 0 };
    }
    acc[vehicle.type].count += 1;
    if (vehicle.status === 'active') {
      acc[vehicle.type].active += 1;
    }
    return acc;
  }, {} as Record<string, { count: number; active: number }>);

  // Alertes de maintenance
  const maintenanceAlerts = vehicles.filter(vehicle => {
    if (!vehicle.nextMaintenanceDate) return false;
    const today = new Date();
    const nextMaintenance = new Date(vehicle.nextMaintenanceDate);
    const daysUntilMaintenance = Math.ceil((nextMaintenance.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilMaintenance <= 7; // Alerte si maintenance dans les 7 prochains jours
  });

  return {
    ...statistics,
    topRoutes,
    vehicleTypeDistribution,
    maintenanceAlerts,
    metrics
  };
};

// Hook pour les filtres avancés
export const useTransportFilters = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    type: 'all',
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
