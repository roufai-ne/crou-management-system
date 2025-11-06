/**
 * FICHIER: apps/web/src/components/financial/TransactionForm.tsx
 * COMPOSANT: TransactionForm - Formulaire de transaction
 *
 * DESCRIPTION:
 * Formulaire pour créer et éditer des transactions financières
 * Support multi-type (dépense, recette, engagement, etc.)
 * Validation et gestion des catégories budgétaires
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { financialService } from '@/services/api/financialService';
import { useAuth } from '@/stores/auth';

// Types de transaction
const transactionTypes = [
  { value: 'depense', label: 'Dépense' },
  { value: 'recette', label: 'Recette' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'ajustement', label: 'Ajustement' },
  { value: 'virement', label: 'Virement' }
];

// Catégories de transaction
const transactionCategories = [
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'logement', label: 'Logement' },
  { value: 'transport', label: 'Transport' },
  { value: 'administratif', label: 'Administratif' },
  { value: 'equipement', label: 'Équipement' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'personnel', label: 'Personnel' },
  { value: 'autre', label: 'Autre' }
];

export interface TransactionFormData {
  budgetId: string;
  type: string;
  category: string;
  libelle: string;
  description?: string;
  montant: number;
  date: string;
  beneficiaire?: string;
  fournisseur?: string;
  pieceJustificative?: string;
}

export interface TransactionFormProps {
  initialData?: Partial<TransactionFormData>;
  budgets: Array<{ id: string; libelle: string; montantDisponible: number }>;
  onSubmit: (data: TransactionFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
}

export function TransactionForm({
  initialData,
  budgets,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create'
}: TransactionFormProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState<TransactionFormData>({
    budgetId: '',
    type: 'depense',
    category: 'alimentation',
    libelle: '',
    description: '',
    montant: 0,
    date: new Date().toISOString().split('T')[0],
    beneficiaire: '',
    fournisseur: '',
    pieceJustificative: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedBudget, setSelectedBudget] = useState<any>(null);

  // Mettre à jour le budget sélectionné
  useEffect(() => {
    if (formData.budgetId) {
      const budget = budgets.find(b => b.id === formData.budgetId);
      setSelectedBudget(budget);
    }
  }, [formData.budgetId, budgets]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'montant' ? parseFloat(value) || 0 : value
    }));

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.budgetId) {
      newErrors.budgetId = 'Veuillez sélectionner un budget';
    }

    if (!formData.libelle || formData.libelle.trim().length === 0) {
      newErrors.libelle = 'Le libellé est requis';
    }

    if (formData.montant <= 0) {
      newErrors.montant = 'Le montant doit être supérieur à zéro';
    }

    // Vérifier le montant disponible pour les dépenses
    if (
      ['depense', 'engagement'].includes(formData.type) &&
      selectedBudget &&
      formData.montant > selectedBudget.montantDisponible
    ) {
      newErrors.montant = `Montant supérieur au budget disponible (${selectedBudget.montantDisponible.toLocaleString()} FCFA)`;
    }

    if (!formData.date) {
      newErrors.date = 'La date est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Budget et Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Budget *
          </label>
          <Select
            name="budgetId"
            value={formData.budgetId}
            onChange={handleChange}
            disabled={loading || mode === 'edit'}
            required
          >
            <option value="">Sélectionner un budget</option>
            {budgets.map(budget => (
              <option key={budget.id} value={budget.id}>
                {budget.libelle} ({budget.montantDisponible.toLocaleString()} FCFA disponible)
              </option>
            ))}
          </Select>
          {errors.budgetId && (
            <p className="mt-1 text-sm text-red-600">{errors.budgetId}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Type de transaction *
          </label>
          <Select
            name="type"
            value={formData.type}
            onChange={handleChange}
            disabled={loading || mode === 'edit'}
            required
          >
            {transactionTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Catégorie et Date */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Catégorie *
          </label>
          <Select
            name="category"
            value={formData.category}
            onChange={handleChange}
            disabled={loading}
            required
          >
            {transactionCategories.map(cat => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date *
          </label>
          <Input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            disabled={loading}
            required
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>
      </div>

      {/* Libellé */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Libellé *
        </label>
        <Input
          type="text"
          name="libelle"
          value={formData.libelle}
          onChange={handleChange}
          placeholder="Ex: Achat de denrées alimentaires"
          disabled={loading}
          required
        />
        {errors.libelle && (
          <p className="mt-1 text-sm text-red-600">{errors.libelle}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Description détaillée de la transaction..."
          rows={3}
          disabled={loading}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Montant */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Montant (FCFA) *
        </label>
        <Input
          type="number"
          name="montant"
          value={formData.montant}
          onChange={handleChange}
          min="0"
          step="0.01"
          placeholder="0.00"
          disabled={loading}
          required
        />
        {errors.montant && (
          <p className="mt-1 text-sm text-red-600">{errors.montant}</p>
        )}
        {selectedBudget && ['depense', 'engagement'].includes(formData.type) && (
          <p className="mt-1 text-sm text-gray-500">
            Disponible: {selectedBudget.montantDisponible.toLocaleString()} FCFA
          </p>
        )}
      </div>

      {/* Bénéficiaire et Fournisseur */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Bénéficiaire
          </label>
          <Input
            type="text"
            name="beneficiaire"
            value={formData.beneficiaire}
            onChange={handleChange}
            placeholder="Nom du bénéficiaire"
            disabled={loading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fournisseur
          </label>
          <Input
            type="text"
            name="fournisseur"
            value={formData.fournisseur}
            onChange={handleChange}
            placeholder="Nom du fournisseur"
            disabled={loading}
          />
        </div>
      </div>

      {/* Pièce justificative */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Pièce justificative (Référence)
        </label>
        <Input
          type="text"
          name="pieceJustificative"
          value={formData.pieceJustificative}
          onChange={handleChange}
          placeholder="Numéro de facture, bon de commande, etc."
          disabled={loading}
        />
      </div>

      {/* Avertissement budget */}
      {selectedBudget && formData.montant > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <Card.Content className="py-3">
            <div className="flex items-start gap-3">
              <div className="text-blue-600 mt-0.5">ℹ️</div>
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Impact sur le budget</p>
                <p>
                  {formData.type === 'depense' || formData.type === 'engagement'
                    ? `Cette ${formData.type} réduira le montant disponible du budget "${selectedBudget.libelle}".`
                    : formData.type === 'recette'
                    ? `Cette recette augmentera le montant disponible du budget "${selectedBudget.libelle}".`
                    : `Cette opération modifiera le budget "${selectedBudget.libelle}".`}
                </p>
                <p className="mt-1">
                  Nouveau disponible:{' '}
                  <span className="font-semibold">
                    {(
                      selectedBudget.montantDisponible +
                      (formData.type === 'recette' ? formData.montant : -formData.montant)
                    ).toLocaleString()}{' '}
                    FCFA
                  </span>
                </p>
              </div>
            </div>
          </Card.Content>
        </Card>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading
            ? 'Enregistrement...'
            : mode === 'create'
            ? 'Créer la transaction'
            : 'Enregistrer les modifications'}
        </Button>
      </div>
    </form>
  );
}
