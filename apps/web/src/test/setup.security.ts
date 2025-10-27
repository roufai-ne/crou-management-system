/**
 * FICHIER: apps\web\src\test\setup.security.ts
 * SETUP: Configuration des tests de sécurité
 * 
 * DESCRIPTION:
 * Configuration pour les tests de sécurité
 * Mocks et utilitaires pour les tests de vulnérabilités
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { beforeAll, beforeEach, afterEach, afterAll } from '@jest/globals';

// Configuration des tests de sécurité
beforeAll(async () => {
  console.log('Configuration des tests de sécurité...');
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
  console.log('Tests de sécurité terminés');
});

// Utilitaires pour les tests de sécurité
export const securityUtils = {
  // Générer des données malveillantes
  generateMaliciousInput: () => ({
    xss: '<script>alert("XSS")</script>',
    sqlInjection: "'; DROP TABLE users; --",
    pathTraversal: '../../../etc/passwd',
    commandInjection: '; rm -rf /',
    htmlInjection: '<img src="x" onerror="alert(1)">',
    cssInjection: 'body { background: url("javascript:alert(1)") }',
    jsonInjection: '{"malicious": "data"}',
    xmlInjection: '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>',
    ldapInjection: '*)(uid=*))(|(uid=*',
    nosqlInjection: '{"$where": "this.password.match(/.*/)"}'
  }),

  // Vérifier les en-têtes de sécurité
  checkSecurityHeaders: (headers: Record<string, string>) => {
    const requiredHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'strict-transport-security',
      'content-security-policy'
    ];
    
    const missingHeaders = requiredHeaders.filter(header => !headers[header]);
    return {
      hasAllHeaders: missingHeaders.length === 0,
      missingHeaders
    };
  },

  // Vérifier la validation des entrées
  checkInputValidation: (input: string, expectedError: string) => {
    // Vérifier que l'entrée est rejetée
    return input.includes(expectedError);
  },

  // Vérifier l'échappement des caractères
  checkCharacterEscaping: (input: string) => {
    const dangerousChars = ['<', '>', '"', "'", '&', ';', '(', ')'];
    const escapedChars = ['&lt;', '&gt;', '&quot;', '&#x27;', '&amp;', '&#x3B;', '&#x28;', '&#x29;'];
    
    let isEscaped = true;
    for (let i = 0; i < dangerousChars.length; i++) {
      if (input.includes(dangerousChars[i]) && !input.includes(escapedChars[i])) {
        isEscaped = false;
        break;
      }
    }
    
    return isEscaped;
  },

  // Vérifier la longueur des entrées
  checkInputLength: (input: string, maxLength: number) => {
    return input.length <= maxLength;
  },

  // Vérifier les tokens CSRF
  checkCSRFToken: (form: any) => {
    return form.querySelector('input[name="_csrf"]') !== null;
  },

  // Vérifier l'authentification
  checkAuthentication: (response: any) => {
    return response.status === 401 || response.status === 403;
  },

  // Vérifier l'autorisation
  checkAuthorization: (response: any) => {
    return response.status === 403;
  },

  // Vérifier la validation des tokens JWT
  checkJWTValidation: (token: string) => {
    // Vérifier que le token est valide
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return false;
      
      const header = JSON.parse(atob(parts[0]));
      const payload = JSON.parse(atob(parts[1]));
      
      // Vérifier que le token n'est pas expiré
      if (payload.exp && payload.exp < Date.now() / 1000) return false;
      
      return true;
    } catch (error) {
      return false;
    }
  },

  // Vérifier la validation des mots de passe
  checkPasswordValidation: (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
      minLength: password.length >= minLength,
      hasUpperCase,
      hasLowerCase,
      hasNumbers,
      hasSpecialChar
    };
  },

  // Vérifier la validation des emails
  checkEmailValidation: (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Vérifier la validation des URLs
  checkURLValidation: (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  },

  // Vérifier la validation des nombres
  checkNumberValidation: (number: any) => {
    return typeof number === 'number' && !isNaN(number) && isFinite(number);
  },

  // Vérifier la validation des dates
  checkDateValidation: (date: any) => {
    const dateObj = new Date(date);
    return dateObj instanceof Date && !isNaN(dateObj.getTime());
  },

  // Vérifier la validation des UUIDs
  checkUUIDValidation: (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }
};
