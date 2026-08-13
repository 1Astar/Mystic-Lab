import { describe, expect, it } from 'vitest';
import { createEmptyPerson } from '../life/types.ts';
import {
  BAZI_BUFF_DELTA,
  buildBuffEntriesFromBazi,
  calendarMonthToLiuyueIndex,
  effectsForBaziTenGod,
} from './spirit-buff-bazi.ts';

describe('spirit-buff-bazi', () => {
  it('maps calendar month to 立春起流月 index', () => {
    expect(calendarMonthToLiuyueIndex(2)).toBe(0);
    expect(calendarMonthToLiuyueIndex(1)).toBe(11);
    expect(calendarMonthToLiuyueIndex(6)).toBe(4);
  });

  it('流月 delta weaker than 流年', () => {
    expect(BAZI_BUFF_DELTA.liuyue).toBeLessThan(BAZI_BUFF_DELTA.liunian);
    const y = effectsForBaziTenGod('食神', 'liunian');
    const m = effectsForBaziTenGod('食神', 'liuyue');
    expect(y && m).toBeTruthy();
    expect(Math.abs((m!.effects[0]!.mult) - 1)).toBeLessThan(
      Math.abs((y!.effects[0]!.mult) - 1),
    );
  });

  it('builds dayun + liunian + liuyue; dayun weaker than liunian', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const entries = buildBuffEntriesFromBazi(person, 2026, 6);
    expect(entries.some((e) => e.baziLayer === 'dayun')).toBe(true);
    expect(entries.some((e) => e.baziLayer === 'liunian')).toBe(true);
    expect(entries.some((e) => e.baziLayer === 'liuyue')).toBe(true);
    expect(BAZI_BUFF_DELTA.dayun).toBeLessThan(BAZI_BUFF_DELTA.liunian);
    expect(BAZI_BUFF_DELTA.liuyue).toBeLessThan(BAZI_BUFF_DELTA.dayun);
  });

  it('builds liunian + liuyue entries from profile', () => {
    const person = createEmptyPerson({
      nickname: '测',
      gender: 'female',
      birthYear: '1990',
      birthMonth: '5',
      birthDay: '12',
      birthHour: '14:30',
      birthPlace: '成都',
    });
    const entries = buildBuffEntriesFromBazi(person, 2026, 6);
    expect(entries.some((e) => e.baziLayer === 'liunian')).toBe(true);
    expect(entries.some((e) => e.baziLayer === 'liuyue')).toBe(true);
    expect(entries.every((e) => e.lane === 'bazi')).toBe(true);
    const blob = entries.map((e) => e.advice).join('');
    expect(blob).not.toMatch(/必凶|倒霉|缺什么/);
  });
});
