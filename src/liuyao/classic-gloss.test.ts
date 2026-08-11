import { describe, expect, it } from 'vitest';
import { HEXAGRAMS } from './hexagrams.ts';
import { glossLine, LINE_GLOSS } from './classic-gloss.ts';

describe('LINE_GLOSS', () => {
  it('covers all 64 hexagrams with 6 lines each', () => {
    expect(Object.keys(LINE_GLOSS)).toHaveLength(64);
    for (const hex of HEXAGRAMS) {
      const lines = LINE_GLOSS[hex.name];
      expect(lines, hex.name).toBeDefined();
      expect(lines!.length, hex.name).toBe(6);
      for (let i = 0; i < 6; i++) {
        expect(glossLine(hex.name, i)?.length, `${hex.name}[${i}]`).toBeGreaterThan(4);
      }
    }
  });

  it('keeps 乾初九 teaching gloss', () => {
    expect(glossLine('乾', 0)).toMatch(/潜|时机未到/);
  });

  it('大有九二 is 大车以载 gloss, not 同人窜文', () => {
    expect(glossLine('大有', 1)).toMatch(/大车/);
  });
});
