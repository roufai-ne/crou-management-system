/**
 * FICHIER: apps\web\src\components\ui\NumberCounter.tsx
 * COMPOSANT: NumberCounter - Compteur animé de nombres
 *
 * DESCRIPTION:
 * Composant pour animer les transitions de nombres
 * Utilise Framer Motion pour animations fluides
 * Idéal pour KPIs, statistiques, compteurs
 *
 * FONCTIONNALITÉS:
 * - Animation de comptage (count-up)
 * - Support des nombres décimaux
 * - Formatage automatique (devise, pourcentage, etc.)
 * - Durée et easing configurables
 * - Support des préfixes/suffixes
 *
 * USAGE:
 * <NumberCounter value={1250000} format="currency" />
 * <NumberCounter value={85.5} format="percentage" decimals={1} />
 * <NumberCounter value={1234} duration={2} />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';

// Types
export type NumberFormat = 'number' | 'currency' | 'percentage' | 'compact';

export interface NumberCounterProps {
  /** Valeur à afficher */
  value: number;

  /** Format du nombre */
  format?: NumberFormat;

  /** Nombre de décimales */
  decimals?: number;

  /** Durée de l'animation (secondes) */
  duration?: number;

  /** Préfixe (ex: "+", "$") */
  prefix?: string;

  /** Suffixe (ex: "%", "FCFA") */
  suffix?: string;

  /** Animer le changement */
  animate?: boolean;

  /** Classe CSS additionnelle */
  className?: string;

  /** Direction de changement (pour couleur) */
  direction?: 'up' | 'down' | 'neutral';

  /** Afficher la direction avec icône */
  showDirection?: boolean;
}

// Formattage selon le type
const formatNumber = (
  value: number,
  format: NumberFormat,
  decimals: number = 0
): string => {
  switch (format) {
    case 'currency':
      return formatCurrency(value);

    case 'percentage':
      return value.toFixed(decimals);

    case 'compact':
      // Formatage compact (1.2K, 1.5M, etc.)
      if (value >= 1000000000) {
        return (value / 1000000000).toFixed(decimals) + 'B';
      }
      if (value >= 1000000) {
        return (value / 1000000).toFixed(decimals) + 'M';
      }
      if (value >= 1000) {
        return (value / 1000).toFixed(decimals) + 'K';
      }
      return value.toFixed(decimals);

    case 'number':
    default:
      return value.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      });
  }
};

export const NumberCounter: React.FC<NumberCounterProps> = ({
  value,
  format = 'number',
  decimals = 0,
  duration = 1,
  prefix = '',
  suffix = '',
  animate = true,
  className,
  direction,
  showDirection = false
}) => {
  const prevValueRef = useRef(value);

  // Spring animation pour le compteur
  const spring = useSpring(prevValueRef.current, {
    stiffness: 100,
    damping: 30,
    duration: duration * 1000
  });

  // Transform le spring en string formaté
  const display = useTransform(spring, (current) =>
    formatNumber(current, format, decimals)
  );

  // Update la valeur quand elle change
  useEffect(() => {
    if (animate) {
      spring.set(value);
      prevValueRef.current = value;
    } else {
      spring.set(value);
      spring.stop();
    }
  }, [value, animate, spring]);

  // Couleur selon direction
  const directionColor = direction
    ? direction === 'up'
      ? 'text-success-600 dark:text-success-400'
      : direction === 'down'
      ? 'text-danger-600 dark:text-danger-400'
      : ''
    : '';

  return (
    <span className={cn('inline-flex items-center gap-1', directionColor, className)}>
      {/* Icône de direction */}
      {showDirection && direction && direction !== 'neutral' && (
        <motion.svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 20 }}
        >
          {direction === 'up' ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          )}
        </motion.svg>
      )}

      {/* Préfixe */}
      {prefix && <span className="opacity-70">{prefix}</span>}

      {/* Nombre animé */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {display}
      </motion.span>

      {/* Suffixe */}
      {suffix && <span className="opacity-70">{suffix}</span>}

      {/* Suffixe pour pourcentage */}
      {format === 'percentage' && !suffix && (
        <span className="opacity-70">%</span>
      )}

      {/* Suffixe pour devise FCFA */}
      {format === 'currency' && !suffix && (
        <span className="text-sm opacity-70 ml-1">FCFA</span>
      )}
    </span>
  );
};

// Composant wrapper pour changement de valeur avec highlight
export const NumberCounterHighlight: React.FC<
  NumberCounterProps & { highlightDuration?: number }
> = ({ highlightDuration = 1000, ...props }) => {
  const [isChanging, setIsChanging] = React.useState(false);
  const prevValue = useRef(props.value);

  useEffect(() => {
    if (prevValue.current !== props.value) {
      setIsChanging(true);
      prevValue.current = props.value;

      const timeout = setTimeout(() => {
        setIsChanging(false);
      }, highlightDuration);

      return () => clearTimeout(timeout);
    }
  }, [props.value, highlightDuration]);

  return (
    <motion.span
      animate={{
        backgroundColor: isChanging
          ? 'rgba(59, 130, 246, 0.1)'
          : 'rgba(0, 0, 0, 0)'
      }}
      transition={{ duration: 0.3 }}
      className="inline-block px-2 py-1 rounded"
    >
      <NumberCounter {...props} />
    </motion.span>
  );
};

// Composant pour compteur simple avec animation scale
export const NumberPulse: React.FC<{ value: number; className?: string }> = ({
  value,
  className
}) => {
  return (
    <motion.span
      key={value}
      initial={{ scale: 1.3, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={className}
    >
      {value.toLocaleString('fr-FR')}
    </motion.span>
  );
};

// Composant pour badge avec compteur
export const CounterBadge: React.FC<{
  count: number;
  max?: number;
  variant?: 'primary' | 'danger' | 'success' | 'warning';
  className?: string;
}> = ({ count, max, variant = 'primary', className }) => {
  const displayCount = max && count > max ? `${max}+` : count.toString();

  const variantClasses = {
    primary: 'bg-primary-600 text-white',
    danger: 'bg-danger-600 text-white',
    success: 'bg-success-600 text-white',
    warning: 'bg-warning-600 text-white'
  };

  return (
    <motion.span
      key={count}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      exit={{ scale: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className={cn(
        'inline-flex items-center justify-center',
        'min-w-[20px] h-5 px-1.5 rounded-full',
        'text-xs font-semibold',
        variantClasses[variant],
        className
      )}
    >
      {displayCount}
    </motion.span>
  );
};

export default NumberCounter;
