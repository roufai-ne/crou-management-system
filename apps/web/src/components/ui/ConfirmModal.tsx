/**
 * FICHIER: apps/web/src/components/ui/ConfirmModal.tsx
 * COMPOSANT: ConfirmModal - Modal de confirmation
 *
 * DESCRIPTION:
 * Modal réutilisable pour les confirmations d'actions critiques
 * Alternative améliorée au confirm() natif du navigateur
 *
 * FONCTIONNALITÉS:
 * - Titre et message personnalisables
 * - Variantes (danger, warning, info)
 * - Texte des boutons personnalisable
 * - Support async pour les actions
 * - Loading state pendant l'exécution
 * - Gestion du clavier (Escape pour annuler, Enter pour confirmer)
 *
 * USAGE:
 * ```tsx
 * const [showConfirm, setShowConfirm] = useState(false);
 *
 * <ConfirmModal
 *   isOpen={showConfirm}
 *   onClose={() => setShowConfirm(false)}
 *   onConfirm={async () => {
 *     await deleteItem();
 *     setShowConfirm(false);
 *   }}
 *   title="Supprimer l'élément ?"
 *   message="Cette action est irréversible."
 *   variant="danger"
 * />
 * ```
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Button } from './Button';

export type ConfirmModalVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  variant?: ConfirmModalVariant;
  confirmText?: string;
  cancelText?: string;
  confirmButtonVariant?: 'primary' | 'danger';
  showIcon?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'danger',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmButtonVariant,
  showIcon = true,
}) => {
  const [isConfirming, setIsConfirming] = useState(false);

  // Auto-determine button variant if not specified
  const buttonVariant = confirmButtonVariant || (variant === 'danger' ? 'danger' : 'primary');

  // Color schemes for different variants
  const variantStyles = {
    danger: {
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      icon: '⚠️',
    },
    warning: {
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      icon: '⚡',
    },
    info: {
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: 'ℹ️',
    },
    success: {
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      icon: '✓',
    },
  };

  const style = variantStyles[variant];

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
    } catch (error) {
      console.error('Error in confirm action:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isConfirming) {
        onClose();
      }
      if (e.key === 'Enter' && !isConfirming) {
        handleConfirm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isConfirming, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={isConfirming ? undefined : onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-modal-title"
          aria-describedby="confirm-modal-description"
        >
          {/* Content */}
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Icon */}
              {showIcon && (
                <div
                  className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${style.iconBg}`}
                >
                  <span className="text-2xl" role="img" aria-label={variant}>
                    {style.icon}
                  </span>
                </div>
              )}

              {/* Text content */}
              <div className="flex-1">
                <h3
                  id="confirm-modal-title"
                  className="text-lg font-semibold text-gray-900 mb-2"
                >
                  {title}
                </h3>
                <p
                  id="confirm-modal-description"
                  className="text-sm text-gray-600 leading-relaxed"
                >
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isConfirming}
            >
              {cancelText}
            </Button>
            <Button
              type="button"
              variant={buttonVariant}
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? 'Confirmation...' : confirmText}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Hook personnalisé pour gérer facilement les modals de confirmation
 *
 * Usage:
 * ```tsx
 * const { ConfirmDialog, confirm } = useConfirmDialog();
 *
 * const handleDelete = async () => {
 *   const confirmed = await confirm({
 *     title: 'Supprimer ?',
 *     message: 'Action irréversible',
 *     variant: 'danger',
 *   });
 *
 *   if (confirmed) {
 *     await deleteItem();
 *   }
 * };
 *
 * return (
 *   <>
 *     <button onClick={handleDelete}>Delete</button>
 *     <ConfirmDialog />
 *   </>
 * );
 * ```
 */
export const useConfirmDialog = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm'>>({
    title: '',
    message: '',
  });
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = (
    options: Omit<ConfirmModalProps, 'isOpen' | 'onClose' | 'onConfirm'>
  ): Promise<boolean> => {
    setConfig(options);
    setIsOpen(true);

    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
    });
  };

  const handleConfirm = () => {
    if (resolvePromise) {
      resolvePromise(true);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const handleClose = () => {
    if (resolvePromise) {
      resolvePromise(false);
    }
    setIsOpen(false);
    setResolvePromise(null);
  };

  const ConfirmDialog: React.FC = () => (
    <ConfirmModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      {...config}
    />
  );

  return { ConfirmDialog, confirm };
};

export default ConfirmModal;
