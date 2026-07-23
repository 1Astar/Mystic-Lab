import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { buildYongFocusPack, renderYongFocusHtml } from './yong-focus.ts';

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

describe('yong-focus', () => {
  it('maps career question to 官鬼 and locates yong yao', () => {
    const pack = buildYongFocusPack(castSample(), '面试能过吗', new Date('2026-07-21'));
    expect(pack.topicLabel).toMatch(/求职|升职|工作/);
    expect(pack.yongQin).toBe('官鬼');
    expect(pack.focusIndexes.length).toBeGreaterThan(0);
    expect(pack.coreHint).toMatch(/核心点位|第.+爻/);
    expect(pack.expertTitle).toMatch(/专家是怎么看/);
  });

  it('maps exam question to 父母', () => {
    const pack = buildYongFocusPack(castSample(), '考研能上岸吗', new Date('2026-07-21'));
    expect(pack.yongQin).toBe('父母');
    expect(pack.intro).toMatch(/用神/);
  });

  it('maps money question to 妻财', () => {
    const pack = buildYongFocusPack(castSample(), '这次投资能回本吗', new Date('2026-07-21'));
    expect(pack.yongQin).toBe('妻财');
  });

  it('renders expert blocks with status / translate / action', () => {
    const pack = buildYongFocusPack(castSample(), '面试能过吗', new Date('2026-07-21'));
    const html = renderYongFocusHtml(pack);
    expect(html).toMatch(/ly-yong-focus/);
    expect(html).toMatch(/状态是/);
    expect(html).toMatch(/翻译成你的/);
    expect(html).toMatch(/行动建议/);
  });
});
