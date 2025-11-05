/**
 * FICHIER: packages/database/src/config/datasource.ts
 * CONFIG: DataSource pour TypeORM CLI et migrations
 *
 * DESCRIPTION:
 * Configuration séparée pour la CLI TypeORM
 * Utilisée pour générer et exécuter les migrations
 *
 * USAGE:
 * - pnpm migration:generate src/migrations/InitialSchema
 * - pnpm migration:run
 * - pnpm migration:revert
 *
 * AUTEUR: Équipe CROU
 * DATE: Octobre 2025
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Imports directs de toutes les entités pour éviter les problèmes de métadonnées
import { Role } from '../entities/Role.entity';
import { Permission } from '../entities/Permission.entity';
import { Tenant } from '../entities/Tenant.entity';
import { User } from '../entities/User.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';
import { AuditLog } from '../entities/AuditLog.entity';
import { Budget } from '../entities/Budget.entity';
import { BudgetCategory } from '../entities/BudgetCategory.entity';
import { BudgetTrimester } from '../entities/BudgetTrimester.entity';
import { Transaction } from '../entities/Transaction.entity';
import { ValidationStep } from '../entities/ValidationStep.entity';
import { Stock } from '../entities/Stock.entity';
import { StockMovement } from '../entities/StockMovement.entity';
import { StockAlert } from '../entities/StockAlert.entity';
import { Supplier } from '../entities/Supplier.entity';
import { Housing } from '../entities/Housing.entity';
import { Room } from '../entities/Room.entity';
import { HousingOccupancy } from '../entities/HousingOccupancy.entity';
import { HousingMaintenance } from '../entities/HousingMaintenance.entity';
import { Vehicle } from '../entities/Vehicle.entity';
import { VehicleUsage } from '../entities/VehicleUsage.entity';
import { VehicleMaintenance } from '../entities/VehicleMaintenance.entity';
import { VehicleFuel } from '../entities/VehicleFuel.entity';
import { Driver } from '../entities/Driver.entity';
import { ScheduledTrip } from '../entities/ScheduledTrip.entity';
import { TransportRoute } from '../entities/TransportRoute.entity';
import { Workflow } from '../entities/Workflow.entity';
import { WorkflowStep } from '../entities/WorkflowStep.entity';
import { WorkflowInstance } from '../entities/WorkflowInstance.entity';
import { WorkflowAction } from '../entities/WorkflowAction.entity';
import { Notification } from '../entities/Notification.entity';
import { NotificationPreference } from '../entities/NotificationPreference.entity';

// Configuration des variables d'environnement
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// DataSource pour la CLI TypeORM
export const AppDataSource = new DataSource({
  type: 'postgres',

  // Configuration connexion
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'crou_user',
  password: process.env.DB_PASSWORD || 'crou_password',
  database: process.env.DB_NAME || 'crou_database',

  // SSL
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,

  // Entités - TOUTES les 33 entités (imports directs pour éviter problèmes métadonnées)
  entities: [
    // Entités Core - Role et Permission AVANT User pour résoudre circularité
    Role,
    Permission,
    Tenant,
    User,
    RefreshToken,
    AuditLog,

    // Module Financial
    Budget,
    BudgetCategory,
    BudgetTrimester,
    Transaction,
    ValidationStep,

    // Module Stocks
    Stock,
    StockMovement,
    StockAlert,
    Supplier,

    // Module Housing
    Housing,
    Room,
    HousingOccupancy,
    HousingMaintenance,

    // Module Transport
    Vehicle,
    VehicleUsage,
    VehicleMaintenance,
    VehicleFuel,
    Driver,
    ScheduledTrip,
    TransportRoute,

    // Module Workflows
    Workflow,
    WorkflowStep,
    WorkflowInstance,
    WorkflowAction,

    // Module Notifications
    Notification,
    NotificationPreference
  ],

  // Migrations
  migrations: [
    path.join(__dirname, '../migrations/*.{ts,js}')
  ],

  // Subscribers
  subscribers: [
    path.join(__dirname, '../subscribers/*.{ts,js}')
  ],

  // Configuration
  synchronize: false, // TOUJOURS false pour les migrations
  logging: ['query', 'error', 'warn'],
  logger: 'advanced-console',
  migrationsTableName: '_migrations_history'
});

export default AppDataSource;
