/**
 * FICHIER: apps\web\src\components\ui\Input.stories.tsx
 * STORYBOOK: Stories pour les composants Input
 * 
 * DESCRIPTION:
 * Documentation interactive des composants Input, CurrencyInput et DateInput
 * Présente toutes les variantes, états et exemples d'usage CROU
 * 
 * STORIES:
 * - Input: Composant de base avec toutes les variantes
 * - CurrencyInput: Saisie de montants FCFA
 * - DateInput: Saisie de dates françaises
 * - FormExamples: Exemples de formulaires complets
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { 
  EnvelopeIcon, 
  LockClosedIcon, 
  UserIcon,
  PhoneIcon,
  MagnifyingGlassIcon,
  BanknotesIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { Input } from './Input';
import { CurrencyInput } from './CurrencyInput';
import { DateInput } from './DateInput';

// Configuration Meta pour Input
const inputMeta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Le composant Input est un élément fondamental pour la saisie de données dans l'application CROU.
Il supporte plusieurs variantes, états de validation et fonctionnalités avancées.

## Fonctionnalités

- **3 variantes** : default, filled, flushed
- **3 tailles** : sm, md, lg
- **États de validation** : success, error, warning
- **Support des icônes** : leftIcon, rightIcon
- **Types spécialisés** : password avec toggle, email, tel, etc.
- **Accessibilité complète** : ARIA, labels, descriptions
- **États avancés** : loading, disabled

## Bonnes pratiques

- Toujours fournir un \`label\` pour l'accessibilité
- Utiliser \`required\` pour les champs obligatoires
- Fournir des messages d'erreur clairs et utiles
- Utiliser \`helperText\` pour guider l'utilisateur
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'flushed'],
      description: 'Variante visuelle de l\'input'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille de l\'input'
    },
    validationState: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning'],
      description: 'État de validation'
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement'
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé'
    },
    required: {
      control: 'boolean',
      description: 'Champ obligatoire'
    }
  }
};

export default inputMeta;
type InputStory = StoryObj<typeof Input>;

// Story par défaut
export const Default: InputStory = {
  args: {
    label: 'Nom d\'utilisateur',
    placeholder: 'Saisir votre nom'
  }
};

// Toutes les variantes
export const Variants: InputStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        variant="default"
        label="Variante Default"
        placeholder="Style par défaut"
      />
      <Input
        variant="filled"
        label="Variante Filled"
        placeholder="Fond coloré"
      />
      <Input
        variant="flushed"
        label="Variante Flushed"
        placeholder="Bordure inférieure"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Les trois variantes visuelles disponibles pour l\'Input.'
      }
    }
  }
};

// Toutes les tailles
export const Sizes: InputStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        size="sm"
        label="Taille Small"
        placeholder="Input petit"
      />
      <Input
        size="md"
        label="Taille Medium"
        placeholder="Input moyen (défaut)"
      />
      <Input
        size="lg"
        label="Taille Large"
        placeholder="Input grand"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Les trois tailles disponibles pour l\'Input.'
      }
    }
  }
};

// États de validation
export const ValidationStates: InputStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="État normal"
        placeholder="Saisie normale"
        validationState="default"
      />
      <Input
        label="État de succès"
        placeholder="Validation réussie"
        validationState="success"
        defaultValue="valeur@correcte.com"
      />
      <Input
        label="État d'erreur"
        placeholder="Erreur de validation"
        error="Ce champ est requis"
      />
      <Input
        label="État d'avertissement"
        placeholder="Avertissement"
        validationState="warning"
        helperText="Vérifiez cette valeur"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Les différents états de validation avec messages appropriés.'
      }
    }
  }
};

// Inputs avec icônes
export const WithIcons: InputStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Email"
        type="email"
        placeholder="nom@crou.gov.ne"
        leftIcon={<EnvelopeIcon className="h-5 w-5" />}
      />
      <Input
        label="Mot de passe"
        type="password"
        placeholder="Votre mot de passe"
        leftIcon={<LockClosedIcon className="h-5 w-5" />}
      />
      <Input
        label="Recherche"
        placeholder="Rechercher..."
        leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
        rightIcon={<UserIcon className="h-5 w-5" />}
      />
      <Input
        label="Téléphone"
        type="tel"
        placeholder="+227 XX XX XX XX"
        leftIcon={<PhoneIcon className="h-5 w-5" />}
        helperText="Format international recommandé"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Inputs avec icônes pour améliorer l\'expérience utilisateur.'
      }
    }
  }
};

// États spéciaux
export const SpecialStates: InputStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Chargement"
        placeholder="Validation en cours..."
        loading
      />
      <Input
        label="Désactivé"
        placeholder="Champ non modifiable"
        disabled
        defaultValue="Valeur fixe"
      />
      <Input
        label="Champ requis"
        placeholder="Obligatoire"
        required
        helperText="Ce champ doit être rempli"
      />
      <Input
        label="Avec aide"
        placeholder="Exemple de saisie"
        helperText="Texte d'aide pour guider l'utilisateur"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'États spéciaux : loading, disabled, required, avec aide.'
      }
    }
  }
};

// Configuration Meta pour CurrencyInput
const currencyMeta: Meta<typeof CurrencyInput> = {
  title: 'UI/CurrencyInput',
  component: CurrencyInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Le composant CurrencyInput est spécialisé pour la saisie de montants en FCFA.
Il formate automatiquement les valeurs avec les séparateurs français et valide les montants.

## Fonctionnalités

- **Formatage automatique FCFA** avec séparateurs d'espaces
- **Validation des montants** (min, max, négatifs)
- **Support des décimales** optionnelles
- **Callback numérique** pour faciliter l'intégration
- **Saisie intelligente** avec blocage des caractères invalides
        `
      }
    }
  },
  argTypes: {
    decimals: {
      control: { type: 'number', min: 0, max: 4 },
      description: 'Nombre de décimales'
    },
    allowNegative: {
      control: 'boolean',
      description: 'Autoriser les montants négatifs'
    },
    showCurrency: {
      control: 'boolean',
      description: 'Afficher le symbole FCFA'
    }
  }
};

// Stories pour CurrencyInput
export const CurrencyDefault: StoryObj<typeof CurrencyInput> = {
  ...currencyMeta,
  args: {
    label: 'Montant du budget',
    placeholder: '0'
  }
};

export const CurrencyExamples: StoryObj<typeof CurrencyInput> = {
  ...currencyMeta,
  render: () => {
    const [budget, setBudget] = useState<number | null>(1500000);
    const [subvention, setSubvention] = useState<number | null>(null);
    const [depense, setDepense] = useState<number | null>(750.50);

    return (
      <div className="space-y-4 w-80">
        <CurrencyInput
          label="Budget annuel"
          value={budget}
          onValueChange={setBudget}
          min={0}
          max={100000000}
          helperText="Budget total pour l'exercice"
        />
        <CurrencyInput
          label="Subvention ministère"
          value={subvention}
          onValueChange={setSubvention}
          min={0}
          required
          error={!subvention ? "La subvention est requise" : undefined}
        />
        <CurrencyInput
          label="Dépense avec décimales"
          value={depense}
          onValueChange={setDepense}
          decimals={2}
          allowNegative
          helperText="Montant avec centimes"
        />
        <CurrencyInput
          label="Montant sans devise"
          showCurrency={false}
          placeholder="Montant uniquement"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemples d\'usage du CurrencyInput avec différentes configurations.'
      }
    }
  }
};

// Configuration Meta pour DateInput
const dateMeta: Meta<typeof DateInput> = {
  title: 'UI/DateInput',
  component: DateInput,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Le composant DateInput est spécialisé pour la saisie de dates au format français.
Il supporte plusieurs formats et valide automatiquement les dates saisies.

## Fonctionnalités

- **Format français DD/MM/YYYY** par défaut
- **Formats spécialisés** : MM/YYYY, YYYY
- **Validation automatique** des dates
- **Plages de dates** (min, max)
- **Calendrier natif** intégré
- **Formatage intelligent** pendant la saisie
        `
      }
    }
  },
  argTypes: {
    format: {
      control: 'select',
      options: ['DD/MM/YYYY', 'MM/YYYY', 'YYYY'],
      description: 'Format de date'
    },
    showCalendar: {
      control: 'boolean',
      description: 'Afficher le calendrier natif'
    },
    academicYear: {
      control: 'boolean',
      description: 'Mode année académique'
    }
  }
};

// Stories pour DateInput
export const DateDefault: StoryObj<typeof DateInput> = {
  ...dateMeta,
  args: {
    label: 'Date de naissance',
    placeholder: 'jj/mm/aaaa'
  }
};

export const DateExamples: StoryObj<typeof DateInput> = {
  ...dateMeta,
  render: () => {
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [monthYear, setMonthYear] = useState<Date | null>(null);
    const [year, setYear] = useState<Date | null>(null);

    return (
      <div className="space-y-4 w-80">
        <DateInput
          label="Date de naissance"
          value={birthDate}
          onValueChange={setBirthDate}
          maxDate={new Date()}
          required
          helperText="Format : jj/mm/aaaa"
        />
        <DateInput
          label="Date de début"
          value={startDate}
          onValueChange={setStartDate}
          minDate={new Date()}
          validationState="success"
        />
        <DateInput
          label="Mois et année"
          format="MM/YYYY"
          value={monthYear}
          onValueChange={setMonthYear}
          placeholder="mm/aaaa"
          helperText="Pour les rapports mensuels"
        />
        <DateInput
          label="Année d'exercice"
          format="YYYY"
          value={year}
          onValueChange={setYear}
          fiscalYear
          placeholder="aaaa"
          helperText="Exercice budgétaire"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemples d\'usage du DateInput avec différents formats.'
      }
    }
  }
};

// Exemples de formulaires CROU
export const CROUFormExamples: InputStory = {
  render: () => {
    const [formData, setFormData] = useState({
      nom: '',
      email: '',
      telephone: '',
      budget: null as number | null,
      dateDebut: null as Date | null,
      motDePasse: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      const newErrors: Record<string, string> = {};
      
      if (!formData.nom) newErrors.nom = 'Le nom est requis';
      if (!formData.email) newErrors.email = 'L\'email est requis';
      if (!formData.budget) newErrors.budget = 'Le budget est requis';
      
      setErrors(newErrors);
      
      if (Object.keys(newErrors).length === 0) {
        action('form-submit')(formData);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-6 w-96 p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Formulaire de création CROU
        </h3>
        
        <Input
          label="Nom complet"
          value={formData.nom}
          onChange={(e) => setFormData(prev => ({ ...prev, nom: e.target.value }))}
          leftIcon={<UserIcon className="h-5 w-5" />}
          required
          error={errors.nom}
          placeholder="Nom et prénom"
        />
        
        <Input
          label="Adresse email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          leftIcon={<EnvelopeIcon className="h-5 w-5" />}
          required
          error={errors.email}
          placeholder="nom@crou.gov.ne"
          helperText="Email institutionnel CROU"
        />
        
        <Input
          label="Téléphone"
          type="tel"
          value={formData.telephone}
          onChange={(e) => setFormData(prev => ({ ...prev, telephone: e.target.value }))}
          leftIcon={<PhoneIcon className="h-5 w-5" />}
          placeholder="+227 XX XX XX XX"
          helperText="Numéro de téléphone professionnel"
        />
        
        <CurrencyInput
          label="Budget alloué"
          value={formData.budget}
          onValueChange={(value) => setFormData(prev => ({ ...prev, budget: value }))}
          min={0}
          max={50000000}
          required
          error={errors.budget}
          helperText="Budget annuel en FCFA"
        />
        
        <DateInput
          label="Date de début"
          value={formData.dateDebut}
          onValueChange={(date) => setFormData(prev => ({ ...prev, dateDebut: date }))}
          minDate={new Date()}
          helperText="Date de prise de fonction"
        />
        
        <Input
          label="Mot de passe"
          type="password"
          value={formData.motDePasse}
          onChange={(e) => setFormData(prev => ({ ...prev, motDePasse: e.target.value }))}
          leftIcon={<LockClosedIcon className="h-5 w-5" />}
          placeholder="Mot de passe sécurisé"
          helperText="Minimum 8 caractères"
        />
        
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors"
          >
            Créer le compte
          </button>
          <button
            type="button"
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            onClick={() => {
              setFormData({
                nom: '',
                email: '',
                telephone: '',
                budget: null,
                dateDebut: null,
                motDePasse: ''
              });
              setErrors({});
            }}
          >
            Annuler
          </button>
        </div>
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemple complet de formulaire CROU avec validation.'
      }
    }
  }
};
