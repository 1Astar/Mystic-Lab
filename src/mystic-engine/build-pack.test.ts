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

  it('timing / open_explore / anxiety get dedicated actions', () => {
    const timing = pickActions('timing', 'soft', null);
    expect(timing.breakthrough.title).toMatch(/窗口|截止|时机/);
    expect(timing.checklist.length).toBeGreaterThan(0);

    const open = pickActions('open_explore', 'neutral', null);
    expect(open.breakthrough.id).toBe('open_explore-bt');
    expect(open.breakthrough.body).not.toMatch(/^把你最想确认的一点写成一句话/);
    expect(open.checklist.length).toBeGreaterThan(0);

    const anxiety = pickActions('anxiety_decide', 'cut', null);
    expect(anxiety.breakthrough.title).toMatch(/决定|拍板|事实/);
  });
});

describe('buildOfflineAnswerPack', () => {
  it('gold case: 8k + stay/leave yields multi-answer script pack', () => {
    const cast = castHuanToXun();
    const pack = buildOfflineAnswerPack({
      question: '转正能不能拿到8k？我要不要留在冠英？8月初要不要离职？',
      cast,
      useProfile: false,
    });
    expect(pack.answers.length).toBeGreaterThanOrEqual(2);
    expect(pack.answers.every((a) => a.evidence.length >= 1)).toBe(true);
    expect(pack.script?.scene).toBe('quit_stay');
    expect(pack.verdict.headline.length).toBeGreaterThan(8);
    expect(pack.verdict.parse).toMatch(/本卦|对应你的问题|核心隐喻/);
    expect(pack.verdict.parse.length).toBeGreaterThan(80);
    expect(pack.script?.beats).toHaveLength(4);
    expect(pack.energy).toBeUndefined();
    expect(pack.reassurance).toBeTruthy();
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
    expect(pack.verdict.parse).toMatch(/夬|jué|大有/);
    expect(pack.reassurance).toBeTruthy();
    expect(pack.boardExpand).toMatch(/世在|本卦主调/);
  });

  it('love question why avoids career Offer talk', () => {
    const cast = castHuanToXun();
    const pack = buildOfflineAnswerPack({
      question: '我们这段感情接下来怎么走？他还喜欢我吗？',
      cast,
      useProfile: false,
    });
    const whyText = pack.why.map((w) => w.body).join('\n');
    expect(whyText).not.toMatch(/Offer|职场压力|职业生涯/);
    expect(whyText).toMatch(/关系|落点|沟通|柔|疏通|矛盾/);
  });

  it('open_explore pack is not bare FALLBACK', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '乾')!;
    const lines = linesFromHexagram(hex);
    const throws = lines.map((bit) =>
      bit === 1
        ? facesToThrow(['obverse', 'obverse', 'reverse'])
        : facesToThrow(['obverse', 'reverse', 'reverse']),
    ) as YaoThrow[];
    const pack = buildOfflineAnswerPack({
      question: '最近心里乱，想看看这件事整体怎么走？',
      cast: buildCastFromThrows(throws, 'coin'),
      useProfile: false,
    });
    expect(pack.intents.some((h) => h.id === 'open_explore' || h.id === 'anxiety_decide')).toBe(
      true,
    );
    expect(pack.breakthrough.body.length).toBeGreaterThan(8);
    expect(pack.breakthrough.title).not.toBe('本周一个可打勾动作');
    expect(pack.breakthrough.title).toMatch(/锁一问|探针|探索|一句话|具体动作/);
    expect(pack.script?.beats).toHaveLength(4);
    expect(pack.checklist.length).toBeGreaterThanOrEqual(1);
  });

  it('timing question yields window-oriented steps', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '需')!;
    const lines = linesFromHexagram(hex);
    const throws = lines.map((bit) =>
      bit === 1
        ? facesToThrow(['obverse', 'obverse', 'reverse'])
        : facesToThrow(['obverse', 'reverse', 'reverse']),
    ) as YaoThrow[];
    const pack = buildOfflineAnswerPack({
      question: '这件事什么时候比较合适动手？月底前有窗口吗？',
      cast: buildCastFromThrows(throws, 'coin'),
      useProfile: false,
    });
    expect(pack.intents.some((h) => h.id === 'timing')).toBe(true);
    expect(pack.breakthrough.body + pack.checklist.map((c) => c.body).join('')).toMatch(
      /窗口|截止|时机|Plan B|复盘/,
    );
  });

  it('every hexagram yields a non-empty 4-layer pack', () => {
    for (const hex of HEXAGRAMS) {
      const lines = linesFromHexagram(hex);
      const throws = lines.map((bit) =>
        bit === 1
          ? facesToThrow(['obverse', 'obverse', 'reverse'])
          : facesToThrow(['obverse', 'reverse', 'reverse']),
      ) as YaoThrow[];
      const cast = buildCastFromThrows(throws, 'coin');
      const pack = buildOfflineAnswerPack({
        question: '这件事接下来怎么走？',
        cast,
        useProfile: false,
      });
      expect(pack.verdict.headline.length, hex.name).toBeGreaterThan(4);
      expect(pack.verdict.parse.length, hex.name).toBeGreaterThan(20);
      expect(pack.script?.beats.length, hex.name).toBe(4);
      expect(pack.breakthrough.body.length, hex.name).toBeGreaterThan(8);
      expect(pack.reassurance!.length, hex.name).toBeGreaterThan(8);
    }
  });
});

describe('detectTone by hex name', () => {
  it('升 is open (not soft via 渐进)', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '升')!;
    const lines = linesFromHexagram(hex);
    const throws = lines.map((bit) =>
      bit === 1
        ? facesToThrow(['obverse', 'obverse', 'reverse'])
        : facesToThrow(['obverse', 'reverse', 'reverse']),
    ) as YaoThrow[];
    expect(detectTone(buildCastFromThrows(throws, 'coin'))).toBe('open');
  });

  it('鼎 is open (not cut via 革新)', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '鼎')!;
    const lines = linesFromHexagram(hex);
    const throws = lines.map((bit) =>
      bit === 1
        ? facesToThrow(['obverse', 'obverse', 'reverse'])
        : facesToThrow(['obverse', 'reverse', 'reverse']),
    ) as YaoThrow[];
    expect(detectTone(buildCastFromThrows(throws, 'coin'))).toBe('open');
  });

  it('讼 is hard (not soft via 沟通)', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '讼')!;
    const lines = linesFromHexagram(hex);
    const throws = lines.map((bit) =>
      bit === 1
        ? facesToThrow(['obverse', 'obverse', 'reverse'])
        : facesToThrow(['obverse', 'reverse', 'reverse']),
    ) as YaoThrow[];
    expect(detectTone(buildCastFromThrows(throws, 'coin'))).toBe('hard');
  });
});
