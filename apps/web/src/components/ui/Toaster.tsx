/**
 * FICHIER: apps\web\src\components\ui\Toaster.tsx
 * COMPOSANT: Toaster - Wrapper pour Sonner toast notifications
 *
 * DESCRIPTION:
 * Configuration personnalisée des toast notifications avec Sonner
 * Design system CROU avec glassmorphism et gradients
 * Support multi-langue et dark mode
 *
 * FONCTIONNALITÉS:
 * - Toast success, error, warning, info
 * - Toast de chargement avec promise
 * - Toast personnalisés avec actions
 * - Animations fluides
 * - Position configurable
 * - Auto-dismiss
 *
 * USAGE:
 * // Dans App.tsx ou Layout
 * import { Toaster } from '@/components/ui/Toaster';
 * <Toaster />
 *
 * // Dans les composants
 * import { toast } from '@/components/ui/Toaster';
 * toast.success('Opération réussie!');
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner';
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

// Types pour les variantes de toast
export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

// Interface pour les options de toast
export interface ToastOptions {
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  cancel?: {
    label: string;
    onClick?: () => void;
  };
  onDismiss?: () => void;
  onAutoClose?: () => void;
}

// Configuration des icônes et couleurs par type
const toastConfig = {
  success: {
    icon: CheckCircleIcon,
    className: 'text-success-600 dark:text-success-400',
    bgClass: 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
  },
  error: {
    icon: XCircleIcon,
    className: 'text-danger-600 dark:text-danger-400',
    bgClass: 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
  },
  warning: {
    icon: ExclamationTriangleIcon,
    className: 'text-warning-600 dark:text-warning-400',
    bgClass: 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
  },
  info: {
    icon: InformationCircleIcon,
    className: 'text-info-600 dark:text-info-400',
    bgClass: 'bg-info-50 dark:bg-info-900/20 border-info-200 dark:border-info-800'
  },
  loading: {
    icon: null,
    className: 'text-primary-600 dark:text-primary-400',
    bgClass: 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
  }
};

// Composant Toaster principal
export const Toaster: React.FC<{
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  theme?: 'light' | 'dark' | 'system';
  richColors?: boolean;
  expand?: boolean;
  duration?: number;
}> = ({
  position = 'top-right',
  theme = 'system',
  richColors = false,
  expand = false,
  duration = 4000
}) => {
  return (
    <SonnerToaster
      position={position}
      theme={theme}
      richColors={richColors}
      expand={expand}
      duration={duration}
      toastOptions={{
        className: 'toast-base',
        classNames: {
          toast: 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 shadow-elevated',
          title: 'text-gray-900 dark:text-gray-100 font-semibold',
          description: 'text-gray-600 dark:text-gray-400',
          actionButton: 'bg-primary-600 hover:bg-primary-700 text-white px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          cancelButton: 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
          closeButton: 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors'
        },
        style: {
          borderRadius: '0.75rem',
          padding: '1rem'
        }
      }}
    />
  );
};

// Helper pour créer des toast typés
const createToast = (type: ToastType) => {
  return (message: string, options?: ToastOptions) => {
    const config = toastConfig[type];
    const Icon = config.icon;

    return sonnerToast(message, {
      description: options?.description,
      duration: options?.duration,
      icon: Icon ? <Icon className={`w-5 h-5 ${config.className}`} /> : undefined,
      action: options?.action ? {
        label: options.action.label,
        onClick: options.action.onClick
      } : undefined,
      cancel: options?.cancel ? {
        label: options.cancel.label,
        onClick: options.cancel.onClick
      } : undefined,
      onDismiss: options?.onDismiss,
      onAutoClose: options?.onAutoClose,
      className: config.bgClass
    });
  };
};

// API de toast exportée
export const toast = {
  success: createToast('success'),
  error: createToast('error'),
  warning: createToast('warning'),
  info: createToast('info'),

  // Toast de chargement
  loading: (message: string, options?: Omit<ToastOptions, 'duration'>) => {
    return sonnerToast.loading(message, {
      description: options?.description,
      icon: (
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600" />
      )
    });
  },

  // Toast avec promise (loading -> success/error)
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading: messages.loading,
      success: messages.success,
      error: messages.error
    });
  },

  // Toast personnalisé
  custom: (jsx: React.ReactNode, options?: { duration?: number }) => {
    return sonnerToast.custom(jsx, {
      duration: options?.duration
    });
  },

  // Fermer un toast spécifique
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  // Fermer tous les toasts
  dismissAll: () => {
    sonnerToast.dismiss();
  },

  // Toast message simple (fallback)
  message: (message: string, options?: ToastOptions) => {
    return sonnerToast(message, {
      description: options?.description,
      duration: options?.duration,
      action: options?.action,
      cancel: options?.cancel
    });
  }
};

// Helpers pour cas d'usage courants
export const toastHelpers = {
  // Toast de sauvegarde réussie
  saved: (entity: string = 'élément') => {
    toast.success(`${entity} enregistré avec succès`, {
      description: 'Les modifications ont été sauvegardées'
    });
  },

  // Toast de suppression réussie
  deleted: (entity: string = 'élément') => {
    toast.success(`${entity} supprimé`, {
      description: 'L\'élément a été supprimé définitivement'
    });
  },

  // Toast d'erreur réseau
  networkError: () => {
    toast.error('Erreur de connexion', {
      description: 'Vérifiez votre connexion internet et réessayez'
    });
  },

  // Toast d'erreur serveur
  serverError: () => {
    toast.error('Erreur serveur', {
      description: 'Une erreur est survenue. Veuillez réessayer plus tard'
    });
  },

  // Toast de validation
  validationError: (message?: string) => {
    toast.warning('Erreur de validation', {
      description: message || 'Veuillez vérifier les champs du formulaire'
    });
  },

  // Toast de confirmation avec action
  confirm: (
    message: string,
    onConfirm: () => void,
    options?: { description?: string; confirmLabel?: string }
  ) => {
    return toast.warning(message, {
      description: options?.description,
      action: {
        label: options?.confirmLabel || 'Confirmer',
        onClick: onConfirm
      },
      cancel: {
        label: 'Annuler'
      },
      duration: 10000 // Plus long pour les confirmations
    });
  },

  // Toast de copie réussie
  copied: (what: string = 'Texte') => {
    toast.success(`${what} copié`, {
      description: 'Le contenu a été copié dans le presse-papier',
      duration: 2000
    });
  },

  // Toast de fichier uploadé
  uploaded: (filename?: string) => {
    toast.success('Fichier uploadé', {
      description: filename ? `${filename} a été uploadé avec succès` : 'Le fichier a été uploadé'
    });
  }
};

// Export par défaut
export default Toaster;
