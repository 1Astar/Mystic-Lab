import { describe, expect, it } from 'vitest';
import {
  CODEX_SKELETON_ORDER,
  codexSkeletonChromeHtml,
  codexSkeletonPracticeCtaHtml,
  codexSkeletonSlotHtml,
} from '../ui/lab-codex-skeleton.ts';

describe('lab-codex-skeleton', () => {
  it('chrome lists four steps in order', () => {
    const html = codexSkeletonChromeHtml({ active: 'what' });
    expect(html).toContain('lab-codex-skel');
    for (const id of CODEX_SKELETON_ORDER) {
      expect(html).toContain(`data-skel-step="${id}"`);
    }
    expect(html).toContain('是什么');
    expect(html).toContain('在你身上');
    expect(html).toContain('相关可跳');
    expect(html).toContain('练一题');
  });

  it('allows custom yours / practice labels', () => {
    const html = codexSkeletonChromeHtml({
      yoursLabel: '这次怎么显',
      practiceLabel: '记一句',
    });
    expect(html).toContain('这次怎么显');
    expect(html).toContain('记一句');
  });

  it('slot wraps body and can hide empty', () => {
    expect(codexSkeletonSlotHtml({ slot: 'what', bodyHtml: '<p>x</p>' })).toContain(
      'data-skel-slot="what"',
    );
    expect(
      codexSkeletonSlotHtml({ slot: 'related', bodyHtml: '  ', hideIfEmpty: true }),
    ).toBe('');
  });

  it('practice cta joins links', () => {
    const html = codexSkeletonPracticeCtaHtml([
      { href: '/ziwei/guess', label: '猜星曜 ›' },
    ]);
    expect(html).toContain('/ziwei/guess');
    expect(html).toContain('猜星曜');
  });
});
