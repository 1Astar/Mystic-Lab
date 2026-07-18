import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import pkg from './package.json';

/** 本地默认 HTTP，避免自签证书导致浏览器白屏。手机测摄像头：npm run dev:https */
const useHttps = process.env.VITE_HTTPS === '1';

export default defineConfig({
  appType: 'spa',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: useHttps ? [basicSsl()] : [],
  server: {
    host: true,
    https: useHttps,
    // 避免编辑器/agent 写文件未完成时 Vite 抢先热更 → 白屏
    watch: {
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 80,
      },
    },
  },
  preview: {
    host: true,
    https: useHttps,
  },
  worker: {
    format: 'es',
  },
});
