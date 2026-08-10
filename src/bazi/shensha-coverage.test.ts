import { describe, expect, it } from 'vitest';
import { SHENSHA_ATLAS } from './codex-atlas-catalog.ts';
import {
  shenshaCalcCoverageAgainstAtlas,
  shenshaForBranch,
  listImplementedShenshaCalcNames,
} from './shensha.ts';

describe('shensha 80+ calc coverage', () => {
  it('ATLAS 可计算覆盖率 ≥ 90%（排除十神/关系壳）', () => {
    const cov = shenshaCalcCoverageAgainstAtlas();
    expect(cov.missing, `missing: ${cov.missing.join(', ')}`).toEqual([]);
    expect(cov.ratio).toBeGreaterThanOrEqual(0.9);
    expect(cov.implemented + cov.shellOnly.length).toBe(cov.total);
  });

  it('implemented list covers ≥ 80 names', () => {
    expect(listImplementedShenshaCalcNames().length).toBeGreaterThanOrEqual(80);
    expect(SHENSHA_ATLAS.length).toBeGreaterThanOrEqual(80);
  });

  it('扩展规则样例：学堂/天医/丧门/空亡相关可命中', () => {
    expect(
      shenshaForBranch({
        branch: '亥',
        stem: '甲',
        dayStem: '甲',
        yearBranch: '子',
        dayBranch: '子',
        monthBranch: '寅',
      }),
    ).toContain('学堂');

    expect(
      shenshaForBranch({
        branch: '丑',
        stem: '甲',
        dayStem: '甲',
        yearBranch: '子',
        dayBranch: '子',
        monthBranch: '寅',
      }),
    ).toContain('天医');

    expect(
      shenshaForBranch({
        branch: '申',
        stem: '甲',
        dayStem: '甲',
        yearBranch: '午',
        dayBranch: '子',
        monthBranch: '寅',
      }),
    ).toContain('丧门');

    expect(
      shenshaForBranch({
        branch: '戌',
        stem: '庚',
        dayStem: '庚',
        yearBranch: '子',
        dayBranch: '戌',
        monthBranch: '寅',
        dayGz: '庚戌',
      }),
    ).toContain('魁罡');
  });

  it('复合 alias：咸池桃花 / 动态 随基础星出现', () => {
    const list = shenshaForBranch({
      branch: '酉',
      dayStem: '甲',
      yearBranch: '子',
      dayBranch: '卯',
      monthBranch: '寅',
    });
    expect(list).toEqual(expect.arrayContaining(['桃花', '咸池', '咸池桃花']));
  });
});
