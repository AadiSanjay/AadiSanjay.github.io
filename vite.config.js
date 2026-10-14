import { defineConfig } from 'vite';

// GitHub Pages serves project sites from /<repo-name>/. Set by the deploy workflow.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
});
