/**
 * MIGRATION: CreateTransportTicketPrices
 * DATE: 20 Janvier 2025
 *
 * DESCRIPTION:
 * Crée la table transport_ticket_prices pour gérer les tarifs configurables
 */

import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateTransportTicketPrices1737400100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Création table transport_ticket_prices...');

    await queryRunner.createTable(
      new Table({
        name: 'transport_ticket_prices',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            default: 'uuid_generate_v4()'
          },
          {
            name: 'tenant_id',
            type: 'uuid',
            isNullable: false
          },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: false,
            default: 0
          },
          {
            name: 'is_active',
            type: 'boolean',
            default: true,
            isNullable: false
          },
          {
            name: 'is_default',
            type: 'boolean',
            default: false,
            isNullable: false
          },
          {
            name: 'display_order',
            type: 'int',
            default: 0,
            isNullable: false
          },
          {
            name: 'conditions',
            type: 'jsonb',
            isNullable: true
          },
          {
            name: 'total_tickets_issued',
            type: 'int',
            default: 0,
            isNullable: false
          },
          {
            name: 'total_revenue',
            type: 'decimal',
            precision: 15,
            scale: 2,
            default: 0,
            isNullable: false
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'now()',
            isNullable: false
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '255',
            isNullable: false
          },
          {
            name: 'updated_by',
            type: 'varchar',
            length: '255',
            isNullable: true
          }
        ],
        foreignKeys: [
          {
            name: 'FK_transport_ticket_prices_tenant',
            columnNames: ['tenant_id'],
            referencedTableName: 'tenants',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
          }
        ]
      }),
      true
    );

    // Index
    await queryRunner.createIndex(
      'transport_ticket_prices',
      new TableIndex({
        name: 'IDX_transport_ticket_prices_tenant_category',
        columnNames: ['tenant_id', 'category']
      })
    );

    await queryRunner.createIndex(
      'transport_ticket_prices',
      new TableIndex({
        name: 'IDX_transport_ticket_prices_tenant_active',
        columnNames: ['tenant_id', 'is_active']
      })
    );

    // Insérer tarifs par défaut (à adapter selon tenant)
    console.log('[Migration] Insertion tarifs par défaut...');

    // Note: Vous devrez adapter le tenant_id selon votre système
    // Ceci est un exemple pour le premier tenant
    await queryRunner.query(`
      INSERT INTO transport_ticket_prices (tenant_id, category, name, description, amount, is_active, is_default, display_order, created_by)
      SELECT
        id as tenant_id,
        'standard' as category,
        'Tarif Standard' as name,
        'Tarif normal pour les étudiants' as description,
        200 as amount,
        true as is_active,
        true as is_default,
        1 as display_order,
        'SYSTEM' as created_by
      FROM tenants
      LIMIT 1
    `);

    await queryRunner.query(`
      INSERT INTO transport_ticket_prices (tenant_id, category, name, description, amount, is_active, is_default, display_order, created_by)
      SELECT
        id as tenant_id,
        'boursier' as category,
        'Gratuit - Étudiant Boursier' as name,
        'Ticket gratuit pour les étudiants boursiers' as description,
        0 as amount,
        true as is_active,
        false as is_default,
        2 as display_order,
        'SYSTEM' as created_by
      FROM tenants
      LIMIT 1
    `);

    console.log('[Migration] Table transport_ticket_prices créée avec succès');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('[Migration] Suppression table transport_ticket_prices...');

    await queryRunner.dropIndex('transport_ticket_prices', 'IDX_transport_ticket_prices_tenant_active');
    await queryRunner.dropIndex('transport_ticket_prices', 'IDX_transport_ticket_prices_tenant_category');
    await queryRunner.dropTable('transport_ticket_prices');

    console.log('[Migration] Table supprimée');
  }
}
