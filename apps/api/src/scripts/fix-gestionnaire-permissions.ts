/**
 * Script pour corriger les permissions des rôles Gestionnaire
 * Ajoute les permissions manquantes pour:
 * - Gestionnaire Stocks
 * - Gestionnaire Logement
 * - Gestionnaire Transport
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Pour ESM modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
config({ path: resolve(__dirname, '../../.env') });

// Configuration de la connexion à la base de données
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'crou_user',
  password: process.env.DB_PASSWORD || 'crou_password',
  database: process.env.DB_NAME || 'crou_database',
  synchronize: false,
  logging: true,
});

async function fixGestionnairePermissions() {
  try {
    console.log('🔧 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Connecté à la base de données\n');

    const queryRunner = AppDataSource.createQueryRunner();

    // 1. Récupérer les permissions nécessaires
    console.log('📋 Récupération des permissions...');
    const permissions = await queryRunner.query(`
      SELECT id, resource, actions::text as actions_text, actions
      FROM permissions 
      WHERE (resource = 'dashboard' AND actions::jsonb ? 'read')
         OR (resource = 'stocks' AND actions::jsonb ? 'read')
         OR (resource = 'stocks' AND actions::jsonb ? 'write')
         OR (resource = 'housing' AND actions::jsonb ? 'read')
         OR (resource = 'housing' AND actions::jsonb ? 'write')
         OR (resource = 'transport' AND actions::jsonb ? 'read')
         OR (resource = 'transport' AND actions::jsonb ? 'write')
         OR (resource = 'reports' AND actions::jsonb ? 'read')
      ORDER BY resource
    `);
    console.log(`   Trouvé ${permissions.length} permissions\n`);

    // 2. Récupérer les rôles Gestionnaire
    console.log('👥 Récupération des rôles Gestionnaire...');
    const roles = await queryRunner.query(`
      SELECT id, name 
      FROM roles 
      WHERE name IN ('Gestionnaire Stocks', 'Gestionnaire Logement', 'Gestionnaire Transport')
    `);
    console.log(`   Trouvé ${roles.length} rôles\n`);

    if (roles.length === 0) {
      console.log('⚠️  Aucun rôle Gestionnaire trouvé. Abandon.');
      return;
    }

    // 3. Créer un map des permissions par resource/actions
    const permissionMap: any = {};
    permissions.forEach((p: any) => {
      // Parse les actions si c'est une chaîne JSON
      let actions = p.actions;
      if (typeof actions === 'string') {
        actions = JSON.parse(actions);
      }
      const key = `${p.resource}:${actions[0]}`;
      permissionMap[key] = p.id;
    });

    // 4. Ajouter les permissions pour chaque rôle
    for (const role of roles) {
      console.log(`🔨 Traitement du rôle: ${role.name}`);
      
      let permissionIds: string[] = [];
      
      // Permissions communes à tous les gestionnaires
      permissionIds.push(permissionMap['dashboard:read']);
      permissionIds.push(permissionMap['reports:read']);

      // Permissions spécifiques selon le rôle
      if (role.name === 'Gestionnaire Stocks') {
        permissionIds.push(permissionMap['stocks:read']);
        permissionIds.push(permissionMap['stocks:write']);
      } else if (role.name === 'Gestionnaire Logement') {
        permissionIds.push(permissionMap['housing:read']);
        permissionIds.push(permissionMap['housing:write']);
      } else if (role.name === 'Gestionnaire Transport') {
        permissionIds.push(permissionMap['transport:read']);
        permissionIds.push(permissionMap['transport:write']);
      }

      // Filtrer les permissions undefined
      permissionIds = permissionIds.filter(id => id !== undefined);

      console.log(`   Ajout de ${permissionIds.length} permissions...`);

      // Insérer les permissions (ignore les doublons)
      for (const permissionId of permissionIds) {
        try {
          await queryRunner.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT (role_id, permission_id) DO NOTHING
          `, [role.id, permissionId]);
        } catch (error) {
          console.log(`   ⚠️  Permission déjà existante, ignoré`);
        }
      }

      // Vérifier les permissions ajoutées
      const currentPermissions = await queryRunner.query(`
        SELECT p.resource, p.actions, p.description
        FROM role_permissions rp
        JOIN permissions p ON p.id = rp.permission_id
        WHERE rp.role_id = $1
        ORDER BY p.resource
      `, [role.id]);

      console.log(`   ✅ Total: ${currentPermissions.length} permissions pour ${role.name}`);
      currentPermissions.forEach((p: any) => {
        const actions = typeof p.actions === 'string' ? JSON.parse(p.actions) : p.actions;
        console.log(`      - ${p.resource}:${actions.join(',')}`);
      });
      console.log('');
    }

    await queryRunner.release();
    
    console.log('✅ Correction des permissions terminée avec succès!\n');
    console.log('🔄 Veuillez redémarrer l\'API pour que les changements prennent effet.');

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Exécuter le script
fixGestionnairePermissions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Erreur fatale:', error);
    process.exit(1);
  });
