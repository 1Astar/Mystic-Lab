/**
 * 生时校准 v2 · 当日各时辰差异特征包
 * 固定年月日，对 12 时辰分别 cast，提取时柱十神 / 合冲 / 天气感 / 行为侧写。
 * 结构参考 react-8char TRAITS（时柱判定），底座走本项目 cast（含真太阳时）。
 */
import type { LifeProfileInput } from '../life/types.ts';
import { castBaziChart, type BaziChart } from './cast.ts';
import { BRANCH_WUXING, STEM_WUXING, type WuXing } from './elements.ts';
import { LIU_CHONG, LIU_HAI, LIU_HE } from './relations.ts';
import {
  listHourCandidates,
  SHICHEN_MID,
  type HourCandidate,
} from './rectify-candidates.ts';
import { categorizeTenGod, type TenGodCategory } from './ten-gods.ts';

export type ShichenTraitId =
  | 'action'
  | 'steady'
  | 'talk'
  | 'sensitive'
  | 'lead'
  | 'study'
  | 'money'
  | 'charm'
  | 'travel'
  | 'health';

export type ShichenDiffProfile = {
  branch: string;
  midHour: number;
  birthHour: string;
  label: string;
  clockRange: string;
  hourPillar: string;
  dayPillar: string;
  dayMaster: string;
  /** 时干十神 */
  stemGod: string;
  /** 时支本气藏干十神 */
  branchMainGod: string;
  stemWx: WuXing | '';
  branchWx: WuXing | '';
  tenGodCats: TenGodCategory[];
  /** 时支 vs 日支 */
  vsDay: { kind: '冲' | '合' | '害' | null; label: string };
  /** 时支 vs 年支 */
  vsYear: { kind: '冲' | '合' | '害' | null; label: string };
  /** 天气感 metaphor（基于时支五行 + 时段） */
  weatherMetaphor: string;
  /** 行为侧写标签 id */
  behaviorTraitIds: ShichenTraitId[];
  /** 外貌倾向（规则模板，非医学） */
  appearanceHints: string[];
  /** 晚子(23) 与早子(0) 日柱是否分裂 */
  ziBoundarySplit: boolean;
  /** 相对「日中基准盘」日柱是否改变（通常仅晚子边界） */
  dayChanged: boolean;
};

export type ShichenTraitDef = {
  id: ShichenTraitId;
  label: string;
  test: (p: ShichenDiffProfile) => boolean;
};

/** 与 react-8char TRAITS 同构：只看随时辰而变的信息 */
export const SHICHEN_TRAITS: ShichenTraitDef[] = [
  {
    id: 'action',
    label: '行动派·果断·闲不住',
    test: (p) => p.stemGod === '七杀' || p.branchMainGod === '七杀',
  },
  {
    id: 'steady',
    label: '性子稳·求安稳·有耐性',
    test: (p) =>
      ['正官', '食神'].includes(p.stemGod) || ['正官', '食神'].includes(p.branchMainGod),
  },
  {
    id: 'talk',
    label: '口才好·点子多·才艺外露',
    test: (p) =>
      ['伤官', '食神'].includes(p.stemGod) || ['伤官', '食神'].includes(p.branchMainGod),
  },
  {
    id: 'sensitive',
    label: '心思细腻·敏感多虑',
    test: (p) =>
      p.stemGod === '偏印' || p.branchMainGod === '偏印' || p.vsDay.kind === '害',
  },
  {
    id: 'lead',
    label: '主见强·不易服管',
    test: (p) =>
      ['比肩', '劫财'].includes(p.stemGod) || ['比肩', '劫财'].includes(p.branchMainGod),
  },
  {
    id: 'study',
    label: '书卷气·爱学习钻研',
    test: (p) =>
      ['正印', '偏印'].includes(p.stemGod) || ['正印', '偏印'].includes(p.branchMainGod),
  },
  {
    id: 'money',
    label: '理财务实·钱财有算计',
    test: (p) =>
      ['正财', '偏财'].includes(p.stemGod) || ['正财', '偏财'].includes(p.branchMainGod),
  },
  {
    id: 'charm',
    label: '人缘旺·异性缘显眼',
    test: (p) => p.tenGodCats.includes('cai') && (p.branchWx === '火' || p.branchWx === '水'),
  },
  {
    id: 'travel',
    label: '常外出奔波 / 早年易离家',
    test: (p) => p.vsDay.kind === '冲' || p.vsYear.kind === '冲',
  },
  {
    id: 'health',
    label: '幼时体弱或有明显伤病意象',
    test: (p) =>
      p.vsDay.kind === '冲' ||
      (p.stemGod === '七杀' && p.tenGodCats.includes('yin')),
  },
];

