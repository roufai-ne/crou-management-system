/**
 * FICHIER: apps/web/src/services/api/profileService.ts
 * SERVICE: Gestion du profil utilisateur
 *
 * DESCRIPTION:
 * Service pour gérer le profil de l'utilisateur connecté
 * Mise à jour des informations personnelles et changement de mot de passe
 *
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2025
 */

import { apiClient } from './apiClient';

export interface UpdateProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ProfileResponse {
  success: boolean;
  message: string;
  data?: {
    user: any;
  };
}

class ProfileService {
  /**
   * Mettre à jour le profil utilisateur
   */
  async updateProfile(data: UpdateProfileData): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse>('/users/profile', data);
    return response.data;
  }

  /**
   * Changer le mot de passe
   */
  async changePassword(data: ChangePasswordData): Promise<ProfileResponse> {
    const response = await apiClient.put<ProfileResponse>('/users/password', {
      currentPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
    return response.data;
  }

  /**
   * Récupérer le profil complet
   */
  async getProfile(): Promise<any> {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }

  /**
   * Uploader une photo de profil
   */
  async uploadAvatar(file: File): Promise<ProfileResponse> {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await apiClient.post<ProfileResponse>('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  /**
   * Supprimer la photo de profil
   */
  async deleteAvatar(): Promise<ProfileResponse> {
    const response = await apiClient.delete<ProfileResponse>('/users/avatar');
    return response.data;
  }
}

export const profileService = new ProfileService();
