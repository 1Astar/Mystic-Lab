import { describe, expect, it } from 'vitest';
import {
  buildShenshaMeetHighlights,
  buildShenshaMeetPulsePanel,
  renderShenshaMeetHighlightHtml,
  resolveMeetStage,
  resolveMeetSummary,
} from './shensha-meet-highlight.ts';
import { formatShenshaMeetAtLine, indexChartStars } from './codex-collect.ts';
import type { PalaceSnap, ZiweiChartView } from './types.ts';

function palace(
  name: string,
  extra: Partial<PalaceSnap> = {},
): PalaceSnap {
  return {
    name,
    isSoul: name === '命宫',
    isBody: false,
    isEmpty: false,
    heavenlyStem: '甲',
    earthlyBranch: '子',
    majors: [],
    minors: [],
    adjectives: [],
    ...extra,
  };
}

describe('shensha-meet-highlight', () => {
  it('resolves stage by collected count', () => {
    expect(resolveMeetStage(2).id).toBe('seed');
    expect(resolveMeetStage(8).id).toBe('rising');
    expect(resolveMeetStage(12).id).toBe('constellation');
  });

  it('picks balanced summary rules', () => {
    expect(
      resolveMeetSummary({
        patron: 6,
        romance: 3,
        talent: 1,
        career: 2,
        fortune: 0,
        void: 0,
        friction: 0,
        health: 0,
        solitude: 0,
        flow: 0,
      }).badge,
    ).toBe('大器晚成');

    expect(
      resolveMeetSummary({
        patron: 1,
        romance: 0,
        talent: 4,
        career: 0,
        fortune: 0,
        void: 0,
        friction: 0,
        health: 0,
        solitude: 0,
        flow: 0,
      }).badge,
    ).toBe('孤高傲骨');

    expect(
      resolveMeetSummary({
        patron: 1,
        romance: 0,
        talent: 0,
        career: 0,
        fortune: 0,
        void: 0,
        friction: 4,
        health: 0,
        solitude: 0,
        flow: 0,
      }).badge,
    ).toBe('自我护栏');

    expect(
      resolveMeetSummary({
        patron: 2,
        romance: 1,
        talent: 1,
        career: 1,
        fortune: 0,
        void: 0,
        friction: 0,
        health: 0,
        solitude: 0,
        flow: 0,
      }).badge,
    ).toBe('厚积薄发');
  });

  it('builds pulse panel with pillars niches and tones', () => {
    const panel = buildShenshaMeetPulsePanel([
      '解神',
      '天贵',
      '三台',
      '八座',
      '红鸾',
      '天喜',
      '龙池',
      '天德',
      '月德',
      '天刑',
      '天虚',
    ]);
    expect(panel).not.toBeNull();
    expect(panel!.pillars).toHaveLength(4);
    expect(panel!.pillars.find((p) => p.theme === 'patron')!.count).toBeGreaterThan(0);
    expect(panel!.niches.some((n) => n.theme === 'friction' || n.theme === 'void')).toBe(true);
    expect(panel!.tones).toHaveLength(3);
    expect(panel!.summary.badge).toBeTruthy();
  });

  it('keeps legacy highlight lines API', () => {
    const lines = buildShenshaMeetHighlights(['天德', '解神', '红鸾', '龙池']);
    expect(lines.length).toBeGreaterThan(0);
    expect(lines[0].text).toMatch(/初遇|渐入佳境|群星汇聚/);
  });

  it('renders pulse panel html with clickable pillars', () => {
    const panel = buildShenshaMeetPulsePanel([
      '解神',
      '天贵',
      '三台',
      '红鸾',
      '天喜',
      '龙池',
    ]);
    const html = renderShenshaMeetHighlightHtml(panel);
    expect(html).toContain('星象脉搏');
    expect(html).toContain('data-meet-kind="shensha"');
    expect(html).toContain('data-shensha-theme="romance"');
    expect(html).toContain('命盘色调');
  });

  it('renders empty highlight shell', () => {
    const html = renderShenshaMeetHighlightHtml(null);
    expect(html).toContain('已收集 · 神煞图鉴');
    expect(html).toContain('is-empty');
  });
});

describe('shensha meet source', () => {
  it('labels natal adjective and year series', () => {
    const view = {
      palaces: [
        palace('夫妻', {
          adjectives: [
            {
              name: '解神',
              brightness: '',
              mutagen: '',
              isMajor: false,
            },
          ],
        }),
        palace('迁移', {
          series: [{ kind: 'suiqian', name: '天德' }],
        }),
      ],
      soulPalace: palace('命宫'),
      theater: { annual: { year: 2026 } },
    } as unknown as ZiweiChartView;

    const map = indexChartStars(view);
    expect(formatShenshaMeetAtLine(map.get('解神'))).toBe(
      '📍 相遇于：夫妻宫 · 本命盘',
    );
    expect(formatShenshaMeetAtLine(map.get('天德'))).toBe(
      '📍 相遇于：迁移宫 · 流年2026',
    );
  });
});
