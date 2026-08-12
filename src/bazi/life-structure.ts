/**
 * 八字生命结构：五行属性 + 定位短文 + 大运阶段（禁「缺什么」）
 * 造命「五行磁场」应读本模块同源数据。
 */
import type { PersonProfile } from '../life/types.ts';
import type { BaziChart } from './cast.ts';
import { dayStrengthOf } from './bazi-facts.ts';
import { wuxingClass, type WuXing } from './elements.ts';
import type { LuckCycles } from './luck-cycles.ts';
import { buildLuckCycles } from './luck-cycles.ts';
import { buildBaziPortrait } from './portrait-template.ts';
import { WX_TRAIT } from './portrait-copy.ts';
import { scoreChartWx } from './sense-energy.ts';
import {
  dayunLoreHint,
  dayunLoreStageTopic,
  getJiaziDayunLore,
} from './codex-jiazi-dayun-lore.ts';

const ORDER: WuXing[] = ['木', '火', '土', '金', '水'];

const WX_META: Record<WuXing, { growth: string; softStrong: string; softBase: string }> = {
  木: { growth: '成长 / 探索', softStrong: '偏旺', softBase: '底色' },
  火: { growth: '表达 / 热情', softStrong: '偏旺', softBase: '底色' },
  土: { growth: '稳定 / 承载', softStrong: '偏旺', softBase: '底色' },
  金: { growth: '规则 / 判断', softStrong: '偏旺', softBase: '底色' },
  水: { growth: '感知 / 流动', softStrong: '偏旺', softBase: '底色' },
};

export type LifeWuxingBar = {
  wx: WuXing;
  el: WuXing;
  score: number;
  pct: number;
  dayMaster: boolean;
  softLabel: string;
  growth: string;
  tip: string;
  cssClass: string;
};

export type LifeStageBlock = {
  title: string;
  range: string;
  topic: string;
  why: string[];
};

export type LifeStructurePack = {
  dayMasterLine: string;
  headline: string;
  bars: LifeWuxingBar[];
  personality: string;
  strength: string;
  environment: string;
  stage: LifeStageBlock | null;
  natalWhy: string[];
};

/** 与造命 WuxingBar 字段兼容的映射 */
export type CraftWuxingBarCompat = {
  el: WuXing;
  count: number;
  pct: number;
  dayMaster: boolean;
};

function softLabelFor(
  wx: WuXing,
  score: number,
  max: number,
  avg: number,
  dayMaster: boolean,
): string {
  if (dayMaster) return '日主底色';
  if (score >= max * 0.92 && score >= avg + 1) return WX_META[wx].softStrong;
  if (score >= avg) return '可多用';
  if (score <= avg - 1.2) return '蓄力';
  return WX_META[wx].softBase;
}

function tipFor(wx: WuXing, softLabel: string, dayMaster: boolean): string {
  const g = WX_META[wx].growth;
  if (dayMaster) return `日主所在：这股「${g}」是你长期自我感的主色。`;
  if (softLabel === '偏旺') return `「${g}」在盘里偏满：适合当主旋律，也宜学会收口。`;
  if (softLabel === '可多用') return `「${g}」够用：做事时可主动调用这股气。`;
  if (softLabel === '蓄力') return `「${g}」此刻偏蓄：不急着硬推，先养再亮。`;
  return `「${g}」是盘面底色之一，可按场合点缀使用。`;
}

/** 五行条：scoreChartWx 同源（造命磁场也走这里） */
export function buildLifeWuxingBars(chart: BaziChart): LifeWuxingBar[] {
  const scores = scoreChartWx(chart);
  const vals = ORDER.map((wx) => scores[wx]);
  const max = Math.max(...vals, 1);
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;

  return ORDER.map((wx) => {
    const score = Math.round(scores[wx] * 10) / 10;
    const dayMaster = chart.dayMasterWx === wx;
    const softLabel = softLabelFor(wx, scores[wx], max, avg, dayMaster);
    return {
      wx,
      el: wx,
      score,
      pct: Math.round((scores[wx] / max) * 100),
      dayMaster,
      softLabel,
      growth: WX_META[wx].growth,
      tip: tipFor(wx, softLabel, dayMaster),
      cssClass: wuxingClass(wx),
    };
  });
}

