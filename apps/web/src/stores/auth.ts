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
export type UserRole =
  | 'Super Admin'
  | 'Admin Ministère'
  | 'Directeur CROU'
  | 'Gestionnaire Logement'
  | 'Gestionnaire Stocks'
  | 'Gestionnaire Transport'
  | 'Comptable'
  | 'Utilisateur'
  | 'Etudiant'
  // Types legacy pour compatibilité
  | 'admin'
  | 'manager'
  | 'user';

/**
 * Niveau hiérarchique dans l'organisation
 * - ministry: Niveau 0 - Ministère (gouvernement central)
 * - region: Niveau 1 - Région académique
 * - crou: Niveau 2 - Centre Régional des Œuvres Universitaires
 */
export type HierarchyLevel = 'ministry' | 'region' | 'crou';

/**
 * Type de tenant (ancienne terminologie - maintenu pour compatibilité)
 * @deprecated Utiliser HierarchyLevel à la place
 */
export type TenantType = 'ministry' | 'region' | 'crou' | 'ministere';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;

  // Hiérarchie organisationnelle (support 3 niveaux)
  tenantId: string;
  tenantType: TenantType;
  hierarchyLevel: HierarchyLevel; // Niveau hiérarchique normalisé

  // Identifiants des niveaux supérieurs (pour navigation hiérarchique)
  ministryId?: string;
  regionId?: string;
  crouId?: string;

  // Métadonnées du tenant
  tenantName?: string;
  tenantCode?: string;
  tenantPath?: string; // Ex: "/ministere/region-ile-de-france/crou-paris"

  // Permissions et accès
  permissions: string[];
  canManageBudget?: boolean;
  canManageAllocations?: boolean;
  canValidateAllocations?: boolean;
  canViewAllTenants?: boolean;

  // Métadonnées
  name?: string;
  lastLoginAt?: Date;

  // Rétrocompatibilité
  /** @deprecated Utiliser hierarchyLevel à la place */
  level?: 'ministere' | 'crou' | 'region';
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

  // Actions d'authentification
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearError: () => void;
  clearAuth: () => void;

  // Actions de permissions
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasRole: (role: string) => boolean;
  hasExtendedAccess: () => boolean;

  // Actions de hiérarchie (NEW - support 3 niveaux)
  getHierarchyLevel: () => HierarchyLevel | null;
  isMinistryLevel: () => boolean;
  isRegionLevel: () => boolean;
  isCrouLevel: () => boolean;
  canAccessLevel: (level: HierarchyLevel) => boolean;
  canManageTenant: (tenantId: string, tenantLevel: HierarchyLevel) => boolean;
  getTenantIds: () => { ministryId?: string; regionId?: string; crouId?: string };
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
        // Le Super Admin a toutes les permissions
        if (user?.role === 'Super Admin') {
          return true;
        }
        return user?.permissions?.includes(permission) || false;
      },

      hasAnyPermission: (permissions: string[]) => {
        const { user } = get();
        // Le Super Admin a toutes les permissions
        if (user?.role === 'Super Admin') {
          return true;
        }
        return permissions.some(permission => user?.permissions?.includes(permission)) || false;
      },

      hasRole: (role: string) => {
        const { user } = get();
        return user?.role === role;
      },

      hasExtendedAccess: () => {
        const { user } = get();
        // Super Admin et Admin Ministère ont accès étendu
        return user?.role === 'Super Admin' || user?.role === 'Admin Ministère' || user?.hierarchyLevel === 'ministry';
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
      },

      // ============================================================================
      // NOUVELLES MÉTHODES DE HIÉRARCHIE (support 3 niveaux)
      // ============================================================================

      /**
       * Obtenir le niveau hiérarchique de l'utilisateur connecté
       */
      getHierarchyLevel: () => {
        const { user } = get();
        return user?.hierarchyLevel || null;
      },

      /**
       * Vérifier si l'utilisateur est au niveau Ministère
       */
      isMinistryLevel: () => {
        const { user } = get();
        return user?.hierarchyLevel === 'ministry';
      },

      /**
       * Vérifier si l'utilisateur est au niveau Région
       */
      isRegionLevel: () => {
        const { user } = get();
        return user?.hierarchyLevel === 'region';
      },

      /**
       * Vérifier si l'utilisateur est au niveau CROU
       */
      isCrouLevel: () => {
        const { user } = get();
        return user?.hierarchyLevel === 'crou';
      },

      /**
       * Vérifier si l'utilisateur peut accéder à un niveau hiérarchique donné
       * Règle: Un utilisateur peut accéder à son niveau et aux niveaux inférieurs
       * - Ministry peut accéder à tout
       * - Region peut accéder à region et crou
       * - CROU peut accéder uniquement à crou
       */
      canAccessLevel: (level: HierarchyLevel) => {
        const { user } = get();
        if (!user) return false;

        const currentLevel = user.hierarchyLevel;

        // Mapping des niveaux (0=ministry, 1=region, 2=crou)
        const levelOrder: Record<HierarchyLevel, number> = {
          ministry: 0,
          region: 1,
          crou: 2
        };

        // Peut accéder si le niveau cible est >= au niveau actuel
        return levelOrder[level] >= levelOrder[currentLevel];
      },

      /**
       * Vérifier si l'utilisateur peut gérer un tenant spécifique
       * Règle: Un utilisateur peut gérer:
       * - Son propre tenant
       * - Les tenants de niveaux inférieurs dans sa hiérarchie
       */
      canManageTenant: (tenantId: string, tenantLevel: HierarchyLevel) => {
        const { user } = get();
        if (!user) return false;

        // Super Admin peut tout gérer
        if (user.role === 'Super Admin') return true;

        // Si c'est le tenant de l'utilisateur
        if (user.tenantId === tenantId) return true;

        // Vérifier la hiérarchie
        const currentLevel = user.hierarchyLevel;

        // Ministry peut gérer regions et crous sous son autorité
        if (currentLevel === 'ministry') {
          return tenantLevel === 'region' || tenantLevel === 'crou';
        }

        // Region peut gérer crous sous son autorité
        if (currentLevel === 'region' && tenantLevel === 'crou') {
          // Vérifier que le CROU appartient bien à cette région
          // (nécessite une vérification plus approfondie avec les données du tenant)
          return true;
        }

        return false;
      },

      /**
       * Obtenir les identifiants des tenants à tous les niveaux
       */
      getTenantIds: () => {
        const { user } = get();
        if (!user) return {};

        return {
          ministryId: user.ministryId,
          regionId: user.regionId,
          crouId: user.crouId
        };
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
