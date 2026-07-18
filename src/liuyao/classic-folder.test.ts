import { describe, expect, it } from 'vitest';
import { classicCorpusSize, getClassicCorpus } from './classic-corpus.ts';
import { resolveClassicDossier } from './classic-folder.ts';

describe('classic-corpus', () => {
  it('has all 64 hexagrams', () => {
    expect(classicCorpusSize()).toBe(64);
  });

  it('豫 has judgment, 6 lines, and zengshan', () => {
    const c = getClassicCorpus('豫');
    expect(c?.judgment).toBeTruthy();
    expect(c?.lineClassics.length).toBe(6);
    expect(c?.zengshan).toContain('增删卜易');
  });
});

describe('classic-folder dossier', () => {
  it('maps corpus into dossier with 6 lines', () => {
    const d = resolveClassicDossier('乾');
    expect(d.hasSeed).toBe(true);
    expect(d.lines[0]?.classic).toContain('潜龙');
    expect(d.zengshan?.length).toBeGreaterThan(10);
  });
});
