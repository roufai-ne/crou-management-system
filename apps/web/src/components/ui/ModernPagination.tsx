import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';

// Types
interface ModernPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  showPageSize?: boolean;
  showTotal?: boolean;
  showFirstLast?: boolean;
  maxVisiblePages?: number;
  variant?: 'default' | 'gradient-crou';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const ModernPagination: React.FC<ModernPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize = 10,
  totalItems,
  pageSizeOptions = [10, 25, 50, 100],
  onPageSizeChange,
  showPageSize = false,
  showTotal = false,
  showFirstLast = true,
  maxVisiblePages = 7,
  variant = 'default',
  size = 'md',
  className,
}) => {
  const getPageNumbers = (): (number | 'ellipsis')[] => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages: (number | 'ellipsis')[] = [];
    const leftSiblingIndex = Math.max(currentPage - 1, 1);
    const rightSiblingIndex = Math.min(currentPage + 1, totalPages);

    const showLeftEllipsis = leftSiblingIndex > 2;
    const showRightEllipsis = rightSiblingIndex < totalPages - 1;

    // Always show first page
    pages.push(1);

    if (showLeftEllipsis) {
      pages.push('ellipsis');
    } else if (leftSiblingIndex === 2) {
      pages.push(2);
    }

    // Show pages around current page
    for (let i = leftSiblingIndex; i <= rightSiblingIndex; i++) {
      if (i > 1 && i < totalPages) {
        pages.push(i);
      }
    }

    if (showRightEllipsis) {
      pages.push('ellipsis');
    } else if (rightSiblingIndex === totalPages - 1) {
      pages.push(totalPages - 1);
    }

    // Always show last page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 min-w-[2rem] text-xs px-2';
      case 'lg':
        return 'h-12 min-w-[3rem] text-base px-4';
      default:
        return 'h-10 min-w-[2.5rem] text-sm px-3';
    }
  };

  const getButtonClasses = (isActive = false, isDisabled = false) => {
    const baseClasses = cn(
      'inline-flex items-center justify-center rounded-lg font-medium',
      'transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
      getSizeClasses()
    );

    if (isDisabled) {
      return cn(baseClasses, 'text-gray-400 cursor-not-allowed bg-gray-100');
    }

    if (isActive) {
      return cn(
        baseClasses,
        variant === 'gradient-crou'
          ? 'bg-gradient-to-r from-emerald-600 to-orange-600 text-white shadow-lg shadow-emerald-500/30'
          : 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
      );
    }

    return cn(
      baseClasses,
      'text-gray-700 hover:bg-gray-100 active:bg-gray-200',
      'border border-gray-300 hover:border-gray-400'
    );
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  const pageNumbers = getPageNumbers();

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems || 0);

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Top Row: Total and Page Size Selector */}
      {(showTotal || showPageSize) && (
        <div className="flex items-center justify-between text-sm text-gray-600">
          {showTotal && totalItems && (
            <div>
              Affichage de <span className="font-semibold text-gray-900">{startItem}</span> à{' '}
              <span className="font-semibold text-gray-900">{endItem}</span> sur{' '}
              <span className="font-semibold text-gray-900">{totalItems}</span> éléments
            </div>
          )}

          {showPageSize && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-600">
                Lignes par page :
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={(e) => onPageSizeChange(Number(e.target.value))}
                className={cn(
                  'border border-gray-300 rounded-lg bg-white',
                  'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent',
                  'transition-colors cursor-pointer',
                  size === 'sm' ? 'h-8 text-xs px-2' : size === 'lg' ? 'h-12 text-base px-4' : 'h-10 text-sm px-3'
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
      )}

      {/* Bottom Row: Pagination Controls */}
      <div className="flex items-center justify-center gap-1">
        {/* First Page */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
            className={getButtonClasses(false, currentPage === 1)}
            aria-label="Première page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
        )}

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={getButtonClasses(false, currentPage === 1)}
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <div
                key={`ellipsis-${index}`}
                className={cn(
                  'inline-flex items-center justify-center',
                  getSizeClasses(),
                  'text-gray-400'
                )}
              >
                <MoreHorizontal className="w-4 h-4" />
              </div>
            );
          }

          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              className={getButtonClasses(page === currentPage)}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          );
        })}

        {/* Next Page */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={getButtonClasses(false, currentPage === totalPages)}
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page */}
        {showFirstLast && (
          <button
            type="button"
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
            className={getButtonClasses(false, currentPage === totalPages)}
            aria-label="Dernière page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ModernPagination;
