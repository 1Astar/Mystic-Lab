import { describe, expect, it, beforeEach } from 'vitest';
import {
  COMBO_FLAT_GAIN,
  COMBO_FLAT_GAIN_LINGYUN,
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
import type { PalaceSnap, ZiweiChartView } from '../ziwei/types.ts';

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

/** 同宫成格：把成员都塞进命宫 */
function formedView(starNames: string[], mutagen?: Array<{ star: string; hua: string }>): ZiweiChartView {
  const majors = starNames
    .filter((n) => !n.startsWith('化'))
    .map((name) => {
      const h = mutagen?.find((x) => x.star === name);
      return h ? { name, mutagen: h.hua } : { name };
    });
  const soul = {
    name: '命宫',
    earthlyBranch: '子',
    heavenlyStem: '甲',
    isSoul: true,
    isBody: false,
    majors,
    minors: [],
    adjectives: [],
  } as unknown as PalaceSnap;
  const rest = ['丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'].map(
    (br, i) =>
      ({
        name: ['兄弟', '夫妻', '子女', '财帛', '疾厄', '迁移', '仆役', '官禄', '田宅', '福德', '父母'][i]!,
        earthlyBranch: br,
        heavenlyStem: '甲',
        isSoul: false,
        isBody: false,
        majors: [],
        minors: [],
        adjectives: [],
      }) as unknown as PalaceSnap,
  );
  return {
    palaces: [soul, ...rest],
    soulPalace: soul,
    bodyPalace: soul,
    soul: '紫微',
    body: '天相',
    fiveElementsClass: '水二局',
    theater: { headline: '测' },
  } as unknown as ZiweiChartView;
}

describe('craft combo achievements', () => {
  it('has a thick catalog (core + 贵人/煞拆/名局)', () => {
    expect(CRAFT_COMBO_ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    expect(CRAFT_COMBO_ACHIEVEMENTS.some((a) => a.id === 'fu_bi')).toBe(true);
    expect(CRAFT_COMBO_ACHIEVEMENTS.some((a) => a.id === 'yang_tuo')).toBe(true);
    expect(CRAFT_COMBO_ACHIEVEMENTS.some((a) => a.id === 'zi_tan')).toBe(true);
    expect(COMBO_LORE.length).toBeGreaterThanOrEqual(12);
  });

  it('evaluates di_xing / ye_huo by chart formation not atlas set', () => {
    const di = CRAFT_COMBO_ACHIEVEMENTS.find((a) => a.id === 'di_xing')!;
    expect(evaluateCraftComboAch(di, null).status).toBe('locked');
    expect(
      evaluateCraftComboAch(di, formedView(['紫微', '天府'])).status,
    ).toBe('partial');
    expect(
      evaluateCraftComboAch(di, formedView(['紫微', '天府', '天相'])).status,
    ).toBe('complete');
    const ye = CRAFT_COMBO_ACHIEVEMENTS.find((a) => a.id === 'ye_huo')!;
    expect(
      evaluateCraftComboAch(ye, formedView(['擎羊', '陀罗', '火星', '铃星'])).status,
    ).toBe('complete');
  });

  it('applies flat bonuses when combos are formed on chart', () => {
    const view = formedView([
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
    const next = applyFlatComboBonuses(ALL_AXES(), view);
    expect(next.find((a) => a.id === 'zhenshou')?.value).toBe(10 + 8 + 10 + 12);
    expect(next.find((a) => a.id === 'lingyun')?.value).toBe(10 + 10 + 8 + 8);
    expect(next.find((a) => a.id === 'yeli')?.value).toBe(10 + 12 + 12 + 10);
    expect(next.find((a) => a.id === 'tongbian')?.sources).toContain('成就·昌曲');
    expect(next.find((a) => a.id === 'zhenshou')?.sources).toContain('成就·君臣辅弼');
  });

  it('applies core stack including 帝星 and 杀破狼', () => {
    const view = formedView(
      [
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
        '廉贞',
        '武曲',
      ],
      [
        { star: '廉贞', hua: '禄' },
        { star: '破军', hua: '权' },
        { star: '武曲', hua: '科' },
        { star: '太阳', hua: '忌' },
      ],
    );
    const next = applyFlatComboBonuses(ALL_AXES(), view);
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
    const view = formedView(['擎羊', '陀罗', '火星', '铃星']);
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
    const { axes, active } = applyYeHuoConditionalBurst(afterYear, view);
    expect(active).toBe(true);
    const g = axes.find((a) => a.id === 'guangyao')!;
    expect(g.buffMult).toBe(BUFF_MULT_MAX);
    expect(g.value).toBe(Math.round(40 * BUFF_MULT_MAX));
    expect(YE_HUO_GUANGYAO_MULT).toBeGreaterThan(1);
  });

  it('toasts each formed achievement once', () => {
    const view = formedView(['紫微', '天府', '天相']);
    const a = claimNewCraftComboToasts(view);
    expect(a.some((x) => x.id === 'di_xing')).toBe(true);
    const b = claimNewCraftComboToasts(view);
    expect(b.length).toBe(0);
    expect(craftComboProgress(view).total).toBe(CRAFT_COMBO_ACHIEVEMENTS.length);
  });

  it('documents ye_huo multiplier constant', () => {
    expect(YE_HUO_GUANGYAO_MULT).toBe(1.5);
  });
});
