/**
 * FICHIER: apps\web\src\utils\animations.ts
 * UTILITAIRES: Animations Framer Motion
 *
 * DESCRIPTION:
 * Configurations et variantes d'animations réutilisables
 * Basées sur Framer Motion pour animations fluides
 * Cohérence des animations dans toute l'app
 *
 * USAGE:
 * import { fadeIn, slideUp, scaleIn } from '@/utils/animations';
 *
 * <motion.div variants={fadeIn} initial="hidden" animate="visible" />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { Variants, Transition } from 'framer-motion';

// ===========================
// TRANSITIONS PRÉDÉFINIES
// ===========================

export const transitions = {
  // Transition spring rapide
  spring: {
    type: 'spring',
    stiffness: 400,
    damping: 30
  } as Transition,

  // Transition spring douce
  springGentle: {
    type: 'spring',
    stiffness: 200,
    damping: 20
  } as Transition,

  // Transition spring bouncy
  springBouncy: {
    type: 'spring',
    stiffness: 500,
    damping: 15
  } as Transition,

  // Transition ease rapide
  easeQuick: {
    duration: 0.2,
    ease: 'easeOut'
  } as Transition,

  // Transition ease normale
  ease: {
    duration: 0.3,
    ease: 'easeInOut'
  } as Transition,

  // Transition ease lente
  easeSlow: {
    duration: 0.5,
    ease: 'easeInOut'
  } as Transition
};

// ===========================
// VARIANTES BASIQUES
// ===========================

// Fade In/Out
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.ease }
};

export const fadeOut: Variants = {
  visible: { opacity: 1 },
  hidden: { opacity: 0, transition: transitions.ease }
};

// Slide Up (depuis le bas)
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: transitions.spring }
};

// Slide Down (depuis le haut)
export const slideDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: { opacity: 1, y: 0, transition: transitions.spring }
};

// Slide Left (depuis la droite)
export const slideLeft: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: transitions.spring }
};

// Slide Right (depuis la gauche)
export const slideRight: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: transitions.spring }
};

// Scale In
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: transitions.springGentle }
};

// Scale Out
export const scaleOut: Variants = {
  visible: { opacity: 1, scale: 1 },
  hidden: { opacity: 0, scale: 0.8, transition: transitions.ease }
};

// Rotate In
export const rotateIn: Variants = {
  hidden: { opacity: 0, rotate: -10 },
  visible: { opacity: 1, rotate: 0, transition: transitions.spring }
};

// ===========================
// VARIANTES AVANCÉES
// ===========================

// Fade + Slide Up (combiné)
export const fadeSlideUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.spring, delay: 0.1 }
  }
};

// Scale + Fade (pour modals)
export const modalVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.springGentle
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transitions.easeQuick
  }
};

// Drawer (slide from side)
export const drawerVariants: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: transitions.spring
  },
  exit: {
    x: '100%',
    transition: transitions.easeQuick
  }
};

// Collapse (hauteur)
export const collapseVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { ...transitions.ease, height: { duration: 0.3 } }
  }
};

// ===========================
// STAGGER ANIMATIONS
// ===========================

// Container pour stagger children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

// Container stagger rapide
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0
    }
  }
};

// Container stagger lent
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.2
    }
  }
};

// Item pour stagger (fade + slide)
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.spring
  }
};

// Item pour stagger (scale)
export const staggerItemScale: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transitions.springBouncy
  }
};

// ===========================
// HOVER & TAP ANIMATIONS
// ===========================

export const hoverTap = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: transitions.spring
};

export const hoverLift = {
  whileHover: {
    y: -4,
    boxShadow: '0 12px 24px rgba(0, 0, 0, 0.15)'
  },
  transition: transitions.ease
};

export const hoverGlow = (color: string = 'rgba(59, 130, 246, 0.3)') => ({
  whileHover: {
    boxShadow: `0 0 20px ${color}`
  },
  transition: transitions.ease
});

export const tapShrink = {
  whileTap: { scale: 0.95 },
  transition: transitions.spring
};

// ===========================
// PAGE TRANSITIONS
// ===========================

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { ...transitions.ease, delay: 0.1 }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: transitions.easeQuick
  }
};

export const pageSlide: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: {
    opacity: 1,
    x: 0,
    transition: transitions.spring
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: transitions.easeQuick
  }
};

// ===========================
// SPECIAL EFFECTS
// ===========================

// Shake (erreur)
export const shake = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: { duration: 0.5 }
  }
};

// Pulse (attention)
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2 }
  }
};

// Bounce
export const bounce = {
  animate: {
    y: [0, -10, 0],
    transition: { repeat: Infinity, duration: 1, ease: 'easeInOut' }
  }
};

// Spin (loading)
export const spin = {
  animate: {
    rotate: 360,
    transition: { repeat: Infinity, duration: 1, ease: 'linear' }
  }
};

// ===========================
// UTILITY FUNCTIONS
// ===========================

// Créer délai pour stagger manuel
export const createDelay = (index: number, baseDelay: number = 0.1) => ({
  transition: { delay: index * baseDelay }
});

// Créer variante avec délai
export const withDelay = (variants: Variants, delay: number): Variants => {
  return {
    ...variants,
    visible: {
      ...(variants.visible as any),
      transition: {
        ...(variants.visible as any).transition,
        delay
      }
    }
  };
};

// Combiner plusieurs variantes
export const combineVariants = (...variantsList: Variants[]): Variants => {
  return variantsList.reduce((acc, variants) => ({
    ...acc,
    ...variants
  }), {});
};

// Export par défaut
export default {
  transitions,
  fadeIn,
  fadeOut,
  slideUp,
  slideDown,
  slideLeft,
  slideRight,
  scaleIn,
  scaleOut,
  rotateIn,
  fadeSlideUp,
  modalVariants,
  drawerVariants,
  collapseVariants,
  staggerContainer,
  staggerContainerFast,
  staggerContainerSlow,
  staggerItem,
  staggerItemScale,
  hoverTap,
  hoverLift,
  hoverGlow,
  tapShrink,
  pageTransition,
  pageSlide,
  shake,
  pulse,
  bounce,
  spin,
  createDelay,
  withDelay,
  combineVariants
};
