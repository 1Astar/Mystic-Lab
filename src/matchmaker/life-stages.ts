/**
 * 红娘人生轴：固定九段（对照 matchmaker-mvp）
 * 年份与场合由两人当年大运/流年/红鸾驿马等加权，不是写死日历
 */
import type { MatchmakerCharacter } from './characters.ts';
import { coupleYearLuck, type CoupleYearLuck } from './year-luck.ts';

export type LifeStagePrefer = 'meet' | 'travel' | 'career' | 'festive' | 'strain' | 'any';

export type LifeStageDef = {
  /** 与 StoryEventDef.id 相同 */
  id: string;
  /** 时间轴短标 */
  label: string;
  /** 相对上一事件年份的窗口 */
  yearGapMin: number;
  yearGapMax: number;
  /** 回退估算用（无运程时） */
  yearFrom: number;
  prefer: LifeStagePrefer;
};

/** 初识 → 靠近 → 转折 → 成家 → 成家后 → 边界 → 危机 → 关系去向 → 一生 */
export const LIFE_STAGES: LifeStageDef[] = [
  { id: 'year-meet', label: '初识', yearGapMin: 0, yearGapMax: 0, yearFrom: 0, prefer: 'meet' },
  { id: 'year-closer', label: '靠近', yearGapMin: 0, yearGapMax: 1, yearFrom: 0, prefer: 'meet' },
  { id: 'year-turn', label: '转折', yearGapMin: 1, yearGapMax: 3, yearFrom: 2, prefer: 'career' },
  { id: 'year-settle', label: '成家', yearGapMin: 1, yearGapMax: 3, yearFrom: 4, prefer: 'festive' },
  { id: 'year-household', label: '成家后', yearGapMin: 1, yearGapMax: 4, yearFrom: 6, prefer: 'festive' },
  { id: 'year-boundary', label: '边界', yearGapMin: 2, yearGapMax: 6, yearFrom: 9, prefer: 'meet' },
  { id: 'year-crisis', label: '危机', yearGapMin: 1, yearGapMax: 5, yearFrom: 12, prefer: 'strain' },
  { id: 'year-commitment', label: '关系去向', yearGapMin: 2, yearGapMax: 8, yearFrom: 16, prefer: 'any' },
  { id: 'year-lifetime', label: '一生', yearGapMin: 8, yearGapMax: 25, yearFrom: 28, prefer: 'any' },
];

export function nextStageId(historyIds: string[]): string | null {
  const next = LIFE_STAGES.find((s) => !historyIds.includes(s.id));
  return next?.id ?? null;
}

export function stageById(id: string): LifeStageDef | undefined {
  return LIFE_STAGES.find((s) => s.id === id);
}

function scoreLuck(luck: CoupleYearLuck, prefer: LifeStagePrefer): number {
  let s = 0;
  if (prefer === 'meet' || prefer === 'any') {
    if (luck.meetBoost) s += 5;
    if (luck.a.hongLuan || luck.b.hongLuan) s += 3;
  }
  if (prefer === 'travel' || prefer === 'career' || prefer === 'any') {
    if (luck.travelBoost) s += 4;
    if (luck.a.yiMa || luck.b.yiMa) s += 2;
  }
  if (prefer === 'festive' || prefer === 'any') {
    if (luck.a.tianXi || luck.b.tianXi) s += 4;
  }
  if (prefer === 'strain' || prefer === 'career') {
    for (const p of [luck.a, luck.b]) {
      if (/官|杀|劫|伤/.test(p.liunianStemGod)) s += 2;
      if (/官|杀/.test(p.dayunStemGod)) s += 1;
    }
  }
  return s;
}

/**
 * 在窗口内挑运程最响的故事年。
 * 签名对齐 story.ts：pickStageYear(startYear, stage, a, b, lastYear)
 */
export function pickStageYear(
  startYear: number,
  stage: LifeStageDef,
  a: MatchmakerCharacter,
  b: MatchmakerCharacter,
  lastYear?: number,
): number {
  const base = lastYear && lastYear > 0 ? lastYear : startYear;
  if (stage.id === 'year-meet') return startYear;
  if (stage.id === 'year-closer' && stage.yearGapMax === 0) return base;

  const from = base + stage.yearGapMin;
  const to = Math.max(from, base + stage.yearGapMax);
  let best = from;
  let bestScore = -1;
  for (let y = from; y <= to; y++) {
    const luck = coupleYearLuck(a, b, y);
    if (!luck) continue;
    const score = scoreLuck(luck, stage.prefer) - (y - from) * 0.15;
    if (score > bestScore) {
      bestScore = score;
      best = y;
    }
  }
  return best;
}

/** 故事进度胶囊（对照 MVP timeline） */
export function timelineHtml(
  historyEventIds: string[],
  activeEventId: string | null,
  _escape?: (s: string) => string,
): string {
  const done = new Set(historyEventIds);
  let activeIdx = activeEventId
    ? LIFE_STAGES.findIndex((s) => s.id === activeEventId)
    : -1;
  if (activeIdx < 0) {
    activeIdx = historyEventIds.length;
    if (activeIdx >= LIFE_STAGES.length) activeIdx = LIFE_STAGES.length - 1;
  }
  return `<div class="mm-timeline" aria-label="故事进度">${LIFE_STAGES.map((s, i) => {
    const on = i === activeIdx;
    const past = done.has(s.id) && !on;
    return `<span class="mm-timeline-chip${on ? ' is-on' : ''}${past ? ' is-past' : ''}">${s.label}</span>`;
  }).join('')}</div>`;
}
