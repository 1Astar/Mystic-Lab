/**
 * 双盘生时校准 · 候选时辰：八字流年十神 + 紫微流年命宫 对照事件
 * 规则打分，零 LLM
 */
import type { LifeProfileInput, PersonProfile } from '../life/types.ts';
import { createEmptyPerson } from '../life/types.ts';
import {
  listHourCandidates,
  type HourCandidate,
  type RectifyTimeBand,
} from '../bazi/rectify-candidates.ts';
import type { EventFeedback } from '../bazi/rectify-draft.ts';
import { feedbackKey } from '../bazi/rectify-draft.ts';
import {
  eventLabel,
  filledEvents,
  minEventsForMode,
  type RectifyEvent,
  type RectifyEventType,
  type RectifyMode,
} from '../bazi/rectify-events.ts';
import {
  scoreHourCandidates,
  type EventMatch,
  type EventMatchKind,
  type RankedHourCandidate,
} from '../bazi/rectify-score.ts';
import { resolveHoroscopeLimits } from '../ziwei/horoscope-limits.ts';

/** 事件类型 → 紫微流年命宫偏好（人生场景） */
const TYPE_PALACE_PREFER: Record<RectifyEventType, string[]> = {
  enroll: ['父母', '官禄', '福德'],
  graduate: ['父母', '官禄', '迁移'],
  job_in: ['官禄', '迁移', '仆役', '交友'],
  job_out: ['官禄', '迁移', '疾厄'],
  move: ['迁移', '田宅'],
  house: ['田宅', '财帛'],
  love: ['夫妻', '福德'],
  breakup: ['夫妻', '福德', '疾厄'],
  marry: ['夫妻', '福德', '田宅'],
  illness: ['疾厄', '福德'],
  surgery: ['疾厄'],
  accident: ['疾厄', '迁移'],
  family: ['父母', '兄弟', '田宅'],
  wealth: ['财帛', '田宅', '官禄'],
  study: ['父母', '官禄', '福德'],
  career: ['官禄', '迁移', '仆役'],
  relation: ['夫妻', '福德'],
  health: ['疾厄', '福德'],
  peak: ['官禄', '财帛', '命'],
  low: ['疾厄', '仆役', '迁移'],
  other: ['命', '福德', '官禄'],
};

function shortPalace(name: string): string {
  return name.replace(/宫$/, '');
}

function yearsForEvent(e: RectifyEvent): number[] {
  if (e.yearSlack === 1 || e.precision === 'year' || e.precision === 'family_fuzzy') {
    return [e.year - 1, e.year, e.year + 1];
  }
  return [e.year];
}

function asPerson(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  birthHour: string,
): PersonProfile {
  return createEmptyPerson({
    ...profile,
    nickname: '校准',
    gender,
    birthHour,
  });
}

