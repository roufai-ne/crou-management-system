import React from 'react';
import { XMarkIcon, CheckIcon, TruckIcon, XCircleIcon } from '@heroicons/react/24/outline';
import { Badge } from '@/components/ui';
import type { PurchaseOrder, PurchaseOrderStatus } from '@/services/api/procurementService';

interface PurchaseOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onSubmit?: (orderId: string) => Promise<void>;
  onApprove?: (orderId: string) => Promise<void>;
  onMarkAsOrdered?: (orderId: string) => Promise<void>;
  onCancel?: (orderId: string) => Promise<void>;
  onReceive?: (orderId: string) => void;
}

const STATUS_COLORS: Record<PurchaseOrderStatus, 'gray' | 'yellow' | 'blue' | 'green' | 'red'> = {
  DRAFT: 'gray',
  SUBMITTED: 'yellow',
  APPROVED: 'blue',
  ORDERED: 'blue',
  PARTIALLY_RECEIVED: 'yellow',
  FULLY_RECEIVED: 'green',
  CLOSED: 'gray',
  CANCELLED: 'red'
};

const STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  APPROVED: 'Approuvé',
  ORDERED: 'Commandé',
  PARTIALLY_RECEIVED: 'Partiellement reçu',
  FULLY_RECEIVED: 'Reçu',
  CLOSED: 'Clôturé',
  CANCELLED: 'Annulé'
};

export const PurchaseOrderDetailsModal: React.FC<PurchaseOrderDetailsModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
  onApprove,
  onMarkAsOrdered,
  onCancel,
  onReceive,
}) => {
  const [loading, setLoading] = React.useState(false);

  if (!isOpen || !order) return null;

  const handleAction = async (action: () => Promise<void>) => {
    setLoading(true);
    try {
      await action();
      onClose();
    } catch (error) {
      console.error('Erreur action:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString('fr-FR')} XOF`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  // Actions disponibles selon le statut
  const canSubmit = order.status === 'DRAFT' && onSubmit;
  const canApprove = order.status === 'SUBMITTED' && onApprove;
  const canMarkAsOrdered = order.status === 'APPROVED' && onMarkAsOrdered;
  const canReceive = (order.status === 'ORDERED' || order.status === 'PARTIALLY_RECEIVED') && onReceive;
  const canCancel = !['FULLY_RECEIVED', 'CLOSED', 'CANCELLED'].includes(order.status) && onCancel;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-elevated">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Bon de Commande {order.reference}
              </h2>
              <Badge variant={STATUS_COLORS[order.status]}>
                {STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Informations Générales */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Informations Générales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Objet</p>
                  <p className="font-medium text-gray-900 dark:text-white">{order.objet}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fournisseur</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.supplier?.nom || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Budget</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.budget?.libelle || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Type</p>
                  <p className="font-medium text-gray-900 dark:text-white">{order.type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Date de commande</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {order.dateCommande ? formatDate(order.dateCommande) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Mode de paiement</p>
                  <p className="font-medium text-gray-900 dark:text-white">{order.modePaiement}</p>
                </div>
              </div>

              {order.description && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Description</p>
                  <p className="text-gray-900 dark:text-white">{order.description}</p>
                </div>
              )}
            </div>

            {/* Articles */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Articles ({order.items?.length || 0})
              </h3>
              <div className="space-y-2">
                {order.items?.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-2"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.designation}
                        </p>
                        {item.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Quantité</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.quantiteCommandee} {item.unite}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Prix unitaire</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatAmount(item.prixUnitaire)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">TVA</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.tauxTVA}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Total TTC</p>
                        <p className="font-semibold text-primary-600 dark:text-primary-400">
                          {formatAmount(item.prixUnitaire * item.quantiteCommandee * (1 + (item.tauxTVA || 0) / 100))}
                        </p>
                      </div>
                    </div>
                    {item.quantiteRecue > 0 && (
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Reçu: <span className="font-semibold text-green-600 dark:text-green-400">
                            {item.quantiteRecue} / {item.quantiteCommandee}
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Montants */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Total HT:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatAmount(order.montantHT)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">TVA ({order.tauxTVA}%):</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {formatAmount(order.montantTVA)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Total TTC:</span>
                <span className="text-primary-600 dark:text-primary-400">
                  {formatAmount(order.montantTTC)}
                </span>
              </div>
            </div>

            {/* Workflow History */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Historique
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Créé le {formatDate(order.createdAt)}
                  </span>
                </div>
                {order.dateApprobation && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <span className="text-gray-600 dark:text-gray-400">
                      Approuvé le {formatDate(order.dateApprobation)}
                      {order.approvedBy && ` par ${order.approvedBy}`}
                    </span>
                  </div>
                )}
                {order.commentaireApprobation && (
                  <div className="ml-5 text-gray-500 dark:text-gray-400 italic">
                    "{order.commentaireApprobation}"
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            {canCancel && (
              <button
                onClick={() => handleAction(() => onCancel!(order.id))}
                disabled={loading}
                className="px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
              >
                <XCircleIcon className="h-5 w-5 inline mr-2" />
                Annuler
              </button>
            )}
            
            {canSubmit && (
              <button
                onClick={() => handleAction(() => onSubmit!(order.id))}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5 inline mr-2" />
                Soumettre pour approbation
              </button>
            )}

            {canApprove && (
              <button
                onClick={() => handleAction(() => onApprove!(order.id))}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <CheckIcon className="h-5 w-5 inline mr-2" />
                Approuver
              </button>
            )}

            {canMarkAsOrdered && (
              <button
                onClick={() => handleAction(() => onMarkAsOrdered!(order.id))}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <TruckIcon className="h-5 w-5 inline mr-2" />
                Marquer commandé
              </button>
            )}

            {canReceive && (
              <button
                onClick={() => {
                  onReceive!(order.id);
                  onClose();
                }}
                disabled={loading}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <TruckIcon className="h-5 w-5 inline mr-2" />
                Réceptionner
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
