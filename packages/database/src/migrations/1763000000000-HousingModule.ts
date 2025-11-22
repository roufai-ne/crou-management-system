/**
 * FICHIER: packages/database/src/migrations/1763000000000-HousingModule.ts
 * MIGRATION: Mise à jour complète du module Housing
 *
 * DESCRIPTION:
 * Ajout des entités Student, HousingRequest, RenewalRequest
 * Mise à jour de HousingOccupancy pour utiliser Student au lieu de colonnes dupliquées
 *
 * CHANGEMENTS:
 * 1. Création de la table students
 * 2. Création de la table housing_requests
 * 3. Création de la table renewal_requests
 * 4. Migration des données housing_occupancies vers students
 * 5. Ajout de la colonne student_id dans housing_occupancies
 * 6. Suppression des anciennes colonnes (nom, prenom, email, etc.)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class HousingModule1763000000000 implements MigrationInterface {
    name = 'HousingModule1763000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ===========================================================
        // PARTIE 1: CRÉATION DES ENUMS
        // ===========================================================

        // 1.1 Enum pour les niveaux académiques
        await queryRunner.query(`
            CREATE TYPE "public"."niveau_academique_enum" AS ENUM(
                'L1', 'L2', 'L3', 'M1', 'M2', 'D'
            )
        `);

        // 1.2 Enum pour le statut des étudiants
        await queryRunner.query(`
            CREATE TYPE "public"."student_status_enum" AS ENUM(
                'actif', 'diplome', 'suspendu', 'abandonne', 'transfere'
            )
        `);

        // 1.3 Enum pour le statut des demandes
        await queryRunner.query(`
            CREATE TYPE "public"."request_status_enum" AS ENUM(
                'draft', 'submitted', 'under_review', 'approved',
                'assigned', 'confirmed', 'rejected', 'expired', 'cancelled'
            )
        `);

        // 1.4 Enum pour les priorités de demande
        await queryRunner.query(`
            CREATE TYPE "public"."request_priority_enum" AS ENUM(
                'normal', 'boursier', 'renouvellement', 'handicape'
            )
        `);

        // 1.5 Enum pour le type de demande
        await queryRunner.query(`
            CREATE TYPE "public"."request_type_enum" AS ENUM(
                'nouvelle', 'renouvellement', 'mutation'
            )
        `);

        // 1.6 Enum pour les raisons de changement
        await queryRunner.query(`
            CREATE TYPE "public"."change_reason_enum" AS ENUM(
                'confort', 'conflits', 'sante', 'rapprochement_cours', 'handicap', 'autre'
            )
        `);

        // 1.7 Enum pour les raisons de rejet
        await queryRunner.query(`
            CREATE TYPE "public"."rejection_reason_enum" AS ENUM(
                'impaye', 'mauvais_comportement', 'non_renouvellement_inscription',
                'capacite_insuffisante', 'diplome', 'autre'
            )
        `);

        // ===========================================================
        // PARTIE 2: CRÉATION TABLE STUDENTS
        // ===========================================================

        await queryRunner.query(`
            CREATE TABLE "students" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "matricule" character varying(50) NOT NULL,
                "nom" character varying(255) NOT NULL,
                "prenom" character varying(255) NOT NULL,
                "email" character varying(255) NOT NULL,
                "telephone" character varying(20),
                "dateNaissance" date,
                "genre" character varying(10),
                "universite" character varying(255) NOT NULL,
                "faculte" character varying(255) NOT NULL,
                "filiere" character varying(255) NOT NULL,
                "niveau" "public"."niveau_academique_enum" NOT NULL,
                "anneeUniversitaire" character varying(9),
                "status" "public"."student_status_enum" NOT NULL DEFAULT 'actif',
                "isBoursier" boolean NOT NULL DEFAULT false,
                "isHandicape" boolean NOT NULL DEFAULT false,
                "noteHandicap" character varying(500),
                "isActif" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" character varying(255) NOT NULL,
                "updatedBy" character varying(255),
                CONSTRAINT "PK_students" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_students_matricule" UNIQUE ("matricule"),
                CONSTRAINT "UQ_students_email" UNIQUE ("email")
            )
        `);

        // Index pour students
        await queryRunner.query(`
            CREATE INDEX "IDX_students_matricule"
            ON "students" ("matricule")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_students_tenant_status"
            ON "students" ("tenant_id", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_students_email"
            ON "students" ("email")
        `);

        // Foreign key tenant
        await queryRunner.query(`
            ALTER TABLE "students"
            ADD CONSTRAINT "FK_students_tenant"
            FOREIGN KEY ("tenant_id")
            REFERENCES "tenants"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        // ===========================================================
        // PARTIE 3: CRÉATION TABLE HOUSING_REQUESTS
        // ===========================================================

        await queryRunner.query(`
            CREATE TABLE "housing_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "student_id" uuid NOT NULL,
                "anneeUniversitaire" character varying(9) NOT NULL,
                "type" "public"."request_type_enum" NOT NULL DEFAULT 'nouvelle',
                "typeChambresPreferees" text NOT NULL,
                "motifDemande" text,
                "isUrgent" boolean NOT NULL DEFAULT false,
                "status" "public"."request_status_enum" NOT NULL DEFAULT 'draft',
                "priority" "public"."request_priority_enum" NOT NULL DEFAULT 'normal',
                "priorityScore" integer NOT NULL DEFAULT 0,
                "dateSubmission" TIMESTAMP,
                "dateTraitement" TIMESTAMP,
                "dateAssignation" TIMESTAMP,
                "dateConfirmation" TIMESTAMP,
                "dateExpiration" TIMESTAMP,
                "room_assigned_id" uuid,
                "isAutoAssigned" boolean NOT NULL DEFAULT false,
                "treated_by_id" uuid,
                "motifRejet" text,
                "commentaireGestionnaire" text,
                "certificatScolariteFourni" boolean NOT NULL DEFAULT false,
                "pieceIdentiteFournie" boolean NOT NULL DEFAULT false,
                "photoFournie" boolean NOT NULL DEFAULT false,
                "documentsUrls" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" character varying(255) NOT NULL,
                "updatedBy" character varying(255),
                CONSTRAINT "PK_housing_requests" PRIMARY KEY ("id")
            )
        `);

        // Index pour housing_requests
        await queryRunner.query(`
            CREATE INDEX "IDX_housing_requests_student_year"
            ON "housing_requests" ("student_id", "anneeUniversitaire")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_housing_requests_tenant_status"
            ON "housing_requests" ("tenant_id", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_housing_requests_status_priority"
            ON "housing_requests" ("status", "priority")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_housing_requests_year_status"
            ON "housing_requests" ("anneeUniversitaire", "status")
        `);

        // Foreign keys pour housing_requests
        await queryRunner.query(`
            ALTER TABLE "housing_requests"
            ADD CONSTRAINT "FK_housing_requests_tenant"
            FOREIGN KEY ("tenant_id")
            REFERENCES "tenants"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "housing_requests"
            ADD CONSTRAINT "FK_housing_requests_student"
            FOREIGN KEY ("student_id")
            REFERENCES "students"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "housing_requests"
            ADD CONSTRAINT "FK_housing_requests_room"
            FOREIGN KEY ("room_assigned_id")
            REFERENCES "rooms"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "housing_requests"
            ADD CONSTRAINT "FK_housing_requests_user"
            FOREIGN KEY ("treated_by_id")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        // ===========================================================
        // PARTIE 4: CRÉATION TABLE RENEWAL_REQUESTS
        // ===========================================================

        await queryRunner.query(`
            CREATE TABLE "renewal_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "tenant_id" uuid NOT NULL,
                "student_id" uuid NOT NULL,
                "current_occupancy_id" uuid NOT NULL,
                "anneeUniversitaire" character varying(9) NOT NULL,
                "keepSameRoom" boolean NOT NULL DEFAULT true,
                "changeReason" "public"."change_reason_enum",
                "typeChambresPreferees" text,
                "motifChangement" text,
                "status" "public"."request_status_enum" NOT NULL DEFAULT 'draft',
                "dateSubmission" TIMESTAMP,
                "dateTraitement" TIMESTAMP,
                "dateConfirmation" TIMESTAMP,
                "dateExpiration" TIMESTAMP,
                "new_room_id" uuid,
                "isApproved" boolean,
                "treated_by_id" uuid,
                "rejectionReason" "public"."rejection_reason_enum",
                "motifRejet" text,
                "commentaireGestionnaire" text,
                "hasPendingPayments" boolean NOT NULL DEFAULT false,
                "pendingAmount" decimal(10,2) NOT NULL DEFAULT 0,
                "hasInscriptionConfirmed" boolean NOT NULL DEFAULT false,
                "behaviorScore" integer NOT NULL DEFAULT 0,
                "maintenanceIssuesCount" integer NOT NULL DEFAULT 0,
                "isAutoRenewal" boolean NOT NULL DEFAULT false,
                "requiresManualReview" boolean NOT NULL DEFAULT false,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdBy" character varying(255) NOT NULL,
                "updatedBy" character varying(255),
                CONSTRAINT "PK_renewal_requests" PRIMARY KEY ("id")
            )
        `);

        // Index pour renewal_requests
        await queryRunner.query(`
            CREATE INDEX "IDX_renewal_requests_student_year"
            ON "renewal_requests" ("student_id", "anneeUniversitaire")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_renewal_requests_tenant_status"
            ON "renewal_requests" ("tenant_id", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_renewal_requests_occupancy"
            ON "renewal_requests" ("current_occupancy_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_renewal_requests_status_date"
            ON "renewal_requests" ("status", "dateSubmission")
        `);

        // Foreign keys pour renewal_requests
        await queryRunner.query(`
            ALTER TABLE "renewal_requests"
            ADD CONSTRAINT "FK_renewal_requests_tenant"
            FOREIGN KEY ("tenant_id")
            REFERENCES "tenants"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "renewal_requests"
            ADD CONSTRAINT "FK_renewal_requests_student"
            FOREIGN KEY ("student_id")
            REFERENCES "students"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "renewal_requests"
            ADD CONSTRAINT "FK_renewal_requests_occupancy"
            FOREIGN KEY ("current_occupancy_id")
            REFERENCES "housing_occupancies"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "renewal_requests"
            ADD CONSTRAINT "FK_renewal_requests_room"
            FOREIGN KEY ("new_room_id")
            REFERENCES "rooms"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "renewal_requests"
            ADD CONSTRAINT "FK_renewal_requests_user"
            FOREIGN KEY ("treated_by_id")
            REFERENCES "users"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        // ===========================================================
        // PARTIE 5: MIGRATION DES DONNÉES HOUSING_OCCUPANCIES → STUDENTS
        // ===========================================================

        // 5.1 Créer les étudiants depuis les occupations existantes
        await queryRunner.query(`
            INSERT INTO "students" (
                "id",
                "tenant_id",
                "matricule",
                "nom",
                "prenom",
                "email",
                "telephone",
                "universite",
                "faculte",
                "filiere",
                "niveau",
                "status",
                "isActif",
                "createdBy",
                "createdAt",
                "updatedAt"
            )
            SELECT DISTINCT
                uuid_generate_v4(),
                occ."tenant_id",
                COALESCE(occ."numeroEtudiant", 'MIGR-' || SUBSTRING(occ."id"::text, 1, 8)),
                occ."nom",
                occ."prenom",
                COALESCE(occ."email", 'migration+' || SUBSTRING(occ."id"::text, 1, 8) || '@crou.local'),
                occ."telephone",
                COALESCE(occ."universite", 'Non spécifié'),
                'Non spécifié',
                COALESCE(occ."filiere", 'Non spécifié'),
                'L1'::niveau_academique_enum,
                'actif'::student_status_enum,
                true,
                occ."createdBy",
                occ."createdAt",
                now()
            FROM "housing_occupancies" occ
            WHERE occ."nom" IS NOT NULL
            ON CONFLICT ("matricule") DO NOTHING
        `);

        // ===========================================================
        // PARTIE 6: MISE À JOUR HOUSING_OCCUPANCIES
        // ===========================================================

        // 6.1 Ajouter colonne student_id
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "student_id" uuid
        `);

        // 6.2 Remplir student_id depuis les données migrées
        await queryRunner.query(`
            UPDATE "housing_occupancies" occ
            SET "student_id" = s."id"
            FROM "students" s
            WHERE s."nom" = occ."nom"
              AND s."prenom" = occ."prenom"
              AND (s."email" = occ."email" OR occ."email" IS NULL)
        `);

        // 6.3 Ajouter colonne housing_request_id (optionnel)
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "housing_request_id" uuid
        `);

        // 6.4 Ajouter colonne anneeUniversitaire
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "anneeUniversitaire" character varying(9)
        `);

        // 6.5 Ajouter colonne updatedBy
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "updatedBy" character varying(255)
        `);

        // 6.6 Rendre student_id NOT NULL (après remplissage)
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ALTER COLUMN "student_id" SET NOT NULL
        `);

        // 6.7 Ajouter foreign key student_id
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD CONSTRAINT "FK_housing_occupancies_student"
            FOREIGN KEY ("student_id")
            REFERENCES "students"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        // 6.8 Ajouter foreign key housing_request_id (optionnel)
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD CONSTRAINT "FK_housing_occupancies_request"
            FOREIGN KEY ("housing_request_id")
            REFERENCES "housing_requests"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE
        `);

        // 6.9 Créer index student_id
        await queryRunner.query(`
            CREATE INDEX "IDX_housing_occupancies_student_status"
            ON "housing_occupancies" ("student_id", "status")
        `);

        // 6.10 Supprimer les anciennes colonnes redondantes
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            DROP COLUMN "nom",
            DROP COLUMN "prenom",
            DROP COLUMN "email",
            DROP COLUMN "telephone",
            DROP COLUMN "numeroEtudiant",
            DROP COLUMN "universite",
            DROP COLUMN "filiere"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restaurer les colonnes dans housing_occupancies
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "nom" character varying(255),
            ADD COLUMN "prenom" character varying(255),
            ADD COLUMN "email" character varying(255),
            ADD COLUMN "telephone" character varying(20),
            ADD COLUMN "numeroEtudiant" character varying(50),
            ADD COLUMN "universite" character varying(100),
            ADD COLUMN "filiere" character varying(100)
        `);

        // Copier les données depuis students
        await queryRunner.query(`
            UPDATE "housing_occupancies" occ
            SET
                "nom" = s."nom",
                "prenom" = s."prenom",
                "email" = s."email",
                "telephone" = s."telephone",
                "numeroEtudiant" = s."matricule",
                "universite" = s."universite",
                "filiere" = s."filiere"
            FROM "students" s
            WHERE occ."student_id" = s."id"
        `);

        // Supprimer les contraintes et index
        await queryRunner.query(`DROP INDEX "public"."IDX_housing_occupancies_student_status"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP CONSTRAINT "FK_housing_occupancies_request"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP CONSTRAINT "FK_housing_occupancies_student"`);

        // Supprimer les colonnes ajoutées
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN "updatedBy"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN "anneeUniversitaire"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN "housing_request_id"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN "student_id"`);

        // Supprimer les tables
        await queryRunner.query(`DROP TABLE "renewal_requests"`);
        await queryRunner.query(`DROP TABLE "housing_requests"`);
        await queryRunner.query(`DROP TABLE "students"`);

        // Supprimer les enums
        await queryRunner.query(`DROP TYPE "public"."rejection_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."change_reason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."request_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."request_priority_enum"`);
        await queryRunner.query(`DROP TYPE "public"."request_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."student_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."niveau_academique_enum"`);
    }
}
