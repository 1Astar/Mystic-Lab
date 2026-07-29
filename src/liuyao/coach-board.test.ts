import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { HEXAGRAMS, linesFromHexagram } from './hexagrams.ts';
import { buildCompactHexagramPayload } from './board-compact.ts';
import { formatHexWithPinyin, hexPinyin } from './hex-pinyin.ts';
import { LIUYAO_COACH_SYSTEM, buildLiuyaoCoachUserMessage } from './coach-prompt.ts';

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

describe('hex-pinyin', () => {
  it('notes rare hex names only', () => {
    expect(hexPinyin('夬')).toBe('jué');
    expect(hexPinyin('涣')).toBe('huàn');
    expect(hexPinyin('大有')).toBeUndefined();
    expect(hexPinyin('巽')).toBeUndefined();
    expect(formatHexWithPinyin('夬', '泽天夬')).toBe('泽天夬（jué）');
    expect(formatHexWithPinyin('大有', '火天大有')).toBe('火天大有');
  });
});

describe('board-compact + coach-prompt', () => {
  it('builds compact payload without dumping full board', () => {
    const cast = castHuanToXun();
    const payload = buildCompactHexagramPayload(cast, '转正能拿到8k吗？');
    expect(payload.user_question).toMatch(/8k/);
    expect(payload.hexagram_data.primary_name).toMatch(/涣|huàn/);
    expect(payload.hexagram_data.shi_line.modern).toMatch(/目标|规则|压力/);
    expect(payload.hexagram_data.moving_lines.length).toBeGreaterThan(0);
    expect(JSON.stringify(payload)).not.toMatch(/青龙|白虎/);
  });

  it('coach system asks for 4 layers and modern language', () => {
    expect(LIUYAO_COACH_SYSTEM).toMatch(/第一层/);
    expect(LIUYAO_COACH_SYSTEM).toMatch(/禁用/);
    const msg = buildLiuyaoCoachUserMessage(
      buildCompactHexagramPayload(castHuanToXun(), '要不要离职？'),
    );
    expect(msg).toMatch(/```json/);
    expect(msg).toMatch(/shi_line/);
  });
});
