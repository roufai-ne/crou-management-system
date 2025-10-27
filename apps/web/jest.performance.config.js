/**
 * FICHIER: apps\web\jest.performance.config.js
 * CONFIGURATION: Jest - Configuration des tests de performance
 * 
 * DESCRIPTION:
 * Configuration Jest pour les tests de performance
 * Tests de charge et de performance
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

module.exports = {
  displayName: 'Performance Tests',
  testEnvironment: 'node',
  testMatch: ['**/test/performance/**/*.test.js', '**/test/performance/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.performance.ts'],
  collectCoverageFrom: [
    'src/**/*.{js,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
    '!src/**/*.test.{js,ts,tsx}',
    '!src/**/*.spec.{js,ts,tsx}'
  ],
  coverageDirectory: 'coverage/performance',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 60000,
  maxWorkers: 1, // Tests de performance séquentiels
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