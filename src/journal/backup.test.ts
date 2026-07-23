import { describe, expect, it } from 'vitest';
import {
  BACKUP_FORMAT,
  buildBackupPayload,
  importBackupPayload,
  parseBackupJson,
  serializeBackup,
} from './backup.ts';

function mockStorage(init: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(init));
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  } as Storage;
}

describe('journey backup', () => {
  it('exports journals, codex and ai settings', () => {
    const storage = mockStorage({
      'mystic-lab-journal': '[{"id":"1"}]',
      'mystic-lab-codex': '{"cards":[]}',
      'mystic-lab-ai-settings': '{"apiKey":"secret"}',
      'mystic-ly-course-note:乾:0:1': 'note',
      'mystic-lab-cross-ask-question': 'temp',
    });
    const backup = buildBackupPayload(storage);
    expect(backup.format).toBe(BACKUP_FORMAT);
    expect(backup.keys['mystic-lab-journal']).toContain('"id"');
    expect(backup.keys['mystic-lab-codex']).toBeTruthy();
    expect(backup.keys['mystic-ly-course-note:乾:0:1']).toBe('note');
    expect(backup.keys['mystic-lab-ai-settings']).toContain('secret');
    expect(backup.keys['mystic-lab-cross-ask-question']).toBeUndefined();
  });

  it('replace mode clears then writes', () => {
    const storage = mockStorage({
      'mystic-lab-journal': '[{"id":"old"}]',
      'mystic-lab-codex': '{"old":true}',
      'mystic-lab-ai-settings': '{"apiKey":"keep"}',
    });
    const raw = serializeBackup({
      format: BACKUP_FORMAT,
      version: 1,
      exportedAt: '2026-07-22T00:00:00.000Z',
      keys: {
        'mystic-lab-journal': '[{"id":"new"}]',
        'mystic-lab-codex': '{"new":true}',
        'mystic-lab-ai-settings': '{"apiKey":"restored"}',
      },
    });
    const parsed = parseBackupJson(raw);
    const result = importBackupPayload(parsed, storage, { mode: 'replace' });
    expect(result.written).toBe(3);
    expect(result.skipped).toBe(0);
    expect(storage.getItem('mystic-lab-journal')).toContain('new');
    expect(storage.getItem('mystic-lab-journal')).not.toContain('old');
    expect(storage.getItem('mystic-lab-codex')).toContain('new');
    expect(storage.getItem('mystic-lab-ai-settings')).toContain('restored');
  });

  it('merge mode keeps distinct journal ids and newer same id', () => {
    const storage = mockStorage({
      'mystic-lab-journal': JSON.stringify([
        {
          id: 'a',
          createdAt: '2026-07-01T00:00:00.000Z',
          reflection: 'local-only',
        },
        {
          id: 'shared',
          createdAt: '2026-07-02T00:00:00.000Z',
          reflection: 'old',
          feedback: { at: '2026-07-02T00:00:00.000Z' },
        },
      ]),
      'mystic-lab-ai-settings': '{"apiKey":"local"}',
    });
    const backup = parseBackupJson(
      serializeBackup({
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: '2026-07-22T00:00:00.000Z',
        keys: {
          'mystic-lab-journal': JSON.stringify([
            {
              id: 'b',
              createdAt: '2026-07-03T00:00:00.000Z',
              reflection: 'imported-only',
            },
            {
              id: 'shared',
              createdAt: '2026-07-02T00:00:00.000Z',
              reflection: 'newer',
              feedback: { at: '2026-07-10T00:00:00.000Z' },
            },
          ]),
          'mystic-lab-ai-settings': '{"apiKey":"from-backup"}',
        },
      }),
    );
    const result = importBackupPayload(backup, storage);
    expect(result.cleared).toBe(0);
    const journals = JSON.parse(storage.getItem('mystic-lab-journal')!) as {
      id: string;
      reflection: string;
    }[];
    const ids = journals.map((j) => j.id).sort();
    expect(ids).toEqual(['a', 'b', 'shared']);
    expect(journals.find((j) => j.id === 'shared')?.reflection).toBe('newer');
    expect(storage.getItem('mystic-lab-ai-settings')).toContain('from-backup');
  });

  it('merge mode unions codex entries by cardId', () => {
    const storage = mockStorage({
      'mystic-lab-codex': JSON.stringify({
        entries: {
          fool: {
            cardId: 'fool',
            firstSeenAt: '2026-06-01T00:00:00.000Z',
            count: 1,
            favorite: false,
            personalNote: 'a',
            encounters: [
              {
                at: '2026-06-01T00:00:00.000Z',
                question: 'q1',
                summary: 's1',
                reversed: false,
                spreadLabel: '单牌',
              },
            ],
          },
        },
      }),
    });
    const backup = parseBackupJson(
      serializeBackup({
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: '2026-07-22T00:00:00.000Z',
        keys: {
          'mystic-lab-codex': JSON.stringify({
            entries: {
              magician: {
                cardId: 'magician',
                firstSeenAt: '2026-07-01T00:00:00.000Z',
                count: 1,
                favorite: true,
                personalNote: '',
                encounters: [],
              },
              fool: {
                cardId: 'fool',
                firstSeenAt: '2026-07-01T00:00:00.000Z',
                count: 1,
                favorite: true,
                personalNote: 'bb',
                encounters: [
                  {
                    at: '2026-07-01T00:00:00.000Z',
                    question: 'q2',
                    summary: 's2',
                    reversed: false,
                    spreadLabel: '单牌',
                  },
                ],
              },
            },
          }),
        },
      }),
    );
    importBackupPayload(backup, storage, { mode: 'merge' });
    const store = JSON.parse(storage.getItem('mystic-lab-codex')!) as {
      entries: Record<string, { favorite: boolean; personalNote: string; count: number }>;
    };
    expect(Object.keys(store.entries).sort()).toEqual(['fool', 'magician']);
    expect(store.entries.fool.favorite).toBe(true);
    expect(store.entries.fool.personalNote).toBe('bb');
    expect(store.entries.fool.count).toBe(2);
  });

  it('rejects wrong format', () => {
    expect(() => parseBackupJson('{"format":"other","keys":{}}')).toThrow(
      /不是 Mystic Lab/,
    );
  });
});
