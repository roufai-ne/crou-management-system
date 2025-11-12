/**
 * FICHIER: apps/web/src/components/restauration/skeletons/SkeletonLoaders.tsx
 * COMPOSANT: SkeletonLoaders - Composants de chargement
 *
 * DESCRIPTION:
 * Collection de composants skeleton pour améliorer l'UX pendant les chargements
 * Fournit des placeholders visuels pendant le fetch des données
 *
 * COMPOSANTS:
 * - TableSkeleton: Pour les tableaux de données
 * - CardSkeleton: Pour les cartes/cards
 * - StatsSkeleton: Pour les statistiques/KPIs
 * - FormSkeleton: Pour les formulaires
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React from 'react';

/**
 * Composant de base Skeleton
 */
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded ${className}`}
    role="status"
    aria-label="Chargement..."
  />
);

/**
 * TableSkeleton - Skeleton pour tableaux
 */
interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-200">
      {/* Header */}
      {showHeader && (
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
          <div className="flex gap-4">
            {Array.from({ length: columns }).map((_, i) => (
              <div key={`header-${i}`} className="flex-1">
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Body rows */}
      <div className="divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={`row-${rowIndex}`} className="px-6 py-4">
            <div className="flex gap-4 items-center">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={`cell-${rowIndex}-${colIndex}`} className="flex-1">
                  <Skeleton
                    className={`h-4 ${
                      colIndex === 0 ? 'w-full' : colIndex === columns - 1 ? 'w-1/3' : 'w-2/3'
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * CardSkeleton - Skeleton pour cards/cartes
 */
interface CardSkeletonProps {
  count?: number;
  showImage?: boolean;
}

export const CardSkeleton: React.FC<CardSkeletonProps> = ({
  count = 1,
  showImage = false,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`card-${index}`}
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
        >
          {/* Image placeholder */}
          {showImage && (
            <Skeleton className="h-48 w-full mb-4" />
          )}

          {/* Title */}
          <Skeleton className="h-6 w-3/4 mb-3" />

          {/* Description lines */}
          <div className="space-y-2 mb-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          {/* Footer/Actions */}
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * StatsSkeleton - Skeleton pour statistiques/KPIs
 */
interface StatsSkeletonProps {
  count?: number;
  layout?: 'horizontal' | 'vertical';
}

export const StatsSkeleton: React.FC<StatsSkeletonProps> = ({
  count = 4,
  layout = 'horizontal',
}) => {
  const gridClass = layout === 'horizontal'
    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'
    : 'space-y-6';

  return (
    <div className={gridClass}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`stat-${index}`}
          className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm"
        >
          {/* Icon placeholder */}
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-16" />
          </div>

          {/* Value */}
          <Skeleton className="h-8 w-3/4 mb-2" />

          {/* Label */}
          <Skeleton className="h-4 w-1/2" />

          {/* Optional trend indicator */}
          {layout === 'horizontal' && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Skeleton className="h-3 w-2/3" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/**
 * FormSkeleton - Skeleton pour formulaires
 */
interface FormSkeletonProps {
  fields?: number;
  showActions?: boolean;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  fields = 5,
  showActions = true,
}) => {
  return (
    <div className="space-y-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={`field-${index}`}>
          {/* Label */}
          <Skeleton className="h-4 w-32 mb-2" />

          {/* Input field */}
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      {/* Actions */}
      {showActions && (
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </div>
  );
};

/**
 * ListSkeleton - Skeleton pour listes simples
 */
interface ListSkeletonProps {
  items?: number;
  showAvatar?: boolean;
}

export const ListSkeleton: React.FC<ListSkeletonProps> = ({
  items = 5,
  showAvatar = false,
}) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, index) => (
        <div
          key={`list-item-${index}`}
          className="flex items-center gap-4 p-4 bg-white rounded-lg border border-gray-200"
        >
          {/* Avatar/Icon */}
          {showAvatar && (
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          )}

          {/* Content */}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>

          {/* Action */}
          <Skeleton className="h-8 w-20 flex-shrink-0" />
        </div>
      ))}
    </div>
  );
};

/**
 * ChartSkeleton - Skeleton pour graphiques
 */
export const ChartSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      {/* Title */}
      <Skeleton className="h-6 w-48 mb-6" />

      {/* Chart area */}
      <div className="flex items-end justify-between gap-2 h-64">
        {Array.from({ length: 7 }).map((_, index) => (
          <Skeleton
            key={`bar-${index}`}
            className="flex-1"
            style={{ height: `${Math.random() * 60 + 40}%` }}
          />
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mt-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={`legend-${index}`} className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * DetailsSkeleton - Skeleton pour pages de détails
 */
export const DetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="flex gap-4">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>

      {/* Content sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`detail-${i}`} className="flex gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={`sidebar-${i}`} className="h-4 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * PageSkeleton - Skeleton pour page complète
 */
export const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-40" />
      </div>

      {/* Stats row */}
      <StatsSkeleton count={4} />

      {/* Main content */}
      <TableSkeleton rows={8} columns={5} />
    </div>
  );
};

// Export all skeletons
export default {
  TableSkeleton,
  CardSkeleton,
  StatsSkeleton,
  FormSkeleton,
  ListSkeleton,
  ChartSkeleton,
  DetailsSkeleton,
  PageSkeleton,
};
