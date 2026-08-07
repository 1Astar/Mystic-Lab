/**
 * 流年深度推演包：结论 + 依据链 + 四化释义 + 可能表现
 * 依据链随层级加深：流年→月→日→时
 */
import type { PersonProfile } from '../life/types.ts';
import type { LearnFocus } from './learn-explain.ts';
import { resolveHoroscopeLimits } from './horoscope-limits.ts';
import { sanfangSizheng } from './palace-relations.ts';
import type { TimeScopeLevel } from './time-scope.ts';
import type { ZiweiChartView } from './types.ts';
import type { YearTense, YearTrackItem } from './year-track.ts';

export type YearChainStep = {
  title: string;
  detail: string;
  focus?: LearnFocus;
};

export type YearMutagenExplain = {
  kind: '禄' | '权' | '科' | '忌';
  star: string;
  palace: string;
  text: string;
};

export type YearDeepPack = {
  year: number;
  age: number;
  gz: string;
  tense: YearTense;
  tenseLabel: string;
  conclusion: string;
  chain: YearChainStep[];
  mutagen: YearMutagenExplain[];
  possibles: string[];
  relatedPalaces: string[];
  /** 当前推演层级，默认流年 */
  level?: TimeScopeLevel;
  levelLabel?: string;
};

const HUA_TEXT: Record<string, string> = {
  禄: '带来机会、资源或获得感',
  权: '增加责任、行动压力或掌控需求',
  科: '带来表现、名声或学习机会',
  忌: '形成阻力、反复或需要面对的课题',
};

const THEME_FOCUS_PALACE: Record<string, string> = {
  自我重校: '命宫',
  伙伴课题: '兄弟宫',
  关系变化: '夫妻宫',
  创造表达: '子女宫',
  资源起伏: '财帛宫',
  身心节律: '疾厄宫',
  外出变动: '迁移宫',
  人际协作: '交友宫',
  职业调整: '官禄宫',
  居住根基: '田宅宫',
  内心满足: '福德宫',
  出处权威: '父母宫',
};

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

function findPalaceName(view: ZiweiChartView, name: string): string {
  const key = shortPalace(name);
  const hit = view.palaces.find(
    (p) => p.name === name || shortPalace(p.name) === key || p.name.includes(key),
  );
  return hit?.name ?? name;
}

function starPalace(view: ZiweiChartView, star: string): string {
  const hit = view.palaces.find((p) =>
    [...p.majors, ...p.minors, ...p.adjectives].some((s) => s.name === star),
  );
  return hit?.name ?? '';
}

function parseMutagenLine(line: string): Array<{ star: string; kind: string }> {
  return line
    .split(' · ')
    .map((chunk) => {
      const m = chunk.trim().match(/^(.+)化([禄权科忌])$/);
      return m ? { star: m[1]!, kind: m[2]! } : null;
    })
    .filter((x): x is { star: string; kind: string } => Boolean(x));
}

export type ScopeDeepOpts = {
  level?: TimeScopeLevel;
  month?: number;
  day?: number;
  hour?: number;
};

function levelLabelOf(level: TimeScopeLevel): string {
  if (level === 'decade') return '大限';
  if (level === 'month') return '流月';
  if (level === 'day') return '流日';
  if (level === 'hour') return '流时';
  return '流年';
}

