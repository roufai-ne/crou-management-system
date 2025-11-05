/**
 * FICHIER: apps\api\src\shared\utils\validation.ts
 * UTILITAIRE: Validation des inputs
 *
 * DESCRIPTION:
 * Fonctions de validation et sanitization des inputs utilisateur
 * Protection contre les injections SQL et XSS
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { validate as uuidValidate } from 'uuid';

/**
 * Valider qu'une chaîne est un UUID valide
 */
export function validateUUID(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (!uuidValidate(value)) {
    return null;
  }

  return value;
}

/**
 * Valider et extraire un tenant ID de façon sécurisée
 */
export function validateTenantId(tenantId: unknown): string | null {
  return validateUUID(tenantId);
}

/**
 * Valider un email
 */
export function validateEmail(email: unknown): string | null {
  if (typeof email !== 'string') {
    return null;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return null;
  }

  return email.toLowerCase();
}

/**
 * Sanitizer une chaîne pour éviter les injections
 */
export function sanitizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  // Retirer les caractères dangereux
  return value
    .replace(/[<>'"]/g, '')
    .trim();
}

/**
 * Valider un nombre entier positif
 */
export function validatePositiveInteger(value: unknown): number | null {
  const num = Number(value);

  if (isNaN(num) || !Number.isInteger(num) || num < 0) {
    return null;
  }

  return num;
}

/**
 * Valider une date au format ISO
 */
export function validateISODate(value: unknown): Date | null {
  if (typeof value !== 'string') {
    return null;
  }

  const date = new Date(value);

  if (isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/**
 * Valider un enum
 */
export function validateEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[]
): T | null {
  if (typeof value !== 'string') {
    return null;
  }

  if (!allowedValues.includes(value as T)) {
    return null;
  }

  return value as T;
}
