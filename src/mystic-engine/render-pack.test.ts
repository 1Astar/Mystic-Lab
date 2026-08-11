import { describe, expect, it } from 'vitest';
import { linkifyHexInHtml } from './render-pack.ts';
import type { CastResult } from '../liuyao/engine.ts';
import type { Hexagram } from '../liuyao/hexagrams.ts';

function stubHex(name: string, fullName: string): Hexagram {
  return {
    index: 1,
    name,
    fullName,
    upper: '坎',
    lower: '巽',
    lines: [0, 0, 0, 0, 0, 0],
  } as Hexagram;
}

function stubCast(): CastResult {
  return {
    throws: [],
    primaryLines: [0, 0, 0, 0, 0, 0],
    changedLines: [0, 0, 0, 0, 0, 0],
    primary: stubHex('涣', '风水涣'),
    changed: stubHex('巽', '巽为风'),
    changingIndexes: [0],
    shiLine: 1,
    yingLine: 4,
    method: 'random',
  };
}

describe('linkifyHexInHtml', () => {
  it('does not leak button attributes when short names also match', () => {
    const lead = '（基于风水涣（huàn）卦变巽为风，结合你的问题）';
    const html = linkifyHexInHtml(lead, stubCast());

    expect(html).not.toMatch(/基于涣"/);
    expect(html).not.toMatch(/ly-hex-hot[^>]*>[^<]*ly-hex-hot/);
    expect(html).toContain('风水涣（huàn）');
    expect(html).toContain('巽为风');
    expect(html).toMatch(/data-hex-name="涣"/);
    expect(html).toMatch(/data-hex-name="巽"/);
    expect(html.match(/class="ly-hex-hot"/g)?.length).toBe(2);
  });

  it('still linkifies 本卦 / 变卦 in plain text only', () => {
    const html = linkifyHexInHtml('本卦看势，变卦看变', stubCast());
    expect(html.match(/ly-hex-hot/g)?.length).toBe(2);
    expect(html).toContain('>本卦</button>');
    expect(html).toContain('>变卦</button>');
  });
});
