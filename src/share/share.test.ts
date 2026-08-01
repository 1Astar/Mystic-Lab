import { describe, expect, it } from 'vitest';
import { maskQuestion } from './ids.ts';
import { draftFromLiuyao } from './drafts.ts';
import { buildCastFromThrows, facesToThrow, type YaoThrow } from '../liuyao/engine.ts';
import { HEXAGRAMS, linesFromHexagram } from '../liuyao/hexagrams.ts';

describe('share ids', () => {
  it('masks questions', () => {
    expect(maskQuestion('要不要离职')).toMatch(/···/);
    expect(maskQuestion('啊')).toBe('••••');
  });
});

describe('share drafts', () => {
  it('builds liuyao draft without private fields', () => {
    const hex = HEXAGRAMS.find((h) => h.name === '乾')!;
    const lines = linesFromHexagram(hex);
    const throws = lines.map((bit) =>
      bit === 1
        ? facesToThrow(['obverse', 'obverse', 'reverse'])
        : facesToThrow(['obverse', 'reverse', 'reverse']),
    ) as YaoThrow[];
    const cast = buildCastFromThrows(throws, 'coin');
    const draft = draftFromLiuyao({
      cast,
      question: '面试能不能过？',
      aiText: '可选 AI',
    });
    expect(draft.system).toBe('liuyao');
    expect(draft.summary.length).toBeGreaterThan(0);
    expect(draft.sections.length).toBeGreaterThan(0);
    expect(JSON.stringify(draft)).not.toMatch(/经历|顾虑/);
    expect(draft.visual.kind).toBe('liuyao');
    if (draft.visual.kind === 'liuyao') {
      expect(draft.visual.primaryLines).toHaveLength(6);
      expect(draft.visual.primaryName).toMatch(/乾/);
      expect(draft.headline).not.toBe(draft.visual.primaryName);
    }
  });
});

describe('share cover visual', () => {
  it('renders hex svg for liuyao visual', async () => {
    const { buildShareCoverInnerHtml } = await import('./cover.ts');
    const html = buildShareCoverInnerHtml({
      system: 'liuyao',
      headline: '先稳住再谈',
      summary: '先稳住再谈',
      questionDisplay: '面试···',
      brandSlogan: '答案不在牌里，在你心里。',
      createdAt: new Date().toISOString(),
      visual: {
        kind: 'liuyao',
        primaryName: '风水涣',
        changedName: '巽为风',
        primaryLines: [0, 1, 0, 0, 1, 1],
        changedLines: [0, 1, 1, 0, 1, 1],
        changingIndexes: [2],
        shiLine: 5,
        yingLine: 2,
      },
    });
    expect(html).toContain('ms-cover-hex-svg-el');
    expect(html).toContain('stroke=');
    expect(html.match(/ms-cover-hex-col/g)?.length).toBe(2);
    expect(html).toContain('本 · 风水涣');
    expect(html).toContain('变 · 巽为风');
  });

  it('embeds atmosphere art when art src present', async () => {
    const { buildShareCoverInnerHtml } = await import('./cover.ts');
    const html = buildShareCoverInnerHtml({
      system: 'liuyao',
      headline: '先稳住',
      summary: '先稳住',
      questionDisplay: '',
      createdAt: new Date().toISOString(),
      visual: {
        kind: 'liuyao',
        primaryName: '风水涣',
        primaryLines: [0, 1, 0, 0, 1, 1],
        primaryArtSrc: 'https://example.com/huan.webp',
      },
    });
    expect(html).toContain('ms-cover-hex-art');
    expect(html).toContain('has-art');
    expect(html).toContain('https://example.com/huan.webp');
  });

  it('drops cross-origin art when CORS fetch fails (avoid canvas taint)', async () => {
    const { resolveCorsSafeImageSrc } = await import('./cover.ts');
    expect(await resolveCorsSafeImageSrc('data:image/png;base64,abc')).toBe(
      'data:image/png;base64,abc',
    );
    expect(await resolveCorsSafeImageSrc('https://example.invalid/no-cors.webp')).toBeUndefined();
    expect(await resolveCorsSafeImageSrc('')).toBeUndefined();
  });

  it('renders tarot card images when cardId present', async () => {
    const { buildShareCoverInnerHtml } = await import('./cover.ts');
    const html = buildShareCoverInnerHtml({
      system: 'tarot',
      headline: '星辰与力量',
      summary: '先看清再动',
      questionDisplay: '',
      brandSlogan: '答案不在牌里，在你心里。',
      createdAt: new Date().toISOString(),
      visual: {
        kind: 'tarot',
        cards: [
          {
            name: '星星（正位）',
            position: '现状',
            cardId: 'major-17',
            reversed: false,
          },
        ],
      },
    });
    expect(html).toMatch(/\/tarot\/major-17\.jpg/);
    expect(html).toContain('ms-cover-card-img');
    expect(html).toContain('is-conclusion');
    expect(html).not.toContain('ms-cover-card-name');
  });

  it('embeds qr when qrDataUrl provided', async () => {
    const { buildShareCoverInnerHtml } = await import('./cover.ts');
    const html = buildShareCoverInnerHtml({
      system: 'liuyao',
      headline: '先稳住',
      summary: '先稳住',
      questionDisplay: '',
      createdAt: new Date().toISOString(),
      visual: {
        kind: 'liuyao',
        primaryName: '乾',
        primaryLines: [1, 1, 1, 1, 1, 1],
      },
      qrDataUrl: 'data:image/png;base64,abc',
    });
    expect(html).toContain('ms-cover-qr');
    expect(html).toContain('扫码看完整解读');
  });

  it('back face includes sections', async () => {
    const { buildShareCoverInnerHtml } = await import('./cover.ts');
    const html = buildShareCoverInnerHtml(
      {
        system: 'liuyao',
        headline: '先稳住',
        summary: '摘要',
        questionDisplay: '问什么',
        createdAt: new Date().toISOString(),
        visual: {
          kind: 'liuyao',
          primaryName: '乾',
          primaryLines: [1, 1, 1, 1, 1, 1],
        },
        sections: [{ heading: '现状', body: '先看清边界' }],
      },
      'back',
    );
    expect(html).toContain('完整解读');
    expect(html).toContain('现状');
    expect(html).toContain('先看清边界');
  });
});
