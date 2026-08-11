import { describe, expect, it } from 'vitest';
import { getStarProfile, FOCUS_PALACES, listMajorProfiles } from './star-profiles.ts';
import { MAJOR_STARS } from './stars.ts';
import { PALACE_LORE, getPalaceLore } from './palace-lore.ts';
import { COMBO_LORE, getComboLore } from './combo-lore.ts';

describe('ziwei star-profiles', () => {
  it('fills all 14 majors for 4-panel detail', () => {
    expect(listMajorProfiles()).toHaveLength(MAJOR_STARS.length);
    for (const s of MAJOR_STARS) {
      const p = getStarProfile(s.id);
      expect(p?.starId).toBe(s.id);
      expect(p!.oneLiner.length).toBeGreaterThan(4);
      expect(p!.keywords.length).toBeGreaterThanOrEqual(3);
      expect(p!.keywords.length).toBeLessThanOrEqual(4);
      expect(p!.metaphor.length).toBeGreaterThan(4);
      expect(p!.palaces).toHaveLength(FOCUS_PALACES.length);
      expect(p!.trait.drive.length).toBeGreaterThan(4);
      expect(p!.trait.gift.length).toBeGreaterThan(4);
      expect(p!.trait.shadow.length).toBeGreaterThan(4);
      expect(p!.trait.need.length).toBeGreaterThan(4);
      expect(p!.mirror.work.length).toBeGreaterThan(4);
      expect(p!.counsel.length).toBeGreaterThan(4);
    }
    expect(getStarProfile('太阳')?.artSrc).toContain('太阳.webp');
    expect(getStarProfile('贪狼')?.artSrc).toContain('贪狼.webp');
    expect(getStarProfile('破军')?.artSrc).toContain('破军.webp');
    expect(getStarProfile('七杀')?.artSrc).toContain('七杀.webp');
    for (const s of MAJOR_STARS) {
      expect(getStarProfile(s.id)?.artSrc).toMatch(/\.webp$/);
    }
  });
});

describe('ziwei palace & combo lore', () => {
  it('has 12 palaces', () => {
    expect(PALACE_LORE).toHaveLength(12);
    expect(getPalaceLore('命宫')?.hint).toBe('我是谁');
    expect(getPalaceLore('仆役')?.title).toBe('奴仆宫');
  });

  it('has core combos', () => {
    expect(COMBO_LORE.length).toBeGreaterThanOrEqual(4);
    expect(getComboLore('杀破狼')?.members).toContain('七杀');
    expect(getComboLore('机月同梁')?.members).toContain('天机');
  });
});
