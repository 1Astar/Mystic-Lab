import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import {
  buildShichenDiffProfiles,
  diffProfileByBranch,
  summarizePairDiff,
  traitHitBitmap,
  SHICHEN_TRAITS,
} from './rectify-shichen-diff.ts';

const base = {
  ...EMPTY_PROFILE,
  birthYear: '1970',
  birthMonth: '3',
  birthDay: '29',
  birthPlace: '北京',
};

describe('buildShichenDiffProfiles', () => {
  it('returns 12 profiles for a valid birth date', () => {
    const rows = buildShichenDiffProfiles(base);
    expect(rows.length).toBe(12);
    expect(rows.map((r) => r.branch).join('')).toBe('子丑寅卯辰巳午未申酉戌亥');
  });

  it('is reproducible across calls', () => {
    const a = buildShichenDiffProfiles(base);
    const b = buildShichenDiffProfiles(base);
    expect(a.map((r) => r.hourPillar)).toEqual(b.map((r) => r.hourPillar));
    expect(a.map((r) => r.stemGod)).toEqual(b.map((r) => r.stemGod));
    expect(a.map((r) => r.behaviorTraitIds.join(','))).toEqual(
      b.map((r) => r.behaviorTraitIds.join(',')),
    );
  });

  it('differs across branches on the same day', () => {
    const rows = buildShichenDiffProfiles(base);
    const pillars = new Set(rows.map((r) => r.hourPillar));
    expect(pillars.size).toBeGreaterThan(1);
    const metaphors = new Set(rows.map((r) => r.weatherMetaphor));
    expect(metaphors.size).toBeGreaterThan(3);
    const withTraits = rows.filter((r) => r.behaviorTraitIds.length > 0);
    expect(withTraits.length).toBeGreaterThan(0);
  });

  it('fills appearance and vsDay fields', () => {
    const rows = buildShichenDiffProfiles(base);
    const si = diffProfileByBranch(rows, '巳');
    expect(si).toBeTruthy();
    expect(si!.hourPillar.length).toBe(2);
    expect(si!.weatherMetaphor.length).toBeGreaterThan(2);
    expect(si!.appearanceHints.length).toBeGreaterThan(0);
    expect(si!.dayMaster.length).toBeGreaterThan(0);
  });

  it('returns empty for invalid date', () => {
    expect(
      buildShichenDiffProfiles({
        ...EMPTY_PROFILE,
        birthYear: 'xxxx',
        birthMonth: '1',
        birthDay: '1',
      }),
    ).toEqual([]);
  });

  it('traitHitBitmap length matches SHICHEN_TRAITS', () => {
    const rows = buildShichenDiffProfiles(base);
    const bmp = traitHitBitmap(rows[0]!);
    expect(bmp.length).toBe(SHICHEN_TRAITS.length);
  });

  it('summarizePairDiff lists real differences', () => {
    const rows = buildShichenDiffProfiles(base);
    const a = diffProfileByBranch(rows, '卯')!;
    const b = diffProfileByBranch(rows, '酉')!;
    const lines = summarizePairDiff(a, b);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((l) => l.includes('时柱') || l.includes('气场'))).toBe(true);
  });
});
