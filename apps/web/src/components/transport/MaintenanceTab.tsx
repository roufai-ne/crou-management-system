/**
 * FICHIER: apps/web/src/components/transport/MaintenanceTab.tsx
 * COMPOSANT: MaintenanceTab - Gestion de la maintenance des véhicules
 *
 * DESCRIPTION:
 * Gestion complète de la maintenance des véhicules
 * Maintenance préventive (kilométrage) et corrective (pannes)
 *
 * FONCTIONNALITÉS:
 * - Liste des maintenances avec filtres
 * - Ajout/Modification maintenance
 * - Planification maintenance préventive
 * - Enregistrement pannes/réparations
 * - Suivi des coûts
 * - Alertes maintenance due
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
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useTransportMaintenance, useTransportVehicles } from '@/hooks/useTransport';
import toast from 'react-hot-toast';

interface MaintenanceFormData {
  vehicleId: string;
  type: string;
  declencheur: string;
  datePrevue: string;
  description: string;
  cout: number;
  status: string;
}

export const MaintenanceTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<any | null>(null);
  const [formData, setFormData] = useState<MaintenanceFormData>({
    vehicleId: '',
    type: 'PREVENTIVE',
    declencheur: 'KILOMETRAGE',
    datePrevue: new Date().toISOString().split('T')[0],
    description: '',
    cout: 0,
    status: 'PLANIFIEE'
  });

  const {
    maintenanceRecords: maintenances,
    loading,
    filters,
    createMaintenanceRecord: createMaintenance,
    updateMaintenanceRecord: updateMaintenance,
    updateFilters,
    refresh
  } = useTransportMaintenance();

  const {
    vehicles,
    loading: vehiclesLoading
  } = useTransportVehicles();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = (vehicleId?: string, type?: string) => {
    setEditingMaintenance(null);
    setFormData({
      vehicleId: vehicleId || '',
      type: type || 'PREVENTIVE',
      declencheur: type === 'CORRECTIVE' ? 'PANNE' : 'KILOMETRAGE',
      datePrevue: new Date().toISOString().split('T')[0],
      description: '',
      cout: 0,
      status: 'PLANIFIEE'
    });
    setIsModalOpen(true);
  };

  /**
   * Ouvrir modal édition
   */
  const handleOpenEditModal = (maintenance: any) => {
    setEditingMaintenance(maintenance);
    setFormData({
      vehicleId: maintenance.vehicleId || '',
      type: maintenance.type || 'PREVENTIVE',
      declencheur: maintenance.declencheur || 'KILOMETRAGE',
      datePrevue: maintenance.datePrevue ? new Date(maintenance.datePrevue).toISOString().split('T')[0] : '',
      description: maintenance.description || '',
      cout: maintenance.cout || 0,
      status: maintenance.status || 'PLANIFIEE'
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder maintenance
   */
  const handleSave = async () => {
    // Validation
    if (!formData.vehicleId) {
      toast.error('Veuillez sélectionner un véhicule');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('La description est obligatoire');
      return;
    }

    try {
      if (editingMaintenance) {
        await updateMaintenance(editingMaintenance.id, formData);
        toast.success('Maintenance modifiée avec succès');
      } else {
        await createMaintenance(formData);
        toast.success('Maintenance créée avec succès');
      }
      setIsModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Démarrer maintenance
   */
  const handleStartMaintenance = async (maintenance: any) => {
    try {
      await updateMaintenance(maintenance.id, {
        ...maintenance,
        status: 'EN_COURS',
        dateDebut: new Date().toISOString()
      });
      toast.success('Maintenance démarrée');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  /**
   * Terminer maintenance
   */
  const handleCompleteMaintenance = async (maintenance: any) => {
    const confirmed = await confirm({
      title: 'Terminer cette maintenance ?',
      message: 'Confirmez la fin de cette maintenance',
      variant: 'primary',
      confirmText: 'Terminer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      await updateMaintenance(maintenance.id, {
        ...maintenance,
        status: 'TERMINEE',
        dateFin: new Date().toISOString()
      });
      toast.success('Maintenance terminée');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur');
    }
  };

  /**
   * Obtenir le badge de type
   */
  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'PREVENTIVE':
        return <Badge variant="success">Préventive</Badge>;
      case 'CORRECTIVE':
        return <Badge variant="warning">Corrective</Badge>;
      case 'URGENTE':
        return <Badge variant="danger">Urgente</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  /**
   * Obtenir le badge de statut
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANIFIEE':
        return <Badge variant="secondary">Planifiée</Badge>;
      case 'EN_COURS':
        return <Badge variant="warning">En Cours</Badge>;
      case 'TERMINEE':
        return <Badge variant="success">Terminée</Badge>;
      case 'ANNULEE':
        return <Badge variant="danger">Annulée</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'vehicule',
      label: 'Véhicule',
      render: (maintenance: any) => {
        const vehicle = vehicles?.find(v => v.id === maintenance.vehicleId);
        return vehicle ? (
          <div>
            <p className="font-medium">{vehicle.make} {vehicle.model}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.plateNumber}</p>
          </div>
        ) : (
          <p className="text-gray-400">N/A</p>
        );
      }
    },
    {
      key: 'type',
      label: 'Type',
      render: (maintenance: any) => (
        <div>
          {getTypeBadge(maintenance.type)}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {maintenance.declencheur || 'N/A'}
          </p>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Description',
      render: (maintenance: any) => (
        <div className="max-w-xs">
          <p className="text-sm truncate">{maintenance.description || 'N/A'}</p>
          {maintenance.kilometrageActuel && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Km: {maintenance.kilometrageActuel.toLocaleString()}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (maintenance: any) => (
        <div className="text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Prévue: {maintenance.datePrevue ? new Date(maintenance.datePrevue).toLocaleDateString() : 'N/A'}
          </p>
          {maintenance.dateDebut && (
            <p className="text-gray-600 dark:text-gray-400">
              Début: {new Date(maintenance.dateDebut).toLocaleDateString()}
            </p>
          )}
          {maintenance.dateFin && (
            <p className="text-gray-600 dark:text-gray-400">
              Fin: {new Date(maintenance.dateFin).toLocaleDateString()}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'cout',
      label: 'Coût',
      render: (maintenance: any) => (
        <div className="text-right">
          <p className="font-medium">{(maintenance.cout || 0).toLocaleString()} FCFA</p>
        </div>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (maintenance: any) => getStatusBadge(maintenance.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (maintenance: any) => (
        <div className="flex items-center gap-2">
          {maintenance.status === 'PLANIFIEE' && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={() => handleStartMaintenance(maintenance)}
            >
              Démarrer
            </Button>
          )}
          {maintenance.status === 'EN_COURS' && (
            <Button
              size="sm"
              variant="success"
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={() => handleCompleteMaintenance(maintenance)}
            >
              Terminer
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => handleOpenEditModal(maintenance)}
          >
            Modifier
          </Button>
        </div>
      )
    }
  ];

  // Calculer alertes
  const alertes = vehicles?.filter(v => {
    if (!v.kilometrageProchainEntretien || !v.kilometrageActuel) return false;
    const kmRestants = v.kilometrageProchainEntretien - v.kilometrageActuel;
    return kmRestants <= 500 && kmRestants >= 0;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Maintenances</p>
                <p className="text-2xl font-bold text-blue-600">{maintenances?.length || 0}</p>
              </div>
              <WrenchScrewdriverIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Planifiées</p>
                <p className="text-2xl font-bold text-orange-600">
                  {maintenances?.filter((m) => m.status === 'PLANIFIEE').length || 0}
                </p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Cours</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {maintenances?.filter((m) => m.status === 'EN_COURS').length || 0}
                </p>
              </div>
              <WrenchScrewdriverIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertes</p>
                <p className="text-2xl font-bold text-red-600">{alertes.length}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Alertes maintenance due */}
      {alertes.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <Card.Content className="p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-red-900 dark:text-red-200">
                  {alertes.length} véhicule(s) proche(s) de maintenance
                </h4>
                <div className="mt-3 space-y-2">
                  {alertes.map((v) => {
                    const kmRestants = v.kilometrageProchainEntretien! - v.kilometrageActuel!;
                    return (
                      <div key={v.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded">
                        <div>
                          <p className="font-medium text-sm">{v.make} {v.model} ({v.plateNumber})</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            Maintenance due dans {kmRestants} km
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleOpenCreateModal(v.id, 'PREVENTIVE')}
                        >
                          Planifier
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Select
            value={filters.type || 'all'}
            onChange={(value) => updateFilters({ type: value })}
            options={[
              { value: 'all', label: 'Tous les types' },
              { value: 'PREVENTIVE', label: 'Préventives' },
              { value: 'CORRECTIVE', label: 'Correctives' },
              { value: 'URGENTE', label: 'Urgentes' }
            ]}
            className="w-full md:w-48"
          />
          <Select
            value={filters.status || 'all'}
            onChange={(value) => updateFilters({ status: value })}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'PLANIFIEE', label: 'Planifiées' },
              { value: 'EN_COURS', label: 'En Cours' },
              { value: 'TERMINEE', label: 'Terminées' },
              { value: 'ANNULEE', label: 'Annulées' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={() => handleOpenCreateModal()} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouvelle Maintenance
        </Button>
      </div>

      {/* Tableau des maintenances */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-5 w-5" />
            Maintenances ({maintenances?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable
              data={maintenances || []}
              columns={columns}
              emptyMessage="Aucune maintenance trouvée"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMaintenance ? 'Modifier la Maintenance' : 'Nouvelle Maintenance'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Véhicule"
            value={formData.vehicleId}
            onChange={(value) => setFormData({ ...formData, vehicleId: value })}
            options={[
              { value: '', label: 'Sélectionner un véhicule' },
              ...(vehicles?.map(v => ({
                value: v.id,
                label: `${v.make} ${v.model} (${v.plateNumber}) - ${v.kilometrageActuel?.toLocaleString()} km`
              })) || [])
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={formData.type}
              onChange={(value) => setFormData({ ...formData, type: value })}
              options={[
                { value: 'PREVENTIVE', label: 'Préventive' },
                { value: 'CORRECTIVE', label: 'Corrective' },
                { value: 'URGENTE', label: 'Urgente' }
              ]}
              required
            />

            <Select
              label="Déclencheur"
              value={formData.declencheur}
              onChange={(value) => setFormData({ ...formData, declencheur: value })}
              options={[
                { value: 'KILOMETRAGE', label: 'Kilométrage' },
                { value: 'PANNE', label: 'Panne' },
                { value: 'AUTRE', label: 'Autre' }
              ]}
              required
            />
          </div>

          <Input
            label="Date Prévue"
            type="date"
            value={formData.datePrevue}
            onChange={(e) => setFormData({ ...formData, datePrevue: e.target.value })}
            required
          />

          <Input
            label="Description"
            placeholder="Ex: Vidange moteur + filtres"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
          />

          <Input
            label="Coût Estimé (FCFA)"
            type="number"
            min="0"
            placeholder="0"
            value={formData.cout}
            onChange={(e) => setFormData({ ...formData, cout: parseFloat(e.target.value) || 0 })}
          />

          {editingMaintenance && (
            <Select
              label="Statut"
              value={formData.status}
              onChange={(value) => setFormData({ ...formData, status: value })}
              options={[
                { value: 'PLANIFIEE', label: 'Planifiée' },
                { value: 'EN_COURS', label: 'En Cours' },
                { value: 'TERMINEE', label: 'Terminée' },
                { value: 'ANNULEE', label: 'Annulée' }
              ]}
            />
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingMaintenance ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default MaintenanceTab;
