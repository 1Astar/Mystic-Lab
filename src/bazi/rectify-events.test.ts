import { describe, expect, it } from 'vitest';
import {
  EVENT_TYPE_LABELS,
  createEmptyEvent,
  eventsReadyForScore,
  normalizeEvent,
  parseEventYear,
  type RectifyEvent,
} from './rectify-events.ts';

describe('rectify-events', () => {
  it('exposes typed labels', () => {
    expect(EVENT_TYPE_LABELS.career).toBeTruthy();
    expect(EVENT_TYPE_LABELS.study).toBeTruthy();
  });

  it('parses year and clamps', () => {
    expect(parseEventYear('2018')).toBe(2018);
    expect(parseEventYear('18')).toBe(null);
    expect(parseEventYear('')).toBe(null);
  });

  it('normalizes event fields', () => {
    const e = normalizeEvent({
      id: 'x',
      year: 2018,
      type: 'career',
      note: '  换工作  ',
      yearSlack: 1,
    });
    expect(e.note).toBe('换工作');
    expect(e.yearSlack).toBe(1);
  });

  it('requires at least 3 valid events to score', () => {
    const a = createEmptyEvent();
    const b = { ...createEmptyEvent(), year: 2018, type: 'career' as const };
    const c = { ...createEmptyEvent(), year: 2020, type: 'move' as const };
    const d = { ...createEmptyEvent(), year: 2021, type: 'relation' as const };
    expect(eventsReadyForScore([a, b, c])).toBe(false);
    expect(eventsReadyForScore([b, c, d])).toBe(true);
  });

  it('rejects invalid type', () => {
    const e = normalizeEvent({
      id: '1',
      year: 2010,
      type: 'nope' as RectifyEvent['type'],
      note: '',
      yearSlack: 0,
    });
    expect(e.type).toBe('other');
  });
});
