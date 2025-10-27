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
 * - /reports: Rapports
 * - /admin: Administration
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

// Providers et contextes
import { AuthProvider } from '@/stores/auth';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Components layout
import { MainLayout } from '@/components/layout/MainLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';

// Pages principales
import { LoginPage } from '@/pages/auth/LoginPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { FinancialPage } from '@/pages/financial/FinancialPage';
import { StocksPage } from '@/pages/stocks/StocksPage';
import { HousingPage } from '@/pages/housing/HousingPage';
import { TransportPage } from '@/pages/transport/TransportPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { AdminPage } from '@/pages/admin/AdminPage';

// Components utilitaires
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Configuration
import '@/styles/globals.css';

// Client React Query avec configuration optimisée
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
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
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Router>
            <div className="min-h-screen bg-gray-50">
              {/* Configuration des routes */}
              <Routes>
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
                      <Routes>
                        {/* Dashboard - Page d'accueil */}
                        <Route path="/dashboard" element={<DashboardPage />} />
                        
                        {/* Modules principaux */}
                        <Route path="/financial/*" element={<FinancialPage />} />
                        <Route path="/stocks/*" element={<StocksPage />} />
                        <Route path="/housing/*" element={<HousingPage />} />
                        <Route path="/transport/*" element={<TransportPage />} />
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
                            <Route path="/examples/buttons" element={
                              React.lazy(() => import('@/pages/examples/ButtonExamples'))
                            } />
                            <Route path="/examples/inputs" element={
                              React.lazy(() => import('@/pages/examples/InputExamples'))
                            } />
                            <Route path="/examples/selects" element={
                              React.lazy(() => import('@/pages/examples/SelectExamples'))
                            } />
                            <Route path="/examples/form-controls" element={
                              React.lazy(() => import('@/pages/examples/FormControlExamples'))
                            } />
                            <Route path="/examples/tables" element={
                              React.lazy(() => import('@/pages/examples/TableExamples'))
                            } />
                            <Route path="/examples/kpis" element={
                              React.lazy(() => import('@/pages/examples/KPIExamples'))
                            } />
                            <Route path="/examples/badges" element={
                              React.lazy(() => import('@/pages/examples/BadgeExamples'))
                            } />
                            <Route path="/examples/cards" element={
                              React.lazy(() => import('@/pages/examples/CardExamples'))
                            } />
                            <Route path="/examples/modals" element={
                              React.lazy(() => import('@/pages/examples/ModalExamples'))
                            } />
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
                React.lazy(() => import('@tanstack/react-query-devtools').then(module => ({
                  default: module.ReactQueryDevtools
                })))
              )}
            </div>
            </Router>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
