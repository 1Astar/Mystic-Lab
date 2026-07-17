import { describe, expect, it } from 'vitest';
import { buildGodHuangliBridge } from './god-huangli-bridge.ts';
import { getSixGodById } from './six-gods.ts';
import type { HuangliBrief } from './huangli.ts';

function brief(partial: Partial<HuangliBrief> = {}): HuangliBrief {
  return {
    solarLabel: '2026-07-15',
    lunarLabel: '五月廿一',
    weekdayLabel: '周三',
    hourLabel: '未时',
    yi: ['出行'],
    ji: ['争讼'],
    yiPreview: '宜出行',
    jiPreview: '忌争讼',
    wuxingShort: '火',
    wuxingNayin: '',
    chongsha: '',
    chongShort: '',
    caiShen: '',
    xiShen: '',
    mood: '',
    ...partial,
  };
}

describe('buildGodHuangliBridge', () => {
  it('binds 大安 to 宜', () => {
    const text = buildGodHuangliBridge(getSixGodById('da-an'), brief());
    expect(text).toContain('大安');
    expect(text).toContain('宜出行');
  });

  it('binds 赤口 to 忌', () => {
    const text = buildGodHuangliBridge(getSixGodById('chi-kou'), brief());
    expect(text).toContain('赤口');
    expect(text).toContain('忌争讼');
  });

  it('falls back when yi/ji empty', () => {
    const text = buildGodHuangliBridge(
      getSixGodById('da-an'),
      brief({ yi: ['—'], ji: ['—'] }),
    );
    expect(text).toContain('大安');
    expect(text.length).toBeGreaterThan(8);
  });
});
