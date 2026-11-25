import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  cacheDir: fileURLToPath(new URL('../../node_modules/.vite-angular', import.meta.url)),
  plugins: [angular({ tsconfig: fileURLToPath(new URL('./tsconfig.json', import.meta.url)) })],
  server: { port: 5175, strictPort: true, host: true },
});
