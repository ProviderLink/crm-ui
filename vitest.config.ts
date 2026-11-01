import path from 'path';
import { defineConfig } from 'vitest/config';

// Kept apart from vite.config.ts so the production build never loads test setup.
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    restoreMocks: true,
    setupFiles: ['src/test/setup.ts'],
  },
});
