/**
 * FICHIER: apps\web\src\services\api\authService.ts
 * SERVICE: Service d'authentification API
 * 
 * DESCRIPTION:
 * Service pour gérer l'authentification avec l'API backend
 * Login, logout, refresh token, gestion des erreurs
 * Intégration avec le store Zustand
 * 
 * FONCTIONNALITÉS:
 * - Login avec email/password
 * - Refresh token automatique
 * - Logout et nettoyage
 * - Gestion des erreurs API
 * - Intercepteurs Axios
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { useAuth } from '@/stores/auth';

// Configuration de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Interface pour les réponses d'authentification
export interface LoginResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    status: string;
    tenantId: string;
    tenant: {
      id: string;
      name: string;
      type: 'ministere' | 'ministry' | 'region' | 'crou';
      code: string;
      region?: string;
      parentId?: string; // ID du tenant parent dans la hiérarchie
      path?: string; // Chemin hiérarchique
    };
    permissions?: string[];
    lastLoginAt?: string;
  };
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
  tenantId: string;
  tenant: {
    id: string;
    name: string;
    type: 'ministere' | 'ministry' | 'region' | 'crou';
    code: string;
    region?: string;
    parentId?: string;
    path?: string;
  };
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

// Interface pour les erreurs API
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

// Classe du service d'authentification
export class AuthService {
  private api: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private isLoggingOut: boolean = false;

  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/auth`,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Configuration des intercepteurs Axios
   */
  private setupInterceptors(): void {
    // Intercepteur de requête pour ajouter le token
    this.api.interceptors.request.use(
      (config) => {
        const authStore = useAuth.getState();
        const token = authStore.accessToken;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse pour gérer les erreurs et refresh token
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Si erreur 401 et pas déjà en cours de refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const newToken = await this.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh échoué, déconnecter l'utilisateur
            this.logout();
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  /**
   * Connexion utilisateur
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // DÉSACTIVÉ: Mode développement avec mock data
      // Toujours utiliser l'API réelle
      /* if (import.meta.env.DEV) {
        console.log('🔓 Connexion en mode développement - simulation');
        ...
      } */

      // Appeler l'API réelle
      const response = await this.api.post<any>('/login', {
        email,
        password,
      });

      // Extraire les données de la réponse (structure: { success, data: { user, tokens } })
      console.log('🔍 Login response:', response.data);

      const responseData = response.data.data || response.data;
      const user = responseData.user;
      const tokens = responseData.tokens || responseData;

      console.log('🔍 Response data:', responseData);
      console.log('🔍 User:', user);
      console.log('🔍 Tokens:', tokens);

      if (!user) {
        throw new Error('Données utilisateur manquantes dans la réponse');
      }

      const { accessToken, refreshToken, expiresIn } = tokens;

      // Mettre à jour le store avec les bonnes méthodes
      const authStore = useAuth.getState();

      // Mapper le type de tenant vers le niveau hiérarchique normalisé
      const tenantType = user.tenant?.type || 'crou';
      const hierarchyLevel = (() => {
        if (tenantType === 'ministere' || tenantType === 'ministry') return 'ministry';
        if (tenantType === 'region') return 'region';
        return 'crou';
      })();

      // Calculer les identifiants de hiérarchie selon le niveau
      const hierarchyIds = (() => {
        const ids: { ministryId?: string; regionId?: string; crouId?: string } = {};

        if (hierarchyLevel === 'ministry') {
          ids.ministryId = user.tenant?.id || user.tenantId;
        } else if (hierarchyLevel === 'region') {
          ids.regionId = user.tenant?.id || user.tenantId;
          // Si le backend fournit le ministryId parent
          ids.ministryId = user.tenant?.parentId || undefined;
        } else if (hierarchyLevel === 'crou') {
          ids.crouId = user.tenant?.id || user.tenantId;
          // Si le backend fournit la région et le ministère parents
          ids.regionId = user.tenant?.parentId || undefined;
          // TODO: Récupérer ministryId depuis la hiérarchie complète si disponible
        }

        return ids;
      })();

      authStore.setUser({
        id: user.id,
        email: user.email,
        firstName: user.name?.split(' ')[0] || '',
        lastName: user.name?.split(' ').slice(1).join(' ') || '',
        name: user.name || user.email,
        role: (user.role?.name || user.role) as any,

        // Hiérarchie organisationnelle (support 3 niveaux)
        tenantId: user.tenant?.id || user.tenantId,
        tenantType: tenantType as any,
        hierarchyLevel,

        // Identifiants hiérarchiques
        ...hierarchyIds,

        // Métadonnées du tenant
        tenantName: user.tenant?.name,
        tenantCode: user.tenant?.code,
        tenantPath: user.tenant?.path,

        // Permissions
        permissions: user.permissions || [],
        canManageBudget: user.permissions?.includes('budget:manage') || false,
        canManageAllocations: user.permissions?.includes('allocations:manage') || false,
        canValidateAllocations: user.permissions?.includes('allocations:validate') || false,
        canViewAllTenants: user.permissions?.includes('tenants:view:all') || user.role === 'admin' || false,

        // Métadonnées
        lastLoginAt: user.lastLoginAt ? new Date(user.lastLoginAt) : new Date(),

        // Rétrocompatibilité
        level: user.tenant?.type === 'ministere' ? 'ministere' : (user.tenant?.type === 'region' ? 'region' : 'crou')
      });
      authStore.setTokens(accessToken, refreshToken);

      // Programmer le refresh automatique
      this.scheduleTokenRefresh(expiresIn);

      return response.data;
    } catch (error: any) {
      // Gestion spécifique de l'erreur 429 (Too Many Requests)
      if (error.response?.status === 429) {
        console.warn('⚠️ Trop de tentatives de connexion - Rate limiting activé');
        throw new Error('Trop de tentatives de connexion. Veuillez patienter avant de réessayer.');
      }
      
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Déconnexion utilisateur
   */
  async logout(): Promise<void> {
    // Éviter les déconnexions multiples
    if (this.isLoggingOut) {
      console.log('🔒 Déconnexion déjà en cours...');
      return;
    }

    this.isLoggingOut = true;

    try {
      const authStore = useAuth.getState();
      
      // En mode développement, ne pas appeler l'API si c'est un token de dev
      if (import.meta.env.DEV && authStore.accessToken === 'dev-token') {
        console.log('🔒 Déconnexion en mode développement - pas d\'appel API');
      } else if (authStore.accessToken && authStore.accessToken !== 'dev-token') {
        // Appeler l'API de logout seulement si c'est un vrai token
        try {
          await this.api.post('/logout');
        } catch (error: any) {
          // Si erreur 429, ne pas relancer l'erreur
          if (error.response?.status === 429) {
            console.warn('⚠️ Rate limiting sur logout - déconnexion locale uniquement');
          } else {
            throw error;
          }
        }
      }
    } catch (error) {
      console.warn('Erreur lors du logout API:', error);
    } finally {
      // Nettoyer le store dans tous les cas
      const authStore = useAuth.getState();
      authStore.clearAuth();
      
      // Annuler le refresh automatique
      this.cancelTokenRefresh();
      
      // Réinitialiser le flag
      this.isLoggingOut = false;
    }
  }

  /**
   * Rafraîchir le token d'accès
   */
  async refreshAccessToken(): Promise<string> {
    // Éviter les refresh multiples simultanés
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performTokenRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      return newToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  /**
   * Effectuer le refresh du token
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      const authStore = useAuth.getState();
      const refreshToken = authStore.refreshToken;

      if (!refreshToken) {
        throw new Error('Aucun refresh token disponible');
      }

      const response = await this.api.post<any>('/refresh', {
        refreshToken,
      });

      // Extraire les données de la réponse (structure: { success, data: { accessToken, refreshToken, expiresIn } })
      const responseData = response.data.data || response.data;
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = responseData;

      // Mettre à jour le store
      authStore.setTokens(accessToken, newRefreshToken || refreshToken);

      // Programmer le prochain refresh
      this.scheduleTokenRefresh(expiresIn);

      return accessToken;
    } catch (error) {
      console.error('Erreur refresh token:', error);
      throw error;
    }
  }

  /**
   * Récupérer le profil utilisateur
   */
  async getProfile(): Promise<UserProfile> {
    try {
      const response = await this.api.get<{ user: UserProfile }>('/profile');
      return response.data.user;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  /**
   * Programmer le refresh automatique du token
   */
  private scheduleTokenRefresh(expiresIn: number): void {
    // Refresh 5 minutes avant l'expiration
    const refreshTime = (expiresIn - 300) * 1000;
    
    setTimeout(async () => {
      try {
        await this.refreshAccessToken();
      } catch (error) {
        console.error('Erreur refresh automatique:', error);
        this.logout();
      }
    }, refreshTime);
  }

  /**
   * Annuler le refresh automatique
   */
  private cancelTokenRefresh(): void {
    // Dans une implémentation plus robuste, on utiliserait clearTimeout
    // Pour simplifier, on laisse le timeout se déclencher
  }

  /**
   * Gestion des erreurs API
   */
  private handleApiError(error: any): void {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiError;
      
      if (apiError) {
        throw new Error(apiError.message || apiError.error || 'Erreur API');
      }
    }
    
    throw new Error('Erreur de connexion au serveur');
  }

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    const authStore = useAuth.getState();
    return authStore.isAuthenticated && !!authStore.accessToken;
  }

  /**
   * Obtenir le token d'accès actuel
   */
  getAccessToken(): string | null {
    const authStore = useAuth.getState();
    return authStore.accessToken;
  }

  /**
   * Sait-on rafraîchir le token ?
   */
  hasRefreshToken(): boolean {
    const authStore = useAuth.getState();
    return Boolean(authStore.refreshToken);
  }

  /**
   * Obtenir les informations de l'utilisateur
   */
  getCurrentUser() {
    const authStore = useAuth.getState();
    return authStore.user;
  }
}

// Instance singleton du service
export const authService = new AuthService();

// Export des types pour utilisation dans les composants
export type { LoginResponse, RefreshResponse, UserProfile, ApiError };
