/**
 * FICHIER: apps\web\src\pages\examples\InputExamples.tsx
 * PAGE: Exemples d'utilisation des composants Input
 * 
 * DESCRIPTION:
 * Page de démonstration des composants Input, CurrencyInput et DateInput
 * Montre les bonnes pratiques d'utilisation dans l'application CROU
 * Exemples interactifs avec validation et formatage
 * 
 * USAGE:
 * Page accessible via /examples/inputs pour tester les composants
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { 
  UserIcon, 
  EnvelopeIcon, 
  LockClosedIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  BuildingOfficeIcon,
  IdentificationIcon
} from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import { DateInput } from '@/components/ui/DateInput';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Interface pour les données du formulaire
interface FormData {
  // Informations personnelles
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  motDePasse: string;
  confirmMotDePasse: string;
  
  // Informations CROU
  crou: string;
  poste: string;
  numeroEmploye: string;
  
  // Informations financières
  salaire: number | null;
  budget: number | null;
  subvention: number | null;
  
  // Dates
  dateNaissance: Date | null;
  dateEmbauche: Date | null;
  exerciceBudgetaire: Date | null;
  
  // Recherche
  recherche: string;
}

export const InputExamples: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    motDePasse: '',
    confirmMotDePasse: '',
    crou: '',
    poste: '',
    numeroEmploye: '',
    salaire: null,
    budget: null,
    subvention: null,
    dateNaissance: null,
    dateEmbauche: null,
    exerciceBudgetaire: null,
    recherche: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Fonction de validation
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    // Validation des champs requis
    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis';
    } else if (!/^\+?[0-9\s-]{8,}$/.test(formData.telephone)) {
      newErrors.telephone = 'Format de téléphone invalide';
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    } else if (formData.motDePasse.length < 8) {
      newErrors.motDePasse = 'Le mot de passe doit contenir au moins 8 caractères';
    }

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      newErrors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    if (!formData.crou) {
      newErrors.crou = 'Le CROU est requis';
    }

    if (!formData.salaire) {
      newErrors.salaire = 'Le salaire est requis';
    }

    if (!formData.dateNaissance) {
      newErrors.dateNaissance = 'La date de naissance est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Fonction de soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    // Simulation d'une requête API
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setSubmitCount(prev => prev + 1);
    
    // Réinitialiser les erreurs
    setErrors({});
  };

  // Fonction de réinitialisation
  const handleReset = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      motDePasse: '',
      confirmMotDePasse: '',
      crou: '',
      poste: '',
      numeroEmploye: '',
      salaire: null,
      budget: null,
      subvention: null,
      dateNaissance: null,
      dateEmbauche: null,
      exerciceBudgetaire: null,
      recherche: ''
    });
    setErrors({});
    setSubmitCount(0);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Composants Input - Exemples
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Démonstration interactive des composants de saisie CROU
              </p>
            </div>
            <ThemeToggle showLabel />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Colonne gauche - Formulaire principal */}
          <div className="space-y-8">
            {/* Section 1: Informations personnelles */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Informations personnelles
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Nom"
                    value={formData.nom}
                    onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    required
                    error={errors.nom}
                    placeholder="Nom de famille"
                  />
                  
                  <Input
                    label="Prénom"
                    value={formData.prenom}
                    onChange={(e) => setFormData(prev => ({ ...prev, prenom: e.target.value }))}
                    leftIcon={<UserIcon className="h-5 w-5" />}
                    required
                    error={errors.prenom}
                    placeholder="Prénom"
                  />
                </div>

                <Input
                  label="Adresse email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  leftIcon={<EnvelopeIcon className="h-5 w-5" />}
                  required
                  error={errors.email}
                  placeholder="nom.prenom@crou.gov.ne"
                  helperText="Email institutionnel CROU"
                />

                <Input
                  label="Téléphone"
                  type="tel"
                  value={formData.telephone}
                  onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
                  leftIcon={<PhoneIcon className="h-5 w-5" />}
                  required
                  error={errors.telephone}
                  placeholder="+227 XX XX XX XX"
                  helperText="Numéro de téléphone professionnel"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mot de passe"
                    type="password"
                    value={formData.motDePasse}
                    onChange={(e) => setFormData(prev => ({ ...prev, motDePasse: e.target.value }))}
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    required
                    error={errors.motDePasse}
                    placeholder="Mot de passe sécurisé"
                    helperText="Minimum 8 caractères"
                  />
                  
                  <Input
                    label="Confirmer le mot de passe"
                    type="password"
                    value={formData.confirmMotDePasse}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmMotDePasse: e.target.value }))}
                    leftIcon={<LockClosedIcon className="h-5 w-5" />}
                    required
                    error={errors.confirmMotDePasse}
                    placeholder="Confirmer le mot de passe"
                  />
                </div>
              </form>
            </section>

            {/* Section 2: Informations CROU */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Informations CROU
              </h2>
              
              <div className="space-y-4">
                <Input
                  label="CROU d'affectation"
                  value={formData.crou}
                  onChange={(e) => setFormData(prev => ({ ...prev, crou: e.target.value }))}
                  leftIcon={<BuildingOfficeIcon className="h-5 w-5" />}
                  required
                  error={errors.crou}
                  placeholder="Ex: CROU Niamey"
                  helperText="Centre régional d'affectation"
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Poste occupé"
                    value={formData.poste}
                    onChange={(e) => setFormData(prev => ({ ...prev, poste: e.target.value }))}
                    placeholder="Ex: Directeur, Comptable..."
                    helperText="Fonction dans le CROU"
                  />
                  
                  <Input
                    label="Numéro d'employé"
                    value={formData.numeroEmploye}
                    onChange={(e) => setFormData(prev => ({ ...prev, numeroEmploye: e.target.value }))}
                    leftIcon={<IdentificationIcon className="h-5 w-5" />}
                    placeholder="EMP-2024-001"
                    helperText="Identifiant unique"
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Actions */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <div className="flex gap-4">
                <Button
                  type="submit"
                  loading={isSubmitting}
                  onClick={handleSubmit}
                  className="flex-1"
                >
                  Enregistrer {submitCount > 0 && `(${submitCount})`}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isSubmitting}
                >
                  Réinitialiser
                </Button>
              </div>
            </section>
          </div>

          {/* Colonne droite - Composants spécialisés */}
          <div className="space-y-8">
            {/* Section 4: Composants monétaires */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Saisie monétaire FCFA
              </h2>
              
              <div className="space-y-4">
                <CurrencyInput
                  label="Salaire mensuel"
                  value={formData.salaire}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, salaire: value }))}
                  min={50000}
                  max={5000000}
                  required
                  error={errors.salaire}
                  helperText="Salaire brut mensuel"
                />

                <CurrencyInput
                  label="Budget alloué"
                  value={formData.budget}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
                  min={0}
                  max={100000000}
                  helperText="Budget annuel du service"
                />

                <CurrencyInput
                  label="Subvention avec décimales"
                  value={formData.subvention}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, subvention: value }))}
                  decimals={2}
                  allowNegative
                  helperText="Montant avec centimes autorisés"
                />

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Valeurs actuelles :
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Salaire : {formData.salaire ? `${formData.salaire.toLocaleString()} FCFA` : 'Non défini'}</p>
                    <p>Budget : {formData.budget ? `${formData.budget.toLocaleString()} FCFA` : 'Non défini'}</p>
                    <p>Subvention : {formData.subvention ? `${formData.subvention.toLocaleString()} FCFA` : 'Non défini'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 5: Composants de date */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Saisie de dates françaises
              </h2>
              
              <div className="space-y-4">
                <DateInput
                  label="Date de naissance"
                  value={formData.dateNaissance}
                  onValueChange={(date) => setFormData(prev => ({ ...prev, dateNaissance: date }))}
                  maxDate={new Date()}
                  required
                  error={errors.dateNaissance}
                  helperText="Format : jj/mm/aaaa"
                />

                <DateInput
                  label="Date d'embauche"
                  value={formData.dateEmbauche}
                  onValueChange={(date) => setFormData(prev => ({ ...prev, dateEmbauche: date }))}
                  minDate={new Date(2000, 0, 1)}
                  maxDate={new Date()}
                  helperText="Date d'entrée en fonction"
                />

                <DateInput
                  label="Exercice budgétaire"
                  format="YYYY"
                  value={formData.exerciceBudgetaire}
                  onValueChange={(date) => setFormData(prev => ({ ...prev, exerciceBudgetaire: date }))}
                  fiscalYear
                  helperText="Année de l'exercice budgétaire"
                />

                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Dates sélectionnées :
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Naissance : {formData.dateNaissance ? formData.dateNaissance.toLocaleDateString('fr-FR') : 'Non définie'}</p>
                    <p>Embauche : {formData.dateEmbauche ? formData.dateEmbauche.toLocaleDateString('fr-FR') : 'Non définie'}</p>
                    <p>Exercice : {formData.exerciceBudgetaire ? formData.exerciceBudgetaire.getFullYear() : 'Non défini'}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 6: Variantes et états */}
            <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
                Variantes et états
              </h2>
              
              <div className="space-y-4">
                <Input
                  label="Recherche"
                  variant="filled"
                  value={formData.recherche}
                  onChange={(e) => setFormData(prev => ({ ...prev, recherche: e.target.value }))}
                  leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
                  placeholder="Rechercher dans les données..."
                  helperText="Variante filled avec icône"
                />

                <Input
                  label="Input en chargement"
                  loading
                  placeholder="Validation en cours..."
                  helperText="État de chargement avec spinner"
                />

                <Input
                  label="Input désactivé"
                  disabled
                  defaultValue="Valeur non modifiable"
                  helperText="Champ désactivé"
                />

                <Input
                  label="Input avec succès"
                  validationState="success"
                  defaultValue="validation@reussie.com"
                  helperText="Validation réussie"
                />

                <Input
                  label="Input avec avertissement"
                  variant="flushed"
                  validationState="warning"
                  defaultValue="attention"
                  helperText="Variante flushed avec avertissement"
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InputExamples;
