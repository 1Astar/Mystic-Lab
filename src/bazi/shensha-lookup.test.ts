import { describe, expect, it } from 'vitest';
import { SHENSHA_MORE } from './codex-shensha-tiers.ts';
import {
  fuXingLookupLines,
  guChenGuaSuLookupLines,
  hongLuanLookupLines,
  jinYuLookupLines,
  luLookupLines,
  poSuiLookupLines,
  sanHeStarLookupLines,
  shenshaForBranch,
  tianChuLookupLines,
  tianDeLookupLines,
  tianXiLookupLines,
  wenChangLookupLines,
  yangRenLookupLines,
  yueDeLookupLines,
} from './shensha.ts';

describe('shensha lookup lines for codex', () => {
  it('文昌/禄/羊刃按日干合并同支', () => {
    expect(wenChangLookupLines().some((l) => l.includes('丙') && l.includes('戊') && l.includes('申'))).toBe(
      true,
    );
    expect(luLookupLines().some((l) => l.includes('甲') && l.includes('寅'))).toBe(true);
    expect(yangRenLookupLines().some((l) => l.includes('甲') && l.includes('卯'))).toBe(true);
  });

  it('三合局起驿马桃花华盖将星劫煞灾煞亡神', () => {
    expect(sanHeStarLookupLines('ma')).toEqual(
      expect.arrayContaining(['申子辰局 → 寅', '寅午戌局 → 申']),
    );
    expect(sanHeStarLookupLines('tao')).toContain('亥卯未局 → 子');
    expect(sanHeStarLookupLines('hua')).toContain('巳酉丑局 → 丑');
    expect(sanHeStarLookupLines('jiang')).toContain('申子辰局 → 子');
    expect(sanHeStarLookupLines('jie')).toContain('申子辰局 → 巳');
    expect(sanHeStarLookupLines('zai')).toContain('申子辰局 → 午');
    expect(sanHeStarLookupLines('wang')).toContain('申子辰局 → 亥');
  });

  it('红鸾天喜孤辰按年支', () => {
    expect(hongLuanLookupLines()).toContain('年支子 → 卯');
    expect(tianXiLookupLines()).toContain('年支子 → 酉');
    expect(guChenGuaSuLookupLines()[0]).toMatch(/寅、卯、辰年/);
  });

  it('MORE 查法表可导出', () => {
    expect(tianDeLookupLines()[0]).toMatch(/寅月/);
    expect(yueDeLookupLines()).toContain('寅午戌月 → 天干丙');
    expect(jinYuLookupLines().some((l) => l.includes('甲') && l.includes('辰'))).toBe(true);
    expect(tianChuLookupLines().some((l) => l.includes('甲') && l.includes('巳'))).toBe(true);
    expect(fuXingLookupLines().some((l) => l.includes('甲') && l.includes('寅'))).toBe(true);
    expect(poSuiLookupLines()[0]).toMatch(/寅申巳亥/);
  });

  it('SHENSHA_MORE 每条都能在样例盘上命中至少一次', () => {
    const samples: Record<string, Parameters<typeof shenshaForBranch>[0]> = {
      天德: {
        branch: '子',
        stem: '丁',
        dayStem: '甲',
        yearBranch: '子',
        dayBranch: '子',
        monthBranch: '寅',
      },
      月德: {
        branch: '午',
        stem: '丙',
        dayStem: '甲',
        yearBranch: '子',
        dayBranch: '子',
        monthBranch: '寅',
      },
      福星: { branch: '寅', dayStem: '甲', yearBranch: '酉', dayBranch: '子' },
      咸池: { branch: '酉', dayStem: '甲', yearBranch: '子', dayBranch: '卯' },
      金舆: { branch: '辰', dayStem: '甲', yearBranch: '酉', dayBranch: '子' },
      天厨: { branch: '巳', dayStem: '甲', yearBranch: '酉', dayBranch: '子' },
      灾煞: { branch: '午', dayStem: '甲', yearBranch: '子', dayBranch: '卯' },
      亡神: { branch: '亥', dayStem: '甲', yearBranch: '子', dayBranch: '卯' },
      白虎: { branch: '寅', dayStem: '甲', yearBranch: '午', dayBranch: '子' },
      吊客: { branch: '辰', dayStem: '甲', yearBranch: '午', dayBranch: '子' },
      天哭: { branch: '子', dayStem: '甲', yearBranch: '午', dayBranch: '卯' },
      天虚: { branch: '丑', dayStem: '甲', yearBranch: '午', dayBranch: '卯' },
      破碎: { branch: '酉', dayStem: '甲', yearBranch: '寅', dayBranch: '子' },
    };
    for (const entry of SHENSHA_MORE) {
      const opts = samples[entry.name];
      expect(opts, entry.name).toBeTruthy();
      expect(shenshaForBranch(opts!), entry.name).toContain(entry.name);
    }
  });
});
