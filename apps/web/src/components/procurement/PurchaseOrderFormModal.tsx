import React, { useState } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { CreatePurchaseOrderRequest, PurchaseOrderType, PaymentMethod } from '@/services/api/procurementService';

interface PurchaseOrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePurchaseOrderRequest) => Promise<void>;
  budgets?: Array<{ id: string; libelle: string }>;
  suppliers?: Array<{ id: string; nom: string }>;
}

interface OrderItem {
  designation: string;
  description: string;
  quantiteCommandee: number;
  unite: string;
  prixUnitaire: number;
  tauxTVA: number;
}

export const PurchaseOrderFormModal: React.FC<PurchaseOrderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  budgets = [],
  suppliers = [],
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    budgetId: '',
    supplierId: '',
    objet: '',
    description: '',
    type: 'STANDARD' as PurchaseOrderType,
    modePaiement: 'VIREMENT' as PaymentMethod,
    delaiPaiement: 30,
  });

  const [items, setItems] = useState<OrderItem[]>([
    {
      designation: '',
      description: '',
      quantiteCommandee: 1,
      unite: 'unité',
      prixUnitaire: 0,
      tauxTVA: 18,
    },
  ]);

  const addItem = () => {
    setItems([
      ...items,
      {
        designation: '',
        description: '',
        quantiteCommandee: 1,
        unite: 'unité',
        prixUnitaire: 0,
        tauxTVA: 18,
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    let totalHT = 0;
    let totalTVA = 0;

    items.forEach(item => {
      const montantHT = item.quantiteCommandee * item.prixUnitaire;
      const montantTVA = montantHT * (item.tauxTVA / 100);
      totalHT += montantHT;
      totalTVA += montantTVA;
    });

    return {
      totalHT,
      totalTVA,
      totalTTC: totalHT + totalTVA,
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.budgetId) {
      setError('Veuillez sélectionner un budget');
      return;
    }
    if (!formData.supplierId) {
      setError('Veuillez sélectionner un fournisseur');
      return;
    }
    if (!formData.objet.trim()) {
      setError('Veuillez saisir l\'objet du bon de commande');
      return;
    }
    if (items.length === 0 || items.some(item => !item.designation.trim())) {
      setError('Veuillez ajouter au moins un article avec une désignation');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        ...formData,
        items: items.map(item => ({
          designation: item.designation,
          description: item.description,
          quantiteCommandee: item.quantiteCommandee,
          unite: item.unite,
          prixUnitaire: item.prixUnitaire,
          tauxTVA: item.tauxTVA,
        })),
      });
      onClose();
      // Reset form
      setFormData({
        budgetId: '',
        supplierId: '',
        objet: '',
        description: '',
        type: 'STANDARD',
        modePaiement: 'VIREMENT',
        delaiPaiement: 30,
      });
      setItems([
        {
          designation: '',
          description: '',
          quantiteCommandee: 1,
          unite: 'unité',
          prixUnitaire: 0,
          tauxTVA: 18,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du bon de commande');
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (!isOpen) return null;

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
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Nouveau Bon de Commande
            </h2>
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

              {/* Section 1: Informations Générales */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Informations Générales
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Budget *
                    </label>
                    <select
                      value={formData.budgetId}
                      onChange={(e) => setFormData({ ...formData, budgetId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Sélectionner un budget</option>
                      {budgets.map(budget => (
                        <option key={budget.id} value={budget.id}>
                          {budget.libelle}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fournisseur */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Fournisseur *
                    </label>
                    <select
                      value={formData.supplierId}
                      onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                      required
                    >
                      <option value="">Sélectionner un fournisseur</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as PurchaseOrderType })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="STANDARD">Standard</option>
                      <option value="URGENT">Urgent</option>
                      <option value="FRAMEWORK">Accord-cadre</option>
                      <option value="CONTRACT">Contrat</option>
                    </select>
                  </div>

                  {/* Mode de Paiement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mode de Paiement
                    </label>
                    <select
                      value={formData.modePaiement}
                      onChange={(e) => setFormData({ ...formData, modePaiement: e.target.value as PaymentMethod })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="VIREMENT">Virement</option>
                      <option value="CHEQUE">Chèque</option>
                      <option value="ESPECES">Espèces</option>
                      <option value="CARTE">Carte</option>
                    </select>
                  </div>
                </div>

                {/* Objet */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Objet *
                  </label>
                  <input
                    type="text"
                    value={formData.objet}
                    onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    placeholder="Ex: Fournitures de bureau pour Q1 2025"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                    rows={3}
                    placeholder="Détails supplémentaires..."
                  />
                </div>
              </div>

              {/* Section 2: Articles */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Articles
                  </h3>
                  <button
                    type="button"
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                  >
                    <PlusIcon className="h-4 w-4" />
                    Ajouter un article
                  </button>
                </div>

                <div className="space-y-4">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {/* Désignation */}
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Désignation *
                            </label>
                            <input
                              type="text"
                              value={item.designation}
                              onChange={(e) => updateItem(index, 'designation', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              placeholder="Ex: Ramette papier A4"
                              required
                            />
                          </div>

                          {/* Quantité */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Quantité *
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={item.quantiteCommandee}
                              onChange={(e) => updateItem(index, 'quantiteCommandee', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              required
                            />
                          </div>

                          {/* Unité */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Unité
                            </label>
                            <input
                              type="text"
                              value={item.unite}
                              onChange={(e) => updateItem(index, 'unite', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              placeholder="Ex: unité, kg, boîte"
                            />
                          </div>

                          {/* Prix Unitaire */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Prix Unitaire (XOF) *
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.prixUnitaire}
                              onChange={(e) => updateItem(index, 'prixUnitaire', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                              required
                            />
                          </div>

                          {/* TVA */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              TVA (%)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={item.tauxTVA}
                              onChange={(e) => updateItem(index, 'tauxTVA', parseFloat(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>

                        {/* Delete Button */}
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>

                      {/* Total Ligne */}
                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Total ligne: <span className="font-semibold text-gray-900 dark:text-white">
                            {(item.quantiteCommandee * item.prixUnitaire * (1 + item.tauxTVA / 100)).toLocaleString()} XOF
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Totaux */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total HT:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totals.totalHT.toLocaleString()} XOF
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total TVA:</span>
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {totals.totalTVA.toLocaleString()} XOF
                  </span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-gray-900 dark:text-white">Total TTC:</span>
                  <span className="text-primary-600 dark:text-primary-400">
                    {totals.totalTTC.toLocaleString()} XOF
                  </span>
                </div>
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
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? 'Création...' : 'Créer le Bon de Commande'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
