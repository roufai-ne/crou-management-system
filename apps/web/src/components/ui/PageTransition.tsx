/**
 * FICHIER: apps\web\src\components\ui\PageTransition.tsx
 * COMPOSANT: PageTransition - Wrapper pour transitions de pages
 *
 * DESCRIPTION:
 * Composant wrapper pour animer les changements de pages
 * Utilise Framer Motion pour transitions fluides
 * Améliore la perception de performance
 *
 * FONCTIONNALITÉS:
 * - Fade in/out automatique
 * - Slide transitions
 * - Scale transitions
 * - Variantes personnalisables
 *
 * USAGE:
 * // Wrapper la page
 * <PageTransition>
 *   <DashboardPage />
 * </PageTransition>
 *
 * // Avec variante
 * <PageTransition variant="slide">
 *   <FinancialPage />
 * </PageTransition>
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { pageTransition, pageSlide, fadeIn, scaleIn } from '@/utils/animations';

// Types
export type PageTransitionVariant = 'fade' | 'slide' | 'scale' | 'slideUp';

export interface PageTransitionProps {
  /** Contenu de la page */
  children: React.ReactNode;

  /** Variante de transition */
  variant?: PageTransitionVariant;

  /** Classe CSS additionnelle */
  className?: string;

  /** Désactiver la transition */
  disabled?: boolean;
}

// Variantes de transition
const variants = {
  fade: fadeIn,
  slide: pageSlide,
  scale: scaleIn,
  slideUp: pageTransition
};

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  variant = 'slideUp',
  className,
  disabled = false
}) => {
  const location = useLocation();

  if (disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={variants[variant]}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Wrapper pour sections de page
export const SectionTransition: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
}> = ({ children, delay = 0, className }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
