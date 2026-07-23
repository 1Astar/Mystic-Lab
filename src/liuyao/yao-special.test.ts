import { describe, expect, it } from 'vitest';
import {
  isAnDong,
  isBranchLiuChong,
  isEffectivelyMoving,
  isHuiTouKe,
  isYuePo,
  buildYaoSpecialFlags,
  formatYaoSpecialTags,
} from './yao-special.ts';
import type { YaoDress } from './najia.ts';

function row(partial: Partial<YaoDress> & Pick<YaoDress, 'branch'>): YaoDress {
  return {
    index: 0,
    label: '初爻',
    bit: 1,
    changing: false,
    wuxing: '木',
    liuqin: '妻财',
    liushen: '青龙',
    isShi: false,
    isYing: false,
    ...partial,
  } as YaoDress;
}

describe('yao-special', () => {
  it('detects 六冲 / 暗动 / 月破', () => {
    expect(isBranchLiuChong('寅', '申')).toBe(true);
    expect(isBranchLiuChong('寅', '卯')).toBe(false);
    expect(isAnDong(row({ branch: '寅', changing: false }), '申')).toBe(true);
    expect(isAnDong(row({ branch: '寅', changing: true }), '申')).toBe(false);
    expect(isYuePo(row({ branch: '寅' }), '申')).toBe(true);
    expect(isEffectivelyMoving(row({ branch: '寅', changing: false }), '申')).toBe(true);
  });

  it('detects 回头克', () => {
    expect(
      isHuiTouKe(
        row({
          branch: '午',
          wuxing: '火',
          changing: true,
          changedWuxing: '水',
        }),
      ),
    ).toBe(true); // 水克火
    expect(
      isHuiTouKe(
        row({
          branch: '午',
          wuxing: '火',
          changing: true,
          changedWuxing: '土',
        }),
      ),
    ).toBe(false);
  });

  it('formats special tags', () => {
    const flags = buildYaoSpecialFlags(row({ branch: '寅', changing: false }), {
      dayBranch: '申',
      monthBranch: '未',
      dayXunKong: '辰巳',
    });
    expect(flags.anDong).toBe(true);
    expect(formatYaoSpecialTags(flags)).toContain('暗动');
  });
});
