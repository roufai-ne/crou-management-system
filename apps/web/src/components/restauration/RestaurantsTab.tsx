/**
 * FICHIER: apps/web/src/components/restauration/RestaurantsTab.tsx
 * COMPOSANT: RestaurantsTab - Gestion des restaurants
 *
 * DESCRIPTION:
 * Gestion complète des restaurants universitaires
 * Liste, création, modification, suppression et statistiques
 *
 * FONCTIONNALITÉS:
 * - Liste des restaurants avec filtres
 * - Création et modification de restaurants
 * - Statistiques par restaurant
 * - Gestion des horaires et équipements
 * - Gestion des tarifs
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Card, Badge, Button, Table, Modal, Input, Select } from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  BuildingStorefrontIcon,
  ClockIcon,
  WrenchIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { useRestaurants } from '@/hooks/useRestauration';
import { Restaurant, RestaurantType, RestaurantStatus, CreateRestaurantRequest } from '@/services/api/restaurationService';
import { RestaurantForm } from './forms/RestaurantForm';
import { TableSkeleton } from './skeletons';
import toast from 'react-hot-toast';

interface RestaurantsTabProps {
  tenantId?: string;
}

export const RestaurantsTab: React.FC<RestaurantsTabProps> = ({ tenantId }) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    restaurants,
    loading,
    error,
    filters,
    setFilters,
    createRestaurant,
    updateRestaurant,
    deleteRestaurant,
    refresh
  } = useRestaurants(tenantId);

  const handleCreate = async (data: CreateRestaurantRequest) => {
    setIsSubmitting(true);
    try {
      await createRestaurant(data);
      setIsCreateModalOpen(false);
      toast.success('Restaurant créé avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur création restaurant:', err);
      toast.error('Erreur lors de la création du restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (data: CreateRestaurantRequest) => {
    if (!selectedRestaurant) return;
    setIsSubmitting(true);
    try {
      await updateRestaurant(selectedRestaurant.id, data);
      setIsEditModalOpen(false);
      setSelectedRestaurant(null);
      toast.success('Restaurant modifié avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur modification restaurant:', err);
      toast.error('Erreur lors de la modification du restaurant');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce restaurant ?')) return;
    try {
      await deleteRestaurant(id);
      toast.success('Restaurant supprimé avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur suppression restaurant:', err);
      toast.error('Erreur lors de la suppression du restaurant');
    }
  };

  const openEditModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsEditModalOpen(true);
  };

  const openDetailModal = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant);
    setIsDetailModalOpen(true);
  };

  const getStatusBadge = (status: RestaurantStatus) => {
    switch (status) {
      case RestaurantStatus.ACTIF:
        return <Badge variant="success">Actif</Badge>;
      case RestaurantStatus.FERME_TEMPORAIRE:
        return <Badge variant="warning">Fermé temporairement</Badge>;
      case RestaurantStatus.MAINTENANCE:
        return <Badge variant="secondary">Maintenance</Badge>;
      case RestaurantStatus.INACTIF:
        return <Badge variant="danger">Inactif</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: RestaurantType) => {
    switch (type) {
      case RestaurantType.UNIVERSITAIRE:
        return <Badge variant="primary">Universitaire</Badge>;
      case RestaurantType.CAFETERIA:
        return <Badge variant="secondary">Cafétéria</Badge>;
      case RestaurantType.CANTINE:
        return <Badge variant="secondary">Cantine</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const columns = [
    {
      key: 'code',
      label: 'Code / Nom',
      render: (restaurant: Restaurant) => (
        <div>
          <p className="font-medium">{restaurant.code}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{restaurant.nom}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (restaurant: Restaurant) => getTypeBadge(restaurant.type)
    },
    {
      key: 'status',
      label: 'Statut',
      render: (restaurant: Restaurant) => getStatusBadge(restaurant.status)
    },
    {
      key: 'capacite',
      label: 'Capacité',
      render: (restaurant: Restaurant) => (
        <div className="text-right">
          <p className="font-medium">{restaurant.capaciteMax} places</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Moy: {restaurant.frequentationMoyenne || 0}%
          </p>
        </div>
      )
    },
    {
      key: 'responsable',
      label: 'Responsable',
      render: (restaurant: Restaurant) => restaurant.responsable || '-'
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (restaurant: Restaurant) => (
        <div className="text-sm">
          <p>{restaurant.telephone || '-'}</p>
          <p className="text-gray-500 dark:text-gray-400">{restaurant.email || '-'}</p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (restaurant: Restaurant) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => openDetailModal(restaurant)}
          >
            Voir
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => openEditModal(restaurant)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrashIcon className="h-4 w-4" />}
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(restaurant.id)}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Rechercher un restaurant..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            className="w-full sm:w-80"
          />
          <Select
            value={filters.type || ''}
            onChange={(value) => setFilters({ ...filters, type: String(value) })}
            options={[
              { value: '', label: 'Tous les types' },
              { value: RestaurantType.UNIVERSITAIRE, label: 'Universitaire' },
              { value: RestaurantType.CAFETERIA, label: 'Cafétéria' },
              { value: RestaurantType.CANTINE, label: 'Cantine' }
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={filters.status || ''}
            onChange={(value) => setFilters({ ...filters, status: String(value) })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: RestaurantStatus.ACTIF, label: 'Actif' },
              { value: RestaurantStatus.FERME_TEMPORAIRE, label: 'Fermé temporairement' },
              { value: RestaurantStatus.MAINTENANCE, label: 'Maintenance' },
              { value: RestaurantStatus.INACTIF, label: 'Inactif' }
            ]}
            className="w-full sm:w-48"
          />
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Nouveau Restaurant
        </Button>
      </div>

      {/* Tableau des restaurants */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <BuildingStorefrontIcon className="h-5 w-5" />
            Restaurants ({restaurants?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <TableSkeleton rows={8} columns={7} />
          ) : (
            <Table
              data={restaurants || []}
              columns={columns}
              emptyMessage="Aucun restaurant trouvé"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouveau Restaurant"
        size="xl"
      >
        <RestaurantForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateModalOpen(false)}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Modal Modification */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Modifier Restaurant"
        size="xl"
      >
        <RestaurantForm
          initialData={selectedRestaurant || undefined}
          onSubmit={handleUpdate}
          onCancel={() => {
            setIsEditModalOpen(false);
            setSelectedRestaurant(null);
          }}
          isSubmitting={isSubmitting}
        />
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails du Restaurant"
        size="lg"
      >
        {selectedRestaurant && (
          <div className="space-y-6">
            {/* Informations générales */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Informations Générales</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Code:</p>
                  <p className="font-medium">{selectedRestaurant.code}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Nom:</p>
                  <p className="font-medium">{selectedRestaurant.nom}</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Type:</p>
                  {getTypeBadge(selectedRestaurant.type)}
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Statut:</p>
                  {getStatusBadge(selectedRestaurant.status)}
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Capacité:</p>
                  <p className="font-medium">{selectedRestaurant.capaciteMax} places</p>
                </div>
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Fréquentation moyenne:</p>
                  <p className="font-medium">{selectedRestaurant.frequentationMoyenne || 0}%</p>
                </div>
              </div>
            </div>

            {/* Horaires */}
            {selectedRestaurant.horaires && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Horaires
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {selectedRestaurant.horaires.petitDejeuner && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium mb-1">Petit Déjeuner</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedRestaurant.horaires.petitDejeuner.debut} - {selectedRestaurant.horaires.petitDejeuner.fin}
                      </p>
                    </div>
                  )}
                  {selectedRestaurant.horaires.dejeuner && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium mb-1">Déjeuner</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedRestaurant.horaires.dejeuner.debut} - {selectedRestaurant.horaires.dejeuner.fin}
                      </p>
                    </div>
                  )}
                  {selectedRestaurant.horaires.diner && (
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="font-medium mb-1">Dîner</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {selectedRestaurant.horaires.diner.debut} - {selectedRestaurant.horaires.diner.fin}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Équipements */}
            {selectedRestaurant.equipements && selectedRestaurant.equipements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <WrenchIcon className="h-5 w-5" />
                  Équipements
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedRestaurant.equipements.map((equip: string, index: number) => (
                    <Badge key={index} variant="secondary">{equip}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tarifs */}
            {selectedRestaurant.tarifs && (
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CurrencyDollarIcon className="h-5 w-5" />
                  Tarifs
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  {selectedRestaurant.tarifs.petitDejeuner && (
                    <div className="bg-green-50 p-3 rounded">
                      <p className="font-medium mb-1">Petit Déjeuner</p>
                      <p className="text-green-700 text-lg font-bold">
                        {selectedRestaurant.tarifs.petitDejeuner} XOF
                      </p>
                    </div>
                  )}
                  {selectedRestaurant.tarifs.dejeuner && (
                    <div className="bg-blue-50 p-3 rounded">
                      <p className="font-medium mb-1">Déjeuner</p>
                      <p className="text-blue-700 text-lg font-bold">
                        {selectedRestaurant.tarifs.dejeuner} XOF
                      </p>
                    </div>
                  )}
                  {selectedRestaurant.tarifs.diner && (
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="font-medium mb-1">Dîner</p>
                      <p className="text-purple-700 text-lg font-bold">
                        {selectedRestaurant.tarifs.diner} XOF
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Fermer
              </Button>
              <Button
                variant="primary"
                leftIcon={<PencilIcon className="h-4 w-4" />}
                onClick={() => {
                  setIsDetailModalOpen(false);
                  openEditModal(selectedRestaurant);
                }}
              >
                Modifier
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default RestaurantsTab;
