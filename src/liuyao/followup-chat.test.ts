import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { HEXAGRAMS, linesFromHexagram } from './hexagrams.ts';
import {
  buildFollowupPresets,
  buildFollowupSystemPrompt,
  hexChangeLabel,
} from './followup-chat.ts';

function castHuanToXun() {
  const huan = HEXAGRAMS.find((h) => h.name === '涣')!;
  const lines = linesFromHexagram(huan);
  const throws = lines.map((bit, i) => {
    const changing = i === 2;
    if (changing && bit === 0) return facesToThrow(['obverse', 'obverse', 'obverse']);
    if (changing && bit === 1) return facesToThrow(['reverse', 'reverse', 'reverse']);
    if (bit === 1) return facesToThrow(['obverse', 'obverse', 'reverse']);
    return facesToThrow(['obverse', 'reverse', 'reverse']);
  }) as YaoThrow[];
  return buildCastFromThrows(throws, 'coin');
}

describe('followup-chat', () => {
  it('labels 涣→巽 as 风水涣变…', () => {
    const cast = castHuanToXun();
    expect(hexChangeLabel(cast)).toMatch(/风水涣变/);
  });

  it('locks feminist career companion prompt with hex name', () => {
    const cast = castHuanToXun();
    const q = '我要不要留在冠英？转正能拿到8k吗？';
    const sys = buildFollowupSystemPrompt(cast, q);
    expect(sys).toMatch(/你知道这个卦叫/);
    expect(sys).toMatch(/女性主义/);
    expect(sys).toMatch(/职业规划/);
    expect(sys).toMatch(/风水涣/);
  });

  it('offers career presets with 8k / Offer / 拿捏', () => {
    const cast = castHuanToXun();
    const presets = buildFollowupPresets(
      cast,
      '我要不要留在冠英？8月初要不要离职？转正能拿到8k吗？',
    );
    expect(presets).toHaveLength(3);
    expect(presets[0]).toMatch(/8k|争取/);
    expect(presets[1]).toMatch(/Offer|简历/);
    expect(presets[2]).toMatch(/拿捏|巽/);
  });
});
