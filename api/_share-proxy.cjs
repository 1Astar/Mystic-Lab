/**
 * Vercel → Cloudflare Pages 分享 API 代理（CF 侧已绑 SHARE_KV）
 * 可选环境变量 SHARE_UPSTREAM_BASE，默认 https://mystic-lab.pages.dev/api/share
 */
const DEFAULT_UPSTREAM = 'https://mystic-lab.pages.dev/api/share';

function upstreamBase() {
  return String(process.env.SHARE_UPSTREAM_BASE || DEFAULT_UPSTREAM)
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

async function proxyShareApi(req, res, pathParts) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  const url = joinUpstream(pathParts);
  const headers = { Accept: 'application/json' };
  const ct = req.headers['content-type'];
  if (ct) headers['Content-Type'] = Array.isArray(ct) ? ct[0] : ct;

  const init = { method: req.method || 'GET', headers };
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    init.body = readBody(req);
  }

  try {
    const upstream = await fetch(url, init);
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
      error: { message: `分享服务代理失败：${message}` },
    });
  }
}

module.exports = { proxyShareApi, joinUpstream, upstreamBase };
