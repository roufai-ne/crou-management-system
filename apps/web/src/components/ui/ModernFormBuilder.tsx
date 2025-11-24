import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ModernInput } from './ModernInput';
import { ModernSelect } from './ModernSelect';
import { ModernCheckbox } from './ModernCheckbox';
import { ModernTextarea } from './ModernTextarea';
import { ModernDatePicker } from './ModernDatePicker';
import { ModernAutocomplete } from './ModernAutocomplete';
import { ModernButton } from './ModernButton';
import { cn } from '@/utils/cn';

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel'
  | 'select' 
  | 'checkbox' 
  | 'radio'
  | 'textarea' 
  | 'date'
  | 'autocomplete';

export interface FieldOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  // Options pour select/radio
  options?: FieldOption[];
  // Configuration spécifique
  variant?: 'default' | 'gradient-crou';
  // Validation Zod personnalisée
  validation?: z.ZodTypeAny;
  // Affichage conditionnel
  condition?: (values: any) => boolean;
  // Props supplémentaires
  props?: Record<string, any>;
}

export interface FormSection {
  title?: string;
  description?: string;
  fields: FormField[];
  columns?: 1 | 2 | 3;
}

export interface ModernFormBuilderProps {
  sections: FormSection[];
  defaultValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  variant?: 'default' | 'gradient-crou';
  className?: string;
}

export function ModernFormBuilder({
  sections,
  defaultValues = {},
  onSubmit,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  onCancel,
  isSubmitting = false,
  variant = 'default',
  className,
}: ModernFormBuilderProps) {
  // Générer le schéma Zod depuis la configuration
  const generateSchema = () => {
    const schemaFields: Record<string, z.ZodTypeAny> = {};

    sections.forEach(section => {
      section.fields.forEach(field => {
        let fieldSchema: z.ZodTypeAny;

        if (field.validation) {
          fieldSchema = field.validation;
        } else {
          // Schéma par défaut selon le type
          switch (field.type) {
            case 'email':
              fieldSchema = z.string().email('Email invalide');
              break;
            case 'number':
              fieldSchema = z.number();
              break;
            case 'tel':
              fieldSchema = z.string().regex(/^\+?[0-9\s-]+$/, 'Numéro invalide');
              break;
            case 'checkbox':
              fieldSchema = z.boolean();
              break;
            case 'date':
              fieldSchema = z.date();
              break;
            default:
              fieldSchema = z.string();
          }

          // Ajouter required si nécessaire
          if (field.required && fieldSchema instanceof z.ZodString) {
            fieldSchema = fieldSchema.min(1, `${field.label} est requis`);
          } else if (!field.required) {
            fieldSchema = fieldSchema.optional();
          }
        }

        schemaFields[field.name] = fieldSchema;
      });
    });

    return z.object(schemaFields);
  };

  const schema = generateSchema();

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const formValues = watch();

  const renderField = (field: FormField) => {
    // Vérifier la condition d'affichage
    if (field.condition && !field.condition(formValues)) {
      return null;
    }

    const commonProps = {
      label: field.label,
      placeholder: field.placeholder,
      disabled: field.disabled || isSubmitting,
      helperText: field.helperText,
      variant: field.variant || variant,
      ...field.props,
    };

    return (
      <Controller
        key={field.name}
        name={field.name}
        control={control}
        render={({ field: { onChange, value, ...fieldProps } }) => {
          const error = errors[field.name]?.message as string | undefined;

          switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
            case 'number':
            case 'tel':
              return (
                <ModernInput
                  {...commonProps}
                  {...fieldProps}
                  type={field.type}
                  value={value || ''}
                  onChange={onChange}
                  error={error}
                />
              );

            case 'textarea':
              return (
                <ModernTextarea
                  {...commonProps}
                  {...fieldProps}
                  value={value || ''}
                  onChange={onChange}
                  error={error}
                />
              );

            case 'select':
              return (
                <ModernSelect
                  {...commonProps}
                  {...fieldProps}
                  options={field.options || []}
                  value={value}
                  onChange={onChange}
                  error={error}
                />
              );

            case 'checkbox':
              return (
                <ModernCheckbox
                  {...commonProps}
                  {...fieldProps}
                  checked={value || false}
                  onChange={(e) => onChange(e.target.checked)}
                />
              );

            case 'date':
              return (
                <ModernDatePicker
                  {...commonProps}
                  {...fieldProps}
                  value={value}
                  onChange={onChange}
                  error={error}
                />
              );

            case 'autocomplete':
              return (
                <ModernAutocomplete
                  {...commonProps}
                  {...fieldProps}
                  options={field.options || []}
                  value={value}
                  onChange={onChange}
                  error={error}
                />
              );

            default:
              return <></>;
          }
        }}
      />
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={cn('space-y-8', className)}
    >
      {sections.map((section, sectionIndex) => (
        <div
          key={sectionIndex}
          className="bg-white rounded-xl border border-gray-200 p-6"
        >
          {/* Section Header */}
          {(section.title || section.description) && (
            <div className="mb-6">
              {section.title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {section.title}
                </h3>
              )}
              {section.description && (
                <p className="text-sm text-gray-600">{section.description}</p>
              )}
            </div>
          )}

          {/* Fields Grid */}
          <div
            className={cn(
              'grid gap-6',
              section.columns === 1 && 'grid-cols-1',
              section.columns === 2 && 'grid-cols-1 md:grid-cols-2',
              section.columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
              !section.columns && 'grid-cols-1 md:grid-cols-2'
            )}
          >
            {section.fields.map(renderField)}
          </div>
        </div>
      ))}

      {/* Actions Footer */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
        {onCancel && (
          <ModernButton
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelLabel}
          </ModernButton>
        )}
        <ModernButton
          type="submit"
          variant="gradient-crou"
          loading={isSubmitting}
          disabled={isSubmitting}
        >
          {submitLabel}
        </ModernButton>
      </div>
    </form>
  );
}

export default ModernFormBuilder;
