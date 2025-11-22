/**
 * FICHIER: packages/database/src/entities/housing.enums.ts
 * ENUMS PARTAGÉS: Module Housing
 *
 * DESCRIPTION:
 * Enums partagés entre les entités du module Housing
 * Évite les problèmes de dépendances circulaires et ordre de chargement TypeORM
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

// Restriction de genre par bâtiment (CRITIQUE pour attribution)
export enum GenderRestriction {
  MIXTE = 'mixte',               // Mixte (pas de restriction)
  HOMMES = 'hommes',             // Réservé aux hommes uniquement
  FEMMES = 'femmes'              // Réservé aux femmes uniquement
}
