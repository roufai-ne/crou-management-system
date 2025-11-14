/**
 * FICHIER: apps/web/src/components/restauration/forms/TicketEmissionForm.tsx
 * COMPOSANT: TicketEmissionForm - Formulaire émission de tickets repas
 *
 * DESCRIPTION:
 * Formulaire pour émettre des tickets repas individuels ou en lot
 * Validation avec React Hook Form + Zod
 *
 * FONCTIONNALITÉS:
 * - Sélection type émission (individuel/lot)
 * - Sélection étudiant(s) ou fichier CSV
 * - Sélection restaurant
 * - Type de repas
 * - Date début/fin validité
 * - Quantité de tickets
 * - Validation: dates cohérentes, étudiant requis
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button } from '@/components/ui';
import { EmettrTicketRequest } from '@/services/api/restaurationService';
import { TypeRepas } from '@crou/database';

// Types
interface Restaurant {
  id: string;
  nom: string;
  code: string;
}

interface Etudiant {
  id: string;
  nom: string;
  prenom: string;
  matricule: string;
  email: string;
}

type TypeEmission = 'individuel' | 'lot';

// Schéma de validation Zod
const ticketEmissionSchema = z.object({
  typeEmission: z.enum(['individuel', 'lot'], {
    errorMap: () => ({ message: 'Type d\'émission requis' })
  }),
  etudiantId: z.string().optional(),
  etudiantIds: z.array(z.string()).optional(),
  restaurantId: z.string().min(1, 'Restaurant requis'),
  typeRepas: z.nativeEnum(TypeRepas, {
    errorMap: () => ({ message: 'Type de repas requis' })
  }),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  quantite: z.number()
    .min(1, 'Minimum 1 ticket')
    .max(100, 'Maximum 100 tickets par émission'),
  observations: z.string().optional(),
}).refine(data => {
  // Validate dates
  if (data.dateDebut && data.dateFin) {
    return new Date(data.dateDebut) <= new Date(data.dateFin);
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin']
}).refine(data => {
  // Validate etudiant based on type
  if (data.typeEmission === 'individuel') {
    return !!data.etudiantId;
  }
  return true;
}, {
  message: 'Étudiant requis pour émission individuelle',
  path: ['etudiantId']
}).refine(data => {
  // Validate etudiants for lot
  if (data.typeEmission === 'lot') {
    return data.etudiantIds && data.etudiantIds.length > 0;
  }
  return true;
}, {
  message: 'Au moins un étudiant requis pour émission en lot',
  path: ['etudiantIds']
});

type TicketEmissionFormData = z.infer<typeof ticketEmissionSchema>;

interface TicketEmissionFormProps {
  restaurants: Restaurant[];
  etudiants: Etudiant[];
  onSubmit: (data: EmettrTicketRequest | EmettrTicketRequest[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const TicketEmissionForm: React.FC<TicketEmissionFormProps> = ({
  restaurants,
  etudiants,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredEtudiants, setFilteredEtudiants] = useState<Etudiant[]>(etudiants);
  const [selectedEtudiants, setSelectedEtudiants] = useState<Etudiant[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<TicketEmissionFormData>({
    resolver: zodResolver(ticketEmissionSchema),
    defaultValues: {
      typeEmission: 'individuel',
      etudiantId: '',
      etudiantIds: [],
      restaurantId: '',
      typeRepas: TypeRepas.DEJEUNER,
      dateDebut: new Date().toISOString().split('T')[0],
      dateFin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // +30 days
      quantite: 1,
      observations: '',
    },
  });

  const typeEmission = watch('typeEmission');
  const etudiantId = watch('etudiantId');
  const restaurantId = watch('restaurantId');
  const typeRepas = watch('typeRepas');
  const quantite = watch('quantite');
  const dateDebut = watch('dateDebut');
  const dateFin = watch('dateFin');

  // Filter etudiants based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredEtudiants(etudiants);
    } else {
      const filtered = etudiants.filter(e =>
        `${e.nom} ${e.prenom} ${e.matricule}`.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEtudiants(filtered);
    }
  }, [searchTerm, etudiants]);

  // Calculate total tickets
  const totalTickets = typeEmission === 'individuel'
    ? quantite
    : selectedEtudiants.length * quantite;

  // Calculate duration in days
  const durationDays = dateDebut && dateFin
    ? Math.ceil((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  // Get selected restaurant
  const selectedRestaurant = restaurants.find(r => r.id === restaurantId);

  // Handle add etudiant to lot
  const handleAddEtudiant = (etudiantId: string) => {
    const etudiant = etudiants.find(e => e.id === etudiantId);
    if (etudiant && !selectedEtudiants.find(e => e.id === etudiantId)) {
      const newSelected = [...selectedEtudiants, etudiant];
      setSelectedEtudiants(newSelected);
      setValue('etudiantIds', newSelected.map(e => e.id));
    }
  };

  // Handle remove etudiant from lot
  const handleRemoveEtudiant = (etudiantId: string) => {
    const newSelected = selectedEtudiants.filter(e => e.id !== etudiantId);
    setSelectedEtudiants(newSelected);
    setValue('etudiantIds', newSelected.map(e => e.id));
  };

  const handleFormSubmit = async (data: TicketEmissionFormData) => {
    try {
      if (data.typeEmission === 'individuel') {
        // Single emission
        const submitData: EmettrTicketRequest = {
          etudiantId: data.etudiantId!,
          restaurantId: data.restaurantId,
          typeRepas: data.typeRepas,
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
          quantite: data.quantite,
          observations: data.observations,
        };
        await onSubmit(submitData);
      } else {
        // Batch emission
        const submitData: EmettrTicketRequest[] = data.etudiantIds!.map(etudiantId => ({
          etudiantId,
          restaurantId: data.restaurantId,
          typeRepas: data.typeRepas,
          dateDebut: data.dateDebut,
          dateFin: data.dateFin,
          quantite: data.quantite,
          observations: data.observations,
        }));
        await onSubmit(submitData);
      }
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Info */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Les tickets émis seront valables durant la période spécifiée
          et pourront être utilisés dans le restaurant sélectionné pour le type de repas indiqué.
        </p>
      </div>

      <div className="space-y-4">
        {/* Type émission */}
        <Controller
          name="typeEmission"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Type d'émission"
              options={[
                { value: 'individuel', label: 'Individuel - Un étudiant' },
                { value: 'lot', label: 'En lot - Plusieurs étudiants' }
              ]}
              error={errors.typeEmission?.message}
              required
            />
          )}
        />

        {/* Sélection étudiant(s) */}
        {typeEmission === 'individuel' ? (
          // Individuel: simple select
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Étudiant <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Rechercher un étudiant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <Controller
              name="etudiantId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={[
                    { value: '', label: 'Sélectionner un étudiant...' },
                    ...filteredEtudiants.map(e => ({
                      value: e.id,
                      label: `${e.matricule} - ${e.nom} ${e.prenom}`
                    }))
                  ]}
                  error={errors.etudiantId?.message}
                  required
                />
              )}
            />
            {etudiantId && (
              <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 dark:border-gray-700">
                {(() => {
                  const etudiant = etudiants.find(e => e.id === etudiantId);
                  return etudiant ? (
                    <div className="text-sm">
                      <p><strong>{etudiant.nom} {etudiant.prenom}</strong></p>
                      <p className="text-gray-600 dark:text-gray-400">Matricule: {etudiant.matricule}</p>
                      <p className="text-gray-600 dark:text-gray-400">Email: {etudiant.email}</p>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        ) : (
          // Lot: multiple selection
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Étudiants <span className="text-red-500">*</span>
            </label>
            <Input
              type="text"
              placeholder="Rechercher pour ajouter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="mb-2"
            />
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-2"
              size={5}
              onChange={(e) => handleAddEtudiant(e.target.value)}
              value=""
            >
              <option value="" disabled>Sélectionner pour ajouter...</option>
              {filteredEtudiants
                .filter(e => !selectedEtudiants.find(s => s.id === e.id))
                .map(e => (
                  <option key={e.id} value={e.id}>
                    {e.matricule} - {e.nom} {e.prenom}
                  </option>
                ))}
            </select>

            {/* Selected etudiants */}
            {selectedEtudiants.length > 0 && (
              <div className="mt-2 p-3 bg-gray-50 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium mb-2">
                  Étudiants sélectionnés ({selectedEtudiants.length})
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {selectedEtudiants.map(e => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between bg-white p-2 rounded border"
                    >
                      <span className="text-sm">
                        {e.matricule} - {e.nom} {e.prenom}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveEtudiant(e.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors.etudiantIds && (
              <p className="mt-1 text-sm text-red-600">{errors.etudiantIds.message}</p>
            )}
          </div>
        )}

        {/* Restaurant */}
        <Controller
          name="restaurantId"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Restaurant"
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

        {/* Type repas */}
        <Controller
          name="typeRepas"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              label="Type de repas"
              options={[
                { value: TypeRepas.PETIT_DEJEUNER, label: 'Petit Déjeuner' },
                { value: TypeRepas.DEJEUNER, label: 'Déjeuner' },
                { value: TypeRepas.DINER, label: 'Dîner' }
              ]}
              error={errors.typeRepas?.message}
              required
            />
          )}
        />

        {/* Période validité */}
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="dateDebut"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                label="Date début validité"
                error={errors.dateDebut?.message}
                required
              />
            )}
          />
          <Controller
            name="dateFin"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                type="date"
                label="Date fin validité"
                error={errors.dateFin?.message}
                required
              />
            )}
          />
        </div>

        {durationDays > 0 && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Période de validité: <strong>{durationDays} jour{durationDays > 1 ? 's' : ''}</strong>
          </p>
        )}

        {/* Quantité */}
        <Controller
          name="quantite"
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <Input
              {...field}
              type="number"
              label="Quantité de tickets par étudiant"
              placeholder="1"
              value={value}
              onChange={(e) => onChange(parseInt(e.target.value) || 1)}
              error={errors.quantite?.message}
              required
              helpText="Nombre de tickets à émettre pour chaque étudiant"
            />
          )}
        />

        {/* Summary */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <p className="text-sm text-gray-600 mb-1">Résumé de l'émission</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <p className="text-gray-600 dark:text-gray-400">Total tickets:</p>
              <p className="text-2xl font-bold text-green-700">{totalTickets}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-400">Bénéficiaires:</p>
              <p className="text-xl font-bold text-green-700">
                {typeEmission === 'individuel' ? 1 : selectedEtudiants.length}
              </p>
            </div>
          </div>
          {selectedRestaurant && (
            <p className="text-xs text-gray-600 mt-2">
              Restaurant: <strong>{selectedRestaurant.nom}</strong>
            </p>
          )}
        </div>

        {/* Observations */}
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
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Notes ou remarques sur cette émission..."
              />
              {errors.observations && (
                <p className="mt-1 text-sm text-red-600">{errors.observations.message}</p>
              )}
            </div>
          )}
        />
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
          {isSubmitting
            ? 'Émission...'
            : `Émettre ${totalTickets} ticket${totalTickets > 1 ? 's' : ''}`
          }
        </Button>
      </div>
    </form>
  );
};

export default TicketEmissionForm;
