import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { dressHexagram } from './najia.ts';
import { siZhuFromDate } from './ganzhi.ts';
import { renderYaoCard } from './yao-card.ts';

function castSample() {
  const throws = [
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
    facesToThrow([3, 3, 3]),
    facesToThrow([2, 2, 2]),
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('yao-card', () => {
  it('shows 六神 / 六亲 / 能量 for the clicked yao', () => {
    const cast = castSample();
    const castAt = new Date('2026-07-21T10:00:00');
    const row = dressHexagram(cast, siZhuFromDate(castAt).dayStem).rows[0]!;
    const html = renderYaoCard(row, '求职发展如何', {
      hexName: cast.primary.name,
      castAt,
    });
    expect(html).toMatch(/data-yao-sec="shen"/);
    expect(html).toMatch(/data-yao-sec="qin"/);
    expect(html).toMatch(/data-yao-sec="energy"/);
    expect(html).toMatch(new RegExp(row.liushen));
    expect(html).toMatch(new RegExp(row.liuqin));
    expect(html).toMatch(/月建/);
    expect(html).toMatch(/偏强|一般|偏弱/);
  });
});
