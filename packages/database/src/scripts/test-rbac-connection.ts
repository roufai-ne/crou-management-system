/**
 * FICHIER: packages/database/src/scripts/test-rbac-connection.ts
 * SCRIPT: Test de connexion RBAC
 * 
 * DESCRIPTION:
 * Script de test pour vérifier la connexion et les entités RBAC
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource } from 'typeorm';
import { User } from '../entities/User.entity';
import { Role } from '../entities/Role.entity';
import { Permission } from '../entities/Permission.entity';
import { Tenant } from '../entities/Tenant.entity';
import { AuditLog } from '../entities/AuditLog.entity';
import { RefreshToken } from '../entities/RefreshToken.entity';

// Configuration de test simplifiée
const testDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USER || 'crou_user',
  password: process.env.DB_PASSWORD || 'crou_password',
  database: process.env.DB_NAME || 'crou_database',
  
  // Entités RBAC seulement
  entities: [
    User,
    Role,
    Permission,
    Tenant,
    AuditLog,
    RefreshToken
  ],
  
  synchronize: true,
  logging: true
});

async function testRBACConnection(): Promise<void> {
  try {
    console.log('🔄 Test de connexion RBAC...');
    
    // Initialiser la connexion
    await testDataSource.initialize();
    console.log('✅ Connexion établie');
    
    // Tester les métadonnées des entités
    const roleMetadata = testDataSource.getMetadata(Role);
    console.log('✅ Métadonnées Role:', roleMetadata.tableName);
    
    const permissionMetadata = testDataSource.getMetadata(Permission);
    console.log('✅ Métadonnées Permission:', permissionMetadata.tableName);
    
    // Tester les relations
    const rolePermissionRelation = roleMetadata.findRelationWithPropertyPath('permissions');
    console.log('✅ Relation Role->Permissions:', rolePermissionRelation?.type);
    
    const permissionRoleRelation = permissionMetadata.findRelationWithPropertyPath('roles');
    console.log('✅ Relation Permission->Roles:', permissionRoleRelation?.type);
    
    console.log('🎉 Test RBAC réussi !');
    
  } catch (error) {
    console.error('❌ Erreur test RBAC:', error);
    throw error;
  } finally {
    if (testDataSource.isInitialized) {
      await testDataSource.destroy();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testRBACConnection()
    .then(() => {
      console.log('✅ Test terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test échoué:', error);
      process.exit(1);
    });
}

export { testRBACConnection };