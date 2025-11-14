/**
 * FICHIER: apps/web/src/components/restauration/RepasTab.tsx
 * COMPOSANT: RepasTab - Gestion des services de repas
 *
 * DESCRIPTION:
 * Gestion complète des services de repas (planification, service, statistiques)
 * Suivi en temps réel des services en cours
 *
 * FONCTIONNALITÉS:
 * - Planification des services
 * - Démarrage et terminaison des services
 * - Suivi en temps réel (rationnaires servis)
 * - Statistiques post-service (fréquentation, recettes, gaspillage)
 * - Historique des services
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Card, Badge, Button, Table, Modal, Input, Select, useConfirmDialog } from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  PlayIcon,
  StopIcon,
  EyeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useRepas, useServiceEnCours } from '@/hooks/useRestauration';
import { Repas, RepasStatus, TypeRepas } from '@/services/api/restaurationService';
import { TableSkeleton } from './skeletons';
import toast from 'react-hot-toast';

export const RepasTab: React.FC = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isTerminerModalOpen, setIsTerminerModalOpen] = useState(false);
  const [selectedRepas, setSelectedRepas] = useState<Repas | null>(null);

  const {
    repas,
    loading,
    error,
    filters,
    setFilters,
    createRepas,
    demarrerService,
    terminerService,
    refresh
  } = useRepas();

  const { servicesEnCours, loadServicesEnCours } = useServiceEnCours();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  const handleDemarrer = async (repasId: string) => {
    const confirmed = await confirm({
      title: 'Démarrer ce service ?',
      message: 'Le service sera marqué comme en cours et les statistiques commenceront à être enregistrées.',
      variant: 'info',
      confirmText: 'Démarrer',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await demarrerService(repasId);
      toast.success('Service démarré avec succès');
      refresh();
      loadServicesEnCours();
    } catch (err) {
      console.error('Erreur démarrage service:', err);
      toast.error('Erreur lors du démarrage du service');
    }
  };

  const handleTerminer = async (data: any) => {
    if (!selectedRepas) return;
    try {
      await terminerService(selectedRepas.id, data);
      setIsTerminerModalOpen(false);
      setSelectedRepas(null);
      toast.success('Service terminé avec succès');
      refresh();
      loadServicesEnCours();
    } catch (err) {
      console.error('Erreur terminaison service:', err);
      toast.error('Erreur lors de la terminaison du service');
    }
  };

  const getStatutBadge = (statut: RepasStatus) => {
    switch (statut) {
      case RepasStatus.PLANIFIE:
        return <Badge variant="secondary">Planifié</Badge>;
      case RepasStatus.EN_COURS:
        return <Badge variant="success">En cours</Badge>;
      case RepasStatus.TERMINE:
        return <Badge variant="primary">Terminé</Badge>;
      case RepasStatus.ANNULE:
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getTypeRepasLabel = (type: TypeRepas) => {
    switch (type) {
      case TypeRepas.PETIT_DEJEUNER:
        return 'Petit Déjeuner';
      case TypeRepas.DEJEUNER:
        return 'Déjeuner';
      case TypeRepas.DINER:
        return 'Dîner';
      case TypeRepas.GOUTER:
        return 'Goûter';
      default:
        return type;
    }
  };

  const columns = [
    {
      key: 'restaurant',
      label: 'Restaurant / Menu',
      render: (repas: Repas) => (
        <div>
          <p className="font-medium">{repas.restaurant?.nom}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{repas.menu?.titre}</p>
        </div>
      )
    },
    {
      key: 'date',
      label: 'Date / Type',
      render: (repas: Repas) => (
        <div>
          <p className="font-medium">{new Date(repas.dateService).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{getTypeRepasLabel(repas.typeRepas)}</p>
        </div>
      )
    },
    {
      key: 'horaires',
      label: 'Horaires',
      render: (repas: Repas) => (
        <div>
          <p className="font-medium">
            {repas.heureDebut ? new Date(repas.heureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
          </p>
          {repas.heureFin && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fin: {new Date(repas.heureFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'rationnaires',
      label: 'Rationnaires',
      render: (repas: Repas) => (
        <div className="text-right">
          <p className="font-medium">{repas.nombreServis || 0} / {repas.nombreRationnaires}</p>
          {repas.tauxFrequentation !== undefined && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{repas.tauxFrequentation}%</p>
          )}
        </div>
      )
    },
    {
      key: 'recettes',
      label: 'Recettes',
      render: (repas: Repas) => (
        <div className="text-right">
          <p className="font-medium">{(repas.recettesTotales || 0).toLocaleString()} XOF</p>
        </div>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (repas: Repas) => getStatutBadge(repas.statut)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (repas: Repas) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedRepas(repas);
              setIsDetailModalOpen(true);
            }}
          >
            Voir
          </Button>
          {repas.statut === RepasStatus.PLANIFIE && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<PlayIcon className="h-4 w-4" />}
              onClick={() => handleDemarrer(repas.id)}
            >
              Démarrer
            </Button>
          )}
          {repas.statut === RepasStatus.EN_COURS && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<StopIcon className="h-4 w-4" />}
              onClick={() => {
                setSelectedRepas(repas);
                setIsTerminerModalOpen(true);
              }}
            >
              Terminer
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Services en cours */}
      {servicesEnCours && servicesEnCours.length > 0 && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-green-600">
              <ClockIcon className="h-5 w-5" />
              Services En Cours ({servicesEnCours.length})
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {servicesEnCours.map((service: Repas) => (
                <div key={service.id} className="border border-green-200 bg-green-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{service.restaurant?.nom}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{service.menu?.titre}</p>
                    </div>
                    <Badge variant="success">En cours</Badge>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                      <span className="font-medium">{getTypeRepasLabel(service.typeRepas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Démarré:</span>
                      <span className="font-medium">
                        {service.heureDebut ? new Date(service.heureDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Servis:</span>
                      <span className="font-medium">{service.nombreServis || 0} / {service.nombreRationnaires}</span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    className="w-full mt-3"
                    leftIcon={<StopIcon className="h-4 w-4" />}
                    onClick={() => {
                      setSelectedRepas(service);
                      setIsTerminerModalOpen(true);
                    }}
                  >
                    Terminer le Service
                  </Button>
                </div>
              ))}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Rechercher un service..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            className="w-full sm:w-80"
          />
          <Select
            value={filters.statut || ''}
            onChange={(value) => setFilters({ ...filters, statut: String(value) })}
            options={[
              { value: '', label: 'Tous les statuts' },
              { value: RepasStatus.PLANIFIE, label: 'Planifié' },
              { value: RepasStatus.EN_COURS, label: 'En cours' },
              { value: RepasStatus.TERMINE, label: 'Terminé' },
              { value: RepasStatus.ANNULE, label: 'Annulé' }
            ]}
            className="w-full sm:w-48"
          />
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Planifier Service
        </Button>
      </div>

      {/* Tableau des services */}
      <Card>
        <Card.Header>
          <Card.Title>Services de Repas ({repas?.length || 0})</Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <TableSkeleton rows={8} columns={8} />
          ) : (
            <Table
              data={repas || []}
              columns={columns}
              emptyMessage="Aucun service trouvé"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Terminer Service */}
      <Modal
        isOpen={isTerminerModalOpen}
        onClose={() => setIsTerminerModalOpen(false)}
        title="Terminer le Service"
        size="lg"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez renseigner les statistiques du service terminé.
          </p>

          <Input
            label="Nombre de rationnaires servis"
            type="number"
            placeholder="0"
            required
          />

          <Input
            label="Recettes totales (XOF)"
            type="number"
            placeholder="0"
            required
          />

          <Input
            label="Gaspillage estimé (kg)"
            type="number"
            placeholder="0"
          />

          <Input
            label="Observations"
            placeholder="Remarques sur le service"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsTerminerModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleTerminer({})}
            >
              Terminer le Service
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails du Service"
        size="lg"
      >
        {selectedRepas && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Restaurant</p>
                <p className="font-medium">{selectedRepas.restaurant?.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Menu</p>
                <p className="font-medium">{selectedRepas.menu?.titre}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Date</p>
                <p className="font-medium">{new Date(selectedRepas.dateService).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                <p className="font-medium">{getTypeRepasLabel(selectedRepas.typeRepas)}</p>
              </div>
            </div>

            {selectedRepas.statut === RepasStatus.TERMINE && (
              <>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Servis</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {selectedRepas.nombreServis} / {selectedRepas.nombreRationnaires}
                    </p>
                  </div>
                  <div className="bg-green-50 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Fréquentation</p>
                    <p className="text-2xl font-bold text-green-700">
                      {selectedRepas.tauxFrequentation}%
                    </p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Recettes</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {(selectedRepas.recettesTotales || 0).toLocaleString()} XOF
                    </p>
                  </div>
                </div>

                {selectedRepas.gaspillage !== undefined && (
                  <div className="bg-yellow-50 p-4 rounded">
                    <p className="text-sm text-gray-600 mb-1">Gaspillage</p>
                    <p className="text-xl font-bold text-yellow-700">{selectedRepas.gaspillage} kg</p>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default RepasTab;
