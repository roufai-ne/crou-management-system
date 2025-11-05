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
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Imports directs des entités essentielles pour éviter problèmes de métadonnées
import { User } from '../entities/User.entity';
import { Tenant } from '../entities/Tenant.entity';
import { AuditLog } from '../entities/AuditLog.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { Role } from '../entities/Role.simple.entity';
import { Permission } from '../entities/Permission.entity';

// Configuration des variables d'environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration base selon environnement
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Configuration TypeORM
export const typeormConfig: DataSourceOptions = {
  type: 'postgres',

  // Configuration connexion
  ...(process.env.DATABASE_URL
    ? { url: process.env.DATABASE_URL }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        username: process.env.DB_USER || 'crou_user',
        password: process.env.DB_PASSWORD || 'crou_password',
        database: process.env.DB_NAME || 'crou_database'
      }
  ),

  // SSL en production
  ssl: isProduction ? { rejectUnauthorized: false } : false,

  // Pool de connexions optimisé
  extra: {
    connectionLimit: 20,
    acquireTimeoutMillis: 30000,
    timeout: 60000,
    ...(isProduction && {
      ssl: {
        rejectUnauthorized: false
      }
    })
  },

  // Entités - Imports directs pour RBAC + glob patterns pour modules
  // IMPORTANT: Direct imports pour core RBAC évitent erreurs de métadonnées
  entities: [
    // Entités Core RBAC (imports directs pour résoudre métadonnées)
    User,
    Tenant,
    Role,
    Permission,
    AuditLog,
    RefreshToken,

    // Module Financial (glob patterns)
    path.join(__dirname, '../entities/Budget.entity.{ts,js}'),
    path.join(__dirname, '../entities/BudgetCategory.entity.{ts,js}'),
    path.join(__dirname, '../entities/BudgetTrimester.entity.{ts,js}'),
    path.join(__dirname, '../entities/Transaction.entity.{ts,js}'),
    path.join(__dirname, '../entities/ValidationStep.entity.{ts,js}'),

    // Module Stocks (glob patterns)
    path.join(__dirname, '../entities/Stock.entity.{ts,js}'),
    path.join(__dirname, '../entities/StockMovement.entity.{ts,js}'),
    path.join(__dirname, '../entities/StockAlert.entity.{ts,js}'),
    path.join(__dirname, '../entities/Supplier.entity.{ts,js}'),

    // Module Housing (glob patterns)
    path.join(__dirname, '../entities/Housing.entity.{ts,js}'),
    path.join(__dirname, '../entities/Room.entity.{ts,js}'),
    path.join(__dirname, '../entities/HousingOccupancy.entity.{ts,js}'),
    path.join(__dirname, '../entities/HousingMaintenance.entity.{ts,js}'),

    // Module Transport (glob patterns)
    path.join(__dirname, '../entities/Vehicle.entity.{ts,js}'),
    path.join(__dirname, '../entities/VehicleUsage.entity.{ts,js}'),
    path.join(__dirname, '../entities/VehicleMaintenance.entity.{ts,js}'),
    path.join(__dirname, '../entities/VehicleFuel.entity.{ts,js}'),

    // Module Workflows (glob patterns)
    path.join(__dirname, '../entities/Workflow.entity.{ts,js}'),
    path.join(__dirname, '../entities/WorkflowStep.entity.{ts,js}'),
    path.join(__dirname, '../entities/WorkflowInstance.entity.{ts,js}'),
    path.join(__dirname, '../entities/WorkflowAction.entity.{ts,js}'),

    // Module Notifications (glob patterns)
    path.join(__dirname, '../entities/Notification.entity.{ts,js}'),
    path.join(__dirname, '../entities/NotificationPreference.entity.{ts,js}')
  ],

  // Migrations
  migrations: [
    path.join(__dirname, '../migrations/*.{ts,js}')
  ],

  // Subscribers (pour audit automatique)
  subscribers: [
    path.join(__dirname, '../subscribers/*.{ts,js}')
  ],

  // Configuration développement
  synchronize: isDevelopment, // Attention: false en production !
  dropSchema: false,
  logging: isDevelopment ? ['query', 'error', 'warn'] : ['error'],
  logger: 'advanced-console',

  // Paramètres de migration
  migrationsRun: isProduction,
  migrationsTableName: '_migrations_history',

  // Cache des requêtes (désactivé temporairement)
  cache: false
};

// Instance DataSource pour TypeORM
export const AppDataSource = new DataSource(typeormConfig);



// Fonction d'initialisation de la base
export const initializeDatabase = async (): Promise<void> => {
  try {
    console.log('🔄 Initialisation de la base de données...');

    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log('✅ Connexion PostgreSQL établie');
    }

    // Vérifier les migrations en production
    if (isProduction) {
      const pendingMigrations = await AppDataSource.showMigrations();
      if (pendingMigrations) {
        console.log('🔄 Exécution des migrations en attente...');
        await AppDataSource.runMigrations();
        console.log('✅ Migrations appliquées');
      }
    }

    // Seeds en développement uniquement
    if (isDevelopment) {
      await runSeeds();
    }

  } catch (error) {
    console.error('❌ Erreur initialisation base de données:', error);
    throw error;
  }
};



// Fonction de fermeture propre
export const closeDatabase = async (): Promise<void> => {
  try {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Connexion base de données fermée');
    }
  } catch (error) {
    console.error('❌ Erreur fermeture base de données:', error);
<<<<<<< HEAD
=======
    throw error;
>>>>>>> 695f6dc (fix: Résoudre l'erreur TypeORM metadata pour User#tenant)
  }
};

// Fonction de seeds (données de test)
async function runSeeds(): Promise<void> {
  try {
    console.log('🌱 Chargement des données de test...');
    
    // Import dynamique des seeders RBAC
    const { runRBACseeders } = await import('../seeders/run-rbac-seeders');
    
    // Exécution des seeds RBAC complets
    await runRBACseeders();
    
    console.log('✅ Données de test RBAC chargées');
  } catch (error) {
    console.error('❌ Erreur chargement seeds RBAC:', error);
    
    // Fallback vers les seeders RBAC complets si RBAC échoue
    try {
      console.log('🔄 Tentative avec les seeders RBAC complets...');
      const { seedTenants } = await import('../seeders/tenant.seeder');
      const { seedRoles } = await import('../seeders/role.seeder');
      const { seedPermissions } = await import('../seeders/permission.seeder');
      const { seedUsersRBAC } = await import('../seeders/user-rbac.seeder');
      
      await seedTenants(AppDataSource);
      await seedRoles(AppDataSource);
      await seedPermissions(AppDataSource);
      await seedUsersRBAC(AppDataSource);
      
      console.log('✅ Données RBAC complètes chargées');
    } catch (fallbackError) {
      console.error('❌ Erreur chargement seeds RBAC:', fallbackError);
    }
  }
}