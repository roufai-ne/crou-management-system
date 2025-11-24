import React, { useState } from 'react';
import { XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import type { PurchaseOrder } from '@/services/api/procurementService';

interface ReceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: PurchaseOrder | null;
  onSubmit: (orderId: string, data: ReceptionData) => Promise<void>;
}

interface ReceptionData {
  receptionDate: string;
  items: Array<{
    itemId: string;
    quantiteRecue: number;
  }>;
  commentaire?: string;
}

interface ItemReception {
  itemId: string;
  designation: string;
  quantiteCommandee: number;
  quantiteDejaRecue: number;
  quantiteRestante: number;
  quantiteARecevoir: number;
  unite: string;
}

export const ReceptionModal: React.FC<ReceptionModalProps> = ({
  isOpen,
  onClose,
  order,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receptionDate, setReceptionDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [commentaire, setCommentaire] = useState('');
  const [itemsReception, setItemsReception] = useState<ItemReception[]>([]);

  // Initialiser les items à la première ouverture
  React.useEffect(() => {
    if (isOpen && order && order.items) {
      const items: ItemReception[] = order.items.map(item => ({
        itemId: item.id!,
        designation: item.designation,
        quantiteCommandee: item.quantiteCommandee,
        quantiteDejaRecue: item.quantiteRecue || 0,
        quantiteRestante: item.quantiteCommandee - (item.quantiteRecue || 0),
        quantiteARecevoir: item.quantiteCommandee - (item.quantiteRecue || 0),
        unite: item.unite
      }));
      setItemsReception(items);
    }
  }, [isOpen, order]);

  const updateQuantite = (itemId: string, quantite: number) => {
    setItemsReception(items =>
      items.map(item =>
        item.itemId === itemId
          ? { ...item, quantiteARecevoir: Math.max(0, Math.min(quantite, item.quantiteRestante)) }
          : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    const itemsToReceive = itemsReception.filter(item => item.quantiteARecevoir > 0);
    if (itemsToReceive.length === 0) {
      setError('Veuillez saisir au moins une quantité à recevoir');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(order!.id, {
        receptionDate,
        items: itemsToReceive.map(item => ({
          itemId: item.itemId,
          quantiteRecue: item.quantiteARecevoir
        })),
        commentaire: commentaire || undefined
      });
      onClose();
      // Reset
      setReceptionDate(new Date().toISOString().split('T')[0]);
      setCommentaire('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la réception');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !order) return null;

  const totalARecevoir = itemsReception.reduce((sum, item) => sum + item.quantiteARecevoir, 0);
  const allReceived = itemsReception.every(item => item.quantiteRestante === 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-xl shadow-elevated">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Réception Marchandises
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                BC: {order.reference} - {order.objet}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="px-6 py-4 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              )}

              {allReceived && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Toutes les marchandises ont déjà été reçues
                  </p>
                </div>
              )}

              {/* Date de réception */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de réception *
                </label>
                <input
                  type="date"
                  value={receptionDate}
                  onChange={(e) => setReceptionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              {/* Articles */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Articles à réceptionner
                </h3>
                <div className="space-y-3">
                  {itemsReception.map((item) => (
                    <div
                      key={item.itemId}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.designation}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Commandé: <span className="font-semibold">{item.quantiteCommandee}</span> {item.unite}
                          {' | '}
                          Déjà reçu: <span className="font-semibold text-green-600">{item.quantiteDejaRecue}</span>
                          {' | '}
                          Restant: <span className="font-semibold text-blue-600">{item.quantiteRestante}</span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Quantité reçue
                          </label>
                          <input
                            type="number"
                            min="0"
                            max={item.quantiteRestante}
                            value={item.quantiteARecevoir}
                            onChange={(e) => updateQuantite(item.itemId, parseFloat(e.target.value) || 0)}
                            disabled={item.quantiteRestante === 0}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
                          />
                        </div>

                        <div className="flex items-end">
                          <div className="w-full">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                              Progression
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-green-600 h-2 rounded-full transition-all"
                                style={{
                                  width: `${((item.quantiteDejaRecue + item.quantiteARecevoir) / item.quantiteCommandee) * 100}%`
                                }}
                              />
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {Math.round(((item.quantiteDejaRecue + item.quantiteARecevoir) / item.quantiteCommandee) * 100)}%
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Quick actions */}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantite(item.itemId, item.quantiteRestante)}
                          disabled={item.quantiteRestante === 0}
                          className="text-sm px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                        >
                          Recevoir tout
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQuantite(item.itemId, Math.floor(item.quantiteRestante / 2))}
                          disabled={item.quantiteRestante === 0}
                          className="text-sm px-3 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                          50%
                        </button>
                        <button
                          type="button"
                          onClick={() => updateQuantite(item.itemId, 0)}
                          className="text-sm px-3 py-1 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                        >
                          Réinitialiser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Commentaire
                </label>
                <textarea
                  value={commentaire}
                  onChange={(e) => setCommentaire(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  rows={3}
                  placeholder="Notes sur la réception, état des marchandises, etc."
                />
              </div>

              {/* Résumé */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Total à réceptionner: <span className="font-semibold text-gray-900 dark:text-white">
                    {totalARecevoir} article{totalARecevoir > 1 ? 's' : ''}
                  </span>
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                disabled={loading || totalARecevoir === 0}
              >
                <CheckIcon className="h-5 w-5" />
                {loading ? 'Réception en cours...' : 'Valider la réception'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
