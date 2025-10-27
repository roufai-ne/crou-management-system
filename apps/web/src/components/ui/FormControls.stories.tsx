/**
 * FICHIER: apps\web\src\components\ui\FormControls.stories.tsx
 * STORYBOOK: Stories pour les composants de contrôle de formulaire
 * 
 * DESCRIPTION:
 * Documentation interactive des composants Checkbox, Radio et Switch
 * Exemples d'utilisation et variations pour le design system CROU
 * 
 * STORIES:
 * - Checkbox: états, tailles, groupes, validation
 * - Radio: groupes, orientations, icônes
 * - Switch: états, variantes, loading, tailles
 * - Exemples d'intégration et formulaires
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { 
  UserIcon, 
  CogIcon, 
  BellIcon, 
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Checkbox, CheckboxGroup } from './Checkbox';
import { Radio, RadioGroup } from './Radio';
import { Switch, SwitchGroup } from './Switch';

// Configuration Meta pour Checkbox
const checkboxMeta: Meta<typeof Checkbox> = {
  title: 'Components/Form Controls/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant case à cocher avec support des états indéterminés et validation.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille de la checkbox'
    },
    variant: {
      control: 'select',
      options: ['default', 'card'],
      description: 'Variante visuelle'
    },
    validationState: {
      control: 'select',
      options: ['default', 'success', 'error', 'warning'],
      description: 'État de validation'
    },
    checked: {
      control: 'boolean',
      description: 'État coché'
    },
    indeterminate: {
      control: 'boolean',
      description: 'État indéterminé'
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

export default checkboxMeta;

// Stories pour Checkbox
type CheckboxStory = StoryObj<typeof Checkbox>;

export const DefaultCheckbox: CheckboxStory = {
  args: {
    label: 'Accepter les conditions d\'utilisation',
    description: 'En cochant cette case, vous acceptez nos conditions.'
  }
};

export const CheckboxSizes: CheckboxStory = {
  render: () => (
    <div className="space-y-4">
      <Checkbox size="sm" label="Petite checkbox" />
      <Checkbox size="md" label="Checkbox moyenne (défaut)" />
      <Checkbox size="lg" label="Grande checkbox" />
    </div>
  )
};

export const CheckboxStates: CheckboxStory = {
  render: () => (
    <div className="space-y-4">
      <Checkbox label="Non cochée" checked={false} />
      <Checkbox label="Cochée" checked={true} />
      <Checkbox label="Indéterminée" indeterminate={true} />
      <Checkbox label="Désactivée" disabled />
      <Checkbox label="Cochée et désactivée" checked disabled />
    </div>
  )
};

export const CheckboxVariants: CheckboxStory = {
  render: () => (
    <div className="space-y-4">
      <Checkbox 
        variant="default" 
        label="Variante par défaut" 
        description="Style standard"
      />
      <Checkbox 
        variant="card" 
        label="Variante carte" 
        description="Avec bordure et fond au survol"
      />
    </div>
  )
};

export const CheckboxValidation: CheckboxStory = {
  render: () => (
    <div className="space-y-4">
      <Checkbox 
        label="Validation par défaut" 
        validationState="default"
      />
      <Checkbox 
        label="Validation réussie" 
        validationState="success"
        checked
      />
      <Checkbox 
        label="Validation avec erreur" 
        validationState="error"
        error="Cette case doit être cochée"
      />
      <Checkbox 
        label="Validation avec avertissement" 
        validationState="warning"
      />
    </div>
  )
};

export const InteractiveCheckbox: CheckboxStory = {
  render: () => {
    const [checked, setChecked] = useState(false);
    
    return (
      <Checkbox
        label="Checkbox interactive"
        description="Cliquez pour changer l'état"
        checked={checked}
        onChange={setChecked}
      />
    );
  }
};

// Stories pour CheckboxGroup
export const BasicCheckboxGroup: CheckboxStory = {
  render: () => {
    const [values, setValues] = useState<(string | number)[]>([]);
    
    const options = [
      { value: 'email', label: 'Notifications par email' },
      { value: 'sms', label: 'Notifications par SMS' },
      { value: 'push', label: 'Notifications push', description: 'Sur votre appareil mobile' },
      { value: 'newsletter', label: 'Newsletter hebdomadaire', disabled: true }
    ];
    
    return (
      <CheckboxGroup
        options={options}
        value={values}
        onChange={setValues}
        label="Préférences de notification"
        description="Choisissez comment vous souhaitez être notifié"
      />
    );
  }
};

// Configuration Meta pour RadioGroup
const radioMeta: Meta<typeof RadioGroup> = {
  title: 'Components/Form Controls/Radio',
  component: RadioGroup,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant groupe de boutons radio pour sélection exclusive.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille des boutons radio'
    },
    variant: {
      control: 'select',
      options: ['default', 'card'],
      description: 'Variante visuelle'
    },
    orientation: {
      control: 'select',
      options: ['vertical', 'horizontal'],
      description: 'Orientation du groupe'
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

export const RadioGroupStories = {
  ...radioMeta,
  title: 'Components/Form Controls/Radio'
};

type RadioStory = StoryObj<typeof RadioGroup>;

export const DefaultRadioGroup: RadioStory = {
  render: () => {
    const [value, setValue] = useState<string | number | null>(null);
    
    const options = [
      { value: 'low', label: 'Faible', description: 'Priorité basse' },
      { value: 'medium', label: 'Moyenne', description: 'Priorité normale' },
      { value: 'high', label: 'Élevée', description: 'Priorité haute' },
      { value: 'urgent', label: 'Urgente', description: 'Traitement immédiat' }
    ];
    
    return (
      <RadioGroup
        options={options}
        value={value}
        onChange={setValue}
        label="Niveau de priorité"
        description="Sélectionnez le niveau de priorité pour cette tâche"
      />
    );
  }
};

export const RadioGroupSizes: RadioStory = {
  render: () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' }
    ];
    
    return (
      <div className="space-y-6">
        <RadioGroup
          options={options}
          size="sm"
          label="Petite taille"
          value="option1"
        />
        <RadioGroup
          options={options}
          size="md"
          label="Taille moyenne (défaut)"
          value="option1"
        />
        <RadioGroup
          options={options}
          size="lg"
          label="Grande taille"
          value="option1"
        />
      </div>
    );
  }
};

export const RadioGroupOrientations: RadioStory = {
  render: () => {
    const options = [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' }
    ];
    
    return (
      <div className="space-y-6">
        <RadioGroup
          options={options}
          orientation="vertical"
          label="Orientation verticale (défaut)"
          value="option1"
        />
        <RadioGroup
          options={options}
          orientation="horizontal"
          label="Orientation horizontale"
          value="option2"
        />
      </div>
    );
  }
};

export const RadioGroupWithIcons: RadioStory = {
  render: () => {
    const [value, setValue] = useState<string | number | null>('user');
    
    const options = [
      { 
        value: 'user', 
        label: 'Utilisateur', 
        description: 'Accès utilisateur standard',
        icon: <UserIcon className="h-5 w-5" />
      },
      { 
        value: 'admin', 
        label: 'Administrateur', 
        description: 'Accès administrateur complet',
        icon: <CogIcon className="h-5 w-5" />
      },
      { 
        value: 'guest', 
        label: 'Invité', 
        description: 'Accès limité en lecture seule',
        disabled: true
      }
    ];
    
    return (
      <RadioGroup
        options={options}
        value={value}
        onChange={setValue}
        label="Niveau d'accès"
        variant="card"
      />
    );
  }
};

// Configuration Meta pour Switch
const switchMeta: Meta<typeof Switch> = {
  title: 'Components/Form Controls/Switch',
  component: Switch,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Composant interrupteur pour activer/désactiver des fonctionnalités.'
      }
    }
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Taille du switch'
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'danger'],
      description: 'Variante de couleur'
    },
    checked: {
      control: 'boolean',
      description: 'État activé'
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement'
    },
    disabled: {
      control: 'boolean',
      description: 'État désactivé'
    },
    showLabels: {
      control: 'boolean',
      description: 'Afficher les labels ON/OFF'
    }
  }
};

export const SwitchStories = {
  ...switchMeta,
  title: 'Components/Form Controls/Switch'
};

type SwitchStory = StoryObj<typeof Switch>;

export const DefaultSwitch: SwitchStory = {
  args: {
    label: 'Activer les notifications',
    description: 'Recevoir des alertes en temps réel'
  }
};

export const SwitchSizes: SwitchStory = {
  render: () => (
    <div className="space-y-4">
      <Switch size="sm" label="Petit switch" checked />
      <Switch size="md" label="Switch moyen (défaut)" checked />
      <Switch size="lg" label="Grand switch" checked />
    </div>
  )
};

export const SwitchVariants: SwitchStory = {
  render: () => (
    <div className="space-y-4">
      <Switch 
        variant="default" 
        label="Variante par défaut" 
        checked 
      />
      <Switch 
        variant="success" 
        label="Variante succès" 
        checked 
      />
      <Switch 
        variant="warning" 
        label="Variante avertissement" 
        checked 
      />
      <Switch 
        variant="danger" 
        label="Variante danger" 
        checked 
      />
    </div>
  )
};

export const SwitchStates: SwitchStory = {
  render: () => (
    <div className="space-y-4">
      <Switch label="Désactivé" checked={false} />
      <Switch label="Activé" checked={true} />
      <Switch label="En chargement" loading />
      <Switch label="Désactivé (disabled)" disabled />
      <Switch label="Activé et désactivé" checked disabled />
    </div>
  )
};

export const SwitchWithLabels: SwitchStory = {
  render: () => (
    <div className="space-y-4">
      <Switch 
        label="Avec labels par défaut"
        showLabels
        checked
      />
      <Switch 
        label="Avec labels personnalisés"
        showLabels
        checkedLabel="OUI"
        uncheckedLabel="NON"
        checked={false}
      />
    </div>
  )
};

export const InteractiveSwitch: SwitchStory = {
  render: () => {
    const [checked, setChecked] = useState(false);
    const [loading, setLoading] = useState(false);
    
    const handleChange = async (newChecked: boolean) => {
      setLoading(true);
      // Simuler une requête API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setChecked(newChecked);
      setLoading(false);
    };
    
    return (
      <Switch
        label="Switch avec simulation API"
        description="Simule un appel API lors du changement"
        checked={checked}
        loading={loading}
        onChange={handleChange}
      />
    );
  }
};

// Stories pour SwitchGroup
export const BasicSwitchGroup: SwitchStory = {
  render: () => {
    const [values, setValues] = useState<Record<string, boolean>>({
      notifications: true,
      emails: false,
      sms: false
    });
    
    const options = [
      { 
        key: 'notifications', 
        label: 'Notifications push', 
        description: 'Alertes sur votre appareil',
        variant: 'default' as const
      },
      { 
        key: 'emails', 
        label: 'Notifications par email', 
        description: 'Recevoir des emails',
        variant: 'success' as const
      },
      { 
        key: 'sms', 
        label: 'Notifications par SMS', 
        description: 'Messages sur votre téléphone',
        disabled: true
      }
    ];
    
    return (
      <SwitchGroup
        options={options}
        value={values}
        onChange={setValues}
        label="Paramètres de notification"
        description="Configurez vos préférences de notification"
      />
    );
  }
};

// Exemple d'intégration complète
export const CompleteFormExample: CheckboxStory = {
  render: () => {
    const [formData, setFormData] = useState({
      acceptTerms: false,
      priority: '',
      notifications: {
        email: true,
        push: false,
        sms: false
      },
      newsletter: false
    });
    
    const priorityOptions = [
      { value: 'low', label: 'Faible', icon: <CheckCircleIcon className="h-4 w-4" /> },
      { value: 'medium', label: 'Moyenne', icon: <BellIcon className="h-4 w-4" /> },
      { value: 'high', label: 'Élevée', icon: <ExclamationTriangleIcon className="h-4 w-4" /> }
    ];
    
    const notificationOptions = [
      { 
        key: 'email', 
        label: 'Email', 
        description: 'Notifications par email',
        variant: 'success' as const
      },
      { 
        key: 'push', 
        label: 'Push', 
        description: 'Notifications push'
      },
      { 
        key: 'sms', 
        label: 'SMS', 
        description: 'Notifications par SMS',
        variant: 'warning' as const
      }
    ];
    
    return (
      <div className="max-w-md space-y-6 p-6 bg-white dark:bg-gray-800 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Paramètres du compte
        </h3>
        
        <RadioGroup
          options={priorityOptions}
          value={formData.priority}
          onChange={(value) => setFormData(prev => ({ ...prev, priority: value as string }))}
          label="Priorité par défaut"
          variant="card"
          required
        />
        
        <SwitchGroup
          options={notificationOptions}
          value={formData.notifications}
          onChange={(values) => setFormData(prev => ({ ...prev, notifications: values }))}
          label="Notifications"
          size="sm"
        />
        
        <Checkbox
          label="Newsletter mensuelle"
          description="Recevoir notre newsletter avec les dernières actualités"
          checked={formData.newsletter}
          onChange={(checked) => setFormData(prev => ({ ...prev, newsletter: checked }))}
        />
        
        <Checkbox
          label="J'accepte les conditions d'utilisation"
          checked={formData.acceptTerms}
          onChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked }))}
          required
          error={!formData.acceptTerms ? "Vous devez accepter les conditions" : undefined}
        />
        
        <div className="pt-4 border-t">
          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-3 rounded overflow-auto">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </div>
      </div>
    );
  }
};

// Export des stories par composant
export {
  DefaultCheckbox,
  CheckboxSizes,
  CheckboxStates,
  CheckboxVariants,
  CheckboxValidation,
  InteractiveCheckbox,
  BasicCheckboxGroup,
  DefaultRadioGroup,
  RadioGroupSizes,
  RadioGroupOrientations,
  RadioGroupWithIcons,
  DefaultSwitch,
  SwitchSizes,
  SwitchVariants,
  SwitchStates,
  SwitchWithLabels,
  InteractiveSwitch,
  BasicSwitchGroup,
  CompleteFormExample
};
