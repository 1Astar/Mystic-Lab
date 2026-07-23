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

  it('泽火革公式：外部环境变化推动内部改变', () => {
    // 下离(101) + 上兑(110) → 泽火革；字=2 背=3
    const yang = (): ReturnType<typeof facesToThrow> =>
      facesToThrow(['obverse', 'obverse', 'reverse']); // 7 少阳
    const yin = (): ReturnType<typeof facesToThrow> =>
      facesToThrow(['obverse', 'reverse', 'reverse']); // 8 少阴
    const throws = [yang(), yin(), yang(), yang(), yang(), yin()] as YaoThrow[];
    const cast = buildCastFromThrows(throws, 'coin');
    expect(cast.primary.name).toBe('革');
    const html = renderGuaXiangCard(cast);
    expect(html).toMatch(/泽 ☱|泽\s*☱/);
    expect(html).toMatch(/火 ☲|火\s*☲/);
    expect(html).toMatch(/交流、变化、喜悦/);
    expect(html).toMatch(/文明、显现、行动/);
    expect(html).toMatch(/外部环境变化推动内部改变/);
  });

  it('能量推演链含用元忌仇四段', () => {
    const cast = castYu();
    const html = renderEnergyChainHtml(cast, '这次面试能过吗', new Date('2026-07-21T10:00:00'));
    expect(html).toMatch(/你的当下能量聚焦表|ly-energy-focus/);
    expect(html).toMatch(/核心聚焦（用神）/);
    expect(html).toMatch(/补给系统（元神）/);
    expect(html).toMatch(/耗散系统（忌神）/);
    expect(html).toMatch(/拉扯层（仇神）/);
    expect(html).toMatch(/注意力放哪|谁克死谁/);
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
