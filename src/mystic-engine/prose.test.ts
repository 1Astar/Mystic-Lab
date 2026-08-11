import { describe, expect, it } from 'vitest';
import { formatProseHtml, splitProse } from './prose.ts';

describe('prose', () => {
  it('splits long paragraphs into short lines', () => {
    const lines = splitProse(
      '本卦「涣」偏散开、流动。变卦「巽」偏顺从、反复。场上可能乱、职责不清。结果往往要反复拉扯才落地。',
    );
    expect(lines.length).toBeGreaterThanOrEqual(3);
    expect(lines.every((l) => l.length <= 50)).toBe(true);
  });

  it('renders multiple p tags', () => {
    const html = formatProseHtml('第一句。\n第二句。');
    expect(html).toMatch(/ly-pack-p/);
    expect(html.match(/<p /g)?.length).toBe(2);
  });
});
