import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from './cast.ts';
import { shenshaCodexSections } from './codex-taxonomy.ts';
import { pickDeepShenshaHighlights } from './shensha-policy.ts';

describe('shensha tiers: codex full + deep filter', () => {
  it('codex sections cover 十二神 rosters of 12', () => {
    const sections = shenshaCodexSections();
    expect(sections.some((s) => s.id === 'adjective' && s.items.length > 10)).toBe(true);
    for (const id of ['changsheng', 'boshi', 'jiangqian', 'suiqian'] as const) {
      const sec = sections.find((s) => s.id === id);
      expect(sec?.items.length).toBe(12);
    }
    const jiang = sections
      .find((s) => s.id === 'jiangqian')
      ?.items.find((i) => i.id === '将星');
    expect(jiang?.oneLiner).not.toMatch(/词条待补/);
    expect(jiang?.oneLiner).toMatch(/台前|带队|统领/);
  });

  it('deep highlights pick at most 5 scored hits from a real chart', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '2003',
      birthMonth: '2',
      birthDay: '11',
      birthHour: '20:00',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) throw new Error(view.error);
    const hits = pickDeepShenshaHighlights(view, 5);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.length).toBeLessThanOrEqual(5);
    expect(view.theater.shenshaHighlights.length).toBe(hits.length);
    for (const h of view.theater.shenshaHighlights) {
      expect(h.name.length).toBeGreaterThan(0);
      expect(h.line.length).toBeGreaterThan(2);
      expect(h.body.length).toBeGreaterThan(8);
    }
  });
});
