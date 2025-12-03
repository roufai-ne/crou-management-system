/**
 * FICHIER: apps/web/src/utils/logger.ts
 * UTILITAIRE: Logger frontend sécurisé
 *
 * DESCRIPTION:
 * Système de logging pour le frontend qui respecte l'environnement
 * Désactive automatiquement les logs en production
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2025
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';

/**
 * Niveaux de log
 */
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

/**
 * Interface pour les métadonnées de log
 */
interface LogMetadata {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: any;
}

/**
 * Classe Logger frontend
 */
class FrontendLogger {
  private minLevel: LogLevel = LogLevel.INFO;

  constructor() {
    // En production, on ne log que les erreurs
    if (!isDevelopment && !isTest) {
      this.minLevel = LogLevel.ERROR;
    }
  }

  /**
   * Vérifie si le niveau de log est activé
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  /**
   * Formater le message de log
   */
  private formatMessage(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const component = metadata?.component ? `[${metadata.component}]` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${component} ${message}`;
  }

  /**
   * Log debug (développement seulement)
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage(LogLevel.DEBUG, message, metadata), metadata);
    }
  }

  /**
   * Log info
   */
  info(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, metadata), metadata);
    }
  }

  /**
   * Log warning
   */
  warn(message: string, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, metadata), metadata);
    }
  }

  /**
   * Log error (toujours actif)
   */
  error(message: string, error?: Error, metadata?: LogMetadata): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(
        this.formatMessage(LogLevel.ERROR, message, metadata),
        error,
        metadata
      );

      // En production, envoyer les erreurs au serveur pour monitoring
      if (!isDevelopment) {
        this.sendErrorToServer(message, error, metadata);
      }
    }
  }

  /**
   * Envoyer les erreurs au serveur (production uniquement)
   */
  private async sendErrorToServer(
    message: string,
    error?: Error,
    metadata?: LogMetadata
  ): Promise<void> {
    try {
      const errorData = {
        message,
        stack: error?.stack,
        name: error?.name,
        metadata,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // Envoyer au endpoint de logging (si configuré)
      const loggingEndpoint = import.meta.env.VITE_ERROR_LOGGING_ENDPOINT;
      if (loggingEndpoint) {
        await fetch(loggingEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData)
        });
      }
    } catch (err) {
      // Ne rien faire si l'envoi échoue
      // On ne veut pas créer une boucle infinie d'erreurs
    }
  }

  /**
   * Grouper les logs (développement seulement)
   */
  group(label: string): void {
    if (isDevelopment) {
      console.group(label);
    }
  }

  /**
   * Fermer le groupe de logs
   */
  groupEnd(): void {
    if (isDevelopment) {
      console.groupEnd();
    }
  }

  /**
   * Logger une table (développement seulement)
   */
  table(data: any[]): void {
    if (isDevelopment) {
      console.table(data);
    }
  }

  /**
   * Mesurer le temps d'exécution (développement seulement)
   */
  time(label: string): void {
    if (isDevelopment) {
      console.time(label);
    }
  }

  /**
   * Fin du chronomètre
   */
  timeEnd(label: string): void {
    if (isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Instance singleton
export const logger = new FrontendLogger();

/**
 * Méthodes utilitaires pour logger des actions spécifiques
 */
export const logActions = {
  apiRequest: (method: string, url: string) => {
    logger.debug(`API Request: ${method} ${url}`, {
      component: 'API',
      action: 'request'
    });
  },

  apiResponse: (method: string, url: string, status: number, duration: number) => {
    logger.debug(`API Response: ${method} ${url} - ${status} (${duration}ms)`, {
      component: 'API',
      action: 'response'
    });
  },

  apiError: (method: string, url: string, error: Error) => {
    logger.error(`API Error: ${method} ${url}`, error, {
      component: 'API',
      action: 'error'
    });
  },

  userAction: (action: string, details?: any) => {
    logger.info(`User Action: ${action}`, {
      component: 'User',
      action,
      ...details
    });
  },

  navigation: (from: string, to: string) => {
    logger.debug(`Navigation: ${from} → ${to}`, {
      component: 'Router',
      action: 'navigate'
    });
  }
};

// Exporter aussi pour compatibilité
export default logger;
