/**
 * Lab · 本周只学一件
 * 自然周稳定选题：有盘优先盘上焦点；无盘轮体系基础词。
 */
import { castBaziChart } from '../bazi/cast.ts';
import { buildLiuriDay, weekDates } from '../bazi/sense-liuri.ts';
import { weekStartMonday } from '../craft/daily-quest-store.ts';
import { getActivePerson, hasBirthInfo } from '../life/storage.ts';
import type { MysticEmblemKind } from '../ui/mystic-emblem.ts';
import { castZiweiChart } from '../ziwei/cast.ts';
import { getPalaceLore } from '../ziwei/palace-lore.ts';

export type WeekFocusSource = 'chart' | 'basics';

export type WeekFocusCard = {
  weekStart: string;
  source: WeekFocusSource;
  system: 'ziwei' | 'bazi' | 'tarot' | 'liuyao' | 'xiaoliuren' | 'meihua';
  systemLabel: string;
  /** 短标题：本周学什么 */
  title: string;
  kicker: string;
  blurb: string;
  why: string;
  href: string;
  emblem: MysticEmblemKind;
};

const SYSTEM_LABEL: Record<WeekFocusCard['system'], string> = {
  ziwei: '紫微',
  bazi: '八字',
  tarot: '塔罗',
  liuyao: '六爻',
  xiaoliuren: '小六壬',
  meihua: '梅花',
};

/** 无盘时按周轮换的基础词（图书馆入口，非课程大纲） */
export const WEEK_FOCUS_BASICS: Omit<WeekFocusCard, 'weekStart' | 'source'>[] = [
  {
    system: 'ziwei',
    systemLabel: SYSTEM_LABEL.ziwei,
    title: '命宫',
    kicker: '基础词 · 紫微',
    blurb: '人生戏的主角设定——别人第一眼读到的「你」。',
    why: '本周无盘上焦点，先从十二宫的主轴开始。',
    href: '/ziwei/tujian?layer=palaces&palace=%E5%91%BD%E5%AE%AB',
    emblem: 'cosmos',
  },
  {
    system: 'bazi',
    systemLabel: SYSTEM_LABEL.bazi,
    title: '日主',
    kicker: '基础词 · 八字',
    blurb: '四柱的中心：你是谁、以什么气场过一生。',
    why: '本周无盘上焦点，先认自己的日主。',
    href: '/bazi/learn',
    emblem: 'bazi',
  },
  {
    system: 'tarot',
    systemLabel: SYSTEM_LABEL.tarot,
    title: '愚者之旅',
    kicker: '基础词 · 塔罗',
    blurb: '大阿卡纳一条叙事线：从出发到圆满。',
    why: '本周无盘上焦点，用旅程把牌串起来。',
    href: '/tarot/tujian/fool-journey',
    emblem: 'tarot',
  },
  {
    system: 'liuyao',
    systemLabel: SYSTEM_LABEL.liuyao,
    title: '认识阴阳',
    kicker: '基础词 · 六爻',
    blurb: '六爻从阴阳变化开始，再谈卦与动爻。',
    why: '本周无盘上焦点，先走六爻第一课。',
    href: '/liuyao/learn',
    emblem: 'hex',
  },
  {
    system: 'bazi',
    systemLabel: SYSTEM_LABEL.bazi,
    title: '十神',
    kicker: '基础词 · 八字',
    blurb: '日主与世界发生关系的十种角色色。',
    why: '本周无盘上焦点，对照十神图鉴扫一眼。',
    href: '/bazi/tujian',
    emblem: 'bazi',
  },
  {
    system: 'ziwei',
    systemLabel: SYSTEM_LABEL.ziwei,
    title: '四化',
    kicker: '基础词 · 紫微',
    blurb: '禄权科忌：给星曜加一层催化。',
    why: '本周无盘上焦点，先认四化标签。',
    href: '/ziwei/tujian?layer=mutagen',
    emblem: 'cosmos',
  },
  {
    system: 'liuyao',
    systemLabel: SYSTEM_LABEL.liuyao,
    title: '世应',
    kicker: '基础词 · 六爻',
    blurb: '卦里的「我」与「对方/事」如何对照。',
    why: '本周无盘上焦点，补世应这一刀。',
    href: '/liuyao/concepts#shi-ying',
    emblem: 'hex',
  },
  {
    system: 'tarot',
    systemLabel: SYSTEM_LABEL.tarot,
    title: '塔罗图鉴',
    kicker: '基础词 · 塔罗',
    blurb: '先认几张常出的牌，再谈牌阵。',
    why: '本周无盘上焦点，进图鉴随便认一张。',
    href: '/tarot/tujian',
    emblem: 'tarot',
  },
  {
    system: 'xiaoliuren',
    systemLabel: SYSTEM_LABEL.xiaoliuren,
    title: '小六壬图鉴',
    kicker: '基础词 · 小六壬',
    blurb: '出门、面试等即时定向的六宫象。',
    why: '本周无盘上焦点，轻量认一认宫象。',
    href: '/xiaoliuren/tujian',
    emblem: 'star',
  },
  {
    system: 'meihua',
    systemLabel: SYSTEM_LABEL.meihua,
    title: '梅花起卦',
    kicker: '基础词 · 梅花',
    blurb: '一事一象，先定大方向再细看。',
    why: '本周无盘上焦点，从梅花首页摸门道。',
    href: '/meihua',
    emblem: 'plum',
  },
];

