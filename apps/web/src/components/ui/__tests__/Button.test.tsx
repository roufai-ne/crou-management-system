/**
 * FICHIER: apps\web\src\components\ui\__tests__\Button.test.tsx
 * TESTS: Tests unitaires pour le composant Button
 * 
 * DESCRIPTION:
 * Tests complets du composant Button avec React Testing Library
 * Couvre toutes les variantes, tailles, états et interactions
 * Tests d'accessibilité et de performance
 * 
 * COVERAGE:
 * - Rendu de base et props
 * - Toutes les variantes (primary, secondary, success, danger, warning, outline, ghost)
 * - Toutes les tailles (xs, sm, md, lg, xl)
 * - États (loading, disabled, iconOnly, fullWidth)
 * - Interactions (click, keyboard)
 * - Accessibilité (ARIA, focus, screen reader)
 * - Icônes (leftIcon, rightIcon)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '../Button';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Mock des icônes pour les tests
const MockPlusIcon = () => <svg data-testid="plus-icon" />;
const MockTrashIcon = () => <svg data-testid="trash-icon" />;

describe('Button', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec le texte fourni', () => {
      render(<Button>Cliquer ici</Button>);
      expect(screen.getByRole('button', { name: 'Cliquer ici' })).toBeInTheDocument();
    });

    it('applique les classes par défaut', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
    });

    it('forward la ref correctement', () => {
      const ref = React.createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Test</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    const variants = ['primary', 'secondary', 'success', 'danger', 'warning', 'outline', 'ghost'] as const;

    variants.forEach((variant) => {
      it(`rend la variante ${variant} correctement`, () => {
        render(<Button variant={variant}>Test {variant}</Button>);
        const button = screen.getByRole('button');
        expect(button).toBeInTheDocument();
        
        // Vérification des classes spécifiques selon la variante
        switch (variant) {
          case 'primary':
            expect(button).toHaveClass('bg-primary-600', 'text-white');
            break;
          case 'secondary':
            expect(button).toHaveClass('bg-white', 'border', 'border-gray-300');
            break;
          case 'success':
            expect(button).toHaveClass('bg-success-600', 'text-white');
            break;
          case 'danger':
            expect(button).toHaveClass('bg-danger-600', 'text-white');
            break;
          case 'warning':
            expect(button).toHaveClass('bg-warning-500', 'text-white');
            break;
          case 'outline':
            expect(button).toHaveClass('bg-transparent', 'border');
            break;
          case 'ghost':
            expect(button).toHaveClass('bg-transparent');
            break;
        }
      });
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;

    sizes.forEach((size) => {
      it(`rend la taille ${size} correctement`, () => {
        render(<Button size={size}>Test {size}</Button>);
        const button = screen.getByRole('button');
        
        // Vérification des classes de hauteur selon la taille
        switch (size) {
          case 'xs':
            expect(button).toHaveClass('h-7');
            break;
          case 'sm':
            expect(button).toHaveClass('h-8');
            break;
          case 'md':
            expect(button).toHaveClass('h-10');
            break;
          case 'lg':
            expect(button).toHaveClass('h-11');
            break;
          case 'xl':
            expect(button).toHaveClass('h-12');
            break;
        }
      });
    });
  });

  // Tests des états
  describe('États', () => {
    it('gère l\'état disabled correctement', () => {
      render(<Button disabled>Bouton désactivé</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50', 'cursor-not-allowed');
    });

    it('gère l\'état loading correctement', () => {
      render(<Button loading>Chargement</Button>);
      const button = screen.getByRole('button');
      
      expect(button).toBeDisabled();
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('data-loading', 'true');
      
      // Vérification de la présence du spinner
      const spinner = button.querySelector('svg');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('désactive le bouton pendant le chargement', () => {
      const handleClick = jest.fn();
      render(<Button loading onClick={handleClick}>Chargement</Button>);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('gère fullWidth correctement', () => {
      render(<Button fullWidth>Pleine largeur</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });

    it('gère iconOnly correctement', () => {
      render(
        <Button iconOnly aria-label="Supprimer">
          <MockTrashIcon />
        </Button>
      );
      
      const button = screen.getByRole('button', { name: 'Supprimer' });
      expect(button).toHaveClass('aspect-square', 'p-0');
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
    });
  });

  // Tests des icônes
  describe('Icônes', () => {
    it('affiche l\'icône de gauche correctement', () => {
      render(
        <Button leftIcon={<MockPlusIcon />}>
          Ajouter
        </Button>
      );
      
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByText('Ajouter')).toBeInTheDocument();
    });

    it('affiche l\'icône de droite correctement', () => {
      render(
        <Button rightIcon={<MockTrashIcon />}>
          Supprimer
        </Button>
      );
      
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
      expect(screen.getByText('Supprimer')).toBeInTheDocument();
    });

    it('affiche les deux icônes correctement', () => {
      render(
        <Button leftIcon={<MockPlusIcon />} rightIcon={<MockTrashIcon />}>
          Action
        </Button>
      );
      
      expect(screen.getByTestId('plus-icon')).toBeInTheDocument();
      expect(screen.getByTestId('trash-icon')).toBeInTheDocument();
      expect(screen.getByText('Action')).toBeInTheDocument();
    });

    it('remplace l\'icône de gauche par le spinner pendant le chargement', () => {
      render(
        <Button leftIcon={<MockPlusIcon />} loading>
          Chargement
        </Button>
      );
      
      expect(screen.queryByTestId('plus-icon')).not.toBeInTheDocument();
      expect(screen.getByRole('button').querySelector('.animate-spin')).toBeInTheDocument();
    });

    it('masque l\'icône de droite pendant le chargement', () => {
      render(
        <Button rightIcon={<MockTrashIcon />} loading>
          Chargement
        </Button>
      );
      
      expect(screen.queryByTestId('trash-icon')).not.toBeInTheDocument();
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('appelle onClick quand cliqué', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Cliquer</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('appelle onClick avec Enter', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Cliquer</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('appelle onClick avec Space', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick}>Cliquer</Button>);
      
      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard(' ');
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('n\'appelle pas onClick quand désactivé', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onClick={handleClick} disabled>Désactivé</Button>);
      
      await user.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(<Button>Bouton accessible</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('a un rôle button correct', () => {
      render(<Button>Test</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('est focusable par défaut', () => {
      render(<Button>Test</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('n\'est pas focusable quand désactivé', () => {
      render(<Button disabled>Test</Button>);
      const button = screen.getByRole('button');
      button.focus();
      expect(button).not.toHaveFocus();
    });

    it('a aria-busy pendant le chargement', () => {
      render(<Button loading>Chargement</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('requiert aria-label pour iconOnly', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(
        <Button iconOnly>
          <MockTrashIcon />
        </Button>
      );
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Button: aria-label est requis pour les boutons iconOnly'
      );
      
      consoleSpy.mockRestore();
    });

    it('accepte aria-labelledby comme alternative à aria-label', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      render(
        <>
          <span id="button-label">Supprimer</span>
          <Button iconOnly aria-labelledby="button-label">
            <MockTrashIcon />
          </Button>
        </>
      );
      
      expect(consoleSpy).not.toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  // Tests de performance
  describe('Performance', () => {
    it('ne re-rend pas inutilement', () => {
      const renderSpy = jest.fn();
      
      const TestButton = React.memo(() => {
        renderSpy();
        return <Button>Test</Button>;
      });
      
      const { rerender } = render(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
      
      // Re-render avec les mêmes props
      rerender(<TestButton />);
      expect(renderSpy).toHaveBeenCalledTimes(1);
    });
  });

  // Tests de régression
  describe('Régression', () => {
    it('maintient les classes personnalisées', () => {
      render(<Button className="custom-class">Test</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('passe les props HTML natifs', () => {
      render(<Button data-testid="custom-button" title="Titre personnalisé">Test</Button>);
      const button = screen.getByTestId('custom-button');
      expect(button).toHaveAttribute('title', 'Titre personnalisé');
    });

    it('gère les événements personnalisés', async () => {
      const handleMouseEnter = jest.fn();
      const user = userEvent.setup();
      
      render(<Button onMouseEnter={handleMouseEnter}>Test</Button>);
      
      await user.hover(screen.getByRole('button'));
      expect(handleMouseEnter).toHaveBeenCalled();
    });
  });
});