function matchZiweiEvent(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  candidate: HourCandidate,
  ev: RectifyEvent,
  feedback?: EventFeedback,
): EventMatch {
  const years = yearsForEvent(ev);
  const prefer = TYPE_PALACE_PREFER[ev.type] ?? TYPE_PALACE_PREFER.other;
  const label = eventLabel(ev);
  const person = asPerson(profile, gender, candidate.birthHour);

  let best = 0;
  let bestYear = ev.year;
  let bestPalace = '';
  let bestMutagen = '';

  for (const year of years) {
    const snap = resolveHoroscopeLimits(person, {
      year,
      month: ev.month && ev.month >= 1 && ev.month <= 12 ? ev.month : 6,
      day: ev.day && ev.day >= 1 && ev.day <= 28 ? ev.day : 15,
      hour: 6,
    });
    if (!snap?.yearPalace) continue;
    const key = shortPalace(snap.yearPalace);
    let s = 4;
    if (prefer.includes(key)) s += 6;
    else if (prefer.some((p) => key.includes(p) || p.includes(key))) s += 3;
    else s += 1;
    if (snap.yearMutagenLine) s += 1;
    if (s > best) {
      best = s;
      bestYear = year;
      bestPalace = snap.yearPalace;
      bestMutagen = snap.yearMutagenLine;
    }
  }

  if (best === 0) {
    let points = 1;
    if (feedback === 'fit') points += 8;
    if (feedback === 'nofit') points = Math.max(0, points - 6);
    return {
      event: ev,
      kind: 'miss',
      year: ev.year,
      ganZhi: '',
      stemGod: '',
      reason: `未能在「${label}」窗口排出紫微流年命宫`,
      points,
    };
  }

  if (feedback === 'fit') best += 12;
  if (feedback === 'nofit') best = Math.max(0, best - 14);

  const kind: EventMatchKind = best >= 9 ? 'hit' : best >= 5 ? 'weak' : 'miss';
  const palaceShort = shortPalace(bestPalace) || '—';
  const mutagenBit = bestMutagen ? ` · ${bestMutagen}` : '';
  const reason =
    kind === 'hit'
      ? `${bestYear} 流年命落${palaceShort}${mutagenBit}，与「${label}」场景较合拍`
      : kind === 'weak'
        ? `${bestYear} 流年命落${palaceShort}，对「${label}」只有弱对应`
        : `${bestYear} 流年命落${palaceShort}，难以支撑「${label}」`;

  return {
    event: ev,
    kind,
    year: bestYear,
    ganZhi: palaceShort,
    stemGod: bestMutagen,
    reason,
    points: best,
  };
}

function confidenceFromRaw(rawMain: number, maxMain: number): {
  pct: number;
  label: '较高' | '中等' | '偏低';
} {
  if (maxMain <= 0) return { pct: 40, label: '偏低' };
  const ratio = rawMain / maxMain;
  const pct = Math.round(42 + ratio * 48);
  const clamped = Math.min(92, Math.max(38, pct));
  const label = clamped >= 72 ? '较高' : clamped >= 55 ? '中等' : '偏低';
  return { pct: clamped, label };
}

export type DualRankedHour = {
  candidate: HourCandidate;
  bazi: RankedHourCandidate;
  ziweiRaw: number;
  ziweiPct: number;
  ziweiLabel: '较高' | '中等' | '偏低';
  ziweiHits: EventMatch[];
  ziweiWeaks: EventMatch[];
  ziweiMisses: EventMatch[];
  ziweiSummary: string;
  /** 综合：八字与紫微各半 */
  combinedPct: number;
  combinedLabel: '较高' | '中等' | '偏低';
  dualSummary: string;
};

function ziweiSummary(
  branch: string,
  hits: EventMatch[],
  misses: EventMatch[],
  weaks: EventMatch[],
): string {
  const hitBits = hits
    .slice(0, 3)
    .map((h) => `${h.year}${h.event.note || h.event.type}`)
    .join('、');
  const missBits = misses
    .slice(0, 2)
    .map((m) => `${m.year}${m.event.note || m.event.type}`)
    .join('、');
  if (hits.length && !misses.length) {
    return `紫微侧：${branch}时能较好解释 ${hitBits || '已填事件'}。`;
  }
  if (hits.length && misses.length) {
    return `紫微侧：能解释 ${hitBits}；但对 ${missBits} 偏弱。`;
  }
  if (weaks.length && !hits.length) {
    return `紫微侧：多数事件只有弱信号。`;
  }
  return `紫微侧：与已填事件对应偏弱。`;
}

export type DualScoreOpts = {
  mode?: RectifyMode;
  keptBranches?: string[];
  feedback?: Record<string, EventFeedback>;
};

/**
 * 双盘打分：复用八字规则分 + 紫微流年命宫偏好，综合可信度取平均。
 */
