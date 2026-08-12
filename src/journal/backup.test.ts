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

  it('exports bazi/ziwei play progress and reading notes', () => {
    const storage = mockStorage({
      'mystic-lab-bazi-codex': '{"entries":[{"id":"wood"}],"metTags":["天乙"],"updatedAt":"t"}',
      'mystic-lab-ziwei-codex': '{"entries":[{"starId":"ziwei"}],"updatedAt":"t"}',
      'mystic-lab-craft-xp-v1': '{"xp":120,"level":2,"checked":["2026-W01:q1"],"updatedAt":"t"}',
      'mystic.ziwei.yearVerify.v1': '{"self:2026":["跳槽"]}',
      'mystic.ziwei.dayVerify.v1': '{"self:2026-8-11":["顺利"]}',
      'mystic-lab-bazi-partner': '{"nickname":"伴侣"}',
      'mystic-lab.reading-notes.bazi.self': '{"text":"八字笔记"}',
      'mystic-lab.ziwei-ai-deep.self': '紫微深度解读正文',
      'mystic-lab.bazi-ai-deep.self': '八字深度解读正文',
      'mystic.liuyao.hexGuide.favorites.v1': '["乾"]',
      'mystic-ly-ask-vault': '[{"id":"v1"}]',
      'mystic-lab-ai-quota-v1': '{"deepLeft":2}',
      'mystic.bazi.reading.q': '临时问句',
    });
    const backup = buildBackupPayload(storage);
    expect(backup.keys['mystic-lab-bazi-codex']).toContain('wood');
    expect(backup.keys['mystic-lab-ziwei-codex']).toContain('ziwei');
    expect(backup.keys['mystic-lab-craft-xp-v1']).toContain('"xp":120');
    expect(backup.keys['mystic.ziwei.yearVerify.v1']).toContain('跳槽');
    expect(backup.keys['mystic.ziwei.dayVerify.v1']).toContain('顺利');
    expect(backup.keys['mystic-lab-bazi-partner']).toContain('伴侣');
    expect(backup.keys['mystic-lab.reading-notes.bazi.self']).toContain('八字笔记');
    expect(backup.keys['mystic-lab.ziwei-ai-deep.self']).toBe('紫微深度解读正文');
    expect(backup.keys['mystic-lab.bazi-ai-deep.self']).toBe('八字深度解读正文');
    expect(backup.keys['mystic.liuyao.hexGuide.favorites.v1']).toContain('乾');
    expect(backup.keys['mystic-ly-ask-vault']).toContain('v1');
    expect(backup.keys['mystic-lab-ai-quota-v1']).toContain('deepLeft');
    expect(backup.keys['mystic.bazi.reading.q']).toBeUndefined();
  });

  it('merge mode unions bazi/ziwei codex and craft xp', () => {
    const storage = mockStorage({
      'mystic-lab-bazi-codex': JSON.stringify({
        entries: [
          {
            id: 'wood',
            kind: 'wuxing',
            unlockedAt: '2026-06-01T00:00:00.000Z',
            meetCount: 1,
          },
        ],
        metTags: ['天乙'],
        updatedAt: '2026-06-01T00:00:00.000Z',
      }),
      'mystic-lab-ziwei-codex': JSON.stringify({
        entries: [
          {
            starId: 'ziwei',
            unlockedAt: '2026-06-01T00:00:00.000Z',
            meetCount: 1,
            lastPalace: '命宫',
          },
        ],
        updatedAt: '2026-06-01T00:00:00.000Z',
      }),
      'mystic-lab-craft-xp-v1': JSON.stringify({
        xp: 50,
        level: 1,
        checked: ['2026-W01:q1'],
        updatedAt: '2026-06-01T00:00:00.000Z',
      }),
      'mystic.ziwei.yearVerify.v1': JSON.stringify({ 'self:2026': ['本地事'] }),
    });
    const backup = parseBackupJson(
      serializeBackup({
        format: BACKUP_FORMAT,
        version: 1,
        exportedAt: '2026-07-22T00:00:00.000Z',
        keys: {
          'mystic-lab-bazi-codex': JSON.stringify({
            entries: [
              {
                id: 'wood',
                kind: 'wuxing',
                unlockedAt: '2026-07-01T00:00:00.000Z',
                meetCount: 3,
              },
              {
                id: 'fire',
                kind: 'wuxing',
                unlockedAt: '2026-07-01T00:00:00.000Z',
                meetCount: 1,
              },
            ],
            metTags: ['天乙', '文昌'],
            updatedAt: '2026-07-01T00:00:00.000Z',
          }),
          'mystic-lab-ziwei-codex': JSON.stringify({
            entries: [
              {
                starId: 'ziwei',
                unlockedAt: '2026-07-01T00:00:00.000Z',
                meetCount: 4,
                lastPalace: '财帛',
              },
              {
                starId: 'tianji',
                unlockedAt: '2026-07-01T00:00:00.000Z',
                meetCount: 1,
              },
            ],
            updatedAt: '2026-07-01T00:00:00.000Z',
          }),
          'mystic-lab-craft-xp-v1': JSON.stringify({
            xp: 120,
            level: 2,
            checked: ['2026-W01:q2'],
            updatedAt: '2026-07-01T00:00:00.000Z',
          }),
          'mystic.ziwei.yearVerify.v1': JSON.stringify({
            'self:2026': ['备份事'],
            'self:2025': ['去年'],
          }),
        },
      }),
    );
    importBackupPayload(backup, storage, { mode: 'merge' });

    const bazi = JSON.parse(storage.getItem('mystic-lab-bazi-codex')!) as {
      entries: { id: string; meetCount: number; unlockedAt: string }[];
      metTags: string[];
    };
    expect(bazi.entries.map((e) => e.id).sort()).toEqual(['fire', 'wood']);
    expect(bazi.entries.find((e) => e.id === 'wood')?.meetCount).toBe(3);
    expect(bazi.entries.find((e) => e.id === 'wood')?.unlockedAt).toBe(
      '2026-06-01T00:00:00.000Z',
    );
    expect(bazi.metTags.sort()).toEqual(['天乙', '文昌']);

    const ziwei = JSON.parse(storage.getItem('mystic-lab-ziwei-codex')!) as {
      entries: { starId: string; meetCount: number; lastPalace?: string }[];
    };
    expect(ziwei.entries.map((e) => e.starId).sort()).toEqual(['tianji', 'ziwei']);
    expect(ziwei.entries.find((e) => e.starId === 'ziwei')?.meetCount).toBe(4);
    expect(ziwei.entries.find((e) => e.starId === 'ziwei')?.lastPalace).toBe('财帛');

    const craft = JSON.parse(storage.getItem('mystic-lab-craft-xp-v1')!) as {
      xp: number;
      checked: string[];
    };
    expect(craft.xp).toBe(120);
    expect(craft.checked.sort()).toEqual(['2026-W01:q1', '2026-W01:q2']);

    const year = JSON.parse(storage.getItem('mystic.ziwei.yearVerify.v1')!) as Record<
      string,
      string[]
    >;
    expect(year['self:2026'].sort()).toEqual(['备份事', '本地事']);
    expect(year['self:2025']).toEqual(['去年']);
  });
});
