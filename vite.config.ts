import { defineConfig } from 'vite';

import { getViteSafeRoot } from './build/safe-vite-root';

const root = getViteSafeRoot();

export default defineConfig({
  root,
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    target: 'es2022',
    assetsInlineLimit: 4_096,
    cssCodeSplit: true,
    sourcemap: true,
  },
  server: {
    host: true,
    fs: {
      allow: [root],
    },
  },
  preview: {
    host: true,
  },
});
