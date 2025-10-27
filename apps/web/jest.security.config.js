/**
 * FICHIER: apps\web\jest.security.config.js
 * CONFIGURATION: Jest - Configuration des tests de sécurité
 * 
 * DESCRIPTION:
 * Configuration Jest pour les tests de sécurité
 * Tests de vulnérabilités et de bonnes pratiques
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

module.exports = {
  displayName: 'Security Tests',
  testEnvironment: 'node',
  testMatch: ['**/test/security/**/*.test.js', '**/test/security/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.security.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}'
  ],
  coverageDirectory: 'coverage/security',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  maxWorkers: 1, // Tests de sécurité séquentiels
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
