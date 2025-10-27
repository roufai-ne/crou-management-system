/**
 * FICHIER: apps\web\jest.config.js
 * CONFIGURATION: Jest - Configuration des tests unitaires
 * 
 * DESCRIPTION:
 * Configuration Jest pour les tests unitaires frontend
 * Tests avec mocks et composants isolés
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

module.exports = {
  displayName: 'Web Unit Tests',
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.test.{js,ts,tsx}',
    '!src/**/*.spec.{js,ts,tsx}'
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
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
