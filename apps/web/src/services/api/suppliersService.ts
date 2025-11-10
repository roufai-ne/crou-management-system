/**
 * FICHIER: apps/web/src/services/api/suppliersService.ts
 * SERVICE: Suppliers API - Gestion des fournisseurs
 *
 * DESCRIPTION:
 * Service pour les appels API liés aux fournisseurs
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { apiClient } from './apiClient';

// Types
export enum SupplierType {
  FOURNISSEUR = 'fournisseur',
  PRESTATAIRE = 'prestataire',
  FABRICANT = 'fabricant',
  DISTRIBUTEUR = 'distributeur',
  GROSSISTE = 'grossiste',
  IMPORTATEUR = 'importateur'
}

export enum SupplierStatus {
  ACTIF = 'actif',
  INACTIF = 'inactif',
  SUSPENDU = 'suspendu',
  BLOQUE = 'bloque'
}

export interface Supplier {
  id: string;
  code: string;
  nom: string;
  nomCommercial?: string;
  type: SupplierType;
  status: SupplierStatus;
  description?: string;
  numeroSIRET?: string;
  numeroTVA?: string;
  registreCommerce?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  codePostal?: string;
  email?: string;
  telephone?: string;
  fax?: string;
  siteWeb?: string;
  contactPrincipal?: string;
  emailContact?: string;
  telephoneContact?: string;
  fonctionContact?: string;
  iban?: string;
  bic?: string;
  banque?: string;
  delaiPaiement?: number;
  devise?: string;
  categoriesProduits?: string[];
  produitsServices?: string;
  tauxRemise?: number;
  montantMinCommande?: number;
  delaiLivraison?: number;
  conditionsParticulieres?: string;
  noteQualite?: number;
  noteDelai?: number;
  notePrix?: number;
  noteMoyenne?: number;
  nombreCommandes?: number;
  montantTotalCommandes?: number;
  datePremiereCommande?: Date;
  dateDerniereCommande?: Date;
  isActif?: boolean;
  isPreference?: boolean;
  isCertifie?: boolean;
  certifications?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateSupplierRequest {
  code: string;
  nom: string;
  nomCommercial?: string;
  type: SupplierType;
  status?: SupplierStatus;
  description?: string;
  numeroSIRET?: string;
  numeroTVA?: string;
  registreCommerce?: string;
  adresse?: string;
  ville?: string;
  region?: string;
  pays?: string;
  codePostal?: string;
  email?: string;
  telephone?: string;
  fax?: string;
  siteWeb?: string;
  contactPrincipal?: string;
  emailContact?: string;
  telephoneContact?: string;
  fonctionContact?: string;
  iban?: string;
  bic?: string;
  banque?: string;
  delaiPaiement?: number;
  devise?: string;
  categoriesProduits?: string[];
  produitsServices?: string;
  tauxRemise?: number;
  montantMinCommande?: number;
  delaiLivraison?: number;
  conditionsParticulieres?: string;
  isPreference?: boolean;
  isCertifie?: boolean;
  certifications?: string;
  notes?: string;
}

export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  noteQualite?: number;
  noteDelai?: number;
  notePrix?: number;
  isActif?: boolean;
}

export interface SupplierFilters {
  search?: string;
  type?: SupplierType;
  status?: SupplierStatus;
  isPreference?: boolean;
  isCertifie?: boolean;
}

export interface SuppliersStats {
  totalSuppliers: number;
  activeSuppliers: number;
  preferredSuppliers: number;
  certifiedSuppliers: number;
  byType: Record<string, number>;
  topSuppliers: Array<{
    id: string;
    nom: string;
    nombreCommandes: number;
    montantTotal: number;
    noteMoyenne: number;
  }>;
  averageRating: number;
}

// API Service
export const suppliersService = {
  /**
   * Récupérer tous les fournisseurs
   */
  async getSuppliers(filters?: SupplierFilters): Promise<{ suppliers: Supplier[]; total: number }> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.type) params.append('type', filters.type);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.isPreference !== undefined) params.append('isPreference', String(filters.isPreference));
    if (filters?.isCertifie !== undefined) params.append('isCertifie', String(filters.isCertifie));

    const response = await apiClient.get(`/stocks/suppliers?${params.toString()}`);
    // Fixed: Handle both response.data and response.data.data structures
    const data = response.data.data || response.data;
    return {
      suppliers: data.suppliers || [],
      total: data.total || 0
    };
  },

  /**
   * Récupérer un fournisseur par ID
   */
  async getSupplier(id: string): Promise<Supplier> {
    const response = await apiClient.get(`/stocks/suppliers/${id}`);
    // Fixed: Handle both response.data and response.data.data structures
    const data = response.data.data || response.data;
    return data.supplier || data;
  },

  /**
   * Créer un nouveau fournisseur
   */
  async createSupplier(data: CreateSupplierRequest): Promise<Supplier> {
    const response = await apiClient.post('/stocks/suppliers', data);
    // Fixed: Handle both response.data and response.data.data structures
    const responseData = response.data.data || response.data;
    return responseData.supplier || responseData;
  },

  /**
   * Mettre à jour un fournisseur
   */
  async updateSupplier(id: string, data: UpdateSupplierRequest): Promise<Supplier> {
    const response = await apiClient.put(`/stocks/suppliers/${id}`, data);
    // Fixed: Handle both response.data and response.data.data structures
    const responseData = response.data.data || response.data;
    return responseData.supplier || responseData;
  },

  /**
   * Supprimer un fournisseur
   */
  async deleteSupplier(id: string): Promise<void> {
    await apiClient.delete(`/stocks/suppliers/${id}`);
  },

  /**
   * Récupérer les statistiques des fournisseurs
   */
  async getSuppliersStats(): Promise<SuppliersStats> {
    const response = await apiClient.get('/stocks/suppliers/stats/overview');
    // Fixed: Handle both response.data and response.data.data structures
    return response.data.data || response.data;
  }
};
