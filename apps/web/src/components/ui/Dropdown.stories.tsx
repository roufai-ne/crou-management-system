/**
 * FICHIER: apps\web\src\components\ui\Dropdown.stories.tsx
 * STORYBOOK: Stories pour le composant Dropdown
 *
 * DESCRIPTION:
 * Documentation interactive du composant Dropdown
 * Exemples d'utilisation et variations pour le design system CROU
 *
 * STORIES:
 * - Dropdown basique avec différentes configurations
 * - Variantes et placements
 * - Navigation clavier et accessibilité
 * - Exemples d'intégration avec différents triggers
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import {
  PencilIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  ShareIcon,
  EyeIcon,
  ArchiveBoxIcon,
  UserPlusIcon,
  CogIcon,
  BellIcon,
  QuestionMarkCircleIcon,
  PowerIcon,
  ChevronDownIcon,
  EllipsisVerticalIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { Dropdown, useDropdownItems, type DropdownItem } from './Dropdown';
import { Button } from './Button';
import { Badge } from './Badge';

// Configuration Meta
const meta: Meta<typeof Dropdown> = {
  title: 'Components/Navigation/Dropdown',
  component: Dropdown,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant dropdown avec support des icônes, raccourcis et navigation clavier accessible.'
      }
    }
  },
  argTypes: {
    placement: {
      control: 'select',
      options: ['bottom-start', 'bottom-end', 'top-start', 'top-end', 'left', 'right'],
      description: 'Position du menu par rapport au trigger'
    },
    variant: {
      control: 'select',
      options: ['default', 'minimal', 'card'],
      description: 'Variante visuelle'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille des éléments'
    },
    closeOnSelect: {
      control: 'boolean',
      description: 'Fermer au clic sur un élément'
    },
    disabled: {
      control: 'boolean',
      description: 'Désactiver le dropdown'
    },
    offset: {
      control: { type: 'number', min: 0, max: 20 },
      description: 'Décalage par rapport au trigger'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Dropdown>;

// Données d'exemple
const basicItems: DropdownItem[] = [
  {
    type: 'item',
    label: 'Voir',
    icon: <EyeIcon className="h-4 w-4" />,
    shortcut: 'Ctrl+V',
    onSelect: () => console.log('Voir sélectionné')
  },
  {
    type: 'item',
    label: 'Modifier',
    icon: <PencilIcon className="h-4 w-4" />,
    shortcut: 'Ctrl+E',
    onSelect: () => console.log('Modifier sélectionné')
  },
  {
    type: 'item',
    label: 'Dupliquer',
    icon: <DocumentDuplicateIcon className="h-4 w-4" />,
    onSelect: () => console.log('Dupliquer sélectionné')
  },
  { type: 'separator' },
  {
    type: 'item',
    label: 'Partager',
    icon: <ShareIcon className="h-4 w-4" />,
    description: 'Partager avec d\'autres utilisateurs',
    onSelect: () => console.log('Partager sélectionné')
  },
  {
    type: 'item',
    label: 'Archiver',
    icon: <ArchiveBoxIcon className="h-4 w-4" />,
    onSelect: () => console.log('Archiver sélectionné')
  },
  { type: 'separator' },
  {
    type: 'item',
    label: 'Supprimer',
    icon: <TrashIcon className="h-4 w-4" />,
    variant: 'destructive',
    shortcut: 'Suppr',
    onSelect: () => console.log('Supprimer sélectionné')
  }
];

// Histoire basique
export const Default: Story = {
  args: {
    trigger: (
      <Button variant="outline">
        Actions
        <ChevronDownIcon className="h-4 w-4" />
      </Button>
    ),
    items: basicItems
  }
};

// Dropdown simple
export const Simple: Story = {
  render: () => {
    const simpleItems: DropdownItem[] = [
      {
        type: 'item',
        label: 'Option 1',
        onSelect: () => console.log('Option 1')
      },
      {
        type: 'item',
        label: 'Option 2',
        onSelect: () => console.log('Option 2')
      },
      {
        type: 'item',
        label: 'Option 3',
        disabled: true,
        onSelect: () => console.log('Option 3')
      }
    ];

    return (
      <Dropdown
        trigger={<Button>Simple Menu</Button>}
        items={simpleItems}
      />
    );
  }
};

// Différents triggers
export const DifferentTriggers: Story = {
  render: () => {
    const { createItem, createSeparator } = useDropdownItems();

    const items = [
      createItem('Nouveau', { icon: <PlusIcon className="h-4 w-4" /> }),
      createItem('Importer', { icon: <DocumentDuplicateIcon className="h-4 w-4" /> }),
      createSeparator(),
      createItem('Paramètres', { icon: <CogIcon className="h-4 w-4" /> })
    ];

    return (
      <div className="flex flex-wrap items-center gap-4">
        {/* Bouton standard */}
        <Dropdown
          trigger={
            <Button variant="primary">
              Actions
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          }
          items={items}
        />

        {/* Bouton icon-only */}
        <Dropdown
          trigger={
            <Button variant="outline" iconOnly aria-label="Plus d'actions">
              <EllipsisVerticalIcon className="h-4 w-4" />
            </Button>
          }
          items={items}
          placement="bottom-end"
        />

        {/* Badge clickable */}
        <Dropdown
          trigger={
            <div className="cursor-pointer">
              <Badge variant="primary">Menu Badge</Badge>
            </div>
          }
          items={items}
        />

        {/* Texte simple */}
        <Dropdown
          trigger={
            <span className="cursor-pointer text-blue-600 hover:text-blue-800 underline">
              Menu Texte
            </span>
          }
          items={items}
        />
      </div>
    );
  }
};

