/**
 * FICHIER: apps\web\src\components\ui\Charts.tsx
 * COMPOSANT: Charts - Composants de visualisation de données
 * * DESCRIPTION:
 * Suite complète de graphiques pour l'application CROU
 * Basé sur Recharts avec thème personnalisé et formatage FCFA
 * Responsive et accessible avec interactions tactiles
 * * COMPOSANTS:
 * - LineChart: Graphiques linéaires pour évolutions temporelles
 * - BarChart: Graphiques en barres avec orientations
 * - PieChart: Graphiques secteurs avec pourcentages
 * - AreaChart: Graphiques aires avec empilage
 * - GaugeChart: Jauges de performance avec segments
 * * FONCTIONNALITÉS:
 * - Formattage automatique FCFA
 * - Thème CROU intégré
 * - Tooltips personnalisés
 * - Export PNG/SVG
 * - Responsive design
 * - Accessibilité complète
 * * USAGE:
 * <LineChart
 * data={data}
 * xKey="date"
 * lines={[{ key: 'budget', name: 'Budget', color: '#2563eb' }]}
 * formatCurrency
 * />
 * * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  AreaChart as RechartsAreaChart,
  Line,
  Bar,
  Pie,
  Area,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { cn } from '@/utils/cn';
import { formatCurrency } from '@/utils/formatters';

// Couleurs du thème CROU
export const CHART_COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#dc2626',
  info: '#0ea5e9',
  gray: '#6b7280',
  purple: '#9333ea',
  pink: '#ec4899',
  indigo: '#6366f1',
  teal: '#14b8a6'
} as const;

// Palette de couleurs pour les séries multiples
export const CHART_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.danger,
  CHART_COLORS.info,
  CHART_COLORS.purple,
  CHART_COLORS.pink,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
  CHART_COLORS.gray
];

// Types de base
export interface ChartDataPoint {
  [key: string]: any;
}

export interface BaseChartProps {
  /** Données du graphique */
  data: ChartDataPoint[];
  
  /** Largeur du graphique */
  width?: number | string;
  
  /** Hauteur du graphique */
  height?: number | string;
  
  /** Marges du graphique */
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  
  /** État de chargement */
  loading?: boolean;
  
  /** Message d'erreur */
  error?: string;
  
  /** Formater les valeurs en FCFA */
  formatCurrency?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** Titre du graphique */
  title?: string;
  
  /** Description du graphique */
  description?: string;
}

// ============================================================================
// COMPOSANTS UTILITAIRES
// ============================================================================

