/** 生时校准 · 大事件年表 */

export const EVENT_TYPES = [
  'study',
  'career',
  'relation',
  'move',
  'health',
  'family',
  'peak',
  'low',
  'other',
] as const;

export type RectifyEventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<RectifyEventType, string> = {
  study: '升学',
  career: '工作变动',
  relation: '感情/结婚',
  move: '搬家',
  health: '健康',
  family: '家庭变故',
  peak: '高峰',
  low: '低谷',
  other: '其它',
};

export type RectifyEvent = {
  id: string;
  /** 公历年 */
  year: number;
  type: RectifyEventType;
  /** 可选短注 */
  note: string;
  /** 年份容差：0 或 1（±1 年） */
  yearSlack: 0 | 1;
};

export function parseEventYear(raw: string): number | null {
  const n = Number(String(raw).trim());
  if (!Number.isFinite(n)) return null;
  const y = Math.trunc(n);
  if (y < 1900 || y > 2100) return null;
  return y;
}

export function createEmptyEvent(): RectifyEvent {
  return {
    id: `ev-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    year: 0,
    type: 'other',
    note: '',
    yearSlack: 0,
  };
}

export function isValidEventType(t: string): t is RectifyEventType {
  return (EVENT_TYPES as readonly string[]).includes(t);
}

export function normalizeEvent(raw: Partial<RectifyEvent> & { id?: string }): RectifyEvent {
  const year = typeof raw.year === 'number' && Number.isFinite(raw.year) ? Math.trunc(raw.year) : 0;
  const type = raw.type && isValidEventType(raw.type) ? raw.type : 'other';
  const slack = raw.yearSlack === 1 ? 1 : 0;
  return {
    id: (raw.id ?? '').trim() || createEmptyEvent().id,
    year: year >= 1900 && year <= 2100 ? year : 0,
    type,
    note: String(raw.note ?? '')
      .trim()
      .slice(0, 80),
    yearSlack: slack,
  };
}

/** 有效事件：年份合法 */
export function isEventFilled(e: RectifyEvent): boolean {
  return e.year >= 1900 && e.year <= 2100;
}

export const MIN_EVENTS_FOR_SCORE = 3;

export function eventsReadyForScore(events: RectifyEvent[]): boolean {
  return events.filter(isEventFilled).length >= MIN_EVENTS_FOR_SCORE;
}

export function filledEvents(events: RectifyEvent[]): RectifyEvent[] {
  return events.map(normalizeEvent).filter(isEventFilled);
}
