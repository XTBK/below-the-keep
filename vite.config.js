import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // relative paths, so the built game works from any folder or host
  server: { open: false },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1000,
    // three.js in its own file: it never changes between updates, so players' browsers keep it cached
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined) } },
  },
});
