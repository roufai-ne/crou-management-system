/**
 * FICHIER: apps/web/src/pages/procurement/PurchaseOrdersTab.tsx
 * COMPOSANT: PurchaseOrdersTab - Gestion des bons de commande (VERSION CORRIGÉE)
 *
 * DESCRIPTION:
 * Onglet principal pour gérer les bons de commande
 * Liste, création, workflow (submit, approve, order, receive, cancel)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, DataTable, Badge } from '@/components/ui';
import {
  PlusIcon,
  CheckIcon,
  XMarkIcon,
  TruckIcon
} from '@heroicons/react/24/outline';
import { 
  procurementService, 
  PurchaseOrder, 
  PurchaseOrderStatus
} from '@/services/api/procurementService';
import { ExportButton } from '@/components/reports/ExportButton';

const formatAmount = (amount: number) => {
  return `${amount.toLocaleString('fr-FR')} XOF`;
};

const STATUS_COLORS: Record<PurchaseOrderStatus, 'gray' | 'yellow' | 'blue' | 'green' | 'red'> = {
  [PurchaseOrderStatus.DRAFT]: 'gray',
  [PurchaseOrderStatus.SUBMITTED]: 'yellow',
  [PurchaseOrderStatus.APPROVED]: 'blue',
  [PurchaseOrderStatus.ORDERED]: 'blue',
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'yellow',
  [PurchaseOrderStatus.FULLY_RECEIVED]: 'green',
  [PurchaseOrderStatus.CLOSED]: 'gray',
  [PurchaseOrderStatus.CANCELLED]: 'red'
};

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  [PurchaseOrderStatus.DRAFT]: 'Brouillon',
  [PurchaseOrderStatus.SUBMITTED]: 'Soumis',
  [PurchaseOrderStatus.APPROVED]: 'Approuvé',
  [PurchaseOrderStatus.ORDERED]: 'Commandé',
  [PurchaseOrderStatus.PARTIALLY_RECEIVED]: 'Partiellement reçu',
  [PurchaseOrderStatus.FULLY_RECEIVED]: 'Reçu',
  [PurchaseOrderStatus.CLOSED]: 'Clôturé',
  [PurchaseOrderStatus.CANCELLED]: 'Annulé'
};

export const PurchaseOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les bons de commande
  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await procurementService.getPurchaseOrders();
      setOrders(response.data.orders || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des BCs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  // Soumettre pour approbation
  const handleSubmit = async (orderId: string) => {
    try {
      await procurementService.submitPurchaseOrder(orderId);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la soumission');
    }
  };

  // Approuver un BC
  const handleApprove = async (orderId: string) => {
    try {
      await procurementService.approvePurchaseOrder(orderId);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'approbation');
    }
  };

  // Marquer comme commandé
  const handleMarkAsOrdered = async (orderId: string) => {
    try {
      await procurementService.markAsOrdered(orderId);
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  // Annuler un BC
  const handleCancel = async (orderId: string) => {
    try {
      await procurementService.cancelPurchaseOrder(orderId, 'Annulation manuelle');
      loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'annulation');
    }
  };

  // Colonnes du DataTable
  const columns = [
    {
      key: 'reference',
      label: 'Référence',
      sortable: true,
      render: (row: PurchaseOrder) => (
        <div>
          <p className="font-medium">{row.reference}</p>
          <p className="text-sm text-gray-500">{row.objet}</p>
        </div>
      )
    },
    {
      key: 'supplier',
      label: 'Fournisseur',
      sortable: true,
      render: (row: PurchaseOrder) => row.supplier?.nom || 'N/A'
    },
    {
      key: 'montantTTC',
      label: 'Montant TTC',
      sortable: true,
      render: (row: PurchaseOrder) => formatAmount(row.montantTTC)
    },
    {
      key: 'dateCommande',
      label: 'Date',
      sortable: true,
      render: (row: PurchaseOrder) => new Date(row.dateCommande).toLocaleDateString('fr-FR')
    },
    {
      key: 'status',
      label: 'Statut',
      sortable: true,
      render: (row: PurchaseOrder) => (
        <Badge variant={STATUS_COLORS[row.status]}>
          {STATUS_LABELS[row.status]}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row: PurchaseOrder) => (
        <div className="flex items-center gap-2">
          {row.status === PurchaseOrderStatus.DRAFT && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleSubmit(row.id)}
              title="Soumettre"
            >
              Soumettre
            </Button>
          )}
          {row.status === PurchaseOrderStatus.SUBMITTED && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleApprove(row.id)}
                leftIcon={<CheckIcon className="h-4 w-4" />}
                title="Approuver"
              >
                Approuver
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleCancel(row.id)}
                leftIcon={<XMarkIcon className="h-4 w-4" />}
                title="Refuser"
              >
                Refuser
              </Button>
            </>
          )}
          {row.status === PurchaseOrderStatus.APPROVED && (
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleMarkAsOrdered(row.id)}
              title="Marquer commandé"
            >
              Commander
            </Button>
          )}
          {(row.status === PurchaseOrderStatus.ORDERED || 
            row.status === PurchaseOrderStatus.PARTIALLY_RECEIVED) && (
            <Button
              size="sm"
              variant="success"
              leftIcon={<TruckIcon className="h-4 w-4" />}
              title="Réceptionner"
            >
              Réceptionner
            </Button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bons de Commande
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Gestion des bons de commande et workflow d'approbation
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ExportButton
            module="financial"
            title="Exporter"
          />
          <Button
            variant="primary"
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            Nouveau BC
          </Button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <Card>
          <Card.Content>
            <div className="text-red-600 dark:text-red-400">
              {error}
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Table des BCs */}
      <Card>
        <Card.Content>
          <DataTable
            columns={columns}
            data={orders}
            isLoading={isLoading}
            pagination
            pageSize={10}
          />
        </Card.Content>
      </Card>
    </div>
  );
};
