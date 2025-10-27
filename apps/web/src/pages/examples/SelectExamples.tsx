/**
 * FICHIER: apps\web\src\pages\examples\SelectExamples.tsx
 * PAGE: Exemples d'utilisation des composants Select
 * 
 * DESCRIPTION:
 * Page de démonstration des composants Select, CROUSelector et RoleSelector
 * Montre les bonnes pratiques d'utilisation dans l'application CROU
 * Exemples interactifs avec toutes les fonctionnalités avancées
 * 
 * USAGE:
 * Page accessible via /examples/selects pour tester les composants
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  AcademicCapIcon,
  CurrencyDollarIcon,
  TruckIcon,
  HomeModernIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Select } from '@/components/ui/Select';
import { CROUSelector, RoleSelector } from '@/components/ui/CROUSelector';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Options de test pour les démonstrations
const moduleOptions = [
  { 
    value: 'dashboard', 
    label: 'Tableau de Bord', 
    description: 'Vue d\'ensemble et indicateurs clés',
    icon: <AcademicCapIcon className="h-4 w-4" />
  },
  { 
    value: 'financial', 
    label: 'Gestion Financière', 
    description: 'Budgets, subventions et comptabilité',
    icon: <CurrencyDollarIcon className="h-4 w-4" />
  },
  { 
    value: 'housing', 
    label: 'Gestion Logement', 
    description: 'Cités universitaires et hébergement',
    icon: <HomeModernIcon className="h-4 w-4" />
  },
  { 
    value: 'transport', 
    label: 'Gestion Transport', 
    description: 'Parc automobile et navettes étudiantes',
    icon: <TruckIcon className="h-4 w-4" />
  },
  { 
    value: 'reports', 
    label: 'Rapports', 
    description: 'Génération et export de rapports',
    icon: <DocumentTextIcon className="h-4 w-4" />
  },
  { 
    value: 'admin', 
    label: 'Administration', 
    description: 'Configuration système et utilisateurs',
    icon: <Cog6ToothIcon className="h-4 w-4" />
  }
];

const priorityOptions = [
  { value: 'low', label: 'Faible', description: 'Priorité basse - traitement différé' },
  { value: 'medium', label: 'Moyenne', description: 'Priorité normale - traitement standard' },
  { value: 'high', label: 'Élevée', description: 'Priorité haute - traitement rapide' },
  { value: 'urgent', label: 'Urgente', description: 'Traitement immédiat requis' }
];

const statusOptions = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'pending', label: 'En attente' },
  { value: 'approved', label: 'Approuvé' },
  { value: 'rejected', label: 'Rejeté' },
  { value: 'archived', label: 'Archivé' }
];

// Interface pour les données du formulaire
interface FormData {
  // Sélections simples
  crou: string | number | null;
  role: string | number | null;
  priority: string | number | null;
  status: string | number | null;
  
  // Sélections multiples
  modules: (string | number)[];
  crouMultiple: (string | number)[];
  
  // Sélections avec recherche
  searchableModule: string | number | null;
  
  // Sélections créatives
  customTags: (string | number)[];
}

export const SelectExamples: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    crou: null,
    role: null,
    priority: null,
    status: 'draft',
    modules: ['dashboard', 'financial'],
    crouMultiple: [],
    searchableModule: null,
    customTags: []
  });

  const [dynamicOptions, setDynamicOptions] = useState(statusOptions);
  const [isLoading, setIsLoading] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Fonction pour créer une nouvelle option
  const handleCreateOption = async (inputValue: string) => {
    const newOption = {
      value: inputValue.toLowerCase().replace(/\s+/g, '-'),
      label: inputValue
    };
    
    setDynamicOptions(prev => [...prev, newOption]);
    return newOption;
  };

  // Fonction pour simuler un chargement asynchrone
  const handleAsyncLoad = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
  };

  // Fonction de soumission
  const handleSubmit = () => {
    setSubmitCount(prev => prev + 1);
    console.log('Données du formulaire:', formData);
  };

  // Fonction de réinitialisation
  const handleReset = () => {
    setFormData({
      crou: null,
      role: null,
      priority: null,
      status: 'draft',
      modules: [],
      crouMultiple: [],
      searchableModule: null,
      customTags: []
    });
    setSubmitCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Composants Select - Exemples
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Démonstration interactive des composants de sélection CROU
              </p>
            </div>
            <ThemeToggle showLabel />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche - Sélections de base */}
          <div className="space-y-8">
            {/* Section 1: Sélections CROU spécialisées */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Sélecteurs CROU spécialisés
              </h2>
              
              <div className="space-y-4">
                <CROUSelector
                  label="Centre CROU d'affectation"
                  value={formData.crou}
                  onChange={(value) => setFormData(prev => ({ ...prev, crou: value }))}
                  includeMinistry
                  showRegions
                  searchable
                  placeholder="Sélectionner un CROU"
                  helperText="Centre régional d'affectation de l'utilisateur"
                />

                <RoleSelector
                  label="Rôle utilisateur"
                  value={formData.role}
                  onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  showDescriptions
                  searchable
                  placeholder="Sélectionner un rôle"
                  helperText="Rôle déterminant les permissions d'accès"
                />

                <CROUSelector
                  label="CROU multiples (vue ministérielle)"
                  value={formData.crouMultiple}
                  onChange={(value) => setFormData(prev => ({ ...prev, crouMultiple: value as (string | number)[] }))}
                  multiple
                  searchable
                  clearable
                  showCodes
                  includeMinistry
                  placeholder="Sélectionner plusieurs CROU"
                  helperText="Sélection multiple pour les rapports consolidés"
                />

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Sélections CROU actuelles :
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>CROU : {formData.crou || 'Non sélectionné'}</p>
                    <p>Rôle : {formData.role || 'Non sélectionné'}</p>
                    <p>CROU multiples : {formData.crouMultiple.length > 0 ? formData.crouMultiple.join(', ') : 'Aucun'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 2: Sélections avec options enrichies */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Options enrichies avec icônes
              </h2>
              
              <div className="space-y-4">
                <Select
                  options={moduleOptions}
                  value={formData.modules}
                  onChange={(value) => setFormData(prev => ({ ...prev, modules: value as (string | number)[] }))}
                  multiple
                  searchable
                  clearable
                  label="Modules accessibles"
                  placeholder="Sélectionner les modules"
                  helperText="Modules auxquels l'utilisateur aura accès"
                />

                <Select
                  options={priorityOptions}
                  value={formData.priority}
                  onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                  searchable
                  label="Niveau de priorité"
                  placeholder="Définir la priorité"
                  helperText="Niveau de priorité pour les notifications"
                />

                <Select
                  options={moduleOptions}
                  value={formData.searchableModule}
                  onChange={(value) => setFormData(prev => ({ ...prev, searchableModule: value }))}
                  searchable
                  clearable
                  variant="filled"
                  label="Module avec recherche (variante filled)"
                  placeholder="Rechercher un module..."
                  helperText="Tapez pour filtrer les options"
                />
              </div>
            </section>

            {/* Section 3: États et variantes */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                États et variantes
              </h2>
              
              <div className="space-y-4">
                <Select
                  options={statusOptions}
                  value={formData.status}
                  onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                  variant="default"
                  label="Statut (variante default)"
                  placeholder="Sélectionner un statut"
                />

                <Select
                  options={priorityOptions}
                  variant="flushed"
                  label="Priorité (variante flushed)"
                  placeholder="Sélectionner la priorité"
                  validationState="success"
                  helperText="Variante flushed avec état de succès"
                />

                <Select
                  options={moduleOptions}
                  loading={isLoading}
                  label="Select en chargement"
                  placeholder="Chargement des options..."
                  helperText="Simulation d'un chargement asynchrone"
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleAsyncLoad}
                    disabled={isLoading}
                    loading={isLoading}
                  >
                    Simuler chargement
                  </Button>
                </div>

                <Select
                  options={statusOptions}
                  disabled
                  value="approved"
                  label="Select désactivé"
                  placeholder="Non modifiable"
                  helperText="Select en état désactivé"
                />

                <Select
                  options={[]}
                  label="Liste vide"
                  placeholder="Aucune option"
                  noOptionsText="Aucune option disponible pour le moment"
                  helperText="Exemple avec liste d'options vide"
                />
              </div>
            </section>
          </div>

          {/* Colonne droite - Fonctionnalités avancées */}
          <div className="space-y-8">
            {/* Section 4: Création d'options */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Création d'options dynamiques
              </h2>
              
              <div className="space-y-4">
                <Select
                  options={dynamicOptions}
                  value={formData.customTags}
                  onChange={(value) => setFormData(prev => ({ ...prev, customTags: value as (string | number)[] }))}
                  multiple
                  searchable
                  creatable
                  onCreateOption={handleCreateOption}
                  clearable
                  label="Tags personnalisés"
                  placeholder="Rechercher ou créer des tags..."
                  helperText="Tapez pour créer de nouveaux tags à la volée"
                />

                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Comment créer des options :
                  </h4>
                  <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                    <li>Tapez le nom de votre nouveau tag</li>
                    <li>Cliquez sur "Créer [nom du tag]"</li>
                    <li>Le tag est automatiquement ajouté et sélectionné</li>
                  </ol>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Options disponibles ({dynamicOptions.length}) :
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {dynamicOptions.map(option => (
                      <span
                        key={option.value}
                        className="inline-flex items-center px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-xs rounded"
                      >
                        {option.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: États de validation */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                États de validation
              </h2>
              
              <div className="space-y-4">
                <Select
                  options={moduleOptions}
                  validationState="default"
                  label="État normal"
                  placeholder="Sélection normale"
                  helperText="État par défaut sans validation"
                />

                <Select
                  options={moduleOptions}
                  validationState="success"
                  value="dashboard"
                  label="État de succès"
                  placeholder="Validation réussie"
                  helperText="Sélection validée avec succès"
                />

                <Select
                  options={moduleOptions}
                  error="Cette sélection est obligatoire"
                  label="État d'erreur"
                  placeholder="Sélection requise"
                  required
                />

                <Select
                  options={moduleOptions}
                  validationState="warning"
                  value="admin"
                  label="État d'avertissement"
                  placeholder="Attention requise"
                  helperText="Cette sélection nécessite une attention particulière"
                />
              </div>
            </section>

            {/* Section 6: Tailles et variantes */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Tailles et variantes
              </h2>
              
              <div className="space-y-4">
                <Select
                  options={statusOptions}
                  size="sm"
                  label="Taille Small"
                  placeholder="Select petit"
                  value="draft"
                />

                <Select
                  options={statusOptions}
                  size="md"
                  label="Taille Medium (défaut)"
                  placeholder="Select moyen"
                  value="pending"
                />

                <Select
                  options={statusOptions}
                  size="lg"
                  label="Taille Large"
                  placeholder="Select grand"
                  value="approved"
                />
              </div>
            </section>

            {/* Section 7: Actions et résumé */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Actions et résumé
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                  >
                    Valider les sélections {submitCount > 0 && `(${submitCount})`}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                  >
                    Réinitialiser
                  </Button>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-3">
                    Résumé des sélections :
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <span className="text-gray-600 dark:text-gray-400">CROU :</span>
                      <span className="text-gray-900 dark:text-gray-100">{formData.crou || 'Non sélectionné'}</span>
                      
                      <span className="text-gray-600 dark:text-gray-400">Rôle :</span>
                      <span className="text-gray-900 dark:text-gray-100">{formData.role || 'Non sélectionné'}</span>
                      
                      <span className="text-gray-600 dark:text-gray-400">Priorité :</span>
                      <span className="text-gray-900 dark:text-gray-100">{formData.priority || 'Non sélectionnée'}</span>
                      
                      <span className="text-gray-600 dark:text-gray-400">Statut :</span>
                      <span className="text-gray-900 dark:text-gray-100">{formData.status || 'Non défini'}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Modules ({formData.modules.length}) :</span>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
                        {formData.modules.length > 0 ? formData.modules.join(', ') : 'Aucun module sélectionné'}
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                      <div className="mb-1">
                        <span className="text-gray-600 dark:text-gray-400">Tags personnalisés ({formData.customTags.length}) :</span>
                      </div>
                      <div className="text-gray-900 dark:text-gray-100">
                        {formData.customTags.length > 0 ? formData.customTags.join(', ') : 'Aucun tag personnalisé'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectExamples;
