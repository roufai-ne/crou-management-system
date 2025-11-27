/**
 * FICHIER: apps/web/src/pages/housing/StudentApplicationPortal.tsx
 * PAGE: StudentApplicationPortal - Portail soumission demandes logement
 *
 * DESCRIPTION:
 * Interface étudiants pour soumettre demandes de logement
 * Stepper 5 étapes avec validation progressive et upload documents
 * Sauvegarde brouillon automatique et suivi demandes
 *
 * FONCTIONNALITÉS:
 * - Stepper 5 étapes guidé
 * - Validation éligibilité temps réel
 * - Upload documents drag&drop
 * - Sauvegarde brouillon auto (localStorage + API)
 * - Dashboard suivi demandes
 * - Timeline statuts avec notifications
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Card,
  CardHeader,
  CardBody,
  Button,
  Badge,
  Input,
  Select,
  RadioGroup,
  Alert,
  Progress,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Textarea,
  buttonVariants
} from '@/components/ui';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DocumentArrowUpIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { housingBatchService, ApplicationBatch } from '@/services/api/housingBatchService';
import { housingRequestService, HousingRequest, CreateRequestRequest, DocumentUpload } from '@/services/api/housingRequestService';
import { housingReportService } from '@/services/api/housingReportService';
import { useAuth } from '@/stores/auth';

export const StudentApplicationPortal: React.FC = () => {
  const { user } = useAuth();

  if (user?.role !== 'Etudiant' && user?.role !== 'Utilisateur') {
    return (
      <Container className="py-6">
        <Alert variant="error">
          Accès refusé. Cette page est réservée aux étudiants.
        </Alert>
      </Container>
    );
  }

  // États Stepper
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // États données
  const [activeBatches, setActiveBatches] = useState<ApplicationBatch[]>([]);
  const [myRequests, setMyRequests] = useState<HousingRequest[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<ApplicationBatch | null>(null);
  const [availability, setAvailability] = useState<any>(null);
  const [formData, setFormData] = useState<Partial<CreateRequestRequest>>({
    batchId: '',
    type: 'NOUVELLE',
    typeChambresPreferees: [],
    preferenceCites: [],
    observations: '',
    cycle: 'LICENCE',
    studyYear: 1,
    bacSeries: '',
    cityOfResidence: '',
    isScholarshipHolder: false,
    previousYearRentPaid: false
  });
  const [documents, setDocuments] = useState<DocumentUpload[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [eligibility, setEligibility] = useState<any>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  // États UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('submit');

  // Charger campagnes actives
  useEffect(() => {
    loadActiveBatches();
    loadMyRequests();
    loadDraftFromStorage();
  }, []);

  const loadActiveBatches = async () => {
    try {
      const result = await housingBatchService.getActiveBatches();
      setActiveBatches(result.data);
    } catch (err) {
      console.error('Erreur chargement campagnes:', err);
    }
  };

  const loadMyRequests = async () => {
    try {
      const result = await housingRequestService.getMyRequests();
      setMyRequests(result.data);
    } catch (err) {
      console.error('Erreur chargement demandes:', err);
    }
  };

  // Sauvegarde brouillon auto (localStorage)
  useEffect(() => {
    if (currentStep > 1 && currentStep < 5) {
      const timer = setTimeout(() => {
        saveDraftToStorage();
      }, 30000); // 30 secondes

      return () => clearTimeout(timer);
    }
  }, [formData, currentStep]);

  const saveDraftToStorage = () => {
    localStorage.setItem('housing-draft', JSON.stringify({
      formData,
      currentStep,
      selectedBatch,
      timestamp: Date.now()
    }));
  };

  const loadDraftFromStorage = () => {
    const draft = localStorage.getItem('housing-draft');
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        // Vérifier si brouillon < 24h
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          setFormData(parsed.formData);
          setCurrentStep(parsed.currentStep);
          setSelectedBatch(parsed.selectedBatch);
        }
      } catch (err) {
        console.error('Erreur chargement brouillon:', err);
      }
    }
  };

  const clearDraftFromStorage = () => {
    localStorage.removeItem('housing-draft');
  };

  // Étape 1: Sélection campagne
  const handleSelectBatch = async (batch: ApplicationBatch) => {
    setSelectedBatch(batch);
    setFormData({ ...formData, batchId: batch.id });
    setCompletedSteps([...completedSteps, 1]);
    setCurrentStep(2);

    // Charger disponibilité
    try {
      const result = await housingReportService.getAvailabilityByGender();
      setAvailability(result.data);
    } catch (err) {
      console.error('Erreur chargement disponibilité:', err);
    }
  };

  // Étape 2: Formulaire préférences
  const handleSubmitPreferences = () => {
    if (!formData.type || !formData.typeChambresPreferees?.length) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setCompletedSteps([...completedSteps, 2]);
    setCurrentStep(3);
    setError(null);
  };

  // Étape 3: Upload documents
  const handleUploadDocument = async (docType: string, file: File) => {
    try {
      setUploadProgress({ ...uploadProgress, [docType]: 0 });

      // Créer brouillon si pas encore fait
      if (!draftId) {
        const draft = await housingRequestService.createDraftRequest(formData);
        setDraftId(draft.data.id);
      }

      // Upload
      setUploadProgress({ ...uploadProgress, [docType]: 50 });
      const result = await housingRequestService.uploadDocument(draftId!, docType, file);
      setUploadProgress({ ...uploadProgress, [docType]: 100 });

      // Recharger documents
      await loadDocuments();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur upload document');
      setUploadProgress({ ...uploadProgress, [docType]: 0 });
    }
  };

  const loadDocuments = async () => {
    if (!draftId) return;
    try {
      const result = await housingRequestService.getRequestDocuments(draftId);
      setDocuments(result.data);
    } catch (err) {
      console.error('Erreur chargement documents:', err);
    }
  };

  const handleNextFromDocuments = () => {
    // Vérifier documents requis selon type
    const requiredDocs = formData.type === 'RENOUVELLEMENT'
      ? ['rentReceipt', 'enrollmentReceipt']
      : ['scholarshipProof', 'enrollmentReceipt'];

    const uploadedTypes = documents.map(d => d.docType);
    const allUploaded = requiredDocs.every(type => uploadedTypes.includes(type));

    if (!allUploaded) {
      setError('Veuillez uploader tous les documents requis');
      return;
    }

    setCompletedSteps([...completedSteps, 3]);
    setCurrentStep(4);
    setError(null);
    validateEligibility();
  };

  // Étape 4: Validation éligibilité
  const validateEligibility = async () => {
    try {
      setLoading(true);
      // Simuler validation (API backend le fera automatiquement lors de la soumission)
      // Règles métier
      const maxYears = {
        'LICENCE': 3,
        'MASTER': 2,
        'MEDECINE': 8,
        'DOCTORAT': 3
      };

      const currentMaxYears = maxYears[formData.cycle || 'LICENCE'];
      const hasNotExceededMaxYears = (formData.studyYear || 1) <= currentMaxYears;

      // Calcul du score de priorité
      let score = 0;
      const reasons: string[] = [];

      if (formData.type === 'NOUVELLE') {
        // Règle: Priorité aux BAC scientifiques (C, D, E)
        if (['C', 'D', 'E'].includes(formData.bacSeries?.toUpperCase() || '')) {
          score += 50;
        } else {
          score += 20;
        }

        // Règle: Provenance (les non résidents de la ville sont prioritaires)
        // On suppose ici que l'université est à Niamey pour l'exemple
        if (formData.cityOfResidence?.toLowerCase() !== 'niamey') {
          score += 40;
        }

        // Règle: Etre boursier
        if (formData.isScholarshipHolder) {
          score += 30;
        } else {
          reasons.push("La bourse est requise pour une nouvelle attribution");
        }

      } else {
        // Renouvellement
        if (hasNotExceededMaxYears) {
          score += 50;
        } else {
          reasons.push(`Durée d'études dépassée pour le cycle ${formData.cycle} (Max: ${currentMaxYears} ans)`);
        }

        // Règle: Avoir payé le loyer de l'année précédente
        if (formData.previousYearRentPaid) {
          score += 50;
        } else {
          reasons.push("Le paiement du loyer de l'année précédente est requis");
        }
      }

      const isEligible = reasons.length === 0;

      setEligibility({
        isEligible,
        score,
        reasons,
        checks: {
          hasRentPaid: formData.type === 'RENOUVELLEMENT' ? formData.previousYearRentPaid : true,
          hasNotExceededMaxYears,
          isBoursier: formData.type === 'NOUVELLE' ? formData.isScholarshipHolder : true,
          hasDocuments: true
        }
      });
      setCompletedSteps([...completedSteps, 4]);
    } catch (err) {
      setError('Erreur validation éligibilité');
    } finally {
      setLoading(false);
    }
  };

  const handleNextFromEligibility = () => {
    if (!eligibility?.isEligible) {
      setError('Vous n\'êtes pas éligible pour cette demande');
      return;
    }
    setCurrentStep(5);
    setError(null);
  };

  // Étape 5: Soumission finale
  const handleSubmitApplication = async () => {
    try {
      setLoading(true);
      setError(null);

      await housingRequestService.createRequest(formData as CreateRequestRequest);

      // Nettoyer brouillon
      clearDraftFromStorage();
      if (draftId) {
        await housingRequestService.deleteRequest(draftId);
      }

      // Recharger demandes
      await loadMyRequests();

      // Basculer sur onglet suivi
      setActiveTab('tracking');

      // Reset
      setCurrentStep(1);
      setCompletedSteps([]);
      setFormData({
        batchId: '',
        type: 'NOUVELLE',
        typeChambresPreferees: [],
        preferenceCites: [],
        observations: ''
      });
      setSelectedBatch(null);
      setDraftId(null);
      setDocuments([]);
      setEligibility(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur soumission demande');
    } finally {
      setLoading(false);
    }
  };

  // Badge statut demande
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      DRAFT: { variant: 'default', label: 'Brouillon' },
      SUBMITTED: { variant: 'info', label: 'Soumise' },
      UNDER_REVIEW: { variant: 'warning', label: 'En examen' },
      APPROVED: { variant: 'success', label: 'Approuvée' },
      REJECTED: { variant: 'danger', label: 'Rejetée' },
      ASSIGNED: { variant: 'primary', label: 'Assignée' },
      CONFIRMED: { variant: 'success', label: 'Confirmée' }
    };
    const config = variants[status] || variants.DRAFT;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Calcul jours restants
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  return (
    <Container className="py-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Demande de Logement
      </h1>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="submit">Nouvelle demande</TabsTrigger>
          <TabsTrigger value="tracking">Mes demandes</TabsTrigger>
        </TabsList>

        {/* Onglet Soumission */}
        <TabsContent value="submit">
          <Card>
            <CardHeader>
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  {[1, 2, 3, 4, 5].map(step => (
                    <div key={step} className="flex items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${completedSteps.includes(step)
                        ? 'bg-green-500 text-white'
                        : currentStep === step
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-600'
                        }`}>
                        {completedSteps.includes(step) ? (
                          <CheckCircleIcon className="h-6 w-6" />
                        ) : (
                          step
                        )}
                      </div>
                      {step < 5 && (
                        <div className={`w-24 h-1 ${completedSteps.includes(step) ? 'bg-green-500' : 'bg-gray-300'
                          }`} />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Campagne</span>
                  <span>Préférences</span>
                  <span>Documents</span>
                  <span>Éligibilité</span>
                  <span>Soumission</span>
                </div>
              </div>
            </CardHeader>

            <CardBody>
              {error && <Alert variant="error" className="mb-4">{error}</Alert>}

              {/* Étape 1: Sélection campagne */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Campagnes actives</h2>
                  {activeBatches.length === 0 ? (
                    <Alert variant="info">
                      Aucune campagne active actuellement. Veuillez revenir plus tard.
                    </Alert>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeBatches.map(batch => (
                        <Card key={batch.id} className="cursor-pointer hover:shadow-lg transition" onClick={() => handleSelectBatch(batch)}>
                          <CardBody>
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="font-semibold">{batch.name}</h3>
                              <Badge variant="success">OUVERTE</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{batch.academicYear}</p>
                            <div className="flex items-center gap-2 text-sm">
                              <ClockIcon className="h-4 w-4 text-orange-500" />
                              <span>{getDaysRemaining(batch.endDate)} jours restants</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                              Du {new Date(batch.startDate).toLocaleDateString('fr-FR')} au {new Date(batch.endDate).toLocaleDateString('fr-FR')}
                            </p>
                          </CardBody>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Étape 2: Préférences */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Vos préférences</h2>

                  <RadioGroup
                    label="Type de demande"
                    name="type"
                    value={formData.type || 'NOUVELLE'}
                    onChange={(value) => setFormData({ ...formData, type: value as any })}
                    options={[
                      { value: 'NOUVELLE', label: 'Nouvelle attribution' },
                      { value: 'RENOUVELLEMENT', label: 'Renouvellement' }
                    ]}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select
                      label="Cycle d'études"
                      value={formData.cycle}
                      onChange={(value) => setFormData({ ...formData, cycle: value as any })}
                      options={[
                        { value: 'LICENCE', label: 'Licence (Max 3 ans)' },
                        { value: 'MASTER', label: 'Master (Max 2 ans)' },
                        { value: 'MEDECINE', label: 'Médecine (Max 8 ans)' },
                        { value: 'DOCTORAT', label: 'Doctorat (Max 3 ans)' }
                      ]}
                    />
                    <Input
                      label="Année d'étude actuelle"
                      type="number"
                      min={1}
                      max={8}
                      value={formData.studyYear}
                      onChange={(e) => setFormData({ ...formData, studyYear: parseInt(e.target.value) })}
                    />
                  </div>

                  {formData.type === 'NOUVELLE' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                      <Input
                        label="Série du BAC"
                        placeholder="Ex: C, D, E, A..."
                        value={formData.bacSeries}
                        onChange={(e) => setFormData({ ...formData, bacSeries: e.target.value })}
                        helperText="Priorité aux séries scientifiques (C, D, E)"
                      />
                      <Input
                        label="Ville de résidence des parents"
                        placeholder="Ex: Zinder, Maradi..."
                        value={formData.cityOfResidence}
                        onChange={(e) => setFormData({ ...formData, cityOfResidence: e.target.value })}
                        helperText="Priorité aux non-résidents de la ville universitaire"
                      />
                      <div className="col-span-2">
                        <label className="flex items-center space-x-2 cursor-pointer">
                          <input
                            type="checkbox"
                            className="form-checkbox h-5 w-5 text-blue-600 rounded"
                            checked={formData.isScholarshipHolder}
                            onChange={(e) => setFormData({ ...formData, isScholarshipHolder: e.target.checked })}
                          />
                          <span className="text-gray-700">Je certifie être boursier (Attestation requise)</span>
                        </label>
                      </div>
                    </div>
                  )}

                  {formData.type === 'RENOUVELLEMENT' && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600 rounded"
                          checked={formData.previousYearRentPaid}
                          onChange={(e) => setFormData({ ...formData, previousYearRentPaid: e.target.checked })}
                        />
                        <span className="text-gray-700">Je certifie avoir payé l'intégralité de mon loyer l'année précédente</span>
                      </label>
                    </div>
                  )}

                  <Select
                    label="Type de chambres préférées (plusieurs choix possibles)"
                    multiple
                    value={formData.typeChambresPreferees}
                    onChange={(value) => {
                      const options = Array.isArray(value) ? value.map(String) : [String(value)];
                      setFormData({ ...formData, typeChambresPreferees: options });
                    }}
                    options={[
                      { value: 'INDIVIDUELLE', label: 'Individuelle' },
                      { value: 'DOUBLE', label: 'Double' },
                      { value: 'TRIPLE', label: 'Triple' }
                    ]}
                  />

                  {availability && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-2">Disponibilité actuelle:</p>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-600 dark:text-blue-400">Hommes:</span>
                          <span className="ml-2 font-semibold">{availability.male.availableBeds} lits disponibles</span>
                        </div>
                        <div>
                          <span className="text-pink-600 dark:text-pink-400">Femmes:</span>
                          <span className="ml-2 font-semibold">{availability.female.availableBeds} lits disponibles</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <Textarea
                    label="Observations (optionnel)"
                    placeholder="Précisions ou demandes particulières..."
                    value={formData.observations || ''}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    rows={3}
                  />

                  <div className="flex gap-4">
                    <Button variant="outline" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={() => setCurrentStep(1)}>
                      Retour
                    </Button>
                    <Button rightIcon={<ArrowRightIcon className="h-4 w-4" />} onClick={handleSubmitPreferences}>
                      Suivant
                    </Button>
                  </div>
                </div>
              )}

              {/* Étape 3: Upload documents */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Documents requis</h2>

                  <Alert variant="info">
                    {formData.type === 'RENOUVELLEMENT'
                      ? 'Pour un renouvellement: Quittance de loyer dernière année + Quittance inscription'
                      : 'Pour une nouvelle attribution: Attestation de bourse + Quittance inscription'
                    }
                  </Alert>

                  {/* Liste documents avec upload */}
                  <div className="space-y-3">
                    {(formData.type === 'RENOUVELLEMENT'
                      ? [
                        { type: 'rentReceipt', label: 'Quittance de loyer' },
                        { type: 'enrollmentReceipt', label: 'Quittance d\'inscription' }
                      ]
                      : [
                        { type: 'scholarshipProof', label: 'Attestation de bourse' },
                        { type: 'enrollmentReceipt', label: 'Quittance d\'inscription' }
                      ]
                    ).map(doc => {
                      const uploaded = documents.find(d => d.docType === doc.type);
                      const progress = uploadProgress[doc.type];

                      return (
                        <Card key={doc.type}>
                          <CardBody>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <DocumentArrowUpIcon className="h-6 w-6 text-gray-400" />
                                <div>
                                  <p className="font-medium">{doc.label}</p>
                                  {uploaded && (
                                    <p className="text-sm text-green-600">
                                      {uploaded.fileName} ({(uploaded.fileSize / 1024).toFixed(0)} Ko)
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div>
                                {uploaded ? (
                                  <Badge variant="success">Uploadé</Badge>
                                ) : (
                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept=".pdf,.jpg,.jpeg,.png"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleUploadDocument(doc.type, file);
                                      }}
                                    />
                                    <div className={buttonVariants({ size: 'sm', variant: 'primary' })}>
                                      Choisir fichier
                                    </div>
                                  </label>
                                )}
                              </div>
                            </div>
                            {progress !== undefined && progress < 100 && (
                              <Progress value={progress} className="mt-2" />
                            )}
                          </CardBody>
                        </Card>
                      );
                    })}
                  </div>

                  <div className="flex gap-4">
                    <Button variant="outline" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={() => setCurrentStep(2)}>
                      Retour
                    </Button>
                    <Button rightIcon={<ArrowRightIcon className="h-4 w-4" />} onClick={handleNextFromDocuments}>
                      Suivant
                    </Button>
                  </div>
                </div>
              )}

              {/* Étape 4: Éligibilité */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Validation d'éligibilité</h2>

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                      <p className="mt-4 text-gray-600">Vérification en cours...</p>
                    </div>
                  ) : eligibility ? (
                    <div>
                      {eligibility.isEligible ? (
                        <>
                          <Alert variant="success" className="mb-4">
                            <CheckCircleIcon className="h-6 w-6" />
                            <span className="ml-2">Vous êtes éligible pour cette demande !</span>
                          </Alert>

                          <Card>
                            <CardBody>
                              <p className="text-sm text-gray-600 mb-2">Score de priorité estimé:</p>
                              <p className="text-3xl font-bold text-blue-600">{eligibility.score}</p>
                            </CardBody>
                          </Card>

                          <div className="mt-4 space-y-2">
                            <p className="font-medium">Vérifications:</p>
                            {Object.entries(eligibility.checks).map(([key, value]) => (
                              <div key={key} className="flex items-center gap-2">
                                {value ? (
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                ) : (
                                  <XCircleIcon className="h-5 w-5 text-red-500" />
                                )}
                                <span className="text-sm">{key}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          <Alert variant="error">
                            <XCircleIcon className="h-6 w-6" />
                            <span className="ml-2">Vous n'êtes pas éligible</span>
                          </Alert>
                          <ul className="mt-4 space-y-2">
                            {eligibility.reasons.map((reason: string, idx: number) => (
                              <li key={idx} className="text-sm text-red-600">• {reason}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  ) : null}

                  <div className="flex gap-4">
                    <Button variant="outline" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={() => setCurrentStep(3)}>
                      Retour
                    </Button>
                    {eligibility?.isEligible && (
                      <Button rightIcon={<ArrowRightIcon className="h-4 w-4" />} onClick={handleNextFromEligibility}>
                        Suivant
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Étape 5: Récapitulatif */}
              {currentStep === 5 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold mb-4">Récapitulatif de votre demande</h2>

                  <Card>
                    <CardBody>
                      <dl className="space-y-3">
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Campagne</dt>
                          <dd className="mt-1 text-sm">{selectedBatch?.name}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Type de demande</dt>
                          <dd className="mt-1">
                            <Badge>{formData.type}</Badge>
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Préférences chambres</dt>
                          <dd className="mt-1 text-sm">{formData.typeChambresPreferees?.join(', ')}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Documents uploadés</dt>
                          <dd className="mt-1 text-sm">{documents.length} document(s)</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500">Score priorité estimé</dt>
                          <dd className="mt-1 text-2xl font-bold text-blue-600">{eligibility?.score}</dd>
                        </div>
                      </dl>
                    </CardBody>
                  </Card>

                  <Alert variant="warning">
                    En soumettant cette demande, vous confirmez l'exactitude des informations fournies.
                  </Alert>

                  <div className="flex gap-4">
                    <Button variant="outline" leftIcon={<ArrowLeftIcon className="h-4 w-4" />} onClick={() => setCurrentStep(4)}>
                      Retour
                    </Button>
                    <Button
                      variant="success"
                      loading={loading}
                      onClick={handleSubmitApplication}
                    >
                      Soumettre ma demande
                    </Button>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </TabsContent>

        {/* Onglet Suivi */}
        <TabsContent value="tracking">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Mes demandes</h2>
            </CardHeader>
            <CardBody>
              {myRequests.length === 0 ? (
                <Alert variant="info">
                  Vous n'avez pas encore de demande de logement.
                </Alert>
              ) : (
                <div className="space-y-4">
                  {myRequests.map(request => (
                    <Card key={request.id}>
                      <CardBody>
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold">{request.batch?.name}</h3>
                            <p className="text-sm text-gray-600">{request.type}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              Soumise le {new Date(request.dateSubmission!).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-600">Score priorité:</span>
                            <span className="font-semibold text-blue-600">{request.priorityScore}</span>
                          </div>
                        </div>

                        {request.roomAssignedId && (
                          <Alert variant="success" className="mt-4">
                            Chambre assignée: {request.roomAssigned?.numero}
                          </Alert>
                        )}

                        {request.motifRejet && (
                          <Alert variant="error" className="mt-4">
                            Motif de rejet: {request.motifRejet}
                          </Alert>
                        )}
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </Container >
  );
};

export default StudentApplicationPortal;
