/**
 * FICHIER: apps\web\src\components\ui\Pagination.tsx
 * COMPOSANT: Pagination - Composant de pagination avancé du système de design CROU
 *
 * DESCRIPTION:
 * Composant de pagination complet avec navigation intelligente
 * Support des grandes datasets, navigation clavier, options de taille de page
 * Optimisé pour l'usage dans les tables et listes CROU
 *
 * FONCTIONNALITÉS:
 * - Navigation par pages avec ellipses intelligentes
 * - Sélecteur de taille de page (10, 25, 50, 100)
 * - Navigation clavier (flèches, Entrée, Espace)
 * - Informations détaillées (X à Y sur Z éléments)
 * - Boutons Premier/Précédent/Suivant/Dernier
 * - Mode compact pour mobile
 * - Accessibilité complète (ARIA, screen readers)
 *
 * VARIANTES:
 * - 'default': Style standard avec bordures
 * - minimal: Style épuré sans bordures
 * - compact: Version mobile condensée
 *
 * TAILLES:
 * - sm: Petite (24px par élément)
 * - md: Moyenne (32px par élément) - défaut
 * - lg: Grande (40px par élément)
 *
 * PROPS:
 * - currentPage: Page actuelle (1-indexed)
 * - totalPages: Nombre total de pages
 * - totalItems: Nombre total d'éléments
 * - pageSize: Taille de page actuelle
 * - pageSizeOptions: Options de taille de page
 * - onPageChange: Callback changement de page
 * - onPageSizeChange: Callback changement de taille
 * - showPageSize: Afficher le sélecteur de taille
 * - showInfo: Afficher les informations détaillées
 * - disabled: État désactivé
 *
 * USAGE:
 * <Pagination
 *   currentPage={page}
 *   totalPages={Math.ceil(total / pageSize)}
 *   totalItems={total}
 *   pageSize={pageSize}
 *   onPageChange={setPage}
 *   onPageSizeChange={setPageSize}
 *   showPageSize
 *   showInfo
 * />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useMemo } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;
import { formatNumber } from '@/utils/formatters';

// Types pour les props
export interface PaginationProps extends VariantProps<typeof paginationVariants> {
  /** Page actuelle (1-indexed) */
  currentPage: number;

  /** Nombre total de pages */
  totalPages: number;

  /** Nombre total d'éléments */
  totalItems?: number;

  /** Taille de page actuelle */
  pageSize?: number;

  /** Options de taille de page disponibles */
  pageSizeOptions?: number[];

  /** Callback appelé lors du changement de page */
  onPageChange: (page: number) => void;

  /** Callback appelé lors du changement de taille de page */
  onPageSizeChange?: (pageSize: number) => void;

  /** Afficher le sélecteur de taille de page */
  showPageSize?: boolean;

  /** Afficher les informations détaillées (X à Y sur Z) */
  showInfo?: boolean;

  /** Nombre de pages à afficher autour de la page actuelle */
  siblingCount?: number;

  /** État désactivé */
  disabled?: boolean;

  /** Textes personnalisés pour l'internationalisation */
  labels?: {
    previous?: string;
    next?: string;
    first?: string;
    last?: string;
    page?: string;
    pageSize?: string;
    showingResults?: string;
    of?: string;
    results?: string;
  };

  /** Classes CSS personnalisées */
  className?: string;
  containerClassName?: string;
  buttonClassName?: string;
}

// Fonction de variantes pour le conteneur de pagination
const paginationVariants = (props: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'simple';
}) => {
  const baseClasses = 'flex items-center justify-between gap-4';
  
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };
  
  return cn(baseClasses, sizeClasses[props.size || 'md']);
};

// Fonction de variantes pour les boutons de pagination
const paginationButtonVariants = (props: {
  variant?: 'default' | 'outline' | 'ghost' | 'simple';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  isDisabled?: boolean;
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200';
  
  const sizeClasses = {
    sm: 'h-8 min-w-8 px-2 text-sm',
    md: 'h-10 min-w-10 px-3 text-base',
    lg: 'h-12 min-w-12 px-4 text-lg'
  };
  
  if (props.isDisabled) {
    return cn(baseClasses, sizeClasses[props.size || 'md'], 'opacity-50 cursor-not-allowed');
  }
  
  if (props.isActive) {
    return cn(baseClasses, sizeClasses[props.size || 'md'], 'bg-primary-600 text-white');
  }
  
  const variantClasses = {
    'default': 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
    ghost: 'text-gray-700 hover:bg-gray-100',
    simple: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
  };
  
  return cn(
    baseClasses,
    sizeClasses[props.size || 'md'],
    variantClasses[props.variant || 'default']
  );
};

// Hook pour générer la liste des pages à afficher
function usePagination(currentPage: number, totalPages: number, siblingCount: number = 1) {
  return useMemo(() => {
    // Si le nombre total de pages est inférieur au maximum à afficher, on affiche tout
    const totalPageNumbers = siblingCount + 5; // 1 + siblingCount + currentPage + siblingCount + 1

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    // Cas 1: Pas de points à gauche, mais des points à droite
    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, 'dots', lastPageIndex];
    }

    // Cas 2: Des points à gauche, mais pas à droite
    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, 'dots', ...rightRange];
    }

    // Cas 3: Des points des deux côtés
    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, 'dots', ...middleRange, 'dots', lastPageIndex];
    }

    return [];
  }, [currentPage, totalPages, siblingCount]);
}

