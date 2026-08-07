import { describe, expect, it } from 'vitest';
import {
  renderBranchRelationRingHtml,
  BRANCH_RING_MODES,
} from './codex-branch-ring.ts';

describe('codex branch relation ring', () => {
  it('renders 六冲 ring with twelve branches and pair cards', () => {
    const html = renderBranchRelationRingHtml({ mode: 'chong' });
    expect(html).toContain('data-branch-ring');
    expect(html).toContain('地支 · 六冲');
    expect(html).toContain('子午');
    expect(html).toContain('bazi-br-pair-grid');
    expect(html).toContain('直径两端');
    for (const br of ['子', '午', '丑', '未', '寅', '申']) {
      expect(html).toContain(`data-codex-id="${br}"`);
    }
    for (const m of BRANCH_RING_MODES) {
      expect(html).toContain(`data-branch-ring-mode="${m.id}"`);
    }
  });

  it('六合 shows 合化 cards', () => {
    const html = renderBranchRelationRingHtml({ mode: 'he' });
    expect(html).toContain('合土');
    expect(html).toContain('牵绊成局');
  });

  it('hit circle sits above label for clicks', () => {
    const html = renderBranchRelationRingHtml({ mode: 'chong' });
    const hit = html.indexOf('bazi-br-hit');
    const label = html.indexOf('bazi-br-label');
    expect(hit).toBeGreaterThan(label);
  });
});
