/**
 * FICHIER: apps\web\src\components\ui\Card.tsx
 * COMPOSANT: Card - Famille de composants carte du système de design CROU
 * 
 * DESCRIPTION:
 * Famille de composants carte pour organiser le contenu
 * Avec en-têtes, corps, pieds de page et actions
 * Support des variantes et états pour différents contextes CROU
 * 
 * FONCTIONNALITÉS:
 * - Card de base avec variantes (elevated, outlined, filled)
 * - CardHeader avec titre, sous-titre et actions
 * - CardBody pour le contenu principal
 * - CardFooter pour les actions et informations
 * - CardActions pour les boutons d'action
 * - Cartes spécialisées (StatCard, InfoCard, ActionCard)
 * - Support des images et médias
 * - États interactifs (hover, focus, selected)
 * - Responsive design et espacement cohérent
 * 
 * VARIANTES:
 * - elevated: Ombre portée pour élévation
 * - outlined: Bordure simple sans ombre
 * - filled: Fond coloré avec contenu contrasté
 * 
 * USAGE:
 * <Card variant="elevated">
 *   <CardHeader
 *     title="Titre de la carte"
 *     subtitle="Sous-titre"
 *     action={<Button>Action</Button>}
 *   />
 *   <CardBody>
 *     Contenu de la carte
 *   </CardBody>
 *   <CardFooter>
 *     <CardActions>
 *       <Button>Annuler</Button>
 *       <Button variant="primary">Confirmer</Button>
 *     </CardActions>
 *   </CardFooter>
 * </Card>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';

// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Types pour les variantes
type CardVariant = 'elevated' | 'outlined' | 'filled';
type CardSize = 'sm' | 'md' | 'lg';

// Fonction pour générer les classes CSS de la carte
const cardVariants = (props: {
  variant?: CardVariant;
  size?: CardSize;
  interactive?: boolean;
  selected?: boolean;
}) => {
  const { variant = 'elevated', size = 'md', interactive = false, selected = false } = props;

  // Classes de base
  const baseClasses = [
    'relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg transition-all duration-200',
    'focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
  ];

  // Classes de variantes
  const variantClasses = {
    elevated: 'shadow-card hover:shadow-card-hover hover:bg-white/90 dark:hover:bg-gray-800/90',
    outlined: 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
    filled: 'bg-gray-50/90 dark:bg-gray-700/90 backdrop-blur-sm border border-gray-200 dark:border-gray-600'
  };

  // Classes de tailles
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  // Classes conditionnelles
  const conditionalClasses = [
    interactive && 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]',
    selected && 'ring-2 ring-primary-500 ring-offset-2'
  ].filter(Boolean);

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    conditionalClasses
  );
};

// Interface des props de la carte de base
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Contenu de la carte */
  children: React.ReactNode;
  
  /** Variante de la carte */
  variant?: CardVariant;
  
  /** Taille de la carte */
  size?: CardSize;
  
  /** Callback de clic */
  onClick?: () => void;
  
  /** État sélectionné */
  selected?: boolean;
  
  /** Classes CSS personnalisées */
  className?: string;
  
  /** Compatibility: numeric spacing used across the codebase (e.g. spacing={2}) */
  spacing?: number | string;
}

// Composant Card de base
type CardComponent = React.FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
  Actions: typeof CardActions;
  Image: typeof CardImage;
  Content: typeof CardBody;
  Title: (props: { children: React.ReactNode; className?: string }) => JSX.Element;
};

const CardBase: React.FC<CardProps> = ({
  children,
  onClick,
  selected = false,
  variant = 'elevated',
  size = 'md',
  className,
  ...props
}) => {
  const isInteractive = !!onClick;

  return (
    <div
      className={cn(
        cardVariants({ 
          variant, 
          size, 
          interactive: isInteractive, 
          selected 
        }),
        className
      )}
      onClick={onClick}
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={isInteractive ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      } : undefined}
      {...props}
    >
      {children}
    </div>
  );
};
const Card = CardBase as CardComponent;

// Composant CardHeader
export interface CardHeaderProps {
  /** Titre principal */
  title?: string;
  
  /** Sous-titre ou description */
  subtitle?: string;
  
  /** Icône à gauche du titre */
  icon?: React.ReactNode;
  
  /** Action à droite (bouton, menu, etc.) */
  action?: React.ReactNode;
  
  /** Avatar ou image */
  avatar?: React.ReactNode;
  
  /** Classes CSS personnalisées */
  className?: string;
  
  /** Classes CSS pour le titre */
  titleClassName?: string;
  
