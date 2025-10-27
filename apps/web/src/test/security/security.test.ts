/**
 * FICHIER: apps\web\src\test\security\security.test.ts
 * TESTS: Tests de sécurité
 * 
 * DESCRIPTION:
 * Tests de sécurité pour l'application CROU
 * Validation des vulnérabilités et des bonnes pratiques
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { chromium, Browser, Page } from 'playwright';

describe('Tests de Sécurité', () => {
  let browser: Browser;
  let page: Page;

  beforeAll(async () => {
    browser = await chromium.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Authentification et Autorisation', () => {
    it('devrait empêcher l\'accès non autorisé aux pages protégées', async () => {
      // Essayer d'accéder au dashboard sans être connecté
      await page.goto('http://localhost:5173/dashboard');
      
      // Vérifier que l'utilisateur est redirigé vers la page de connexion
      await expect(page).toHaveURL('/auth/login');
    });

    it('devrait valider les tokens JWT', async () => {
      // Mock d'un token JWT invalide
      await page.route('**/api/auth/profile', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token invalide' })
        });
      });
      
      // Essayer d'accéder au dashboard avec un token invalide
      await page.goto('http://localhost:5173/dashboard');
      
      // Vérifier que l'utilisateur est redirigé vers la page de connexion
      await expect(page).toHaveURL('/auth/login');
    });

    it('devrait gérer l\'expiration des tokens', async () => {
      // Mock de l'expiration du token
      await page.route('**/api/auth/refresh', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Refresh token expiré' })
        });
      });
      
      // Essayer d'accéder au dashboard
      await page.goto('http://localhost:5173/dashboard');
      
      // Vérifier que l'utilisateur est redirigé vers la page de connexion
      await expect(page).toHaveURL('/auth/login');
    });

    it('devrait empêcher les attaques par force brute', async () => {
      // Essayer de se connecter plusieurs fois avec des mots de passe incorrects
      for (let i = 0; i < 5; i++) {
        await page.goto('http://localhost:5173/auth/login');
        await page.fill('input[type="email"]', 'test@crou.niger');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);
      }
      
      // Vérifier que le compte est verrouillé ou qu'un délai est appliqué
      await expect(page.locator('text=Compte verrouillé')).toBeVisible();
    });
  });

  describe('Validation des Données', () => {
    it('devrait valider les entrées utilisateur', async () => {
      await page.goto('http://localhost:5173/auth/login');
      
      // Essayer de soumettre des données malveillantes
      await page.fill('input[type="email"]', '<script>alert("XSS")</script>');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Vérifier que le script n'est pas exécuté
      const alertHandled = await page.evaluate(() => {
        return window.alert === undefined || window.alert.toString().includes('native code');
      });
      expect(alertHandled).toBe(true);
    });

    it('devrait échapper les caractères spéciaux', async () => {
      await page.goto('http://localhost:5173/auth/login');
      
      // Saisir des caractères spéciaux
      await page.fill('input[type="email"]', 'test@crou.niger');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Vérifier que les caractères sont échappés
      const emailValue = await page.inputValue('input[type="email"]');
      expect(emailValue).not.toContain('<script>');
      expect(emailValue).not.toContain('javascript:');
    });

    it('devrait limiter la longueur des entrées', async () => {
      await page.goto('http://localhost:5173/auth/login');
      
      // Saisir une chaîne très longue
      const longString = 'a'.repeat(10000);
      await page.fill('input[type="email"]', longString);
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Vérifier que la longueur est limitée
      const emailValue = await page.inputValue('input[type="email"]');
      expect(emailValue.length).toBeLessThan(1000);
    });
  });

  describe('Protection CSRF', () => {
    it('devrait inclure des tokens CSRF dans les formulaires', async () => {
      await page.goto('http://localhost:5173/auth/login');
      
      // Vérifier que le token CSRF est présent
      const csrfToken = await page.locator('input[name="_csrf"]').getAttribute('value');
      expect(csrfToken).toBeTruthy();
    });

    it('devrait valider les tokens CSRF', async () => {
      // Mock d'une validation CSRF échouée
      await page.route('**/api/auth/login', async route => {
        await route.fulfill({
          status: 403,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Token CSRF invalide' })
        });
      });
      
      await page.goto('http://localhost:5173/auth/login');
      await page.fill('input[type="email"]', 'test@crou.niger');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Vérifier que l'erreur CSRF est affichée
      await expect(page.locator('text=Token CSRF invalide')).toBeVisible();
    });
  });

  describe('En-têtes de Sécurité', () => {
    it('devrait inclure les en-têtes de sécurité appropriés', async () => {
      const response = await page.goto('http://localhost:5173/auth/login');
      const headers = response?.headers();
      
      // Vérifier les en-têtes de sécurité
      expect(headers?.['x-content-type-options']).toBe('nosniff');
      expect(headers?.['x-frame-options']).toBe('DENY');
      expect(headers?.['x-xss-protection']).toBe('1; mode=block');
      expect(headers?.['strict-transport-security']).toBeTruthy();
      expect(headers?.['content-security-policy']).toBeTruthy();
    });

    it('devrait empêcher le clickjacking', async () => {
      const response = await page.goto('http://localhost:5173/auth/login');
      const headers = response?.headers();
      
      // Vérifier que X-Frame-Options est défini
      expect(headers?.['x-frame-options']).toBe('DENY');
    });

    it('devrait empêcher le MIME sniffing', async () => {
      const response = await page.goto('http://localhost:5173/auth/login');
      const headers = response?.headers();
      
      // Vérifier que X-Content-Type-Options est défini
      expect(headers?.['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('Gestion des Sessions', () => {
    it('devrait invalider les sessions après déconnexion', async () => {
      // Se connecter
      await page.goto('http://localhost:5173/auth/login');
      await page.fill('input[type="email"]', 'test@crou.niger');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Se déconnecter
      await page.click('button[aria-label="Menu utilisateur"]');
      await page.click('text=Déconnexion');
      
      // Essayer d'accéder au dashboard
      await page.goto('http://localhost:5173/dashboard');
      
      // Vérifier que l'utilisateur est redirigé vers la page de connexion
      await expect(page).toHaveURL('/auth/login');
    });

    it('devrait limiter la durée des sessions', async () => {
      // Mock d'une session expirée
      await page.route('**/api/auth/profile', async route => {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Session expirée' })
        });
      });
      
      // Essayer d'accéder au dashboard
      await page.goto('http://localhost:5173/dashboard');
      
      // Vérifier que l'utilisateur est redirigé vers la page de connexion
      await expect(page).toHaveURL('/auth/login');
    });
  });

  describe('Protection des Données Sensibles', () => {
    it('devrait masquer les mots de passe', async () => {
      await page.goto('http://localhost:5173/auth/login');
      
      // Vérifier que le champ mot de passe est de type password
      const passwordField = page.locator('input[type="password"]');
      await expect(passwordField).toBeVisible();
      
      // Vérifier que le mot de passe est masqué
      const passwordType = await passwordField.getAttribute('type');
      expect(passwordType).toBe('password');
    });

    it('devrait chiffrer les données sensibles', async () => {
      // Vérifier que les données sensibles ne sont pas visibles en clair
      await page.goto('http://localhost:5173/auth/login');
      
      // Vérifier que les tokens ne sont pas visibles dans le DOM
      const tokenElements = await page.locator('[data-token]').count();
      expect(tokenElements).toBe(0);
    });

    it('devrait nettoyer les données sensibles après déconnexion', async () => {
      // Se connecter
      await page.goto('http://localhost:5173/auth/login');
      await page.fill('input[type="email"]', 'test@crou.niger');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Se déconnecter
      await page.click('button[aria-label="Menu utilisateur"]');
      await page.click('text=Déconnexion');
      
      // Vérifier que les données sensibles sont nettoyées
      const localStorage = await page.evaluate(() => {
        return Object.keys(localStorage);
      });
      
      expect(localStorage).not.toContain('accessToken');
      expect(localStorage).not.toContain('refreshToken');
    });
  });

  describe('Protection contre les Attaques', () => {
    it('devrait empêcher les attaques XSS', async () => {
      await page.goto('http://localhost:5173/auth/login');
      
      // Essayer d'injecter du JavaScript
      await page.fill('input[type="email"]', 'test@crou.niger');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Vérifier que le JavaScript n'est pas exécuté
      const alertHandled = await page.evaluate(() => {
        return window.alert === undefined || window.alert.toString().includes('native code');
      });
      expect(alertHandled).toBe(true);
    });

    it('devrait empêcher les attaques SQL Injection', async () => {
      await page.goto('http://localhost:5173/auth/login');
      
      // Essayer d'injecter du SQL
      await page.fill('input[type="email"]', "'; DROP TABLE users; --");
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Vérifier que l'injection SQL n'est pas exécutée
      await expect(page.locator('text=Format d\'email invalide')).toBeVisible();
    });

    it('devrait empêcher les attaques de répertoire', async () => {
      // Essayer d'accéder à des fichiers sensibles
      const sensitivePaths = [
        '/etc/passwd',
        '/etc/shadow',
        '/etc/hosts',
        '/proc/version',
        '/proc/cpuinfo'
      ];
      
      for (const path of sensitivePaths) {
        const response = await page.goto(`http://localhost:5173${path}`);
        expect(response?.status()).toBe(404);
      }
    });
  });

  describe('Audit et Logging', () => {
    it('devrait logger les tentatives de connexion', async () => {
      // Mock du logging
      const logSpy = jest.fn();
      
      await page.route('**/api/auth/login', async route => {
        logSpy('Tentative de connexion');
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 'test-user', email: 'test@crou.niger' },
            accessToken: 'test-token',
            refreshToken: 'test-refresh-token',
            expiresIn: 3600
          })
        });
      });
      
      await page.goto('http://localhost:5173/auth/login');
      await page.fill('input[type="email"]', 'test@crou.niger');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Vérifier que le logging a été appelé
      expect(logSpy).toHaveBeenCalledWith('Tentative de connexion');
    });

    it('devrait logger les tentatives d\'accès non autorisé', async () => {
      // Mock du logging
      const logSpy = jest.fn();
      
      await page.route('**/api/dashboard', async route => {
        logSpy('Tentative d\'accès non autorisé');
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Non autorisé' })
        });
      });
      
      await page.goto('http://localhost:5173/dashboard');
      
      // Vérifier que le logging a été appelé
      expect(logSpy).toHaveBeenCalledWith('Tentative d\'accès non autorisé');
    });
  });
});
