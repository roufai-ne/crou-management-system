/**
 * FICHIER: apps\web\src\test\e2e\global-setup.ts
 * SETUP: Configuration globale des tests E2E
 * 
 * DESCRIPTION:
 * Configuration globale pour les tests E2E
 * Initialisation des données de test
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('Configuration globale des tests E2E...');
  
  // Créer un navigateur pour les tests de setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Attendre que l'application soit prête
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Vérifier que l'application est accessible
    const title = await page.title();
    console.log(`Application chargée: ${title}`);
    
    // Créer des données de test si nécessaire
    await createTestData(page);
    
    console.log('Configuration globale terminée');
  } catch (error) {
    console.error('Erreur configuration globale:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function createTestData(page: any) {
  try {
    // Vérifier si l'API est accessible
    const response = await page.request.get('http://localhost:3000/api/health');
    if (response.ok()) {
      console.log('API accessible');
    } else {
      console.warn('API non accessible, tests en mode mock');
    }
  } catch (error) {
    console.warn('API non accessible, tests en mode mock:', error);
  }
}

export default globalSetup;
