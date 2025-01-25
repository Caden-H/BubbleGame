import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    target: 'esnext', // Target modern browsers with ESNext support
    outDir: 'dist', // Output directory for production build
  },
});