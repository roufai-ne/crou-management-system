/**
 * FICHIER: apps/web/src/main.tsx
 * POINT D'ENTRÉE: Application CROU Management System
 *
 * DESCRIPTION:
 * Point d'entrée principal de l'application React
 * Configuration des providers et initialisation de l'app
 * Service Worker pour PWA et mode offline
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ================================================================================================
// CONFIGURATION DE L'APPLICATION
// ================================================================================================

// Initialisation du mode strict en développement
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Élément root non trouvé. Vérifiez que index.html contient <div id="root"></div>');
}

// Créer la racine React
const root = ReactDOM.createRoot(rootElement);

// Render de l'application avec StrictMode en développement
root.render(
  <React.StrictMode>
    <App />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  </React.StrictMode>
);

// ================================================================================================
// SERVICE WORKER (PWA)
// ================================================================================================

// Enregistrement du Service Worker pour les fonctionnalités PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      console.log('Service Worker enregistré avec succès:', registration);

      // Vérifier les mises à jour du Service Worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;

        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nouvelle version disponible
              console.log('Nouvelle version de l\'application disponible. Rechargez la page.');

              // Afficher une notification à l'utilisateur
              if (window.confirm('Une nouvelle version de l\'application est disponible. Voulez-vous recharger la page ?')) {
                window.location.reload();
              }
            }
          });
        }
      });

      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        registration.update();
      }, 60 * 60 * 1000);

    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
    }
  });
}

// ================================================================================================
// GESTION DES ERREURS GLOBALES
// ================================================================================================

// Capturer les erreurs non gérées
window.addEventListener('unhandledrejection', (event) => {
  console.error('Promesse rejetée non gérée:', event.reason);

  // En production, envoyer l'erreur à un service de monitoring
  if (import.meta.env.PROD) {
    // Intégration Sentry: Voir docs/THIRD_PARTY_INTEGRATIONS.md section "Sentry - Monitoring des Erreurs"
    // Exemple: Sentry.captureException(event.error/event.reason)
    console.error('Erreur envoyée au service de monitoring');
  }
});

// Capturer les erreurs JavaScript
window.addEventListener('error', (event) => {
  console.error('Erreur globale:', event.error);

  // En production, envoyer l'erreur à un service de monitoring
  if (import.meta.env.PROD) {
    // Intégration Sentry: Voir docs/THIRD_PARTY_INTEGRATIONS.md section "Sentry - Monitoring des Erreurs"
    // Exemple: Sentry.captureException(event.error/event.reason)
    console.error('Erreur envoyée au service de monitoring');
  }
});

// ================================================================================================
// MODE DÉVELOPPEMENT
// ================================================================================================

if (import.meta.env.DEV) {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║     CROU MANAGEMENT SYSTEM - MODE DÉVELOPPEMENT      ║
║                                                       ║
║     Version: ${import.meta.env.VITE_APP_VERSION || '1.0.0'}                                   ║
║     Environment: ${import.meta.env.MODE}                              ║
║                                                       ║
║     Système de gestion des centres CROU du Niger     ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);

  // Activer les outils de développement React (développement seulement)
  if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
    // eslint-disable-next-line no-console
    console.info('React DevTools détecté');
  }

  // Exposer des utilitaires de debug en développement
  window.CROU_DEBUG = {
    clearCache: () => {
      localStorage.clear();
      sessionStorage.clear();
      // eslint-disable-next-line no-console
      console.info('Cache local vidé');
    },
    resetAuth: () => {
      localStorage.removeItem('crou-auth');
      localStorage.removeItem('refreshToken');
      window.location.href = '/auth/login';
    },
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  };
}

// ================================================================================================
// PERFORMANCE MONITORING
// ================================================================================================

// Mesurer les performances de chargement initial
if ('performance' in window && 'measure' in window.performance) {
  window.addEventListener('load', () => {
    const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (perfData) {
      const metrics = {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        domInteractive: perfData.domInteractive - perfData.fetchStart,
        pageLoadTime: perfData.loadEventEnd - perfData.fetchStart
      };

      console.log('Métriques de performance:', metrics);

      // En production, envoyer les métriques à un service d'analytics
      if (import.meta.env.PROD) {
        // Intégration Google Analytics: Voir docs/THIRD_PARTY_INTEGRATIONS.md section "Google Analytics"
        // Exemple: trackEvent('Performance', 'PageLoad', path, metrics.pageLoadTime)
        console.log('Métriques envoyées au service d\'analytics');
      }
    }
  });
}

// ================================================================================================
// HOT MODULE REPLACEMENT (HMR)
// ================================================================================================

if (import.meta.hot) {
  import.meta.hot.accept();
  console.log('Hot Module Replacement activé');
}
