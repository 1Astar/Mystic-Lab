/**
 * Vercel → Cloudflare Pages Mystic AI 代理
 * Key 只在 CF Runtime；Vercel 不必配置 MYSTIC_UPSTREAM_*
 * 可选：MYSTIC_UPSTREAM_BASE，默认 https://mystic-lab.pages.dev/api/mystic
 */
const DEFAULT_UPSTREAM = 'https://mystic-lab.pages.dev/api/mystic';

function upstreamBase() {
  return String(process.env.MYSTIC_UPSTREAM_BASE || DEFAULT_UPSTREAM)
    .trim()
    .replace(/\/$/, '');
}

function joinUpstream(parts) {
  const base = upstreamBase();
  const rest = (parts || []).filter(Boolean).join('/');
  return rest ? `${base}/${rest}` : base;
}

function readBody(req) {
  if (req.body == null) return Buffer.alloc(0);
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === 'string') return Buffer.from(req.body);
  return Buffer.from(JSON.stringify(req.body));
}

async function proxyMysticApi(req, res, pathParts) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const url = joinUpstream(pathParts);
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
  const origin = req.headers.origin || req.headers.Origin;
  if (origin) headers.Origin = Array.isArray(origin) ? origin[0] : origin;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: readBody(req),
    });
    const text = await upstream.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader(
      'Content-Type',
      upstream.headers.get('content-type') || 'application/json; charset=utf-8',
    );
    res.status(upstream.status).send(text);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'proxy error';
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(502).json({
      error: { message: `Mystic AI 代理失败：${message}` },
    });
  }
}

module.exports = { proxyMysticApi, joinUpstream, upstreamBase };
