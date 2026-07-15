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

  it('falls back when question is empty', () => {
    const reading = buildAiReading('', daAn);
    expect(reading.typeId).toBe('general');
    expect(reading.meaning).toContain('稳定');
    expect(reading.reflection).toBe(daAn.warning[0]);
  });
});
