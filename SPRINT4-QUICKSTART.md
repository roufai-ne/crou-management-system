# 🚀 Sprint 4 Quick Start Guide

## 📋 Vue Rapide

Sprint 4 ajoute **4 composants de formulaires avancés** au design system CROU :

1. **ModernDatePicker** - Sélecteur de dates avec calendrier
2. **ModernFileUpload** - Upload fichiers drag & drop
3. **ModernAutocomplete** - Recherche avec suggestions
4. **ModernFormBuilder** - Générateur de formulaires dynamique

---

## 🎯 Imports

```tsx
// Composants individuels
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';
import { ModernFileUpload } from '@/components/ui/ModernFileUpload';
import { ModernAutocomplete } from '@/components/ui/ModernAutocomplete';
import { ModernFormBuilder } from '@/components/ui/ModernFormBuilder';
```

---

## 📅 ModernDatePicker

### Utilisation de Base

```tsx
import { useState } from 'react';
import { ModernDatePicker } from '@/components/ui/ModernDatePicker';

function MyComponent() {
  const [date, setDate] = useState<Date | null>(null);

  return (
    <ModernDatePicker
      label="Date de Naissance"
      value={date}
      onChange={setDate}
      variant="gradient-crou"
    />
  );
}
```

### Mode Plage de Dates

```tsx
const [dateRange, setDateRange] = useState<{
  start: Date | null;
  end: Date | null;
}>({ start: null, end: null });

<ModernDatePicker
  label="Période de Réservation"
  rangeMode
  rangeStart={dateRange.start}
  rangeEnd={dateRange.end}
  onRangeChange={(start, end) => setDateRange({ start, end })}
  variant="gradient-crou"
/>
```

### Props Principales

```tsx
interface ModernDatePickerProps {
  label?: string;
  value?: Date;
  onChange?: (date: Date | null) => void;
  
  // Mode plage
  rangeMode?: boolean;
  rangeStart?: Date;
  rangeEnd?: Date;
  onRangeChange?: (start: Date | null, end: Date | null) => void;
  
  // Contraintes
  minDate?: Date;
  maxDate?: Date;
  
  variant?: 'default' | 'gradient-crou';
  disabled?: boolean;
  error?: string;
}
```

---

## 📎 ModernFileUpload

### Utilisation de Base

```tsx
import { useState } from 'react';
import { ModernFileUpload } from '@/components/ui/ModernFileUpload';

function MyComponent() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <ModernFileUpload
      label="Documents"
      value={files}
      onChange={setFiles}
      variant="gradient-crou"
    />
  );
}
```

### Upload d'Images avec Preview

```tsx
<ModernFileUpload
  label="Photos d'Identité"
  value={photos}
  onChange={setPhotos}
  accept="image/*"
  multiple
  maxSize={5} // 5 MB
  maxFiles={3}
  showPreview
  variant="gradient-crou"
/>
```

### Upload de Documents

```tsx
<ModernFileUpload
  label="Justificatifs"
  accept=".pdf,.doc,.docx"
  multiple
  maxSize={10} // 10 MB
  helperText="Formats acceptés : PDF, DOC, DOCX"
  variant="gradient-crou"
/>
```

### Props Principales

```tsx
interface ModernFileUploadProps {
  label?: string;
  value?: File[];
  onChange?: (files: File[]) => void;
  
  multiple?: boolean;
  accept?: string; // "image/*", ".pdf,.doc"
  maxSize?: number; // En MB
  maxFiles?: number;
  showPreview?: boolean;
  
  variant?: 'default' | 'gradient-crou';
  disabled?: boolean;
  error?: string;
  helperText?: string;
}
```

---

## 🔍 ModernAutocomplete

### Recherche Locale

```tsx
import { ModernAutocomplete } from '@/components/ui/ModernAutocomplete';

const studentOptions = [
  { value: '1', label: 'Amadou Diallo', description: 'Informatique - L3' },
  { value: '2', label: 'Fatima Touré', description: 'Médecine - M1' },
];

<ModernAutocomplete
  label="Rechercher un Étudiant"
  value={studentId}
  onChange={setStudentId}
  options={studentOptions}
  variant="gradient-crou"
/>
```

### Recherche Asynchrone

```tsx
const handleAsyncSearch = async (query: string) => {
  const response = await fetch(`/api/students?search=${query}`);
  return response.json(); // Retourne AutocompleteOption[]
};

<ModernAutocomplete
  label="Rechercher"
  value={value}
  onChange={setValue}
  onSearch={handleAsyncSearch}
  debounceMs={500} // 500ms de debounce
  variant="gradient-crou"
/>
```

