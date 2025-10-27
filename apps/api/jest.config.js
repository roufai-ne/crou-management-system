/**
 * FICHIER: apps\api\jest.config.js
 * CONFIGURATION: Jest - Configuration des tests unitaires
 * 
 * DESCRIPTION:
 * Configuration Jest pour les tests unitaires API
 * Tests avec mocks et services isolés
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

module.exports = {
  displayName: 'API Unit Tests',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.unit.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}'
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 10000,
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
