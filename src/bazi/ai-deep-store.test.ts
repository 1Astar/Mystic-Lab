import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendBaziAiDeepTurns,
  loadBaziAiDeepDoc,
  loadBaziAiDeepReading,
  parseBaziAiDeepRaw,
  saveBaziAiDeepReading,
} from './ai-deep-store.ts';

const mem = new Map<string, string>();
const PERSON = 'self';

beforeEach(() => {
  mem.clear();
  // @ts-expect-error test stub
  globalThis.localStorage = {
    getItem: (k: string) => mem.get(k) ?? null,
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  };
});

describe('bazi ai-deep-store', () => {
  it('parses legacy plain text', () => {
    const doc = parseBaziAiDeepRaw('这是旧版纯文本解读。');
    expect(doc?.deepReading).toMatch(/旧版/);
    expect(doc?.turns).toEqual([]);
  });

  it('saves reading and appends turns; regen clears turns', () => {
    saveBaziAiDeepReading(PERSON, '深度正文 A');
    expect(loadBaziAiDeepReading(PERSON)).toBe('深度正文 A');
    appendBaziAiDeepTurns(PERSON, [
      { role: 'user', content: '追问1', at: 't1' },
      { role: 'assistant', content: '答1', at: 't2' },
    ]);
    expect(loadBaziAiDeepDoc(PERSON)?.turns).toHaveLength(2);

    saveBaziAiDeepReading(PERSON, '深度正文 B');
    expect(loadBaziAiDeepReading(PERSON)).toBe('深度正文 B');
    expect(loadBaziAiDeepDoc(PERSON)?.turns).toEqual([]);
  });
});
