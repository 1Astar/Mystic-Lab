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
    expect(labels).toMatch(/工作/);
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
    expect(html).toMatch(/ly-domain-card/);
    expect(html).toMatch(/ly-domain-card-head|ly-domain-card-title/);
    expect(html).toMatch(/ly-oracle-tag/);
    expect(html).not.toMatch(/ly-hex-expand-domain-label/);
    expect(html).not.toMatch(/data-expand-tab|data-oracle-tab|ly-note-mini-tab/);
    expect(html).toMatch(/运势/);
    expect(html).toMatch(/工作/);
    expect(html).toMatch(/感情/);
    expect(html).toMatch(/变卦方向/);
    const classic = renderClassicDomainOraclesHtml(pack);
    expect(classic).toMatch(/传统断语/);
    expect(classic).toMatch(/ly-oracle-tag/);
    expect(classic).not.toMatch(/ly-hex-expand-domain-label/);
    expect(classic).not.toMatch(/data-oracle-tab|ly-note-mini-tab/);
  });

  it('工作 / 感情分域含上下卦落点', () => {
    const cast = castSample();
    const pack = buildHexExpandPack(cast);
    const work = pack.domains.find((d) => d.label === '工作');
    const love = pack.domains.find((d) => d.label === '感情');
    expect(work?.modern).toMatch(/你这边偏|外面场偏/);
    expect(love?.modern).toMatch(/你这边偏|关系场偏/);
    expect(work?.classic.length).toBeGreaterThan(2);
  });
});

describe('dress-archive facts plate', () => {
  it('table → 用神状态 → 能量；无重复关键爻表；含六神折叠', () => {
    const cast = castSample();
    const html = renderDressArchiveHtml(cast, new Date('2026-07-21'), '面试能过吗');
    expect(html).toMatch(/用神状态|data-yong-status/);
    expect(html).toMatch(/ly-spirit-nar|data-dress-energy/);
    expect(html).toMatch(/旺衰/);
    expect(html).toMatch(/六神/);
    expect(html).toMatch(/data-dress-dual|ly-dress-switch|data-gua-switch/);
    expect(html).toMatch(/ly-dress-table/);
    expect(html).toMatch(/伏神 \/ 旬空 \/ 神煞/);
    expect(html).toMatch(/ly-teach-fold/);
    expect(html).toMatch(/六亲词典/);
    expect(html).toMatch(/data-dress-lens/);
    expect(html).not.toMatch(/data-key-wangxiang/);
    expect(html).not.toMatch(/谁克死谁/);
    const tableAt = html.indexOf('ly-dress-table');
    const statusAt = html.indexOf('data-yong-status');
    const energyAt = html.indexOf('data-dress-energy');
    expect(tableAt).toBeGreaterThan(-1);
    expect(statusAt).toBeGreaterThan(tableAt);
    expect(energyAt).toBeGreaterThan(statusAt);
  });
});
