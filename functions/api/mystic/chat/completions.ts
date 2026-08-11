/**
 * Mystic AI 托管代理（Cloudflare Pages Function）
 *
 * 浏览器 → POST /api/mystic/chat/completions（不带任何产品方 Key）
 * 代理 → 上游（DeepSeek / OpenAI 兼容）；MYSTIC_UPSTREAM_KEY 仅 Runtime Secret
 *
 * Cloudflare Pages → Environment variables：
 * - Build: VITE_MYSTIC_AI_URL=/api/mystic   （仅路径，不是密钥）
 * - Runtime Secret: MYSTIC_UPSTREAM_URL / MYSTIC_UPSTREAM_KEY
 * - Runtime 可选: MYSTIC_UPSTREAM_MODEL、MYSTIC_ALLOWED_ORIGINS
 *
 * 禁止：任何 VITE_*_KEY / VITE_*_TOKEN / VITE_*_SECRET
 */
type Env = {
  MYSTIC_UPSTREAM_URL?: string;
  MYSTIC_UPSTREAM_KEY?: string;
  MYSTIC_UPSTREAM_MODEL?: string;
  MYSTIC_ALLOWED_ORIGINS?: string;
};

type ChatBody = {
  model?: string;
  temperature?: number;
  messages?: unknown;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...corsHeaders,
    },
  });
}

function originAllowed(request: Request, env: Env): boolean {
  const raw = (env.MYSTIC_ALLOWED_ORIGINS || '').trim();
  const origin = request.headers.get('Origin') || '';
  if (!raw) {
    if (!origin) return true;
    try {
      const host = new URL(origin).hostname;
      return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.endsWith('.pages.dev') ||
        host.endsWith('.vercel.app') ||
        host === 'mystic.starry-studio.cn' ||
        host.endsWith('.starry-studio.cn')
      );
    } catch {
      return false;
    }
  }
  if (!origin) return true;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(origin);
}

export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: corsHeaders });

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;

  if (!originAllowed(request, env)) {
    return json({ error: { message: 'Origin not allowed' } }, 403);
  }

  const upstreamBase = (env.MYSTIC_UPSTREAM_URL || '').replace(/\/$/, '');
  const upstreamKey = (env.MYSTIC_UPSTREAM_KEY || '').trim();
  const upstreamModel = (env.MYSTIC_UPSTREAM_MODEL || 'deepseek-chat').trim();

  if (!upstreamBase || !upstreamKey) {
    return json(
      {
        error: {
          message:
            'Mystic AI 未配置上游：请在 Cloudflare Runtime 设置 MYSTIC_UPSTREAM_URL / MYSTIC_UPSTREAM_KEY（Encrypt，勿用 VITE_）',
        },
      },
      503,
    );
  }

  let body: ChatBody;
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return json({ error: { message: 'Invalid JSON body' } }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return json({ error: { message: 'messages required' } }, 400);
  }

  const model =
    !body.model || body.model === 'mystic-default' ? upstreamModel : body.model;

  try {
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
    return new Response(text, {
      status: upstream.status,
      headers: {
        'Content-Type':
          upstream.headers.get('Content-Type') || 'application/json; charset=utf-8',
        ...corsHeaders,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream failed';
    return json({ error: { message } }, 502);
  }
};
