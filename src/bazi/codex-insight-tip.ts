/**
 * 图鉴详情底部：现实感悟硬绑定优先，其次手札，再次气质提示
 */
import type { BaziChart } from './cast.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { loadBaziJournal } from './journal.ts';
import { STEM_WUXING, BRANCH_WUXING, type WuXing } from './elements.ts';
import { buildRealityInsight, type RealityInsightLink } from './sense-insight.ts';

export type CodexInsightTip = {
  text: string;
  source: 'reality' | 'journal' | 'trait';
};

function entryWx(id: string): WuXing | '' {
  const e = getBaziEncyclopedia(id);
  if (!e) return '';
  if (e.kind === 'wuxing') return e.id as WuXing;
  if (e.kind === 'stem') return STEM_WUXING[e.id] || '';
  if (e.kind === 'branch') return BRANCH_WUXING[e.id] || '';
  const tag = e.tags.wuxing;
  if (tag === '木' || tag === '火' || tag === '土' || tag === '金' || tag === '水') return tag;
  return '';
}

const TRAIT_HINT: Partial<Record<WuXing, string>> = {
  木: '往哪长、顺势攀缘、要有方向',
  火: '热度、被看见、也要留退路',
  土: '托底、承载、别扛尽所有重量',
  金: '标准、边界、把话说清楚',
  水: '流动、思绪快、需要落地感',
};

const FACTOR_LABEL: Record<RealityInsightLink['factor'], string> = {
  dayMaster: '日主',
  dayWx: '日主五行',
  dayBranch: '日支',
  monthBranch: '月令',
  monthStem: '月干',
  tengod: '十神结构',
  strength: '日主旺衰',
};

function clip(s: string, n: number): string {
  const t = s.trim();
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1)}…`;
}

/**
 * 优先：现实感悟硬绑定 → 手札提及 → 五行气质轻提示
 */
export function findCodexInsightTip(
  id: string,
  chart?: BaziChart | null,
): CodexInsightTip | null {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return null;
  const title = entry.title;
  const wx = entryWx(id);

  if (chart) {
    const insight = buildRealityInsight(chart);
    const hit = insight.links.find((l) => l.codexId === id);
    if (hit) {
      const snip = clip(hit.snippet, 42);
      const via = FACTOR_LABEL[hit.factor];
      return {
        source: 'reality',
        text: `你在【现实感悟】里提到过「${snip}」——这正对应命局里的【${title}】（经由${via}）。`,
      };
    }
  }

  for (const j of loadBaziJournal()) {
    const blob = `${j.body}\n${j.reflection}`;
    if (!blob.trim()) continue;
    if (blob.includes(title)) {
      const snip = clip(j.reflection.trim() || j.body.trim(), 36);
      return {
        source: 'journal',
        text: `你在手札里写过与「${title}」相关的体感${snip ? `：「${snip}」` : ''}——可对照本词条气质回看。`,
      };
    }
    if (entry.kind === 'branch' && title.includes('卯') && /藤|花|攀|柔|柳/.test(blob)) {
      const snip = clip(j.body.trim() || j.reflection.trim(), 28);
      return {
        source: 'journal',
        text: `你在手札里提到过「${snip}」，这与命局里【${title}】偏「花木满园、顺势而生」的气质可互参。`,
      };
    }
    if (wx === '木' && /藤|攀缘|往哪长|方向感/.test(blob)) {
      return {
        source: 'journal',
        text: `你写过偏「往哪长 / 攀缘」的体感，可与【${title}】的木气气质轻轻对照。`,
      };
    }
  }

  if (wx && TRAIT_HINT[wx]) {
    return {
      source: 'trait',
      text: `【${title}】偏${wx}气：${TRAIT_HINT[wx]}。有共鸣时可标「对我有用」，方便以后看运势时调取。`,
    };
  }
  return null;
}
