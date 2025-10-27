/**
 * FICHIER: apps\web\src\components\ui\Tabs.tsx
 * COMPOSANT: Tabs - Composant d'onglets avancé du système de design CROU
 *
 * DESCRIPTION:
 * Composant d'onglets complet avec navigation clavier accessible
 * Support des orientations verticale/horizontale, lazy loading, badges
 * Optimisé pour l'organisation du contenu dans les modules CROU
 *
 * FONCTIONNALITÉS:
 * - Navigation clavier complète (flèches, Tab, Entrée, Espace)
 * - Orientations horizontale et verticale
 * - Onglets désactivés et avec badges
 * - Lazy loading du contenu des onglets
 * - Animations fluides avec Framer Motion
 * - Accessibilité complète (ARIA, roles)
 * - Support des icônes et indicateurs
 *
 * VARIANTES:
 * - 'default': Style standard avec bordures
 * - pills: Style boutons arrondis
 * - underline: Style souligné minimal
 * - cards: Style cartes avec ombres
 *
 * ORIENTATIONS:
 * - horizontal: Onglets en ligne (défaut)
 * - vertical: Onglets en colonne
 *
 * TAILLES:
 * - sm: Petite (padding réduit)
 * - md: Moyenne (défaut)
 * - lg: Grande (padding étendu)
 *
 * PROPS:
 * - tabs: Liste des onglets avec contenu
 * - defaultTab: Onglet actif par défaut
 * - activeTab: Onglet actif contrôlé
 * - onTabChange: Callback changement d'onglet
 * - orientation: Orientation des onglets
 * - variant: Variante visuelle
 * - size: Taille des onglets
 * - lazy: Lazy loading du contenu
 * - keepMounted: Garder le contenu monté
 * - disabled: Désactiver tous les onglets
 *
 * USAGE:
 * <Tabs
 *   tabs={[
 *     {
 *       id: 'overview',
 *       label: 'Vue d\'ensemble',
 *       content: <OverviewContent />,
 *       icon: <ChartBarIcon />
 *     },
 *     {
 *       id: 'details',
 *       label: 'Détails',
 *       content: <DetailsContent />,
 *       badge: 5
 *     }
 *   ]}
 *   defaultTab="overview"
 *   variant="default"
 * />
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { cn } from '@/utils/cn';
// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Types pour les onglets
export interface TabItem {
  /** Identifiant unique de l'onglet */
  id: string;

  /** Libellé affiché */
  label: string;

  /** Contenu de l'onglet */
  content: React.ReactNode;

  /** Icône optionnelle */
  icon?: React.ReactNode;

  /** Badge avec nombre */
  badge?: number | string;

  /** Onglet désactivé */
  disabled?: boolean;

  /** Description pour l'accessibilité */
  description?: string;

  /** Classe CSS personnalisée pour l'onglet */
  className?: string;

  /** Classe CSS personnalisée pour le contenu */
  contentClassName?: string;
}

// Fonction de variantes pour le conteneur des onglets
const tabsContainerVariants = (props: {
  orientation?: 'horizontal' | 'vertical';
}) => {
  const baseClasses = 'flex';
  
  const orientationClasses = {
    horizontal: 'flex-col',
    vertical: 'flex-row gap-6'
  };
  
  return cn(baseClasses, orientationClasses[props.orientation || 'horizontal']);
};

// Fonction de variantes pour la liste des onglets
const tabsListVariants = (props: {
  variant?: 'default' | 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  orientation?: 'horizontal' | 'vertical';
}) => {
  const baseClasses = 'flex';
  
  const variantClasses = {
    'default': 'border-b border-gray-200',
    pills: 'bg-gray-100 p-1 rounded-lg',
    underline: 'border-b-2 border-transparent',
    cards: 'gap-2'
  };
  
  const orientationClasses = {
    horizontal: 'flex-row',
    vertical: 'flex-col space-y-1'
  };
  
  return cn(
    baseClasses,
    variantClasses[props.variant || 'default'],
    orientationClasses[props.orientation || 'horizontal']
  );
};

// Fonction de variantes pour les boutons d'onglets
const tabButtonVariants = (props: {
  variant?: 'default' | 'pills' | 'underline' | 'cards';
  size?: 'sm' | 'md' | 'lg';
  isActive?: boolean;
  isDisabled?: boolean;
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  };
  
  if (props.isDisabled) {
    return cn(baseClasses, sizeClasses[props.size || 'md'], 'opacity-50 cursor-not-allowed');
  }
  
  const variantClasses = {
    'default': props.isActive 
      ? 'text-primary-600 border-b-2 border-primary-600' 
      : 'text-gray-500 hover:text-gray-700 border-b-2 border-transparent',
    pills: props.isActive 
      ? 'bg-white text-primary-600 shadow-sm' 
      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50',
    underline: props.isActive 
      ? 'text-primary-600 border-b-2 border-primary-600' 
      : 'text-gray-500 hover:text-gray-700'
    ,
    cards: props.isActive
      ? 'text-primary-600 bg-white border border-gray-200 shadow-sm'
      : 'text-gray-600 bg-transparent hover:bg-white/50'
  };
  
  return cn(
    baseClasses,
    sizeClasses[props.size || 'md'],
    variantClasses[props.variant || 'default']
  );
};
 

