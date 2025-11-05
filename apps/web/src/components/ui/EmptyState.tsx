/**
 * FICHIER: apps\web\src\components\ui\EmptyState.tsx
 * COMPOSANT: EmptyState - États vides avec illustrations
 *
 * DESCRIPTION:
 * Composant pour afficher des états vides avec illustrations
 * Améliore l'UX lorsqu'il n'y a pas de données à afficher
 * Support des actions CTA et messages personnalisés
 *
 * FONCTIONNALITÉS:
 * - Illustration/icône personnalisable
 * - Titre et description
 * - Actions primaires et secondaires
 * - Variantes prédéfinies (no-data, error, search, etc.)
 * - Responsive design
 * - Dark mode support
 *
 * USAGE:
 * <EmptyState
 *   variant="no-data"
 *   title="Aucun budget trouvé"
 *   description="Commencez par créer votre premier budget"
 *   action={{
 *     label: "Créer un budget",
 *     onClick: () => navigate('/budgets/new')
 *   }}
 * />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';
import {
  FolderOpenIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  DocumentIcon,
  InboxIcon,
  CheckCircleIcon,
  XCircleIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { Button } from './Button';

// Types
export type EmptyStateVariant =
  | 'no-data'
  | 'no-results'
  | 'error'
  | 'success'
  | 'upload'
  | 'custom';

export interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  icon?: React.ReactNode;
}

export interface EmptyStateProps {
  /** Variante prédéfinie */
  variant?: EmptyStateVariant;

  /** Titre principal */
  title: string;

  /** Description/message */
  description?: string;

  /** Icône ou illustration personnalisée */
  icon?: React.ReactNode;

  /** URL d'une illustration SVG */
  illustration?: string;

  /** Action principale */
  action?: EmptyStateAction;

  /** Actions secondaires */
  secondaryActions?: EmptyStateAction[];

  /** Taille du composant */
  size?: 'sm' | 'md' | 'lg';

  /** Classe CSS additionnelle */
  className?: string;

  /** Enfants personnalisés (remplace le contenu par défaut) */
  children?: React.ReactNode;
}

// Configuration des variantes
const variantConfig: Record<
  Exclude<EmptyStateVariant, 'custom'>,
  {
    icon: React.ElementType;
    iconColor: string;
    title?: string;
    description?: string;
  }
> = {
  'no-data': {
    icon: FolderOpenIcon,
    iconColor: 'text-gray-400',
    title: 'Aucune donnée',
    description: 'Il n\'y a aucune donnée à afficher pour le moment'
  },
  'no-results': {
    icon: MagnifyingGlassIcon,
    iconColor: 'text-gray-400',
    title: 'Aucun résultat',
    description: 'Essayez de modifier vos critères de recherche'
  },
  'error': {
    icon: ExclamationTriangleIcon,
    iconColor: 'text-danger-500',
    title: 'Une erreur est survenue',
    description: 'Impossible de charger les données. Veuillez réessayer'
  },
  'success': {
    icon: CheckCircleIcon,
    iconColor: 'text-success-500',
    title: 'Opération réussie',
    description: 'L\'opération s\'est terminée avec succès'
  },
  'upload': {
    icon: CloudArrowUpIcon,
    iconColor: 'text-primary-500',
    title: 'Aucun fichier',
    description: 'Glissez-déposez vos fichiers ici ou cliquez pour parcourir'
  }
};

// Tailles
const sizeConfig = {
  sm: {
    container: 'py-8',
    icon: 'w-12 h-12',
    title: 'text-base',
    description: 'text-sm max-w-sm'
  },
  md: {
    container: 'py-12',
    icon: 'w-16 h-16',
    title: 'text-lg',
    description: 'text-base max-w-md'
  },
  lg: {
    container: 'py-16',
    icon: 'w-20 h-20',
    title: 'text-xl',
    description: 'text-lg max-w-lg'
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  variant = 'no-data',
  title,
  description,
  icon: customIcon,
  illustration,
  action,
  secondaryActions,
  size = 'md',
  className,
  children
}) => {
  // Récupérer la config de la variante
  const config = variant !== 'custom' ? variantConfig[variant] : null;
  const sizeClass = sizeConfig[size];

  // Icône à afficher
  const IconComponent = config?.icon;
  const iconColor = config?.iconColor || 'text-gray-400';

  // Titre et description avec fallback sur la config
  const displayTitle = title || config?.title || 'Empty';
  const displayDescription = description || config?.description;

  // Si children fournis, les afficher directement
  if (children) {
    return (
      <div className={cn('flex flex-col items-center justify-center px-4', sizeClass.container, className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-4',
        sizeClass.container,
        className
      )}
    >
      {/* Illustration ou Icône */}
      {illustration ? (
        <div className="mb-6">
          <img
            src={illustration}
            alt={displayTitle}
            className="w-64 h-64 object-contain opacity-80 dark:opacity-60"
          />
        </div>
      ) : customIcon ? (
        <div className={cn('mb-6', sizeClass.icon)}>
          {customIcon}
        </div>
      ) : IconComponent ? (
        <IconComponent className={cn('mb-6', sizeClass.icon, iconColor)} />
      ) : null}

      {/* Titre */}
      <h3
        className={cn(
          'font-semibold text-gray-900 dark:text-gray-100 mb-2',
          sizeClass.title
        )}
      >
        {displayTitle}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p
          className={cn(
            'text-gray-600 dark:text-gray-400 mb-6',
            sizeClass.description
          )}
        >
          {displayDescription}
        </p>
      )}

      {/* Actions */}
      {(action || (secondaryActions && secondaryActions.length > 0)) && (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Action principale */}
          {action && (
            <Button
              variant={action.variant || 'primary'}
              onClick={action.onClick}
              className="min-w-[140px]"
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              {action.label}
            </Button>
          )}

          {/* Actions secondaires */}
          {secondaryActions && secondaryActions.map((secAction, index) => (
            <Button
              key={index}
              variant={secAction.variant || 'outline'}
              onClick={secAction.onClick}
              className="min-w-[140px]"
            >
              {secAction.icon && <span className="mr-2">{secAction.icon}</span>}
              {secAction.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
};

// Variantes pré-configurées pour usage rapide
export const EmptyStateNoData: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState variant="no-data" {...props} />
);

export const EmptyStateNoResults: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState variant="no-results" {...props} />
);

export const EmptyStateError: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState variant="error" {...props} />
);

export const EmptyStateSuccess: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState variant="success" {...props} />
);

export const EmptyStateUpload: React.FC<Omit<EmptyStateProps, 'variant'>> = (props) => (
  <EmptyState variant="upload" {...props} />
);

export default EmptyState;
