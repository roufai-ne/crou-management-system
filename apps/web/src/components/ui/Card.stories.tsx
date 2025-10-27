/**
 * FICHIER: apps\web\src\components\ui\Card.stories.tsx
 * STORYBOOK: Stories pour la famille de composants Card
 * 
 * DESCRIPTION:
 * Documentation interactive de la famille Card avec exemples d'utilisation
 * Démontre toutes les variantes et composants spécialisés
 * Cas d'usage spécifiques au contexte CROU
 * 
 * STORIES:
 * - Card de base avec variantes et tailles
 * - CardHeader, CardBody, CardFooter avec options
 * - CardActions et CardImage
 * - StatCard pour statistiques
 * - InfoCard pour informations
 * - ActionCard pour actions
 * - Exemples CROU (profils, statistiques, etc.)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { 
  UserIcon,
  CogIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChartBarIcon,
  CurrencyEuroIcon,
  AcademicCapIcon,
  HomeIcon,
  BellIcon,
  StarIcon,
  ClockIcon,
  DocumentTextIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { 
  Card, 
  CardHeader, 
  CardBody, 
  CardFooter, 
  CardActions,
  CardImage,
  StatCard,
  InfoCard,
  ActionCard
} from './Card';
import { Button } from './Button';
import { Badge } from './Badge';

// Configuration Meta
const meta: Meta<typeof Card> = {
  title: 'Components/Layout/Card',
  component: Card,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Famille de composants carte pour organiser le contenu avec en-têtes, corps, pieds de page et actions.'
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['elevated', 'outlined', 'filled'],
      description: 'Variante visuelle'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille de la carte'
    },
    selected: {
      control: 'boolean',
      description: 'État sélectionné'
    },
    interactive: {
      control: 'boolean',
      description: 'Carte interactive'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Card>;

// Stories de base
export const DefaultCard: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Carte par défaut
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Contenu de la carte avec du texte descriptif.
        </p>
      </div>
    )
  }
};

export const CardVariants: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl">
      <Card variant="elevated">
        <h3 className="text-lg font-semibold mb-2">Elevated</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Carte avec ombre portée pour créer une élévation.
        </p>
      </Card>
      
      <Card variant="outlined">
        <h3 className="text-lg font-semibold mb-2">Outlined</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Carte avec bordure simple sans ombre.
        </p>
      </Card>
      
      <Card variant="filled">
        <h3 className="text-lg font-semibold mb-2">Filled</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Carte avec fond coloré et contenu contrasté.
        </p>
      </Card>
    </div>
  )
};

export const CardSizes: Story = {
  render: () => (
    <div className="space-y-6 max-w-2xl">
      <Card size="sm" variant="outlined">
        <h3 className="text-base font-semibold mb-1">Petite carte</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Carte compacte avec moins d'espacement.
        </p>
      </Card>
      
      <Card size="md" variant="outlined">
        <h3 className="text-lg font-semibold mb-2">Carte moyenne</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Carte avec espacement standard (défaut).
        </p>
      </Card>
      
      <Card size="lg" variant="outlined">
        <h3 className="text-xl font-semibold mb-3">Grande carte</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Carte avec plus d'espacement pour du contenu important.
        </p>
      </Card>
    </div>
  )
};

export const InteractiveCard: Story = {
  render: () => {
    const [selected, setSelected] = useState<string | null>(null);
    
    const cards = [
      { id: 'card1', title: 'Option 1', description: 'Première option disponible' },
      { id: 'card2', title: 'Option 2', description: 'Deuxième option disponible' },
      { id: 'card3', title: 'Option 3', description: 'Troisième option disponible' }
    ];
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
        {cards.map((card) => (
          <Card
            key={card.id}
            variant="outlined"
            selected={selected === card.id}
            onClick={() => setSelected(card.id)}
          >
            <h3 className="text-lg font-semibold mb-2">{card.title}</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {card.description}
            </p>
            {selected === card.id && (
              <div className="mt-3">
                <Badge variant="primary" size="sm">Sélectionné</Badge>
              </div>
            )}
          </Card>
        ))}
      </div>
    );
  }
};

export const CompleteCard: Story = {
  render: () => (
    <div className="max-w-md">
      <Card variant="elevated">
        <CardHeader
          title="Profil étudiant"
          subtitle="Marie Dupont - L3 Informatique"
          icon={<AcademicCapIcon className="h-5 w-5" />}
          action={
            <Button size="sm" variant="outline">
              <PencilIcon className="h-4 w-4" />
            </Button>
          }
        />
        
        <CardBody>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Statut:</span>
              <Badge variant="success" size="sm">Inscrite</Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Bourse:</span>
              <Badge variant="primary" size="sm">Échelon 5</Badge>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Logement:</span>
              <Badge variant="info" size="sm">Résidence A</Badge>
            </div>
          </div>
        </CardBody>
        
        <CardFooter>
          <CardActions>
            <Button variant="outline" size="sm">Contacter</Button>
            <Button size="sm">Voir profil</Button>
          </CardActions>
        </CardFooter>
      </Card>
    </div>
  )
};

export const CardWithImage: Story = {
  render: () => (
    <div className="max-w-sm">
      <Card variant="outlined" size="sm">
        <CardImage
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=200&fit=crop"
          alt="Restaurant universitaire"
          aspectRatio="video"
        />
        
        <div className="p-4">
          <CardHeader
            title="Restaurant Central"
            subtitle="Campus Universitaire"
            className="mb-3"
          />
          
          <CardBody spacing="sm">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Restaurant principal du campus avec 300 places assises.
              Menu varié et options végétariennes disponibles.
            </p>
          </CardBody>
          
          <CardFooter align="between">
            <div className="flex items-center gap-2">
              <StarIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">4.2/5</span>
            </div>
            <Button size="sm">Voir menu</Button>
          </CardFooter>
        </div>
      </Card>
    </div>
  )
};

// Stories pour StatCard
export const StatCardExamples: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
      <StatCard
        title="Étudiants inscrits"
        value="1,247"
        change={{
          value: 8.2,
          type: 'increase',
          period: 'vs année dernière'
        }}
        icon={<AcademicCapIcon className="h-6 w-6" />}
      />
      
      <StatCard
        title="Chiffre d'affaires"
        value="125,000 FCFA"
        change={{
          value: 12.5,
          type: 'increase',
          period: 'vs mois dernier'
        }}
        icon={<CurrencyEuroIcon className="h-6 w-6" />}
        iconColor="bg-success-100 text-success-600 dark:bg-success-900/20 dark:text-success-400"
      />
      
      <StatCard
        title="Taux d'occupation"
        value="78.3%"
        change={{
          value: 5.1,
          type: 'decrease',
          period: 'vs mois dernier'
        }}
        icon={<HomeIcon className="h-6 w-6" />}
        iconColor="bg-warning-100 text-warning-600 dark:bg-warning-900/20 dark:text-warning-400"
      />
      
      <StatCard
        title="Satisfaction"
        value="4.2/5"
        change={{
          value: 0.3,
          type: 'increase',
          period: 'vs trimestre'
        }}
        icon={<StarIcon className="h-6 w-6" />}
        description="Basé sur 2,847 avis"
      />
    </div>
  )
};

// Stories pour InfoCard
export const InfoCardExamples: Story = {
  render: () => (
    <div className="space-y-4 max-w-2xl">
      <InfoCard
        type="info"
        title="Information importante"
        content="Le service de restauration sera fermé demain pour maintenance."
        icon={<InformationCircleIcon className="h-5 w-5" />}
        action={<Button size="sm" variant="outline">En savoir plus</Button>}
      />
      
      <InfoCard
        type="success"
        title="Demande approuvée"
        content="Votre demande de bourse a été approuvée et sera versée dans les 5 jours ouvrés."
        icon={<CheckIcon className="h-5 w-5" />}
        compact
      />
      
      <InfoCard
        type="warning"
        title="Action requise"
        content="Veuillez mettre à jour vos informations de contact avant le 31 décembre."
        icon={<ExclamationTriangleIcon className="h-5 w-5" />}
        action={<Button size="sm">Mettre à jour</Button>}
      />
      
      <InfoCard
        type="error"
        title="Erreur de paiement"
        content="Le paiement de votre repas a échoué. Veuillez vérifier vos informations bancaires."
        icon={<XMarkIcon className="h-5 w-5" />}
        action={<Button size="sm" variant="danger">Réessayer</Button>}
      />
    </div>
  )
};

// Stories pour ActionCard
export const ActionCardExamples: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
      <ActionCard
        title="Nouvelle demande de logement"
        description="Créer une nouvelle demande de logement pour l'année universitaire 2024-2025."
        icon={<HomeIcon className="h-6 w-6" />}
        primaryAction={<Button>Créer demande</Button>}
        secondaryActions={[
          <Button key="info" variant="outline" size="sm">Plus d'infos</Button>
        ]}
      />
      
      <ActionCard
        title="Renouveler inscription"
        description="Renouveler votre inscription pour l'année prochaine avant la date limite."
        icon={<DocumentTextIcon className="h-6 w-6" />}
        primaryAction={<Button variant="primary">Renouveler</Button>}
        secondaryActions={[
          <Button key="later" variant="ghost" size="sm">Plus tard</Button>
        ]}
      />
      
      <ActionCard
        title="Évaluer le service"
        description="Donnez votre avis sur la qualité du service de restauration."
        icon={<StarIcon className="h-6 w-6" />}
        primaryAction={<Button variant="outline">Évaluer</Button>}
      />
      
      <ActionCard
        title="Maintenance en cours"
        description="Le système de réservation est temporairement indisponible."
        icon={<CogIcon className="h-6 w-6" />}
        primaryAction={<Button disabled>Indisponible</Button>}
        disabled
      />
    </div>
  )
};

export const LoadingActionCard: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    
    const handleAction = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 2000));
      setLoading(false);
    };
    
    return (
      <div className="max-w-md">
        <ActionCard
          title="Traitement de la demande"
          description="Cliquez pour traiter votre demande de bourse."
          icon={<DocumentTextIcon className="h-6 w-6" />}
          primaryAction={
            <Button onClick={handleAction} disabled={loading}>
              {loading ? 'Traitement...' : 'Traiter'}
            </Button>
          }
          loading={loading}
        />
      </div>
    );
  }
};

// Exemples CROU spécifiques
export const CROUDashboard: Story = {
  render: () => (
    <div className="space-y-8 max-w-6xl">
      {/* En-tête avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Étudiants actifs"
          value="1,247"
          change={{ value: 8.2, type: 'increase', period: 'vs année dernière' }}
          icon={<AcademicCapIcon className="h-6 w-6" />}
          onClick={() => console.log('Voir détails étudiants')}
        />
        
        <StatCard
          title="Revenus mensuels"
          value="125,000 FCFA"
          change={{ value: 12.5, type: 'increase', period: 'vs mois dernier' }}
          icon={<CurrencyEuroIcon className="h-6 w-6" />}
          iconColor="bg-success-100 text-success-600"
        />
        
        <StatCard
          title="Taux d'occupation"
          value="78.3%"
          change={{ value: 5.1, type: 'decrease', period: 'vs mois dernier' }}
          icon={<HomeIcon className="h-6 w-6" />}
          iconColor="bg-warning-100 text-warning-600"
        />
        
        <StatCard
          title="Satisfaction"
          value="4.2/5"
          change={{ value: 0.3, type: 'increase', period: 'vs trimestre' }}
          icon={<StarIcon className="h-6 w-6" />}
          description="2,847 avis"
        />
      </div>
      
      {/* Notifications importantes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InfoCard
          type="warning"
          title="Maintenance programmée"
          content="Le système de réservation sera indisponible demain de 2h à 6h pour maintenance."
          icon={<ExclamationTriangleIcon className="h-5 w-5" />}
          action={<Button size="sm" variant="outline">Programmer rappel</Button>}
        />
        
        <InfoCard
          type="success"
          title="Nouveau partenariat"
          content="Nous avons signé un partenariat avec 3 nouveaux restaurants locaux."
          icon={<CheckIcon className="h-5 w-5" />}
          action={<Button size="sm">Découvrir</Button>}
        />
      </div>
      
      {/* Actions rapides */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Actions rapides
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ActionCard
            title="Ajouter un étudiant"
            description="Inscrire un nouvel étudiant dans le système."
            icon={<PlusIcon className="h-6 w-6" />}
            primaryAction={<Button>Ajouter</Button>}
          />
          
          <ActionCard
            title="Gérer les menus"
            description="Modifier les menus de la semaine prochaine."
            icon={<DocumentTextIcon className="h-6 w-6" />}
            primaryAction={<Button variant="outline">Gérer</Button>}
          />
          
          <ActionCard
            title="Rapports mensuels"
            description="Générer les rapports de performance du mois."
            icon={<ChartBarIcon className="h-6 w-6" />}
            primaryAction={<Button variant="outline">Générer</Button>}
            secondaryActions={[
              <Button key="view" variant="ghost" size="sm">Voir précédents</Button>
            ]}
          />
        </div>
      </div>
      
      {/* Profils étudiants récents */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
          Inscriptions récentes
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { name: 'Marie Dupont', level: 'L3 Informatique', status: 'enrolled', scholarship: true },
            { name: 'Jean Martin', level: 'M1 Économie', status: 'exchange', scholarship: false },
            { name: 'Sophie Bernard', level: 'L2 Lettres', status: 'enrolled', scholarship: true }
          ].map((student, index) => (
            <Card key={index} variant="outlined">
              <CardHeader
                title={student.name}
                subtitle={student.level}
                icon={<AcademicCapIcon className="h-5 w-5" />}
                action={
                  <Button size="sm" variant="ghost">
                    <PencilIcon className="h-4 w-4" />
                  </Button>
                }
              />
              
              <CardBody spacing="sm">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Statut:</span>
                  <Badge 
                    variant={student.status === 'enrolled' ? 'success' : 'warning'} 
                    size="sm"
                  >
                    {student.status === 'enrolled' ? 'Inscrit' : 'Échange'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Bourse:</span>
                  <Badge 
                    variant={student.scholarship ? 'primary' : 'gray'} 
                    size="sm"
                  >
                    {student.scholarship ? 'Boursier' : 'Non boursier'}
                  </Badge>
                </div>
              </CardBody>
              
              <CardFooter>
                <CardActions spacing="sm">
                  <Button size="sm" variant="outline">Contacter</Button>
                  <Button size="sm">Voir profil</Button>
                </CardActions>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
};

// Export des stories
export {
  DefaultCard,
  CardVariants,
  CardSizes,
  InteractiveCard,
  CompleteCard,
  CardWithImage,
  StatCardExamples,
  InfoCardExamples,
  ActionCardExamples,
  LoadingActionCard,
  CROUDashboard
};