export function scoreDualHourCandidates(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  band: RectifyTimeBand,
  events: RectifyEvent[],
  opts?: DualScoreOpts,
): DualRankedHour[] {
  if (!gender) return [];

  const filled = filledEvents(events);
  const minN = minEventsForMode(opts?.mode);
  if (filled.length < minN) return [];

  const baziRanked = scoreHourCandidates(profile, gender, band, events, opts);
  if (!baziRanked.length) return [];

  const fb = opts?.feedback ?? {};
  const ziweiDraft = baziRanked.map((bazi) => {
    const matches = filled.map((ev) =>
      matchZiweiEvent(
        profile,
        gender,
        bazi.candidate,
        ev,
        fb[feedbackKey(bazi.candidate.branch, ev.id)],
      ),
    );
    const ziweiHits = matches.filter((m) => m.kind === 'hit');
    const ziweiWeaks = matches.filter((m) => m.kind === 'weak');
    const ziweiMisses = matches.filter((m) => m.kind === 'miss');
    const ziweiRaw = matches.reduce((s, m) => s + m.points, 0);
    return {
      bazi,
      ziweiRaw,
      ziweiHits,
      ziweiWeaks,
      ziweiMisses,
      ziweiSummary: ziweiSummary(
        bazi.candidate.branch,
        ziweiHits,
        ziweiMisses,
        ziweiWeaks,
      ),
    };
  });

  const maxZiwei = Math.max(...ziweiDraft.map((r) => r.ziweiRaw), 1);

  const dual: DualRankedHour[] = ziweiDraft.map((row, i) => {
    const zwConf = confidenceFromRaw(row.ziweiRaw, maxZiwei);
    const adj = Math.min(12, i * 3);
    const ziweiPct = Math.max(35, zwConf.pct - adj);
    const ziweiLabel: DualRankedHour['ziweiLabel'] =
      ziweiPct >= 72 ? '较高' : ziweiPct >= 55 ? '中等' : '偏低';
    const combinedPct = Math.round((row.bazi.confidencePct + ziweiPct) / 2);
    const combinedLabel: DualRankedHour['combinedLabel'] =
      combinedPct >= 72 ? '较高' : combinedPct >= 55 ? '中等' : '偏低';
    const dualSummary = `八字解释力 ${row.bazi.confidencePct}%（${row.bazi.confidenceLabel}）· 紫微解释力 ${ziweiPct}%（${ziweiLabel}）· 综合 ${combinedPct}%（${combinedLabel}）。${row.bazi.summary} ${row.ziweiSummary}`;
    return {
      candidate: row.bazi.candidate,
      bazi: row.bazi,
      ziweiRaw: row.ziweiRaw,
      ziweiPct,
      ziweiLabel,
      ziweiHits: row.ziweiHits,
      ziweiWeaks: row.ziweiWeaks,
      ziweiMisses: row.ziweiMisses,
      ziweiSummary: row.ziweiSummary,
      combinedPct,
      combinedLabel,
      dualSummary,
    };
  });

  dual.sort(
    (a, b) =>
      b.combinedPct - a.combinedPct ||
      b.bazi.confidencePct - a.bazi.confidencePct ||
      a.candidate.midHour - b.candidate.midHour,
  );
  return dual;
}

export function dualProvisionalAdvice(ranked: DualRankedHour[]): string {
  const top = ranked[0];
  if (!top) return '暂无可用候选，请放宽时段或补充事件，并确认已选性别。';
  const alt = ranked[1];
  if (!alt) {
    return `双盘建议：优先采用${top.candidate.branch}时（综合 ${top.combinedPct}% · ${top.combinedLabel}）。`;
  }
  return `双盘建议：优先采用${top.candidate.branch}时（综合 ${top.combinedPct}%）；可选对照${alt.candidate.branch}时（综合 ${alt.combinedPct}%）。新事件可回来更新。`;
}

/** 测试辅助：仅紫微侧匹配 */
export function __matchZiweiEventForTest(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  candidate: HourCandidate,
  ev: RectifyEvent,
): EventMatch {
  return matchZiweiEvent(profile, gender, candidate, ev);
}

export function listDualCandidates(
  profile: LifeProfileInput,
  band: RectifyTimeBand,
): HourCandidate[] {
  return listHourCandidates(profile, band);
}
