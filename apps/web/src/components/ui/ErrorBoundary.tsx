/**
 * FICHIER: apps\web\src\components\ui\ErrorBoundary.tsx
 * COMPOSANT: ErrorBoundary - Composant de gestion d'erreurs React
 * 
 * DESCRIPTION:
 * Composant Error Boundary pour capturer et gérer les erreurs JavaScript
 * dans l'arbre des composants React. Affiche une interface de fallback
 * élégante en cas d'erreur et permet la récupération.
 * 
 * FONCTIONNALITÉS:
 * - Capture des erreurs JavaScript dans les composants enfants
 * - Interface de fallback personnalisable
 * - Bouton de récupération pour réessayer
 * - Logging des erreurs pour le débogage
 * - Support du mode développement vs production
 * 
 * USAGE:
 * <ErrorBoundary fallback={<CustomError />}>
 *   <App />
 * </ErrorBoundary>
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    
    // Log l'erreur
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Callback personnalisé si fourni
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Interface de fallback personnalisée si fournie
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Interface de fallback par défaut
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
            </div>
            
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Oups ! Une erreur s'est produite
            </h1>
            
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Nous sommes désolés, quelque chose s'est mal passé. 
              Veuillez réessayer ou contacter le support si le problème persiste.
            </p>

            {/* Détails de l'erreur en mode développement */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-left">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                  Détails de l'erreur (développement uniquement) :
                </h3>
                <pre className="text-xs text-red-700 dark:text-red-300 overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors"
              >
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Réessayer
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
export default ErrorBoundary;
