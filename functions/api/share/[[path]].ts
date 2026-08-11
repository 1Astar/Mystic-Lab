/**
 * 结果分享 API（Cloudflare Pages Function）
 * 绑定 KV：Pages → Settings → Functions → SHARE_KV
 *
 * POST /api/share
 * GET  /api/share/:id
 * POST /api/share/:id/claim
 * POST /api/share/redeem
 */

type Env = { SHARE_KV?: KVNamespace };

type ShareSection = { heading: string; body: string };
type ShareSnapshot = {
  id: string;
  system: string;
  createdAt: string;
  ownerId: string;
  questionMasked: boolean;
  questionDisplay: string;
  headline: string;
  summary: string;
  sections: ShareSection[];
  visual: Record<string, unknown>;
  includeAi: boolean;
  aiText?: string;
  brandSlogan?: string;
};

type ShareClaimResult = {
  ok: boolean;
  reason?: string;
  grantViewer?: boolean;
  ownerDayCount?: number;
};

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const DAY_CAP = 3;
const VIEW_MS = 3000;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  });
}

function dayKey(d = new Date()): string {
  return d.toISOString().slice(0, 10);
}

function rid(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12);
}

export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: cors });

export const onRequest = async (context: {
  request: Request;
  env: Env;
  params: { path?: string | string[] };
}): Promise<Response> => {
  const { request, env, params } = context;
  const kv = env.SHARE_KV;
  if (!kv) {
    return json(
      {
        error: {
          message: '未绑定 SHARE_KV：请在 Cloudflare Pages Functions 绑定 KV 命名空间 SHARE_KV',
        },
      },
      503,
    );
  }

  const rawPath = params.path;
  const pathStr = Array.isArray(rawPath)
    ? rawPath.join('/')
    : String(rawPath || '');
  const parts = pathStr.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);

  try {
    if (request.method === 'POST' && parts.length === 0) {
      return await createShare(request, kv);
    }
    if (request.method === 'POST' && parts[0] === 'redeem') {
      return await redeem(request, kv);
    }
    if (parts.length === 1 && request.method === 'GET') {
      return await getShare(parts[0], kv);
    }
    if (parts.length === 2 && parts[1] === 'claim' && request.method === 'POST') {
      return await claim(parts[0], request, kv);
    }
    return json({ error: { message: 'Not found' } }, 404);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'error';
    return json({ error: { message } }, 500);
  }
};

async function createShare(request: Request, kv: KVNamespace): Promise<Response> {
  const body = (await request.json()) as Partial<ShareSnapshot>;
  if (!body?.ownerId || !body.system || !(body.summary || body.headline)) {
    return json({ error: { message: 'invalid body' } }, 400);
  }
  const id = rid();
  const snap: ShareSnapshot = {
    id,
    system: String(body.system),
    createdAt: new Date().toISOString(),
    ownerId: String(body.ownerId),
    questionMasked: Boolean(body.questionMasked),
    questionDisplay: String(body.questionDisplay || '').slice(0, 200),
    headline: String(body.headline || '').slice(0, 80),
    summary: String(body.summary || '').slice(0, 400),
    sections: Array.isArray(body.sections) ? body.sections.slice(0, 12) : [],
    visual: (body.visual as Record<string, unknown>) || { kind: 'generic' },
    includeAi: Boolean(body.includeAi),
    aiText: body.includeAi ? String(body.aiText || '').slice(0, 8000) : undefined,
    brandSlogan: body.brandSlogan
      ? String(body.brandSlogan).slice(0, 80)
      : undefined,
  };
  await kv.put(`share:${id}`, JSON.stringify(snap), {
    expirationTtl: 60 * 60 * 24 * 90,
  });
  return json(snap, 201);
}

async function getShare(id: string, kv: KVNamespace): Promise<Response> {
  const raw = await kv.get(`share:${id}`);
  if (!raw) return json({ error: { message: 'not found' } }, 404);
  const snap = JSON.parse(raw) as ShareSnapshot;
  return json({ ...snap, ownerId: '' });
}

async function claim(
  id: string,
  request: Request,
  kv: KVNamespace,
): Promise<Response> {
  const body = (await request.json()) as {
    deviceId?: string;
    viewedMs?: number;
    ownerId?: string;
  };
  const deviceId = String(body.deviceId || '').trim();
  const viewerOwnerId = String(body.ownerId || '').trim();
  const viewedMs = Number(body.viewedMs) || 0;
  if (!deviceId) return json({ ok: false, reason: 'error' } satisfies ShareClaimResult);

  if (viewedMs < VIEW_MS) {
    return json({ ok: false, reason: 'too_fast' } satisfies ShareClaimResult);
  }

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const rateKey = `rate:${ip}:${Math.floor(Date.now() / 60000)}`;
  const rate = Number((await kv.get(rateKey)) || 0);
  if (rate >= 30) {
    return json({ ok: false, reason: 'rate_limited' } satisfies ShareClaimResult);
  }
  await kv.put(rateKey, String(rate + 1), { expirationTtl: 120 });

  const raw = await kv.get(`share:${id}`);
  if (!raw) return json({ ok: false, reason: 'not_found' } satisfies ShareClaimResult);
  const snap = JSON.parse(raw) as ShareSnapshot;

  if (
    (snap.ownerId && deviceId === snap.ownerId) ||
    (snap.ownerId && viewerOwnerId && viewerOwnerId === snap.ownerId)
  ) {
    return json({ ok: false, reason: 'self' } satisfies ShareClaimResult);
  }

  const claimKey = `claim:${id}:${deviceId}`;
  if (await kv.get(claimKey)) {
    return json({ ok: false, reason: 'already' } satisfies ShareClaimResult);
  }

  const day = dayKey();
  const dayCountKey = `owner_day:${snap.ownerId}:${day}`;
  const dayCount = Number((await kv.get(dayCountKey)) || 0);

  await kv.put(claimKey, '1', { expirationTtl: 60 * 60 * 24 * 90 });

  if (dayCount >= DAY_CAP) {
    return json({
      ok: true,
      grantViewer: true,
      ownerDayCount: dayCount,
      reason: 'owner_day_cap',
    } satisfies ShareClaimResult);
  }

  await kv.put(dayCountKey, String(dayCount + 1), { expirationTtl: 60 * 60 * 48 });
  const pendingKey = `pending:${snap.ownerId}`;
  const pending = Number((await kv.get(pendingKey)) || 0);
  await kv.put(pendingKey, String(pending + 1), {
    expirationTtl: 60 * 60 * 24 * 180,
  });

  return json({
    ok: true,
    grantViewer: true,
    ownerDayCount: dayCount + 1,
  } satisfies ShareClaimResult);
}

async function redeem(request: Request, kv: KVNamespace): Promise<Response> {
  const body = (await request.json()) as { ownerId?: string };
  const ownerId = String(body.ownerId || '').trim();
  if (!ownerId) return json({ granted: 0 });
  const pendingKey = `pending:${ownerId}`;
  const pending = Number((await kv.get(pendingKey)) || 0);
  if (pending <= 0) return json({ granted: 0 });
  await kv.delete(pendingKey);
  return json({ granted: pending });
}
