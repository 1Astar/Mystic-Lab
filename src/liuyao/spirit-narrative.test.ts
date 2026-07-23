import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import {
  buildSpiritNarrative,
  buildSpiritClassicNotes,
  isBranchLiuHe,
  renderSpiritNarrativeHtml,
} from './spirit-narrative.ts';
import type { YaoDress } from './najia.ts';

function castYu() {
  const bits = [0, 0, 0, 1, 0, 0] as const;
  const throws: YaoThrow[] = bits.map((bit) => {
    const coins =
      bit === 1
        ? (['reverse', 'obverse', 'obverse'] as const)
        : (['obverse', 'reverse', 'reverse'] as const);
    return facesToThrow([...coins] as [typeof coins[0], typeof coins[1], typeof coins[2]]);
  });
  return buildCastFromThrows(throws, 'random');
}

function fakeRow(partial: Partial<YaoDress> & Pick<YaoDress, 'index' | 'label' | 'branch' | 'liuqin'>): YaoDress {
  return {
    bit: 1,
    wuxing: '火',
    liushen: '青龙',
    isShi: false,
    isYing: false,
    changing: false,
    ...partial,
  } as YaoDress;
}

describe('spirit-narrative', () => {
  it('builds 用元忌仇 paragraphs for exam question', () => {
    const cast = castYu();
    const n = buildSpiritNarrative(cast, '明天考试能不能成功', new Date('2026-07-21'));
    expect(n.paragraphs.some((p) => p.kind === 'yong')).toBe(true);
    expect(n.paragraphs.some((p) => p.kind === 'verdict')).toBe(true);
    expect(n.verdict.length).toBeGreaterThan(8);
    expect(n.hexName.length).toBeGreaterThan(1);
    expect(n.roster.length).toBe(4);
    const html = renderSpiritNarrativeHtml(n);
    expect(html).toMatch(/本卦/);
    expect(html).toMatch(/ly-spirit-nar/);
    expect(html).toMatch(/核心聚焦（用神）|补给系统（元神）|耗散系统（忌神）/);
    expect(html).toMatch(/data-spirit-roster/);
    expect(html).not.toMatch(/谁克死谁/);
  });

  it('uses concrete matter language for career question', () => {
    const cast = castYu();
    const n = buildSpiritNarrative(cast, '这次面试能过吗', new Date('2026-07-21'));
    const yong = n.paragraphs.find((p) => p.kind === 'yong');
    expect(yong).toBeTruthy();
    expect(yong!.text).toMatch(/工作 \/ 面试|岗位|考核|回报/);
    expect(yong!.text).toMatch(/本卦/);
    expect(yong!.text).toMatch(/先写清|先/);
  });

  it('emits 贪生忘克 classic + 白话 when 元忌同动', () => {
    const yuan = fakeRow({
      index: 3,
      label: '四爻',
      branch: '午',
      liuqin: '官鬼',
      changing: true,
      changedBranch: '未',
      wuxing: '火',
    });
    const ji = fakeRow({
      index: 1,
      label: '二爻',
      branch: '寅',
      liuqin: '妻财',
      changing: true,
      wuxing: '木',
    });
    expect(isBranchLiuHe('午', '未')).toBe(true);
    const notes = buildSpiritClassicNotes(yuan, ji, '未');
    expect(notes.length).toBe(2);
    expect(notes[0]!.classic).toMatch(/贪生忘克/);
    expect(notes[0]!.baihua).toMatch(/忌神本来会克用神/);
    expect(notes[1]!.classic).toMatch(/贪合忘生/);
    expect(notes[1]!.baihua).toMatch(/六合|粘/);
  });

  it('emits 暗动 classic when 忌神日冲', () => {
    const ji = fakeRow({
      index: 1,
      label: '二爻',
      branch: '寅',
      liuqin: '妻财',
      changing: false,
      wuxing: '木',
    });
    const notes = buildSpiritClassicNotes(undefined, ji, '申');
    expect(notes.some((n) => /暗动/.test(n.classic))).toBe(true);
    expect(notes[0]!.baihua).toMatch(/暗动/);
  });
});
