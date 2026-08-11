import type { BaziChart } from './cast.ts';
import type { SeasonLabel, WuXing } from './elements.ts';
import {
  CAREER_BY_CAT,
  DOMAIN_BY_MONTH,
  DOMAIN_BY_STRENGTH,
  DOMAIN_BY_WX,
  DOMAIN_EXTRA,
  INNER_STRONG,
  INNER_WEAK,
  pickLine,
  RELATION_LINES,
  STRENGTH_MOD,
  WEALTH_LINES,
  WX_TRAIT,
} from './portrait-copy.ts';
import type { BaziPortrait, PortraitDomainCard } from './portrait-types.ts';
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

type DomainKey = keyof typeof DOMAIN_EXTRA;

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

function relationshipLine(
  chart: BaziChart,
  seed: number,
  gender: BuildPortraitOpts['gender'],
): string {
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
 * 用法 ← 日主五行优先；小心 ← 月令窗口优先，再叠强弱。
 * 缺省回落通用模板。
 */
function domainExtras(
  key: DomainKey,
  seed: number,
  wx: WuXing | '',
  monthCat: TenGodCategory | null,
  strength: SeasonLabel,
): { tip: string; watch: string } {
  const generic = DOMAIN_EXTRA[key];
  const byWx = wx ? DOMAIN_BY_WX[wx][key] : null;
  const byMonth = monthCat ? DOMAIN_BY_MONTH[monthCat][key] : undefined;
  const byStr = DOMAIN_BY_STRENGTH[strength]?.[key as 'personality' | 'inner'];

  const tip =
    byWx?.tip ||
    byMonth?.tip ||
    byStr?.tip ||
    pickLine([...generic.tip], seed);

  const watch =
    byMonth?.watch ||
    byStr?.watch ||
    byWx?.watch ||
    pickLine([...generic.watch], seed + 3);

  return { tip, watch };
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

  const personality = `${traitA}。日常里更常显出：${traitB}。${mod}。`;
  const career = careerLine(chart, seed + 2);
  const relationship = relationshipLine(chart, seed + 3, gender);
  const wealth = wealthLine(chart, seed + 4);
  const innerWork = innerLine(chart, strength, seed + 5);
  const monthCat = monthCategory(chart);

  const pExtra = domainExtras('personality', seed + 10, wx, monthCat, strength);
  const cExtra = domainExtras('career', seed + 20, wx, monthCat, strength);
  const rExtra = domainExtras('relationship', seed + 30, wx, monthCat, strength);
  const wExtra = domainExtras('wealth', seed + 40, wx, monthCat, strength);
  const iExtra = domainExtras('inner', seed + 50, wx, monthCat, strength);

  const domains: PortraitDomainCard[] = [
    {
      id: 'personality',
      title: '性格底色',
      lead: personality,
      tip: pExtra.tip,
      watch: pExtra.watch,
    },
    {
      id: 'career',
      title: '事业倾向',
      lead: career,
      tip: cExtra.tip,
      watch: cExtra.watch,
    },
    {
      id: 'relationship',
      title: '关系模式',
      lead: relationship,
      tip: rExtra.tip,
      watch: rExtra.watch,
    },
    {
      id: 'wealth',
      title: '财富方式',
      lead: wealth,
      tip: wExtra.tip,
      watch: wExtra.watch,
    },
    {
      id: 'inner',
      title: '内在课题',
      lead: innerWork,
      tip: iExtra.tip,
      watch: iExtra.watch,
    },
  ];

  const themes: [string, string, string] = [
    shortTheme(personality),
    shortTheme(career),
    shortTheme(innerWork),
  ];

  const domainsLead = `五面速览：${keyword}。用法贴你日主气场，小心贴当令窗口——对照日常会更像「这盘」。`;

  return {
    keyword,
    domainsLead,
    personality,
    career,
    relationship,
    wealth,
    innerWork,
    domains,
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
