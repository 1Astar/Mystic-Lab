import { describe, expect, it } from 'vitest';
import { labLearnStripHtml } from './lab-learn-strip.ts';

describe('lab-learn-strip', () => {
  it('renders tip deepen and practice', () => {
    const html = labLearnStripHtml({
      tip: '先认日主气质，再谈十神。',
      deepen: { href: '/bazi/tujian', label: '进图鉴补深度 ›' },
      practice: { href: '/bazi/guess', label: '练一题 ›' },
    });
    expect(html).toContain('带学');
    expect(html).toContain('先认日主气质');
    expect(html).toContain('/bazi/tujian');
    expect(html).toContain('/bazi/guess');
  });

  it('empty tip yields empty html', () => {
    expect(
      labLearnStripHtml({
        tip: '  ',
        deepen: { href: '/x', label: 'x' },
      }),
    ).toBe('');
  });
});
