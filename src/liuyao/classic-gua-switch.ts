import type { CastResult } from './engine.ts';
import { getClassicCorpus } from './classic-corpus.ts';
import { LINE_LABELS } from './hexagrams.ts';
import { formatClauseHtml } from './format-clause.ts';
import { glossDaXiang, glossLine } from './classic-gloss.ts';
import { resolveClassicDossier } from './classic-folder.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** 单卦：卦辞 + 大象 + 六爻辞（白话） */
export function renderClassicGuaTextHtml(
  name: string,
  opts?: {
    /** 本卦动爻下标，用于高亮 */
    changingIndexes?: number[];
    /** 本卦行可被 Step 联动高亮（data-book-line） */
    bookLineAttr?: boolean;
    titleTag?: string;
  },
): string {
  const d = resolveClassicDossier(name);
  const corpus = getClassicCorpus(name);
  const daBai = glossDaXiang(name) ?? d.modern;
  const changing = new Set(opts?.changingIndexes ?? []);
  const titleTag = opts?.titleTag ?? '《易经》卦辞';

  const judgment = d.judgment
    ? `<div class="ly-classic-block">
        <p class="ly-classic-zh"><span class="ly-classic-tag">${escapeHtml(titleTag)}</span>${escapeHtml(
          d.judgment,
        )}</p>
        <p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(daBai)}</p>
      </div>`
    : `<p class="ly-guide-tip">本库暂无「${escapeHtml(name)}」卦辞。</p>`;

  const daXiang = corpus?.daXiang
    ? `<div class="ly-classic-block">
        <p class="ly-classic-zh"><span class="ly-classic-tag">大象</span>${escapeHtml(corpus.daXiang)}</p>
      </div>`
    : '';

  const lines = (corpus?.lineClassics ?? [])
    .map((text, i) => {
      if (!text) return '';
      const bai = glossLine(name, i) ?? '';
      const move = changing.has(i) ? ' is-book-move' : '';
      const lineAttr = opts?.bookLineAttr ? ` data-book-line="${i}"` : '';
      return `
        <div class="ly-classic-block${move}"${lineAttr}>
          <p class="ly-classic-zh"><span class="ly-classic-tag">${LINE_LABELS[i]}${
            changing.has(i) ? '·动' : ''
          }</span>${escapeHtml(text)}</p>
          ${
            bai
              ? `<p class="ly-classic-bai"><span class="ly-classic-tag is-bai">白话</span>${formatClauseHtml(
                  bai,
                )}</p>`
              : ''
          }
        </div>`;
    })
    .filter(Boolean)
    .join('');

  return `
    <div class="ly-gua-text" data-gua-name="${escapeHtml(name)}">
      <p class="ly-gua-text-name">${escapeHtml(name)}${d.hasSeed ? '' : '（摘录待补）'}</p>
      ${judgment}
      ${daXiang}
      ${lines ? `<p class="ly-layer-guide">六爻爻辞</p>${lines}` : ''}
    </div>
  `;
}

/**
 * 本卦辞 + 六爻辞 ↔ 变卦辞
 * 挂在「古籍解析」中部，参考桌面端中部 Tab。
 */
export function renderClassicGuaSwitchHtml(cast: CastResult): string {
  const hasChanged = Boolean(cast.changed);
  const primaryName = cast.primary.name;
  const changedName = cast.changed?.name;

  const primaryHtml = renderClassicGuaTextHtml(primaryName, {
    changingIndexes: cast.changingIndexes,
    bookLineAttr: true,
    titleTag: `本卦 · ${cast.primary.fullName} · 卦辞`,
  });

  const changedHtml = hasChanged && changedName
    ? renderClassicGuaTextHtml(changedName, {
        titleTag: `变卦 · ${cast.changed!.fullName} · 卦辞`,
      })
    : `<p class="ly-guide-tip">无动则无变：时间轴停在本卦，先把本卦辞与六爻辞看清。</p>`;

  return `
    <section class="ly-gua-switch" data-gua-switch>
      <div class="ly-gua-switch-tabs" role="tablist" aria-label="本卦 / 变卦辞切换">
        <button type="button" class="ly-gua-switch-tab is-active" data-gua-side="primary" role="tab" aria-selected="true">
          本卦辞 · 六爻
        </button>
        <button type="button" class="ly-gua-switch-tab" data-gua-side="changed" role="tab" aria-selected="false"${
          hasChanged ? '' : ' disabled title="无动爻则无变卦"'
        }>
          变卦辞${hasChanged && changedName ? ` · ${escapeHtml(changedName)}` : ''}
        </button>
      </div>
      <div class="ly-gua-switch-pane is-active" data-gua-pane="primary" role="tabpanel">
        ${primaryHtml}
      </div>
      <div class="ly-gua-switch-pane" data-gua-pane="changed" role="tabpanel" hidden>
        ${changedHtml}
      </div>
    </section>
  `;
}

export function bindClassicGuaSwitch(root: HTMLElement): void {
  root.querySelectorAll<HTMLElement>('[data-gua-switch]').forEach((host) => {
    if (host.dataset.bound === '1') return;
    host.dataset.bound = '1';
    host.addEventListener('click', (e) => {
      const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-gua-side]');
      if (!btn || !host.contains(btn) || btn.disabled) return;
      const side = btn.dataset.guaSide;
      if (side !== 'primary' && side !== 'changed') return;

      host.querySelectorAll('[data-gua-side]').forEach((el) => {
        const on = (el as HTMLElement).dataset.guaSide === side;
        el.classList.toggle('is-active', on);
        el.setAttribute('aria-selected', String(on));
      });
      host.querySelectorAll('[data-gua-pane]').forEach((pane) => {
        const on = (pane as HTMLElement).dataset.guaPane === side;
        pane.classList.toggle('is-active', on);
        (pane as HTMLElement).hidden = !on;
      });
    });
  });
}