export function buildYearDeepPack(
  view: ZiweiChartView,
  person: PersonProfile,
  item: YearTrackItem,
  scope: ScopeDeepOpts = {},
): YearDeepPack {
  const level: TimeScopeLevel = scope.level ?? 'year';
  const month = scope.month ?? 6;
  const day = scope.day ?? 15;
  const hour = scope.hour ?? 6;
  const snap = resolveHoroscopeLimits(person, {
    year: item.year,
    month,
    day,
    hour,
  });

  const yearPalace = findPalaceName(view, item.yearPalace || snap?.yearPalace || '');
  const decadePalace = findPalaceName(view, snap?.decadePalace || view.theater.decade.palaceName);
  const themePalaceRaw =
    THEME_FOCUS_PALACE[item.chipLabel] ??
    (item.chipLabel.includes('职业') ? '官禄宫' : yearPalace);
  const natalFocus = findPalaceName(view, themePalaceRaw);

  const yearSnap = view.palaces.find((p) => p.name === yearPalace) ?? view.soulPalace;
  const rel = sanfangSizheng(view, yearSnap);
  const sanhe = rel.sanhe.map((p) => p.name);
  const opposite = rel.opposite?.name ?? '';

  const mutas = parseMutagenLine(item.yearMutagenLine || snap?.yearMutagenLine || '');
  const mutagen: YearMutagenExplain[] = mutas.map((m) => {
    const palace = starPalace(view, m.star);
    return {
      kind: m.kind as YearMutagenExplain['kind'],
      star: m.star,
      palace,
      text: HUA_TEXT[m.kind] ?? '',
    };
  });

  const fliesIntoFocus = mutagen.filter(
    (m) => m.palace && shortPalace(m.palace) === shortPalace(natalFocus),
  );

  const chain: YearChainStep[] = [
    {
      title: `本命${shortPalace(natalFocus)}宫`,
      detail: `先天里与「${item.chipLabel}」最相关的主场。`,
      focus: { kind: 'palace', palaceName: natalFocus },
    },
    {
      title: `大限落入${shortPalace(decadePalace) || '—'}`,
      detail: snap?.decadeAge
        ? `这十年大限主场（约 ${snap.decadeAge[0]}–${snap.decadeAge[1]} 岁）。`
        : '这十年大限主场。',
      focus: { kind: 'palace', palaceName: decadePalace },
    },
    {
      title: `流年命宫落入${shortPalace(yearPalace) || '—'}`,
      detail: `${item.year} 年（${item.gz || '—'}）的流年命宫落点。`,
      focus: { kind: 'palace', palaceName: yearPalace },
    },
  ];

  if (mutagen.length) {
    chain.push({
      title: '流年四化',
      detail: mutagen
        .map((m) => `${m.star}化${m.kind}${m.palace ? `→${shortPalace(m.palace)}` : ''}`)
        .join(' · '),
      focus: { kind: 'mutagen', term: '四化' },
    });
  }

  if (fliesIntoFocus.length) {
    chain.push({
      title: `四化飞入本命${shortPalace(natalFocus)}`,
      detail: fliesIntoFocus.map((m) => `${m.star}化${m.kind}`).join('、') + ' 落到该宫，议题被点亮。',
      focus: { kind: 'palace', palaceName: natalFocus },
    });
  }

  chain.push({
    title: '三方四正联动',
    detail: `以流年命宫为心：三合 ${sanhe.map(shortPalace).join(' · ') || '—'}；对宫 ${shortPalace(opposite) || '—'}。`,
    focus: { kind: 'structure', term: '三方四正', palaceName: yearPalace },
  });

  const monthPalace = findPalaceName(view, snap?.monthPalace || '');
  const dayPalace = findPalaceName(view, snap?.dayPalace || '');
  const hourPalace = findPalaceName(view, snap?.hourPalace || '');

  if (level === 'month' || level === 'day' || level === 'hour') {
    chain.push({
      title: `流月落入${shortPalace(monthPalace) || '—'}`,
      detail: `${item.year}年${month}月的推进主场。`,
      focus: { kind: 'palace', palaceName: monthPalace },
    });
  }
  if (level === 'day' || level === 'hour') {
    chain.push({
      title: `流日落入${shortPalace(dayPalace) || '—'}`,
      detail: `${item.year}年${month}月${day}日的当日主场。`,
      focus: { kind: 'palace', palaceName: dayPalace },
    });
  }
  if (level === 'hour') {
    chain.push({
      title: `流时落入${shortPalace(hourPalace) || '—'}`,
      detail: '当前时辰的时机落点。',
      focus: { kind: 'palace', palaceName: hourPalace },
    });
  }

  const related = Array.from(
    new Set(
      [
        natalFocus,
        decadePalace,
        yearPalace,
        opposite,
        ...sanhe,
        ...mutagen.map((m) => m.palace),
        ...(level !== 'year' && level !== 'decade' ? [monthPalace] : []),
        ...(level === 'day' || level === 'hour' ? [dayPalace] : []),
        ...(level === 'hour' ? [hourPalace] : []),
      ].filter(Boolean),
    ),
  );

  let conclusion = item.theme;
  if (!conclusion.endsWith('。') && !conclusion.endsWith('！')) conclusion += '。';
  if (item.tense === 'past') conclusion += '可作为那年人生回顾的入口。';
  else if (item.tense === 'future') conclusion += '这是趋势提示，不是判决。';
  else if (item.chipLabel === '职业调整') {
    conclusion = '职业方向会成为今年的重要议题。';
  }
  if (level === 'month') conclusion = `在年度主轴下，本月重点看${shortPalace(monthPalace) || '推进'}。`;
  if (level === 'day') conclusion = `今日重点看${shortPalace(dayPalace) || '当天'}，适合短决策与对照记录。`;
  if (level === 'hour') conclusion = `此刻看${shortPalace(hourPalace) || '时辰'}，当作时机提示，不必写成人生判决。`;

  return {
    year: item.year,
    age: item.age,
    gz: item.gz || snap?.yearGZ || '',
    tense: item.tense,
    tenseLabel: item.tenseLabel,
    conclusion,
    chain,
    mutagen,
    possibles: item.possibles,
    relatedPalaces: related,
    level,
    levelLabel: levelLabelOf(level),
  };
}

