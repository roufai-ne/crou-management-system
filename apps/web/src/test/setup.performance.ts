/**
 * FICHIER: apps\web\src\test\setup.performance.ts
 * SETUP: Configuration des tests de performance
 * 
 * DESCRIPTION:
 * Configuration pour les tests de performance
 * Mocks et utilitaires pour les tests de charge
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';

// Configuration des tests de performance
beforeAll(async () => {
  console.log('Configuration des tests de performance...');
});

beforeEach(async () => {
  // Nettoyer les mocks avant chaque test
  jest.clearAllMocks();
});

afterEach(async () => {
  // Nettoyer après chaque test
  jest.restoreAllMocks();
});

afterAll(async () => {
  console.log('Tests de performance terminés');
});

// Utilitaires pour les tests de performance
export const performanceUtils = {
  // Mesurer le temps de chargement
  measureLoadTime: async (page: any, url: string) => {
    const startTime = Date.now();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    return loadTime;
  },

  // Mesurer l'utilisation mémoire
  measureMemoryUsage: async (page: any) => {
    const metrics = await page.evaluate(() => {
      return {
        usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
        totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
        jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0
      };
    });
    return metrics;
  },

  // Mesurer les métriques de performance
  measurePerformanceMetrics: async (page: any) => {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        fcp: navigation.firstContentfulPaint,
        lcp: navigation.loadEventEnd - navigation.loadEventStart,
        ttfb: navigation.responseStart - navigation.requestStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart
      };
    });
    return metrics;
  },

  // Simuler une charge utilisateur
  simulateUserLoad: async (browser: any, userCount: number, testFunction: (page: any) => Promise<void>) => {
    const promises = [];
    
    for (let i = 0; i < userCount; i++) {
      const page = await browser.newPage();
      const promise = testFunction(page).finally(() => page.close());
      promises.push(promise);
    }
    
    const startTime = Date.now();
    await Promise.all(promises);
    const totalTime = Date.now() - startTime;
    
    return {
      userCount,
      totalTime,
      averageTime: totalTime / userCount
    };
  },

  // Mesurer le débit de requêtes
  measureRequestThroughput: async (page: any, requestCount: number, requestFunction: () => Promise<void>) => {
    const startTime = Date.now();
    
    const promises = Array(requestCount).fill(0).map(() => requestFunction());
    await Promise.all(promises);
    
    const totalTime = Date.now() - startTime;
    const throughput = (requestCount / totalTime) * 1000; // Requêtes par seconde
    
    return {
      requestCount,
      totalTime,
      throughput
    };
  }
};
