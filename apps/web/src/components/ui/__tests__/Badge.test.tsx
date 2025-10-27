/**
 * FICHIER: apps\web\src\components\ui\__tests__\Badge.test.tsx
 * TESTS: Tests unitaires pour le composant Badge
 * 
 * DESCRIPTION:
 * Tests complets du composant Badge avec toutes ses variantes
 * Couvre les badges de statut, étudiants et workflow
 * Tests d'accessibilité et d'interaction
 * 
 * COVERAGE:
 * - Badge de base avec variantes et tailles
 * - StatusBadge avec statuts prédéfinis
 * - StudentStatusBadge pour statuts étudiants
 * - WorkflowStatusBadge avec progression
 * - BadgeGroup pour organisation multiple
 * - Interactions et accessibilité
 * - Points d'indication et animations
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CheckIcon, XMarkIcon, UserIcon } from '@heroicons/react/24/outline';
import { 
  Badge, 
  StatusBadge, 
  StudentStatusBadge, 
  WorkflowStatusBadge, 
  BadgeGroup 
} from '../Badge';
import type { BadgeProps } from '../Badge';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Props par défaut pour les tests
const defaultProps: BadgeProps = {
  children: 'Badge test'
};

describe('Badge Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec le contenu', () => {
      render(<Badge {...defaultProps} />);
      expect(screen.getByText('Badge test')).toBeInTheDocument();
    });

    it('applique les classes par défaut', () => {
      const { container } = render(<Badge {...defaultProps} />);
      const badge = container.firstChild as HTMLElement;
      
      expect(badge).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('accepte les props HTML standard', () => {
      render(<Badge {...defaultProps} data-testid="custom-badge" />);
      expect(screen.getByTestId('custom-badge')).toBeInTheDocument();
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    const variants = ['primary', 'secondary', 'success', 'warning', 'danger', 'gray', 'info'] as const;

    variants.forEach((variant) => {
      it(`rend la variante ${variant} correctement`, () => {
        const { container } = render(
          <Badge variant={variant} style="filled">
            {variant}
          </Badge>
        );
        
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  // Tests des styles
  describe('Styles', () => {
    const styles = ['filled', 'outline', 'soft'] as const;

    styles.forEach((style) => {
      it(`rend le style ${style} correctement`, () => {
        const { container } = render(
          <Badge style={style} variant="primary">
            {style}
          </Badge>
        );
        
        const badge = container.firstChild as HTMLElement;
        
        if (style === 'outline') {
          expect(badge).toHaveClass('border', 'bg-transparent');
        }
      });
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['xs', 'sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`rend la taille ${size} correctement`, () => {
        const { container } = render(
          <Badge size={size}>
            {size}
          </Badge>
        );
        
        const badge = container.firstChild as HTMLElement;
        expect(badge).toHaveClass('rounded-full');
        
        // Vérifier les classes spécifiques à la taille
        switch (size) {
          case 'xs':
            expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
            break;
          case 'sm':
            expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-xs');
            break;
          case 'md':
            expect(badge).toHaveClass('px-3', 'py-1', 'text-sm');
            break;
          case 'lg':
            expect(badge).toHaveClass('px-4', 'py-1.5', 'text-sm');
            break;
        }
      });
    });
  });

  // Tests des icônes
  describe('Icônes', () => {
    it('affiche l\'icône à gauche', () => {
      render(
        <Badge leftIcon={<CheckIcon data-testid="left-icon" />}>
          Avec icône gauche
        </Badge>
      );
      
      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByText('Avec icône gauche')).toBeInTheDocument();
    });

    it('affiche l\'icône à droite', () => {
      render(
        <Badge rightIcon={<XMarkIcon data-testid="right-icon" />}>
          Avec icône droite
        </Badge>
      );
      
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
      expect(screen.getByText('Avec icône droite')).toBeInTheDocument();
    });

    it('affiche seulement l\'icône', () => {
      render(
        <Badge iconOnly={<UserIcon data-testid="icon-only" />} />
      );
      
      expect(screen.getByTestId('icon-only')).toBeInTheDocument();
      expect(screen.queryByText('Badge test')).not.toBeInTheDocument();
    });

    it('gère les icônes avec différentes tailles', () => {
      const { container } = render(
        <Badge leftIcon={<CheckIcon />} size="lg">
          Grande taille
        </Badge>
      );
      
      const iconContainer = container.querySelector('span span');
      expect(iconContainer).toHaveClass('mr-2'); // Espacement pour lg
    });
  });

  // Tests du point d'indication
  describe('Point d\'indication', () => {
    it('affiche le point d\'indication', () => {
      const { container } = render(
        <Badge dot>
          Avec point
        </Badge>
      );
      
      const dot = container.querySelector('.absolute');
      expect(dot).toBeInTheDocument();
      expect(dot).toHaveClass('h-2', 'w-2', 'rounded-full');
    });

    it('applique la couleur du point', () => {
      const { container } = render(
        <Badge dot dotColor="success">
          Point vert
        </Badge>
      );
      
      const dot = container.querySelector('.absolute');
      expect(dot).toHaveClass('bg-success-500');
    });

    it('anime le point avec pulse', () => {
      const { container } = render(
        <Badge dot pulse>
          Point animé
        </Badge>
      );
      
      const dot = container.querySelector('.absolute');
      expect(dot).toHaveClass('animate-ping');
    });
  });

  // Tests du compteur
  describe('Compteur', () => {
    it('affiche le compteur', () => {
      render(<Badge count={5} />);
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('limite le compteur au maximum', () => {
      render(<Badge count={150} maxCount={99} />);
      expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('affiche zéro', () => {
      render(<Badge count={0} />);
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('utilise un maxCount personnalisé', () => {
      render(<Badge count={25} maxCount={20} />);
      expect(screen.getByText('20+')).toBeInTheDocument();
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('appelle onClick quand cliqué', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Badge onClick={handleClick}>Cliquable</Badge>);
      
      await user.click(screen.getByText('Cliquable'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('supporte la navigation clavier', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Badge onClick={handleClick}>Cliquable</Badge>);
      
      const badge = screen.getByRole('button');
      badge.focus();
      
      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it('a le bon rôle quand cliquable', () => {
      render(<Badge onClick={() => {}}>Cliquable</Badge>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('a le bon tabIndex quand cliquable', () => {
      render(<Badge onClick={() => {}}>Cliquable</Badge>);
      const badge = screen.getByRole('button');
      expect(badge).toHaveAttribute('tabIndex', '0');
    });

    it('n\'est pas cliquable sans onClick', () => {
      render(<Badge>Non cliquable</Badge>);
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  // Tests d'animation
  describe('Animations', () => {
    it('applique l\'animation pulse', () => {
      const { container } = render(
        <Badge pulse>
          Badge animé
        </Badge>
      );
      
      expect(container.firstChild).toHaveClass('animate-pulse');
    });

    it('applique les classes interactives', () => {
      const { container } = render(
        <Badge onClick={() => {}}>
          Badge interactif
        </Badge>
      );
      
      expect(container.firstChild).toHaveClass('cursor-pointer', 'hover:scale-105');
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <Badge variant="primary" leftIcon={<CheckIcon />}>
          Badge accessible
        </Badge>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('n\'a pas de violations avec interaction', async () => {
      const { container } = render(
        <Badge onClick={() => {}} dot>
          Badge cliquable
        </Badge>
      );
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

describe('StatusBadge Component', () => {
  // Tests des statuts prédéfinis
  describe('Statuts prédéfinis', () => {
    const statuses = ['active', 'inactive', 'pending', 'approved', 'rejected', 'draft', 'published', 'archived'] as const;

    statuses.forEach((status) => {
      it(`rend le statut ${status} correctement`, () => {
        render(<StatusBadge status={status} />);
        
        // Vérifier que le badge est rendu
        const badge = screen.getByText(new RegExp(status, 'i'));
        expect(badge).toBeInTheDocument();
      });
    });
  });

  it('utilise un texte personnalisé', () => {
    render(<StatusBadge status="active" customText="En ligne" />);
    expect(screen.getByText('En ligne')).toBeInTheDocument();
  });

  it('applique les bonnes variantes de couleur', () => {
    const { container } = render(<StatusBadge status="active" />);
    expect(container.firstChild?.firstChild).toHaveClass('bg-success-100');
  });

  it('affiche le point pour les statuts appropriés', () => {
    const { container } = render(<StatusBadge status="pending" />);
    const dot = container.querySelector('.absolute');
    expect(dot).toBeInTheDocument();
  });
});

describe('StudentStatusBadge Component', () => {
  // Tests des statuts étudiants
  describe('Statuts étudiants', () => {
    const statuses = ['enrolled', 'graduated', 'suspended', 'transferred', 'dropout', 'exchange'] as const;

    statuses.forEach((status) => {
      it(`rend le statut étudiant ${status} correctement`, () => {
        render(<StudentStatusBadge status={status} />);
        
        // Vérifier que le badge est rendu avec le bon texte
        const badge = screen.getByText(new RegExp(status === 'enrolled' ? 'inscrit' : status, 'i'));
        expect(badge).toBeInTheDocument();
      });
    });
  });

  it('utilise un texte personnalisé pour étudiant', () => {
    render(<StudentStatusBadge status="enrolled" customText="Étudiant actif" />);
    expect(screen.getByText('Étudiant actif')).toBeInTheDocument();
  });
});

describe('WorkflowStatusBadge Component', () => {
  // Tests des statuts de workflow
  describe('Statuts de workflow', () => {
    const statuses = ['not_started', 'in_progress', 'review', 'approved', 'completed', 'cancelled', 'on_hold'] as const;

    statuses.forEach((status) => {
      it(`rend le statut workflow ${status} correctement`, () => {
        render(<WorkflowStatusBadge status={status} />);
        
        // Vérifier que le badge est rendu
        expect(screen.getByText(new RegExp('\\w+'))).toBeInTheDocument();
      });
    });
  });

  it('affiche la progression', () => {
    render(<WorkflowStatusBadge status="in_progress" progress={75} />);
    expect(screen.getByText('En cours (75%)')).toBeInTheDocument();
  });

  it('utilise un texte personnalisé avec progression', () => {
    render(
      <WorkflowStatusBadge 
        status="in_progress" 
        progress={50} 
        customText="Traitement en cours" 
      />
    );
    expect(screen.getByText('Traitement en cours (50%)')).toBeInTheDocument();
  });
});

describe('BadgeGroup Component', () => {
  const mockBadges = [
    { key: 'badge1', content: 'Premier' },
    { key: 'badge2', content: 'Deuxième' },
    { key: 'badge3', content: 'Troisième' },
    { key: 'badge4', content: 'Quatrième' }
  ];

  it('rend tous les badges', () => {
    render(<BadgeGroup badges={mockBadges} />);
    
    expect(screen.getByText('Premier')).toBeInTheDocument();
    expect(screen.getByText('Deuxième')).toBeInTheDocument();
    expect(screen.getByText('Troisième')).toBeInTheDocument();
    expect(screen.getByText('Quatrième')).toBeInTheDocument();
  });

  it('limite le nombre de badges visibles', () => {
    render(<BadgeGroup badges={mockBadges} maxVisible={2} />);
    
    expect(screen.getByText('Premier')).toBeInTheDocument();
    expect(screen.getByText('Deuxième')).toBeInTheDocument();
    expect(screen.queryByText('Troisième')).not.toBeInTheDocument();
    expect(screen.getByText('+2 autres')).toBeInTheDocument();
  });

  it('utilise un texte personnalisé pour les badges cachés', () => {
    render(
      <BadgeGroup 
        badges={mockBadges} 
        maxVisible={1} 
        moreText="et {count} de plus"
      />
    );
    
    expect(screen.getByText('et 3 de plus')).toBeInTheDocument();
  });

  it('applique l\'espacement correct', () => {
    const { container } = render(
      <BadgeGroup badges={mockBadges} spacing="lg" />
    );
    
    expect(container.firstChild).toHaveClass('gap-3');
  });

  it('applique les props aux badges individuels', () => {
    const badgesWithProps = [
      { 
        key: 'badge1', 
        content: 'Important', 
        props: { variant: 'danger' as const, size: 'lg' as const }
      }
    ];
    
    const { container } = render(<BadgeGroup badges={badgesWithProps} />);
    expect(container.querySelector('.bg-danger-100')).toBeInTheDocument();
  });
});

// Tests d'intégration
describe('Intégration Badge', () => {
  it('fonctionne avec tous les props ensemble', () => {
    render(
      <Badge
        variant="success"
        style="filled"
        size="lg"
        leftIcon={<CheckIcon />}
        dot
        dotColor="success"
        pulse
        onClick={() => console.log('clicked')}
      >
        Badge complet
      </Badge>
    );
    
    expect(screen.getByText('Badge complet')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('combine StatusBadge avec props personnalisées', () => {
    render(
      <StatusBadge 
        status="pending" 
        size="lg" 
        customText="En cours de validation"
      />
    );
    
    expect(screen.getByText('En cours de validation')).toBeInTheDocument();
  });
});

// Tests de performance
describe('Performance Badge', () => {
  it('ne re-rend pas inutilement', () => {
    const renderSpy = jest.fn();
    
    const TestBadge = React.memo(() => {
      renderSpy();
      return <Badge>Test performance</Badge>;
    });
    
    const { rerender } = render(<TestBadge />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    rerender(<TestBadge />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Pas de re-render
  });

  it('gère efficacement les groupes de badges', () => {
    const largeBadgeList = Array.from({ length: 100 }, (_, i) => ({
      key: `badge-${i}`,
      content: `Badge ${i}`
    }));
    
    const startTime = performance.now();
    render(<BadgeGroup badges={largeBadgeList} maxVisible={10} />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50); // Moins de 50ms
  });
});
