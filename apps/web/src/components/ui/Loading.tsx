/**
 * FICHIER: apps\web\src\components\ui\Loading.tsx
 * COMPOSANT: Loading - Composants de chargement
 * 
 * DESCRIPTION:
 * Composants de chargement et indicateurs de progression
 * Spinners, barres de progression et overlays
 * Design cohérent avec le système CROU
 * 
 * COMPOSANTS:
 * - Loading: Spinner de chargement simple
 * - LoadingBar: Barre de progression
 * 
 * USAGE:
 * <Loading size="lg" />
 * <LoadingBar progress={75} />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';

export interface LoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'white';
  text?: string;
}

export const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ size = 'md', color = 'primary', text, className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8'
    };

    const colorClasses = {
      primary: 'text-blue-600',
      secondary: 'text-gray-600',
      white: 'text-white'
    };

    return (
      <div ref={ref} className={cn('flex items-center justify-center', className)} {...props}>
        <div className="flex flex-col items-center gap-2">
          <div
            className={cn(
              'animate-spin rounded-full border-2 border-current border-t-transparent',
              sizeClasses[size],
              colorClasses[color]
            )}
          />
          {text && <p className={cn('text-sm', colorClasses[color])}>{text}</p>}
        </div>
      </div>
    );
  }
);
Loading.displayName = 'Loading';

export interface LoadingBarProps extends React.HTMLAttributes<HTMLDivElement> {
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  label?: string;
}

export const LoadingBar = React.forwardRef<HTMLDivElement, LoadingBarProps>(
  ({ progress = 0, size = 'md', color = 'primary', showLabel = false, label, className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'h-1',
      md: 'h-2',
      lg: 'h-3'
    };

    const colorClasses = {
      primary: 'bg-blue-600',
      secondary: 'bg-gray-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600'
    };

    const clampedProgress = Math.min(100, Math.max(0, progress));

    return (
      <div ref={ref} className={cn('w-full', className)} {...props}>
        {(showLabel || label) && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {label || 'Progression'}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {Math.round(clampedProgress)}%
            </span>
          </div>
        )}
        <div className={cn('bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden', sizeClasses[size])}>
          <div
            className={cn('transition-all duration-300 ease-out rounded-full', colorClasses[color], sizeClasses[size])}
            style={{ width: `${clampedProgress}%` }}
          />
        </div>
      </div>
    );
  }
);
LoadingBar.displayName = 'LoadingBar';

export default Loading;
