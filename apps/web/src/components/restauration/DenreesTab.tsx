/**
 * FICHIER: apps/web/src/components/restauration/DenreesTab.tsx
 * COMPOSANT: DenreesTab - Gestion des denrées alimentaires
 *
 * DESCRIPTION:
 * Gestion complète des denrées alimentaires (allocation, utilisation, pertes)
 * Intégration bidirectionnelle avec le module Stocks
 *
 * FONCTIONNALITÉS:
 * - Allocation de denrées depuis les stocks
 * - Utilisation des denrées
 * - Déclaration de pertes
 * - Retour de denrées non utilisées
 * - Alertes de denrées (stock bas, périmés)
 * - Historique des mouvements
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Card, Badge, Button, Table, Modal, Input, Select, DateInput, useConfirmDialog } from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { useDenrees, useDenreeAlerts } from '@/hooks/useRestauration';
import { StockDenree, AllocationStatus } from '@/services/api/restaurationService';
import { TableSkeleton } from './skeletons';
import toast from 'react-hot-toast';

export const DenreesTab: React.FC = () => {
  const [isAllouerModalOpen, setIsAllouerModalOpen] = useState(false);
  const [isPerteModalOpen, setIsPerteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedDenree, setSelectedDenree] = useState<StockDenree | null>(null);

  const {
    denrees,
    loading,
    error,
    filters,
    setFilters,
    allouerDenree,
    utiliserDenree,
    declarerPerte,
    retournerDenree,
    refresh
  } = useDenrees();

  const {
    alertesCritiques,
    alertesAvertissement,
    denreesPerimerSoon,
    loadAlerts
  } = useDenreeAlerts();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  const handleAllouer = async (data: any) => {
    try {
      await allouerDenree(data);
      setIsAllouerModalOpen(false);
      toast.success('Denrée allouée avec succès');
      refresh();
      loadAlerts();
    } catch (err) {
      console.error('Erreur allocation denrée:', err);
      toast.error('Erreur lors de l\'allocation de la denrée');
    }
  };

  const handleDeclarerPerte = async (data: any) => {
    if (!selectedDenree) return;
    try {
      await declarerPerte(selectedDenree.id, data);
      setIsPerteModalOpen(false);
      setSelectedDenree(null);
      toast.success('Perte déclarée avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur déclaration perte:', err);
      toast.error('Erreur lors de la déclaration de la perte');
    }
  };

  const handleRetour = async (denreeId: string, data: any) => {
    const confirmed = await confirm({
      title: 'Retourner cette denrée aux stocks ?',
      message: 'La denrée sera retirée des allocations et retournée dans le stock central.',
      variant: 'info',
      confirmText: 'Retourner',
      cancelText: 'Annuler',
    });

    if (!confirmed) return;

    try {
      await retournerDenree(denreeId, data);
      toast.success('Denrée retournée aux stocks avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur retour denrée:', err);
      toast.error('Erreur lors du retour de la denrée');
    }
  };

  const getStatutBadge = (statut: AllocationStatus) => {
    switch (statut) {
      case AllocationStatus.DISPONIBLE:
        return <Badge variant="success">Disponible</Badge>;
      case AllocationStatus.EN_COURS_UTILISATION:
        return <Badge variant="primary">En cours</Badge>;
      case AllocationStatus.UTILISE:
        return <Badge variant="secondary">Utilisé</Badge>;
      case AllocationStatus.PERTE:
        return <Badge variant="danger">Perte</Badge>;
      case AllocationStatus.RETOURNE:
        return <Badge variant="warning">Retourné</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const columns = [
    {
      key: 'denree',
      label: 'Denrée / Restaurant',
      render: (denree: StockDenree) => (
        <div>
          <p className="font-medium">{denree.nomDenree}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{denree.restaurant?.nom}</p>
        </div>
      )
    },
    {
      key: 'quantite',
      label: 'Quantité',
      render: (denree: StockDenree) => (
        <div className="text-right">
          <p className="font-medium">
            {denree.quantiteRestante} / {denree.quantiteAllouee} {denree.unite}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Utilisé: {denree.quantiteUtilisee || 0} {denree.unite}
          </p>
        </div>
      )
    },
    {
      key: 'dates',
      label: 'Allocation / Péremption',
      render: (denree: StockDenree) => (
        <div>
          <p className="font-medium">{new Date(denree.dateAllocation).toLocaleDateString()}</p>
          {denree.datePeremption && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Expire: {new Date(denree.datePeremption).toLocaleDateString()}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'cout',
      label: 'Coût',
      render: (denree: StockDenree) => (
        <div className="text-right">
          <p className="font-medium">{(denree.coutTotal || 0).toLocaleString()} XOF</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {(denree.coutUnitaire || 0).toLocaleString()} XOF/{denree.unite}
          </p>
        </div>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (denree: StockDenree) => getStatutBadge(denree.statut)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (denree: StockDenree) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => {
              setSelectedDenree(denree);
              setIsDetailModalOpen(true);
            }}
          >
            Voir
          </Button>
          {denree.statut === AllocationStatus.DISPONIBLE && (
            <>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ExclamationTriangleIcon className="h-4 w-4" />}
                className="text-red-600 hover:text-red-700"
                onClick={() => {
                  setSelectedDenree(denree);
                  setIsPerteModalOpen(true);
                }}
              >
                Perte
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ArrowUpIcon className="h-4 w-4" />}
                onClick={() => handleRetour(denree.id, {})}
              >
                Retour
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Alertes */}
      {(alertesCritiques?.length > 0 || alertesAvertissement?.length > 0 || denreesPerimerSoon?.length > 0) && (
        <Card>
          <Card.Header>
            <Card.Title className="flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="h-5 w-5" />
              Alertes Denrées ({(alertesCritiques?.length || 0) + (alertesAvertissement?.length || 0) + (denreesPerimerSoon?.length || 0)})
            </Card.Title>
          </Card.Header>
          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Critiques */}
              {alertesCritiques && alertesCritiques.length > 0 && (
                <div>
                  <h4 className="font-semibold text-red-700 mb-2">Stock Critique ({alertesCritiques.length})</h4>
                  <div className="space-y-2">
                    {alertesCritiques.slice(0, 3).map((alerte: any) => (
                      <div key={alerte.id} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                        <p className="font-medium">{alerte.nomDenree}</p>
                        <p className="text-red-600">{alerte.quantiteRestante} {alerte.unite} restant</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Avertissements */}
              {alertesAvertissement && alertesAvertissement.length > 0 && (
                <div>
                  <h4 className="font-semibold text-yellow-700 mb-2">Stock Bas ({alertesAvertissement.length})</h4>
                  <div className="space-y-2">
                    {alertesAvertissement.slice(0, 3).map((alerte: any) => (
                      <div key={alerte.id} className="bg-yellow-50 border border-yellow-200 rounded p-2 text-sm">
                        <p className="font-medium">{alerte.nomDenree}</p>
                        <p className="text-yellow-600">{alerte.quantiteRestante} {alerte.unite} restant</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Péremption proche */}
              {denreesPerimerSoon && denreesPerimerSoon.length > 0 && (
                <div>
                  <h4 className="font-semibold text-orange-700 mb-2">Péremption Proche ({denreesPerimerSoon.length})</h4>
                  <div className="space-y-2">
                    {denreesPerimerSoon.slice(0, 3).map((denree: any) => (
                      <div key={denree.id} className="bg-orange-50 border border-orange-200 rounded p-2 text-sm">
                        <p className="font-medium">{denree.nomDenree}</p>
                        <p className="text-orange-600">
                          Expire: {new Date(denree.datePeremption).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Rechercher une denrée..."
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
              { value: AllocationStatus.DISPONIBLE, label: 'Disponible' },
              { value: AllocationStatus.EN_COURS_UTILISATION, label: 'En cours' },
              { value: AllocationStatus.UTILISE, label: 'Utilisé' },
              { value: AllocationStatus.PERTE, label: 'Perte' },
              { value: AllocationStatus.RETOURNE, label: 'Retourné' }
            ]}
            className="w-full sm:w-48"
          />
        </div>
        <Button
          onClick={() => setIsAllouerModalOpen(true)}
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          Allouer Denrée
        </Button>
      </div>

      {/* Tableau des denrées */}
      <Card>
        <Card.Header>
          <Card.Title>Denrées Alimentaires ({denrees?.length || 0})</Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : (
            <Table
              data={denrees || []}
              columns={columns}
              emptyMessage="Aucune denrée trouvée"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Allocation */}
      <Modal
        isOpen={isAllouerModalOpen}
        onClose={() => setIsAllouerModalOpen(false)}
        title="Allouer une Denrée"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> L'allocation d'une denrée créera automatiquement un mouvement de sortie dans le module Stocks.
            </p>
          </div>

          <Select
            label="Restaurant"
            options={[
              { value: '1', label: 'Restaurant Universitaire Principal' },
              { value: '2', label: 'Cafétéria Campus A' }
            ]}
            required
          />

          <Select
            label="Denrée (depuis les stocks)"
            options={[
              { value: '1', label: 'Riz - 1000 kg disponible' },
              { value: '2', label: 'Huile - 500 L disponible' }
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Quantité à allouer"
              type="number"
              placeholder="0"
              required
            />
            <Input
              label="Unité"
              placeholder="Ex: kg, L"
              disabled
              value="kg"
            />
          </div>

          <DateInput
            label="Date de péremption"
            required
          />

          <Input
            label="Motif d'allocation"
            placeholder="Ex: Service déjeuner du 15/01/2025"
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsAllouerModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              leftIcon={<ArrowDownIcon className="h-4 w-4" />}
              onClick={() => handleAllouer({})}
            >
              Allouer la Denrée
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Perte */}
      <Modal
        isOpen={isPerteModalOpen}
        onClose={() => setIsPerteModalOpen(false)}
        title="Déclarer une Perte"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800">
              <strong>Attention:</strong> Cette action est irréversible. La denrée sera marquée comme perdue.
            </p>
          </div>

          {selectedDenree && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-400">Denrée:</p>
              <p className="font-medium">{selectedDenree.nomDenree}</p>
              <p className="text-sm text-gray-600 mt-2">Quantité disponible:</p>
              <p className="font-medium">{selectedDenree.quantiteRestante} {selectedDenree.unite}</p>
            </div>
          )}

          <Input
            label="Quantité perdue"
            type="number"
            placeholder="0"
            required
          />

          <Select
            label="Type de perte"
            options={[
              { value: 'peremption', label: 'Péremption' },
              { value: 'deterioration', label: 'Détérioration' },
              { value: 'casse', label: 'Casse' },
              { value: 'autre', label: 'Autre' }
            ]}
            required
          />

          <Input
            label="Motif de la perte"
            placeholder="Expliquez la raison de la perte"
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsPerteModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeclarerPerte({})}
            >
              Déclarer la Perte
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails de la Denrée"
        size="lg"
      >
        {selectedDenree && (
          <div className="space-y-6">
            {/* Informations générales */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Denrée</p>
                <p className="font-medium">{selectedDenree.nomDenree}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Restaurant</p>
                <p className="font-medium">{selectedDenree.restaurant?.nom}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                {getStatutBadge(selectedDenree.statut)}
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock ID</p>
                <p className="font-mono text-sm">{selectedDenree.stockId}</p>
              </div>
            </div>

            {/* Quantités */}
            <div>
              <h4 className="font-semibold mb-3">Quantités</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-3 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Allouée</p>
                  <p className="text-xl font-bold text-blue-700">
                    {selectedDenree.quantiteAllouee} {selectedDenree.unite}
                  </p>
                </div>
                <div className="bg-green-50 p-3 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Restante</p>
                  <p className="text-xl font-bold text-green-700">
                    {selectedDenree.quantiteRestante} {selectedDenree.unite}
                  </p>
                </div>
                <div className="bg-purple-50 p-3 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Utilisée</p>
                  <p className="text-xl font-bold text-purple-700">
                    {selectedDenree.quantiteUtilisee || 0} {selectedDenree.unite}
                  </p>
                </div>
              </div>
            </div>

            {/* Coûts */}
            <div>
              <h4 className="font-semibold mb-3">Coûts</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coût Unitaire</p>
                  <p className="text-xl font-bold">
                    {(selectedDenree.coutUnitaire || 0).toLocaleString()} XOF/{selectedDenree.unite}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Coût Total</p>
                  <p className="text-xl font-bold">
                    {(selectedDenree.coutTotal || 0).toLocaleString()} XOF
                  </p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div>
              <h4 className="font-semibold mb-3">Dates</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Allocation:</p>
                  <p className="font-medium">{new Date(selectedDenree.dateAllocation).toLocaleDateString()}</p>
                </div>
                {selectedDenree.datePeremption && (
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Péremption:</p>
                    <p className="font-medium">{new Date(selectedDenree.datePeremption).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Traçabilité Stocks */}
            {selectedDenree.mouvementStockCree && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-green-800">
                  <strong>Traçabilité:</strong> Mouvement de stock créé
                  {selectedDenree.stockMovementId && (
                    <span className="font-mono ml-2">({selectedDenree.stockMovementId})</span>
                  )}
                </p>
              </div>
            )}

            {/* Historique */}
            {selectedDenree.historiqueMouvements && selectedDenree.historiqueMouvements.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Historique des Mouvements</h4>
                <div className="space-y-2">
                  {selectedDenree.historiqueMouvements.map((mvt: any, index: number) => (
                    <div key={index} className="bg-gray-50 p-3 rounded text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{mvt.action}</p>
                          <p className="text-gray-600 dark:text-gray-400">{mvt.description}</p>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400">{new Date(mvt.date).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
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
            </div>
          </div>
        )}
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default DenreesTab;
