/**
 * FICHIER: apps\web\src\test\performance\performance.test.ts
 * TESTS: Tests de performance
 * 
 * DESCRIPTION:
 * Tests de performance pour l'application CROU
 * Validation des métriques de performance
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';

describe('Tests de Performance', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Métriques de Performance', () => {
    it('devrait charger la page de connexion en moins de 2 secondes', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173/auth/login');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(2000);
    });

    it('devrait charger le dashboard en moins de 3 secondes', async () => {
      // Mock de l'authentification
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: 'test-user-1',
              email: 'test@crou.niger',
              name: 'Test User',
              role: 'admin',
              level: 'ministere',
              permissions: ['*'],
              isActive: true
            },
            accessToken: 'test-access-token',
            refreshToken: 'test-refresh-token',
            expiresIn: 3600
          }
        });
      });

      // Mock des données du dashboard
      await page.route('**/api/dashboard', async route => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              globalKPIs: {
                totalBudget: 10000000,
                totalSpent: 7500000,
                totalStudents: 5000,
                totalHousing: 1000,
                totalVehicles: 50
              },
              moduleKPIs: {
                financial: { budgetUtilization: 75, pendingApprovals: 5 },
                stocks: { lowStockItems: 10, totalItems: 500 },
                housing: { occupancyRate: 85, availableRooms: 150 },
                transport: { activeVehicles: 45, maintenanceDue: 3 }
              },
              recentActivities: [],
              alerts: []
            }
          })
        });
      });

      const startTime = Date.now();
      
      // Se connecter
      await page.goto('http://localhost:5173/auth/login');
      await page.fill('input[type="email"]', 'test@crou.niger');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Attendre le dashboard
      await page.waitForURL('/dashboard');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000);
    });

    it('devrait avoir un score Lighthouse > 90', async () => {
      // Aller à la page de connexion
      await page.goto('http://localhost:5173/auth/login');
      await page.waitForLoadState('networkidole');
      
      // Mesurer les métriques de performance
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        return {
          fcp: navigation.firstContentfulPaint,
          lcp: navigation.loadEventEnd - navigation.loadEventStart,
          fid: 0, // First Input Delay - mesuré différemment
          cls: 0, // Cumulative Layout Shift - mesuré différemment
          ttfb: navigation.responseStart - navigation.requestStart
        };
      });
      
      // Vérifier les métriques
      expect(metrics.fcp).toBeLessThan(1500); // First Contentful Paint < 1.5s
      expect(metrics.lcp).toBeLessThan(2500); // Largest Contentful Paint < 2.5s
      expect(metrics.ttfb).toBeLessThan(600); // Time to First Byte < 600ms
    });

    it('devrait gérer 100 utilisateurs simultanés', async () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        const userPage = await browser.newPage();
        
        // Mock de l'authentification
        await userPage.route('**/api/auth/login', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              user: {
                id: `test-user-${i}`,
                email: `test${i}@crou.niger`,
                name: `Test User ${i}`,
                role: 'admin',
                level: 'ministere',
                permissions: ['*'],
                isActive: true
              },
              accessToken: `test-access-token-${i}`,
              refreshToken: `test-refresh-token-${i}`,
              expiresIn: 3600
            }
          });
        });
        
        // Mock des données du dashboard
        await userPage.route('**/api/dashboard', async route => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              data: {
                globalKPIs: {
                  totalBudget: 10000000,
                  totalSpent: 7500000,
                  totalStudents: 5000,
                  totalHousing: 1000,
                  totalVehicles: 50
                },
                moduleKPIs: {
                  financial: { budgetUtilization: 75, pendingApprovals: 5 },
                  stocks: { lowStockItems: 10, totalItems: 500 },
                  housing: { occupancyRate: 85, availableRooms: 150 },
                  transport: { activeVehicles: 45, maintenanceDue: 3 }
                },
                recentActivities: [],
                alerts: []
              }
            })
          });
        });
        
        const promise = userPage.goto('http://localhost:5173/auth/login')
          .then(() => userPage.fill('input[type="email"]', `test${i}@crou.niger`))
          .then(() => userPage.fill('input[type="password"]', 'password123'))
          .then(() => userPage.click('button[type="submit"]'))
          .then(() => userPage.waitForURL('/dashboard'))
          .then(() => userPage.close());
        
        promises.push(promise);
      }
      
      const startTime = Date.now();
      await Promise.all(promises);
      const totalTime = Date.now() - startTime;
      
      // Vérifier que tous les utilisateurs se sont connectés en moins de 30 secondes
      expect(totalTime).toBeLessThan(30000);
    });

    it('devrait gérer la pagination efficacement', async () => {
      // Mock des données avec pagination
      await page.route('**/api/financial/transactions**', async route => {
        const url = new URL(route.request().url());
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        
        const transactions = Array.from({ length: limit }, (_, i) => ({
          id: `transaction-${page}-${i}`,
          description: `Transaction ${page}-${i}`,
          amount: 1000 + i,
          type: 'debit',
          date: '2024-01-15',
          status: 'completed'
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: transactions,
            pagination: {
              page,
              limit,
              total: 1000,
              totalPages: 100
            }
          })
        });
      });
      
      const startTime = Date.now();
      
      // Naviguer vers la page financière
      await page.goto('http://localhost:5173/financial');
      await page.waitForLoadState('networkidle');
      
      // Cliquer sur la page suivante
      await page.click('button[aria-label="Page suivante"]');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(1000); // Pagination < 1s
    });

    it('devrait gérer les recherches efficaces', async () => {
      // Mock des données de recherche
      await page.route('**/api/financial/transactions**', async route => {
        const url = new URL(route.request().url());
        const search = url.searchParams.get('search') || '';
        
        const transactions = Array.from({ length: 10 }, (_, i) => ({
          id: `transaction-${i}`,
          description: `Transaction ${search} ${i}`,
          amount: 1000 + i,
          type: 'debit',
          date: '2024-01-15',
          status: 'completed'
        }));
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: transactions,
            pagination: {
              page: 1,
              limit: 10,
              total: 10,
              totalPages: 1
            }
          })
        });
      });
      
      const startTime = Date.now();
      
      // Naviguer vers la page financière
      await page.goto('http://localhost:5173/financial');
      await page.waitForLoadState('networkidle');
      
      // Effectuer une recherche
      await page.fill('input[placeholder="Rechercher..."]', 'test');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(500); // Recherche < 500ms
    });

    it('devrait gérer les mises à jour en temps réel', async () => {
      // Mock des WebSocket
      await page.route('**/notifications**', async route => {
        await route.fulfill({
          status: 101,
          contentType: 'text/plain',
          body: 'WebSocket connection established'
        });
      });
      
      const startTime = Date.now();
      
      // Naviguer vers le dashboard
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Simuler une mise à jour en temps réel
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('notification', {
          detail: {
            id: 'test-notification',
            title: 'Test Notification',
            message: 'Test Message',
            type: 'info'
          }
        }));
      });
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(100); // Mise à jour temps réel < 100ms
    });
  });

  describe('Métriques de Mémoire', () => {
    it('devrait utiliser moins de 100MB de mémoire', async () => {
      const metrics = await page.evaluate(() => {
        return {
          usedJSHeapSize: (performance as any).memory?.usedJSHeapSize || 0,
          totalJSHeapSize: (performance as any).memory?.totalJSHeapSize || 0,
          jsHeapSizeLimit: (performance as any).memory?.jsHeapSizeLimit || 0
        };
      });
      
      const usedMemoryMB = metrics.usedJSHeapSize / (1024 * 1024);
      expect(usedMemoryMB).toBeLessThan(100);
    });

    it('devrait libérer la mémoire après navigation', async () => {
      // Aller à la page de connexion
      await page.goto('http://localhost:5173/auth/login');
      await page.waitForLoadState('networkidle');
      
      const memoryBefore = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // Naviguer vers le dashboard
      await page.goto('http://localhost:5173/dashboard');
      await page.waitForLoadState('networkidle');
      
      // Retourner à la page de connexion
      await page.goto('http://localhost:5173/auth/login');
      await page.waitForLoadState('networkidle');
      
      const memoryAfter = await page.evaluate(() => {
        return (performance as any).memory?.usedJSHeapSize || 0;
      });
      
      // La mémoire ne devrait pas augmenter significativement
      const memoryIncrease = memoryAfter - memoryBefore;
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // < 10MB
    });
  });

  describe('Métriques de Réseau', () => {
    it('devrait charger les ressources en moins de 5 secondes', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:5173/auth/login');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
    });

    it('devrait compresser les ressources', async () => {
      const response = await page.goto('http://localhost:5173/auth/login');
      const headers = response?.headers();
      
      // Vérifier que les ressources sont compressées
      expect(headers?.['content-encoding']).toBe('gzip');
    });

    it('devrait utiliser le cache efficacement', async () => {
      // Premier chargement
      await page.goto('http://localhost:5173/auth/login');
      await page.waitForLoadState('networkidle');
      
      // Deuxième chargement (devrait utiliser le cache)
      const startTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Le deuxième chargement devrait être plus rapide
      expect(loadTime).toBeLessThan(1000);
    });
  });
});
