import { LunarUtil, Solar } from 'lunar-javascript';
import type { LifeProfileInput } from '../life/types.ts';
import { resolveBirthPlaceLng } from './cities.ts';
import type { EventFeedback } from './rectify-draft.ts';
import { feedbackKey } from './rectify-draft.ts';
import { listHourCandidates, type HourCandidate, type RectifyTimeBand } from './rectify-candidates.ts';
import {
  eventLabel,
  filledEvents,
  minEventsForMode,
  type RectifyEvent,
  type RectifyEventType,
  type RectifyMode,
} from './rectify-events.ts';
import { categorizeTenGod, type TenGodCategory } from './ten-gods.ts';
import { toTrueSolarDate } from './true-solar.ts';

export type EventMatchKind = 'hit' | 'weak' | 'miss';

export type EventMatch = {
  event: RectifyEvent;
  kind: EventMatchKind;
  year: number;
  ganZhi: string;
  stemGod: string;
  reason: string;
  points: number;
};

export type RankedHourCandidate = {
  candidate: HourCandidate;
  /** 原始分（含 midHour 微扰，兼容旧测试） */
  score: number;
  /** 0–100 相对可信度 */
  confidencePct: number;
  confidenceLabel: '较高' | '中等' | '偏低';
  rationale: string;
  /** 人话摘要，如「能较好解释…但对…较弱」 */
  summary: string;
  hits: EventMatch[];
  misses: EventMatch[];
  weaks: EventMatch[];
  supportReasons: string[];
  tieGroup: number;
};

const TYPE_PREFER: Record<RectifyEventType, TenGodCategory[]> = {
  enroll: ['yin', 'shi_shang'],
  graduate: ['yin', 'shi_shang'],
  job_in: ['guan_sha', 'cai', 'shi_shang'],
  job_out: ['guan_sha', 'bi_jie', 'shi_shang'],
  move: ['bi_jie', 'shi_shang'],
  house: ['cai', 'yin'],
  love: ['cai', 'guan_sha', 'yin'],
  breakup: ['guan_sha', 'shi_shang', 'cai'],
  marry: ['cai', 'guan_sha', 'yin'],
  illness: ['guan_sha', 'shi_shang'],
  surgery: ['guan_sha', 'shi_shang'],
  accident: ['guan_sha', 'bi_jie'],
  family: ['yin', 'guan_sha'],
  wealth: ['cai', 'shi_shang'],
  study: ['yin', 'shi_shang'],
  career: ['guan_sha', 'cai', 'shi_shang'],
  relation: ['cai', 'guan_sha', 'yin'],
  health: ['guan_sha', 'shi_shang'],
  peak: ['shi_shang', 'guan_sha', 'cai'],
  low: ['guan_sha', 'bi_jie', 'shi_shang'],
  other: ['shi_shang', 'cai', 'guan_sha'],
};

function genderCode(gender: '' | 'female' | 'male'): number {
  return gender === 'male' ? 1 : 0;
}

function shiShen(dayGan: string, otherGan: string): string {
  if (!dayGan || !otherGan) return '';
  const table = LunarUtil.SHI_SHEN as Record<string, string>;
  return table[dayGan + otherGan] || '';
}

type LiuHit = { year: number; ganZhi: string; stemGod: string; cat: TenGodCategory | null };

