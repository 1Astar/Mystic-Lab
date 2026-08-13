import { describe, expect, it, beforeEach } from 'vitest';
import { createEmptyPerson } from '../life/types.ts';
import { resolveCraftAnswer } from './build-answer.ts';
import { CRAFT_QUESTS, getCraftQuest, isoWeekKey } from './quests.ts';
import {
  hasChecked,
  levelProgressPct,
  loadCraftXp,
  markChecked,
} from './xp.ts';
import {
  AXIS_GAIN_DAY_MASTER,
  AXIS_GAIN_FORTUNE,
  AXIS_GAIN_MAJOR,
  axisForMajor,
  CRAFT_AXES,
  resolveSpiritRootPanel,
  scoreSpiritAxes,
} from './spirit-roots.ts';
import {
  resolveSpiritRootWithGrowth,
} from './spirit-activate.ts';
import {
  BUFF_MULT_MAX,
  BUFF_MULT_MIN,
  applyBuffToAxes,
  buildBuffEntriesFromMutagen,
  clampBuffMult,
  composeMultByAxis,
  composeMultByAxisDetailed,
  effectsForYearMutagen,
  resolveYearBuffPack,
} from './spirit-buff.ts';
import type { CraftAxisScore } from './spirit-roots.ts';
import type { YearBuffEntry } from './spirit-buff.ts';

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

describe('craft quests', () => {
  it('has five high-frequency questions', () => {
    expect(CRAFT_QUESTS.length).toBeGreaterThanOrEqual(5);
    expect(getCraftQuest('career_jump')?.palace).toBe('官禄');
    expect(getCraftQuest('love_timing')?.palace).toBe('夫妻');
    expect(getCraftQuest('money_now')?.palace).toBe('财帛');
  });

  it('builds iso week key', () => {
    expect(isoWeekKey(new Date('2026-08-11T00:00:00Z'))).toMatch(/^\d{4}-W\d{2}$/);
  });
});

describe('craft xp', () => {
  it('marks check-in once per week quest', () => {
    expect(loadCraftXp().xp).toBe(0);
    const a = markChecked('2026-W33', 'career_jump', 25);
    expect(a.gained).toBe(25);
    expect(a.state.xp).toBe(25);
    expect(hasChecked('2026-W33', 'career_jump')).toBe(true);
    const b = markChecked('2026-W33', 'career_jump', 25);
    expect(b.already).toBe(true);
    expect(b.gained).toBe(0);
    expect(levelProgressPct(a.state)).toBe(25);
  });
});

describe('craft answer', () => {
  it('resolves career quest with palace keywords and challenge framing', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const res = resolveCraftAnswer(person, 'career_jump');
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.answer.palaceTitle).toMatch(/官禄/);
    expect(res.answer.keywords.length).toBeGreaterThan(0);
    expect(res.answer.weeklyTask.length).toBeGreaterThan(10);
    expect(res.answer.challenge).toMatch(/破局点/);
    expect(res.answer.challenge).not.toMatch(/煞忌/);
  });
});

describe('spirit roots', () => {
  it('maps majors and sha to fixed axes with +20', () => {
    expect(axisForMajor('太阳')).toBe('guangyao');
    expect(axisForMajor('天机')).toBe('tongbian');
    expect(axisForMajor('巨门')).toBe('zhenshou');
    const axes = scoreSpiritAxes({
      soulMajors: ['太阳', '天机', '巨门'],
      soulAllStars: ['太阳', '天机', '巨门', '擎羊'],
      fortuneMajors: ['天同'],
      dayMasterWx: '木',
    });
    const byId = Object.fromEntries(axes.map((a) => [a.id, a]));
    expect(byId.guangyao.value).toBe(AXIS_GAIN_MAJOR);
    expect(byId.tongbian.value).toBe(AXIS_GAIN_MAJOR);
    expect(byId.zhenshou.value).toBe(AXIS_GAIN_MAJOR);
    expect(byId.yeli.value).toBe(AXIS_GAIN_MAJOR);
    expect(byId.yeli.sources).toContain('擎羊');
    expect(byId.lingyun.value).toBe(AXIS_GAIN_FORTUNE + AXIS_GAIN_DAY_MASTER);
    expect(byId.wenyang.lit).toBe(false);
    expect(axes.filter((a) => a.lit).length).toBe(5);
  });

  it('resolves panel from person birth chart', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const res = resolveSpiritRootPanel(person);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.panel.axes).toHaveLength(6);
    expect(res.panel.tagline).toMatch(/初始天赋/);
    expect(res.panel.wuxing.length).toBe(5);
    expect(res.panel.litCount).toBeGreaterThanOrEqual(0);
  });
});