### Avec Création d'Option

```tsx
<ModernAutocomplete
  label="Université"
  value={university}
  onChange={setUniversity}
  options={universities}
  allowCreate
  onCreateOption={(value) => {
    console.log('Créer université:', value);
    // Ajouter la nouvelle université
  }}
  createLabel="Créer"
  variant="gradient-crou"
/>
```

### Props Principales

```tsx
interface AutocompleteOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface ModernAutocompleteProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  
  options?: AutocompleteOption[];
  onSearch?: (query: string) => Promise<AutocompleteOption[]>;
  
  allowCreate?: boolean;
  onCreateOption?: (value: string) => void;
  createLabel?: string;
  debounceMs?: number;
  
  variant?: 'default' | 'gradient-crou';
  disabled?: boolean;
  loading?: boolean;
  error?: string;
  placeholder?: string;
}
```

---

## 🏗️ ModernFormBuilder

### Configuration de Formulaire

```tsx
import { ModernFormBuilder, FormSection } from '@/components/ui/ModernFormBuilder';
import toast from 'react-hot-toast';

const formSections: FormSection[] = [
  {
    title: 'Informations Personnelles',
    description: 'Renseignez vos informations d\'identité',
    columns: 2, // Layout 2 colonnes
    fields: [
      {
        name: 'nom',
        label: 'Nom Complet',
        type: 'text',
        placeholder: 'Ex: Amadou Diallo',
        required: true,
      },
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        placeholder: 'exemple@crou.ne',
        required: true,
        helperText: 'Email universitaire requis',
      },
      {
        name: 'telephone',
        label: 'Téléphone',
        type: 'tel',
        placeholder: '+227 XX XX XX XX',
        required: true,
      },
      {
        name: 'dateNaissance',
        label: 'Date de Naissance',
        type: 'date',
        required: true,
      },
    ],
  },
  {
    title: 'Informations Académiques',
    columns: 2,
    fields: [
      {
        name: 'universite',
        label: 'Université',
        type: 'autocomplete',
        options: [
          { value: 'niamey', label: 'Université de Niamey' },
          { value: 'maradi', label: 'Université de Maradi' },
        ],
        required: true,
      },
      {
        name: 'filiere',
        label: 'Filière',
        type: 'select',
        options: [
          { value: 'info', label: 'Informatique' },
          { value: 'medecine', label: 'Médecine' },
        ],
        required: true,
      },
      {
        name: 'boursier',
        label: 'Je suis boursier',
        type: 'checkbox',
      },
    ],
  },
];

function MyFormPage() {
  const handleSubmit = (data: Record<string, any>) => {
    console.log('Form data:', data);
    toast.success('Formulaire enregistré !');
  };

  return (
    <ModernFormBuilder
      sections={formSections}
      onSubmit={handleSubmit}
      onCancel={() => window.history.back()}
      submitLabel="Enregistrer"
      cancelLabel="Annuler"
      variant="gradient-crou"
    />
  );
}
```

### Types de Champs Supportés

```tsx
type FieldType = 
  | 'text'      // Input texte
  | 'email'     // Input email avec validation
  | 'password'  // Input password
  | 'number'    // Input numérique
  | 'tel'       // Input téléphone
  | 'select'    // Select dropdown
  | 'checkbox'  // Checkbox
  | 'radio'     // Radio buttons
  | 'textarea'  // Textarea
  | 'date'      // DatePicker
  | 'autocomplete'; // Autocomplete
```

### Affichage Conditionnel

```tsx
{
  name: 'montantBourse',
  label: 'Montant de la Bourse',
  type: 'number',
  // Afficher seulement si boursier est coché
  condition: (values) => values.boursier === true,
}
```

### Validation Custom avec Zod

```tsx
import { z } from 'zod';

{
  name: 'telephone',
  label: 'Téléphone',
  type: 'tel',
  validation: z.string()
    .regex(/^\+227\s\d{2}\s\d{2}\s\d{2}\s\d{2}$/, 'Format: +227 XX XX XX XX')
    .min(1, 'Téléphone requis'),
}
```

### Props Principales

