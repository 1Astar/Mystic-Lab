import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import {
  listHourCandidates,
  resolveBranchesForBand,
  type RectifyTimeBand,
} from './rectify-candidates.ts';

const base = {
  ...EMPTY_PROFILE,
  birthYear: '2005',
  birthMonth: '12',
  birthDay: '23',
  birthPlace: '北京',
};

describe('resolveBranchesForBand', () => {
  it('maps morning / afternoon / all', () => {
    expect(resolveBranchesForBand({ kind: 'morning' })).toEqual(['卯', '辰', '巳']);
    expect(resolveBranchesForBand({ kind: 'afternoon' })).toEqual(['午', '未', '申']);
    expect(resolveBranchesForBand({ kind: 'all' })).toHaveLength(12);
  });

  it('keeps explicit branches in 子→亥 order', () => {
    const band: RectifyTimeBand = { kind: 'branches', branches: ['午', '卯', '午'] };
    expect(resolveBranchesForBand(band)).toEqual(['卯', '午']);
  });
});

describe('listHourCandidates', () => {
  it('returns one candidate per branch with hour pillar', () => {
    const list = listHourCandidates(base, { kind: 'afternoon' });
    expect(list).toHaveLength(3);
    expect(list.map((c) => c.branch)).toEqual(['午', '未', '申']);
    for (const c of list) {
      expect(c.birthHour).toMatch(/^\d{1,2}:\d{2}$/);
      expect(c.label).toContain('时');
      expect(c.hourPillar.length).toBe(2);
      expect(c.dayMaster).toBeTruthy();
    }
  });

  it('is stable for same inputs', () => {
    const a = listHourCandidates(base, { kind: 'morning' });
    const b = listHourCandidates(base, { kind: 'morning' });
    expect(a.map((c) => c.hourPillar)).toEqual(b.map((c) => c.hourPillar));
  });

  it('returns empty when birth date invalid', () => {
    expect(
      listHourCandidates(
        { ...base, birthYear: '' },
        { kind: 'all' },
      ),
    ).toEqual([]);
  });
});