  /** Classes CSS pour le sous-titre */
  subtitleClassName?: string;
  /** Children allow custom header content */
  children?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  icon,
  action,
  avatar,
  className,
  titleClassName,
  subtitleClassName,
  children
}) => {
  // If children provided, render them directly, otherwise render the structured header
  if (children) {
    return (
      <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
        {children}
      </div>
    );
  }

  return (
    <div className={cn('flex items-start justify-between gap-4 mb-4', className)}>
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {avatar && (
          <div className="flex-shrink-0">
            {avatar}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {icon && (
              <span className="flex-shrink-0 text-gray-500 dark:text-gray-400">
                {icon}
              </span>
            )}
            {title && (
              <h3 className={cn(
                'text-lg font-semibold text-gray-900 dark:text-gray-100 truncate',
                titleClassName
              )}>
                {title}
              </h3>
            )}
          </div>
          
          {subtitle && (
            <p className={cn(
              'mt-1 text-sm text-gray-600 dark:text-gray-400',
              subtitleClassName
            )}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      
      {action && (
        <div className="flex-shrink-0">
          {action}
        </div>
      )}
    </div>
  );
};

// Composant CardBody
export interface CardBodyProps {
  /** Contenu du corps */
  children: React.ReactNode;
  
  /** Espacement personnalisé */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  
  /** Classes CSS personnalisées */
  className?: string;
}

export const CardBody: React.FC<CardBodyProps> = ({
  children,
  spacing = 'md',
  className
}) => {
  const spacingClasses = {
    none: '',
    sm: 'mb-3',
    md: 'mb-4',
    lg: 'mb-6'
  };

  return (
    <div className={cn(spacingClasses[spacing], className)}>
      {children}
    </div>
  );
};

// Composant CardFooter
export interface CardFooterProps {
  /** Contenu du pied de page */
  children: React.ReactNode;
  
  /** Alignement du contenu */
  align?: 'left' | 'center' | 'right' | 'between';
  
  /** Classes CSS personnalisées */
  className?: string;
}

export const CardFooter: React.FC<CardFooterProps> = ({
  children,
  align = 'right',
  className
}) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={cn(
      'flex items-center pt-4 border-t border-gray-200 dark:border-gray-700',
      alignClasses[align],
      className
    )}>
      {children}
    </div>
  );
};

// Attach subcomponents to Card for compatibility with usages like <Card.Header>
// (subcomponents attached at the end of the file after all declarations)


// Composant CardActions pour les boutons d'action
export interface CardActionsProps {
  /** Boutons d'action */
  children: React.ReactNode;
  
  /** Espacement entre les boutons */
  spacing?: 'sm' | 'md' | 'lg';
  
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Classes CSS personnalisées */
  className?: string;
}

export const CardActions: React.FC<CardActionsProps> = ({
  children,
  spacing = 'md',
  orientation = 'horizontal',
  className
}) => {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'gap-2' : 'gap-1',
    md: orientation === 'horizontal' ? 'gap-3' : 'gap-2',
    lg: orientation === 'horizontal' ? 'gap-4' : 'gap-3'
  };
  
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col'
  };

  return (
    <div className={cn(
      'flex',
      orientationClasses[orientation],
      spacingClasses[spacing],
      className
    )}>
      {children}
    </div>
  );
};

// Composant CardImage pour les images
export interface CardImageProps {
  /** Source de l'image */
  src: string;
  
  /** Texte alternatif */
  alt: string;
  
  /** Position de l'image */
  position?: 'top' | 'bottom' | 'left' | 'right';
  
  /** Ratio d'aspect */
  aspectRatio?: 'square' | 'video' | 'wide' | 'tall';
  
  /** Classes CSS personnalisées */
  className?: string;
}

export const CardImage: React.FC<CardImageProps> = ({
  src,
  alt,
  position = 'top',
  aspectRatio = 'video',
  className
}) => {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    wide: 'aspect-[21/9]',
    tall: 'aspect-[3/4]'
  };
  
  const positionClasses = {
    top: 'rounded-t-lg',
    bottom: 'rounded-b-lg',
    left: 'rounded-l-lg',
    right: 'rounded-r-lg'
  };

  return (
    <div className={cn(
      'overflow-hidden',
      aspectRatioClasses[aspectRatio],
      positionClasses[position],
      className
    )}>
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
      />
    </div>
  );
};

// Composant StatCard pour les statistiques
export interface StatCardProps extends Omit<CardProps, 'children'> {
  /** Titre de la statistique */
  title: string;
  
  /** Valeur principale */
  value: string | number;
  