```tsx
interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  options?: FieldOption[];
  validation?: z.ZodTypeAny;
  condition?: (values: any) => boolean;
  variant?: 'default' | 'gradient-crou';
  props?: Record<string, any>;
}

interface FormSection {
  title?: string;
  description?: string;
  fields: FormField[];
  columns?: 1 | 2 | 3;
}

interface ModernFormBuilderProps {
  sections: FormSection[];
  defaultValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  variant?: 'default' | 'gradient-crou';
}
```

---

## 📦 Exemple Complet : Formulaire d'Inscription Étudiant

```tsx
import { useState } from 'react';
import { ModernFormBuilder, FormSection } from '@/components/ui/ModernFormBuilder';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export function StudentRegistrationPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formSections: FormSection[] = [
    {
      title: 'Informations Personnelles',
      description: 'Renseignez vos informations d\'identité',
      columns: 2,
      fields: [
        {
          name: 'nom',
          label: 'Nom Complet',
          type: 'text',
          required: true,
        },
        {
          name: 'email',
          label: 'Email',
          type: 'email',
          required: true,
          helperText: 'Email universitaire requis',
        },
        {
          name: 'telephone',
          label: 'Téléphone',
          type: 'tel',
          placeholder: '+227 XX XX XX XX',
          required: true,
        },
        {
          name: 'dateNaissance',
          label: 'Date de Naissance',
          type: 'date',
          required: true,
        },
      ],
    },
    {
      title: 'Informations Académiques',
      columns: 2,
      fields: [
        {
          name: 'universite',
          label: 'Université',
          type: 'autocomplete',
          options: [
            { value: 'niamey', label: 'Université de Niamey' },
            { value: 'maradi', label: 'Université de Maradi' },
            { value: 'zinder', label: 'Université de Zinder' },
          ],
          required: true,
        },
        {
          name: 'filiere',
          label: 'Filière',
          type: 'select',
          options: [
            { value: 'info', label: 'Informatique' },
            { value: 'medecine', label: 'Médecine' },
            { value: 'droit', label: 'Droit' },
            { value: 'economie', label: 'Économie' },
          ],
          required: true,
        },
        {
          name: 'niveau',
          label: 'Niveau d\'Études',
          type: 'select',
          options: [
            { value: 'l1', label: 'Licence 1' },
            { value: 'l2', label: 'Licence 2' },
            { value: 'l3', label: 'Licence 3' },
            { value: 'm1', label: 'Master 1' },
            { value: 'm2', label: 'Master 2' },
          ],
          required: true,
        },
        {
          name: 'boursier',
          label: 'Je suis boursier',
          type: 'checkbox',
        },
      ],
    },
    {
      title: 'Documents Justificatifs',
      description: 'Téléchargez les documents requis',
      columns: 1,
      fields: [
        {
          name: 'notes',
          label: 'Notes supplémentaires',
          type: 'textarea',
          placeholder: 'Informations complémentaires (optionnel)',
        },
      ],
    },
  ];

  const handleSubmit = async (data: Record<string, any>) => {
    setIsSubmitting(true);
    
    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Données soumises:', data);
      
      toast.success('Inscription enregistrée avec succès !');
      navigate('/students');
    } catch (error) {
      toast.error('Erreur lors de l\'enregistrement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Nouvelle Inscription Étudiant
        </h1>
        <p className="text-gray-600 mt-1">
          Remplissez le formulaire ci-dessous pour inscrire un nouvel étudiant
        </p>
      </div>

      <ModernFormBuilder
        sections={formSections}
        defaultValues={{ boursier: false }}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/students')}
        isSubmitting={isSubmitting}
        variant="gradient-crou"
      />
    </div>
  );
}
```

---

## 🎨 Variantes de Style

Tous les composants supportent 2 variantes :

### Default
```tsx
variant="default"
```
- Bordure grise classique
- Focus bleu primary
- Style épuré

### Gradient CROU (Recommandé)
```tsx
variant="gradient-crou"
```
- Fond dégradé Vert → Orange Niger
- Bordure transparente
- Ring au focus avec couleurs brand

---

## 🚀 Voir la Démo

Tous les composants Sprint 4 sont démontrés sur la page interactive :

```
http://localhost:3001/examples/sprint4
```

---

## 📚 Documentation Complète

Pour plus de détails, consultez :
- [DESIGN-SPRINT4-COMPLETE.md](./DESIGN-SPRINT4-COMPLETE.md) - Documentation exhaustive Sprint 4
- [DESIGN-SPRINTS-RECAP.md](./DESIGN-SPRINTS-RECAP.md) - Récapitulatif tous sprints

---

**Équipe CROU Niger**  
Date : 24 Novembre 2024
