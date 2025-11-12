-- ===================================================
-- MIGRATION: AnonymousTickets
-- DATE: Janvier 2025
-- FICHIER: 1762851000000-AnonymousTickets.sql
-- ===================================================
--
-- DESCRIPTION:
-- Migration pour transformer le système de tickets en tickets anonymes
-- - Suppression de la relation obligatoire avec User (etudiant)
-- - Simplification des catégories: PAYANT et GRATUIT uniquement
-- - Ajout de champs: typeRepas, annee, messageIndication
-- - Simplification des champs financiers: montant → tarif
-- - QR code devient obligatoire et unique
--
-- IMPORTANT: Exécuter ce script manuellement car TypeORM CLI a un problème
-- de dépendances circulaires entre Role et User entities
-- ===================================================

BEGIN;

-- Enregistrer la migration dans l'historique
INSERT INTO _migrations_history (timestamp, name)
VALUES (1762851000000, 'AnonymousTickets1762851000000')
ON CONFLICT DO NOTHING;

-- 1. Supprimer les contraintes foreign key existantes sur etudiant_id
ALTER TABLE tickets_repas
DROP CONSTRAINT IF EXISTS "FK_tickets_repas_etudiant_id";

-- 2. Rendre etudiant_id nullable
ALTER TABLE tickets_repas
ALTER COLUMN etudiant_id DROP NOT NULL;

-- 3. Recréer la contrainte FK avec ON DELETE SET NULL
ALTER TABLE tickets_repas
ADD CONSTRAINT "FK_tickets_repas_etudiant_id"
FOREIGN KEY (etudiant_id)
REFERENCES users(id)
ON DELETE SET NULL;

-- 4. Ajouter la colonne type_repas (OBLIGATOIRE)
ALTER TABLE tickets_repas
ADD COLUMN type_repas VARCHAR(50);

-- Initialiser type_repas pour les tickets existants avec une valeur par défaut
UPDATE tickets_repas
SET type_repas = 'dejeuner'
WHERE type_repas IS NULL;

-- Rendre type_repas NOT NULL après l'initialisation
ALTER TABLE tickets_repas
ALTER COLUMN type_repas SET NOT NULL;

-- 5. Ajouter la colonne annee
ALTER TABLE tickets_repas
ADD COLUMN annee INTEGER DEFAULT 2025;

-- 6. Renommer montant en tarif
ALTER TABLE tickets_repas
RENAME COLUMN montant TO tarif;

-- 7. Supprimer montant_subvention
ALTER TABLE tickets_repas
DROP COLUMN IF EXISTS montant_subvention;

-- 8. Supprimer nombre_repas_restants et nombre_repas_total
ALTER TABLE tickets_repas
DROP COLUMN IF EXISTS nombre_repas_restants,
DROP COLUMN IF EXISTS nombre_repas_total;

-- 9. Supprimer l'ancienne colonne type (qui contenait TypeTicket)
ALTER TABLE tickets_repas
DROP COLUMN IF EXISTS type;

-- 10. Modifier categorie pour le nouveau enum (PAYANT, GRATUIT)
-- Note: Les anciennes valeurs seront migrées
UPDATE tickets_repas
SET categorie = CASE
  WHEN categorie = 'etudiant_boursier' THEN 'gratuit'
  WHEN categorie IN ('etudiant_regulier', 'personnel', 'invite') THEN 'payant'
  ELSE 'payant'
END;

-- 11. Ajouter message_indication
ALTER TABLE tickets_repas
ADD COLUMN message_indication VARCHAR(500);

-- 12. Modifier qr_code: rendre obligatoire et unique
-- D'abord, générer des QR codes pour les tickets existants qui n'en ont pas
UPDATE tickets_repas
SET qr_code = CONCAT('QR-', id)
WHERE qr_code IS NULL;

-- Modifier la colonne pour la rendre NOT NULL
ALTER TABLE tickets_repas
ALTER COLUMN qr_code SET NOT NULL;

-- Modifier le type de TEXT à VARCHAR(255)
ALTER TABLE tickets_repas
ALTER COLUMN qr_code TYPE VARCHAR(255);

-- 13. Supprimer l'ancien index sur etudiant_id et recréer sans lui
DROP INDEX IF EXISTS "IDX_tickets_repas_tenant_etudiant";

CREATE INDEX "IDX_tickets_repas_tenant_numero"
ON tickets_repas (tenant_id, numero_ticket);

-- 14. Créer index unique sur qr_code s'il n'existe pas
CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tickets_repas_qr_code"
ON tickets_repas (qr_code);

-- 15. Mettre à jour les statuts: supprimer SUSPENDU
UPDATE tickets_repas
SET status = 'annule'
WHERE status = 'suspendu';

COMMIT;

-- ===================================================
-- MIGRATION COMPLÉTÉE
-- ===================================================
-- Vérifications recommandées:
-- 1. SELECT COUNT(*) FROM tickets_repas WHERE etudiant_id IS NULL;
-- 2. SELECT COUNT(*) FROM tickets_repas WHERE qr_code IS NOT NULL;
-- 3. SELECT DISTINCT categorie FROM tickets_repas;
-- 4. SELECT DISTINCT type_repas FROM tickets_repas;
-- ===================================================
