/**
 * FICHIER: apps/web/src/components/restauration/TicketsTab.tsx
 * COMPOSANT: TicketsTab - Gestion des tickets repas
 *
 * DESCRIPTION:
 * Gestion complète des tickets repas (émission, utilisation, suivi)
 * Support des tickets unitaires, forfaits et tickets gratuits
 *
 * FONCTIONNALITÉS:
 * - Émission de tickets (unitaire et batch)
 * - Recherche et utilisation de tickets
 * - Suivi des tickets actifs/utilisés/expirés
 * - Statistiques des tickets
 * - Gestion des forfaits
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Card, Badge, Button, Table, Modal, Input, Select, DateInput, useConfirmDialog } from '@/components/ui';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TicketIcon,
  QrCodeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useTickets } from '@/hooks/useRestauration';
import { TicketRepas, TypeTicket, TicketStatus } from '@/services/api/restaurationService';
import { TableSkeleton } from './skeletons';
import toast from 'react-hot-toast';

export const TicketsTab: React.FC = () => {
  const [isEmissionModalOpen, setIsEmissionModalOpen] = useState(false);
  const [isUtiliserModalOpen, setIsUtiliserModalOpen] = useState(false);
  const [numeroTicket, setNumeroTicket] = useState('');

  const {
    tickets,
    loading,
    error,
    filters,
    setFilters,
    emettreTicket,
    utiliserTicket,
    annulerTicket,
    refresh
  } = useTickets();

  const { ConfirmDialog, confirm } = useConfirmDialog();

  const handleEmission = async (data: any) => {
    try {
      await emettreTicket(data);
      setIsEmissionModalOpen(false);
      toast.success('Ticket émis avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur émission ticket:', err);
      toast.error('Erreur lors de l\'émission du ticket');
    }
  };

  const handleUtiliser = async () => {
    try {
      await utiliserTicket(numeroTicket);
      setIsUtiliserModalOpen(false);
      setNumeroTicket('');
      toast.success('Ticket utilisé avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur utilisation ticket:', err);
      toast.error('Erreur lors de l\'utilisation du ticket');
    }
  };

  const handleAnnuler = async (ticketId: string) => {
    const confirmed = await confirm({
      title: 'Annuler ce ticket ?',
      message: 'Le ticket ne pourra plus être utilisé. Cette action est irréversible.',
      variant: 'warning',
      confirmText: 'Annuler le ticket',
      cancelText: 'Retour',
    });

    if (!confirmed) return;

    try {
      await annulerTicket(ticketId);
      toast.success('Ticket annulé avec succès');
      refresh();
    } catch (err) {
      console.error('Erreur annulation ticket:', err);
      toast.error('Erreur lors de l\'annulation du ticket');
    }
  };

  const getStatutBadge = (statut: TicketStatus) => {
    switch (statut) {
      case TicketStatus.ACTIF:
        return <Badge variant="success">Actif</Badge>;
      case TicketStatus.UTILISE:
        return <Badge variant="secondary">Utilisé</Badge>;
      case TicketStatus.EXPIRE:
        return <Badge variant="warning">Expiré</Badge>;
      case TicketStatus.ANNULE:
        return <Badge variant="danger">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getTypeLabel = (type: TypeTicket) => {
    switch (type) {
      case TypeTicket.UNITAIRE:
        return 'Unitaire';
      case TypeTicket.FORFAIT_HEBDO:
        return 'Forfait Hebdomadaire';
      case TypeTicket.FORFAIT_MENSUEL:
        return 'Forfait Mensuel';
      case TypeTicket.GRATUIT:
        return 'Gratuit';
      default:
        return type;
    }
  };

  const columns = [
    {
      key: 'numero',
      label: 'Numéro',
      render: (ticket: TicketRepas) => (
        <div>
          <p className="font-mono font-medium">{ticket.numeroTicket}</p>
          <p className="text-sm text-gray-500">{getTypeLabel(ticket.typeTicket)}</p>
        </div>
      )
    },
    {
      key: 'beneficiaire',
      label: 'Bénéficiaire',
      render: (ticket: TicketRepas) => (
        <div>
          <p className="font-medium">{ticket.nomBeneficiaire}</p>
          {ticket.emailBeneficiaire && (
            <p className="text-sm text-gray-500">{ticket.emailBeneficiaire}</p>
          )}
        </div>
      )
    },
    {
      key: 'emission',
      label: 'Émission',
      render: (ticket: TicketRepas) => (
        <div>
          <p className="font-medium">{new Date(ticket.dateEmission).toLocaleDateString()}</p>
          <p className="text-sm text-gray-500">
            Expire: {new Date(ticket.dateExpiration).toLocaleDateString()}
          </p>
        </div>
      )
    },
    {
      key: 'utilisation',
      label: 'Utilisation',
      render: (ticket: TicketRepas) => (
        <div>
          {ticket.dateUtilisation ? (
            <>
              <p className="font-medium">{new Date(ticket.dateUtilisation).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">
                {new Date(ticket.dateUtilisation).toLocaleTimeString()}
              </p>
            </>
          ) : (
            <p className="text-gray-400">Non utilisé</p>
          )}
        </div>
      )
    },
    {
      key: 'montant',
      label: 'Montant',
      render: (ticket: TicketRepas) => (
        <div className="text-right">
          <p className="font-medium">{(ticket.montant || 0).toLocaleString()} XOF</p>
        </div>
      )
    },
    {
      key: 'statut',
      label: 'Statut',
      render: (ticket: TicketRepas) => getStatutBadge(ticket.statut)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (ticket: TicketRepas) => (
        <div className="flex items-center gap-2">
          {ticket.statut === TicketStatus.ACTIF && (
            <>
              <Button
                size="sm"
                variant="primary"
                leftIcon={<CheckCircleIcon className="h-4 w-4" />}
                onClick={() => {
                  setNumeroTicket(ticket.numeroTicket);
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
                <p className="text-sm text-gray-600">Tickets Actifs</p>
                <p className="text-2xl font-bold text-green-600">
                  {tickets?.filter((t: TicketRepas) => t.statut === TicketStatus.ACTIF).length || 0}
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
                <p className="text-sm text-gray-600">Utilisés Aujourd'hui</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tickets?.filter((t: TicketRepas) =>
                    t.statut === TicketStatus.UTILISE &&
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
                <p className="text-sm text-gray-600">Expirés</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {tickets?.filter((t: TicketRepas) => t.statut === TicketStatus.EXPIRE).length || 0}
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
                <p className="text-sm text-gray-600">Annulés</p>
                <p className="text-2xl font-bold text-red-600">
                  {tickets?.filter((t: TicketRepas) => t.statut === TicketStatus.ANNULE).length || 0}
                </p>
              </div>
              <XCircleIcon className="h-8 w-8 text-red-600" />
            </div>
          </Card.Content>
        </Card>
      </div>

      {/* Filtres et actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Rechercher un ticket..."
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
              { value: TicketStatus.ACTIF, label: 'Actif' },
              { value: TicketStatus.UTILISE, label: 'Utilisé' },
              { value: TicketStatus.EXPIRE, label: 'Expiré' },
              { value: TicketStatus.ANNULE, label: 'Annulé' }
            ]}
            className="w-full sm:w-48"
          />
          <Select
            value={filters.type || ''}
            onChange={(value) => setFilters({ ...filters, type: String(value) })}
            options={[
              { value: '', label: 'Tous les types' },
              { value: TypeTicket.UNITAIRE, label: 'Unitaire' },
              { value: TypeTicket.FORFAIT_HEBDO, label: 'Forfait Hebdo' },
              { value: TypeTicket.FORFAIT_MENSUEL, label: 'Forfait Mensuel' },
              { value: TypeTicket.GRATUIT, label: 'Gratuit' }
            ]}
            className="w-full sm:w-48"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<QrCodeIcon className="h-4 w-4" />}
            onClick={() => setIsUtiliserModalOpen(true)}
          >
            Scanner
          </Button>
          <Button
            onClick={() => setIsEmissionModalOpen(true)}
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            Émettre Ticket
          </Button>
        </div>
      </div>

      {/* Tableau des tickets */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            Tickets Repas ({tickets?.length || 0})
          </Card.Title>
        </Card.Header>
        <Card.Content>
          {loading ? (
            <TableSkeleton rows={10} columns={6} />
          ) : (
            <Table
              data={tickets || []}
              columns={columns}
              emptyMessage="Aucun ticket trouvé"
            />
          )}
        </Card.Content>
      </Card>

      {/* Modal Émission */}
      <Modal
        isOpen={isEmissionModalOpen}
        onClose={() => setIsEmissionModalOpen(false)}
        title="Émettre un Ticket Repas"
        size="lg"
      >
        <div className="space-y-4">
          <Select
            label="Type de ticket"
            options={[
              { value: TypeTicket.UNITAIRE, label: 'Unitaire' },
              { value: TypeTicket.FORFAIT_HEBDO, label: 'Forfait Hebdomadaire' },
              { value: TypeTicket.FORFAIT_MENSUEL, label: 'Forfait Mensuel' },
              { value: TypeTicket.GRATUIT, label: 'Gratuit' }
            ]}
            required
          />

          <Input
            label="Nom du bénéficiaire"
            placeholder="Ex: Jean DUPONT"
            required
          />

          <Input
            label="Email du bénéficiaire"
            type="email"
            placeholder="Ex: jean.dupont@univ.edu.ne"
          />

          <Input
            label="Téléphone du bénéficiaire"
            placeholder="Ex: +227 XX XX XX XX"
          />

          <div className="grid grid-cols-2 gap-4">
            <DateInput
              label="Date d'émission"
              required
            />
            <DateInput
              label="Date d'expiration"
              required
            />
          </div>

          <Input
            label="Montant (XOF)"
            type="number"
            placeholder="0"
            required
          />

          <Input
            label="Observation"
            placeholder="Remarques éventuelles"
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsEmissionModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={() => handleEmission({})}
            >
              Émettre le Ticket
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Utilisation */}
      <Modal
        isOpen={isUtiliserModalOpen}
        onClose={() => setIsUtiliserModalOpen(false)}
        title="Utiliser un Ticket"
        size="md"
      >
        <div className="space-y-4">
          <div className="text-center py-6">
            <QrCodeIcon className="h-24 w-24 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Scannez le QR Code ou saisissez le numéro du ticket</p>
          </div>

          <Input
            label="Numéro du ticket"
            placeholder="Ex: TKT-2025-000001"
            value={numeroTicket}
            onChange={(e) => setNumeroTicket(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setIsUtiliserModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleUtiliser}
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

export default TicketsTab;
