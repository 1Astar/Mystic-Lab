import { beforeEach, describe, expect, it } from 'vitest';
import {
  loadLabNoteDoc,
  loadLabNoteText,
  mergeUserTags,
  normalizeUserTag,
  saveLabNote,
} from './lab-notes-sheet.ts';

function mockLocalStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    key: (i) => [...map.keys()][i] ?? null,
  };
}

describe('lab notes tags', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage(),
      configurable: true,
    });
  });

  it('migrates plain text and accumulates surface tags', () => {
    localStorage.setItem('mystic-lab.reading-notes.bazi.p1', '旧笔记');
    expect(loadLabNoteText('bazi', 'p1')).toBe('旧笔记');

    saveLabNote('bazi', 'p1', '旧笔记\n新一句', 'reading');
    let doc = loadLabNoteDoc('bazi', 'p1');
    expect(doc.text).toContain('新一句');
    expect(doc.autoTags).toEqual(['reading']);
    expect(doc.userTags).toEqual([]);

    saveLabNote('bazi', 'p1', doc.text, 'atlas');
    doc = loadLabNoteDoc('bazi', 'p1');
    expect(doc.autoTags).toEqual(['reading', 'atlas']);
  });

  it('persists user tags separately from auto tags', () => {
    saveLabNote('ziwei', 'p2', '流年对照', 'reading', ['流年', '合盘', '流年']);
    const doc = loadLabNoteDoc('ziwei', 'p2');
    expect(doc.autoTags).toEqual(['reading']);
    expect(doc.userTags).toEqual(['流年', '合盘']);

    saveLabNote('ziwei', 'p2', '流年对照', 'atlas', ['合盘', '验证']);
    const next = loadLabNoteDoc('ziwei', 'p2');
    expect(next.autoTags).toEqual(['reading', 'atlas']);
    expect(next.userTags).toEqual(['合盘', '验证']);
  });

  it('normalizes and caps user tags', () => {
    expect(normalizeUserTag('  流年  ')).toBe('流年');
    expect(normalizeUserTag('   ')).toBeNull();
    const many = Array.from({ length: 20 }, (_, i) => `标签${i}`);
    expect(mergeUserTags([], many)).toHaveLength(12);
  });
});
