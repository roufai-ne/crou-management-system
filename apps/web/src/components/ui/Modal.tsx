/**
 * FICHIER: apps\web\src\components\ui\Modal.tsx
 * COMPOSANT: Modal - Fenêtre modale
 * 
 * DESCRIPTION:
 * Composant de fenêtre modale réutilisable
 * Overlay, fermeture, tailles, animations
 * Design responsive et accessible
 * 
 * FONCTIONNALITÉS:
 * - Fenêtre modale avec overlay
 * - Fermeture par clic extérieur ou touche Escape
 * - Tailles prédéfinies (sm, md, lg, xl, full)
 * - Animations d'ouverture/fermeture
 * - Focus trap pour l'accessibilité
 * - Design responsive
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useEffect, useRef } from 'react';
import { Button } from './Button';
import { cn } from '@/utils/cn';
import { X } from 'lucide-react';

// Types pour les variantes
type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

// Fonction pour générer les classes CSS du modal
export const modalVariants = (props: {
  size?: ModalSize;
}) => {
  const { size = 'md' } = props;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4'
  };

  return cn(
    'relative bg-white dark:bg-gray-800 rounded-lg shadow-xl',
    'transform transition-all duration-300 ease-out',
    'w-full',
    sizeClasses[size]
  );
};

// Interface pour les props du modal
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  className?: string;
  overlayClassName?: string;
}

// Tailles prédéfinies
const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
};

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  overlayClassName = ''
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Gestion de la fermeture par Escape
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Gestion du focus trap
  useEffect(() => {
    if (!isOpen) return;

    // Sauvegarder l'élément actif
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus sur le modal
    const modal = modalRef.current;
    if (modal) {
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstElement = focusableElements[0] as HTMLElement;
      if (firstElement) {
        firstElement.focus();
      }
    }

    // Gérer le focus trap
    const handleTabKey = (event: KeyboardEvent) => {
      if (event.key !== 'Tab' || !modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ) as HTMLElement;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    return () => {
      document.removeEventListener('keydown', handleTabKey);
      // Restaurer le focus
      previousActiveElement.current?.focus();
    };
  }, [isOpen]);

  // Gestion du scroll du body
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Gestion du clic sur l'overlay
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClassName || 'bg-black bg-opacity-50'
        }`}
      onClick={handleOverlayClick}
    >
      <div
        ref={modalRef}
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* En-tête */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
                className="ml-auto"
                aria-label="Fermer"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {/* Contenu */}
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Composant pour les actions du modal
export function ModalActions({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-center justify-end gap-3 pt-4 border-t border-gray-200 ${className}`}>
      {children}
    </div>
  );
}

// Composant pour le contenu du modal
export function ModalContent({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`${className}`}>
      {children}
    </div>
  );
}

// Interface pour ModalHeader
export interface ModalHeaderProps {
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
  showCloseButton?: boolean;
}

// Composant pour l'en-tête du modal
export function ModalHeader({
  children,
  className = '',
  onClose,
  showCloseButton = true
}: ModalHeaderProps) {
  return (
    <div className={`flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex-1">
        {children}
      </div>
      {showCloseButton && onClose && (
        <button
          onClick={onClose}
          className="ml-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

// Interface pour ModalBody
export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

// Composant pour le corps du modal
export function ModalBody({
  children,
  className = ''
}: ModalBodyProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

// Interface pour ModalFooter
export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
}

// Composant pour le pied de page du modal
export function ModalFooter({
  children,
  className = '',
  align = 'right'
}: ModalFooterProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
    between: 'justify-between'
  };

  return (
    <div className={`flex items-center p-6 border-t border-gray-200 dark:border-gray-700 ${alignClasses[align]} ${className}`}>
      {children}
    </div>
  );
}

// Interface pour AlertDialog
export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

// Composant AlertDialog
export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'info',
  loading = false
}: AlertDialogProps) {
  const variantStyles = {
    danger: 'text-red-600 bg-red-600 hover:bg-red-700',
    warning: 'text-orange-600 bg-orange-600 hover:bg-orange-700',
    info: 'text-blue-600 bg-blue-600 hover:bg-blue-700'
  };

  const iconStyles = {
    danger: 'text-red-500',
    warning: 'text-orange-500',
    info: 'text-blue-500'
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${iconStyles[variant]}`}>
            {variant === 'danger' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            {variant === 'warning' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            )}
            {variant === 'info' && (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
        </div>
      </ModalHeader>

      <ModalBody>
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </ModalBody>

      <ModalFooter align="right">
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-300 dark:hover:bg-gray-500 rounded-md transition-colors disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 text-white rounded-md transition-colors disabled:opacity-50 ${variantStyles[variant]}`}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Chargement...
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </ModalFooter>
    </Modal>
  );
}

// Interface pour DrawerModal
export interface DrawerModalProps extends ModalProps {
  position?: 'left' | 'right' | 'top' | 'bottom';
}

// Composant DrawerModal
export function DrawerModal({
  position = 'right',
  ...props
}: DrawerModalProps) {
  // Pour l'instant, on utilise le Modal de base
  // TODO: Implémenter le vrai drawer modal
  return <Modal {...props} />;
}
