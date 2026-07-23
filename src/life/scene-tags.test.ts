import { describe, expect, it } from 'vitest';
import { ensureSceneTags, suggestSceneTags } from './scene-tags.ts';

describe('scene-tags', () => {
  it('suggests work tags from job questions', () => {
    expect(suggestSceneTags('我要不要离职求职')).toContain('工作');
  });

  it('suggests romance tags', () => {
    expect(suggestSceneTags('我们还会复合吗')).toContain('感情');
  });

  it('falls back to 决策', () => {
    expect(suggestSceneTags('随便问问')).toEqual(['决策']);
  });

  it('ensureSceneTags keeps user tags', () => {
    expect(ensureSceneTags('离职', ['工作', '心态'])).toEqual(['工作', '心态']);
  });

  it('ensureSceneTags fills when empty', () => {
    expect(ensureSceneTags('买房贷款', [])).toContain('财运');
  });
});