function liunianHitsForProfile(
  profile: LifeProfileInput,
  birthHour: string,
  gender: '' | 'female' | 'male',
  years: number[],
): LiuHit[] {
  const y = Number(profile.birthYear);
  const m = Number(profile.birthMonth);
  const d = Number(profile.birthDay);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return [];

  const hm = birthHour.split(':');
  const hour = Number(hm[0] ?? 12);
  const minute = Number(hm[1] ?? 0);
  const place = resolveBirthPlaceLng(profile.birthPlace);
  const clock = new Date(y, m - 1, d, hour, minute, 0);
  if (Number.isNaN(clock.getTime())) return [];
  const trueSolar = toTrueSolarDate(clock, place.lng);
  const lunar = Solar.fromDate(trueSolar).getLunar();
  const ec = lunar.getEightChar() as unknown as {
    getDayGan: () => string;
    getYun: (gender: number) => {
      getDaYun: () => Array<{
        getStartYear: () => number;
        getEndYear?: () => number;
        getLiuNian: () => Array<{ getYear: () => number; getGanZhi: () => string }>;
      }>;
    };
  };
  const dayGan = ec.getDayGan();
  const yun = ec.getYun(genderCode(gender));
  const daYunList = yun.getDaYun();

  const hits: LiuHit[] = [];
  for (const year of years) {
    for (const dy of daYunList) {
      const start = dy.getStartYear();
      const end = typeof dy.getEndYear === 'function' ? dy.getEndYear() : start + 9;
      if (year < start || year > end) continue;
      const liu = dy.getLiuNian() || [];
      const row = liu.find((n) => n.getYear() === year);
      if (!row) continue;
      const ganZhi = row.getGanZhi();
      const stem = ganZhi.charAt(0);
      const god = shiShen(dayGan, stem);
      hits.push({
        year,
        ganZhi,
        stemGod: god,
        cat: categorizeTenGod(god),
      });
      break;
    }
  }
  return hits;
}

function yearsForEvent(e: RectifyEvent): number[] {
  if (e.yearSlack === 1 || e.precision === 'year' || e.precision === 'family_fuzzy') {
    return [e.year - 1, e.year, e.year + 1];
  }
  return [e.year];
}

function matchOneEvent(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  candidate: HourCandidate,
  ev: RectifyEvent,
  feedback?: EventFeedback,
): EventMatch {
  const years = yearsForEvent(ev);
  const hits = liunianHitsForProfile(profile, candidate.birthHour, gender, years);
  const prefer = TYPE_PREFER[ev.type] ?? TYPE_PREFER.other;
  const label = eventLabel(ev);

  if (hits.length === 0) {
    let points = 1;
    if (feedback === 'fit') points += 8;
    if (feedback === 'nofit') points = Math.max(0, points - 6);
    return {
      event: ev,
      kind: 'miss',
      year: ev.year,
      ganZhi: '',
      stemGod: '',
      reason: `未能在 ${label} 窗口排出清晰流年结构`,
      points,
    };
  }

  let best = 0;
  let bestHit = hits[0]!;
  for (const h of hits) {
    let s = 4;
    if (h.cat && prefer.includes(h.cat)) s += 6;
    else if (h.cat) s += 2;
    if (s > best) {
      best = s;
      bestHit = h;
    }
  }

  if (feedback === 'fit') best += 12;
  if (feedback === 'nofit') best = Math.max(0, best - 14);

  const kind: EventMatchKind = best >= 9 ? 'hit' : best >= 5 ? 'weak' : 'miss';
  const reason =
    kind === 'hit'
      ? `${bestHit.year} 流年 ${bestHit.ganZhi}${bestHit.stemGod ? `（${bestHit.stemGod}）` : ''} 与「${label}」较合拍`
      : kind === 'weak'
        ? `${bestHit.year} 流年 ${bestHit.ganZhi} 有信号，但对「${label}」解释偏弱`
        : `${bestHit.year} 流年 ${bestHit.ganZhi} 难以支撑「${label}」`;

  return {
    event: ev,
    kind,
    year: bestHit.year,
    ganZhi: bestHit.ganZhi,
    stemGod: bestHit.stemGod,
    reason,
    points: best,
  };
}

function buildSummary(
  candidate: HourCandidate,
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
    return `${candidate.branch}时能较好解释 ${hitBits || '已填事件'}；暂无明显未命中。`;
  }
  if (hits.length && misses.length) {
    return `${candidate.branch}时能较好解释 ${hitBits}；但难以解释 ${missBits}。`;
  }
  if (weaks.length && !hits.length) {
    return `${candidate.branch}时对多数事件只有弱信号，可信度有限。`;
  }
  return `${candidate.branch}时与已填事件的对应偏弱，建议补充事件或改时段再比。`;
}

function confidenceFromRaw(rawMain: number, maxMain: number): {
  pct: number;
  label: '较高' | '中等' | '偏低';
} {
  if (maxMain <= 0) return { pct: 40, label: '偏低' };
  const ratio = rawMain / maxMain;
  const pct = Math.round(42 + ratio * 48); // 约 42–90
  const clamped = Math.min(92, Math.max(38, pct));
  const label = clamped >= 72 ? '较高' : clamped >= 55 ? '中等' : '偏低';
  return { pct: clamped, label };
}

