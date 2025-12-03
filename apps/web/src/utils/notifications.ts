/**
 * FICHIER: apps/web/src/utils/notifications.ts
 * UTILITAIRE: Système de notifications unifié
 *
 * DESCRIPTION:
 * Wrapper autour de react-toastify pour une API de notifications simple et cohérente
 * Remplace les multiples bibliothèques (sonner, react-hot-toast) par une seule
 *
 * USAGE:
 * import { notify } from '@/utils/notifications';
 *
 * notify.success('Opération réussie !');
 * notify.error('Une erreur est survenue');
 * notify.warning('Attention');
 * notify.info('Information');
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

import { toast, ToastOptions, ToastContent, Id } from 'react-toastify';

/**
 * Options par défaut pour les notifications
 */
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined
};

/**
 * Interface pour les options de notification personnalisées
 */
export interface NotificationOptions extends ToastOptions {
  duration?: number; // Alias pour autoClose
}

/**
 * Système de notifications unifié
 */
export const notify = {
  /**
   * Notification de succès
   */
  success: (message: ToastContent, options?: NotificationOptions): Id => {
    return toast.success(message, {
      ...defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? 5000
    });
  },

  /**
   * Notification d'erreur
   */
  error: (message: ToastContent, options?: NotificationOptions): Id => {
    return toast.error(message, {
      ...defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? 7000 // Plus long pour les erreurs
    });
  },

  /**
   * Notification d'avertissement
   */
  warning: (message: ToastContent, options?: NotificationOptions): Id => {
    return toast.warning(message, {
      ...defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? 6000
    });
  },

  /**
   * Notification d'information
   */
  info: (message: ToastContent, options?: NotificationOptions): Id => {
    return toast.info(message, {
      ...defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? 5000
    });
  },

  /**
   * Notification par défaut (neutre)
   */
  default: (message: ToastContent, options?: NotificationOptions): Id => {
    return toast(message, {
      ...defaultOptions,
      ...options,
      autoClose: options?.duration ?? options?.autoClose ?? 5000
    });
  },

  /**
   * Notification de chargement
   */
  loading: (message: ToastContent, options?: NotificationOptions): Id => {
    return toast.loading(message, {
      ...defaultOptions,
      ...options,
      autoClose: false // Ne pas fermer automatiquement
    });
  },

  /**
   * Mettre à jour une notification existante
   */
  update: (
    toastId: Id,
    options: {
      render?: ToastContent;
      type?: 'success' | 'error' | 'warning' | 'info' | 'default';
      autoClose?: number;
      isLoading?: boolean;
    }
  ): void => {
    toast.update(toastId, {
      ...options,
      autoClose: options.autoClose ?? 5000
    });
  },

  /**
   * Fermer une notification
   */
  dismiss: (toastId?: Id): void => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss(); // Fermer toutes
    }
  },

  /**
   * Vérifier si une notification est active
   */
  isActive: (toastId: Id): boolean => {
    return toast.isActive(toastId);
  },

  /**
   * Notification de promesse (avec états loading/success/error)
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      pending: ToastContent;
      success: ToastContent | ((data: T) => ToastContent);
      error: ToastContent | ((error: any) => ToastContent);
    },
    options?: NotificationOptions
  ): Promise<T> => {
    return toast.promise(
      promise,
      messages,
      {
        ...defaultOptions,
        ...options
      }
    );
  }
};

/**
 * Helpers pour des cas d'usage communs
 */
export const notifyHelpers = {
  /**
   * Notification de sauvegarde réussie
   */
  saved: (itemName: string = 'Élément') => {
    notify.success(`${itemName} enregistré avec succès`);
  },

  /**
   * Notification de suppression réussie
   */
  deleted: (itemName: string = 'Élément') => {
    notify.success(`${itemName} supprimé avec succès`);
  },

  /**
   * Notification de mise à jour réussie
   */
  updated: (itemName: string = 'Élément') => {
    notify.success(`${itemName} mis à jour avec succès`);
  },

  /**
   * Notification de création réussie
   */
  created: (itemName: string = 'Élément') => {
    notify.success(`${itemName} créé avec succès`);
  },

  /**
   * Notification d'erreur de réseau
   */
  networkError: () => {
    notify.error('Erreur de connexion. Vérifiez votre connexion internet.');
  },

  /**
   * Notification d'erreur d'autorisation
   */
  unauthorized: () => {
    notify.error('Vous n\'êtes pas autorisé à effectuer cette action.');
  },

  /**
   * Notification de validation échouée
   */
  validationError: (message?: string) => {
    notify.error(message || 'Veuillez vérifier les données saisies.');
  },

  /**
   * Notification de copie dans le presse-papier
   */
  copied: () => {
    notify.success('Copié dans le presse-papier', { autoClose: 2000 });
  },

  /**
   * Notification de confirmation requise
   */
  confirmRequired: () => {
    notify.warning('Veuillez confirmer cette action.');
  }
};

// Export par défaut
export default notify;
