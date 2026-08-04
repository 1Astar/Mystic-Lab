import { describe, expect, it } from 'vitest';
import { categorizeTenGod, countCategories } from './ten-gods.ts';

describe('categorizeTenGod', () => {
  it('maps common labels', () => {
    expect(categorizeTenGod('正官')).toBe('guan_sha');
    expect(categorizeTenGod('七杀')).toBe('guan_sha');
    expect(categorizeTenGod('伤官')).toBe('shi_shang');
    expect(categorizeTenGod('正财')).toBe('cai');
    expect(categorizeTenGod('偏印')).toBe('yin');
    expect(categorizeTenGod('比肩')).toBe('bi_jie');
    expect(categorizeTenGod('日主')).toBe(null);
  });

  it('counts bag', () => {
    const c = countCategories(['正官', '伤官', '正财', '正官']);
    expect(c.guan_sha).toBe(2);
    expect(c.shi_shang).toBe(1);
    expect(c.cai).toBe(1);
  });
});
