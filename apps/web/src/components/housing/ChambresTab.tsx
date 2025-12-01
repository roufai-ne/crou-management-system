/**
 * FICHIER: apps/web/src/components/housing/ChambresTab.tsx
 * COMPOSANT: ChambresTab - Gestion des chambres
 *
 * DESCRIPTION:
 * Gestion simplifiée des chambres universitaires
 * Loyer unique par CROU (pas de catégories de chambres)
 *
 * FONCTIONNALITÉS:
 * - Liste chambres par cité
 * - CRUD complet
 * - Statuts: disponible, occupée, maintenance, réservée
 * - Gestion capacités (nombre de lits)
 * - Loyer configurable par tenant
 *
 * AUTEUR: Équipe CROU - Module Logement
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import {
  Card,
  Badge,
  Button,
  Table,
  Modal,
  Input,
  Select
} from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  UserIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { useHousingRooms, useHousingComplexes } from '@/hooks/useHousing';
import { Room, CreateRoomRequest, UpdateRoomRequest } from '@/services/api/housingService';
import { Toast } from '@/components/ui/Toast';

interface ChambresTabProps {
  selectedComplexId?: string;
  selectedComplexName?: string;
  onNavigateToBeds?: (roomId: string, roomNumber: string) => void;
  onBack?: () => void;
}

interface RoomFormData {
  number: string;
  complexId: string;
  type: 'single' | 'double' | 'triple' | 'quadruple';
  capacity: number;
  monthlyRent: number;
  status: 'available' | 'occupied' | 'maintenance' | 'reserved';
  amenities: string[];
}

export const ChambresTab: React.FC<ChambresTabProps> = ({ 
  selectedComplexId, 
  selectedComplexName,
  onNavigateToBeds,
  onBack 
}) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    number: '',
    complexId: '',
    type: 'single',
    capacity: 1,
    monthlyRent: 15000,
    status: 'available',
    amenities: []
  });

  // Utiliser les hooks réels
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    filters,
    createRoom,
    updateRoom,
    deleteRoom,
    updateFilters
  } = useHousingRooms();

  const {
    complexes,
    loading: complexesLoading
  } = useHousingComplexes();

  // Filtrer automatiquement par cité si spécifiée
  React.useEffect(() => {
    if (selectedComplexId) {
      updateFilters({ complexId: selectedComplexId });
    }
  }, [selectedComplexId, updateFilters]);

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      number: '',
      complexId: '',
      type: 'single',
      capacity: 1,
      monthlyRent: 15000,
      status: 'available',
      amenities: []
    });
    setIsModalOpen(true);
  };

  /**
   * Ouvrir modal édition
   */
  const handleOpenEditModal = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      number: room.number || '',
      complexId: room.complexId || '',
      type: room.type || 'single',
      capacity: room.capacity || 1,
      monthlyRent: room.monthlyRent || 15000,
      status: room.status || 'available',
      amenities: room.amenities || []
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder chambre
   */
  const handleSave = async () => {
    // Validation
    if (!formData.number.trim()) {
      Toast.error('Le numéro de chambre est obligatoire');
      return;
    }

    if (!formData.complexId) {
      Toast.error('Veuillez sélectionner une cité');
      return;
    }

    if (formData.capacity <= 0 || formData.capacity > 4) {
      Toast.error('La capacité doit être entre 1 et 4 lits');
      return;
    }

    if (formData.monthlyRent <= 0) {
      Toast.error('Le loyer doit être supérieur à 0');
      return;
    }

    try {
      if (editingRoom) {
        await updateRoom(editingRoom.id, formData as UpdateRoomRequest);
        Toast.success('Chambre modifiée avec succès');
      } else {
        await createRoom(formData as CreateRoomRequest);
        Toast.success('Chambre créée avec succès');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer chambre
   */
  const handleDelete = async (room: Room) => {
    if (room.currentOccupancy > 0) {
      Toast.error('Impossible de supprimer une chambre occupée');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la chambre "${room.number}" ?`)) {
      return;
    }

    try {
      await deleteRoom(room.id);
      Toast.success('Chambre supprimée avec succès');
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Changer statut chambre
   */
  const handleChangeStatus = async (room: Room, newStatus: Room['status']) => {
    if (newStatus === 'occupied' && room.currentOccupancy === 0) {
      Toast.error('Impossible de marquer comme occupée : aucun occupant');
      return;
    }

    try {
      await updateRoom(room.id, { status: newStatus } as UpdateRoomRequest);
      Toast.success('Statut mis à jour avec succès');
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  /**
   * Reset formulaire
   */
  const resetForm = () => {
    setEditingRoom(null);
    setFormData({
      number: '',
      complexId: '',
      type: 'single',
      capacity: 1,
      monthlyRent: 15000,
      status: 'available',
      amenities: []
    });
  };
  /**
   * Obtenir badge de statut
   */
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> = {
      available: { variant: 'success', label: 'Disponible', icon: CheckCircleIcon },
      occupied: { variant: 'danger', label: 'Occupée', icon: UserIcon },
      maintenance: { variant: 'warning', label: 'Maintenance', icon: WrenchScrewdriverIcon },
      reserved: { variant: 'info', label: 'Réservée', icon: HomeIcon }
    };
    const config = badges[status] || { variant: 'secondary', label: status, icon: HomeIcon };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  /**
   * Obtenir label du type
   */
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      single: '1 lit',
      double: '2 lits',
      triple: '3 lits',
      quadruple: '4 lits'
    };
    return labels[type] || type;
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'number',
      label: 'Numéro',
      render: (room: Room) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center">
            <HomeIcon className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-lg font-mono">{room.number}</p>
            {room.complex && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {room.complex.name}
              </p>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (room: Room) => (
        <div>
          <p className="font-medium">{getTypeLabel(room.type)}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Capacité: {room.capacity}
          </p>
        </div>
      )
    },
    {
      key: 'occupancy',
      label: 'Occupation',
      render: (room: Room) => (
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{room.currentOccupancy}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            / {room.capacity} {room.capacity === 1 ? 'place' : 'places'}
          </p>
        </div>
      )
    },
    {
      key: 'rent',
      label: 'Loyer',
      render: (room: Room) => (
        <div className="text-right">
          <p className="font-medium text-lg">{room.monthlyRent.toLocaleString()} XOF</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">par mois</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (room: Room) => getStatusBadge(room.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (room: Room) => (
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToBeds && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<ArrowRightIcon className="h-4 w-4" />}
              onClick={() => onNavigateToBeds(room.id, room.number)}
            >
              Voir lits
            </Button>
          )}

          {room.status === 'available' && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<WrenchScrewdriverIcon className="h-4 w-4" />}
              onClick={() => handleChangeStatus(room, 'maintenance')}
            >
              Maintenance
            </Button>
          )}

          {room.status === 'maintenance' && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={() => handleChangeStatus(room, 'available')}
            >
              Disponible
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => handleOpenEditModal(room)}
          >
            Modifier
          </Button>

          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrashIcon className="h-4 w-4" />}
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(room)}
            disabled={room.currentOccupancy > 0}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  // Statistiques
  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.status === 'available').length,
    occupied: rooms.filter(r => r.status === 'occupied').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
    reserved: rooms.filter(r => r.status === 'reserved').length,
    totalCapacity: rooms.reduce((sum, r) => sum + r.capacity, 0),
    totalOccupancy: rooms.reduce((sum, r) => sum + r.currentOccupancy, 0)
  };

  const occupancyRate = stats.totalCapacity > 0
    ? ((stats.totalOccupancy / stats.totalCapacity) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Breadcrumb / Navigation */}
      {selectedComplexName && onBack && (
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            onClick={onBack}
          >
            Retour aux cités
          </Button>
          <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Chambres de la cité: <span className="text-blue-600">{selectedComplexName}</span>
          </div>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Chambres</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <HomeIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Occupées</p>
                <p className="text-2xl font-bold text-red-600">{stats.occupied}</p>
              </div>
              <UserIcon className="h-8 w-8 text-red-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
              </div>
              <WrenchScrewdriverIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux Occupation</p>
                <p className="text-2xl font-bold text-purple-600">{occupancyRate}%</p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats.totalOccupancy}/{stats.totalCapacity} lits
                </p>
              </div>
              <UserIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Input
            placeholder="Rechercher une chambre..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.complexId || 'all'}
            onChange={(value) => updateFilters({ complexId: value === 'all' ? undefined : value })}
            options={[
              { value: 'all', label: 'Toutes les cités' },
              ...complexes.map(c => ({ 
                value: c.id, 
                label: c.name || c.nom || `Cité ${c.id.slice(0, 8)}` 
              }))
            ]}
            className="w-full md:w-56"
          />
          <Select
            value={filters.status || 'all'}
            onChange={(value) => updateFilters({ status: value === 'all' ? undefined : value as any })}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'available', label: 'Disponibles' },
              { value: 'occupied', label: 'Occupées' },
              { value: 'maintenance', label: 'En maintenance' },
              { value: 'reserved', label: 'Réservées' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={handleOpenCreateModal} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouvelle Chambre
        </Button>
      </div>

      {/* Tableau des chambres */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <HomeIcon className="h-5 w-5" />
            Chambres ({rooms.length})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {roomsLoading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : roomsError ? (
            <div className="text-center py-8 text-red-500">{roomsError}</div>
          ) : (
            <Table data={rooms} columns={columns} />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingRoom ? 'Modifier la Chambre' : 'Nouvelle Chambre'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Cité Universitaire"
            value={formData.complexId}
            onChange={(value) => setFormData({ ...formData, complexId: value })}
            options={[
              { value: '', label: 'Sélectionner une cité' },
              ...complexes.map(c => ({ value: c.id, label: `${c.name} (${c.code})` }))
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Numéro de Chambre"
              placeholder="Ex: A-101"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              required
            />

            <Input
              label="Étage"
              type="number"
              min="0"
              max="10"
              value={formData.floor}
              onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Select
              label="Capacité (Lits)"
              value={formData.capacity.toString()}
              onChange={(value) => setFormData({ ...formData, capacity: parseInt(value) })}
              options={[
                { value: '1', label: '1 lit (Individuelle)' },
                { value: '2', label: '2 lits (Double)' },
                { value: '3', label: '3 lits (Triple)' },
                { value: '4', label: '4 lits (Quadruple)' }
              ]}
              required
            />

            <Input
              label="Loyer Mensuel (FCFA)"
              type="number"
              min="0"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: parseInt(e.target.value) || 0 })}
              required
            />

            <Select
              label="Statut"
              value={formData.status}
              onChange={(value: any) => setFormData({ ...formData, status: value })}
              options={[
                { value: 'disponible', label: 'Disponible' },
                { value: 'occupee', label: 'Occupée' },
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'reservee', label: 'Réservée' }
              ]}
              required
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-400">
              <strong>Note:</strong> Le loyer est unique pour tout le CROU et peut varier d'un CROU à un autre.
              Toutes les chambres du même CROU ont le même tarif.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingRoom ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChambresTab;
