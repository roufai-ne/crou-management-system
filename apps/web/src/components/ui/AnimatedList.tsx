/**
 * FICHIER: apps\web\src\components\ui\AnimatedList.tsx
 * COMPOSANT: AnimatedList - Liste avec animations stagger
 *
 * DESCRIPTION:
 * Composant pour animer l'apparition de listes et grids
 * Effet stagger élégant (items apparaissent un par un)
 * Idéal pour dashboards, tables, cartes
 *
 * FONCTIONNALITÉS:
 * - Stagger automatique
 * - Variantes d'animation
 * - Support grid et list
 * - Délais configurables
 * - Re-animation au changement
 *
 * USAGE:
 * <AnimatedList>
 *   {items.map(item => (
 *     <Card key={item.id}>{item.content}</Card>
 *   ))}
 * </AnimatedList>
 *
 * <AnimatedGrid columns={3}>
 *   {cards.map(card => <KPICard key={card.id} {...card} />)}
 * </AnimatedGrid>
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  staggerItem,
  staggerItemScale
} from '@/utils/animations';

// Types
export type StaggerSpeed = 'fast' | 'normal' | 'slow';
export type AnimationVariant = 'fade' | 'scale' | 'slideUp' | 'slideLeft';

export interface AnimatedListProps {
  /** Items de la liste (children) */
  children: React.ReactNode;

  /** Vitesse du stagger */
  speed?: StaggerSpeed;

  /** Variante d'animation */
  variant?: AnimationVariant;

  /** Classe CSS du container */
  className?: string;

  /** Désactiver l'animation */
  disabled?: boolean;

  /** Layout (flex, grid) */
  layout?: 'flex' | 'grid';

  /** Nombre de colonnes (si grid) */
  columns?: number;

  /** Gap entre items */
  gap?: string;
}

// Container variants selon la vitesse
const containerVariants = {
  fast: staggerContainerFast,
  normal: staggerContainer,
  slow: staggerContainerSlow
};

// Item variants selon la variante d'animation
const itemVariants = {
  fade: staggerItem,
  scale: staggerItemScale,
  slideUp: staggerItem,
  slideLeft: {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring', stiffness: 400, damping: 30 }
    }
  }
};

export const AnimatedList: React.FC<AnimatedListProps> = ({
  children,
  speed = 'normal',
  variant = 'fade',
  className,
  disabled = false,
  layout = 'flex',
  columns,
  gap = '1rem'
}) => {
  // Si désactivé, rendu normal
  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  const gridStyle = layout === 'grid' && columns
    ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap
      }
    : undefined;

  const flexStyle = layout === 'flex'
    ? {
        display: 'flex',
        flexDirection: 'column' as const,
        gap
      }
    : undefined;

  return (
    <motion.div
      variants={containerVariants[speed]}
      initial="hidden"
      animate="visible"
      className={className}
      style={gridStyle || flexStyle}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={itemVariants[variant]}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

// Variante pour grids (plus pratique)
export const AnimatedGrid: React.FC<{
  children: React.ReactNode;
  columns?: number;
  speed?: StaggerSpeed;
  variant?: AnimationVariant;
  className?: string;
  gap?: string;
}> = ({ children, columns = 3, speed = 'normal', variant = 'scale', className, gap = '1.5rem' }) => {
  return (
    <AnimatedList
      layout="grid"
      columns={columns}
      speed={speed}
      variant={variant}
      gap={gap}
      className={className}
    >
      {children}
    </AnimatedList>
  );
};

// Variante pour KPI grids (preset)
export const KPIGrid: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <AnimatedGrid
      columns={4}
      speed="fast"
      variant="scale"
      gap="1.5rem"
      className={cn('grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', className)}
    >
      {children}
    </AnimatedGrid>
  );
};

// Wrapper pour items individuels avec index delay
export const AnimatedItem: React.FC<{
  children: React.ReactNode;
  index?: number;
  delay?: number;
  className?: string;
}> = ({ children, index = 0, delay = 0.1, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * delay,
        type: 'spring',
        stiffness: 400,
        damping: 30
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Table avec stagger rows
export const AnimatedTable: React.FC<{
  children: React.ReactNode;
  className?: string;
  speed?: StaggerSpeed;
}> = ({ children, className, speed = 'fast' }) => {
  return (
    <motion.table
      variants={containerVariants[speed]}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.table>
  );
};

export const AnimatedTableRow: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <motion.tr variants={staggerItem} className={className}>
      {children}
    </motion.tr>
  );
};

export default AnimatedList;
