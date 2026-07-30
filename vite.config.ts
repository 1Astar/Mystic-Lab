import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';
import pkg from './package.json';

/** 开发默认 HTTP；证书自签易导致浏览器报错。需要摄像头等只在本机时：npm run dev:https */
const useHttps = process.env.VITE_HTTPS === '1';

export default defineConfig({
  appType: 'spa',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    ...(useHttps ? [basicSsl()] : []),
  ],
  server: {
    host: true,
    https: useHttps,
    // 避免编辑器/agent 写文件未落盘时 Vite 热更新抢跑 → 空白
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
