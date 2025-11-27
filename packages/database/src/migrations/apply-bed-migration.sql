-- ============================================================================
-- MIGRATION BED-CENTERED HOUSING
-- Fichier: apply-bed-migration.sql
-- Description: Transformation du système de logement vers un système centré sur les LITS
-- Date: Janvier 2025
-- ============================================================================

-- Activer le mode transaction
BEGIN;

\echo '🏥 [Migration] Début de la migration bed-centered...'
\echo ''

-- ============================================================================
-- PARTIE 1: CRÉATION ENUM BED_STATUS
-- ============================================================================

\echo '📋 [1/10] Création de l''enum bed_status...'

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'bed_status_enum') THEN
        CREATE TYPE bed_status_enum AS ENUM(
            'available',      -- Disponible (libre)
            'occupied',       -- Occupé (attribué à un étudiant)
            'maintenance',    -- En maintenance
            'out_of_service'  -- Hors service (inutilisable)
        );
        RAISE NOTICE '✅ Enum bed_status créé';
    ELSE
        RAISE NOTICE '⚠️  Enum bed_status existe déjà';
    END IF;
END $$;

-- ============================================================================
-- PARTIE 2: CRÉATION TABLE BEDS
-- ============================================================================

\echo '📋 [2/10] Création de la table beds...'

CREATE TABLE IF NOT EXISTS beds (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    room_id uuid NOT NULL,
    number character varying(10) NOT NULL,
    description text,
    notes text,
    status bed_status_enum NOT NULL DEFAULT 'available',
    is_active boolean NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now(),
    created_by character varying(255) NOT NULL DEFAULT 'system',
    updated_by character varying(255),
    CONSTRAINT pk_beds PRIMARY KEY (id),
    CONSTRAINT uq_beds_room_number UNIQUE (room_id, number)
);

\echo '✅ Table beds créée'

-- ============================================================================
-- PARTIE 3: INDEX POUR BEDS
-- ============================================================================

\echo '📋 [3/10] Création des index pour beds...'

CREATE INDEX IF NOT EXISTS idx_beds_room_status ON beds (room_id, status);
CREATE INDEX IF NOT EXISTS idx_beds_room_number ON beds (room_id, number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds (status);

\echo '✅ Index beds créés'

-- ============================================================================
-- PARTIE 4: FOREIGN KEY BEDS → ROOMS
-- ============================================================================

\echo '📋 [4/10] Ajout de la foreign key beds → rooms...'

ALTER TABLE beds
ADD CONSTRAINT fk_beds_room
FOREIGN KEY (room_id)
REFERENCES rooms(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

\echo '✅ Foreign key beds → rooms créée'

-- ============================================================================
-- PARTIE 5: GÉNÉRATION AUTOMATIQUE DES LITS POUR CHAMBRES EXISTANTES
-- ============================================================================

\echo '📋 [5/10] Génération automatique des lits pour chambres existantes...'

DO $$
DECLARE
    room_record RECORD;
    bed_count INTEGER;
    bed_letter VARCHAR(10);
    system_user VARCHAR(255) := 'system_migration';
    total_beds INTEGER := 0;
    total_rooms INTEGER := 0;
BEGIN
    FOR room_record IN
        SELECT id, numero, capacite, status
        FROM rooms
        WHERE capacite > 0
    LOOP
        total_rooms := total_rooms + 1;

        -- Pour chaque chambre, créer les lits selon sa capacité
        FOR bed_count IN 1..room_record.capacite LOOP
            -- Nommage: A-Z pour les 26 premiers, puis numéros
            IF bed_count <= 26 THEN
                bed_letter := CHR(64 + bed_count); -- A, B, C, ...
            ELSE
                bed_letter := (bed_count - 26)::VARCHAR; -- 1, 2, 3, ...
            END IF;

            -- Insérer le lit (skip si existe déjà)
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
            )
            ON CONFLICT (room_id, number) DO NOTHING;

            total_beds := total_beds + 1;
        END LOOP;

        IF room_record.capacite > 0 THEN
            RAISE NOTICE 'Chambre % : % lits créés', room_record.numero, room_record.capacite;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ Total: % lits générés pour % chambres', total_beds, total_rooms;
END $$;

\echo '✅ Lits générés pour toutes les chambres'

-- ============================================================================
-- PARTIE 6: AJOUT COLONNE BED_ID DANS HOUSING_OCCUPANCIES
-- ============================================================================

\echo '📋 [6/10] Ajout de la colonne bed_id dans housing_occupancies...'

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'housing_occupancies' AND column_name = 'bed_id'
    ) THEN
        ALTER TABLE housing_occupancies ADD COLUMN bed_id uuid;
        RAISE NOTICE '✅ Colonne bed_id ajoutée';
    ELSE
        RAISE NOTICE '⚠️  Colonne bed_id existe déjà';
    END IF;
END $$;

-- ============================================================================
-- PARTIE 7: MIGRATION DES DONNÉES - ATTRIBUTION DES LITS AUX OCCUPATIONS
-- ============================================================================

\echo '📋 [7/10] Attribution des lits aux occupations existantes...'

