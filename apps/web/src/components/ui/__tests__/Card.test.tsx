/**
 * FICHIER: apps\web\src\components\ui\__tests__\Card.test.tsx
 * TESTS: Tests unitaires pour la famille de composants Card
 * 
 * DESCRIPTION:
 * Tests complets de la famille Card avec toutes ses variantes
 * Couvre Card, CardHeader, CardBody, CardFooter, CardActions
 * Tests des cartes spécialisées (StatCard, InfoCard, ActionCard)
 * Tests d'accessibilité et d'interaction
 * 
 * COVERAGE:
 * - Card de base avec variantes et tailles
 * - CardHeader avec titre, sous-titre et actions
 * - CardBody et CardFooter avec espacement
 * - CardActions avec orientations
 * - CardImage avec ratios d'aspect
 * - StatCard avec statistiques et tendances
 * - InfoCard avec types d'information
 * - ActionCard avec états de chargement
 * - Interactions et accessibilité
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { 
  UserIcon, 
  CogIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
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
} from '../Card';
import { Button } from '../Button';
import type { CardProps } from '../Card';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Props par défaut pour les tests
const defaultProps: CardProps = {
  children: 'Contenu de la carte'
};

describe('Card Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec le contenu', () => {
      render(<Card {...defaultProps} />);
      expect(screen.getByText('Contenu de la carte')).toBeInTheDocument();
    });

    it('applique les classes par défaut', () => {
      const { container } = render(<Card {...defaultProps} />);
      const card = container.firstChild as HTMLElement;
      
      expect(card).toHaveClass('relative', 'bg-white', 'rounded-lg');
    });

    it('accepte les props HTML standard', () => {
      render(<Card {...defaultProps} data-testid="custom-card" />);
      expect(screen.getByTestId('custom-card')).toBeInTheDocument();
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    const variants = ['elevated', 'outlined', 'filled'] as const;

    variants.forEach((variant) => {
      it(`rend la variante ${variant} correctement`, () => {
        const { container } = render(
          <Card variant={variant}>
            Variante {variant}
          </Card>
        );
        
        const card = container.firstChild as HTMLElement;
        
        switch (variant) {
          case 'elevated':
            expect(card).toHaveClass('shadow-md');
            break;
          case 'outlined':
            expect(card).toHaveClass('border');
            break;
          case 'filled':
            expect(card).toHaveClass('bg-gray-50');
            break;
        }
      });
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`rend la taille ${size} correctement`, () => {
        const { container } = render(
          <Card size={size}>
            Taille {size}
          </Card>
        );
        
        const card = container.firstChild as HTMLElement;
        
        switch (size) {
          case 'sm':
            expect(card).toHaveClass('p-4');
            break;
          case 'md':
            expect(card).toHaveClass('p-6');
            break;
          case 'lg':
            expect(card).toHaveClass('p-8');
            break;
        }
      });
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('appelle onClick quand cliqué', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Card onClick={handleClick}>Carte cliquable</Card>);
      
      await user.click(screen.getByText('Carte cliquable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supporte la navigation clavier', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Card onClick={handleClick}>Carte cliquable</Card>);
      
      const card = screen.getByRole('button');
      card.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('a le bon rôle quand cliquable', () => {
      render(<Card onClick={() => {}}>Carte cliquable</Card>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('affiche l\'état sélectionné', () => {
      const { container } = render(
        <Card selected>Carte sélectionnée</Card>
      );
      
      expect(container.firstChild).toHaveClass('ring-2', 'ring-primary-500');
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <Card>
          <CardHeader title="Titre" subtitle="Sous-titre" />
          <CardBody>Contenu de la carte</CardBody>
        </Card>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('n\'a pas de violations avec interaction', async () => {
      const { container } = render(
        <Card onClick={() => {}}>
          Carte interactive
        </Card>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('CardHeader Component', () => {
  it('rend le titre et sous-titre', () => {
    render(
      <CardHeader 
        title="Titre principal" 
        subtitle="Sous-titre descriptif"
      />
    );
    
    expect(screen.getByText('Titre principal')).toBeInTheDocument();
    expect(screen.getByText('Sous-titre descriptif')).toBeInTheDocument();
  });

  it('affiche l\'icône', () => {
    render(
      <CardHeader 
        title="Avec icône"
        icon={<UserIcon data-testid="header-icon" />}
      />
    );
    
    expect(screen.getByTestId('header-icon')).toBeInTheDocument();
  });

  it('affiche l\'action', () => {
    render(
      <CardHeader 
        title="Avec action"
        action={<Button>Action</Button>}
      />
    );
    
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('affiche l\'avatar', () => {
    render(
      <CardHeader 
        title="Avec avatar"
        avatar={<div data-testid="avatar">Avatar</div>}
      />
    );
    
    expect(screen.getByTestId('avatar')).toBeInTheDocument();
  });

  it('applique les classes personnalisées', () => {
    render(
      <CardHeader 
        title="Titre"
        titleClassName="custom-title"
        subtitleClassName="custom-subtitle"
        subtitle="Sous-titre"
      />
    );
    
    expect(screen.getByText('Titre')).toHaveClass('custom-title');
    expect(screen.getByText('Sous-titre')).toHaveClass('custom-subtitle');
  });
});

describe('CardBody Component', () => {
  it('rend le contenu', () => {
    render(
      <CardBody>
        Contenu du corps de carte
      </CardBody>
    );
    
    expect(screen.getByText('Contenu du corps de carte')).toBeInTheDocument();
  });

  it('applique l\'espacement correct', () => {
    const { container } = render(
      <CardBody spacing="lg">
        Contenu avec grand espacement
      </CardBody>
    );
    
    expect(container.firstChild).toHaveClass('mb-6');
  });
});

describe('CardFooter Component', () => {
  it('rend le contenu du pied de page', () => {
    render(
      <CardFooter>
        Pied de page
      </CardFooter>
    );
    
    expect(screen.getByText('Pied de page')).toBeInTheDocument();
  });

  it('applique l\'alignement correct', () => {
    const { container } = render(
      <CardFooter align="center">
        Contenu centré
      </CardFooter>
    );
    
    expect(container.firstChild).toHaveClass('justify-center');
  });

  it('a la bordure supérieure', () => {
    const { container } = render(
      <CardFooter>Contenu</CardFooter>
    );
    
    expect(container.firstChild).toHaveClass('border-t');
  });
});

describe('CardActions Component', () => {
  it('rend les actions horizontalement par défaut', () => {
    const { container } = render(
      <CardActions>
        <Button>Action 1</Button>
        <Button>Action 2</Button>
      </CardActions>
    );
    
    expect(container.firstChild).toHaveClass('flex-row');
  });

  it('rend les actions verticalement', () => {
    const { container } = render(
      <CardActions orientation="vertical">
        <Button>Action 1</Button>
        <Button>Action 2</Button>
      </CardActions>
    );
    
    expect(container.firstChild).toHaveClass('flex-col');
  });

  it('applique l\'espacement correct', () => {
    const { container } = render(
      <CardActions spacing="lg">
        <Button>Action</Button>
      </CardActions>
    );
    
    expect(container.firstChild).toHaveClass('gap-4');
  });
});

describe('CardImage Component', () => {
  it('rend l\'image avec les attributs corrects', () => {
    render(
      <CardImage 
        src="/test-image.jpg"
        alt="Image de test"
      />
    );
    
    const image = screen.getByAltText('Image de test');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/test-image.jpg');
  });

  it('applique le ratio d\'aspect correct', () => {
    const { container } = render(
      <CardImage 
        src="/test.jpg"
        alt="Test"
        aspectRatio="square"
      />
    );
    
    expect(container.firstChild).toHaveClass('aspect-square');
  });

  it('applique la position correcte', () => {
    const { container } = render(
      <CardImage 
        src="/test.jpg"
        alt="Test"
        position="bottom"
      />
    );
    
    expect(container.firstChild).toHaveClass('rounded-b-lg');
  });
});

describe('StatCard Component', () => {
  it('rend les statistiques de base', () => {
    render(
      <StatCard
        title="Utilisateurs actifs"
        value="1,247"
      />
    );
    
    expect(screen.getByText('Utilisateurs actifs')).toBeInTheDocument();
    expect(screen.getByText('1,247')).toBeInTheDocument();
  });

  it('affiche le changement avec couleur appropriée', () => {
    render(
      <StatCard
        title="Revenus"
        value="125,000 FCFA"
        change={{
          value: 12.5,
          type: 'increase',
          period: 'vs mois dernier'
        }}
      />
    );
    
    expect(screen.getByText('+12.5%')).toBeInTheDocument();
    expect(screen.getByText('vs mois dernier')).toBeInTheDocument();
    expect(screen.getByText('+12.5%')).toHaveClass('text-success-600');
  });

  it('affiche l\'icône', () => {
    render(
      <StatCard
        title="Statistique"
        value="100"
        icon={<UserIcon data-testid="stat-icon" />}
      />
    );
    
    expect(screen.getByTestId('stat-icon')).toBeInTheDocument();
  });

  it('affiche la description', () => {
    render(
      <StatCard
        title="Statistique"
        value="100"
        description="Description de la statistique"
      />
    );
    
    expect(screen.getByText('Description de la statistique')).toBeInTheDocument();
  });
});

describe('InfoCard Component', () => {
  it('rend les informations de base', () => {
    render(
      <InfoCard
        title="Information importante"
        content="Contenu de l'information"
      />
    );
    
    expect(screen.getByText('Information importante')).toBeInTheDocument();
    expect(screen.getByText('Contenu de l\'information')).toBeInTheDocument();
  });

  it('applique le type correct', () => {
    const { container } = render(
      <InfoCard
        title="Avertissement"
        content="Message d'avertissement"
        type="warning"
      />
    );
    
    expect(container.firstChild?.firstChild).toHaveClass('border-warning-200');
  });

  it('affiche l\'icône avec la couleur appropriée', () => {
    render(
      <InfoCard
        title="Erreur"
        content="Message d'erreur"
        type="error"
        icon={<ExclamationTriangleIcon data-testid="error-icon" />}
      />
    );
    
    const icon = screen.getByTestId('error-icon');
    expect(icon.parentElement).toHaveClass('text-danger-600');
  });

  it('affiche l\'action', () => {
    render(
      <InfoCard
        title="Info"
        content="Contenu"
        action={<Button size="sm">Action</Button>}
      />
    );
    
    expect(screen.getByText('Action')).toBeInTheDocument();
  });

  it('utilise le mode compact', () => {
    render(
      <InfoCard
        title="Info compacte"
        content="Contenu compact"
        compact
      />
    );
    
    expect(screen.getByText('Info compacte')).toHaveClass('text-sm');
  });
});

describe('ActionCard Component', () => {
  it('rend l\'action de base', () => {
    render(
      <ActionCard
        title="Action disponible"
        description="Description de l'action"
        primaryAction={<Button>Exécuter</Button>}
      />
    );
    
    expect(screen.getByText('Action disponible')).toBeInTheDocument();
    expect(screen.getByText('Description de l\'action')).toBeInTheDocument();
    expect(screen.getByText('Exécuter')).toBeInTheDocument();
  });

  it('affiche l\'icône', () => {
    render(
      <ActionCard
        title="Action"
        icon={<CogIcon data-testid="action-icon" />}
        primaryAction={<Button>Action</Button>}
      />
    );
    
    expect(screen.getByTestId('action-icon')).toBeInTheDocument();
  });

  it('affiche les actions secondaires', () => {
    render(
      <ActionCard
        title="Action"
        primaryAction={<Button>Principal</Button>}
        secondaryActions={[
          <Button key="1" variant="outline">Secondaire 1</Button>,
          <Button key="2" variant="outline">Secondaire 2</Button>
        ]}
      />
    );
    
    expect(screen.getByText('Secondaire 1')).toBeInTheDocument();
    expect(screen.getByText('Secondaire 2')).toBeInTheDocument();
  });

  it('affiche l\'état de chargement', () => {
    const { container } = render(
      <ActionCard
        title="Action"
        primaryAction={<Button>Action</Button>}
        loading
      />
    );
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('applique l\'état désactivé', () => {
    const { container } = render(
      <ActionCard
        title="Action"
        primaryAction={<Button>Action</Button>}
        disabled
      />
    );
    
    expect(container.firstChild?.firstChild).toHaveClass('opacity-50');
  });
});

// Tests d'intégration
describe('Intégration Card', () => {
  it('fonctionne avec tous les composants ensemble', () => {
    render(
      <Card variant="elevated" size="lg">
        <CardHeader
          title="Carte complète"
          subtitle="Avec tous les composants"
          icon={<UserIcon className="h-5 w-5" />}
          action={<Button size="sm">Action</Button>}
        />
        
        <CardBody>
          <p>Contenu principal de la carte avec du texte.</p>
        </CardBody>
        
        <CardFooter>
          <CardActions>
            <Button variant="outline">Annuler</Button>
            <Button>Confirmer</Button>
          </CardActions>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Carte complète')).toBeInTheDocument();
    expect(screen.getByText('Avec tous les composants')).toBeInTheDocument();
    expect(screen.getByText('Contenu principal de la carte avec du texte.')).toBeInTheDocument();
    expect(screen.getByText('Annuler')).toBeInTheDocument();
    expect(screen.getByText('Confirmer')).toBeInTheDocument();
  });

  it('combine StatCard avec interaction', async () => {
    const handleClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <StatCard
        title="Statistique cliquable"
        value="100"
        onClick={handleClick}
        change={{
          value: 10,
          type: 'increase'
        }}
      />
    );
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// Tests de performance
describe('Performance Card', () => {
  it('ne re-rend pas inutilement', () => {
    const renderSpy = jest.fn();
    
    const TestCard = React.memo(() => {
      renderSpy();
      return <Card>Test performance</Card>;
    });
    
    const { rerender } = render(<TestCard />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    rerender(<TestCard />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Pas de re-render
  });

  it('gère efficacement les cartes complexes', () => {
    const startTime = performance.now();
    
    render(
      <Card>
        <CardHeader
          title="Carte complexe"
          subtitle="Avec beaucoup de contenu"
          icon={<UserIcon />}
          action={<Button>Action</Button>}
        />
        <CardBody>
          {Array.from({ length: 100 }, (_, i) => (
            <p key={i}>Ligne de contenu {i}</p>
          ))}
        </CardBody>
        <CardFooter>
          <CardActions>
            {Array.from({ length: 5 }, (_, i) => (
              <Button key={i}>Action {i}</Button>
            ))}
          </CardActions>
        </CardFooter>
      </Card>
    );
    
    const endTime = performance.now();
    expect(endTime - startTime).toBeLessThan(100); // Moins de 100ms
  });
});
