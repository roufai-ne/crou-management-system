/**
 * FICHIER: apps\web\src\components\ui\Progress.tsx
 * COMPOSANT: Progress - Barre de progression
 * 
 * DESCRIPTION:
 * Composant de barre de progression réutilisable
 * Indicateurs visuels, animations, couleurs
 * Design accessible et responsive
 * 
 * FONCTIONNALITÉS:
 * - Barre de progression avec pourcentage
 * - Couleurs prédéfinies (success, warning, error, info)
 * - Animations fluides
 * - Labels et indicateurs
 * - Design accessible
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';

// Interface pour les props du composant
export interface ProgressProps {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  label?: string;
  className?: string;
  animated?: boolean;
  striped?: boolean;
}

// Configuration des couleurs
const colorClasses = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  yellow: 'bg-yellow-500',
  red: 'bg-red-600',
  purple: 'bg-purple-600',
  gray: 'bg-gray-600'
};

// Configuration des tailles
const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3'
};

export function Progress({
  value,
  max = 100,
  color = 'blue',
  size = 'md',
  showLabel = false,
  label,
  className = '',
  animated = false,
  striped = false
}: ProgressProps) {
  // Calculer le pourcentage
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  // Classes pour la barre de progression
  const progressClasses = [
    'w-full bg-gray-200 rounded-full overflow-hidden',
    sizeClasses[size],
    className
  ].join(' ');

  // Classes pour le remplissage
  const fillClasses = [
    'h-full transition-all duration-300 ease-in-out',
    colorClasses[color],
    animated ? 'animate-pulse' : '',
    striped ? 'bg-stripes' : ''
  ].join(' ');

  // Style pour le remplissage
  const fillStyle = {
    width: `${percentage}%`,
    transition: 'width 0.3s ease-in-out'
  };

  return (
    <div className="w-full">
      {/* Label */}
      {(showLabel || label) && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {label || 'Progression'}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(percentage)}%
          </span>
        </div>
      )}

      {/* Barre de progression */}
      <div className={progressClasses} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <div
          className={fillClasses}
          style={fillStyle}
        />
      </div>

      {/* Valeur actuelle */}
      {showLabel && (
        <div className="mt-1 text-xs text-gray-500">
          {value} / {max}
        </div>
      )}
    </div>
  );
}

// Composant pour les barres de progression multiples
export function ProgressGroup({ 
  items, 
  className = '' 
}: { 
  items: Array<{
    label: string;
    value: number;
    max?: number;
    color?: ProgressProps['color'];
  }>;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, index) => (
        <div key={index}>
          <Progress
            value={item.value}
            max={item.max}
            color={item.color}
            label={item.label}
            showLabel
          />
        </div>
      ))}
    </div>
  );
}

// Composant pour les indicateurs de progression circulaires
export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  color = 'blue',
  showLabel = true,
  label,
  className = ''
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  color?: ProgressProps['color'];
  showLabel?: boolean;
  label?: string;
  className?: string;
}) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    yellow: 'text-yellow-500',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Cercle de fond */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        {/* Cercle de progression */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`transition-all duration-300 ease-in-out ${colorClasses[color]}`}
        />
      </svg>
      
      {/* Label au centre */}
      {(showLabel || label) && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(percentage)}%
            </div>
            {label && (
              <div className="text-xs text-gray-500">
                {label}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
