import React from 'react';
import { cn } from '@/utils/cn';

interface BaseSkeletonProps {
  className?: string;
  animate?: boolean;
  style?: React.CSSProperties;
}

// Composant de base pour l'animation shimmer
function SkeletonBase({ className, animate = true, style }: BaseSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded',
        animate && 'animate-shimmer',
        className
      )}
      style={style}
    />
  );
}

// Skeleton pour un tableau
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {[...Array(columns)].map((_, i) => (
          <SkeletonBase key={i} className="h-12 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {[...Array(rows)].map((_, rowIdx) => (
        <div key={rowIdx} className="flex gap-4">
          {[...Array(columns)].map((_, colIdx) => (
            <SkeletonBase key={colIdx} className="h-16 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Skeleton pour une carte KPI
export function CardSkeleton({ 
  withImage = false,
  rows = 3 
}: { 
  withImage?: boolean;
  rows?: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
      {withImage && <SkeletonBase className="h-48 w-full" />}
      <div className="space-y-3">
        {[...Array(rows)].map((_, i) => (
          <SkeletonBase 
            key={i} 
            className={cn(
              'h-4',
              i === 0 && 'w-3/4',
              i === 1 && 'w-full',
              i === 2 && 'w-2/3'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Skeleton pour une liste
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <SkeletonBase className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBase className="h-4 w-3/4" />
            <SkeletonBase className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Skeleton pour un formulaire
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-6">
      {[...Array(fields)].map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-12 w-full" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <SkeletonBase className="h-11 w-32" />
        <SkeletonBase className="h-11 w-32" />
      </div>
    </div>
  );
}

// Skeleton pour un dashboard
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPIs Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
            <SkeletonBase className="h-4 w-24 mb-3" />
            <SkeletonBase className="h-8 w-32 mb-2" />
            <SkeletonBase className="h-3 w-20" />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SkeletonBase className="h-6 w-48 mb-4" />
          <SkeletonBase className="h-64 w-full" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <SkeletonBase className="h-6 w-48 mb-4" />
          <SkeletonBase className="h-64 w-full" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <SkeletonBase className="h-6 w-48 mb-4" />
        <TableSkeleton rows={5} columns={5} />
      </div>
    </div>
  );
}

// Skeleton générique configurable
export function Skeleton({
  variant = 'text',
  width,
  height,
  className,
}: {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
  className?: string;
}) {
  return (
    <SkeletonBase
      className={cn(
        variant === 'text' && 'h-4',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded',
        className
      )}
      style={{ width, height }}
    />
  );
}

export default Skeleton;
