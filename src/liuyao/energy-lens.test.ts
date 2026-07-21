import { describe, expect, it } from 'vitest';
import {
  formatLiuqinShort,
  buildEnergyFocus,
  buildYaoAskCard,
  formatYongLabel,
} from './energy-lens.ts';
import type { YaoDress } from './najia.ts';

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

  it('yao ask card mentions line role and energy', () => {
    const row: YaoDress = {
      index: 0,
      label: '初爻',
      bit: 0,
      changing: true,
      branch: '子',
      wuxing: '水',
      liuqin: '父母',
      liushen: '白虎',
      isShi: true,
      isYing: false,
    };
    const card = buildYaoAskCard(row);
    expect(card.headline).toMatch(/初爻/);
    expect(card.headline).toMatch(/安全基地/);
    expect(card.relate).toMatch(/世/);
    expect(card.aux).toMatch(/动/);
  });
});
