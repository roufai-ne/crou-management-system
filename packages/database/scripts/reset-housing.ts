/**
 * Script pour supprimer toutes les données de logement et recréer un jeu complet
 */

import { AppDataSource } from '../src/config/datasource';

async function resetHousingData() {
  try {
    console.log('🔄 Connexion à la base de données...');
    await AppDataSource.initialize();
    console.log('✅ Connexion établie\n');

    const qr = AppDataSource.createQueryRunner();

    // Supprimer dans l'ordre des dépendances (du plus dépendant au moins dépendant)
    console.log('🗑️  Suppression des données de logement existantes...');
    
    // D'abord les occupancies qui référencent beds
    await qr.query('DELETE FROM housing_occupancies');
    console.log('  ✓ Occupancies supprimées');
    
    // Puis les beds qui référencent rooms
    await qr.query('DELETE FROM beds');
    console.log('  ✓ Lits supprimés');
    
    // Puis les rooms qui référencent housings
    await qr.query('DELETE FROM rooms');
    console.log('  ✓ Chambres supprimées');
    
    // Enfin les housings
    await qr.query('DELETE FROM housings');
    console.log('  ✓ Cités supprimées');
    
    await qr.release();
    
    console.log('\n✅ Toutes les données de logement ont été supprimées\n');
    
    await AppDataSource.destroy();
    console.log('🔌 Connexion fermée');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

resetHousingData();
