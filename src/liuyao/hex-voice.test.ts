import { describe, expect, it } from 'vitest';
import { HEXAGRAMS } from './hexagrams.ts';
import { getHexVoice, HEX_VOICE } from './hex-voice.ts';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { linesFromHexagram } from './hexagrams.ts';
import { buildDirectReading } from './direct-reading.ts';

describe('HEX_VOICE', () => {
  it('covers all 64 hexagrams with non-empty fields', () => {
    expect(Object.keys(HEX_VOICE)).toHaveLength(64);
    for (const hex of HEXAGRAMS) {
      const v = getHexVoice(hex.name);
      expect(v, hex.name).toBeDefined();
      expect(v!.frame.length, hex.name).toBeGreaterThan(2);
      expect(v!.asChanged.length, hex.name).toBeGreaterThan(2);
      expect(v!.metaphorSolo.length, hex.name).toBeGreaterThan(6);
      expect(v!.verdict.length, hex.name).toBeGreaterThan(6);
      expect(v!.mapAsk).toMatch(/对应你的问题/);
      expect(v!.decision.split('\n').length, hex.name).toBeGreaterThanOrEqual(2);
    }
  });

  it('neutral hexes no longer share the same generic metaphor', () => {
    function soloCast(name: string) {
      const hex = HEXAGRAMS.find((h) => h.name === name)!;
      const lines = linesFromHexagram(hex);
      const throws = lines.map((bit) =>
        bit === 1
          ? facesToThrow(['obverse', 'obverse', 'reverse'])
          : facesToThrow(['obverse', 'reverse', 'reverse']),
      ) as YaoThrow[];
      return buildCastFromThrows(throws, 'coin');
    }
    const xu = buildDirectReading(soloCast('需'), '这件事接下来怎么走？');
    const gen = buildDirectReading(soloCast('艮'), '这件事接下来怎么走？');
    expect(xu.coreMetaphor).toMatch(/等待|准备|时机|窗口/);
    expect(gen.coreMetaphor).toMatch(/停|边界|止/);
    expect(xu.coreMetaphor).not.toBe(gen.coreMetaphor);
    expect(xu.verdict).not.toBe(gen.verdict);
    expect(xu.analysis).toMatch(/蓄力待时|等待时机/);
    expect(gen.analysis).toMatch(/止住边界|该停则停/);
  });
});
