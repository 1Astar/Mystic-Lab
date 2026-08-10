import { describe, expect, it } from 'vitest';
import { getShenshaLore } from './shensha-lore.ts';
import {
  APP_SHENSHA_SCHOOL,
  SCHOOL_CONTRAST_ROWS,
  SCHOOL_OVERVIEW,
  getShenshaSchoolTag,
} from './shensha-school-contrast.ts';

describe('shensha school contrast', () => {
  it('marks app school as default (通行派)', () => {
    expect(APP_SHENSHA_SCHOOL).toBe('default');
    expect(SCHOOL_OVERVIEW.title).toMatch(/中州/);
  });

  it('covers 截路/截空/空亡 as distinct lore entries', () => {
    expect(getShenshaLore('截路')?.id).toBe('截路');
    expect(getShenshaLore('截空')?.id).toBe('截空');
    expect(getShenshaLore('空亡')?.id).toBe('空亡');
    expect(getShenshaSchoolTag('截路')?.school).toBe('default');
    expect(getShenshaSchoolTag('截空')?.school).toBe('zhongzhou');
  });

  it('has contrast rows for core school diffs', () => {
    const ids = SCHOOL_CONTRAST_ROWS.map((r) => r.id);
    expect(ids).toContain('jielu-jiekong');
    expect(ids).toContain('tianshi-tianshang');
    expect(ids).toContain('suipo');
    for (const row of SCHOOL_CONTRAST_ROWS) {
      expect(row.gloss.length).toBeGreaterThan(8);
      expect(row.relatedIds.length).toBeGreaterThan(0);
    }
  });
});
