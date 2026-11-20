import { describe, expect, it } from 'vitest';
import {
  COMPARE_MOUNT_TERMS_V1,
  bilibiliPlaybackUrl,
  hmsToSeconds,
  mountsForLesson,
  renderCompareAttributionHtml,
  renderCompareBlockForTerm,
} from './compare-learn.ts';
import { COMPARE_CITES_V1, findCompareCite } from './compare-learn-cites.ts';

describe('compare-learn mount batch v1', () => {
  it('首批覆盖三节课关键宫与时间层', () => {
    const labels = COMPARE_MOUNT_TERMS_V1.map((t) => t.label);
    expect(labels).toEqual(
      expect.arrayContaining(['夫妻宫', '官禄宫', '命宫', '大限', '流年', '三方四正']),
    );
    expect(mountsForLesson('spouse').some((t) => t.label === '夫妻宫')).toBe(true);
    expect(mountsForLesson('dual').some((t) => t.label === '官禄宫')).toBe(true);
    expect(mountsForLesson('year').some((t) => t.label === '流年')).toBe(true);
  });

  it('署名栏含许可与语料链', () => {
    const html = renderCompareAttributionHtml({
      termLabel: '夫妻宫',
      cite: {
        quote: '一定要看福德宫。',
        bvid: 'BV1KJsLekEfA',
        part: 3,
        tHms: '00:38:11',
      },
    });
    expect(html).toContain('CC BY-NC-SA 4.0');
    expect(html).toContain('nihai-tianji-corpus');
    expect(html).toContain('对照学习');
    expect(html).toContain('回放原讲这一秒');
    expect(html).toContain('creativecommons.org/licenses/by-nc-sa');
  });

  it('B 站回放秒数换算', () => {
    expect(hmsToSeconds('00:38:11')).toBe(38 * 60 + 11);
    expect(bilibiliPlaybackUrl({ bvid: 'BV1KJsLekEfA', part: 3, tHms: '00:38:11' })).toBe(
      'https://www.bilibili.com/video/BV1KJsLekEfA?p=3&t=2291',
    );
  });

  it('首批词条均有短引文；未挂载为空', () => {
    expect(COMPARE_CITES_V1).toHaveLength(COMPARE_MOUNT_TERMS_V1.length);
    for (const t of COMPARE_MOUNT_TERMS_V1) {
      const cite = findCompareCite(t.label);
      expect(cite?.quote).toBeTruthy();
      const html = renderCompareBlockForTerm(t.label);
      expect(html).toContain('对照学习');
      expect(html).toContain(`「${cite!.quote}`);
      expect(html).toContain('CC BY-NC-SA 4.0');
      expect(html).toContain('回放原讲这一秒');
    }
    expect(renderCompareBlockForTerm('不存在的词')).toBe('');
    expect(findCompareCite('夫妻')?.keys).toContain('夫妻宫');
  });
});