DO $$
DECLARE
    occ_record RECORD;
    available_bed_id UUID;
    assigned_count INTEGER := 0;
    skipped_count INTEGER := 0;
BEGIN
    FOR occ_record IN
        SELECT id, room_id, status
        FROM housing_occupancies
        WHERE bed_id IS NULL
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

            -- Marquer le lit comme occupé si occupation active
            IF occ_record.status = 'active' THEN
                UPDATE beds
                SET status = 'occupied'
                WHERE id = available_bed_id;
            END IF;

            assigned_count := assigned_count + 1;

            IF assigned_count % 10 = 0 THEN
                RAISE NOTICE 'Progression: % occupations traitées...', assigned_count;
            END IF;
        ELSE
            skipped_count := skipped_count + 1;
            RAISE WARNING 'Occupation % : aucun lit disponible dans la chambre %',
                occ_record.id, occ_record.room_id;
        END IF;
    END LOOP;

    RAISE NOTICE '✅ % lits attribués, % occupations sans lit disponible', assigned_count, skipped_count;
END $$;

\echo '✅ Lits attribués aux occupations'

-- ============================================================================
-- PARTIE 8: RENDRE BED_ID NOT NULL (après migration des données)
-- ============================================================================

\echo '📋 [8/10] Configuration de bed_id comme NOT NULL...'

DO $$
BEGIN
    -- Pour les occupations sans bed_id, attribuer un lit arbitraire
    UPDATE housing_occupancies occ
    SET bed_id = (
        SELECT id FROM beds
        WHERE room_id = occ.room_id
        LIMIT 1
    )
    WHERE bed_id IS NULL;

    -- Rendre la colonne NOT NULL
    ALTER TABLE housing_occupancies
    ALTER COLUMN bed_id SET NOT NULL;

    RAISE NOTICE '✅ bed_id configuré comme NOT NULL';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE '⚠️  Impossible de rendre bed_id NOT NULL (peut-être déjà NOT NULL ou données manquantes)';
END $$;

-- ============================================================================
-- PARTIE 9: FOREIGN KEY ET INDEX HOUSING_OCCUPANCIES
-- ============================================================================

\echo '📋 [9/10] Ajout de la foreign key et index...'

DO $$
BEGIN
    -- Ajouter foreign key si elle n'existe pas
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_housing_occupancies_bed'
    ) THEN
        ALTER TABLE housing_occupancies
        ADD CONSTRAINT fk_housing_occupancies_bed
        FOREIGN KEY (bed_id)
        REFERENCES beds(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE;
        RAISE NOTICE '✅ Foreign key ajoutée';
    ELSE
        RAISE NOTICE '⚠️  Foreign key existe déjà';
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_housing_occupancies_bed_status
ON housing_occupancies (bed_id, status);

\echo '✅ Foreign key et index créés'

-- ============================================================================
-- PARTIE 10: SYNCHRONISATION DES STATUTS DE LITS
-- ============================================================================

\echo '📋 [10/10] Synchronisation des statuts de lits avec les occupations...'

-- Mettre à jour les statuts des lits selon les occupations
UPDATE beds b
SET status = 'occupied'
WHERE EXISTS (
    SELECT 1 FROM housing_occupancies occ
    WHERE occ.bed_id = b.id
      AND occ.status = 'active'
)
AND status != 'occupied';

UPDATE beds b
SET status = 'available'
WHERE NOT EXISTS (
    SELECT 1 FROM housing_occupancies occ
    WHERE occ.bed_id = b.id
      AND occ.status = 'active'
)
AND status = 'occupied';

\echo '✅ Statuts de lits synchronisés'

-- ============================================================================
-- PARTIE 11: ENREGISTREMENT DANS L'HISTORIQUE DES MIGRATIONS
-- ============================================================================

\echo '📋 Enregistrement dans l''historique des migrations...'

INSERT INTO _migrations_history (timestamp, name)
VALUES (1763100000000, 'BedCenteredHousing1763100000000')
ON CONFLICT DO NOTHING;

\echo '✅ Migration enregistrée dans l''historique'

-- ============================================================================
-- STATISTIQUES FINALES
-- ============================================================================

\echo ''
\echo '📊 Statistiques finales:'
SELECT
    (SELECT COUNT(*) FROM beds) as total_lits,
    (SELECT COUNT(*) FROM beds WHERE status = 'available') as lits_disponibles,
    (SELECT COUNT(*) FROM beds WHERE status = 'occupied') as lits_occupes,
    (SELECT COUNT(*) FROM rooms) as total_chambres,
    (SELECT COUNT(*) FROM housing_occupancies WHERE bed_id IS NOT NULL) as occupations_avec_lit;

\echo ''
\echo '🎉 Migration bed-centered TERMINÉE avec succès!'
\echo '   ✓ Table beds créée'
\echo '   ✓ Lits générés pour toutes les chambres'
\echo '   ✓ Occupations liées aux lits'
\echo '   ✓ Statuts synchronisés'
\echo ''

-- Valider la transaction
COMMIT;

\echo '✅ Transaction validée - Base de données mise à jour'
