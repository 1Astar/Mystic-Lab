import type { CastResult } from '../../liuyao/engine.ts';
import type { FourLayerReading } from '../../liuyao/interpret.ts';
import { bindGuideInteractions, renderComposeTeach } from '../../liuyao/compose-teach.ts';
import {
  collectJournalPrompts,
  renderJournalPromptsHtml,
} from '../../liuyao/journal-prompts.ts';
import { LINE_LABELS } from '../../liuyao/hexagrams.ts';
import {
  NOTE_TAG_OPTIONS,
  bindResultLayers,
  renderCorePanel,
  renderDeepPanel,
  renderFaqPanel,
  renderHexHero,
} from '../../liuyao/result-layers.ts';
import { renderLearnReadingTab, bindYaoAskButtons } from '../../liuyao/narrative-learn.ts';
import { buildReadingFacts } from '../../liuyao/reading-facts.ts';
import { renderClassicPlateIntroHtml, bindQinDict } from '../../liuyao/energy-lens.ts';
import {
  QUICK_TAB_DEFS,
  renderQuickBoard,
  renderQuickTabsHtml,
} from '../../liuyao/narrative-quick.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readingAccordion(title: string, body: string, open = false): string {
  return `
    <details class="ly-reading-acc"${open ? ' open' : ''}>
      <summary class="ly-reading-acc-sum">
        <span class="ly-reading-acc-title">${title}</span>
        <span class="ly-reading-acc-hint" aria-hidden="true"></span>
      </summary>
      <div class="ly-reading-acc-body">${body}</div>
    </details>
  `;
}

/** @deprecated 保留兼容；学习模式改用 renderLearnReadingTab */
function renderReadingTab(reading: FourLayerReading): string {
  return `
    <section class="ly-result-panel ly-reading-summary">
      <span class="ly-layer-num">一</span>
      <h3>一句话总结</h3>
      <p>${escapeHtml(reading.summary)}</p>
    </section>
    ${readingAccordion(
      '二 · 卦象依据',
      `<p class="ly-reading-multiline">${escapeHtml(reading.basis).replace(/\n/g, '<br>')}</p>`,
    )}
    ${readingAccordion(
      '三 · 结合你的问题',
      `<p class="ly-reading-multiline">${escapeHtml(reading.context).replace(/\n/g, '<br>')}</p>`,
    )}
    ${readingAccordion(
      '四 · 行动建议',
      `<p class="ly-reading-multiline">${escapeHtml(reading.action).replace(/\n/g, '<br>')}</p>`,
      true,
    )}
  `;
}

function renderTagChips(selected: string[]): string {
  const presets = NOTE_TAG_OPTIONS.map(
    (t) =>
      `<button type="button" class="ly-note-tag${selected.includes(t) ? ' is-on' : ''}" data-tag="${t}">#${t}</button>`,
  ).join('');
  const customs = selected
    .filter((t) => !(NOTE_TAG_OPTIONS as readonly string[]).includes(t))
    .map(
      (t) =>
        `<button type="button" class="ly-note-tag is-on is-custom" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`,
    )
    .join('');
  return `${presets}${customs}`;
}

export function renderPeerNoteFold(opts: {
  cast: CastResult;
  learn: boolean;
  selectedTags?: string[];
}): string {
  const { cast, learn, selectedTags = [] } = opts;
  return `
    <details class="ly-peer-note-fold">
      <summary class="ly-peer-note-sum">同人笔记 · 点开记录这一卦</summary>
      <div class="ly-peer-note ly-result-panel">
        <p class="ly-layer-guide">写下来，才变成你的六爻日记。系统会自动带入卦象与世应。</p>
        <div class="ly-note-tags" data-note-tags>
          ${renderTagChips(selectedTags)}
        </div>
        <div class="ly-note-tag-add">
          <input type="text" class="ly-note-tag-input" maxlength="10" placeholder="自定义标签，如「搬家」" data-tag-input />
          <button type="button" class="ly-note-tag-add-btn" data-tag-add>添加</button>
        </div>
        ${learn ? renderJournalPromptsHtml() : ''}
        <textarea class="question-input ly-note-draft" rows="3" placeholder="${
          learn ? '自由补充：还可以写别的感受…' : '可选：记下此刻的感受'
        }"></textarea>
        <p class="ly-note-meta">将保存：${cast.primary.fullName}${
          cast.changed ? ` → ${cast.changed.fullName}` : ''
        } · 世${LINE_LABELS[cast.shiLine - 1]} / 应${LINE_LABELS[cast.yingLine - 1]}</p>
      </div>
    </details>
  `;
}

export type LiuyaoResultTabsApi = {
  getCastAt: () => Date;
  getNoteTags: () => string[];
  getNoteDraft: () => string;
  collectPrompts: () => string;
};

