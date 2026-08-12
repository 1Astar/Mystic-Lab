/**
 * 流年剧情立场：化忌主线二选一 → 当年 Buff 微调 + 当年/后两年锦囊
 */
import type { PersonProfile } from '../life/types.ts';
import { resolveHoroscopeLimits } from '../ziwei/horoscope-limits.ts';
import type { PalaceSnap } from '../ziwei/types.ts';
import {
  composeMultByAxis,
  type BuffEffect,
  type YearBuffEntry,
  type YearBuffPack,
} from './spirit-buff.ts';

export const YEAR_STANCE_KEY = 'mystic-lab-year-stance-v1';

export type YearStanceChoice = 'accept' | 'avoid';

export type YearStanceRecord = {
  personId: string;
  year: number;
  choice: YearStanceChoice;
  mainlineId: string;
  mainlineTitle: string;
  jiStar: string;
  jiPalace: string;
  chosenAt: string;
  /** 点过「稍后再说」也记一条，不占 choice */
  deferred?: boolean;
};

export type YearStanceStore = {
  records: YearStanceRecord[];
  /** personId.year → ISO，稍后再说 */
  deferredAt: Record<string, string>;
};

export type YearMainline = {
  id: string;
  title: string;
  jiStar: string;
  jiPalace: string;
  blurb: string;
};

export type YearTip = {
  year: number;
  kind: 'current' | 'follow';
  fromYear: number;
  choice: YearStanceChoice;
  text: string;
};

const STAR_MAINLINE: Record<string, { id: string; title: string }> = {
  紫微: { id: 'throne-reforge', title: '王座重塑' },
  天机: { id: 'mind-reforge', title: '思绪重塑' },
  太阳: { id: 'light-reforge', title: '照耀校准' },
  武曲: { id: 'resource-temper', title: '资源淬炼' },
  天同: { id: 'ease-reforge', title: '安逸重校' },
  廉贞: { id: 'bond-temper', title: '情义淬炼' },
  天府: { id: 'vault-temper', title: '库藏淬炼' },
  太阴: { id: 'tide-reforge', title: '潮汐重塑' },
  贪狼: { id: 'desire-temper', title: '欲望淬炼' },
  巨门: { id: 'voice-temper', title: '口舌淬炼' },
  天相: { id: 'assist-reforge', title: '辅佐重校' },
  天梁: { id: 'shelter-temper', title: '荫护淬炼' },
  七杀: { id: 'edge-temper', title: '锋芒淬炼' },
  破军: { id: 'break-reforge', title: '破立重塑' },
};

const PALACE_SUFFIX: Record<string, string> = {
  命: '·内核',
  兄弟: '·伙伴',
  夫妻: '·关系',
  子女: '·创造',
  财帛: '·资源',
  疾厄: '·身心',
  迁移: '·外界',
  仆役: '·人脉',
  交友: '·人脉',
  官禄: '·事业',
  田宅: '·根基',
  福德: '·内心',
  父母: '·出处',
};

function emptyStore(): YearStanceStore {
  return { records: [], deferredAt: {} };
}

function deferKey(personId: string, year: number): string {
  return `${personId}.${year}`;
}

export function loadYearStanceStore(): YearStanceStore {
  try {
    const raw = localStorage.getItem(YEAR_STANCE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw) as Partial<YearStanceStore>;
    return {
      records: Array.isArray(parsed.records) ? parsed.records : [],
      deferredAt:
        parsed.deferredAt && typeof parsed.deferredAt === 'object'
          ? parsed.deferredAt
          : {},
    };
  } catch {
    return emptyStore();
  }
}

export function saveYearStanceStore(store: YearStanceStore): void {
  localStorage.setItem(
    YEAR_STANCE_KEY,
    JSON.stringify({
      records: store.records.slice(-200),
      deferredAt: store.deferredAt,
    }),
  );
}

export function getYearStance(
  personId: string,
  year: number,
  store = loadYearStanceStore(),
): YearStanceRecord | undefined {
  return store.records.find((r) => r.personId === personId && r.year === year && !r.deferred);
}

export function isYearStanceDeferred(
  personId: string,
  year: number,
  store = loadYearStanceStore(),
): boolean {
  return Boolean(store.deferredAt[deferKey(personId, year)]);
}

/** 有化忌、未选择、未稍后再说 → 应自动弹 */
export function shouldAutoOpenYearStance(opts: {
  personId: string;
  year: number;
  hasJi: boolean;
  store?: YearStanceStore;
}): boolean {
  if (!opts.hasJi) return false;
  const store = opts.store ?? loadYearStanceStore();
  if (getYearStance(opts.personId, opts.year, store)) return false;
  if (isYearStanceDeferred(opts.personId, opts.year, store)) return false;
  return true;
}

export function deferYearStance(personId: string, year: number): void {
  const store = loadYearStanceStore();
  store.deferredAt[deferKey(personId, year)] = new Date().toISOString();
  saveYearStanceStore(store);
}

export function saveYearStance(record: YearStanceRecord): void {
  const store = loadYearStanceStore();
  store.records = store.records.filter(
    (r) => !(r.personId === record.personId && r.year === record.year && !r.deferred),
  );
  store.records.push(record);
  delete store.deferredAt[deferKey(record.personId, record.year)];
  saveYearStanceStore(store);
}

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

export function findStarPalaceName(palaces: PalaceSnap[], star: string): string {
  for (const p of palaces) {
    if ([...p.majors, ...p.minors].some((s) => s.name === star)) return p.name;
  }
  return '';
}

