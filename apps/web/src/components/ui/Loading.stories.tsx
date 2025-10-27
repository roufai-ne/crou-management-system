/**
 * FICHIER: apps\web\src\components\ui\Loading.stories.tsx
 * STORYBOOK: Stories pour les composants Loading
 * 
 * DESCRIPTION:
 * Documentation interactive des composants de chargement
 * Spinners, barres de progression, squelettes et overlays
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { 
  Spinner, 
  ProgressBar, 
  CircularProgress, 
  Skeleton, 
  LoadingOverlay, 
  LoadingDots 
} from './Loading';
import { useState } from 'react';
import { Button } from './Button';

// ============================================================================
// SPINNER STORIES
// ============================================================================

const spinnerMeta: Meta<typeof Spinner> = {
  title: 'Components/Feedback/Loading/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Indicateur de chargement rotatif avec différentes tailles et couleurs.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl']
    },
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'white']
    }
  },
  tags: ['autodocs']
};

export default spinnerMeta;
type SpinnerStory = StoryObj<typeof Spinner>;

export const DefaultSpinner: SpinnerStory = {
  args: {}
};

export const SpinnerSizes: SpinnerStory = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  )
};

export const SpinnerVariants: SpinnerStory = {
  render: () => (
    <div className="flex items-center gap-4">
      <Spinner variant="primary" />
      <Spinner variant="secondary" />
      <Spinner variant="success" />
      <Spinner variant="warning" />
      <Spinner variant="danger" />
    </div>
  )
};

// ============================================================================
// PROGRESS BAR STORIES
// ============================================================================

const progressMeta: Meta<typeof ProgressBar> = {
  title: 'Components/Feedback/Loading/ProgressBar',
  component: ProgressBar,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Barre de progression pour indiquer l\'avancement d\'une tâche.'
      }
    }
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 }
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg']
    },
    variant: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger']
    }
  },
  tags: ['autodocs']
};

export const DefaultProgressBar: StoryObj<typeof ProgressBar> = {
  args: {
    value: 65,
    max: 100
  }
};

export const ProgressBarWithLabel: StoryObj<typeof ProgressBar> = {
  args: {
    value: 75,
    max: 100,
    label: 'Progression du téléchargement',
    showPercentage: true
  }
};

export const ProgressBarSizes: StoryObj<typeof ProgressBar> = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <ProgressBar value={60} size="sm" label="Petit" />
      <ProgressBar value={70} size="md" label="Moyen" />
      <ProgressBar value={80} size="lg" label="Grand" />
    </div>
  )
};

export const ProgressBarVariants: StoryObj<typeof ProgressBar> = {
  render: () => (
    <div className="space-y-4 w-full max-w-md">
      <ProgressBar value={60} variant="primary" label="Primaire" />
      <ProgressBar value={70} variant="success" label="Succès" />
      <ProgressBar value={50} variant="warning" label="Attention" />
      <ProgressBar value={30} variant="danger" label="Erreur" />
    </div>
  )
};

// ============================================================================
// CIRCULAR PROGRESS STORIES
// ============================================================================

export const CircularProgressDefault: StoryObj<typeof CircularProgress> = {
  args: {
    value: 75,
    showPercentage: true
  },
  parameters: {
    docs: {
      storyDescription: 'Indicateur de progression circulaire avec pourcentage affiché.'
    }
  }
};

export const CircularProgressSizes: StoryObj<typeof CircularProgress> = {
  render: () => (
    <div className="flex items-center gap-8">
      <CircularProgress value={60} size="sm" showPercentage />
      <CircularProgress value={70} size="md" showPercentage />
      <CircularProgress value={80} size="lg" showPercentage />
      <CircularProgress value={90} size="xl" showPercentage />
    </div>
  )
};

// ============================================================================
// SKELETON STORIES
// ============================================================================

export const SkeletonDefault: StoryObj<typeof Skeleton> = {
  args: {
    className: 'h-4 w-32'
  }
};

export const SkeletonVariants: StoryObj<typeof Skeleton> = {
  render: () => (
    <div className="space-y-4">
      <Skeleton variant="text" className="h-4 w-48" />
      <Skeleton variant="circular" className="h-12 w-12" />
      <Skeleton variant="rectangular" className="h-32 w-full" />
    </div>
  )
};

export const SkeletonCard: StoryObj<typeof Skeleton> = {
  render: () => (
    <div className="max-w-sm">
      <div className="space-y-3">
        <Skeleton variant="rectangular" className="h-48 w-full" />
        <div className="space-y-2">
          <Skeleton variant="text" className="h-4 w-3/4" />
          <Skeleton variant="text" className="h-4 w-1/2" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton variant="circular" className="h-8 w-8" />
          <Skeleton variant="text" className="h-4 w-24" />
        </div>
      </div>
    </div>
  )
};

// ============================================================================
// LOADING OVERLAY STORIES
// ============================================================================

export const LoadingOverlayDemo: StoryObj<typeof LoadingOverlay> = {
  render: () => {
    const [visible, setVisible] = useState(false);
    
    return (
      <div className="relative">
        <div className="p-8 bg-gray-100 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Contenu de la page</h3>
          <p className="mb-4">
            Ceci est le contenu principal de la page qui sera masqué par l'overlay de chargement.
          </p>
          <Button onClick={() => setVisible(!visible)}>
            {visible ? 'Masquer' : 'Afficher'} l'overlay
          </Button>
        </div>
        
        <LoadingOverlay 
          visible={visible} 
          message="Chargement en cours..."
        />
      </div>
    );
  }
};

// ============================================================================
// LOADING DOTS STORIES
// ============================================================================

export const LoadingDotsDefault: StoryObj<typeof LoadingDots> = {
  args: {}
};

export const LoadingDotsSizes: StoryObj<typeof LoadingDots> = {
  render: () => (
    <div className="flex items-center gap-8">
      <LoadingDots size="sm" />
      <LoadingDots size="md" />
      <LoadingDots size="lg" />
    </div>
  )
};

export const LoadingDotsVariants: StoryObj<typeof LoadingDots> = {
  render: () => (
    <div className="flex items-center gap-8">
      <LoadingDots variant="primary" />
      <LoadingDots variant="secondary" />
      <LoadingDots variant="white" />
    </div>
  )
};

// ============================================================================
// COMBINED EXAMPLES
// ============================================================================

export const LoadingStates: StoryObj = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Spinners</h3>
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Barres de progression</h3>
        <div className="space-y-2 max-w-md">
          <ProgressBar value={30} variant="danger" label="Critique" showPercentage />
          <ProgressBar value={60} variant="warning" label="Attention" showPercentage />
          <ProgressBar value={85} variant="success" label="Excellent" showPercentage />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Progression circulaire</h3>
        <div className="flex items-center gap-6">
          <CircularProgress value={25} variant="danger" showPercentage />
          <CircularProgress value={50} variant="warning" showPercentage />
          <CircularProgress value={75} variant="success" showPercentage />
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Points de chargement</h3>
        <div className="flex items-center gap-6">
          <LoadingDots size="sm" />
          <LoadingDots size="md" />
          <LoadingDots size="lg" />
        </div>
      </div>
    </div>
  )
};
