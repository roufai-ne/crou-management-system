/**
 * FICHIER: apps/web/src/pages/profile/ProfilePage.tsx
 * COMPOSANT: ProfilePage - Page profil utilisateur (Version simplifiée)
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
      // TODO: Appeler l'API
      console.log('Update profile:', data);
      toast.success('Profil mis à jour');
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la mise à jour');
    }
  };

  // Soumission du mot de passe
  const onSubmitPassword = async (data: PasswordFormData) => {
    try {
      // TODO: Appeler l'API
      console.log('Change password');
      toast.success('Mot de passe modifié');
      resetPassword();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors du changement de mot de passe');
    }
  };

  if (!user) {
    return <div className="flex items-center justify-center h-screen">Chargement...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profil</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Gérez vos informations personnelles
        </p>
      </div>

      {/* Card principale */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700">
        {/* Header avec avatar */}
        <div className="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
              <UserCircleIcon className="w-10 h-10 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{user.role}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'info'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Informations
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`py-4 px-4 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'password'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Sécurité
            </button>
          </nav>
        </div>

        {/* Contenu */}
        <div className="p-6">
          {activeTab === 'info' && (
            <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Prénom */}
                <div>
                  <label className="form-label">Prénom</label>
                  <input
                    {...registerProfile('firstName')}
                    className={`form-input ${errorsProfile.firstName ? 'border-red-500' : ''}`}
                  />
                  {errorsProfile.firstName && (
                    <p className="form-error">{errorsProfile.firstName.message}</p>
                  )}
                </div>

                {/* Nom */}
                <div>
                  <label className="form-label">Nom</label>
                  <input
                    {...registerProfile('lastName')}
                    className={`form-input ${errorsProfile.lastName ? 'border-red-500' : ''}`}
                  />
                  {errorsProfile.lastName && (
                    <p className="form-error">{errorsProfile.lastName.message}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="form-label">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerProfile('email')}
                    type="email"
                    className={`form-input pl-10 ${errorsProfile.email ? 'border-red-500' : ''}`}
                  />
                </div>
                {errorsProfile.email && (
                  <p className="form-error">{errorsProfile.email.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="btn-secondary">Annuler</button>
                <button type="submit" disabled={isSubmittingProfile} className="btn-primary">
                  {isSubmittingProfile ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
              {/* Mot de passe actuel */}
              <div>
                <label className="form-label">Mot de passe actuel</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerPassword('currentPassword')}
                    type={showCurrentPassword ? 'text' : 'password'}
                    className={`form-input pl-10 pr-10 ${errorsPassword.currentPassword ? 'border-red-500' : ''}`}
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
                  <p className="form-error">{errorsPassword.currentPassword.message}</p>
                )}
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="form-label">Nouveau mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerPassword('newPassword')}
                    type={showNewPassword ? 'text' : 'password'}
                    className={`form-input pl-10 pr-10 ${errorsPassword.newPassword ? 'border-red-500' : ''}`}
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
                  <p className="form-error">{errorsPassword.newPassword.message}</p>
                )}
                <p className="form-help">Minimum 8 caractères</p>
              </div>

              {/* Confirmation */}
              <div>
                <label className="form-label">Confirmer le mot de passe</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...registerPassword('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`form-input pl-10 pr-10 ${errorsPassword.confirmPassword ? 'border-red-500' : ''}`}
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
                  <p className="form-error">{errorsPassword.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => resetPassword()} className="btn-secondary">
                  Annuler
                </button>
                <button type="submit" disabled={isSubmittingPassword} className="btn-primary">
                  {isSubmittingPassword ? 'Modification...' : 'Modifier'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
