import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  FREE_DEEP_LIMIT,
  FREE_FOLLOW_LIMIT,
  friendlyQuotaCopy,
  loadAiQuota,
  recordDeepUse,
  recordFollowUse,
  saveAiQuota,
  saveAiServiceMode,
} from './ai-mode.ts';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, String(v));
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
  });
  saveAiQuota({ deepUsed: 0, followUsed: 0 });
  saveAiServiceMode('mystic');
});

describe('friendlyQuotaCopy', () => {
  it('首次：免费体验一次深度解读', () => {
    const c = friendlyQuotaCopy('mystic', { deepUsed: 0, followUsed: 0 });
    expect(c.phase).toBe('deep_free');
    expect(c.headline).toMatch(/免费体验一次深度解读/);
    expect(c.headline).not.toMatch(/剩余/);
  });

  it('深度后：还可以继续追问', () => {
    const c = friendlyQuotaCopy('mystic', {
      deepUsed: FREE_DEEP_LIMIT,
      followUsed: 0,
    });
    expect(c.phase).toBe('follow');
    expect(c.headline).toMatch(/还可以继续追问 2 次/);
    expect(c.headline).not.toMatch(/今日/);
  });

  it('用尽后不说剩余次数', () => {
    const c = friendlyQuotaCopy('mystic', {
      deepUsed: FREE_DEEP_LIMIT,
      followUsed: FREE_FOLLOW_LIMIT,
    });
    expect(c.phase).toBe('exhausted');
    expect(c.headline).not.toMatch(/剩余\d/);
  });

  it('records quota locally', () => {
    recordDeepUse();
    expect(loadAiQuota().deepUsed).toBe(1);
    recordFollowUse();
    expect(loadAiQuota().followUsed).toBe(1);
  });
});
