/**
 * FICHIER: apps\web\src\components\ui\Toast.tsx
 * COMPOSANT: Toast - Système de notifications toast
 * 
 * DESCRIPTION:
 * Système de notifications toast avec auto-dismiss et gestion de queue
 * Positionnement configurable et animations fluides
 * Intégration avec le système de design CROU
 * 
 * FONCTIONNALITÉS:
 * - Auto-dismiss avec timer configurable
 * - Positionnement (top-right, top-left, bottom-right, bottom-left)
 * - Queue de notifications avec stacking
 * - Pause au hover et focus
 * - Barre de progression pour le timer
 * - Actions personnalisées
 * - Accessibilité complète
 * 
 * USAGE:
 * // Via le hook useToast
 * const { toast } = useToast();
 * 
 * toast.success('Opération réussie !');
 * toast.error('Une erreur est survenue');
 * toast.info('Information importante', { duration: 5000 });
 * 
 * // Composant direct
 * <Toast variant="success" title="Succès">
 *   Données sauvegardées avec succès
 * </Toast>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
// Type pour les variantes de props
type VariantProps<T> = T extends (...args: any[]) => any
  ? Parameters<T>[0]
  : never;
import { 
  XMarkIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';

// Types pour le système de toast
export interface ToastData {
  id: string;
  variant: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
  actions?: React.ReactNode;
  onDismiss?: () => void;
}

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

// Fonction de variantes personnalisée pour le toast
const toastVariants = (props: {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger';
  position?: 'top' | 'bottom';
  state?: 'entered' | 'exiting';
}) => {
  const baseClasses = 'relative flex items-start gap-3 p-4 rounded-lg shadow-lg border transition-transform duration-300';

  // Simple gestion d'état pour les animations d'entrée/sortie
  const stateClasses = props.state === 'entered'
    ? 'translate-y-0 opacity-100'
    : 'translate-y-2 opacity-0 pointer-events-none';

  const variantClasses: Record<string, string> = {
    'default': 'bg-white border-gray-200 text-gray-900',
    success: 'bg-green-50 border-green-200 text-green-800',
    danger: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  return cn(
    baseClasses,
    stateClasses,
    variantClasses[props.variant || 'default']
  );
};

// Icônes par défaut
const defaultIcons = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
  danger: ExclamationCircleIcon
};

// Couleurs des icônes
const iconColors = {
  info: 'text-primary-500',
  success: 'text-success-500',
  warning: 'text-warning-500',
  danger: 'text-danger-500'
};

// Interface des props du Toast
export interface ToastProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof toastVariants> {
  /** Titre du toast */
  title?: string;
  
  /** Description du toast */
  description?: string;
  
  /** Contenu personnalisé */
  children?: React.ReactNode;
  
  /** Durée d'affichage en ms (0 = pas d'auto-dismiss) */
  duration?: number;
  
  /** Peut être fermé manuellement */
  dismissible?: boolean;
  
  /** Callback de fermeture */
  onDismiss?: () => void;
  
  /** Actions à afficher */
  actions?: React.ReactNode;
  
  /** Afficher la barre de progression */
  showProgress?: boolean;
  
  /** Pause au hover */
  pauseOnHover?: boolean;
  
  /** ID unique */
  id?: string;
}

