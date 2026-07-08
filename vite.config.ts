import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import pkg from './package.json';

export default defineConfig({
  appType: 'spa',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [basicSsl()],
  server: {
    host: true,
    https: true,
  },
  preview: {
    host: true,
    https: true,
  },
  worker: {
    format: 'es',
  },
});
