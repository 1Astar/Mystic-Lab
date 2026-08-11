import { describe, expect, it } from 'vitest';
import { createSelfPerson, EMPTY_PROFILE } from '../life/types.ts';
import { castZiweiChart } from './cast.ts';
import {
  buildDeepShenshaNotes,
  formatAnnualShenshaLine,
  shenshaNotesForPillar,
} from './shensha-deep.ts';

describe('shensha deep thicken', () => {
  it('builds thick notes with pillar tags and body', () => {
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

    const notes = view.theater.shenshaHighlights;
    expect(notes.length).toBeGreaterThan(0);
    expect(notes.length).toBeLessThanOrEqual(5);
    for (const n of notes) {
      expect(n.body.length).toBeGreaterThan(n.line.length);
      expect(n.pillarIds.length).toBeGreaterThan(0);
      expect(n.pillarLabels.length).toBe(n.pillarIds.length);
      expect(n.body).toMatch(/落在|用在|人生线/);
    }

    const coreNotes = shenshaNotesForPillar(notes, 'core', 3);
    const careerNotes = shenshaNotesForPillar(notes, 'career', 3);
    const bondNotes = shenshaNotesForPillar(notes, 'bond', 3);
    const lessonNotes = shenshaNotesForPillar(notes, 'lesson', 3);
    expect(
      coreNotes.length + careerNotes.length + bondNotes.length + lessonNotes.length,
    ).toBeGreaterThan(0);

    // 至少有一个四要素展开文里挂了神煞
    expect(view.theater.pillars.some((p) => p.body.includes('神煞重点'))).toBe(true);

    expect(view.theater.annual.shenshaLine?.length ?? 0).toBeGreaterThan(4);
    expect(view.theater.annual.traditional).toMatch(/神煞叠读/);
  });

  it('annual hook appears when focus palace matches', () => {
    const person = createSelfPerson({
      ...EMPTY_PROFILE,
      birthYear: '1996',
      birthMonth: '8',
      birthDay: '12',
      birthHour: '8:37',
    });
    person.gender = 'female';
    const view = castZiweiChart(person, { intent: 'map', year: 2026 });
    if ('error' in view) throw new Error(view.error);

    const focus = view.theater.annual.focusPalaces;
    const notes = buildDeepShenshaNotes(view, {
      focusPalaces: focus,
      yearSoulPalace: focus[0],
    });
    const line = formatAnnualShenshaLine(notes);
    expect(line.length).toBeGreaterThan(8);
  });
});