// Différentes variantes
export const Variants: Story = {
  render: () => {
    const items = basicItems.slice(0, 4); // Réduire pour la demo

    return (
      <div className="flex flex-wrap items-center gap-8">
        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Default</h4>
          <Dropdown
            trigger={<Button variant="outline">Default</Button>}
            items={items}
            variant="default"
          />
        </div>

        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Minimal</h4>
          <Dropdown
            trigger={<Button variant="outline">Minimal</Button>}
            items={items}
            variant="minimal"
          />
        </div>

        <div className="text-center">
          <h4 className="text-sm font-medium mb-2">Card</h4>
          <Dropdown
            trigger={<Button variant="outline">Card</Button>}
            items={items}
            variant="card"
          />
        </div>
      </div>
    );
  }
};

// Différents placements
export const Placements: Story = {
  render: () => {
    const items = [
      {
        type: 'item' as const,
        label: 'Option 1',
        onSelect: () => {}
      },
      {
        type: 'item' as const,
        label: 'Option 2',
        onSelect: () => {}
      },
      {
        type: 'item' as const,
        label: 'Option 3',
        onSelect: () => {}
      }
    ];

    const placements = [
      { placement: 'bottom-start' as const, label: 'Bottom Start' },
      { placement: 'bottom-end' as const, label: 'Bottom End' },
      { placement: 'top-start' as const, label: 'Top Start' },
      { placement: 'top-end' as const, label: 'Top End' },
      { placement: 'left' as const, label: 'Left' },
      { placement: 'right' as const, label: 'Right' }
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-8 p-8">
        {placements.map(({ placement, label }) => (
          <div key={placement} className="text-center">
            <h4 className="text-sm font-medium mb-2">{label}</h4>
            <Dropdown
              trigger={<Button variant="outline">{label}</Button>}
              items={items}
              placement={placement}
            />
          </div>
        ))}
      </div>
    );
  }
};

// Avec groupes et séparateurs
export const WithGroups: Story = {
  render: () => {
    const groupedItems: DropdownItem[] = [
      {
        type: 'group',
        label: 'Actions rapides',
        items: [
          {
            type: 'item',
            label: 'Nouveau document',
            icon: <PlusIcon className="h-4 w-4" />,
            shortcut: 'Ctrl+N',
            onSelect: () => console.log('Nouveau document')
          },
          {
            type: 'item',
            label: 'Ouvrir',
            icon: <EyeIcon className="h-4 w-4" />,
            shortcut: 'Ctrl+O',
            onSelect: () => console.log('Ouvrir')
          }
        ]
      },
      { type: 'separator' },
      {
        type: 'group',
        label: 'Gestion',
        items: [
          {
            type: 'item',
            label: 'Utilisateurs',
            icon: <UserPlusIcon className="h-4 w-4" />,
            description: 'Gérer les utilisateurs du système',
            onSelect: () => console.log('Utilisateurs')
          },
          {
            type: 'item',
            label: 'Configuration',
            icon: <CogIcon className="h-4 w-4" />,
            description: 'Paramètres du système',
            onSelect: () => console.log('Configuration')
          }
        ]
      },
      { type: 'separator' },
      {
        type: 'item',
        label: 'Aide',
        icon: <QuestionMarkCircleIcon className="h-4 w-4" />,
        onSelect: () => console.log('Aide')
      },
      {
        type: 'item',
        label: 'Déconnexion',
        icon: <PowerIcon className="h-4 w-4" />,
        variant: 'destructive',
        onSelect: () => console.log('Déconnexion')
      }
    ];

    return (
      <Dropdown
        trigger={
          <Button variant="outline">
            Menu complet
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        }
        items={groupedItems}
        size="md"
      />
    );
  }
};

