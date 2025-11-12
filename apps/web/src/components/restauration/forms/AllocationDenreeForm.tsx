/**
 * FICHIER: apps/web/src/components/restauration/forms/AllocationDenreeForm.tsx
 * COMPOSANT: AllocationDenreeForm - Formulaire allocation denrée
 *
 * DESCRIPTION:
 * Formulaire pour allouer une denrée depuis le stock vers un restaurant
 * Validation avec React Hook Form + Zod
 *
 * FONCTIONNALITÉS:
 * - Sélection restaurant
 * - Autocomplete denrée depuis Stocks avec disponibilité
 * - Quantité + unité (auto depuis stock)
 * - Date péremption
 * - Motif allocation
 * - Validation: quantité ≤ stock disponible
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button } from '@/components/ui';
import { AllouerDenreeRequest } from '@/services/api/restaurationService';

// Types pour les stocks (à adapter selon votre API Stocks)
interface StockItem {
  id: string;
  denreeId: string;
  denreeNom: string;
  quantiteDisponible: number;
  unite: string;
  prixUnitaire: number;
  datePeremption?: string;
}

interface Restaurant {
  id: string;
  nom: string;
  code: string;
}

// Schéma de validation Zod
const allocationDenreeSchema = z.object({
  restaurantId: z.string().min(1, 'Restaurant requis'),
  denreeId: z.string().min(1, 'Denrée requise'),
  quantite: z.number()
    .min(0.01, 'La quantité doit être supérieure à 0')
    .max(100000, 'Quantité maximum: 100000'),
  datePeremption: z.string().optional(),
  motif: z.string()
    .min(5, 'Le motif doit contenir au moins 5 caractères')
    .max(500, 'Maximum 500 caractères'),
});

type AllocationDenreeFormData = z.infer<typeof allocationDenreeSchema>;

interface AllocationDenreeFormProps {
  restaurants: Restaurant[];
  availableStocks: StockItem[]; // Stocks disponibles depuis le module Stocks
  onSubmit: (data: AllouerDenreeRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const AllocationDenreeForm: React.FC<AllocationDenreeFormProps> = ({
  restaurants,
  availableStocks,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [selectedStock, setSelectedStock] = useState<StockItem | null>(null);
  const [filteredStocks, setFilteredStocks] = useState<StockItem[]>(availableStocks);
  const [searchTerm, setSearchTerm] = useState('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useForm<AllocationDenreeFormData>({
    resolver: zodResolver(allocationDenreeSchema),
    defaultValues: {
      restaurantId: '',
      denreeId: '',
      quantite: 0,
      datePeremption: '',
      motif: '',
    },
  });

  const denreeId = watch('denreeId');
  const quantite = watch('quantite');

  // Filter stocks based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredStocks(availableStocks);
    } else {
      const filtered = availableStocks.filter(stock =>
        stock.denreeNom.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStocks(filtered);
    }
  }, [searchTerm, availableStocks]);

  // Update selected stock when denreeId changes
  useEffect(() => {
    if (denreeId) {
      const stock = availableStocks.find(s => s.denreeId === denreeId);
      setSelectedStock(stock || null);

      // Auto-fill date péremption if available
      if (stock?.datePeremption) {
        setValue('datePeremption', stock.datePeremption);
      }
    } else {
      setSelectedStock(null);
    }
  }, [denreeId, availableStocks, setValue]);

  // Validation custom: quantité ≤ stock disponible
  const validateQuantite = (value: number) => {
    if (!selectedStock) {
      return 'Veuillez d\'abord sélectionner une denrée';
    }
    if (value > selectedStock.quantiteDisponible) {
      return `Maximum disponible: ${selectedStock.quantiteDisponible} ${selectedStock.unite}`;
    }
    return true;
  };

  // Calculate total cost
  const totalCost = selectedStock && quantite > 0
    ? (quantite * selectedStock.prixUnitaire).toFixed(2)
    : '0.00';

  const handleFormSubmit = async (data: AllocationDenreeFormData) => {
    try {
      const submitData: AllouerDenreeRequest = {
        restaurantId: data.restaurantId,
        denreeId: data.denreeId,
        quantite: data.quantite,
        datePeremption: data.datePeremption,
        motif: data.motif,
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Info importante */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> L'allocation d'une denrée créera automatiquement
          un mouvement de sortie dans le module Stocks et un mouvement d'entrée
          pour le restaurant sélectionné.
        </p>
      </div>

      <div className="space-y-4">
        {/* Sélection Restaurant */}
        <Controller
          name="restaurantId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Restaurant destinataire"
              options={[
                { value: '', label: 'Sélectionner un restaurant...' },
                ...restaurants.map(r => ({
                  value: r.id,
                  label: `${r.code} - ${r.nom}`
                }))
              ]}
              error={errors.restaurantId?.message}
              required
            />
          )}
        />

        {/* Recherche et sélection Denrée */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Denrée <span className="text-red-500">*</span>
          </label>

          {/* Search input */}
          <Input
            type="text"
            placeholder="Rechercher une denrée..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />

          {/* Denree selector */}
          <Controller
            name="denreeId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: '', label: 'Sélectionner une denrée...' },
                  ...filteredStocks.map(stock => ({
                    value: stock.denreeId,
                    label: `${stock.denreeNom} (Dispo: ${stock.quantiteDisponible} ${stock.unite})`
                  }))
                ]}
                error={errors.denreeId?.message}
                required
              />
            )}
          />

          {/* Stock info display */}
          {selectedStock && (
            <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-gray-600">Stock disponible:</p>
                  <p className="font-medium text-green-700">
                    {selectedStock.quantiteDisponible} {selectedStock.unite}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Prix unitaire:</p>
                  <p className="font-medium">{selectedStock.prixUnitaire} XOF</p>
                </div>
                {selectedStock.datePeremption && (
                  <div className="col-span-2">
                    <p className="text-gray-600">Date péremption stock:</p>
                    <p className="font-medium">
                      {new Date(selectedStock.datePeremption).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quantité */}
        <Controller
          name="quantite"
          control={control}
          rules={{ validate: validateQuantite }}
          render={({ field: { onChange, value, ...field }, fieldState }) => (
            <Input
              {...field}
              type="number"
              step="0.01"
              label="Quantité à allouer"
              placeholder="0"
              value={value}
              onChange={(e) => {
                const val = parseFloat(e.target.value) || 0;
                onChange(val);
                trigger('quantite'); // Re-validate on change
              }}
              error={fieldState.error?.message || errors.quantite?.message}
              required
              helpText={
                selectedStock
                  ? `Unité: ${selectedStock.unite} (Max: ${selectedStock.quantiteDisponible})`
                  : 'Sélectionnez d\'abord une denrée'
              }
            />
          )}
        />

        {/* Calcul coût total */}
        {selectedStock && quantite > 0 && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Coût total de l'allocation</p>
            <p className="text-2xl font-bold text-green-700">
              {totalCost} XOF
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {quantite} {selectedStock.unite} × {selectedStock.prixUnitaire} XOF
            </p>
          </div>
        )}

        {/* Date péremption */}
        <Controller
          name="datePeremption"
          control={control}
          render={({ field }) => (
            <Input
              {...field}
              type="date"
              label="Date de péremption"
              error={errors.datePeremption?.message}
              helpText="Laisser vide si pas de date de péremption"
            />
          )}
        />

        {/* Motif */}
        <Controller
          name="motif"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif de l'allocation <span className="text-red-500">*</span>
              </label>
              <textarea
                {...field}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Ex: Approvisionnement hebdomadaire pour service du lundi au vendredi"
              />
              {errors.motif && (
                <p className="mt-1 text-sm text-red-600">{errors.motif.message}</p>
              )}
            </div>
          )}
        />
      </div>

      {/* Warning si stock bas après allocation */}
      {selectedStock && quantite > 0 && (
        selectedStock.quantiteDisponible - quantite < selectedStock.quantiteDisponible * 0.25 && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Attention:</strong> Après cette allocation, le stock restant sera de{' '}
              <strong>{(selectedStock.quantiteDisponible - quantite).toFixed(2)} {selectedStock.unite}</strong>
              {' '}({((selectedStock.quantiteDisponible - quantite) / selectedStock.quantiteDisponible * 100).toFixed(0)}% du stock actuel).
              Pensez à réapprovisionner.
            </p>
          </div>
        )
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !selectedStock}
        >
          {isSubmitting ? 'Allocation...' : 'Allouer la Denrée'}
        </Button>
      </div>
    </form>
  );
};

export default AllocationDenreeForm;
