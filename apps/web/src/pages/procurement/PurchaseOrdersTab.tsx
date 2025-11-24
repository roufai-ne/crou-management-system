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
  TruckIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { 
  procurementService, 
  PurchaseOrder, 
  PurchaseOrderStatus,
  type CreatePurchaseOrderRequest
} from '@/services/api/procurementService';
import { financialService, type Budget } from '@/services/api/financialService';
import { suppliersService, type Supplier } from '@/services/api/suppliersService';
import { ExportButton } from '@/components/reports/ExportButton';
import { PurchaseOrderFormModal, PurchaseOrderDetailsModal, ReceptionModal, ProcurementFilterBar } from '@/components/procurement';
import { useProcurement } from '@/hooks/useProcurement';
import { useProcurementFilters } from '@/hooks/useProcurementFilters';

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
  const {
    orders,
    loading: isLoading,
    error,
    fetchOrders: loadOrders,
    createOrder,
    submitOrder,
    approveOrder,
    markAsOrdered,
    cancelOrder
  } = useProcurement();

  const {
    filters,
    updateFilter,
    clearAllFilters,
    hasActiveFilters
  } = useProcurementFilters();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isReceptionModalOpen, setIsReceptionModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loadingFormData, setLoadingFormData] = useState(true);

  // Charger budgets et fournisseurs pour le formulaire
  useEffect(() => {
    const loadFormData = async () => {
      setLoadingFormData(true);
      try {
        const [budgetsRes, suppliersRes] = await Promise.all([
          financialService.getBudgets({ status: 'active' }),
          suppliersService.getSuppliers({ status: 'ACTIF' as any })
        ]);
        
        // Extract budgets - handle multiple response formats
        let budgetData: Budget[] = [];
        if (Array.isArray(budgetsRes)) {
          budgetData = budgetsRes;
        } else if ('budgets' in budgetsRes) {
          budgetData = budgetsRes.budgets;
        } else if ('data' in budgetsRes && budgetsRes.data) {
          budgetData = Array.isArray(budgetsRes.data) ? budgetsRes.data : budgetsRes.data.budgets || [];
        }
        
        // Extract suppliers
        const supplierData = suppliersRes.suppliers || [];
        
        setBudgets(budgetData);
        setSuppliers(supplierData);
        
        console.log(`Loaded ${budgetData.length} budgets and ${supplierData.length} suppliers`);
      } catch (err) {
        console.error('Erreur chargement données formulaire:', err);
      } finally {
        setLoadingFormData(false);
      }
    };
    loadFormData();
  }, []);

  // Soumettre pour approbation
  const handleSubmit = async (orderId: string) => {
    try {
      await submitOrder(orderId);
    } catch (err) {
      console.error('Erreur soumission:', err);
    }
  };

  // Approuver un BC
  const handleApprove = async (orderId: string) => {
    try {
      await approveOrder(orderId);
    } catch (err) {
      console.error('Erreur approbation:', err);
    }
  };

  // Marquer comme commandé
  const handleMarkAsOrdered = async (orderId: string) => {
    try {
      await markAsOrdered(orderId);
    } catch (err) {
      console.error('Erreur marquage commandé:', err);
    }
  };

  // Annuler un BC
  const handleCancel = async (orderId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce bon de commande ?')) {
      return;
    }
    try {
      await cancelOrder(orderId, 'Annulation manuelle');
    } catch (err) {
      console.error('Erreur annulation:', err);
    }
  };

  // Créer un nouveau BC
  const handleCreateOrder = async (data: CreatePurchaseOrderRequest) => {
    await createOrder(data);
    setIsCreateModalOpen(false);
  };

  // Voir les détails
  const handleViewDetails = (order: PurchaseOrder) => {
    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
  };

  // Ouvrir le modal de réception
  const handleReceive = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setIsReceptionModalOpen(true);
    }
  };

  // Soumettre la réception
  const handleReceptionSubmit = async (orderId: string, data: any) => {
    // Le hook useProcurement n'a pas de receiveOrder, on va utiliser le service directement
    try {
      await procurementService.receivePurchaseOrder(orderId, data);
      await loadOrders(); // Recharger la liste
      setIsReceptionModalOpen(false);
      setSelectedOrder(null);
    } catch (err) {
      console.error('Erreur réception:', err);
      throw err;
    }
  };

  // Filtrage côté client des commandes
  const filteredOrders = React.useMemo(() => {
    let result = [...orders];

    // Filtre par statut
    if (filters.status && filters.status.length > 0) {
      result = result.filter(order => filters.status!.includes(order.status));
    }

    // Filtre par fournisseur
    if (filters.supplierId) {
      result = result.filter(order => order.supplierId === filters.supplierId);
    }

    // Filtre par budget
    if (filters.budgetId) {
      result = result.filter(order => order.budgetId === filters.budgetId);
    }

    // Filtre par recherche textuelle
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(order =>
        order.reference.toLowerCase().includes(searchLower) ||
        order.objet.toLowerCase().includes(searchLower) ||
        order.supplier?.nom.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par plage de dates
    if (filters.dateRange) {
      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        result = result.filter(order => new Date(order.dateCommande) >= startDate);
      }
      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        result = result.filter(order => new Date(order.dateCommande) <= endDate);
      }
    }

    // Filtre par plage de montants
    if (filters.amountRange) {
      if (filters.amountRange.min !== undefined) {
        result = result.filter(order => order.montantTTC >= filters.amountRange!.min!);
      }
      if (filters.amountRange.max !== undefined) {
        result = result.filter(order => order.montantTTC <= filters.amountRange!.max!);
      }
    }

    return result;
  }, [orders, filters]);

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
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleViewDetails(row)}
            leftIcon={<EyeIcon className="h-4 w-4" />}
            title="Voir détails"
          >
            Voir
          </Button>
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
              onClick={() => handleReceive(row.id)}
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
            onClick={() => setIsCreateModalOpen(true)}
            disabled={loadingFormData}
          >
            {loadingFormData ? 'Chargement...' : 'Nouveau BC'}
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

      {/* Avertissement si pas de budgets ou fournisseurs */}
      {!loadingFormData && (budgets.length === 0 || suppliers.length === 0) && (
        <Card>
          <Card.Content>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {budgets.length === 0 && suppliers.length === 0 && 
                  '⚠️ Aucun budget ni fournisseur disponible. Veuillez créer au moins un budget et un fournisseur pour créer des bons de commande.'}
                {budgets.length === 0 && suppliers.length > 0 && 
                  '⚠️ Aucun budget disponible. Veuillez créer au moins un budget pour créer des bons de commande.'}
                {budgets.length > 0 && suppliers.length === 0 && 
                  '⚠️ Aucun fournisseur disponible. Veuillez créer au moins un fournisseur pour créer des bons de commande.'}
              </p>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Filtres */}
      <ProcurementFilterBar
        filters={filters}
        onFilterChange={updateFilter}
        onClearFilters={clearAllFilters}
        budgets={budgets}
        suppliers={suppliers}
      />

      {/* Modal de création */}
      <PurchaseOrderFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateOrder}
        budgets={budgets}
        suppliers={suppliers}
      />

      <PurchaseOrderDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSubmit={submitOrder}
        onApprove={approveOrder}
        onMarkAsOrdered={markAsOrdered}
        onCancel={(id) => cancelOrder(id, 'Annulation depuis les détails')}
        onReceive={handleReceive}
      />

      <ReceptionModal
        isOpen={isReceptionModalOpen}
        onClose={() => {
          setIsReceptionModalOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onSubmit={handleReceptionSubmit}
      />

      {/* Table des BCs */}
      <Card>
        <Card.Content>
          <DataTable
            columns={columns}
            data={filteredOrders}
            isLoading={isLoading}
            pagination
            pageSize={10}
          />
          {hasActiveFilters && filteredOrders.length === 0 && !isLoading && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              Aucun bon de commande ne correspond aux filtres appliqués.
            </div>
          )}
        </Card.Content>
      </Card>
    </div>
  );
};
