import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from '../liuyao/engine.ts';
import { HEXAGRAMS, linesFromHexagram } from '../liuyao/hexagrams.ts';
import { buildOfflineAnswerPack } from './build-pack.ts';
import { detectScriptScene } from './script-scene.ts';
import { extractCoreMetrics } from './script-metrics.ts';
import { buildScriptPlay } from './script-play.ts';
import { renderAnswerPackHtml } from './render-pack.ts';

function castNamed(from: string, to: string | null, changingIndexes: number[]) {
  const hex = HEXAGRAMS.find((h) => h.name === from)!;
  const lines = linesFromHexagram(hex);
  const throws = lines.map((bit, i) => {
    const changing = changingIndexes.includes(i);
    if (changing && bit === 1) return facesToThrow(['reverse', 'reverse', 'reverse']);
    if (changing && bit === 0) return facesToThrow(['obverse', 'obverse', 'obverse']);
    if (bit === 1) return facesToThrow(['obverse', 'obverse', 'reverse']);
    return facesToThrow(['obverse', 'reverse', 'reverse']);
  }) as YaoThrow[];
  const cast = buildCastFromThrows(throws, 'coin');
  expect(cast.primary.name).toBe(from);
  if (to) expect(cast.changed?.name).toBe(to);
  return cast;
}

describe('script scene', () => {
  it('detects interview / reunion / quit_stay', () => {
    expect(detectScriptScene('面试过了吗？要不要补材料？')).toBe('interview');
    expect(detectScriptScene('还能复合吗？')).toBe('reunion');
    expect(detectScriptScene('我要不要留在这家公司？')).toBe('quit_stay');
  });
});

describe('script director · 渐→艮 面试金样', () => {
  // 风山渐 → 艮为山：上爻动（巽上爻阳变阴 → 艮）
  // 渐 = 巽上艮下；艮 = 艮上艮下 → 需变上卦，即五爻或上爻等
  it('builds four-beat play anchored to tug / slow_stop / interview', () => {
    const cast = castNamed('渐', '艮', [4]);
    const q = '这次面试结果怎么样？要不要主动补材料？';
    // 固定日期：便于暗动/月破可复现；7/29 甲辰日 / 未月 在引擎里会冲
    const castAt = new Date('2026-07-29T12:00:00+08:00');
    const metrics = extractCoreMetrics(cast, q, castAt);
    expect(metrics.pace).toBe('slow_then_stop');

    const play = buildScriptPlay({ question: q, cast, castAt });
    expect(play.scene).toBe('interview');
    expect(play.beats.map((b) => b.id)).toEqual([
      'calm',
      'truth',
      'action',
      'boundary',
    ]);
    expect(play.headline).toMatch(/推进|沟通|补材料|该停则停/);
    expect(play.headline).not.toMatch(/^对「/);
    expect(play.beats[1]!.body).toMatch(/盘面|用神/);
    expect(play.beats[1]!.body).not.toMatch(/你问的是/);
    expect(play.beats[2]!.body).toMatch(/材料|跟进|邮件|发/);
    expect(play.beats[3]!.body).toMatch(/停|边界|3\s*天|Plan B|下一家/);

    const pack = buildOfflineAnswerPack({ question: q, cast, castAt });
    expect(pack.script?.scene).toBe('interview');
    expect(pack.verdict.headline).toMatch(/主调|渐进|转向|「/);
    expect(pack.why.length).toBeGreaterThanOrEqual(2);
    expect(pack.reassurance).toMatch(/卦象|主见|深呼吸|判决/);

    const html = renderAnswerPackHtml(pack, { cast });
    expect(html).toMatch(/核心方向/);
    expect(html).toMatch(/现状与转机/);
    expect(html).toMatch(/具体动作/);
    expect(html).toMatch(/心理定心丸/);
    expect(html).toMatch(/对你这个问题/);
    expect(html).toMatch(/综合论断/);
    expect(html).toMatch(/发展趋势|应期推断|具体细节/);
    expect(html).toMatch(/为何这样看|盘面信号/);
    expect(html).toMatch(/盘面辅读/);
    expect(html).toMatch(/ly-layer-card/);
    expect(html).toMatch(/眼下|变在哪|走向|ly-why-soft/);
    expect(play.synthesis.outcome.text).toMatch(/倾向|偏|参考|不是|走平|不宜|暂判/);
    expect(play.synthesis.outcome.text).not.toMatch(/就「/);
    expect(play.synthesis.disclaimer).toMatch(/不是绝对/);
    expect(play.synthesis.timing).toMatch(/应期|窗口|参考/);
    expect(play.synthesis.details).toMatch(/用神|世|应/);
  });

  it('裸辞问题：正面回应问题，不把卦意当判决', () => {
    const cast = castNamed('小过', '遁', [4, 5]);
    const q = '你觉得我要不要裸辞';
    const play = buildScriptPlay({ question: q, cast, castAt: new Date('2026-07-29T23:39:00') });
    expect(play.scene).toBe('quit_stay');
    expect(play.headline).toMatch(/裸辞|底线|期限/);
    expect(play.headline).not.toMatch(/^对「/);
    expect(play.beats[1]!.body).toMatch(/所以/);
    expect(play.beats[1]!.body).toMatch(/用神|旺|世应|动爻|暗动|月破|盘面/);
    expect(play.beats[1]!.body).not.toMatch(/^抽身是合理/);
    expect(play.actionRuleId).toMatch(/bare_quit|quit_/);
    expect(play.beats[2]!.body).toMatch(/三行|底线|期限|辞呈/);
  });

  it('条件触发：面试拉锯走补材料动作规则', () => {
    const cast = castNamed('渐', '艮', [4]);
    const castAt = new Date('2026-07-29T12:00:00+08:00');
    const play = buildScriptPlay({
      question: '这次面试结果怎么样？要不要主动补材料？',
      cast,
      castAt,
    });
    expect(play.intentId).toBe('offer_decide');
    expect(play.actionRuleId).toMatch(/interview_/);
    expect(play.beats[1]!.body).toMatch(/用神/);
  });
});
