/**
 * FICHIER: apps/web/src/pages/examples/UIShowcase.tsx
 * PAGE: UIShowcase - Démonstration des améliorations UI Phase 1
 *
 * DESCRIPTION:
 * Page de démonstration des nouveaux composants et styles
 * Permet de tester visuellement les améliorations TailAdmin
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { Badge, NewBadge, SuccessBadge, WarningBadge, DangerBadge, Button } from '@/components/ui';

export const UIShowcase: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            UI Showcase - Phase 1
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Démonstration des améliorations UI/UX inspirées de TailAdmin
          </p>
        </div>

        {/* Section: Couleur Primaire */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            1. Couleur Primaire Vibrante
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
              <div key={shade} className="space-y-2">
                <div
                  className={`h-20 rounded-xl bg-primary-${shade} flex items-center justify-center`}
                >
                  <span className={shade >= 500 ? 'text-white' : 'text-gray-900'}>
                    {shade}
                  </span>
                </div>
                <p className="text-xs text-center text-gray-600">primary-{shade}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4">
            <Button variant="primary">Bouton Primary</Button>
            <Button variant="outline">Bouton Outline</Button>
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
              Lien Primary
            </a>
          </div>
        </section>

        {/* Section: Cards avec Hover */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            2. Cards Modernisées (Hover pour voir l'effet)
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Card Standard
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Hover pour voir: border primary-200 + lift effect ↑
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Rounded XL
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Border-radius: 12px (plus arrondi qu'avant)
              </p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Transition Fluide
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                cubic-bezier(0.4, 0, 0.2, 1) sur 300ms
              </p>
            </div>
          </div>
        </section>

        {/* Section: Badges Modernes */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            3. Badges Modernes (TailAdmin Style)
          </h2>

          {/* Variantes */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variantes Standard
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="new">Nouveau</Badge>
                <Badge variant="success">Succès</Badge>
                <Badge variant="warning">Avertissement</Badge>
                <Badge variant="danger">Danger</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="default">Défaut</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Avec Dot Indicator
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="new" dot>Nouveau</Badge>
                <Badge variant="success" dot>Actif</Badge>
                <Badge variant="warning" dot>En attente</Badge>
                <Badge variant="danger" dot>Désactivé</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tailles
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="info" size="xs">Extra petit</Badge>
                <Badge variant="info" size="sm">Petit</Badge>
                <Badge variant="info" size="md">Moyen</Badge>
                <Badge variant="info" size="lg">Grand</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Variantes Spécialisées
              </h3>
              <div className="flex flex-wrap gap-2">
                <NewBadge>Nouvelle fonctionnalité</NewBadge>
                <SuccessBadge>Opération réussie</SuccessBadge>
                <WarningBadge>Action requise</WarningBadge>
                <DangerBadge>Erreur critique</DangerBadge>
              </div>
            </div>
          </div>

          {/* Exemples d'utilisation */}
          <div className="card bg-gradient-to-br from-primary-50 to-white dark:from-gray-800 dark:to-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Budget Mensuel
              </h3>
              <NewBadge>Nouveau</NewBadge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                <Badge variant="success" dot>Approuvé</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 dark:text-gray-400">Validation:</span>
                <Badge variant="warning" dot size="sm">En attente</Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Spacing */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            4. Spacing Généreux
          </h2>
          <div className="card">
            <p className="text-gray-600 dark:text-gray-400">
              Cette page utilise le nouveau système de spacing:
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Padding responsive: <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">p-6 sm:p-8 lg:p-12</code></li>
              <li>• Max-width container: <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">max-w-7xl mx-auto</code></li>
              <li>• Spacing vertical: <code className="px-1 bg-gray-100 dark:bg-gray-800 rounded">space-y-12</code> entre sections</li>
            </ul>
          </div>
        </section>

        {/* Section: Comparaison */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
            5. Avant/Après
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Avant */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Avant
              </h3>
              <div className="border border-gray-200 rounded-lg p-4 bg-white dark:bg-gray-900">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Budget</h4>
                  <span className="px-2 py-0.5 text-xs bg-green-100 text-green-800 border border-green-200 rounded-md">
                    Actif
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Card avec border grise uniforme, shadow modérée
                </p>
              </div>
            </div>

            {/* Après */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                Après (Hover!)
              </h3>
              <div className="card">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">Budget</h4>
                  <Badge variant="success" dot>Actif</Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Card avec hover effect: border primary-200 + lift + ring border sur badge
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="card bg-gradient-to-r from-primary-50 to-success-50 dark:from-gray-800 dark:to-gray-900">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Phase 1 Complétée! 🎉
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Toutes les améliorations UI/UX ont été appliquées avec succès
              </p>
            </div>
            <NewBadge>Phase 1</NewBadge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UIShowcase;
