import { describe, expect, it } from 'vitest';
import {
  BRANCH_MODE_HELP,
  STEM_MODE_HELP,
  relationHelpDetailsHtml,
  splitHelpSentences,
} from './codex-relation-help.ts';
import { renderStemRelationRingHtml } from './codex-stem-ring.ts';
import { renderBranchRelationRingHtml } from './codex-branch-ring.ts';

describe('relation help', () => {
  it('六合 / 三合 help explain the difference', () => {
    expect(BRANCH_MODE_HELP.he.body).toMatch(/三合/);
    expect(BRANCH_MODE_HELP.sanhe.body).toMatch(/六合|半合/);
    expect(STEM_MODE_HELP.he.body).toMatch(/地支六合|≠/);
  });

  it('半合 / 三会 have dedicated help', () => {
    expect(BRANCH_MODE_HELP.banhe.gloss).toMatch(/半合/);
    expect(BRANCH_MODE_HELP.sanhui.gloss).toMatch(/寅卯辰|三会/);
  });

  it('each mode carries atlas gloss into ? panel', () => {
    expect(STEM_MODE_HELP.he.gloss).toMatch(/甲己合土/);
    expect(STEM_MODE_HELP.chong.gloss).toMatch(/甲庚/);
    expect(BRANCH_MODE_HELP.chong.gloss).toMatch(/子午/);
    expect(BRANCH_MODE_HELP.sanhe.gloss).toMatch(/申子辰/);
    const html = relationHelpDetailsHtml(STEM_MODE_HELP.he);
    expect(html).toContain('bazi-br-help-gloss');
    expect(html).toContain('甲己合土');
    expect(html).toContain('?');
    expect(html).toContain('bazi-br-help-line');
  });

  it('splits help into one sentence per line', () => {
    const lines = splitHelpSentences('第一句。第二句！第三句？');
    expect(lines).toEqual(['第一句。', '第二句！', '第三句？']);
    const html = relationHelpDetailsHtml(BRANCH_MODE_HELP.chong);
    expect(html.match(/bazi-br-help-line/g)?.length).toBeGreaterThan(1);
  });

  it('details help renders ? control', () => {
    const html = relationHelpDetailsHtml(BRANCH_MODE_HELP.he);
    expect(html).toContain('bazi-codex-help');
    expect(html).toContain('bazi-br-help-panel');
    expect(html).toContain('?');
  });

  it('ring titles point to ? for gloss, not a separate card section', () => {
    expect(renderStemRelationRingHtml()).toMatch(/标题旁 \? 看释义/);
    expect(renderStemRelationRingHtml()).toContain('bazi-br-help-gloss');
    expect(renderBranchRelationRingHtml()).toMatch(/标题旁 \? 看释义/);
    expect(renderBranchRelationRingHtml()).not.toContain('双击看释义');
  });
});