export function toCraftWuxingBars(bars: LifeWuxingBar[]): CraftWuxingBarCompat[] {
  return bars.map((b) => ({
    el: b.el,
    count: b.score,
    pct: b.pct,
    dayMaster: b.dayMaster,
  }));
}

function stageFromLuck(luck: LuckCycles | null | undefined): LifeStageBlock | null {
  if (!luck) return null;
  const dy = luck.dayun.find((d) => d.current);
  if (!dy) return null;
  if (dy.empty) {
    return {
      title: '童限阶段',
      range: `${dy.startYear}–${dy.endYear} · 约${dy.startAge}–${dy.endAge}岁`,
      topic: '起运前：先长身体与安全感，不必急着给人生下定论。',
      why: ['当前大运格为童限（无干支）', `起运参考：${luck.qiYunLabel || '见排盘'}`],
    };
  }
  const god = dy.stemGod && dy.stemGod !== '—' ? ` · ${dy.stemGod}` : '';
  const lore = getJiaziDayunLore(dy.ganZhi);
  return {
    title: `大运 ${dy.ganZhi}${god}`,
    range: `${dy.startYear}–${dy.endYear} · 约${dy.startAge}–${dy.endAge}岁`,
    topic: dayunLoreStageTopic(dy.ganZhi),
    why: [
      `当前大运 ${dy.ganZhi}${god}`,
      dayunLoreHint(dy.ganZhi),
      `宜推进：${lore.leanIn}`,
      `留意：${lore.watch}`,
      lore.memory,
      `虚岁约 ${dy.startAge}–${dy.endAge}`,
      luck.qiYunLabel ? `起运：${luck.qiYunLabel}` : '',
    ].filter(Boolean),
  };
}

export type BuildLifeStructureOpts = {
  gender?: '' | 'female' | 'male';
  luck?: LuckCycles | null;
  person?: PersonProfile;
  seed?: number;
};

export function buildLifeStructure(
  chart: BaziChart,
  opts: BuildLifeStructureOpts = {},
): LifeStructurePack {
  const bars = buildLifeWuxingBars(chart);
  const portrait = buildBaziPortrait(chart, {
    gender: opts.gender ?? opts.person?.gender,
    seed: opts.seed,
  });
  const strengthLabel = dayStrengthOf(chart);
  const wx = chart.dayMasterWx;
  const trait = wx ? WX_TRAIT[wx][0]! : '先稳住自己的节奏';

  const luck =
    opts.luck !== undefined
      ? opts.luck
      : opts.person
        ? buildLuckCycles(
            opts.person,
            opts.gender ?? opts.person.gender,
            new Date().getFullYear(),
          )
        : null;

  const dayMasterLine = `日主 ${chart.dayMaster}${chart.dayMasterWx ? ` · ${chart.dayMasterWx}` : ''} · 月令「${strengthLabel}」`;

  const natalWhy = [
    dayMasterLine,
    `五行按盘面构成与月令强弱计分（与造命磁场同源）`,
    `定位参考：${portrait.keyword}`,
    '用语只谈偏旺、可多用、底色与蓄力，不做缺口清单。',
  ];

  const careerDomain = portrait.domains.find((d) => d.id === 'career');

  return {
    dayMasterLine,
    headline: portrait.keyword,
    bars,
    personality: portrait.personality || trait,
    strength: portrait.career || portrait.themes[0] || trait,
    environment:
      careerDomain?.tip ||
      '先选能让你稳住输出、节奏自洽的环境，再谈扩张。',
    stage: stageFromLuck(luck),
    natalWhy,
  };
}
