import { SHARE_DEVICE_KEY, SHARE_OWNER_KEY } from './types.ts';

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateOwnerId(): string {
  try {
    const existing = localStorage.getItem(SHARE_OWNER_KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(SHARE_OWNER_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(SHARE_DEVICE_KEY);
    if (existing) return existing;
    const id = randomId();
    localStorage.setItem(SHARE_DEVICE_KEY, id);
    return id;
  } catch {
    return randomId();
  }
}

export function maskQuestion(q: string): string {
  /** @deprecated 分享已改为显示/不显示；保留供旧调用兼容 */
  const t = q.trim();
  if (!t) return '关于一次选择的一问';
  if (t.length <= 4) return '••••';
  return `${t.slice(0, 2)}···${t.slice(-1)}`;
}
