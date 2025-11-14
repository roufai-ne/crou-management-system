/**
 * FICHIER: apps/web/src/components/allocation/AllocationForm.tsx
 * COMPOSANT: AllocationForm - Formulaire de création d'allocations
 *
 * DESCRIPTION:
 * Formulaire pour créer des allocations budgétaires ou de stock
 * Support hiérarchie à 3 niveaux (Ministry ’ Region ’ CROU)
 *
 * FONCTIONNALITÉS:
 * - Création allocations budgétaires et stock
 * - Sélection source et cible selon hiérarchie
 * - Validation montants/quantités
 * - Support allocations cascadées
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import {
  BanknotesIcon,
  CubeIcon,
  BuildingOfficeIcon,
  ArrowRightIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Button, Input, Select, Textarea } from '@/components/ui';
import {
  type HierarchyLevel,
  type CreateBudgetAllocationRequest,
  type CreateStockAllocationRequest,
  AllocationUtils
} from '@/services/api/allocationService';
import { useBudgetAllocations, useStockAllocations } from '@/hooks/useAllocations';
import toast from 'react-hot-toast';

// ================================================================================================
// TYPES
// ================================================================================================

type AllocationType = 'budget' | 'stock';

interface AllocationFormProps {
  /**
   * Type d'allocation à créer
   */
  type: AllocationType;

  /**
   * Callback appelé après création réussie
   */
  onSuccess?: (allocation: any) => void;

  /**
   * Callback appelé en cas d'annulation
   */
  onCancel?: () => void;

  /**
   * ID du budget source (pour allocations budgétaires)
   */
  budgetId?: string;

  /**
   * Niveau source pré-sélectionné
   */
  sourceLevel?: HierarchyLevel;

  /**
   * ID du tenant source pré-sélectionné
   */
  sourceTenantId?: string;

  /**
   * Classe CSS personnalisée
   */
  className?: string;
}

interface FormData {
  type: AllocationType;

  // Hiérarchie
  sourceLevel: HierarchyLevel;
  sourceTenantId: string;
  targetLevel: HierarchyLevel;
  targetTenantId: string;

  // Budget
  budgetId?: string;
  exercice: number;
  montant?: number;
  devise: string;
  category?: string;
  reference?: string;

  // Stock
  itemCode?: string;
  itemName?: string;
  quantity?: number;
  unit?: string;
  estimatedValue?: number;

  // Périodes
  dateDebut?: string;
  dateFin?: string;

  // Métadonnées
  description?: string;
  tags?: string;
  priorite?: 'low' | 'medium' | 'high' | 'urgent';
}

// ================================================================================================
// DONNÉES DE RÉFÉRENCE
// ================================================================================================

const HIERARCHY_LEVELS: { value: HierarchyLevel; label: string }[] = [
  { value: 'ministry', label: 'Ministère' },
  { value: 'region', label: 'Région' },
  { value: 'crou', label: 'CROU' }
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
  { value: 'urgent', label: 'Urgente' }
];

const CATEGORY_OPTIONS = [
  { value: 'fonctionnement', label: 'Fonctionnement' },
  { value: 'investissement', label: 'Investissement' },
  { value: 'social', label: 'Aide sociale' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'equipement', label: 'Équipement' }
];

const STOCK_UNITS = [
  { value: 'kg', label: 'Kilogrammes (kg)' },
  { value: 'tonne', label: 'Tonnes' },
  { value: 'unite', label: 'Unités' },
  { value: 'litre', label: 'Litres' },
  { value: 'sac', label: 'Sacs' },
  { value: 'carton', label: 'Cartons' }
];

// ================================================================================================
// COMPOSANT PRINCIPAL
// ================================================================================================

