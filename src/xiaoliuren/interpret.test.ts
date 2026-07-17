import { describe, expect, it } from 'vitest';
import { getSixGodByName } from './six-gods.ts';
import { buildAiReading, buildTraditionalMeaning } from './interpret.ts';
import { detectQuestionType } from './question-types.ts';

describe('xiaoliuren interpret schema', () => {
  const daAn = getSixGodByName('大安')!;

  it('detects career type from interview question', () => {
    expect(detectQuestionType('今天适合面试吗？').id).toBe('career');
  });

  it('detects emotion type from liking question', () => {
    expect(detectQuestionType('Chris 喜不喜欢我？').id).toBe('emotion');
  });

  it('builds five-part reading for interview + 大安', () => {
    const reading = buildAiReading('今天适合面试吗？', daAn);
    expect(reading.meaning).toBe(buildTraditionalMeaning(daAn));
    expect(reading.meaning).toContain('大安代表');
    expect(reading.analysis).toContain('稳步推进');
    expect(reading.analysis).not.toMatch(/会发财|一定|注定/);
    expect(reading.suggestion).toContain('稳住');
    expect(reading.reflection).toBeTruthy();
    expect(reading.typeId).toBe('career');
  });

  it('detects travel and reads 小吉 by domain', () => {
    expect(detectQuestionType('这次旅行顺利吗？').id).toBe('travel');
    const xiaoJi = getSixGodByName('小吉')!;
    const reading = buildAiReading('这次旅行顺利吗？', xiaoJi);
    expect(reading.analysis).toContain(xiaoJi.travel);
    expect(reading.typeId).toBe('travel');
  });

  it('exposes whyName for depth layer 2', () => {
    expect(daAn.whyName).toContain('安');
    expect(getSixGodByName('赤口')!.whyMeaning).toContain('口');
  });
});
