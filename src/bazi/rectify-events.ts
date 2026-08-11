/** 生时校准 · 大事件年表 */

export const EVENT_TYPES = [
  'enroll',
  'graduate',
  'job_in',
  'job_out',
  'move',
  'house',
  'love',
  'breakup',
  'marry',
  'illness',
  'surgery',
  'accident',
  'family',
  'wealth',
  /** 兼容旧草稿 */
  'study',
  'career',
  'relation',
  'health',
  'peak',
  'low',
  'other',
] as const;

export type RectifyEventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<RectifyEventType, string> = {
  enroll: '入学',
  graduate: '毕业',
  job_in: '入职',
  job_out: '离职',
  move: '搬家',
  house: '买房',
  love: '恋爱',
  breakup: '分手',
  marry: '结婚',
  illness: '疾病',
  surgery: '手术',
  accident: '意外',
  family: '家庭重大变化',
  wealth: '财富明显变化',
  study: '升学（旧）',
  career: '工作变动（旧）',
  relation: '感情/结婚（旧）',
  health: '健康（旧）',
  peak: '高峰',
  low: '低谷',
  other: '其它',
};

/** 表单可选类型（不含旧别名） */
export const EVENT_TYPE_OPTIONS: RectifyEventType[] = [
  'enroll',
  'graduate',
  'job_in',
  'job_out',
  'move',
  'house',
  'love',
  'breakup',
  'marry',
  'illness',
  'surgery',
  'accident',
  'family',
  'wealth',
  'peak',
  'low',
  'other',
];

export type EventTimePrecision = 'ymd' | 'ym' | 'year' | 'family_fuzzy';

export const TIME_PRECISION_OPTIONS: Array<{
  id: EventTimePrecision;
  label: string;
  hint: string;
}> = [
  { id: 'ymd', label: '精确到年月日', hint: '记得具体哪一天' },
  { id: 'ym', label: '只记得年月', hint: '大约哪个月' },
  { id: 'year', label: '只记得大概年份', hint: '允许 ±1 年对照' },
  { id: 'family_fuzzy', label: '家人记忆，可能有误差', hint: '放宽年份窗口' },
];

export type RectifyEvent = {
  id: string;
  /** 公历年 */
  year: number;
  /** 可选月日（引导用，打分仍以年为主） */
  month?: number;
  day?: number;
  type: RectifyEventType;
  /** 可选短注 */
  note: string;
  /** 年份容差：0 或 1（±1 年） */
  yearSlack: 0 | 1;
  /** 时间精度 */
  precision: EventTimePrecision;
};

export type RectifyMode = 'quick' | 'deep' | 'ongoing';

export const MODE_META: Record<
  RectifyMode,
  { title: string; blurb: string; minEvents: number }
> = {
  quick: {
    title: '快速校准',
    blurb: '勾选预设事件、填年份，约 5 分钟出暂定时辰',
    minEvents: 3,
  },
  deep: {
    title: '深度校准',
    blurb: '逐条填写人生时间线，对照更细',
    minEvents: 3,
  },
  ongoing: {
    title: '持续校准',
    blurb: '以后每有大事回来补充，更新可信度',
    minEvents: 1,
  },
};

/** 快速校准预设（只填年份即可） */
export const QUICK_PRESETS: Array<{ type: RectifyEventType; note: string }> = [
  { type: 'enroll', note: '入学 / 升学' },
  { type: 'graduate', note: '毕业' },
  { type: 'job_in', note: '入职 / 换工作' },
  { type: 'move', note: '搬家' },
  { type: 'love', note: '恋爱 / 结婚' },
  { type: 'illness', note: '健康大事' },
  { type: 'family', note: '家庭重大变化' },
  { type: 'wealth', note: '财富明显变化' },
];

export function parseEventYear(raw: string): number | null {
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  const y = Math.trunc(n);
  if (y < 1900 || y > 2100) return null;
  return y;
}

function newEventId(): string {
  return `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function createEmptyEvent(
  partial?: Partial<RectifyEvent>,
): RectifyEvent {
  return normalizeEvent({
    id: newEventId(),
    year: 0,
    type: 'other',
    note: '',
    yearSlack: 0,
    precision: 'year',
    ...partial,
  });
}

export function isValidEventType(t: string): t is RectifyEventType {
  return (EVENT_TYPES as readonly string[]).includes(t);
}

export function isValidPrecision(p: string): p is EventTimePrecision {
  return p === 'ymd' || p === 'ym' || p === 'year' || p === 'family_fuzzy';
}

function slackFromPrecision(p: EventTimePrecision, explicit?: 0 | 1): 0 | 1 {
  if (p === 'year' || p === 'family_fuzzy') return 1;
  if (explicit === 0 || explicit === 1) return explicit;
  return 0;
}

export function normalizeEvent(raw: Partial<RectifyEvent> & { id?: string }): RectifyEvent {
  const year = typeof raw.year === 'number' && Number.isFinite(raw.year) ? Math.trunc(raw.year) : 0;
  const type = raw.type && isValidEventType(raw.type) ? raw.type : 'other';
  const precision = raw.precision && isValidPrecision(raw.precision) ? raw.precision : 'year';
  const slack = slackFromPrecision(
    precision,
    raw.yearSlack === 1 ? 1 : raw.yearSlack === 0 ? 0 : undefined,
  );
  const month =
    typeof raw.month === 'number' && raw.month >= 1 && raw.month <= 12
      ? Math.trunc(raw.month)
      : undefined;
  const day =
    typeof raw.day === 'number' && raw.day >= 1 && raw.day <= 31
      ? Math.trunc(raw.day)
      : undefined;
  return {
    id: (raw.id ?? '').trim() || newEventId(),
    year: year >= 1900 && year <= 2100 ? year : 0,
    month,
    day,
    type,
    note: String(raw.note ?? '')
      .trim()
      .slice(0, 80),
    yearSlack: slack,
    precision,
  };
}

/** 有效事件：年份合法 */
export function isEventFilled(e: RectifyEvent): boolean {
  return e.year >= 1900 && e.year <= 2100;
}

export const MIN_EVENTS_FOR_SCORE = 3;

export function minEventsForMode(mode: RectifyMode | undefined): number {
  if (mode === 'ongoing') return MODE_META.ongoing.minEvents;
  return MIN_EVENTS_FOR_SCORE;
}

export function eventsReadyForScore(
  events: RectifyEvent[],
  mode?: RectifyMode,
): boolean {
  return events.filter(isEventFilled).length >= minEventsForMode(mode);
}

export function filledEvents(events: RectifyEvent[]): RectifyEvent[] {
  return events.map(normalizeEvent).filter(isEventFilled);
}

export function eventLabel(e: RectifyEvent): string {
  const t = EVENT_TYPE_LABELS[e.type] || e.type;
  return e.note ? `${e.year} ${t}（${e.note}）` : `${e.year} ${t}`;
}
