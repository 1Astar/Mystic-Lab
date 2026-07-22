import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildHexExpandPack,
  renderHexExpandHtml,
  renderClassicDomainOraclesHtml,
} from './hex-expand.ts';
import { renderDressArchiveHtml } from './dress-archive.ts';

function castSample() {
  const throws = [
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
    facesToThrow([3, 3, 3]),
    facesToThrow([2, 2, 2]),
    facesToThrow([2, 2, 3]),
    facesToThrow([2, 3, 3]),
  ] as YaoThrow[];
  return buildCastFromThrows(throws, 'random');
}

describe('hex-expand', () => {
  it('builds core + meta + multi-domain oracles', () => {
    const cast = castSample();
    const pack = buildHexExpandPack(cast);
    expect(pack.primaryTitle).toMatch(/本卦【/);
    expect(pack.coreBai.length).toBeGreaterThan(20);
    expect(pack.meta.map((d) => d.label)).toEqual(['卦义', '解释', '特性']);
    expect(pack.domains.length).toBeGreaterThanOrEqual(15);
    const labels = pack.domains.map((d) => d.label).join();
    expect(labels).toMatch(/运势/);
    expect(labels).toMatch(/家运/);
    expect(labels).toMatch(/疾病/);
    expect(labels).toMatch(/感情/);
    expect(labels).toMatch(/考试/);
    expect(labels).toMatch(/诉讼/);
    expect(labels).toMatch(/失物/);
  });

  it('renders expand and classic oracle html', () => {
    const cast = castSample();
    const pack = buildHexExpandPack(cast);
    const html = renderHexExpandHtml(pack);
    expect(html).toMatch(/卦象核心释义/);
    expect(html).toMatch(/分域解说/);
    expect(html).toMatch(/data-expand-tab/);
    expect(html).toMatch(/运势/);
    expect(html).toMatch(/变卦/);
    expect(renderClassicDomainOraclesHtml(pack)).toMatch(/传统断语/);
    expect(renderClassicDomainOraclesHtml(pack)).toMatch(/卦义/);
  });
});

describe('dress-archive spirits', () => {
  it('includes 用神块 and 六亲表', () => {
    const cast = castSample();
    const html = renderDressArchiveHtml(cast, new Date('2026-07-21'), '面试能过吗');
    expect(html).toMatch(/用神/);
    expect(html).toMatch(/生克关系/);
    expect(html).toMatch(/用 \/ 元 \/ 忌 \/ 仇/);
    expect(html).toMatch(/ly-spirit-nar/);
    expect(html).toMatch(/六神/);
    expect(html).toMatch(/ly-dress-dual/);
    expect(html).toMatch(/ly-dress-table/);
    expect(html).toMatch(/伏神 \/ 旬空 \/ 神煞/);
    expect(html).toMatch(/ly-teach-fold/);
  });
});
