/**
 * FICHIER: apps\web\src\components\ui\Layout.tsx
 * COMPOSANT: Layout - Composants de mise en page
 * 
 * DESCRIPTION:
 * Système complet de composants de mise en page pour l'application CROU
 * Grid responsive, conteneurs, espacement et utilitaires flexbox
 * Design mobile-first avec breakpoints optimisés
 * 
 * COMPOSANTS:
 * - Container: Conteneur avec largeur maximale
 * - Grid: Système de grille responsive 12 colonnes
 * - Stack: Empilage vertical/horizontal avec espacement
 * - Section: Sections avec en-têtes et variantes
 * - Divider: Séparateurs avec texte et orientations
 * - Spacer: Espacement flexible et responsive
 * - Flex: Utilitaire flexbox avec toutes options
 * 
 * USAGE:
 * <Container size="lg">
 *   <Grid cols={3} gap={4}>
 *     <div>Colonne 1</div>
 *     <div>Colonne 2</div>
 *     <div>Colonne 3</div>
 *   </Grid>
 * </Container>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';

// Minimal, well-typed layout utilities to replace corrupted file.

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
  as?: keyof JSX.IntrinsicElements;
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = 'lg', padding = true, as = 'div', className, ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full'
    } as const;

    const paddingClasses = padding ? 'px-4 sm:px-6 lg:px-8' : '';
    const Component = as as any;

    return (
      <Component ref={ref} className={cn('mx-auto', sizeClasses[size], paddingClasses, className)} {...props}>
        {children}
      </Component>
    );
  }
);
Container.displayName = 'Container';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: number | 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** Responsive shorthand to allow legacy usages like responsive={{ sm: 1, md: 2 }} */
  responsive?: Record<string, number>;
}

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(({ children, cols = 1, gap = 'md', className, ...props }, ref) => {
  const colsMap: Record<NonNullable<GridProps['cols']>, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    12: 'grid-cols-12'
  };

  const gapMap: Record<string, string> = {
    none: 'gap-0',
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
    xl: 'gap-8',
    0: 'gap-0',
    1: 'gap-1',
    2: 'gap-2',
    3: 'gap-3',
    4: 'gap-4',
    5: 'gap-5',
    6: 'gap-6',
    8: 'gap-8'
  };

  return (
    <div ref={ref} className={cn('grid', colsMap[cols], gapMap[String(gap)], className)} {...props}>
      {children}
    </div>
  );
});
Grid.displayName = 'Grid';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  direction?: 'row' | 'col';
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around';
  gap?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  /** numeric spacing compatibility (e.g. spacing={2}) */
  spacing?: number | string;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(({ children, direction = 'col', align = 'start', justify = 'start', gap = 'md', className, ...props }, ref) => {
  const directionMap = { row: 'flex-row', col: 'flex-col' } as const;
  const alignMap = { start: 'items-start', center: 'items-center', end: 'items-end', stretch: 'items-stretch' } as const;
  const justifyMap = { start: 'justify-start', center: 'justify-center', end: 'justify-end', between: 'justify-between', around: 'justify-around' } as const;
  const gapMap = { none: 'gap-0', sm: 'gap-2', md: 'gap-4', lg: 'gap-6', xl: 'gap-8' } as const;

  return (
    <div ref={ref} className={cn('flex', directionMap[direction], alignMap[align], justifyMap[justify], gapMap[gap], className)} {...props}>
      {children}
    </div>
  );
});
Stack.displayName = 'Stack';

export interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'muted' | 'accent' | 'filled' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  spacing?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  as?: keyof JSX.IntrinsicElements;
}

export const Section = React.forwardRef<HTMLElement, SectionProps>(({ children, title, description, actions, variant = 'default', padding = 'md', spacing = 'md', as = 'section', className, ...props }, ref) => {
  const Component = as as any;
  const variantMap = { 
    default: 'bg-white dark:bg-gray-900', 
    muted: 'bg-gray-50 dark:bg-gray-800', 
    accent: 'bg-primary-50',
    filled: 'bg-gray-100 dark:bg-gray-800',
    bordered: 'border border-gray-200 dark:border-gray-700',
    elevated: 'shadow-sm bg-white dark:bg-gray-900'
  } as const;
  const paddingMap = { none: '', sm: 'py-4', md: 'py-8', lg: 'py-12', xl: 'py-16' } as const;
  const spacingMap = { none: '', sm: 'space-y-4', md: 'space-y-6', lg: 'space-y-8', xl: 'space-y-12' } as const;

  return (
    <Component ref={ref} className={cn('w-full', variantMap[variant], paddingMap[padding], spacingMap[spacing], className)} {...props}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between mb-6">
          <div>
            {title && <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>}
            {description && <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </Component>
  );
});
Section.displayName = 'Section';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  color?: 'gray' | 'primary';
}

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(({ orientation = 'horizontal', size = 'sm', color = 'gray', className, ...props }, ref) => {
  const orientationMap = { horizontal: 'border-t w-full', vertical: 'border-l h-full' } as const;
  const sizeMap = { sm: 'border-t', md: 'border-t-2', lg: 'border-t-4' } as const;
  const colorMap = { gray: 'border-gray-200', primary: 'border-primary-200' } as const;

  return <div ref={ref} className={cn(orientationMap[orientation], orientation === 'horizontal' ? sizeMap[size] : '', colorMap[color], className)} {...props} />;
});
Divider.displayName = 'Divider';

// Types déjà exportés avec les interfaces ci-dessus

// Export par défaut du Container (le plus utilisé)
export default Container;
