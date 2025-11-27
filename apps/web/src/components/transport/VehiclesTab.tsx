/**
 * FICHIER: apps/web/src/components/transport/VehiclesTab.tsx
 * COMPOSANT: VehiclesTab - Gestion du parc de véhicules
 *
 * DESCRIPTION:
 * Gestion complète du parc de véhicules de transport
 * Un véhicule = un bus/car stationné au campus
 *
 * FONCTIONNALITÉS:
 * - Liste des véhicules avec filtres
 * - Ajout/Modification/Suppression
 * - Suivi kilométrage et maintenance
 * - Activation/Désactivation
 * - Statistiques par véhicule
 *
 * AUTEUR: Équipe CROU - Module Transport
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
  useConfirmDialog
} from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useTransportVehicles } from '@/hooks/useTransport';
import toast from 'react-hot-toast';

interface VehicleFormData {
  plateNumber: string;
  make: string;
  model: string;
  year: number;
  type: 'BUS' | 'MINIBUS' | 'CAR' | 'VAN';
  capacity: number;
  mileage: number;
  kilometrageProchainEntretien: number;
  status: 'active' | 'inactive' | 'maintenance';
  fuelType?: string;
  lastMaintenanceDate?: string;
}

export const VehiclesTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any | null>(null);
  const [formData, setFormData] = useState<VehicleFormData>({
    plateNumber: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    type: 'BUS',
    capacity: 45,
    mileage: 0,
    kilometrageProchainEntretien: 5000,
    status: 'active',
    fuelType: 'DIESEL',
    lastMaintenanceDate: ''
  });

  const {
    vehicles,
    loading,
    filters,
    createVehicle,
    updateVehicle,
    deleteVehicle,
    updateFilters,
    refresh
  } = useTransportVehicles();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = () => {
    setEditingVehicle(null);
    setFormData({
      plateNumber: '',
      make: '',
      model: '',
      year: new Date().getFullYear(),
      type: 'BUS',
      capacity: 45,
      mileage: 0,
      kilometrageProchainEntretien: 5000,
      status: 'active',
      fuelType: 'DIESEL',
      lastMaintenanceDate: ''
    });
    setIsModalOpen(true);
  };

  /**
   * Ouvrir modal édition
   */
  const handleOpenEditModal = (vehicle: any) => {
    setEditingVehicle(vehicle);
    setFormData({
      plateNumber: vehicle.plateNumber || '',
      make: vehicle.make || '',
      model: vehicle.model || '',
      year: vehicle.year || new Date().getFullYear(),
      type: vehicle.type || 'BUS',
      capacity: vehicle.capacity || 45,
      mileage: vehicle.mileage || 0,
      kilometrageProchainEntretien: vehicle.kilometrageProchainEntretien || 5000,
      status: vehicle.status || 'active',
      fuelType: vehicle.fuelType || 'DIESEL',
      lastMaintenanceDate: vehicle.lastMaintenanceDate?.split('T')[0] || ''
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder véhicule
   */
  const handleSave = async () => {
    // Validation
    if (!formData.plateNumber.trim()) {
      toast.error('La plaque d\'immatriculation est obligatoire');
      return;
    }

    if (!formData.make.trim() || !formData.model.trim()) {
      toast.error('La marque et le modèle sont obligatoires');
      return;
    }

    if (formData.capacity <= 0) {
      toast.error('La capacité doit être supérieure à 0');
      return;
    }

    try {
      if (editingVehicle) {
        await updateVehicle(editingVehicle.id, formData);
        toast.success('Véhicule modifié avec succès');
      } else {
        await createVehicle(formData);
        toast.success('Véhicule créé avec succès');
      }
      setIsModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer véhicule
   */
  const handleDelete = async (vehicle: any) => {
    const confirmed = await confirm({
      title: 'Supprimer ce véhicule ?',
      message: `Êtes-vous sûr de vouloir supprimer le véhicule "${vehicle.make} ${vehicle.model}" (${vehicle.plateNumber}) ?`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      await deleteVehicle(vehicle.id);
      toast.success('Véhicule supprimé avec succès');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Toggle actif/inactif
   */
  const handleToggleStatus = async (vehicle: any) => {
    const newStatus = vehicle.status === 'active' ? 'inactive' : 'active';

    try {
      await updateVehicle(vehicle.id, {
        ...vehicle,
        status: newStatus
      });
      toast.success(newStatus === 'active' ? 'Véhicule activé' : 'Véhicule désactivé');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  /**
   * Obtenir badge de statut
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Actif</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'maintenance':
        return <Badge variant="warning">Maintenance</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  /**
   * Obtenir badge de type
   */
  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      BUS: 'blue',
      MINIBUS: 'green',
      CAR: 'purple',
      VAN: 'orange'
    };
    const color = colors[type] || 'gray';
    return <Badge variant="secondary" className={`bg-${color}-100 text-${color}-800`}>{type}</Badge>;
  };

  /**
   * Vérifier si maintenance proche
   */
  const isMaintenanceDue = (vehicle: any) => {
    if (!vehicle.kilometrageProchainEntretien) return false;
    const kmRestants = vehicle.kilometrageProchainEntretien - (vehicle.mileage || 0);
    return kmRestants <= 500; // Alerte si moins de 500 km avant entretien
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'vehicle',
      label: 'Véhicule',
      render: (vehicle: any) => (
        <div className="flex items-center gap-3">
          <TruckIcon className="h-8 w-8 text-gray-400" />
          <div>
            <p className="font-medium">{vehicle.make} {vehicle.model}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
              {vehicle.plateNumber}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'details',
      label: 'Détails',
      render: (vehicle: any) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            {getTypeBadge(vehicle.type)}
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {vehicle.year}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Capacité: <span className="font-medium">{vehicle.capacity} places</span>
          </p>
        </div>
      )
    },
    {
      key: 'mileage',
      label: 'Kilométrage',
      render: (vehicle: any) => {
        const kmRestants = (vehicle.kilometrageProchainEntretien || 0) - (vehicle.mileage || 0);
        const isAlerte = kmRestants <= 500;

        return (
          <div>
            <p className="font-medium text-lg">{(vehicle.mileage || 0).toLocaleString()} km</p>
            <p className={`text-sm ${isAlerte ? 'text-red-600 font-semibold' : 'text-gray-500 dark:text-gray-400'}`}>
              {isAlerte && <ExclamationTriangleIcon className="h-4 w-4 inline mr-1" />}
              Entretien: {kmRestants.toLocaleString()} km
            </p>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Statut',
      render: (vehicle: any) => (
        <div>
          {getStatusBadge(vehicle.status)}
          {isMaintenanceDue(vehicle) && (
            <Badge variant="danger" className="mt-1">
              <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
              Entretien requis
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'maintenance',
      label: 'Dernière Maintenance',
      render: (vehicle: any) => {
        if (!vehicle.lastMaintenanceDate) {
          return <span className="text-sm text-gray-400">Non renseigné</span>;
        }
        return (
          <div>
            <p className="font-medium">
              {new Date(vehicle.lastMaintenanceDate).toLocaleDateString('fr-FR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {Math.floor((Date.now() - new Date(vehicle.lastMaintenanceDate).getTime()) / (1000 * 60 * 60 * 24))} jours
            </p>
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (vehicle: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={vehicle.status === 'active' ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
            onClick={() => handleToggleStatus(vehicle)}
          >
            {vehicle.status === 'active' ? 'Désactiver' : 'Activer'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => handleOpenEditModal(vehicle)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrashIcon className="h-4 w-4" />}
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(vehicle)}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  // Statistiques
  const stats = {
    total: vehicles?.length || 0,
    actifs: vehicles?.filter(v => v.status === 'active').length || 0,
    maintenance: vehicles?.filter(v => v.status === 'maintenance').length || 0,
    alertes: vehicles?.filter(v => isMaintenanceDue(v)).length || 0
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Véhicules</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <TruckIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Véhicules Actifs</p>
                <p className="text-2xl font-bold text-green-600">{stats.actifs}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Maintenance</p>
                <p className="text-2xl font-bold text-orange-600">{stats.maintenance}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertes Entretien</p>
                <p className="text-2xl font-bold text-red-600">{stats.alertes}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Alertes de maintenance */}
      {stats.alertes > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <Card.Content className="p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-red-900 dark:text-red-400">
                  {stats.alertes} véhicule{stats.alertes > 1 ? 's' : ''} nécessite{stats.alertes > 1 ? 'nt' : ''} un entretien
                </p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Ces véhicules ont atteint ou sont proches de leur kilométrage d'entretien. Planifiez une maintenance dès que possible.
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Input
            placeholder="Rechercher un véhicule..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.status || 'all'}
            onChange={(value) => updateFilters({ status: value })}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'active', label: 'Actifs' },
              { value: 'inactive', label: 'Inactifs' },
              { value: 'maintenance', label: 'En maintenance' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={handleOpenCreateModal} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouveau Véhicule
        </Button>
      </div>

      {/* Tableau des véhicules */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5" />
            Parc de Véhicules ({vehicles?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable data={vehicles || []} columns={columns} emptyMessage="Aucun véhicule trouvé" />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingVehicle ? 'Modifier le Véhicule' : 'Nouveau Véhicule'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Plaque d'Immatriculation"
              placeholder="Ex: NE-2024-AB-123"
              value={formData.plateNumber}
              onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
              required
            />

            <Select
              label="Type de Véhicule"
              value={formData.type}
              onChange={(value: any) => setFormData({ ...formData, type: value })}
              options={[
                { value: 'BUS', label: 'Bus (45+ places)' },
                { value: 'MINIBUS', label: 'Minibus (15-30 places)' },
                { value: 'CAR', label: 'Car (30-45 places)' },
                { value: 'VAN', label: 'Van (8-15 places)' }
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Marque"
              placeholder="Ex: Mercedes"
              value={formData.make}
              onChange={(e) => setFormData({ ...formData, make: e.target.value })}
              required
            />

            <Input
              label="Modèle"
              placeholder="Ex: Sprinter"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Année"
              type="number"
              min="1990"
              max={new Date().getFullYear() + 1}
              value={formData.year}
              onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) || new Date().getFullYear() })}
              required
            />

            <Input
              label="Capacité (places)"
              type="number"
              min="1"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              required
            />

            <Select
              label="Carburant"
              value={formData.fuelType}
              onChange={(value: any) => setFormData({ ...formData, fuelType: value })}
              options={[
                { value: 'DIESEL', label: 'Diesel' },
                { value: 'ESSENCE', label: 'Essence' },
                { value: 'HYBRIDE', label: 'Hybride' },
                { value: 'ELECTRIQUE', label: 'Électrique' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Kilométrage Actuel (km)"
              type="number"
              min="0"
              value={formData.mileage}
              onChange={(e) => setFormData({ ...formData, mileage: parseInt(e.target.value) || 0 })}
              required
            />

            <Input
              label="Prochain Entretien à (km)"
              type="number"
              min="0"
              value={formData.kilometrageProchainEntretien}
              onChange={(e) => setFormData({ ...formData, kilometrageProchainEntretien: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Statut"
              value={formData.status}
              onChange={(value: any) => setFormData({ ...formData, status: value })}
              options={[
                { value: 'active', label: 'Actif' },
                { value: 'inactive', label: 'Inactif' },
                { value: 'maintenance', label: 'En maintenance' }
              ]}
              required
            />

            <Input
              label="Dernière Maintenance"
              type="date"
              value={formData.lastMaintenanceDate}
              onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Le véhicule sera automatiquement alerté lorsqu'il atteindra <strong>500 km</strong> avant le prochain entretien.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingVehicle ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default VehiclesTab;
