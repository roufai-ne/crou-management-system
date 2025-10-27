/**
 * FICHIER: apps\web\vitest.config.ts
 * CONFIGURATION: Vitest - Configuration des tests unitaires
 * 
 * DESCRIPTION:
 * Configuration Vitest pour les tests unitaires
 * Support React, TypeScript et coverage
 * 
 * AUTEUR: Équipe CROU
 * DATE: Décembre 2024
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/dist/**',
        '**/.{idea,git,cache,output,temp}/**',
        '**/{karma,rollup,webpack,vite,vitest,jest,playwright,babel,nyc,cypress,tsup,build}.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 10000
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@crou/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@crou/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@crou/database': path.resolve(__dirname, '../../packages/database/src'),
      '@crou/notifications': path.resolve(__dirname, '../../packages/notifications/src'),
      '@crou/reports': path.resolve(__dirname, '../../packages/reports/src')
    }
  }
});
