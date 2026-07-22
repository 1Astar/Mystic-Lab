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

  it('round-trips import including ai key', () => {
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
    const result = importBackupPayload(parsed, storage);
    expect(result.written).toBe(3);
    expect(result.skipped).toBe(0);
    expect(storage.getItem('mystic-lab-journal')).toContain('new');
    expect(storage.getItem('mystic-lab-codex')).toContain('new');
    expect(storage.getItem('mystic-lab-ai-settings')).toContain('restored');
  });

  it('rejects wrong format', () => {
    expect(() => parseBackupJson('{"format":"other","keys":{}}')).toThrow(
      /不是 Mystic Lab/,
    );
  });
});
