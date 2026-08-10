import { describe, expect, it } from 'vitest';
import {
  applyBaziPageAura,
  baziWxAuraKey,
  nayinWuxing,
  nayinWxClass,
  wuxingClass,
} from './elements.ts';

describe('bazi wuxing tint helpers', () => {
  it('reads nayin element from last char', () => {
    expect(nayinWuxing('大溪水')).toBe('水');
    expect(nayinWuxing('杨柳木')).toBe('木');
    expect(nayinWuxing('沙中金')).toBe('金');
    expect(nayinWuxing('—')).toBe('');
    expect(nayinWxClass('大溪水')).toBe('wx-shui');
  });

  it('maps day-master aura keys', () => {
    expect(baziWxAuraKey('木')).toBe('mu');
    expect(baziWxAuraKey('火')).toBe('huo');
    expect(wuxingClass('土')).toBe('wx-tu');
  });

  it('applies and clears page aura dataset', () => {
    const el = { dataset: {} as DOMStringMap } as HTMLElement;
    applyBaziPageAura(el, '水');
    expect(el.dataset.baziWx).toBe('shui');
    applyBaziPageAura(el, '');
    expect(el.dataset.baziWx).toBeUndefined();
  });
});
