/**
 * FICHIER: apps/api/src/shared/types/express.types.ts
 * TYPES: Types TypeScript pour Express avec authentification et multi-tenant
 *
 * DESCRIPTION:
 * Types personnalisés pour les requêtes Express avec contexte utilisateur
 * et tenant. Élimine les assertions dangereuses (req as any).
 *
 * SÉCURITÉ:
 * - Typage strict pour l'authentification
 * - Contexte multi-tenant typé
 * - Prévient les erreurs de runtime
 *
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2024
 */

import { Request, Response } from 'express';
import { Role, Permission, User } from '@crou/database';

/**
 * Informations d'authentification de l'utilisateur
 * Ajoutées par le middleware auth
 */
export interface AuthUser {
  /** ID unique de l'utilisateur */
  userId: string;

  /** Email de l'utilisateur */
  email: string;

  /** ID du tenant de l'utilisateur */
  tenantId: string;

  /** Rôle de l'utilisateur avec permissions */
  role: Role;

  /** Permissions de l'utilisateur (cache) */
  permissions?: Permission[];

  /** Indique si l'utilisateur peut accéder à plusieurs tenants (ex: ministère) */
  canAccessMultipleTenants: boolean;

  /** Entité utilisateur complète (si chargée) */
  user?: User;
}

/**
 * Contexte multi-tenant de la requête
 * Ajouté par le middleware tenant-isolation
 */
export interface TenantContext {
  /** ID du tenant actuel pour cette requête */
  tenantId: string;

  /** Nom du tenant */
  tenantName?: string;

  /** Indique si le contexte permet l'accès multi-tenant */
  canAccessMultipleTenants: boolean;

  /** Liste des tenants accessibles (pour utilisateurs ministériels) */
  accessibleTenantIds: string[];

  /** Scope d'accès actuel ('single' | 'multi' | 'ministere') */
  accessScope: 'single' | 'multi' | 'ministere';
}

/**
 * Informations de pagination
 */
export interface PaginationParams {
  /** Numéro de page (commence à 1) */
  page: number;

  /** Nombre d'éléments par page */
  limit: number;

  /** Offset calculé (page - 1) * limit */
  offset: number;
}

/**
 * Filtres de requête génériques
 */
export interface QueryFilters {
  /** Recherche textuelle */
  search?: string;

  /** Filtre par statut */
  status?: string;

  /** Filtre par date de début */
  startDate?: Date;

  /** Filtre par date de fin */
  endDate?: Date;

  /** Filtre par catégorie */
  category?: string;

  /** Tri (ex: 'createdAt:DESC') */
  sort?: string;

  /** Champs personnalisés */
  [key: string]: any;
}

/**
 * Requête Express typée avec authentification
 * Utilisez ce type au lieu de (req as any)
 */
export interface TypedRequest<
  TBody = any,
  TQuery = any,
  TParams = any
> extends Request<TParams, any, TBody, TQuery> {
  /** Informations de l'utilisateur authentifié */
  user?: AuthUser;

  /** Contexte multi-tenant */
  tenantContext?: TenantContext;

  /** Indique si l'utilisateur a un accès étendu (multi-tenant) */
  hasExtendedAccess?: boolean;

  /** ID de corrélation pour les logs */
  correlationId?: string;

  /** Timestamp de début de la requête (pour performance) */
  startTime?: number;
}

/**
 * Réponse Express typée avec données
 */
export interface TypedResponse<TData = any> extends Response {
  /** Méthode pour envoyer une réponse JSON typée */
  json(data: TData): this;
}

/**
 * Réponse API standardisée - Succès
 */
export interface ApiSuccessResponse<TData = any> {
  success: true;
  data: TData;
  message?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

/**
 * Réponse API standardisée - Erreur
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    stack?: string; // Uniquement en développement
  };
}

/**
 * Union des réponses API
 */
export type ApiResponse<TData = any> = ApiSuccessResponse<TData> | ApiErrorResponse;

/**
 * Type helper pour les handlers de routes typés
 */
export type TypedRequestHandler<
  TBody = any,
  TQuery = any,
  TParams = any,
  TResponse = any
> = (
  req: TypedRequest<TBody, TQuery, TParams>,
  res: TypedResponse<ApiResponse<TResponse>>
) => Promise<void> | void;

/**
 * Type pour les paramètres de requête avec pagination
 */
export interface PaginatedQuery extends QueryFilters {
  page?: string | number;
  limit?: string | number;
}

/**
 * Utilitaire pour extraire les paramètres de pagination
 */
export function extractPaginationParams(query: PaginatedQuery): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1')));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'))));
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Utilitaire pour créer une réponse de succès
 */
export function createSuccessResponse<TData>(
  data: TData,
  message?: string,
  meta?: ApiSuccessResponse['meta']
): ApiSuccessResponse<TData> {
  return {
    success: true,
    data,
    message,
    meta
  };
}

/**
 * Utilitaire pour créer une réponse d'erreur
 */
export function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      details
    }
  };
}
