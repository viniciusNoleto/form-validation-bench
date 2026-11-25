import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import angular from '@analogjs/vite-plugin-angular';

// Dois projetos: React/Vue (esbuild + plugin Vue) e Angular (compilador do Angular via Analog).
const ANGULAR = ['tests/**/angular-*.test.ts', 'benchmarks/angular/**/*.test.ts', 'experiments/zod/implementation/angular.test.ts', 'experiments/initial/angular/**/*.test.ts'];

export default defineConfig({
  test: {
    projects: [
      {
        plugins: [vue()],
        test: {
          name: 'react-vue',
          environment: 'jsdom',
          include: [
            'tests/**/*.test.{ts,tsx}',
            'benchmarks/**/*.test.{ts,tsx}',
            'experiments/**/*.test.{js,jsx,ts,tsx}',
          ],
          exclude: ['**/node_modules/**', ...ANGULAR],
        },
      },
      {
        plugins: [angular({ tsconfig: fileURLToPath(new URL('./tsconfig.angular.json', import.meta.url)) })],
        test: {
          name: 'angular',
          environment: 'jsdom',
          include: ANGULAR,
          setupFiles: ['tests/setup/angular.ts'],
        },
      },
    ],
  },
});
