/**
 * FICHIER: apps/web/src/components/transport/CircuitsTab.tsx
 * COMPOSANT: CircuitsTab - Gestion des circuits de transport
 *
 * DESCRIPTION:
 * Gestion des circuits/axes de transport (lignes fixes)
 * Un circuit = une ligne entre le campus et une zone de la ville
 *
 * FONCTIONNALITÉS:
 * - Liste des circuits avec filtres
 * - Ajout/Modification/Suppression
 * - Activation/Désactivation
 * - Statistiques par circuit
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
  MapIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useTransportRoutes } from '@/hooks/useTransport';
import toast from 'react-hot-toast';

interface CircuitFormData {
  code: string;
  name: string;
  description: string;
  startLocation: string;
  endLocation: string;
  distance: number;
  isActive: boolean;
}

export const CircuitsTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCircuit, setEditingCircuit] = useState<any | null>(null);
  const [formData, setFormData] = useState<CircuitFormData>({
    code: '',
    name: '',
    description: '',
    startLocation: 'Campus CROU',
    endLocation: '',
    distance: 0,
    isActive: true
  });

  const {
    routes: circuits,
    loading,
    filters,
    createRoute: createCircuit,
    updateRoute: updateCircuit,
    deleteRoute: deleteCircuit,
    updateFilters,
    refresh
  } = useTransportRoutes();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = () => {
    setEditingCircuit(null);
    setFormData({
      code: '',
      name: '',
      description: '',
      startLocation: 'Campus CROU',
      endLocation: '',
      distance: 0,
      isActive: true
    });
    setIsModalOpen(true);
  };

  /**
   * Ouvrir modal édition
   */
  const handleOpenEditModal = (circuit: any) => {
    setEditingCircuit(circuit);
    setFormData({
      code: circuit.code || '',
      name: circuit.name || '',
      description: circuit.description || '',
      startLocation: circuit.startLocation || 'Campus CROU',
      endLocation: circuit.endLocation || '',
      distance: circuit.distance || 0,
      isActive: circuit.isActive !== false
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder circuit (création ou modification)
   */
  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Le nom du circuit est obligatoire');
      return;
    }

    if (!formData.endLocation.trim()) {
      toast.error('La destination est obligatoire');
      return;
    }

    if (formData.distance <= 0) {
      toast.error('La distance doit être supérieure à 0');
      return;
    }

    try {
      if (editingCircuit) {
        // Modification
        await updateCircuit(editingCircuit.id, formData);
        toast.success('Circuit modifié avec succès');
      } else {
        // Création
        await createCircuit(formData);
        toast.success('Circuit créé avec succès');
      }
      setIsModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer circuit
   */
  const handleDelete = async (circuit: any) => {
    const confirmed = await confirm({
      title: 'Supprimer ce circuit ?',
      message: `Êtes-vous sûr de vouloir supprimer le circuit "${circuit.name}" ?`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      await deleteCircuit(circuit.id);
      toast.success('Circuit supprimé avec succès');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Toggle actif/inactif
   */
  const handleToggleActive = async (circuit: any) => {
    try {
      await updateCircuit(circuit.id, {
        ...circuit,
        isActive: !circuit.isActive
      });
      toast.success(circuit.isActive ? 'Circuit désactivé' : 'Circuit activé');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la modification');
    }
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'code',
      label: 'Code',
      render: (circuit: any) => (
        <div>
          <p className="font-mono font-medium text-sm">{circuit.code || 'N/A'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {circuit.isActive ? (
              <Badge variant="success">Actif</Badge>
            ) : (
              <Badge variant="secondary">Inactif</Badge>
            )}
          </p>
        </div>
      )
    },
    {
      key: 'name',
      label: 'Circuit / Axe',
      render: (circuit: any) => (
        <div>
          <p className="font-medium">{circuit.name}</p>
          {circuit.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{circuit.description}</p>
          )}
        </div>
      )
    },
    {
      key: 'locations',
      label: 'Trajet',
      render: (circuit: any) => (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-700 dark:text-gray-300">{circuit.startLocation || 'Campus'}</span>
          <span className="text-gray-400">→</span>
          <span className="text-gray-700 dark:text-gray-300">{circuit.endLocation || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'distance',
      label: 'Distance A/R',
      render: (circuit: any) => (
        <div className="text-center">
          <p className="font-medium">{circuit.distance || 0} km</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">aller-retour</p>
        </div>
      )
    },
    {
      key: 'statistics',
      label: 'Statistiques',
      render: (circuit: any) => (
        <div className="text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Trajets: <span className="font-medium">{circuit.totalTripsCompleted || 0}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Passagers: <span className="font-medium">{circuit.totalPassengersTransported || 0}</span>
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (circuit: any) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={circuit.isActive ? <XCircleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
            onClick={() => handleToggleActive(circuit)}
          >
            {circuit.isActive ? 'Désactiver' : 'Activer'}
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => handleOpenEditModal(circuit)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrashIcon className="h-4 w-4" />}
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(circuit)}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Circuits Totaux</p>
                <p className="text-2xl font-bold text-blue-600">{circuits?.length || 0}</p>
              </div>
              <MapIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Circuits Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {circuits?.filter((c) => c.isActive).length || 0}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Distance Totale</p>
                <p className="text-2xl font-bold text-purple-600">
                  {circuits?.reduce((sum, c) => sum + (c.distance || 0), 0) || 0} km
                </p>
              </div>
              <MapIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Trajets Effectués</p>
                <p className="text-2xl font-bold text-orange-600">
                  {circuits?.reduce((sum, c) => sum + (c.totalTripsCompleted || 0), 0) || 0}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Input
            placeholder="Rechercher un circuit..."
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
              { value: 'inactive', label: 'Inactifs' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={handleOpenCreateModal} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouveau Circuit
        </Button>
      </div>

      {/* Tableau des circuits */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <MapIcon className="h-5 w-5" />
            Circuits de Transport ({circuits?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable data={circuits || []} columns={columns} emptyMessage="Aucun circuit trouvé" />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCircuit ? 'Modifier le Circuit' : 'Nouveau Circuit'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Code Circuit"
            placeholder="Ex: AXE-001"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          />

          <Input
            label="Nom du Circuit / Axe"
            placeholder="Ex: Axe Plateau"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <Input
            label="Description"
            placeholder="Ex: Dessert les quartiers Plateau, Lamordé, etc."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Point de Départ"
              value={formData.startLocation}
              onChange={(e) => setFormData({ ...formData, startLocation: e.target.value })}
              required
            />

            <Input
              label="Destination"
              placeholder="Ex: Quartier Plateau"
              value={formData.endLocation}
              onChange={(e) => setFormData({ ...formData, endLocation: e.target.value })}
              required
            />
          </div>

          <Input
            label="Distance Aller-Retour (km)"
            type="number"
            min="0"
            step="0.1"
            placeholder="Ex: 18"
            value={formData.distance}
            onChange={(e) => setFormData({ ...formData, distance: parseFloat(e.target.value) || 0 })}
            required
          />

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Circuit actif
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              La distance indiquée doit être la distance <strong>aller-retour complète</strong> depuis le campus.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingCircuit ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default CircuitsTab;
