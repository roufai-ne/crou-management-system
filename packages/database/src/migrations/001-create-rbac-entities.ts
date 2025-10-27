/**
 * FICHIER: packages\database\src\migrations\001-create-rbac-entities.ts
 * MIGRATION: Création des entités RBAC (Role, Permission, RefreshToken)
 * 
 * DESCRIPTION:
 * Migration pour créer les tables du système RBAC
 * - Table roles : Rôles du système
 * - Table permissions : Permissions granulaires
 * - Table role_permissions : Liaison rôles-permissions
 * - Table refresh_tokens : Tokens de rafraîchissement sécurisés
 * - Modification table users : Ajout relation avec roles
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRbacEntities1703000001 implements MigrationInterface {
  name = 'CreateRbacEntities1703000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Créer la table roles
    await queryRunner.query(`
      CREATE TABLE roles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) UNIQUE NOT NULL,
        description VARCHAR(255),
        tenant_type VARCHAR(20) DEFAULT 'crou' NOT NULL,
        is_system_role BOOLEAN DEFAULT false NOT NULL,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
      )
    `);

    // 2. Créer la table permissions
    await queryRunner.query(`
      CREATE TABLE permissions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        resource VARCHAR(50) NOT NULL,
        actions JSON NOT NULL,
        description VARCHAR(255),
        conditions JSON,
        is_active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_by VARCHAR(255),
        updated_by VARCHAR(255)
      )
    `);

    // 3. Créer la table de liaison role_permissions
    await queryRunner.query(`
      CREATE TABLE role_permissions (
        role_id UUID NOT NULL,
        permission_id UUID NOT NULL,
        PRIMARY KEY (role_id, permission_id)
      )
    `);

    // 4. Créer la table refresh_tokens
    await queryRunner.query(`
      CREATE TABLE refresh_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_revoked BOOLEAN DEFAULT false NOT NULL,
        revoked_at TIMESTAMP,
        revoked_reason VARCHAR(255),
        ip_address INET,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
      )
    `);

    // 5. Ajouter la colonne role_id à la table users
    await queryRunner.query(`
      ALTER TABLE users ADD COLUMN role_id UUID
    `);

    // 6. Créer les clés étrangères
    await queryRunner.query(`
      ALTER TABLE role_permissions 
      ADD CONSTRAINT FK_role_permissions_role 
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE role_permissions 
      ADD CONSTRAINT FK_role_permissions_permission 
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE refresh_tokens 
      ADD CONSTRAINT FK_refresh_tokens_user 
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    `);

    // 7. Créer les index pour optimiser les performances
    await queryRunner.query(`
      CREATE INDEX IDX_permissions_resource ON permissions(resource)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_refresh_tokens_user_revoked ON refresh_tokens(user_id, is_revoked)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_refresh_tokens_expires_at ON refresh_tokens(expires_at)
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_roles_tenant_type ON roles(tenant_type)
    `);

    console.log('✅ Migration RBAC entities créée avec succès');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Supprimer dans l'ordre inverse pour éviter les erreurs de contraintes

    // 1. Supprimer les index
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_roles_tenant_type`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_refresh_tokens_expires_at`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_refresh_tokens_user_revoked`);
    await queryRunner.query(`DROP INDEX IF EXISTS IDX_permissions_resource`);

    // 2. Supprimer les clés étrangères
    await queryRunner.query(`ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS FK_refresh_tokens_user`);
    await queryRunner.query(`ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS FK_role_permissions_permission`);
    await queryRunner.query(`ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS FK_role_permissions_role`);

    // 3. Supprimer la colonne role_id de users
    await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS role_id`);

    // 4. Supprimer les tables
    await queryRunner.query(`DROP TABLE IF EXISTS refresh_tokens`);
    await queryRunner.query(`DROP TABLE IF EXISTS role_permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS permissions`);
    await queryRunner.query(`DROP TABLE IF EXISTS roles`);

    console.log('✅ Migration RBAC entities annulée avec succès');
  }
}