const APPEARANCE_BY_WX: Record<WuXing, string[]> = {
  木: ['骨架偏修长', '手指修长', '面型偏长'],
  火: ['五官立体', '眼神偏锐', '发际或额部较显眼'],
  土: ['面型偏圆润', '体态偏厚实', '下巴较稳'],
  金: ['骨相清朗', '皮肤偏紧或偏白', '轮廓分明'],
  水: ['眼神柔和', '脸型偏圆', '气质偏内敛'],
};

const WEATHER_BY_BAND: Record<string, string> = {
  子: '月夜星稀 / 午夜寒风',
  丑: '深夜未明 / 静待鸡鸣',
  寅: '平旦微光 / 阳气初升',
  卯: '清晨暖阳 / 微风舒展',
  辰: '食时露珠 / 表面温和',
  巳: '隅中日升 / 热力蓄势',
  午: '正午烈日 / 雷阵雨式爆发',
  未: '日昳偏西 / 热气未散',
  申: '晡时收束 / 务实赶工',
  酉: '日入暮色 / 锋芒内收',
  戌: '黄昏灯火 / 责任加重',
  亥: '人定深夜 / 心思深潜',
};

function pairKind(
  a: string,
  b: string,
): { kind: '冲' | '合' | '害' | null; label: string } {
  if (!a || !b || a === '—' || b === '—') return { kind: null, label: '' };
  for (const [x, y] of LIU_CHONG) {
    if ((x === a && y === b) || (x === b && y === a)) {
      return { kind: '冲', label: `${x}${y}相冲` };
    }
  }
  for (const [x, y, el] of LIU_HE) {
    if ((x === a && y === b) || (x === b && y === a)) {
      return { kind: '合', label: `${x}${y}合化${el}` };
    }
  }
  for (const [x, y] of LIU_HAI) {
    if ((x === a && y === b) || (x === b && y === a)) {
      return { kind: '害', label: `${x}${y}相害` };
    }
  }
  return { kind: null, label: '' };
}

function hourCellOf(chart: BaziChart) {
  return chart.pillars.find((p) => p.key === 'hour');
}

function dayPillarOf(chart: BaziChart): string {
  const day = chart.pillars.find((p) => p.key === 'day');
  if (!day || day.empty) return '';
  return `${day.stem}${day.branch}`;
}

function branchMainGod(chart: BaziChart): string {
  const hour = hourCellOf(chart);
  if (!hour || hour.empty) return '';
  return (hour.hideGods[0] ?? '').trim();
}

function catsFromGods(...gods: string[]): TenGodCategory[] {
  const set = new Set<TenGodCategory>();
  for (const g of gods) {
    const c = categorizeTenGod(g);
    if (c) set.add(c);
  }
  return [...set];
}

function appearanceHints(branchWx: WuXing | '', stemWx: WuXing | ''): string[] {
  const out: string[] = [];
  if (branchWx && APPEARANCE_BY_WX[branchWx]) out.push(...APPEARANCE_BY_WX[branchWx].slice(0, 2));
  if (stemWx && stemWx !== branchWx && APPEARANCE_BY_WX[stemWx]) {
    out.push(APPEARANCE_BY_WX[stemWx][0]!);
  }
  return [...new Set(out)].slice(0, 3);
}

function checkZiBoundarySplit(profile: LifeProfileInput): {
  split: boolean;
  earlyDay: string;
  lateDay: string;
} {
  const early = castBaziChart(
    { ...profile, birthHour: '0:00' },
    new Date().getFullYear(),
    { includeLiunian: false },
  );
  const late = castBaziChart(
    { ...profile, birthHour: '23:00' },
    new Date().getFullYear(),
    { includeLiunian: false },
  );
  if ('error' in early || 'error' in late) {
    return { split: false, earlyDay: '', lateDay: '' };
  }
  const earlyDay = dayPillarOf(early);
  const lateDay = dayPillarOf(late);
  return {
    split: Boolean(earlyDay && lateDay && earlyDay !== lateDay),
    earlyDay,
    lateDay,
  };
}

