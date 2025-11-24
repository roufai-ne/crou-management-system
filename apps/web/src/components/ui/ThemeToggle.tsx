/**
 * FICHIER: apps\web\src\components\ui\ThemeToggle.tsx
 * COMPOSANT: ThemeToggle - Bouton de basculement de thème
 * 
 * DESCRIPTION:
 * Composant pour basculer entre thème clair et sombre
 * Utilise le ThemeContext pour la gestion d'état
 * Icônes animées et feedback visuel
 * 
 * PROPS:
 * - size?: 'sm' | 'md' | 'lg' - Taille du bouton
 * - variant?: 'button' | 'icon' - Style du composant
 * 
 * USAGE:
 * <ThemeToggle />
 * <ThemeToggle size="sm" variant="icon" />
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from '@/components/ui/IconFallback';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/utils/cn';

// Props interface
interface ThemeToggleProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'button' | 'icon';
  showLabel?: boolean;
  className?: string;
}

// Composant ThemeToggle
export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  size = 'md',
  variant = 'button',
  showLabel = false,
  className
}) => {
  const { theme, toggleTheme } = useTheme();

  // Configuration des tailles
  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg'
  };

  const iconSizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  // Simple bascule entre clair et sombre
  const cycleTheme = () => {
    toggleTheme();
  };

  // Icône selon le thème actuel
  const getIcon = () => {
    const IconComponent = theme === 'dark' ? MoonIcon : SunIcon;
    return <IconComponent className={cn(iconSizeClasses[size], 'transition-transform duration-200')} />;
  };

  // Label selon le thème
  const getLabel = () => {
    return theme === 'dark' ? 'Thème sombre' : 'Thème clair';
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={cycleTheme}
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 shadow-sm transition-all duration-200',
          'hover:bg-emerald-50 hover:text-emerald-600',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
          'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400',
          sizeClasses[size],
          className
        )}
        title={getLabel()}
        aria-label={getLabel()}
      >
        {getIcon()}
      </button>
    );
  }

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200',
        'hover:bg-emerald-50 hover:text-emerald-600',
        'focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2',
        'dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-emerald-900/20 dark:hover:text-emerald-400',
        className
      )}
      title={`Basculer vers ${theme === 'light' ? 'thème sombre' : theme === 'dark' ? 'thème système' : 'thème clair'}`}
    >
      {getIcon()}
      {showLabel && (
        <span className="hidden sm:inline">
          {getLabel()}
        </span>
      )}
    </button>
  );
};

export default ThemeToggle;
