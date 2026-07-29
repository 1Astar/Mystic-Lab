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
    expect(play.beats[2]!.body).toMatch(/材料|跟进|邮件|发/);
    expect(play.beats[3]!.body).toMatch(/停|边界|3\s*天|Plan B|下一家/);

    const pack = buildOfflineAnswerPack({ question: q, cast, castAt });
    expect(pack.script?.scene).toBe('interview');
    expect(pack.verdict.headline).toBe(play.headline);

    const html = renderAnswerPackHtml(pack, { cast });
    expect(html).toMatch(/卦象定调/);
    expect(html).toMatch(/给你的核心定心丸/);
    expect(html).toMatch(/现状真相/);
    expect(html).toMatch(/今晚\/明天的具体动作/);
    expect(html).toMatch(/你的底线与防备/);
    expect(html).toMatch(/盘面辅读/);
    expect(html).toMatch(/ly-script-beat is-ops/);
  });
});
