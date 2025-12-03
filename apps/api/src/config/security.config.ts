/**
 * FICHIER: apps/api/src/config/security.config.ts
 * CONFIG: Configuration de sécurité centralisée
 *
 * DESCRIPTION:
 * Paramètres de sécurité configurables via variables d'environnement
 * Permet de personnaliser les politiques de sécurité par tenant
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

/**
 * Configuration du verrouillage de compte
 */
export const ACCOUNT_LOCKOUT_CONFIG = {
  /**
   * Nombre maximum de tentatives de connexion avant verrouillage
   * Valeur par défaut: 5
   * Variable d'environnement: MAX_LOGIN_ATTEMPTS
   */
  MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5'),

  /**
   * Durée de verrouillage du compte en minutes
   * Valeur par défaut: 30 minutes
   * Variable d'environnement: ACCOUNT_LOCKOUT_DURATION_MINUTES
   */
  LOCKOUT_DURATION_MINUTES: parseInt(process.env.ACCOUNT_LOCKOUT_DURATION_MINUTES || '30'),

  /**
   * Réinitialiser le compteur de tentatives après X minutes sans tentative
   * Valeur par défaut: 15 minutes
   * Variable d'environnement: LOGIN_ATTEMPTS_RESET_MINUTES
   */
  ATTEMPTS_RESET_MINUTES: parseInt(process.env.LOGIN_ATTEMPTS_RESET_MINUTES || '15')
};

/**
 * Configuration des mots de passe
 */
export const PASSWORD_CONFIG = {
  /**
   * Longueur minimale du mot de passe
   * Valeur par défaut: 8 caractères
   * Variable d'environnement: PASSWORD_MIN_LENGTH
   */
  MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH || '8'),

  /**
   * Exiger au moins une majuscule
   * Valeur par défaut: true
   * Variable d'environnement: PASSWORD_REQUIRE_UPPERCASE
   */
  REQUIRE_UPPERCASE: process.env.PASSWORD_REQUIRE_UPPERCASE !== 'false',

  /**
   * Exiger au moins un chiffre
   * Valeur par défaut: true
   * Variable d'environnement: PASSWORD_REQUIRE_NUMBER
   */
  REQUIRE_NUMBER: process.env.PASSWORD_REQUIRE_NUMBER !== 'false',

  /**
   * Exiger au moins un caractère spécial
   * Valeur par défaut: true
   * Variable d'environnement: PASSWORD_REQUIRE_SPECIAL
   */
  REQUIRE_SPECIAL: process.env.PASSWORD_REQUIRE_SPECIAL !== 'false',

  /**
   * Expiration du mot de passe en jours (0 = pas d'expiration)
   * Valeur par défaut: 90 jours
   * Variable d'environnement: PASSWORD_EXPIRY_DAYS
   */
  EXPIRY_DAYS: parseInt(process.env.PASSWORD_EXPIRY_DAYS || '90')
};

/**
 * Configuration des sessions
 */
export const SESSION_CONFIG = {
  /**
   * Durée de validité du token d'accès
   * Valeur par défaut: 15 minutes
   * Variable d'environnement: JWT_EXPIRES_IN
   */
  ACCESS_TOKEN_EXPIRY: process.env.JWT_EXPIRES_IN || '15m',

  /**
   * Durée de validité du refresh token
   * Valeur par défaut: 7 jours
   * Variable d'environnement: JWT_REFRESH_EXPIRES_IN
   */
  REFRESH_TOKEN_EXPIRY: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  /**
   * Déconnecter automatiquement après X minutes d'inactivité (0 = désactivé)
   * Valeur par défaut: 30 minutes
   * Variable d'environnement: SESSION_TIMEOUT_MINUTES
   */
  TIMEOUT_MINUTES: parseInt(process.env.SESSION_TIMEOUT_MINUTES || '30')
};

/**
 * Configuration de l'audit
 */
export const AUDIT_CONFIG = {
  /**
   * Activer l'audit des connexions
   * Valeur par défaut: true
   * Variable d'environnement: AUDIT_LOGIN_ENABLED
   */
  LOGIN_ENABLED: process.env.AUDIT_LOGIN_ENABLED !== 'false',

  /**
   * Activer l'audit des actions sensibles
   * Valeur par défaut: true
   * Variable d'environnement: AUDIT_SENSITIVE_ACTIONS_ENABLED
   */
  SENSITIVE_ACTIONS_ENABLED: process.env.AUDIT_SENSITIVE_ACTIONS_ENABLED !== 'false',

  /**
   * Durée de rétention des logs d'audit en jours
   * Valeur par défaut: 365 jours (1 an)
   * Variable d'environnement: AUDIT_RETENTION_DAYS
   */
  RETENTION_DAYS: parseInt(process.env.AUDIT_RETENTION_DAYS || '365')
};

/**
 * Afficher la configuration de sécurité au démarrage (sans valeurs sensibles)
 */
export function displaySecurityConfig(): void {
  console.log('\n🔒 Configuration de sécurité:');
  console.log(`   Tentatives connexion max: ${ACCOUNT_LOCKOUT_CONFIG.MAX_LOGIN_ATTEMPTS}`);
  console.log(`   Durée verrouillage: ${ACCOUNT_LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES} minutes`);
  console.log(`   Longueur mot de passe min: ${PASSWORD_CONFIG.MIN_LENGTH} caractères`);
  console.log(`   Expiration mot de passe: ${PASSWORD_CONFIG.EXPIRY_DAYS === 0 ? 'Désactivée' : PASSWORD_CONFIG.EXPIRY_DAYS + ' jours'}`);
  console.log(`   Timeout session: ${SESSION_CONFIG.TIMEOUT_MINUTES === 0 ? 'Désactivé' : SESSION_CONFIG.TIMEOUT_MINUTES + ' minutes'}`);
  console.log(`   Audit activé: ${AUDIT_CONFIG.LOGIN_ENABLED ? '✓' : '✗'}`);
  console.log('');
}

/**
 * Valider la configuration de sécurité
 */
export function validateSecurityConfig(): string[] {
  const warnings: string[] = [];

  // Vérifier les valeurs de verrouillage de compte
  if (ACCOUNT_LOCKOUT_CONFIG.MAX_LOGIN_ATTEMPTS < 3) {
    warnings.push('⚠️  MAX_LOGIN_ATTEMPTS trop bas (< 3), risque de blocage d\'utilisateurs légitimes');
  }
  if (ACCOUNT_LOCKOUT_CONFIG.MAX_LOGIN_ATTEMPTS > 10) {
    warnings.push('⚠️  MAX_LOGIN_ATTEMPTS trop élevé (> 10), risque de sécurité (attaques par force brute)');
  }

  if (ACCOUNT_LOCKOUT_CONFIG.LOCKOUT_DURATION_MINUTES < 5) {
    warnings.push('⚠️  ACCOUNT_LOCKOUT_DURATION_MINUTES trop court (< 5), peu efficace contre les attaques');
  }

  // Vérifier les exigences de mot de passe
  if (PASSWORD_CONFIG.MIN_LENGTH < 8) {
    warnings.push('⚠️  PASSWORD_MIN_LENGTH trop court (< 8), recommandé: 8-12 caractères minimum');
  }

  if (!PASSWORD_CONFIG.REQUIRE_UPPERCASE && !PASSWORD_CONFIG.REQUIRE_NUMBER && !PASSWORD_CONFIG.REQUIRE_SPECIAL) {
    warnings.push('⚠️  Aucune exigence de complexité de mot de passe activée, risque de sécurité');
  }

  return warnings;
}
