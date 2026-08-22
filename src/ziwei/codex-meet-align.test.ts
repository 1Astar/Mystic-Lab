import { describe, expect, it } from 'vitest';
import { formatMeetAtLine, type ChartStarHit } from './codex-collect.ts';
import { getStarProfile } from './star-profiles.ts';
import { sectionsFromMinor, sectionsFromShensha } from './soft-star-sections.ts';
import { AUX_STARS } from './stars.ts';
import { MINOR_STAR_LORE } from './minor-star-lore.ts';
import { SHENSHA_LORE } from './shensha-lore.ts';

describe('meet line unified', () => {
  it('formats natal meet for major-style hits', () => {
    const hit: ChartStarHit = { palace: '命', meetSource: 'natal' };
    expect(formatMeetAtLine(hit)).toBe('📍 相遇于：命宫 · 本命盘');
  });
});

describe('aux profiles align with majors', () => {
  it('every aux star has curated keywords + trait', () => {
    for (const s of AUX_STARS) {
      const p = getStarProfile(s.id);
      expect(p, s.id).toBeTruthy();
      expect(p!.keywords.length).toBeGreaterThanOrEqual(2);
      expect(p!.trait.drive.length).toBeGreaterThan(4);
      expect(p!.mirror.work.length).toBeGreaterThan(4);
      expect(p!.palaces.length).toBe(6);
    }
  });
});

describe('soft star sections', () => {
  it('expands minor and shensha into four-panel fields', () => {
    const m = sectionsFromMinor(MINOR_STAR_LORE[0]!);
    expect(m.trait.gift.length).toBeGreaterThan(4);
    expect(m.mirror.love.length).toBeGreaterThan(4);
    const s = sectionsFromShensha(SHENSHA_LORE[0]!);
    expect(s.when || s.howTo).toBeTruthy();
    expect(s.keywords.length).toBeGreaterThan(0);
  });
});
