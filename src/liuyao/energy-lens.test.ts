import { describe, expect, it } from 'vitest';
import {
  formatLiuqinShort,
  buildEnergyFocus,
  buildYaoAskCard,
  buildCoreParseBlocks,
  buildInternalInference,
  formatYongLabel,
  renderQinDictHtml,
  renderQinDictPanelHtml,
  LIUQIN_DICT,
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

  it('dict modernTitle matches energy label stem', () => {
    expect(LIUQIN_DICT.官鬼.modernTitle).toBe('目标系统 / 外部规则');
    expect(LIUQIN_DICT.妻财.modernTitle).toBe('物质根基 / 自我价值');
    expect(LIUQIN_DICT.子孙.modernTitle).toBe('内在创造力 / 破局点');
    expect(LIUQIN_DICT.父母.modernTitle).toBe('安全基地 / 信息网');
    expect(LIUQIN_DICT.兄弟.modernTitle).toBe('同侪环境 / 盟友圈');
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

  it('internal inference has yong yuan ji and confluence', () => {
    const inf = buildInternalInference({
      domain: 'career',
      yongQin: '父母',
      yongRow: row({ index: 2, liuqin: '父母' }),
      yuanRow: row({ index: 3, liuqin: '官鬼', changing: true }),
      jiRow: row({ index: 0, liuqin: '妻财' }),
    });
    expect(inf.lines[0]!.title).toMatch(/用神/);
    expect(inf.lines[1]!.body).toMatch(/动力/);
    expect(inf.lines[2]!.classicNote).toMatch(/忌神/);
    expect(inf.confluence).toMatch(/有利|松动|助力/);
  });

  it('qin dict renders tags + panel for binding', () => {
    const html = renderQinDictHtml();
    expect(html).toMatch(/data-qin-dict-root/);
    expect(html).toMatch(/data-qin-dict="父母"/);
    expect(html).toMatch(/data-qin-dict-panel/);
    expect(html).toMatch(/六亲词典/);
    expect(html).toMatch(/人物 · 场所 · 事务 · 心态/);
  });

  it('qin dict facets cover 人物场所事务心态', () => {
    expect(LIUQIN_DICT['父母'].people).toMatch(/父母|师长/);
    expect(LIUQIN_DICT['官鬼'].place).toMatch(/公司|考场/);
    const panel = renderQinDictPanelHtml(LIUQIN_DICT['官鬼']);
    expect(panel).toMatch(/人物/);
    expect(panel).toMatch(/场所/);
    expect(panel).toMatch(/事务/);
    expect(panel).toMatch(/心态/);
    expect(panel).toMatch(/领导|丈夫/);
  });
});
