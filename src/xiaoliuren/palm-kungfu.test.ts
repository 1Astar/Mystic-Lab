import { describe, expect, it, beforeEach } from 'vitest';
import { buildPalmKungfuStats } from './palm-kungfu.ts';
import type { XiaoliurenJournalEntry } from './journal.ts';

const KEY_GATES = 'mystic-lab-xiaoliuren-skill-gates';

function mockLocalStorage(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    },
  });
}

function entry(
  partial: Partial<XiaoliurenJournalEntry> & Pick<XiaoliurenJournalEntry, 'id' | 'resultId'>,
): XiaoliurenJournalEntry {
  return {
    createdAt: '2026-07-10T12:00:00.000Z',
    question: '',
    solarLabel: '2026-07-10 12:00',
    lunar: { label: '五月十六', monthLabel: '五月', dayLabel: '十六', month: 5, day: 16 },
    hour: { name: '午', label: '午时', rangeLabel: '11:00 – 13:00' },
    resultName: '大安',
    summary: '稳',
    reflection: '',
    fulfilled: null,
    lessonMode: null,
    ...partial,
  };
}

describe('palm kungfu stats', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.removeItem(KEY_GATES);
  });

  it('handles empty journal', () => {
    const stats = buildPalmKungfuStats([]);
    expect(stats.totalCasts).toBe(0);
    expect(stats.title).toContain('尚未起手');
    expect(stats.godFreq).toHaveLength(6);
    expect(stats.godFreq.every((g) => g.count === 0)).toBe(true);
  });

  it('aggregates modes and god frequency', () => {
    localStorage.setItem(
      KEY_GATES,
      JSON.stringify({ learnClears: 2, practiceClears: 1 }),
    );
    const stats = buildPalmKungfuStats([
      entry({ id: '1', resultId: 'da-an', resultName: '大安', lessonMode: 'learn', question: '今天顺吗' }),
      entry({ id: '2', resultId: 'da-an', resultName: '大安', lessonMode: 'practice', reflection: '先不动' }),
      entry({ id: '3', resultId: 'kong-wang', resultName: '空亡', lessonMode: 'beginner' }),
      entry({ id: '4', resultId: 'xiao-ji', resultName: '小吉' }),
    ]);

    expect(stats.totalCasts).toBe(4);
    expect(stats.withQuestion).toBe(1);
    expect(stats.withReflection).toBe(1);
    expect(stats.modeShares.find((m) => m.id === 'learn')?.count).toBe(1);
    expect(stats.modeShares.find((m) => m.id === 'unknown')?.count).toBe(1);
    expect(stats.godFreq[0]?.id).toBe('da-an');
    expect(stats.godFreq[0]?.count).toBe(2);
    expect(stats.godFreq[0]?.pct).toBe(50);
    expect(stats.practiceClears).toBe(1);
    expect(stats.quickUnlocked).toBe(false);
    expect(stats.title).toContain('操练');
  });

  it('marks mastery when quick unlocked and practice deep', () => {
    localStorage.setItem(
      KEY_GATES,
      JSON.stringify({ learnClears: 3, practiceClears: 5 }),
    );
    const stats = buildPalmKungfuStats([
      entry({ id: '1', resultId: 'su-xi', resultName: '速喜', lessonMode: 'beginner' }),
    ]);
    expect(stats.quickUnlocked).toBe(true);
    expect(stats.title).toContain('渐成');
  });
});