/** 验证记录：本地存每人每年若干事件句；日级用 dateKey */
const EVENTS_KEY = 'mystic.ziwei.yearVerify.v1';
const DAY_EVENTS_KEY = 'mystic.ziwei.dayVerify.v1';

type EventsStore = Record<string, string[]>;

function personKey(personId: string, year: number): string {
  return `${personId}:${year}`;
}

function dayKey(personId: string, year: number, month: number, day: number): string {
  return `${personId}:${year}-${month}-${day}`;
}

function readStore(key = EVENTS_KEY): EventsStore {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as EventsStore;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export function listYearVerifyEvents(personId: string, year: number): string[] {
  return readStore()[personKey(personId, year)] ?? [];
}

export function addYearVerifyEvent(personId: string, year: number, text: string): string[] {
  const t = text.trim();
  if (!t) return listYearVerifyEvents(personId, year);
  const store = readStore();
  const key = personKey(personId, year);
  const next = [...(store[key] ?? []), t].slice(-20);
  store[key] = next;
  localStorage.setItem(EVENTS_KEY, JSON.stringify(store));
  return next;
}

export function removeYearVerifyEvent(personId: string, year: number, index: number): string[] {
  const store = readStore();
  const key = personKey(personId, year);
  const list = [...(store[key] ?? [])];
  if (index < 0 || index >= list.length) return list;
  list.splice(index, 1);
  store[key] = list;
  localStorage.setItem(EVENTS_KEY, JSON.stringify(store));
  return list;
}

export function listDayVerifyEvents(
  personId: string,
  year: number,
  month: number,
  day: number,
): string[] {
  return readStore(DAY_EVENTS_KEY)[dayKey(personId, year, month, day)] ?? [];
}

export function addDayVerifyEvent(
  personId: string,
  year: number,
  month: number,
  day: number,
  text: string,
): string[] {
  const t = text.trim();
  if (!t) return listDayVerifyEvents(personId, year, month, day);
  const store = readStore(DAY_EVENTS_KEY);
  const key = dayKey(personId, year, month, day);
  const next = [...(store[key] ?? []), t].slice(-20);
  store[key] = next;
  localStorage.setItem(DAY_EVENTS_KEY, JSON.stringify(store));
  return next;
}

export function removeDayVerifyEvent(
  personId: string,
  year: number,
  month: number,
  day: number,
  index: number,
): string[] {
  const store = readStore(DAY_EVENTS_KEY);
  const key = dayKey(personId, year, month, day);
  const list = [...(store[key] ?? [])];
  if (index < 0 || index >= list.length) return list;
  list.splice(index, 1);
  store[key] = list;
  localStorage.setItem(DAY_EVENTS_KEY, JSON.stringify(store));
  return list;
}
