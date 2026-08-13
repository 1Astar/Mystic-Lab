import { describe, expect, it, vi } from 'vitest';
import {
  isStarCraftActivated,
  resolveCodexCollectState,
  type ChartStarHit,
} from './codex-collect.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

const activateStore = {
  activated: [] as string[],
  explored: [] as string[],
  updatedAt: new Date().toISOString(),
};

vi.mock('../craft/spirit-activate.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../craft/spirit-activate.ts')>();
  return {
    ...mod,
    loadActivateStore: () => activateStore,
  };
});

function palace(name: string, extra: Partial<PalaceSnap> = {}): PalaceSnap {
  return {
    name,
    isSoul: name === '命宫',
    isBody: false,
    isEmpty: false,
    heavenlyStem: '甲',
    earthlyBranch: '子',
    majors: [],
    minors: [],
    adjectives: [],
    ...extra,
  };
}

describe('codex activate vs meet', () => {
  it('treats origin soul major as activated', () => {
    activateStore.activated = [];
    const soul = palace('命宫', {
      majors: [{ name: '紫微', brightness: '', mutagen: '', isMajor: true }],
    });
    const view = {
      palaces: [soul],
      soulPalace: soul,
      soul: '紫微',
      body: '紫微',
      theater: { annual: { year: 2026 } },
    } as unknown as ZiweiChartView;
    const hit: ChartStarHit = { palace: '命宫', isSoulMajor: true };
    expect(isStarCraftActivated('紫微', hit, view)).toBe(true);
    expect(
      resolveCodexCollectState('紫微', new Map([['紫微', hit]]), {
        hasChart: true,
        view,
      }),
    ).toBe('activated');
  });

  it('treats store-activated key as activated', () => {
    activateStore.activated = ['夫妻:解神'];
    const hit: ChartStarHit = { palace: '夫妻宫' };
    expect(isStarCraftActivated('解神', hit, null)).toBe(true);
    expect(
      resolveCodexCollectState('解神', new Map([['解神', hit]]), {
        hasChart: true,
      }),
    ).toBe('activated');
    activateStore.activated = [];
  });

  it('keeps in-chart sealed stars as met', () => {
    activateStore.activated = [];
    const hit: ChartStarHit = { palace: '迁移宫' };
    expect(
      resolveCodexCollectState('红鸾', new Map([['红鸾', hit]]), {
        hasChart: true,
      }),
    ).toBe('met');
  });
});
