/**
 * FICHIER: apps\web\src\components\ui\__tests__\Input.test.tsx
 * TESTS: Tests unitaires pour les composants Input
 * 
 * DESCRIPTION:
 * Tests complets des composants Input, CurrencyInput et DateInput
 * Couvre toutes les variantes, états et interactions
 * Tests d'accessibilité et de validation
 * 
 * COVERAGE:
 * - Input: variantes, tailles, états, icônes, validation
 * - CurrencyInput: formatage FCFA, validation montants
 * - DateInput: formatage français, validation dates
 * - Accessibilité: ARIA, focus, screen reader
 * - Interactions: saisie, validation, formatage
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { Input } from '../Input';
import { CurrencyInput } from '../CurrencyInput';
import { DateInput } from '../DateInput';

// Extension des matchers Jest pour l'accessibilité
expect.extend(toHaveNoViolations);

// Mock des icônes pour les tests
const MockEnvelopeIcon = () => <svg data-testid="envelope-icon" />;
const MockLockIcon = () => <svg data-testid="lock-icon" />;

describe('Input Component', () => {
  // Tests de rendu de base
  describe('Rendu de base', () => {
    it('rend correctement avec les props de base', () => {
      render(<Input placeholder="Saisir du texte" />);
      expect(screen.getByPlaceholderText('Saisir du texte')).toBeInTheDocument();
    });

    it('affiche le label quand fourni', () => {
      render(<Input label="Nom d'utilisateur" />);
      expect(screen.getByLabelText('Nom d\'utilisateur')).toBeInTheDocument();
    });

    it('affiche l\'astérisque pour les champs requis', () => {
      render(<Input label="Email" required />);
      const label = screen.getByText('Email');
      expect(label).toBeInTheDocument();
      // L'astérisque est ajoutée via CSS after
      expect(label).toHaveClass('after:content-[\'*\']');
    });

    it('génère un ID unique si non fourni', () => {
      render(<Input label="Test" />);
      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('id');
      expect(input.id).toMatch(/^input-/);
    });

    it('utilise l\'ID fourni', () => {
      render(<Input label="Test" id="custom-id" />);
      const input = screen.getByLabelText('Test');
      expect(input).toHaveAttribute('id', 'custom-id');
    });
  });

  // Tests des variantes
  describe('Variantes', () => {
    it('applique la variante default correctement', () => {
      const { container } = render(<Input variant="default" />);
      const inputContainer = container.querySelector('div[class*="border"]');
      expect(inputContainer).toHaveClass('bg-white');
    });

    it('applique la variante filled correctement', () => {
      const { container } = render(<Input variant="filled" />);
      const inputContainer = container.querySelector('div[class*="border"]');
      expect(inputContainer).toHaveClass('bg-gray-50');
    });

    it('applique la variante flushed correctement', () => {
      const { container } = render(<Input variant="flushed" />);
      const inputContainer = container.querySelector('div[class*="border"]');
      expect(inputContainer).toHaveClass('border-b', 'bg-transparent');
    });
  });

  // Tests des tailles
  describe('Tailles', () => {
    const sizes = ['sm', 'md', 'lg'] as const;

    sizes.forEach((size) => {
      it(`applique la taille ${size} correctement`, () => {
        const { container } = render(<Input size={size} />);
        const inputContainer = container.querySelector('div[class*="h-"]');
        
        switch (size) {
          case 'sm':
            expect(inputContainer).toHaveClass('h-8');
            break;
          case 'md':
            expect(inputContainer).toHaveClass('h-10');
            break;
          case 'lg':
            expect(inputContainer).toHaveClass('h-11');
            break;
        }
      });
    });
  });

  // Tests des états de validation
  describe('États de validation', () => {
    it('affiche l\'état d\'erreur correctement', () => {
      render(<Input error="Ce champ est requis" />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveTextContent('Ce champ est requis');
    });

    it('affiche le texte d\'aide quand pas d\'erreur', () => {
      render(<Input helperText="Texte d'aide" />);
      expect(screen.getByText('Texte d\'aide')).toBeInTheDocument();
    });

    it('masque le texte d\'aide quand il y a une erreur', () => {
      render(<Input error="Erreur" helperText="Texte d'aide" />);
      expect(screen.queryByText('Texte d\'aide')).not.toBeInTheDocument();
      expect(screen.getByText('Erreur')).toBeInTheDocument();
    });

    it('applique l\'état de validation success', () => {
      const { container } = render(<Input validationState="success" />);
      const inputContainer = container.querySelector('div[class*="border"]');
      expect(inputContainer).toHaveClass('border-success-500');
    });
  });

  // Tests des icônes
  describe('Icônes', () => {
    it('affiche l\'icône de gauche', () => {
      render(<Input leftIcon={<MockEnvelopeIcon />} />);
      expect(screen.getByTestId('envelope-icon')).toBeInTheDocument();
    });

    it('affiche l\'icône de droite', () => {
      render(<Input rightIcon={<MockLockIcon />} />);
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
    });

    it('affiche le spinner pendant le chargement', () => {
      render(<Input loading />);
      const spinner = screen.getByRole('textbox').parentElement?.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('gère le toggle password correctement', async () => {
      const user = userEvent.setup();
      render(<Input type="password" defaultValue="secret" />);
      
      const input = screen.getByDisplayValue('secret');
      expect(input).toHaveAttribute('type', 'password');
      
      const toggleButton = screen.getByLabelText('Afficher le mot de passe');
      await user.click(toggleButton);
      
      expect(input).toHaveAttribute('type', 'text');
      expect(screen.getByLabelText('Masquer le mot de passe')).toBeInTheDocument();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <Input label="Email" placeholder="nom@example.com" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('associe correctement le label à l\'input', () => {
      render(<Input label="Email" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('id', 'email-input');
    });

    it('associe l\'erreur à l\'input via aria-describedby', () => {
      render(<Input label="Email" error="Email invalide" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-describedby', 'email-input-error');
    });

    it('associe le texte d\'aide à l\'input via aria-describedby', () => {
      render(<Input label="Email" helperText="Format: nom@domaine.com" id="email-input" />);
      const input = screen.getByLabelText('Email');
      expect(input).toHaveAttribute('aria-describedby', 'email-input-helper');
    });
  });
});

describe('CurrencyInput Component', () => {
  // Tests de formatage FCFA
  describe('Formatage FCFA', () => {
    it('formate correctement les montants FCFA', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<CurrencyInput onValueChange={handleChange} />);
      const input = screen.getByRole('textbox');
      
      await user.type(input, '1500000');
      await user.tab(); // Déclencher le blur pour le formatage
      
      expect(handleChange).toHaveBeenCalledWith(1500000);
    });

    it('gère les séparateurs de milliers', async () => {
      const user = userEvent.setup();
      render(<CurrencyInput value={1500000} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('1 500 000 FCFA');
    });

    it('gère les décimales quand activées', async () => {
      const user = userEvent.setup();
      render(<CurrencyInput value={1500.50} decimals={2} />);
      
      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('1 500,50 FCFA');
    });

    it('valide les montants minimum et maximum', async () => {
      const user = userEvent.setup();
      render(<CurrencyInput min={1000} max={10000} />);
      
      const input = screen.getByRole('textbox');
      
      await user.type(input, '500');
      await user.tab();
      
      expect(screen.getByText(/Le montant minimum est/)).toBeInTheDocument();
    });
  });

  // Tests de validation
  describe('Validation', () => {
    it('rejette les montants négatifs par défaut', async () => {
      const user = userEvent.setup();
      render(<CurrencyInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '-1000');
      await user.tab();
      
      expect(screen.getByText('Le montant ne peut pas être négatif')).toBeInTheDocument();
    });

    it('accepte les montants négatifs si autorisé', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<CurrencyInput allowNegative onValueChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '-1000');
      
      expect(handleChange).toHaveBeenCalledWith(-1000);
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('sélectionne tout le texte au focus', async () => {
      const user = userEvent.setup();
      render(<CurrencyInput value={1500000} />);
      
      const input = screen.getByRole('textbox') as HTMLInputElement;
      await user.click(input);
      
      // Vérifier que le texte est sélectionné
      expect(input.selectionStart).toBe(0);
      expect(input.selectionEnd).toBe(input.value.length);
    });

    it('bloque les caractères non numériques', async () => {
      const user = userEvent.setup();
      render(<CurrencyInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'abc123def');
      
      // Seuls les chiffres devraient être acceptés
      expect(input).toHaveValue('123');
    });
  });
});

describe('DateInput Component', () => {
  // Tests de formatage français
  describe('Formatage français', () => {
    it('formate les dates au format DD/MM/YYYY', async () => {
      const user = userEvent.setup();
      render(<DateInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '15122024');
      
      expect(input).toHaveValue('15/12/2024');
    });

    it('formate les dates au format MM/YYYY', async () => {
      const user = userEvent.setup();
      render(<DateInput format="MM/YYYY" />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '122024');
      
      expect(input).toHaveValue('12/2024');
    });

    it('formate les dates au format YYYY', async () => {
      const user = userEvent.setup();
      render(<DateInput format="YYYY" />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '2024');
      
      expect(input).toHaveValue('2024');
    });
  });

  // Tests de validation
  describe('Validation', () => {
    it('valide les dates minimum et maximum', async () => {
      const user = userEvent.setup();
      const minDate = new Date(2024, 0, 1); // 1er janvier 2024
      const maxDate = new Date(2024, 11, 31); // 31 décembre 2024
      
      render(<DateInput minDate={minDate} maxDate={maxDate} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '01012023'); // 1er janvier 2023 (trop tôt)
      await user.tab();
      
      expect(screen.getByText(/La date doit être postérieure au/)).toBeInTheDocument();
    });

    it('valide le format de date', async () => {
      const handleChange = jest.fn();
      const user = userEvent.setup();
      
      render(<DateInput onValueChange={handleChange} />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, '32122024'); // 32 décembre (invalide)
      
      expect(handleChange).toHaveBeenCalledWith(null);
    });
  });

  // Tests d'interaction
  describe('Interactions', () => {
    it('bloque les caractères non numériques et non slash', async () => {
      const user = userEvent.setup();
      render(<DateInput />);
      
      const input = screen.getByRole('textbox');
      await user.type(input, 'abc15/12/2024def');
      
      expect(input).toHaveValue('15/12/2024');
    });

    it('gère le calendrier natif pour le format complet', () => {
      const { container } = render(<DateInput showCalendar />);
      const nativeInput = container.querySelector('input[type="date"]');
      expect(nativeInput).toBeInTheDocument();
    });
  });

  // Tests d'accessibilité
  describe('Accessibilité', () => {
    it('n\'a pas de violations d\'accessibilité', async () => {
      const { container } = render(
        <DateInput label="Date de naissance" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('utilise inputMode numeric pour les claviers mobiles', () => {
      render(<DateInput />);
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('inputMode', 'numeric');
    });
  });
});
