/**
 * 盘面词 → 图鉴实体 ID + 三层深度摘要（唯一知识源）
 */
import type { BaziChart } from './cast.ts';
import type { LuckCycles } from './luck-cycles.ts';
import {
  getBaziEncyclopedia,
  BAZI_ENCYCLOPEDIA,
} from './codex-encyclopedia.ts';
import { buildCodexDossier } from './codex-dossier.ts';
import { buildChartLinkReport } from './codex-chart-link.ts';
import { BRANCH_LORE, STEM_LORE, WUXING_ORDER } from './codex-lore.ts';
import {
  nayinId,
  jiaziId,
  NAYIN_ATLAS,
  listSixtyJiazi,
} from './codex-atlas-catalog.ts';
import { shenshaCardId, tengodCardId, ALL_STAR_CARDS } from './codex-tags.ts';
import {
  CHANG_SHENG_GLOSS,
  changShengChartBrief,
  isChangShengStage,
} from './pillar-meta.ts';

function norm(s: string): string {
  return s.replace(/\s+/g, '').replace(/[？?！!。．\.，,、]/g, '');
}

/** 把排盘上的点击词解析成图鉴实体 id */
export function resolveCodexEntityId(raw: string): string | null {
  const q = norm(raw);
  if (!q || q === '—' || q === '-') return null;

  if (BAZI_ENCYCLOPEDIA[q]) return q;

  if (STEM_LORE.some((s) => s.id === q)) return q;
  if (BRANCH_LORE.some((b) => b.id === q)) return q;
  if ((WUXING_ORDER as readonly string[]).includes(q)) return q;

  for (const s of STEM_LORE) {
    if (q === norm(s.title) || q === s.id) return s.id;
  }
  for (const b of BRANCH_LORE) {
    if (q === norm(b.title) || q === b.id) return b.id;
  }

  if (/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/.test(q)) {
    return jiaziId(q);
  }

  for (const n of NAYIN_ATLAS) {
    if (q === norm(n.name) || q.includes(norm(n.name))) return nayinId(n.name);
  }

  for (const card of ALL_STAR_CARDS) {
    const name = norm(card.name);
    if (q === name || q.includes(name) || name.includes(q) || q === norm(card.modern)) {
      return card.id;
    }
  }

  for (const e of Object.values(BAZI_ENCYCLOPEDIA)) {
    if (norm(e.title) === q || norm(e.id) === q) return e.id;
    if (e.kind === 'shensha' && q.includes(norm(e.title))) return e.id;
    if (e.kind === 'tengod' && q.includes(norm(e.title))) return e.id;
  }

  const ss = shenshaCardId(q);
  if (getBaziEncyclopedia(ss)) return ss;
  const tg = tengodCardId(q);
  if (getBaziEncyclopedia(tg)) return tg;

  if (listSixtyJiazi().includes(q)) return jiaziId(q);

  return null;
}

export type CodexDepthSummary = {
  entityId: string;
  title: string;
  chartBrief: string;
  atlasBrief: string;
  hit: boolean;
};

export function buildCodexDepthSummary(
  termOrId: string,
  chart: BaziChart | null = null,
  luck: LuckCycles | null = null,
): CodexDepthSummary | null {
  const entityId =
    getBaziEncyclopedia(termOrId)?.id ?? resolveCodexEntityId(termOrId);
  if (!entityId) return null;
  const entry = getBaziEncyclopedia(entityId);
  const dossier = buildCodexDossier(entityId);
  if (!entry || !dossier) return null;

  const link = buildChartLinkReport(entityId, chart, luck, dossier);
  const boundary =
    entry.kind === 'shensha'
      ? '\n\n使用边界：神煞只作辅助，须合日主强弱、格局、十神与大运一起看。'
      : '';

  const atlasBrief = `${dossier.whatIs}\n记忆：${dossier.memory}${boundary}`;

  const chartParts = [
    link.summary,
    link.stageNotes.slice(0, 3).join('\n'),
    link.dayMasterImpact !== '—' ? `对日主：${link.dayMasterImpact}` : '',
    link.luckTrigger !== '—' ? `运程：${link.luckTrigger}` : '',
    entry.kind === 'shensha'
      ? '使用边界：神煞只作辅助，不能脱离日主强弱、格局、十神和大运单独判断。'
      : '',
  ].filter(Boolean);

  const chartBrief =
    chartParts.join('\n') ||
    `${dossier.memory}\n（原局未直接坐落时，仍可学习完整百科。）`;

  return {
    entityId,
    title: entry.title,
    chartBrief,
    atlasBrief,
    hit: true,
  };
}

/** 给 concept-ask / peek：优先图鉴实体 */
export function answerFromCodexEntity(
  term: string,
  opts?: {
    chart?: BaziChart | null;
    luck?: LuckCycles | null;
    depth?: 'chart' | 'atlas';
  },
): { answer: string; hit: boolean; entityId?: string } {
  const depth = opts?.depth ?? (opts?.chart ? 'chart' : 'atlas');
  const sum = buildCodexDepthSummary(
    term,
    opts?.chart ?? null,
    opts?.luck ?? null,
  );
  if (!sum) {
    // 十二长生（地势/自坐）尚无独立百科实体：仍给出命盘落点摘要
    const stage = norm(term);
    if (isChangShengStage(stage)) {
      const answer =
        depth === 'chart' || opts?.chart
          ? changShengChartBrief(stage, opts?.chart ?? null)
          : `${stage}：十二长生之一：${CHANG_SHENG_GLOSS[stage]}`;
      return { hit: true, answer };
    }
    return { answer: '', hit: false };
  }
  return {
    hit: true,
    entityId: sum.entityId,
    answer: depth === 'chart' ? sum.chartBrief : sum.atlasBrief,
  };
}