export function resolveYearJi(opts: {
  person: PersonProfile;
  year: number;
  palaces?: PalaceSnap[];
}): { jiStar: string; jiPalace: string; mutagenLine: string } | null {
  const snap = resolveHoroscopeLimits(opts.person, {
    year: opts.year,
    month: 6,
    day: 15,
  });
  if (!snap) return null;
  const jiStar = snap.yearMutagen[3]?.trim() || '';
  if (!jiStar) return null;
  const jiPalace = opts.palaces?.length
    ? findStarPalaceName(opts.palaces, jiStar)
    : snap.yearPalace;
  return {
    jiStar,
    jiPalace: jiPalace || snap.yearPalace,
    mutagenLine: snap.yearMutagenLine,
  };
}

export function buildYearMainline(jiStar: string, jiPalace: string): YearMainline {
  const base = STAR_MAINLINE[jiStar] ?? {
    id: `generic-${jiStar || 'empty'}`,
    title: jiStar ? `${jiStar}淬炼` : '流年色调',
  };
  const suffix = PALACE_SUFFIX[shortPalace(jiPalace)] ?? '';
  const title = `【${base.title}${suffix}】`;
  return {
    id: `${base.id}${suffix ? `-${shortPalace(jiPalace)}` : ''}`,
    title,
    jiStar,
    jiPalace,
    blurb: jiStar
      ? `本年主线来自「${jiStar}化忌」落${shortPalace(jiPalace) || '—'}：考验不是倒霉，是把这块磨利或先护盘。`
      : '本年没有化忌主线，可先看四化色调；立场选择暂不开放。',
  };
}

function tipCurrent(choice: YearStanceChoice, mainline: YearMainline): string {
  if (choice === 'accept') {
    return `【硬仗复盘】你选择承接${mainline.title}：把「${mainline.jiStar}化忌」写成可验证的一周动作，少空耗。`;
  }
  return `【护盘待机】你选择暂避${mainline.title}：先稳住温养与边界，窗口来时再出手。`;
}

function tipFollow(choice: YearStanceChoice, fromYear: number, mainline: YearMainline): string {
  if (choice === 'accept') {
    return `承接 ${fromYear}「${mainline.title}」：把去年硬仗收成方法——同一主题只留一条可复用清单。`;
  }
  return `承接 ${fromYear}「${mainline.title}」：护盘期结束前别硬冲；窗口出现时用小步试验出手。`;
}

/** 当年锦囊 + 由过去两年选择带来的后续锦囊 */
export function listYearTips(opts: {
  personId: string;
  year: number;
  store?: YearStanceStore;
}): YearTip[] {
  const store = opts.store ?? loadYearStanceStore();
  const tips: YearTip[] = [];
  const current = getYearStance(opts.personId, opts.year, store);
  if (current) {
    const mainline = buildYearMainline(current.jiStar, current.jiPalace);
    tips.push({
      year: opts.year,
      kind: 'current',
      fromYear: opts.year,
      choice: current.choice,
      text: tipCurrent(current.choice, mainline),
    });
  }
  for (const delta of [1, 2]) {
    const fromYear = opts.year - delta;
    const past = getYearStance(opts.personId, fromYear, store);
    if (!past) continue;
    const mainline = buildYearMainline(past.jiStar, past.jiPalace);
    tips.push({
      year: opts.year,
      kind: 'follow',
      fromYear,
      choice: past.choice,
      text: tipFollow(past.choice, fromYear, mainline),
    });
  }
  return tips;
}

/** 立场对当年四化 Buff 的乘子微调（叠在忌条上） */
export function stanceBuffEffects(choice: YearStanceChoice): BuffEffect[] {
  if (choice === 'accept') {
    return [
      { axis: 'yeli', mult: 1.15 },
      { axis: 'guangyao', mult: 1.05 },
    ];
  }
  return [
    { axis: 'yeli', mult: 0.85 },
    { axis: 'wenyang', mult: 1.12 },
  ];
}

export function applyStanceToYearBuffPack(
  pack: YearBuffPack,
  choice: YearStanceChoice | undefined,
): YearBuffPack {
  if (!choice) return pack;
  const extra = stanceBuffEffects(choice);
  const stanceEntry: YearBuffEntry = {
    id: `${pack.year}-stance-${choice}`,
    title: choice === 'accept' ? '剧情·接受挑战' : '剧情·暂避锋芒',
    kind: '忌',
    star: '立场',
    effects: extra,
    effectLabel: extra
      .map((e) => {
        const pct = Math.round((e.mult - 1) * 100);
        const sign = pct >= 0 ? `+${pct}%` : `${pct}%`;
        const label =
          e.axis === 'yeli'
            ? '业力'
            : e.axis === 'guangyao'
              ? '光耀'
              : e.axis === 'wenyang'
                ? '温养'
                : e.axis;
        return `${label}${sign}`;
      })
      .join(' · '),
    advice:
      choice === 'accept'
        ? '立场：硬仗复盘——业力与光耀略升，逼你把考验写成方法。'
        : '立场：护盘待机——业力考验缓和，温养抬升，先稳住再出手。',
  };

  const entries = [...pack.entries, stanceEntry];
  const multByAxis = composeMultByAxis([
    ...entries,
    ...(pack.monthEntries ?? []),
  ]);
  return { ...pack, entries, multByAxis };
}

export function choiceLabel(choice: YearStanceChoice): string {
  return choice === 'accept' ? '接受挑战' : '暂避锋芒';
}
