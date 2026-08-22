/**
 * 盘面点词：浅带学 peek（一句话 + 在你盘上）
 * 完整百科只在图鉴（可查），不在解读侧堆厚百科。
 */
import type { BaziChart } from '../bazi/cast.ts';
import type { LuckCycles } from '../bazi/luck-cycles.ts';
import {
  getBaziEncyclopedia,
} from '../bazi/codex-encyclopedia.ts';
import { buildChartLinkReport } from '../bazi/codex-chart-link.ts';
import { chartPresenceBrief } from '../bazi/codex-presence-brief.ts';
import {
  answerFromCodexEntity,
  resolveCodexEntityId,
} from '../bazi/codex-entity-resolve.ts';
import { navigate } from '../router.ts';
import { openLabConceptPeek } from './lab-concept-peek.ts';

export type BaziCodexPopupOpts = {
  term: string;
  chart?: BaziChart | null;
  luck?: LuckCycles | null;
  onOpenAsk?: (term: string) => void;
  onMiss?: (q: string) => void;
};

/** @returns true 已打开浅 peek；false 无实体（已回落普通释义弹窗） */
export function openBaziCodexPopup(opts: BaziCodexPopupOpts): boolean {
  document.querySelector('.lab-codex-popup')?.remove();
  const term = opts.term.trim();
  if (!term || term === '—') return false;

  const id =
    getBaziEncyclopedia(term)?.id ?? resolveCodexEntityId(term);
  if (!id || !getBaziEncyclopedia(id)) {
    openLabConceptPeek({
      term,
      answerConcept: (q) =>
        answerFromCodexEntity(q, {
          chart: opts.chart,
          luck: opts.luck,
          depth: 'atlas',
        }),
      onMiss: opts.onMiss,
      onOpenAsk: opts.onOpenAsk,
      sourceHint: '本地词条 · 浅释义',
      onOpenAtlas: () => navigate('/bazi/tujian'),
    });
    return false;
  }

  const entry = getBaziEncyclopedia(id)!;
  const chartLink = buildChartLinkReport(
    id,
    opts.chart ?? null,
    opts.luck ?? null,
  );
  const presence =
    chartPresenceBrief(id, opts.chart ?? null, opts.luck ?? null).trim() ||
    chartLink.summary.trim() ||
    (chartLink.present
      ? '此词已在你的原局或流年里出现，可进图鉴看完整落点。'
      : '当前盘面未直接点亮此条；图鉴仍可查通识与结构。');

  openLabConceptPeek({
    term: entry.title,
    sourceHint: '解读带学 · 深度请查图鉴',
    tabs: [
      { id: 'what', label: '是什么', body: entry.oneLiner },
      { id: 'you', label: '在你身上', body: presence },
    ],
    initialTab: chartLink.present ? 'you' : 'what',
    onOpenAsk: opts.onOpenAsk,
    onOpenAtlas: () => {
      try {
        sessionStorage.setItem('mystic-lab-open-codex-id', id);
      } catch {
        /* ignore */
      }
      navigate('/bazi/tujian');
    },
  });
  return true;
}