export type ScoreOpts = {
  mode?: RectifyMode;
  /** 仅保留这些地支；空=时段内全部 */
  keptBranches?: string[];
  feedback?: Record<string, EventFeedback>;
};

/**
 * 规则打分：事件年 ↔ 流年十神偏好 + 用户反馈修正。禁止 LLM。
 */
export function scoreHourCandidates(
  profile: LifeProfileInput,
  gender: '' | 'female' | 'male',
  band: RectifyTimeBand,
  events: RectifyEvent[],
  opts?: ScoreOpts,
): RankedHourCandidate[] {
  const filled = filledEvents(events);
  const minN = minEventsForMode(opts?.mode);
  if (filled.length < minN) return [];

  let candidates = listHourCandidates(profile, band);
  const kept = (opts?.keptBranches ?? [])
    .map((b) => b.replace(/时$/, '').trim())
    .filter(Boolean);
  if (kept.length >= 2) {
    const set = new Set(kept);
    candidates = candidates.filter((c) => set.has(c.branch));
  }

  const fb = opts?.feedback ?? {};
  const draftRows = candidates.map((candidate) => {
    const matches = filled.map((ev) =>
      matchOneEvent(profile, gender, candidate, ev, fb[feedbackKey(candidate.branch, ev.id)]),
    );
    const hits = matches.filter((m) => m.kind === 'hit');
    const weaks = matches.filter((m) => m.kind === 'weak');
    const misses = matches.filter((m) => m.kind === 'miss');
    const rawMain = matches.reduce((s, m) => s + m.points, 0);
    const score = rawMain * 100 + candidate.midHour;
    const bits = hits
      .concat(weaks)
      .slice(0, 3)
      .map((m) => `${m.year}流年${m.ganZhi}`);
    const rationale =
      bits.length > 0
        ? `对照 ${bits.join('、')} 等流年结构`
        : '能排出流年结构，但贴合信号偏弱';
    const supportReasons = hits.slice(0, 4).map((h) => h.reason);
    return {
      candidate,
      score,
      rawMain,
      rationale,
      summary: buildSummary(candidate, hits, misses, weaks),
      hits,
      misses,
      weaks,
      supportReasons,
    };
  });

  draftRows.sort((a, b) => b.score - a.score || a.candidate.midHour - b.candidate.midHour);

  const maxMain = Math.max(...draftRows.map((r) => r.rawMain), 1);
  const ranked: RankedHourCandidate[] = [];
  let group = 0;
  for (let i = 0; i < draftRows.length; i++) {
    const row = draftRows[i]!;
    if (i > 0) {
      const prev = Math.floor(draftRows[i - 1]!.score / 100);
      const cur = Math.floor(row.score / 100);
      if (cur !== prev) group += 1;
    }
    const conf = confidenceFromRaw(row.rawMain, maxMain);
    const adj = i === 0 ? 0 : Math.min(12, i * 4);
    const confidencePct = Math.max(35, conf.pct - adj);
    ranked.push({
      candidate: row.candidate,
      score: row.score,
      confidencePct,
      confidenceLabel:
        confidencePct >= 72 ? '较高' : confidencePct >= 55 ? '中等' : '偏低',
      rationale: row.rationale,
      summary: row.summary,
      hits: row.hits,
      misses: row.misses,
      weaks: row.weaks,
      supportReasons: row.supportReasons,
      tieGroup: group,
    });
  }

  return ranked;
}

export function provisionalAdvice(ranked: RankedHourCandidate[]): string {
  const top = ranked[0];
  if (!top) return '暂无可用候选，请放宽时段或补充事件。';
  const alt = ranked[1];
  if (!alt) {
    return `当前建议：优先采用${top.candidate.branch}时（可信度${top.confidenceLabel}），后续有新事件可继续校正。`;
  }
  return `当前建议：优先采用${top.candidate.branch}时（${top.confidencePct}% · ${top.confidenceLabel}）；可选对照${alt.candidate.branch}时（${alt.confidencePct}%）。出现新事件后请回来更新。`;
}
