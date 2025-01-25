import { defineConfig } from 'vite';

export default defineConfig({
  // base: './', // Ensures assets are referenced relatively
  build: {
    target: 'esnext', // Target modern browsers with ESNext support
    outDir: 'dist',
  },
});