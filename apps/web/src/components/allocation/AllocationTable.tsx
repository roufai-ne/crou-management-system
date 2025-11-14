/**
 * FICHIER: apps/web/src/components/allocation/AllocationTable.tsx
 * COMPOSANT: AllocationTable - Tableau des allocations
 *
 * DESCRIPTION:
 * Tableau interactif pour afficher et gérer les allocations
 * Support hiérarchie à 3 niveaux, filtrage, tri et actions
 *
 * FONCTIONNALITÉS:
 * - Affichage allocations budgétaires et stock
 * - Filtrage par niveau, statut, période
 * - Tri multi-colonnes
 * - Actions (valider, exécuter, annuler)
 * - Vue détaillée
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useMemo } from 'react';
import {
  BanknotesIcon,
  CubeIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  EyeIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { Badge, Button, Table } from '@/components/ui';
import {
  type Allocation,
  type BudgetAllocation,
  type StockAllocation,
  type HierarchyLevel,
  type AllocationStatus,
  AllocationUtils
} from '@/services/api/allocationService';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// ================================================================================================
// TYPES
// ================================================================================================

interface AllocationTableProps {
  /**
   * Liste des allocations à afficher
   */
  allocations: Allocation[];

  /**
   * État de chargement
   */
  loading?: boolean;

  /**
   * Callback pour valider une allocation
   */
  onValidate?: (allocationId: string, action: 'approve' | 'reject', reason?: string) => void;

  /**
   * Callback pour exécuter une allocation
   */
  onExecute?: (allocationId: string) => void;

  /**
   * Callback pour voir les détails
   */
  onViewDetails?: (allocation: Allocation) => void;

  /**
   * Afficher les filtres
   */
  showFilters?: boolean;

  /**
   * Afficher les actions
   */
  showActions?: boolean;

  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

type SortField = 'createdAt' | 'montant' | 'status' | 'level';
type SortDirection = 'asc' | 'desc';

// ================================================================================================
// COMPOSANTS HELPER
// ================================================================================================

const StatusBadge: React.FC<{ status: AllocationStatus }> = ({ status }) => {
  const variants: Record<AllocationStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
    pending: 'warning',
    approved: 'info',
    rejected: 'error',
    executed: 'success',
    cancelled: 'default'
  };

  const labels: Record<AllocationStatus, string> = {
    pending: 'En attente',
    approved: 'Approuvée',
    rejected: 'Rejetée',
    executed: 'Exécutée',
    cancelled: 'Annulée'
  };

  return <Badge variant={variants[status]}>{labels[status]}</Badge>;
};

