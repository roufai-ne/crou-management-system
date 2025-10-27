/**
 * FICHIER: apps\web\src\test\e2e\dashboard.spec.ts
 * TESTS: Tests E2E pour le dashboard
 * 
 * DESCRIPTION:
 * Tests E2E pour le module dashboard
 * Validation du tableau de bord et des KPIs
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
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
        })
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
              financial: {
                budgetUtilization: 75,
                pendingApprovals: 5,
                monthlyExpenses: 500000
              },
              stocks: {
                lowStockItems: 10,
                totalItems: 500,
                monthlyMovements: 100
              },
              housing: {
                occupancyRate: 85,
                availableRooms: 150,
                maintenanceRequests: 8
              },
              transport: {
                activeVehicles: 45,
                maintenanceDue: 3,
                monthlyFuelCost: 25000
              }
            },
            recentActivities: [
              {
                id: '1',
                type: 'budget_created',
                description: 'Nouveau budget créé',
                timestamp: '2024-01-15T10:00:00Z',
                user: 'Test User'
              },
              {
                id: '2',
                type: 'transaction_approved',
                description: 'Transaction approuvée',
                timestamp: '2024-01-15T09:30:00Z',
                user: 'Test User'
              }
            ],
            alerts: [
              {
                id: '1',
                type: 'warning',
                title: 'Budget dépassé',
                message: 'Le budget du trimestre 1 est dépassé de 10%',
                priority: 'high'
              }
            ]
          }
        })
      });
    });

    // Se connecter et aller au dashboard
    await page.goto('/auth/login');
    await page.fill('input[type="email"]', 'test@crou.niger');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('devrait afficher le tableau de bord principal', async ({ page }) => {
    // Vérifier que le dashboard est affiché
    await expect(page).toHaveTitle(/CROU - Tableau de Bord/);
    await expect(page.locator('h1')).toContainText('Tableau de Bord');
    
    // Vérifier que les KPIs globaux sont affichés
    await expect(page.locator('text=Budget Total')).toBeVisible();
    await expect(page.locator('text=10,000,000 FCFA')).toBeVisible();
    await expect(page.locator('text=Étudiants')).toBeVisible();
    await expect(page.locator('text=5,000')).toBeVisible();
  });

  test('devrait afficher les KPIs des modules', async ({ page }) => {
    // Vérifier les KPIs financiers
    await expect(page.locator('text=Module Financier')).toBeVisible();
    await expect(page.locator('text=75%')).toBeVisible();
    await expect(page.locator('text=5')).toBeVisible();
    
    // Vérifier les KPIs des stocks
    await expect(page.locator('text=Module Stocks')).toBeVisible();
    await expect(page.locator('text=10')).toBeVisible();
    await expect(page.locator('text=500')).toBeVisible();
    
    // Vérifier les KPIs du logement
    await expect(page.locator('text=Module Logement')).toBeVisible();
    await expect(page.locator('text=85%')).toBeVisible();
    await expect(page.locator('text=150')).toBeVisible();
    
    // Vérifier les KPIs du transport
    await expect(page.locator('text=Module Transport')).toBeVisible();
    await expect(page.locator('text=45')).toBeVisible();
    await expect(page.locator('text=3')).toBeVisible();
  });

  test('devrait afficher les activités récentes', async ({ page }) => {
    // Vérifier que la section des activités récentes est visible
    await expect(page.locator('text=Activités Récentes')).toBeVisible();
    
    // Vérifier que les activités sont affichées
    await expect(page.locator('text=Nouveau budget créé')).toBeVisible();
    await expect(page.locator('text=Transaction approuvée')).toBeVisible();
  });

  test('devrait afficher les alertes', async ({ page }) => {
    // Vérifier que la section des alertes est visible
    await expect(page.locator('text=Alertes')).toBeVisible();
    
    // Vérifier que l'alerte est affichée
    await expect(page.locator('text=Budget dépassé')).toBeVisible();
    await expect(page.locator('text=Le budget du trimestre 1 est dépassé de 10%')).toBeVisible();
  });

  test('devrait permettre la navigation vers les modules', async ({ page }) => {
    // Cliquer sur le module financier
    await page.click('text=Module Financier');
    await expect(page).toHaveURL('/financial');
    
    // Retourner au dashboard
    await page.goto('/dashboard');
    
    // Cliquer sur le module stocks
    await page.click('text=Module Stocks');
    await expect(page).toHaveURL('/stocks');
  });

  test('devrait afficher les graphiques', async ({ page }) => {
    // Vérifier que les graphiques sont présents
    await expect(page.locator('canvas')).toBeVisible();
    
    // Vérifier que les graphiques ont des données
    const charts = page.locator('canvas');
    await expect(charts).toHaveCount(2); // Graphique des dépenses et des tendances
  });

  test('devrait permettre le filtrage par période', async ({ page }) => {
    // Vérifier que les filtres de période sont présents
    await expect(page.locator('select[name="period"]')).toBeVisible();
    
    // Changer la période
    await page.selectOption('select[name="period"]', 'month');
    
    // Vérifier que les données sont mises à jour
    await expect(page.locator('text=Données mises à jour')).toBeVisible();
  });

  test('devrait permettre l\'export des données', async ({ page }) => {
    // Cliquer sur le bouton d'export
    await page.click('button[aria-label="Exporter les données"]');
    
    // Vérifier que le menu d'export est affiché
    await expect(page.locator('text=Exporter en Excel')).toBeVisible();
    await expect(page.locator('text=Exporter en PDF')).toBeVisible();
  });

  test('devrait être responsive sur mobile', async ({ page }) => {
    // Définir la taille d'écran mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Vérifier que le dashboard est responsive
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Budget Total')).toBeVisible();
    
    // Vérifier que les cartes sont empilées verticalement
    const cards = page.locator('[data-testid="kpi-card"]');
    await expect(cards).toHaveCount(4);
  });

  test('devrait être accessible', async ({ page }) => {
    // Vérifier les attributs d'accessibilité
    await expect(page.locator('h1')).toHaveAttribute('role', 'heading');
    await expect(page.locator('button[aria-label="Exporter les données"]')).toBeVisible();
    
    // Vérifier que les graphiques ont des descriptions
    await expect(page.locator('canvas[aria-label]')).toBeVisible();
    
    // Vérifier que les cartes ont des rôles appropriés
    await expect(page.locator('[role="region"]')).toBeVisible();
  });

  test('devrait gérer les erreurs de chargement', async ({ page }) => {
    // Mock d'une erreur API
    await page.route('**/api/dashboard', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Erreur serveur' })
      });
    });
    
    // Recharger la page
    await page.reload();
    
    // Vérifier que le message d'erreur est affiché
    await expect(page.locator('text=Erreur de chargement des données')).toBeVisible();
  });

  test('devrait permettre le rafraîchissement des données', async ({ page }) => {
    // Cliquer sur le bouton de rafraîchissement
    await page.click('button[aria-label="Rafraîchir les données"]');
    
    // Vérifier que les données sont rechargées
    await expect(page.locator('text=Données mises à jour')).toBeVisible();
  });

  test('devrait afficher les notifications', async ({ page }) => {
    // Vérifier que l'icône de notification est présente
    await expect(page.locator('button[aria-label="Notifications"]')).toBeVisible();
    
    // Cliquer sur les notifications
    await page.click('button[aria-label="Notifications"]');
    
    // Vérifier que le panneau de notifications s'ouvre
    await expect(page.locator('text=Centre de Notifications')).toBeVisible();
  });
});
