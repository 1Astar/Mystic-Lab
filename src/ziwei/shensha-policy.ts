/**
 * 神煞三层策略：图鉴全 · 排盘精 · 深度再筛
 * - 图鉴：完整词库（shensha-lore）
 * - 排盘：只露命中且影响明显的项
 * - 深度：再挑最值得讲的几条
 */
import { getShenshaLore } from './shensha-lore.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

/** 排盘默认露：影响面大、实务常提 */
const PLATE_ALWAYS = new Set([
  '红鸾',
  '天喜',
  '天姚',
  '咸池',
  '孤辰',
  '寡宿',
  '华盖',
  '天刑',
  '阴煞',
  '天德',
  '月德',
  '天空',
  '旬空',
  '空亡',
  '截路',
  '截空',
  '天哭',
  '天虚',
  '天伤',
  '天使',
  '破碎',
  '蜚廉',
  '飞廉',
  '劫杀',
  '劫煞',
  '将星',
  '大耗',
  '白虎',
  '丧门',
  '贯索',
  '官符',
  '灾煞',
  '亡神',
  '天煞',
]);

/** 仅关键宫才露（落对宫才算「影响明显」） */
const PLATE_KEY_PALACE: Record<string, string[]> = {
  天才: ['命宫', '子女', '官禄'],
  天官: ['命宫', '官禄', '父母', '迁移'],
  天福: ['命宫', '福德', '财帛'],
  天厨: ['命宫', '财帛', '福德', '父母'],
  天寿: ['命宫', '疾厄', '父母'],
  天月: ['疾厄', '命宫'],
  龙池: ['命宫', '福德', '官禄', '子女'],
  凤阁: ['命宫', '福德', '官禄'],
  三台: ['命宫', '官禄', '迁移'],
  八座: ['命宫', '官禄', '迁移'],
  天贵: ['命宫', '官禄'],
  恩光: ['命宫', '官禄', '父母'],
  解神: ['命宫', '疾厄', '福德'],
  年解: ['命宫', '疾厄', '福德'],
  攀鞍: ['命宫', '官禄', '迁移'],
};

/** 长生十二：排盘只露极端/关键态，避免每宫都贴满 */
const PLATE_CHANGSHENG = new Set([
  '长生',
  '沐浴',
  '冠带',
  '临官',
  '帝旺',
  '衰',
  '病',
  '死',
  '墓',
  '绝',
  '胎',
  '养',
]);

/** 深度解析权重（越高越优先讲） */
const DEEP_WEIGHT: Record<string, number> = {
  红鸾: 9,
  天喜: 8,
  天姚: 8,
  咸池: 7,
  孤辰: 8,
  寡宿: 8,
  华盖: 7,
  天刑: 8,
  阴煞: 7,
  天空: 8,
  旬空: 9,
  空亡: 9,
  截路: 9,
  截空: 9,
  天伤: 8,
  天使: 6,
  天哭: 6,
  天虚: 6,
  天德: 7,
  月德: 6,
  破碎: 6,
  劫杀: 8,
  劫煞: 8,
  将星: 7,
  大耗: 7,
  白虎: 8,
  丧门: 7,
  贯索: 7,
  官符: 7,
  灾煞: 8,
  亡神: 7,
  天煞: 7,
  天才: 5,
  天官: 5,
  天福: 5,
  帝旺: 6,
  沐浴: 5,
  绝: 6,
  墓: 5,
  长生: 4,
};

const KEY_PALACE_BONUS: Record<string, number> = {
  命宫: 4,
  身宫: 3,
  夫妻: 3,
  官禄: 2,
  财帛: 2,
  疾厄: 3,
  福德: 2,
  迁移: 1,
  子女: 1,
};

export type DeepShenshaHit = {
  name: string;
  palace: string;
  epithet: string;
  oneLiner: string;
  score: number;
  why: string;
};

function canon(name: string): string {
  return name.replace(/星$/, '').trim();
}

/** 该神煞是否值得在排盘格上露出 */
export function shouldShowOnPlate(name: string, palaceName: string): boolean {
  const key = canon(name);
  if (PLATE_ALWAYS.has(key)) return true;
  const allowed = PLATE_KEY_PALACE[key];
  if (allowed) return allowed.includes(palaceName);
  return false;
}

/** 过滤杂曜/神煞：辅星 minors 不走此滤（仍全露） */
export function filterPlateAdjectives<T extends { name: string }>(
  adjectives: T[],
  palaceName: string,
): T[] {
  return adjectives.filter((s) => shouldShowOnPlate(s.name, palaceName));
}

type SeriesItem = { kind: 'changsheng' | 'boshi' | 'jiangqian' | 'suiqian'; name: string };

/**
 * 十二神排盘：
 * - 长生：仅极端/关键态
 * - 博士/将前/岁前：默认不贴；命宫或身宫所在宫，且名在高影响表才露
 */
export function filterPlateSeriesForPalace(
  palace: Pick<PalaceSnap, 'name' | 'isBody' | 'series'>,
): SeriesItem[] {
  if (!palace.series?.length) return [];
  const core = palace.name === '命宫' || palace.isBody;
  const out: SeriesItem[] = [];
  for (const s of palace.series) {
    if (s.kind === 'changsheng') {
      if (PLATE_CHANGSHENG.has(canon(s.name))) out.push(s);
      continue;
    }
    if (core && shouldShowOnPlate(s.name, palace.name)) out.push(s);
  }
  return out;
}