// Composant Pagination principal
const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  pageSizeOptions = [10, 25, 50, 100],
  onPageChange,
  onPageSizeChange,
  showPageSize = false,
  showInfo = true,
  siblingCount = 1,
  disabled = false,
  variant = 'default',
  size = 'md',
  labels = {},
  className,
  containerClassName,
  buttonClassName,
  ...props
}) => {
  // Labels par défaut
  const defaultLabels = {
    previous: 'Précédent',
    next: 'Suivant',
    first: 'Premier',
    last: 'Dernier',
    page: 'Page',
    pageSize: 'Éléments par page',
    showingResults: 'Affichage de',
    of: 'sur',
    results: 'résultats',
    ...labels
  };

  // Génération de la liste des pages
  const paginationRange = usePagination(currentPage, totalPages, siblingCount);

  // Si seulement une page, on n'affiche pas la pagination (sauf si forcé)
  if (totalPages <= 1) {
    return showInfo && totalItems ? (
      <div className={cn('flex items-center justify-center py-4', containerClassName)}>
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {formatNumber(totalItems)} {defaultLabels.results}
        </span>
      </div>
    ) : null;
  }

  // Calcul des informations d'affichage
  const startItem = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = totalItems ? Math.min(currentPage * pageSize, totalItems) : 0;

  // Handlers
  const handlePageChange = (page: number) => {
    if (disabled || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    if (disabled || !onPageSizeChange) return;
    onPageSizeChange(newPageSize);
  };

  const handleKeyDown = (event: React.KeyboardEvent, page: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handlePageChange(page);
    }
  };

  return (
    <div
      className={cn(
        paginationVariants({ variant, size }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {/* Informations sur les résultats */}
      {showInfo && totalItems && (
        <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
          <span>
            {defaultLabels.showingResults} {formatNumber(startItem)} à {formatNumber(endItem)} {defaultLabels.of} {formatNumber(totalItems)} {defaultLabels.results}
          </span>
        </div>
      )}

      {/* Navigation principale */}
      <div className="flex items-center gap-1">
        {/* Bouton Premier */}
        <button
          type="button"
          onClick={() => handlePageChange(1)}
          disabled={disabled || currentPage === 1}
          className={cn(
            paginationButtonVariants({ variant, size }),
            buttonClassName
          )}
          aria-label={defaultLabels.first}
          title={defaultLabels.first}
        >
          <ChevronDoubleLeftIcon className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )} />
        </button>

        {/* Bouton Précédent */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled || currentPage === 1}
          className={cn(
            paginationButtonVariants({ variant, size }),
            buttonClassName
          )}
          aria-label={defaultLabels.previous}
          title={defaultLabels.previous}
        >
          <ChevronLeftIcon className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )} />
        </button>

        {/* Pages numérotées */}
        {paginationRange.map((pageNumber, index) => {
          if (pageNumber === 'dots') {
            return (
              <span
                key={`dots-${index}`}
                className={cn(
                  paginationButtonVariants({ variant, size, isEllipsis: true }),
                  buttonClassName
                )}
                aria-hidden="true"
              >
                <EllipsisHorizontalIcon className={cn(
                  size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
                )} />
              </span>
            );
          }

          const isActive = pageNumber === currentPage;

          return (
            <button
              key={pageNumber}
              type="button"
              onClick={() => handlePageChange(pageNumber as number)}
              onKeyDown={(e) => handleKeyDown(e, pageNumber as number)}
              disabled={disabled}
              className={cn(
                paginationButtonVariants({ variant, size, isActive }),
                buttonClassName
              )}
              aria-label={`${defaultLabels.page} ${pageNumber}`}
              aria-current={isActive ? 'page' : undefined}
            >
              {pageNumber}
            </button>
          );
        })}

        {/* Bouton Suivant */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled || currentPage === totalPages}
          className={cn(
            paginationButtonVariants({ variant, size }),
            buttonClassName
          )}
          aria-label={defaultLabels.next}
          title={defaultLabels.next}
        >
          <ChevronRightIcon className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )} />
        </button>

        {/* Bouton Dernier */}
        <button
          type="button"
          onClick={() => handlePageChange(totalPages)}
          disabled={disabled || currentPage === totalPages}
          className={cn(
            paginationButtonVariants({ variant, size }),
            buttonClassName
          )}
          aria-label={defaultLabels.last}
          title={defaultLabels.last}
        >
          <ChevronDoubleRightIcon className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'
          )} />
        </button>
      </div>

      {/* Sélecteur de taille de page */}
      {showPageSize && onPageSizeChange && (
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="page-size-select" className="text-gray-700 dark:text-gray-300">
            {defaultLabels.pageSize}:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => handlePageSizeChange(Number(e.target.value))}
            disabled={disabled}
            className={cn(
              'border border-gray-300 rounded-md bg-white text-gray-900',
              'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100',
              size === 'sm' ? 'px-2 py-1 text-xs' : size === 'lg' ? 'px-3 py-2 text-base' : 'px-2 py-1 text-sm'
            )}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

Pagination.displayName = 'Pagination';

// Export des types et composants
export { Pagination, paginationVariants, paginationButtonVariants, usePagination };
export type { PaginationProps };
export default Pagination;
