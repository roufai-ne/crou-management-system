/**
 * FICHIER: apps\web\src\components\ui\Sparkline.tsx
 * COMPOSANT: Sparkline - Mini graphique de tendance
 *
 * DESCRIPTION:
 * Composant de mini graphique SVG pour afficher des tendances
 * Optimisé pour les KPI cards et visualisations compactes
 * Support des gradients, animations et interactions
 *
 * FONCTIONNALITÉS:
 * - Graphique ligne simple et performant
 * - Gradients de remplissage (area chart)
 * - Animation d'entrée fluide
 * - Tooltip sur hover (optionnel)
 * - Variantes de couleur
 * - Auto-scaling des données
 *
 * USAGE:
 * <Sparkline
 *   data={[12, 19, 3, 5, 2, 3, 15, 21]}
 *   color="primary"
 *   showArea
 *   showTooltip
 * />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useMemo, useState } from 'react';
import { cn } from '@/utils/cn';

// Types
export type SparklineColor = 'primary' | 'success' | 'danger' | 'warning' | 'info' | 'gray';
export type SparklineType = 'line' | 'area' | 'bar';

export interface SparklineProps {
  /** Données du graphique (array de nombres) */
  data: number[];

  /** Couleur du graphique */
  color?: SparklineColor;

  /** Type de graphique */
  type?: SparklineType;

  /** Afficher l'aire sous la courbe */
  showArea?: boolean;

  /** Afficher le gradient */
  showGradient?: boolean;

  /** Afficher les points */
  showDots?: boolean;

  /** Afficher le tooltip au hover */
  showTooltip?: boolean;

  /** Largeur du trait */
  strokeWidth?: number;

  /** Hauteur du composant (CSS) */
  height?: string | number;

  /** Largeur du composant (CSS) */
  width?: string | number;

  /** Classe CSS additionnelle */
  className?: string;

  /** Animation activée */
  animate?: boolean;

  /** Formatter pour tooltip */
  formatValue?: (value: number) => string;

  /** Labels pour tooltip (optionnel) */
  labels?: string[];
}

