/**
 * FICHIER: apps\web\src\components\ui\ProgressCircle.tsx
 * COMPOSANT: ProgressCircle - Cercle de progression / Jauge
 *
 * DESCRIPTION:
 * Composant de progression circulaire animé
 * Idéal pour KPIs, objectifs, taux de complétion
 * Animation fluide avec Framer Motion
 *
 * FONCTIONNALITÉS:
 * - Progression animée (0-100%)
 * - Gradients de couleur
 * - Tailles multiples
 * - Affichage valeur/label
 * - Support semi-cercle (gauge)
 * - Couleurs dynamiques selon seuils
 *
 * USAGE:
 * <ProgressCircle value={75} size="lg" showValue />
 * <ProgressCircle value={85} variant="success" label="Objectif" />
 * <ProgressGauge value={60} max={100} />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useEffect, useState } from 'react';
import { motion, useSpring } from 'framer-motion';
import { cn } from '@/utils/cn';

// Types
export type ProgressVariant = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'gradient';
export type ProgressSize = 'sm' | 'md' | 'lg' | 'xl';

export interface ProgressCircleProps {
  /** Valeur actuelle (0-100) */
  value: number;

  /** Valeur maximum (défaut 100) */
  max?: number;

  /** Variante de couleur */
  variant?: ProgressVariant;

  /** Taille */
  size?: ProgressSize;

  /** Épaisseur de la ligne */
  strokeWidth?: number;

  /** Afficher la valeur au centre */
  showValue?: boolean;

  /** Label à afficher */
  label?: string;

  /** Afficher pourcentage */
  showPercentage?: boolean;

  /** Durée de l'animation (secondes) */
  duration?: number;

  /** Classe CSS additionnelle */
  className?: string;

  /** Couleur de fond du cercle */
  trackColor?: string;

  /** Gradient personnalisé */
  gradient?: [string, string];
}

// Configuration des tailles
const sizeConfig = {
  sm: {
    size: 64,
    strokeWidth: 4,
    fontSize: 'text-xs',
    labelSize: 'text-[10px]'
  },
  md: {
    size: 96,
    strokeWidth: 6,
    fontSize: 'text-sm',
    labelSize: 'text-xs'
  },
  lg: {
    size: 128,
    strokeWidth: 8,
    fontSize: 'text-lg',
    labelSize: 'text-sm'
  },
  xl: {
    size: 160,
    strokeWidth: 10,
    fontSize: 'text-2xl',
    labelSize: 'text-base'
  }
};

// Configuration des couleurs
const variantConfig = {
  primary: {
    stroke: '#3b82f6',
    gradient: ['#3b82f6', '#2563eb']
  },
  success: {
    stroke: '#10b981',
    gradient: ['#10b981', '#059669']
  },
  danger: {
    stroke: '#ef4444',
    gradient: ['#ef4444', '#dc2626']
  },
  warning: {
    stroke: '#f59e0b',
    gradient: ['#f59e0b', '#d97706']
  },
  info: {
    stroke: '#0ea5e9',
    gradient: ['#0ea5e9', '#0284c7']
  },
  gradient: {
    stroke: 'url(#progressGradient)',
    gradient: ['#3b82f6', '#10b981']
  }
};

