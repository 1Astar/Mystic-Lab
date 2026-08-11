/**
 * 问法 / 占问 / 边问反馈 → Star PM Ideas capture
 * 浏览器只打同源 `/api/star-pm/capture`；密钥在 Cloudflare Runtime，不进前端包。
 */
export const STAR_PM_CAPTURE_PROXY = String(
  import.meta.env.VITE_STAR_PM_CAPTURE_URL || '/api/star-pm/capture',
)
  .trim()
  .replace(/\/$/, '');

export function isStarPmCaptureReady(): boolean {
  return Boolean(STAR_PM_CAPTURE_PROXY);
}

export async function postStarPmIdeaCapture(
  body: Record<string, unknown>,
): Promise<void> {
  const res = await fetch(STAR_PM_CAPTURE_PROXY, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 100)}` : ''}`);
  }
}
