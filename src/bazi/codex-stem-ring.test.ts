import { describe, expect, it } from 'vitest';
import {
  renderStemRelationRingHtml,
  STEM_RING_MODES,
  STEM_RING_ORDER,
  TIAN_GAN_CHONG,
} from './codex-stem-ring.ts';

describe('codex stem relation ring', () => {
  it('renders 五合 ring with ten stems and pair cards', () => {
    const html = renderStemRelationRingHtml({ mode: 'he' });
    expect(html).toContain('data-stem-ring');
    expect(html).toContain('天干 · 五合');
    expect(html).toContain('合土');
    expect(html).toContain('bazi-br-pair-grid');
    expect(html).toContain('bazi-br-help');
    expect(html).toMatch(/天干五合|≠地支六合/);
    for (const st of STEM_RING_ORDER) {
      expect(html).toContain(`data-codex-id="${st}"`);
    }
    for (const m of STEM_RING_MODES) {
      expect(html).toContain(`data-stem-ring-mode="${m.id}"`);
    }
  });

  it('相冲 shows four classic pairs', () => {
    const html = renderStemRelationRingHtml({ mode: 'chong' });
    expect(html).toContain('天干 · 相冲');
    for (const [a, b] of TIAN_GAN_CHONG) {
      expect(html).toContain(`data-codex-id="${a}"`);
      expect(html).toContain(`data-codex-id="${b}"`);
    }
    expect(html).toContain('冲');
  });

  it('相生 / 相克 show group cards', () => {
    expect(renderStemRelationRingHtml({ mode: 'sheng' })).toMatch(/生→/);
    expect(renderStemRelationRingHtml({ mode: 'ke' })).toMatch(/克→/);
  });
});
