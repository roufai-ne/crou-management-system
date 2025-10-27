/**
 * FICHIER: apps\web\src\components\ui\Tabs.stories.tsx
 * STORYBOOK: Stories pour le composant Tabs
 *
 * DESCRIPTION:
 * Documentation interactive du composant Tabs
 * Exemples d'utilisation et variations pour le design system CROU
 *
 * STORIES:
 * - Tabs basiques avec différentes configurations
 * - Variantes et orientations
 * - Navigation clavier et accessibilité
 * - Exemples d'intégration complexes
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { Tabs, type TabItem } from './Tabs';
import { Card } from './Card';
import { Button } from './Button';
import { KPICard } from './KPICard';

// Configuration Meta
const meta: Meta<typeof Tabs> = {
  title: 'Components/Navigation/Tabs',
  component: Tabs,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Composant d\'onglets avec navigation clavier accessible et support des badges.'
      }
    }
  },
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Orientation des onglets'
    },
    variant: {
      control: 'select',
      options: ['default', 'pills', 'underline', 'cards'],
      description: 'Variante visuelle'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille des onglets'
    },
    lazy: {
      control: 'boolean',
      description: 'Lazy loading du contenu'
    },
    keepMounted: {
      control: 'boolean',
      description: 'Garder le contenu monté'
    },
    disabled: {
      control: 'boolean',
      description: 'Désactiver tous les onglets'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Tabs>;

// Données d'exemple
const sampleTabs: TabItem[] = [
  {
    id: 'overview',
    label: 'Vue d\'ensemble',
    icon: <ChartBarIcon className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Vue d'ensemble du CROU</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <KPICard
            title="Étudiants logés"
            value={1245}
            target={1500}
            format="number"
            trend="up"
            change={5.2}
          />
          <KPICard
            title="Taux d'occupation"
            value={83}
            target={90}
            format="percentage"
            trend="up"
            change={2.1}
          />
          <KPICard
            title="Budget utilisé"
            value={2500000}
            target={3000000}
            format="currency"
            trend="stable"
            change={0.5}
          />
        </div>
      </div>
    )
  },
  {
    id: 'students',
    label: 'Étudiants',
    icon: <UserGroupIcon className="h-4 w-4" />,
    badge: 12,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Gestion des étudiants</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Interface de gestion des étudiants du CROU avec 12 nouvelles demandes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <Card.Header>
              <Card.Title>Nouvelles demandes</Card.Title>
            </Card.Header>
            <Card.Content>
              <p>12 demandes de logement en attente de traitement.</p>
            </Card.Content>
          </Card>
          <Card>
            <Card.Header>
              <Card.Title>Étudiants actifs</Card.Title>
            </Card.Header>
            <Card.Content>
              <p>1 245 étudiants actuellement logés.</p>
            </Card.Content>
          </Card>
        </div>
      </div>
    )
  },
  {
    id: 'settings',
    label: 'Paramètres',
    icon: <CogIcon className="h-4 w-4" />,
    content: (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configuration du système</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium">Notifications automatiques</h4>
              <p className="text-sm text-gray-500">Recevoir des alertes par email</p>
            </div>
            <Button size="sm">Configurer</Button>
          </div>
          <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div>
              <h4 className="font-medium">Synchronisation des données</h4>
              <p className="text-sm text-gray-500">Fréquence de mise à jour</p>
            </div>
            <Button size="sm" variant="outline">Modifier</Button>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'reports',
    label: 'Rapports',
    icon: <DocumentTextIcon className="h-4 w-4" />,
    disabled: true,
    content: (
      <div>
        <h3 className="text-lg font-semibold">Rapports et statistiques</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Cette section est temporairement indisponible.
        </p>
      </div>
    )
  }
];

// Histoire basique
export const Default: Story = {
  args: {
    tabs: sampleTabs,
    defaultTab: 'overview'
  }
};

// Tabs interactifs
export const Interactive: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
      <div className="w-full space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold">Tabs Interactifs</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Onglet actuel: <strong>{activeTab}</strong> - Utilisez les flèches ou cliquez pour naviguer
          </p>
        </div>

        <Tabs
          tabs={sampleTabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </div>
    );
  }
};

// Différentes variantes
export const Variants: Story = {
  render: () => {
    const simpleTabs: TabItem[] = [
      {
        id: 'tab1',
        label: 'Premier onglet',
        content: <div className="p-4">Contenu du premier onglet</div>
      },
      {
        id: 'tab2',
        label: 'Deuxième onglet',
        badge: 3,
        content: <div className="p-4">Contenu du deuxième onglet avec badge</div>
      },
      {
        id: 'tab3',
        label: 'Troisième onglet',
        content: <div className="p-4">Contenu du troisième onglet</div>
      }
    ];

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium mb-4">Variante par défaut</h3>
          <Tabs tabs={simpleTabs} variant="default" defaultTab="tab1" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-4">Variante pills</h3>
          <Tabs tabs={simpleTabs} variant="pills" defaultTab="tab1" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-4">Variante underline</h3>
          <Tabs tabs={simpleTabs} variant="underline" defaultTab="tab1" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-4">Variante cards</h3>
          <Tabs tabs={simpleTabs} variant="cards" defaultTab="tab1" />
        </div>
      </div>
    );
  }
};

// Différentes tailles
export const Sizes: Story = {
  render: () => {
    const simpleTabs: TabItem[] = [
      {
        id: 'tab1',
        label: 'Premier',
        icon: <ChartBarIcon className="h-4 w-4" />,
        content: <div className="p-4">Contenu adapté à la taille</div>
      },
      {
        id: 'tab2',
        label: 'Deuxième',
        icon: <UserGroupIcon className="h-4 w-4" />,
        badge: 5,
        content: <div className="p-4">Contenu avec badge</div>
      }
    ];

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-sm font-medium mb-4">Petite taille</h3>
          <Tabs tabs={simpleTabs} size="sm" defaultTab="tab1" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-4">Taille moyenne (défaut)</h3>
          <Tabs tabs={simpleTabs} size="md" defaultTab="tab1" />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-4">Grande taille</h3>
          <Tabs tabs={simpleTabs} size="lg" defaultTab="tab1" />
        </div>
      </div>
    );
  }
};

// Orientation verticale
export const Vertical: Story = {
  render: () => (
    <div className="h-96">
      <Tabs
        tabs={sampleTabs}
        orientation="vertical"
        defaultTab="overview"
        variant="default"
      />
    </div>
  )
};

// Avec lazy loading
export const LazyLoading: Story = {
  render: () => {
    const [loadCount, setLoadCount] = useState(1);

    const lazyTabs: TabItem[] = [
      {
        id: 'immediate',
        label: 'Chargé immédiatement',
        content: (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded">
            <p>Ce contenu est chargé immédiatement (onglet par défaut)</p>
          </div>
        )
      },
      {
        id: 'lazy1',
        label: 'Lazy Load 1',
        content: (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
            <p>Ce contenu n'est chargé qu'au premier clic (Lazy #{loadCount})</p>
            <Button
              size="sm"
              onClick={() => setLoadCount(c => c + 1)}
              className="mt-2"
            >
              Incrémenter: {loadCount}
            </Button>
          </div>
        )
      },
      {
        id: 'lazy2',
        label: 'Lazy Load 2',
        content: (
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded">
            <p>Contenu lourd simulé - chargé seulement si nécessaire</p>
            <div className="mt-2 space-y-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              ))}
            </div>
          </div>
        )
      }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
          <h3 className="font-semibold">Lazy Loading</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Le contenu des onglets n'est rendu qu'au premier clic
          </p>
        </div>

        <Tabs
          tabs={lazyTabs}
          defaultTab="immediate"
          lazy
          variant="pills"
        />
      </div>
    );
  }
};

// Avec badges et icônes
export const WithBadgesAndIcons: Story = {
  render: () => {
    const statusTabs: TabItem[] = [
      {
        id: 'active',
        label: 'Actifs',
        icon: <CheckCircleIcon className="h-4 w-4" />,
        badge: 24,
        content: (
          <div className="p-4">
            <h4 className="font-semibold text-green-700 dark:text-green-400">
              Éléments actifs (24)
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Liste des éléments actuellement actifs dans le système.
            </p>
          </div>
        )
      },
      {
        id: 'pending',
        label: 'En attente',
        icon: <ClockIcon className="h-4 w-4" />,
        badge: 7,
        content: (
          <div className="p-4">
            <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">
              En attente de validation (7)
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Éléments nécessitant une validation manuelle.
            </p>
          </div>
        )
      },
      {
        id: 'warnings',
        label: 'Avertissements',
        icon: <ExclamationTriangleIcon className="h-4 w-4" />,
        badge: '3!',
        content: (
          <div className="p-4">
            <h4 className="font-semibold text-orange-700 dark:text-orange-400">
              Avertissements critiques (3)
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Problèmes nécessitant une attention immédiate.
            </p>
          </div>
        )
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: <BellIcon className="h-4 w-4" />,
        badge: 99,
        content: (
          <div className="p-4">
            <h4 className="font-semibold">Notifications (99+)</h4>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Toutes vos notifications récentes.
            </p>
          </div>
        )
      }
    ];

    return (
      <Tabs
        tabs={statusTabs}
        defaultTab="active"
        variant="default"
      />
    );
  }
};

// Navigation clavier démontrée
export const KeyboardNavigation: Story = {
  render: () => {
    const keyboardTabs: TabItem[] = [
      {
        id: 'instructions',
        label: 'Instructions',
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Navigation clavier</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Raccourcis disponibles:</h4>
              <ul className="space-y-1 text-sm">
                <li><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">→</kbd> ou <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">↓</kbd> : Onglet suivant</li>
                <li><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">←</kbd> ou <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">↑</kbd> : Onglet précédent</li>
                <li><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Home</kbd> : Premier onglet</li>
                <li><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">End</kbd> : Dernier onglet</li>
                <li><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Tab</kbd> : Focus sur le contenu</li>
              </ul>
            </div>
          </div>
        )
      },
      {
        id: 'demo1',
        label: 'Démo 1',
        content: (
          <div className="p-4">
            <p>Contenu du premier onglet de démonstration</p>
          </div>
        )
      },
      {
        id: 'demo2',
        label: 'Démo 2',
        content: (
          <div className="p-4">
            <p>Contenu du deuxième onglet de démonstration</p>
          </div>
        )
      },
      {
        id: 'demo3',
        label: 'Démo 3',
        disabled: true,
        content: (
          <div className="p-4">
            <p>Cet onglet est désactivé</p>
          </div>
        )
      },
      {
        id: 'demo4',
        label: 'Démo 4',
        content: (
          <div className="p-4">
            <p>Dernier onglet - utilisez les raccourcis pour naviguer</p>
          </div>
        )
      }
    ];

    return (
      <Tabs
        tabs={keyboardTabs}
        defaultTab="instructions"
        aria-label="Démonstration de navigation clavier"
      />
    );
  }
};

// Exemple CROU Dashboard
export const CROUDashboard: Story = {
  render: () => {
    const dashboardTabs: TabItem[] = [
      {
        id: 'dashboard',
        label: 'Tableau de bord',
        icon: <ChartBarIcon className="h-4 w-4" />,
        content: (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard
                title="Étudiants logés"
                value={1245}
                target={1500}
                format="number"
                trend="up"
                change={5.2}
              />
              <KPICard
                title="Budget mensuel"
                value={2500000}
                target={3000000}
                format="currency"
                trend="stable"
                change={0.5}
              />
              <KPICard
                title="Occupation"
                value={83}
                target={90}
                format="percentage"
                trend="up"
                change={2.1}
              />
            </div>
          </div>
        )
      },
      {
        id: 'housing',
        label: 'Logement',
        icon: <UserGroupIcon className="h-4 w-4" />,
        badge: 12,
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gestion du logement</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <Card.Header>
                  <Card.Title>Nouvelles demandes</Card.Title>
                </Card.Header>
                <Card.Content>
                  <p className="text-2xl font-bold text-blue-600">12</p>
                  <p className="text-sm text-gray-500">En attente de traitement</p>
                </Card.Content>
              </Card>
              <Card>
                <Card.Header>
                  <Card.Title>Chambres disponibles</Card.Title>
                </Card.Header>
                <Card.Content>
                  <p className="text-2xl font-bold text-green-600">45</p>
                  <p className="text-sm text-gray-500">Prêtes à l'attribution</p>
                </Card.Content>
              </Card>
            </div>
          </div>
        )
      },
      {
        id: 'finance',
        label: 'Finances',
        icon: <DocumentTextIcon className="h-4 w-4" />,
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Situation financière</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p>Module financier avec suivi budgétaire détaillé</p>
            </div>
          </div>
        )
      },
      {
        id: 'alerts',
        label: 'Alertes',
        icon: <ExclamationTriangleIcon className="h-4 w-4" />,
        badge: 3,
        content: (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Alertes système</h3>
            <div className="space-y-2">
              {[
                'Stock céréales faible - Réapprovisionnement requis',
                'Maintenance ascenseur bloc B prévue demain',
                'Rapport mensuel à soumettre avant le 30'
              ].map((alert, i) => (
                <div key={i} className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded border-l-4 border-yellow-400">
                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <span className="text-sm">{alert}</span>
                </div>
              ))}
            </div>
          </div>
        )
      }
    ];

    return (
      <div className="w-full max-w-6xl">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">CROU Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Interface de gestion complète pour les Centres Régionaux des Œuvres Universitaires
          </p>
        </div>

        <Tabs
          tabs={dashboardTabs}
          defaultTab="dashboard"
          variant="default"
          aria-label="Navigation dashboard CROU"
        />
      </div>
    );
  }
};

// Export des stories
export {
  Default,
  Interactive,
  Variants,
  Sizes,
  Vertical,
  LazyLoading,
  WithBadgesAndIcons,
  KeyboardNavigation,
  CROUDashboard
};
