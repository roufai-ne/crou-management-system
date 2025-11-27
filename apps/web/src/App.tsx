/**
 * FICHIER: apps\web\src\App.tsx
 * COMPOSANT: App - Composant racine de l'application CROU
 * 
 * DESCRIPTION:
 * Composant principal qui configure les providers et le routing
 * Gestion de l'authentification et des états globaux
 * Layout principal avec sidebar et navigation
 * 
 * PROVIDERS:
 * - AuthProvider: Gestion authentification utilisateurs
 * - QueryProvider: Gestion cache et requêtes API
 * - ThemeProvider: Thème et configuration UI
 * - ToastProvider: Notifications système
 * 
 * ROUTES:
 * - /login: Authentification
 * - /dashboard: Tableau de bord
 * - /financial: Module financier
 * - /stocks: Gestion stocks
 * - /housing: Logement
 * - /transport: Transport
 * - /restauration: Restauration universitaire
 * - /reports: Rapports
 * - /admin: Administration
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Providers et contextes
import { ThemeProvider } from '@/contexts/ThemeContext';

// Components layout
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages principales
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { FinancialPage } from '@/pages/financial/FinancialPage';
import { StocksPage } from '@/pages/stocks/StocksPage';
import { ProcurementPage } from '@/pages/procurement/ProcurementPage';
import { HousingPage } from '@/pages/housing/HousingPage';
import { TransportPage } from '@/pages/transport/TransportPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { AdminPage } from '@/pages/admin/AdminPage';
import { RestaurationPage } from '@/pages/restauration/RestaurationPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { FAQPage } from '@/pages/help/FAQPage';
import { StyleTest } from '@/pages/test/StyleTest';
import { LoginTest } from '@/pages/test/LoginTest';
import { CSSTest } from '@/pages/test/CSSTest';
import DesignShowcase from '@/pages/DesignShowcase';
import KPIComparison from '@/pages/KPIComparison';
import ComponentShowcase from '@/pages/ComponentShowcase';

// Components utilitaires
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAuth } from '@/stores/auth';

// Configuration
import '@/styles/globals.css';

// Lazy loaded components
const StudentApplicationPortal = React.lazy(() => import('@/pages/housing/StudentApplicationPortal'));
const StudentRegistrationPage = React.lazy(() => import('@/pages/students/StudentRegistrationPage'));
const ButtonExamples = React.lazy(() => import('@/pages/examples/ButtonExamples'));
const InputExamples = React.lazy(() => import('@/pages/examples/InputExamples'));
const SelectExamples = React.lazy(() => import('@/pages/examples/SelectExamples'));
const FormControlExamples = React.lazy(() => import('@/pages/examples/FormControlExamples'));
const TableExamples = React.lazy(() => import('@/pages/examples/TableExamples'));
const KPIExamples = React.lazy(() => import('@/pages/examples/KPIExamples'));
const BadgeExamples = React.lazy(() => import('@/pages/examples/BadgeExamples'));
const CardExamples = React.lazy(() => import('@/pages/examples/CardExamples'));
const ModalExamples = React.lazy(() => import('@/pages/examples/ModalExamples'));
const Sprint3Demo = React.lazy(() => import('@/pages/examples/Sprint3Demo'));
const Sprint4Demo = React.lazy(() => import('@/pages/examples/Sprint4Demo'));
const Sprint5Demo = React.lazy(() => import('@/pages/examples/Sprint5Demo'));
const Sprint6Demo = React.lazy(() => import('@/pages/examples/Sprint6Demo'));
const LazyFAQPage = React.lazy(() => import('@/pages/help/FAQPage'));
const HomePage = React.lazy(() => import('@/pages/home/HomePage'));

// Client React Query avec configuration optimisée
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error: any) => {
        // Ne pas retry sur les erreurs 4xx
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Composant App principal
function App() {
  const { isAuthenticated, setUser } = useAuth();

  // Bootstrap d'auth en développement - Option de connexion rapide
  useEffect(() => {
    if (import.meta.env.DEV) {
      // Exposer une fonction de connexion rapide pour le développement
      (window as any).devLogin = () => {
        const { setUser, setTokens } = useAuth.getState();
        setUser({
          id: 'dev-admin',
          email: 'dev@crou.local',
          firstName: 'Dev',
          lastName: 'Admin',
          name: 'Dev Admin',
          role: 'admin',
          tenantId: 'niamey',
          tenantType: 'crou',
          hierarchyLevel: 'crou',
          level: 'crou',
          crouId: 'niamey',
          permissions: ['all', 'read', 'write', 'admin', 'dashboard:read', 'financial:read', 'stocks:read', 'housing:read', 'transport:read', 'restauration:read', 'reports:read', 'admin:read'],
          lastLoginAt: new Date()
        });
        setTokens('dev-token', 'dev-refresh-token');
        console.log('🔓 Connexion rapide activée pour le développement');
      };

      // Exposer une fonction de déconnexion rapide
      (window as any).devLogout = () => {
        const { clearAuth } = useAuth.getState();
        clearAuth();
        console.log('🔒 Déconnexion rapide activée pour le développement');
      };

      console.log('🛠️  Mode développement - Utilisez window.devLogin() pour vous connecter rapidement');
    }
  }, []);

  // Écouter les événements d'expiration de session
  useEffect(() => {
    const handleSessionExpired = (event: Event) => {
      const customEvent = event as CustomEvent;
      const message = customEvent.detail?.message || 'Votre session a expiré. Veuillez vous reconnecter.';

      toast.error(message, {
        duration: 4000,
        position: 'top-center',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          padding: '16px',
        },
        icon: '🔒',
      });
    };

    window.addEventListener('session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('session-expired', handleSessionExpired);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <div className="min-h-screen bg-gray-50">
              {/* Configuration des routes */}
              <Routes>
                {/* Pages de test des styles (sans authentification) */}
                <Route path="/test-styles" element={<StyleTest />} />
                <Route path="/test-login" element={<LoginTest />} />
                <Route path="/test-css" element={<CSSTest />} />
                <Route path="/design-showcase" element={<DesignShowcase />} />
                <Route path="/kpi-comparison" element={<KPIComparison />} />
                <Route path="/component-showcase" element={<ComponentShowcase />} />

                {/* Inscription étudiant (hors AuthLayout car page pleine largeur) */}
                <Route path="/register" element={
                  <React.Suspense fallback={<LoadingScreen />}>
                    <StudentRegistrationPage />
                  </React.Suspense>
                } />

                {/* Routes d'authentification */}
                <Route path="/auth/*" element={
                  <AuthLayout>
                    <Routes>
                      <Route path="login" element={<LoginPage />} />
                      <Route path="*" element={<Navigate to="/auth/login" replace />} />
                    </Routes>
                  </AuthLayout>
                } />

                {/* Routes protégées de l'application */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <MainLayout>
                      <React.Suspense fallback={<LoadingScreen />}>
                        <Routes>
                          {/* Dashboard - Page d'accueil */}
                          <Route path="/dashboard" element={<DashboardPage />} />

                          {/* Profil utilisateur */}
                          <Route path="/profile" element={<ProfilePage />} />

                          {/* Aide et support */}
                          <Route path="/faq" element={<FAQPage />} />

                          {/* Modules principaux */}
                          <Route path="/financial/*" element={<FinancialPage />} />
                          <Route path="/stocks/*" element={<StocksPage />} />
                          <Route path="/procurement/*" element={<ProcurementPage />} />
                          <Route path="/housing/*" element={<HousingPage />} />
                          <Route path="/housing/apply" element={<StudentApplicationPortal />} />
                          <Route path="/transport/*" element={<TransportPage />} />
                          <Route path="/restauration/*" element={<RestaurationPage />} />
                          <Route path="/reports/*" element={<ReportsPage />} />

                          {/* Administration (accès limité) */}
                          <Route
                            path="/admin/*"
                            element={
                              <ProtectedRoute requiredPermissions={['admin']}>
                                <AdminPage />
                              </ProtectedRoute>
                            }
                          />

                          {/* Pages d'exemples (développement) */}
                          {process.env.NODE_ENV === 'development' && (
                            <>
                              <Route path="/examples/buttons" element={<ButtonExamples />} />
                              <Route path="/examples/inputs" element={<InputExamples />} />
                              <Route path="/examples/selects" element={<SelectExamples />} />
                              <Route path="/examples/form-controls" element={<FormControlExamples />} />
                              <Route path="/examples/tables" element={<TableExamples />} />
                              <Route path="/examples/kpis" element={<KPIExamples />} />
                              <Route path="/examples/badges" element={<BadgeExamples />} />
                              <Route path="/examples/cards" element={<CardExamples />} />
                              <Route path="/examples/modals" element={<ModalExamples />} />
                              <Route path="/examples/sprint3" element={<Sprint3Demo />} />
                              <Route path="/examples/sprint4" element={<Sprint4Demo />} />
                              <Route path="/examples/sprint5" element={<Sprint5Demo />} />
                              <Route path="/examples/sprint6" element={<Sprint6Demo />} />
                              <Route path="/help" element={<LazyFAQPage />} />
                              <Route path="/home" element={<HomePage />} />
                            </>
                          )}

                          {/* Redirections */}
                          <Route path="/" element={<Navigate to="/dashboard" replace />} />
                          <Route path="*" element={
                            <div className="flex items-center justify-center min-h-screen">
                              <div className="text-center">
                                <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                                <p className="text-gray-600 mb-6">Page non trouvée</p>
                                <button
                                  onClick={() => window.history.back()}
                                  className="btn-primary"
                                >
                                  Retour
                                </button>
                              </div>
                            </div>
                          } />
                        </Routes>
                      </React.Suspense>
                    </MainLayout>
                  </ProtectedRoute>
                } />
              </Routes>

              {/* Notifications globales */}
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#fff',
                    color: '#374151',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    borderRadius: '0.5rem',
                    border: '1px solid #e5e7eb',
                  },
                  success: {
                    iconTheme: {
                      primary: '#16a34a',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    iconTheme: {
                      primary: '#dc2626',
                      secondary: '#fff',
                    },
                  },
                }}
              />

              {/* React Query DevTools (uniquement en développement) */}
              {process.env.NODE_ENV === 'development' && (
                <React.Suspense fallback={null}>
                  <ReactQueryDevtools initialIsOpen={false} />
                </React.Suspense>
              )}
            </div>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