  /** Changement ou tendance */
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period?: string;
  };
  
  /** Icône */
  icon?: React.ReactNode;
  
  /** Description */
  description?: string;
  
  /** Couleur de l'icône */
  iconColor?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  description,
  iconColor,
  className,
  ...props
}) => {
  const changeColors = {
    increase: 'text-success-600 dark:text-success-400',
    decrease: 'text-danger-600 dark:text-danger-400',
    neutral: 'text-gray-600 dark:text-gray-400'
  };

  return (
    <Card className={cn('p-6', className)} {...props}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {value}
          </p>
          
          {change && (
            <div className="flex items-center gap-1">
              <span className={cn('text-sm font-medium', changeColors[change.type])}>
                {change.type === 'increase' ? '+' : change.type === 'decrease' ? '-' : ''}
                {Math.abs(change.value)}%
              </span>
              {change.period && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {change.period}
                </span>
              )}
            </div>
          )}
          
          {description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {description}
            </p>
          )}
        </div>
        
        {icon && (
          <div className={cn(
            'flex-shrink-0 p-3 rounded-lg',
            iconColor || 'bg-primary-100 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
};

// Composant InfoCard pour les informations
export interface InfoCardProps {
  /** Titre */
  title: string;
  
  /** Contenu */
  content: React.ReactNode;
  
  /** Type d'information */
  type?: 'info' | 'success' | 'warning' | 'error';
  
  /** Icône */
  icon?: React.ReactNode;
  
  /** Action optionnelle */
  action?: React.ReactNode;
  
  /** Affichage compact */
  compact?: boolean;
  
  /** Classes CSS personnalisées */
  className?: string;
}

export const InfoCard: React.FC<InfoCardProps> = ({
  title,
  content,
  type = 'info',
  icon,
  action,
  compact = false,
  className,
  ...props
}) => {
  const typeColors = {
    info: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
    success: 'border-success-200 bg-success-50 dark:border-success-800 dark:bg-success-900/20',
    warning: 'border-warning-200 bg-warning-50 dark:border-warning-800 dark:bg-warning-900/20',
    error: 'border-danger-200 bg-danger-50 dark:border-danger-800 dark:bg-danger-900/20'
  };
  
  const iconColors = {
    info: 'text-blue-600 dark:text-blue-400',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    error: 'text-danger-600 dark:text-danger-400'
  };

  return (
    <Card 
      variant="outlined"
      className={cn(
        typeColors[type],
        compact ? 'p-4' : 'p-6',
        className
      )}
      {...props}
    >
      <div className="flex items-start gap-3">
        {icon && (
          <div className={cn('flex-shrink-0', iconColors[type])}>
            {icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            'font-semibold text-gray-900 dark:text-gray-100',
            compact ? 'text-sm mb-1' : 'text-base mb-2'
          )}>
            {title}
          </h3>
          
          <div className={cn(
            'text-gray-700 dark:text-gray-300',
            compact ? 'text-sm' : 'text-base'
          )}>
            {content}
          </div>
        </div>
        
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </Card>
  );
};

// Composant ActionCard pour les actions
export interface ActionCardProps extends Omit<CardProps, 'children'> {
  /** Titre de l'action */
  title: string;
  
  /** Description */
  description?: string;
  
  /** Icône */
  icon?: React.ReactNode;
  
  /** Bouton d'action principal */
  primaryAction?: React.ReactNode;
  
  /** Actions secondaires */
  secondaryActions?: React.ReactNode[];
  
  /** État de chargement */
  loading?: boolean;
  
  /** État désactivé */
  disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  title,
  description,
  icon,
  primaryAction,
  secondaryActions,
  loading = false,
  disabled = false,
  className,
  ...props
}) => {
  return (
    <Card 
      className={cn(
        'p-6',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10 rounded-lg">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            {icon}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            {title}
          </h3>
          
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {description}
            </p>
          )}
          
          <div className="flex items-center gap-3">
            {primaryAction}
            
            {secondaryActions && secondaryActions.length > 0 && (
              <div className="flex items-center gap-2">
                {secondaryActions.map((action, index) => (
                  <React.Fragment key={index}>
                    {action}
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

// Alias pour compatibilité
export const CardContent = CardBody;
export const CardTitle = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-gray-100', className)} {...props}>
    {children}
  </h3>
);


// Export des types et composants
export { cardVariants };

// Attach subcomponents for convenient namespace usage (Card.Header, Card.Body, ...)
(Card as any).Header = CardHeader;
(Card as any).Body = CardBody;
(Card as any).Footer = CardFooter;
(Card as any).Actions = CardActions;
(Card as any).Image = CardImage;
(Card as any).Content = CardContent;
(Card as any).Title = CardTitle;

export default Card;
// Also export named Card for consumers importing { Card }
export { Card }; // <-- Cette ligne est correcte pour l'exportation nommée
