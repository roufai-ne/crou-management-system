/**
 * FICHIER: apps\web\src\components\ui\Button.stories.tsx
 * STORYBOOK: Stories pour le composant Button
 * 
 * DESCRIPTION:
 * Documentation interactive du composant Button avec Storybook
 * Présente toutes les variantes, tailles et états possibles
 * Exemples d'usage et bonnes pratiques
 * 
 * STORIES:
 * - Default: Bouton par défaut
 * - Variants: Toutes les variantes
 * - Sizes: Toutes les tailles
 * - States: États (loading, disabled)
 * - WithIcons: Avec icônes
 * - IconOnly: Boutons icône uniquement
 * - FullWidth: Pleine largeur
 * - Playground: Terrain de jeu interactif
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { 
  PlusIcon, 
  TrashIcon, 
  PencilIcon, 
  CheckIcon, 
  XMarkIcon,
  ArrowDownTrayIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { Button } from './Button';

// Configuration Meta pour Storybook
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Le composant Button est un élément fondamental du système de design CROU. 
Il supporte plusieurs variantes, tailles et états pour couvrir tous les cas d'usage 
de l'application.

## Fonctionnalités

- **7 variantes** : primary, secondary, success, danger, warning, outline, ghost
- **5 tailles** : xs, sm, md, lg, xl
- **États avancés** : loading, disabled, iconOnly, fullWidth
- **Support des icônes** : leftIcon, rightIcon
- **Accessibilité complète** : ARIA, focus, keyboard navigation
- **Thème adaptatif** : Support thème clair/sombre

## Bonnes pratiques

- Utilisez \`primary\` pour l'action principale d'une page
- Utilisez \`secondary\` pour les actions secondaires
- Utilisez \`danger\` pour les actions destructives
- Toujours fournir \`aria-label\` pour les boutons \`iconOnly\`
- Utilisez l'état \`loading\` pendant les opérations asynchrones
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'danger', 'warning', 'outline', 'ghost'],
      description: 'Variante visuelle du bouton'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: 'Taille du bouton'
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement avec spinner'
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé'
    },
    fullWidth: {
      control: 'boolean',
      description: 'Bouton pleine largeur'
    },
    iconOnly: {
      control: 'boolean',
      description: 'Bouton avec icône uniquement'
    },
    children: {
      control: 'text',
      description: 'Contenu textuel du bouton'
    },
    onClick: {
      action: 'clicked',
      description: 'Fonction appelée au clic'
    }
  },
  args: {
    onClick: action('button-click')
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

// Story par défaut
export const Default: Story = {
  args: {
    children: 'Bouton par défaut'
  }
};

// Toutes les variantes
export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="warning">Warning</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toutes les variantes disponibles du composant Button.'
      }
    }
  }
};

// Toutes les tailles
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-4">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Toutes les tailles disponibles, de xs à xl.'
      }
    }
  }
};

// États du bouton
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Button>Normal</Button>
      <Button loading>Chargement</Button>
      <Button disabled>Désactivé</Button>
      <Button loading disabled>Chargement + Désactivé</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Différents états du bouton : normal, loading, disabled.'
      }
    }
  }
};

// Boutons avec icônes
export const WithIcons: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Button leftIcon={<PlusIcon className="h-4 w-4" />}>
          Ajouter
        </Button>
        <Button variant="danger" leftIcon={<TrashIcon className="h-4 w-4" />}>
          Supprimer
        </Button>
        <Button variant="secondary" rightIcon={<ArrowDownTrayIcon className="h-4 w-4" />}>
          Télécharger
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <Button 
          variant="outline" 
          leftIcon={<PencilIcon className="h-4 w-4" />}
          rightIcon={<CheckIcon className="h-4 w-4" />}
        >
          Modifier et Valider
        </Button>
        <Button 
          variant="success" 
          leftIcon={<CheckIcon className="h-4 w-4" />}
          loading
        >
          Validation en cours
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Boutons avec icônes à gauche, à droite, ou des deux côtés. Les icônes sont remplacées par le spinner pendant le chargement.'
      }
    }
  }
};

// Boutons icône uniquement
export const IconOnly: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <Button iconOnly aria-label="Ajouter" size="xs">
          <PlusIcon className="h-3 w-3" />
        </Button>
        <Button iconOnly aria-label="Modifier" size="sm">
          <PencilIcon className="h-4 w-4" />
        </Button>
        <Button iconOnly aria-label="Paramètres" size="md">
          <Cog6ToothIcon className="h-5 w-5" />
        </Button>
        <Button iconOnly aria-label="Supprimer" variant="danger" size="lg">
          <TrashIcon className="h-5 w-5" />
        </Button>
        <Button iconOnly aria-label="Fermer" variant="ghost" size="xl">
          <XMarkIcon className="h-6 w-6" />
        </Button>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <Button iconOnly aria-label="Chargement" loading>
          <Cog6ToothIcon className="h-5 w-5" />
        </Button>
        <Button iconOnly aria-label="Désactivé" disabled>
          <TrashIcon className="h-5 w-5" />
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Boutons avec icône uniquement. Notez l\'importance de l\'attribut `aria-label` pour l\'accessibilité.'
      }
    }
  }
};

// Boutons pleine largeur
export const FullWidth: Story = {
  render: () => (
    <div className="w-96 space-y-4">
      <Button fullWidth>Bouton pleine largeur</Button>
      <Button fullWidth variant="secondary">Secondaire pleine largeur</Button>
      <Button fullWidth variant="outline" leftIcon={<PlusIcon className="h-4 w-4" />}>
        Avec icône pleine largeur
      </Button>
      <Button fullWidth loading>Chargement pleine largeur</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Boutons qui prennent toute la largeur de leur conteneur.'
      }
    }
  }
};

// Exemples d'usage CROU
export const CROUExamples: Story = {
  render: () => (
    <div className="space-y-6">
      {/* Actions principales */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Actions principales</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary">Valider le budget</Button>
          <Button variant="success" leftIcon={<CheckIcon className="h-4 w-4" />}>
            Approuver la demande
          </Button>
          <Button variant="danger" leftIcon={<XMarkIcon className="h-4 w-4" />}>
            Rejeter
          </Button>
        </div>
      </div>

      {/* Actions secondaires */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Actions secondaires</h3>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary">Modifier</Button>
          <Button variant="outline">Annuler</Button>
          <Button variant="ghost">Voir les détails</Button>
        </div>
      </div>

      {/* Actions avec états */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Actions avec états</h3>
        <div className="flex flex-wrap gap-3">
          <Button loading>Sauvegarde en cours...</Button>
          <Button variant="secondary" disabled>Action non disponible</Button>
          <Button variant="warning" leftIcon={<ArrowDownTrayIcon className="h-4 w-4" />}>
            Exporter en Excel
          </Button>
        </div>
      </div>

      {/* Actions rapides */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Actions rapides</h3>
        <div className="flex flex-wrap gap-3">
          <Button iconOnly aria-label="Ajouter un élément" size="sm">
            <PlusIcon className="h-4 w-4" />
          </Button>
          <Button iconOnly aria-label="Modifier" variant="secondary" size="sm">
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button iconOnly aria-label="Supprimer" variant="danger" size="sm">
            <TrashIcon className="h-4 w-4" />
          </Button>
          <Button iconOnly aria-label="Paramètres" variant="ghost" size="sm">
            <Cog6ToothIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Exemples d\'usage typiques dans l\'application CROU avec les bonnes pratiques.'
      }
    }
  }
};

