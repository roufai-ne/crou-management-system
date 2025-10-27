/**
 * FICHIER: packages\database\src\config\typeorm.config.ts
 * CONFIG: Configuration TypeORM pour PostgreSQL multi-tenant
 *
 * DESCRIPTION:
 * Configuration base de données avec support multi-tenant
 * Connexion PostgreSQL sécurisée avec pool de connexions
 * Migrations automatiques et seeds de données de test
 * Logging configuré pour développement et production
 *
 * FONCTIONNALITÉS:
 * - Support multi-tenant avec tenant_id
 * - Connexion pool optimisée
 * - Migrations automatiques
 * - Seeds pour 8 CROU + Ministère
 * - Logging différencié dev/prod
 * - SSL en production
 *
 * VARIABLES ENVIRONNEMENT:
 * - DATABASE_URL: URL complète PostgreSQL
 * - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 * - NODE_ENV: development/production
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */
import { DataSource, DataSourceOptions } from 'typeorm';
export declare const typeormConfig: DataSourceOptions;
export declare const AppDataSource: DataSource;
export declare const initializeDatabase: () => Promise<void>;
export declare const closeDatabase: () => Promise<void>;
//# sourceMappingURL=typeorm.config.d.ts.map