/** 同周同池稳定下标 */
export function weekFocusIndex(weekStart: string, size: number): number {
  if (size <= 0) return 0;
  let h = 0;
  for (let i = 0; i < weekStart.length; i++) {
    h = (h * 31 + weekStart.charCodeAt(i)) >>> 0;
  }
  return h % size;
}

/** 一周流日天干十神里出现最多的一个；平手取最先出现 */
export function dominantLabel(labels: string[]): string | null {
  const cleaned = labels.map((s) => s.trim()).filter(Boolean);
  if (!cleaned.length) return null;
  const counts = new Map<string, number>();
  for (const s of cleaned) counts.set(s, (counts.get(s) ?? 0) + 1);
  let best = cleaned[0]!;
  let bestN = 0;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function palaceHref(palaceRaw: string): string {
  const lore = getPalaceLore(palaceRaw);
  const id = lore?.id ?? palaceRaw.replace(/宫$/, '');
  return `/ziwei/tujian?layer=palaces&palace=${encodeURIComponent(id)}`;
}

function buildChartPool(now: Date): Omit<WeekFocusCard, 'weekStart' | 'source'>[] {
  const person = getActivePerson();
  const pool: Omit<WeekFocusCard, 'weekStart' | 'source'>[] = [];

  if (hasBirthInfo(person) && (person.gender === 'female' || person.gender === 'male')) {
    const view = castZiweiChart(person, { year: now.getFullYear() });
    if (!('error' in view)) {
      const focus = view.theater?.annual?.focusPalaces?.[0];
      if (focus) {
        const lore = getPalaceLore(focus);
        pool.push({
          system: 'ziwei',
          systemLabel: SYSTEM_LABEL.ziwei,
          title: lore?.title ?? focus,
          kicker: '你的盘 · 流年焦点宫',
          blurb: lore?.oneLiner ?? '今年流年镜头更常扫到这一宫。',
          why: `今年流年焦点落在「${focus}」——本周只啃这一宫。`,
          href: palaceHref(focus),
          emblem: 'cosmos',
        });
      }
    }
  }

  if (hasBirthInfo(person)) {
    const chart = castBaziChart(person, now.getFullYear(), {
      includeLiunian: false,
      gender: person.gender === 'female' || person.gender === 'male' ? person.gender : '',
    });
    if (!('error' in chart)) {
      const gods = weekDates(now).map((d) => buildLiuriDay(chart, d).stemGod);
      const god = dominantLabel(gods);
      if (god) {
        const sampleDay =
          weekDates(now).find((_, i) => gods[i] === god) ?? weekDates(now)[0]!;
        const sample = buildLiuriDay(chart, sampleDay);
        pool.push({
          system: 'bazi',
          systemLabel: SYSTEM_LABEL.bazi,
          title: god,
          kicker: '你的盘 · 本周流日十神',
          blurb: sample.climate,
          why: `本周流日里「${god}」色最常出现——对照一周天气练认。`,
          href: '/bazi/week',
          emblem: 'bazi',
        });
      }
    }
  }

  return pool;
}

export function pickFromPool<T>(pool: T[], weekStart: string): T | null {
  if (!pool.length) return null;
  return pool[weekFocusIndex(weekStart, pool.length)] ?? null;
}

/** 解析本周卡片（纯函数可测的部分见 pickFromPool / dominantLabel） */
export function resolveWeekFocus(now = new Date()): WeekFocusCard {
  const weekStart = weekStartMonday(now);
  const chartPool = buildChartPool(now);
  if (chartPool.length) {
    const picked = pickFromPool(chartPool, weekStart)!;
    return { ...picked, weekStart, source: 'chart' };
  }
  const picked = pickFromPool(WEEK_FOCUS_BASICS, weekStart)!;
  return { ...picked, weekStart, source: 'basics' };
}
