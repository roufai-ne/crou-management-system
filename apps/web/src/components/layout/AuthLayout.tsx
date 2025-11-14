/**
 * FICHIER: apps\web\src\components\layout\AuthLayout.tsx
 * COMPOSANT: AuthLayout - Layout pour pages d'authentification
 * 
 * DESCRIPTION:
 * Layout spécialisé pour les pages de connexion/authentification
 * Design centré avec branding CROU et informations système
 * Responsive avec image de background Niger
 * Support multilingue français uniquement selon PRD
 * 
 * STRUCTURE:
 * - Fond avec image/dégradé thème CROU
 * - Card centrée pour formulaires auth
 * - Logo et informations institutionnelles
 * - Footer avec version et support
 * 
 * PROPS:
 * - children: ReactNode - Composants d'authentification
 * 
 * USAGE:
 * <AuthLayout>
 *   <LoginPage />
 * </AuthLayout>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { 
  AcademicCapIcon,
  GlobeAltIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon
} from '@heroicons/react/24/outline';

// Props interface
interface AuthLayoutProps {
  children: React.ReactNode;
}

// Composant AuthLayout
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Branding et informations */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 to-primary-800 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="currentColor" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        {/* Contenu branding */}
        <div className="relative flex flex-col justify-center px-12 text-white">
          {/* Logo et titre principal */}
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <div className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-4">
                <AcademicCapIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">CROU</h1>
                <p className="text-primary-100 text-sm">Centres Régionaux des Œuvres Universitaires</p>
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-4">
              Système de Gestion Intégré
            </h2>
            <p className="text-primary-100 text-lg leading-relaxed">
              Plateforme unifiée pour la gestion des 8 centres régionaux 
              des œuvres universitaires du Niger.
            </p>
          </div>

          {/* Caractéristiques du système */}
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <GlobeAltIcon className="w-6 h-6 text-primary-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Couverture Nationale</h3>
                <p className="text-primary-100 text-sm">
                  Supervision centralisée de tous les CROU du Niger depuis le Ministère
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <ShieldCheckIcon className="w-6 h-6 text-primary-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Sécurité Renforcée</h3>
                <p className="text-primary-100 text-sm">
                  Authentification multi-niveaux et traçabilité complète des opérations
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <BuildingOffice2Icon className="w-6 h-6 text-primary-200" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Gestion Intégrée</h3>
                <p className="text-primary-100 text-sm">
                  Finance, Stocks, Logement, Transport, Restauration en une seule plateforme
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques en temps réel (optionnel) */}
          <div className="mt-12 grid grid-cols-2 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">8</div>
              <div className="text-primary-200 text-sm">CROU Connectés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">24/7</div>
              <div className="text-primary-200 text-sm">Disponibilité</div>
            </div>
          </div>
        </div>

        {/* Décoration géométrique */}
        <div className="absolute bottom-0 right-0 transform translate-x-16 translate-y-16">
          <div className="w-64 h-64 bg-white bg-opacity-5 rounded-full"></div>
        </div>
        <div className="absolute top-0 right-0 transform translate-x-32 -translate-y-32">
          <div className="w-96 h-96 bg-white bg-opacity-5 rounded-full"></div>
        </div>
      </div>

      {/* Section droite - Formulaires d'authentification */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900">
        <div className="mx-auto w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
              <AcademicCapIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">CROU Niger</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">Système de Gestion</p>
          </div>

          {/* Zone de contenu des formulaires */}
          <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700">
            {children}
          </div>

          {/* Informations de support */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Besoin d'aide ?
              <button className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 ml-1">
                Contactez le support
              </button>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Version 1.0.0 - MESRIT Niger
            </p>
          </div>

          {/* Mentions légales */}
          <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
            <p>
              © 2024 Ministère de l'Enseignement Supérieur et de la Recherche
            </p>
            <p className="mt-1">
              République du Niger - Tous droits réservés
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Composant d'erreur d'authentification
export const AuthError: React.FC<{ message: string; onRetry?: () => void }> = ({
  message,
  onRetry
}) => {
  return (
    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 mb-4 border border-red-200 dark:border-red-800">
      <div className="flex">
        <div className="flex-shrink-0">
          <ShieldCheckIcon className="h-5 w-5 text-red-400 dark:text-red-500" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
            Erreur d'authentification
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-400">
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <button
                  type="button"
                  className="bg-red-50 dark:bg-red-900/30 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                  onClick={onRetry}
                >
                  Réessayer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Composant de chargement auth
export const AuthLoading: React.FC = () => {
  return (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">Connexion en cours...</span>
    </div>
  );
};

export default AuthLayout;
