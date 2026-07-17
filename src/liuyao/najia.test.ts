import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  branchesFromLines,
  dressHexagram,
  liuqinOf,
  liushenForDayStem,
} from './najia.ts';

/** 雷地豫：下坤上震 → 未巳卯 + 子寅辰 */
function castYu(): ReturnType<typeof buildCastFromThrows> {
  // 坤下 000 + 震上 100 = 未巳卯子寅辰；豫无动则六爻静
  const bits = [0, 0, 0, 1, 0, 0] as const;
  const throws: YaoThrow[] = bits.map((bit) => {
    const coins =
      bit === 1
        ? (['reverse', 'obverse', 'obverse'] as const) // 7 少阳
        : (['obverse', 'reverse', 'reverse'] as const); // 8 少阴
    return facesToThrow([...coins] as [typeof coins[0], typeof coins[1], typeof coins[2]]);
  });
  return buildCastFromThrows(throws, 'random');
}

describe('najia', () => {
  it('纳甲：雷地豫地支为未巳卯子寅辰', () => {
    const cast = castYu();
    expect(cast.primary.name).toBe('豫');
    expect(branchesFromLines(cast.primaryLines)).toEqual(['未', '巳', '卯', '子', '寅', '辰']);
  });

  it('壬日起六神：初玄武', () => {
    expect(liushenForDayStem('壬')[0]).toBe('玄武');
    expect(liushenForDayStem('壬')).toEqual([
      '玄武',
      '青龙',
      '朱雀',
      '勾陈',
      '腾蛇',
      '白虎',
    ]);
  });

  it('震宫木：克土为妻财，生火为子孙', () => {
    expect(liuqinOf('木', '土')).toBe('妻财');
    expect(liuqinOf('木', '火')).toBe('子孙');
    expect(liuqinOf('木', '水')).toBe('父母');
    expect(liuqinOf('木', '金')).toBe('官鬼');
    expect(liuqinOf('木', '木')).toBe('兄弟');
  });

  it('dressHexagram 豫卦震宫 + 壬日', () => {
    const cast = castYu();
    const dressed = dressHexagram(cast, '壬');
    expect(dressed.palace).toBe('震');
    expect(dressed.palaceWx).toBe('木');
    expect(dressed.rows[0]!.branch).toBe('未');
    expect(dressed.rows[0]!.liuqin).toBe('妻财'); // 木克土
    expect(dressed.rows[0]!.liushen).toBe('玄武');
    expect(dressed.rows.some((r) => r.isShi)).toBe(true);
  });
});
