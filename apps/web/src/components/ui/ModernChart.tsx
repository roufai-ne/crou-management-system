import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';
import { cn } from '@/utils/cn';

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export type ChartType = 'line' | 'bar' | 'pie' | 'doughnut' | 'area';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string;
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ModernChartProps {
  type: ChartType;
  labels: string[];
  datasets: ChartDataset[];
  title?: string;
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
  variant?: 'default' | 'gradient-crou';
  className?: string;
  options?: Partial<ChartOptions>;
}

const CROU_COLORS = {
  primary: '#059669', // Vert Niger
  secondary: '#ea580c', // Orange Niger
  gradient: ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'],
  chart: [
    '#059669', // Vert
    '#ea580c', // Orange
    '#3b82f6', // Bleu
    '#8b5cf6', // Violet
    '#ec4899', // Rose
    '#f59e0b', // Ambre
    '#14b8a6', // Teal
    '#6366f1', // Indigo
  ],
};

export function ModernChart({
  type,
  labels,
  datasets,
  title,
  height = 300,
  showLegend = true,
  showGrid = true,
  variant = 'default',
  className,
  options: customOptions,
}: ModernChartProps) {
  // Appliquer les couleurs CROU automatiquement si non spécifiées
  const enhancedDatasets = datasets.map((dataset, index) => {
    if (type === 'pie' || type === 'doughnut') {
      return {
        ...dataset,
        backgroundColor: dataset.backgroundColor || CROU_COLORS.chart,
        borderColor: '#ffffff',
        borderWidth: dataset.borderWidth || 2,
      };
    }

    const colorIndex = index % CROU_COLORS.chart.length;
    const baseColor = CROU_COLORS.chart[colorIndex];

    if (type === 'area') {
      return {
        ...dataset,
        backgroundColor: dataset.backgroundColor || `${baseColor}33`, // 20% opacity
        borderColor: dataset.borderColor || baseColor,
        borderWidth: dataset.borderWidth || 2,
        fill: true,
        tension: dataset.tension || 0.4,
      };
    }

    return {
      ...dataset,
      backgroundColor: dataset.backgroundColor || baseColor,
      borderColor: dataset.borderColor || baseColor,
      borderWidth: dataset.borderWidth || 2,
      tension: dataset.tension || 0.4,
    };
  });

  const chartData = {
    labels,
    datasets: enhancedDatasets,
  };

  // Options par défaut
  const defaultOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: showLegend,
        position: 'top' as const,
        labels: {
          font: {
            family: 'Inter, system-ui, sans-serif',
            size: 12,
          },
          color: '#374151',
          padding: 16,
          usePointStyle: true,
        },
      },
      title: {
        display: !!title,
        text: title,
        font: {
          family: 'Inter, system-ui, sans-serif',
          size: 16,
          weight: 600,
        },
        color: '#111827',
        padding: {
          top: 10,
          bottom: 20,
        },
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 13,
          weight: 600,
        },
        bodyFont: {
          family: 'Inter, system-ui, sans-serif',
          size: 12,
        },
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
      },
    },
    scales:
      type !== 'pie' && type !== 'doughnut'
        ? {
            x: {
              grid: {
                display: showGrid,
                color: 'rgba(156, 163, 175, 0.1)',
              },
              ticks: {
                font: {
                  family: 'Inter, system-ui, sans-serif',
                  size: 11,
                },
                color: '#6b7280',
              },
            },
            y: {
              grid: {
                display: showGrid,
                color: 'rgba(156, 163, 175, 0.1)',
              },
              ticks: {
                font: {
                  family: 'Inter, system-ui, sans-serif',
                  size: 11,
                },
                color: '#6b7280',
              },
              beginAtZero: true,
            },
          }
        : undefined,
  };

  // Fusionner les options
  const mergedOptions = {
    ...defaultOptions,
    ...customOptions,
    plugins: {
      ...defaultOptions.plugins,
      ...customOptions?.plugins,
    },
  } as ChartOptions;

  // Sélectionner le bon composant Chart
  const renderChart = () => {
    const commonProps = {
      data: chartData,
      options: mergedOptions as any,
    };

    switch (type) {
      case 'line':
      case 'area':
        return <Line {...commonProps} />;
      case 'bar':
        return <Bar {...commonProps} />;
      case 'pie':
        return <Pie {...commonProps} />;
      case 'doughnut':
        return <Doughnut {...commonProps} />;
      default:
        return <Line {...commonProps} />;
    }
  };

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-6',
        variant === 'default' && 'border-gray-200',
        variant === 'gradient-crou' && [
          'border-transparent',
          'bg-gradient-to-br from-primary-50 to-secondary-50',
        ],
        className
      )}
      style={{ height: height + 48 }} // +48 pour le padding
    >
      <div style={{ height }}>
        {renderChart()}
      </div>
    </div>
  );
}

export default ModernChart;
