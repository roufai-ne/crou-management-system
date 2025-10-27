/**
 * FICHIER: apps/web/src/services/api/adminService.ts
 * SERVICE: AdminService - Service pour la gestion administrative
 *
 * DESCRIPTION:
 * Service pour la gestion des utilisateurs, permissions, tenants
 * et configuration système du CROU
 *
 * FONCTIONNALITÉS:
 * - Gestion des utilisateurs (CRUD)
 * - Gestion des permissions et rôles
 * - Gestion des tenants (CROU)
 * - Configuration système
 * - Audit et logs
 * - Statistiques administratives
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { apiClient } from './apiClient';

// Types pour les utilisateurs
export interface User {
  id: string;
  tenantId: string;
  tenant?: Tenant; // Populated on fetch
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  permissions: string[];
  tenantId: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role?: UserRole;
  permissions?: string[];
  isActive?: boolean;
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  resource?: string;
  createdAt: string;
  updatedAt: string;
}

// Types pour les tenants
export interface Tenant {
  id: string;
  name: string;
  type: 'ministere' | 'crou';
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  directorName?: string;
  isActive: boolean;
  config: TenantConfig;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTenantRequest {
  name: string;
  type: 'ministere' | 'crou';
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  directorName?: string;
  config: Partial<TenantConfig>;
}

export interface UpdateTenantRequest {
  name?: string;
  region?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  directorName?: string;
  isActive?: boolean;
  config?: Partial<TenantConfig>;
}

export interface TenantConfig {
  timezone: string;
  currency: string;
  dateFormat: string;
  language: string;
  features: {
    financial: boolean;
    stocks: boolean;
    housing: boolean;
    transport: boolean;
    reports: boolean;
  };
  limits: {
    maxUsers: number;
    maxStorage: number; // in MB
    maxReports: number;
  };
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

// Types pour l'audit
export interface AuditLog {
  id: string;
  userId: string;
  user?: User; // Populated on fetch
  tenantId: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

// Types pour les statistiques
export interface AdminStatistics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalTenants: number;
  activeTenants: number;
  totalRoles: number;
  totalPermissions: number;
  recentLogins: number;
  systemHealth: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    memoryUsage: number;
    diskUsage: number;
    lastBackup: string;
  };
  activityStats: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    topActions: Array<{
      action: string;
      count: number;
    }>;
  };
}

class AdminService {
  private baseUrl = '/api/admin';

  // === GESTION DES UTILISATEURS ===

  /**
   * Récupère la liste des utilisateurs
   */
  async getUsers(params?: {
    tenantId?: string;
    role?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
      if (params?.role) queryParams.append('role', params.role);
      if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
      if (params?.search) queryParams.append('search', params.search);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/users?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Récupère un utilisateur par ID
   */
  async getUser(id: string): Promise<User> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/users`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(id: string, data: UpdateUserRequest): Promise<User> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/users/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/users/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', error);
      throw error;
    }
  }

  /**
   * Active/désactive un utilisateur
   */
  async toggleUserStatus(id: string, isActive: boolean): Promise<User> {
    try {
      const response = await apiClient.patch(`${this.baseUrl}/users/${id}/status`, { isActive });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du changement de statut:', error);
      throw error;
    }
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  async resetUserPassword(id: string, newPassword: string): Promise<void> {
    try {
      await apiClient.post(`${this.baseUrl}/users/${id}/reset-password`, { newPassword });
    } catch (error) {
      console.error('Erreur lors de la réinitialisation du mot de passe:', error);
      throw error;
    }
  }

  // === GESTION DES RÔLES ===

  /**
   * Récupère la liste des rôles
   */
  async getRoles(): Promise<UserRole[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/roles`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles:', error);
      throw error;
    }
  }

  /**
   * Récupère un rôle par ID
   */
  async getRole(id: string): Promise<UserRole> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/roles/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau rôle
   */
  async createRole(data: {
    name: string;
    description: string;
    permissions: string[];
  }): Promise<UserRole> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/roles`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du rôle:', error);
      throw error;
    }
  }

  /**
   * Met à jour un rôle
   */
  async updateRole(id: string, data: {
    name?: string;
    description?: string;
    permissions?: string[];
  }): Promise<UserRole> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/roles/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      throw error;
    }
  }

  /**
   * Supprime un rôle
   */
  async deleteRole(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/roles/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du rôle:', error);
      throw error;
    }
  }

  // === GESTION DES PERMISSIONS ===

  /**
   * Récupère la liste des permissions
   */
  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/permissions`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error);
      throw error;
    }
  }

  /**
   * Récupère les permissions par module
   */
  async getPermissionsByModule(module: string): Promise<Permission[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/permissions/module/${module}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions du module:', error);
      throw error;
    }
  }

  // === GESTION DES TENANTS ===

  /**
   * Récupère la liste des tenants
   */
  async getTenants(): Promise<Tenant[]> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/tenants`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des tenants:', error);
      throw error;
    }
  }

  /**
   * Récupère un tenant par ID
   */
  async getTenant(id: string): Promise<Tenant> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/tenants/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du tenant:', error);
      throw error;
    }
  }

  /**
   * Crée un nouveau tenant
   */
  async createTenant(data: CreateTenantRequest): Promise<Tenant> {
    try {
      const response = await apiClient.post(`${this.baseUrl}/tenants`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du tenant:', error);
      throw error;
    }
  }

  /**
   * Met à jour un tenant
   */
  async updateTenant(id: string, data: UpdateTenantRequest): Promise<Tenant> {
    try {
      const response = await apiClient.put(`${this.baseUrl}/tenants/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du tenant:', error);
      throw error;
    }
  }

  /**
   * Supprime un tenant
   */
  async deleteTenant(id: string): Promise<void> {
    try {
      await apiClient.delete(`${this.baseUrl}/tenants/${id}`);
    } catch (error) {
      console.error('Erreur lors de la suppression du tenant:', error);
      throw error;
    }
  }

  // === AUDIT ET LOGS ===

  /**
   * Récupère les logs d'audit
   */
  async getAuditLogs(params?: {
    userId?: string;
    tenantId?: string;
    action?: string;
    resource?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    logs: AuditLog[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.userId) queryParams.append('userId', params.userId);
      if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
      if (params?.action) queryParams.append('action', params.action);
      if (params?.resource) queryParams.append('resource', params.resource);
      if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params?.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());

      const response = await apiClient.get(`${this.baseUrl}/audit-logs?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des logs d\'audit:', error);
      throw error;
    }
  }

  // === STATISTIQUES ===

  /**
   * Récupère les statistiques administratives
   */
  async getAdminStatistics(): Promise<AdminStatistics> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/statistics`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw error;
    }
  }

  // === CONFIGURATION SYSTÈME ===

  /**
   * Récupère la configuration système
   */
  async getSystemConfig(): Promise<{
    version: string;
    environment: string;
    features: Record<string, boolean>;
    limits: Record<string, number>;
    maintenance: {
      isActive: boolean;
      message?: string;
      startTime?: string;
      endTime?: string;
    };
  }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/system/config`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      throw error;
    }
  }

  /**
   * Met à jour la configuration système
   */
  async updateSystemConfig(data: {
    features?: Record<string, boolean>;
    limits?: Record<string, number>;
    maintenance?: {
      isActive: boolean;
      message?: string;
      startTime?: string;
      endTime?: string;
    };
  }): Promise<void> {
    try {
      await apiClient.put(`${this.baseUrl}/system/config`, data);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      throw error;
    }
  }

  // === UTILITAIRES ===

  /**
   * Vérifie la disponibilité d'un email
   */
  async checkEmailAvailability(email: string): Promise<{ available: boolean }> {
    try {
      const response = await apiClient.get(`${this.baseUrl}/users/check-email?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'email:', error);
      throw error;
    }
  }

  /**
   * Exporte les données utilisateurs
   */
  async exportUsers(format: 'excel' | 'csv', tenantId?: string): Promise<Blob> {
    try {
      const params = tenantId ? `?tenantId=${tenantId}` : '';
      const response = await apiClient.get(`${this.baseUrl}/users/export/${format}${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'export des utilisateurs:', error);
      throw error;
    }
  }

  /**
   * Importe des utilisateurs
   */
  async importUsers(file: File, tenantId: string): Promise<{
    success: number;
    errors: Array<{
      row: number;
      error: string;
    }>;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tenantId', tenantId);

      const response = await apiClient.post(`${this.baseUrl}/users/import`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'import des utilisateurs:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();
