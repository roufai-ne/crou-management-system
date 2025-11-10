/**
 * FICHIER: apps\web\src\components\financial\BudgetForm.tsx
 * COMPOSANT: BudgetForm - Formulaire de budget
 * 
 * DESCRIPTION:
 * Formulaire pour créer et modifier les budgets
 * Validation côté client et serveur
 * Intégration avec l'API et les permissions
 * 
 * FONCTIONNALITÉS:
 * - Création et modification de budgets
 * - Validation en temps réel
 * - Gestion des catégories budgétaires
 * - Sauvegarde automatique (brouillon)
 * - Design responsive et accessible
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { 
  Save, 
  Plus, 
  X, 
  DollarSign,
  Calendar,
  FileText
} from 'lucide-react';
import { useFinancialMutations } from '@/hooks/useApi';
import { useAuth } from '@/stores/auth';
import toast from 'react-hot-toast';

// Schéma de validation (types doivent matcher le backend)
const budgetSchema = z.object({
  exercice: z.number().min(2020).max(2030),
  type: z.enum(['national', 'crou', 'service']),
  libelle: z.string().min(1, 'Libellé requis').max(255, 'Libellé trop long'),
  description: z.string().optional(),
  montantInitial: z.number().min(0, 'Montant invalide'),
  categories: z.array(z.object({
    libelle: z.string().min(1, 'Libellé catégorie requis'),
    type: z.enum(['Personnel', 'Fonctionnement', 'Investissement', 'Subvention', 'Recette']), // Backend BudgetCategoryType enum
    montantAlloue: z.number().min(0, 'Montant invalide')
  })).optional()
});

type BudgetFormData = z.infer<typeof budgetSchema>;

// Interface pour les catégories (backend uses capitalized values)
interface BudgetCategory {
  id?: string;
  libelle: string;
  type: 'Personnel' | 'Fonctionnement' | 'Investissement' | 'Subvention' | 'Recette';
  montantAlloue: number;
}

interface BudgetFormProps {
  budget?: any; // Budget existant pour modification
  onSuccess?: (budget: any) => void;
  onCancel?: () => void;
  className?: string;
}

export function BudgetForm({ 
  budget, 
  onSuccess, 
  onCancel,
  className 
}: BudgetFormProps) {
  const { user } = useAuth();
  const { useCreateBudget, useUpdateBudget } = useFinancialMutations();
  
  const isEditing = !!budget;
  const createMutation = useCreateBudget();
  const updateMutation = useUpdateBudget();

  // État local pour les catégories
  const [categories, setCategories] = useState<BudgetCategory[]>(
    budget?.categories || []
  );

  // Configuration du formulaire
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      exercice: budget?.exercice || new Date().getFullYear(),
      type: budget?.type || 'crou',
      libelle: budget?.libelle || '',
      description: budget?.description || '',
      montantInitial: budget?.montantInitial || 0,
      categories: categories
    }
  });

  // Surveiller les changements pour la sauvegarde automatique
  const watchedValues = watch();
  
  useEffect(() => {
    if (isDirty && !isEditing) {
      // Sauvegarde automatique du brouillon (optionnel)
      const timeoutId = setTimeout(() => {
        // Implémenter la sauvegarde automatique si nécessaire
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [watchedValues, isDirty, isEditing]);

  // Soumettre le formulaire
  const onSubmit = async (data: BudgetFormData) => {
    try {
      const budgetData = {
        ...data,
        categories: categories
      };

      if (isEditing) {
        await updateMutation.mutateAsync({
          id: budget.id,
          data: budgetData
        });
        toast.success('Budget modifié avec succès');
      } else {
        const result = await createMutation.mutateAsync(budgetData);
        toast.success('Budget créé avec succès');
        onSuccess?.(result.data);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la sauvegarde');
    }
  };

  // Ajouter une catégorie
  const addCategory = () => {
    const newCategory: BudgetCategory = {
      libelle: '',
      type: 'Fonctionnement', // Backend uses capitalized values
      montantAlloue: 0
    };
    setCategories([...categories, newCategory]);
  };

  // Supprimer une catégorie
  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  // Mettre à jour une catégorie
  const updateCategory = (index: number, field: keyof BudgetCategory, value: any) => {
    const updated = [...categories];
    updated[index] = { ...updated[index], [field]: value };
    setCategories(updated);
  };

  // Calculer le total des catégories
  const totalCategories = categories.reduce((sum, cat) => sum + cat.montantAlloue, 0);
  const montantInitial = watch('montantInitial');
  const difference = montantInitial - totalCategories;

  // Configuration des types de catégories (backend uses capitalized values)
  const categoryTypes = [
    { value: 'Personnel', label: 'Personnel' },
    { value: 'Fonctionnement', label: 'Fonctionnement' },
    { value: 'Investissement', label: 'Investissement' },
    { value: 'Subvention', label: 'Subvention' },
    { value: 'Recette', label: 'Recette' }
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {isEditing ? 'Modifier le budget' : 'Nouveau budget'}
        </CardTitle>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="exercice"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Exercice *
                  </label>
                  <Input
                    {...field}
                    type="number"
                    min="2020"
                    max="2030"
                    className={errors.exercice ? 'border-red-500' : ''}
                  />
                  {errors.exercice && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.exercice.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <option value="crou">CROU</option>
                    <option value="national">National</option>
                    <option value="service">Service</option>
                  </Select>
                  {errors.type && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.type.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <Controller
            name="libelle"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Libellé *
                </label>
                <Input
                  {...field}
                  placeholder="Nom du budget"
                  className={errors.libelle ? 'border-red-500' : ''}
                />
                {errors.libelle && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.libelle.message}
                  </p>
                )}
              </div>
            )}
          />

          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Textarea
                  {...field}
                  placeholder="Description du budget"
                  rows={3}
                />
              </div>
            )}
          />

          <Controller
            name="montantInitial"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Montant initial (FCFA) *
                </label>
                <Input
                  {...field}
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="0"
                  className={errors.montantInitial ? 'border-red-500' : ''}
                />
                {errors.montantInitial && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.montantInitial.message}
                  </p>
                )}
              </div>
            )}
          />

          {/* Catégories budgétaires */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Catégories budgétaires
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCategory}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>

            {categories.map((category, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 p-4 border rounded-lg">
                <div className="md:col-span-2">
                  <Input
                    value={category.libelle}
                    onChange={(e) => updateCategory(index, 'libelle', e.target.value)}
                    placeholder="Libellé de la catégorie"
                  />
                </div>
                <div>
                  <Select
                    value={category.type}
                    onValueChange={(value) => updateCategory(index, 'type', value)}
                  >
                    {categoryTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    step="1000"
                    value={category.montantAlloue}
                    onChange={(e) => updateCategory(index, 'montantAlloue', Number(e.target.value))}
                    placeholder="0"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeCategory(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Résumé des catégories */}
            {categories.length > 0 && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total des catégories:</span>
                  <span className="font-semibold">
                    {totalCategories.toLocaleString()} FCFA
                  </span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Différence:</span>
                  <Badge variant={difference === 0 ? 'green' : 'orange'}>
                    {difference.toLocaleString()} FCFA
                  </Badge>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4 border-t">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              <Save className="w-4 h-4 mr-2" />
              {isEditing ? 'Modifier' : 'Créer'} le budget
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                Annuler
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
