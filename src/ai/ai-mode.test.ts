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
  saveAiQuota({ deepUsed: 0, followUsed: 0, bonusCredits: 0 });
  saveAiServiceMode('mystic');
});

describe('friendlyQuotaCopy', () => {
  it('首次：统一显示剩余次数', () => {
    const c = friendlyQuotaCopy('mystic', {
      deepUsed: 0,
      followUsed: 0,
      bonusCredits: 0,
    });
    expect(c.phase).toBe('deep_free');
    expect(c.headline).toBe(`剩余 ${FREE_DEEP_LIMIT + FREE_FOLLOW_LIMIT} 次`);
    expect(c.headline).not.toMatch(/深度解读|追问|分享奖励/);
  });

  it('深度后：仍显示统一剩余次数', () => {
    const c = friendlyQuotaCopy('mystic', {
      deepUsed: FREE_DEEP_LIMIT,
      followUsed: 0,
      bonusCredits: 0,
    });
    expect(c.phase).toBe('follow');
    expect(c.headline).toBe(`剩余 ${FREE_FOLLOW_LIMIT} 次`);
  });

  it('用尽后显示剩余 0 次', () => {
    const c = friendlyQuotaCopy('mystic', {
      deepUsed: FREE_DEEP_LIMIT,
      followUsed: FREE_FOLLOW_LIMIT,
      bonusCredits: 0,
    });
    expect(c.phase).toBe('exhausted');
    expect(c.headline).toBe('剩余 0 次');
  });

  it('records quota locally', () => {
    recordDeepUse();
    expect(loadAiQuota().deepUsed).toBe(1);
    recordFollowUse();
    expect(loadAiQuota().followUsed).toBe(1);
  });

  it('bonus credits unlock after base exhausted', async () => {
    const { grantBonusCredits, canUseMysticDeep, freeAiRemaining } = await import(
      './ai-mode.ts'
    );
    saveAiQuota({
      deepUsed: FREE_DEEP_LIMIT,
      followUsed: FREE_FOLLOW_LIMIT,
      bonusCredits: 0,
    });
    expect(canUseMysticDeep()).toBe(false);
    grantBonusCredits(1);
    expect(canUseMysticDeep()).toBe(true);
    expect(freeAiRemaining()).toBe(1);
    expect(friendlyQuotaCopy('mystic').headline).toBe('剩余 1 次');
    recordDeepUse();
    expect(loadAiQuota().bonusCredits).toBe(0);
    expect(loadAiQuota().deepUsed).toBe(FREE_DEEP_LIMIT);
  });
});
