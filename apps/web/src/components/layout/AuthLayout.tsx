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
import { Globe, Shield, Building2 } from 'lucide-react';

// Props interface
interface AuthLayoutProps {
  children: React.ReactNode;
}

// Composant AuthLayout
export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex">
      {/* Section gauche - Branding République du Niger */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-crou relative overflow-hidden">
        {/* Motifs décoratifs */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Contenu branding */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white">
          {/* Haut - Logo République */}
          <div>
            <div className="flex items-center gap-4 mb-12">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span className="text-2xl font-bold bg-gradient-crou bg-clip-text text-transparent">NE</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">République du Niger</h1>
                <p className="text-sm text-white/90">Fraternité - Travail - Progrès</p>
              </div>
            </div>

            {/* Titre principal */}
            <div className="space-y-6">
              <h2 className="text-4xl font-bold leading-tight">
                Système de Gestion<br />
                des Œuvres Universitaires
              </h2>
              <p className="text-xl text-white/90">
                Centre Régional des Œuvres Universitaires
              </p>
              <div className="w-24 h-1 bg-white/30 rounded-full"></div>
            </div>
          </div>

          {/* Milieu - Caractéristiques */}
          <div className="space-y-6 my-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold">Couverture Nationale</h3>
                <p className="text-white/80 text-sm">
                  8 centres régionaux supervisés depuis le Ministère
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold">Sécurité Renforcée</h3>
                <p className="text-white/80 text-sm">
                  Authentification multi-niveaux et traçabilité complète
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5" strokeWidth={2} />
              </div>
              <div>
                <h3 className="font-semibold">Gestion Intégrée</h3>
                <p className="text-white/80 text-sm">
                  Finance, Stocks, Logement, Transport, Restauration
                </p>
              </div>
            </div>
          </div>

          {/* Bas - Description et ministère */}
          <div className="space-y-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h3 className="text-lg font-semibold mb-3">À propos du système</h3>
              <p className="text-white/90 text-sm leading-relaxed">
                Plateforme intégrée de gestion des services universitaires incluant 
                l'hébergement, la restauration, le transport, et l'approvisionnement. 
                Solution moderne pour améliorer la vie étudiante au Niger.
              </p>
            </div>

            <div className="flex items-center gap-3 text-white/80 text-sm">
              <div className="w-px h-12 bg-white/30"></div>
              <div>
                <p className="font-medium">Ministère de l'Enseignement Supérieur,</p>
                <p>de la Recherche et de l'Innovation</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section droite - Formulaires d'authentification */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="mx-auto w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-crou rounded-full flex items-center justify-center shadow-lg">
                <span className="text-xl font-bold text-white">NE</span>
              </div>
              <div className="text-left">
                <h1 className="text-lg font-bold text-gray-900">République du Niger</h1>
                <p className="text-xs text-gray-600">CROU</p>
              </div>
            </div>
          </div>

          {/* Zone de contenu des formulaires */}
          <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100">
            {children}
          </div>

          {/* Footer */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-gray-600">
              Besoin d'aide ?
              <button className="font-medium text-primary-600 hover:text-primary-500 ml-1">
                Contactez le support
              </button>
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>Version 1.0.0 - MESRIT Niger</p>
              <p>© 2024 Ministère de l'Enseignement Supérieur et de la Recherche</p>
              <p>République du Niger - Tous droits réservés</p>
            </div>
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
    <div className="rounded-md bg-red-50 p-4 mb-4 border border-red-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <Shield className="h-5 w-5 text-red-400" strokeWidth={2} />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Erreur d'authentification
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{message}</p>
          </div>
          {onRetry && (
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <button
                  type="button"
                  className="bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
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
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      <span className="ml-3 text-sm text-gray-600">Connexion en cours...</span>
    </div>
  );
};

export default AuthLayout;
