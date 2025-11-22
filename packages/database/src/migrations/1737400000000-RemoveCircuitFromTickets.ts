/**
 * MIGRATION: RemoveCircuitFromTickets
 * DATE: 20 Janvier 2025
 *
 * DESCRIPTION:
 * Supprime circuitId et dateVoyage des tickets de transport
 * Les tickets deviennent universels (valables sur toutes les navettes)
 *
 * CHANGEMENTS:
 * - Supprime circuit_id (FK vers transport_routes)
 * - Supprime date_voyage
 * - Renomme date_expiration en valid_until
 * - Ajoute is_expired
 * - Ajoute bus_assignment_id (pour statistiques)
 */

import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class RemoveCircuitFromTickets1737400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Début - RemoveCircuitFromTickets');

    // 1. Supprimer la contrainte FK vers transport_routes
    console.log('[Migration] Suppression contrainte FK_tickets_transport_circuit...');
    await queryRunner.query(`
      ALTER TABLE tickets_transport
      DROP CONSTRAINT IF EXISTS "FK_tickets_transport_circuit"
    `);

    // 2. Supprimer les index liés au circuit
    console.log('[Migration] Suppression des index...');
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tickets_transport_circuit_date"
    `);
    await queryRunner.query(`
      DROP INDEX IF EXISTS "IDX_tickets_transport_date_voyage"
    `);

    // 3. Supprimer la colonne circuit_id
    console.log('[Migration] Suppression colonne circuit_id...');
    await queryRunner.dropColumn('tickets_transport', 'circuit_id');

    // 4. Supprimer la colonne date_voyage
    console.log('[Migration] Suppression colonne date_voyage...');
    await queryRunner.dropColumn('tickets_transport', 'date_voyage');

    // 5. Renommer date_expiration en valid_until
    console.log('[Migration] Renommage date_expiration → valid_until...');
    await queryRunner.renameColumn(
      'tickets_transport',
      'date_expiration',
      'valid_until'
    );

    // 6. Ajouter colonne is_expired
    console.log('[Migration] Ajout colonne is_expired...');
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'is_expired',
      type: 'boolean',
      default: false,
      isNullable: false
    }));

    // 7. Ajouter colonne bus_assignment_id (pour lier au bus lors utilisation)
    console.log('[Migration] Ajout colonne bus_assignment_id...');
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'bus_assignment_id',
      type: 'uuid',
      isNullable: true
    }));

    // 8. Mettre à jour les tickets existants
    console.log('[Migration] Mise à jour tickets existants...');

    // Tickets non utilisés → validUntil = 31/12/2025
    await queryRunner.query(`
      UPDATE tickets_transport
      SET valid_until = '2025-12-31'
      WHERE est_utilise = false
      AND status = 'actif'
    `);

    // Tickets utilisés → validUntil = date_utilisation (si pas null)
    await queryRunner.query(`
      UPDATE tickets_transport
      SET valid_until = COALESCE(date_utilisation::date, '2025-12-31')
      WHERE est_utilise = true
    `);

    // 9. Supprimer la colonne trajet_id (remplacée par bus_assignment_id)
    console.log('[Migration] Suppression colonne trajet_id...');
    await queryRunner.dropColumn('tickets_transport', 'trajet_id');

    console.log('[Migration] Terminée - RemoveCircuitFromTickets');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Rollback - RemoveCircuitFromTickets');

    // Restaurer trajet_id
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'trajet_id',
      type: 'uuid',
      isNullable: true
    }));

    // Supprimer bus_assignment_id
    await queryRunner.dropColumn('tickets_transport', 'bus_assignment_id');

    // Supprimer is_expired
    await queryRunner.dropColumn('tickets_transport', 'is_expired');

    // Renommer valid_until → date_expiration
    await queryRunner.renameColumn('tickets_transport', 'valid_until', 'date_expiration');

    // Restaurer date_voyage
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'date_voyage',
      type: 'date',
      isNullable: true
    }));

    // Restaurer circuit_id
    await queryRunner.addColumn('tickets_transport', new TableColumn({
      name: 'circuit_id',
      type: 'uuid',
      isNullable: true
    }));

    // Restaurer FK
    await queryRunner.query(`
      ALTER TABLE tickets_transport
      ADD CONSTRAINT "FK_tickets_transport_circuit"
      FOREIGN KEY (circuit_id) REFERENCES transport_routes(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
    `);

    console.log('[Migration] Rollback terminé');
  }
}
