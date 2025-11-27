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
import { Mail, Lock } from 'lucide-react';

import { useAuth } from '@/stores/auth';
import { AuthError, AuthLoading } from '@/components/layout/AuthLayout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
    <div className="space-y-8">
      {/* En-tête */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">
          Connexion
        </h2>
        <p className="mt-2 text-gray-600">
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
        <Input
          {...register('email')}
          type="email"
          label="Adresse email"
          placeholder="nom@crou.gov.ne"
          icon={Mail}
          error={errors.email?.message}
          disabled={isSubmitting}
          required
          variant="gradient"
          autoComplete="email"
        />

        <Input
          {...register('password')}
          type="password"
          label="Mot de passe"
          placeholder="Votre mot de passe"
          icon={Lock}
          error={errors.password?.message}
          disabled={isSubmitting}
          required
          variant="gradient"
          autoComplete="current-password"
        />

        {/* Options additionnelles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
              Se souvenir de moi
            </label>
          </div>

          <button
            type="button"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Mot de passe oublié ?
          </button>
        </div>

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          fullWidth
          loading={isSubmitting || isLoading}
        >
          Se connecter
        </Button>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Pas encore de compte étudiant ?{' '}
            <a href="/register" className="font-medium text-primary-600 hover:text-primary-500">
              S'inscrire maintenant
            </a>
          </p>
        </div>
      </form>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        <p>
          En vous connectant, vous acceptez les conditions d'utilisation
          et la politique de confidentialité du système CROU.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
