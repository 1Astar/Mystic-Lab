/**
 * 盘面点词：居中弹窗直接开完整图鉴百科（非底部摘要抽屉）
 */
import type { BaziChart } from '../bazi/cast.ts';
import type { LuckCycles } from '../bazi/luck-cycles.ts';
import { isBaziCodexUnlocked } from '../bazi/codex.ts';
import {
  getBaziEncyclopedia,
  isAtlasLibraryKind,
} from '../bazi/codex-encyclopedia.ts';
import { buildChartLinkReport } from '../bazi/codex-chart-link.ts';
import { codexDetailArtHtml } from '../bazi/codex-detail-art.ts';
import {
  answerFromCodexEntity,
  resolveCodexEntityId,
} from '../bazi/codex-entity-resolve.ts';
import { ICON_SPARK } from './lab-icons.ts';
import {
  bindBaziCodexDetail,
  renderBaziCodexDetailHtml,
} from './bazi-codex-detail.ts';
import { openLabConceptPeek } from './lab-concept-peek.ts';

export type BaziCodexPopupOpts = {
  term: string;
  chart?: BaziChart | null;
  luck?: LuckCycles | null;
  onOpenAsk?: (term: string) => void;
  onMiss?: (q: string) => void;
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** @returns true 已打开百科弹窗；false 无实体（已回落普通释义弹窗） */
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
      sourceHint: '本地词条 · 百科摘要',
    });
    return false;
  }

  const entry = getBaziEncyclopedia(id)!;
  const chartLink = buildChartLinkReport(
    id,
    opts.chart ?? null,
    opts.luck ?? null,
  );
  // 盘面点开：完整百科默认可读（命盘已见 / 图鉴索引类 / 已点亮）
  const lit =
    isBaziCodexUnlocked(id) ||
    chartLink.present ||
    isAtlasLibraryKind(entry.kind);
  const detailHtml = renderBaziCodexDetailHtml(id, {
    artHtml: codexDetailArtHtml(id),
    lit,
    chartLink,
  });

  const modal = document.createElement('div');
  modal.className = 'lab-codex-popup is-open';
  modal.innerHTML = `
    <button type="button" class="lab-codex-popup-backdrop" data-popup-close aria-label="关闭"></button>
    <div class="lab-codex-popup-dialog" role="dialog" aria-modal="true" aria-label="${escapeHtml(term)}">
      ${detailHtml}
      <footer class="lab-codex-popup-foot">
        <p class="lab-codex-popup-hint">图鉴知识库 · 完整百科</p>
        ${
          opts.onOpenAsk
            ? `<button type="button" class="lab-codex-popup-ask" data-popup-ask>
                ${ICON_SPARK}
                <span>继续追问</span>
              </button>`
            : ''
        }
      </footer>
    </div>
  `;

  const close = () => {
    modal.classList.remove('is-open');
    setTimeout(() => modal.remove(), 200);
  };

  modal.querySelectorAll('[data-popup-close], [data-codex-close]').forEach((el) => {
    el.addEventListener('click', close);
  });
  modal.querySelector('[data-popup-ask]')?.addEventListener('click', () => {
    close();
    opts.onOpenAsk?.(term);
  });

  document.body.appendChild(modal);
  bindBaziCodexDetail(modal);
  return true;
}
