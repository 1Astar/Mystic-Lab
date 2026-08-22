import { describe, expect, it } from 'vitest';
import {
  relatedFootnotesFor,
  resolveCodexPeerId,
} from './codex-related-footnote.ts';
import { buildPracticeComboCards } from './codex-practice-combo.ts';
import type { BaziChart, PillarCell } from './cast.ts';
import type { LuckCycles } from './luck-cycles.ts';

function cell(
  partial: Partial<PillarCell> & Pick<PillarCell, 'key' | 'title' | 'stem' | 'branch'>,
): PillarCell {
  return {
    stemGod: '比肩',
    hideGan: [],
    hideGods: [],
    nayin: '',
    xunKong: '',
    diShi: '',
    ziZuo: '',
    shensha: [],
    ...partial,
  };
}

function chart(dayMaster: string, stems: string[] = []): BaziChart {
  const pillars: PillarCell[] = [
    cell({ key: 'year', title: '年柱', stem: stems[0] || dayMaster, branch: '子' }),
    cell({ key: 'month', title: '月柱', stem: stems[1] || dayMaster, branch: '寅' }),
    cell({ key: 'day', title: '日柱', stem: dayMaster, branch: '午' }),
    cell({ key: 'hour', title: '时柱', stem: stems[2] || dayMaster, branch: '戌' }),
  ];
  return {
    pillars,
    dayMaster,
    dayMasterWx: '木',
    dayBranch: '午',
    yearBranch: '子',
    relations: [],
    season: [],
    place: { matched: false, lng: 0, note: '' },
    clockLabel: '',
    trueSolarLabel: '',
    hasHour: true,
    liunianYear: 2026,
    birthYear: 1990,
  };
}

function luck(stem: string, branch = '午'): LuckCycles {
  return {
    dayGan: '乙',
    dayXunKong: '',
    qiYunLabel: '',
    jiaoYunLabel: '',
    ageNow: 36,
    dayun: [],
    liunian: [
      {
        ganZhi: `${stem}${branch}`,
        stem,
        branch,
        stemGod: '',
        branchGod: '',
        year: 2026,
        age: 36,
        xiaoYunGanZhi: '',
        current: true,
        selected: true,
      },
    ],
    liuyue: [],
  };
}

describe('codex-related-footnote', () => {
  it('resolvePeerId 识别庚金与比肩', () => {
    expect(resolveCodexPeerId('庚金')).toBe('庚');
    expect(resolveCodexPeerId('比肩')).toBe('tg:比肩');
  });

  it('甲木脚注优先关联比肩且可跳转', () => {
    const notes = relatedFootnotesFor('甲', 1);
    expect(notes.length).toBe(1);
    expect(notes[0]!.peerId).toBe('tg:比肩');
    expect(notes[0]!.peerLabel).toBe('比肩');
    expect(notes[0]!.gloss.length).toBeGreaterThan(4);
  });
});

describe('codex-practice-combo', () => {
  it('乙日主 + 流年甲 → 藤萝系甲绑盘卡', () => {
    const cards = buildPracticeComboCards('甲', chart('乙'), luck('甲'));
    expect(cards.length).toBeGreaterThanOrEqual(1);
    const top = cards[0]!;
    expect(top.bound).toBe(true);
    expect(top.classicName).toBe('藤萝系甲');
    expect(top.title).toMatch(/流年遇甲/);
    expect(top.body).toMatch(/乙木|藤萝|平台/);
    expect(top.ctaHref).toBe('/bazi/reading');
  });

  it('无原局看甲仍给示例实战卡', () => {
    const cards = buildPracticeComboCards('甲', null, null);
    expect(cards[0]?.bound).toBe(false);
    expect(cards[0]?.body).toMatch(/藤萝系甲|乙木/);
  });
});
