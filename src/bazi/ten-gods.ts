import type { BaziChart } from './cast.ts';

export type TenGodCategory = 'bi_jie' | 'shi_shang' | 'cai' | 'guan_sha' | 'yin';

const CATEGORY_MAP: Array<{ cat: TenGodCategory; labels: string[] }> = [
  { cat: 'guan_sha', labels: ['正官', '七杀'] },
  { cat: 'cai', labels: ['正财', '偏财'] },
  { cat: 'yin', labels: ['正印', '偏印'] },
  { cat: 'shi_shang', labels: ['食神', '伤官'] },
  { cat: 'bi_jie', labels: ['比肩', '劫财'] },
];

export function categorizeTenGod(label: string): TenGodCategory | null {
  const t = label.trim();
  if (!t || t === '日主' || t === '—') return null;
  for (const row of CATEGORY_MAP) {
    if (row.labels.includes(t)) return row.cat;
  }
  return null;
}

/** 年/月/时干神 + 日柱 hideGods（非空） */
export function collectTenGodLabels(chart: BaziChart): string[] {
  const out: string[] = [];
  for (const p of chart.pillars) {
    if (p.empty || p.key === 'liunian') continue;
    if (p.key !== 'day') {
      const g = p.stemGod.trim();
      if (g && g !== '日主' && g !== '—') out.push(g);
    } else {
      for (const hg of p.hideGods) {
        const g = hg.trim();
        if (g && g !== '日主' && g !== '—') out.push(g);
      }
    }
  }
  return out;
}

export function countCategories(
  labels: string[],
): Record<TenGodCategory, number> {
  const c: Record<TenGodCategory, number> = {
    bi_jie: 0,
    shi_shang: 0,
    cai: 0,
    guan_sha: 0,
    yin: 0,
  };
  for (const label of labels) {
    const cat = categorizeTenGod(label);
    if (cat) c[cat] += 1;
  }
  return c;
}
