/**
 * FICHIER: apps\web\src\pages\examples\ButtonExamples.tsx
 * PAGE: Exemples d'utilisation du composant Button
 * 
 * DESCRIPTION:
 * Page de démonstration du composant Button dans un contexte réel
 * Montre les bonnes pratiques d'utilisation dans l'application CROU
 * Exemples interactifs avec gestion d'état
 * 
 * USAGE:
 * Page accessible via /examples/buttons pour tester le composant
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  BanknotesIcon
} from '@heroicons/react/24/outline';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export const ButtonExamples: React.FC = () => {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  const [counters, setCounters] = useState<Record<string, number>>({});

  // Fonction pour simuler une action asynchrone
  const handleAsyncAction = async (actionId: string, duration = 2000) => {
    setLoadingStates(prev => ({ ...prev, [actionId]: true }));
    
    await new Promise(resolve => setTimeout(resolve, duration));
    
    setLoadingStates(prev => ({ ...prev, [actionId]: false }));
    setCounters(prev => ({ ...prev, [actionId]: (prev[actionId] || 0) + 1 }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Composant Button - Exemples
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Démonstration interactive du composant Button du système de design CROU
              </p>
            </div>
            <ThemeToggle showLabel />
          </div>
        </div>

        <div className="space-y-12">
          {/* Section 1: Variantes de base */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Variantes de base
            </h2>
            <div className="flex flex-wrap gap-4">
              <Button variant="primary" onClick={() => handleAsyncAction('primary')}>
                Primary {counters.primary ? `(${counters.primary})` : ''}
              </Button>
              <Button variant="secondary" onClick={() => handleAsyncAction('secondary')}>
                Secondary {counters.secondary ? `(${counters.secondary})` : ''}
              </Button>
              <Button variant="success" onClick={() => handleAsyncAction('success')}>
                Success {counters.success ? `(${counters.success})` : ''}
              </Button>
              <Button variant="danger" onClick={() => handleAsyncAction('danger')}>
                Danger {counters.danger ? `(${counters.danger})` : ''}
              </Button>
              <Button variant="warning" onClick={() => handleAsyncAction('warning')}>
                Warning {counters.warning ? `(${counters.warning})` : ''}
              </Button>
              <Button variant="outline" onClick={() => handleAsyncAction('outline')}>
                Outline {counters.outline ? `(${counters.outline})` : ''}
              </Button>
              <Button variant="ghost" onClick={() => handleAsyncAction('ghost')}>
                Ghost {counters.ghost ? `(${counters.ghost})` : ''}
              </Button>
            </div>
          </section>

          {/* Section 2: Tailles */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Tailles disponibles
            </h2>
            <div className="flex flex-wrap items-end gap-4">
              <Button size="xs">Extra Small</Button>
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
              <Button size="xl">Extra Large</Button>
            </div>
          </section>

          {/* Section 3: États avec chargement */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              États et chargement
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button 
                  loading={loadingStates.save}
                  onClick={() => handleAsyncAction('save')}
                >
                  Sauvegarder {counters.save ? `(${counters.save})` : ''}
                </Button>
                <Button 
                  variant="success"
                  loading={loadingStates.approve}
                  leftIcon={<CheckIcon className="h-4 w-4" />}
                  onClick={() => handleAsyncAction('approve', 3000)}
                >
                  Approuver {counters.approve ? `(${counters.approve})` : ''}
                </Button>
                <Button 
                  variant="danger"
                  loading={loadingStates.delete}
                  leftIcon={<TrashIcon className="h-4 w-4" />}
                  onClick={() => handleAsyncAction('delete', 1500)}
                >
                  Supprimer {counters.delete ? `(${counters.delete})` : ''}
                </Button>
                <Button disabled>
                  Action non disponible
                </Button>
              </div>
            </div>
          </section>

          {/* Section 4: Boutons avec icônes */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Boutons avec icônes
            </h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button 
                  leftIcon={<PlusIcon className="h-4 w-4" />}
                  onClick={() => handleAsyncAction('add')}
                >
                  Ajouter un élément {counters.add ? `(${counters.add})` : ''}
                </Button>
                <Button 
                  variant="secondary"
                  leftIcon={<PencilIcon className="h-4 w-4" />}
                  onClick={() => handleAsyncAction('edit')}
                >
                  Modifier {counters.edit ? `(${counters.edit})` : ''}
                </Button>
                <Button 
                  variant="outline"
                  rightIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                  loading={loadingStates.download}
                  onClick={() => handleAsyncAction('download', 4000)}
                >
                  Télécharger {counters.download ? `(${counters.download})` : ''}
                </Button>
              </div>
            </div>
          </section>

          {/* Section 5: Boutons icône uniquement */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Boutons icône uniquement
            </h2>
            <div className="flex flex-wrap gap-4">
              <Button 
                iconOnly 
                aria-label="Ajouter"
                size="sm"
                onClick={() => handleAsyncAction('iconAdd')}
              >
                <PlusIcon className="h-4 w-4" />
              </Button>
              <Button 
                iconOnly 
                aria-label="Modifier"
                variant="secondary"
                onClick={() => handleAsyncAction('iconEdit')}
              >
                <PencilIcon className="h-4 w-4" />
              </Button>
              <Button 
                iconOnly 
                aria-label="Supprimer"
                variant="danger"
                onClick={() => handleAsyncAction('iconDelete')}
              >
                <TrashIcon className="h-4 w-4" />
              </Button>
              <Button 
                iconOnly 
                aria-label="Paramètres"
                variant="ghost"
                loading={loadingStates.iconSettings}
                onClick={() => handleAsyncAction('iconSettings')}
              >
                <Cog6ToothIcon className="h-4 w-4" />
              </Button>
            </div>
          </section>

          {/* Section 6: Exemples CROU spécifiques */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Exemples spécifiques CROU
            </h2>
            <div className="space-y-6">
              {/* Gestion budgétaire */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Gestion budgétaire
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="primary"
                    leftIcon={<BanknotesIcon className="h-4 w-4" />}
                    loading={loadingStates.budget}
                    onClick={() => handleAsyncAction('budget', 2500)}
                  >
                    Valider le budget {counters.budget ? `(${counters.budget})` : ''}
                  </Button>
                  <Button 
                    variant="success"
                    leftIcon={<CheckIcon className="h-4 w-4" />}
                    onClick={() => handleAsyncAction('approveBudget')}
                  >
                    Approuver la subvention {counters.approveBudget ? `(${counters.approveBudget})` : ''}
                  </Button>
                  <Button 
                    variant="warning"
                    rightIcon={<DocumentTextIcon className="h-4 w-4" />}
                    loading={loadingStates.exportBudget}
                    onClick={() => handleAsyncAction('exportBudget', 3500)}
                  >
                    Exporter en Excel {counters.exportBudget ? `(${counters.exportBudget})` : ''}
                  </Button>
                </div>
              </div>

              {/* Actions de workflow */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                  Workflow d'approbation
                </h3>
                <div className="flex flex-wrap gap-3">
                  <Button 
                    variant="success"
                    leftIcon={<CheckIcon className="h-4 w-4" />}
                    loading={loadingStates.approve2}
                    onClick={() => handleAsyncAction('approve2')}
                  >
                    Approuver la demande {counters.approve2 ? `(${counters.approve2})` : ''}
                  </Button>
                  <Button 
                    variant="danger"
                    leftIcon={<XMarkIcon className="h-4 w-4" />}
                    loading={loadingStates.reject}
                    onClick={() => handleAsyncAction('reject')}
                  >
                    Rejeter {counters.reject ? `(${counters.reject})` : ''}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleAsyncAction('defer')}
                  >
                    Reporter la décision {counters.defer ? `(${counters.defer})` : ''}
                  </Button>
                </div>
              </div>
            </div>
          </section>

          {/* Section 7: Boutons pleine largeur */}
          <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Boutons pleine largeur
            </h2>
            <div className="max-w-md space-y-3">
              <Button 
                fullWidth
                loading={loadingStates.fullSave}
                onClick={() => handleAsyncAction('fullSave')}
              >
                Sauvegarder les modifications {counters.fullSave ? `(${counters.fullSave})` : ''}
              </Button>
              <Button 
                fullWidth 
                variant="secondary"
                onClick={() => handleAsyncAction('fullCancel')}
              >
                Annuler {counters.fullCancel ? `(${counters.fullCancel})` : ''}
              </Button>
              <Button 
                fullWidth 
                variant="outline"
                leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}
                loading={loadingStates.fullExport}
                onClick={() => handleAsyncAction('fullExport', 5000)}
              >
                Exporter le rapport complet {counters.fullExport ? `(${counters.fullExport})` : ''}
              </Button>
            </div>
          </section>

          {/* Section 8: État des compteurs */}
          <section className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Statistiques d'interaction
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {Object.entries(counters).map(([key, count]) => (
                <div key={key} className="bg-white dark:bg-gray-800 p-3 rounded">
                  <div className="font-medium text-gray-900 dark:text-gray-100 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    {count}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ButtonExamples;
