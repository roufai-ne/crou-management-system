/**
 * FICHIER: apps\api\jest.integration.config.js
 * CONFIGURATION: Jest - Configuration des tests d'intégration
 * 
 * DESCRIPTION:
 * Configuration Jest pour les tests d'intégration API
 * Tests avec base de données et services réels
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

module.exports = {
  displayName: 'API Integration Tests',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.integration.test.js', '**/__tests__/**/*.integration.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.integration.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  maxWorkers: 1, // Tests d'intégration séquentiels
  globalSetup: '<rootDir>/src/test/global-setup.ts',
  globalTeardown: '<rootDir>/src/test/global-teardown.ts',
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
