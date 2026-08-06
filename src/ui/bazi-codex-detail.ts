import {
  CODEX_DETAIL_LABELS,
  CODEX_DETAIL_PANES,
  getBaziEncyclopedia,
  type CodexDetailPane,
} from '../bazi/codex-encyclopedia.ts';
import { isBaziCodexUnlocked } from '../bazi/codex.ts';
import {
  focusWuxingFromEntry,
  renderRelationStarMapHtml,
  renderWuxingShengKeMapHtml,
} from '../bazi/codex-wuxing-map.ts';
import { renderEntryRelationFragmentHtml } from '../bazi/codex-relations-atlas.ts';
import { renderStructureMapHtml } from '../bazi/codex-structure-map.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type BaziCodexDetailOpts = {
  artHtml: string;
  lit: boolean;
  unlockHint?: string;
  memoryExtraHtml?: string;
};

/**
 * 八字图鉴统一四屏：纯 Tab 切换（记忆 / 结构 / 维度 / 生克）
 */
export function renderBaziCodexDetailHtml(
  id: string,
  opts: BaziCodexDetailOpts,
): string {
  const entry = getBaziEncyclopedia(id);
  if (!entry) return '';

  const lit = opts.lit ?? isBaziCodexUnlocked(id);
  const tags = [
    entry.tags.wuxing,
    entry.tags.yinyang,
    entry.tags.category,
  ].filter(Boolean) as string[];

  const lockedBanner = lit
    ? ''
    : `<p class="bazi-codex-locked">${escapeHtml(opts.unlockHint ?? '尚未点亮。排盘遇见后可完整展开。')}</p>`;

  const bodyOrTeaser = (html: string) =>
    lit
      ? html
      : `${lockedBanner}<div class="bazi-enc-teaser is-dim">${html}</div>`;

  const focus = focusWuxingFromEntry(entry);
  const shengKe =
    focus
      ? renderWuxingShengKeMapHtml({
          focus,
          compact: true,
          nodeAttr: 'data-open-entry',
          markerPrefix: 'bazi-sk-detail',
          title: `生克图 · ${entry.title}`,
          hint: `以「${focus}」为焦点看相生相克`,
        })
      : renderRelationStarMapHtml(entry);
  const fragment = renderEntryRelationFragmentHtml(id);

  const panes: Record<CodexDetailPane, string> = {
    memory: `
      <div class="bazi-enc-memory">
        <div class="bazi-enc-art ${lit ? 'is-lit' : 'is-dim'}">${opts.artHtml}${lit ? '' : '<span class="bazi-art-seal"></span>'}</div>
        <div class="bazi-enc-tags">
          ${tags.map((t) => `<span class="bazi-enc-tag">${escapeHtml(t)}</span>`).join('')}
        </div>
        <h2 class="bazi-enc-title">${escapeHtml(entry.title)}</h2>
        <p class="bazi-enc-oneliner">${escapeHtml(entry.oneLiner)}</p>
        ${opts.memoryExtraHtml ?? ''}
        ${lit ? '' : lockedBanner}
      </div>`,
    structure: bodyOrTeaser(`
      <section class="bazi-enc-section bazi-enc-structure">
        ${renderStructureMapHtml(id)}
      </section>`),
    dimension: bodyOrTeaser(`
      <section class="bazi-enc-section"><h3>性格里</h3><p>${escapeHtml(entry.dimensions.personality)}</p></section>
      <section class="bazi-enc-section"><h3>工作里</h3><p>${escapeHtml(entry.dimensions.work)}</p></section>
      <section class="bazi-enc-section"><h3>感情里</h3><p>${escapeHtml(entry.dimensions.love)}</p></section>
      <section class="bazi-enc-section"><h3>健康里</h3><p>${escapeHtml(entry.dimensions.health)}</p></section>`),
    relation: bodyOrTeaser(`${shengKe}${fragment}`),
  };

  return `
    <div class="bazi-codex-sheet bazi-enc-sheet" role="dialog" aria-modal="true">
      <div class="bazi-codex-panel bazi-enc-panel" data-enc-root data-enc-id="${escapeHtml(id)}">
        <button type="button" class="bazi-codex-close" data-codex-close aria-label="关闭">
          <span aria-hidden="true">✕</span> 关闭
        </button>
        <div class="bazi-enc-tab-bar" role="tablist">
          ${CODEX_DETAIL_PANES.map(
            (p, i) =>
              `<button type="button" class="bazi-enc-tab${i === 0 ? ' is-active' : ''}" role="tab" data-enc-tab="${p}" aria-selected="${i === 0}">${CODEX_DETAIL_LABELS[p]}</button>`,
          ).join('')}
        </div>
        <div class="bazi-enc-panels" data-enc-panels>
          ${CODEX_DETAIL_PANES.map(
            (p, i) =>
              `<section class="bazi-enc-pane" data-enc-pane="${p}" role="tabpanel" ${i === 0 ? '' : 'hidden'}>
                ${panes[p]}
              </section>`,
          ).join('')}
        </div>
      </div>
    </div>`;
}

/** 纯 Tab：点切换，一次只显示一屏 */
export function bindBaziCodexDetail(root: HTMLElement): void {
  const panel = root.querySelector<HTMLElement>('[data-enc-root]');
  if (!panel) return;
  const tabs = [...panel.querySelectorAll<HTMLButtonElement>('[data-enc-tab]')];
  const panes = [...panel.querySelectorAll<HTMLElement>('[data-enc-pane]')];
  if (!tabs.length || !panes.length) return;

  const activate = (paneId: CodexDetailPane) => {
    for (const tab of tabs) {
      const on = tab.dataset.encTab === paneId;
      tab.classList.toggle('is-active', on);
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
    }
    for (const pane of panes) {
      pane.hidden = pane.dataset.encPane !== paneId;
    }
  };

  for (const tab of tabs) {
    tab.addEventListener('click', () => {
      activate(tab.dataset.encTab as CodexDetailPane);
    });
  }
}
