/**
 * FICHIER: packages\database\src\seeders\user.seeder.ts
 * SEEDER: Users - Ancien seeder désactivé
 * 
 * DESCRIPTION:
 * Ancien seeder désactivé - utiliser user-rbac.seeder.ts à la place
 * Le nouveau système RBAC est maintenant utilisé
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { DataSource } from 'typeorm';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  console.log('⚠️  Ancien seeder désactivé - utiliser seedUsersRBAC à la place');
  console.log('   Le nouveau système RBAC est maintenant utilisé');
  return;
}