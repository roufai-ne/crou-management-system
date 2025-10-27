/**
 * FICHIER: apps\web\src\components\ui\__tests__\FormControls.test.tsx
 * TESTS: Tests unitaires pour les composants de contrôle de formulaire
 * 
 * DESCRIPTION:
 * Tests complets des composants Checkbox, Radio et Switch
 * Couvre toutes les variantes, états et interactions
 * Tests d'accessibilité et de validation
 * 
 * COVERAGE:
 * - Checkbox: états checked/unchecked/indeterminate, validation
 * - Radio: groupes, sélection exclusive, orientations
 * - Switch: états on/off, animations, icônes
 * - Accessibilité: ARIA, focus, keyboard navigation
 * - Interactions: clic, clavier, validation
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { Checkbox } from '../Checkbox';
import { RadioGroup } from '../Radio';
import { Switch } from '../Switch';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Options de test pour RadioGroup
const radioOptions = [
  { value: 'option1', label: 'Option 1', description: 'Description 1' },
  { value: 'option2', label: 'Option 2', description: 'Description 2' },
  { value: 'option3', label: 'Option 3', disabled: true },
  { value: 'option4', label: 'Option 4' }
];

describe('Checkbox Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec les props de base', () => {
      render(<Checkbox label="Case à cocher test" />);
      expect(screen.getByLabelText('Case à cocher test')).toBeInTheDocument();
    });

    it('affiche le label et la description', () => {
      render(
        <Checkbox 
          label="Accepter les conditions" 
          description="En cochant cette case, vous acceptez nos conditions d'utilisation"
        />
      );
      
      expect(screen.getByText('Accepter les conditions')).toBeInTheDocument();
      expect(screen.getByText(/En cochant cette case/)).toBeInTheDocument();
    });

    it('affiche l\'astérisque pour les champs requis', () => {
      render(<Checkbox label="Champ requis" required />);
      const label = screen.getByText('Champ requis');
      expect(label).toHaveClass('after:content-[\'*\']');
    });

    it('génère un ID unique si non fourni', () => {
      render(<Checkbox label="Test" />);
      const checkbox = screen.getByLabelText('Test');
      expect(checkbox).toHaveAttribute('id');
      expect(checkbox.id).toMatch(/^checkbox-/);
    });
  });

  // Tests des états
  describe('États', () => {
    it('gère l\'état coché correctement', () => {
      render(<Checkbox label="Test" checked />);
      const checkbox = screen.getByLabelText('Test');
      expect(checkbox).toBeChecked();
    });

    it('gère l\'état non coché correctement', () => {
      render(<Checkbox label="Test" checked={false} />);
      const checkbox = screen.getByLabelText('Test');
      expect(checkbox).not.toBeChecked();
    });

    it('gère l\'état indéterminé correctement', () => {
      render(<Checkbox label="Test" indeterminate />);
      const checkbox = screen.getByLabelText('Test') as HTMLInputElement;
      expect(checkbox.indeterminate).toBe(true);
    });

    it('gère l\'état désactivé correctement', () => {
      render(<Checkbox label="Test" disabled />);
      const checkbox = screen.getByLabelText('Test');
      expect(checkbox).toBeDisabled();
      
      const container = checkbox.closest('div');
      expect(container).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    const variants = ['default', 'filled', 'outline'] as const;

    variants.forEach((variant) => {
      it(`rend la variante ${variant} correctement`, () => {
        const { container } = render(<Checkbox label="Test" variant={variant} />);
        const checkboxElement = container.querySelector('[data-checked]');
        expect(checkboxElement).toBeInTheDocument();
      });
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`rend la taille ${size} correctement`, () => {
        const { container } = render(<Checkbox label="Test" size={size} />);
        const checkboxElement = container.querySelector('[data-checked]');
        
        switch (size) {
          case 'sm':
            expect(checkboxElement).toHaveClass('h-4', 'w-4');
            break;
          case 'md':
            expect(checkboxElement).toHaveClass('h-5', 'w-5');
            break;
          case 'lg':
            expect(checkboxElement).toHaveClass('h-6', 'w-6');
            break;
        }
      });
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('appelle onChange quand cliqué', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox label="Test" onChange={handleChange} />);
      
      await user.click(screen.getByLabelText('Test'));
      expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
    });

    it('bascule l\'état au clic', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox label="Test" checked={false} onChange={handleChange} />);
      
      await user.click(screen.getByLabelText('Test'));
      expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
    });

    it('supporte la navigation clavier', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox label="Test" onChange={handleChange} />);
      
      const container = screen.getByRole('checkbox');
      container.focus();
      await user.keyboard(' ');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('n\'appelle pas onChange quand désactivé', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Checkbox label="Test" disabled onChange={handleChange} />);
      
      await user.click(screen.getByLabelText('Test'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // Tests de validation
  describe('Validation', () => {
    it('affiche les messages d\'erreur', () => {
      render(<Checkbox label="Test" error="Cette case doit être cochée" />);
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Cette case doit être cochée');
    });

    it('affiche le texte d\'aide', () => {
      render(<Checkbox label="Test" helperText="Texte d'aide" />);
      expect(screen.getByText('Texte d\'aide')).toBeInTheDocument();
    });

    it('masque le texte d\'aide quand il y a une erreur', () => {
      render(<Checkbox label="Test" error="Erreur" helperText="Aide" />);
      expect(screen.queryByText('Aide')).not.toBeInTheDocument();
      expect(screen.getByText('Erreur')).toBeInTheDocument();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <Checkbox label="Case accessible" description="Description accessible" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('a le bon rôle ARIA', () => {
      render(<Checkbox label="Test" />);
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
    });

    it('associe correctement l\'erreur via aria-describedby', () => {
      render(<Checkbox label="Test" error="Erreur test" id="test-checkbox" />);
      const container = screen.getByRole('checkbox');
      expect(container).toHaveAttribute('aria-describedby', 'test-checkbox-error');
    });
  });
});

describe('RadioGroup Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec les options', () => {
      render(
        <RadioGroup
          options={radioOptions}
          name="test-radio"
          label="Groupe radio test"
        />
      );
      
      expect(screen.getByText('Groupe radio test')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 1')).toBeInTheDocument();
      expect(screen.getByLabelText('Option 2')).toBeInTheDocument();
    });

    it('affiche les descriptions des options', () => {
      render(
        <RadioGroup
          options={radioOptions}
          name="test-radio"
        />
      );
      
      expect(screen.getByText('Description 1')).toBeInTheDocument();
      expect(screen.getByText('Description 2')).toBeInTheDocument();
    });

    it('génère un nom unique si non fourni', () => {
      render(<RadioGroup options={radioOptions} />);
      
      const radios = screen.getAllByRole('radio');
      const firstName = radios[0].getAttribute('name');
      
      expect(firstName).toMatch(/^radio-group-/);
      
      // Tous les radios du groupe doivent avoir le même nom
      radios.forEach(radio => {
        expect(radio).toHaveAttribute('name', firstName);
      });
    });
  });

  // Tests de sélection
  describe('Sélection', () => {
    it('permet de sélectionner une option', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <RadioGroup
          options={radioOptions}
          onChange={handleChange}
          name="test-radio"
        />
      );
      
      await user.click(screen.getByLabelText('Option 1'));
      expect(handleChange).toHaveBeenCalledWith('option1');
    });

    it('affiche la valeur sélectionnée', () => {
      render(
        <RadioGroup
          options={radioOptions}
          value="option2"
          name="test-radio"
        />
      );
      
      const selectedRadio = screen.getByLabelText('Option 2');
      expect(selectedRadio).toBeChecked();
      
      const otherRadio = screen.getByLabelText('Option 1');
      expect(otherRadio).not.toBeChecked();
    });

    it('ne permet qu\'une seule sélection (exclusivité)', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <RadioGroup
          options={radioOptions}
          onChange={handleChange}
          name="test-radio"
        />
      );
      
      await user.click(screen.getByLabelText('Option 1'));
      expect(handleChange).toHaveBeenCalledWith('option1');
      
      await user.click(screen.getByLabelText('Option 2'));
      expect(handleChange).toHaveBeenCalledWith('option2');
      
      // Vérifier que seule la dernière option est sélectionnée
      expect(screen.getByLabelText('Option 2')).toBeChecked();
      expect(screen.getByLabelText('Option 1')).not.toBeChecked();
    });

    it('ne permet pas de sélectionner les options désactivées', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(
        <RadioGroup
          options={radioOptions}
          onChange={handleChange}
          name="test-radio"
        />
      );
      
      const disabledRadio = screen.getByLabelText('Option 3');
      expect(disabledRadio).toBeDisabled();
      
      await user.click(disabledRadio);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // Tests d'orientation
  describe('Orientations', () => {
    it('applique l\'orientation verticale par défaut', () => {
      const { container } = render(
        <RadioGroup options={radioOptions} name="test-radio" />
      );
      
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('space-y-3');
    });

    it('applique l\'orientation horizontale', () => {
      const { container } = render(
        <RadioGroup options={radioOptions} orientation="horizontal" name="test-radio" />
      );
      
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('flex', 'flex-wrap', 'gap-6');
    });

    it('applique l\'orientation en grille', () => {
      const { container } = render(
        <RadioGroup options={radioOptions} orientation="grid" name="test-radio" />
      );
      
      const group = container.querySelector('[role="radiogroup"]');
      expect(group).toHaveClass('grid', 'grid-cols-2', 'gap-3');
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <RadioGroup
          options={radioOptions}
          label="Groupe accessible"
          name="test-radio"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('a le bon rôle ARIA pour le groupe', () => {
      render(
        <RadioGroup
          options={radioOptions}
          label="Test groupe"
          name="test-radio"
        />
      );
      
      expect(screen.getByRole('radiogroup')).toBeInTheDocument();
    });

    it('supporte la navigation clavier dans le groupe', async () => {
      const user = userEvent.setup();
      
      render(
        <RadioGroup
          options={radioOptions}
          name="test-radio"
        />
      );
      
      const firstRadio = screen.getByLabelText('Option 1');
      firstRadio.focus();
      
      // Navigation avec les flèches
      await user.keyboard('{ArrowDown}');
      expect(screen.getByLabelText('Option 2')).toHaveFocus();
      
      await user.keyboard('{ArrowUp}');
      expect(screen.getByLabelText('Option 1')).toHaveFocus();
    });
  });
});

describe('Switch Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec les props de base', () => {
      render(<Switch label="Interrupteur test" />);
      expect(screen.getByLabelText('Interrupteur test')).toBeInTheDocument();
    });

    it('affiche le label et la description', () => {
      render(
        <Switch 
          label="Activer les notifications" 
          description="Recevoir des alertes par email"
        />
      );
      
      expect(screen.getByText('Activer les notifications')).toBeInTheDocument();
      expect(screen.getByText('Recevoir des alertes par email')).toBeInTheDocument();
    });

    it('génère un ID unique si non fourni', () => {
      render(<Switch label="Test" />);
      const switchElement = screen.getByLabelText('Test');
      expect(switchElement).toHaveAttribute('id');
      expect(switchElement.id).toMatch(/^switch-/);
    });
  });

  // Tests des états
  describe('États', () => {
    it('gère l\'état activé correctement', () => {
      render(<Switch label="Test" checked />);
      const switchElement = screen.getByLabelText('Test');
      expect(switchElement).toBeChecked();
      
      const switchRole = screen.getByRole('switch');
      expect(switchRole).toHaveAttribute('aria-checked', 'true');
    });

    it('gère l\'état désactivé correctement', () => {
      render(<Switch label="Test" checked={false} />);
      const switchElement = screen.getByLabelText('Test');
      expect(switchElement).not.toBeChecked();
      
      const switchRole = screen.getByRole('switch');
      expect(switchRole).toHaveAttribute('aria-checked', 'false');
    });

    it('gère l\'état de chargement correctement', () => {
      render(<Switch label="Test" loading />);
      
      const switchRole = screen.getByRole('switch');
      expect(switchRole).toHaveAttribute('aria-disabled', 'true');
      
      // Vérifier la présence du spinner
      const spinner = screen.getByRole('switch').querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('gère l\'état désactivé correctement', () => {
      render(<Switch label="Test" disabled />);
      
      const switchElement = screen.getByLabelText('Test');
      expect(switchElement).toBeDisabled();
      
      const container = switchElement.closest('div');
      expect(container).toHaveClass('opacity-50', 'cursor-not-allowed');
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    const variants = ['default', 'filled', 'outline'] as const;

    variants.forEach((variant) => {
      it(`rend la variante ${variant} correctement`, () => {
        const { container } = render(<Switch label="Test" variant={variant} />);
        const switchElement = container.querySelector('[data-checked]');
        expect(switchElement).toBeInTheDocument();
      });
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`rend la taille ${size} correctement`, () => {
        const { container } = render(<Switch label="Test" size={size} />);
        const switchElement = container.querySelector('[data-checked]');
        
        switch (size) {
          case 'sm':
            expect(switchElement).toHaveClass('h-5', 'w-9');
            break;
          case 'md':
            expect(switchElement).toHaveClass('h-6', 'w-11');
            break;
          case 'lg':
            expect(switchElement).toHaveClass('h-8', 'w-14');
            break;
        }
      });
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('appelle onChange quand cliqué', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Switch label="Test" onChange={handleChange} />);
      
      await user.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
    });

    it('bascule l\'état au clic', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Switch label="Test" checked={false} onChange={handleChange} />);
      
      await user.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledWith(true, expect.any(Object));
      
      // Simuler un deuxième clic
      render(<Switch label="Test" checked={true} onChange={handleChange} />);
      await user.click(screen.getByRole('switch'));
      expect(handleChange).toHaveBeenCalledWith(false, expect.any(Object));
    });

    it('supporte la navigation clavier', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Switch label="Test" onChange={handleChange} />);
      
      const switchRole = screen.getByRole('switch');
      switchRole.focus();
      await user.keyboard(' ');
      
      expect(handleChange).toHaveBeenCalled();
    });

    it('n\'appelle pas onChange pendant le chargement', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<Switch label="Test" loading onChange={handleChange} />);
      
      await user.click(screen.getByRole('switch'));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  // Tests des icônes
  describe('Icônes', () => {
    it('affiche les icônes on/off correctement', () => {
      const icons = {
        on: <CheckIcon data-testid="check-icon" />,
        off: <XMarkIcon data-testid="x-icon" />
      };
      
      const { rerender } = render(
        <Switch label="Test" checked={false} icons={icons} />
      );
      
      expect(screen.getByTestId('x-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('check-icon')).not.toBeInTheDocument();
      
      rerender(<Switch label="Test" checked={true} icons={icons} />);
      
      expect(screen.getByTestId('check-icon')).toBeInTheDocument();
      expect(screen.queryByTestId('x-icon')).not.toBeInTheDocument();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <Switch label="Switch accessible" description="Description accessible" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('a le bon rôle ARIA', () => {
      render(<Switch label="Test" />);
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    it('utilise aria-checked correctement', () => {
      const { rerender } = render(<Switch label="Test" checked={false} />);
      
      let switchRole = screen.getByRole('switch');
      expect(switchRole).toHaveAttribute('aria-checked', 'false');
      
      rerender(<Switch label="Test" checked={true} />);
      
      switchRole = screen.getByRole('switch');
      expect(switchRole).toHaveAttribute('aria-checked', 'true');
    });
  });
});
