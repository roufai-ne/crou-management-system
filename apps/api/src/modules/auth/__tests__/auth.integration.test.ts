/**
 * FICHIER: apps\api\src\modules\auth\__tests__\auth.integration.test.ts
 * TESTS: Tests d'intégration pour l'authentification
 * 
 * DESCRIPTION:
 * Tests d'intégration pour le module d'authentification
 * Validation des endpoints et de la base de données
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import { AppDataSource } from '../../../config/database';
import { app } from '../../../main';
import { testUtils } from '../../../test/setup.integration';
import bcrypt from 'bcrypt';

describe('Auth Integration Tests', () => {
  let testUser: any;
  let testTenant: any;

  beforeAll(async () => {
    // Créer un tenant de test
    testTenant = await testUtils.createTestTenant({
      id: 'auth-test-tenant',
      name: 'Auth Test Tenant',
      code: 'AUTH-TEST'
    });

    // Créer un utilisateur de test
    testUser = await testUtils.createTestUser({
      id: 'auth-test-user',
      email: 'auth-test@crou.niger',
      password: await bcrypt.hash('password123', 10),
      name: 'Auth Test User',
      role: 'admin',
      tenantId: testTenant.id
    });
  });

  beforeEach(async () => {
    // Nettoyer les données avant chaque test
    await testUtils.cleanTable('audit_logs');
  });

  afterAll(async () => {
    // Nettoyer les données de test
    await testUtils.cleanTable('audit_logs');
    await testUtils.cleanTable('users');
    await testUtils.cleanTable('tenants');
  });

  describe('POST /api/auth/login', () => {
    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@crou.niger',
          password: 'password123'
        })
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      expect(response.body).toHaveProperty('expiresIn');
      
      expect(response.body.user.email).toBe('auth-test@crou.niger');
      expect(response.body.user.name).toBe('Auth Test User');
      expect(response.body.user.role).toBe('admin');
    });

    it('devrait rejeter un utilisateur avec des identifiants invalides', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@crou.niger',
          password: 'wrongpassword'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Identifiants invalides');
    });

    it('devrait rejeter un utilisateur inexistant', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@crou.niger',
          password: 'password123'
        })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Identifiants invalides');
    });

    it('devrait valider les données d\'entrée', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid-email',
          password: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('validation');
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Obtenir un refresh token valide
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@crou.niger',
          password: 'password123'
        });

      refreshToken = loginResponse.body.refreshToken;
    });

    it('devrait renouveler un token d\'accès avec un refresh token valide', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('devrait rejeter un refresh token invalide', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Refresh token invalide');
    });

    it('devrait rejeter un refresh token manquant', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Refresh token requis');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Obtenir un token d'accès valide
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@crou.niger',
          password: 'password123'
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('devrait déconnecter un utilisateur avec un token valide', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('Déconnexion réussie');
    });

    it('devrait rejeter une déconnexion sans token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Token d\'accès requis');
    });

    it('devrait rejeter une déconnexion avec un token invalide', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Token invalide');
    });
  });

  describe('GET /api/auth/profile', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Obtenir un token d'accès valide
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@crou.niger',
          password: 'password123'
        });

      accessToken = loginResponse.body.accessToken;
    });

    it('devrait retourner le profil de l\'utilisateur connecté', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('auth-test@crou.niger');
      expect(response.body.user.name).toBe('Auth Test User');
      expect(response.body.user.role).toBe('admin');
      expect(response.body.user.tenantId).toBe(testTenant.id);
    });

    it('devrait rejeter une requête sans token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Token d\'accès requis');
    });

    it('devrait rejeter une requête avec un token invalide', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Token invalide');
    });
  });

  describe('Audit Logs', () => {
    it('devrait enregistrer les tentatives de connexion', async () => {
      // Tentative de connexion réussie
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@crou.niger',
          password: 'password123'
        })
        .expect(200);

      // Vérifier que l'audit log a été créé
      const auditLogs = await testUtils.executeQuery(
        'SELECT * FROM audit_logs WHERE action = $1 AND user_id = $2',
        ['login', testUser.id]
      );

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('login');
      expect(auditLogs[0].user_id).toBe(testUser.id);
    });

    it('devrait enregistrer les tentatives de connexion échouées', async () => {
      // Tentative de connexion échouée
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'auth-test@crou.niger',
          password: 'wrongpassword'
        })
        .expect(401);

      // Vérifier que l'audit log a été créé
      const auditLogs = await testUtils.executeQuery(
        'SELECT * FROM audit_logs WHERE action = $1 AND user_id = $2',
        ['login_failed', testUser.id]
      );

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].action).toBe('login_failed');
      expect(auditLogs[0].user_id).toBe(testUser.id);
    });
  });

  describe('Sécurité', () => {
    it('devrait limiter le taux de requêtes', async () => {
      // Faire plusieurs requêtes rapides
      const promises = Array(10).fill(0).map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'auth-test@crou.niger',
            password: 'wrongpassword'
          })
      );

      const responses = await Promise.all(promises);
      
      // Au moins une requête devrait être limitée
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('devrait valider les en-têtes de sécurité', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      // Vérifier les en-têtes de sécurité
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });
});
