/**
 * FICHIER: apps\web\src\components\ui\Tooltip.tsx
 * COMPOSANT: Tooltip - Infobulle contextuelle
 * 
 * DESCRIPTION:
 * Composant d'infobulle avec positionnement automatique et accessibilité
 * Support des déclencheurs multiples et animations fluides
 * Intégration avec le système de design CROU
 * 
 * FONCTIONNALITÉS:
 * - Positionnement automatique avec détection des bords
 * - Déclencheurs configurables (hover, focus, click)
 * - Délais d'affichage et de masquage
 * - Flèche de pointage
 * - Accessibilité complète (ARIA)
 * - Animations fluides
 * 
 * POSITIONS:
 * - top, bottom, left, right
 * - top-start, top-end, bottom-start, bottom-end
 * - left-start, left-end, right-start, right-end
 * 
 * USAGE:
 * <Tooltip content="Ceci est une aide contextuelle">
 *   <Button>Survolez-moi</Button>
 * </Tooltip>
 * 
 * <Tooltip 
 *   content="Information importante" 
 *   position="bottom"
 *   trigger="click"
 *   showDelay={500}
 * >
 *   <span>Élément avec tooltip</span>
 * </Tooltip>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useRef, useEffect, cloneElement, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;

// Types pour le positionnement
export type TooltipPosition = 
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end' 
  | 'bottom-start' | 'bottom-end'
  | 'left-start' | 'left-end'
  | 'right-start' | 'right-end';

export type TooltipTrigger = 'hover' | 'focus' | 'click' | 'manual';

// Fonction de variantes personnalisée pour le tooltip
const tooltipVariants = (props: {
  variant?: 'dark' | 'light' | 'primary';
  size?: 'sm' | 'md' | 'lg';
}) => {
  const baseClasses = 'absolute z-50 px-3 py-2 text-sm font-medium rounded-md shadow-lg';
  
  const variantClasses = {
    dark: 'bg-gray-900 text-white border border-gray-700',
    light: 'bg-white text-gray-900 border border-gray-200',
    primary: 'bg-primary-600 text-white border border-primary-500'
  };
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-3 text-base'
  };
  
  return cn(
    baseClasses,
    variantClasses[props.variant || 'dark'],
    sizeClasses[props.size || 'md']
  );
};


// Fonction de variantes pour la flèche
const arrowVariants = (props: {
  variant?: 'dark' | 'light' | 'primary';
}) => {
  const baseClasses = 'absolute w-2 h-2 transform rotate-45';
  
  const variantClasses = {
    dark: 'bg-gray-900 border-gray-700',
    light: 'bg-white border-gray-200',
    primary: 'bg-primary-600 border-primary-500'
  };
  
  return cn(baseClasses, variantClasses[props.variant || 'dark']);
};


// Interface des props
export interface TooltipProps
  extends VariantProps<typeof tooltipVariants> {
  /** Contenu du tooltip */
  content: React.ReactNode;
  
  /** Élément déclencheur */
  children: React.ReactElement;
  
  /** Position du tooltip */
  position?: TooltipPosition;
  
  /** Déclencheur d'affichage */
  trigger?: TooltipTrigger | TooltipTrigger[];
  
  /** Délai d'affichage en ms */
  showDelay?: number;
  
  /** Délai de masquage en ms */
  hideDelay?: number;
  
  /** Afficher la flèche */
  showArrow?: boolean;
  
  /** Désactiver le tooltip */
  disabled?: boolean;
  
  /** Contrôle manuel de la visibilité */
  open?: boolean;
  
  /** Callback de changement de visibilité */
  onOpenChange?: (open: boolean) => void;
  
  /** Classe CSS personnalisée */
  className?: string;
  
  /** ID unique pour l'accessibilité */
  id?: string;
}

// Hook pour calculer la position
function useTooltipPosition(
  triggerRef: React.RefObject<HTMLElement>,
  tooltipRef: React.RefObject<HTMLDivElement>,
  position: TooltipPosition,
  isVisible: boolean
) {
  const [computedPosition, setComputedPosition] = useState({ x: 0, y: 0, actualPosition: position });
  
  useEffect(() => {
    if (!isVisible || !triggerRef.current || !tooltipRef.current) return;
    
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    const triggerRect = trigger.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    
    let x = 0;
    let y = 0;
    let actualPosition = position;
    
    // Calcul de la position de base
    switch (position) {
      case 'top':
      case 'top-start':
      case 'top-end':
        y = triggerRect.top - tooltipRect.height - 8;
        break;
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        y = triggerRect.bottom + 8;
        break;
      case 'left':
      case 'left-start':
      case 'left-end':
        x = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
      case 'right-start':
      case 'right-end':
        x = triggerRect.right + 8;
        break;
    }
    
    // Calcul de l'alignement
    switch (position) {
      case 'top':
      case 'bottom':
        x = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'top-start':
      case 'bottom-start':
        x = triggerRect.left;
        break;
      case 'top-end':
      case 'bottom-end':
        x = triggerRect.right - tooltipRect.width;
        break;
      case 'left':
      case 'right':
        y = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        break;
      case 'left-start':
      case 'right-start':
        y = triggerRect.top;
        break;
      case 'left-end':
      case 'right-end':
        y = triggerRect.bottom - tooltipRect.height;
        break;
    }
    
    // Ajustement pour rester dans le viewport
    if (x < 8) {
      x = 8;
    } else if (x + tooltipRect.width > viewport.width - 8) {
      x = viewport.width - tooltipRect.width - 8;
    }
    
    if (y < 8) {
      // Si le tooltip dépasse en haut, le placer en bas
      if (position.startsWith('top')) {
        y = triggerRect.bottom + 8;
        actualPosition = position.replace('top', 'bottom') as TooltipPosition;
      } else {
        y = 8;
      }
    } else if (y + tooltipRect.height > viewport.height - 8) {
      // Si le tooltip dépasse en bas, le placer en haut
      if (position.startsWith('bottom')) {
        y = triggerRect.top - tooltipRect.height - 8;
        actualPosition = position.replace('bottom', 'top') as TooltipPosition;
      } else {
        y = viewport.height - tooltipRect.height - 8;
      }
    }
    
    setComputedPosition({ x, y, actualPosition });
  }, [triggerRef, tooltipRef, position, isVisible]);
  
  return computedPosition;
}

