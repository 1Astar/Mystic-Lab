import type { BaziChart } from './cast.ts';
import type { SeasonLabel, WuXing } from './elements.ts';
import {
  CAREER_BY_CAT,
  INNER_STRONG,
  INNER_WEAK,
  pickLine,
  RELATION_LINES,
  STRENGTH_MOD,
  WEALTH_LINES,
  WX_TRAIT,
} from './portrait-copy.ts';
import type { BaziPortrait } from './portrait-types.ts';
import {
  categorizeTenGod,
  collectTenGodLabels,
  countCategories,
  type TenGodCategory,
} from './ten-gods.ts';

export type BuildPortraitOpts = {
  gender?: '' | 'female' | 'male';
  seed?: number;
};

function dayStrength(chart: BaziChart): SeasonLabel {
  const wx = chart.dayMasterWx;
  if (!wx) return '休';
  return chart.season.find((s) => s.label === wx)?.strength ?? '休';
}

function monthCategory(chart: BaziChart): TenGodCategory | null {
  const month = chart.pillars.find((p) => p.key === 'month');
  if (!month || month.empty) return null;
  return categorizeTenGod(month.stemGod);
}

function careerLine(chart: BaziChart, seed: number): string {
  const cat = monthCategory(chart);
  if (cat) return pickLine(CAREER_BY_CAT[cat], seed);
  const counts = countCategories(collectTenGodLabels(chart));
  const ranked = (Object.keys(counts) as TenGodCategory[]).sort(
    (a, b) => counts[b] - counts[a],
  );
  const top = ranked[0];
  if (top && counts[top] > 0) return pickLine(CAREER_BY_CAT[top], seed);
  return '先把「你真正想交付什么」写清楚，再选环境。';
}

function relationshipLine(chart: BaziChart, seed: number, gender: BuildPortraitOpts['gender']): string {
  const counts = countCategories(collectTenGodLabels(chart));
  let base = pickLine(RELATION_LINES, seed);
  if (counts.guan_sha >= 2) {
    base = '关系里对责任与边界更敏感，讨厌含糊承诺';
  } else if (counts.yin >= 2) {
    base = '靠近时更需要被理解与支持，节奏宜慢热';
  }
  if (gender === 'female' && seed % 2 === 0) {
    return `${base}；相处上更在意对方是否愿意共同推进。`;
  }
  if (gender === 'male' && seed % 2 === 0) {
    return `${base}；相处上更在意是否被信任与托付。`;
  }
  return base;
}

function wealthLine(chart: BaziChart, seed: number): string {
  const labels = collectTenGodLabels(chart);
  const counts = countCategories(labels);
  const hasPianCai = labels.some((l) => l.includes('偏财'));
  if (counts.cai >= 2 || hasPianCai) return pickLine(WEALTH_LINES.flow, seed);
  if (counts.cai === 1) return pickLine(WEALTH_LINES.steady, seed);
  if (counts.shi_shang >= 2) return pickLine(WEALTH_LINES.skill, seed);
  return pickLine(WEALTH_LINES.steady, seed + 1);
}

function innerLine(chart: BaziChart, strength: SeasonLabel, seed: number): string {
  const weak = strength === '休' || strength === '囚' || strength === '死';
  let line = pickLine(weak ? INNER_WEAK : INNER_STRONG, seed);
  if (chart.relations.length) {
    line = `${line}；人际结构里也常有拉扯，宜主动对齐。`;
  }
  return line;
}

function shortTheme(text: string, max = 18): string {
  const t = text.replace(/[；。！？].*$/, '').trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

/**
 * 规则模板画像：零术语，禁止 LLM。
 */
export function buildBaziPortrait(
  chart: BaziChart,
  opts?: BuildPortraitOpts,
): BaziPortrait {
  const seed = opts?.seed ?? hashSeed(chart);
  const gender = opts?.gender ?? '';
  const wx = chart.dayMasterWx as WuXing | '';
  const strength = dayStrength(chart);

  const traits = wx ? WX_TRAIT[wx] : ['愿意先看清局面，再决定下一步'];
  const traitA = pickLine(traits, seed);
  const traitB = pickLine(traits, seed + 1);
  const mod = STRENGTH_MOD[strength];
  const keyword = wx ? `${traitA.split('，')[0]}，${mod}` : `先稳住节奏，${mod}`;

  const personality = traitB;
  const career = careerLine(chart, seed + 2);
  const relationship = relationshipLine(chart, seed + 3, gender);
  const wealth = wealthLine(chart, seed + 4);
  const innerWork = innerLine(chart, strength, seed + 5);

  const themes: [string, string, string] = [
    shortTheme(personality),
    shortTheme(career),
    shortTheme(innerWork),
  ];

  return {
    keyword,
    personality,
    career,
    relationship,
    wealth,
    innerWork,
    themes,
    source: 'template',
    generatedAt: new Date().toISOString(),
  };
}

function hashSeed(chart: BaziChart): number {
  const s = `${chart.dayMaster}${chart.dayBranch}${chart.yearBranch}${chart.clockLabel}`;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