const LevelBadge: React.FC<{ level: HierarchyLevel }> = ({ level }) => {
  const labels: Record<HierarchyLevel, string> = {
    ministry: 'Ministère',
    region: 'Région',
    crou: 'CROU'
  };

  const colors: Record<HierarchyLevel, string> = {
    ministry: 'bg-purple-100 text-purple-800',
    region: 'bg-blue-100 text-blue-800',
    crou: 'bg-green-100 text-green-800'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[level]}`}>
      {labels[level]}
    </span>
  );
};

// ================================================================================================
// COMPOSANT PRINCIPAL
// ================================================================================================

export const AllocationTable: React.FC<AllocationTableProps> = ({
  allocations,
  loading = false,
  onValidate,
  onExecute,
  onViewDetails,
  showFilters = true,
  showActions = true,
  className = ''
}) => {
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [filterLevel, setFilterLevel] = useState<HierarchyLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AllocationStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<'all' | 'budget' | 'stock'>('all');

  // Filtrer et trier les allocations
  const filteredAndSortedAllocations = useMemo(() => {
    let filtered = [...allocations];

    // Filtres
    if (filterLevel !== 'all') {
      filtered = filtered.filter(a => a.level === filterLevel);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(a => a.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(a => {
        if (filterType === 'budget') {
          return 'montant' in a;
        } else {
          return 'quantity' in a;
        }
      });
    }

    // Tri
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'montant':
          aValue = 'montant' in a ? a.montant : ('estimatedValue' in a ? a.estimatedValue || 0 : 0);
          bValue = 'montant' in b ? b.montant : ('estimatedValue' in b ? b.estimatedValue || 0 : 0);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'level':
          aValue = a.level;
          bValue = b.level;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [allocations, sortField, sortDirection, filterLevel, filterStatus, filterType]);

  // Gestion du tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Vérifier si c'est une allocation budgétaire
  const isBudgetAllocation = (allocation: Allocation): allocation is BudgetAllocation => {
    return 'montant' in allocation;
  };

  // Vérifier si c'est une allocation de stock
  const isStockAllocation = (allocation: Allocation): allocation is StockAllocation => {
    return 'quantity' in allocation;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (allocations.length === 0) {
    return (
      <div className="text-center py-12">
        <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aucune allocation</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Commencez par créer une allocation budgétaire ou de stock
        </p>
      </div>
    );
  }

  return (
    <div className={`allocation-table space-y-4 ${className}`}>
      {/* Filtres */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:border-gray-700">
          <FunnelIcon className="w-5 h-5 text-gray-400" />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">Tous les types</option>
            <option value="budget">Budget</option>
            <option value="stock">Stock</option>
          </select>

          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">Tous les niveaux</option>
            <option value="ministry">Ministère</option>
            <option value="region">Région</option>
            <option value="crou">CROU</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="all">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="approved">Approuvée</option>
            <option value="rejected">Rejetée</option>
            <option value="executed">Exécutée</option>
            <option value="cancelled">Annulée</option>
          </select>

          <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">
            {filteredAndSortedAllocations.length} allocation(s)
          </span>
        </div>
      )}

      {/* Tableau */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 dark:bg-gray-900">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:bg-gray-800"
                onClick={() => handleSort('level')}
              >
                <div className="flex items-center space-x-1">
                  <span>Niveau</span>
                  <ArrowsUpDownIcon className="w-4 h-4" />
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source ’ Cible
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:bg-gray-800"
                onClick={() => handleSort('montant')}
              >
                <div className="flex items-center space-x-1">
                  <span>Montant/Quantité</span>
                  <ArrowsUpDownIcon className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:bg-gray-800"
                onClick={() => handleSort('status')}
              >
                <div className="flex items-center space-x-1">
                  <span>Statut</span>
                  <ArrowsUpDownIcon className="w-4 h-4" />
                </div>
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:bg-gray-800"
                onClick={() => handleSort('createdAt')}
              >
                <div className="flex items-center space-x-1">
                  <span>Date</span>
                  <ArrowsUpDownIcon className="w-4 h-4" />
                </div>
              </th>
              {showActions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredAndSortedAllocations.map((allocation) => (
              <tr key={allocation.id} className="hover:bg-gray-50 dark:bg-gray-900">
                <td className="px-6 py-4 whitespace-nowrap">
                  {isBudgetAllocation(allocation) ? (
                    <div className="flex items-center text-sm">
                      <BanknotesIcon className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium">Budget</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm">
                      <CubeIcon className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium">Stock</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <LevelBadge level={allocation.level} />
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <div className="text-gray-900 font-medium">
                      {allocation.sourceTenantName || allocation.sourceTenantId}
                    </div>
                    <div className="text-gray-500 flex items-center mt-1">
                      <span className="mr-2">’</span>
                      {allocation.targetTenantName || allocation.targetTenantId}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {isBudgetAllocation(allocation) ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {AllocationUtils.formatCurrency(allocation.montant)}
                      </div>
                      {allocation.montantUtilise !== undefined && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Utilisé: {AllocationUtils.formatCurrency(allocation.montantUtilise)}
                        </div>
                      )}
                    </div>
                  ) : isStockAllocation(allocation) ? (
                    <div className="text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {allocation.quantity} {allocation.unit}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {allocation.itemName}
                      </div>
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={allocation.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(allocation.createdAt), 'dd MMM yyyy', { locale: fr })}
                </td>
                {showActions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      {onViewDetails && (
                        <button
                          onClick={() => onViewDetails(allocation)}
                          className="text-gray-600 hover:text-gray-900 dark:text-white"
                          title="Voir détails"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      )}
                      {onValidate && allocation.status === 'pending' && (
                        <>
                          <button
                            onClick={() => onValidate(allocation.id, 'approve')}
                            className="text-green-600 hover:text-green-900"
                            title="Approuver"
                          >
                            <CheckCircleIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => onValidate(allocation.id, 'reject', 'Rejeté')}
                            className="text-red-600 hover:text-red-900"
                            title="Rejeter"
                          >
                            <XCircleIcon className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {onExecute && allocation.status === 'approved' && (
                        <button
                          onClick={() => onExecute(allocation.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Exécuter"
                        >
                          <PlayIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredAndSortedAllocations.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>Aucune allocation ne correspond aux filtres sélectionnés</p>
        </div>
      )}
    </div>
  );
};

export default AllocationTable;
