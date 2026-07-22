import { beforeEach, describe, expect, it } from 'vitest';
import { HEXAGRAMS } from './hexagrams.ts';
import { saveLiuyaoJournalEntry, type LiuyaoJournalEntry } from './journal.ts';
import {
  buildVaultOverview,
  encountersForHex,
  getLiuyaoJourneyInsights,
  meetBannerForHex,
} from './journey.ts';
import { meetLineFor } from './vault.ts';
import { renderHexEncounterPanelHtml } from './hex-encounter.ts';
import type { CastResult } from './engine.ts';

const STORAGE_KEY = 'mystic-lab-liuyao-journal';

function installMemoryStorage(): void {
  const map = new Map<string, string>();
  const memory = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
  });
}

function seed(entries: Partial<LiuyaoJournalEntry>[]): void {
  const full = entries.map((e, i) => ({
    id: e.id ?? `j-${i}`,
    createdAt: e.createdAt ?? `2026-0${(i % 9) + 1}-01T10:00:00.000Z`,
    castAt: e.castAt,
    question: e.question ?? '问工作',
    method: e.method ?? ('coin' as const),
    primaryName: e.primaryName ?? '乾',
    primaryFullName: e.primaryFullName ?? '乾为天',
    changedFullName: e.changedFullName ?? null,
    changingLabels: e.changingLabels ?? [],
    shiLine: e.shiLine ?? 6,
    yingLine: e.yingLine ?? 3,
    summary: e.summary ?? '核心在于开创',
    reading: e.reading ?? {
      summary: '核心在于开创',
      basis: '世应同宫',
      context: '工作推进',
      action: '小步验证',
    },
    reflection: e.reflection ?? '',
    tags: e.tags ?? [],
    fulfilled: null,
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
}

describe('liuyao journey / encounters', () => {
  beforeEach(() => {
    installMemoryStorage();
  });

  it('builds palace overview and theme tip', () => {
    seed([
      { primaryName: '乾', primaryFullName: '乾为天', question: '换工作吗' },
      { primaryName: '姤', primaryFullName: '天风姤', question: '升职' },
      { primaryName: '坤', primaryFullName: '坤为地', question: '感情怎么办' },
    ]);
    const ov = buildVaultOverview();
    expect(ov.collected).toBe(3);
    expect(ov.palaces.find((p) => p.id === '乾')?.collected).toBe(2);
    expect(ov.topThemeLabel).toMatch(/工作|感情/);
  });

  it('meet line immersive copy', () => {
    seed([
      { id: 'a', primaryName: '乾', createdAt: '2026-01-01T00:00:00.000Z' },
      { id: 'b', primaryName: '乾', createdAt: '2026-06-01T00:00:00.000Z' },
      { id: 'c', primaryName: '乾', createdAt: '2026-07-01T00:00:00.000Z' },
    ]);
    const qian = HEXAGRAMS.find((h) => h.name === '乾')!;
    expect(meetBannerForHex(qian)).toMatch(/第 3 次遇见/);
    expect(encountersForHex('乾')).toHaveLength(3);
  });

  it('journey trends from recent palace hits', () => {
    seed([
      { primaryName: '乾', createdAt: '2026-07-20T00:00:00.000Z' },
      { primaryName: '姤', createdAt: '2026-07-19T00:00:00.000Z' },
      { primaryName: '遁', createdAt: '2026-07-18T00:00:00.000Z' },
      { primaryName: '坤', createdAt: '2026-01-01T00:00:00.000Z' },
    ]);
    const j = getLiuyaoJourneyInsights(30);
    expect(j.empty).toBe(false);
    expect(j.trends.some((t) => t.id === '乾')).toBe(true);
  });

  it('encounter panel has restore hooks', () => {
    seed([{ id: 'enc-1', primaryName: '乾', question: '娜娜在干嘛' }]);
    const qian = HEXAGRAMS.find((h) => h.name === '乾')!;
    const html = renderHexEncounterPanelHtml(qian);
    expect(html).toMatch(/data-enc-id="enc-1"/);
    expect(html).toMatch(/复原当时结果/);
    expect(html).toMatch(/第 1 次遇见|第一次遇见/);
  });

  it('saveLiuyaoJournalEntry feeds vault count', () => {
    const primary = HEXAGRAMS.find((h) => h.name === '乾')!;
    const cast = {
      method: 'coin' as const,
      primary,
      changed: null,
      changingIndexes: [] as number[],
      shiLine: 6 as const,
      yingLine: 3 as const,
      throws: [],
      primaryLines: [1, 1, 1, 1, 1, 1],
      changedLines: [1, 1, 1, 1, 1, 1],
    } satisfies CastResult;
    saveLiuyaoJournalEntry({
      question: '问工作',
      cast,
      reading: {
        summary: '核心在于开创',
        basis: 'a',
        context: 'b',
        action: 'c',
      },
      changingLabels: [],
    });
    expect(meetLineFor(buildVaultOverview().mostMet)).toMatch(/第一次遇见|第 1 次/);
  });
});
