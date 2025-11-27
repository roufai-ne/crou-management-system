/**
 * FICHIER: apps/web/src/components/housing/OccupationsTab.tsx
 * COMPOSANT: OccupationsTab - Gestion des occupations actives
 *
 * DESCRIPTION:
 * Gestion des occupations de chambres (HousingOccupancy)
 * Une occupation = un étudiant logé dans une chambre pour une période
 *
 * FONCTIONNALITÉS:
 * - Liste occupations actives/historique
 * - Création occupation manuelle
 * - Libération de chambre
 * - Suivi paiements loyers
 * - Historique par étudiant/chambre
 * - Alertes fins de contrat
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
  HomeIcon,
  UserIcon,
  CalendarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';

// Types
interface HousingOccupancy {
  id: string;
  studentId: string;
  student?: {
    firstName: string;
    lastName: string;
    email: string;
    studentNumber: string;
  };
  roomId: string;
  room?: {
    number: string;
    complex?: {
      name: string;
    };
    monthlyRent: number;
  };
  startDate: Date;
  endDate: Date;
  status: 'ACTIVE' | 'ENDED' | 'CANCELLED';
  monthlyRent: number;
  isRentPaid: boolean;
  lastRentPaymentDate?: Date;
  contractFile?: string;
  notes?: string;
}

interface CreateOccupancyData {
  studentId: string;
  roomId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  notes?: string;
}

export const OccupationsTab: React.FC = () => {
  const { user } = useAuth();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState<HousingOccupancy | null>(null);
  const [formData, setFormData] = useState<CreateOccupancyData>({
    studentId: '',
    roomId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +1 an
    monthlyRent: 0,
    notes: ''
  });

  // États de données (à remplacer par hooks réels)
  const [occupations, setOccupations] = useState<HousingOccupancy[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'ACTIVE',
    complex: 'all'
  });

  // Données mock (à remplacer par hooks)
  const [students] = useState([
    { id: '1', firstName: 'Amadou', lastName: 'Diallo', studentNumber: 'E2024001' },
    { id: '2', firstName: 'Fatima', lastName: 'Issoufou', studentNumber: 'E2024002' }
  ]);

  const [rooms] = useState([
    { id: '1', number: 'A-101', complex: { name: 'Cité A' }, monthlyRent: 15000 },
    { id: '2', number: 'A-102', complex: { name: 'Cité A' }, monthlyRent: 15000 },
    { id: '3', number: 'B-201', complex: { name: 'Cité B' }, monthlyRent: 12000 }
  ]);

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Obtenir badge de statut
   */
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      ACTIVE: { variant: 'success', label: 'Active' },
      ENDED: { variant: 'secondary', label: 'Terminée' },
      CANCELLED: { variant: 'danger', label: 'Annulée' }
    };
    const config = badges[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * Calculer jours restants avant fin contrat
   */
  const getDaysRemaining = (endDate: Date) => {
    const diff = new Date(endDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  /**
   * Ouvrir modal création
   */
  const handleOpenCreate = () => {
    setFormData({
      studentId: '',
      roomId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      monthlyRent: 0,
      notes: ''
    });
    setIsCreateModalOpen(true);
  };

  /**
   * Créer occupation
   */
  const handleCreate = async () => {
    if (!formData.studentId || !formData.roomId) {
      toast.error('Veuillez sélectionner un étudiant et une chambre');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Les dates sont obligatoires');
      return;
    }

    if (formData.monthlyRent <= 0) {
      toast.error('Le montant du loyer doit être supérieur à 0');
      return;
    }

    try {
      // TODO: Appel API
      toast.success('Occupation créée avec succès');
      setIsCreateModalOpen(false);
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création');
    }
  };

  /**
   * Libérer une chambre
   */
  const handleRelease = async (occupation: HousingOccupancy) => {
    const confirmed = await confirm({
      title: 'Libérer cette chambre ?',
      message: `Voulez-vous libérer la chambre ${occupation.room?.number} occupée par ${occupation.student?.firstName} ${occupation.student?.lastName} ?`,
      variant: 'warning',
      confirmText: 'Libérer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      // TODO: Appel API
      toast.success('Chambre libérée avec succès');
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la libération');
    }
  };

  /**
   * Ouvrir modal détails
   */
  const handleOpenDetails = (occupation: HousingOccupancy) => {
    setSelectedOccupation(occupation);
    setIsDetailModalOpen(true);
  };

  /**
   * Marquer loyer comme payé
   */
  const handleMarkRentPaid = async (occupation: HousingOccupancy) => {
    const confirmed = await confirm({
      title: 'Marquer loyer comme payé ?',
      message: `Confirmer le paiement du loyer pour ${occupation.student?.firstName} ${occupation.student?.lastName} ?`,
      variant: 'success',
      confirmText: 'Confirmer',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      // TODO: Appel API
      toast.success('Loyer marqué comme payé');
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'student',
      label: 'Étudiant',
      render: (occupation: HousingOccupancy) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">
              {occupation.student?.firstName} {occupation.student?.lastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {occupation.student?.studentNumber}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'room',
      label: 'Chambre',
      render: (occupation: HousingOccupancy) => (
        <div className="flex items-center gap-2">
          <HomeIcon className="h-5 w-5 text-gray-400" />
          <div>
            <p className="font-medium">{occupation.room?.number}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {occupation.room?.complex?.name}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'period',
      label: 'Période',
      render: (occupation: HousingOccupancy) => {
        const daysLeft = getDaysRemaining(occupation.endDate);
        const isExpiring = daysLeft <= 30 && daysLeft > 0;

        return (
          <div>
            <div className="flex items-center gap-1 text-sm">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span>{new Date(occupation.startDate).toLocaleDateString('fr-FR')}</span>
              <span className="text-gray-400">→</span>
              <span>{new Date(occupation.endDate).toLocaleDateString('fr-FR')}</span>
            </div>
            {occupation.status === 'ACTIVE' && (
              <p className={`text-xs mt-1 ${isExpiring ? 'text-orange-600 font-semibold' : 'text-gray-500'}`}>
                {isExpiring && <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />}
                {daysLeft > 0 ? `${daysLeft} jours restants` : 'Expiré'}
              </p>
            )}
          </div>
        );
      }
    },
    {
      key: 'rent',
      label: 'Loyer',
      render: (occupation: HousingOccupancy) => (
        <div>
          <p className="font-medium">{occupation.monthlyRent.toLocaleString()} FCFA</p>
          <div className="flex items-center gap-1 mt-1">
            {occupation.isRentPaid ? (
              <Badge variant="success" className="text-xs">
                <CheckCircleIcon className="h-3 w-3 inline mr-1" />
                Payé
              </Badge>
            ) : (
              <Badge variant="danger" className="text-xs">
                <XCircleIcon className="h-3 w-3 inline mr-1" />
                Impayé
              </Badge>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (occupation: HousingOccupancy) => getStatusBadge(occupation.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (occupation: HousingOccupancy) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<UserIcon className="h-4 w-4" />}
            onClick={() => handleOpenDetails(occupation)}
          >
            Détails
          </Button>

          {occupation.status === 'ACTIVE' && (
            <>
              {!occupation.isRentPaid && (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                  onClick={() => handleMarkRentPaid(occupation)}
                >
                  Loyer payé
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                leftIcon={<ArrowRightOnRectangleIcon className="h-4 w-4" />}
                className="text-orange-600 hover:text-orange-700"
                onClick={() => handleRelease(occupation)}
              >
                Libérer
              </Button>
            </>
          )}
        </div>
      )
    }
  ];

  // Statistiques
  const stats = {
    total: occupations.length,
    active: occupations.filter(o => o.status === 'ACTIVE').length,
    unpaid: occupations.filter(o => o.status === 'ACTIVE' && !o.isRentPaid).length,
    expiring: occupations.filter(o => {
      if (o.status !== 'ACTIVE') return false;
      const days = getDaysRemaining(o.endDate);
      return days <= 30 && days > 0;
    }).length
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Occupations</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <HomeIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Actives</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        <Card className={stats.unpaid > 0 ? 'border-red-200 bg-red-50 dark:bg-red-900/10' : ''}>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 dark:text-red-400">Loyers Impayés</p>
                <p className="text-2xl font-bold text-red-600">{stats.unpaid}</p>
              </div>
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
          </Card.Content>
        </Card>

        <Card className={stats.expiring > 0 ? 'border-orange-200 bg-orange-50 dark:bg-orange-900/10' : ''}>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 dark:text-orange-400">Fins Proches</p>
                <p className="text-2xl font-bold text-orange-600">{stats.expiring}</p>
              </div>
              <CalendarIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex gap-4 flex-1 w-full md:w-auto">
          <Input
            placeholder="Rechercher un étudiant..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="w-full md:flex-1"
          />
          <Select
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value })}
            options={[
              { value: 'ACTIVE', label: 'Actives' },
              { value: 'ENDED', label: 'Terminées' },
              { value: 'CANCELLED', label: 'Annulées' },
              { value: 'all', label: 'Tous les statuts' }
            ]}
            className="w-full md:w-48"
          />
        </div>
        <Button onClick={handleOpenCreate} leftIcon={<PlusIcon className="h-4 w-4" />}>
          Nouvelle Occupation
        </Button>
      </div>

      {/* Tableau des occupations */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <HomeIcon className="h-5 w-5" />
            Occupations ({occupations.length})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable
              data={occupations}
              columns={columns}
              emptyMessage="Aucune occupation trouvée"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Création */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Nouvelle Occupation"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Étudiant"
            value={formData.studentId}
            onChange={(value) => setFormData({ ...formData, studentId: value })}
            options={[
              { value: '', label: 'Sélectionner un étudiant' },
              ...students.map(s => ({
                value: s.id,
                label: `${s.firstName} ${s.lastName} (${s.studentNumber})`
              }))
            ]}
            required
          />

          <Select
            label="Chambre Disponible"
            value={formData.roomId}
            onChange={(value) => {
              const room = rooms.find(r => r.id === value);
              setFormData({
                ...formData,
                roomId: value,
                monthlyRent: room?.monthlyRent || 0
              });
            }}
            options={[
              { value: '', label: 'Sélectionner une chambre' },
              ...rooms.map(r => ({
                value: r.id,
                label: `${r.number} - ${r.complex.name} (${r.monthlyRent.toLocaleString()} FCFA/mois)`
              }))
            ]}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date Début"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              required
            />
            <Input
              label="Date Fin"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Loyer Mensuel (FCFA)"
            type="number"
            min="0"
            value={formData.monthlyRent}
            onChange={(e) => setFormData({ ...formData, monthlyRent: parseInt(e.target.value) || 0 })}
            required
          />

          <Textarea
            label="Notes (optionnel)"
            placeholder="Ex: Chambre adaptée handicap, étage bas..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={3}
          />

          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-400">
              L'étudiant sera notifié par email et devra récupérer ses clés au bureau du logement.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleCreate}>
              Créer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails de l'Occupation"
        size="lg"
      >
        {selectedOccupation && (
          <div className="space-y-6">
            {/* Étudiant */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Étudiant</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nom complet</p>
                  <p className="font-medium">
                    {selectedOccupation.student?.firstName} {selectedOccupation.student?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Matricule</p>
                  <p className="font-medium">{selectedOccupation.student?.studentNumber}</p>
                </div>
              </div>
            </div>

            {/* Chambre */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Chambre</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Numéro</p>
                  <p className="font-medium">{selectedOccupation.room?.number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Cité</p>
                  <p className="font-medium">{selectedOccupation.room?.complex?.name}</p>
                </div>
              </div>
            </div>

            {/* Période et Loyer */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Période & Loyer</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date début</p>
                  <p className="font-medium">
                    {new Date(selectedOccupation.startDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date fin</p>
                  <p className="font-medium">
                    {new Date(selectedOccupation.endDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Loyer mensuel</p>
                  <p className="font-medium">{selectedOccupation.monthlyRent.toLocaleString()} FCFA</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Statut paiement</p>
                  {selectedOccupation.isRentPaid ? (
                    <Badge variant="success">Payé</Badge>
                  ) : (
                    <Badge variant="danger">Impayé</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedOccupation.notes && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-400">
                  Notes
                </h3>
                <p className="text-sm">{selectedOccupation.notes}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
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

export default OccupationsTab;
