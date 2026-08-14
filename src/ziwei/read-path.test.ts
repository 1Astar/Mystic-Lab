import { describe, expect, it } from 'vitest';
import {
  READ_PATH_TRAIL_IDS,
  formatReadPathTrailLine,
  resolveZiweiReadPath,
} from './read-path.ts';
import type { ZiweiChartView } from './types.ts';

function stubView(focusPalaces: string[] = []): ZiweiChartView {
  return {
    palaces: [],
    soulPalace: null as unknown as ZiweiChartView['soulPalace'],
    bodyPalace: null as unknown as ZiweiChartView['bodyPalace'],
    soul: '',
    body: '',
    fiveElementsClass: '',
    solarDate: '',
    timeLabel: '',
    clockLabel: '',
    trueSolarLabel: '',
    placeNote: '',
    genderLabel: '',
    intent: 'map',
    theater: {
      headline: '',
      pillars: [],
      comfort: [],
      annual: {
        year: 2026,
        question: '',
        mutagenLine: '',
        focusPalaces,
        advice: '',
        traditional: '',
        forecastGuide: '',
      },
      decade: {
        started: false,
        label: '',
        ageFrom: 0,
        ageTo: 0,
        theme: '',
        palaceName: '',
        majorStars: [],
        mutagenLine: '',
        lead: '',
        guide: '',
      },
    },
  };
}

describe('resolveZiweiReadPath', () => {
  it('trail is 先命再财短链', () => {
    const path = resolveZiweiReadPath(null, new Date('2026-08-10T12:00:00'));
    expect(path.trail.map((s) => s.palaceId)).toEqual([...READ_PATH_TRAIL_IDS]);
    expect(formatReadPathTrailLine(path)).toContain('→');
    expect(formatReadPathTrailLine(path)).toMatch(/命/);
  });

  it('same weekStart for dates in same ISO week', () => {
    const a = resolveZiweiReadPath(null, new Date('2026-08-10T12:00:00'));
    const b = resolveZiweiReadPath(null, new Date('2026-08-12T12:00:00'));
    expect(a.weekStart).toBe(b.weekStart);
    expect(a.focus.palaceId).toBe(b.focus.palaceId);
  });

  it('annual focus palace in pool overrides weekly rotation', () => {
    const path = resolveZiweiReadPath(stubView(['夫妻宫']), new Date('2026-08-10T12:00:00'));
    expect(path.focus.palaceId).toMatch(/夫妻/);
    expect(path.trailStep).toBe(4);
    expect(path.lead).toContain('短链第 4/');
  });

  it('annual focus outside pool does not break; still one focus', () => {
    const path = resolveZiweiReadPath(stubView(['田宅宫']), new Date('2026-08-10T12:00:00'));
    expect(path.focus.palaceId.length).toBeGreaterThan(0);
    expect(path.lead).toContain('本周只啃一宫');
  });
});