// Fonction de variantes pour le contenu des onglets
const tabContentVariants = (props: {
  size?: 'sm' | 'md' | 'lg';
}) => {
  const baseClasses = 'flex-1 focus:outline-none';
  
  const sizeClasses = {
    sm: 'mt-2',
    md: 'mt-4',
    lg: 'mt-6'
  };
  
  return cn(baseClasses, sizeClasses[props.size || 'md']);
};
 

// Interface des props principales
export interface TabsProps extends VariantProps<typeof tabsContainerVariants> {
  /** Liste des onglets (optional) */
  tabs?: TabItem[];
  /** Allow children for compatibility with existing usages */
  children?: React.ReactNode;

  /** Onglet actif par défaut (non contrôlé) */
  defaultTab?: string;

  /** Onglet actif (contrôlé) */
  activeTab?: string;
  /** Compatibility: 'value' / 'onValueChange' aliases used across the codebase */
  value?: string;

  /** Callback appelé lors du changement d'onglet */
  onTabChange?: (tabId: string) => void;
  /** Compatibility alias */
  onValueChange?: (tabId: string) => void;

  /** Variante visuelle */
  variant?: 'default' | 'pills' | 'underline' | 'cards';

  /** Taille des onglets */
  size?: 'sm' | 'md' | 'lg';

  /** Lazy loading du contenu */
  lazy?: boolean;

  /** Garder le contenu monté même si inactif */
  keepMounted?: boolean;

  /** Désactiver tous les onglets */
  disabled?: boolean;

  /** Classes CSS personnalisées */
  className?: string;
  tabsListClassName?: string;
  tabContentClassName?: string;

  /** Props ARIA personnalisées */
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

// Composant Badge pour les onglets
const TabBadge: React.FC<{ count: number | string; size?: 'sm' | 'md' | 'lg' }> = ({
  count,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'text-xs min-w-4 h-4 px-1',
    md: 'text-xs min-w-5 h-5 px-1.5',
    lg: 'text-sm min-w-6 h-6 px-2'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center font-medium text-white bg-red-500 rounded-full',
        sizeClasses[size]
      )}
      aria-label={`${count} notifications`}
    >
      {count}
    </span>
  );
};

