/**
 * FICHIER: apps\web\src\components\ui\Alert.stories.tsx
 * STORYBOOK: Stories pour le composant Alert
 * 
 * DESCRIPTION:
 * Documentation interactive du composant Alert
 * Exemples d'utilisation et variations
 * Tests visuels et accessibilité
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { Alert } from './Alert';
import { Button } from './Button';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const meta: Meta<typeof Alert> = {
  title: 'Components/Feedback/Alert',
  component: Alert,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Composant d\'alerte pour afficher des messages importants avec différents niveaux de sévérité.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'danger'],
      description: 'Type d\'alerte'
    },
    style: {
      control: 'select',
      options: ['filled', 'outlined', 'minimal'],
      description: 'Style visuel de l\'alerte'
    },
    dismissible: {
      control: 'boolean',
      description: 'L\'alerte peut être fermée'
    },
    hideIcon: {
      control: 'boolean',
      description: 'Masquer l\'icône'
    }
  },
  tags: ['autodocs']
};

export default meta;
type Story = StoryObj<typeof Alert>;

// Histoire de base
export const Default: Story = {
  args: {
    title: 'Information',
    children: 'Ceci est une alerte d\'information par défaut.'
  }
};

// Variantes par type
export const Info: Story = {
  args: {
    variant: 'info',
    title: 'Information',
    children: 'Voici une information importante à retenir.'
  }
};

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Succès',
    children: 'L\'opération a été réalisée avec succès !'
  }
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Attention',
    children: 'Cette action nécessite votre attention.'
  }
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    title: 'Erreur',
    children: 'Une erreur critique est survenue.'
  }
};

// Styles visuels
export const Filled: Story = {
  args: {
    variant: 'success',
    style: 'filled',
    title: 'Style rempli',
    children: 'Alerte avec fond coloré complet.'
  }
};

export const Outlined: Story = {
  args: {
    variant: 'warning',
    style: 'outlined',
    title: 'Style contour',
    children: 'Alerte avec bordure colorée uniquement.'
  }
};

export const Minimal: Story = {
  args: {
    variant: 'info',
    style: 'minimal',
    title: 'Style minimal',
    children: 'Alerte avec bordure gauche colorée.'
  }
};

// Avec actions
export const WithActions: Story = {
  args: {
    variant: 'warning',
    title: 'Confirmation requise',
    children: 'Cette action est irréversible. Êtes-vous sûr de vouloir continuer ?',
    actions: (
      <div className="flex gap-2">
        <Button variant="warning" size="sm">
          Confirmer
        </Button>
        <Button variant="outline" size="sm">
          Annuler
        </Button>
      </div>
    )
  }
};

// Dismissible
export const Dismissible: Story = {
  args: {
    variant: 'info',
    title: 'Alerte fermable',
    children: 'Cette alerte peut être fermée en cliquant sur le bouton X.',
    dismissible: true
  }
};

// Sans icône
export const WithoutIcon: Story = {
  args: {
    variant: 'success',
    title: 'Sans icône',
    children: 'Cette alerte n\'affiche pas d\'icône.',
    hideIcon: true
  }
};

// Icône personnalisée
export const CustomIcon: Story = {
  args: {
    variant: 'warning',
    title: 'Icône personnalisée',
    children: 'Cette alerte utilise une icône personnalisée.',
    icon: ExclamationTriangleIcon
  }
};

// Sans titre
export const WithoutTitle: Story = {
  args: {
    variant: 'info',
    children: 'Cette alerte n\'a pas de titre, seulement du contenu.'
  }
};

// Contenu long
export const LongContent: Story = {
  args: {
    variant: 'danger',
    title: 'Erreur détaillée',
    children: 'Cette alerte contient un message très long qui peut s\'étendre sur plusieurs lignes pour tester le comportement du composant avec du contenu étendu. Le texte doit s\'adapter correctement et maintenir une bonne lisibilité.',
    dismissible: true,
    actions: (
      <div className="flex gap-2">
        <Button variant="danger" size="sm">
          Réessayer
        </Button>
        <Button variant="outline" size="sm">
          Signaler le problème
        </Button>
      </div>
    )
  }
};

// Toutes les variantes ensemble
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="info" title="Information" dismissible>
        Voici une information importante.
      </Alert>
      <Alert variant="success" title="Succès" dismissible>
        Opération réalisée avec succès !
      </Alert>
      <Alert variant="warning" title="Attention" dismissible>
        Cette action nécessite votre attention.
      </Alert>
      <Alert variant="danger" title="Erreur" dismissible>
        Une erreur critique est survenue.
      </Alert>
    </div>
  )
};

// Tous les styles
export const AllStyles: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert variant="info" style="filled" title="Style rempli">
        Alerte avec fond coloré complet.
      </Alert>
      <Alert variant="info" style="outlined" title="Style contour">
        Alerte avec bordure colorée uniquement.
      </Alert>
      <Alert variant="info" style="minimal" title="Style minimal">
        Alerte avec bordure gauche colorée.
      </Alert>
    </div>
  )
};
