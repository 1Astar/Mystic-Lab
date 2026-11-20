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
    const impact =
      link.dayMasterImpact && link.dayMasterImpact !== '—'
        ? link.dayMasterImpact
        : link.hits.map((h) => `${h.title}：${h.how}`).join('\n');
    // 一律：【你的原局】单独一行，下面落点/提醒各占一行
    chunks.push(`【你的原局】\n${impact}`);
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

  return chunks.join('\n');
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
  // 列表一行：压成单行，避免卡片里把换行挤成乱版
  const flat = full.replace(/^【你的原局】\n?/, '原局 · ').replace(/\n+/g, ' · ');
  if (flat.length <= maxLen) return flat;
  return `${flat.slice(0, maxLen - 1)}…`;
}

function escapeBriefHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 落柱小标题：月柱见正财： / 年支见「寅」： / 相对日主… */
const PRESENCE_LABEL_RE =
  /^(?:【.+】|[年月日时]柱见|[年月日时]支见|地支|日支|相对日主|此即日主|此为|运程|「[^」]+」)/;

/**
 * 「在你身上」正文 → HTML：落柱小标题加粗金色，正文分行。
 * 普通无冒号段落仍按换行输出。
 */
export function formatCodexBriefHtml(text: string): string {
  const raw = text.trim();
  if (!raw) return '';
  const rows = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean);
  return rows
    .map((line) => {
      if (/^【[^】]+】$/.test(line)) {
        return `<span class="bazi-enc-presence-lead">${escapeBriefHtml(line)}</span>`;
      }
      const idx = line.indexOf('：');
      if (idx > 0 && idx <= 18) {
        const k = line.slice(0, idx);
        const v = line.slice(idx + 1).trim();
        if (PRESENCE_LABEL_RE.test(k) || /见/.test(k)) {
          return `<span class="bazi-enc-presence-row"><span class="bazi-enc-presence-k">${escapeBriefHtml(k)}：</span><span class="bazi-enc-presence-v">${escapeBriefHtml(v)}</span></span>`;
        }
      }
      return `<span class="bazi-enc-presence-note">${escapeBriefHtml(line)}</span>`;
    })
    .join('');
}
