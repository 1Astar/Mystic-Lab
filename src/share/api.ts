import type { ShareClaimResult, ShareCreateBody, ShareSnapshot } from './types.ts';

const BASE = String(import.meta.env.VITE_SHARE_API_URL || '/api/share')
  .trim()
  .replace(/\/$/, '');

export function shareApiReady(): boolean {
  return Boolean(BASE);
}

export async function createShareSnapshot(
  body: ShareCreateBody,
): Promise<ShareSnapshot> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `分享创建失败 (${res.status})`);
  }
  return (await res.json()) as ShareSnapshot;
}

export async function fetchShareSnapshot(id: string): Promise<ShareSnapshot | null> {
  const res = await fetch(`${BASE}/${encodeURIComponent(id)}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`读取分享失败 (${res.status})`);
  return (await res.json()) as ShareSnapshot;
}

export async function claimShareReward(input: {
  id: string;
  deviceId: string;
  ownerId: string;
  viewedMs: number;
}): Promise<ShareClaimResult> {
  const res = await fetch(`${BASE}/${encodeURIComponent(input.id)}/claim`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: input.deviceId,
      ownerId: input.ownerId,
      viewedMs: input.viewedMs,
    }),
  });
  if (!res.ok) {
    return { ok: false, reason: 'error' };
  }
  return (await res.json()) as ShareClaimResult;
}

export async function redeemOwnerRewards(ownerId: string): Promise<number> {
  const res = await fetch(`${BASE}/redeem`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ownerId }),
  });
  if (!res.ok) return 0;
  const data = (await res.json()) as { granted?: number };
  return Math.max(0, Number(data.granted) || 0);
}

export function shareDeepUrl(id: string): string {
  const origin = typeof location !== 'undefined' ? location.origin : '';
  return `${origin}/s/${encodeURIComponent(id)}`;
}
