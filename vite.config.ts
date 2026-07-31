import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import pkg from './package.json';

/** 本地默认 HTTP，避免自签证书导致浏览器白屏。手机测摄像头：npm run dev:https */
const useHttps = process.env.VITE_HTTPS === '1';

/** 本地把 /api/mystic 转到上游（与 Cloudflare Function 同语义） */
function mysticAiDevProxy(env: Record<string, string>): Plugin {
  return {
    name: 'mystic-ai-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/mystic/chat/completions', (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
          res.end();
          return;
        }
        if (req.method !== 'POST') {
          next();
          return;
        }

        const upstreamBase = (env.MYSTIC_UPSTREAM_URL || '').replace(/\/$/, '');
        const upstreamKey = (env.MYSTIC_UPSTREAM_KEY || '').trim();
        const upstreamModel = (env.MYSTIC_UPSTREAM_MODEL || 'deepseek-chat').trim();
        const proxySecret = (env.MYSTIC_PROXY_SECRET || '').trim();

        if (!upstreamBase || !upstreamKey) {
          res.statusCode = 503;
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(
            JSON.stringify({
              error: {
                message:
                  '本地未配置 MYSTIC_UPSTREAM_URL / MYSTIC_UPSTREAM_KEY（写在 .env.local）',
              },
            }),
          );
          return;
        }

        if (proxySecret) {
          const auth = req.headers.authorization || '';
          const token = auth.replace(/^Bearer\s+/i, '').trim();
          if (token !== proxySecret) {
            res.statusCode = 401;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({ error: { message: 'Unauthorized' } }));
            return;
          }
        }

        const chunks: Buffer[] = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
          void (async () => {
            try {
              const raw = Buffer.concat(chunks).toString('utf8');
              const body = JSON.parse(raw || '{}') as {
                model?: string;
                temperature?: number;
                messages?: unknown;
              };
              if (!Array.isArray(body.messages) || body.messages.length === 0) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json; charset=utf-8');
                res.end(JSON.stringify({ error: { message: 'messages required' } }));
                return;
              }
              const model =
                !body.model || body.model === 'mystic-default'
                  ? upstreamModel
                  : body.model;
              const upstream = await fetch(`${upstreamBase}/chat/completions`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${upstreamKey}`,
                },
                body: JSON.stringify({
                  model,
                  temperature: body.temperature ?? 0.55,
                  messages: body.messages,
                }),
              });
              const text = await upstream.text();
              res.statusCode = upstream.status;
              res.setHeader(
                'Content-Type',
                upstream.headers.get('Content-Type') ||
                  'application/json; charset=utf-8',
              );
              res.end(text);
            } catch (err) {
              res.statusCode = 502;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(
                JSON.stringify({
                  error: {
                    message: err instanceof Error ? err.message : 'Upstream failed',
                  },
                }),
              );
            }
          })();
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    appType: 'spa',
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
    },
    plugins: [
      ...(useHttps ? [basicSsl()] : []),
      mysticAiDevProxy(env),
    ],
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
  };
});
