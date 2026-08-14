import { describe, expect, it } from 'vitest';
import { buildAdvancedDeduceModules } from './codex-advanced-deduce.ts';
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

function chartWithBranches(dayMaster: string, branches: {
  year: string;
  month: string;
  day: string;
  hour: string;
}): BaziChart {
  return {
    pillars: [
      cell({ key: 'year', title: '年柱', stem: dayMaster, branch: branches.year }),
      cell({ key: 'month', title: '月柱', stem: dayMaster, branch: branches.month }),
      cell({ key: 'day', title: '日柱', stem: dayMaster, branch: branches.day }),
      cell({ key: 'hour', title: '时柱', stem: dayMaster, branch: branches.hour }),
    ],
    dayMaster,
    dayMasterWx: '木',
    dayBranch: branches.day,
    yearBranch: branches.year,
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

function luckBranch(branch: string, stem = '丙'): LuckCycles {
  return {
    dayGan: '甲',
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

describe('codex-advanced-deduce', () => {
  it('看申且原局有寅 → 展开寅申冲', () => {
    const chart = chartWithBranches('甲', {
      year: '子',
      month: '寅',
      day: '午',
      hour: '戌',
    });
    const mods = buildAdvancedDeduceModules('申', chart, null);
    expect(mods.some((m) => m.name === '寅申冲')).toBe(true);
    const hit = mods.find((m) => m.name === '寅申冲')!;
    expect(hit.source).toBe('natal');
    expect(hit.where).toMatch(/月柱.*寅/);
    expect(hit.body).toMatch(/合同|行程|场域/);
    expect(hit.peerIds).toContain('寅');
  });

  it('看申且流年寅、原局无寅 → 流年触发寅申冲', () => {
    const chart = chartWithBranches('甲', {
      year: '子',
      month: '丑',
      day: '午',
      hour: '戌',
    });
    const mods = buildAdvancedDeduceModules('申', chart, luckBranch('寅'));
    const hit = mods.find((m) => m.name === '寅申冲');
    expect(hit?.source).toBe('liunian');
    expect(hit?.where).toMatch(/流年/);
  });

  it('无盘看申 → 索引提示寅申冲', () => {
    const mods = buildAdvancedDeduceModules('申', null, null);
    expect(mods[0]?.source).toBe('index');
    expect(mods[0]?.name).toBe('寅申冲');
    expect(mods[0]?.title).toMatch(/索引/);
  });

  it('原局无对宫则不展开冲模块', () => {
    const chart = chartWithBranches('甲', {
      year: '子',
      month: '丑',
      day: '午',
      hour: '戌',
    });
    const mods = buildAdvancedDeduceModules('申', chart, luckBranch('午'));
    expect(mods.every((m) => m.name !== '寅申冲')).toBe(true);
  });
});
