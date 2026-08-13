import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCodexEntry,
  listCodexEntries,
  unlockStarsFromChart,
} from './codex.ts';

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

describe('ziwei codex encounters', () => {
  it('unlock with question creates encounters', () => {
    const { newly } = unlockStarsFromChart(['紫微', '天机'], { 紫微: '命宫', 天机: '疾厄宫' }, {
      question: '今年事业如何？',
      summary: '盘面初见',
    });
    expect(newly).toContain('紫微');
    expect(newly).toContain('天机');

    const zw = getCodexEntry('紫微');
    expect(zw?.encounters?.length).toBe(1);
    expect(zw?.encounters?.[0]?.question).toBe('今年事业如何？');
    expect(zw?.encounters?.[0]?.palace).toBe('命宫');
    expect(zw?.meetCount).toBe(1);
  });

  it('reload persists encounters', () => {
    unlockStarsFromChart(['紫微'], { 紫微: '命宫' }, { question: '我是谁？' });
    const before = listCodexEntries().find((e) => e.starId === '紫微');
    expect(before?.encounters?.[0]?.question).toBe('我是谁？');

    const after = getCodexEntry('紫微');
    expect(after?.encounters).toEqual(before?.encounters);
    expect(after?.encounters?.[0]?.palace).toBe('命宫');
  });

  it('dedupes same question within 8s for already unlocked', () => {
    unlockStarsFromChart(['紫微'], { 紫微: '命宫' }, { question: '重复问' });
    unlockStarsFromChart(['紫微'], { 紫微: '命宫' }, { question: '重复问' });
    const entry = getCodexEntry('紫微');
    expect(entry?.encounters?.length).toBe(1);
  });

  it('newly without question still records 排盘遇见', () => {
    unlockStarsFromChart(['紫微'], { 紫微: '命宫' });
    const entry = getCodexEntry('紫微');
    expect(entry?.encounters?.[0]?.question).toBe('（排盘遇见）');
  });

  it('existing without question does not append', () => {
    unlockStarsFromChart(['紫微'], { 紫微: '命宫' }, { question: '第一次' });
    unlockStarsFromChart(['紫微'], { 紫微: '夫妻宫' });
    const entry = getCodexEntry('紫微');
    expect(entry?.encounters?.length).toBe(1);
    expect(entry?.lastPalace).toBe('夫妻宫');
  });
});
