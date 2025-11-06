/**
 * FICHIER: packages/database/src/migrations/1762166000000-TenantHierarchy.ts
 * MIGRATION: Ajout de la hiérarchie tenant (Ministère → CROU → Services)
 *
 * DESCRIPTION:
 * Transformation du système multi-tenant plat en hiérarchie à 3 niveaux
 * Ajout des champs: parentId, path, level, serviceType
 * Support pour les relations parent-enfant
 *
 * CHANGEMENTS:
 * 1. Ajout du type 'service' à l'enum tenants_type_enum
 * 2. Création de l'enum service_type_enum
 * 3. Ajout des colonnes de hiérarchie (parentId, path, level, serviceType)
 * 4. Ajout de la foreign key parentId → tenants.id
 *
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class TenantHierarchy1762166000000 implements MigrationInterface {
    name = 'TenantHierarchy1762166000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ajouter 'service' à l'enum tenants_type_enum
        await queryRunner.query(`
            ALTER TYPE "public"."tenants_type_enum"
            ADD VALUE IF NOT EXISTS 'service'
        `);

        // 2. Créer l'enum service_type_enum
        await queryRunner.query(`
            CREATE TYPE "public"."service_type_enum" AS ENUM(
                'financial',
                'stocks',
                'transport',
                'logement',
                'restauration'
            )
        `);

        // 3. Ajouter la colonne parentId
        await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD COLUMN "parentId" uuid NULL
        `);

        // 4. Ajouter la colonne path (chemin matérialisé)
        await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD COLUMN "path" character varying(500) NOT NULL DEFAULT ''
        `);

        // 5. Ajouter la colonne level (niveau hiérarchique)
        await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD COLUMN "level" integer NOT NULL DEFAULT 0
        `);

        // 6. Ajouter la colonne serviceType
        await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD COLUMN "serviceType" "public"."service_type_enum" NULL
        `);

        // 7. Ajouter la contrainte de foreign key pour parentId
        await queryRunner.query(`
            ALTER TABLE "tenants"
            ADD CONSTRAINT "FK_tenants_parent"
            FOREIGN KEY ("parentId")
            REFERENCES "tenants"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        // 8. Créer un index sur parentId pour les requêtes hiérarchiques
        await queryRunner.query(`
            CREATE INDEX "IDX_tenants_parent_id"
            ON "tenants" ("parentId")
        `);

        // 9. Créer un index sur path pour les recherches hiérarchiques
        await queryRunner.query(`
            CREATE INDEX "IDX_tenants_path"
            ON "tenants" ("path")
        `);

        // 10. Créer un index sur level pour filtrer par niveau
        await queryRunner.query(`
            CREATE INDEX "IDX_tenants_level"
            ON "tenants" ("level")
        `);

        // 11. Initialiser les données existantes
        // Tous les tenants actuels sont soit Ministère (level 0) soit CROU (level 1)
        await queryRunner.query(`
            UPDATE "tenants"
            SET "path" = "code"
            WHERE "path" = ''
        `);

        await queryRunner.query(`
            UPDATE "tenants"
            SET "level" = 0
            WHERE "type" = 'ministere'
        `);

        await queryRunner.query(`
            UPDATE "tenants"
            SET "level" = 1
            WHERE "type" = 'crou'
        `);

        // 12. Pour les CROU, définir le Ministère comme parent
        // Ceci sera fait dans un seeder car nous devons connaître l'ID du Ministère

        console.log('✅ Migration TenantHierarchy appliquée avec succès');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Ordre inverse de la création

        // 1. Supprimer les index
        await queryRunner.query(`
            DROP INDEX "public"."IDX_tenants_level"
        `);

        await queryRunner.query(`
            DROP INDEX "public"."IDX_tenants_path"
        `);

        await queryRunner.query(`
            DROP INDEX "public"."IDX_tenants_parent_id"
        `);

        // 2. Supprimer la contrainte de foreign key
        await queryRunner.query(`
            ALTER TABLE "tenants"
            DROP CONSTRAINT "FK_tenants_parent"
        `);

        // 3. Supprimer les colonnes
        await queryRunner.query(`
            ALTER TABLE "tenants"
            DROP COLUMN "serviceType"
        `);

        await queryRunner.query(`
            ALTER TABLE "tenants"
            DROP COLUMN "level"
        `);

        await queryRunner.query(`
            ALTER TABLE "tenants"
            DROP COLUMN "path"
        `);

        await queryRunner.query(`
            ALTER TABLE "tenants"
            DROP COLUMN "parentId"
        `);

        // 4. Supprimer l'enum service_type_enum
        await queryRunner.query(`
            DROP TYPE "public"."service_type_enum"
        `);

        // Note: On ne peut pas retirer 'service' de l'enum tenants_type_enum
        // car PostgreSQL ne supporte pas ALTER TYPE ... DROP VALUE
        // Si nécessaire, il faudrait recréer l'enum entièrement

        console.log('✅ Migration TenantHierarchy révoquée avec succès');
    }
}
