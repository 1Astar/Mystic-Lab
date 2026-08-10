import type { RectifyTimeBand } from './rectify-candidates.ts';
import {
  normalizeEvent,
  type RectifyEvent,
  type RectifyMode,
} from './rectify-events.ts';

const STORAGE_KEY = 'mystic-lab-bazi-rectify-draft';

export type EventFeedback = 'fit' | 'nofit' | 'unsure';

export type RectifyDraft = {
  mode: RectifyMode;
  band: RectifyTimeBand;
  /** 用户从时段中勾选保留的地支（2–4 个）；空=时段内全部 */
  keptBranches: string[];
  events: RectifyEvent[];
  /** key: `${branch}:${eventId}` */
  feedback: Record<string, EventFeedback>;
  updatedAt: string;
};

function parseBand(raw: unknown): RectifyTimeBand {
  if (!raw || typeof raw !== 'object') return { kind: 'evening' };
  const o = raw as { kind?: string; branches?: unknown };
  if (
    o.kind === 'morning' ||
    o.kind === 'afternoon' ||
    o.kind === 'evening' ||
    o.kind === 'night' ||
    o.kind === 'all'
  ) {
    return { kind: o.kind };
  }
  if (o.kind === 'branches' && Array.isArray(o.branches)) {
    return {
      kind: 'branches',
      branches: o.branches.map((b) => String(b)).filter(Boolean),
    };
  }
  return { kind: 'evening' };
}

function parseMode(raw: unknown): RectifyMode {
  if (raw === 'quick' || raw === 'deep' || raw === 'ongoing') return raw;
  return 'quick';
}

function parseFeedback(raw: unknown): Record<string, EventFeedback> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, EventFeedback> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (v === 'fit' || v === 'nofit' || v === 'unsure') out[k] = v;
  }
  return out;
}

export function loadRectifyDraft(): RectifyDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RectifyDraft>;
    const events = Array.isArray(parsed.events)
      ? parsed.events.map((e) => normalizeEvent(e as RectifyEvent))
      : [];
    const kept = Array.isArray(parsed.keptBranches)
      ? parsed.keptBranches.map((b) => String(b).replace(/时$/, '')).filter(Boolean)
      : [];
    return {
      mode: parseMode(parsed.mode),
      band: parseBand(parsed.band),
      keptBranches: kept.slice(0, 4),
      events,
      feedback: parseFeedback(parsed.feedback),
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveRectifyDraft(draft: RectifyDraft): void {
  const next: RectifyDraft = {
    mode: draft.mode,
    band: draft.band,
    keptBranches: (draft.keptBranches ?? []).slice(0, 4),
    events: draft.events.map(normalizeEvent).slice(0, 24),
    feedback: draft.feedback ?? {},
    updatedAt: draft.updatedAt || new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearRectifyDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function emptyRectifyDraft(): RectifyDraft {
  return {
    mode: 'quick',
    band: { kind: 'evening' },
    keptBranches: [],
    events: [],
    feedback: {},
    updatedAt: new Date().toISOString(),
  };
}

export function feedbackKey(branch: string, eventId: string): string {
  return `${branch}:${eventId}`;
}
