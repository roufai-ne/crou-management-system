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
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
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

        // Log des requêtes en développement
        if (import.meta.env.DEV) {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
            authService.logout();
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
            authService.logout();
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
}

// Instance singleton du client API
export const apiClient = new ApiClient();

// Export des types
// Les interfaces ApiResponse et ApiError sont déjà exportées ci-dessus
