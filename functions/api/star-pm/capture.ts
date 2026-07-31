/**
 * Star PM Ideas capture 代理（密钥只在服务端）
 *
 * Runtime Secret：STAR_PM_CAPTURE_SECRET
 * 可选：STAR_PM_CAPTURE_URL（默认生产 capture 端点）
 * 可选：MYSTIC_ALLOWED_ORIGINS（逗号分隔；空则只允许同源 / 缺 Origin 的服务端调用）
 */
type Env = {
  STAR_PM_CAPTURE_SECRET?: string;
  STAR_PM_CAPTURE_URL?: string;
  MYSTIC_ALLOWED_ORIGINS?: string;
};

const cors: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors },
  });
}

function originAllowed(request: Request, env: Env): boolean {
  const raw = (env.MYSTIC_ALLOWED_ORIGINS || '').trim();
  if (!raw) {
    // 未配置时：有 Origin 则必须像本站 Pages；无 Origin（部分同站/预取）放行由限流兜底
    const origin = request.headers.get('Origin') || '';
    if (!origin) return true;
    try {
      const host = new URL(origin).hostname;
      return (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.endsWith('.pages.dev') ||
        host.endsWith('mystic-lab.pages.dev')
      );
    } catch {
      return false;
    }
  }
  const origin = request.headers.get('Origin') || '';
  if (!origin) return true;
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(origin);
}

export const onRequestOptions = async (): Promise<Response> =>
  new Response(null, { status: 204, headers: cors });

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;
  if (!originAllowed(request, env)) {
    return json({ error: { message: 'Origin not allowed' } }, 403);
  }

  const secret = (env.STAR_PM_CAPTURE_SECRET || '').trim();
  if (!secret) {
    return json(
      {
        error: {
          message:
            '未配置 STAR_PM_CAPTURE_SECRET（Cloudflare Runtime Secret，勿用 VITE_）',
        },
      },
      503,
    );
  }

  const upstream =
    (env.STAR_PM_CAPTURE_URL || '').trim() ||
    'https://star-project-manage.vercel.app/api/ideas/capture';

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: { message: 'Invalid JSON' } }, 400);
  }

  try {
    const upstreamRes = await fetch(upstream, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ideas-capture-secret': secret,
      },
      body: JSON.stringify(body),
    });
    const text = await upstreamRes.text();
    return new Response(text, {
      status: upstreamRes.status,
      headers: {
        'Content-Type':
          upstreamRes.headers.get('Content-Type') ||
          'application/json; charset=utf-8',
        ...cors,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upstream failed';
    return json({ error: { message } }, 502);
  }
};
