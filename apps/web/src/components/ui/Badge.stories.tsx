/**
 * FICHIER: apps\web\src\components\ui\Badge.stories.tsx
 * STORYBOOK: Stories pour le composant Badge
 * 
 * DESCRIPTION:
 * Documentation interactive du composant Badge avec exemples d'utilisation
 * Démontre toutes les variantes, tailles et fonctionnalités
 * Cas d'usage spécifiques au contexte CROU
 * 
 * STORIES:
 * - Badge de base avec variantes et styles
 * - Badges avec icônes et compteurs
 * - StatusBadge pour statuts prédéfinis
 * - StudentStatusBadge pour étudiants
 * - WorkflowStatusBadge avec progression
 * - BadgeGroup pour organisation multiple
 * - Exemples CROU (statuts, notifications, etc.)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { 
  CheckIcon,
  XMarkIcon,
  UserIcon,
  BellIcon,
  ExclamationTriangleIcon,
  StarIcon,
  ClockIcon,
  AcademicCapIcon,
  HomeIcon,
  CurrencyEuroIcon,
  ShoppingCartIcon
} from '@heroicons/react/24/outline';
import { 
  Badge, 
  StatusBadge, 
  StudentStatusBadge, 
  WorkflowStatusBadge, 
  BadgeGroup 
} from './Badge';

// Configuration Meta
const meta: Meta<typeof Badge> = {
  title: 'Components/Data Display/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant badge pour afficher des statuts, étiquettes et indicateurs avec support des icônes et animations.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'success', 'warning', 'danger', 'gray', 'info'],
      description: 'Variante de couleur'
    },
    style: {
      control: 'select',
      options: ['filled', 'outline', 'soft'],
      description: 'Style visuel'
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg'],
      description: 'Taille du badge'
    },
    dot: {
      control: 'boolean',
      description: 'Afficher un point d\'indication'
    },
    dotColor: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'danger'],
      description: 'Couleur du point'
    },
    pulse: {
      control: 'boolean',
      description: 'Animation de pulsation'
    },
    count: {
      control: 'number',
      description: 'Compteur à afficher'
    },
    maxCount: {
      control: 'number',
      description: 'Limite du compteur'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Badge>;

// Stories de base
export const DefaultBadge: Story = {
  args: {
    children: 'Badge par défaut'
  }
};

export const BadgeVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge variant="primary">Primary</Badge>
      <Badge variant="secondary">Secondary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="danger">Danger</Badge>
      <Badge variant="gray">Gray</Badge>
      <Badge variant="info">Info</Badge>
    </div>
  )
};

export const BadgeStyles: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Style Filled</h4>
        <Badge variant="primary" style="filled">Filled</Badge>
        <Badge variant="success" style="filled">Success</Badge>
        <Badge variant="warning" style="filled">Warning</Badge>
        <Badge variant="danger" style="filled">Danger</Badge>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Style Outline</h4>
        <Badge variant="primary" style="outline">Outline</Badge>
        <Badge variant="success" style="outline">Success</Badge>
        <Badge variant="warning" style="outline">Warning</Badge>
        <Badge variant="danger" style="outline">Danger</Badge>
      </div>
      
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Style Soft</h4>
        <Badge variant="primary" style="soft">Soft</Badge>
        <Badge variant="success" style="soft">Success</Badge>
        <Badge variant="warning" style="soft">Warning</Badge>
        <Badge variant="danger" style="soft">Danger</Badge>
      </div>
    </div>
  )
};

export const BadgeSizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="xs" variant="primary">XS</Badge>
      <Badge size="sm" variant="primary">SM</Badge>
      <Badge size="md" variant="primary">MD</Badge>
      <Badge size="lg" variant="primary">LG</Badge>
    </div>
  )
};

export const BadgeWithIcons: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge leftIcon={<CheckIcon className="h-3 w-3" />} variant="success">
        Approuvé
      </Badge>
      
      <Badge rightIcon={<XMarkIcon className="h-3 w-3" />} variant="danger">
        Rejeté
      </Badge>
      
      <Badge 
        leftIcon={<UserIcon className="h-3 w-3" />} 
        rightIcon={<StarIcon className="h-3 w-3" />}
        variant="primary"
      >
        Utilisateur VIP
      </Badge>
      
      <Badge iconOnly={<BellIcon className="h-4 w-4" />} variant="warning" />
      
      <Badge 
        leftIcon={<AcademicCapIcon className="h-3 w-3" />}
        variant="info"
        size="lg"
      >
        Étudiant
      </Badge>
    </div>
  )
};

export const BadgeWithDot: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge dot dotColor="primary">En ligne</Badge>
      <Badge dot dotColor="success">Actif</Badge>
      <Badge dot dotColor="warning">En attente</Badge>
      <Badge dot dotColor="danger">Hors ligne</Badge>
      
      <Badge dot dotColor="success" pulse>
        Notification
      </Badge>
    </div>
  )
};

export const BadgeWithCount: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge count={5} variant="danger" />
      <Badge count={23} variant="primary" />
      <Badge count={150} maxCount={99} variant="warning" />
      <Badge count={0} variant="gray" />
      
      <div className="relative">
        <BellIcon className="h-6 w-6 text-gray-600" />
        <Badge count={3} variant="danger" className="absolute -top-2 -right-2" />
      </div>
    </div>
  )
};

export const InteractiveBadge: Story = {
  render: () => {
    const [count, setCount] = useState(5);
    
    return (
      <div className="flex flex-wrap gap-4">
        <Badge 
          onClick={() => alert('Badge cliqué!')}
          variant="primary"
          leftIcon={<CheckIcon className="h-3 w-3" />}
        >
          Cliquable
        </Badge>
        
        <Badge 
          count={count}
          variant="danger"
          onClick={() => setCount(0)}
          className="cursor-pointer"
        />
        
        <Badge 
          onClick={() => setCount(count + 1)}
          variant="success"
        >
          Incrémenter ({count})
        </Badge>
      </div>
    );
  }
};

export const AnimatedBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-4">
      <Badge pulse variant="warning">
        Pulsation
      </Badge>
      
      <Badge dot dotColor="danger" pulse>
        Point animé
      </Badge>
      
      <Badge 
        variant="success" 
        leftIcon={<CheckIcon className="h-3 w-3" />}
        pulse
      >
        Succès animé
      </Badge>
      
      <Badge 
        count={3}
        variant="danger"
        pulse
        onClick={() => {}}
      />
    </div>
  )
};

// Stories pour StatusBadge
export const StatusBadgeExamples: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Statuts généraux</h4>
        <StatusBadge status="active" />
        <StatusBadge status="inactive" />
        <StatusBadge status="pending" />
        <StatusBadge status="approved" />
        <StatusBadge status="rejected" />
        <StatusBadge status="draft" />
        <StatusBadge status="published" />
        <StatusBadge status="archived" />
      </div>
      
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Avec texte personnalisé</h4>
        <StatusBadge status="active" customText="En ligne" />
        <StatusBadge status="pending" customText="En cours de validation" />
        <StatusBadge status="approved" customText="Validé par l'admin" />
      </div>
    </div>
  )
};

// Stories pour StudentStatusBadge
export const StudentStatusBadgeExamples: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Statuts étudiants</h4>
        <StudentStatusBadge status="enrolled" />
        <StudentStatusBadge status="graduated" />
        <StudentStatusBadge status="suspended" />
        <StudentStatusBadge status="transferred" />
        <StudentStatusBadge status="dropout" />
        <StudentStatusBadge status="exchange" />
      </div>
      
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Avec texte personnalisé</h4>
        <StudentStatusBadge status="enrolled" customText="Inscrit 2024-2025" />
        <StudentStatusBadge status="exchange" customText="Erasmus - 6 mois" />
        <StudentStatusBadge status="graduated" customText="Diplômé avec mention" />
      </div>
    </div>
  )
};

// Stories pour WorkflowStatusBadge
export const WorkflowStatusBadgeExamples: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Statuts de workflow</h4>
        <WorkflowStatusBadge status="not_started" />
        <WorkflowStatusBadge status="in_progress" />
        <WorkflowStatusBadge status="review" />
        <WorkflowStatusBadge status="approved" />
        <WorkflowStatusBadge status="completed" />
        <WorkflowStatusBadge status="cancelled" />
        <WorkflowStatusBadge status="on_hold" />
      </div>
      
      <div className="flex flex-wrap gap-4">
        <h4 className="w-full text-sm font-medium text-gray-600">Avec progression</h4>
        <WorkflowStatusBadge status="in_progress" progress={25} />
        <WorkflowStatusBadge status="in_progress" progress={50} />
        <WorkflowStatusBadge status="in_progress" progress={75} />
        <WorkflowStatusBadge status="review" progress={90} />
      </div>
    </div>
  )
};

// Stories pour BadgeGroup
export const BadgeGroupExamples: Story = {
  render: () => {
    const skillBadges = [
      { key: 'react', content: 'React', props: { variant: 'primary' as const } },
      { key: 'typescript', content: 'TypeScript', props: { variant: 'info' as const } },
      { key: 'nodejs', content: 'Node.js', props: { variant: 'success' as const } },
      { key: 'python', content: 'Python', props: { variant: 'warning' as const } },
      { key: 'docker', content: 'Docker', props: { variant: 'secondary' as const } },
      { key: 'aws', content: 'AWS', props: { variant: 'danger' as const } }
    ];
    
    const tagBadges = [
      { key: 'urgent', content: 'Urgent', props: { variant: 'danger' as const, size: 'sm' as const } },
      { key: 'important', content: 'Important', props: { variant: 'warning' as const, size: 'sm' as const } },
      { key: 'feature', content: 'Feature', props: { variant: 'primary' as const, size: 'sm' as const } },
      { key: 'bug', content: 'Bug', props: { variant: 'danger' as const, size: 'sm' as const } },
      { key: 'enhancement', content: 'Enhancement', props: { variant: 'success' as const, size: 'sm' as const } }
    ];
    
    return (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3">Compétences (tous visibles)</h4>
          <BadgeGroup badges={skillBadges} spacing="md" />
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3">Tags (limité à 3)</h4>
          <BadgeGroup badges={tagBadges} maxVisible={3} spacing="sm" />
        </div>
        
        <div>
          <h4 className="text-sm font-medium text-gray-600 mb-3">Avec texte personnalisé</h4>
          <BadgeGroup 
            badges={skillBadges} 
            maxVisible={2} 
            moreText="et {count} autres compétences"
            spacing="lg"
          />
        </div>
      </div>
    );
  }
};

// Exemples CROU spécifiques
export const CROUExamples: Story = {
  render: () => (
    <div className="space-y-8 max-w-4xl">
      {/* Tableau de bord étudiant */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Profil étudiant - Marie Dupont</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Statut d'inscription:</span>
            <StudentStatusBadge status="enrolled" />
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Bourse:</span>
            <Badge variant="success" leftIcon={<CurrencyEuroIcon className="h-3 w-3" />}>
              Boursier échelon 5
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Logement:</span>
            <Badge variant="primary" leftIcon={<HomeIcon className="h-3 w-3" />}>
              Résidence A - Chambre 205
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Notifications:</span>
            <div className="relative">
              <BellIcon className="h-5 w-5 text-gray-600" />
              <Badge count={3} variant="danger" size="xs" className="absolute -top-1 -right-1" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Gestion des repas */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Service de restauration</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium">Statuts des commandes</h4>
            <div className="flex flex-wrap gap-2">
              <WorkflowStatusBadge status="in_progress" progress={75} />
              <WorkflowStatusBadge status="completed" />
              <WorkflowStatusBadge status="cancelled" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h4 className="font-medium">Préférences alimentaires</h4>
            <BadgeGroup
              badges={[
                { key: 'vegetarian', content: 'Végétarien', props: { variant: 'success' as const, size: 'sm' as const } },
                { key: 'no-gluten', content: 'Sans gluten', props: { variant: 'warning' as const, size: 'sm' as const } },
                { key: 'no-lactose', content: 'Sans lactose', props: { variant: 'info' as const, size: 'sm' as const } },
                { key: 'halal', content: 'Halal', props: { variant: 'primary' as const, size: 'sm' as const } }
              ]}
              maxVisible={3}
              spacing="sm"
            />
          </div>
        </div>
      </div>
      
      {/* Tableau de bord administrateur */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Tableau de bord administrateur</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">1,247</div>
            <div className="text-sm text-gray-600 mb-2">Étudiants inscrits</div>
            <StatusBadge status="active" />
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">89</div>
            <div className="text-sm text-gray-600 mb-2">Demandes en attente</div>
            <StatusBadge status="pending" />
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">156</div>
            <div className="text-sm text-gray-600 mb-2">Chambres disponibles</div>
            <Badge variant="success" dot dotColor="success">
              Disponible
            </Badge>
          </div>
        </div>
      </div>
      
      {/* Notifications système */}
      <div className="bg-white p-6 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Centre de notifications</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge 
                iconOnly={<ExclamationTriangleIcon className="h-4 w-4" />}
                variant="warning"
                size="sm"
              />
              <span className="text-sm">Maintenance programmée ce soir</span>
            </div>
            <Badge variant="warning" size="xs">Nouveau</Badge>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge 
                iconOnly={<CheckIcon className="h-4 w-4" />}
                variant="success"
                size="sm"
              />
              <span className="text-sm">Votre demande de bourse a été approuvée</span>
            </div>
            <Badge count={1} variant="success" size="xs" />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge 
                iconOnly={<ShoppingCartIcon className="h-4 w-4" />}
                variant="primary"
                size="sm"
              />
              <span className="text-sm">Nouveau menu disponible</span>
            </div>
            <Badge dot dotColor="primary" pulse>Info</Badge>
          </div>
        </div>
      </div>
    </div>
  )
};

// Export des stories
export {
  DefaultBadge,
  BadgeVariants,
  BadgeStyles,
  BadgeSizes,
  BadgeWithIcons,
  BadgeWithDot,
  BadgeWithCount,
  InteractiveBadge,
  AnimatedBadges,
  StatusBadgeExamples,
  StudentStatusBadgeExamples,
  WorkflowStatusBadgeExamples,
  BadgeGroupExamples,
  CROUExamples
};
