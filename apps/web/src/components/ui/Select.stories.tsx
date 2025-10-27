/**
 * FICHIER: apps\web\src\components\ui\Select.stories.tsx
 * STORYBOOK: Stories pour les composants Select
 * 
 * DESCRIPTION:
 * Documentation interactive des composants Select, CROUSelector et RoleSelector
 * Présente toutes les fonctionnalités avancées et exemples d'usage CROU
 * 
 * STORIES:
 * - Select: Composant de base avec toutes les fonctionnalités
 * - CROUSelector: Sélection des centres CROU
 * - RoleSelector: Sélection des rôles utilisateurs
 * - Advanced: Fonctionnalités avancées (recherche, création, multi-select)
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { useState } from 'react';
import { 
  BuildingOfficeIcon, 
  UserIcon, 
  AcademicCapIcon,
  CurrencyDollarIcon,
  TruckIcon,
  HomeModernIcon
} from '@heroicons/react/24/outline';
import { Select } from './Select';
import { CROUSelector, RoleSelector } from './CROUSelector';

// Options de test pour les stories
const basicOptions = [
  { value: 'option1', label: 'Option 1' },
  { value: 'option2', label: 'Option 2' },
  { value: 'option3', label: 'Option 3' },
  { value: 'option4', label: 'Option 4', disabled: true },
  { value: 'option5', label: 'Option 5' }
];

const optionsWithDescriptions = [
  { 
    value: 'budget', 
    label: 'Gestion Budgétaire', 
    description: 'Suivi des budgets et subventions',
    icon: <CurrencyDollarIcon className="h-4 w-4" />
  },
  { 
    value: 'logement', 
    label: 'Gestion Logement', 
    description: 'Administration des cités universitaires',
    icon: <HomeModernIcon className="h-4 w-4" />
  },
  { 
    value: 'transport', 
    label: 'Gestion Transport', 
    description: 'Parc automobile et navettes',
    icon: <TruckIcon className="h-4 w-4" />
  },
  { 
    value: 'academique', 
    label: 'Affaires Académiques', 
    description: 'Coordination avec les universités',
    icon: <AcademicCapIcon className="h-4 w-4" />
  }
];

const groupedOptions = [
  {
    label: 'Gestion Financière',
    options: [
      { value: 'budget', label: 'Budget' },
      { value: 'comptabilite', label: 'Comptabilité' },
      { value: 'subventions', label: 'Subventions' }
    ]
  },
  {
    label: 'Gestion Opérationnelle',
    options: [
      { value: 'logement', label: 'Logement' },
      { value: 'transport', label: 'Transport' },
      { value: 'restauration', label: 'Restauration' }
    ]
  }
];

// Configuration Meta pour Select
const selectMeta: Meta<typeof Select> = {
  title: 'UI/Select',
  component: Select,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Le composant Select est un élément avancé pour la sélection d'options dans l'application CROU.
Il supporte de nombreuses fonctionnalités avancées pour répondre à tous les besoins.

## Fonctionnalités

- **Single et multi-select** avec gestion des tags
- **Recherche intelligente** avec filtrage personnalisable
- **Création d'options** à la volée
- **Groupes d'options** pour l'organisation
- **États de validation** complets
- **Accessibilité** WCAG 2.1 AA
- **Chargement asynchrone** avec états de loading
- **Personnalisation** complète des styles

## Bonnes pratiques

- Utilisez \`searchable\` pour les listes longues (>10 options)
- Groupez les options logiquement avec \`groupByRegion\`
- Fournissez des descriptions pour clarifier les options
- Utilisez \`multiple\` pour les sélections multiples
- Toujours fournir un \`label\` pour l'accessibilité
        `
      }
    }
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'filled', 'flushed'],
      description: 'Variante visuelle du select'
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du select'
    },
    multiple: {
      control: 'boolean',
      description: 'Mode multi-sélection'
    },
    searchable: {
      control: 'boolean',
      description: 'Recherche activée'
    },
    clearable: {
      control: 'boolean',
      description: 'Bouton de suppression'
    },
    creatable: {
      control: 'boolean',
      description: 'Création d\'options'
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement'
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé'
    }
  }
};

export default selectMeta;
type SelectStory = StoryObj<typeof Select>;

// Story par défaut
export const Default: SelectStory = {
  args: {
    options: basicOptions,
    label: 'Sélection simple',
    placeholder: 'Choisir une option'
  }
};

// Toutes les variantes
export const Variants: SelectStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        variant="default"
        label="Variante Default"
        placeholder="Style par défaut"
      />
      <Select
        options={basicOptions}
        variant="filled"
        label="Variante Filled"
        placeholder="Fond coloré"
      />
      <Select
        options={basicOptions}
        variant="flushed"
        label="Variante Flushed"
        placeholder="Bordure inférieure"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Les trois variantes visuelles disponibles pour le Select.'
      }
    }
  }
};

// Toutes les tailles
export const Sizes: SelectStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        size="sm"
        label="Taille Small"
        placeholder="Select petit"
      />
      <Select
        options={basicOptions}
        size="md"
        label="Taille Medium"
        placeholder="Select moyen (défaut)"
      />
      <Select
        options={basicOptions}
        size="lg"
        label="Taille Large"
        placeholder="Select grand"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Les trois tailles disponibles pour le Select.'
      }
    }
  }
};

// Multi-sélection
export const MultiSelect: SelectStory = {
  render: () => {
    const [values, setValues] = useState<(string | number)[]>(['option1', 'option2']);

    return (
      <div className="w-80">
        <Select
          options={basicOptions}
          value={values}
          onChange={(newValues) => setValues(newValues as (string | number)[])}
          multiple
          label="Multi-sélection"
          placeholder="Sélectionner plusieurs options"
          helperText="Vous pouvez sélectionner plusieurs options"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Mode multi-sélection avec affichage des tags sélectionnés.'
      }
    }
  }
};

// Recherche
export const Searchable: SelectStory = {
  render: () => (
    <div className="w-80">
      <Select
        options={optionsWithDescriptions}
        searchable
        label="Select avec recherche"
        placeholder="Rechercher une option..."
        helperText="Tapez pour filtrer les options"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Select avec fonctionnalité de recherche et filtrage intelligent.'
      }
    }
  }
};

// Options avec icônes et descriptions
export const WithIconsAndDescriptions: SelectStory = {
  render: () => (
    <div className="w-80">
      <Select
        options={optionsWithDescriptions}
        label="Options enrichies"
        placeholder="Sélectionner un module"
        helperText="Options avec icônes et descriptions"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Options avec icônes et descriptions pour plus de contexte.'
      }
    }
  }
};

// Création d'options
export const Creatable: SelectStory = {
  render: () => {
    const [options, setOptions] = useState(basicOptions);

    const handleCreateOption = async (inputValue: string) => {
      const newOption = {
        value: inputValue.toLowerCase().replace(/\s+/g, '-'),
        label: inputValue
      };
      
      setOptions(prev => [...prev, newOption]);
      return newOption;
    };

    return (
      <div className="w-80">
        <Select
          options={options}
          searchable
          creatable
          onCreateOption={handleCreateOption}
          label="Select avec création"
          placeholder="Rechercher ou créer..."
          helperText="Tapez pour créer une nouvelle option"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Select permettant de créer de nouvelles options à la volée.'
      }
    }
  }
};

// États de validation
export const ValidationStates: SelectStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="État normal"
        placeholder="Sélection normale"
        validationState="default"
      />
      <Select
        options={basicOptions}
        label="État de succès"
        placeholder="Validation réussie"
        validationState="success"
        value="option1"
      />
      <Select
        options={basicOptions}
        label="État d'erreur"
        placeholder="Erreur de validation"
        error="Cette sélection est requise"
      />
      <Select
        options={basicOptions}
        label="État d'avertissement"
        placeholder="Avertissement"
        validationState="warning"
        helperText="Vérifiez cette sélection"
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

// États spéciaux
export const SpecialStates: SelectStory = {
  render: () => (
    <div className="space-y-4 w-80">
      <Select
        options={basicOptions}
        label="Chargement"
        placeholder="Chargement des options..."
        loading
      />
      <Select
        options={basicOptions}
        label="Désactivé"
        placeholder="Select non modifiable"
        disabled
        value="option1"
      />
      <Select
        options={basicOptions}
        label="Avec suppression"
        placeholder="Select avec bouton clear"
        clearable
        value="option1"
      />
      <Select
        options={[]}
        label="Aucune option"
        placeholder="Liste vide"
        noOptionsText="Aucune option disponible"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'États spéciaux : loading, disabled, clearable, liste vide.'
      }
    }
  }
};

// Configuration Meta pour CROUSelector
const crouMeta: Meta<typeof CROUSelector> = {
  title: 'UI/CROUSelector',
  component: CROUSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Le composant CROUSelector est spécialisé pour la sélection des centres CROU du Niger.
Il intègre automatiquement la liste des 8 CROU avec leurs informations géographiques.

## Fonctionnalités

- **Liste complète des 8 CROU** du Niger
- **Filtrage par région** géographique
- **Codes CROU** et informations détaillées
- **Filtrage par accès utilisateur** selon les permissions
- **Support multi-select** pour les vues ministérielles
- **Recherche intelligente** dans les noms, codes et régions
        `
      }
    }
  },
  argTypes: {
    level: {
      control: 'select',
      options: ['all', 'ministry', 'local'],
      description: 'Niveau d\'accès pour filtrer les CROU'
    },
    includeMinistry: {
      control: 'boolean',
      description: 'Inclure l\'option Ministère'
    },
    showRegions: {
      control: 'boolean',
      description: 'Afficher les régions'
    },
    showCodes: {
      control: 'boolean',
      description: 'Afficher les codes CROU'
    },
    filterByUserAccess: {
      control: 'boolean',
      description: 'Filtrer selon l\'accès utilisateur'
    }
  }
};

// Stories pour CROUSelector
export const CROUDefault: StoryObj<typeof CROUSelector> = {
  ...crouMeta,
  args: {
    label: 'Sélectionner un CROU',
    placeholder: 'Choisir un centre CROU'
  }
};

export const CROUExamples: StoryObj<typeof CROUSelector> = {
  ...crouMeta,
  render: () => {
    const [selectedCrou, setSelectedCrou] = useState<string | number | null>(null);
    const [selectedCrous, setSelectedCrous] = useState<(string | number)[]>([]);

    return (
      <div className="space-y-6 w-96">
        <CROUSelector
          label="CROU simple"
          value={selectedCrou}
          onChange={setSelectedCrou}
          placeholder="Sélectionner un CROU"
          helperText="Sélection simple d'un centre CROU"
        />

        <CROUSelector
          label="CROU avec Ministère"
          includeMinistry
          showRegions
          searchable
          placeholder="CROU ou Ministère"
          helperText="Inclut l'option Ministère"
        />

        <CROUSelector
          label="Multi-sélection CROU"
          value={selectedCrous}
          onChange={setSelectedCrous}
          multiple
          searchable
          clearable
          showCodes
          placeholder="Sélectionner plusieurs CROU"
          helperText="Sélection multiple avec codes"
        />

        <CROUSelector
          label="CROU avec exclusions"
          excludeCROUs={['niamey', 'dosso']}
          showRegions
          showCodes
          placeholder="CROU filtrés"
          helperText="Niamey et Dosso exclus"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemples d\'usage du CROUSelector avec différentes configurations.'
      }
    }
  }
};

// Configuration Meta pour RoleSelector
const roleMeta: Meta<typeof RoleSelector> = {
  title: 'UI/RoleSelector',
  component: RoleSelector,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Le composant RoleSelector est spécialisé pour la sélection des rôles utilisateurs CROU.
Il intègre automatiquement la hiérarchie des rôles ministériels et CROU.

## Fonctionnalités

- **Rôles ministériels et CROU** complets
- **Filtrage par niveau** (ministère, CROU, tous)
- **Filtrage par permissions** requises
- **Descriptions détaillées** des rôles
- **Groupement logique** par niveau
- **Validation des permissions** automatique
        `
      }
    }
  },
  argTypes: {
    level: {
      control: 'select',
      options: ['all', 'ministry', 'crou'],
      description: 'Niveau des rôles à afficher'
    },
    showDescriptions: {
      control: 'boolean',
      description: 'Afficher les descriptions des rôles'
    }
  }
};

// Stories pour RoleSelector
export const RoleDefault: StoryObj<typeof RoleSelector> = {
  ...roleMeta,
  args: {
    label: 'Sélectionner un rôle',
    placeholder: 'Choisir un rôle utilisateur'
  }
};

export const RoleExamples: StoryObj<typeof RoleSelector> = {
  ...roleMeta,
  render: () => {
    const [selectedRole, setSelectedRole] = useState<string | number | null>(null);

    return (
      <div className="space-y-6 w-96">
        <RoleSelector
          label="Tous les rôles"
          value={selectedRole}
          onChange={setSelectedRole}
          placeholder="Sélectionner un rôle"
          helperText="Tous les rôles ministériels et CROU"
        />

        <RoleSelector
          label="Rôles ministériels"
          level="ministry"
          showDescriptions
          placeholder="Rôles du ministère"
          helperText="Uniquement les rôles ministériels"
        />

        <RoleSelector
          label="Rôles CROU"
          level="crou"
          showDescriptions
          searchable
          placeholder="Rôles des CROU"
          helperText="Uniquement les rôles CROU avec recherche"
        />

        <RoleSelector
          label="Rôles avec permissions financières"
          requiredPermissions={['financial:write']}
          showDescriptions
          placeholder="Rôles financiers"
          helperText="Rôles ayant des permissions financières"
        />

        <RoleSelector
          label="Rôles sans descriptions"
          showDescriptions={false}
          placeholder="Rôles simples"
          helperText="Affichage simplifié sans descriptions"
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemples d\'usage du RoleSelector avec différentes configurations.'
      }
    }
  }
};

// Exemples avancés combinés
export const AdvancedCombined: SelectStory = {
  render: () => {
    const [formData, setFormData] = useState({
      crou: null as string | number | null,
      role: null as string | number | null,
      modules: [] as (string | number)[],
      priority: null as string | number | null
    });

    const priorityOptions = [
      { value: 'low', label: 'Faible', description: 'Priorité basse' },
      { value: 'medium', label: 'Moyenne', description: 'Priorité normale' },
      { value: 'high', label: 'Élevée', description: 'Priorité haute' },
      { value: 'urgent', label: 'Urgente', description: 'Traitement immédiat' }
    ];

    return (
      <div className="space-y-6 w-96 p-6 bg-white rounded-lg shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900">
          Formulaire de configuration utilisateur
        </h3>

        <CROUSelector
          label="Centre CROU"
          value={formData.crou}
          onChange={(value) => setFormData(prev => ({ ...prev, crou: value }))}
          includeMinistry
          showRegions
          searchable
          required
          placeholder="Sélectionner le CROU d'affectation"
          helperText="Centre régional d'affectation de l'utilisateur"
        />

        <RoleSelector
          label="Rôle utilisateur"
          value={formData.role}
          onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
          showDescriptions
          searchable
          required
          placeholder="Sélectionner le rôle"
          helperText="Rôle déterminant les permissions"
        />

        <Select
          options={optionsWithDescriptions}
          value={formData.modules}
          onChange={(value) => setFormData(prev => ({ ...prev, modules: value as (string | number)[] }))}
          multiple
          searchable
          clearable
          label="Modules accessibles"
          placeholder="Sélectionner les modules"
          helperText="Modules auxquels l'utilisateur aura accès"
        />

        <Select
          options={priorityOptions}
          value={formData.priority}
          onChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
          label="Niveau de priorité"
          placeholder="Définir la priorité"
          helperText="Niveau de priorité pour les notifications"
        />

        <div className="pt-4 border-t">
          <h4 className="font-medium text-gray-900 mb-2">Configuration actuelle :</h4>
          <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Exemple complet combinant tous les types de Select dans un formulaire.'
      }
    }
  }
};