export const AllocationForm: React.FC<AllocationFormProps> = ({
  type,
  onSuccess,
  onCancel,
  budgetId,
  sourceLevel,
  sourceTenantId,
  className = ''
}) => {
  const { createBudgetAllocation, isCreating: isCreatingBudget } = useBudgetAllocations();
  const { createStockAllocation, isCreating: isCreatingStock } = useStockAllocations();

  const [availableTargetLevels, setAvailableTargetLevels] = useState<HierarchyLevel[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: {
      type,
      sourceLevel: sourceLevel || 'ministry',
      sourceTenantId: sourceTenantId || '',
      targetLevel: 'region',
      targetTenantId: '',
      exercice: new Date().getFullYear(),
      devise: 'XOF',
      unit: 'kg',
      priorite: 'medium'
    }
  });

  const watchSourceLevel = watch('sourceLevel');
  const watchMontant = watch('montant');
  const watchQuantity = watch('quantity');

  // Déterminer les niveaux cibles possibles selon le niveau source
  useEffect(() => {
    const targetLevels: Record<HierarchyLevel, HierarchyLevel[]> = {
      ministry: ['region'],
      region: ['crou'],
      crou: [] // CROU ne peut pas allouer plus bas
    };

    const available = targetLevels[watchSourceLevel] || [];
    setAvailableTargetLevels(available);

    // Auto-sélectionner le premier niveau cible disponible
    if (available.length > 0) {
      setValue('targetLevel', available[0]);
    }
  }, [watchSourceLevel, setValue]);

  // Validation côté client
  useEffect(() => {
    setValidationError(null);

    if (type === 'budget' && watchMontant) {
      if (watchMontant <= 0) {
        setValidationError('Le montant doit être positif');
      } else if (watchMontant > 1000000000000) {
        setValidationError('Le montant semble anormalement élevé');
      }
    }

    if (type === 'stock' && watchQuantity) {
      if (watchQuantity <= 0) {
        setValidationError('La quantité doit être positive');
      } else if (watchQuantity > 1000000) {
        setValidationError('La quantité semble anormalement élevée');
      }
    }
  }, [type, watchMontant, watchQuantity]);

  // Soumission du formulaire
  const onSubmit = async (data: FormData) => {
    try {
      setValidationError(null);

      if (type === 'budget') {
        // Création allocation budgétaire
        const request: CreateBudgetAllocationRequest = {
          level: data.targetLevel,
          sourceTenantId: data.sourceTenantId,
          sourceTenantLevel: data.sourceLevel,
          targetTenantId: data.targetTenantId,
          targetTenantLevel: data.targetLevel,
          budgetId: data.budgetId || budgetId,
          exercice: data.exercice,
          montant: data.montant!,
          devise: data.devise,
          category: data.category,
          reference: data.reference,
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
          description: data.description,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : [],
          priorite: data.priorite
        };

        const allocation = await createBudgetAllocation(request);
        toast.success(`Allocation budgétaire de ${AllocationUtils.formatCurrency(data.montant!)} créée`);
        onSuccess?.(allocation);
      } else {
        // Création allocation de stock
        const request: CreateStockAllocationRequest = {
          level: data.targetLevel,
          sourceTenantId: data.sourceTenantId,
          sourceTenantLevel: data.sourceLevel,
          targetTenantId: data.targetTenantId,
          targetTenantLevel: data.targetLevel,
          itemCode: data.itemCode!,
          itemName: data.itemName!,
          quantity: data.quantity!,
          unit: data.unit!,
          estimatedValue: data.estimatedValue,
          description: data.description,
          tags: data.tags ? data.tags.split(',').map(t => t.trim()) : []
        };

        const allocation = await createStockAllocation(request);
        toast.success(`Allocation de stock de ${data.quantity} ${data.unit} créée`);
        onSuccess?.(allocation);
      }
    } catch (error: any) {
      console.error('Erreur création allocation:', error);
      setValidationError(error.message || 'Erreur lors de la création de l\'allocation');
    }
  };

  const isSubmitting = isCreatingBudget || isCreatingStock;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={`allocation-form space-y-6 ${className}`}>
      {/* En-tête */}
      <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 dark:border-gray-700">
        {type === 'budget' ? (
          <BanknotesIcon className="w-8 h-8 text-primary-600" />
        ) : (
          <CubeIcon className="w-8 h-8 text-primary-600" />
        )}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {type === 'budget' ? 'Nouvelle allocation budgétaire' : 'Nouvelle allocation de stock'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Distribution de ressources dans la hiérarchie organisationnelle
          </p>
        </div>
      </div>

      {/* Alerte validation */}
      {validationError && (
        <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-md">
          <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{validationError}</p>
        </div>
      )}

      {/* Section Hiérarchie */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 flex items-center">
          <BuildingOfficeIcon className="w-5 h-5 mr-2 text-gray-400" />
          Hiérarchie
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Niveau source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau source
            </label>
            <Controller
              name="sourceLevel"
              control={control}
              rules={{ required: 'Niveau source requis' }}
              render={({ field }) => (
                <Select {...field} disabled={!!sourceLevel}>
                  {HIERARCHY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </Select>
              )}
            />
            {errors.sourceLevel && (
              <p className="mt-1 text-sm text-red-600">{errors.sourceLevel.message}</p>
            )}
          </div>

          {/* Tenant source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisme source
            </label>
            <Input
              {...register('sourceTenantId', { required: 'Organisme source requis' })}
              placeholder="ID de l'organisme source"
              disabled={!!sourceTenantId}
            />
            {errors.sourceTenantId && (
              <p className="mt-1 text-sm text-red-600">{errors.sourceTenantId.message}</p>
            )}
          </div>
        </div>

        {/* Flèche */}
        <div className="flex justify-center">
          <ArrowRightIcon className="w-6 h-6 text-gray-400 rotate-90 md:rotate-0" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Niveau cible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Niveau cible
            </label>
            <Controller
              name="targetLevel"
              control={control}
              rules={{ required: 'Niveau cible requis' }}
              render={({ field }) => (
                <Select {...field} disabled={availableTargetLevels.length === 0}>
                  {availableTargetLevels.length === 0 ? (
                    <option value="">Aucun niveau disponible</option>
                  ) : (
                    availableTargetLevels.map(level => (
                      <option key={level} value={level}>
                        {HIERARCHY_LEVELS.find(l => l.value === level)?.label}
                      </option>
                    ))
                  )}
                </Select>
              )}
            />
            {errors.targetLevel && (
              <p className="mt-1 text-sm text-red-600">{errors.targetLevel.message}</p>
            )}
          </div>

          {/* Tenant cible */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Organisme cible
            </label>
            <Input
              {...register('targetTenantId', { required: 'Organisme cible requis' })}
              placeholder="ID de l'organisme cible"
            />
            {errors.targetTenantId && (
              <p className="mt-1 text-sm text-red-600">{errors.targetTenantId.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Section spécifique Budget */}
      {type === 'budget' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <BanknotesIcon className="w-5 h-5 mr-2 text-gray-400" />
            Détails budgétaires
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Montant *
              </label>
              <Input
                type="number"
                step="0.01"
                {...register('montant', {
                  required: 'Montant requis',
                  min: { value: 0.01, message: 'Montant doit être positif' }
                })}
                placeholder="0.00"
              />
              {errors.montant && (
                <p className="mt-1 text-sm text-red-600">{errors.montant.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Devise
              </label>
              <Controller
                name="devise"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="XOF">FCFA (XOF)</option>
                    <option value="EUR">Euro (EUR)</option>
                    <option value="USD">Dollar US (USD)</option>
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Exercice
              </label>
              <Input
                type="number"
                {...register('exercice', { required: 'Exercice requis' })}
              />
              {errors.exercice && (
                <p className="mt-1 text-sm text-red-600">{errors.exercice.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Catégorie
              </label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    <option value="">Sélectionner...</option>
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Budget source
              </label>
              <Input
                {...register('budgetId')}
                placeholder="ID du budget source"
                defaultValue={budgetId}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Référence
              </label>
              <Input {...register('reference')} placeholder="REF-2025-001" />
            </div>
          </div>
        </div>
      )}

      {/* Section spécifique Stock */}
      {type === 'stock' && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <CubeIcon className="w-5 h-5 mr-2 text-gray-400" />
            Détails du stock
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Code article *
              </label>
              <Input
                {...register('itemCode', { required: 'Code article requis' })}
                placeholder="ART-001"
              />
              {errors.itemCode && (
                <p className="mt-1 text-sm text-red-600">{errors.itemCode.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom article *
              </label>
              <Input
                {...register('itemName', { required: 'Nom article requis' })}
                placeholder="Riz"
              />
              {errors.itemName && (
                <p className="mt-1 text-sm text-red-600">{errors.itemName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantité *
              </label>
              <Input
                type="number"
                step="0.01"
                {...register('quantity', {
                  required: 'Quantité requise',
                  min: { value: 0.01, message: 'Quantité doit être positive' }
                })}
                placeholder="0"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unité
              </label>
              <Controller
                name="unit"
                control={control}
                render={({ field }) => (
                  <Select {...field}>
                    {STOCK_UNITS.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </Select>
                )}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valeur estimée (optionnel)
              </label>
              <Input
                type="number"
                step="0.01"
                {...register('estimatedValue')}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>
      )}

      {/* Section commune */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">Informations complémentaires</h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date début
            </label>
            <Input type="date" {...register('dateDebut')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date fin
            </label>
            <Input type="date" {...register('dateFin')} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Priorité
          </label>
          <Controller
            name="priorite"
            control={control}
            render={({ field }) => (
              <Select {...field}>
                {PRIORITY_OPTIONS.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <Textarea
            {...register('description')}
            rows={3}
            placeholder="Description détaillée de l'allocation..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tags (séparés par des virgules)
          </label>
          <Input {...register('tags')} placeholder="urgent, prioritaire, budget2025" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
            Annuler
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting || !!validationError || availableTargetLevels.length === 0}
          loading={isSubmitting}
        >
          {isSubmitting ? 'Création...' : 'Créer l\'allocation'}
        </Button>
      </div>
    </form>
  );
};

export default AllocationForm;
