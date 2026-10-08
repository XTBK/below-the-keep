import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths, so the built game works from any folder or host
  server: { open: false },
  build: { target: 'es2022', chunkSizeWarningLimit: 1000 }, // three.js alone is ~600 kB
});
