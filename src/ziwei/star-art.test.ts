import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  majorStarArtUrl,
  palaceArtUrl,
  palaceListThumbInnerHtml,
  starListThumbInnerHtml,
  comboArtUrl,
  comboHeroInnerHtml,
  comboListThumbInnerHtml,
} from './star-art.ts';
import {
  collectStateLabel,
  resolveCodexCollectState,
  type ChartStarHit,
} from './codex-collect.ts';

vi.mock('../craft/spirit-activate.ts', async (importOriginal) => {
  const mod = await importOriginal<typeof import('../craft/spirit-activate.ts')>();
  return {
    ...mod,
    loadActivateStore: () => ({
      activated: [] as string[],
      explored: [] as string[],
      updatedAt: new Date().toISOString(),
    }),
  };
});

describe('star-art', () => {
  it('maps major, lucky, sha, and featured aux/minor to webp', () => {
    expect(majorStarArtUrl('天机')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('文昌')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('擎羊')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('禄存')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('红鸾')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('咸池')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('龙池')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('三台')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('封诰')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天巫')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天寿')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('蜚廉')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天德')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('月德')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天空')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('岁破')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('天官')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('将星')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('飞廉')).toBe(majorStarArtUrl('蜚廉'));
    expect(majorStarArtUrl('白虎')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('吊客')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('化禄')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('化权')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('化科')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('化忌')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('旬空')).toMatch(/\.webp$/);
    expect(majorStarArtUrl('__无此星__')).toBeNull();
  });

  it('falls back to glyph when no poster; otherwise uses webp', () => {
    expect(starListThumbInnerHtml('__无此星__', { tone: 'shensha' })).toContain('ziwei-codex-short-glyph');
    expect(starListThumbInnerHtml('天机')).toContain('.webp');
    expect(starListThumbInnerHtml('白虎', { tone: 'shensha' })).toContain('.webp');
    expect(starListThumbInnerHtml('飞廉', { tone: 'shensha' })).toContain('.webp');
    expect(starListThumbInnerHtml('化禄')).toContain('.webp');
  });

  it('maps twelve palaces to webp', () => {
    expect(palaceArtUrl('命宫')).toMatch(/\.webp$/);
    expect(palaceArtUrl('奴仆宫')).toBe(palaceArtUrl('仆役'));
    expect(palaceListThumbInnerHtml('财帛', { glyph: '财' })).toContain('.webp');
    expect(palaceArtUrl('__无此宫__')).toBeNull();
  });

  it('maps featured combos to webp and aliases variants', () => {
    expect(comboArtUrl('杀破狼格')).toMatch(/combos\/.*\.webp$/);
    expect(comboArtUrl('杀破狼')).toBe(comboArtUrl('杀破狼格'));
    expect(comboArtUrl('机月同梁')).toBe(comboArtUrl('机月同梁格'));
    expect(comboArtUrl('紫府')).toBe(comboArtUrl('紫府同宫'));
    expect(comboArtUrl('阳梁昌禄')).toMatch(/\.webp$/);
    expect(comboArtUrl('马头带剑')).toMatch(/\.webp$/);
    expect(comboArtUrl('紫府朝垣')).toMatch(/\.webp$/);
    expect(comboArtUrl('火铃贪')).toMatch(/\.webp$/);
    expect(comboArtUrl('左右夹命')).toMatch(/\.webp$/);
    expect(comboArtUrl('贪武同行')).toMatch(/\.webp$/);
    expect(comboArtUrl('甲第登科')).toMatch(/\.webp$/);
    expect(comboArtUrl('官封三代')).toBe(comboArtUrl('巨日同宫'));
    expect(comboArtUrl('日照雷门')).toBe(comboArtUrl('日出扶桑'));
    expect(comboArtUrl('日丽中天')).toBe(comboArtUrl('金灿光辉'));
    expect(comboArtUrl('空劫夹命')).toBe(comboArtUrl('空劫守命'));
    expect(comboArtUrl('昌曲')).toMatch(/\.webp$/);
    expect(comboArtUrl('禄权科忌')).toMatch(/\.webp$/);
    expect(comboArtUrl('府相')).toMatch(/\.webp$/);
    expect(comboListThumbInnerHtml({ id: '羊陀', title: '羊陀', members: ['擎羊', '陀罗'] })).toContain('.webp');
    expect(comboListThumbInnerHtml({ id: '杀破狼格', title: '杀破狼格', members: ['七杀'] })).toContain(
      '.webp',
    );
    expect(comboListThumbInnerHtml({ id: '昌曲夹命', title: '昌曲夹命格', members: ['文昌', '文曲'] })).toContain(
      '.webp',
    );
    expect(comboListThumbInnerHtml({ id: '紫府夹命', title: '紫府夹命格', members: ['紫微', '天府'] })).toContain(
      '.webp',
    );
    expect(comboHeroInnerHtml({ id: '命无正曜', title: '命无正曜格', members: [] })).toContain('.webp');
    expect(comboArtUrl('__无此格__')).toBeNull();
  });
});

describe('codex-collect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('marks in-chart unpowered star as met (相遇)', () => {
    const hits = new Map<string, ChartStarHit>([
      ['天机', { palace: '财帛宫' }],
    ]);
    expect(resolveCodexCollectState('天机', hits, { hasChart: true })).toBe('met');
    expect(collectStateLabel('met')).toMatch(/相遇/);
  });

  it('marks pending when not on chart and not unlocked', () => {
    expect(resolveCodexCollectState('紫微', new Map())).toBe('pending');
  });

  it('marks absent when chart exists but star missing', () => {
    expect(
      resolveCodexCollectState('紫微', new Map(), { hasChart: true }),
    ).toBe('absent');
  });
});
