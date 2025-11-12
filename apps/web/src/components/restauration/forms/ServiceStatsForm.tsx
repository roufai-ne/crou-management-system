/**
 * FICHIER: apps/web/src/components/restauration/forms/ServiceStatsForm.tsx
 * COMPOSANT: ServiceStatsForm - Formulaire statistiques post-service
 *
 * DESCRIPTION:
 * Formulaire pour saisir les statistiques après terminaison d'un service
 * Validation avec React Hook Form + Zod
 *
 * FONCTIONNALITÉS:
 * - Saisie rationnaires servis
 * - Saisie recettes totales
 * - Saisie gaspillage
 * - Observations
 * - Validation: servis ≤ rationnaires prévus
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Button } from '@/components/ui';
import { Repas, TerminerServiceRequest } from '@/services/api/restaurationService';

// Schéma de validation Zod
const serviceStatsSchema = z.object({
  nombreServis: z.number()
    .min(0, 'Le nombre doit être positif')
    .max(10000, 'Nombre maximum: 10000'),
  recettesTotales: z.number()
    .min(0, 'Les recettes doivent être positives'),
  gaspillage: z.number()
    .min(0, 'Le gaspillage doit être positif')
    .optional(),
  observations: z.string().optional(),
});

type ServiceStatsFormData = z.infer<typeof serviceStatsSchema>;

interface ServiceStatsFormProps {
  repas: Repas;
  onSubmit: (data: TerminerServiceRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const ServiceStatsForm: React.FC<ServiceStatsFormProps> = ({
  repas,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ServiceStatsFormData>({
    resolver: zodResolver(serviceStatsSchema),
    defaultValues:{
      nombreServis: 0,
      recettesTotales: 0,
      gaspillage: 0,
      observations: '',
    },
  });

  const nombreServis = watch('nombreServis');

  // Validation custom: servis ≤ rationnaires prévus
  const validateNombreServis = (value: number) => {
    if (value > repas.nombreRationnaires) {
      return `Maximum: ${repas.nombreRationnaires} rationnaires prévus`;
    }
    return true;
  };

  const handleFormSubmit = async (data: ServiceStatsFormData) => {
    try {
      await onSubmit(data as TerminerServiceRequest);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Info repas */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Restaurant:</p>
            <p className="font-medium">{repas.restaurant?.nom}</p>
          </div>
          <div>
            <p className="text-gray-600">Menu:</p>
            <p className="font-medium">{repas.menu?.titre}</p>
          </div>
          <div>
            <p className="text-gray-600">Date:</p>
            <p className="font-medium">{new Date(repas.dateService).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-gray-600">Rationnaires prévus:</p>
            <p className="font-medium text-blue-700">{repas.nombreRationnaires}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Controller
          name="nombreServis"
          control={control}
          rules={{ validate: validateNombreServis }}
          render={({ field: { onChange, value, ...field }, fieldState }) => (
            <Input
              {...field}
              type="number"
              label="Nombre de rationnaires servis"
              placeholder="0"
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value) || 0)}
              error={fieldState.error?.message || errors.nombreServis?.message}
              required
              helpText={`Maximum: ${repas.nombreRationnaires} rationnaires prévus`}
            />
          )}
        />

        <Controller
          name="recettesTotales"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Recettes totales (XOF)"
              placeholder="0"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              error={errors.recettesTotales?.message}
              required
              helpText="Montant total collecté pendant le service"
            />
          )}
        />

        <Controller
          name="gaspillage"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Gaspillage estimé (kg)"
              placeholder="0"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
              error={errors.gaspillage?.message}
              helpText="Estimation du gaspillage alimentaire"
            />
          )}
        />

        <Controller
          name="observations"
          control={control}
          render={({ field }) => (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observations
              </label>
              <textarea
                {...field}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Remarques sur le service (incidents, satisfactions, etc.)"
              />
            </div>
          )}
        />
      </div>

      {/* Calcul automatique du taux de fréquentation */}
      {nombreServis > 0 && (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Taux de fréquentation</p>
          <p className="text-2xl font-bold text-green-700">
            {((nombreServis / repas.nombreRationnaires) * 100).toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {nombreServis} servis sur {repas.nombreRationnaires} prévus
          </p>
        </div>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : 'Terminer le Service'}
        </Button>
      </div>
    </form>
  );
};

export default ServiceStatsForm;