function palaceBonus(name: string, isBody: boolean): number {
  let n = KEY_PALACE_BONUS[name] ?? 0;
  if (isBody) n += 2;
  return n;
}

function deepWhy(name: string, palace: string): string {
  const lore = getShenshaLore(name);
  const tip = lore?.oneLiner ?? '细部色调';
  if (palace === '命宫') return `落命宫：${tip}`;
  if (palace === '夫妻') return `落夫妻：${tip}`;
  if (palace === '疾厄') return `落疾厄：${tip}`;
  if (palace === '官禄') return `落官禄：${tip}`;
  return `落${palace}：${tip}`;
}

/**
 * 深度解析用：从全盘命中神煞里再筛最重要的几条
 * @param limit 默认 5
 */
export function pickDeepShenshaHighlights(
  view: Pick<ZiweiChartView, 'palaces' | 'soulPalace' | 'bodyPalace'>,
  limit = 5,
): DeepShenshaHit[] {
  const best = new Map<string, DeepShenshaHit>();

  for (const p of view.palaces) {
    const bonus = palaceBonus(p.name, p.isBody);
    const pool = [
      ...p.adjectives.map((s) => s.name),
      ...(p.series ?? []).map((s) => s.name),
    ];
    for (const raw of pool) {
      const name = canon(raw);
      const weight = DEEP_WEIGHT[name];
      if (!weight) continue;
      const score = weight + bonus;
      const lore = getShenshaLore(name);
      const hit: DeepShenshaHit = {
        name,
        palace: p.name,
        epithet: lore?.epithet ?? name,
        oneLiner: lore?.oneLiner ?? '',
        score,
        why: deepWhy(name, p.name),
      };
      const prev = best.get(name);
      if (!prev || hit.score > prev.score) best.set(name, hit);
    }
  }

  return [...best.values()].sort((a, b) => b.score - a.score).slice(0, limit);
}

/**
 * 本盘神煞总览：排盘精露（plate 策略）+ 有词条的命中，供定调总览串联图鉴/弹窗
 */
export function listChartShenshaOverview(
  view: Pick<ZiweiChartView, 'palaces'>,
): DeepShenshaHit[] {
  const best = new Map<string, DeepShenshaHit>();

  for (const p of view.palaces) {
    const bonus = palaceBonus(p.name, p.isBody);
    for (const s of filterPlateAdjectives(p.adjectives, p.name)) {
      const name = canon(s.name);
      const lore = getShenshaLore(name);
      if (!lore && !DEEP_WEIGHT[name]) continue;
      const score = (DEEP_WEIGHT[name] ?? 1) + bonus;
      const hit: DeepShenshaHit = {
        name,
        palace: p.name,
        epithet: lore?.epithet ?? name,
        oneLiner: lore?.oneLiner ?? '',
        score,
        why: deepWhy(name, p.name),
      };
      const prev = best.get(name);
      if (!prev || hit.score > prev.score) best.set(name, hit);
    }
    for (const s of filterPlateSeriesForPalace(p)) {
      const name = canon(s.name);
      const lore = getShenshaLore(name);
      if (!lore && !DEEP_WEIGHT[name]) continue;
      const score = (DEEP_WEIGHT[name] ?? 1) + bonus;
      const hit: DeepShenshaHit = {
        name,
        palace: p.name,
        epithet: lore?.epithet ?? name,
        oneLiner: lore?.oneLiner ?? '',
        score,
        why: deepWhy(name, p.name),
      };
      const prev = best.get(name);
      if (!prev || hit.score > prev.score) best.set(name, hit);
    }
  }

  return [...best.values()].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name, 'zh'));
}

/** 图鉴分组元数据（百科完整展示用） */
export const SHENSHA_CODEX_GROUPS: Array<{
  id: 'adjective' | 'changsheng' | 'boshi' | 'jiangqian' | 'suiqian' | 'misc';
  title: string;
  blurb: string;
  /** 固定名录（保证十二神齐全；词库缺的仍可挂名） */
  roster?: string[];
}> = [
  {
    id: 'adjective',
    title: '杂曜神煞',
    blurb: '本命杂曜与常用神煞 · 百科全收录',
  },
  {
    id: 'changsheng',
    title: '长生十二神',
    blurb: '长生 → 养：领域生命周期',
    roster: [
      '长生',
      '沐浴',
      '冠带',
      '临官',
      '帝旺',
      '衰',
      '病',
      '死',
      '墓',
      '绝',
      '胎',
      '养',
    ],
  },
  {
    id: 'boshi',
    title: '博士十二神',
    blurb: '博士 → 官府：流年侧文书与吉凶色',
    roster: [
      '博士',
      '力士',
      '青龙',
      '小耗',
      '将军',
      '奏书',
      '飞廉',
      '喜神',
      '病符',
      '大耗',
      '伏兵',
      '官府',
    ],
  },
  {
    id: 'jiangqian',
    title: '将前十二神',
    blurb: '将星 → 亡神：将星系流年神',
    roster: [
      '将星',
      '攀鞍',
      '岁驿',
      '息神',
      '华盖',
      '劫煞',
      '灾煞',
      '天煞',
      '指背',
      '咸池',
      '月煞',
      '亡神',
    ],
  },
  {
    id: 'suiqian',
    title: '岁前十二神',
    blurb: '岁建 → 病符：岁君系流年神',
    roster: [
      '岁建',
      '晦气',
      '丧门',
      '贯索',
      '官符',
      '小耗',
      '大耗',
      '龙德',
      '白虎',
      '天德',
      '吊客',
      '病符',
    ],
  },
];
