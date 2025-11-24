/**
 * FICHIER: apps/web/src/components/ui/ModernKPICard.tsx
 * COMPOSANT: ModernKPICard - Carte KPI moderne avec design CROU Niger
 * 
 * DESCRIPTION:
 * Version modernisée du KPICard avec identité visuelle Niger
 * Intègre gradients CROU, glow effects et icônes Lucide
 * Design premium avec icône décorative en background
 * 
 * NOUVEAUTÉS SPRINT 1:
 * - IconDecorative en background avec gradient
 * - IconWithBackground pour badge principal avec glow
 * - Gradient CROU sur les valeurs importantes
 * - Mini indicateurs de tendance avec Lucide
 * - Hover effects avec scale et shadow
 * - Animations fluides
 * 
 * USAGE:
 * <ModernKPICard
 *   title="Total Étudiants"
 *   value={1245}
 *   icon={Users}
 *   trend={{ direction: 'up', value: 12, label: 'vs mois dernier' }}
 *   variant="gradient-crou"
 * />
 * 
 * AUTEUR: Équipe CROU - Sprint 1 Design
 * DATE: Novembre 2025
 */

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { IconWrapper, IconWithBackground, IconDecorative } from './IconWrapper';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';

// Types
export type KPITrendDirection = 'up' | 'down' | 'stable';
export type KPIValueType = 'currency' | 'number' | 'percentage';
export type KPIVariant = 'primary' | 'accent' | 'success' | 'info' | 'gradient-crou' | 'gradient-primary' | 'gradient-accent';

export interface ModernKPITrend {
  direction: KPITrendDirection;
  value: number | string;
  label?: string;
}

export interface ModernKPICardProps {
  /** Titre de la carte */
  title: string;
  
  /** Valeur principale */
  value: number | string;
  
  /** Type de valeur pour formatage */
  valueType?: KPIValueType;
  
  /** Icône Lucide à afficher */
  icon: LucideIcon;
  
  /** Variante de couleur/gradient */
  variant?: KPIVariant;
  
  /** Informations de tendance */
  trend?: ModernKPITrend;
  
  /** Activer l'effet glow */
  glow?: boolean;
  
  /** Callback de clic */
  onClick?: () => void;
  
  /** Classes CSS personnalisées */
  className?: string;
  
  /** État de chargement */
  loading?: boolean;
}

/**
 * Composant ModernKPICard
 * Carte KPI moderne avec design CROU Niger
 */
export const ModernKPICard: React.FC<ModernKPICardProps> = ({
  title,
  value,
  valueType = 'number',
  icon,
  variant = 'primary',
  trend,
  glow = true,
  onClick,
  className,
  loading = false
}) => {
  
  // Formatage de la valeur
  const formatValue = (val: number | string): string => {
    if (typeof val === 'string') return val;
    
    switch (valueType) {
      case 'currency':
        return formatCurrency(val);
      case 'percentage':
        return `${val}%`;
      case 'number':
      default:
        return val.toLocaleString('fr-FR');
    }
  };
  
  // Icône de tendance
  const getTrendIcon = (): LucideIcon => {
    if (!trend) return Minus;
    switch (trend.direction) {
      case 'up': return TrendingUp;
      case 'down': return TrendingDown;
      default: return Minus;
    }
  };
  
  // Variante de couleur pour la tendance
  const getTrendVariant = (): 'success' | 'danger' | 'default' => {
    if (!trend) return 'default';
    switch (trend.direction) {
      case 'up': return 'success';
      case 'down': return 'danger';
      default: return 'default';
    }
  };
  
  // Classe de gradient pour la valeur
  const getValueGradientClass = (): string => {
    switch (variant) {
      case 'gradient-crou':
        return 'bg-gradient-crou bg-clip-text text-transparent';
      case 'gradient-primary':
        return 'bg-gradient-primary bg-clip-text text-transparent';
      case 'gradient-accent':
        return 'bg-gradient-accent bg-clip-text text-transparent';
      default:
        return 'text-gray-900 dark:text-white';
    }
  };
  
  return (
    <div
      className={cn(
        'relative bg-white dark:bg-gray-800 rounded-xl shadow-card overflow-hidden',
        'transition-all duration-200',
        'hover:shadow-card-hover',
        onClick && 'cursor-pointer hover:scale-[1.02]',
        'group',
        className
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex items-center justify-center z-20">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent"></div>
        </div>
      )}
      
      {/* Icône décorative en background avec gradient */}
      <IconDecorative 
        icon={icon} 
        size={140}
        opacity={0.05}
        gradient={true}
        className="top-4 right-4"
      />
      
      {/* Contenu */}
      <div className="relative z-10 p-6">
        {/* Badge icône avec glow */}
        <div className="mb-4">
          <IconWithBackground 
            icon={icon} 
            size="lg"
            background={variant}
            rounded="lg"
            glow={glow}
            className="transition-transform duration-200 group-hover:scale-110"
          />
        </div>
        
        {/* Titre */}
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          {title}
        </h3>
        
        {/* Valeur principale avec gradient optionnel */}
        <div className={cn(
          'text-3xl font-bold mb-3',
          getValueGradientClass()
        )}>
          {formatValue(value)}
        </div>
        
        {/* Indicateur de tendance */}
        {trend && (
          <div className="flex items-center gap-1.5 text-sm">
            <IconWrapper 
              icon={getTrendIcon()} 
              size="sm" 
              variant={getTrendVariant()}
              strokeWidth={2.5}
            />
            <span className={cn(
              'font-medium',
              trend.direction === 'up' && 'text-success-600 dark:text-success-400',
              trend.direction === 'down' && 'text-danger-600 dark:text-danger-400',
              trend.direction === 'stable' && 'text-gray-600 dark:text-gray-400'
            )}>
              {trend.value}
            </span>
            {trend.label && (
              <span className="text-gray-500 dark:text-gray-400 ml-1">
                {trend.label}
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Effet glow en hover (optionnel) */}
      {glow && (
        <div className={cn(
          'absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none',
          variant === 'gradient-crou' && 'shadow-card-glow-crou',
          variant === 'gradient-primary' && 'shadow-card-glow-green',
          variant === 'gradient-accent' && 'shadow-card-glow-orange'
        )} />
      )}
    </div>
  );
};

/**
 * Composant ModernKPIGrid
 * Grille responsive pour afficher plusieurs ModernKPICard
 */
export interface ModernKPIGridProps {
  cards: ModernKPICardProps[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const ModernKPIGrid: React.FC<ModernKPIGridProps> = ({
  cards,
  columns = 4,
  className
}) => {
  const gridClass = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }[columns];
  
  return (
    <div className={cn(
      'grid gap-6',
      gridClass,
      className
    )}>
      {cards.map((card, index) => (
        <ModernKPICard key={index} {...card} />
      ))}
    </div>
  );
};

export default ModernKPICard;
