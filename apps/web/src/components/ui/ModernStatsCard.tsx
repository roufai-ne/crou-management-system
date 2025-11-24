import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModernStatsCardProps {
  title: string;
  value: string | number;
  change?: number; // Pourcentage de changement
  changeLabel?: string;
  icon?: LucideIcon;
  iconColor?: string;
  sparklineData?: number[]; // Données pour le mini-graphique
  variant?: 'default' | 'gradient-crou';
  className?: string;
}

export function ModernStatsCard({
  title,
  value,
  change,
  changeLabel = 'vs mois dernier',
  icon: Icon,
  iconColor = 'text-primary-600',
  sparklineData,
  variant = 'default',
  className,
}: ModernStatsCardProps) {
  // Déterminer l'icône de tendance
  const getTrendIcon = () => {
    if (change === undefined || change === 0) {
      return Minus;
    }
    return change > 0 ? TrendingUp : TrendingDown;
  };

  const TrendIcon = getTrendIcon();

  // Déterminer la couleur de la tendance
  const getTrendColor = () => {
    if (change === undefined || change === 0) {
      return 'text-gray-500';
    }
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  // Générer le chemin SVG pour le sparkline
  const generateSparklinePath = () => {
    if (!sparklineData || sparklineData.length === 0) return '';

    const max = Math.max(...sparklineData);
    const min = Math.min(...sparklineData);
    const range = max - min || 1;

    const width = 120;
    const height = 40;
    const points = sparklineData.length;

    const path = sparklineData
      .map((value, index) => {
        const x = (index / (points - 1)) * width;
        const y = height - ((value - min) / range) * height;
        return `${index === 0 ? 'M' : 'L'} ${x},${y}`;
      })
      .join(' ');

    return path;
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-6 transition-all',
        'hover:shadow-lg',
        variant === 'default' && [
          'border-gray-200 bg-white',
          'hover:border-primary-300',
        ],
        variant === 'gradient-crou' && [
          'border-transparent',
          'bg-gradient-to-br from-primary-50 via-white to-secondary-50',
          'hover:shadow-xl',
        ],
        className
      )}
    >
      {/* Header avec icône */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>

        {Icon && (
          <div
            className={cn(
              'p-3 rounded-lg',
              variant === 'default' && 'bg-primary-50',
              variant === 'gradient-crou' && 'bg-white/50 backdrop-blur-sm'
            )}
          >
            <Icon className={cn('w-6 h-6', iconColor)} strokeWidth={2} />
          </div>
        )}
      </div>

      {/* Tendance */}
      {change !== undefined && (
        <div className="flex items-center gap-2 mb-3">
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold',
              change > 0 && 'bg-green-100 text-green-700',
              change < 0 && 'bg-red-100 text-red-700',
              change === 0 && 'bg-gray-100 text-gray-700'
            )}
          >
            <TrendIcon className="w-3 h-3" strokeWidth={2.5} />
            <span>
              {change > 0 && '+'}
              {change}%
            </span>
          </div>
          <span className="text-xs text-gray-500">{changeLabel}</span>
        </div>
      )}

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-4">
          <svg
            width="120"
            height="40"
            className="w-full h-10"
            preserveAspectRatio="none"
            viewBox="0 0 120 40"
          >
            {/* Gradient pour le fill */}
            <defs>
              <linearGradient id={`sparkline-gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Zone remplie */}
            <path
              d={`${generateSparklinePath()} L 120,40 L 0,40 Z`}
              fill={`url(#sparkline-gradient-${title})`}
            />

            {/* Ligne */}
            <path
              d={generateSparklinePath()}
              fill="none"
              stroke={change && change < 0 ? '#dc2626' : '#059669'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Effet de brillance pour gradient-crou */}
      {variant === 'gradient-crou' && (
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

export default ModernStatsCard;
