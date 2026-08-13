import { describe, expect, it } from 'vitest';
import {
  buildLiveSuitNumberBlend,
  buildMinorSuitNumberFormula,
} from './minor-structure.ts';

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

describe('live suit × number blend', () => {
  it('合成星币 × 5', () => {
    const b = buildLiveSuitNumberBlend('pentacles', '5');
    expect(b).toBeTruthy();
    expect(b!.line).toBe('星币（现实）× 5（冲突）→ 物质与工作里的摩擦与挑战');
    expect(b!.deckId).toBe('pentacles-five');
    expect(b!.nameCn).toMatch(/星币/);
  });
});
