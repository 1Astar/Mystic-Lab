import { describe, expect, it } from 'vitest';
import { deriveAgeFromBirth, effectiveAge } from './age.ts';

describe('deriveAgeFromBirth', () => {
  it('computes full years from birthday', () => {
    const at = new Date(2026, 6, 29); // Jul 29 2026
    expect(deriveAgeFromBirth('1996', '8', '12', at)).toBe('29');
    expect(deriveAgeFromBirth('1996', '7', '29', at)).toBe('30');
    expect(deriveAgeFromBirth('1996', '7', '30', at)).toBe('29');
  });

  it('returns empty for invalid year', () => {
    expect(deriveAgeFromBirth('', '1', '1')).toBe('');
    expect(deriveAgeFromBirth('abc')).toBe('');
  });

  it('effectiveAge prefers birth over stored age', () => {
    const at = new Date(2026, 6, 29);
    expect(
      effectiveAge(
        { age: '99', birthYear: '1996', birthMonth: '8', birthDay: '12' },
        at,
      ),
    ).toBe('29');
    expect(
      effectiveAge({ age: '31', birthYear: '', birthMonth: '', birthDay: '' }, at),
    ).toBe('31');
  });
});
