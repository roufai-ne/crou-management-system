/**
 * FICHIER: apps\web\src\components\ui\Skeleton.tsx
 * COMPOSANT: Skeleton - Indicateur de chargement moderne
 *
 * DESCRIPTION:
 * Composant de placeholder pour états de chargement
 * Animation pulse moderne et gradients subtils
 * Variantes pour différents éléments (texte, avatar, card, etc.)
 *
 * FONCTIONNALITÉS:
 * - Animation pulse fluide avec gradient
 * - Variantes prédéfinies (text, circle, rect, avatar, card)
 * - Tailles configurables
 * - Support dark mode
 * - Compositions pour layouts complexes
 *
 * USAGE:
 * <Skeleton variant="text" width="200px" height="20px" />
 * <Skeleton variant="circle" size="lg" />
 * <Skeleton.Card />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';

// Types
type SkeletonVariant = 'text' | 'circle' | 'rect' | 'avatar' | 'card' | 'button';
type SkeletonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Interface principale
export interface SkeletonProps {
  /** Variante du skeleton */
  variant?: SkeletonVariant;

  /** Taille prédéfinie */
  size?: SkeletonSize;

  /** Largeur personnalisée (CSS) */
  width?: string | number;

  /** Hauteur personnalisée (CSS) */
  height?: string | number;

  /** Nombre de lignes (pour variant="text") */
  lines?: number;

  /** Classe CSS additionnelle */
  className?: string;

  /** Animation activée/désactivée */
  animate?: boolean;
}

// Tailles prédéfinies selon la variante
const sizeClasses: Record<SkeletonVariant, Record<SkeletonSize, string>> = {
  text: {
    xs: 'h-3',
    sm: 'h-4',
    md: 'h-5',
    lg: 'h-6',
    xl: 'h-8'
  },
  circle: {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  },
  rect: {
    xs: 'w-24 h-16',
    sm: 'w-32 h-24',
    md: 'w-48 h-32',
    lg: 'w-64 h-40',
    xl: 'w-80 h-48'
  },
  avatar: {
    xs: 'w-8 h-8',
    sm: 'w-10 h-10',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  },
  card: {
    xs: 'w-48 h-32',
    sm: 'w-64 h-40',
    md: 'w-80 h-48',
    lg: 'w-96 h-64',
    xl: 'w-full h-80'
  },
  button: {
    xs: 'w-16 h-6',
    sm: 'w-20 h-8',
    md: 'w-24 h-10',
    lg: 'w-32 h-12',
    xl: 'w-40 h-14'
  }
};

// Composant Skeleton de base
export const Skeleton: React.FC<SkeletonProps> & {
  Text: typeof SkeletonText;
  Circle: typeof SkeletonCircle;
  Card: typeof SkeletonCard;
  Avatar: typeof SkeletonAvatar;
  Table: typeof SkeletonTable;
} = ({
  variant = 'rect',
  size = 'md',
  width,
  height,
  lines = 1,
  className,
  animate = true
}) => {
  // Style inline pour dimensions personnalisées
  const style: React.CSSProperties = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined
  };

  // Classes de base avec animation moderne
  const baseClasses = cn(
    'relative overflow-hidden',
    'bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200',
    'dark:from-gray-700 dark:via-gray-600 dark:dark:to-gray-700',
    animate && 'animate-pulse',
    // Rounded selon variante
    variant === 'circle' || variant === 'avatar' ? 'rounded-full' : 'rounded-md',
    // Taille prédéfinie
    !width && !height && sizeClasses[variant][size],
    className
  );

  // Pour les lignes multiples de texte
  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              // Dernière ligne plus courte pour effet naturel
              index === lines - 1 && 'w-4/5'
            )}
            style={index === lines - 1 ? undefined : style}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={baseClasses} style={style}>
      {/* Effet shimmer/wave moderne */}
      {animate && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 dark:via-white/10 to-transparent" />
      )}
    </div>
  );
};

// Composant SkeletonText - pour texte multi-lignes
export interface SkeletonTextProps {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({
  lines = 3,
  className,
  lastLineWidth = '75%'
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          variant="text"
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

// Composant SkeletonCircle - pour avatars circulaires
export interface SkeletonCircleProps {
  size?: SkeletonSize;
  className?: string;
}

export const SkeletonCircle: React.FC<SkeletonCircleProps> = ({
  size = 'md',
  className
}) => {
  return <Skeleton variant="circle" size={size} className={className} />;
};

// Composant SkeletonAvatar - avatar avec info
export interface SkeletonAvatarProps {
  size?: SkeletonSize;
  showName?: boolean;
  showSubtext?: boolean;
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({
  size = 'md',
  showName = true,
  showSubtext = false,
  className
}) => {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Skeleton variant="avatar" size={size} />
      {showName && (
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="120px" height="16px" />
          {showSubtext && <Skeleton variant="text" width="80px" height="12px" />}
        </div>
      )}
    </div>
  );
};

// Composant SkeletonCard - pour cards de contenu
export interface SkeletonCardProps {
  hasImage?: boolean;
  hasAvatar?: boolean;
  lines?: number;
  hasActions?: boolean;
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  hasImage = true,
  hasAvatar = false,
  lines = 3,
  hasActions = true,
  className
}) => {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-lg p-6 space-y-4', className)}>
      {/* Image d'en-tête */}
      {hasImage && (
        <Skeleton variant="rect" width="100%" height="160px" className="rounded-lg" />
      )}

      {/* Header avec avatar optionnel */}
      <div className="flex items-start gap-3">
        {hasAvatar && <Skeleton variant="avatar" size="md" />}
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" height="20px" />
          <Skeleton variant="text" width="40%" height="14px" />
        </div>
      </div>

      {/* Contenu texte */}
      <SkeletonText lines={lines} />

      {/* Actions/Boutons */}
      {hasActions && (
        <div className="flex gap-3 pt-2">
          <Skeleton variant="button" size="sm" />
          <Skeleton variant="button" size="sm" />
        </div>
      )}
    </div>
  );
};

// Composant SkeletonTable - pour tableaux
export interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true,
  className
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, index) => (
            <Skeleton key={`header-${index}`} variant="text" height="16px" />
          ))}
        </div>
      )}

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={`cell-${rowIndex}-${colIndex}`} variant="text" height="20px" />
          ))}
        </div>
      ))}
    </div>
  );
};

// Attacher les sous-composants
Skeleton.Text = SkeletonText;
Skeleton.Circle = SkeletonCircle;
Skeleton.Card = SkeletonCard;
Skeleton.Avatar = SkeletonAvatar;
Skeleton.Table = SkeletonTable;

export default Skeleton;
