import { defineConfig } from 'vitest/config';

import { getViteSafeRoot } from './build/safe-vite-root';

const root = getViteSafeRoot();

export default defineConfig({
  root,
  resolve: {
    preserveSymlinks: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: false,
  },
});
