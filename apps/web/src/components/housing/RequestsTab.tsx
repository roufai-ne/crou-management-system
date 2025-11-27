/**
 * FICHIER: apps/web/src/components/housing/RequestsTab.tsx
 * COMPOSANT: RequestsTab - Gestion des demandes de logement
 *
 * DESCRIPTION:
 * Gestion administrative des demandes de logement des étudiants
 * Workflow complet : DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED → ASSIGNED → CONFIRMED
 *
 * FONCTIONNALITÉS:
 * - Liste demandes avec filtres et tri par priorité
 * - Workflow de traitement (Approuver/Rejeter)
 * - Attribution manuelle de chambres
 * - Gestion des priorités (HANDICAPE > RENOUVELLEMENT > BOURSIER > NORMAL)
 * - Timeline de suivi
 * - Alertes expiration
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
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  UserIcon,
  HomeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';

// Types
interface HousingRequest {
  id: string;
  studentId: string;
  student?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  anneeUniversitaire: string;
  type: 'NOUVELLE' | 'RENOUVELLEMENT' | 'MUTATION';
  typeChambresPreferees: string[];
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'ASSIGNED' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED';
  priority: 'NORMAL' | 'BOURSIER' | 'RENOUVELLEMENT' | 'HANDICAPE';
  priorityScore: number;
  dateSubmission?: Date;
  dateTraitement?: Date;
  dateAssignation?: Date;
  dateExpiration?: Date;
  roomAssignedId?: string;
  roomAssigned?: {
    number: string;
    complex?: {
      name: string;
    };
  };
  motifRejet?: string;
  commentaireGestionnaire?: string;
  isUrgent: boolean;
  documentsUploaded?: any;
  certificatScolariteFourni: boolean;
  pieceIdentiteFournie: boolean;
  photoFournie: boolean;
}

interface AssignRoomData {
  roomId: string;
  dateExpiration: string;
  commentaire?: string;
}

export const RequestsTab: React.FC = () => {
  const { user } = useAuth();
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HousingRequest | null>(null);
  const [assignData, setAssignData] = useState<AssignRoomData>({
    roomId: '',
    dateExpiration: '',
    commentaire: ''
  });
  const [rejectReason, setRejectReason] = useState('');

  // États de données (à remplacer par hooks réels)
  const [requests, setRequests] = useState<HousingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    priority: 'all',
    annee: '2024-2025'
  });

  // Chambres disponibles (mock - à remplacer par hook réel)
  const [availableRooms] = useState([
    { id: '1', number: 'A-101', complex: { name: 'Cité A' } },
    { id: '2', number: 'A-102', complex: { name: 'Cité A' } },
    { id: '3', number: 'B-201', complex: { name: 'Cité B' } }
  ]);

  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Obtenir badge de statut
   */
  const getStatusBadge = (status: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: 'secondary', label: 'Brouillon' },
      SUBMITTED: { variant: 'info', label: 'Soumise' },
      UNDER_REVIEW: { variant: 'warning', label: 'En examen' },
      APPROVED: { variant: 'success', label: 'Approuvée' },
      ASSIGNED: { variant: 'primary', label: 'Assignée' },
      CONFIRMED: { variant: 'success', label: 'Confirmée' },
      REJECTED: { variant: 'danger', label: 'Rejetée' },
      EXPIRED: { variant: 'danger', label: 'Expirée' },
      CANCELLED: { variant: 'secondary', label: 'Annulée' }
    };
    const config = badges[status] || { variant: 'secondary', label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * Obtenir badge de priorité
   */
  const getPriorityBadge = (priority: string) => {
    const badges: Record<string, { variant: any; label: string }> = {
      HANDICAPE: { variant: 'danger', label: 'Handicapé' },
      RENOUVELLEMENT: { variant: 'warning', label: 'Renouvellement' },
      BOURSIER: { variant: 'info', label: 'Boursier' },
      NORMAL: { variant: 'secondary', label: 'Normal' }
    };
    const config = badges[priority] || { variant: 'secondary', label: priority };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  /**
   * Ouvrir modal détails
   */
  const handleOpenDetails = (request: HousingRequest) => {
    setSelectedRequest(request);
    setIsDetailModalOpen(true);
  };

  /**
   * Approuver une demande
   */
  const handleApprove = async (request: HousingRequest) => {
    const confirmed = await confirm({
      title: 'Approuver cette demande ?',
      message: `Voulez-vous approuver la demande de ${request.student?.firstName} ${request.student?.lastName} ?`,
      variant: 'success',
      confirmText: 'Approuver',
      cancelText: 'Annuler'
    });

    if (!confirmed) return;

    try {
      // TODO: Appel API
      toast.success('Demande approuvée avec succès');
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'approbation');
    }
  };

  /**
   * Ouvrir modal rejet
   */
  const handleOpenReject = (request: HousingRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  /**
   * Rejeter une demande
   */
  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer le motif de rejet');
      return;
    }

    try {
      // TODO: Appel API
      toast.success('Demande rejetée');
      setIsRejectModalOpen(false);
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du rejet');
    }
  };

  /**
   * Ouvrir modal attribution
   */
  const handleOpenAssign = (request: HousingRequest) => {
    setSelectedRequest(request);
    setAssignData({
      roomId: '',
      dateExpiration: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +7 jours
      commentaire: ''
    });
    setIsAssignModalOpen(true);
  };

  /**
   * Assigner une chambre
   */
  const handleAssign = async () => {
    if (!assignData.roomId) {
      toast.error('Veuillez sélectionner une chambre');
      return;
    }

    try {
      // TODO: Appel API
      toast.success('Chambre assignée avec succès. L\'étudiant a été notifié.');
      setIsAssignModalOpen(false);
      // Refresh liste
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'attribution');
    }
  };

  /**
   * Vérifier si tous les documents sont fournis
   */
  const hasAllDocuments = (request: HousingRequest) => {
    return request.certificatScolariteFourni &&
           request.pieceIdentiteFournie &&
           request.photoFournie;
  };

  /**
   * Calculer jours restants pour confirmer
   */
  const getDaysToConfirm = (request: HousingRequest) => {
    if (request.status === 'ASSIGNED' && request.dateExpiration) {
      const diff = new Date(request.dateExpiration).getTime() - Date.now();
      return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return null;
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'student',
      label: 'Étudiant',
      render: (request: HousingRequest) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <UserIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium">
              {request.student?.firstName} {request.student?.lastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {request.student?.email}
            </p>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type & Priorité',
      render: (request: HousingRequest) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary">{request.type}</Badge>
            {request.isUrgent && (
              <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            {getPriorityBadge(request.priority)}
            <span className="text-xs text-gray-500">Score: {request.priorityScore}</span>
          </div>
        </div>
      )
    },
    {
      key: 'preferences',
      label: 'Préférences',
      render: (request: HousingRequest) => (
        <div className="text-sm">
          <p className="text-gray-700 dark:text-gray-300">
            {request.typeChambresPreferees.join(', ') || 'Non spécifié'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Année: {request.anneeUniversitaire}
          </p>
        </div>
      )
    },
    {
      key: 'documents',
      label: 'Documents',
      render: (request: HousingRequest) => {
        const hasAll = hasAllDocuments(request);
        return (
          <div className="flex items-center gap-1">
            {hasAll ? (
              <Badge variant="success" className="text-xs">
                <CheckCircleIcon className="h-3 w-3 inline mr-1" />
                Complet
              </Badge>
            ) : (
              <Badge variant="warning" className="text-xs">
                <ExclamationTriangleIcon className="h-3 w-3 inline mr-1" />
                Incomplet
              </Badge>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Statut',
      render: (request: HousingRequest) => {
        const daysLeft = getDaysToConfirm(request);
        return (
          <div className="space-y-1">
            {getStatusBadge(request.status)}
            {daysLeft !== null && daysLeft <= 3 && (
              <div className="text-xs text-red-600 font-semibold flex items-center gap-1">
                <ClockIcon className="h-3 w-3" />
                {daysLeft}j restant{daysLeft > 1 ? 's' : ''}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'room',
      label: 'Chambre',
      render: (request: HousingRequest) => {
        if (request.roomAssigned) {
          return (
            <div className="flex items-center gap-2">
              <HomeIcon className="h-4 w-4 text-green-600" />
              <div>
                <p className="font-medium text-sm">{request.roomAssigned.number}</p>
                <p className="text-xs text-gray-500">{request.roomAssigned.complex?.name}</p>
              </div>
            </div>
          );
        }
        return <span className="text-sm text-gray-400">Non assignée</span>;
      }
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (request: HousingRequest) => (
        <div className="text-xs">
          {request.dateSubmission && (
            <p className="text-gray-600 dark:text-gray-400">
              Soumis: {new Date(request.dateSubmission).toLocaleDateString('fr-FR')}
            </p>
          )}
          {request.dateAssignation && (
            <p className="text-gray-600 dark:text-gray-400">
              Assigné: {new Date(request.dateAssignation).toLocaleDateString('fr-FR')}
            </p>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (request: HousingRequest) => (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<EyeIcon className="h-4 w-4" />}
            onClick={() => handleOpenDetails(request)}
          >
            Détails
          </Button>

          {request.status === 'SUBMITTED' && (
            <>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                onClick={() => handleApprove(request)}
              >
                Approuver
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<XCircleIcon className="h-4 w-4" />}
                className="text-red-600 hover:text-red-700"
                onClick={() => handleOpenReject(request)}
              >
                Rejeter
              </Button>
            </>
          )}

          {(request.status === 'APPROVED' || request.status === 'UNDER_REVIEW') && hasAllDocuments(request) && (
            <Button
              size="sm"
              variant="primary"
              leftIcon={<HomeIcon className="h-4 w-4" />}
              onClick={() => handleOpenAssign(request)}
            >
              Assigner
            </Button>
          )}
        </div>
      )
    }
  ];

  // Statistiques
  const stats = {
    total: requests.length,
    pending: requests.filter(r => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length,
    assigned: requests.filter(r => r.status === 'ASSIGNED').length,
    confirmed: requests.filter(r => r.status === 'CONFIRMED').length,
    expired: requests.filter(r => r.status === 'ASSIGNED' && getDaysToConfirm(r) !== null && getDaysToConfirm(r)! <= 3).length
  };

  return (
    <div className="space-y-6">
      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Demandes</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">En Attente</p>
                <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-orange-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Assignées</p>
                <p className="text-2xl font-bold text-indigo-600">{stats.assigned}</p>
              </div>
              <HomeIcon className="h-8 w-8 text-indigo-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Confirmées</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        {stats.expired > 0 && (
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/10">
            <Card.Content className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-400">Alertes Expiration</p>
                  <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
                </div>
                <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
              </div>
            </Card.Content>
          </Card>
        )}
      </div>

      {/* Filtres */}
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
              { value: 'all', label: 'Tous les statuts' },
              { value: 'SUBMITTED', label: 'Soumises' },
              { value: 'UNDER_REVIEW', label: 'En examen' },
              { value: 'APPROVED', label: 'Approuvées' },
              { value: 'ASSIGNED', label: 'Assignées' },
              { value: 'CONFIRMED', label: 'Confirmées' }
            ]}
            className="w-full md:w-48"
          />
          <Select
            value={filters.priority}
            onChange={(value) => setFilters({ ...filters, priority: value })}
            options={[
              { value: 'all', label: 'Toutes priorités' },
              { value: 'HANDICAPE', label: 'Handicapé' },
              { value: 'RENOUVELLEMENT', label: 'Renouvellement' },
              { value: 'BOURSIER', label: 'Boursier' },
              { value: 'NORMAL', label: 'Normal' }
            ]}
            className="w-full md:w-48"
          />
        </div>
      </div>

      {/* Tableau des demandes */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <DocumentTextIcon className="h-5 w-5" />
            Demandes de Logement ({requests.length})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable
              data={requests}
              columns={columns}
              emptyMessage="Aucune demande trouvée"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Détails */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title="Détails de la Demande"
        size="xl"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Informations étudiant */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Informations Étudiant</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nom complet</p>
                  <p className="font-medium">
                    {selectedRequest.student?.firstName} {selectedRequest.student?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="font-medium">{selectedRequest.student?.email}</p>
                </div>
              </div>
            </div>

            {/* Détails demande */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Détails de la Demande</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Type</p>
                  <p className="font-medium">{selectedRequest.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Priorité</p>
                  <div className="flex items-center gap-2">
                    {getPriorityBadge(selectedRequest.priority)}
                    <span className="text-sm">Score: {selectedRequest.priorityScore}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Année universitaire</p>
                  <p className="font-medium">{selectedRequest.anneeUniversitaire}</p>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Documents Fournis</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {selectedRequest.certificatScolariteFourni ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span>Certificat de scolarité</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequest.pieceIdentiteFournie ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span>Pièce d'identité</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedRequest.photoFournie ? (
                    <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircleIcon className="h-5 w-5 text-red-600" />
                  )}
                  <span>Photo d'identité</span>
                </div>
              </div>
            </div>

            {/* Chambre assignée */}
            {selectedRequest.roomAssigned && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-lg mb-2 text-green-900 dark:text-green-400">
                  Chambre Assignée
                </h3>
                <p className="font-medium">
                  {selectedRequest.roomAssigned.number} - {selectedRequest.roomAssigned.complex?.name}
                </p>
                {selectedRequest.dateExpiration && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-2">
                    Date limite de confirmation: {new Date(selectedRequest.dateExpiration).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            )}

            {/* Commentaire gestionnaire */}
            {selectedRequest.commentaireGestionnaire && (
              <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2 text-blue-900 dark:text-blue-400">
                  Commentaire du gestionnaire
                </h3>
                <p className="text-sm">{selectedRequest.commentaireGestionnaire}</p>
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

      {/* Modal Attribution */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assigner une Chambre"
        size="lg"
      >
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 dark:text-blue-400">
              Étudiant: <strong>{selectedRequest?.student?.firstName} {selectedRequest?.student?.lastName}</strong>
            </p>
          </div>

          <Select
            label="Chambre Disponible"
            value={assignData.roomId}
            onChange={(value) => setAssignData({ ...assignData, roomId: value })}
            options={[
              { value: '', label: 'Sélectionner une chambre' },
              ...availableRooms.map(room => ({
                value: room.id,
                label: `${room.number} - ${room.complex.name}`
              }))
            ]}
            required
          />

          <Input
            label="Date Limite de Confirmation"
            type="date"
            value={assignData.dateExpiration}
            onChange={(e) => setAssignData({ ...assignData, dateExpiration: e.target.value })}
            required
          />

          <Textarea
            label="Commentaire (optionnel)"
            placeholder="Ex: Chambre au rez-de-chaussée comme demandé..."
            value={assignData.commentaire}
            onChange={(e) => setAssignData({ ...assignData, commentaire: e.target.value })}
            rows={3}
          />

          <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900 dark:text-yellow-400">
              L'étudiant recevra une notification par email et devra confirmer son acceptation avant la date limite.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsAssignModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="primary" onClick={handleAssign}>
              Assigner
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Rejet */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Rejeter la Demande"
        size="md"
      >
        <div className="space-y-4">
          <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-900 dark:text-red-400">
              Vous êtes sur le point de rejeter la demande de{' '}
              <strong>{selectedRequest?.student?.firstName} {selectedRequest?.student?.lastName}</strong>.
            </p>
          </div>

          <Textarea
            label="Motif de Rejet"
            placeholder="Ex: Documents incomplets, critères d'éligibilité non respectés..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleReject}>
              Rejeter
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default RequestsTab;
