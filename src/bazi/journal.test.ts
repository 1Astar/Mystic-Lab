import { beforeEach, describe, expect, it } from 'vitest';
import {
  BAZI_JOURNAL_STORAGE_KEY,
  buildBaziJournalSnapshot,
  deleteBaziJournalEntry,
  loadBaziJournal,
  moodLabel,
  saveBaziJournalEntry,
  snapshotLine,
  updateBaziJournalReflection,
} from './journal.ts';
import { EMPTY_PROFILE } from '../life/types.ts';
import { castBaziChart } from './cast.ts';

const mem = new Map<string, string>();

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

describe('bazi journal', () => {
  it('saves, loads, reflects, deletes', () => {
    const e = saveBaziJournalEntry({
      body: '今天感觉节奏慢，想少开坑。',
      mood: 'calm',
      snapshot: {
        dayMaster: '甲',
        dayMasterWx: '木',
        patternName: '正官格',
        bodyBand: '身弱',
        yongWx: ['水', '木'],
        jiWx: ['金'],
        dayunGanZhi: '乙亥',
        dayunHint: '主题',
        liunianLabel: '2026丙午',
      },
    });
    expect(e.id).toBeTruthy();
    expect(loadBaziJournal()).toHaveLength(1);
    expect(loadBaziJournal()[0]?.mood).toBe('calm');
    expect(moodLabel('calm')).toBe('平静');
    expect(mem.has(BAZI_JOURNAL_STORAGE_KEY)).toBe(true);

    updateBaziJournalReflection(e.id, '三天后回看：果然少开坑更稳。');
    expect(loadBaziJournal()[0]?.reflection).toMatch(/三天后/);

    expect(deleteBaziJournalEntry(e.id)).toBe(true);
    expect(loadBaziJournal()).toHaveLength(0);
  });

  it('snapshotLine and buildBaziJournalSnapshot from real chart', () => {
    const chart = castBaziChart(
      {
        ...EMPTY_PROFILE,
        birthYear: '2005',
        birthMonth: '12',
        birthDay: '23',
        birthHour: '8:37',
        birthPlace: '北京',
      },
      2026,
      { includeLiunian: false, gender: 'female' },
    );
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const snap = buildBaziJournalSnapshot(chart, null);
    expect(snap.patternName.length).toBeGreaterThan(1);
    expect(snap.dayMaster).toBeTruthy();
    const line = snapshotLine(snap);
    expect(line).toMatch(snap.patternName);
    expect(line).not.toMatch(/必凶|倒霉/);
  });

  it('stores trimmed empty body when only spaces', () => {
    const e = saveBaziJournalEntry({ body: '   ' });
    expect(e.body).toBe('');
    expect(loadBaziJournal()).toHaveLength(1);
  });
});
