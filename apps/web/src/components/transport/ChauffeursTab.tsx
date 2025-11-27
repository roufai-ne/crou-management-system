/**
 * FICHIER: apps/web/src/components/transport/ChauffeursTab.tsx
 * COMPOSANT: ChauffeursTab - Gestion des chauffeurs
 *
 * DESCRIPTION:
 * Gestion des chauffeurs de transport
 * Suivi des permis, affectation véhicules, alertes
 *
 * FONCTIONNALITÉS:
 * - Liste des chauffeurs avec filtres
 * - Ajout/Modification/Suppression
 * - Affectation/Désaffectation véhicule
 * - Alertes (permis expiré, visite médicale)
 * - Statistiques par chauffeur
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
  UserIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { useTransportDrivers } from '@/hooks/useTransport';
import { useTransportVehicles } from '@/hooks/useTransport';
import toast from 'react-hot-toast';

interface ChauffeurFormData {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  licenseType: string;
  licenseIssueDate: string;
  licenseExpiryDate: string;
  status: string;
}

export const ChauffeursTab: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [editingChauffeur, setEditingChauffeur] = useState<any | null>(null);
  const [selectedChauffeur, setSelectedChauffeur] = useState<any | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');

  const [formData, setFormData] = useState<ChauffeurFormData>({
    employeeId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    licenseType: 'B',
    licenseIssueDate: '',
    licenseExpiryDate: '',
    status: 'ACTIF'
  });

  const {
    drivers: chauffeurs,
    loading,
    filters,
    createDriver: createChauffeur,
    updateDriver: updateChauffeur,
    deleteDriver: deleteChauffeur,
    updateFilters,
    refresh
  } = useTransportDrivers();

  const {
    vehicles,
    loading: vehiclesLoading
  } = useTransportVehicles();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = () => {
    setEditingChauffeur(null);
    setFormData({
      employeeId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      licenseType: 'B',
      licenseIssueDate: '',
      licenseExpiryDate: '',
      status: 'ACTIF'
    });
    setIsModalOpen(true);
  };

  /**
   * Ouvrir modal édition
   */
  const handleOpenEditModal = (chauffeur: any) => {
    setEditingChauffeur(chauffeur);
    setFormData({
      employeeId: chauffeur.employeeId || '',
      firstName: chauffeur.firstName || '',
      lastName: chauffeur.lastName || '',
      email: chauffeur.email || '',
      phone: chauffeur.phone || '',
      licenseNumber: chauffeur.licenseNumber || '',
      licenseType: chauffeur.licenseType || 'B',
      licenseIssueDate: chauffeur.licenseIssueDate ? new Date(chauffeur.licenseIssueDate).toISOString().split('T')[0] : '',
      licenseExpiryDate: chauffeur.licenseExpiryDate ? new Date(chauffeur.licenseExpiryDate).toISOString().split('T')[0] : '',
      status: chauffeur.status || 'ACTIF'
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder chauffeur
   */
  const handleSave = async () => {
    // Validation
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error('Nom et prénom sont obligatoires');
      return;
    }

    if (!formData.phone.trim()) {
      toast.error('Le téléphone est obligatoire');
      return;
    }

    if (!formData.licenseNumber.trim()) {
      toast.error('Le numéro de permis est obligatoire');
      return;
    }

    try {
      if (editingChauffeur) {
        await updateChauffeur(editingChauffeur.id, formData);
        toast.success('Chauffeur modifié avec succès');
      } else {
        await createChauffeur(formData);
        toast.success('Chauffeur créé avec succès');
      }
      setIsModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer chauffeur
   */
  const handleDelete = async (chauffeur: any) => {
    const confirmed = await confirm({
      title: 'Supprimer ce chauffeur ?',
      message: `Êtes-vous sûr de vouloir supprimer ${chauffeur.firstName} ${chauffeur.lastName} ?`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      await deleteChauffeur(chauffeur.id);
      toast.success('Chauffeur supprimé avec succès');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Ouvrir modal affectation véhicule
   */
  const handleOpenAssignModal = (chauffeur: any) => {
    setSelectedChauffeur(chauffeur);
    setSelectedVehicleId(chauffeur.assignedVehicleId || '');
    setIsAssignModalOpen(true);
  };

  /**
   * Affecter véhicule
   */
  const handleAssignVehicle = async () => {
    if (!selectedVehicleId) {
      toast.error('Veuillez sélectionner un véhicule');
      return;
    }

    try {
      // TODO: Appeler API d'affectation
      // await assignVehicleToDriver(selectedChauffeur.id, selectedVehicleId);

      // Pour l'instant, on update le chauffeur
      await updateChauffeur(selectedChauffeur.id, {
        assignedVehicleId: selectedVehicleId
      });

      toast.success('Véhicule affecté avec succès');
      setIsAssignModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'affectation');
    }
  };

  /**
   * Désaffecter véhicule
   */
  const handleUnassignVehicle = async (chauffeur: any) => {
    const confirmed = await confirm({
      title: 'Retirer l\'affectation ?',
      message: 'Êtes-vous sûr de vouloir retirer le véhicule affecté à ce chauffeur ?',
      variant: 'warning',
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      await updateChauffeur(chauffeur.id, {
        assignedVehicleId: null
      });
      toast.success('Véhicule retiré avec succès');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du retrait');
    }
  };

  /**
   * Vérifier si permis expiré ou proche expiration
   */
  const checkLicenseExpiry = (expiryDate: string) => {
    if (!expiryDate) return null;

    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntil = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntil < 0) {
      return { status: 'expired', message: 'Expiré', variant: 'danger' as const };
    } else if (daysUntil <= 30) {
      return { status: 'warning', message: `${daysUntil} jours`, variant: 'warning' as const };
    }
    return { status: 'valid', message: 'Valide', variant: 'success' as const };
  };

  /**
   * Obtenir le badge de statut
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIF':
        return <Badge variant="success">Actif</Badge>;
      case 'INACTIF':
        return <Badge variant="secondary">Inactif</Badge>;
      case 'SUSPENDU':
        return <Badge variant="danger">Suspendu</Badge>;
      case 'EN_CONGE':
        return <Badge variant="warning">En Congé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'chauffeur',
      label: 'Chauffeur',
      render: (chauffeur: any) => (
        <div>
          <p className="font-medium">{chauffeur.firstName} {chauffeur.lastName}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ID: {chauffeur.employeeId || 'N/A'}
          </p>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact',
      render: (chauffeur: any) => (
        <div className="text-sm">
          <p>{chauffeur.phone || 'N/A'}</p>
          {chauffeur.email && (
            <p className="text-gray-500 dark:text-gray-400">{chauffeur.email}</p>
          )}
        </div>
      )
    },
    {
      key: 'permis',
      label: 'Permis',
      render: (chauffeur: any) => {
        const licenseStatus = checkLicenseExpiry(chauffeur.licenseExpiryDate);
        return (
          <div>
            <p className="font-mono text-sm">{chauffeur.licenseNumber || 'N/A'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Type: {chauffeur.licenseType || 'N/A'}
            </p>
            {licenseStatus && (
              <Badge variant={licenseStatus.variant} className="mt-1">
                {licenseStatus.message}
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'vehicule',
      label: 'Véhicule Affecté',
      render: (chauffeur: any) => {
        const vehicle = vehicles?.find(v => v.id === chauffeur.assignedVehicleId);
        return vehicle ? (
          <div>
            <p className="font-medium">{vehicle.make} {vehicle.model}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{vehicle.plateNumber}</p>
          </div>
        ) : (
          <p className="text-gray-400">Aucun</p>
        );
      }
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (chauffeur: any) => getStatusBadge(chauffeur.status)
    },
    {
      key: 'statistiques',
      label: 'Statistiques',
      render: (chauffeur: any) => (
        <div className="text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            Trajets: <span className="font-medium">{chauffeur.totalTrips || 0}</span>
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            Km: <span className="font-medium">{chauffeur.totalKilometers?.toLocaleString() || 0}</span>
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (chauffeur: any) => (
        <div className="flex items-center gap-2">
          {chauffeur.assignedVehicleId ? (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<TruckIcon className="h-4 w-4" />}
              onClick={() => handleUnassignVehicle(chauffeur)}
              className="text-orange-600"
            >
              Retirer
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<TruckIcon className="h-4 w-4" />}
              onClick={() => handleOpenAssignModal(chauffeur)}
            >
              Affecter
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<PencilIcon className="h-4 w-4" />}
            onClick={() => handleOpenEditModal(chauffeur)}
          >
            Modifier
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<TrashIcon className="h-4 w-4" />}
            className="text-red-600 hover:text-red-700"
            onClick={() => handleDelete(chauffeur)}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  // Calculer les alertes
  const alertes = chauffeurs?.filter(c => {
    const licenseStatus = checkLicenseExpiry(c.licenseExpiryDate);
    return licenseStatus && (licenseStatus.status === 'expired' || licenseStatus.status === 'warning');
  }) || [];

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chauffeurs Totaux</p>
                <p className="text-2xl font-bold text-blue-600">{chauffeurs?.length || 0}</p>
              </div>
              <UserIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Chauffeurs Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {chauffeurs?.filter((c) => c.status === 'ACTIF').length || 0}
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Véhicules Affectés</p>
                <p className="text-2xl font-bold text-purple-600">
                  {chauffeurs?.filter((c) => c.assignedVehicleId).length || 0}
                </p>
              </div>
              <TruckIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Alertes Permis</p>
                <p className="text-2xl font-bold text-red-600">{alertes.length}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Alertes */}
      {alertes.length > 0 && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
          <Card.Content className="p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-200">
                  {alertes.length} permis expiré(s) ou proche(s) d'expiration
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-red-800 dark:text-red-300">
                  {alertes.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      • {c.firstName} {c.lastName} - {checkLicenseExpiry(c.licenseExpiryDate)?.message}
                    </li>
                  ))}
                  {alertes.length > 3 && (
                    <li className="font-medium">... et {alertes.length - 3} autre(s)</li>
                  )}
                </ul>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Input
            placeholder="Rechercher un chauffeur..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.status || 'all'}
            onChange={(value) => updateFilters({ status: value })}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'ACTIF', label: 'Actifs' },
              { value: 'INACTIF', label: 'Inactifs' },
              { value: 'SUSPENDU', label: 'Suspendus' },
              { value: 'EN_CONGE', label: 'En Congé' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={handleOpenCreateModal} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouveau Chauffeur
        </Button>
      </div>

      {/* Tableau des chauffeurs */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            Chauffeurs ({chauffeurs?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable data={chauffeurs || []} columns={columns} emptyMessage="Aucun chauffeur trouvé" />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingChauffeur ? 'Modifier le Chauffeur' : 'Nouveau Chauffeur'}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Prénom"
              placeholder="Ex: Moussa"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
            <Input
              label="Nom"
              placeholder="Ex: Ali"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>

          <Input
            label="ID Employé"
            placeholder="Ex: EMP-001"
            value={formData.employeeId}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Téléphone"
              placeholder="Ex: +227 90 12 34 56"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="Ex: moussa@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Numéro de Permis"
              placeholder="Ex: P123456"
              value={formData.licenseNumber}
              onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
              required
            />
            <Select
              label="Type de Permis"
              value={formData.licenseType}
              onChange={(value) => setFormData({ ...formData, licenseType: value })}
              options={[
                { value: 'A', label: 'A - Moto' },
                { value: 'B', label: 'B - Voiture' },
                { value: 'C', label: 'C - Poids lourds' },
                { value: 'D', label: 'D - Bus' },
                { value: 'E', label: 'E - Ensemble' }
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date d'émission"
              type="date"
              value={formData.licenseIssueDate}
              onChange={(e) => setFormData({ ...formData, licenseIssueDate: e.target.value })}
            />
            <Input
              label="Date d'expiration"
              type="date"
              value={formData.licenseExpiryDate}
              onChange={(e) => setFormData({ ...formData, licenseExpiryDate: e.target.value })}
              required
            />
          </div>

          <Select
            label="Statut"
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value })}
            options={[
              { value: 'ACTIF', label: 'Actif' },
              { value: 'INACTIF', label: 'Inactif' },
              { value: 'SUSPENDU', label: 'Suspendu' },
              { value: 'EN_CONGE', label: 'En Congé' }
            ]}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingChauffeur ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Affectation Véhicule */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Affecter un Véhicule"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Chauffeur: <strong>{selectedChauffeur?.firstName} {selectedChauffeur?.lastName}</strong>
            </p>
          </div>

          <Select
            label="Véhicule"
            value={selectedVehicleId}
            onChange={(value) => setSelectedVehicleId(value)}
            options={[
              { value: '', label: 'Sélectionner un véhicule' },
              ...(vehicles?.filter(v => v.status === 'ACTIF' && !v.assignedDriverId).map(v => ({
                value: v.id,
                label: `${v.make} ${v.model} (${v.plateNumber})`
              })) || [])
            ]}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAssignVehicle}>
              Affecter
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default ChauffeursTab;
