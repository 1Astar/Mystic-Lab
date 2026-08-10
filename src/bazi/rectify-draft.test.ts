import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearRectifyDraft,
  loadRectifyDraft,
  saveRectifyDraft,
  type RectifyDraft,
} from './rectify-draft.ts';
import { createEmptyEvent } from './rectify-events.ts';

const mem = new Map<string, string>();

beforeEach(() => {
  mem.clear();
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
});

describe('rectify-draft', () => {
  it('round-trips band + events + mode', () => {
    const draft: RectifyDraft = {
      mode: 'deep',
      band: { kind: 'morning' },
      keptBranches: ['卯', '辰'],
      events: [
        { ...createEmptyEvent(), year: 2018, type: 'career', note: '跳槽' },
        { ...createEmptyEvent(), year: 2020, type: 'move' },
      ],
      feedback: {},
      updatedAt: '2026-08-04T00:00:00.000Z',
    };
    saveRectifyDraft(draft);
    const loaded = loadRectifyDraft();
    expect(loaded?.mode).toBe('deep');
    expect(loaded?.band).toEqual({ kind: 'morning' });
    expect(loaded?.keptBranches).toEqual(['卯', '辰']);
    expect(loaded?.events).toHaveLength(2);
    expect(loaded?.events[0]?.year).toBe(2018);
  });

  it('clear empties storage', () => {
    saveRectifyDraft({
      mode: 'quick',
      band: { kind: 'all' },
      keptBranches: [],
      events: [],
      feedback: {},
      updatedAt: new Date().toISOString(),
    });
    clearRectifyDraft();
    expect(loadRectifyDraft()).toBeNull();
  });
});
