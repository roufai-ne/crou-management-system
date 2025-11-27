/**
 * FICHIER: apps/web/src/components/transport/TrajetsTab.tsx
 * COMPOSANT: TrajetsTab - Gestion des trajets/rotations de transport
 *
 * DESCRIPTION:
 * Gestion opérationnelle des trajets (rotations quotidiennes)
 * Un trajet = un départ sur un circuit avec véhicule + chauffeur + horaire
 *
 * FONCTIONNALITÉS:
 * - Planification des trajets quotidiens
 * - Scan des tickets à l'embarquement
 * - Suivi en temps réel (PLANIFIE → EN_COURS → TERMINE)
 * - Calcul kilométrage et mise à jour véhicule
 * - Comptage passagers
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
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  QrCodeIcon,
  ClockIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { useTransportTrips } from '@/hooks/useTransport';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';

interface TrajetFormData {
  circuitId: string;
  vehiculeId: string;
  chauffeurId: string;
  dateDepart: string;
  heureDepart: string;
  heureRetourPrevue: string;
  status: 'PLANIFIE' | 'EN_COURS' | 'TERMINE' | 'ANNULE';
}

interface ScanTicketData {
  codeTicket: string;
  studentName?: string;
}

export const TrajetsTab: React.FC = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [editingTrajet, setEditingTrajet] = useState<any | null>(null);
  const [selectedTrajet, setSelectedTrajet] = useState<any | null>(null);
  const [formData, setFormData] = useState<TrajetFormData>({
    circuitId: '',
    vehiculeId: '',
    chauffeurId: '',
    dateDepart: new Date().toISOString().split('T')[0],
    heureDepart: '07:00',
    heureRetourPrevue: '08:00',
    status: 'PLANIFIE'
  });

  const [scanData, setScanData] = useState<ScanTicketData>({
    codeTicket: '',
    studentName: ''
  });

  const {
    scheduledTrips: trajets,
    loading,
    filters,
    createScheduledTrip: createTrajet,
    updateScheduledTrip: updateTrajet,
    deleteScheduledTrip: deleteTrajet,
    updateFilters,
    refresh
  } = useTransportTrips();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  // TODO: Ces données devraient venir du backend via hooks dédiés
  const [circuits] = useState([
    { id: '1', name: 'Axe Plateau', distance: 18 },
    { id: '2', name: 'Axe Terminus', distance: 14 },
    { id: '3', name: 'Axe Lamordé', distance: 22 }
  ]);

  const [vehicules] = useState([
    { id: '1', plateNumber: 'NE-2024-AB-123', status: 'active' },
    { id: '2', plateNumber: 'NE-2024-AB-456', status: 'active' },
    { id: '3', plateNumber: 'NE-2024-AB-789', status: 'maintenance' }
  ]);

  const [chauffeurs] = useState([
    { id: '1', name: 'Moussa Amadou', status: 'active' },
    { id: '2', name: 'Fatima Issoufou', status: 'active' },
    { id: '3', name: 'Ibrahim Sani', status: 'inactive' }
  ]);

  /**
   * Ouvrir modal création
   */
  const handleOpenCreateModal = () => {
    setEditingTrajet(null);
    setFormData({
      circuitId: '',
      vehiculeId: '',
      chauffeurId: '',
      dateDepart: new Date().toISOString().split('T')[0],
      heureDepart: '07:00',
      heureRetourPrevue: '08:00',
      status: 'PLANIFIE'
    });
    setIsModalOpen(true);
  };

  /**
   * Ouvrir modal édition
   */
  const handleOpenEditModal = (trajet: any) => {
    setEditingTrajet(trajet);
    setFormData({
      circuitId: trajet.circuitId || '',
      vehiculeId: trajet.vehiculeId || '',
      chauffeurId: trajet.chauffeurId || '',
      dateDepart: trajet.dateDepart?.split('T')[0] || new Date().toISOString().split('T')[0],
      heureDepart: trajet.heureDepart || '07:00',
      heureRetourPrevue: trajet.heureRetourPrevue || '08:00',
      status: trajet.status || 'PLANIFIE'
    });
    setIsModalOpen(true);
  };

  /**
   * Sauvegarder trajet
   */
  const handleSave = async () => {
    // Validation
    if (!formData.circuitId || !formData.vehiculeId || !formData.chauffeurId) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      if (editingTrajet) {
        await updateTrajet(editingTrajet.id, formData);
        toast.success('Trajet modifié avec succès');
      } else {
        await createTrajet(formData);
        toast.success('Trajet créé avec succès');
      }
      setIsModalOpen(false);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  /**
   * Supprimer trajet
   */
  const handleDelete = async (trajet: any) => {
    const confirmed = await confirm({
      title: 'Supprimer ce trajet ?',
      message: `Êtes-vous sûr de vouloir supprimer ce trajet ?`,
      variant: 'danger',
      confirmText: 'Supprimer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      await deleteTrajet(trajet.id);
      toast.success('Trajet supprimé avec succès');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la suppression');
    }
  };

  /**
   * Démarrer un trajet
   */
  const handleStartTrajet = async (trajet: any) => {
    if (trajet.status !== 'PLANIFIE') {
      toast.error('Ce trajet ne peut pas être démarré');
      return;
    }

    const confirmed = await confirm({
      title: 'Démarrer le trajet ?',
      message: 'Le trajet va passer en statut EN_COURS. Confirmez-vous ?',
      variant: 'info',
      confirmText: 'Démarrer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      await updateTrajet(trajet.id, {
        ...trajet,
        status: 'EN_COURS',
        heureDepart: new Date().toTimeString().slice(0, 5)
      });
      toast.success('Trajet démarré');
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du démarrage');
    }
  };

  /**
   * Terminer un trajet
   */
  const handleFinishTrajet = async (trajet: any) => {
    if (trajet.status !== 'EN_COURS') {
      toast.error('Ce trajet ne peut pas être terminé');
      return;
    }

    const confirmed = await confirm({
      title: 'Terminer le trajet ?',
      message: 'Le trajet va passer en statut TERMINE. Le kilométrage du véhicule sera mis à jour. Confirmez-vous ?',
      variant: 'info',
      confirmText: 'Terminer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      // Calculer le kilométrage du circuit
      const circuit = circuits.find(c => c.id === trajet.circuitId);
      const kmParcourus = circuit?.distance || 0;

      await updateTrajet(trajet.id, {
        ...trajet,
        status: 'TERMINE',
        heureRetourEffective: new Date().toTimeString().slice(0, 5),
        kmParcourus
      });

      toast.success(`Trajet terminé. ${kmParcourus} km ajoutés au véhicule.`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la finalisation');
    }
  };

  /**
   * Ouvrir modal scan ticket
   */
  const handleOpenScanModal = (trajet: any) => {
    if (trajet.status !== 'EN_COURS') {
      toast.error('Le trajet doit être EN_COURS pour scanner des tickets');
      return;
    }
    setSelectedTrajet(trajet);
    setScanData({ codeTicket: '', studentName: '' });
    setIsScanModalOpen(true);
  };

  /**
   * Scanner un ticket
   */
  const handleScanTicket = async () => {
    if (!scanData.codeTicket.trim()) {
      toast.error('Veuillez saisir ou scanner un code ticket');
      return;
    }

    try {
      // TODO: Appel API pour valider et utiliser le ticket
      // Simulé pour l'instant
      toast.success(`Ticket ${scanData.codeTicket} scanné avec succès`);

      // Incrémenter le compteur de passagers du trajet
      if (selectedTrajet) {
        await updateTrajet(selectedTrajet.id, {
          ...selectedTrajet,
          passengersCount: (selectedTrajet.passengersCount || 0) + 1
        });
      }

      // Reset et continuer le scan
      setScanData({ codeTicket: '', studentName: '' });
      refresh();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du scan du ticket');
    }
  };

  /**
   * Obtenir badge de statut
   */
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLANIFIE':
        return <Badge variant="info">Planifié</Badge>;
      case 'EN_COURS':
        return <Badge variant="warning">En cours</Badge>;
      case 'TERMINE':
        return <Badge variant="success">Terminé</Badge>;
      case 'ANNULE':
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'date',
      label: 'Date & Heure',
      render: (trajet: any) => (
        <div>
          <p className="font-medium">
            {trajet.dateDepart ? new Date(trajet.dateDepart).toLocaleDateString('fr-FR') : 'N/A'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Départ: {trajet.heureDepart || 'N/A'}
          </p>
        </div>
      )
    },
    {
      key: 'circuit',
      label: 'Circuit',
      render: (trajet: any) => {
        const circuit = circuits.find(c => c.id === trajet.circuitId);
        return (
          <div>
            <p className="font-medium">{circuit?.name || 'Circuit inconnu'}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {circuit?.distance || 0} km A/R
            </p>
          </div>
        );
      }
    },
    {
      key: 'vehicule',
      label: 'Véhicule',
      render: (trajet: any) => {
        const vehicule = vehicules.find(v => v.id === trajet.vehiculeId);
        return (
          <div className="flex items-center gap-2">
            <TruckIcon className="h-5 w-5 text-gray-400" />
            <span className="font-mono text-sm">{vehicule?.plateNumber || 'N/A'}</span>
          </div>
        );
      }
    },
    {
      key: 'chauffeur',
      label: 'Chauffeur',
      render: (trajet: any) => {
        const chauffeur = chauffeurs.find(c => c.id === trajet.chauffeurId);
        return <span className="font-medium">{chauffeur?.name || 'Non assigné'}</span>;
      }
    },
    {
      key: 'passagers',
      label: 'Passagers',
      render: (trajet: any) => (
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-600">{trajet.passengersCount || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">embarqués</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (trajet: any) => getStatusBadge(trajet.status || 'PLANIFIE')
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (trajet: any) => (
        <div className="flex items-center gap-2 flex-wrap">
          {trajet.status === 'PLANIFIE' && (
            <Button
              size="sm"
              variant="outline"
              leftIcon={<PlayIcon className="h-4 w-4" />}
              onClick={() => handleStartTrajet(trajet)}
            >
              Démarrer
            </Button>
          )}

          {trajet.status === 'EN_COURS' && (
            <>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<QrCodeIcon className="h-4 w-4" />}
                onClick={() => handleOpenScanModal(trajet)}
              >
                Scanner
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<StopIcon className="h-4 w-4" />}
                onClick={() => handleFinishTrajet(trajet)}
              >
                Terminer
              </Button>
            </>
          )}

          {trajet.status === 'PLANIFIE' && (
            <>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<PencilIcon className="h-4 w-4" />}
                onClick={() => handleOpenEditModal(trajet)}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<TrashIcon className="h-4 w-4" />}
                className="text-red-600 hover:text-red-700"
                onClick={() => handleDelete(trajet)}
              >
                Supprimer
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  // Statistiques
  const stats = {
    total: trajets?.length || 0,
    planifies: trajets?.filter(t => t.status === 'PLANIFIE').length || 0,
    enCours: trajets?.filter(t => t.status === 'EN_COURS').length || 0,
    termines: trajets?.filter(t => t.status === 'TERMINE').length || 0
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Trajets</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Planifiés</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.planifies}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-indigo-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Cours</p>
                <p className="text-2xl font-bold text-orange-600">{stats.enCours}</p>
              </div>
              <PlayIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Terminés</p>
                <p className="text-2xl font-bold text-green-600">{stats.termines}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Input
            placeholder="Rechercher un trajet..."
            value={filters.search || ''}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.status || 'all'}
            onChange={(value) => updateFilters({ status: value })}
            options={[
              { value: 'all', label: 'Tous les statuts' },
              { value: 'PLANIFIE', label: 'Planifiés' },
              { value: 'EN_COURS', label: 'En cours' },
              { value: 'TERMINE', label: 'Terminés' },
              { value: 'ANNULE', label: 'Annulés' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={handleOpenCreateModal} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouveau Trajet
        </Button>
      </div>

      {/* Tableau des trajets */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <ClockIcon className="h-5 w-5" />
            Trajets / Rotations ({trajets?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable data={trajets || []} columns={columns} emptyMessage="Aucun trajet trouvé" />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création/Édition Trajet */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrajet ? 'Modifier le Trajet' : 'Nouveau Trajet'}
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Circuit"
            value={formData.circuitId}
            onChange={(value) => setFormData({ ...formData, circuitId: value })}
            options={[
              { value: '', label: 'Sélectionner un circuit' },
              ...circuits.map(c => ({ value: c.id, label: `${c.name} (${c.distance} km)` }))
            ]}
            required
          />

          <Select
            label="Véhicule"
            value={formData.vehiculeId}
            onChange={(value) => setFormData({ ...formData, vehiculeId: value })}
            options={[
              { value: '', label: 'Sélectionner un véhicule' },
              ...vehicules
                .filter(v => v.status === 'active')
                .map(v => ({ value: v.id, label: v.plateNumber }))
            ]}
            required
          />

          <Select
            label="Chauffeur"
            value={formData.chauffeurId}
            onChange={(value) => setFormData({ ...formData, chauffeurId: value })}
            options={[
              { value: '', label: 'Sélectionner un chauffeur' },
              ...chauffeurs
                .filter(c => c.status === 'active')
                .map(c => ({ value: c.id, label: c.name }))
            ]}
            required
          />

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Date"
              type="date"
              value={formData.dateDepart}
              onChange={(e) => setFormData({ ...formData, dateDepart: e.target.value })}
              required
            />

            <Input
              label="Heure Départ"
              type="time"
              value={formData.heureDepart}
              onChange={(e) => setFormData({ ...formData, heureDepart: e.target.value })}
              required
            />

            <Input
              label="Retour Prévu"
              type="time"
              value={formData.heureRetourPrevue}
              onChange={(e) => setFormData({ ...formData, heureRetourPrevue: e.target.value })}
              required
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Le trajet sera créé avec le statut <strong>PLANIFIE</strong>.
              Vous pourrez le démarrer depuis la liste des trajets.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleSave}>
              {editingTrajet ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Scan Ticket */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Scanner un Ticket"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-900 font-medium">
              Trajet en cours: {circuits.find(c => c.id === selectedTrajet?.circuitId)?.name}
            </p>
            <p className="text-xs text-orange-700 mt-1">
              Passagers embarqués: <strong>{selectedTrajet?.passengersCount || 0}</strong>
            </p>
          </div>

          <Input
            label="Code Ticket"
            placeholder="Scannez ou saisissez le code"
            value={scanData.codeTicket}
            onChange={(e) => setScanData({ ...scanData, codeTicket: e.target.value })}
            autoFocus
            leftIcon={<QrCodeIcon className="h-5 w-5" />}
          />

          {scanData.studentName && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-900">
                Étudiant: <strong>{scanData.studentName}</strong>
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsScanModalOpen(false)}>
              Fermer
            </Button>
            <Button variant="primary" onClick={handleScanTicket} leftIcon={<QrCodeIcon className="h-4 w-4" />}>
              Valider Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default TrajetsTab;
