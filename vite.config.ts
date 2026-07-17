import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import pkg from './package.json';

/** 默认 HTTPS（手机同网测摄像头）。关：VITE_HTTPS=0 npm run dev */
const useHttps = process.env.VITE_HTTPS !== '0';

export default defineConfig({
  appType: 'spa',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: useHttps ? [basicSsl()] : [],
  server: {
    host: true,
    https: useHttps,
  },
  preview: {
    host: true,
    https: useHttps,
  },
  worker: {
    format: 'es',
  },
});
