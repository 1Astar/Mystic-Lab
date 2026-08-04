import { describe, expect, it } from 'vitest';
import { createSelfPerson } from '../life/types.ts';
import { resolveBaziPathForPerson } from './lab-me-drawer.ts';

describe('lab me drawer · 八字跳转', () => {
  it('有年月日 → 摘要 reading', () => {
    const p = createSelfPerson({
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '',
    });
    expect(resolveBaziPathForPerson(p)).toBe('/bazi/reading');
  });

  it('缺出生 → 八字首页补信息', () => {
    expect(resolveBaziPathForPerson(createSelfPerson())).toBe('/bazi');
  });
});
