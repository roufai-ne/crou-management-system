/**
 * FICHIER: apps/web/src/pages/housing/HousingPage.tsx
 * PAGE: HousingPage - Gestion des logements universitaires
 *
 * DESCRIPTION:
 * Page principale pour la gestion des logements universitaires
 * Interface complète avec CRUD pour cités, chambres et résidents
 * Support multi-tenant avec permissions granulaires
 *
 * FONCTIONNALITÉS:
 * - Gestion des cités universitaires
 * - Attribution des chambres aux étudiants
 * - Suivi des résidents et paiements
 * - Gestion de la maintenance
 * - Rapports d'occupation et revenus
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Container, Card, Badge, Button, Table, Modal, Input, Select, DateInput, Tabs } from '@/components/ui';
import ModernPagination from '@/components/ui/ModernPagination';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  DocumentArrowDownIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  HomeModernIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { 
  useHousingComplexes, 
  useHousingRooms, 
  useHousingResidents, 
  useHousingMaintenance, 
  useHousingPayments,
  useHousingStatistics 
} from '@/hooks/useHousing';
import { HousingComplex, Room, Resident, MaintenanceRequest, Payment } from '@/services/api/housingService';
import { ExportButton } from '@/components/reports/ExportButton';
import { RequestsTab } from '@/components/housing/RequestsTab';
import { OccupationsTab } from '@/components/housing/OccupationsTab';
import { CitesTab } from '@/components/housing/CitesTab';
import { ChambresTab } from '@/components/housing/ChambresTab';
import { BedsTab } from '@/components/housing/BedsTab';

export const HousingPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('beds');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalType, setModalType] = useState<'complex' | 'room' | 'resident' | 'maintenance' | 'payment'>('complex');
  
  // États de pagination
  const [roomsPage, setRoomsPage] = useState(1);
  const [roomsPageSize, setRoomsPageSize] = useState(10);
  const [residentsPage, setResidentsPage] = useState(1);
  const [residentsPageSize, setResidentsPageSize] = useState(10);

  // Hooks pour la gestion des données
  const {
    complexes = [],
    loading: complexesLoading,
    error: complexesError,
    filters: complexesFilters = { search: '', type: 'all', status: 'all' },
    createComplex,
    updateComplex,
    updateFilters: updateComplexesFilters
  } = useHousingComplexes();

  const {
    rooms = [],
    loading: roomsLoading,
    error: roomsError,
    filters: roomsFilters = { search: '', complexId: '', status: 'all' },
    createRoom,
    updateRoom,
    updateFilters: updateRoomsFilters
  } = useHousingRooms();

  const {
    residents = [],
    loading: residentsLoading,
    error: residentsError,
    filters: residentsFilters = { search: '', complexId: '', roomId: '', status: 'all' },
    createResident,
    updateResident,
    updateFilters: updateResidentsFilters
  } = useHousingResidents();

  const {
    maintenanceRequests = [],
    loading: maintenanceLoading,
    error: maintenanceError,
    filters: maintenanceFilters = { search: '', status: 'all', priority: 'all' },
    createMaintenanceRequest,
    updateMaintenanceRequest,
    updateFilters: updateMaintenanceFilters
  } = useHousingMaintenance();

  const {
    payments = [],
    loading: paymentsLoading,
    error: paymentsError,
    filters: paymentsFilters = { search: '', status: 'all', type: 'all' },
    createPayment,
    updateFilters: updatePaymentsFilters
  } = useHousingPayments();

  const {
    totalComplexes = 0,
    totalRooms = 0,
    occupiedRooms = 0,
    totalResidents = 0,
    occupancyRate = 0,
    monthlyRevenue = 0,
    overduePayments = 0
  } = useHousingStatistics();

  // Pagination des chambres
  const paginatedRooms = useMemo(() => {
    const startIndex = (roomsPage - 1) * roomsPageSize;
    const endIndex = startIndex + roomsPageSize;
    return rooms.slice(startIndex, endIndex);
  }, [rooms, roomsPage, roomsPageSize]);

  const totalRoomsPages = Math.ceil(rooms.length / roomsPageSize);

  // Pagination des résidents
  const paginatedResidents = useMemo(() => {
    const startIndex = (residentsPage - 1) * residentsPageSize;
    const endIndex = startIndex + residentsPageSize;
    return residents.slice(startIndex, endIndex);
  }, [residents, residentsPage, residentsPageSize]);

  const totalResidentsPages = Math.ceil(residents.length / residentsPageSize);

  // Réinitialiser la page lors du changement de filtres
  useEffect(() => {
    setRoomsPage(1);
  }, [roomsFilters.search, roomsFilters.complexId, roomsFilters.status]);

  useEffect(() => {
    setResidentsPage(1);
  }, [residentsFilters.search, residentsFilters.complexId, residentsFilters.status]);

  // Gestion de la création d'élément
  const handleCreateItem = async (data: any) => {
    try {
      switch (modalType) {
        case 'complex':
          await createComplex(data);
          break;
        case 'room':
          await createRoom(data);
          break;
        case 'resident':
          await createResident(data);
          break;
        case 'maintenance':
          await createMaintenanceRequest(data);
          break;
        case 'payment':
          await createPayment(data);
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
        case 'complex':
          await updateComplex(selectedItem.id, data);
          break;
        case 'room':
          await updateRoom(selectedItem.id, data);
          break;
        case 'resident':
          await updateResident(selectedItem.id, data);
          break;
        case 'maintenance':
          await updateMaintenanceRequest(selectedItem.id, data);
          break;
        case 'payment':
          // updatePayment n'est pas disponible
          break;
      }
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erreur lors de la modification:', err);
    }
  };

  // Colonnes du tableau des cités
  const complexColumns = [
    {
      key: 'name',
      label: 'Nom',
      render: (complex: HousingComplex) => (
        <div>
          <p className="font-medium">{complex.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{complex.address}</p>
        </div>
      )
    },
    {
      key: 'capacity',
      label: 'Capacité',
      render: (complex: HousingComplex) => (
        <div className="text-right">
          <p className="font-medium">{complex.totalRooms} chambres</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{complex.availableRooms} disponibles</p>
        </div>
      )
    },
    {
      key: 'occupancy',
      label: 'Occupation',
      render: (complex: HousingComplex) => (
        <div className="text-right">
          <p className="font-medium">{complex.occupiedRooms} / {complex.totalRooms}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {((complex.occupiedRooms / complex.totalRooms) * 100).toFixed(1)}%
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (complex: HousingComplex) => (
        <Badge variant={complex.status === 'active' ? 'success' : 'warning'}>
          {complex.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (complex: HousingComplex) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(complex);
              setModalType('complex');
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
              setSelectedItem(complex);
              setModalType('complex');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des chambres
  const roomColumns = [
    {
      key: 'number',
      label: 'Numéro',
      render: (room: Room) => (
        <div>
          <p className="font-medium">{room.number}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{room.complex?.name}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (room: Room) => (
        <Badge variant="secondary">{room.type}</Badge>
      )
    },
    {
      key: 'capacity',
      label: 'Capacité',
      render: (room: Room) => (
        <div className="text-right">
          <p className="font-medium">{room.capacity} places</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{room.monthlyRent} XOF/mois</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (room: Room) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'available':
              return <Badge variant="success">Disponible</Badge>;
            case 'occupied':
              return <Badge variant="warning">Occupée</Badge>;
            case 'maintenance':
              return <Badge variant="danger">Maintenance</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(room.status);
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (room: Room) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(room);
              setModalType('room');
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
              setSelectedItem(room);
              setModalType('room');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des résidents
  const residentColumns = [
    {
      key: 'student',
      label: 'Étudiant',
      render: (resident: Resident) => (
        <div>
          <p className="font-medium">{resident.firstName} {resident.lastName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{resident.studentId}</p>
        </div>
      )
    },
    {
      key: 'room',
      label: 'Chambre',
      render: (resident: Resident) => (
        <div>
          <p className="font-medium">{resident.room?.number}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{resident.room?.complex?.name}</p>
        </div>
      )
    },
    {
      key: 'rent',
      label: 'Loyer',
      render: (resident: Resident) => (
        <div className="text-right">
          <p className="font-medium">{resident.monthlyRent} XOF</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">/mois</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (resident: Resident) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'active':
              return <Badge variant="success">Actif</Badge>;
            case 'inactive':
              return <Badge variant="warning">Inactif</Badge>;
            case 'overdue':
              return <Badge variant="danger">En retard</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(resident.status);
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (resident: Resident) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(resident);
              setModalType('resident');
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
              setSelectedItem(resident);
              setModalType('resident');
              setIsEditModalOpen(true);
            }}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Colonnes du tableau des demandes de maintenance
  const maintenanceColumns = [
    {
      key: 'title',
      label: 'Titre',
      render: (request: MaintenanceRequest) => (
        <div>
          <p className="font-medium">{request.description}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{request.room?.number}</p>
        </div>
      )
    },
    {
      key: 'priority',
      label: 'Priorité',
      render: (request: MaintenanceRequest) => {
        const getPriorityBadge = (priority: string) => {
          switch (priority) {
            case 'low':
              return <Badge variant="success">Faible</Badge>;
            case 'medium':
              return <Badge variant="warning">Moyenne</Badge>;
            case 'high':
              return <Badge variant="danger">Élevée</Badge>;
            default:
              return <Badge variant="secondary">{priority}</Badge>;
          }
        };
        return getPriorityBadge(request.priority);
      }
    },
    {
      key: 'status',
      label: 'Statut',
      render: (request: MaintenanceRequest) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'pending':
              return <Badge variant="warning">En attente</Badge>;
            case 'in_progress':
              return <Badge variant="info">En cours</Badge>;
            case 'completed':
              return <Badge variant="success">Terminée</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(request.status);
      }
    },
    {
      key: 'date',
      label: 'Date',
      render: (request: MaintenanceRequest) => (
        <div>
          <p className="font-medium">
            {new Date(request.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(request.createdAt).toLocaleTimeString()}
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (request: MaintenanceRequest) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(request);
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
              setSelectedItem(request);
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

  // Colonnes du tableau des paiements
  const paymentColumns = [
    {
      key: 'resident',
      label: 'Résident',
      render: (payment: Payment) => (
        <div>
          <p className="font-medium">{payment.resident?.firstName} {payment.resident?.lastName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{payment.resident?.studentId}</p>
        </div>
      )
    },
    {
      key: 'amount',
      label: 'Montant',
      render: (payment: Payment) => (
        <div className="text-right">
          <p className="font-medium">{payment.amount.toLocaleString()} XOF</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{payment.type}</p>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date',
      render: (payment: Payment) => (
        <div>
          <p className="font-medium">
            {new Date(payment.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(payment.createdAt).toLocaleTimeString()}
          </p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (payment: Payment) => {
        const getStatusBadge = (status: string) => {
          switch (status) {
            case 'paid':
              return <Badge variant="success">Payé</Badge>;
            case 'pending':
              return <Badge variant="warning">En attente</Badge>;
            case 'overdue':
              return <Badge variant="danger">En retard</Badge>;
            default:
              return <Badge variant="secondary">{status}</Badge>;
          }
        };
        return getStatusBadge(payment.status);
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (payment: Payment) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedItem(payment);
              setModalType('payment');
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
              setSelectedItem(payment);
              setModalType('payment');
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
      id: 'beds',
      label: '🛏️ Lits',
      icon: <HomeModernIcon className="h-4 w-4" />,
      content: <BedsTab />
    },
    {
      id: 'occupations',
      label: 'Occupations',
      icon: <UserGroupIcon className="h-4 w-4" />,
      content: <OccupationsTab />
    },
    {
      id: 'requests',
      label: 'Demandes',
      icon: <DocumentArrowDownIcon className="h-4 w-4" />,
      content: <RequestsTab />
    },
    {
      id: 'rooms',
      label: 'Chambres',
      icon: <ChartBarIcon className="h-4 w-4" />,
      content: <ChambresTab />
    },
    {
      id: 'complexes',
      label: 'Cités',
      icon: <HomeModernIcon className="h-4 w-4" />,
      content: <CitesTab />
    },
    { 
      id: 'residents', 
      label: 'Résidents', 
      icon: <UserGroupIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Résidents</h3>
            <Button
              onClick={() => {
                setModalType('resident');
                setIsCreateModalOpen(true);
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouveau Résident
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Résidents ({residents.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <Table
                data={paginatedResidents}
                columns={residentColumns}
                loading={residentsLoading}
                emptyMessage="Aucun résident trouvé"
                onRowClick={(item) => {
                  setSelectedItem(item);
                  setModalType('resident');
                  setIsEditModalOpen(true);
                }}
              />
              
              {/* Pagination */}
              {residents.length > 0 && (
                <div className="mt-6 flex justify-center">
                  <ModernPagination
                    currentPage={residentsPage}
                    totalPages={totalResidentsPages}
                    onPageChange={setResidentsPage}
                    pageSize={residentsPageSize}
                    totalItems={residents.length}
                    pageSizeOptions={[5, 10, 20, 50]}
                    onPageSizeChange={(newSize) => {
                      setResidentsPageSize(newSize);
                      setResidentsPage(1);
                    }}
                    showPageSize
                    showTotal
                    showFirstLast
                    variant="default"
                    size="md"
                  />
                </div>
              )}
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'maintenance', 
      label: 'Maintenance', 
      icon: <WrenchScrewdriverIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Demandes de Maintenance</h3>
            <Button
              onClick={() => {
                setModalType('maintenance');
                setIsCreateModalOpen(true);
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouvelle Demande
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Demandes ({maintenanceRequests.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <Table
                data={maintenanceRequests}
                columns={maintenanceColumns}
                loading={maintenanceLoading}
                emptyMessage="Aucune demande trouvée"
                onRowClick={(item) => {
                  setSelectedItem(item);
                  setModalType('maintenance');
                  setIsEditModalOpen(true);
                }}
              />
            </Card.Content>
          </Card>
        </div>
      )
    },
    { 
      id: 'payments', 
      label: 'Paiements', 
      icon: <CurrencyDollarIcon className="h-4 w-4" />,
      content: (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Paiements</h3>
            <Button
              onClick={() => {
                setModalType('payment');
                setIsCreateModalOpen(true);
              }}
              leftIcon={<PlusIcon className="h-4 w-4" />}
            >
              Nouveau Paiement
            </Button>
          </div>

          <Card>
            <Card.Header>
              <Card.Title>Liste des Paiements ({payments.length})</Card.Title>
            </Card.Header>
            <Card.Content>
              <Table
                data={payments}
                columns={paymentColumns}
                loading={paymentsLoading}
                emptyMessage="Aucun paiement trouvé"
                onRowClick={(item) => {
                  setSelectedItem(item);
                  setModalType('payment');
                  setIsEditModalOpen(true);
                }}
              />
            </Card.Content>
          </Card>
        </div>
      )
    }
  ];

  return (
    <Container size="xl" className="py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🛏️ Gestion des Logements</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 mt-2">
              Gestion des lits, occupations et cités universitaires
            </p>
          </div>
          <div className="flex items-center gap-4">
            {overduePayments > 0 && (
              <Badge variant="danger" className="text-lg px-4 py-2">
                {overduePayments} Paiement{overduePayments > 1 ? 's' : ''} en Retard
              </Badge>
            )}
            <ExportButton module="housing" />
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => {
                setModalType('complex');
                setIsCreateModalOpen(true);
              }}
            >
              Nouvelle Cité
            </Button>
          </div>
        </div>
      </div>

      {/* Statistiques - BED-CENTERED */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">🛏️ Total Lits</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100">{totalRooms * 2}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400">Toutes cités</p>
              </div>
              <div className="text-4xl">🛏️</div>
            </div>
          </Card.Content>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">🟢 Disponibles</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100">{(totalRooms * 2) - totalResidents}</p>
                <p className="text-xs text-green-600 dark:text-green-400">Libres</p>
              </div>
              <div className="text-4xl">🟢</div>
            </div>
          </Card.Content>
        </Card>
        <Card className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">🔴 Occupés</p>
                <p className="text-3xl font-bold text-red-900 dark:text-red-100">{totalResidents}</p>
                <p className="text-xs text-red-600 dark:text-red-400">Attribués</p>
              </div>
              <div className="text-4xl">🔴</div>
            </div>
          </Card.Content>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">📊 Taux Occupation</p>
                <p className="text-3xl font-bold text-purple-900 dark:text-purple-100">{occupancyRate.toFixed(1)}%</p>
                <p className="text-xs text-purple-600 dark:text-purple-400">Des lits</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </Card.Content>
        </Card>
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
          <Card.Content>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700 dark:text-orange-300">🏢 Chambres</p>
                <p className="text-3xl font-bold text-orange-900 dark:text-orange-100">{totalRooms}</p>
                <p className="text-xs text-orange-600 dark:text-orange-400">{totalComplexes} cités</p>
              </div>
              <div className="text-4xl">🏢</div>
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Tabs de navigation */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pills"
        className="space-y-8"
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
            placeholder="Ex: Cité Universitaire A"
            required
          />
          <Input
            label="Adresse"
            placeholder="Ex: Rue de l'Université, Niamey"
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
              label="Nombre de chambres"
              type="number"
              placeholder="0"
              required
            />
          </div>
          <Select
            label="Statut"
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' }
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
            placeholder="Ex: Cité Universitaire A"
            required
          />
          <Input
            label="Adresse"
            placeholder="Ex: Rue de l'Université, Niamey"
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
              label="Nombre de chambres"
              type="number"
              placeholder="0"
              required
            />
          </div>
          <Select
            label="Statut"
            options={[
              { value: 'active', label: 'Actif' },
              { value: 'inactive', label: 'Inactif' }
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

export default HousingPage;