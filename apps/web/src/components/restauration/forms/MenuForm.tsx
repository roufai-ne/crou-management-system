/**
 * FICHIER: apps/web/src/components/restauration/forms/MenuForm.tsx
 * COMPOSANT: MenuForm - Formulaire création/modification menu
 *
 * DESCRIPTION:
 * Formulaire complet pour créer ou modifier un menu avec ses plats
 * Intègre le PlatEditor pour composer les plats
 * Validation avec React Hook Form + Zod
 *
 * FONCTIONNALITÉS:
 * - Nom du menu
 * - Type de menu (standard, spécial, ramadan, etc.)
 * - Date début/fin validité
 * - Ajout/modification/suppression de plats via PlatEditor
 * - Validation complète
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input, Select, Button, Modal } from '@/components/ui';
import { PlatEditor, PlatData, TypePlat } from './PlatEditor';
import { CreateMenuRequest } from '@/services/api/restaurationService';

// Types
enum TypeMenu {
  STANDARD = 'STANDARD',
  SPECIAL = 'SPECIAL',
  RAMADAN = 'RAMADAN',
  FETE = 'FETE',
}

interface Menu {
  id?: string;
  nom: string;
  type: TypeMenu;
  dateDebut: string;
  dateFin?: string;
  plats: PlatData[];
}

interface DenreeOption {
  id: string;
  nom: string;
  unite: string;
}

// Schéma de validation Zod
const menuSchema = z.object({
  nom: z.string()
    .min(5, 'Le nom doit contenir au moins 5 caractères')
    .max(200, 'Maximum 200 caractères'),
  type: z.nativeEnum(TypeMenu, {
    errorMap: () => ({ message: 'Type de menu requis' })
  }),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().optional(),
}).refine(data => {
  // Validate dates if dateFin exists
  if (data.dateFin) {
    return new Date(data.dateDebut) <= new Date(data.dateFin);
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['dateFin']
});

type MenuFormData = z.infer<typeof menuSchema>;

interface MenuFormProps {
  initialData?: Menu;
  availableDenrees: DenreeOption[];
  onSubmit: (data: CreateMenuRequest) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export const MenuForm: React.FC<MenuFormProps> = ({
  initialData,
  availableDenrees,
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const [plats, setPlats] = useState<PlatData[]>(initialData?.plats || []);
  const [isPlatEditorOpen, setIsPlatEditorOpen] = useState(false);
  const [editingPlat, setEditingPlat] = useState<PlatData | undefined>(undefined);
  const [platErrors, setPlatErrors] = useState<string>('');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm<MenuFormData>({
    resolver: zodResolver(menuSchema),
    defaultValues: {
      nom: initialData?.nom || '',
      type: initialData?.type || TypeMenu.STANDARD,
      dateDebut: initialData?.dateDebut || new Date().toISOString().split('T')[0],
      dateFin: initialData?.dateFin || '',
    },
  });

  const dateDebut = watch('dateDebut');
  const dateFin = watch('dateFin');
  const typeMenu = watch('type');

  // Reset form when initialData changes
  useEffect(() => {
    if (initialData) {
      reset({
        nom: initialData.nom,
        type: initialData.type,
        dateDebut: initialData.dateDebut,
        dateFin: initialData.dateFin,
      });
      setPlats(initialData.plats || []);
    }
  }, [initialData, reset]);

  // Calculate duration
  const durationDays = dateDebut && dateFin
    ? Math.ceil((new Date(dateFin).getTime() - new Date(dateDebut).getTime()) / (1000 * 60 * 60 * 24)) + 1
    : 0;

  // Count plats by type
  const platsByType = {
    entrees: plats.filter(p => p.type === TypePlat.ENTREE).length,
    principaux: plats.filter(p => p.type === TypePlat.PLAT_PRINCIPAL).length,
    desserts: plats.filter(p => p.type === TypePlat.DESSERT).length,
    boissons: plats.filter(p => p.type === TypePlat.BOISSON).length,
  };

  const handleOpenPlatEditor = (plat?: PlatData) => {
    setEditingPlat(plat);
    setIsPlatEditorOpen(true);
  };

  const handleSavePlat = (platData: PlatData) => {
    if (editingPlat) {
      // Update existing
      setPlats(plats.map(p => p.id === editingPlat.id ? platData : p));
    } else {
      // Add new
      const newPlat = {
        ...platData,
        id: `plat-${Date.now()}-${Math.random()}`,
      };
      setPlats([...plats, newPlat]);
    }
    setIsPlatEditorOpen(false);
    setEditingPlat(undefined);
    setPlatErrors('');
  };

  const handleRemovePlat = (platId: string) => {
    if (confirm('Êtes-vous sûr de vouloir retirer ce plat du menu ?')) {
      setPlats(plats.filter(p => p.id !== platId));
    }
  };

  const validatePlats = (): boolean => {
    if (plats.length === 0) {
      setPlatErrors('Au moins un plat est requis pour le menu');
      return false;
    }

    // Check if at least one plat principal
    if (platsByType.principaux === 0) {
      setPlatErrors('Au moins un plat principal est requis');
      return false;
    }

    setPlatErrors('');
    return true;
  };

  const handleFormSubmit = async (data: MenuFormData) => {
    // Validate plats
    if (!validatePlats()) {
      return;
    }

    try {
      const submitData: CreateMenuRequest = {
        nom: data.nom,
        type: data.type,
        dateDebut: data.dateDebut,
        dateFin: data.dateFin,
        plats: plats.map(plat => ({
          nom: plat.nom,
          type: plat.type,
          ingredients: plat.ingredients.map(ing => ({
            denreeId: ing.denreeId,
            quantite: ing.quantite,
          })),
        })),
      };

      await onSubmit(submitData);
    } catch (error) {
      console.error('Erreur soumission formulaire:', error);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Un menu doit contenir au moins un plat principal.
            Vous pouvez ajouter des entrées, desserts et boissons pour compléter le menu.
          </p>
        </div>

        <div className="space-y-4">
          {/* Nom du menu */}
          <Controller
            name="nom"
            control={control}
            render={({ field }) => (
              <Input
                {...field}
                label="Nom du menu"
                placeholder="Ex: Menu de la semaine du 15/01"
                error={errors.nom?.message}
                required
              />
            )}
          />

          {/* Type de menu */}
          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                label="Type de menu"
                options={[
                  { value: TypeMenu.STANDARD, label: 'Standard - Menu quotidien' },
                  { value: TypeMenu.SPECIAL, label: 'Spécial - Événement particulier' },
                  { value: TypeMenu.RAMADAN, label: 'Ramadan - Menu adapté' },
                  { value: TypeMenu.FETE, label: 'Fête - Menu festif' },
                ]}
                error={errors.type?.message}
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
                  helpText="Laisser vide pour menu permanent"
                />
              )}
            />
          </div>

          {durationDays > 0 && (
            <p className="text-sm text-gray-600">
              Durée de validité: <strong>{durationDays} jour{durationDays > 1 ? 's' : ''}</strong>
            </p>
          )}
        </div>

        {/* Plats section */}
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Composition du menu <span className="text-red-500">*</span>
            </h3>
            <Button
              type="button"
              variant="primary"
              onClick={() => handleOpenPlatEditor()}
            >
              + Ajouter un plat
            </Button>
          </div>

          {/* Plats statistics */}
          {plats.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Entrées</p>
                  <p className="text-lg font-bold text-gray-800">{platsByType.entrees}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Plats principaux</p>
                  <p className="text-lg font-bold text-green-700">{platsByType.principaux}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Desserts</p>
                  <p className="text-lg font-bold text-gray-800">{platsByType.desserts}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Boissons</p>
                  <p className="text-lg font-bold text-gray-800">{platsByType.boissons}</p>
                </div>
              </div>
            </div>
          )}

          {/* Plats list */}
          {plats.length > 0 ? (
            <div className="space-y-3">
              {/* Group by type */}
              {[
                { type: TypePlat.ENTREE, label: 'Entrées', color: 'blue' },
                { type: TypePlat.PLAT_PRINCIPAL, label: 'Plats Principaux', color: 'green' },
                { type: TypePlat.DESSERT, label: 'Desserts', color: 'yellow' },
                { type: TypePlat.BOISSON, label: 'Boissons', color: 'purple' },
              ].map(({ type, label, color }) => {
                const platsOfType = plats.filter(p => p.type === type);
                if (platsOfType.length === 0) return null;

                return (
                  <div key={type}>
                    <h4 className={`text-sm font-medium text-${color}-700 mb-2`}>{label}</h4>
                    <div className="space-y-2 ml-4">
                      {platsOfType.map((plat) => (
                        <div
                          key={plat.id}
                          className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-gray-900">{plat.nom}</h5>
                              <p className="text-xs text-gray-500 mt-1">
                                {plat.ingredients.length} ingrédient{plat.ingredients.length > 1 ? 's' : ''}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-1">
                                {plat.ingredients.map((ing) => (
                                  <span
                                    key={ing.id}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                                  >
                                    {ing.denreeNom} ({ing.quantite} {ing.unite})
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex gap-2 ml-4">
                              <button
                                type="button"
                                onClick={() => handleOpenPlatEditor(plat)}
                                className="text-blue-600 hover:text-blue-800 text-sm"
                              >
                                Modifier
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemovePlat(plat.id!)}
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Retirer
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 mb-2">Aucun plat ajouté</p>
              <p className="text-sm text-yellow-700">
                Cliquez sur "Ajouter un plat" pour composer votre menu
              </p>
            </div>
          )}

          {platErrors && (
            <p className="text-sm text-red-600 mt-2">{platErrors}</p>
          )}
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
              ? 'Enregistrement...'
              : initialData
              ? 'Modifier le menu'
              : 'Créer le menu'
            }
          </Button>
        </div>
      </form>

      {/* Plat Editor Modal */}
      <Modal
        isOpen={isPlatEditorOpen}
        onClose={() => {
          setIsPlatEditorOpen(false);
          setEditingPlat(undefined);
        }}
        title={editingPlat ? 'Modifier le plat' : 'Ajouter un plat'}
        size="lg"
      >
        <PlatEditor
          initialData={editingPlat}
          availableDenrees={availableDenrees}
          onSave={handleSavePlat}
          onCancel={() => {
            setIsPlatEditorOpen(false);
            setEditingPlat(undefined);
          }}
        />
      </Modal>
    </>
  );
};

export default MenuForm;
