/**
 * FICHIER: apps/web/src/components/restauration/forms/PlatEditor.tsx
 * COMPOSANT: PlatEditor - Éditeur de plat pour menu
 *
 * DESCRIPTION:
 * Composant pour créer/éditer un plat avec ses ingrédients
 * Utilisé dans MenuForm pour composer les menus
 *
 * FONCTIONNALITÉS:
 * - Nom du plat
 * - Type de plat (entrée, plat principal, dessert, boisson)
 * - Liste d'ingrédients avec quantités
 * - Ajout/suppression d'ingrédients
 * - Validation des données
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { Input, Select, Button } from '@/components/ui';

export enum TypePlat {
  ENTREE = 'ENTREE',
  PLAT_PRINCIPAL = 'PLAT_PRINCIPAL',
  DESSERT = 'DESSERT',
  BOISSON = 'BOISSON',
}

export interface Ingredient {
  id: string;
  denreeId: string;
  denreeNom: string;
  quantite: number;
  unite: string;
}

export interface PlatData {
  id?: string;
  nom: string;
  type: TypePlat;
  ingredients: Ingredient[];
}

interface DenreeOption {
  id: string;
  nom: string;
  unite: string;
}

interface PlatEditorProps {
  initialData?: PlatData;
  availableDenrees: DenreeOption[];
  onSave: (plat: PlatData) => void;
  onCancel: () => void;
}

export const PlatEditor: React.FC<PlatEditorProps> = ({
  initialData,
  availableDenrees,
  onSave,
  onCancel,
}) => {
  const [nom, setNom] = useState(initialData?.nom || '');
  const [type, setType] = useState<TypePlat>(initialData?.type || TypePlat.PLAT_PRINCIPAL);
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialData?.ingredients || []);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Ingredient form state
  const [selectedDenreeId, setSelectedDenreeId] = useState('');
  const [quantite, setQuantite] = useState<number>(0);

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!nom || nom.trim().length < 3) {
      newErrors.nom = 'Le nom doit contenir au moins 3 caractères';
    }

    if (ingredients.length === 0) {
      newErrors.ingredients = 'Au moins un ingrédient est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddIngredient = () => {
    if (!selectedDenreeId) {
      setErrors({ ...errors, ingredient: 'Sélectionner une denrée' });
      return;
    }

    if (quantite <= 0) {
      setErrors({ ...errors, ingredient: 'Quantité doit être > 0' });
      return;
    }

    // Check if already exists
    if (ingredients.find(ing => ing.denreeId === selectedDenreeId)) {
      setErrors({ ...errors, ingredient: 'Cette denrée est déjà dans la liste' });
      return;
    }

    const denree = availableDenrees.find(d => d.id === selectedDenreeId);
    if (!denree) return;

    const newIngredient: Ingredient = {
      id: `ing-${Date.now()}-${Math.random()}`,
      denreeId: denree.id,
      denreeNom: denree.nom,
      quantite,
      unite: denree.unite,
    };

    setIngredients([...ingredients, newIngredient]);
    setSelectedDenreeId('');
    setQuantite(0);
    setErrors({ ...errors, ingredient: undefined });
  };

  const handleRemoveIngredient = (id: string) => {
    setIngredients(ingredients.filter(ing => ing.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const platData: PlatData = {
      id: initialData?.id,
      nom: nom.trim(),
      type,
      ingredients,
    };

    onSave(platData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* Nom du plat */}
        <Input
          label="Nom du plat"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          error={errors.nom}
          placeholder="Ex: Poulet yassa avec riz"
          required
        />

        {/* Type de plat */}
        <Select
          label="Type de plat"
          value={type}
          onChange={(e) => setType(e.target.value as TypePlat)}
          options={[
            { value: TypePlat.ENTREE, label: 'Entrée' },
            { value: TypePlat.PLAT_PRINCIPAL, label: 'Plat Principal' },
            { value: TypePlat.DESSERT, label: 'Dessert' },
            { value: TypePlat.BOISSON, label: 'Boisson' },
          ]}
          required
        />

        {/* Ingredients section */}
        <div className="border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Ingrédients <span className="text-red-500">*</span>
          </h4>

          {/* Add ingredient form */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Select
                  label="Denrée"
                  value={selectedDenreeId}
                  onChange={(e) => setSelectedDenreeId(e.target.value)}
                  options={[
                    { value: '', label: 'Sélectionner une denrée...' },
                    ...availableDenrees
                      .filter(d => !ingredients.find(ing => ing.denreeId === d.id))
                      .map(d => ({
                        value: d.id,
                        label: `${d.nom} (${d.unite})`
                      }))
                  ]}
                />
              </div>
              <Input
                label="Quantité"
                type="number"
                step="0.01"
                value={quantite}
                onChange={(e) => setQuantite(parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleAddIngredient}
              className="w-full"
            >
              + Ajouter l'ingrédient
            </Button>
            {errors.ingredient && (
              <p className="text-sm text-red-600">{errors.ingredient}</p>
            )}
          </div>

          {/* Ingredients list */}
          {ingredients.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm text-gray-600">
                Ingrédients ajoutés ({ingredients.length})
              </p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {ingredients.map((ing) => (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between bg-white p-3 rounded border border-gray-200"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{ing.denreeNom}</p>
                      <p className="text-xs text-gray-600">
                        {ing.quantite} {ing.unite}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing.id)}
                      className="text-red-600 hover:text-red-800 text-sm ml-4"
                    >
                      Retirer
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                Aucun ingrédient ajouté. Veuillez ajouter au moins un ingrédient.
              </p>
            </div>
          )}
          {errors.ingredients && (
            <p className="text-sm text-red-600 mt-2">{errors.ingredients}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" variant="primary">
          {initialData ? 'Modifier le plat' : 'Ajouter le plat'}
        </Button>
      </div>
    </form>
  );
};

export default PlatEditor;
