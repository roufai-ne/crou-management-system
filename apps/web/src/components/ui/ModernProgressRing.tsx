import React, { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface ModernProgressRingProps {
  percentage: number; // 0-100
  size?: number; // Diamètre en pixels
  strokeWidth?: number;
  label?: string;
  showPercentage?: boolean;
  showIcon?: boolean;
  variant?: 'default' | 'gradient-crou' | 'success' | 'warning' | 'error';
  animated?: boolean;
  duration?: number; // Durée animation en ms
  className?: string;
}

export function ModernProgressRing({
  percentage,
  size = 120,
  strokeWidth = 8,
  label,
  showPercentage = true,
  showIcon = false,
  variant = 'default',
  animated = true,
  duration = 1000,
  className,
}: ModernProgressRingProps) {
  const [displayPercentage, setDisplayPercentage] = useState(animated ? 0 : percentage);

  // Animation du pourcentage
  useEffect(() => {
    if (!animated) {
      setDisplayPercentage(percentage);
      return;
    }

    const steps = 60;
    const increment = percentage / steps;
    const stepDuration = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= percentage) {
        setDisplayPercentage(percentage);
        clearInterval(timer);
      } else {
        setDisplayPercentage(Math.floor(current));
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [percentage, animated, duration]);

  // Calculs SVG
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (displayPercentage / 100) * circumference;
  const center = size / 2;

  // Couleurs selon la variante
  const getColors = () => {
    switch (variant) {
      case 'gradient-crou':
        return {
          stroke: 'url(#gradient-crou)',
          trail: '#e5e7eb',
          text: 'text-primary-600',
        };
      case 'success':
        return {
          stroke: '#10b981',
          trail: '#d1fae5',
          text: 'text-green-600',
        };
      case 'warning':
        return {
          stroke: '#f59e0b',
          trail: '#fef3c7',
          text: 'text-amber-600',
        };
      case 'error':
        return {
          stroke: '#ef4444',
          trail: '#fee2e2',
          text: 'text-red-600',
        };
      default:
        return {
          stroke: '#059669',
          trail: '#e5e7eb',
          text: 'text-primary-600',
        };
    }
  };

  const colors = getColors();

  // Icône selon le pourcentage
  const getIcon = () => {
    if (percentage >= 100) {
      return <Check className="w-8 h-8 text-green-600" strokeWidth={2.5} />;
    }
    if (percentage === 0) {
      return <X className="w-8 h-8 text-gray-400" strokeWidth={2.5} />;
    }
    return null;
  };

  return (
    <div className={cn('inline-flex flex-col items-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Définir le gradient */}
          {variant === 'gradient-crou' && (
            <defs>
              <linearGradient id="gradient-crou" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#059669" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            </defs>
          )}

          {/* Cercle de fond (trail) */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.trail}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Cercle de progression */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.stroke}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={animated ? 'transition-all duration-300 ease-out' : ''}
            style={{
              transition: animated ? 'stroke-dashoffset 0.3s ease-out' : 'none',
            }}
          />
        </svg>

        {/* Contenu au centre */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {showIcon && percentage > 0 && getIcon()}
          {showPercentage && !showIcon && (
            <>
              <span className={cn('text-3xl font-bold', colors.text)}>
                {displayPercentage}
              </span>
              <span className="text-sm text-gray-500">%</span>
            </>
          )}
        </div>
      </div>

      {/* Label */}
      {label && (
        <span className="text-sm font-medium text-gray-700 text-center">
          {label}
        </span>
      )}
    </div>
  );
}

export default ModernProgressRing;
