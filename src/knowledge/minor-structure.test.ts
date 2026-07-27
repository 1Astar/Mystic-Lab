import { describe, expect, it } from 'vitest';
import { buildMinorSuitNumberFormula } from './minor-structure.ts';

describe('minor suit × number formula', () => {
  it('builds cups-six line', () => {
    const f = buildMinorSuitNumberFormula('cups-six');
    expect(f).toBeTruthy();
    expect(f!.line).toMatch(/圣杯/);
    expect(f!.line).toMatch(/\+ 6/);
    expect(f!.line).toMatch(/=/);
    expect(f!.isCourt).toBe(false);
  });

  it('returns null for major', () => {
    expect(buildMinorSuitNumberFormula('major-0')).toBeNull();
  });

  it('handles court cards', () => {
    const f = buildMinorSuitNumberFormula('cups-knight');
    expect(f?.isCourt).toBe(true);
    expect(f?.line).toMatch(/圣杯/);
  });
});
