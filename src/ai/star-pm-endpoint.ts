/**
 * 问法 / 占问 / 边问反馈 → Star PM Ideas capture
 * 端点写死，不需要用户在设置里配置。
 */
export const STAR_PM_BASE_URL = 'https://star-project-manage.vercel.app';

/**
 * Capture 密钥：优先构建时注入 `VITE_STAR_PM_CAPTURE_SECRET`（与 Star PM `IDEAS_CAPTURE_SECRET` 一致）；
 * 未注入时回落开发默认（与 Star PM capture 路由一致）。
 */
export const STAR_PM_CAPTURE_SECRET =
  (import.meta.env.VITE_STAR_PM_CAPTURE_SECRET as string | undefined)?.trim() ||
  'dev-cron-secret';

export function isStarPmCaptureReady(): boolean {
  return Boolean(STAR_PM_BASE_URL && STAR_PM_CAPTURE_SECRET);
}

export async function postStarPmIdeaCapture(body: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${STAR_PM_BASE_URL}/api/ideas/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-ideas-capture-secret': STAR_PM_CAPTURE_SECRET,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 100)}` : ''}`);
  }
}
