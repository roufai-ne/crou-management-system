/**
 * MIGRATION: AnonymousTickets
 * DATE: Janvier 2025
 *
 * DESCRIPTION:
 * Migration pour transformer le système de tickets en tickets anonymes
 * - Suppression de la relation obligatoire avec User (etudiant)
 * - Simplification des catégories: PAYANT et GRATUIT uniquement
 * - Ajout de champs: typeRepas, annee, messageIndication
 * - Simplification des champs financiers: montant → tarif
 * - QR code devient obligatoire et unique
 *
 * CHANGEMENTS MAJEURS:
 * 1. etudiant_id: NOT NULL → NULLABLE (avec SET NULL on delete)
 * 2. Suppression: type (TypeTicket), montantSubvention, nombre_repas_*
 * 3. Ajouts: type_repas (OBLIGATOIRE), annee, message_indication
 * 4. Renommage: montant → tarif
 * 5. QR code: OPTIONAL → OBLIGATOIRE + UNIQUE
 */

import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AnonymousTickets1762851000000 implements MigrationInterface {
  name = 'AnonymousTickets1762851000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Vérifier si la colonne etudiant_id existe
    const hasEtudiantId = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tickets_repas' AND column_name = 'etudiant_id'
    `);

    // Si la colonne etudiant_id existe, la SUPPRIMER complètement (système 100% anonyme)
    if (hasEtudiantId.length > 0) {
      // 1. Supprimer les contraintes foreign key existantes sur etudiant_id
      await queryRunner.query(`
        ALTER TABLE tickets_repas
        DROP CONSTRAINT IF EXISTS "FK_tickets_repas_etudiant_id"
      `);

      // 2. SUPPRIMER la colonne etudiant_id
      await queryRunner.query(`
        ALTER TABLE tickets_repas
        DROP COLUMN etudiant_id
      `);

      console.log('✓ Colonne etudiant_id supprimée - Tickets 100% anonymes');
    } else {
      console.log('✓ Colonne etudiant_id absente - Déjà anonyme');
    }

    // 4. Ajouter la colonne type_repas (OBLIGATOIRE) si elle n'existe pas
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ADD COLUMN IF NOT EXISTS type_repas VARCHAR(50)
    `);

    // Initialiser type_repas pour les tickets existants avec une valeur par défaut
    await queryRunner.query(`
      UPDATE tickets_repas
      SET type_repas = 'dejeuner'
      WHERE type_repas IS NULL
    `);

    // Rendre type_repas NOT NULL après l'initialisation
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ALTER COLUMN type_repas SET NOT NULL
    `);

    // 5. Ajouter la colonne annee si elle n'existe pas
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ADD COLUMN IF NOT EXISTS annee INTEGER DEFAULT 2025
    `);

    // 6. Renommer montant en tarif (si la colonne montant existe)
    const hasMontant = await queryRunner.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tickets_repas' AND column_name = 'montant'
    `);

    if (hasMontant.length > 0) {
      await queryRunner.query(`
        ALTER TABLE tickets_repas
        RENAME COLUMN montant TO tarif
      `);
    }

    // 7. Supprimer montant_subvention
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      DROP COLUMN IF EXISTS montant_subvention
    `);

    // 8. Supprimer nombre_repas_restants et nombre_repas_total
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      DROP COLUMN IF EXISTS nombre_repas_restants,
      DROP COLUMN IF EXISTS nombre_repas_total
    `);

    // 9. Supprimer l'ancienne colonne type (qui contenait TypeTicket)
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      DROP COLUMN IF EXISTS type
    `);

    // 10. Modifier categorie pour le nouveau enum (PAYANT, GRATUIT)
    // Note: Les anciennes valeurs seront migrées
    await queryRunner.query(`
      UPDATE tickets_repas
      SET categorie = CASE
        WHEN categorie = 'etudiant_boursier' THEN 'gratuit'
        WHEN categorie IN ('etudiant_regulier', 'personnel', 'invite') THEN 'payant'
        ELSE 'payant'
      END
    `);

    // 11. Ajouter message_indication si elle n'existe pas
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ADD COLUMN IF NOT EXISTS message_indication VARCHAR(500)
    `);

    // 12. Modifier qr_code: rendre obligatoire et unique
    // D'abord, générer des QR codes pour les tickets existants qui n'en ont pas
    await queryRunner.query(`
      UPDATE tickets_repas
      SET qr_code = CONCAT('QR-', id)
      WHERE qr_code IS NULL
    `);

    // Modifier la colonne pour la rendre NOT NULL
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ALTER COLUMN qr_code SET NOT NULL
    `);

    // Modifier le type de TEXT à VARCHAR(255)
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ALTER COLUMN qr_code TYPE VARCHAR(255)
    `);

    // 13. Supprimer l'ancien index sur etudiant_id et recréer sans lui
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tickets_repas_tenant_etudiant"
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_repas_tenant_numero"
      ON tickets_repas (tenant_id, numero_ticket)
    `);

    // 14. Créer index unique sur qr_code s'il n'existe pas
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "IDX_tickets_repas_qr_code"
      ON tickets_repas (qr_code)
    `);

    // 15. Mettre à jour les statuts: supprimer SUSPENDU
    await queryRunner.query(`
      UPDATE tickets_repas
      SET status = 'annule'
      WHERE status = 'suspendu'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback: restaurer l'ancien schéma

    // 1. Supprimer l'index unique sur qr_code
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tickets_repas_qr_code"
    `);

    // 2. Rendre qr_code nullable et TEXT
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ALTER COLUMN qr_code TYPE TEXT,
      ALTER COLUMN qr_code DROP NOT NULL
    `);

    // 3. Supprimer message_indication
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      DROP COLUMN IF EXISTS message_indication
    `);

    // 4. Restaurer l'ancienne colonne type
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ADD COLUMN type VARCHAR(50) DEFAULT 'unitaire'
    `);

    // 5. Restaurer nombre_repas_*
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ADD COLUMN nombre_repas_restants INTEGER,
      ADD COLUMN nombre_repas_total INTEGER
    `);

    // 6. Restaurer montant_subvention
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ADD COLUMN montant_subvention DECIMAL(10, 2) DEFAULT 0
    `);

    // 7. Renommer tarif en montant
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      RENAME COLUMN tarif TO montant
    `);

    // 8. Supprimer annee
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      DROP COLUMN IF EXISTS annee
    `);

    // 9. Supprimer type_repas
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      DROP COLUMN IF EXISTS type_repas
    `);

    // 10. Supprimer l'index tenant_numero et restaurer tenant_etudiant
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tickets_repas_tenant_numero"
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_tickets_repas_tenant_etudiant"
      ON tickets_repas (tenant_id, etudiant_id)
    `);

    // 11. Supprimer la FK avec SET NULL et recréer avec CASCADE
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      DROP CONSTRAINT IF EXISTS "FK_tickets_repas_etudiant_id"
    `);

    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ADD CONSTRAINT "FK_tickets_repas_etudiant_id"
      FOREIGN KEY (etudiant_id)
      REFERENCES users(id)
      ON DELETE CASCADE
    `);

    // 12. Rendre etudiant_id NOT NULL (attention: peut échouer si des NULL existent)
    await queryRunner.query(`
      ALTER TABLE tickets_repas
      ALTER COLUMN etudiant_id SET NOT NULL
    `);
  }
}
