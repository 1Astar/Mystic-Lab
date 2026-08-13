import { describe, expect, it, beforeEach } from 'vitest';
import {
  appendXiaoliurenAiTurns,
  loadXiaoliurenJournal,
  saveXiaoliurenAiDeepReading,
  saveXiaoliurenJournalEntry,
} from './journal.ts';
import { computeLesson } from './engine.ts';
import { getChineseHour } from './chinese-hour.ts';
import { solarToLunar } from './lunar.ts';

function installMemoryStorage(): void {
  const map = new Map<string, string>();
  const memory = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => {
      map.set(k, String(v));
    },
    removeItem: (k: string) => {
      map.delete(k);
    },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size;
    },
  };
  Object.defineProperty(globalThis, 'localStorage', {
    value: memory,
    configurable: true,
  });
}

function sampleLessonInput() {
  const at = new Date('2026-07-09T14:06:00');
  const lunar = solarToLunar(at);
  const hour = getChineseHour(at);
  const lesson = computeLesson(lunar, hour);
  return { at, lunar, hour, lesson };
}

describe('xiaoliuren journal ai sessions', () => {
  beforeEach(() => {
    installMemoryStorage();
    localStorage.clear();
  });

  it('saves deep reading onto the journal entry', () => {
    const { lunar, hour, lesson } = sampleLessonInput();
    const entry = saveXiaoliurenJournalEntry({
      question: '要不要离职',
      solarLabel: '2026-07-09',
      lunar,
      hour,
      lesson,
    });
    expect(entry.aiSessions).toEqual([]);
    const sid = saveXiaoliurenAiDeepReading(entry.id, '这是一段小六壬深度解读正文。');
    expect(sid).toBeTruthy();
    const loaded = loadXiaoliurenJournal()[0]!;
    expect(loaded.aiSessions).toHaveLength(1);
    expect(loaded.aiSessions![0]!.deepReading).toMatch(/深度解读/);
    expect(loaded.aiSessions![0]!.turns[0]!.content).toMatch(/深度解读/);
  });

  it('appends follow-up turns to the same session', () => {
    const { lunar, hour, lesson } = sampleLessonInput();
    const entry = saveXiaoliurenJournalEntry({
      question: '面试',
      solarLabel: '2026-07-09',
      lunar,
      hour,
      lesson,
    });
    const sid = saveXiaoliurenAiDeepReading(entry.id, '深度正文');
    appendXiaoliurenAiTurns(entry.id, sid, [
      { role: 'user', content: '那我下周怎么办？' },
      { role: 'assistant', content: '先核对一件事。' },
    ]);
    const loaded = loadXiaoliurenJournal()[0]!;
    expect(loaded.aiSessions![0]!.turns.length).toBeGreaterThanOrEqual(3);
  });

  it('handwritten notes stay without aiSessions noise', () => {
    const { lunar, hour, lesson } = sampleLessonInput();
    saveXiaoliurenJournalEntry({
      question: '手写旧记',
      solarLabel: '2026-07-09',
      lunar,
      hour,
      lesson,
    });
    expect(loadXiaoliurenJournal()[0]!.aiSessions).toEqual([]);
  });
});
