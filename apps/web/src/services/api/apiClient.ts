/**
 * FICHIER: apps\web\src\services\api\apiClient.ts
 * CLIENT: Client API centralisé
 * 
 * DESCRIPTION:
 * Client Axios centralisé pour toutes les requêtes API
 * Gestion automatique des tokens, erreurs et retry
 * Intercepteurs pour l'authentification
 * 
 * FONCTIONNALITÉS:
 * - Configuration centralisée Axios
 * - Gestion automatique des tokens JWT
 * - Retry automatique sur erreurs réseau
 * - Gestion des erreurs standardisées
 * - Intercepteurs pour auth et logging
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { authService } from './authService';

// Configuration de base de l'API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const API_TIMEOUT = 30000; // 30 secondes

// Interface pour les réponses API standardisées
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Interface pour les erreurs API
export interface ApiError {
  error: string;
  message?: string;
  details?: any;
  statusCode?: number;
}

// Classe du client API
export class ApiClient {
  private api: AxiosInstance;
  private retryCount = 0;
  private maxRetries = 3;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
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
    // Intercepteur de requête
    this.api.interceptors.request.use(
      (config) => {
        // Ajouter le token d'authentification
        const token = authService.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Ajouter le tenantId si disponible dans le store
        try {
          const tenantFilterState = localStorage.getItem('tenant-filter-storage');
          if (tenantFilterState) {
            const parsed = JSON.parse(tenantFilterState);
            const tenantId = parsed?.state?.selectedTenantId;

            // Si un tenant est sélectionné ET ce n'est pas "all", l'ajouter aux params
            if (tenantId && tenantId !== 'all') {
              config.params = {
                ...config.params,
                tenantId: tenantId
              };

              // Injection du header x-target-tenant-id pour les écritures (POST, PUT, PATCH, DELETE)
              // Cela permet au middleware backend de savoir sur quel tenant on agit
              if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
                config.headers['x-target-tenant-id'] = tenantId;
              }
            }
          }
        } catch (error) {
          // Ignorer les erreurs de lecture du store
          console.debug('Tenant filter not available:', error);
        }

        // Log des requêtes en développement
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params);
        }

        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Intercepteur de réponse
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        // Log des réponses en développement
        if (import.meta.env.DEV) {
          console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        }

        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Gestion des erreurs 429 (Too Many Requests) - ne pas retry
        if (error.response?.status === 429) {
          console.warn('⚠️ Trop de requêtes - Rate limiting activé');
          return Promise.reject(this.handleError(error));
        }

        // Gestion des erreurs 401 (non autorisé)
        if (error.response?.status === 401 && !originalRequest._retry) {
          // Si pas de refresh token, déconnecter directement
          if (!authService.hasRefreshToken()) {
            await this.handleSessionExpired();
            return Promise.reject(this.handleError(error));
          }

          originalRequest._retry = true;

          try {
            // Essayer de rafraîchir le token
            const newToken = await authService.refreshAccessToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Retry de la requête originale
            return this.api(originalRequest);
          } catch (refreshError) {
            // Refresh échoué, déconnecter l'utilisateur
            await this.handleSessionExpired();
            return Promise.reject(this.handleError(error));
          }
        }

        // Gestion des erreurs réseau avec retry
        if (this.shouldRetry(error) && this.retryCount < this.maxRetries) {
          this.retryCount++;

          // Attendre avant de retry (backoff exponentiel)
          const delay = Math.pow(2, this.retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));

          return this.api(originalRequest);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  /**
   * Gérer l'expiration de session
   */
  private async handleSessionExpired(): Promise<void> {
    try {
      // Déconnecter l'utilisateur
      await authService.logout();

      // Afficher une notification (si toast disponible)
      if (typeof window !== 'undefined') {
        // Créer un événement personnalisé pour notifier l'application
        const event = new CustomEvent('session-expired', {
          detail: { message: 'Votre session a expiré. Veuillez vous reconnecter.' }
        });
        window.dispatchEvent(event);

        // Rediriger vers la page de login après un court délai
        setTimeout(() => {
          // Sauvegarder l'URL actuelle pour redirection après login
          const currentPath = window.location.pathname;
          if (currentPath !== '/login') {
            sessionStorage.setItem('redirectAfterLogin', currentPath);
          }
          window.location.href = '/login';
        }, 500);
      }
    } catch (error) {
      console.error('Erreur lors de la gestion de session expirée:', error);
      // En cas d'erreur, forcer la redirection vers login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }

  /**
   * Déterminer si une erreur doit être retry
   */
  private shouldRetry(error: AxiosError): boolean {
    // Retry sur erreurs réseau ou timeout
    return (
      !error.response && // Pas de réponse du serveur
      (error.code === 'ECONNABORTED' || // Timeout
        error.code === 'ENOTFOUND' || // DNS
        error.code === 'ECONNREFUSED') // Connexion refusée
    );
  }

  /**
   * Gestion standardisée des erreurs
   */
  private handleError(error: AxiosError): ApiError {
    const apiError: ApiError = {
      error: 'Erreur API',
      message: 'Une erreur est survenue',
      statusCode: error.response?.status || 500,
    };

    if (error.response?.data) {
      const responseData = error.response.data as any;
      apiError.error = responseData.error || apiError.error;
      apiError.message = responseData.message || responseData.error || apiError.message;
      apiError.details = responseData.details;
    } else if (error.request) {
      apiError.error = 'Erreur de connexion';
      apiError.message = 'Impossible de joindre le serveur. Vérifiez votre connexion.';
    } else {
      apiError.message = error.message || apiError.message;
    }

    return apiError;
  }

  /**
   * Méthodes HTTP standard
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.get<ApiResponse<T>>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.post<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.put<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.patch<ApiResponse<T>>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.api.delete<ApiResponse<T>>(url, config);
    return response.data;
  }

  /**
   * Upload de fichiers
   */
  async upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    };

    const response = await this.api.post<ApiResponse<T>>(url, formData, config);
    return response.data;
  }

  /**
   * Download de fichiers
   */
  async download(url: string, filename?: string): Promise<void> {
    const response = await this.api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Méthodes spécialisées pour les modules
   */

  // Module Financial
  financial = {
    getBudgets: (params?: any) => this.get('/financial/budgets', { params }),
    createBudget: (data: any) => this.post('/financial/budgets', data),
    getBudget: (id: string) => this.get(`/financial/budgets/${id}`),
    updateBudget: (id: string, data: any) => this.put(`/financial/budgets/${id}`, data),
    deleteBudget: (id: string) => this.delete(`/financial/budgets/${id}`),
    validateBudget: (id: string, data: any) => this.post(`/financial/budgets/${id}/validate`, data),

    getTransactions: (params?: any) => this.get('/financial/transactions', { params }),
    createTransaction: (data: any) => this.post('/financial/transactions', data),
    getTransaction: (id: string) => this.get(`/financial/transactions/${id}`),
    updateTransaction: (id: string, data: any) => this.put(`/financial/transactions/${id}`, data),
    validateTransaction: (id: string, data: any) => this.post(`/financial/transactions/${id}/validate`, data),
  };

  // Module Stocks
  stocks = {
    getStocks: (params?: any) => this.get('/stocks/stocks', { params }),
    createStock: (data: any) => this.post('/stocks/stocks', data),
    getStock: (id: string) => this.get(`/stocks/stocks/${id}`),
    updateStock: (id: string, data: any) => this.put(`/stocks/stocks/${id}`, data),
    deleteStock: (id: string) => this.delete(`/stocks/stocks/${id}`),

    getMovements: (params?: any) => this.get('/stocks/movements', { params }),
    createMovement: (data: any) => this.post('/stocks/movements', data),
    getMovement: (id: string) => this.get(`/stocks/movements/${id}`),
    confirmMovement: (id: string) => this.post(`/stocks/movements/${id}/confirm`),

    getAlerts: (params?: any) => this.get('/stocks/alerts', { params }),
    resolveAlert: (id: string, data: any) => this.post(`/stocks/alerts/${id}/resolve`, data),
  };

  // Module Housing
  housing = {
    getHousings: (params?: any) => this.get('/housing/housings', { params }),
    createHousing: (data: any) => this.post('/housing/housings', data),
    getHousing: (id: string) => this.get(`/housing/housings/${id}`),
    updateHousing: (id: string, data: any) => this.put(`/housing/housings/${id}`, data),
    deleteHousing: (id: string) => this.delete(`/housing/housings/${id}`),

    getRooms: (params?: any) => this.get('/housing/rooms', { params }),
    createRoom: (data: any) => this.post('/housing/rooms', data),
    getRoom: (id: string) => this.get(`/housing/rooms/${id}`),
    updateRoom: (id: string, data: any) => this.put(`/housing/rooms/${id}`, data),
    deleteRoom: (id: string) => this.delete(`/housing/rooms/${id}`),

    getOccupancies: (params?: any) => this.get('/housing/occupancies', { params }),
    createOccupancy: (data: any) => this.post('/housing/occupancies', data),
    getOccupancy: (id: string) => this.get(`/housing/occupancies/${id}`),
    updateOccupancy: (id: string, data: any) => this.put(`/housing/occupancies/${id}`, data),
    terminateOccupancy: (id: string) => this.post(`/housing/occupancies/${id}/terminate`),
  };

  // Module Dashboard
  dashboard = {
    getKPIs: (params?: any) => this.get('/dashboard/kpis', { params }),
    getEvolution: (params?: any) => this.get('/dashboard/evolution', { params }),
    getAlerts: (params?: any) => this.get('/dashboard/alerts', { params }),
    getActivities: (params?: any) => this.get('/dashboard/activities', { params }),
  };

  // Module Admin
  admin = {
    // Users management
    getUsers: (params?: any) => this.get('/admin/users', { params }),
    getUser: (id: string) => this.get(`/admin/users/${id}`),
    createUser: (data: any) => this.post('/admin/users', data),
    updateUser: (id: string, data: any) => this.put(`/admin/users/${id}`, data),
    deleteUser: (id: string) => this.delete(`/admin/users/${id}`),
    toggleUserStatus: (id: string, data: any) => this.post(`/admin/users/${id}/toggle-status`, data),
    resetUserPassword: (id: string) => this.post(`/admin/users/${id}/reset-password`),

    // Roles management
    getRoles: (params?: any) => this.get('/admin/roles', { params }),
    getRole: (id: string) => this.get(`/admin/roles/${id}`),
    createRole: (data: any) => this.post('/admin/roles', data),
    updateRole: (id: string, data: any) => this.put(`/admin/roles/${id}`, data),
    deleteRole: (id: string) => this.delete(`/admin/roles/${id}`),
    getPermissions: (params?: any) => this.get('/admin/roles/permissions', { params }),
    createPermission: (data: any) => this.post('/admin/roles/permissions', data),
    getRolesMatrix: (params?: any) => this.get('/admin/roles/matrix', { params }),
    updateRolePermissions: (id: string, data: any) => this.post(`/admin/roles/${id}/permissions`, data),

    // Tenants management
    getTenants: (params?: any) => this.get('/admin/tenants', { params }),
    getTenant: (id: string) => this.get(`/admin/tenants/${id}`),
    createTenant: (data: any) => this.post('/admin/tenants', data),
    updateTenant: (id: string, data: any) => this.put(`/admin/tenants/${id}`, data),
    toggleTenantStatus: (id: string, data: any) => this.post(`/admin/tenants/${id}/toggle-status`, data),
    getTenantUsers: (id: string, params?: any) => this.get(`/admin/tenants/${id}/users`, { params }),
    getTenantsGlobalStats: (params?: any) => this.get('/admin/tenants/stats/global', { params }),

    // Statistics
    getStatsOverview: (params?: any) => this.get('/admin/stats/overview', { params }),
    getStatsUsers: (params?: any) => this.get('/admin/stats/users', { params }),
    getStatsActivity: (params?: any) => this.get('/admin/stats/activity', { params }),
    getStatsPerformance: (params?: any) => this.get('/admin/stats/performance', { params }),
    exportStats: (params?: any) => this.get('/admin/stats/export', { params }),

    // Security
    getSecurityAlerts: (params?: any) => this.get('/admin/security/alerts', { params }),
    resolveSecurityAlert: (id: string, data: any) => this.post(`/admin/security/alerts/${id}/resolve`, data),
    getSecurityStats: () => this.get('/admin/security/stats'),
    unlockUser: (id: string, data: any) => this.post(`/admin/security/users/${id}/unlock`, data),
    getBlockedAccounts: (params?: any) => this.get('/admin/security/blocked-accounts', { params }),

    // Audit
    getAuditLogs: (params?: any) => this.get('/admin/audit/logs', { params }),
    getAuditReports: (params?: any) => this.get('/admin/audit/reports', { params }),
    getSuspiciousActivities: (params?: any) => this.get('/admin/audit/suspicious', { params }),
    getAuditStats: () => this.get('/admin/audit/stats'),
    archiveAuditLogs: (data: any) => this.post('/admin/audit/archive', data),
    getUserActivity: (userId: string, params?: any) => this.get(`/admin/audit/user/${userId}`, { params }),

    // General admin
    getPermissionsAvailable: () => this.get('/admin/permissions/available'),
    getHealth: () => this.get('/admin/health'),
  };

  // Module Transport
  transport = {
    drivers: {
      getDrivers: (params?: any) => this.get('/transport/drivers', { params }),
      createDriver: (data: any) => this.post('/transport/drivers', data),
      getDriver: (id: string) => this.get(`/transport/drivers/${id}`),
      updateDriver: (id: string, data: any) => this.put(`/transport/drivers/${id}`, data),
      deleteDriver: (id: string) => this.delete(`/transport/drivers/${id}`),
      assignVehicle: (id: string, data: any) => this.post(`/transport/drivers/${id}/assign-vehicle`, data),
      unassignVehicle: (id: string) => this.post(`/transport/drivers/${id}/unassign-vehicle`),
      getAvailableDrivers: () => this.get('/transport/drivers/available'),
      getDriverAlerts: () => this.get('/transport/drivers/alerts'),
      getDriverStatistics: () => this.get('/transport/drivers/statistics'),
    },

    routes: {
      getRoutes: (params?: any) => this.get('/transport/routes', { params }),
      createRoute: (data: any) => this.post('/transport/routes', data),
      getRoute: (id: string) => this.get(`/transport/routes/${id}`),
      updateRoute: (id: string, data: any) => this.put(`/transport/routes/${id}`, data),
      deleteRoute: (id: string) => this.delete(`/transport/routes/${id}`),
      getActiveRoutes: () => this.get('/transport/routes/active'),
    },
  };
}

// Instance singleton du client API
export const apiClient = new ApiClient();

// Export des types
// Les interfaces ApiResponse et ApiError sont déjà exportées ci-dessus