// Tooltip personnalisé
interface ChartTooltipPayload {
  name: string;
  value: number | string;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: ChartTooltipPayload[];
  label?: string | number;
  formatCurrency?: boolean;
  currency?: string;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({
  active,
  payload,
  label,
  formatCurrency: shouldFormatCurrency = false,
  currency = 'FCFA'
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          {label}
        </p>
        {payload.map((entry: ChartTooltipPayload, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-gray-600 dark:text-gray-400">
              {entry.name}:
            </span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {shouldFormatCurrency && typeof entry.value === 'number'
                ? formatCurrency(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Titre de graphique
export interface ChartTitleProps {
  title?: string;
  description?: string;
  className?: string;
}

const ChartTitle: React.FC<ChartTitleProps> = ({ title, description, className }) => {
  if (!title && !description) return null;
  
  return (
    <div className={cn('mb-4', className)}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {description}
        </p>
      )}
    </div>
  );
};

// État de chargement
const ChartLoading: React.FC<{ height?: number | string }> = ({ height = 300 }) => (
  <div
    className="flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg"
    style={{ height }}
  >
    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
      <span className="text-sm">Chargement du graphique...</span>
    </div>
  </div>
);

// État d'erreur
const ChartError: React.FC<{ error: string; height?: number | string }> = ({ 
  error, 
  height = 300 
}) => (
  <div
    className="flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
    style={{ height }}
  >
    <div className="text-center">
      <div className="text-red-600 dark:text-red-400 mb-2">
        <svg className="w-8 h-8 mx-auto" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </div>
      <p className="text-sm text-red-600 dark:text-red-400">
        Erreur de chargement: {error}
      </p>
    </div>
  </div>
);

// ============================================================================
// LINE CHART
// ============================================================================

export interface LineChartProps extends BaseChartProps {
  /** Clé pour l'axe X */
  xKey: string;
  
  /** Configuration des lignes */
  lines: Array<{
    key: string;
    name: string;
    color?: string;
    strokeWidth?: number;
    strokeDasharray?: string;
  }>;
  
  /** Afficher la grille */
  showGrid?: boolean;
  
  /** Afficher la légende */
  showLegend?: boolean;
  
  /** Afficher les points */
  showDots?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  xKey,
  lines,
  width = '100%',
  height = 300,
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  loading = false,
  error,
  formatCurrency: shouldFormatCurrency = false,
  showGrid = true,
  showLegend = true,
  showDots = true,
  className,
  title,
  description
}) => {
  if (loading) return <ChartLoading height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className={cn('w-full', className)}>
      <ChartTitle title={title} description={description} />
      <ResponsiveContainer width={width} height={height}>
        <RechartsLineChart data={data} margin={margin}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-200 dark:stroke-gray-700" 
            />
          )}
          <XAxis 
            dataKey={xKey}
            className="text-xs fill-gray-600 dark:fill-gray-400"
          />
          <YAxis 
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tickFormatter={shouldFormatCurrency ? formatCurrency : undefined}
          />
          <Tooltip 
            content={<CustomTooltip formatCurrency={shouldFormatCurrency} />}
          />
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="line"
            />
          )}
          {lines.map((line, index) => (
            <Line
              key={line.key}
              type="monotone"
              dataKey={line.key}
              name={line.name}
              stroke={line.color || CHART_PALETTE[index % CHART_PALETTE.length]}
              strokeWidth={line.strokeWidth || 2}
              strokeDasharray={line.strokeDasharray}
              dot={showDots ? { r: 4 } : false}
              activeDot={{ r: 6 }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// BAR CHART
// ============================================================================

export interface BarChartProps extends BaseChartProps {
  /** Clé pour l'axe X */
  xKey: string;
  
  /** Configuration des barres */
  bars: Array<{
    key: string;
    name: string;
    color?: string;
    stackId?: string;
  }>;
  
  /** Orientation du graphique */
  orientation?: 'horizontal' | 'vertical';
  
  /** Afficher la grille */
  showGrid?: boolean;
  
  /** Afficher la légende */
  showLegend?: boolean;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  xKey,
  bars,
  width = '100%',
  height = 300,
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  loading = false,
  error,
  formatCurrency: shouldFormatCurrency = false,
  orientation = 'vertical',
  showGrid = true,
  showLegend = true,
  className,
  title,
  description
}) => {
  if (loading) return <ChartLoading height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className={cn('w-full', className)}>
      <ChartTitle title={title} description={description} />
      <ResponsiveContainer width={width} height={height}>
        <RechartsBarChart 
          data={data} 
          margin={margin}
          layout={orientation === 'horizontal' ? 'horizontal' : 'vertical'}
        >
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-200 dark:stroke-gray-700" 
            />
          )}
          <XAxis 
            dataKey={orientation === 'horizontal' ? undefined : xKey}
            type={orientation === 'horizontal' ? 'number' : 'category'}
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tickFormatter={
              orientation === 'horizontal' && shouldFormatCurrency 
                ? formatCurrency 
                : undefined
            }
          />
          <YAxis 
            dataKey={orientation === 'horizontal' ? xKey : undefined}
            type={orientation === 'horizontal' ? 'category' : 'number'}
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tickFormatter={
              orientation === 'vertical' && shouldFormatCurrency 
                ? formatCurrency 
                : undefined
            }
          />
          <Tooltip 
            content={<CustomTooltip formatCurrency={shouldFormatCurrency} />}
          />
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
          )}
          {bars.map((bar, index) => (
            <Bar
              key={bar.key}
              dataKey={bar.key}
              name={bar.name}
              fill={bar.color || CHART_PALETTE[index % CHART_PALETTE.length]}
              stackId={bar.stackId}
              radius={[2, 2, 0, 0]}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// PIE CHART
// ============================================================================

export interface PieChartProps extends BaseChartProps {
  /** Clé pour les valeurs */
  valueKey: string;
  
  /** Clé pour les labels */
  nameKey: string;
  
  /** Rayon intérieur (pour donut chart) */
  innerRadius?: number;
  
  /** Rayon extérieur */
  outerRadius?: number;
  
  /** Afficher les labels */
  showLabels?: boolean;
  
  /** Afficher les pourcentages */
  showPercentages?: boolean;
  
  /** Couleurs personnalisées */
  colors?: string[];
}

export const PieChart: React.FC<PieChartProps> = ({
  data,
  valueKey,
  nameKey,
  width = '100%',
  height = 300,
  loading = false,
  error,
  formatCurrency: shouldFormatCurrency = false,
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  showPercentages = true,
  colors = CHART_PALETTE,
  className,
  title,
  description
}) => {
  if (loading) return <ChartLoading height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  // Calculer les pourcentages
  const total = data.reduce((sum, item) => sum + item[valueKey], 0);
  const dataWithPercentages = data.map(item => ({
    ...item,
    percentage: ((item[valueKey] / total) * 100).toFixed(1)
  }));
  
  const renderLabel = (entry: any) => {
    if (!showLabels) return '';
    
    const value = shouldFormatCurrency ? formatCurrency(entry[valueKey]) : entry[valueKey];
    const percentage = showPercentages ? ` (${entry.percentage}%)` : '';
    
    return `${entry[nameKey]}: ${value}${percentage}`;
  };
  
  return (
    <div className={cn('w-full', className)}>
      <ChartTitle title={title} description={description} />
      <ResponsiveContainer width={width} height={height}>
        <RechartsPieChart>
          <Pie
            data={dataWithPercentages}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey={valueKey}
          >
            {dataWithPercentages.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={colors[index % colors.length]} 
              />
            ))}
          </Pie>
          <Tooltip 
            content={<CustomTooltip formatCurrency={shouldFormatCurrency} />}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// AREA CHART
// ============================================================================

export interface AreaChartProps extends BaseChartProps {
  /** Clé pour l'axe X */
  xKey: string;
  
  /** Configuration des aires */
  areas: Array<{
    key: string;
    name: string;
    color?: string;
    stackId?: string;
  }>;
  
  /** Afficher la grille */
  showGrid?: boolean;
  
  /** Afficher la légende */
  showLegend?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  xKey,
  areas,
  width = '100%',
  height = 300,
  margin = { top: 20, right: 30, left: 20, bottom: 20 },
  loading = false,
  error,
  formatCurrency: shouldFormatCurrency = false,
  showGrid = true,
  showLegend = true,
  className,
  title,
  description
}) => {
  if (loading) return <ChartLoading height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  return (
    <div className={cn('w-full', className)}>
      <ChartTitle title={title} description={description} />
      <ResponsiveContainer width={width} height={height}>
        <RechartsAreaChart data={data} margin={margin}>
          {showGrid && (
            <CartesianGrid 
              strokeDasharray="3 3" 
              className="stroke-gray-200 dark:stroke-gray-700" 
            />
          )}
          <XAxis 
            dataKey={xKey}
            className="text-xs fill-gray-600 dark:fill-gray-400"
          />
          <YAxis 
            className="text-xs fill-gray-600 dark:fill-gray-400"
            tickFormatter={shouldFormatCurrency ? formatCurrency : undefined}
          />
          <Tooltip 
            content={<CustomTooltip formatCurrency={shouldFormatCurrency} />}
          />
          {showLegend && (
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
            />
          )}
          {areas.map((area, index) => (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name}
              stackId={area.stackId}
              stroke={area.color || CHART_PALETTE[index % CHART_PALETTE.length]}
              fill={area.color || CHART_PALETTE[index % CHART_PALETTE.length]}
              fillOpacity={0.6}
            />
          ))}
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ============================================================================
// GAUGE CHART
// ============================================================================

export interface GaugeChartProps extends Omit<BaseChartProps, 'data'> {
  /** Valeur actuelle */
  value: number;
  
  /** Valeur minimale */
  min?: number;
  
  /** Valeur maximale */
  max?: number;
  
  /** Segments de couleur */
  segments?: Array<{
    min: number;
    max: number;
    color: string;
    label?: string;
  }>;
  
  /** Afficher la valeur au centre */
  showValue?: boolean;
  
  /** Afficher les labels */
  showLabels?: boolean;
  
  /** Unité de mesure */
  unit?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  segments = [
    { min: 0, max: 30, color: CHART_COLORS.danger, label: 'Faible' },
    { min: 30, max: 70, color: CHART_COLORS.warning, label: 'Moyen' },
    { min: 70, max: 100, color: CHART_COLORS.success, label: 'Élevé' }
  ],
  width = '100%',
  height = 200,
  loading = false,
  error,
  formatCurrency: shouldFormatCurrency = false,
  showValue = true,
  showLabels = true,
  unit = '',
  className,
  title,
  description
}) => {
  if (loading) return <ChartLoading height={height} />;
  if (error) return <ChartError error={error} height={height} />;
  
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  const angle = (percentage / 100) * 180 - 90; // -90 à +90 degrés
  
  // Trouver le segment actuel
  const currentSegment = segments.find(segment => 
    value >= segment.min && value <= segment.max
  ) || segments[0];
  
  return (
    <div className={cn('w-full', className)}>
      <ChartTitle title={title} description={description} />
      <div className="flex flex-col items-center" style={{ height }}>
        <div className="relative">
          <svg width="200" height="120" viewBox="0 0 200 120">
            {/* Fond de la jauge */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="20"
              strokeLinecap="round"
            />
            
            {/* Segments colorés */}
            {segments.map((segment, index) => {
              const segmentStart = ((segment.min - min) / (max - min)) * 180 - 90;
              const segmentEnd = ((segment.max - min) / (max - min)) * 180 - 90;
              const segmentAngle = segmentEnd - segmentStart;
              
              return (
                <path
                  key={index}
                  d={`M 20 100 A 80 80 0 0 1 180 100`}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="20"
                  strokeLinecap="round"
                  strokeDasharray={`${(segmentAngle / 180) * 251.33} 251.33`}
                  strokeDashoffset={-((segmentStart + 90) / 180) * 251.33}
                  opacity={0.3}
                />
              );
            })}
            
            {/* Indicateur de valeur */}
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke={currentSegment.color}
              strokeWidth="20"
              strokeLinecap="round"
              strokeDasharray={`${(percentage / 100) * 251.33} 251.33`}
            />
            
            {/* Aiguille */}
            <line
              x1="100"
              y1="100"
              x2={100 + 60 * Math.cos((angle * Math.PI) / 180)}
              y2={100 + 60 * Math.sin((angle * Math.PI) / 180)}
              stroke="#374151"
              strokeWidth="3"
              strokeLinecap="round"
            />
            
            {/* Centre */}
            <circle cx="100" cy="100" r="8" fill="#374151" />
          </svg>
          
          {/* Valeur au centre */}
          {showValue && (
            <div className="absolute inset-0 flex items-end justify-center pb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {shouldFormatCurrency ? formatCurrency(value) : value}
                  {unit && <span className="text-sm ml-1">{unit}</span>}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {currentSegment.label}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Labels des segments */}
        {showLabels && (
          <div className="flex justify-between w-full max-w-xs mt-4 text-xs">
            <span className="text-gray-500 dark:text-gray-400">{min}</span>
            <span className="text-gray-500 dark:text-gray-400">{max}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// Export des composants
export {
  ChartTitle,
  ChartLoading,
  ChartError,
  CustomTooltip
};

// Export par défaut du LineChart (le plus utilisé)
export default LineChart;
