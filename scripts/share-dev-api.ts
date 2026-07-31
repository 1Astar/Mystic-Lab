import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

type Snap = {
  id: string;
  system: string;
  createdAt: string;
  ownerId: string;
  questionMasked: boolean;
  questionDisplay: string;
  headline: string;
  summary: string;
  sections: { heading: string; body: string }[];
  visual: Record<string, unknown>;
  includeAi: boolean;
  aiText?: string;
  brandSlogan?: string;
};

const DAY_CAP = 3;
const VIEW_MS = 3000;

/** 本地内存版分享 API（与 CF Function 同路径） */
export function shareDevApi(): Plugin {
  const shares = new Map<string, Snap>();
  const claims = new Set<string>();
  const ownerDay = new Map<string, number>();
  const pending = new Map<string, number>();
  const rates = new Map<string, number>();

  const day = () => new Date().toISOString().slice(0, 10);
  const rid = () =>
    `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

  function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      req.on('data', (c) => chunks.push(c));
      req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      req.on('error', reject);
    });
  }

  function send(res: ServerResponse, status: number, data: unknown) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(JSON.stringify(data));
  }

  return {
    name: 'share-dev-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        if (!url.startsWith('/api/share')) {
          next();
          return;
        }
        if (req.method === 'OPTIONS') {
          res.statusCode = 204;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
          res.end();
          return;
        }

        try {
          const pathOnly = url.split('?')[0].replace(/\/$/, '');
          const rest = pathOnly.replace(/^\/api\/share\/?/, '');
          const parts = rest ? rest.split('/') : [];

          if (req.method === 'POST' && parts.length === 0) {
            const body = JSON.parse((await readBody(req)) || '{}') as Partial<Snap>;
            if (!body.ownerId || !body.system || !body.summary) {
              send(res, 400, { error: { message: 'invalid body' } });
              return;
            }
            const id = rid();
            const snap: Snap = {
              id,
              system: String(body.system),
              createdAt: new Date().toISOString(),
              ownerId: String(body.ownerId),
              questionMasked: Boolean(body.questionMasked),
              questionDisplay: String(body.questionDisplay || '').slice(0, 200),
              headline: String(body.headline || '').slice(0, 80),
              summary: String(body.summary || '').slice(0, 400),
              sections: Array.isArray(body.sections) ? body.sections.slice(0, 12) : [],
              visual: body.visual || { kind: 'generic' },
              includeAi: Boolean(body.includeAi),
              aiText: body.includeAi
                ? String(body.aiText || '').slice(0, 8000)
                : undefined,
              brandSlogan: body.brandSlogan
                ? String(body.brandSlogan).slice(0, 80)
                : undefined,
            };
            shares.set(id, snap);
            send(res, 201, snap);
            return;
          }

          if (req.method === 'POST' && parts[0] === 'redeem') {
            const body = JSON.parse((await readBody(req)) || '{}') as {
              ownerId?: string;
            };
            const ownerId = String(body.ownerId || '');
            const n = pending.get(ownerId) || 0;
            pending.set(ownerId, 0);
            send(res, 200, { granted: n });
            return;
          }

          if (req.method === 'GET' && parts.length === 1) {
            const snap = shares.get(parts[0]);
            if (!snap) {
              send(res, 404, { error: { message: 'not found' } });
              return;
            }
            send(res, 200, { ...snap, ownerId: '' });
            return;
          }

          if (req.method === 'POST' && parts.length === 2 && parts[1] === 'claim') {
            const body = JSON.parse((await readBody(req)) || '{}') as {
              deviceId?: string;
              ownerId?: string;
              viewedMs?: number;
            };
            const deviceId = String(body.deviceId || '');
            const viewerOwnerId = String(body.ownerId || '');
            const viewedMs = Number(body.viewedMs) || 0;
            if (!deviceId) {
              send(res, 200, { ok: false, reason: 'error' });
              return;
            }
            if (viewedMs < VIEW_MS) {
              send(res, 200, { ok: false, reason: 'too_fast' });
              return;
            }
            const ip = String(req.socket.remoteAddress || 'local');
            const rk = `${ip}:${Math.floor(Date.now() / 60000)}`;
            const rate = rates.get(rk) || 0;
            if (rate >= 60) {
              send(res, 200, { ok: false, reason: 'rate_limited' });
              return;
            }
            rates.set(rk, rate + 1);

            const snap = shares.get(parts[0]);
            if (!snap) {
              send(res, 200, { ok: false, reason: 'not_found' });
              return;
            }
            if (
              deviceId === snap.ownerId ||
              (viewerOwnerId && viewerOwnerId === snap.ownerId)
            ) {
              send(res, 200, { ok: false, reason: 'self' });
              return;
            }
            const ck = `${parts[0]}:${deviceId}`;
            if (claims.has(ck)) {
              send(res, 200, { ok: false, reason: 'already' });
              return;
            }
            claims.add(ck);
            const dk = `${snap.ownerId}:${day()}`;
            const dayCount = ownerDay.get(dk) || 0;
            if (dayCount >= DAY_CAP) {
              send(res, 200, {
                ok: true,
                grantViewer: true,
                ownerDayCount: dayCount,
                reason: 'owner_day_cap',
              });
              return;
            }
            ownerDay.set(dk, dayCount + 1);
            pending.set(snap.ownerId, (pending.get(snap.ownerId) || 0) + 1);
            send(res, 200, {
              ok: true,
              grantViewer: true,
              ownerDayCount: dayCount + 1,
            });
            return;
          }

          send(res, 404, { error: { message: 'Not found' } });
        } catch (err) {
          send(res, 500, {
            error: { message: err instanceof Error ? err.message : 'error' },
          });
        }
      });
    },
  };
}
