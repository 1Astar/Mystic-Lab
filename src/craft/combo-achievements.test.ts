import { describe, expect, it, beforeEach } from 'vitest';
import {
  COMBO_FLAT_GAIN,
  COMBO_FLAT_GAIN_LINGYUN,
  COMBO_FLAT_GAIN_S,
  COMBO_FLAT_GAIN_YELI,
  DI_XING_GAIN_ZHENSHOU,
  YE_HUO_GUANGYAO_MULT,
  applyFlatComboBonuses,
  applyYeHuoConditionalBurst,
  claimNewCraftComboToasts,
  craftComboProgress,
  evaluateCraftComboAch,
  CRAFT_COMBO_ACHIEVEMENTS,
} from './combo-achievements.ts';
import { applyBuffToAxes, BUFF_MULT_MAX } from './spirit-buff.ts';
import type { CraftAxisScore } from './spirit-roots.ts';
import { COMBO_LORE } from '../ziwei/combo-lore.ts';

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

function axis(
  id: CraftAxisScore['id'],
  value: number,
  extra: Partial<CraftAxisScore> = {},
): CraftAxisScore {
  return {
    id,
    label: id,
    sub: '',
    value,
    lit: value > 0,
    sources: [],
    ...extra,
  };
}

const ALL_AXES = (): CraftAxisScore[] => [
  axis('guangyao', 10),
  axis('tongbian', 10),
  axis('wenyang', 10),
  axis('zhenshou', 10),
  axis('lingyun', 10),
  axis('yeli', 10),
];

describe('craft combo achievements', () => {
  it('has a thick catalog (core + 贵人/煞拆/名局)', () => {
    expect(CRAFT_COMBO_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    expect(CRAFT_COMBO_ACHIEVEMENTS.some((a) => a.id === 'fu_bi')).toBe(true);
    expect(CRAFT_COMBO_ACHIEVEMENTS.some((a) => a.id === 'yang_tuo')).toBe(true);
    expect(CRAFT_COMBO_ACHIEVEMENTS.some((a) => a.id === 'zi_tan')).toBe(true);
    expect(COMBO_LORE.length).toBeGreaterThanOrEqual(12);
  });

  it('evaluates di_xing / ye_huo by unlocked members', () => {
    const di = CRAFT_COMBO_ACHIEVEMENTS.find((a) => a.id === 'di_xing')!;
    expect(evaluateCraftComboAch(di, new Set(['紫微', '天府'])).status).toBe('partial');
    expect(
      evaluateCraftComboAch(di, new Set(['紫微', '天府', '天相'])).status,
    ).toBe('complete');
    const ye = CRAFT_COMBO_ACHIEVEMENTS.find((a) => a.id === 'ye_huo')!;
    expect(
      evaluateCraftComboAch(ye, new Set(['擎羊', '陀罗', '火星', '铃星'])).status,
    ).toBe('complete');
  });

  it('applies flat bonuses for 贵人 and 煞拆', () => {
    const unlocked = new Set([
      '左辅',
      '右弼',
      '天魁',
      '天钺',
      '文昌',
      '文曲',
      '擎羊',
      '陀罗',
      '火星',
      '铃星',
      '地空',
      '地劫',
      '紫微',
      '天府',
    ]);
    const next = applyFlatComboBonuses(ALL_AXES(), unlocked);
    // 紫府+8 · 辅弼+10 · 君臣辅弼+12
    expect(next.find((a) => a.id === 'zhenshou')?.value).toBe(10 + 8 + 10 + 12);
    // 魁钺+10 · 昌曲+8 · 君臣+8
    expect(next.find((a) => a.id === 'lingyun')?.value).toBe(10 + 10 + 8 + 8);
    // 羊陀+12 · 火铃+12 · 空劫+10
    expect(next.find((a) => a.id === 'yeli')?.value).toBe(10 + 12 + 12 + 10);
    expect(next.find((a) => a.id === 'tongbian')?.sources).toContain('成就·昌曲');
    expect(next.find((a) => a.id === 'zhenshou')?.sources).toContain('成就·君臣辅弼');
  });

  it('applies core stack including 帝星 and 杀破狼', () => {
    const unlocked = new Set([
      '紫微',
      '天府',
      '天相',
      '七杀',
      '破军',
      '贪狼',
      '天机',
      '太阴',
      '天同',
      '天梁',
      '太阳',
      '化禄',
      '化权',
      '化科',
      '化忌',
    ]);
    const next = applyFlatComboBonuses(ALL_AXES(), unlocked);
    expect(next.find((a) => a.id === 'zhenshou')?.value).toBeGreaterThan(
      10 + DI_XING_GAIN_ZHENSHOU,
    );
    expect(next.find((a) => a.id === 'lingyun')?.value).toBeGreaterThanOrEqual(
      10 + COMBO_FLAT_GAIN_LINGYUN,
    );
    expect(next.find((a) => a.id === 'tongbian')?.value).toBeGreaterThan(
      10 + COMBO_FLAT_GAIN,
    );
  });

  it('applies 业火 burst when yeli is max, clamping mult', () => {
    const unlocked = new Set(['擎羊', '陀罗', '火星', '铃星']);
    const afterYear = applyBuffToAxes(
      [axis('guangyao', 40), axis('yeli', 80), axis('tongbian', 10)],
      {
        guangyao: 1.4,
        tongbian: 1,
        wenyang: 1,
        zhenshou: 1,
        lingyun: 1,
        yeli: 1,
      },
    );
    const { axes, active } = applyYeHuoConditionalBurst(afterYear, unlocked);
    expect(active).toBe(true);
    const g = axes.find((a) => a.id === 'guangyao')!;
    expect(g.buffMult).toBe(BUFF_MULT_MAX);
    expect(g.value).toBe(Math.round(40 * BUFF_MULT_MAX));
  });

  it('claims toast once per newly completed achievement', () => {
    const unlocked = new Set(['紫微', '天府', '天相']);
    const a = claimNewCraftComboToasts(unlocked);
    expect(a.some((x) => x.id === 'di_xing')).toBe(true);
    const b = claimNewCraftComboToasts(unlocked);
    expect(b).toHaveLength(0);
    expect(craftComboProgress(unlocked).total).toBe(CRAFT_COMBO_ACHIEVEMENTS.length);
  });

  it('documents ye_huo multiplier constant', () => {
    expect(YE_HUO_GUANGYAO_MULT).toBe(1.5);
  });
});