// Composant Toast individuel
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      className,
      variant = 'info',
      state = 'entered',
      title,
      description,
      children,
      duration = 4000,
      dismissible = true,
      onDismiss,
      actions,
      showProgress = true,
      pauseOnHover = true,
      id,
      ...props
    },
    ref
  ) => {
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(100);
    const [isVisible, setIsVisible] = useState(true);
    const timerRef = useRef<NodeJS.Timeout>();
    const startTimeRef = useRef<number>();
    const remainingTimeRef = useRef<number>(duration);
    
    // Gestion du timer d'auto-dismiss
    useEffect(() => {
      if (duration <= 0 || isPaused) return;
      
      startTimeRef.current = Date.now();
      
      const updateProgress = () => {
        const elapsed = Date.now() - (startTimeRef.current || 0);
        const remaining = Math.max(0, remainingTimeRef.current - elapsed);
        const newProgress = (remaining / duration) * 100;
        
        setProgress(newProgress);
        
        if (remaining <= 0) {
          handleDismiss();
        } else {
          requestAnimationFrame(updateProgress);
        }
      };
      
      requestAnimationFrame(updateProgress);
      
      return () => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
        }
      };
    }, [duration, isPaused]);
    
    // Gestion de la fermeture
    const handleDismiss = () => {
      setIsVisible(false);
      setTimeout(() => {
        onDismiss?.();
      }, 300); // Délai pour l'animation de sortie
    };
    
    // Gestion de la pause
    const handleMouseEnter = () => {
      if (pauseOnHover) {
        setIsPaused(true);
      }
    };
    
    const handleMouseLeave = () => {
      if (pauseOnHover) {
        setIsPaused(false);
      }
    };
    
  const IconComponent = (defaultIcons as Record<string, typeof InformationCircleIcon>)[variant] ?? InformationCircleIcon;
  const iconColorClass = (iconColors as Record<string, string>)[variant] ?? iconColors.info;
    
    if (!isVisible) return null;
    
    return (
      <div
        ref={ref}
        id={id}
        role="alert"
        aria-live="polite"
        className={cn(
          toastVariants({ variant, state: isVisible ? 'entered' : 'exiting' }),
          className
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Barre de progression */}
        {showProgress && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700 rounded-b-lg overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-100 ease-linear',
                variant === 'info' && 'bg-primary-500',
                variant === 'success' && 'bg-success-500',
                variant === 'warning' && 'bg-warning-500',
                variant === 'danger' && 'bg-danger-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
        
        {/* Icône */}
        <div className="flex-shrink-0">
          <IconComponent className={cn('h-5 w-5', iconColorClass)} />
        </div>
        
        {/* Contenu */}
        <div className="flex-1 min-w-0">
          {title && (
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
              {title}
            </h4>
          )}
          
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {children || description}
          </div>
          
          {actions && (
            <div className="mt-3 flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
        
        {/* Bouton de fermeture */}
        {dismissible && (
          <div className="flex-shrink-0">
            <button
              type="button"
              onClick={handleDismiss}
              className="inline-flex rounded-md p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              aria-label="Fermer la notification"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    );
  }
);

Toast.displayName = 'Toast';

// Contexte pour le système de toast
interface ToastContextValue {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

// Provider pour le système de toast
export interface ToastProviderProps {
  children: React.ReactNode;
  position?: ToastPosition;
  maxToasts?: number;
}

export function ToastProvider({ 
  children, 
  position = 'top-right',
  maxToasts = 5 
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  
  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };
    
    setToasts(prev => {
      const updated = [newToast, ...prev];
      return updated.slice(0, maxToasts);
    });
    
    return id;
  };
  
  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };
  
  const clearToasts = () => {
    setToasts([]);
  };
  
  // Positionnement du conteneur
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 flex flex-col gap-2 p-4 pointer-events-none';
    
    switch (position) {
      case 'top-right':
        return `${baseClasses} top-0 right-0`;
      case 'top-left':
        return `${baseClasses} top-0 left-0`;
      case 'bottom-right':
        return `${baseClasses} bottom-0 right-0`;
      case 'bottom-left':
        return `${baseClasses} bottom-0 left-0`;
      case 'top-center':
        return `${baseClasses} top-0 left-1/2 transform -translate-x-1/2`;
      case 'bottom-center':
        return `${baseClasses} bottom-0 left-1/2 transform -translate-x-1/2`;
      default:
        return `${baseClasses} top-0 right-0`;
    }
  };
  
  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, clearToasts }}>
      {children}
      
      {/* Conteneur des toasts */}
      {typeof document !== 'undefined' && createPortal(
        <div className={getPositionClasses()}>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              variant={toast.variant}
              title={toast.title}
              description={toast.description}
              duration={toast.duration}
              dismissible={toast.dismissible}
              actions={toast.actions}
              onDismiss={() => {
                toast.onDismiss?.();
                removeToast(toast.id);
              }}
            />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}

// Hook pour utiliser le système de toast
export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  const { addToast, removeToast, clearToasts } = context;
  
  const toast = {
    info: (title: string, options?: Partial<Omit<ToastData, 'id' | 'variant' | 'title'>>) =>
      addToast({ variant: 'info', title, ...options }),
    
    success: (title: string, options?: Partial<Omit<ToastData, 'id' | 'variant' | 'title'>>) =>
      addToast({ variant: 'success', title, ...options }),
    
    warning: (title: string, options?: Partial<Omit<ToastData, 'id' | 'variant' | 'title'>>) =>
      addToast({ variant: 'warning', title, ...options }),
    
    error: (title: string, options?: Partial<Omit<ToastData, 'id' | 'variant' | 'title'>>) =>
      addToast({ variant: 'danger', title, ...options }),
    
    custom: (toast: Omit<ToastData, 'id'>) => addToast(toast),
    
    dismiss: removeToast,
    clear: clearToasts
  };
  
  return { toast, toasts: context.toasts };
}

// Export des types et composants
export { Toast, toastVariants };
export default Toast;
