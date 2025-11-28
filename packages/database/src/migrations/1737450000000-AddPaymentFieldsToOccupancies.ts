/**
 * FICHIER: packages/database/src/migrations/1737450000000-AddPaymentFieldsToOccupancies.ts
 * MIGRATION: Ajout des champs de paiement dans housing_occupancies
 *
 * DESCRIPTION:
 * Ajoute les colonnes liées au suivi des paiements de loyer dans la table housing_occupancies:
 * - is_rent_paid: Indicateur si le loyer est payé
 * - last_rent_payment_date: Date du dernier paiement de loyer
 * - contract_file_url: URL du fichier de contrat
 * - actual_end_date: Date réelle de fin d'occupation
 * - cancellation_reason: Raison de l'annulation (pour occupations annulées)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentFieldsToOccupancies1737450000000 implements MigrationInterface {
    name = 'AddPaymentFieldsToOccupancies1737450000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        console.log('📋 [Migration] Ajout des champs de paiement dans housing_occupancies...');

        // Ajouter la colonne is_rent_paid
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "is_rent_paid" boolean NOT NULL DEFAULT false
        `);
        console.log('✅ Colonne is_rent_paid ajoutée');

        // Ajouter la colonne last_rent_payment_date
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "last_rent_payment_date" TIMESTAMP NULL
        `);
        console.log('✅ Colonne last_rent_payment_date ajoutée');

        // Ajouter la colonne contract_file_url
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "contract_file_url" character varying(500) NULL
        `);
        console.log('✅ Colonne contract_file_url ajoutée');

        // Ajouter la colonne actual_end_date
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "actual_end_date" TIMESTAMP NULL
        `);
        console.log('✅ Colonne actual_end_date ajoutée');

        // Ajouter la colonne cancellation_reason
        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "cancellation_reason" text NULL
        `);
        console.log('✅ Colonne cancellation_reason ajoutée');

        // Ajouter la colonne anneeUniversitaire si elle n'existe pas
        const anneeUniversitaireColumn = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name='housing_occupancies'
            AND column_name='anneeUniversitaire'
        `);

        if (anneeUniversitaireColumn.length === 0) {
            await queryRunner.query(`
                ALTER TABLE "housing_occupancies"
                ADD COLUMN "anneeUniversitaire" character varying(20) NULL
            `);
            console.log('✅ Colonne anneeUniversitaire ajoutée');
        }

        // Ajouter un index sur is_rent_paid pour les requêtes de paiements en retard
        await queryRunner.query(`
            CREATE INDEX "IDX_housing_occupancies_rent_paid"
            ON "housing_occupancies" ("is_rent_paid", "status")
        `);
        console.log('✅ Index sur is_rent_paid créé');

        console.log('🎉 [Migration] Champs de paiement ajoutés avec succès!');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('📋 [Rollback] Suppression des champs de paiement...');

        // Supprimer l'index
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_housing_occupancies_rent_paid"`);

        // Supprimer les colonnes
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN IF EXISTS "cancellation_reason"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN IF EXISTS "actual_end_date"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN IF EXISTS "contract_file_url"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN IF EXISTS "last_rent_payment_date"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN IF EXISTS "is_rent_paid"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN IF EXISTS "anneeUniversitaire"`);

        console.log('✅ [Rollback] Champs de paiement supprimés');
    }
}
