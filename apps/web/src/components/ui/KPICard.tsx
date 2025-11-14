/**
 * FICHIER: apps\web\src\components\ui\KPICard.tsx
 * COMPOSANT: KPICard - Composant carte KPI du système de design CROU
 * 
 * DESCRIPTION:
 * Composant carte pour afficher les indicateurs de performance clés (KPI)
 * Avec indicateurs de tendance, progression et comparaisons
 * Optimisé pour les données financières et opérationnelles CROU
 * 
 * FONCTIONNALITÉS:
 * - Affichage de valeurs avec formatage automatique
 * - Indicateurs de tendance (hausse, baisse, stable)
 * - Barres de progression pour objectifs
 * - Comparaisons période précédente
 * - Variantes de couleur selon performance
 * - Animations et transitions fluides
 * - Support des devises FCFA
 * - États de chargement et erreur
 * 
 * TYPES DE KPI:
 * - currency: Montants en FCFA
 * - number: Nombres avec formatage français
 * - percentage: Pourcentages avec indicateurs
 * - count: Compteurs simples
 * - custom: Rendu personnalisé
 * 
 * USAGE:
 * <KPICard
 *   title="Chiffre d'affaires"
 *   value={125000}
 *   type="currency"
 *   trend={{ direction: 'up', value: 12.5, period: 'vs mois dernier' }}
 *   target={{ current: 125000, target: 150000 }}
 * />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;
import {
  ArrowUpIcon,
  ArrowDownIcon,
  MinusIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';
import { TrendSparkline } from './Sparkline';

// Types pour les tendances
export type TrendDirection = 'up' | 'down' | 'stable';

export interface KPITrend {
  /** Direction de la tendance */
  direction: TrendDirection;

  /** Valeur de la tendance (pourcentage ou valeur absolue) */
  value: number;

  /** Période de comparaison */
  period?: string;

  /** Type de valeur (percentage ou absolute) */
  valueType?: 'percentage' | 'absolute';

  /** Inverser la signification des couleurs (ex: coûts) */
  inverse?: boolean;

  /** Données pour sparkline (array de valeurs historiques) */
  sparklineData?: number[];

  /** Labels pour sparkline tooltip */
  sparklineLabels?: string[];
}

// Types pour les objectifs/cibles
export interface KPITarget {
  /** Valeur actuelle */
  current: number;
  
  /** Valeur cible */
  target: number;
  
  /** Libellé de l'objectif */
  label?: string;
  
  /** Afficher la barre de progression */
  showProgress?: boolean;
}

// Types de données KPI
export type KPIType = 'currency' | 'number' | 'percentage' | 'count' | 'custom';

// Types pour les variantes
type KPICardVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger';
type KPICardSize = 'sm' | 'md' | 'lg';

// Fonction pour générer les classes CSS de la carte KPI
const kpiCardVariants = (props: {
  variant?: KPICardVariant;
  size?: KPICardSize;
  clickable?: boolean;
}) => {
  const { variant = 'default', size = 'md', clickable = false } = props;

  // Classes de base
  const baseClasses = [
    'relative overflow-hidden rounded-lg border transition-all duration-200',
    'hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2'
  ];

  // Classes de variantes
  const variantClasses = {
    'default': 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
    primary: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800',
    success: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800',
    warning: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800',
    danger: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
  };

  // Classes de tailles
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  // Classes conditionnelles
  const conditionalClasses = [
    clickable && 'cursor-pointer hover:scale-[1.02]'
  ].filter(Boolean);

  return cn(
    baseClasses,
    variantClasses[variant],
    sizeClasses[size],
    conditionalClasses
  );
};

// Fonction pour générer les classes CSS des indicateurs de tendance
const trendVariants = (props: {
  direction?: TrendDirection;
  inverse?: boolean;
}) => {
  const { direction = 'stable', inverse = false } = props;

  // Classes de base
  const baseClasses = 'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium';

  // Classes de direction
  const directionClasses = {
    up: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400',
    down: 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400',
    stable: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  };

  // Classes inversées pour les métriques où la baisse est positive (ex: coûts)
  const inverseClasses = {
    up: 'bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400',
    down: 'bg-success-100 text-success-800 dark:bg-success-900/20 dark:text-success-400',
    stable: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  };

  return cn(
    baseClasses,
    inverse ? inverseClasses[direction] : directionClasses[direction]
  );
};

// Interface des props principales
export interface KPICardProps extends VariantProps<typeof kpiCardVariants> {
  /** Titre du KPI */
  title: string;
  
  /** Valeur principale */
  value: number | string;
  
  /** Type de données pour le formatage */
  type?: KPIType;
  
  /** Description ou sous-titre */
  description?: string;
  
