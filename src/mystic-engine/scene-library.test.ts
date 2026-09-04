import { describe, expect, it, beforeEach } from 'vitest';
import {
  findPlaybooksForRoute,
  findNearestExemplar,
  loadSceneLibrary,
  recordQuestionScene,
  resetSceneLibraryForTests,
} from './scene-library.ts';

const POLICE_Q = '报了警之后事情都走向会怎么样？';
const FAMILY_Q = '我爸威胁我妈这件事最终会怎么解决？';

describe('scene-library', () => {
  beforeEach(() => {
    resetSceneLibraryForTests();
  });

  it('records every question into events and playbooks', () => {
    const ev = recordQuestionScene({ system: 'liuyao', question: POLICE_Q });
    expect(ev).toBeTruthy();
    expect(ev!.route).toBe('legal_after_report');
    expect(ev!.directAnswer).toMatch(/报警之后/);

    const store = loadSceneLibrary();
    expect(store.events).toHaveLength(1);
    expect(store.playbooks.length).toBeGreaterThan(0);
    expect(store.playbooks[0]!.exemplars[0]).toBe(POLICE_Q);
    expect(store.playbooks[0]!.askCount).toBe(1);
  });

  it('aggregates same route with incremented askCount', () => {
    recordQuestionScene({ system: 'liuyao', question: POLICE_Q, at: '2026-09-02T10:00:00.000Z' });
    recordQuestionScene({
      system: 'tarot',
      question: '报警之后我会收到书面回执吗？',
      at: '2026-09-02T11:00:00.000Z',
    });

    const pbs = findPlaybooksForRoute('legal_after_report');
    expect(pbs[0]!.askCount).toBe(2);
    expect(pbs[0]!.systems).toContain('liuyao');
    expect(pbs[0]!.systems).toContain('tarot');
  });

  it('dedupes same question within 60s', () => {
    recordQuestionScene({ system: 'liuyao', question: FAMILY_Q });
    recordQuestionScene({ system: 'liuyao', question: FAMILY_Q });
    expect(loadSceneLibrary().events).toHaveLength(1);
  });

  it('finds nearest exemplar for similar wording', () => {
    recordQuestionScene({ system: 'liuyao', question: FAMILY_Q });
    const hit = findNearestExemplar('family_dispute_outcome', '我爸威胁我妈怎么解决比较好');
    expect(hit?.exemplar).toBe(FAMILY_Q);
  });
});
