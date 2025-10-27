/**
 * FICHIER: apps\web\src\components\ui\LoadingScreen.tsx
 * COMPOSANT: LoadingScreen - Écran de chargement réutilisable
 * 
 * DESCRIPTION:
 * Composant d'affichage pendant les chargements
 * Animation spinner avec message personnalisable
 * Différentes tailles et positions selon contexte
 * 
 * PROPS:
 * - message?: string - Message de chargement personnalisé
 * - size?: 'sm' | 'md' | 'lg' - Taille du spinner
 * - fullScreen?: boolean - Plein écran ou inline
 * - overlay?: boolean - Avec overlay semi-transparent
 * 
 * USAGE:
 * <LoadingScreen message="Connexion en cours..." />
 * <LoadingScreen size="sm" fullScreen={false} />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { cn } from '@/utils/cn';

// Interface des props
interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
}

// Composant LoadingScreen
export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Chargement...',
  size = 'md',
  fullScreen = true,
  overlay = false,
  className
}) => {
  // Classes CSS selon la taille
  const spinnerSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // Conteneur selon le contexte
  const containerClasses = fullScreen 
    ? 'fixed inset-0 flex items-center justify-center z-50'
    : 'flex items-center justify-center py-8';

  return (
    <div className={cn(containerClasses, className)}>
      {/* Overlay si demandé */}
      {overlay && fullScreen && (
        <div className="absolute inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
      )}
      
      {/* Contenu du loading */}
      <div className="relative flex flex-col items-center space-y-4">
        {/* Spinner animé */}
        <div 
          className={cn(
            'animate-spin rounded-full border-2 border-gray-200 border-t-primary-600',
            spinnerSizes[size]
          )}
        />
        
        {/* Message */}
        {message && (
          <p className={cn(
            'font-medium text-gray-700 text-center',
            textSizes[size]
          )}>
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingScreen;
