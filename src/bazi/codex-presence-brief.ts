/**
 * 图鉴卡片/详情：原局落点 + 流年触发短述（软文案，不恐吓）
 */
import type { BaziChart } from './cast.ts';
import { getBaziEncyclopedia } from './codex-encyclopedia.ts';
import { buildChartLinkReport } from './codex-chart-link.ts';
import { LIU_CHONG } from './relations.ts';
import type { LuckCycles } from './luck-cycles.ts';

function liunianBranch(chart: BaziChart, luck: LuckCycles | null): string {
  const fromLuck = luck?.liunian.find((l) => l.current) || luck?.liunian.find((l) => l.selected);
  if (fromLuck?.branch) return fromLuck.branch;
  return chart.pillars.find((p) => p.key === 'liunian' && !p.empty)?.branch || '';
}

function branchClashNote(
  branchId: string,
  chart: BaziChart,
  luck: LuckCycles | null,
): string {
  const ln = liunianBranch(chart, luck);
  if (!ln) return '';
  const hit = LIU_CHONG.find(
    ([a, b]) => (a === branchId && b === ln) || (b === branchId && a === ln),
  );
  if (!hit) return '';
  const [x, y] = hit;
  return `今年流年遇【${ln}】，与原局【${branchId}】构成「${x}${y}相冲」——宜留意行程与节奏变化，勿单断吉凶`;
}

/**
 * 详情用完整短述；列表可截断。
 * 例：【你的原局】月令见寅：地支寅气场偏生扶日主；今年流年遇【申】…
 */
export function chartPresenceBrief(
  id: string,
  chart: BaziChart | null,
  luck: LuckCycles | null = null,
): string {
  if (!chart) return '';
  const entry = getBaziEncyclopedia(id);
  if (!entry) return '';

  const link = buildChartLinkReport(id, chart, luck);
  const chunks: string[] = [];

  if (link.present) {
    const where = link.hits.map((h) => h.title.replace(/柱/, '')).join('·');
    const impact =
      link.dayMasterImpact && link.dayMasterImpact !== '—'
        ? link.dayMasterImpact
        : link.hits[0]?.how || '';
    chunks.push(`【你的原局】${where}见此：${impact}`);
  }

  if (entry.kind === 'branch') {
    const clash = branchClashNote(entry.id, chart, luck);
    if (clash) chunks.push(clash);
  } else if (
    /触发/.test(link.luckTrigger) &&
    !/未直接触发/.test(link.luckTrigger)
  ) {
    const short = link.luckTrigger.replace(/^当前大运[^。]*。\s*/, '').trim();
    if (short) chunks.push(`运程：${short}`);
  }

  return chunks.join('；');
}

/** 列表一行：优先短述截断，否则退回 chartPresenceLabel 由调用方处理 */
export function chartPresenceBriefLine(
  id: string,
  chart: BaziChart | null,
  luck: LuckCycles | null = null,
  maxLen = 42,
): string {
  const full = chartPresenceBrief(id, chart, luck);
  if (!full) return '';
  if (full.length <= maxLen) return full;
  return `${full.slice(0, maxLen - 1)}…`;
}
