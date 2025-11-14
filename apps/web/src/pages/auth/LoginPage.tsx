/**
 * FICHIER: apps\web\src\pages\auth\LoginPage.tsx
 * COMPOSANT: LoginPage - Page de connexion utilisateurs CROU
 * 
 * DESCRIPTION:
 * Formulaire de connexion sécurisé pour les 9 profils utilisateurs
 * Validation côté client avec messages d'erreur français
 * Gestion des états de chargement et erreurs
 * Redirection automatique après connexion réussie
 * 
 * FONCTIONNALITÉS:
 * - Formulaire email/mot de passe avec validation
 * - Gestion erreurs et messages utilisateur
 * - États de chargement pendant authentification
 * - Redirection vers page d'origine après login
 * - Support des 9 profils CROU/Ministère
 * 
 * PROFILS SUPPORTÉS:
 * - Ministère: ministre, directeur_finances, resp_appro, controleur
 * - CROU: directeur, secretaire, chef_financier, comptable, intendant,
 *         magasinier, chef_transport, chef_logement, chef_restauration
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  EyeIcon,
  EyeSlashIcon,
  KeyIcon,
  EnvelopeIcon,
  ExclamationCircleIcon
} from '@/components/ui/IconFallback';

import { useAuth } from '@/stores/auth';
import { AuthError, AuthLoading } from '@/components/layout/AuthLayout';

// Schéma de validation Zod
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
});

type LoginFormData = z.infer<typeof loginSchema>;

// Composant LoginPage
export const LoginPage: React.FC = () => {
  // Tous les hooks doivent être appelés en premier, avant tout retour conditionnel
  const auth = useAuth();
  const { login, isAuthenticated, isLoading } = auth || {};
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [componentError, setComponentError] = useState<string | null>(null);

  // Configuration formulaire avec validation - DOIT être avant les retours conditionnels
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  // Debug
  console.log('LoginPage - auth:', auth);
  console.log('LoginPage - isAuthenticated:', isAuthenticated);
  console.log('LoginPage - isLoading:', isLoading);

  // Gestion d'erreur avec useEffect
  useEffect(() => {
    const handleError = (error: ErrorEvent) => {
      console.error('Erreur dans LoginPage:', error);
      setComponentError('Une erreur s\'est produite lors du chargement de la page.');
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // Vérification de sécurité - après tous les hooks
  if (!auth) {
    return <div>Chargement...</div>;
  }

  // Affichage de l'erreur de composant
  if (componentError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Erreur de chargement</h1>
          <p className="text-gray-600 mb-4">{componentError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  // Redirection si déjà connecté
  // Vérifier d'abord sessionStorage pour les redirections après expiration de session
  const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
  const from = redirectAfterLogin || (location.state as any)?.from || '/dashboard';

  if (isAuthenticated) {
    // Nettoyer le sessionStorage après utilisation
    if (redirectAfterLogin) {
      sessionStorage.removeItem('redirectAfterLogin');
    }
    return <Navigate to={from} replace />;
  }

  // Fonction de soumission
  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoginError(null);
      await login(data.email, data.password);
      // Succès
      toast.success('Connexion réussie !', {
        duration: 3000,
        position: 'top-center',
      });
      // Redirection gérée automatiquement par le store auth
    } catch (error: any) {
      // Gestion des erreurs spécifiques
      const errorMessage = error.response?.data?.message || error.message;

      if (errorMessage.includes('email')) {
        const msg = 'Email non reconnu';
        setError('email', { message: msg });
        toast.error(msg, { duration: 4000, position: 'top-center' });
      } else if (errorMessage.includes('password') || errorMessage.includes('mot de passe')) {
        const msg = 'Mot de passe incorrect';
        setError('password', { message: msg });
        toast.error(msg, { duration: 4000, position: 'top-center' });
      } else if (errorMessage.includes('inactive') || errorMessage.includes('désactivé')) {
        const msg = 'Votre compte a été désactivé. Contactez votre administrateur.';
        setLoginError(msg);
        toast.error(msg, { duration: 5000, position: 'top-center' });
      } else if (errorMessage.includes('locked') || errorMessage.includes('bloqué')) {
        const msg = 'Compte temporairement bloqué suite à de multiples tentatives.';
        setLoginError(msg);
        toast.error(msg, { duration: 5000, position: 'top-center' });
      } else {
        const msg = 'Erreur de connexion. Vérifiez vos identifiants.';
        setLoginError(msg);
        toast.error(msg, { duration: 4000, position: 'top-center' });
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Connexion
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Accédez au système de gestion CROU
        </p>
      </div>

      {/* Erreur globale */}
      {loginError && (
        <AuthError 
          message={loginError} 
          onRetry={() => setLoginError(null)} 
        />
      )}

      {/* Loading state */}
      {isLoading && <AuthLoading />}

      {/* Formulaire de connexion */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Champ Email */}
        <div>
          <label htmlFor="email" className="form-label">
            Adresse email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              placeholder="nom@crou.gov.ne"
              className={`
                form-input pl-10
                ${errors.email ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              disabled={isSubmitting}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 mr-1" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Champ Mot de passe */}
        <div>
          <label htmlFor="password" className="form-label">
            Mot de passe
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <KeyIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              className={`
                form-input pl-10 pr-10
                ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
              `}
              disabled={isSubmitting}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={() => setShowPassword(!showPassword)}
              disabled={isSubmitting}
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-400" />
              ) : (
                <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center">
              <ExclamationCircleIcon className="w-4 h-4 mr-1" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Options additionnelles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Se souvenir de moi
            </label>
          </div>

          <button
            type="button"
            className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300"
            onClick={() => {
              // TODO: Implémenter reset password
              alert('Fonctionnalité de réinitialisation à implémenter');
            }}
          >
            Mot de passe oublié ?
          </button>
        </div>

        {/* Bouton de connexion */}
        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className={`
            group relative w-full flex justify-center py-3 px-4 border border-transparent 
            text-sm font-medium rounded-md text-white 
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
            transition-colors duration-200
            ${isSubmitting || isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-primary-600 hover:bg-primary-700'
            }
          `}
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connexion...
            </div>
          ) : (
            'Se connecter'
          )}
        </button>
      </form>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 dark:text-gray-400">
        <p>
          En vous connectant, vous acceptez les conditions d'utilisation
          et la politique de confidentialité du système CROU.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
