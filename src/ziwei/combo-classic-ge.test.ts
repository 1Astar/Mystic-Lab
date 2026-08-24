import { describe, expect, it } from 'vitest';
import { evaluateComboFormation } from './combo-formation.ts';
import { COMBO_LORE, getComboLore } from './combo-lore.ts';
import { evaluateCombo, listMineCandidateCombos, listMineStrongCombos } from './combo-journey.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

function palace(
  name: string,
  branch: string,
  opts: {
    isSoul?: boolean;
    majors?: string[];
    minors?: string[];
    mutagen?: Record<string, string>;
  } = {},
): PalaceSnap {
  const majors = (opts.majors ?? []).map((n) => ({
    name: n,
    brightness: '',
    mutagen: opts.mutagen?.[n] ?? '',
    isMajor: true,
  }));
  const minors = (opts.minors ?? []).map((n) => ({
    name: n,
    brightness: '',
    mutagen: '',
    isMajor: false,
  }));
  return {
    name,
    earthlyBranch: branch,
    heavenlyStem: '甲',
    isSoul: Boolean(opts.isSoul),
    isBody: false,
    isEmpty: false,
    majors,
    minors,
    adjectives: [],
  };
}

function chart(palaces: PalaceSnap[]): ZiweiChartView {
  const soul = palaces.find((p) => p.isSoul) ?? palaces[0]!;
  return {
    palaces,
    soulPalace: soul,
    bodyPalace: soul,
    soul: '紫微',
    body: '天相',
    fiveElementsClass: '水二局',
    theater: { headline: '测' },
  } as unknown as ZiweiChartView;
}

describe('classic ge formation', () => {
  it('文星拱命：昌曲在命三方成格', () => {
    const view = chart([
      palace('命宫', '子', { isSoul: true, majors: ['紫微'] }),
      palace('财帛', '辰', { majors: [], minors: ['文昌'] }),
      palace('官禄', '申', { majors: [], minors: ['文曲'] }),
      palace('迁移', '午', {}),
    ]);
    // 子辰申 is sanhe — need to ensure sanfang works. 命子的三合是辰申，对宫午。
    const lore = getComboLore('文星拱命')!;
    const ev = evaluateCombo(lore, view);
    expect(ev.status).toBe('complete');
  });

  it('丹墀桂墀：昌命曲迁成格', () => {
    const view = chart([
      palace('命宫', '寅', { isSoul: true, minors: ['文昌'] }),
      palace('迁移', '申', { minors: ['文曲'] }),
    ]);
    const lore = getComboLore('丹墀桂墀')!;
    expect(evaluateCombo(lore, view).status).toBe('complete');
  });

  it('日月并明：日月会命三方', () => {
    const view = chart([
      palace('命宫', '子', { isSoul: true, majors: ['太阳'] }),
      palace('财帛', '辰', { majors: ['太阴'] }),
      palace('官禄', '申', {}),
    ]);
    const lore = getComboLore('日月并明')!;
    expect(evaluateCombo(lore, view).status).toBe('complete');
  });

  it('财禄夹马：巳命+马+邻武曲禄', () => {
    const view = chart([
      palace('命宫', '巳', { isSoul: true, majors: ['太阳'], minors: ['天马'] }),
      palace('父母', '辰', { majors: ['武曲'] }),
      palace('兄弟', '午', { majors: [], minors: ['禄存'] }),
    ]);
    // neighbors of 巳 are 辰 and 午 — yes
    const lore = getComboLore('财禄夹马')!;
    expect(evaluateCombo(lore, view).status).toBe('complete');
  });

  it('mine strong vs candidates split', () => {
    const view = chart([
      palace('命宫', '子', {
        isSoul: true,
        majors: ['七杀', '破军', '贪狼', '太阳'],
        minors: ['文昌', '文曲'],
      }),
      palace('财帛', '辰', { majors: ['太阴'] }),
      palace('官禄', '申', {}),
    ]);
    const strong = listMineStrongCombos(view);
    const soft = listMineCandidateCombos(view);
    expect(strong.some((s) => s.combo.id === '文星拱命')).toBe(true);
    expect(soft.some((s) => s.combo.id === '杀破狼')).toBe(true);
  });

  it('catalog classic ge stays out of mine strong', () => {
    const lore = getComboLore('紫府同宫')!;
    expect(lore.formationRule).toBe('catalog');
    const view = chart([
      palace('命宫', '子', { isSoul: true, majors: ['紫微', '天府'] }),
    ]);
    expect(evaluateCombo(lore, view).status).toBe('locked');
    expect(listMineStrongCombos(view).some((s) => s.combo.id === '紫府同宫')).toBe(false);
  });

  it('classic catalog is substantially complete', () => {
    const classic = COMBO_LORE.filter((c) => c.family === 'classic-ge');
    expect(classic.length).toBeGreaterThanOrEqual(80);
    for (const id of ['阳梁昌禄', '紫府朝垣', '日出扶桑', '空劫夹命', '马头带剑', '善荫朝纲']) {
      expect(getComboLore(id)?.family).toBe('classic-ge');
    }
    expect(getComboLore('日丽中天')?.id).toBe('金灿光辉');
    expect(getComboLore('日照雷门')?.id).toBe('日出扶桑');
  });

  it('stamps traditional ge categories', () => {
    expect(getComboLore('阳梁昌禄')?.category).toBe('wen-gui');
    expect(getComboLore('紫府同宫')?.category).toBe('di-fu');
    expect(getComboLore('马头带剑')?.category).toBe('xiong');
    expect(getComboLore('火贪')?.category).toBe('huo-tan');
    const starCombo = COMBO_LORE.find(
      (c) => c.family === 'star-combo' && !['杀破狼', '机月同梁'].includes(c.id),
    );
    expect(starCombo?.category).toBe('star-combo');
  });
});

describe('sanfang fallback', () => {
  it('still completes 杀破狼 in same palace', () => {
    const view = chart([
      palace('命宫', '子', { isSoul: true, majors: ['七杀', '破军', '贪狼'] }),
    ]);
    expect(evaluateComboFormation(['七杀', '破军', '贪狼'], view).status).toBe('complete');
  });
});

