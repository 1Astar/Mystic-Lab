import { describe, expect, it } from 'vitest';
import { castBaziChart } from './cast.ts';
import {
  applyBaziChartAura,
  clearBaziChartAura,
  resolveLiunianFlowKey,
} from './page-aura.ts';
import { EMPTY_PROFILE, type LifeProfileInput } from '../life/types.ts';

const profile: LifeProfileInput = {
  ...EMPTY_PROFILE,
  birthYear: '1990',
  birthMonth: '3',
  birthDay: '15',
  birthHour: '10',
};

function mockEl(): HTMLElement {
  return {
    dataset: {} as DOMStringMap,
    style: {
      props: {} as Record<string, string>,
      setProperty(k: string, v: string) {
        this.props[k] = v;
      },
      removeProperty(k: string) {
        delete this.props[k];
      },
      getPropertyValue(k: string) {
        return this.props[k] ?? '';
      },
    },
  } as unknown as HTMLElement;
}

describe('bazi chart aura by harmonize tint', () => {
  it('applies compose keys and clears', () => {
    const chart = castBaziChart(profile, 2026, { includeLiunian: false });
    expect('error' in chart).toBe(false);
    if ('error' in chart) return;
    const el = mockEl();
    const tint = applyBaziChartAura(el, chart);
    expect(tint?.primaryKey).toMatch(/^(mu|huo|tu|jin|shui)$/);
    expect(el.dataset.baziWx).toBe(tint?.primaryKey);
    expect(el.dataset.baziTemperament).toBeTruthy();
    expect(el.dataset.baziWxFlow).toBeUndefined();
    clearBaziChartAura(el);
    expect(el.dataset.baziWx).toBeUndefined();
    expect(el.dataset.baziTemperament).toBeUndefined();
  });

  it('blends liunian stem into flow aura without changing temperament text', () => {
    const a = castBaziChart(profile, 2024, { includeLiunian: true });
    const b = castBaziChart(profile, 2025, { includeLiunian: true });
    expect('error' in a).toBe(false);
    expect('error' in b).toBe(false);
    if ('error' in a || 'error' in b) return;

    expect(resolveLiunianFlowKey(a)).toMatch(/^(mu|huo|tu|jin|shui)$/);
    const el = mockEl();
    applyBaziChartAura(el, a);
    const tempA = el.dataset.baziTemperament;
    const flowA = el.dataset.baziWxFlow;
    const inkFlowA = el.style.getPropertyValue('--bazi-aura-ink-flow');
    expect(flowA).toBeTruthy();
    expect(inkFlowA).toContain('--wx-');

    applyBaziChartAura(el, b);
    expect(el.dataset.baziTemperament).toBe(tempA);
    expect(el.dataset.baziWxFlow).toBeTruthy();
    // 相邻年干常不同；若同干则仍有 flow 变量即可
    expect(el.style.getPropertyValue('--bazi-aura-flow')).toContain('color-mix');
  });
});