// Composant Tabs principal
const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultTab,
  activeTab: controlledActiveTab,
  onTabChange,
  value: valueProp,
  onValueChange,
  orientation = 'horizontal',
  variant = 'default',
  size = 'md',
  lazy = false,
  keepMounted = false,
  disabled = false,
  className,
  tabsListClassName,
  tabContentClassName,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  children,
  ...props
}) => {
  // État interne pour l'onglet actif
  const [internalActiveTab, setInternalActiveTab] = useState<string>(() => {
    if (controlledActiveTab) return controlledActiveTab;
    if (defaultTab) return defaultTab;
    if (tabs && tabs.length) return tabs.find(tab => !tab.disabled)?.id || tabs[0]?.id || '';
    return '';
  });

  // Determine controlled value (support 'value' alias)
  const controlled = controlledActiveTab ?? valueProp;
  const activeTab = controlled ?? internalActiveTab;
  const isControlled = controlled !== undefined;

  // Références pour la navigation clavier
  const tabListRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Onglets montés (pour lazy loading)
  const [mountedTabs, setMountedTabs] = useState<Set<string>>(
    new Set(lazy ? [activeTab] : (tabs || []).map(tab => tab.id))
  );

  // Mise à jour de l'onglet actif
  const updateActiveTab = useCallback((tabId: string) => {
  const tab = (tabs || []).find(t => t.id === tabId);
    if (!tab || tab.disabled || disabled) return;

    if (!isControlled) {
      setInternalActiveTab(tabId);
    }

    // Call both canonical and alias callbacks for compatibility
    onTabChange?.(tabId);
    onValueChange?.(tabId);

    // Ajouter l'onglet aux onglets montés
    if (lazy) {
      setMountedTabs(prev => new Set([...prev, tabId]));
    }
  }, [tabs, disabled, isControlled, onTabChange, lazy]);

  // Effet pour synchroniser l'onglet contrôlé
  useEffect(() => {
    if (controlledActiveTab && controlledActiveTab !== internalActiveTab) {
      setInternalActiveTab(controlledActiveTab);
      if (lazy) {
        setMountedTabs(prev => new Set([...prev, controlledActiveTab]));
      }
    }
  }, [controlledActiveTab, internalActiveTab, lazy]);

  // Navigation clavier
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

  const enabledTabs = (tabs || []).filter(tab => !tab.disabled);
    const currentIndex = enabledTabs.findIndex(tab => tab.id === activeTab);

    let nextIndex = currentIndex;

    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        nextIndex = currentIndex > 0 ? currentIndex - 1 : enabledTabs.length - 1;
        break;

      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        nextIndex = currentIndex < enabledTabs.length - 1 ? currentIndex + 1 : 0;
        break;

      case 'Home':
        event.preventDefault();
        nextIndex = 0;
        break;

      case 'End':
        event.preventDefault();
        nextIndex = enabledTabs.length - 1;
        break;

      default:
        return;
    }

    const nextTab = enabledTabs[nextIndex];
    if (nextTab) {
      updateActiveTab(nextTab.id);
      // Focus sur le nouvel onglet
      const tabElement = tabRefs.current.get(nextTab.id);
      tabElement?.focus();
    }
  }, [activeTab, tabs, disabled, updateActiveTab]);

  // Gestion du clic sur un onglet
  const handleTabClick = useCallback((tabId: string) => {
    updateActiveTab(tabId);
  }, [updateActiveTab]);

  // Rendu d'un onglet
  const renderTab = (tab: TabItem, index: number) => {
    const isActive = tab.id === activeTab;
    const tabElement = (
      <button
        key={tab.id}
        ref={(el) => {
          if (el) {
            tabRefs.current.set(tab.id, el);
          } else {
            tabRefs.current.delete(tab.id);
          }
        }}
        type="button"
        role="tab"
        aria-selected={isActive}
        aria-controls={`tabpanel-${tab.id}`}
        aria-describedby={tab.description ? `tab-desc-${tab.id}` : undefined}
        id={`tab-${tab.id}`}
        tabIndex={isActive ? 0 : -1}
        disabled={tab.disabled || disabled}
        data-active={isActive}
        className={cn(
          tabButtonVariants({ variant, size }),
          tab.className
        )}
        onClick={() => handleTabClick(tab.id)}
      >
        {/* Icône */}
        {tab.icon && (
          <span className="flex-shrink-0" aria-hidden="true">
            {tab.icon}
          </span>
        )}

        {/* Label */}
        <span>{tab.label}</span>

        {/* Badge */}
        {tab.badge && (
          <TabBadge count={tab.badge} size={size} />
        )}
      </button>
    );

    // Description invisible pour l'accessibilité
    const description = tab.description && (
      <span
        id={`tab-desc-${tab.id}`}
        className="sr-only"
      >
        {tab.description}
      </span>
    );

    return (
      <React.Fragment key={tab.id}>
        {tabElement}
        {description}
      </React.Fragment>
    );
  };

  // Rendu du contenu d'un onglet
  const renderTabContent = (tab: TabItem) => {
    const isActive = tab.id === activeTab;
    const shouldRender = !lazy || mountedTabs.has(tab.id);
    const shouldShow = isActive || keepMounted;

    if (!shouldRender) return null;

    return (
      <div
        key={tab.id}
        id={`tabpanel-${tab.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${tab.id}`}
        tabIndex={isActive ? 0 : -1}
        hidden={!shouldShow}
        className={cn(
          shouldShow ? 'block' : 'hidden',
          tab.contentClassName
        )}
      >
        {tab.content}
      </div>
    );
  };

  // Si la prop tabs n'est pas fournie, rendre les enfants (comportement legacy)
  if (!tabs || tabs.length === 0) {
    return (
      <div className={cn(tabsContainerVariants({ orientation }), className)} {...props}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        tabsContainerVariants({ orientation }),
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      {...props}
    >
      {/* Liste des onglets */}
      <div
        ref={tabListRef}
        role="tablist"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-orientation={orientation}
        className={cn(
          tabsListVariants({ orientation, variant }),
          tabsListClassName
        )}
        onKeyDown={handleKeyDown}
      >
  {(tabs || []).map(renderTab)}
      </div>

      {/* Contenu des onglets */}
      <div
        className={cn(
          tabContentVariants({ size }),
          tabContentClassName
        )}
      >
  {(tabs || []).map(renderTabContent)}
      </div>
    </div>
  );
};

// (compatibility primitives are declared later in the file)

Tabs.displayName = 'Tabs';

// Export des types et composants
export {
  Tabs,
  TabBadge,
  tabsContainerVariants,
  tabsListVariants,
  tabButtonVariants,
  tabContentVariants
};
// Composants individuels pour compatibilité
export const TabsList = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn('flex border-b border-gray-200 dark:border-gray-700', className)} {...props}>
    {children}
  </div>
);

export const TabsTrigger = ({ children, className, active, ...props }: { children: React.ReactNode; className?: string; active?: boolean; [key: string]: any }) => (
  <button 
    className={cn(
      'px-4 py-2 text-sm font-medium transition-colors',
      active 
        ? 'text-primary-600 border-b-2 border-primary-600' 
        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300',
      className
    )} 
    {...props}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <div className={cn('mt-4', className)} {...props}>
    {children}
  </div>
);

// TabsProps and TabItem are exported where they are declared above.
export default Tabs;
