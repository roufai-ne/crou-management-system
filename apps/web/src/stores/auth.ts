/**
 * FICHIER: apps\web\src\stores\auth.ts
 * STORE: Auth - Store d'authentification Zustand
 * 
 * DESCRIPTION:
 * Store global pour la gestion de l'état d'authentification
 * Utilisateur connecté, permissions, et données de session
 * 
 * FONCTIONNALITÉS:
 * - État de connexion utilisateur
 * - Données du profil utilisateur
 * - Gestion des permissions et rôles
 * - Persistance de session
 * - Actions d'authentification
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types d'utilisateur et permissions
export type Permission = string;
export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  tenantId: string;
  tenantType: 'crou' | 'ministry';
  level?: 'ministere' | 'crou';
  crouId?: string;
  name?: string;
  permissions: string[];
  lastLoginAt?: Date;
}

export interface AuthState {
  // État
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  lastLoginAttempt: number | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      // État initial - Non authentifié par défaut
      isAuthenticated: false,
      user: null,
      isLoading: false,
      error: null,
      accessToken: null,
      refreshToken: null,
      lastLoginAttempt: null,

      // Actions
      login: async (email: string, password: string) => {
        const { lastLoginAttempt } = get();
        const now = Date.now();

        // Vérifier le délai entre les tentatives (2 secondes minimum)
        if (lastLoginAttempt && (now - lastLoginAttempt) < 2000) {
          const remainingTime = Math.ceil((2000 - (now - lastLoginAttempt)) / 1000);
          set({
            error: `Veuillez patienter ${remainingTime} seconde(s) avant de réessayer.`,
            isLoading: false
          });
          return;
        }

        set({ isLoading: true, error: null, lastLoginAttempt: now });

        try {
          // Utiliser le service d'authentification API
          // Le service gère lui-même la mise à jour du store via setUser() et setTokens()
          const { authService } = await import('@/services/api/authService');
          await authService.login(email, password);

          // Réinitialiser isLoading et lastLoginAttempt
          set({
            isLoading: false,
            error: null,
            lastLoginAttempt: null
          });
        } catch (error) {
          set({
            isAuthenticated: false,
            user: null,
            accessToken: null,
            refreshToken: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Erreur de connexion',
            lastLoginAttempt: now
          });
        }
      },

      logout: async () => {
        try {
          // Appeler le service de déconnexion API
          const { authService } = await import('@/services/api/authService');
          await authService.logout();
        } catch (error) {
          console.warn('Erreur lors de la déconnexion API:', error);
          // Nettoyer le store même en cas d'erreur
          set({
            isAuthenticated: false,
            user: null,
            error: null,
            accessToken: null,
            refreshToken: null
          });
        }
      },

      setUser: (user: User) => {
        set({
          isAuthenticated: true,
          user
        });
      },

      setTokens: (accessToken: string, refreshToken: string) => {
        set({
          accessToken,
          refreshToken
        });
      },

      clearError: () => {
        set({ error: null });
      },

      hasPermission: (permission: string) => {
        const { user } = get();
        return user?.permissions.includes(permission) || false;
      },

      hasAnyPermission: (permissions: string[]) => {
        const { user } = get();
        return permissions.some(permission => user?.permissions.includes(permission)) || false;
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.role === role;
      },

      // Méthode pour nettoyer le store sans appeler l'API
      clearAuth: () => {
        set({
          isAuthenticated: false,
          user: null,
          error: null,
          accessToken: null,
          refreshToken: null
        });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken
      })
    }
  )
);
