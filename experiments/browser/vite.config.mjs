import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../../node_modules/.vite-browser', import.meta.url)),
  plugins: [vue()],
  build: { outDir: fileURLToPath(new URL('./dist', import.meta.url)), emptyOutDir: true },
});