// Terrain de jeu interactif
export const Playground: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: 'Bouton interactif',
    loading: false,
    disabled: false,
    fullWidth: false,
    iconOnly: false
  },
  parameters: {
    docs: {
      description: {
        story: 'Terrain de jeu pour tester toutes les combinaisons de props du composant Button.'
      }
    }
  }
};

// Tests visuels pour la régression
export const VisualTests: Story = {
  render: () => (
    <div className="space-y-8">
      {/* Test de toutes les combinaisons variante/taille */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Matrice Variantes × Tailles</h3>
        <div className="grid grid-cols-8 gap-2 text-xs">
          <div></div>
          <div className="font-semibold">XS</div>
          <div className="font-semibold">SM</div>
          <div className="font-semibold">MD</div>
          <div className="font-semibold">LG</div>
          <div className="font-semibold">XL</div>
          <div className="font-semibold">Icon</div>
          <div className="font-semibold">Full</div>
          
          {(['primary', 'secondary', 'success', 'danger', 'warning', 'outline', 'ghost'] as const).map((variant) => (
            <React.Fragment key={variant}>
              <div className="font-semibold capitalize">{variant}</div>
              <Button variant={variant} size="xs">XS</Button>
              <Button variant={variant} size="sm">SM</Button>
              <Button variant={variant} size="md">MD</Button>
              <Button variant={variant} size="lg">LG</Button>
              <Button variant={variant} size="xl">XL</Button>
              <Button variant={variant} iconOnly aria-label={`${variant} icon`}>
                <PlusIcon className="h-4 w-4" />
              </Button>
              <Button variant={variant} fullWidth size="sm">Full</Button>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Test des états */}
      <div>
        <h3 className="text-lg font-semibold mb-4">États</h3>
        <div className="grid grid-cols-4 gap-4">
          <Button>Normal</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button loading disabled>Both</Button>
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Tests visuels complets pour détecter les régressions de style.'
      }
    }
  }
};
