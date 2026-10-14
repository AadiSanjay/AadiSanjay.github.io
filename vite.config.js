import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// GitHub Pages serves project sites from /<repo-name>/. Set by the deploy workflow.
// two pages: the keyboard (index.html) and about.html
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about.html'),
      },
    },
  },
});