describe('spirit year buff', () => {
  it('maps 化忌 to soft axis down and yeli up', () => {
    const { effects } = effectsForYearMutagen('廉贞', '忌');
    expect(effects.some((e) => e.axis === 'tongbian' && e.mult === 0.7)).toBe(true);
    expect(effects.some((e) => e.axis === 'yeli' && e.mult === 1.6)).toBe(true);
  });

  it('clamps composed multipliers', () => {
    expect(clampBuffMult(0.1)).toBe(BUFF_MULT_MIN);
    expect(clampBuffMult(3)).toBe(BUFF_MULT_MAX);
    const entries = buildBuffEntriesFromMutagen(['太阳', '武曲', '天机', '廉贞'], 2026);
    expect(entries).toHaveLength(4);
    const mults = composeMultByAxis(entries);
    for (const v of Object.values(mults)) {
      expect(v).toBeGreaterThanOrEqual(BUFF_MULT_MIN);
      expect(v).toBeLessThanOrEqual(BUFF_MULT_MAX);
    }
  });

  it('keeps permanent score and shows effective value', () => {
    const permanent: CraftAxisScore[] = [
      {
        id: 'tongbian',
        label: '通变',
        sub: 'x',
        value: 40,
        lit: true,
        sources: ['天机'],
      },
      {
        id: 'yeli',
        label: '业力',
        sub: 'x',
        value: 20,
        lit: true,
        sources: [],
      },
    ];
    const next = applyBuffToAxes(permanent, {
      guangyao: 1,
      tongbian: 0.7,
      wenyang: 1,
      zhenshou: 1,
      lingyun: 1,
      yeli: 1.6,
    });
    expect(next.find((a) => a.id === 'tongbian')?.permanentValue).toBe(40);
    expect(next.find((a) => a.id === 'tongbian')?.value).toBe(28);
    expect(next.find((a) => a.id === 'yeli')?.value).toBe(32);
  });

  it('resolves panel with year buff pack', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const res = resolveSpiritRootWithGrowth(person, { year: 2026, month: 6 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.panel.yearBuff?.year).toBe(2026);
    expect(res.panel.yearBuff?.month).toBe(6);
    expect(res.panel.yearBuff?.entries.length).toBeGreaterThan(0);
    expect(res.panel.yearBuff?.monthEntries.length).toBeGreaterThan(0);
    expect(res.panel.axes.every((a) => typeof a.permanentValue === 'number')).toBe(true);
  });

  it('deepens baziHint with pattern and marks yong/ji on wuxing', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const res = resolveSpiritRootWithGrowth(person, { year: 2026, month: 6 });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.panel.patternYong).toBeTruthy();
    expect(res.panel.patternYong!.patternName.length).toBeGreaterThan(2);
    const hint = res.panel.yearBuff?.baziHint ?? '';
    expect(hint).toMatch(/格局叙事不改系数|弱叠乘|喜用/);
    expect(hint).toContain(res.panel.patternYong!.patternName);
    expect(hint).toContain(res.panel.patternYong!.bodyBand);
    const roles = res.panel.wuxing.map((w) => w.yongRole).filter(Boolean);
    expect(roles.length).toBeGreaterThan(0);
  });

  it('stacks 八字流月十神 weaker than 流年十神 into buff pack', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const pack = resolveYearBuffPack(person, 2026, '', 6);
    const baziYear = pack.entries.filter((e) => e.lane === 'bazi');
    const baziMonth = pack.monthEntries.filter((e) => e.lane === 'bazi');
    expect(baziYear.length).toBeGreaterThan(0);
    expect(baziMonth.length).toBeGreaterThan(0);
    expect(baziMonth[0]!.title).toMatch(/^流月·/);
    const yearDelta = Math.abs((baziYear[0]!.effects[0]?.mult ?? 1) - 1);
    const monthDelta = Math.abs((baziMonth[0]!.effects[0]?.mult ?? 1) - 1);
    expect(monthDelta).toBeLessThan(yearDelta);
    const a = resolveYearBuffPack(person, 2026, '', 3);
    const b = resolveYearBuffPack(person, 2026, '', 9);
    const am = a.monthEntries.find((e) => e.lane === 'bazi');
    const bm = b.monthEntries.find((e) => e.lane === 'bazi');
    expect(am?.id).not.toBe(bm?.id);
  });

  it('stacks year × month multipliers', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const a = resolveYearBuffPack(person, 2026, '', 3);
    const b = resolveYearBuffPack(person, 2026, '', 9);
    expect(a.month).toBe(3);
    expect(b.month).toBe(9);
    expect(a.monthMutagenLine).not.toBe(b.monthMutagenLine);
    const yearOnly = composeMultByAxis(a.entries);
    const stacked = a.multByAxis;
    // 叠乘后至少有一轴与「仅流年」不同（或月四化空则相等）
    if (a.monthEntries.length > 0) {
      const changed = CRAFT_AXES.some((ax) => Math.abs(stacked[ax.id] - yearOnly[ax.id]) > 1e-9);
      expect(changed).toBe(true);
    }
    for (const v of Object.values(stacked)) {
      expect(v).toBeGreaterThanOrEqual(BUFF_MULT_MIN);
      expect(v).toBeLessThanOrEqual(BUFF_MULT_MAX);
    }
  });

  it('includes 大运十神 and dampens same-axis stack', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const pack = resolveYearBuffPack(person, 2026, '', 6);
    expect(pack.entries.some((e) => e.baziLayer === 'dayun')).toBe(true);
    const fake: YearBuffEntry[] = [
      {
        id: 'a',
        title: 'a',
        kind: '禄',
        star: 'x',
        effects: [{ axis: 'guangyao', mult: 1.2 }],
        effectLabel: '',
        advice: '',
      },
      {
        id: 'b',
        title: 'b',
        kind: '权',
        star: 'y',
        effects: [{ axis: 'guangyao', mult: 1.2 }],
        effectLabel: '',
        advice: '',
      },
      {
        id: 'c',
        title: 'c',
        kind: '科',
        star: 'z',
        effects: [{ axis: 'guangyao', mult: 1.2 }],
        effectLabel: '',
        advice: '',
      },
    ];
    const raw = 1.2 * 1.2 * 1.2;
    const detailed = composeMultByAxisDetailed(fake);
    expect(detailed.harmonized).toBe(true);
    expect(detailed.note).toMatch(/调和/);
    expect(detailed.multByAxis.guangyao).toBeLessThan(clampBuffMult(raw));
  });
});
