import { defineConfig } from 'vite';
import { execSync } from 'child_process';

// a short build stamp for the title screen, so anyone can tell which version they're running
const commit = (() => {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
})();
const BUILD = `${commit} ${new Date().toISOString().slice(0, 10)}`;

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD) },
  base: './', // relative paths, so the built game works from any folder or host
  server: { open: false },
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1000,
    // three.js in its own file: it never changes between updates, so players' browsers keep it cached
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined) } },
  },
});
