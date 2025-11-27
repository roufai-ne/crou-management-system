/**
 * FICHIER: packages/database/src/migrations/1763100000000-BedCenteredHousing.ts
 * MIGRATION: Système d'attribution par lit
 *
 * DESCRIPTION:
 * Transformation du module logement pour passer d'un système centré sur les chambres
 * à un système centré sur les LITS individuels.
 *
 * CHANGEMENTS:
 * 1. Création de la table beds (lits)
 * 2. Ajout de la colonne bed_id dans housing_occupancies
 * 3. Création d'un enum pour les statuts de lit
 * 4. Migration automatique des données existantes
 * 5. Génération automatique des lits pour les chambres existantes
 *
 * PHILOSOPHIE:
 * - Tout tourne autour des lits (pas des chambres)
 * - Une chambre peut avoir 1-10+ lits (paramétrable)
 * - Chaque lit est attribué individuellement
 * - 4 statuts seulement: AVAILABLE, OCCUPIED, MAINTENANCE, OUT_OF_SERVICE
 * - PAS de statut RESERVED (pas de réservation)
 *
 * AUTEUR: Équipe CROU
 * DATE: Janvier 2025
 */

import { MigrationInterface, QueryRunner } from "typeorm";

export class BedCenteredHousing1763100000000 implements MigrationInterface {
    name = 'BedCenteredHousing1763100000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ===========================================================
        // PARTIE 1: CRÉATION ENUM BED_STATUS
        // ===========================================================

        console.log('📋 [Migration] Création de l\'enum bed_status...');

        await queryRunner.query(`
            CREATE TYPE "public"."bed_status_enum" AS ENUM(
                'available',      -- Disponible (libre)
                'occupied',       -- Occupé (attribué à un étudiant)
                'maintenance',    -- En maintenance
                'out_of_service'  -- Hors service (inutilisable)
            )
        `);

        console.log('✅ [Migration] Enum bed_status créé');

        // ===========================================================
        // PARTIE 2: CRÉATION TABLE BEDS
        // ===========================================================

        console.log('📋 [Migration] Création de la table beds...');

        await queryRunner.query(`
            CREATE TABLE "beds" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "room_id" uuid NOT NULL,
                "number" character varying(10) NOT NULL,
                "description" text,
                "notes" text,
                "status" "public"."bed_status_enum" NOT NULL DEFAULT 'available',
                "is_active" boolean NOT NULL DEFAULT true,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "created_by" character varying(255) NOT NULL,
                "updated_by" character varying(255),
                CONSTRAINT "PK_beds" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_beds_room_number" UNIQUE ("room_id", "number")
            )
        `);

        console.log('✅ [Migration] Table beds créée');

        // ===========================================================
        // PARTIE 3: INDEX POUR BEDS
        // ===========================================================

        console.log('📋 [Migration] Création des index pour beds...');

        await queryRunner.query(`
            CREATE INDEX "IDX_beds_room_status"
            ON "beds" ("room_id", "status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_beds_room_number"
            ON "beds" ("room_id", "number")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_beds_status"
            ON "beds" ("status")
        `);

        console.log('✅ [Migration] Index beds créés');

        // ===========================================================
        // PARTIE 4: FOREIGN KEY BEDS → ROOMS
        // ===========================================================

        console.log('📋 [Migration] Ajout de la foreign key beds → rooms...');

        await queryRunner.query(`
            ALTER TABLE "beds"
            ADD CONSTRAINT "FK_beds_room"
            FOREIGN KEY ("room_id")
            REFERENCES "rooms"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        console.log('✅ [Migration] Foreign key beds → rooms créée');

        // ===========================================================
        // PARTIE 5: GÉNÉRATION AUTOMATIQUE DES LITS POUR CHAMBRES EXISTANTES
        // ===========================================================

        console.log('📋 [Migration] Génération automatique des lits pour chambres existantes...');

        // Pour chaque chambre existante, créer autant de lits que sa capacité
        // Nommage: A, B, C, D... jusqu'à Z, puis 1, 2, 3...
        await queryRunner.query(`
            DO $$
            DECLARE
                room_record RECORD;
                bed_count INTEGER;
                bed_letter VARCHAR(10);
                system_user VARCHAR(255) := 'system_migration';
            BEGIN
                FOR room_record IN
                    SELECT id, numero, capacite, status
                    FROM rooms
                    WHERE capacite > 0
                LOOP
                    -- Pour chaque chambre, créer les lits selon sa capacité
                    FOR bed_count IN 1..room_record.capacite LOOP
                        -- Nommage: A-Z pour les 26 premiers, puis numéros
                        IF bed_count <= 26 THEN
                            bed_letter := CHR(64 + bed_count); -- A, B, C, ...
                        ELSE
                            bed_letter := (bed_count - 26)::VARCHAR; -- 1, 2, 3, ...
                        END IF;

                        -- Insérer le lit
                        INSERT INTO beds (
                            room_id,
                            number,
                            description,
                            status,
                            is_active,
                            created_by,
                            created_at,
                            updated_at
                        ) VALUES (
                            room_record.id,
                            bed_letter,
                            'Lit ' || bed_letter,
                            'available'::bed_status_enum,
                            true,
                            system_user,
                            NOW(),
                            NOW()
                        );
                    END LOOP;

                    RAISE NOTICE 'Chambre % : % lits créés', room_record.numero, room_record.capacite;
                END LOOP;
            END $$;
        `);

        console.log('✅ [Migration] Lits générés pour toutes les chambres');

        // ===========================================================
        // PARTIE 6: AJOUT COLONNE BED_ID DANS HOUSING_OCCUPANCIES
        // ===========================================================

        console.log('📋 [Migration] Ajout de la colonne bed_id dans housing_occupancies...');

        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD COLUMN "bed_id" uuid
        `);

