import React, { useState } from 'react';
import { 
  FunnelIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon,
  CalendarIcon,
  CurrencyDollarIcon 
} from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui';
import type { PurchaseOrderStatus } from '@/types/procurement';
import type { PurchaseOrderFilters } from '@/hooks/useProcurementFilters';
import type { Budget } from '@/services/api/financialService';
import type { Supplier } from '@/services/api/suppliersService';

interface FilterBarProps {
  filters: PurchaseOrderFilters;
  onFilterChange: <K extends keyof PurchaseOrderFilters>(key: K, value: PurchaseOrderFilters[K]) => void;
  onClearFilters: () => void;
  budgets: Budget[];
  suppliers: Supplier[];
}

const STATUS_OPTIONS: { value: PurchaseOrderStatus; label: string }[] = [
  { value: 'DRAFT', label: 'Brouillon' },
  { value: 'SUBMITTED', label: 'Soumis' },
  { value: 'APPROVED', label: 'Approuvé' },
  { value: 'ORDERED', label: 'Commandé' },
  { value: 'PARTIALLY_RECEIVED', label: 'Partiellement reçu' },
  { value: 'FULLY_RECEIVED', label: 'Reçu' },
  { value: 'CLOSED', label: 'Clôturé' },
  { value: 'CANCELLED', label: 'Annulé' }
];

export const ProcurementFilterBar: React.FC<FilterBarProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
  budgets,
  suppliers
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFilterCount = Object.keys(filters).length;

  const handleStatusToggle = (status: PurchaseOrderStatus) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFilterChange('status', newStatuses.length > 0 ? newStatuses : undefined);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span className="font-medium">Filtres</span>
            {activeFilterCount > 0 && (
              <Badge variant="blue">{activeFilterCount}</Badge>
            )}
          </button>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher par référence, objet..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange('search', e.target.value || undefined)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {activeFilterCount > 0 && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
            Effacer tout
          </button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {STATUS_OPTIONS.map(option => (
                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.status?.includes(option.value) || false}
                    onChange={() => handleStatusToggle(option.value)}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {option.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Supplier Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fournisseur
            </label>
            <select
              value={filters.supplierId || ''}
              onChange={(e) => onFilterChange('supplierId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les fournisseurs</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.nom}
                </option>
              ))}
            </select>
          </div>

          {/* Budget Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Budget
            </label>
            <select
              value={filters.budgetId || ''}
              onChange={(e) => onFilterChange('budgetId', e.target.value || undefined)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Tous les budgets</option>
              {budgets.map(budget => (
                <option key={budget.id} value={budget.id}>
                  {budget.libelle}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <CalendarIcon className="h-4 w-4 inline mr-1" />
              Période
            </label>
            <div className="space-y-2">
              <input
                type="date"
                placeholder="Date début"
                value={filters.dateRange?.start || ''}
                onChange={(e) => onFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: e.target.value
                } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="date"
                placeholder="Date fin"
                value={filters.dateRange?.end || ''}
                onChange={(e) => onFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: e.target.value
                } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <CurrencyDollarIcon className="h-4 w-4 inline mr-1" />
              Montant (XOF)
            </label>
            <div className="space-y-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.amountRange?.min || ''}
                onChange={(e) => onFilterChange('amountRange', {
                  ...filters.amountRange,
                  min: e.target.value ? parseFloat(e.target.value) : undefined
                } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.amountRange?.max || ''}
                onChange={(e) => onFilterChange('amountRange', {
                  ...filters.amountRange,
                  max: e.target.value ? parseFloat(e.target.value) : undefined
                } as any)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && !isExpanded && (
        <div className="flex flex-wrap gap-2">
          {filters.status && filters.status.length > 0 && (
            <Badge variant="blue">
              Statut: {filters.status.length}
              <button
                onClick={() => onFilterChange('status', undefined)}
                className="ml-1 hover:text-red-600"
              >
                <XMarkIcon className="h-3 w-3 inline" />
              </button>
            </Badge>
          )}
          {filters.supplierId && (
            <Badge variant="blue">
              Fournisseur
              <button
                onClick={() => onFilterChange('supplierId', undefined)}
                className="ml-1 hover:text-red-600"
              >
                <XMarkIcon className="h-3 w-3 inline" />
              </button>
            </Badge>
          )}
          {filters.budgetId && (
            <Badge variant="blue">
              Budget
              <button
                onClick={() => onFilterChange('budgetId', undefined)}
                className="ml-1 hover:text-red-600"
              >
                <XMarkIcon className="h-3 w-3 inline" />
              </button>
            </Badge>
          )}
          {filters.dateRange && (
            <Badge variant="blue">
              Période
              <button
                onClick={() => onFilterChange('dateRange', undefined)}
                className="ml-1 hover:text-red-600"
              >
                <XMarkIcon className="h-3 w-3 inline" />
              </button>
            </Badge>
          )}
          {filters.amountRange && (
            <Badge variant="blue">
              Montant
              <button
                onClick={() => onFilterChange('amountRange', undefined)}
                className="ml-1 hover:text-red-600"
              >
                <XMarkIcon className="h-3 w-3 inline" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};
