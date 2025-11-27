/**
 * FICHIER: apps/web/src/pages/students/StudentRegistrationPage.tsx
 * PAGE: StudentRegistrationPage - Inscription étudiant multi-étapes
 *
 * DESCRIPTION:
 * Wizard d'inscription en ligne pour les nouveaux étudiants
 * Processus guidé avec validation par étape
 * Intégration paiement et génération documents
 *
 * ÉTAPES:
 * 1. Informations personnelles
 * 2. Documents et photo
 * 3. Choix des services (logement, restauration, transport)
 * 4. Paiement
 * 5. Confirmation et téléchargement
 *
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2024
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  FileText,
  Home,
  CreditCard,
  CheckCircle,
  Upload,
  Camera,
  Package,
  Bus
} from 'lucide-react';
import ModernStepper, { Step } from '@/components/ui/ModernStepper';
import { Input } from '@/components/ui/Input';
import ModernSelect from '@/components/ui/ModernSelect';
import ModernCheckbox from '@/components/ui/ModernCheckbox';
import ModernFileUpload from '@/components/ui/ModernFileUpload';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/stores/auth';

interface RegistrationData {
  // Étape 1: Informations personnelles
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  studentId: string;
  faculty: string;
  level: string;

  // Étape 2: Documents
  photo?: File;
  idCard?: File;
  enrollmentCertificate?: File;

  // Étape 3: Services
  needHousing: boolean;
  housingType?: 'simple' | 'double' | 'triple';
  needRestaurant: boolean;
  restaurantPlan?: 'basic' | 'premium';
  needTransport: boolean;
  transportRoute?: string;

  // Étape 4: Paiement
  paymentMethod?: 'cash' | 'bank' | 'mobile';
  mobileNumber?: string;
}

export const StudentRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuth.getState();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<RegistrationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    studentId: '',
    faculty: '',
    level: '',
    needHousing: false,
    needRestaurant: false,
    needTransport: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});

  // Configuration des étapes
  const steps: Step[] = [
    {
      id: 'personal',
      label: 'Informations Personnelles',
      description: 'Identité et coordonnées',
      icon: User,
    },
    {
      id: 'documents',
      label: 'Documents',
      description: 'Photo et pièces justificatives',
      icon: FileText,
    },
    {
      id: 'services',
      label: 'Services CROU',
      description: 'Logement, restauration, transport',
      icon: Home,
    },
    {
      id: 'payment',
      label: 'Paiement',
      description: 'Frais d\'inscription',
      icon: CreditCard,
    },
    {
      id: 'confirmation',
      label: 'Confirmation',
      description: 'Récapitulatif et validation',
      icon: CheckCircle,
    },
  ];

  // Validation par étape
  const validateStep = (step: number): boolean => {
    const newErrors: Partial<Record<keyof RegistrationData, string>> = {};

    switch (step) {
      case 0: // Informations personnelles
        if (!formData.firstName) newErrors.firstName = 'Le prénom est requis';
        if (!formData.lastName) newErrors.lastName = 'Le nom est requis';
        if (!formData.email) newErrors.email = 'L\'email est requis';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
          newErrors.email = 'Email invalide';
        }
        if (!formData.phone) newErrors.phone = 'Le téléphone est requis';
        if (!formData.studentId) newErrors.studentId = 'Le numéro étudiant est requis';
        if (!formData.faculty) newErrors.faculty = 'La faculté est requise';
        if (!formData.level) newErrors.level = 'Le niveau est requis';
        break;

      case 1: // Documents
        if (!formData.photo) newErrors.photo = 'La photo est requise' as any;
        if (!formData.idCard) newErrors.idCard = 'La carte d\'identité est requise' as any;
        if (!formData.enrollmentCertificate) {
          newErrors.enrollmentCertificate = 'Le certificat d\'inscription est requis' as any;
        }
        break;

      case 2: // Services
        // Validation conditionnelle
        if (formData.needHousing && !formData.housingType) {
          newErrors.housingType = 'Choisissez un type de logement';
        }
        if (formData.needRestaurant && !formData.restaurantPlan) {
          newErrors.restaurantPlan = 'Choisissez une formule restaurant';
        }
        if (formData.needTransport && !formData.transportRoute) {
          newErrors.transportRoute = 'Choisissez un itinéraire';
        }
        break;

      case 3: // Paiement
        if (!formData.paymentMethod) newErrors.paymentMethod = 'Choisissez un mode de paiement';
        if (formData.paymentMethod === 'mobile' && !formData.mobileNumber) {
          newErrors.mobileNumber = 'Le numéro mobile est requis';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(steps.length - 1, prev + 1));
    } else {
      toast.error('Veuillez corriger les erreurs avant de continuer');
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleComplete = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simuler l'envoi des données
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simuler une connexion automatique
      setUser({
        id: 'new-student',
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        role: 'Etudiant',
        tenantId: 'niamey',
        tenantType: 'crou',
        hierarchyLevel: 'crou',
        level: 'crou',
        crouId: 'niamey',
        permissions: ['housing:read', 'housing:write'],
        lastLoginAt: new Date()
      });
      setTokens('mock-token', 'mock-refresh-token');

      toast.success('Inscription réussie ! Bienvenue sur votre espace.');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Erreur lors de l\'inscription. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateFormData = (field: keyof RegistrationData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const calculateTotalFees = () => {
    let total = 5000; // Frais d'inscription de base
    if (formData.needHousing) {
      const housingFees = {
        simple: 50000,
        double: 35000,
        triple: 25000,
      };
      total += housingFees[formData.housingType || 'simple'];
    }
    if (formData.needRestaurant) {
      const restaurantFees = {
        basic: 20000,
        premium: 30000,
      };
      total += restaurantFees[formData.restaurantPlan || 'basic'];
    }
    if (formData.needTransport) {
      total += 10000;
    }
    return total;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Inscription en Ligne
          </h1>
          <p className="text-gray-600">
            Complétez votre inscription aux services du CROU Niger
          </p>
        </div>

        {/* Stepper */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <ModernStepper
            steps={steps}
            currentStep={currentStep}
            onStepChange={setCurrentStep}
            variant="gradient-crou"
            allowSkip={false}
          />
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <ModernStepper.Content step={currentStep}>
            {/* Étape 1: Informations Personnelles */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Informations Personnelles
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Prénom"
                    value={formData.firstName}
                    onChange={(e) => updateFormData('firstName', e.target.value)}
                    error={errors.firstName}
                    required
                  />
                  <Input
                    label="Nom"
                    value={formData.lastName}
                    onChange={(e) => updateFormData('lastName', e.target.value)}
                    error={errors.lastName}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    error={errors.email}
                    required
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    error={errors.phone}
                    required
                  />
                </div>

                <Input
                  label="Numéro Étudiant"
                  value={formData.studentId}
                  onChange={(e) => updateFormData('studentId', e.target.value)}
                  error={errors.studentId}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ModernSelect
                    label="Faculté"
                    value={formData.faculty}
                    onChange={(value) => updateFormData('faculty', value)}
                    options={[
                      { value: 'sciences', label: 'Sciences' },
                      { value: 'lettres', label: 'Lettres et Sciences Humaines' },
                      { value: 'droit', label: 'Droit et Sciences Politiques' },
                      { value: 'medecine', label: 'Médecine' },
                      { value: 'economie', label: 'Économie et Gestion' },
                    ]}
                    error={errors.faculty}
                    required
                  />
                  <ModernSelect
                    label="Niveau"
                    value={formData.level}
                    onChange={(value) => updateFormData('level', value)}
                    options={[
                      { value: 'l1', label: 'Licence 1' },
                      { value: 'l2', label: 'Licence 2' },
                      { value: 'l3', label: 'Licence 3' },
                      { value: 'm1', label: 'Master 1' },
                      { value: 'm2', label: 'Master 2' },
                      { value: 'doctorat', label: 'Doctorat' },
                    ]}
                    error={errors.level}
                    required
                  />
                </div>
              </div>
            )}

            {/* Étape 2: Documents */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Documents et Photo
                </h2>

                <div>
                  <ModernFileUpload
                    label="Photo d'identité *"
                    accept="image/*"
                    maxSize={2}
                    onChange={(files) => updateFormData('photo', files[0])}
                    error={errors.photo as string}
                  />
                  <p className="text-xs text-gray-500 mt-1">Format JPG ou PNG, max 2MB</p>
                </div>

                <div>
                  <ModernFileUpload
                    label="Carte d'identité *"
                    accept="image/*,.pdf"
                    maxSize={5}
                    onChange={(files) => updateFormData('idCard', files[0])}
                    error={errors.idCard as string}
                  />
                  <p className="text-xs text-gray-500 mt-1">Recto-verso de votre CNI</p>
                </div>

                <div>
                  <ModernFileUpload
                    label="Certificat d'inscription *"
                    accept=".pdf"
                    maxSize={5}
                    onChange={(files) => updateFormData('enrollmentCertificate', files[0])}
                    error={errors.enrollmentCertificate as string}
                  />
                  <p className="text-xs text-gray-500 mt-1">Délivré par votre faculté</p>
                </div>
              </div>
            )}

            {/* Étape 3: Services */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Services CROU
                </h2>

                {/* Logement */}
                <div className="p-6 bg-emerald-50 rounded-lg border border-emerald-200">
                  <div className="flex items-start gap-3 mb-4">
                    <Home className="w-6 h-6 text-emerald-600 mt-1" />
                    <div className="flex-1">
                      <ModernCheckbox
                        label="Je souhaite un logement universitaire"
                        checked={formData.needHousing}
                        onChange={(checked) => updateFormData('needHousing', checked)}
                      />
                    </div>
                  </div>

                  {formData.needHousing && (
                    <ModernSelect
                      label="Type de chambre"
                      value={formData.housingType || ''}
                      onChange={(value) => updateFormData('housingType', value)}
                      options={[
                        { value: 'simple', label: 'Chambre Simple - 50,000 FCFA/an' },
                        { value: 'double', label: 'Chambre Double - 35,000 FCFA/an' },
                        { value: 'triple', label: 'Chambre Triple - 25,000 FCFA/an' },
                      ]}
                      error={errors.housingType}
                      required
                    />
                  )}
                </div>

                {/* Restauration */}
                <div className="p-6 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-start gap-3 mb-4">
                    <Package className="w-6 h-6 text-orange-600 mt-1" />
                    <div className="flex-1">
                      <ModernCheckbox
                        label="Je souhaite un abonnement restaurant"
                        checked={formData.needRestaurant}
                        onChange={(checked) => updateFormData('needRestaurant', checked)}
                      />
                    </div>
                  </div>

                  {formData.needRestaurant && (
                    <ModernSelect
                      label="Formule restaurant"
                      value={formData.restaurantPlan || ''}
                      onChange={(value) => updateFormData('restaurantPlan', value)}
                      options={[
                        { value: 'basic', label: 'Formule Basic - 20,000 FCFA/mois (2 repas/jour)' },
                        { value: 'premium', label: 'Formule Premium - 30,000 FCFA/mois (3 repas/jour)' },
                      ]}
                      error={errors.restaurantPlan}
                      required
                    />
                  )}
                </div>

                {/* Transport */}
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3 mb-4">
                    <Bus className="w-6 h-6 text-blue-600 mt-1" />
                    <div className="flex-1">
                      <ModernCheckbox
                        label="Je souhaite bénéficier du transport universitaire"
                        checked={formData.needTransport}
                        onChange={(checked) => updateFormData('needTransport', checked)}
                      />
                    </div>
                  </div>

                  {formData.needTransport && (
                    <ModernSelect
                      label="Itinéraire"
                      value={formData.transportRoute || ''}
                      onChange={(value) => updateFormData('transportRoute', value)}
                      options={[
                        { value: 'campus-cite-a', label: 'Campus ↔ Cité A - 10,000 FCFA/mois' },
                        { value: 'campus-cite-b', label: 'Campus ↔ Cité B - 10,000 FCFA/mois' },
                        { value: 'campus-centre', label: 'Campus ↔ Centre-ville - 10,000 FCFA/mois' },
                      ]}
                      error={errors.transportRoute}
                      required
                    />
                  )}
                </div>
              </div>
            )}

            {/* Étape 4: Paiement */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Paiement des Frais
                </h2>

                {/* Récapitulatif */}
                <div className="p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-4">Récapitulatif des frais</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frais d'inscription</span>
                      <span className="font-medium">5,000 FCFA</span>
                    </div>
                    {formData.needHousing && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Logement ({formData.housingType})</span>
                        <span className="font-medium">
                          {formData.housingType === 'simple' ? '50,000' :
                            formData.housingType === 'double' ? '35,000' : '25,000'} FCFA
                        </span>
                      </div>
                    )}
                    {formData.needRestaurant && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Restaurant ({formData.restaurantPlan})</span>
                        <span className="font-medium">
                          {formData.restaurantPlan === 'premium' ? '30,000' : '20,000'} FCFA
                        </span>
                      </div>
                    )}
                    {formData.needTransport && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Transport</span>
                        <span className="font-medium">10,000 FCFA</span>
                      </div>
                    )}
                    <div className="pt-3 border-t border-gray-300 flex justify-between">
                      <span className="font-semibold text-gray-900">Total à payer</span>
                      <span className="text-xl font-bold text-emerald-600">
                        {calculateTotalFees().toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                </div>

                {/* Mode de paiement */}
                <ModernSelect
                  label="Mode de paiement"
                  value={formData.paymentMethod || ''}
                  onChange={(value) => updateFormData('paymentMethod', value)}
                  options={[
                    { value: 'cash', label: 'Espèces (payer au guichet)' },
                    { value: 'bank', label: 'Virement bancaire' },
                    { value: 'mobile', label: 'Mobile Money (Orange/Moov)' },
                  ]}
                  error={errors.paymentMethod}
                  required
                />

                {formData.paymentMethod === 'mobile' && (
                  <Input
                    label="Numéro Mobile Money"
                    type="tel"
                    value={formData.mobileNumber || ''}
                    onChange={(e) => updateFormData('mobileNumber', e.target.value)}
                    error={errors.mobileNumber}
                    placeholder="+227 XX XX XX XX"
                    required
                  />
                )}

                {formData.paymentMethod && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      {formData.paymentMethod === 'cash' && (
                        <>Présentez-vous au guichet du CROU avec cette confirmation pour effectuer le paiement.</>
                      )}
                      {formData.paymentMethod === 'bank' && (
                        <>Les instructions de virement vous seront envoyées par email après validation.</>
                      )}
                      {formData.paymentMethod === 'mobile' && (
                        <>Vous recevrez une demande de paiement sur votre téléphone. Validez pour finaliser l'inscription.</>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Étape 5: Confirmation */}
            {currentStep === 4 && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Prêt à finaliser votre inscription !
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Vérifiez que toutes les informations sont correctes. Vous recevrez un email de confirmation
                  avec vos identifiants et les prochaines étapes.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Informations personnelles</h3>
                    <p className="text-sm text-gray-600">
                      {formData.firstName} {formData.lastName}<br />
                      {formData.email}<br />
                      {formData.studentId}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-semibold text-gray-900 mb-2">Services souscrits</h3>
                    <p className="text-sm text-gray-600">
                      {formData.needHousing && <>✓ Logement<br /></>}
                      {formData.needRestaurant && <>✓ Restauration<br /></>}
                      {formData.needTransport && <>✓ Transport<br /></>}
                      {!formData.needHousing && !formData.needRestaurant && !formData.needTransport &&
                        'Inscription uniquement'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}
          </ModernStepper.Content>

          {/* Navigation */}
          <ModernStepper.Navigation
            onPrevious={handlePrevious}
            onNext={handleNext}
            onComplete={handleComplete}
            isFirstStep={currentStep === 0}
            isLastStep={currentStep === steps.length - 1}
            nextDisabled={isSubmitting}
            previousLabel="Retour"
            nextLabel="Continuer"
            completeLabel={isSubmitting ? 'Envoi en cours...' : 'Finaliser l\'inscription'}
          />
        </div>
      </div>
    </div>
  );
};

export default StudentRegistrationPage;
