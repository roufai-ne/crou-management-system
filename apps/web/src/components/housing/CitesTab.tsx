/**
 * FICHIER: apps/web/src/components/housing/CitesTab.tsx
 * COMPOSANT: CitesTab - Gestion des cités universitaires
 *
 * DESCRIPTION:
 * Gestion simplifiée des cités universitaires (bâtiments)
 * Une cité = un bâtiment avec plusieurs chambres
 *
 * FONCTIONNALITÉS:
 * - Liste des cités avec statistiques
 * - CRUD complet
 * - Taux d'occupation
 * - Activation/Désactivation
 * - Gestion capacités
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
  HomeModernIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';

// Types
interface HousingComplex {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  postalCode?: string;
  totalRooms: number;
  occupiedRooms: number;
  availableRooms: number;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  description?: string;
  managerName?: string;
  managerPhone?: string;
  facilities?: string[];
}

interface CiteFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  postalCode: string;
  totalRooms: number;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
  managerName: string;
  managerPhone: string;
}

export const CitesTab: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCite, setEditingCite] = useState<HousingComplex | null>(null);
  const [formData, setFormData] = useState<CiteFormData>({
    name: '',
    code: '',
    address: '',
    city: 'Niamey',
    postalCode: '',
    totalRooms: 0,
    capacity: 0,
    status: 'active',
    description: '',
    managerName: '',
    managerPhone: ''
  });

  // États de données (à remplacer par hooks réels)
  const [cites, setCites] = useState<HousingComplex[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all'
  });

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = () => {
    setEditingCite(null);
    setFormData({
      name: '',
      code: '',
      address: '',
      city: 'Niamey',
      postalCode: '',
      totalRooms: 0,
      capacity: 0,
      status: 'active',
      description: '',
      managerName: '',
      managerPhone: ''
    });
    setIsModalOpen(true);
  };

  /**
   * Ouvrir modal édition
   */
  const handleOpenEditModal = (cite: HousingComplex) => {
    setEditingCite(cite);
    setFormData({
      name: cite.name || '',
      code: cite.code || '',
      address: cite.address || '',
      city: cite.city || 'Niamey',
      postalCode: cite.postalCode || '',
      totalRooms: cite.totalRooms || 0,
      capacity: cite.capacity || 0,
      status: cite.status || 'active',
      description: cite.description || '',
      managerName: cite.managerName || '',
      managerPhone: cite.managerPhone || ''
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder cité
   */
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Le nom de la cité est obligatoire');
      return;
    }

    if (!formData.address.trim()) {
      toast.error('L\'adresse est obligatoire');
      return;
    }

    if (formData.totalRooms <= 0) {
      toast.error('Le nombre de chambres doit être supérieur à 0');
      return;
    }

    if (formData.capacity <= 0) {
      toast.error('La capacité doit être supérieure à 0');
      return;
    }

    try {
      if (editingCite) {
        // TODO: Appel API update
        toast.success('Cité modifiée avec succès');
      } else {
        // TODO: Appel API create
        toast.success('Cité créée avec succès');
      }
      setIsModalOpen(false);
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer cité
   */
  const handleDelete = async (cite: HousingComplex) => {
    if (cite.occupiedRooms > 0) {
      toast.error('Impossible de supprimer une cité avec des chambres occupées');
      return;
    }

    const confirmed = await confirm({
      title: 'Supprimer cette cité ?',
      message: `Êtes-vous sûr de vouloir supprimer la cité "${cite.name}" ?`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      // TODO: Appel API
      toast.success('Cité supprimée avec succès');
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Toggle actif/inactif
   */
  const handleToggleStatus = async (cite: HousingComplex) => {
    const newStatus = cite.status === 'active' ? 'inactive' : 'active';

    try {
      // TODO: Appel API
      toast.success(newStatus === 'active' ? 'Cité activée' : 'Cité désactivée');
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  /**
   * Obtenir badge de statut
   */
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'secondary', label: 'Inactive' },
      maintenance: { variant: 'warning', label: 'Maintenance' }
    };
    const config = badges[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * Calculer taux d'occupation
   */
  const getOccupancyRate = (cite: HousingComplex) => {
    if (cite.totalRooms === 0) return 0;
    return ((cite.occupiedRooms / cite.totalRooms) * 100).toFixed(1);
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'cite',
      label: 'Cité',
      render: (cite: HousingComplex) => (
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <HomeModernIcon className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-lg">{cite.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{cite.code}</p>
          </div>
        </div>
      )
    },
    {
      key: 'location',
      label: 'Localisation',
      render: (cite: HousingComplex) => (
        <div>
          <p className="font-medium">{cite.address}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{cite.city}</p>
        </div>
      )
    },
    {
      key: 'capacity',
      label: 'Capacité',
      render: (cite: HousingComplex) => (
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{cite.totalRooms}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">chambres</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Capacité: {cite.capacity} étudiants
          </p>
        </div>
      )
    },
    {
      key: 'occupation',
      label: 'Occupation',
      render: (cite: HousingComplex) => {
        const rate = parseFloat(getOccupancyRate(cite));
        const color = rate >= 90 ? 'text-red-600' : rate >= 70 ? 'text-orange-600' : 'text-green-600';

        return (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <ChartBarIcon className={`h-5 w-5 ${color}`} />
              <p className={`text-2xl font-bold ${color}`}>{rate}%</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {cite.occupiedRooms} / {cite.totalRooms} occupées
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {cite.availableRooms} disponibles
            </p>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Statut',
      render: (cite: HousingComplex) => getStatusBadge(cite.status)
    },
    {
      key: 'manager',
      label: 'Gestionnaire',
      render: (cite: HousingComplex) => {
        if (!cite.managerName) {
          return <span className="text-sm text-gray-400">Non assigné</span>;
        }
        return (
          <div>
            <p className="font-medium text-sm">{cite.managerName}</p>
            {cite.managerPhone && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{cite.managerPhone}</p>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (cite: HousingComplex) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={cite.status === 'active' ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
            onClick={() => handleToggleStatus(cite)}
          >
            {cite.status === 'active' ? 'Désactiver' : 'Activer'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => handleOpenEditModal(cite)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrashIcon className="h-4 w-4" />}
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(cite)}
            disabled={cite.occupiedRooms > 0}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  // Statistiques
  const stats = {
    total: cites.length,
    active: cites.filter(c => c.status === 'active').length,
    totalRooms: cites.reduce((sum, c) => sum + c.totalRooms, 0),
    occupiedRooms: cites.reduce((sum, c) => sum + c.occupiedRooms, 0),
    totalCapacity: cites.reduce((sum, c) => sum + c.capacity, 0)
  };

  const globalOccupancyRate = stats.totalRooms > 0
    ? ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cités</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <HomeModernIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Cités Actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Chambres</p>
                <p className="text-2xl font-bold text-purple-600">{stats.totalRooms}</p>
                <p className="text-xs text-gray-500 mt-1">{stats.occupiedRooms} occupées</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux Occupation</p>
                <p className="text-2xl font-bold text-orange-600">{globalOccupancyRate}%</p>
                <p className="text-xs text-gray-500 mt-1">Capacité: {stats.totalCapacity}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Input
            placeholder="Rechercher une cité..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'active', label: 'Actives' },
              { value: 'inactive', label: 'Inactives' },
              { value: 'maintenance', label: 'En maintenance' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={handleOpenCreateModal} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouvelle Cité
        </Button>
      </div>

      {/* Tableau des cités */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <HomeModernIcon className="h-5 w-5" />
            Cités Universitaires ({cites.length})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable data={cites} columns={columns} emptyMessage="Aucune cité trouvée" />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCite ? 'Modifier la Cité' : 'Nouvelle Cité'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom de la Cité"
              placeholder="Ex: Cité Universitaire A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />

            <Input
              label="Code"
              placeholder="Ex: CU-A"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
            />
          </div>

          <Input
            label="Adresse"
            placeholder="Ex: Avenue de la République"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ville"
              placeholder="Niamey"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />

            <Input
              label="Code Postal"
              placeholder="Ex: 8000"
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Nombre de Chambres"
              type="number"
              min="0"
              value={formData.totalRooms}
              onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) || 0 })}
              required
            />

            <Input
              label="Capacité Totale"
              type="number"
              min="0"
              placeholder="Ex: 100 étudiants"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
              required
            />

            <Select
              label="Statut"
              value={formData.status}
              onChange={(value: any) => setFormData({ ...formData, status: value })}
              options={[
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
                { value: 'maintenance', label: 'Maintenance' }
              ]}
              required
            />
          </div>

          <Textarea
            label="Description"
            placeholder="Ex: Cité moderne avec équipements récents..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nom du Gestionnaire"
              placeholder="Ex: Amadou Diallo"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
            />

            <Input
              label="Téléphone Gestionnaire"
              placeholder="Ex: +227 90 00 00 00"
              value={formData.managerPhone}
              onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
            />
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-400">
              Une fois créée, vous pourrez ajouter les chambres individuelles dans l'onglet "Chambres".
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingCite ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default CitesTab;