  /** Informations de tendance */
  trend?: KPITrend;
  
  /** Informations d'objectif/cible */
  target?: KPITarget;
  
  /** Icône personnalisée */
  icon?: React.ReactNode;
  
  /** Couleur de l'icône */
  iconColor?: string;
  
  /** Fonction de rendu personnalisé pour la valeur */
  renderValue?: (value: number | string) => React.ReactNode;
  
  /** État de chargement */
  loading?: boolean;
  
  /** Message d'erreur */
  error?: string;
  
  /** Callback de clic */
  onClick?: () => void;
  
  /** Informations supplémentaires */
  metadata?: Array<{
    label: string;
    value: string | number;
    type?: KPIType;
  }>;
  
  /** Classes CSS personnalisées */
  className?: string;
  
  /** ID pour l'accessibilité */
  id?: string;
}

// Composant principal KPICard
export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  type = 'number',
  description,
  trend,
  target,
  icon,
  iconColor,
  renderValue,
  loading = false,
  error,
  onClick,
  metadata,
  variant = 'default',
  size = 'md',
  className,
  id,
  ...props
}) => {
  // Formatage de la valeur selon le type
  const formatValue = (val: number | string | null | undefined, dataType: KPIType = type): string => {
    if (val === null || val === undefined) {
      return '-';
    }

    if (typeof val === 'string') return val;
    
    switch (dataType) {
      case 'currency':
        return typeof val === 'number' ? formatCurrency(val) : '-';
      case 'percentage':
        return typeof val === 'number' ? `${val.toFixed(1)}%` : '-%';
      case 'number':
        return typeof val === 'number' ? val.toLocaleString('fr-FR') : '-';
      case 'count':
        return typeof val === 'number' ? String(val) : '-';
      default:
        return String(val);
    }
  };
  
  // Rendu de l'icône de tendance
  const renderTrendIcon = (direction: TrendDirection) => {
    const iconClass = "h-3 w-3";
    
    switch (direction) {
      case 'up':
        return <ArrowUpIcon className={iconClass} />;
      case 'down':
        return <ArrowDownIcon className={iconClass} />;
      case 'stable':
        return <MinusIcon className={iconClass} />;
  default:
        return null;
    }
  };
  
  // Calcul du pourcentage de progression
  const progressPercentage = target && typeof target.current === 'number' && typeof target.target === 'number' && target.target > 0
    ? Math.min((target.current / target.target) * 100, 100)
    : 0;
  
  // Détermination de la variante selon la performance
  const getPerformanceVariant = (): typeof variant => {
    if (error) return 'danger';
    if (target) {
      const ratio = target.current / target.target;
      if (ratio >= 1) return 'success';
      if (ratio >= 0.8) return 'warning';
      if (ratio < 0.5) return 'danger';
    }
    return variant;
  };
  
  const performanceVariant = getPerformanceVariant();

  return (
    <div
      id={id}
      className={cn(
        kpiCardVariants({ 
          variant: performanceVariant, 
          size, 
          clickable: !!onClick 
        }),
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      {...props}
    >
      {/* Indicateur de chargement */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
        </div>
      )}
      
      {/* En-tête avec titre et icône */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        
        {icon && (
          <div className={cn(
            'flex-shrink-0 p-2.5 rounded-xl shadow-soft',
            'bg-gradient-to-br transition-all duration-200',
            'hover:shadow-md hover:scale-105',
            iconColor || 'from-primary-500 to-primary-600 text-white'
          )}>
            {icon}
          </div>
        )}
      </div>
      
      {/* Valeur principale */}
      <div className="mb-4">
        {error ? (
          <div className="flex items-center gap-2 text-danger-600 dark:text-danger-400">
            <ExclamationTriangleIcon className="h-5 w-5" />
            <span className="text-sm">{error}</span>
          </div>
        ) : (
          <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {renderValue ? renderValue(value) : formatValue(value)}
          </div>
        )}
      </div>
      
      {/* Indicateur de tendance */}
      {trend && !error && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={cn(trendVariants({
              direction: trend.direction,
              inverse: trend.inverse
            }))}>
              {renderTrendIcon(trend.direction)}
              {trend.valueType === 'percentage' ? `${trend.value}%` : formatValue(trend.value)}
            </span>
            {trend.period && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {trend.period}
              </span>
            )}
          </div>

          {/* Sparkline si données disponibles */}
          {trend.sparklineData && trend.sparklineData.length > 0 && (
            <TrendSparkline
              data={trend.sparklineData}
              trend={trend.direction}
              showArea
              showGradient
              height={40}
              animate
              formatValue={formatValue}
              labels={trend.sparklineLabels}
              showTooltip
            />
          )}
        </div>
      )}

      {/* Barre de progression pour les objectifs */}
      {target && target.showProgress !== false && !error && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
            <span>{target.label || 'Objectif'}</span>
            <span>{formatValue(target.current)} / {formatValue(target.target)}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                progressPercentage >= 100 ? 'bg-success-500' :
                progressPercentage >= 80 ? 'bg-warning-500' : 'bg-primary-500'
              )}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {progressPercentage.toFixed(1)}% de l'objectif atteint
          </div>
        </div>
      )}
      
      {/* Métadonnées supplémentaires */}
      {metadata && metadata.length > 0 && !error && (
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <div className="grid grid-cols-2 gap-4">
            {metadata.map((item, index) => (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {item.label}
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatValue(item.value, item.type)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Composant KPIGrid pour organiser plusieurs KPI
export interface KPIGridProps {
  /** Liste des KPI à afficher */
  kpis?: (KPICardProps & { key?: string })[];
  /** Compat: ancien nom de prop */
  data?: (KPICardProps & { key?: string })[];
  
  /** Nombre de colonnes */
  columns?: 1 | 2 | 3 | 4;
  /** Compat: ancien nom de prop */
  cols?: 1 | 2 | 3 | 4;
  
  /** Espacement entre les cartes */
  gap?: 'sm' | 'md' | 'lg';

  /** Compat: responsive legacy (ignoré si columns utilisé) */
  responsive?: Record<string, number>;
  
  /** Classes CSS personnalisées */
  className?: string;
}

export const KPIGrid: React.FC<KPIGridProps> = ({
  kpis,
  data,
  columns = 3,
  cols,
  gap = 'md',
  className
}) => {
  const gridColumns = (cols ?? columns) as 1 | 2 | 3 | 4;
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };
  
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  const items = (kpis ?? data ?? []).map((item, index) => ({
    key: item.key ?? `${index}`,
    ...item
  }));

  return (
    <div className={cn(
      'grid',
      gridClasses[gridColumns],
      gapClasses[gap],
      className
    )}>
      {items.map(({ key, ...kpiProps }) => (
        <KPICard key={key} {...kpiProps} />
      ))}
    </div>
  );
};

// Composant KPIComparison pour comparer plusieurs périodes
export interface KPIComparisonProps {
  /** Titre de la comparaison */
  title: string;
  
  /** Données de comparaison */
  data: Array<{
    period: string;
    value: number;
    type?: KPIType;
    trend?: Omit<KPITrend, 'period'>;
  }>;
  
  /** Type de données */
  type?: KPIType;
  
  /** Période principale (mise en évidence) */
  primaryPeriod?: string;
  
  /** Classes CSS personnalisées */
  className?: string;
}

export const KPIComparison: React.FC<KPIComparisonProps> = ({
  title,
  data,
  type = 'number',
  primaryPeriod,
  className
}) => {
  const formatValue = (val: number, dataType: KPIType = type): string => {
    switch (dataType) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val.toFixed(1)}%`;
      case 'number':
        return val.toLocaleString('fr-FR');
      case 'count':
        return val.toString();
  default:
        return val.toString();
    }
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6',
      className
    )}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <ChartBarIcon className="h-5 w-5 text-primary-600" />
        {title}
      </h3>
      
      <div className="space-y-4">
        {data.map((item, index) => {
          const isPrimary = primaryPeriod === item.period;
          
          return (
            <div
              key={index}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                isPrimary 
                  ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                  : 'bg-gray-50 dark:bg-gray-700'
              )}
            >
              <div>
                <div className={cn(
                  'font-medium',
                  isPrimary 
                    ? 'text-primary-900 dark:text-primary-100'
                    : 'text-gray-900 dark:text-gray-100'
                )}>
                  {item.period}
                </div>
                <div className={cn(
                  'text-lg font-bold',
                  isPrimary 
                    ? 'text-primary-700 dark:text-primary-300'
                    : 'text-gray-700 dark:text-gray-300'
                )}>
                  {formatValue(item.value, item.type || type)}
                </div>
              </div>
              
              {item.trend && (
                <div className={cn(trendVariants({ 
                  direction: item.trend.direction,
                  inverse: item.trend.inverse
                }))}>
                  {item.trend.direction === 'up' && <ArrowUpIcon className="h-3 w-3" />}
                  {item.trend.direction === 'down' && <ArrowDownIcon className="h-3 w-3" />}
                  {item.trend.direction === 'stable' && <MinusIcon className="h-3 w-3" />}
                  {item.trend.valueType === 'percentage' ? `${item.trend.value}%` : formatValue(item.trend.value)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Export des types et composants
export { kpiCardVariants, trendVariants };
export type { KPIType, KPITrend, KPITarget };
export default KPICard;