// Dropdown contrôlé
export const Controlled: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);

    const items: DropdownItem[] = [
      {
        type: 'item',
        label: 'Option A',
        onSelect: () => setSelectedOption('Option A')
      },
      {
        type: 'item',
        label: 'Option B',
        onSelect: () => setSelectedOption('Option B')
      },
      {
        type: 'item',
        label: 'Option C',
        onSelect: () => setSelectedOption('Option C')
      }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <h3 className="font-semibold">Dropdown Contrôlé</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            État: {isOpen ? 'Ouvert' : 'Fermé'} |
            Sélection: {selectedOption || 'Aucune'}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Dropdown
            trigger={
              <Button variant="outline">
                Dropdown contrôlé
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            }
            items={items}
            open={isOpen}
            onOpenChange={setIsOpen}
          />

          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
          >
            Toggle depuis l'extérieur
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedOption(null)}
          >
            Reset sélection
          </Button>
        </div>
      </div>
    );
  }
};

// Navigation clavier
export const KeyboardNavigation: Story = {
  render: () => {
    const keyboardItems: DropdownItem[] = [
      {
        type: 'item',
        label: 'Premier élément',
        shortcut: '1',
        onSelect: () => console.log('Premier')
      },
      {
        type: 'item',
        label: 'Deuxième élément',
        shortcut: '2',
        onSelect: () => console.log('Deuxième')
      },
      {
        type: 'item',
        label: 'Élément désactivé',
        disabled: true,
        onSelect: () => console.log('Désactivé')
      },
      { type: 'separator' },
      {
        type: 'item',
        label: 'Dernier élément',
        shortcut: '3',
        onSelect: () => console.log('Dernier')
      }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <h3 className="font-semibold">Navigation Clavier</h3>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 space-y-1">
            <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">↑↓</kbd> Naviguer entre les éléments</div>
            <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Entrée</kbd> ou <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Espace</kbd> Sélectionner</div>
            <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Échap</kbd> Fermer le menu</div>
            <div><kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Tab</kbd> Fermer et passer au suivant</div>
          </div>
        </div>

        <Dropdown
          trigger={
            <Button variant="outline">
              Test Navigation
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          }
          items={keyboardItems}
          aria-label="Menu de démonstration navigation clavier"
        />
      </div>
    );
  }
};

// Exemple CROU User Menu
export const CROUUserMenu: Story = {
  render: () => {
    const userMenuItems: DropdownItem[] = [
      {
        type: 'group',
        label: 'Mon compte',
        items: [
          {
            type: 'item',
            label: 'Profil utilisateur',
            icon: <UserPlusIcon className="h-4 w-4" />,
            description: 'Modifier mes informations',
            onSelect: () => console.log('Profil')
          },
          {
            type: 'item',
            label: 'Notifications',
            icon: <BellIcon className="h-4 w-4" />,
            description: '3 nouvelles notifications',
            onSelect: () => console.log('Notifications')
          }
        ]
      },
      { type: 'separator' },
      {
        type: 'group',
        label: 'Système',
        items: [
          {
            type: 'item',
            label: 'Paramètres CROU',
            icon: <CogIcon className="h-4 w-4" />,
            description: 'Configuration du centre',
            onSelect: () => console.log('Paramètres')
          },
          {
            type: 'item',
            label: 'Centre d\'aide',
            icon: <QuestionMarkCircleIcon className="h-4 w-4" />,
            shortcut: 'F1',
            onSelect: () => console.log('Aide')
          }
        ]
      },
      { type: 'separator' },
      {
        type: 'item',
        label: 'Se déconnecter',
        icon: <PowerIcon className="h-4 w-4" />,
        variant: 'destructive',
        shortcut: 'Ctrl+Q',
        onSelect: () => console.log('Déconnexion')
      }
    ];

    return (
      <div className="space-y-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h3 className="font-semibold">Menu Utilisateur CROU</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Menu typique d'un utilisateur connecté dans l'interface CROU
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
              JD
            </div>
            <span className="font-medium">Jean Dupont</span>
            <span className="text-gray-500">- Directeur CROU Niamey</span>
          </div>

          <Dropdown
            trigger={
              <Button variant="ghost" iconOnly aria-label="Menu utilisateur">
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            }
            items={userMenuItems}
            placement="bottom-end"
            variant="card"
          />
        </div>
      </div>
    );
  }
};

// Dropdown avec état de chargement
export const WithLoading: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);

    const loadingItems: DropdownItem[] = [
      {
        type: 'item',
        label: loading ? 'Sauvegarde...' : 'Sauvegarder',
        icon: loading ? (
          <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
        ) : (
          <DocumentDuplicateIcon className="h-4 w-4" />
        ),
        disabled: loading,
        onSelect: () => {
          setLoading(true);
          setTimeout(() => setLoading(false), 2000);
        }
      },
      {
        type: 'item',
        label: 'Annuler',
        disabled: !loading,
        onSelect: () => setLoading(false)
      }
    ];

    return (
      <Dropdown
        trigger={
          <Button variant="outline" disabled={loading}>
            Actions
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        }
        items={loadingItems}
      />
    );
  }
};

// Export des stories
export {
  Default,
  Simple,
  DifferentTriggers,
  Variants,
  Placements,
  WithGroups,
  Controlled,
  KeyboardNavigation,
  CROUUserMenu,
  WithLoading
};
