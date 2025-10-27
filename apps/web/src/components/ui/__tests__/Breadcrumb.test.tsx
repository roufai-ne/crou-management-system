/**
 * FICHIER: apps\web\src\components\ui\__tests__\Breadcrumb.test.tsx
 * TESTS: Tests unitaires pour le composant Breadcrumb
 * 
 * DESCRIPTION:
 * Tests complets du composant Breadcrumb avec gestion du débordement
 * Couvre la navigation, les séparateurs et l'accessibilité
 * Tests du hook useBreadcrumb et du skeleton
 * 
 * COVERAGE:
 * - Breadcrumb de base avec éléments et séparateurs
 * - Gestion du débordement avec menu déroulant
 * - Navigation et callbacks de clic
 * - Séparateurs personnalisables
 * - États actifs et désactivés
 * - Accessibilité et navigation clavier
 * - BreadcrumbSkeleton pour chargement
 * - Hook useBreadcrumb pour gestion d'état
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { renderHook, act } from '@testing-library/react';
import { 
  HomeIcon, 
  UserIcon, 
  CogIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { Breadcrumb, BreadcrumbSkeleton, useBreadcrumb } from '../Breadcrumb';
import type { BreadcrumbProps, BreadcrumbItem } from '../Breadcrumb';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Données de test
const mockItems: BreadcrumbItem[] = [
  { label: 'Accueil', href: '/', icon: <HomeIcon className="h-4 w-4" /> },
  { label: 'Étudiants', href: '/students', icon: <UserIcon className="h-4 w-4" /> },
  { label: 'Profils', href: '/students/profiles' },
  { label: 'Marie Dupont', href: '/students/profiles/123' },
  { label: 'Modifier' } // Dernier élément sans href (page actuelle)
];

const shortItems: BreadcrumbItem[] = [
  { label: 'Accueil', href: '/' },
  { label: 'Paramètres', href: '/settings' },
  { label: 'Profil' }
];

// Props par défaut pour les tests
const defaultProps: BreadcrumbProps = {
  items: shortItems
};

describe('Breadcrumb Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec les éléments', () => {
      render(<Breadcrumb {...defaultProps} />);
      
      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Paramètres')).toBeInTheDocument();
      expect(screen.getByText('Profil')).toBeInTheDocument();
    });

    it('a le bon rôle de navigation', () => {
      render(<Breadcrumb {...defaultProps} />);
      
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('utilise le label ARIA par défaut', () => {
      render(<Breadcrumb {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Fil d\'Ariane');
    });

    it('utilise un label ARIA personnalisé', () => {
      render(<Breadcrumb {...defaultProps} ariaLabel="Navigation personnalisée" />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Navigation personnalisée');
    });
  });

  // Tests des séparateurs
  describe('Séparateurs', () => {
    it('affiche les séparateurs chevron par défaut', () => {
      const { container } = render(<Breadcrumb {...defaultProps} />);
      
      const separators = container.querySelectorAll('svg');
      expect(separators.length).toBeGreaterThan(0);
    });

    it('utilise le séparateur slash', () => {
      render(<Breadcrumb {...defaultProps} separator="slash" />);
      
      expect(screen.getByText('/')).toBeInTheDocument();
    });

    it('utilise le séparateur arrow', () => {
      render(<Breadcrumb {...defaultProps} separator="arrow" />);
      
      expect(screen.getByText('→')).toBeInTheDocument();
    });

    it('utilise un séparateur personnalisé', () => {
      render(
        <Breadcrumb 
          {...defaultProps} 
          separator="custom"
          customSeparator={<span data-testid="custom-sep">|</span>}
        />
      );
      
      expect(screen.getByTestId('custom-sep')).toBeInTheDocument();
    });

    it('cache les séparateurs des lecteurs d\\'écran', () => {
      const { container } = render(<Breadcrumb {...defaultProps} />);
      
      const separators = container.querySelectorAll('[aria-hidden="true"]');
      expect(separators.length).toBeGreaterThan(0);
    });
  });

  // Tests des icônes
  describe('Icônes', () => {
    it('affiche les icônes des éléments', () => {
      render(<Breadcrumb items={mockItems} />);
      
      // Vérifier la présence des icônes (par leur classe ou test-id si disponible)
      const homeIcon = screen.getByText('Accueil').querySelector('svg');
      expect(homeIcon).toBeInTheDocument();
    });

    it('affiche l\\'icône home pour le premier élément', () => {
      render(<Breadcrumb items={shortItems} showHomeIcon />);
      
      const homeElement = screen.getByText('Accueil');
      const homeIcon = homeElement.querySelector('svg');
      expect(homeIcon).toBeInTheDocument();
    });

    it('n\\'affiche pas l\\'icône home si l\\'élément a déjà une icône', () => {
      render(<Breadcrumb items={mockItems} showHomeIcon />);
      
      // Le premier élément a déjà une icône, donc pas de duplication
      const homeElement = screen.getByText('Accueil');
      const icons = homeElement.querySelectorAll('svg');
      expect(icons.length).toBe(1); // Une seule icône
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`rend la taille ${size} correctement`, () => {
        const { container } = render(
          <Breadcrumb {...defaultProps} size={size} />
        );
        
        const nav = container.firstChild as HTMLElement;
        
        switch (size) {
          case 'sm':
            expect(nav).toHaveClass('text-xs');
            break;
          case 'md':
            expect(nav).toHaveClass('text-sm');
            break;
          case 'lg':
            expect(nav).toHaveClass('text-base');
            break;
        }
      });
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    const variants = ['default', 'primary', 'muted'] as const;

    variants.forEach((variant) => {
      it(`rend la variante ${variant} correctement`, () => {
        const { container } = render(
          <Breadcrumb {...defaultProps} variant={variant} />
        );
        
        expect(container.firstChild).toBeInTheDocument();
      });
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('appelle onItemClick quand un élément est cliqué', async () => {
      const handleItemClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Breadcrumb 
          {...defaultProps} 
          onItemClick={handleItemClick}
        />
      );
      
      await user.click(screen.getByText('Accueil'));
      
      expect(handleItemClick).toHaveBeenCalledWith(
        expect.objectContaining({ label: 'Accueil' }),
        0
      );
    });

    it('appelle le onClick personnalisé de l\\'élément', async () => {
      const customClick = jest.fn();
      const user = userEvent.setup();
      
      const itemsWithClick = [
        { label: 'Accueil', onClick: customClick },
        { label: 'Page actuelle' }
      ];
      
      render(<Breadcrumb items={itemsWithClick} />);
      
      await user.click(screen.getByText('Accueil'));
      expect(customClick).toHaveBeenCalledTimes(1);
    });

    it('supporte la navigation clavier', async () => {
      const handleItemClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Breadcrumb 
          {...defaultProps} 
          onItemClick={handleItemClick}
        />
      );
      
      const homeLink = screen.getByText('Accueil');
      homeLink.focus();
      
      await user.keyboard('{Enter}');
      expect(handleItemClick).toHaveBeenCalledTimes(1);
      
      await user.keyboard(' ');
      expect(handleItemClick).toHaveBeenCalledTimes(2);
    });

    it('ignore les clics sur les éléments désactivés', async () => {
      const handleItemClick = jest.fn();
      const user = userEvent.setup();
      
      const disabledItems = [
        { label: 'Accueil', href: '/' },
        { label: 'Désactivé', href: '/disabled', disabled: true },
        { label: 'Actuel' }
      ];
      
      render(
        <Breadcrumb 
          items={disabledItems} 
          onItemClick={handleItemClick}
        />
      );
      
      await user.click(screen.getByText('Désactivé'));
      expect(handleItemClick).not.toHaveBeenCalled();
    });
  });

  // Tests de gestion du débordement
  describe('Gestion du débordement', () => {
    it('affiche tous les éléments quand sous la limite', () => {
      render(<Breadcrumb items={shortItems} maxItems={5} />);
      
      expect(screen.getByText('Accueil')).toBeInTheDocument();
      expect(screen.getByText('Paramètres')).toBeInTheDocument();
      expect(screen.getByText('Profil')).toBeInTheDocument();
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('affiche le menu overflow quand nécessaire', () => {
      render(<Breadcrumb items={mockItems} maxItems={3} />);
      
      // Devrait afficher le bouton overflow
      const overflowButton = screen.getByRole('button', { name: /afficher les éléments cachés/i });
      expect(overflowButton).toBeInTheDocument();
    });

    it('ouvre et ferme le menu overflow', async () => {
      const user = userEvent.setup();
      
      render(<Breadcrumb items={mockItems} maxItems={3} />);
      
      const overflowButton = screen.getByRole('button', { name: /afficher les éléments cachés/i });
      
      // Ouvrir le menu
      await user.click(overflowButton);
      expect(overflowButton).toHaveAttribute('aria-expanded', 'true');
      
      // Vérifier que les éléments cachés sont visibles
      await waitFor(() => {
        expect(screen.getByText('Profils')).toBeInTheDocument();
      });
      
      // Fermer en cliquant à l'extérieur
      await user.click(document.body);
      await waitFor(() => {
        expect(screen.queryByText('Profils')).not.toBeInTheDocument();
      });
    });

    it('ferme le menu overflow après sélection', async () => {
      const handleItemClick = jest.fn();
      const user = userEvent.setup();
      
      render(
        <Breadcrumb 
          items={mockItems} 
          maxItems={3}
          onItemClick={handleItemClick}
        />
      );
      
      const overflowButton = screen.getByRole('button', { name: /afficher les éléments cachés/i });
      await user.click(overflowButton);
      
      await waitFor(() => {
        expect(screen.getByText('Profils')).toBeInTheDocument();
      });
      
      await user.click(screen.getByText('Profils'));
      
      expect(handleItemClick).toHaveBeenCalled();
      await waitFor(() => {
        expect(screen.queryByText('Profils')).not.toBeInTheDocument();
      });
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\\'a pas de violations d\\'accessibilité', async () => {
      const { container } = render(<Breadcrumb items={mockItems} />);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('marque correctement la page actuelle', () => {
      render(<Breadcrumb {...defaultProps} />);
      
      const currentPage = screen.getByText('Profil');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });

    it('a les bons attributs ARIA pour le menu overflow', async () => {
      const user = userEvent.setup();
      
      render(<Breadcrumb items={mockItems} maxItems={3} />);
      
      const overflowButton = screen.getByRole('button');
      expect(overflowButton).toHaveAttribute('aria-expanded', 'false');
      expect(overflowButton).toHaveAttribute('aria-haspopup', 'true');
      
      await user.click(overflowButton);
      expect(overflowButton).toHaveAttribute('aria-expanded', 'true');
    });

    it('a les bons tabIndex pour la navigation', () => {
      render(<Breadcrumb items={mockItems} />);
      
      const homeLink = screen.getByText('Accueil');
      expect(homeLink).toHaveAttribute('tabIndex', '0');
      
      const currentPage = screen.getByText('Modifier');
      expect(currentPage).toHaveAttribute('tabIndex', '-1');
    });
  });

  // Tests des liens
  describe('Liens', () => {
    it('rend les liens avec href', () => {
      render(<Breadcrumb {...defaultProps} />);
      
      const homeLink = screen.getByText('Accueil');
      expect(homeLink.tagName).toBe('A');
      expect(homeLink).toHaveAttribute('href', '/');
      
      const settingsLink = screen.getByText('Paramètres');
      expect(settingsLink.tagName).toBe('A');
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });

    it('rend les éléments sans href comme span', () => {
      render(<Breadcrumb {...defaultProps} />);
      
      const currentPage = screen.getByText('Profil');
      expect(currentPage.tagName).toBe('SPAN');
      expect(currentPage).not.toHaveAttribute('href');
    });

    it('empêche la navigation par défaut avec onClick personnalisé', async () => {
      const customClick = jest.fn();
      const user = userEvent.setup();
      
      const itemsWithCustomClick = [
        { label: 'Custom', href: '/custom', onClick: customClick },
        { label: 'Actuel' }
      ];
      
      render(<Breadcrumb items={itemsWithCustomClick} />);
      
      await user.click(screen.getByText('Custom'));
      expect(customClick).toHaveBeenCalledTimes(1);
    });
  });
});

describe('BreadcrumbSkeleton Component', () => {
  it('rend le skeleton avec le nombre d\\'éléments par défaut', () => {
    const { container } = render(<BreadcrumbSkeleton />);
    
    const skeletonItems = container.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBe(3); // Défaut
  });

  it('rend le skeleton avec un nombre personnalisé d\\'éléments', () => {
    const { container } = render(<BreadcrumbSkeleton items={5} />);
    
    const skeletonItems = container.querySelectorAll('.animate-pulse');
    expect(skeletonItems.length).toBe(5);
  });

  it('applique la taille correcte', () => {
    const { container } = render(<BreadcrumbSkeleton size="lg" />);
    
    const skeletonItems = container.querySelectorAll('.h-5');
    expect(skeletonItems.length).toBeGreaterThan(0);
  });

  it('a le bon label ARIA', () => {
    render(<BreadcrumbSkeleton />);
    
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Chargement du fil d\'Ariane');
  });
});

describe('useBreadcrumb Hook', () => {
  it('initialise avec les éléments de base', () => {
    const { result } = renderHook(() => 
      useBreadcrumb({ baseItems: shortItems })
    );
    
    expect(result.current.items).toEqual(shortItems);
  });

  it('met à jour les éléments', () => {
    const { result } = renderHook(() => useBreadcrumb());
    
    const newItems = [{ label: 'Nouveau', href: '/new' }];
    
    act(() => {
      result.current.updateItems(newItems);
    });
    
    expect(result.current.items).toEqual(newItems);
  });

  it('ajoute un élément', () => {
    const { result } = renderHook(() => 
      useBreadcrumb({ baseItems: shortItems })
    );
    
    const newItem = { label: 'Nouveau', href: '/new' };
    
    act(() => {
      result.current.addItem(newItem);
    });
    
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[3]).toEqual(newItem);
  });

  it('supprime un élément', () => {
    const { result } = renderHook(() => 
      useBreadcrumb({ baseItems: shortItems })
    );
    
    act(() => {
      result.current.removeItem(1); // Supprimer 'Paramètres'
    });
    
    expect(result.current.items).toHaveLength(2);
    expect(result.current.items.find(item => item.label === 'Paramètres')).toBeUndefined();
  });

  it('construit depuis un pathname', () => {
    const { result } = renderHook(() => useBreadcrumb());
    
    act(() => {
      result.current.buildFromPath('/students/profiles/123');
    });
    
    expect(result.current.items).toHaveLength(4);
    expect(result.current.items[0].label).toBe('Accueil');
    expect(result.current.items[1].label).toBe('Students');
    expect(result.current.items[2].label).toBe('Profiles');
    expect(result.current.items[3].label).toBe('123');
  });

  it('utilise un pathMap pour les labels', () => {
    const { result } = renderHook(() => useBreadcrumb());
    
    const pathMap = {
      'students': 'Étudiants',
      'profiles': 'Profils'
    };
    
    act(() => {
      result.current.buildFromPath('/students/profiles', pathMap);
    });
    
    expect(result.current.items[1].label).toBe('Étudiants');
    expect(result.current.items[2].label).toBe('Profils');
  });

  it('utilise une fonction de construction personnalisée', () => {
    const buildItems = (pathname: string) => [
      { label: 'Custom Home', href: '/' },
      { label: `Page: ${pathname}` }
    ];
    
    const { result } = renderHook(() => 
      useBreadcrumb({ buildItems })
    );
    
    act(() => {
      result.current.buildFromPath('/test');
    });
    
    expect(result.current.items[0].label).toBe('Custom Home');
    expect(result.current.items[1].label).toBe('Page: /test');
  });
});

// Tests d'intégration
describe('Intégration Breadcrumb', () => {
  it('fonctionne avec tous les props ensemble', async () => {
    const handleItemClick = jest.fn();
    const user = userEvent.setup();
    
    render(
      <Breadcrumb
        items={mockItems}
        maxItems={3}
        separator="slash"
        showHomeIcon
        size="lg"
        variant="primary"
        onItemClick={handleItemClick}
        className="custom-breadcrumb"
        ariaLabel="Navigation personnalisée"
      />
    );
    
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Navigation personnalisée');
    expect(screen.getByText('/')).toBeInTheDocument();
    
    // Tester l'overflow
    const overflowButton = screen.getByRole('button');
    await user.click(overflowButton);
    
    await waitFor(() => {
      expect(screen.getByText('Profils')).toBeInTheDocument();
    });
  });
});

// Tests de performance
describe('Performance Breadcrumb', () => {
  it('ne re-rend pas inutilement', () => {
    const renderSpy = jest.fn();
    
    const TestBreadcrumb = React.memo(() => {
      renderSpy();
      return <Breadcrumb {...defaultProps} />;
    });
    
    const { rerender } = render(<TestBreadcrumb />);
    expect(renderSpy).toHaveBeenCalledTimes(1);
    
    rerender(<TestBreadcrumb />);
    expect(renderSpy).toHaveBeenCalledTimes(1); // Pas de re-render
  });

  it('gère efficacement les longs breadcrumbs', () => {
    const longItems = Array.from({ length: 20 }, (_, i) => ({
      label: `Niveau ${i + 1}`,
      href: `/level-${i + 1}`
    }));
    
    const startTime = performance.now();
    render(<Breadcrumb items={longItems} maxItems={5} />);
    const endTime = performance.now();
    
    expect(endTime - startTime).toBeLessThan(50); // Moins de 50ms
  });
});