// Configuration des couleurs
const colorConfig: Record<SparklineColor, { stroke: string; fill: string; gradient: string }> = {
  primary: {
    stroke: '#3b82f6',
    fill: 'rgba(59, 130, 246, 0.2)',
    gradient: 'url(#gradient-primary)'
  },
  success: {
    stroke: '#10b981',
    fill: 'rgba(16, 185, 129, 0.2)',
    gradient: 'url(#gradient-success)'
  },
  danger: {
    stroke: '#ef4444',
    fill: 'rgba(239, 68, 68, 0.2)',
    gradient: 'url(#gradient-danger)'
  },
  warning: {
    stroke: '#f59e0b',
    fill: 'rgba(245, 158, 11, 0.2)',
    gradient: 'url(#gradient-warning)'
  },
  info: {
    stroke: '#0ea5e9',
    fill: 'rgba(14, 165, 233, 0.2)',
    gradient: 'url(#gradient-info)'
  },
  gray: {
    stroke: '#6b7280',
    fill: 'rgba(107, 114, 128, 0.2)',
    gradient: 'url(#gradient-gray)'
  }
};

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  color = 'primary',
  type = 'line',
  showArea = false,
  showGradient = true,
  showDots = false,
  showTooltip = false,
  strokeWidth = 2,
  height = 48,
  width = '100%',
  className,
  animate = true,
  formatValue = (val) => val.toString(),
  labels
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Calculer les points du graphique
  const { points, areaPath, max, min, range } = useMemo(() => {
    if (!data || data.length === 0) {
      return { points: [], areaPath: '', max: 0, min: 0, range: 0 };
    }

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1; // Éviter division par zéro

    const viewBoxWidth = 100;
    const viewBoxHeight = 100;
    const padding = 5;

    // Calculer les points
    const points = data.map((value, index) => {
      const x = padding + (index / (data.length - 1)) * (viewBoxWidth - padding * 2);
      const y = viewBoxHeight - padding - ((value - min) / range) * (viewBoxHeight - padding * 2);
      return { x, y, value, index };
    });

    // Générer le path pour la ligne
    const linePath = points
      .map((point, i) => `${i === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');

    // Générer le path pour l'aire (si showArea)
    let areaPath = '';
    if (showArea) {
      const bottomLeft = `L ${points[0].x} ${viewBoxHeight - padding}`;
      const bottomRight = `L ${points[points.length - 1].x} ${viewBoxHeight - padding}`;
      areaPath = `${linePath} ${bottomRight} ${bottomLeft} Z`;
    }

    return { points, linePath, areaPath, max, min, range };
  }, [data, showArea]);

  const colors = colorConfig[color];
  const heightPx = typeof height === 'number' ? `${height}px` : height;
  const widthPx = typeof width === 'number' ? `${width}px` : width;

  if (!data || data.length === 0) {
    return (
      <div
        className={cn('flex items-center justify-center text-gray-400', className)}
        style={{ height: heightPx, width: widthPx }}
      >
        <span className="text-xs">No data</span>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} style={{ height: heightPx, width: widthPx }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Définitions des gradients */}
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.5} />
            <stop offset="100%" stopColor={colors.stroke} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Aire sous la courbe */}
        {showArea && areaPath && (
          <path
            d={areaPath}
            fill={showGradient ? colors.gradient : colors.fill}
            className={animate ? 'animate-fade-in' : ''}
          />
        )}

        {/* Ligne principale */}
        <polyline
          points={points.map(p => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? 'animate-fade-in' : ''}
          style={animate ? {
            strokeDasharray: 1000,
            strokeDashoffset: 1000,
            animation: 'drawLine 1s ease-out forwards'
          } : undefined}
        />

        {/* Points */}
        {showDots && points.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={hoveredIndex === index ? 2.5 : 1.5}
            fill={colors.stroke}
            className="transition-all duration-200"
            onMouseEnter={() => showTooltip && setHoveredIndex(index)}
            onMouseLeave={() => showTooltip && setHoveredIndex(null)}
          />
        ))}

        {/* Zones interactives invisibles pour tooltip */}
        {showTooltip && points.map((point, index) => (
          <rect
            key={`tooltip-${index}`}
            x={point.x - 5}
            y={0}
            width={10}
            height={100}
            fill="transparent"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="cursor-pointer"
          />
        ))}
      </svg>

      {/* Tooltip */}
      {showTooltip && hoveredIndex !== null && (
        <div
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2
                     bg-gray-900/90 dark:bg-gray-100/90 backdrop-blur-sm
                     text-white dark:text-gray-900 text-xs font-medium
                     px-2 py-1 rounded shadow-lg whitespace-nowrap
                     pointer-events-none z-10"
        >
          {labels?.[hoveredIndex] && (
            <div className="text-gray-300 dark:text-gray-600">
              {labels[hoveredIndex]}
            </div>
          )}
          <div>{formatValue(data[hoveredIndex])}</div>
        </div>
      )}

      {/* CSS pour l'animation de dessin */}
      <style>{`
        @keyframes drawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
};

// Composant wrapper pour faciliter l'utilisation avec les tendances
export interface TrendSparklineProps extends Omit<SparklineProps, 'color'> {
  /** Direction de tendance (auto-détecte la couleur) */
  trend?: 'up' | 'down' | 'stable';
}

export const TrendSparkline: React.FC<TrendSparklineProps> = ({
  trend,
  data,
  ...props
}) => {
  // Auto-détection de la tendance si non fournie
  const detectedTrend = useMemo(() => {
    if (trend) return trend;
    if (!data || data.length < 2) return 'stable';

    const first = data[0];
    const last = data[data.length - 1];
    const change = ((last - first) / first) * 100;

    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }, [data, trend]);

  // Mapper la tendance vers une couleur
  const colorMap: Record<string, SparklineColor> = {
    up: 'success',
    down: 'danger',
    stable: 'gray'
  };

  return (
    <Sparkline
      data={data}
      color={colorMap[detectedTrend]}
      {...props}
    />
  );
};

export default Sparkline;
