/**
 * Mystic AI 托管代理（Cloudflare Pages Function）
 *
 * 浏览器 → POST /api/mystic/chat/completions
 * 代理 → 你的上游（DeepSeek / OpenAI 兼容）
 *
 * Cloudflare Pages → Settings → Environment variables（Production）：
 * - MYSTIC_UPSTREAM_URL   例 https://api.deepseek.com/v1
 * - MYSTIC_UPSTREAM_KEY   你的 API Key（务必标为 Secret）
 * - MYSTIC_UPSTREAM_MODEL 例 deepseek-chat（可选，默认 deepseek-chat）
 * - MYSTIC_PROXY_SECRET   可选；若设了，请求需带 Authorization: Bearer <同值>
 *
 * 构建变量（Build）：
 * - VITE_MYSTIC_AI_URL=/api/mystic
 */
type Env = {
  MYSTIC_UPSTREAM_URL?: string;
  MYSTIC_UPSTREAM_KEY?: string;
  MYSTIC_UPSTREAM_MODEL?: string;
  MYSTIC_PROXY_SECRET?: string;
};

type ChatBody = {
  model?: string;
  temperature?: number;
  messages?: unknown;
};

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: corsHeaders });

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;
  const upstreamBase = (env.MYSTIC_UPSTREAM_URL || '').replace(/\/$/, '');
  const upstreamKey = (env.MYSTIC_UPSTREAM_KEY || '').trim();
  const upstreamModel = (env.MYSTIC_UPSTREAM_MODEL || 'deepseek-chat').trim();
  const proxySecret = (env.MYSTIC_PROXY_SECRET || '').trim();

  if (!upstreamBase || !upstreamKey) {
    return json(
      {
        error: {
          message:
            'Mystic AI 未配置上游：请在 Cloudflare 设置 MYSTIC_UPSTREAM_URL / MYSTIC_UPSTREAM_KEY',
        },
      },
      503,
    );
  }

  if (proxySecret) {
    const auth = request.headers.get('Authorization') || '';
    const token = auth.replace(/^Bearer\s+/i, '').trim();
    if (token !== proxySecret) {
      return json({ error: { message: 'Unauthorized' } }, 401);
    }
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

  // 前端可传 mystic-default；统一映射到你的上游模型
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
