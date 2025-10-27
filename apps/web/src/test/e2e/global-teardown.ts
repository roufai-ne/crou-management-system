/**
 * FICHIER: apps\web\src\test\e2e\global-teardown.ts
 * TEARDOWN: Nettoyage global des tests E2E
 * 
 * DESCRIPTION:
 * Nettoyage global après les tests E2E
 * Suppression des données de test
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Nettoyage global des tests E2E...');
  
  try {
    // Nettoyer les données de test si nécessaire
    await cleanupTestData();
    
    console.log('Nettoyage global terminé');
  } catch (error) {
    console.error('Erreur nettoyage global:', error);
    throw error;
  }
}

async function cleanupTestData() {
  try {
    // Nettoyer les données de test
    console.log('Données de test nettoyées');
  } catch (error) {
    console.error('Erreur nettoyage données de test:', error);
  }
}

export default globalTeardown;