        console.log('✅ [Migration] Colonne bed_id ajoutée');

        // ===========================================================
        // PARTIE 7: MIGRATION DES DONNÉES - ATTRIBUTION DES LITS AUX OCCUPATIONS
        // ===========================================================

        console.log('📋 [Migration] Attribution des lits aux occupations existantes...');

        // Pour chaque occupation active, attribuer un lit disponible dans la chambre
        await queryRunner.query(`
            DO $$
            DECLARE
                occ_record RECORD;
                available_bed_id UUID;
            BEGIN
                FOR occ_record IN
                    SELECT id, room_id, status
                    FROM housing_occupancies
                    WHERE status = 'active' AND bed_id IS NULL
                    ORDER BY "createdAt" ASC
                LOOP
                    -- Trouver un lit disponible dans la chambre
                    SELECT id INTO available_bed_id
                    FROM beds
                    WHERE room_id = occ_record.room_id
                      AND status = 'available'
                    LIMIT 1;

                    IF available_bed_id IS NOT NULL THEN
                        -- Attribuer le lit à l'occupation
                        UPDATE housing_occupancies
                        SET bed_id = available_bed_id
                        WHERE id = occ_record.id;

                        -- Marquer le lit comme occupé
                        UPDATE beds
                        SET status = 'occupied'
                        WHERE id = available_bed_id;

                        RAISE NOTICE 'Occupation % : lit attribué', occ_record.id;
                    ELSE
                        RAISE WARNING 'Occupation % : aucun lit disponible dans la chambre %',
                            occ_record.id, occ_record.room_id;
                    END IF;
                END LOOP;
            END $$;
        `);

        console.log('✅ [Migration] Lits attribués aux occupations actives');

        // ===========================================================
        // PARTIE 8: RENDRE BED_ID NOT NULL
        // ===========================================================

        console.log('📋 [Migration] Configuration de bed_id comme NOT NULL...');

        // Pour les occupations terminées/annulées sans bed_id, attribuer un lit arbitraire
        await queryRunner.query(`
            UPDATE housing_occupancies occ
            SET bed_id = (
                SELECT id FROM beds
                WHERE room_id = occ.room_id
                LIMIT 1
            )
            WHERE bed_id IS NULL
              AND status IN ('ended', 'cancelled')
        `);

        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ALTER COLUMN "bed_id" SET NOT NULL
        `);

        console.log('✅ [Migration] bed_id configuré comme NOT NULL');

        // ===========================================================
        // PARTIE 9: FOREIGN KEY ET INDEX HOUSING_OCCUPANCIES
        // ===========================================================

        console.log('📋 [Migration] Ajout de la foreign key et index...');

        await queryRunner.query(`
            ALTER TABLE "housing_occupancies"
            ADD CONSTRAINT "FK_housing_occupancies_bed"
            FOREIGN KEY ("bed_id")
            REFERENCES "beds"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_housing_occupancies_bed_status"
            ON "housing_occupancies" ("bed_id", "status")
        `);

        console.log('✅ [Migration] Foreign key et index créés');

        // ===========================================================
        // PARTIE 10: SYNCHRONISATION DES STATUTS DE LITS
        // ===========================================================

        console.log('📋 [Migration] Synchronisation des statuts de lits avec les occupations...');

        // Mettre à jour les statuts des lits selon les occupations
        await queryRunner.query(`
            UPDATE beds b
            SET status = 'occupied'
            WHERE EXISTS (
                SELECT 1 FROM housing_occupancies occ
                WHERE occ.bed_id = b.id
                  AND occ.status = 'active'
            );
        `);

        await queryRunner.query(`
            UPDATE beds b
            SET status = 'available'
            WHERE NOT EXISTS (
                SELECT 1 FROM housing_occupancies occ
                WHERE occ.bed_id = b.id
                  AND occ.status = 'active'
            )
            AND status = 'occupied';
        `);

        console.log('✅ [Migration] Statuts de lits synchronisés');

        console.log('');
        console.log('🎉 [Migration] Transformation bed-centered TERMINÉE !');
        console.log('   ✓ Table beds créée');
        console.log('   ✓ Lits générés pour toutes les chambres');
        console.log('   ✓ Occupations liées aux lits');
        console.log('   ✓ Statuts synchronisés');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        console.log('📋 [Rollback] Début du rollback de la migration bed-centered...');

        // Supprimer l'index et la foreign key de housing_occupancies
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_housing_occupancies_bed_status"`);
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP CONSTRAINT IF EXISTS "FK_housing_occupancies_bed"`);

        // Supprimer la colonne bed_id
        await queryRunner.query(`ALTER TABLE "housing_occupancies" DROP COLUMN IF EXISTS "bed_id"`);

        // Supprimer les contraintes et index de beds
        await queryRunner.query(`ALTER TABLE "beds" DROP CONSTRAINT IF EXISTS "FK_beds_room"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_beds_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_beds_room_number"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_beds_room_status"`);

        // Supprimer la table beds
        await queryRunner.query(`DROP TABLE IF EXISTS "beds"`);

        // Supprimer l'enum
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."bed_status_enum"`);

        console.log('✅ [Rollback] Migration bed-centered annulée');
    }
}
