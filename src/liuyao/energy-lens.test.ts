import { describe, expect, it } from 'vitest';
import {
  formatLiuqinShort,
  buildEnergyFocus,
  buildYaoAskCard,
  buildCoreParseBlocks,
  formatYongLabel,
} from './energy-lens.ts';
import type { YaoDress } from './najia.ts';

function row(partial: Partial<YaoDress> & Pick<YaoDress, 'index' | 'liuqin'>): YaoDress {
  return {
    label: ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][partial.index]!,
    bit: 1,
    changing: false,
    branch: '子',
    wuxing: '水',
    liushen: '青龙',
    isShi: false,
    isYing: false,
    ...partial,
  };
}

describe('energy-lens', () => {
  it('formats 妻财 as modern（classic）', () => {
    expect(formatLiuqinShort('妻财')).toBe('物质根基 / 自我价值（妻财）');
    expect(formatLiuqinShort('官鬼')).toMatch(/目标系统/);
    expect(formatLiuqinShort('官鬼')).toMatch(/官鬼/);
  });

  it('formatYongLabel keeps classic tokens inside', () => {
    expect(formatYongLabel('官鬼爻')).toContain('官鬼');
    expect(formatYongLabel('官鬼爻')).toContain('目标');
  });

  it('energy focus prefers 官鬼 message when moving', () => {
    const items = buildEnergyFocus({ changingQin: ['官鬼'] });
    expect(items[0]!.body).toMatch(/外部目标|体感/);
  });

  it('yao ask card uses energy-parse template', () => {
    const card = buildYaoAskCard(
      row({
        index: 4,
        liuqin: '官鬼',
        changing: true,
        isShi: false,
        liushen: '青龙',
        changedBranch: '亥',
        changedWuxing: '水',
      }),
      { domain: 'career' },
    );
    expect(card.title).toMatch(/能量解析/);
    expect(card.position).toMatch(/顶部/);
    expect(card.state).toMatch(/改变欲望|扩张/);
    expect(card.relate).toMatch(/求职/);
    expect(card.classicNote).toMatch(/官鬼/);
  });

  it('core parse has 世应动 with classic notes', () => {
    const blocks = buildCoreParseBlocks(
      [
        row({ index: 5, liuqin: '兄弟', isShi: true, liushen: '青龙' }),
        row({ index: 1, liuqin: '妻财', isYing: true, liushen: '玄武' }),
        row({ index: 2, liuqin: '父母', changing: true, changedBranch: '亥', changedWuxing: '水' }),
      ],
      { domain: 'career' },
    );
    expect(blocks).toHaveLength(3);
    expect(blocks[0]!.kicker).toMatch(/世爻/);
    expect(blocks[0]!.body).toMatch(/向外探索/);
    expect(blocks[0]!.classicNote).toMatch(/兄弟/);
    expect(blocks[1]!.body).toMatch(/资源|利益/);
    expect(blocks[1]!.classicNote).toMatch(/玄武/);
    expect(blocks[2]!.kicker).toMatch(/动爻/);
  });
});
