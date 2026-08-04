import type { RectifyTimeBand } from './rectify-candidates.ts';
import { normalizeEvent, type RectifyEvent } from './rectify-events.ts';

const STORAGE_KEY = 'mystic-lab-bazi-rectify-draft';

export type RectifyDraft = {
  band: RectifyTimeBand;
  events: RectifyEvent[];
  updatedAt: string;
};

function parseBand(raw: unknown): RectifyTimeBand {
  if (!raw || typeof raw !== 'object') return { kind: 'all' };
  const o = raw as { kind?: string; branches?: unknown };
  if (o.kind === 'morning' || o.kind === 'afternoon' || o.kind === 'evening' || o.kind === 'night' || o.kind === 'all') {
    return { kind: o.kind };
  }
  if (o.kind === 'branches' && Array.isArray(o.branches)) {
    return {
      kind: 'branches',
      branches: o.branches.map((b) => String(b)).filter(Boolean),
    };
  }
  return { kind: 'all' };
}

export function loadRectifyDraft(): RectifyDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RectifyDraft>;
    const events = Array.isArray(parsed.events)
      ? parsed.events.map((e) => normalizeEvent(e as RectifyEvent))
      : [];
    return {
      band: parseBand(parsed.band),
      events,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveRectifyDraft(draft: RectifyDraft): void {
  const next: RectifyDraft = {
    band: draft.band,
    events: draft.events.map(normalizeEvent).slice(0, 20),
    updatedAt: draft.updatedAt || new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function clearRectifyDraft(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function emptyRectifyDraft(): RectifyDraft {
  return {
    band: { kind: 'all' },
    events: [],
    updatedAt: new Date().toISOString(),
  };
}
