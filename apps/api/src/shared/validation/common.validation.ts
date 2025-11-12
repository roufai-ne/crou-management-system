/**
 * FICHIER: apps/api/src/shared/validation/common.validation.ts
 * VALIDATION: Schémas Zod pour validation des entrées communes
 *
 * DESCRIPTION:
 * Schémas de validation réutilisables pour UUID, pagination, dates, etc.
 * Prévient les injections et erreurs de validation
 *
 * SÉCURITÉ:
 * - Validation stricte des UUIDs (prévient SQL injection)
 * - Limites sur la pagination (prévient DoS)
 * - Validation des dates et formats
 *
 * AUTEUR: Équipe CROU
 * DATE: Novembre 2024
 */

import { z } from 'zod';

/**
 * Schema pour valider un UUID v4
 */
export const uuidSchema = z.string().uuid({
  message: 'ID invalide : doit être un UUID v4 valide'
});

/**
 * Schema pour valider un ID optionnel
 */
export const optionalUuidSchema = z.string().uuid().optional();

/**
 * Schema pour valider un tableau d'UUIDs
 */
export const uuidArraySchema = z.array(uuidSchema);

/**
 * Schema pour pagination
 */
export const paginationSchema = z.object({
  page: z
    .union([z.string(), z.number()])
    .transform(val => parseInt(String(val)))
    .pipe(z.number().int().positive().default(1)),
  limit: z
    .union([z.string(), z.number()])
    .transform(val => parseInt(String(val)))
    .pipe(z.number().int().positive().max(100).default(20))
});

/**
 * Type inféré pour la pagination
 */
export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Schema pour recherche textuelle
 */
export const searchSchema = z.object({
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20)
});

/**
 * Schema pour filtres de dates
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(
  data => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'La date de début doit être antérieure à la date de fin'
  }
);

/**
 * Schema pour tri
 */
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['ASC', 'DESC', 'asc', 'desc']).optional()
});

/**
 * Schema combiné pour requêtes avec pagination et recherche
 */
export const paginatedSearchSchema = paginationSchema.merge(searchSchema);

/**
 * Schema pour paramètre tenantId dans l'URL
 */
export const tenantIdParamSchema = z.object({
  tenantId: uuidSchema
});

/**
 * Schema pour email
 */
export const emailSchema = z.string().email({
  message: 'Email invalide'
}).toLowerCase();

/**
 * Schema pour mot de passe fort
 */
export const passwordSchema = z.string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[@$!%*?&#]/, 'Le mot de passe doit contenir au moins un caractère spécial (@$!%*?&#)');

/**
 * Schema pour téléphone
 */
export const phoneSchema = z.string()
  .regex(/^\+?[0-9]{8,15}$/, 'Numéro de téléphone invalide')
  .optional();

/**
 * Schema pour statuts génériques
 */
export const statusSchema = z.enum(['ACTIVE', 'INACTIVE', 'PENDING', 'ARCHIVED']);

/**
 * Fonction helper pour valider un UUID
 * @throws {Error} Si l'UUID est invalide
 */
export function validateUuid(id: string, fieldName: string = 'ID'): string {
  const result = uuidSchema.safeParse(id);
  if (!result.success) {
    throw new Error(`${fieldName} invalide : ${result.error.errors[0].message}`);
  }
  return result.data;
}

/**
 * Fonction helper pour valider la pagination
 */
export function validatePagination(query: any): PaginationInput {
  const result = paginationSchema.safeParse(query);
  if (!result.success) {
    throw new Error(`Paramètres de pagination invalides : ${result.error.errors[0].message}`);
  }
  return result.data;
}

/**
 * Middleware pour valider les paramètres de requête
 */
export function validateQueryParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Paramètres de requête invalides',
          details: result.error.errors
        }
      });
    }
    req.query = result.data;
    next();
  };
}

/**
 * Middleware pour valider le body
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Corps de requête invalide',
          details: result.error.errors
        }
      });
    }
    req.body = result.data;
    next();
  };
}

/**
 * Middleware pour valider les paramètres d'URL
 */
export function validateParams<T extends z.ZodTypeAny>(schema: T) {
  return (req: any, res: any, next: any) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Paramètres d\'URL invalides',
          details: result.error.errors
        }
      });
    }
    req.params = result.data;
    next();
  };
}
