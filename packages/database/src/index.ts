/**
 * FICHIER: packages\database\src\index.ts
 * INDEX: Exports principaux du package database
 * 
 * DESCRIPTION:
 * Point d'entrée principal pour le package database
 * Exporte toutes les entités, configurations et utilitaires
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

// Configuration TypeORM
export { 
  AppDataSource, 
  initializeDatabase, 
  closeDatabase, 
  typeormConfig 
} from './config/typeorm.config';

// Entités de base
export { User, UserRole, UserStatus } from './entities/User.entity';
export { Tenant, TenantType } from './entities/Tenant.entity';
export { AuditLog, AuditAction } from './entities/AuditLog.entity';

// Entités RBAC
export { Role, RoleTenantType } from './entities/Role.entity';
export { Permission } from './entities/Permission.entity';
export type { PermissionAction, PermissionResource, PermissionCondition } from './entities/Permission.entity';
export { RefreshToken } from './entities/RefreshToken.entity';

// Entités modules métiers
export { Budget } from './entities/Budget.entity';
export { BudgetCategory } from './entities/BudgetCategory.entity';
export { BudgetTrimester } from './entities/BudgetTrimester.entity';
export { Transaction } from './entities/Transaction.entity';
export { ValidationStep } from './entities/ValidationStep.entity';

export { Stock } from './entities/Stock.entity';
export { StockMovement } from './entities/StockMovement.entity';
export { StockAlert } from './entities/StockAlert.entity';

export { Housing } from './entities/Housing.entity';
export { Room } from './entities/Room.entity';
export { HousingOccupancy } from './entities/HousingOccupancy.entity';
export { HousingMaintenance } from './entities/HousingMaintenance.entity';

export { Vehicle } from './entities/Vehicle.entity';
export { VehicleMaintenance } from './entities/VehicleMaintenance.entity';
export { VehicleUsage } from './entities/VehicleUsage.entity';
export { VehicleFuel } from './entities/VehicleFuel.entity';

export { Workflow } from './entities/Workflow.entity';
export { WorkflowStep } from './entities/WorkflowStep.entity';
export { WorkflowInstance } from './entities/WorkflowInstance.entity';
export { WorkflowAction } from './entities/WorkflowAction.entity';

// Entités module Restauration
export { Restaurant, RestaurantType, RestaurantStatus } from './entities/Restaurant.entity';
export { Menu, TypeRepas, MenuStatus } from './entities/Menu.entity';
export type { PlatMenu, IngredientMenu } from './entities/Menu.entity';
export { TicketRepas, TicketStatus, CategorieTicket } from './entities/TicketRepas.entity';
export { Repas, RepasStatus } from './entities/Repas.entity';
export { StockDenree, AllocationStatus, TypeMouvementDenree } from './entities/StockDenree.entity';

// Entités module Transport
export { TransportRoute, RouteType, RouteStatus } from './entities/TransportRoute.entity';
export type { RouteStop } from './entities/TransportRoute.entity';
export { TicketTransport, TicketTransportStatus, CategorieTicketTransport } from './entities/TicketTransport.entity';

// Seeders
export { seedTenants } from './seeders/tenant.seeder';
export { seedUsersRBAC as seedUsers } from './seeders/user-rbac.seeder';

// Enums
export type { BudgetType, BudgetStatus } from './enums/budget.enum';
export type { MovementStatus } from './enums/movementStatus.enum';