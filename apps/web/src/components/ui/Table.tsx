/**
 * FICHIER: apps\web\src\components\ui\Table.tsx
 * COMPOSANT: Table - Tableau de données
 * 
 * DESCRIPTION:
 * Composant de tableau réutilisable
 * Tri, pagination, sélection, actions
 * Design responsive et accessible
 * 
 * FONCTIONNALITÉS:
 * - Affichage de données tabulaires
 * - Tri par colonnes
 * - Pagination
 * - Sélection multiple
 * - Actions contextuelles
 * - Design responsive
 * - Accessibilité WCAG 2.1 AA
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useMemo } from 'react';
import { Button } from './Button';
import { Checkbox } from './Checkbox';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight,
  MoreHorizontal,
  Loader2
} from 'lucide-react';

// Interface pour les colonnes
export interface TableColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

// Interface pour les props du tableau
export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  emptyMessage?: string;
  selectable?: boolean;
  selectedItems?: T[];
  onSelectionChange?: (selected: T[]) => void;
  sortable?: boolean;
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
  };
  actions?: (item: T) => React.ReactNode;
  className?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T, index: number) => void;
}

export function Table<T extends { id: string | number }>({
  data,
  columns,
  loading = false,
  emptyMessage = 'Aucune donnée disponible',
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  sortable = true,
  onSort,
  pagination,
  actions,
  className = '',
  rowClassName,
  onRowClick
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Gestion du tri
  const handleSort = (columnKey: string) => {
    if (!sortable) return;

    const newDirection = sortColumn === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(columnKey);
    setSortDirection(newDirection);
    onSort?.(columnKey, newDirection);
  };

  // Gestion de la sélection - Optimisée pour éviter les copies inutiles
  const handleSelectAll = (checked: boolean) => {
    if (!selectable || !onSelectionChange) return;
    
    if (checked) {
      // Utiliser une nouvelle référence seulement si nécessaire
      const allSelected = data.slice();
      onSelectionChange(allSelected);
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (item: T, checked: boolean) => {
    if (!selectable || !onSelectionChange) return;

    if (checked) {
      // Éviter la copie si l'item est déjà sélectionné
      const isAlreadySelected = selectedItems.some(selected => selected.id === item.id);
      if (!isAlreadySelected) {
        onSelectionChange([...selectedItems, item]);
      }
    } else {
      // Optimiser le filtrage
      const newSelection = selectedItems.filter(selected => selected.id !== item.id);
      if (newSelection.length !== selectedItems.length) {
        onSelectionChange(newSelection);
      }
    }
  };

  const isSelected = (item: T) => {
    return selectedItems.some(selected => selected.id === item.id);
  };

  const isAllSelected = data.length > 0 && selectedItems.length === data.length;

  // Rendu de l'en-tête
  const renderHeader = () => (
    <thead className="bg-gray-50 dark:bg-gray-900">
      <tr>
        {selectable && (
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
            <Checkbox
              checked={isAllSelected}
              onChange={handleSelectAll}
              aria-label="Sélectionner tout"
            />
          </th>
        )}
        {columns.map((column, colIndex) => (
          <th
            key={`${column.key}-${colIndex}`}
            className={`px-6 py-3 text-${column.align || 'left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
              column.sortable !== false && sortable ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700' : ''
            } ${column.className || ''}`}
            style={{ width: column.width }}
            onClick={() => column.sortable !== false && handleSort(column.key)}
            aria-sort={
              sortColumn === column.key 
                ? sortDirection === 'asc' ? 'ascending' : 'descending'
                : column.sortable !== false && sortable ? 'none' : undefined
            }
            role={column.sortable !== false && sortable ? 'columnheader button' : 'columnheader'}
            tabIndex={column.sortable !== false && sortable ? 0 : -1}
            onKeyDown={(e) => {
              if ((e.key === 'Enter' || e.key === ' ') && column.sortable !== false && sortable) {
                e.preventDefault();
                handleSort(column.key);
              }
            }}
          >
            <div className="flex items-center gap-2">
              <span>{column.label}</span>
              {column.sortable !== false && sortable && (
                <div className="flex flex-col" aria-hidden="true">
                  <ChevronUp 
                    className={`w-3 h-3 ${
                      sortColumn === column.key && sortDirection === 'asc' 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                    }`} 
                  />
                  <ChevronDown 
                    className={`w-3 h-3 -mt-1 ${
                      sortColumn === column.key && sortDirection === 'desc' 
                        ? 'text-blue-600' 
                        : 'text-gray-400'
                    }`} 
                  />
                </div>
              )}
            </div>
          </th>
        ))}
        {actions && (
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
            Actions
          </th>
        )}
      </tr>
    </thead>
  );

  // Rendu des lignes
  const renderRows = () => (
    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
      {data.map((item, index) => (
        <tr
          key={item.id || `row-${index}`}
          className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
            onRowClick ? 'cursor-pointer' : ''
          } ${rowClassName?.(item, index) || ''}`}
          onClick={() => onRowClick?.(item, index)}
        >
          {selectable && (
            <td className="px-6 py-4 whitespace-nowrap">
              <Checkbox
                checked={isSelected(item)}
                onChange={(checked) => handleSelectItem(item, checked)}
                aria-label={`Sélectionner ${item.id}`}
              />
            </td>
          )}
          {columns.map((column, colIndex) => (
            <td
              key={`${column.key}-${colIndex}`}
              className={`px-6 py-4 whitespace-nowrap text-${column.align || 'left'} text-sm text-gray-900 dark:text-gray-100 ${
                column.className || ''
              }`}
            >
              {column.render ? column.render(item, index) : (item as any)[column.key]}
            </td>
          ))}
          {actions && (
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              {actions(item)}
            </td>
          )}
        </tr>
      ))}
    </tbody>
  );

  // Rendu de la pagination
  const renderPagination = () => {
    if (!pagination) return null;

    const { page, limit, total, onPageChange, onLimitChange } = pagination;
    const totalPages = Math.ceil(total / limit);
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
      <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
        <div className="flex-1 flex justify-between sm:hidden">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Précédent
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Suivant
          </Button>
        </div>
        
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Affichage de <span className="font-medium">{startItem}</span> à{' '}
              <span className="font-medium">{endItem}</span> sur{' '}
              <span className="font-medium">{total}</span> résultats
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">Afficher:</label>
              <select
                value={limit}
                onChange={(e) => onLimitChange(Number(e.target.value))}
                className="border border-gray-300 rounded-md px-2 py-1 text-sm"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendu du contenu vide
  const renderEmpty = () => (
    <tbody>
      <tr>
        <td 
          colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
          className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400"
        >
          {emptyMessage}
        </td>
      </tr>
    </tbody>
  );

  // Rendu du loading
  const renderLoading = () => (
    <tbody>
      <tr>
        <td 
          colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}
          className="px-6 py-12 text-center"
        >
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
          </div>
        </td>
      </tr>
    </tbody>
  );

  return (
    <div className={`overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg ${className}`}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          {renderHeader()}
          {loading ? renderLoading() : data.length === 0 ? renderEmpty() : renderRows()}
        </table>
      </div>
      {pagination && renderPagination()}
    </div>
  );
}