export const ProgressCircle: React.FC<ProgressCircleProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  strokeWidth: customStrokeWidth,
  showValue = true,
  label,
  showPercentage = true,
  duration = 1,
  className,
  trackColor = 'rgba(156, 163, 175, 0.2)',
  gradient: customGradient
}) => {
  const config = sizeConfig[size];
  const variantColors = variantConfig[variant];
  const strokeWidth = customStrokeWidth || config.strokeWidth;

  // Calculer le pourcentage
  const percentage = Math.min((value / max) * 100, 100);

  // Animation spring pour la progression
  const progress = useSpring(0, {
    stiffness: 50,
    damping: 20
  });

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    progress.set(percentage);

    const unsubscribe = progress.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return unsubscribe;
  }, [percentage, progress]);

  // Calculer le cercle SVG
  const radius = (config.size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (displayValue / 100) * circumference;

  // Gradient ID unique
  const gradientId = `progressGradient-${Math.random().toString(36).substr(2, 9)}`;
  const gradientColors = customGradient || variantColors.gradient;

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: config.size, height: config.size }}>
        <svg
          width={config.size}
          height={config.size}
          viewBox={`0 0 ${config.size} ${config.size}`}
          className="transform -rotate-90"
        >
          {/* Gradient definition */}
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={gradientColors[0]} />
              <stop offset="100%" stopColor={gradientColors[1]} />
            </linearGradient>
          </defs>

          {/* Background circle (track) */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={variant === 'gradient' ? `url(#${gradientId})` : variantColors.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration, ease: 'easeOut' }}
          />
        </svg>

        {/* Center content */}
        {showValue && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className={cn('font-bold text-gray-900 dark:text-gray-100', config.fontSize)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              {showPercentage ? `${displayValue}%` : displayValue}
            </motion.span>
            {label && (
              <motion.span
                className={cn('text-gray-600 dark:text-gray-400 mt-1', config.labelSize)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {label}
              </motion.span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Variante Gauge (semi-cercle)
export interface ProgressGaugeProps extends Omit<ProgressCircleProps, 'showPercentage'> {
  /** Afficher les markers de seuils */
  showMarkers?: boolean;
}

export const ProgressGauge: React.FC<ProgressGaugeProps> = ({
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  strokeWidth: customStrokeWidth,
  showValue = true,
  label,
  duration = 1,
  className,
  trackColor = 'rgba(156, 163, 175, 0.2)',
  showMarkers = true
}) => {
  const config = sizeConfig[size];
  const variantColors = variantConfig[variant];
  const strokeWidth = customStrokeWidth || config.strokeWidth;

  const percentage = Math.min((value / max) * 100, 100);

  const progress = useSpring(0, {
    stiffness: 50,
    damping: 20
  });

  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    progress.set(percentage);

    const unsubscribe = progress.on('change', (latest) => {
      setDisplayValue(Math.round(latest));
    });

    return unsubscribe;
  }, [percentage, progress]);

  const radius = (config.size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // Semi-cercle
  const offset = circumference - (displayValue / 100) * circumference;

  const gradientId = `gaugeGradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: config.size, height: config.size / 2 + 20 }}>
        <svg
          width={config.size}
          height={config.size / 2 + 20}
          viewBox={`0 0 ${config.size} ${config.size / 2 + 20}`}
          className="overflow-visible"
        >
          <defs>
            <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={variantColors.gradient[0]} />
              <stop offset="100%" stopColor={variantColors.gradient[1]} />
            </linearGradient>
          </defs>

          {/* Background arc */}
          <path
            d={`M ${strokeWidth / 2} ${config.size / 2} A ${radius} ${radius} 0 0 1 ${
              config.size - strokeWidth / 2
            } ${config.size / 2}`}
            stroke={trackColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />

          {/* Progress arc */}
          <motion.path
            d={`M ${strokeWidth / 2} ${config.size / 2} A ${radius} ${radius} 0 0 1 ${
              config.size - strokeWidth / 2
            } ${config.size / 2}`}
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration, ease: 'easeOut' }}
          />

          {/* Markers */}
          {showMarkers && [0, 25, 50, 75, 100].map((marker) => {
            const angle = (marker / 100) * Math.PI;
            const x = config.size / 2 + radius * Math.cos(angle - Math.PI);
            const y = config.size / 2 + radius * Math.sin(angle - Math.PI);
            return (
              <circle
                key={marker}
                cx={x}
                cy={y}
                r={2}
                fill="currentColor"
                className="text-gray-400"
              />
            );
          })}
        </svg>

        {/* Center value */}
        {showValue && (
          <div className="absolute left-1/2 bottom-0 -translate-x-1/2 flex flex-col items-center">
            <motion.span
              className={cn('font-bold text-gray-900 dark:text-gray-100', config.fontSize)}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              {displayValue}%
            </motion.span>
            {label && (
              <motion.span
                className={cn('text-gray-600 dark:text-gray-400', config.labelSize)}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {label}
              </motion.span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Variante avec segments colorés selon seuils
export const ProgressCircleThreshold: React.FC<
  ProgressCircleProps & {
    thresholds?: { value: number; color: string }[];
  }
> = ({ value, max = 100, thresholds, ...props }) => {
  const percentage = (value / max) * 100;

  // Déterminer la couleur selon les seuils
  let variant: ProgressVariant = 'primary';
  if (thresholds) {
    for (const threshold of thresholds.sort((a, b) => a.value - b.value)) {
      if (percentage >= threshold.value) {
        variant = threshold.color as ProgressVariant;
      }
    }
  }

  return <ProgressCircle value={value} max={max} variant={variant} {...props} />;
};

export default ProgressCircle;
