/**
 * FICHIER: apps/web/src/components/restauration/forms/RestaurantForm.tsx
 * COMPOSANT: RestaurantForm - Formulaire réutilisable pour Restaurant
 *
 * DESCRIPTION:
 * Formulaire complet pour création/modification d'un restaurant
 * Validation avec React Hook Form + Zod
 *
 * FONCTIONNALITÉS:
 * - Mode create/edit
 * - Validation complète
 * - Sections: Info générales, Horaires, Équipements, Tarifs
 * - Gestion des erreurs
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button } from '@/components/ui';
import {
  RestaurantType,
  RestaurantStatus,
  Restaurant,
  CreateRestaurantRequest
} from '@/services/api/restaurationService';

// Schéma de validation Zod
const restaurantSchema = z.object({
  nom: z.string().min(3, 'Le nom doit contenir au moins 3 caractères'),
  type: z.nativeEnum(RestaurantType, {
    errorMap: () => ({ message: 'Type de restaurant requis' })
  }),
  status: z.nativeEnum(RestaurantStatus, {
    errorMap: () => ({ message: 'Statut requis' })
  }),
  adresse: z.string().optional(),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  capaciteMax: z.number()
    .min(1, 'La capacité doit être supérieure à 0')
    .max(10000, 'Capacité maximale: 10000'),
  responsable: z.string().optional(),

  // Horaires
  horairePetitDejeunerDebut: z.string().optional(),
  horairePetitDejeunerFin: z.string().optional(),
  horaireDejeunerDebut: z.string().optional(),
  horaireDejeunerFin: z.string().optional(),
  horaireDinerDebut: z.string().optional(),
  horaireDinerFin: z.string().optional(),

  // Tarifs
  tarifPetitDejeuner: z.number().min(0).optional(),
  tarifDejeuner: z.number().min(0).optional(),
  tarifDiner: z.number().min(0).optional(),
});

type RestaurantFormData = z.infer<typeof restaurantSchema>;

interface RestaurantFormProps {
  initialData?: Restaurant;
  onSubmit: (data: CreateRestaurantRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const RestaurantForm: React.FC<RestaurantFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const isEditMode = !!initialData;

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<RestaurantFormData>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: {
      nom: initialData?.nom || '',
      type: initialData?.type || RestaurantType.UNIVERSITAIRE,
      status: initialData?.status || RestaurantStatus.ACTIF,
      adresse: initialData?.adresse || '',
      telephone: initialData?.telephone || '',
      email: initialData?.email || '',
      capaciteMax: initialData?.capaciteMax || 100,
      responsable: initialData?.responsable || '',

      // Horaires
      horairePetitDejeunerDebut: initialData?.horaires?.petitDejeuner?.debut || '',
      horairePetitDejeunerFin: initialData?.horaires?.petitDejeuner?.fin || '',
      horaireDejeunerDebut: initialData?.horaires?.dejeuner?.debut || '',
      horaireDejeunerFin: initialData?.horaires?.dejeuner?.fin || '',
      horaireDinerDebut: initialData?.horaires?.diner?.debut || '',
      horaireDinerFin: initialData?.horaires?.diner?.fin || '',

      // Tarifs
      tarifPetitDejeuner: initialData?.tarifs?.petitDejeuner || 0,
      tarifDejeuner: initialData?.tarifs?.dejeuner || 0,
      tarifDiner: initialData?.tarifs?.diner || 0,
    },
  });

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        nom: initialData.nom,
        type: initialData.type,
        status: initialData.status,
        adresse: initialData.adresse || '',
        telephone: initialData.telephone || '',
        email: initialData.email || '',
        capaciteMax: initialData.capaciteMax,
        responsable: initialData.responsable || '',

        horairePetitDejeunerDebut: initialData.horaires?.petitDejeuner?.debut || '',
        horairePetitDejeunerFin: initialData.horaires?.petitDejeuner?.fin || '',
        horaireDejeunerDebut: initialData.horaires?.dejeuner?.debut || '',
        horaireDejeunerFin: initialData.horaires?.dejeuner?.fin || '',
        horaireDinerDebut: initialData.horaires?.diner?.debut || '',
        horaireDinerFin: initialData.horaires?.diner?.fin || '',

        tarifPetitDejeuner: initialData.tarifs?.petitDejeuner || 0,
        tarifDejeuner: initialData.tarifs?.dejeuner || 0,
        tarifDiner: initialData.tarifs?.diner || 0,
      });
    }
  }, [initialData, reset]);

  const handleFormSubmit = async (data: RestaurantFormData) => {
    try {
      // Transform data to API format
      const submitData: CreateRestaurantRequest = {
        nom: data.nom,
        type: data.type,
        status: data.status,
        adresse: data.adresse,
        telephone: data.telephone,
        email: data.email,
        capaciteMax: data.capaciteMax,
        responsable: data.responsable,

        // Build horaires object
        horaires: {
          ...(data.horairePetitDejeunerDebut && data.horairePetitDejeunerFin ? {
            petitDejeuner: {
              debut: data.horairePetitDejeunerDebut,
              fin: data.horairePetitDejeunerFin,
            }
          } : {}),
          ...(data.horaireDejeunerDebut && data.horaireDejeunerFin ? {
            dejeuner: {
              debut: data.horaireDejeunerDebut,
              fin: data.horaireDejeunerFin,
            }
          } : {}),
          ...(data.horaireDinerDebut && data.horaireDinerFin ? {
            diner: {
              debut: data.horaireDinerDebut,
              fin: data.horaireDinerFin,
            }
          } : {}),
        },

        // Build tarifs object
        tarifs: {
          ...(data.tarifPetitDejeuner ? { petitDejeuner: data.tarifPetitDejeuner } : {}),
          ...(data.tarifDejeuner ? { dejeuner: data.tarifDejeuner } : {}),
          ...(data.tarifDiner ? { diner: data.tarifDiner } : {}),
        },

        // Empty arrays for equipements (will be managed separately later)
        equipements: initialData?.equipements || [],
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Section: Informations Générales */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Informations Générales</h3>
        <div className="space-y-4">
          <Controller
            name="nom"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Nom du restaurant"
                placeholder="Ex: Restaurant Universitaire Principal"
                error={errors.nom?.message}
                required
              />
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Type"
                  options={[
                    { value: RestaurantType.UNIVERSITAIRE, label: 'Universitaire' },
                    { value: RestaurantType.CAFETERIA, label: 'Cafétéria' },
                    { value: RestaurantType.CANTINE, label: 'Cantine' },
                  ]}
                  error={errors.type?.message}
                  required
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  label="Statut"
                  options={[
                    { value: RestaurantStatus.ACTIF, label: 'Actif' },
                    { value: RestaurantStatus.FERME_TEMPORAIRE, label: 'Fermé temporairement' },
                    { value: RestaurantStatus.MAINTENANCE, label: 'Maintenance' },
                    { value: RestaurantStatus.INACTIF, label: 'Inactif' },
                  ]}
                  error={errors.status?.message}
                  required
                />
              )}
            />
          </div>

          <Controller
            name="adresse"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Adresse"
                placeholder="Ex: Campus Universitaire de Niamey"
                error={errors.adresse?.message}
              />
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="telephone"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Téléphone"
                  placeholder="Ex: +227 20 XX XX XX"
                  error={errors.telephone?.message}
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  type="email"
                  label="Email"
                  placeholder="Ex: restaurant@crou.edu.ne"
                  error={errors.email?.message}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Controller
              name="capaciteMax"
              control={control}
              render={({ field: { onChange, value, ...field } }) => (
                <Input
                  {...field}
                  type="number"
                  label="Capacité maximale"
                  placeholder="Ex: 500"
                  value={value}
                  onChange={(e) => onChange(parseInt(e.target.value) || 0)}
                  error={errors.capaciteMax?.message}
                  required
                />
              )}
            />

            <Controller
              name="responsable"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  label="Responsable"
                  placeholder="Ex: M. Jean DUPONT"
                  error={errors.responsable?.message}
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Section: Horaires */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Horaires de Service</h3>
        <div className="space-y-4">
          {/* Petit Déjeuner */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Petit Déjeuner</p>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="horairePetitDejeunerDebut"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Début"
                    placeholder="07:00"
                  />
                )}
              />
              <Controller
                name="horairePetitDejeunerFin"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Fin"
                    placeholder="09:00"
                  />
                )}
              />
            </div>
          </div>

          {/* Déjeuner */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Déjeuner</p>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="horaireDejeunerDebut"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Début"
                    placeholder="12:00"
                  />
                )}
              />
              <Controller
                name="horaireDejeunerFin"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Fin"
                    placeholder="14:00"
                  />
                )}
              />
            </div>
          </div>

          {/* Dîner */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Dîner</p>
            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="horaireDinerDebut"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Début"
                    placeholder="19:00"
                  />
                )}
              />
              <Controller
                name="horaireDinerFin"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    type="time"
                    label="Fin"
                    placeholder="21:00"
                  />
                )}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Section: Tarifs */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Tarifs (XOF)</h3>
        <div className="grid grid-cols-3 gap-4">
          <Controller
            name="tarifPetitDejeuner"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <Input
                {...field}
                type="number"
                label="Petit Déjeuner"
                placeholder="0"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                error={errors.tarifPetitDejeuner?.message}
              />
            )}
          />

          <Controller
            name="tarifDejeuner"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <Input
                {...field}
                type="number"
                label="Déjeuner"
                placeholder="0"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                error={errors.tarifDejeuner?.message}
              />
            )}
          />

          <Controller
            name="tarifDiner"
            control={control}
            render={({ field: { onChange, value, ...field } }) => (
              <Input
                {...field}
                type="number"
                label="Dîner"
                placeholder="0"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                error={errors.tarifDiner?.message}
              />
            )}
          />
        </div>
      </div>

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
          {isSubmitting ? 'Enregistrement...' : (isEditMode ? 'Modifier' : 'Créer')}
        </Button>
      </div>
    </form>
  );
};

export default RestaurantForm;
