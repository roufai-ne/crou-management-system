/**
 * FICHIER: apps/web/src/pages/transport/TransportPage.tsx
 * PAGE: TransportPage - Gestion du transport étudiant
 *
 * DESCRIPTION:
 * Page principale pour la gestion du transport étudiant
 * Interface complète avec CRUD pour véhicules, chauffeurs et routes
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Gestion du parc de véhicules
 * - Gestion des chauffeurs
 * - Planification des trajets
 * - Suivi de la maintenance
 * - Optimisation des routes
 * - Rapports de performance
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Button, Table, Modal, Input, Select, DateInput } from '@/components/ui';
import ModernTabs, { Tab } from '@/components/ui/ModernTabs';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  TruckIcon,
  UserGroupIcon,
  MapIcon,
  WrenchScrewdriverIcon,
  ClockIcon,
  ChartBarIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { useTenantFilter } from '@/hooks/useTenantFilter';
import {
  useTransportVehicles,
  useTransportDrivers,
  useTransportRoutes,
  useTransportTrips,
  useTransportMaintenance,
  useTransportStatistics
} from '@/hooks/useTransport';
import { Vehicle, Driver, Route, ScheduledTrip, MaintenanceRecord } from '@/services/api/transportService';
import { ExportButton } from '@/components/reports/ExportButton';
import { TenantFilter } from '@/components/common/TenantFilter';
import { TicketsTransportTab } from '@/components/transport/TicketsTransportTab';
import { CircuitsTab } from '@/components/transport/CircuitsTab';
import { ChauffeursTab } from '@/components/transport/ChauffeursTab';
import { MaintenanceTab } from '@/components/transport/MaintenanceTab';
import { TrajetsTab } from '@/components/transport/TrajetsTab';
import { VehiclesTab } from '@/components/transport/VehiclesTab';

export const TransportPage: React.FC = () => {
  const { user } = useAuth();
  const { selectedTenantId, setSelectedTenantId, canFilterTenant } = useTenantFilter();
  const [activeTab, setActiveTab] = useState('tickets');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'vehicle' | 'driver' | 'route' | 'trip' | 'maintenance'>('vehicle');

  // Hooks pour la gestion des données
  const {
    vehicles = [],
    loading: vehiclesLoading,
    error: vehiclesError,
    filters: vehiclesFilters = { search: '', type: 'all', status: 'all' },
    createVehicle,
    updateVehicle,
    updateFilters: updateVehiclesFilters
  } = useTransportVehicles();

  const {
    drivers = [],
    loading: driversLoading,
    error: driversError,
    filters: driversFilters = { search: '', status: 'all' },
    createDriver,
    updateDriver,
    updateFilters: updateDriversFilters
  } = useTransportDrivers();

  const {
    routes = [],
    loading: routesLoading,
    error: routesError,
    filters: routesFilters = { search: '', status: 'all' },
    createRoute,
    updateRoute,
    updateFilters: updateRoutesFilters
  } = useTransportRoutes();

  const {
    scheduledTrips = [],
    loading: tripsLoading,
    error: tripsError,
    filters: tripsFilters = { search: '', status: 'all' },
    createScheduledTrip,
    updateScheduledTrip,
    updateFilters: updateTripsFilters
  } = useTransportTrips();

  const {
    maintenanceRecords = [],
    loading: maintenanceLoading,
    error: maintenanceError,
    filters: maintenanceFilters = { search: '', status: 'all' },
    createMaintenanceRecord,
    updateMaintenanceRecord,
    updateFilters: updateMaintenanceFilters
  } = useTransportMaintenance();

  const {
    totalVehicles = 0,
    activeVehicles = 0,
    totalDrivers = 0,
    activeDrivers = 0,
    totalRoutes = 0,
    totalMileage = 0,
    totalTrips = 0,
    completedTrips = 0,
    maintenanceAlerts = []
  } = useTransportStatistics();

  // Gestion de la création d'élément
  const handleCreateItem = async (data: any) => {
    try {
      switch (modalType) {
        case 'vehicle':
          await createVehicle(data);
          break;
        case 'driver':
          await createDriver(data);
          break;
        case 'route':
          await createRoute(data);
          break;
        case 'trip':
          await createScheduledTrip(data);
          break;
        case 'maintenance':
          await createMaintenanceRecord(data);
          break;
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la création:', err);
    }
  };

  // Gestion de la modification d'élément
  const handleUpdateItem = async (data: any) => {
    try {
      switch (modalType) {
        case 'vehicle':
          await updateVehicle(selectedItem.id, data);
          break;
        case 'driver':
          await updateDriver(selectedItem.id, data);
          break;
        case 'route':
          await updateRoute(selectedItem.id, data);
          break;
        case 'trip':
          await updateScheduledTrip(selectedItem.id, data);
          break;
        case 'maintenance':
          await updateMaintenanceRecord(selectedItem.id, data);
          break;
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
    }
  };

  // Colonnes du tableau des véhicules
  const vehicleColumns = [
    {
      key: 'vehicle',
      label: 'Véhicule',
      render: (vehicle: Vehicle) => (
        <div>
          <p className="font-medium">{vehicle.make} {vehicle.model}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.plateNumber}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (vehicle: Vehicle) => (
        <Badge variant="secondary">{vehicle.type}</Badge>
      )
    },
    {
      key: 'capacity',
      label: 'Capacité',
      render: (vehicle: Vehicle) => (
        <div className="text-right">
          <p className="font-medium">{vehicle.capacity} places</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.year}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (vehicle: Vehicle) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'active':
              return <Badge variant="success">Actif</Badge>;
            case 'maintenance':
              return <Badge variant="warning">Maintenance</Badge>;
            case 'inactive':
              return <Badge variant="danger">Inactif</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(vehicle.status);
      }
    },
    {
      key: 'mileage',
      label: 'Kilométrage',
      render: (vehicle: Vehicle) => (
        <div className="text-right">
          <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (vehicle: Vehicle) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(vehicle);
              setModalType('vehicle');
              setIsEditModalOpen(true);
            }}
          >
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(vehicle);
              setModalType('vehicle');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des chauffeurs
  const driverColumns = [
    {
      key: 'driver',
      label: 'Chauffeur',
      render: (driver: Driver) => (
        <div>
          <p className="font-medium">{driver.firstName} {driver.lastName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{driver.licenseNumber}</p>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (driver: Driver) => (
        <div>
          <p className="font-medium">{driver.phone}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{driver.email}</p>
        </div>
      )
    },
    {
      key: 'license',
      label: 'Permis',
      render: (driver: Driver) => (
        <div>
          <p className="font-medium">{driver.licenseType}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Expire: {new Date(driver.licenseExpiry).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (driver: Driver) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'active':
              return <Badge variant="success">Actif</Badge>;
            case 'inactive':
              return <Badge variant="warning">Inactif</Badge>;
            case 'suspended':
              return <Badge variant="danger">Suspendu</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(driver.status);
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (driver: Driver) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(driver);
              setModalType('driver');
              setIsEditModalOpen(true);
            }}
          >
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(driver);
              setModalType('driver');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des routes
  const routeColumns = [
    {
      key: 'route',
      label: 'Route',
      render: (route: Route) => (
        <div>
          <p className="font-medium">{route.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{route.description}</p>
        </div>
      )
    },
    {
      key: 'stops',
      label: 'Arrêts',
      render: (route: Route) => (
        <div>
          <p className="font-medium">{route.stops.length} arrêts</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {route.stops[0]?.name} → {route.stops[route.stops.length - 1]?.name}
          </p>
        </div>
      )
    },
    {
      key: 'distance',
      label: 'Distance',
      render: (route: Route) => (
        <div className="text-right">
          <p className="font-medium">{route.distance} km</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">Durée: {route.estimatedDuration} min</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (route: Route) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'active':
              return <Badge variant="success">Actif</Badge>;
            case 'inactive':
              return <Badge variant="warning">Inactif</Badge>;
            case 'maintenance':
              return <Badge variant="danger">Maintenance</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(route.status);
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (route: Route) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(route);
              setModalType('route');
              setIsEditModalOpen(true);
            }}
          >
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(route);
              setModalType('route');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des trajets
  const tripColumns = [
    {
      key: 'trip',
      label: 'Trajet',
      render: (trip: ScheduledTrip) => (
        <div>
          <p className="font-medium">{trip.route?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{trip.vehicle?.plateNumber}</p>
        </div>
      )
    },
    {
      key: 'schedule',
      label: 'Horaire',
      render: (trip: ScheduledTrip) => (
        <div>
          <p className="font-medium">
            {new Date(trip.scheduledDate).toLocaleTimeString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(trip.scheduledDate).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'driver',
      label: 'Chauffeur',
      render: (trip: ScheduledTrip) => (
        <div>
          <p className="font-medium">
            {trip.driver?.firstName} {trip.driver?.lastName}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{trip.driver?.licenseNumber}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (trip: ScheduledTrip) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'scheduled':
              return <Badge variant="info">Programmé</Badge>;
            case 'in_progress':
              return <Badge variant="warning">En cours</Badge>;
            case 'completed':
              return <Badge variant="success">Terminé</Badge>;
            case 'cancelled':
              return <Badge variant="danger">Annulé</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(trip.status);
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (trip: ScheduledTrip) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(trip);
              setModalType('trip');
              setIsEditModalOpen(true);
            }}
          >
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(trip);
              setModalType('trip');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des maintenances
  const maintenanceColumns = [
    {
      key: 'vehicle',
      label: 'Véhicule',
      render: (maintenance: MaintenanceRecord) => (
        <div>
          <p className="font-medium">{maintenance.vehicle?.make} {maintenance.vehicle?.model}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{maintenance.vehicle?.plateNumber}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (maintenance: MaintenanceRecord) => (
        <Badge variant="secondary">{maintenance.type}</Badge>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (maintenance: MaintenanceRecord) => (
        <div>
          <p className="font-medium">{maintenance.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{maintenance.performedBy}</p>
        </div>
      )
    },
    {
      key: 'cost',
      label: 'Coût',
      render: (maintenance: MaintenanceRecord) => (
        <div className="text-right">
          <p className="font-medium">{maintenance.cost.toLocaleString()} XOF</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{maintenance.status}</p>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (maintenance: MaintenanceRecord) => (
        <div>
          <p className="font-medium">
            {new Date(maintenance.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(maintenance.createdAt).toLocaleTimeString()}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (maintenance: MaintenanceRecord) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(maintenance);
              setModalType('maintenance');
              setIsEditModalOpen(true);
            }}
          >
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(maintenance);
              setModalType('maintenance');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  const tabs = [
    {
      id: 'tickets',
      label: 'Tickets Transport',
      icon: TicketIcon,
      content: <TicketsTransportTab />
    },
    {
      id: 'vehicles',
      label: 'Véhicules',
      icon: TruckIcon,
      content: <VehiclesTab />
    },
    {
      id: 'chauffeurs',
      label: 'Chauffeurs',
      icon: UserGroupIcon,
      content: <ChauffeursTab />
    },
    {
      id: 'circuits',
      label: 'Circuits',
      icon: MapIcon,
      content: <CircuitsTab />
    },
    {
      id: 'trips',
      label: 'Trajets',
      icon: ClockIcon,
      content: <TrajetsTab />
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: WrenchScrewdriverIcon,
      content: <MaintenanceTab />
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion du Transport</h1>
            <p className="text-lg text-gray-600 mt-2">
              Parc de véhicules et transport étudiant
            </p>
          </div>
          <div className="flex items-center gap-4">
            {canFilterTenant && (
              <TenantFilter
                value={selectedTenantId}
                onChange={setSelectedTenantId}
                showAllOption={true}
              />
            )}
            {maintenanceAlerts.length > 0 && (
              <Badge variant="warning" className="text-lg px-4 py-2">
                {maintenanceAlerts.length} Alerte{maintenanceAlerts.length > 1 ? 's' : ''} Maintenance
              </Badge>
            )}
            <ExportButton module="transport" />
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => {
                setModalType('vehicle');
                setIsCreateModalOpen(true);
              }}
            >
              Nouveau Véhicule
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Véhicules</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalVehicles}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeVehicles} actifs</p>
              </div>
              <TruckIcon className="h-8 w-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chauffeurs</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalDrivers}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{activeDrivers} actifs</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Routes</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalRoutes}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{totalMileage.toLocaleString()} km total</p>
              </div>
              <MapIcon className="h-8 w-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>
        <Card>
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Trajets</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalTrips}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{completedTrips} terminés</p>
              </div>
              <ClockIcon className="h-8 w-8 text-primary-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Tabs de navigation */}
      <ModernTabs
        tabs={tabs}
        defaultTab="tickets"
        variant="pills"
        animated
      />

      {/* Modales */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={`Nouveau ${modalType}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            placeholder="Ex: Bus 001"
            required
          />
          <Input
            label="Description"
            placeholder="Ex: Bus de transport étudiant"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacité"
              type="number"
              placeholder="0"
              required
            />
            <Input
              label="Type"
              placeholder="Ex: Bus"
              required
            />
          </div>
          <Select
            label="Statut"
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' },
              { value: 'maintenance', label: 'Maintenance' }
            ]}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleCreateItem({})}
            >
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Modifier ${modalType}`}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom"
            placeholder="Ex: Bus 001"
            required
          />
          <Input
            label="Description"
            placeholder="Ex: Bus de transport étudiant"
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Capacité"
              type="number"
              placeholder="0"
              required
            />
            <Input
              label="Type"
              placeholder="Ex: Bus"
              required
            />
          </div>
          <Select
            label="Statut"
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' },
              { value: 'maintenance', label: 'Maintenance' }
            ]}
            required
          />
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleUpdateItem({})}
            >
              Modifier
            </Button>
          </div>
        </div>
      </Modal>
    </Container>
  );
};

export default TransportPage;