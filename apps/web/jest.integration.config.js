/**
 * FICHIER: apps\web\jest.integration.config.js
 * CONFIGURATION: Jest - Configuration des tests d'intégration
 * 
 * DESCRIPTION:
 * Configuration Jest pour les tests d'intégration frontend
 * Tests avec API et services réels
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

module.exports = {
  displayName: 'Web Integration Tests',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.integration.test.js', '**/__tests__/**/*.integration.test.ts', '**/__tests__/**/*.integration.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.integration.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.test.{js,ts,tsx}',
    '!src/**/*.spec.{js,ts,tsx}'
  ],
  coverageDirectory: 'coverage/integration',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@ui/(.*)$': '<rootDir>/../../packages/ui/src/$1',
    '^@shared/(.*)$': '<rootDir>/../../packages/shared/src/$1',
    '^@database/(.*)$': '<rootDir>/../../packages/database/src/$1'
  },
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testEnvironmentOptions: {
    NODE_ENV: 'test'
  }
};
