import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from '../liuyao/engine.ts';
import { HEXAGRAMS, linesFromHexagram } from '../liuyao/hexagrams.ts';
import { buildOfflineAnswerPack } from './build-pack.ts';
import { mapEvidence } from './evidence.ts';
import { pickActions } from './actions.ts';
import { detectTone } from './tone.ts';

function castHuanToXun() {
  const huan = HEXAGRAMS.find((h) => h.name === '涣')!;
  const lines = linesFromHexagram(huan);
  const throws = lines.map((bit, i) => {
    const changing = i === 2;
    if (changing && bit === 0) return facesToThrow(['obverse', 'obverse', 'obverse']);
    if (changing && bit === 1) return facesToThrow(['reverse', 'reverse', 'reverse']);
    if (bit === 1) return facesToThrow(['obverse', 'obverse', 'reverse']);
    return facesToThrow(['obverse', 'reverse', 'reverse']);
  }) as YaoThrow[];
  return buildCastFromThrows(throws, 'coin');
}

function castGuaiToDayou() {
  const guai = HEXAGRAMS.find((h) => h.name === '夬')!;
  const lines = linesFromHexagram(guai);
  // 需要动爻使变卦为大有——简化：用任意带变的夬盘；若变不出大有，至少测 cut tone
  const throws = lines.map((bit, i) => {
    const changing = i === 4 || i === 5;
    if (changing && bit === 1) return facesToThrow(['reverse', 'reverse', 'reverse']);
    if (changing && bit === 0) return facesToThrow(['obverse', 'obverse', 'obverse']);
    if (bit === 1) return facesToThrow(['obverse', 'obverse', 'reverse']);
    return facesToThrow(['obverse', 'reverse', 'reverse']);
  }) as YaoThrow[];
  return buildCastFromThrows(throws, 'coin');
}

describe('tone + evidence', () => {
  it('涣→巽 yields soft/flow and primary_changed evidence', () => {
    const cast = castHuanToXun();
    expect(cast.primary.name).toBe('涣');
    expect(cast.changed?.name).toBe('巽');
    const tone = detectTone(cast);
    expect(['soft', 'flow']).toContain(tone);
    const ev = mapEvidence(cast, 'salary_negotiate', '转正能拿到8k吗？');
    expect(ev.some((e) => e.factKey === 'primary_changed')).toBe(true);
    expect(ev.some((e) => e.factKey === 'shi')).toBe(true);
  });
});

describe('actions', () => {
  it('salary_negotiate soft cautious is concrete', () => {
    const { breakthrough } = pickActions('salary_negotiate', 'soft', {
      riskPreference: 'cautious',
      occupation: '产品经理',
    });
    expect(breakthrough.body).not.toMatch(/只选一个可验证动作/);
    expect(breakthrough.body).toMatch(/谈|标准|核对|沟通/);
    expect(breakthrough.body).toMatch(/产品经理/);
  });
});

describe('buildOfflineAnswerPack', () => {
  it('gold case: 8k + stay/leave yields multi-answer pack', () => {
    const cast = castHuanToXun();
    const pack = buildOfflineAnswerPack({
      question: '转正能不能拿到8k？我要不要留在冠英？8月初要不要离职？',
      cast,
      useProfile: false,
    });
    expect(pack.answers.length).toBeGreaterThanOrEqual(2);
    expect(pack.answers.every((a) => a.evidence.length >= 1)).toBe(true);
    expect(pack.breakthrough.body).not.toMatch(/只选一个可验证动作/);
    expect(pack.breakthrough.body.length).toBeGreaterThan(12);
    expect(pack.contextUsed).toBe(false);
  });

  it('job search question gets actionable breakthrough', () => {
    const cast = castGuaiToDayou();
    const pack = buildOfflineAnswerPack({
      question:
        '我在2026年7月底主动离开目前公司，未来三个月的求职、收入与整体发展如何？',
      cast,
      useProfile: false,
    });
    expect(pack.breakthrough.body.length).toBeGreaterThan(12);
    expect(pack.answers.length).toBeGreaterThanOrEqual(1);
  });
});
