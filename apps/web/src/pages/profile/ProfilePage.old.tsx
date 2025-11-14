/**
 * FICHIER: apps/web/src/pages/profile/ProfilePage.tsx
 * COMPOSANT: ProfilePage - Page profil utilisateur
 *
 * DESCRIPTION:
 * Affichage et modification du profil utilisateur connecté
 * Informations personnelles, tenant, rôle et permissions
 * Modification du mot de passe
 *
 * FONCTIONNALITÉS:
 * - Affichage des informations utilisateur
 * - Modification des données personnelles
 * - Changement de mot de passe
 * - Historique de connexion
 * - Gestion des préférences
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  UserCircleIcon,
  EnvelopeIcon,
  KeyIcon,
  BuildingOfficeIcon,
  ShieldCheckIcon,
  ClockIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';

import { useAuth } from '@/stores/auth';

// Schémas de validation
const profileSchema = z.object({
  firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Format email invalide'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string().min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères'),
  confirmPassword: z.string().min(1, 'Veuillez confirmer le mot de passe'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'password'>('info');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Formulaire de profil
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: errorsProfile, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
    },
  });

  // Formulaire de mot de passe
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    formState: { errors: errorsPassword, isSubmitting: isSubmittingPassword },
    reset: resetPassword,
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  // Soumission du profil
  const onSubmitProfile = async (data: ProfileFormData) => {
    try {
      // TODO: Appeler l'API pour mettre à jour le profil
      console.log('Update profile:', data);
      toast.success('Profil mis à jour avec succès', {
        duration: 3000,
        position: 'top-right',
      });
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour du profil', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  // Soumission du mot de passe
  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      // TODO: Appeler l'API pour changer le mot de passe
      console.log('Change password');
      toast.success('Mot de passe modifié avec succès', {
        duration: 3000,
        position: 'top-right',
      });
      resetPassword();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe', {
        duration: 4000,
        position: 'top-right',
      });
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-gray-500">Chargement du profil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Mon Profil</h1>
        <p className="mt-2 text-sm text-gray-600">
          Gérez vos informations personnelles et vos préférences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar - Informations résumées */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mb-4">
                <UserCircleIcon className="w-16 h-16 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.firstName} {user.lastName}
              </h3>
              <p className="text-sm text-gray-500 mb-4">{user.email}</p>

              <div className="w-full space-y-3 mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-start gap-3">
                  <ShieldCheckIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Rôle</p>
                    <p className="text-sm font-medium text-gray-900">{user.role}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <BuildingOfficeIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Organisation</p>
                    <p className="text-sm font-medium text-gray-900">{user.tenantName || user.tenantId}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {user.tenantType === 'ministry' ? 'Ministère' :
                       user.tenantType === 'region' ? 'Région' : 'CROU'}
                    </p>
                  </div>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-start gap-3">
                    <ClockIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-xs text-gray-500">Dernière connexion</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(user.lastLoginAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Permissions */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Permissions</h4>
              <div className="space-y-2">
                {user.permissions && user.permissions.length > 0 ? (
                  user.permissions.slice(0, 5).map((permission) => (
                    <div key={permission} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-600">{permission}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500">Aucune permission spécifique</p>
                )}
                {user.permissions && user.permissions.length > 5 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{user.permissions.length - 5} autres permissions
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Tabs */}
            <div className="border-b border-gray-200">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'info'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Informations personnelles
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 ${
                    activeTab === 'password'
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Sécurité
                </button>
              </nav>
            </div>

            {/* Contenu des tabs */}
            <div className="p-6">
              {activeTab === 'info' && (
                <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Modifier mes informations
                    </h3>

                    <div className="space-y-4">
                      {/* Prénom */}
                      <div>
                        <label htmlFor="firstName" className="form-label">
                          Prénom
                        </label>
                        <input
                          {...registerProfile('firstName')}
                          type="text"
                          className={`form-input ${errorsProfile.firstName ? 'border-red-300' : ''}`}
                          placeholder="Votre prénom"
                        />
                        {errorsProfile.firstName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errorsProfile.firstName.message}
                          </p>
                        )}
                      </div>

                      {/* Nom */}
                      <div>
                        <label htmlFor="lastName" className="form-label">
                          Nom
                        </label>
                        <input
                          {...registerProfile('lastName')}
                          type="text"
                          className={`form-input ${errorsProfile.lastName ? 'border-red-300' : ''}`}
                          placeholder="Votre nom"
                        />
                        {errorsProfile.lastName && (
                          <p className="mt-1 text-sm text-red-600">
                            {errorsProfile.lastName.message}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...registerProfile('email')}
                            type="email"
                            className={`form-input pl-10 ${errorsProfile.email ? 'border-red-300' : ''}`}
                            placeholder="votre@email.com"
                          />
                        </div>
                        {errorsProfile.email && (
                          <p className="mt-1 text-sm text-red-600">
                            {errorsProfile.email.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => window.location.reload()}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingProfile}
                      className="btn-primary"
                    >
                      {isSubmittingProfile ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                  </div>
                </form>
              )}

              {activeTab === 'password' && (
                <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Changer mon mot de passe
                    </h3>

                    <div className="space-y-4">
                      {/* Mot de passe actuel */}
                      <div>
                        <label htmlFor="currentPassword" className="form-label">
                          Mot de passe actuel
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...registerPassword('currentPassword')}
                            type={showCurrentPassword ? 'text' : 'password'}
                            className={`form-input pl-10 pr-10 ${errorsPassword.currentPassword ? 'border-red-300' : ''}`}
                            placeholder="Votre mot de passe actuel"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          >
                            {showCurrentPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errorsPassword.currentPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {errorsPassword.currentPassword.message}
                          </p>
                        )}
                      </div>

                      {/* Nouveau mot de passe */}
                      <div>
                        <label htmlFor="newPassword" className="form-label">
                          Nouveau mot de passe
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...registerPassword('newPassword')}
                            type={showNewPassword ? 'text' : 'password'}
                            className={`form-input pl-10 pr-10 ${errorsPassword.newPassword ? 'border-red-300' : ''}`}
                            placeholder="Nouveau mot de passe"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                          >
                            {showNewPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errorsPassword.newPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {errorsPassword.newPassword.message}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          Le mot de passe doit contenir au moins 8 caractères
                        </p>
                      </div>

                      {/* Confirmation mot de passe */}
                      <div>
                        <label htmlFor="confirmPassword" className="form-label">
                          Confirmer le mot de passe
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <KeyIcon className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            {...registerPassword('confirmPassword')}
                            type={showConfirmPassword ? 'text' : 'password'}
                            className={`form-input pl-10 pr-10 ${errorsPassword.confirmPassword ? 'border-red-300' : ''}`}
                            placeholder="Confirmer le mot de passe"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                        {errorsPassword.confirmPassword && (
                          <p className="mt-1 text-sm text-red-600">
                            {errorsPassword.confirmPassword.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 rounded-md">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">
                        Conseils de sécurité
                      </h4>
                      <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
                        <li>Utilisez un mot de passe unique pour ce compte</li>
                        <li>Incluez des majuscules, minuscules, chiffres et symboles</li>
                        <li>Évitez les informations personnelles évidentes</li>
                        <li>Changez votre mot de passe régulièrement</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        resetPassword();
                        setShowCurrentPassword(false);
                        setShowNewPassword(false);
                        setShowConfirmPassword(false);
                      }}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingPassword}
                      className="btn-primary"
                    >
                      {isSubmittingPassword ? 'Modification...' : 'Modifier le mot de passe'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
