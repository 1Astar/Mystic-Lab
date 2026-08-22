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
    expect(html).toMatch(/两支一对|六合/);
    expect(html).toContain('bazi-br-help');
    expect(html).toMatch(/六合和三合|三合/);
  });

  it('三合 cards expose each branch as clickable node', () => {
    const html = renderBranchRelationRingHtml({ mode: 'sanhe' });
    expect(html).toContain('三合');
    expect(html).toContain('bazi-br-help');
    for (const br of ['申', '子', '辰', '寅', '午', '戌']) {
      expect(html).toContain(`data-codex-id="${br}"`);
    }
    expect(html).toContain('合水');
    expect(html).toContain('合火');
  });

  it('半合 / 三会 modes render ring + pair cards', () => {
    const banhe = renderBranchRelationRingHtml({ mode: 'banhe' });
    expect(banhe).toContain('地支 · 半合');
    expect(banhe).toContain('data-branch-ring-mode="banhe"');
    expect(banhe).toContain('半水');
    expect(banhe).toMatch(/半合/);

    const sanhui = renderBranchRelationRingHtml({ mode: 'sanhui' });
    expect(sanhui).toContain('地支 · 三会');
    expect(sanhui).toContain('data-branch-ring-mode="sanhui"');
    expect(sanhui).toContain('会木');
    for (const br of ['寅', '卯', '辰', '亥', '子', '丑']) {
      expect(sanhui).toContain(`data-codex-id="${br}"`);
    }
  });

  it('hit circle sits above label for clicks', () => {
    const html = renderBranchRelationRingHtml({ mode: 'chong' });
    const hit = html.indexOf('bazi-br-hit');
    const label = html.indexOf('bazi-br-label');
    expect(hit).toBeGreaterThan(label);
  });
});
