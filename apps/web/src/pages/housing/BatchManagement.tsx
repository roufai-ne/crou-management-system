/**
 * FICHIER: apps/web/src/pages/housing/BatchManagement.tsx
 * PAGE: BatchManagement - Gestion des campagnes d'attribution logement
 *
 * DESCRIPTION:
 * Page d'administration pour gérer les campagnes d'attribution de logements
 * Interface complète pour créer, ouvrir, fermer et traiter les campagnes
 * Suivi temps réel de la progression des assignations
 *
 * FONCTIONNALITÉS:
 * - CRUD campagnes (création, modification, suppression)
 * - Transitions statuts (DRAFT → OPEN → CLOSED → PROCESSING → COMPLETED)
 * - Lancement assignation masse avec progression temps réel
 * - Rapport détaillé succès/échecs
 * - Filtres avancés (année, type, statut)
 * - Export résultats
 *
 * PERMISSIONS REQUISES:
 * - housing:batches:create - Créer campagne
 * - housing:batches:manage - Gérer statuts
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  DataTable,
  TableColumn,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  DateInput,
  Switch,
  Progress,
  Alert,
  ConfirmModal,
  useConfirmDialog
} from '@/components/ui';
import {
  PlusIcon,
  PlayIcon,
  StopIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrashIcon,
  PencilIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { housingBatchService, ApplicationBatch, CreateBatchRequest, BatchStatistics, BatchAssignmentReport } from '@/services/api/housingBatchService';
import { useAuth } from '@/stores/auth';

export const BatchManagement: React.FC = () => {
  const { user } = useAuth();
  const { confirm } = useConfirmDialog();

  // États
  const [batches, setBatches] = useState<ApplicationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  // Pagination et filtres
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    academicYear: '',
    search: ''
  });

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Données modals
  const [selectedBatch, setSelectedBatch] = useState<ApplicationBatch | null>(null);
  const [formData, setFormData] = useState<Partial<CreateBatchRequest>>({
    name: '',
    type: 'NEW_ASSIGNMENT_CAMPAIGN',
    academicYear: new Date().getFullYear().toString(),
    startDate: '',
    endDate: '',
    allowOnlineSubmission: true,
    description: ''
  });
  const [processingStats, setProcessingStats] = useState<BatchStatistics | null>(null);
  const [assignmentReport, setAssignmentReport] = useState<BatchAssignmentReport | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Charger campagnes
  const loadBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await housingBatchService.getBatches({
        page,
        limit,
        ...filters
      });
      setBatches(result.data);
      setTotal(result.total);
      setPages(result.pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur chargement campagnes');
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    loadBatches();
  }, [loadBatches]);

  // Polling statistiques progression
  const startPollingStats = (batchId: string) => {
    const interval = setInterval(async () => {
      try {
        const result = await housingBatchService.getBatchStatistics(batchId);
        setProcessingStats(result.data);

        // Arrêter polling si terminé
        if (result.data.progressPercentage >= 100) {
          stopPollingStats();
          // Recharger campagnes
          await loadBatches();
        }
      } catch (err) {
        console.error('Erreur polling stats:', err);
      }
    }, 2000); // Toutes les 2 secondes

    setPollingInterval(interval);
  };

  const stopPollingStats = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  // Cleanup polling
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Créer campagne
  const handleCreateBatch = async () => {
    try {
      if (!formData.name || !formData.startDate || !formData.endDate) {
        alert('Veuillez remplir tous les champs obligatoires');
        return;
      }

      await housingBatchService.createBatch(formData as CreateBatchRequest);
      setIsCreateModalOpen(false);
      resetFormData();
      await loadBatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur création campagne');
    }
  };

  // Modifier campagne
  const handleUpdateBatch = async () => {
    try {
      if (!selectedBatch) return;

      await housingBatchService.updateBatch(selectedBatch.id, formData);
      setIsEditModalOpen(false);
      setSelectedBatch(null);
      resetFormData();
      await loadBatches();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur modification campagne');
    }
  };

  // Supprimer campagne
  const handleDeleteBatch = async (batch: ApplicationBatch) => {
    const confirmed = await confirm({
      title: 'Supprimer la campagne ?',
      message: `Voulez-vous vraiment supprimer la campagne "${batch.name}" ? Cette action est irréversible.`,
      variant: 'danger'
    });

    if (confirmed) {
      try {
        await housingBatchService.deleteBatch(batch.id);
        await loadBatches();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur suppression campagne');
      }
    }
  };

  // Ouvrir campagne
  const handleOpenBatch = async (batch: ApplicationBatch) => {
    const confirmed = await confirm({
      title: 'Ouvrir la campagne ?',
      message: `Ouvrir la campagne "${batch.name}" pour permettre les soumissions en ligne ?`,
      variant: 'info'
    });

    if (confirmed) {
      try {
        await housingBatchService.openBatch(batch.id);
        await loadBatches();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur ouverture campagne');
      }
    }
  };

  // Fermer campagne
  const handleCloseBatch = async (batch: ApplicationBatch) => {
    const confirmed = await confirm({
      title: 'Fermer la campagne ?',
      message: `Fermer la campagne "${batch.name}" ? Les soumissions ne seront plus acceptées.`,
      variant: 'warning'
    });

    if (confirmed) {
      try {
        await housingBatchService.closeBatch(batch.id);
        await loadBatches();
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Erreur fermeture campagne');
      }
    }
  };

  // Lancer assignation
  const handleProcessBatch = async (batch: ApplicationBatch) => {
    const confirmed = await confirm({
      title: 'Lancer l\'assignation automatique ?',
      message: `Lancer le traitement de la campagne "${batch.name}" ? ${batch.totalApplications} demandes seront traitées.`,
      variant: 'success'
    });

    if (confirmed) {
      try {
        setSelectedBatch(batch);
        setIsProgressModalOpen(true);
        setProcessingStats({
          batchId: batch.id,
          totalApplications: batch.totalApplications,
          processedApplications: 0,
          assignedCount: 0,
          pendingCount: batch.totalApplications,
          failedCount: 0,
          progressPercentage: 0,
          status: 'PROCESSING'
        });

        // Lancer assignation
        const result = await housingBatchService.processBatch(batch.id);
        setAssignmentReport(result.report);

        // Démarrer polling
        startPollingStats(batch.id);
      } catch (err) {
        setIsProgressModalOpen(false);
        alert(err instanceof Error ? err.message : 'Erreur lancement assignation');
      }
    }
  };

  // Voir rapport
  const handleViewReport = (batch: ApplicationBatch) => {
    setSelectedBatch(batch);
    setIsReportModalOpen(true);
  };

  // Reset formulaire
  const resetFormData = () => {
    setFormData({
      name: '',
      type: 'NEW_ASSIGNMENT_CAMPAIGN',
      academicYear: new Date().getFullYear().toString(),
      startDate: '',
      endDate: '',
      allowOnlineSubmission: true,
      description: ''
    });
  };

  // Ouvrir modal édition
  const openEditModal = (batch: ApplicationBatch) => {
    setSelectedBatch(batch);
    setFormData({
      name: batch.name,
      type: batch.type,
      academicYear: batch.academicYear,
      startDate: batch.startDate,
      endDate: batch.endDate,
      allowOnlineSubmission: batch.allowOnlineSubmission,
      description: batch.description
    });
    setIsEditModalOpen(true);
  };

  // Badge statut avec couleurs
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: 'default', label: 'Brouillon' },
      OPEN: { variant: 'success', label: 'Ouverte' },
      CLOSED: { variant: 'warning', label: 'Fermée' },
      PROCESSING: { variant: 'info', label: 'En traitement' },
      COMPLETED: { variant: 'primary', label: 'Complétée' }
    };
    const config = variants[status] || variants.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Badge type
  const getTypeBadge = (type: string) => {
    return type === 'RENEWAL_CAMPAIGN' 
      ? <Badge variant="info">Renouvellement</Badge>
      : <Badge variant="primary">Nouvelle attribution</Badge>;
  };

  // Colonnes tableau
  const columns: TableColumn<ApplicationBatch>[] = [
    {
      key: 'batchNumber',
      label: 'N°',
      render: (batch) => <span className="font-mono text-sm">{batch.batchNumber}</span>
    },
    {
      key: 'name',
      label: 'Nom',
      render: (batch) => (
        <div>
          <p className="font-medium">{batch.name}</p>
          <p className="text-sm text-gray-500">{batch.academicYear}</p>
        </div>
      )
    },
    {
      key: 'type',
      label: 'Type',
      render: (batch) => getTypeBadge(batch.type)
    },
    {
      key: 'dates',
      label: 'Dates',
      render: (batch) => (
        <div className="text-sm">
          <p>{new Date(batch.startDate).toLocaleDateString('fr-FR')}</p>
          <p className="text-gray-500">{new Date(batch.endDate).toLocaleDateString('fr-FR')}</p>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Statut',
      render: (batch) => getStatusBadge(batch.status)
    },
    {
      key: 'stats',
      label: 'Demandes',
      render: (batch) => (
        <div className="text-right">
          <p className="font-medium">{batch.totalApplications}</p>
          <p className="text-sm text-gray-500">
            {batch.assignedCount} assignées ({batch.successRate.toFixed(1)}%)
          </p>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (batch) => (
        <div className="flex items-center gap-2">
          {batch.status === 'DRAFT' && (
            <>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<PlayIcon className="h-4 w-4" />}
                onClick={() => handleOpenBatch(batch)}
              >
                Ouvrir
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<PencilIcon className="h-4 w-4" />}
                onClick={() => openEditModal(batch)}
              >
                Modifier
              </Button>
              <Button
                size="sm"
                variant="danger"
                leftIcon={<TrashIcon className="h-4 w-4" />}
                onClick={() => handleDeleteBatch(batch)}
              >
                Supprimer
              </Button>
            </>
          )}
          {batch.status === 'OPEN' && (
            <Button
              size="sm"
              variant="warning"
              leftIcon={<StopIcon className="h-4 w-4" />}
              onClick={() => handleCloseBatch(batch)}
            >
              Fermer
            </Button>
          )}
          {batch.status === 'CLOSED' && (
            <Button
              size="sm"
              variant="success"
              leftIcon={<CheckCircleIcon className="h-4 w-4" />}
              onClick={() => handleProcessBatch(batch)}
            >
              Lancer assignation
            </Button>
          )}
          {batch.status === 'COMPLETED' && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleViewReport(batch)}
            >
              Voir rapport
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <Container className="py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestion des Campagnes d'Attribution
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérer les campagnes de renouvellement et de nouvelle attribution
          </p>
        </div>
        <Button
          leftIcon={<PlusIcon className="h-5 w-5" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Nouvelle campagne
        </Button>
      </div>

      {/* Filtres */}
      <Card className="mb-6">
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Rechercher"
              placeholder="Nom campagne..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Select
              label="Statut"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'DRAFT', label: 'Brouillon' },
                { value: 'OPEN', label: 'Ouverte' },
                { value: 'CLOSED', label: 'Fermée' },
                { value: 'PROCESSING', label: 'En traitement' },
                { value: 'COMPLETED', label: 'Complétée' }
              ]}
            />
            <Select
              label="Type"
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              options={[
                { value: 'all', label: 'Tous' },
                { value: 'RENEWAL_CAMPAIGN', label: 'Renouvellement' },
                { value: 'NEW_ASSIGNMENT_CAMPAIGN', label: 'Nouvelle attribution' }
              ]}
            />
            <Input
              label="Année académique"
              placeholder="2024-2025"
              value={filters.academicYear}
              onChange={(e) => setFilters({ ...filters, academicYear: e.target.value })}
            />
          </div>
        </CardBody>
      </Card>

      {/* Tableau campagnes */}
      <Card>
        <CardBody>
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          <DataTable
            columns={columns}
            data={batches}
            loading={loading}
            pagination={{
              currentPage: page,
              totalPages: pages,
              onPageChange: setPage
            }}
          />
        </CardBody>
      </Card>

      {/* Modal Création */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetFormData();
        }}
        size="lg"
      >
        <ModalHeader>Créer une nouvelle campagne</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Nom de la campagne"
              placeholder="Attribution Logement 2024-2025"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Select
              label="Type de campagne"
              value={formData.type || 'NEW_ASSIGNMENT_CAMPAIGN'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={[
                { value: 'RENEWAL_CAMPAIGN', label: 'Renouvellement' },
                { value: 'NEW_ASSIGNMENT_CAMPAIGN', label: 'Nouvelle attribution' }
              ]}
            />
            <Input
              label="Année académique"
              placeholder="2024-2025"
              value={formData.academicYear || ''}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Date début"
                value={formData.startDate || ''}
                onChange={(value) => setFormData({ ...formData, startDate: value })}
                required
              />
              <DateInput
                label="Date fin"
                value={formData.endDate || ''}
                onChange={(value) => setFormData({ ...formData, endDate: value })}
                required
              />
            </div>
            <Switch
              label="Autoriser soumissions en ligne"
              checked={formData.allowOnlineSubmission || false}
              onChange={(checked) => setFormData({ ...formData, allowOnlineSubmission: checked })}
            />
            <Input
              label="Description (optionnel)"
              placeholder="Description de la campagne..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleCreateBatch}>
            Créer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal Édition */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBatch(null);
          resetFormData();
        }}
        size="lg"
      >
        <ModalHeader>Modifier la campagne</ModalHeader>
        <ModalBody>
          <div className="space-y-4">
            <Input
              label="Nom de la campagne"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <Select
              label="Type de campagne"
              value={formData.type || 'NEW_ASSIGNMENT_CAMPAIGN'}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
              options={[
                { value: 'RENEWAL_CAMPAIGN', label: 'Renouvellement' },
                { value: 'NEW_ASSIGNMENT_CAMPAIGN', label: 'Nouvelle attribution' }
              ]}
            />
            <Input
              label="Année académique"
              value={formData.academicYear || ''}
              onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <DateInput
                label="Date début"
                value={formData.startDate || ''}
                onChange={(value) => setFormData({ ...formData, startDate: value })}
              />
              <DateInput
                label="Date fin"
                value={formData.endDate || ''}
                onChange={(value) => setFormData({ ...formData, endDate: value })}
              />
            </div>
            <Switch
              label="Autoriser soumissions en ligne"
              checked={formData.allowOnlineSubmission || false}
              onChange={(checked) => setFormData({ ...formData, allowOnlineSubmission: checked })}
            />
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleUpdateBatch}>
            Enregistrer
          </Button>
        </ModalFooter>
      </Modal>

      {/* Modal Progression */}
      <Modal
        isOpen={isProgressModalOpen}
        onClose={() => {
          stopPollingStats();
          setIsProgressModalOpen(false);
        }}
        size="md"
      >
        <ModalHeader>Assignation en cours...</ModalHeader>
        <ModalBody>
          {processingStats && (
            <div className="space-y-4">
              <Progress
                value={processingStats.progressPercentage}
                size="lg"
                color="primary"
                showValue
              />
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {processingStats.processedApplications}
                  </p>
                  <p className="text-sm text-gray-500">Traitées</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {processingStats.assignedCount}
                  </p>
                  <p className="text-sm text-gray-500">Assignées</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {processingStats.failedCount}
                  </p>
                  <p className="text-sm text-gray-500">Échecs</p>
                </div>
              </div>
              {processingStats.progressPercentage >= 100 && (
                <Alert variant="success">
                  Assignation terminée avec succès !
                </Alert>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          {processingStats?.progressPercentage >= 100 ? (
            <Button onClick={() => {
              setIsProgressModalOpen(false);
              if (selectedBatch) {
                handleViewReport(selectedBatch);
              }
            }}>
              Voir le rapport
            </Button>
          ) : (
            <Button variant="outline" onClick={() => {
              stopPollingStats();
              setIsProgressModalOpen(false);
            }}>
              Fermer
            </Button>
          )}
        </ModalFooter>
      </Modal>

      {/* Modal Rapport */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSelectedBatch(null);
        }}
        size="xl"
      >
        <ModalHeader>
          Rapport d'assignation - {selectedBatch?.name}
        </ModalHeader>
        <ModalBody>
          {selectedBatch && (
            <div className="space-y-4">
              {/* Résumé */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardBody>
                    <p className="text-sm text-gray-500">Total demandes</p>
                    <p className="text-2xl font-bold">{selectedBatch.totalApplications}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-sm text-gray-500">Assignées</p>
                    <p className="text-2xl font-bold text-green-600">{selectedBatch.assignedCount}</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-sm text-gray-500">Taux succès</p>
                    <p className="text-2xl font-bold text-blue-600">{selectedBatch.successRate.toFixed(1)}%</p>
                  </CardBody>
                </Card>
                <Card>
                  <CardBody>
                    <p className="text-sm text-gray-500">En ligne</p>
                    <p className="text-2xl font-bold text-purple-600">{selectedBatch.onlineSubmissionsRate.toFixed(1)}%</p>
                  </CardBody>
                </Card>
              </div>

              {/* Détails */}
              {assignmentReport && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Détails des assignations</h3>
                  <div className="max-h-96 overflow-y-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium">Étudiant</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Statut</th>
                          <th className="px-4 py-2 text-left text-sm font-medium">Chambre</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {assignmentReport.results.map((result, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-2 text-sm">{result.studentName}</td>
                            <td className="px-4 py-2">
                              {result.success ? (
                                <Badge variant="success">Assignée</Badge>
                              ) : (
                                <Badge variant="danger">Échec</Badge>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              {result.roomAssigned || result.error}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button onClick={() => setIsReportModalOpen(false)}>
            Fermer
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default BatchManagement;
