import { describe, expect, it, beforeEach } from 'vitest';
import {
  formatPalmJourneyLevel,
  getContinuePalmChapter,
  getNextPalmChapter,
  getPalmJourneyLevel,
  isPalmJourneyComplete,
  loadPalmJourneyProgress,
  markPalmChapterDone,
  markPalmJourneyCelebrated,
  PALM_JOURNEY_CHAPTERS,
} from './palm-journey.ts';

const KEY = 'mystic-lab-xiaoliuren-palm-journey';

function mockLocalStorage(): void {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, String(v));
      },
      removeItem: (k: string) => {
        store.delete(k);
      },
      clear: () => store.clear(),
    },
  });
}

describe('palm journey levels', () => {
  beforeEach(() => {
    mockLocalStorage();
    localStorage.removeItem(KEY);
  });

  it('maps six chapters to Lv1–Lv6', () => {
    expect(PALM_JOURNEY_CHAPTERS.map((c) => [c.level, c.title])).toEqual([
      [1, '认识六神'],
      [2, '学会看农历'],
      [3, '学会辨别时辰'],
      [4, '完成一次起课'],
      [5, '学会理解结果'],
      [6, '学会自己解释'],
    ]);
  });

  it('tracks level as chapters complete', () => {
    expect(getPalmJourneyLevel()).toBe(0);
    expect(formatPalmJourneyLevel()).toBe('Lv0');
    markPalmChapterDone('gods');
    expect(getPalmJourneyLevel()).toBe(1);
    markPalmChapterDone('lunar');
    expect(getContinuePalmChapter().id).toBe('hour');
    expect(getNextPalmChapter('gods')?.id).toBe('lunar');
  });

  it('migrates legacy palm-count into first-cast', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify({ completed: ['gods', 'palm-count'], celebrated: false }),
    );
    const progress = loadPalmJourneyProgress();
    expect(progress.completed).toContain('gods');
    expect(progress.completed).toContain('first-cast');
    expect(progress.completed).not.toContain('palm-count');
  });

  it('completes at Lv6', () => {
    for (const c of PALM_JOURNEY_CHAPTERS) markPalmChapterDone(c.id);
    expect(isPalmJourneyComplete()).toBe(true);
    expect(getPalmJourneyLevel()).toBe(6);
    expect(markPalmJourneyCelebrated().celebrated).toBe(true);
  });
});
