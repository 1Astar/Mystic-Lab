import { describe, expect, it } from 'vitest';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from './engine.ts';
import { chouOf, renderEnergyChainHtml, renderGuaXiangCard, renderLearnStudioHtml } from './learn-studio.ts';

function castYu() {
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

describe('learn-studio', () => {
  it('仇神 = 生忌神者', () => {
    expect(chouOf('官鬼')).toBe('兄弟'); // 忌=子孙，生子孙=兄弟
    expect(chouOf('妻财')).toBe('父母'); // 忌=兄弟，生兄弟=父母
    expect(chouOf('父母')).toBe('子孙'); // 忌=妻财，生妻财=子孙
  });

  it('卦象解析卡含上下卦符号与自然翻译', () => {
    const cast = castYu();
    const html = renderGuaXiangCard(cast);
    expect(html).toMatch(/卦象解析卡/);
    expect(html).toMatch(/上卦为/);
    expect(html).toMatch(/下卦为/);
  });

  it('能量推演链含用元忌仇四段', () => {
    const cast = castYu();
    const html = renderEnergyChainHtml(cast, '这次面试能过吗', new Date('2026-07-21T10:00:00'));
    expect(html).toMatch(/核心目标（用神）/);
    expect(html).toMatch(/直接帮助（元神）/);
    expect(html).toMatch(/潜在隐患（忌神）/);
    expect(html).toMatch(/最终博弈（仇神）/);
  });

  it('学习工作室含左右栏与笔记引导', () => {
    const cast = castYu();
    const html = renderLearnStudioHtml(cast, '感情会怎样', new Date('2026-07-21T10:00:00'));
    expect(html).toMatch(/ly-studio-left/);
    expect(html).toMatch(/ly-studio-right/);
    expect(html).toMatch(/古籍文献资料库/);
    expect(html).toMatch(/我的直觉感受/);
    expect(html).toMatch(/易学黑话翻译对照表/);
  });
});
