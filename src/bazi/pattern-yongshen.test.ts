import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart, type BaziChart, type PillarCell } from './cast.ts';
import {
  bodyBandOf,
  detectCongGe,
  detectZhuanWang,
  patternYongshenCardHtml,
  resolvePatternYongshen,
} from './pattern-yongshen.ts';
import type { WuXing } from './elements.ts';

const PROFILE = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthHour: '8:37',
  birthPlace: '北京',
};

function emptyPillar(
  partial: Partial<PillarCell> & Pick<PillarCell, 'key' | 'title'>,
): PillarCell {
  return {
    stemGod: '',
    stem: '',
    branch: '',
    hideGan: [],
    hideGods: [],
    nayin: '',
    xunKong: '',
    diShi: '',
    ziZuo: '',
    shensha: [],
    ...partial,
  };
}

function mockChart(opts: {
  dayMaster: string;
  dayMasterWx: WuXing;
  monthBranch: string;
  seasonStrength: '旺' | '相' | '休' | '囚' | '死';
  stemGods?: string[];
}): BaziChart {
  const gods = opts.stemGods ?? ['比肩', '劫财', '食神'];
  return {
    pillars: [
      emptyPillar({
        key: 'year',
        title: '年',
        stem: '甲',
        branch: '子',
        stemGod: gods[0] ?? '比肩',
      }),
      emptyPillar({
        key: 'month',
        title: '月',
        stem: '甲',
        branch: opts.monthBranch,
        stemGod: gods[1] ?? '劫财',
      }),
      emptyPillar({
        key: 'day',
        title: '日',
        stem: opts.dayMaster,
        branch: '寅',
        stemGod: '日主',
        hideGods: [gods[2] ?? '食神'],
      }),
      emptyPillar({
        key: 'hour',
        title: '时',
        stem: '乙',
        branch: '卯',
        stemGod: gods[3] ?? gods[0] ?? '比肩',
      }),
    ],
    dayMaster: opts.dayMaster,
    dayMasterWx: opts.dayMasterWx,
    dayBranch: '寅',
    yearBranch: '子',
    relations: [],
    season: [
      { label: '木', strength: opts.dayMasterWx === '木' ? opts.seasonStrength : '休' },
      { label: '火', strength: opts.dayMasterWx === '火' ? opts.seasonStrength : '休' },
      { label: '土', strength: opts.dayMasterWx === '土' ? opts.seasonStrength : '休' },
      { label: '金', strength: opts.dayMasterWx === '金' ? opts.seasonStrength : '休' },
      { label: '水', strength: opts.dayMasterWx === '水' ? opts.seasonStrength : '休' },
    ],
    place: { city: '北京', lng: 116.4, note: 'test' },
    clockLabel: '',
    trueSolarLabel: '',
    hasHour: true,
    liunianYear: 2026,
    birthYear: 2000,
  };
}

describe('pattern-yongshen', () => {
  it('resolves pattern + yong/ji without doom words', () => {
    const chart = castBaziChart(PROFILE, 2026, {
      includeLiunian: false,
      gender: 'female',
    });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const pack = resolvePatternYongshen(chart);
    expect(pack.patternName.length).toBeGreaterThan(2);
    expect(pack.bodyBand).toMatch(/身旺|身弱|中和/);
    expect(pack.yongWx.length).toBeGreaterThan(0);
    expect(pack.headline).toMatch(pack.patternName);
    const blob = `${pack.headline}${pack.playbook}${pack.boundary}${pack.patternWhy}`;
    expect(blob).not.toMatch(/必凶|倒霉|缺什么|死刑/);
    expect(pack.boundary).toMatch(/规则推演|扶抑|专旺|从格/);
  });

  it('bodyBand maps season labels', () => {
    expect(bodyBandOf('旺')).toBe('身旺');
    expect(bodyBandOf('相')).toBe('身旺');
    expect(bodyBandOf('休')).toBe('身弱');
    expect(bodyBandOf('囚')).toBe('身弱');
  });

  it('card html includes 喜用 chips', () => {
    const chart = castBaziChart(PROFILE, 2026, {
      includeLiunian: false,
      gender: 'female',
    });
    if ('error' in chart) return;
    const pack = resolvePatternYongshen(chart);
    const html = patternYongshenCardHtml(pack);
    expect(html).toContain('py-card');
    expect(html).toContain('喜用');
    expect(html).toContain(pack.patternName);
    expect(patternYongshenCardHtml(pack, { compact: true })).toContain('py-compact');
  });

  it('detects 曲直格 when 木专旺条件满足', () => {
    const chart = mockChart({
      dayMaster: '甲',
      dayMasterWx: '木',
      monthBranch: '卯',
      seasonStrength: '旺',
      stemGods: ['比肩', '劫财', '食神', '偏印'],
    });
    // 高木分：scoreChartWx = natal + season；旺 +5 对木
    const scores = {
      木: 12,
      火: 2,
      土: 1,
      金: 1,
      水: 3,
    };
    const hit = detectZhuanWang(chart, scores);
    expect(hit?.name).toBe('曲直格');
    expect(hit?.mode).toBe('zhuan_wang');
    const pack = resolvePatternYongshen({
      ...chart,
      // 让 scoreChartWx 也偏木：多木支
      pillars: chart.pillars.map((p) =>
        p.key === 'year'
          ? { ...p, stem: '甲', branch: '寅' }
          : p.key === 'hour'
            ? { ...p, stem: '乙', branch: '卯' }
            : p,
      ),
    });
    // 可能命中专旺或从旺；至少不应报恐吓
    expect(pack.boundary).toMatch(/专旺|从格|扶抑/);
  });

  it('detects 从儿格软标 when 身弱食伤偏多', () => {
    const chart = mockChart({
      dayMaster: '甲',
      dayMasterWx: '木',
      monthBranch: '酉',
      seasonStrength: '死',
      stemGods: ['食神', '伤官', '食神', '伤官'],
    });
    const hit = detectCongGe(chart, '身弱');
    expect(hit?.mode).toBe('cong_er');
    expect(hit?.name).toMatch(/从儿/);
    const pack = resolvePatternYongshen(chart);
    expect(pack.patternMode).toBe('cong_er');
    expect(pack.yongWx).toContain('火');
    expect(pack.method).toMatch(/从儿/);
  });
});