// Composant Tooltip principal
const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
  trigger = 'hover',
  showDelay = 200,
  hideDelay = 100,
  showArrow = true,
  disabled = false,
  open,
  onOpenChange,
  variant = 'default',
  size = 'md',
  className,
  id
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isControlled] = useState(open !== undefined);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const showTimeoutRef = useRef<NodeJS.Timeout>();
  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  
  // Génération d'un ID unique
  const tooltipId = id || `tooltip-${Math.random().toString(36).substr(2, 9)}`;
  
  // Gestion de la visibilité
  const actualIsVisible = isControlled ? open : isVisible;
  
  // Calcul de la position
  const { x, y, actualPosition } = useTooltipPosition(
    triggerRef,
    tooltipRef,
    position,
    actualIsVisible || false
  );
  
  // Normalisation des déclencheurs
  const triggers = Array.isArray(trigger) ? trigger : [trigger];
  
  // Gestion de l'affichage
  const show = () => {
    if (disabled) return;
    
    clearTimeout(hideTimeoutRef.current);
    
    if (showDelay > 0) {
      showTimeoutRef.current = setTimeout(() => {
        if (!isControlled) {
          setIsVisible(true);
        }
        onOpenChange?.(true);
      }, showDelay);
    } else {
      if (!isControlled) {
        setIsVisible(true);
      }
      onOpenChange?.(true);
    }
  };
  
  // Gestion du masquage
  const hide = () => {
    clearTimeout(showTimeoutRef.current);
    
    if (hideDelay > 0) {
      hideTimeoutRef.current = setTimeout(() => {
        if (!isControlled) {
          setIsVisible(false);
        }
        onOpenChange?.(false);
      }, hideDelay);
    } else {
      if (!isControlled) {
        setIsVisible(false);
      }
      onOpenChange?.(false);
    }
  };
  
  // Nettoyage des timeouts
  useEffect(() => {
    return () => {
      clearTimeout(showTimeoutRef.current);
      clearTimeout(hideTimeoutRef.current);
    };
  }, []);
  
  // Gestion des événements
  const handleMouseEnter = () => {
    if (triggers.includes('hover')) {
      show();
    }
  };
  
  const handleMouseLeave = () => {
    if (triggers.includes('hover')) {
      hide();
    }
  };
  
  const handleFocus = () => {
    if (triggers.includes('focus')) {
      show();
    }
  };
  
  const handleBlur = () => {
    if (triggers.includes('focus')) {
      hide();
    }
  };
  
  const handleClick = () => {
    if (triggers.includes('click')) {
      if (actualIsVisible) {
        hide();
      } else {
        show();
      }
    }
  };
  
  // Clonage de l'élément déclencheur avec les événements
  const triggerElement = isValidElement(children) ? cloneElement(children, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onClick: handleClick,
    'aria-describedby': actualIsVisible ? tooltipId : undefined,
    ...children.props
  }) : children;
  
  // Calcul de la position de la flèche
  const getArrowStyle = () => {
    const arrowSize = 8;
    let arrowStyle: React.CSSProperties = {};
    
    switch (actualPosition) {
      case 'top':
      case 'top-start':
      case 'top-end':
        arrowStyle = {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          marginTop: '-4px'
        };
        break;
      case 'bottom':
      case 'bottom-start':
      case 'bottom-end':
        arrowStyle = {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%) rotate(45deg)',
          marginBottom: '-4px'
        };
        break;
      case 'left':
      case 'left-start':
      case 'left-end':
        arrowStyle = {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          marginLeft: '-4px'
        };
        break;
      case 'right':
      case 'right-start':
      case 'right-end':
        arrowStyle = {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%) rotate(45deg)',
          marginRight: '-4px'
        };
        break;
    }
    
    return arrowStyle;
  };
  
  return (
    <>
      {triggerElement}
      
      {/* Tooltip portal */}
      {typeof document !== 'undefined' && createPortal(
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className={cn(
            tooltipVariants({ 
              variant, 
              size, 
              state: actualIsVisible ? 'visible' : 'hidden' 
            }),
            className
          )}
          style={{
            left: x,
            top: y
          }}
        >
          {content}
          
          {/* Flèche */}
          {showArrow && (
            <div
              className={arrowVariants({ variant })}
              style={getArrowStyle()}
            />
          )}
        </div>,
        document.body
      )}
    </>
  );
};

// Export des types et composants
export { Tooltip, tooltipVariants, arrowVariants, type TooltipProps, type TooltipPosition, type TooltipTrigger };
export default Tooltip;