function profileFromCandidate(
  cand: HourCandidate,
  chart: BaziChart,
  baselineDay: string,
  ziSplit: boolean,
): ShichenDiffProfile | null {
  const hour = hourCellOf(chart);
  if (!hour || hour.empty) return null;
  const meta = SHICHEN_MID.find((s) => s.branch === cand.branch);
  const stemGod = hour.stemGod.trim();
  const mainGod = branchMainGod(chart);
  const stemWx = STEM_WUXING[hour.stem] ?? '';
  const branchWx = BRANCH_WUXING[hour.branch] ?? '';
  const dayPillar = dayPillarOf(chart);
  const dayBranch = chart.dayBranch;
  const yearBranch = chart.yearBranch;

  const draft: ShichenDiffProfile = {
    branch: cand.branch,
    midHour: cand.midHour,
    birthHour: cand.birthHour,
    label: cand.label,
    clockRange: cand.label.includes('钟表约')
      ? (cand.label.split('·').slice(1).join('·').trim() || meta?.clockRange || '')
      : meta?.clockRange ?? '',
    hourPillar: cand.hourPillar,
    dayPillar,
    dayMaster: chart.dayMaster,
    stemGod,
    branchMainGod: mainGod,
    stemWx,
    branchWx,
    tenGodCats: catsFromGods(stemGod, mainGod),
    vsDay: pairKind(hour.branch, dayBranch),
    vsYear: pairKind(hour.branch, yearBranch),
    weatherMetaphor: WEATHER_BY_BAND[cand.branch] ?? '时辰气场待辨',
    behaviorTraitIds: [],
    appearanceHints: appearanceHints(branchWx, stemWx),
    ziBoundarySplit: cand.branch === '子' ? ziSplit : false,
    dayChanged: Boolean(baselineDay && dayPillar && dayPillar !== baselineDay),
  };
  draft.behaviorTraitIds = SHICHEN_TRAITS.filter((t) => {
    try {
      return t.test(draft);
    } catch {
      return false;
    }
  }).map((t) => t.id);
  return draft;
}

/**
 * 同日十二时辰差异包。日期无效或全失败 → []。
 * 可复现：同一 profile 多次调用结果一致。
 */
export function buildShichenDiffProfiles(profile: LifeProfileInput): ShichenDiffProfile[] {
  const cands = listHourCandidates(profile, { kind: 'all' });
  if (!cands.length) return [];

  const zi = checkZiBoundarySplit(profile);
  const noon = castBaziChart(
    { ...profile, birthHour: '12:00' },
    new Date().getFullYear(),
    { includeLiunian: false },
  );
  const baselineDay = 'error' in noon ? '' : dayPillarOf(noon);

  const out: ShichenDiffProfile[] = [];
  for (const cand of cands) {
    const chart = castBaziChart(
      { ...profile, birthHour: cand.birthHour },
      new Date().getFullYear(),
      { includeLiunian: false },
    );
    if ('error' in chart) continue;
    const row = profileFromCandidate(cand, chart, baselineDay, zi.split);
    if (row) out.push(row);
  }
  return out;
}

/** 特征位图（与 SHICHEN_TRAITS 顺序一致） */
export function traitHitBitmap(p: ShichenDiffProfile): boolean[] {
  return SHICHEN_TRAITS.map((t) => {
    try {
      return t.test(p);
    } catch {
      return false;
    }
  });
}

/** 两时辰差异摘要（剧本对照 / 线索弹窗用） */
export function summarizePairDiff(
  a: ShichenDiffProfile,
  b: ShichenDiffProfile,
): string[] {
  const lines: string[] = [];
  if (a.hourPillar !== b.hourPillar) {
    lines.push(`时柱：${a.branch}时 ${a.hourPillar} vs ${b.branch}时 ${b.hourPillar}`);
  }
  if (a.stemGod !== b.stemGod) {
    lines.push(`时干十神：${a.stemGod} vs ${b.stemGod}`);
  }
  if (a.weatherMetaphor !== b.weatherMetaphor) {
    lines.push(`气场：${a.weatherMetaphor} vs ${b.weatherMetaphor}`);
  }
  if (a.vsDay.label !== b.vsDay.label) {
    lines.push(
      `对日支：${a.vsDay.label || '无明显冲合'} vs ${b.vsDay.label || '无明显冲合'}`,
    );
  }
  const aTraits = a.behaviorTraitIds.join('、') || '无突出标签';
  const bTraits = b.behaviorTraitIds.join('、') || '无突出标签';
  if (aTraits !== bTraits) {
    lines.push(`行为侧写：${aTraits} vs ${bTraits}`);
  }
  return lines;
}

export function diffProfileByBranch(
  profiles: ShichenDiffProfile[],
  branch: string,
): ShichenDiffProfile | undefined {
  const b = branch.replace(/时$/, '').trim();
  return profiles.find((p) => p.branch === b);
}
