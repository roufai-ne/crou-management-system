/**
 * FICHIER: apps\web\src\test\e2e\auth.spec.ts
 * TESTS: Tests E2E pour l'authentification
 * 
 * DESCRIPTION:
 * Tests E2E pour le module d'authentification
 * Validation du flux complet de connexion
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { test, expect } from '@playwright/test';

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page de connexion
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
  });

  test('devrait afficher la page de connexion', async ({ page }) => {
    // Vérifier que la page de connexion est affichée
    await expect(page).toHaveTitle(/CROU - Connexion/);
    await expect(page.locator('h1')).toContainText('Connexion');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('devrait valider les champs requis', async ({ page }) => {
    // Cliquer sur le bouton de connexion sans remplir les champs
    await page.click('button[type="submit"]');
    
    // Vérifier que les messages d'erreur apparaissent
    await expect(page.locator('text=Email requis')).toBeVisible();
    await expect(page.locator('text=Mot de passe requis')).toBeVisible();
  });

  test('devrait valider le format de l\'email', async ({ page }) => {
    // Saisir un email invalide
    await page.fill('input[type="email"]', 'email-invalide');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Vérifier que le message d'erreur apparaît
    await expect(page.locator('text=Format d\'email invalide')).toBeVisible();
  });

  test('devrait afficher une erreur pour des identifiants invalides', async ({ page }) => {
    // Saisir des identifiants invalides
    await page.fill('input[type="email"]', 'test@crou.niger');
    await page.fill('input[type="password"]', 'motdepasseincorrect');
    await page.click('button[type="submit"]');
    
    // Vérifier que le message d'erreur apparaît
    await expect(page.locator('text=Identifiants invalides')).toBeVisible();
  });

  test('devrait se connecter avec des identifiants valides', async ({ page }) => {
    // Mock de la réponse API
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

    // Saisir des identifiants valides
    await page.fill('input[type="email"]', 'test@crou.niger');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Vérifier que l'utilisateur est redirigé vers le dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Tableau de Bord');
  });

  test('devrait afficher le nom de l\'utilisateur connecté', async ({ page }) => {
    // Mock de la réponse API
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

    // Se connecter
    await page.fill('input[type="email"]', 'test@crou.niger');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Vérifier que le nom de l'utilisateur est affiché
    await expect(page.locator('text=Test User')).toBeVisible();
  });

  test('devrait se déconnecter', async ({ page }) => {
    // Mock de la connexion
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

    // Se connecter
    await page.fill('input[type="email"]', 'test@crou.niger');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Attendre d'être sur le dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Cliquer sur le bouton de déconnexion
    await page.click('button[aria-label="Menu utilisateur"]');
    await page.click('text=Déconnexion');
    
    // Vérifier que l'utilisateur est redirigé vers la page de connexion
    await expect(page).toHaveURL('/auth/login');
  });

  test('devrait gérer l\'expiration du token', async ({ page }) => {
    // Mock de la connexion
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

    // Se connecter
    await page.fill('input[type="email"]', 'test@crou.niger');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Attendre d'être sur le dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Mock de l'expiration du token
    await page.route('**/api/**', async route => {
      if (route.request().url().includes('/auth/refresh')) {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token expiré' })
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Non autorisé' })
        });
      }
    });
    
    // Faire une requête qui devrait échouer
    await page.reload();
    
    // Vérifier que l'utilisateur est redirigé vers la page de connexion
    await expect(page).toHaveURL('/auth/login');
  });

  test('devrait afficher les erreurs de réseau', async ({ page }) => {
    // Mock d'une erreur de réseau
    await page.route('**/api/auth/login', async route => {
      await route.abort('failed');
    });

    // Saisir des identifiants
    await page.fill('input[type="email"]', 'test@crou.niger');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Vérifier que le message d'erreur de réseau apparaît
    await expect(page.locator('text=Erreur de connexion')).toBeVisible();
  });

  test('devrait être responsive sur mobile', async ({ page }) => {
    // Définir la taille d'écran mobile
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Vérifier que la page de connexion est responsive
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Vérifier que les éléments sont bien disposés sur mobile
    const form = page.locator('form');
    await expect(form).toHaveCSS('padding', /16px/);
  });

  test('devrait être accessible', async ({ page }) => {
    // Vérifier les attributs d'accessibilité
    await expect(page.locator('input[type="email"]')).toHaveAttribute('aria-label');
    await expect(page.locator('input[type="password"]')).toHaveAttribute('aria-label');
    await expect(page.locator('button[type="submit"]')).toHaveAttribute('aria-label');
    
    // Vérifier que les champs sont focusables
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });
});
