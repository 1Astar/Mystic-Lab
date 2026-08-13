import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart, type BaziChart, type PillarCell } from './cast.ts';
import {
  bodyBandOf,
  detectCongGe,
  detectHuaQi,
  detectZhuanWang,
  patternYongshenCardHtml,
  resolvePatternYongshen,
} from './pattern-yongshen.ts';
import type { WuXing } from './elements.ts';
import { scoreChartWx } from './sense-energy.ts';

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
    expect(pack.boundary).toMatch(/规则推演|扶抑|专旺|从格|化气/);
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
    expect(pack.congTrust).toMatch(/true_tend|false_tend/);
    expect((pack.breakTip || '').length).toBeGreaterThan(4);
    expect(patternYongshenCardHtml(pack)).toMatch(/真从倾向|假从倾向/);
  });

  it('detects 化气 soft when day stem he + month supports', () => {
    const chart = mockChart({
      dayMaster: '甲',
      dayMasterWx: '木',
      monthBranch: '未',
      seasonStrength: '相',
      stemGods: ['比肩', '劫财', '食神', '偏印'],
    });
    chart.pillars = chart.pillars.map((p) => {
      if (p.key === 'day') return { ...p, stem: '甲' };
      if (p.key === 'month') return { ...p, stem: '己', branch: '未' };
      if (p.key === 'year') return { ...p, stem: '己', branch: '丑' };
      return p;
    });
    const scores = scoreChartWx(chart);
    // 抬土分确保过门
    scores['土'] = Math.max(scores['土'] ?? 0, 8);
    const hit = detectHuaQi(chart, { ...scores, 土: 8 });
    expect(hit?.mode).toBe('hua_qi');
    expect(hit?.name).toMatch(/化土/);
    expect(hit?.huaTrust).toMatch(/true_tend|false_tend/);
    expect((hit?.breakTip || '').length).toBeGreaterThan(8);
  });

  it('marks 假化倾向 when 合化气弱于日主原气', () => {
    const chart = mockChart({
      dayMaster: '甲',
      dayMasterWx: '木',
      monthBranch: '未',
      seasonStrength: '相',
      stemGods: ['比肩', '劫财', '食神', '偏印'],
    });
    chart.pillars = chart.pillars.map((p) => {
      if (p.key === 'day') return { ...p, stem: '甲', branch: '寅' };
      if (p.key === 'month') return { ...p, stem: '己', branch: '未' };
      if (p.key === 'year') return { ...p, stem: '甲', branch: '卯' };
      if (p.key === 'hour') return { ...p, stem: '乙', branch: '卯' };
      return p;
    });
    const hit = detectHuaQi(chart, {
      木: 10,
      火: 1,
      土: 3,
      金: 1,
      水: 2,
    });
    expect(hit?.mode).toBe('hua_qi');
    expect(hit?.huaTrust).toBe('false_tend');
    expect(hit?.breakTip).toMatch(/假化/);
    const pack = resolvePatternYongshen({
      ...chart,
      // 尽量让化气优先于专旺/从格：土月 + 甲己
    });
    if (pack.patternMode === 'hua_qi') {
      expect(pack.huaTrust).toBe('false_tend');
      expect(patternYongshenCardHtml(pack)).toMatch(/假化倾向/);
    }
  });

  it('marks 真化倾向 when 合化气明显压过日主原气', () => {
    const chart = mockChart({
      dayMaster: '甲',
      dayMasterWx: '木',
      monthBranch: '未',
      seasonStrength: '旺',
      stemGods: ['比肩', '劫财', '食神', '偏印'],
    });
    chart.pillars = chart.pillars.map((p) => {
      if (p.key === 'day') return { ...p, stem: '甲' };
      if (p.key === 'month') return { ...p, stem: '己', branch: '未' };
      if (p.key === 'year') return { ...p, stem: '己', branch: '丑' };
      if (p.key === 'hour') return { ...p, stem: '戊', branch: '辰' };
      return p;
    });
    const hit = detectHuaQi(chart, {
      木: 2,
      火: 1,
      土: 9,
      金: 1,
      水: 1,
    });
    expect(hit?.huaTrust).toBe('true_tend');
    expect(hit?.breakTip).toMatch(/真化/);
  });

  it('false 从 tip mentions residual 印比 or 杂气', () => {
    const chart = mockChart({
      dayMaster: '甲',
      dayMasterWx: '木',
      monthBranch: '酉',
      seasonStrength: '死',
      // 食伤多但仍有印比 → 假从
      stemGods: ['食神', '伤官', '偏印', '食神'],
    });
    const hit = detectCongGe(chart, '身弱');
    expect(hit?.mode).toBe('cong_er');
    expect(hit?.congTrust).toBe('false_tend');
    expect(hit?.breakTip).toMatch(/假从|印比|杂气/);
  });

  it('zheng pattern has roleTip; 外格 empty roleTip', () => {
    const chart = castBaziChart(PROFILE, 2026, {
      includeLiunian: false,
      gender: 'female',
    });
    if ('error' in chart) return;
    const pack = resolvePatternYongshen(chart);
    if (pack.patternMode === 'zheng') {
      expect(pack.roleTip.length).toBeGreaterThan(4);
      expect(patternYongshenCardHtml(pack)).toContain('py-role');
    }
    const cong = mockChart({
      dayMaster: '甲',
      dayMasterWx: '木',
      monthBranch: '酉',
      seasonStrength: '死',
      stemGods: ['食神', '伤官', '食神', '伤官'],
    });
    const congPack = resolvePatternYongshen(cong);
    expect(congPack.patternMode).not.toBe('zheng');
    expect(congPack.roleTip).toBe('');
  });
});
