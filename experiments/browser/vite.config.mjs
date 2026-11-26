import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
export default defineConfig({
  root: here('.'),
  cacheDir: here('../../node_modules/.vite-browser'),
  plugins: [vue(), react()],
  // build de produção: sem os avisos e verificações do modo de desenvolvimento do React e do Vue
  define: { 'process.env.NODE_ENV': '"production"' },
  build: { outDir: here('./dist'), emptyOutDir: true, rollupOptions: { input: { index: here('index.html'), time: here('time.html') } } },
});
