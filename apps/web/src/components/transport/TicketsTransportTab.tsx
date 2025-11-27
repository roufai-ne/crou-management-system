/**
 * FICHIER: apps/web/src/components/transport/TicketsTransportTab.tsx
 * COMPOSANT: TicketsTransportTab - Gestion des tickets transport
 *
 * DESCRIPTION:
 * Gestion complète des tickets de transport anonymes
 * Émission unitaire ou en lot, utilisation, annulation, statistiques
 *
 * FONCTIONNALITÉS:
 * - Émission de tickets (unitaire et batch)
 * - Recherche et utilisation de tickets (scan QR)
 * - Suivi des tickets actifs/utilisés/expirés
 * - Statistiques des tickets
 * - Export et impression
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
  DateInput,
  useConfirmDialog
} from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentArrowDownIcon,
  ArrowsRightLeftIcon
} from '@heroicons/react/24/outline';
import { useTransportTickets } from '@/hooks/useTransportTickets';
import {
  TicketTransport,
  CategorieTicketTransport,
  TicketTransportStatus,
  CreateTicketTransportRequest,
  CreateTicketsTransportBatchRequest
} from '@/services/api/transportTicketService';
import { useTransportRoutes } from '@/hooks/useTransport';
import toast from 'react-hot-toast';

import { generateTransportTicketPDF } from '@/utils/ticketGenerator';

export const TicketsTransportTab: React.FC = () => {
  const [isEmissionModalOpen, setIsEmissionModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isUtiliserModalOpen, setIsUtiliserModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<TicketTransport | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<CreateTicketTransportRequest>>({
    categorie: CategorieTicketTransport.PAYANT,
    tarif: 0,
    annee: new Date().getFullYear()
  });

  const [batchFormData, setBatchFormData] = useState<Partial<CreateTicketsTransportBatchRequest>>({
    categorie: CategorieTicketTransport.PAYANT,
    tarif: 0,
    quantite: 1,
    annee: new Date().getFullYear()
  });

  const {
    tickets,
    loading,
    error,
    filters,
    setFilters,
    createTicket,
    createTicketsBatch,
    utiliserTicket,
    annulerTicket,
    searchByNumero,
    searchByQRCode,
    downloadTicketPDF,
    exportTickets,
    refresh
  } = useTransportTickets();

  const { routes = [] } = useTransportRoutes();
  const { ConfirmDialog, confirm } = useConfirmDialog();

  /**
   * Gérer l'émission d'un ticket individuel
   */
  const handleEmission = async () => {
    // Auto-set expiration to end of current year
    const currentYear = new Date().getFullYear();
    const endOfYear = new Date(currentYear, 11, 31).toISOString();

    const ticketData = {
      ...formData,
      dateExpiration: endOfYear
    };

    try {
      await createTicket(ticketData as CreateTicketTransportRequest);
      setIsEmissionModalOpen(false);
      resetFormData();
      toast.success('Ticket émis avec succès');
    } catch (err) {
      // Error handled by hook
    }
  };

  /**
   * Gérer l'émission d'un lot de tickets
   */
  const handleBatchEmission = async () => {
    if (
      !batchFormData.quantite ||
      batchFormData.quantite < 1 ||
      batchFormData.quantite > 1000
    ) {
      toast.error('Veuillez remplir tous les champs correctement (quantité max: 1000)');
      return;
    }

    // Auto-set expiration to end of current year
    const currentYear = new Date().getFullYear();
    const endOfYear = new Date(currentYear, 11, 31).toISOString();

    const batchData = {
      ...batchFormData,
      dateExpiration: endOfYear
    };

    try {
      const result = await createTicketsBatch(batchData as CreateTicketsTransportBatchRequest);
      if (result) {
        toast.success(
          `${result.total} tickets créés - Montant total: ${result.montantTotal.toLocaleString()} XOF`
        );
      }
      setIsBatchModalOpen(false);
      resetBatchFormData();
    } catch (err) {
      // Error handled by hook
    }
  };

  /**
   * Gérer l'utilisation d'un ticket
   */
  const handleUtiliser = async () => {
    if (!selectedTicket) {
      toast.error('Ticket non sélectionné');
      return;
    }

    try {
      await utiliserTicket(selectedTicket.id, {
        numeroTicket: selectedTicket.numeroTicket,
        qrCode: selectedTicket.qrCode
      });
      setIsUtiliserModalOpen(false);
      setSelectedTicket(null);
      setSearchInput('');
    } catch (err) {
      // Error handled by hook
    }
  };

  /**
   * Rechercher et afficher un ticket
   */
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      toast.error('Veuillez saisir un numéro ou QR code');
      return;
    }

    let ticket: TicketTransport | null = null;

    // Déterminer si c'est un QR code ou un numéro
    if (searchInput.startsWith('QR-TRANS-')) {
      ticket = await searchByQRCode(searchInput);
    } else {
      ticket = await searchByNumero(searchInput);
    }

    if (ticket) {
      setSelectedTicket(ticket);
    }
  };

  /**
   * Gérer l'annulation d'un ticket
   */
  const handleAnnuler = async (ticketId: string) => {
    const confirmed = await confirm({
      title: 'Annuler ce ticket ?',
      message: 'Le ticket ne pourra plus être utilisé. Cette action est irréversible.',
      variant: 'warning',
      confirmText: 'Annuler le ticket',
      cancelText: 'Retour'
    });

    if (!confirmed) return;

    // Demander le motif
    const motif = prompt('Motif d\'annulation:');
    if (!motif) {
      toast.error('Motif requis');
      return;
    }

    try {
      await annulerTicket(ticketId, { motif });
    } catch (err) {
      // Error handled by hook
    }
  };

  /**
   * Reset form data
   */
  const resetFormData = () => {
    setFormData({
      categorie: CategorieTicketTransport.PAYANT,
      tarif: 0,
      annee: new Date().getFullYear()
    });
  };

  const resetBatchFormData = () => {
    setBatchFormData({
      categorie: CategorieTicketTransport.PAYANT,
      tarif: 0,
      quantite: 1,
      annee: new Date().getFullYear()
    });
  };

  /**
   * Obtenir le badge de statut
   */
  const getStatutBadge = (statut: TicketTransportStatus) => {
    switch (statut) {
      case TicketTransportStatus.ACTIF:
        return <Badge variant="success">Actif</Badge>;
      case TicketTransportStatus.UTILISE:
        return <Badge variant="secondary">Utilisé</Badge>;
      case TicketTransportStatus.EXPIRE:
        return <Badge variant="warning">Expiré</Badge>;
      case TicketTransportStatus.ANNULE:
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  /**
   * Obtenir le label de catégorie
   */
  const getCategorieLabel = (categorie: CategorieTicketTransport) => {
    switch (categorie) {
      case CategorieTicketTransport.PAYANT:
        return 'Payant';
      case CategorieTicketTransport.GRATUIT:
        return 'Gratuit';
      default:
        return categorie;
    }
  };

  /**
   * Colonnes du tableau
   */
  const columns = [
    {
      key: 'numero',
      label: 'Numéro',
      render: (ticket: TicketTransport) => (
        <div>
          <p className="font-mono font-medium text-sm">{ticket.numeroTicket}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{getCategorieLabel(ticket.categorie)}</p>
        </div>
      )
    },
    // ... (other columns)
    {
      key: 'emission',
      label: 'Émission',
      render: (ticket: TicketTransport) => (
        <div>
          <p className="font-medium">{new Date(ticket.dateEmission).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Expire: {new Date(ticket.dateExpiration).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'utilisation',
      label: 'Utilisation',
      render: (ticket: TicketTransport) => (
        <div>
          {ticket.dateUtilisation ? (
            <>
              <p className="font-medium">{new Date(ticket.dateUtilisation).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(ticket.dateUtilisation).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </>
          ) : (
            <p className="text-gray-400">Non utilisé</p>
          )}
        </div>
      )
    },
    {
      key: 'tarif',
      label: 'Tarif',
      render: (ticket: TicketTransport) => (
        <div className="text-right">
          <p className="font-medium">
            {ticket.tarif === 0 ? 'Gratuit' : `${ticket.tarif.toLocaleString()} XOF`}
          </p>
        </div>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (ticket: TicketTransport) => getStatutBadge(ticket.status)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (ticket: TicketTransport) => (
        <div className="flex items-center gap-2">
          {ticket.status === TicketTransportStatus.ACTIF && (
            <>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                onClick={() => {
                  setSelectedTicket(ticket);
                  setIsUtiliserModalOpen(true);
                }}
              >
                Utiliser
              </Button>
              <Button
                size="sm"
                variant="outline"
                leftIcon={<XCircleIcon className="h-4 w-4" />}
                className="text-red-600 hover:text-red-700"
                onClick={() => handleAnnuler(ticket.id)}
              >
                Annuler
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
            onClick={() => generateTransportTicketPDF(ticket)}
          >
            PDF
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
                <p className="text-sm text-gray-600 dark:text-gray-400">Tickets Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {tickets?.filter((t) => t.status === TicketTransportStatus.ACTIF).length || 0}
                </p>
              </div>
              <TicketIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Utilisés Aujourd'hui</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tickets?.filter(
                    (t) =>
                      t.status === TicketTransportStatus.UTILISE &&
                      t.dateUtilisation &&
                      new Date(t.dateUtilisation).toDateString() === new Date().toDateString()
                  ).length || 0}
                </p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Expirés</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {tickets?.filter((t) => t.status === TicketTransportStatus.EXPIRE).length || 0}
                </p>
              </div>
              <XCircleIcon className="h-8 w-8 text-yellow-600" />
            </div>
          </Card.Content>
        </Card>

        <Card>
          <Card.Content className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Recettes Totales</p>
                <p className="text-2xl font-bold text-purple-600">
                  {tickets
                    ?.filter((t) => t.status === TicketTransportStatus.UTILISE)
                    .reduce((sum, t) => sum + t.tarif, 0)
                    .toLocaleString() || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">XOF</p>
              </div>
              <DocumentArrowDownIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-start xl:items-center">
        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full xl:w-auto">
          <Input
            placeholder="Rechercher un ticket..."
            value={filters.status || ''}
            onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
            leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
            className="w-full md:flex-1"
          />
          <div className="flex flex-col md:flex-row gap-4">
            <Select
              value={filters.status || ''}
              onChange={(value) => setFilters({ ...filters, status: value as TicketTransportStatus })}
              options={[
                { value: '', label: 'Tous les statuts' },
                { value: TicketTransportStatus.ACTIF, label: 'Actif' },
                { value: TicketTransportStatus.UTILISE, label: 'Utilisé' },
                { value: TicketTransportStatus.EXPIRE, label: 'Expiré' },
                { value: TicketTransportStatus.ANNULE, label: 'Annulé' }
              ]}
              className="w-full md:w-48"
            />
            <Select
              value={filters.categorie || ''}
              onChange={(value) =>
                setFilters({ ...filters, categorie: value as CategorieTicketTransport })
              }
              options={[
                { value: '', label: 'Toutes catégories' },
                { value: CategorieTicketTransport.PAYANT, label: 'Payant' },
                { value: CategorieTicketTransport.GRATUIT, label: 'Gratuit' }
              ]}
              className="w-full md:w-48"
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end w-full xl:w-auto shrink-0">
          <Button
            variant="outline"
            leftIcon={<QrCodeIcon className="h-4 w-4" />}
            onClick={() => setIsUtiliserModalOpen(true)}
          >
            Scanner
          </Button>
          <Button
            variant="outline"
            leftIcon={<ArrowsRightLeftIcon className="h-4 w-4" />}
            onClick={() => setIsBatchModalOpen(true)}
          >
            Lot
          </Button>
          <Button onClick={() => setIsEmissionModalOpen(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>
            Émettre Ticket
          </Button>
        </div>
      </div>

      {/* Tableau des tickets */}
      <Card>
        <Card.Header>
          <div className="flex items-center justify-between">
            <Card.Title className="flex items-center gap-2">
              <TicketIcon className="h-5 w-5" />
              Tickets Transport ({tickets?.length || 0})
            </Card.Title>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<DocumentArrowDownIcon className="h-4 w-4" />}
              onClick={() => exportTickets('csv')}
            >
              Exporter CSV
            </Button>
          </div>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">Chargement...</div>
          ) : (
            <DataTable data={tickets || []} columns={columns} emptyMessage="Aucun ticket trouvé" />
          )}
        </Card.Content>
      </Card>

      {/* Modal Émission Individuelle */}
      <Modal
        isOpen={isEmissionModalOpen}
        onClose={() => {
          setIsEmissionModalOpen(false);
          resetFormData();
        }}
        title="Émettre un Ticket Transport"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Catégorie"
            value={formData.categorie || ''}
            onChange={(value) =>
              setFormData({
                ...formData,
                categorie: value as CategorieTicketTransport,
                tarif: value === CategorieTicketTransport.GRATUIT ? 0 : formData.tarif
              })
            }
            options={[
              { value: CategorieTicketTransport.PAYANT, label: 'Payant' },
              { value: CategorieTicketTransport.GRATUIT, label: 'Gratuit' }
            ]}
            required
          />

          {formData.categorie === CategorieTicketTransport.PAYANT && (
            <Input
              label="Tarif (XOF)"
              type="number"
              placeholder="0"
              value={formData.tarif || 0}
              onChange={(e) => setFormData({ ...formData, tarif: Number(e.target.value) })}
              required
            />
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Le ticket sera valide jusqu'au 31 décembre {new Date().getFullYear()}.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsEmissionModalOpen(false);
                resetFormData();
              }}
            >
              Annuler
            </Button>
            <Button variant="primary" onClick={handleEmission}>
              Émettre le Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Émission en Lot */}
      <Modal
        isOpen={isBatchModalOpen}
        onClose={() => {
          setIsBatchModalOpen(false);
          resetBatchFormData();
        }}
        title="Émettre un Lot de Tickets"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Catégorie"
            value={batchFormData.categorie || ''}
            onChange={(value) =>
              setBatchFormData({
                ...batchFormData,
                categorie: value as CategorieTicketTransport,
                tarif: value === CategorieTicketTransport.GRATUIT ? 0 : batchFormData.tarif
              })
            }
            options={[
              { value: CategorieTicketTransport.PAYANT, label: 'Payant' },
              { value: CategorieTicketTransport.GRATUIT, label: 'Gratuit' }
            ]}
            required
          />

          {batchFormData.categorie === CategorieTicketTransport.PAYANT && (
            <Input
              label="Tarif unitaire (XOF)"
              type="number"
              placeholder="0"
              value={batchFormData.tarif || 0}
              onChange={(e) => setBatchFormData({ ...batchFormData, tarif: Number(e.target.value) })}
              required
            />
          )}

          <Input
            label="Quantité (max: 1000)"
            type="number"
            placeholder="1"
            min={1}
            max={1000}
            value={batchFormData.quantite || 1}
            onChange={(e) =>
              setBatchFormData({ ...batchFormData, quantite: Number(e.target.value) })
            }
            required
          />

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              Les tickets seront valides jusqu'au 31 décembre {new Date().getFullYear()}.
            </p>
          </div>

          {batchFormData.quantite && batchFormData.tarif !== undefined && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm font-medium text-blue-900">
                Montant total: {(batchFormData.quantite * batchFormData.tarif).toLocaleString()} XOF
              </p>
              <p className="text-xs text-blue-700 mt-1">
                {batchFormData.quantite} ticket(s) × {batchFormData.tarif} XOF
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsBatchModalOpen(false);
                resetBatchFormData();
              }}
            >
              Annuler
            </Button>
            <Button variant="primary" onClick={handleBatchEmission}>
              Émettre {batchFormData.quantite || 0} Ticket(s)
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Utilisation */}
      <Modal
        isOpen={isUtiliserModalOpen}
        onClose={() => {
          setIsUtiliserModalOpen(false);
          setSelectedTicket(null);
          setSearchInput('');
        }}
        title="Utiliser un Ticket Transport"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center py-6">
            <QrCodeIcon className="h-24 w-24 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">
              Scannez le QR Code ou saisissez le numéro du ticket
            </p>
          </div>

          <div className="flex gap-2">
            <Input
              label="Numéro ou QR Code"
              placeholder="Ex: TKT-TRANS-2025-000001 ou QR-TRANS-..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSearch();
                }
              }}
              required
            />
            <Button variant="outline" onClick={handleSearch} className="mt-6">
              <MagnifyingGlassIcon className="h-5 w-5" />
            </Button>
          </div>

          {selectedTicket && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Ticket:</span>
                <span className="font-mono text-sm">{selectedTicket.numeroTicket}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Tarif:</span>
                <span className="text-sm font-medium">
                  {selectedTicket.tarif === 0 ? 'Gratuit' : `${selectedTicket.tarif} XOF`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut:</span>
                {getStatutBadge(selectedTicket.status)}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setIsUtiliserModalOpen(false);
                setSelectedTicket(null);
                setSearchInput('');
              }}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleUtiliser}
              disabled={!selectedTicket || selectedTicket.status !== TicketTransportStatus.ACTIF}
            >
              Valider l'Utilisation
            </Button>
          </div>
        </div>
      </Modal>

      {/* ConfirmDialog */}
      <ConfirmDialog />
    </div>
  );
};

export default TicketsTransportTab;