/** 结果页：卦象主视觉 + Tab 解读 + 折叠笔记 */
export function mountLiuyaoResultTabs(
  host: HTMLElement,
  opts: {
    cast: CastResult;
    reading: FourLayerReading;
    question: string;
    learn: boolean;
  },
): LiuyaoResultTabsApi {
  const { cast, reading, question, learn } = opts;
  const castAt = new Date();
  let noteTags: string[] = [];
  let noteDraft = '';

  if (!learn) {
    host.innerHTML = `
      ${renderQuickBoard(cast, castAt)}
      <section class="ly-result-tabs" data-result-tabs data-result-layers data-cast-iso="${castAt.toISOString()}">
        <div class="ly-result-tab-bar" role="tablist" aria-label="速断解读">
          ${QUICK_TAB_DEFS.map(
            (t, i) => `
            <button type="button" class="ly-result-tab${i === 0 ? ' is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${i === 0}">
              ${t.label}
            </button>`,
          ).join('')}
        </div>
        ${renderQuickTabsHtml(cast, question, castAt)}
      </section>
      ${renderPeerNoteFold({ cast, learn, selectedTags: noteTags })}
    `;
  } else {
    const tabs = [
      { id: 'reading', label: '此刻解读' },
      { id: 'core', label: '核心要素' },
      { id: 'guide', label: '怎么读卦' },
      { id: 'deep', label: '深度推演' },
    ];
    const facts = buildReadingFacts(cast, question, castAt);
    const hi =
      facts.yong.matchedLine !== undefined ? [facts.yong.matchedLine] : [];

    host.innerHTML = `
      ${renderHexHero(cast, { askable: true, highlightIndexes: hi, castAt })}
      <section class="ly-result-tabs" data-result-tabs data-result-layers data-cast-iso="${castAt.toISOString()}">
        <div class="ly-result-tab-bar" role="tablist" aria-label="卦象解读">
          ${tabs
            .map(
              (t, i) => `
            <button type="button" class="ly-result-tab${i === 0 ? ' is-active' : ''}" data-tab="${t.id}" role="tab" aria-selected="${i === 0}">
              ${t.label}
            </button>`,
            )
            .join('')}
        </div>
        <div class="ly-result-tab-panel is-active" data-panel="reading" role="tabpanel">
          ${renderLearnReadingTab(cast, question, castAt)}
        </div>
        <div class="ly-result-tab-panel" data-panel="core" role="tabpanel" hidden>
          ${renderCorePanel(cast, question)}
        </div>
        <div class="ly-result-tab-panel" data-panel="guide" role="tabpanel" hidden>
          ${renderComposeTeach({ cast, question })}
        </div>
        <div class="ly-result-tab-panel" data-panel="deep" role="tabpanel" hidden>
          ${renderClassicPlateIntroHtml()}
          <div data-deep-panel>${renderDeepPanel(cast, castAt, question)}</div>
          ${renderFaqPanel(cast, question)}
        </div>
      </section>
      ${renderPeerNoteFold({ cast, learn, selectedTags: noteTags })}
    `;
    void reading;
    void renderReadingTab;
  }

  const layersApi = bindResultLayers(host, cast, question);
  if (learn) {
    bindYaoAskButtons(host, cast, question, castAt);
    bindQinDict(host);
  }

  const guideRoot = host.querySelector<HTMLElement>('[data-guide-root]');
  if (guideRoot) bindGuideInteractions(guideRoot, cast, question);

  const tagsHost = host.querySelector<HTMLElement>('[data-note-tags]');
  const paintTags = () => {
    if (tagsHost) tagsHost.innerHTML = renderTagChips(noteTags);
    tagsHost?.querySelectorAll<HTMLButtonElement>('.ly-note-tag').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tag = btn.dataset.tag!;
        noteTags = noteTags.includes(tag)
          ? noteTags.filter((t) => t !== tag)
          : [...noteTags, tag].slice(0, 8);
        paintTags();
      });
    });
  };
  paintTags();

  const addCustomTag = () => {
    const input = host.querySelector<HTMLInputElement>('[data-tag-input]');
    const raw = (input?.value ?? '').trim().replace(/^#/, '').slice(0, 10);
    if (!raw) return;
    if (!noteTags.includes(raw)) noteTags = [...noteTags, raw].slice(0, 8);
    if (input) input.value = '';
    paintTags();
  };
  host.querySelector('[data-tag-add]')?.addEventListener('click', addCustomTag);
  host.querySelector('[data-tag-input]')?.addEventListener('keydown', (e) => {
    if ((e as KeyboardEvent).key === 'Enter') {
      e.preventDefault();
      addCustomTag();
    }
  });

  host.querySelector('.ly-note-draft')?.addEventListener('input', (e) => {
    noteDraft = (e.target as HTMLTextAreaElement).value;
  });

  return {
    getCastAt: layersApi.getCastAt,
    getNoteTags: () => noteTags,
    getNoteDraft: () => noteDraft,
    collectPrompts: () => (learn ? collectJournalPrompts(host) : ''),
  };
}
