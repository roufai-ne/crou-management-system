/**
 * FICHIER: apps\web\src\pages\examples\FormControlExamples.tsx
 * PAGE: Exemples de composants de contrôle de formulaire
 * 
 * DESCRIPTION:
 * Page de démonstration des composants Checkbox, Radio et Switch
 * Exemples d'utilisation dans des formulaires CROU
 * Cas d'usage réels avec validation et états
 * 
 * FONCTIONNALITÉS:
 * - Checkboxes simples et groupées
 * - Radio buttons avec variantes
 * - Switches avec états de chargement
 * - Validation de formulaire
 * - États d'erreur et de succès
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState } from 'react';
import {
    UserIcon,
    CogIcon,
    BellIcon,
    CheckCircleIcon,
    ClockIcon,
    StarIcon
} from '@heroicons/react/24/outline';
import { Checkbox, CheckboxGroup } from '@/components/ui/Checkbox';
import { Radio, RadioGroup } from '@/components/ui/Radio';
import { Switch } from '@/components/ui/Switch';
import { Button } from '@/components/ui/Button';

// Interface pour les données de formulaire
interface FormData {
    preferences: {
        theme: string;
        language: string;
        notifications: Record<string, boolean>;
    };
    account: {
        twoFactor: boolean;
        newsletter: boolean;
        marketing: boolean;
        analytics: boolean;
    };
    meal: {
        dietary: string[];
        allergies: string[];
        priority: string;
    };
    terms: {
        privacy: boolean;
        terms: boolean;
        marketing: boolean;
    };
}

const FormControlExamples: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        preferences: {
            theme: 'auto',
            language: 'fr',
            notifications: {
                email: true,
                push: false,
                sms: false
            }
        },
        account: {
            twoFactor: false,
            newsletter: true,
            marketing: false,
            analytics: true
        },
        meal: {
            dietary: [],
            allergies: [],
            priority: 'balanced'
        },
        terms: {
            privacy: false,
            terms: false,
            marketing: false
        }
    });

    const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

    const themeOptions = [
        {
            value: 'light',
            label: 'Clair',
            description: 'Interface claire et lumineuse',
            icon: <StarIcon className="h-4 w-4" />
        },
        {
            value: 'dark',
            label: 'Sombre',
            description: 'Interface sombre pour les yeux',
            icon: <ClockIcon className="h-4 w-4" />
        },
        {
            value: 'auto',
            label: 'Automatique',
            description: 'Suit les préférences système',
            icon: <CogIcon className="h-4 w-4" />
        }
    ];

    const handleAsyncSwitch = async (key: string, checked: boolean) => {
        setLoadingStates(prev => ({ ...prev, [key]: true }));

        await new Promise(resolve => setTimeout(resolve, 1500));

        setFormData(prev => ({
            ...prev,
            account: {
                ...prev.account,
                [key]: checked
            }
        }));

        setLoadingStates(prev => ({ ...prev, [key]: false }));
    };

    const validateForm = () => {
        const errors: Record<string, string> = {};

        if (!formData.terms.privacy) {
            errors.privacy = 'Vous devez accepter la politique de confidentialité';
        }

        if (!formData.terms.terms) {
            errors.terms = 'Vous devez accepter les conditions d\'utilisation';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            console.log('Formulaire valide:', formData);
            alert('Paramètres sauvegardés avec succès!');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                        Composants de Contrôle de Formulaire
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
                        Exemples d'utilisation des composants Checkbox, Radio et Switch dans des formulaires CROU.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-12">
                    {/* Section Checkboxes */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                            <CheckCircleIcon className="h-6 w-6 text-primary-600" />
                            Checkboxes - Sélections multiples
                        </h2>

                        <div className="space-y-4">
                            <Checkbox
                                label="J'accepte la politique de confidentialité"
                                description="Consultez notre politique de confidentialité"
                                checked={formData.terms.privacy}
                                onChange={(checked) => setFormData(prev => ({
                                    ...prev,
                                    terms: { ...prev.terms, privacy: checked }
                                }))}
                                required
                                error={validationErrors.privacy}
                            />

                            <Checkbox
                                label="J'accepte les conditions d'utilisation"
                                description="Consultez nos conditions d'utilisation"
                                checked={formData.terms.terms}
                                onChange={(checked) => setFormData(prev => ({
                                    ...prev,
                                    terms: { ...prev.terms, terms: checked }
                                }))}
                                required
                                error={validationErrors.terms}
                            />
                        </div>
                    </section>

                    {/* Section Radio Buttons */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                            <UserIcon className="h-6 w-6 text-primary-600" />
                            Radio Buttons - Sélections exclusives
                        </h2>

                        <RadioGroup
                            options={themeOptions}
                            value={formData.preferences.theme}
                            onChange={(value) => setFormData(prev => ({
                                ...prev,
                                preferences: { ...prev.preferences, theme: value as string }
                            }))}
                            label="Thème de l'interface"
                            description="Choisissez l'apparence de l'application"
                            variant="card"
                            required
                        />
                    </section>

                    {/* Section Switches */}
                    <section className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
                            <CogIcon className="h-6 w-6 text-primary-600" />
                            Switches - Activation/Désactivation
                        </h2>

                        <div className="space-y-4">
                            <Switch
                                label="Authentification à deux facteurs"
                                description="Sécurité renforcée pour votre compte"
                                checked={formData.account.twoFactor}
                                loading={loadingStates.twoFactor}
                                onChange={(checked) => handleAsyncSwitch('twoFactor', checked)}
                                variant="success"
                                size="md"
                            />

                            <Switch
                                label="Newsletter hebdomadaire"
                                description="Recevez notre newsletter chaque semaine"
                                checked={formData.account.newsletter}
                                loading={loadingStates.newsletter}
                                onChange={(checked) => handleAsyncSwitch('newsletter', checked)}
                                variant="default"
                            />
                        </div>
                    </section>

                    {/* Actions */}
                    <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setFormData({
                                    preferences: {
                                        theme: 'auto',
                                        language: 'fr',
                                        notifications: { email: true, push: false, sms: false }
                                    },
                                    account: {
                                        twoFactor: false,
                                        newsletter: true,
                                        marketing: false,
                                        analytics: true
                                    },
                                    meal: {
                                        dietary: [],
                                        allergies: [],
                                        priority: 'balanced'
                                    },
                                    terms: {
                                        privacy: false,
                                        terms: false,
                                        marketing: false
                                    }
                                });
                                setValidationErrors({});
                            }}
                        >
                            Réinitialiser
                        </Button>

                        <Button type="submit" size="lg">
                            Sauvegarder les paramètres
                        </Button>
                    </div>
                </form>

                {/* Aperçu des données */}
                <section className="mt-12 bg-gray-100 dark:bg-gray-800 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Aperçu des données du formulaire
                    </h3>
                    <pre className="text-sm bg-white dark:bg-gray-900 p-4 rounded border overflow-auto max-h-96">
                        {JSON.stringify(formData, null, 2)}
                    </pre>
                </section>
            </div>
        </div>
    );
};

export default FormControlExamples;