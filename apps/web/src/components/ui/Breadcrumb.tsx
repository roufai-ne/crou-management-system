import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { ChevronRightIcon, HomeIcon, EllipsisHorizontalIcon } from '@heroicons/react/24/outline';
import {
  ChartBarIcon,
  BanknotesIcon,
  CubeIcon,
  HomeModernIcon,
  TruckIcon,
  DocumentTextIcon,
  CogIcon
} from '@heroicons/react/24/solid';

// Type pour les variantes de props (remplace VariantProps de class-variance-authority)
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Fonction de variantes personnalisée pour le breadcrumb
const breadcrumbVariants = (props: {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}) => {
  const baseClasses = 'flex items-center space-x-1 text-sm';
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  const variantClasses = {
    default: '',
    minimal: 'space-x-2'
  };
  
  return cn(
    baseClasses,
    sizeClasses[props.size || 'md'],
    variantClasses[props.variant || 'default']
  );
};

// Fonction de variantes pour les éléments
const breadcrumbItemVariants = (props: {
  isActive?: boolean;
  isClickable?: boolean;
}) => {
  const baseClasses = 'inline-flex items-center gap-1 transition-colors duration-200';
  
  if (props.isActive) {
    return cn(baseClasses, 'text-gray-900 font-medium');
  }
  
  if (props.isClickable) {
    return cn(baseClasses, 'text-gray-500 hover:text-gray-700 cursor-pointer');
  }
  
  return cn(baseClasses, 'text-gray-500');
};

// Configuration des routes avec labels et icônes
const routeConfig: Record<string, { label: string; icon?: React.ReactNode }> = {
  'dashboard': { label: 'Tableau de Bord', icon: <ChartBarIcon className="w-4 h-4" /> },
  'financial': { label: 'Gestion Financière', icon: <BanknotesIcon className="w-4 h-4" /> },
  'budgets': { label: 'Budgets' },
  'expenses': { label: 'Dépenses' },
  'revenues': { label: 'Recettes' },
  'stocks': { label: 'Stocks & Approvisionnement', icon: <CubeIcon className="w-4 h-4" /> },
  'inventory': { label: 'Inventaire' },
  'suppliers': { label: 'Fournisseurs' },
  'housing': { label: 'Logement Universitaire', icon: <HomeModernIcon className="w-4 h-4" /> },
  'residences': { label: 'Résidences' },
  'rooms': { label: 'Chambres' },
  'transport': { label: 'Transport', icon: <TruckIcon className="w-4 h-4" /> },
  'reports': { label: 'Rapports', icon: <DocumentTextIcon className="w-4 h-4" /> },
  'admin': { label: 'Administration', icon: <CogIcon className="w-4 h-4" /> },
  'users': { label: 'Utilisateurs' },
  'new': { label: 'Nouveau' },
  'edit': { label: 'Modifier' }
};

// Interface pour un élément de breadcrumb
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

// Hook pour auto-générer le breadcrumb depuis l'URL
export const useBreadcrumbs = (): BreadcrumbItem[] => {
  const location = useLocation();

  return useMemo(() => {
    const segments = location.pathname.split('/').filter(Boolean);

    if (segments.length === 0) {
      return [];
    }

    const items: BreadcrumbItem[] = [];

    segments.forEach((segment, index) => {
      const href = '/' + segments.slice(0, index + 1).join('/');

      // Ignorer les IDs (nombres ou UUIDs)
      const isId = /^[\d-]+$/.test(segment) || segment.length > 20;
      if (isId) return;

      // Récupérer la config
      const config = routeConfig[segment];

      items.push({
        label: config?.label || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        href,
        icon: config?.icon
      });
    });

    return items;
  }, [location.pathname]);
};

// Interface des props
interface BreadcrumbProps extends React.HTMLAttributes<HTMLElement> {
  items?: BreadcrumbItem[]; // Optionnel - auto-génération si non fourni
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
  separator?: React.ReactNode;
  maxItems?: number;
  showHome?: boolean;
  homeHref?: string;
  onHomeClick?: () => void;
  showIcons?: boolean; // Afficher les icônes des routes
}

// Composant Breadcrumb
export const Breadcrumb: React.FC<BreadcrumbProps> = ({
  items: providedItems,
  size = 'md',
  variant = 'default',
  separator = <ChevronRightIcon className="w-4 h-4 text-gray-400" />,
  maxItems = 5,
  showHome = true,
  homeHref = '/',
  onHomeClick,
  showIcons = true,
  className,
  ...props
}) => {
  const autoItems = useBreadcrumbs();
  const items = providedItems || autoItems;
  const [isCollapsed, setIsCollapsed] = useState(false);
  const containerRef = useRef<HTMLElement>(null);

  // Gérer l'affichage des éléments selon maxItems
  const displayItems = React.useMemo(() => {
    if (items.length <= maxItems) {
      return items;
    }

    // Si trop d'éléments, afficher les premiers, "...", et les derniers
    const firstItems = items.slice(0, 1);
    const lastItems = items.slice(-2);
    
    return [
      ...firstItems,
      { label: '...', isEllipsis: true } as BreadcrumbItem & { isEllipsis: boolean },
      ...lastItems
    ];
  }, [items, maxItems]);

  const handleItemClick = (item: BreadcrumbItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      window.location.href = item.href;
    }
  };

  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick();
    } else if (homeHref) {
      window.location.href = homeHref;
    }
  };

  return (
    <nav
      ref={containerRef}
      className={cn(breadcrumbVariants({ size, variant }), className)}
      aria-label="Breadcrumb"
      {...props}
    >
      <ol className="flex items-center space-x-1">
        {/* Élément Home */}
        {showHome && (
          <>
            <li>
              <button
                type="button"
                onClick={handleHomeClick}
                className={breadcrumbItemVariants({ isClickable: true })}
                aria-label="Accueil"
              >
                <HomeIcon className="w-4 h-4" />
                <span className="sr-only">Accueil</span>
              </button>
            </li>
            {displayItems.length > 0 && (
              <li aria-hidden="true">
                {separator}
              </li>
            )}
          </>
        )}

        {/* Éléments du breadcrumb */}
        {displayItems.map((item, index) => {
          const isLast = index === displayItems.length - 1;
          const isClickable = !isLast && (item.href || item.onClick);
          const isEllipsis = 'isEllipsis' in item && item.isEllipsis;

          return (
            <React.Fragment key={`${item.label}-${index}`}>
              <li>
                {isEllipsis ? (
                  <button
                    type="button"
                    className={breadcrumbItemVariants({ isClickable: true })}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    aria-label="Afficher plus d'éléments"
                  >
                    <EllipsisHorizontalIcon className="w-4 h-4" />
                  </button>
                ) : isClickable ? (
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={breadcrumbItemVariants({ isClickable: true })}
                  >
                    {showIcons && item.icon && (
                      <span className="w-4 h-4 flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </button>
                ) : (
                  <span
                    className={breadcrumbItemVariants({ isActive: isLast })}
                    aria-current={isLast ? 'page' : undefined}
                  >
                    {showIcons && item.icon && (
                      <span className="w-4 h-4 flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </span>
                )}
              </li>

              {/* Séparateur */}
              {!isLast && (
                <li aria-hidden="true">
                  {separator}
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;