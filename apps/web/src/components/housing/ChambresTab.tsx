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
  DataTable,
  Modal,
  Input,
  Select,
  Textarea,
  useConfirmDialog
} from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HomeIcon,
  CheckCircleIcon,
  XCircleIcon,
  WrenchScrewdriverIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';

// Types
interface Room {
  id: string;
  number: string;
  floor: number;
  complexId: string;
  complex?: {
    name: string;
    code: string;
  };
  capacity: number; // Nombre de lits (1, 2, 3...)
  currentOccupants: number;
  monthlyRent: number; // Loyer unique pour tout le CROU
  status: 'disponible' | 'occupee' | 'maintenance' | 'reservee';
  description?: string;
  equipment?: string[];
}

interface RoomFormData {
  number: string;
  floor: number;
  complexId: string;
  capacity: number;
  monthlyRent: number;
  status: 'disponible' | 'occupee' | 'maintenance' | 'reservee';
  description: string;
}

export const ChambresTab: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    number: '',
    floor: 0,
    complexId: '',
    capacity: 1,
    monthlyRent: 15000, // Valeur par défaut
    status: 'disponible',
    description: ''
  });

  // États de données (à remplacer par hooks réels)
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    complexId: 'all'
  });

  // Cités disponibles (mock - à remplacer par hook)
  const [complexes] = useState([
    { id: '1', name: 'Cité Universitaire A', code: 'CU-A' },
    { id: '2', name: 'Cité Universitaire B', code: 'CU-B' },
    { id: '3', name: 'Cité Plateau', code: 'CU-P' }
  ]);

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = () => {
    setEditingRoom(null);
    setFormData({
      number: '',
      floor: 0,
      complexId: '',
      capacity: 1,
      monthlyRent: 15000,
      status: 'disponible',
      description: ''
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
      floor: room.floor || 0,
      complexId: room.complexId || '',
      capacity: room.capacity || 1,
      monthlyRent: room.monthlyRent || 15000,
      status: room.status || 'disponible',
      description: room.description || ''
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder chambre
   */
  const handleSave = async () => {
    // Validation
    if (!formData.number.trim()) {
      toast.error('Le numéro de chambre est obligatoire');
      return;
    }

    if (!formData.complexId) {
      toast.error('Veuillez sélectionner une cité');
      return;
    }

    if (formData.capacity <= 0 || formData.capacity > 4) {
      toast.error('La capacité doit être entre 1 et 4 lits');
      return;
    }

    if (formData.monthlyRent <= 0) {
      toast.error('Le loyer doit être supérieur à 0');
      return;
    }

    try {
      if (editingRoom) {
        // TODO: Appel API update
        toast.success('Chambre modifiée avec succès');
      } else {
        // TODO: Appel API create
        toast.success('Chambre créée avec succès');
      }
      setIsModalOpen(false);
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer chambre
   */
  const handleDelete = async (room: Room) => {
    if (room.currentOccupants > 0) {
      toast.error('Impossible de supprimer une chambre occupée');
      return;
    }

    const confirmed = await confirm({
      title: 'Supprimer cette chambre ?',
      message: `Êtes-vous sûr de vouloir supprimer la chambre "${room.number}" ?`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      // TODO: Appel API
      toast.success('Chambre supprimée avec succès');
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Changer statut chambre
   */
  const handleChangeStatus = async (room: Room, newStatus: Room['status']) => {
    if (newStatus === 'occupee' && room.currentOccupants === 0) {
      toast.error('Impossible de marquer comme occupée : aucun occupant');
      return;
    }

    try {
      // TODO: Appel API
      toast.success('Statut modifié avec succès');
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  /**
   * Obtenir badge de statut
   */
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string; icon: any }> = {
      disponible: { variant: 'success', label: 'Disponible', icon: CheckCircleIcon },
      occupee: { variant: 'danger', label: 'Occupée', icon: UserIcon },
      maintenance: { variant: 'warning', label: 'Maintenance', icon: WrenchScrewdriverIcon },
      reservee: { variant: 'info', label: 'Réservée', icon: HomeIcon }
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
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Étage {room.floor}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'complex',
      label: 'Cité',
      render: (room: Room) => (
        <div>
          <p className="font-medium">{room.complex?.name}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
            {room.complex?.code}
          </p>
        </div>
      )
    },
    {
      key: 'capacity',
      label: 'Capacité',
      render: (room: Room) => (
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{room.capacity}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {room.capacity === 1 ? 'lit' : 'lits'}
          </p>
          {room.currentOccupants > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {room.currentOccupants} occupant{room.currentOccupants > 1 ? 's' : ''}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'rent',
      label: 'Loyer',
      render: (room: Room) => (
        <div className="text-right">
          <p className="font-medium text-lg">{room.monthlyRent.toLocaleString()} FCFA</p>
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
          {room.status === 'disponible' && (
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
              onClick={() => handleChangeStatus(room, 'disponible')}
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
            disabled={room.currentOccupants > 0}
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
    disponibles: rooms.filter(r => r.status === 'disponible').length,
    occupees: rooms.filter(r => r.status === 'occupee').length,
    maintenance: rooms.filter(r => r.status === 'maintenance').length,
    totalCapacity: rooms.reduce((sum, r) => sum + r.capacity, 0),
    totalOccupants: rooms.reduce((sum, r) => sum + r.currentOccupants, 0)
  };

  const occupancyRate = stats.totalCapacity > 0
    ? ((stats.totalOccupants / stats.totalCapacity) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
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
                <p className="text-2xl font-bold text-green-600">{stats.disponibles}</p>
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
                <p className="text-2xl font-bold text-red-600">{stats.occupees}</p>
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
                  {stats.totalOccupants}/{stats.totalCapacity} lits
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
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.complexId}
            onChange={(value) => setFilters({ ...filters, complexId: value })}
            options={[
              { value: 'all', label: 'Toutes les cités' },
              ...complexes.map(c => ({ value: c.id, label: c.name }))
            ]}
            className="w-full md:w-56"
          />
          <Select
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'disponible', label: 'Disponibles' },
              { value: 'occupee', label: 'Occupées' },
              { value: 'maintenance', label: 'En maintenance' },
              { value: 'reservee', label: 'Réservées' }
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
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable data={rooms} columns={columns} emptyMessage="Aucune chambre trouvée" />
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

          <Textarea
            label="Description / Équipements"
            placeholder="Ex: Climatisée, avec salle d'eau privée..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

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

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default ChambresTab;
