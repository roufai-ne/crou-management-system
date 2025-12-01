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
  Table,
  Modal,
  Input,
  Select
} from '@/components/ui';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  HomeModernIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChartBarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import { useHousingComplexes } from '@/hooks/useHousing';
import { HousingComplex, CreateHousingComplexRequest, UpdateHousingComplexRequest } from '@/services/api/housingService';
import { Toast } from '@/components/ui/Toast';

interface CitesTabProps {
  onNavigateToRooms?: (complexId: string, complexName: string) => void;
}

interface CiteFormData {
  name: string;
  address: string;
  totalRooms: number;
  monthlyRent: number;
  status: 'active' | 'inactive' | 'maintenance';
  description: string;
}

export const CitesTab: React.FC<CitesTabProps> = ({ onNavigateToRooms }) => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCite, setEditingCite] = useState<HousingComplex | null>(null);
  const [formData, setFormData] = useState<CiteFormData>({
    name: '',
    address: '',
    totalRooms: 0,
    monthlyRent: 15000,
    status: 'active',
    description: ''
  });

  // Utiliser le hook réel
  const {
    complexes: cites,
    loading,
    error,
    filters,
    createComplex,
    updateComplex,
    deleteComplex,
    updateFilters
  } = useHousingComplexes();

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
      address: cite.address || '',
      totalRooms: cite.totalRooms || 0,
      monthlyRent: cite.monthlyRent || 15000,
      status: cite.status || 'active',
      description: cite.description || ''
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder cité
   */
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      Toast.error('Le nom de la cité est obligatoire');
      return;
    }

    if (!formData.address.trim()) {
      Toast.error('L\'adresse est obligatoire');
      return;
    }

    if (formData.totalRooms <= 0) {
      Toast.error('Le nombre de chambres doit être supérieur à 0');
      return;
    }

    try {
      if (editingCite) {
        await updateComplex(editingCite.id, formData as UpdateHousingComplexRequest);
        Toast.success('Cité modifiée avec succès');
      } else {
        await createComplex(formData as CreateHousingComplexRequest);
        Toast.success('Cité créée avec succès');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer cité
   */
  const handleDelete = async (cite: HousingComplex) => {
    if (cite.occupiedRooms > 0) {
      Toast.error('Impossible de supprimer une cité avec des chambres occupées');
      return;
    }

    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer la cité "${cite.name}" ?`)) {
      return;
    }

    try {
      await deleteComplex(cite.id);
      Toast.success('Cité supprimée avec succès');
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Toggle actif/inactif
   */
  const handleToggleStatus = async (cite: HousingComplex) => {
    const newStatus = cite.status === 'active' ? 'inactive' : 'active';

    try {
      await updateComplex(cite.id, { status: newStatus } as UpdateHousingComplexRequest);
      Toast.success(newStatus === 'active' ? 'Cité activée' : 'Cité désactivée');
    } catch (error: any) {
      Toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  /**
   * Reset formulaire
   */
  const resetForm = () => {
    setEditingCite(null);
    setFormData({
      name: '',
      address: '',
      totalRooms: 0,
      monthlyRent: 15000,
      status: 'active',
      description: ''
    });
    setIsModalOpen(true);
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
            <p className="text-sm text-gray-500 dark:text-gray-400">{cite.address}</p>
          </div>
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
      key: 'rent',
      label: 'Loyer mensuel',
      render: (cite: HousingComplex) => (
        <div className="text-right">
          <p className="font-bold text-lg">{cite.monthlyRent.toLocaleString()} XOF</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (cite: HousingComplex) => getStatusBadge(cite.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (cite: HousingComplex) => (
        <div className="flex items-center gap-2 flex-wrap">
          {onNavigateToRooms && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<ArrowRightIcon className="h-4 w-4" />}
              onClick={() => onNavigateToRooms(cite.id, cite.name)}
            >
              Voir chambres
            </Button>
          )}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Cités</p>
                <p className="text-2xl font-bold text-blue-600">{cites.length}</p>
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
                <p className="text-2xl font-bold text-green-600">
                  {cites.filter(c => c.status === 'active').length}
                </p>
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
                <p className="text-2xl font-bold text-purple-600">
                  {cites.reduce((sum, c) => sum + c.totalRooms, 0)}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-600" />
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
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.status}
            onChange={(value) => updateFilters({ status: value })}
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
          ) : error ? (
            <div className="text-center py-8 text-red-500">{error}</div>
          ) : (
            <Table data={cites} columns={columns} emptyMessage="Aucune cité trouvée" />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingCite ? 'Modifier la Cité' : 'Nouvelle Cité'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Nom de la Cité"
            placeholder="Ex: Cité Universitaire Nord"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Adresse"
            placeholder="Ex: Avenue de la République, Niamey"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre de chambres"
              type="number"
              min={0}
              placeholder="Ex: 50"
              value={formData.totalRooms}
              onChange={(e) => setFormData({ ...formData, totalRooms: parseInt(e.target.value) || 0 })}
              required
            />

            <Input
              label="Loyer mensuel (XOF)"
              type="number"
              min={0}
              placeholder="Ex: 15000"
              value={formData.monthlyRent}
              onChange={(e) => setFormData({ ...formData, monthlyRent: parseInt(e.target.value) || 0 })}
              required
            />
          </div>

          <Select
            label="Statut"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value as 'active' | 'inactive' | 'maintenance' })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'maintenance', label: 'En maintenance' }
            ]}
            required
          />

          <Input
            label="Description (optionnel)"
            placeholder="Ex: Cité moderne avec WiFi et climatisation"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

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
    </div>
  );
};

export default CitesTab;
