import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['site/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['site/js/**'],
      exclude: ['site/**/*.test.js'],
      reporter: ['text', 'json-summary'],
      reportsDirectory: 'coverage',
    },
  },
});
