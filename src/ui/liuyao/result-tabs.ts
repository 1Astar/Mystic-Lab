import type { CastResult } from '../../liuyao/engine.ts';
import type { FourLayerReading } from '../../liuyao/interpret.ts';
import {
  collectJournalPrompts,
  mergeReflection,
  renderJournalPromptsHtml,
} from '../../liuyao/journal-prompts.ts';
import { LINE_LABELS } from '../../liuyao/hexagrams.ts';
import {
  NOTE_TAG_OPTIONS,
  bindResultLayers,
  renderHexHero,
} from '../../liuyao/result-layers.ts';
import {
  bindYaoAskButtons,
} from '../../liuyao/narrative-learn.ts';
import { bindQinDict } from '../../liuyao/energy-lens.ts';
import { collectStudyNotes } from '../../liuyao/learn-studio.ts';
import {
  bindLearnTeachPage,
  renderLearnTeachPageHtml,
} from '../../liuyao/learn-shell.ts';
import { collectCourseNotes, renderLearnNotesShellHtml } from '../../liuyao/learn-course.ts';
import {
  QUICK_TAB_DEFS,
  renderQuickBoard,
  renderQuickTabsHtml,
} from '../../liuyao/narrative-quick.ts';
import { buildFinalLoop } from '../../liuyao/final-loop.ts';
import {
  buildPatternSummary,
  renderPatternSummaryHtml,
} from '../../liuyao/pattern-summary.ts';
import { renderQuestionBriefingForCast } from '../../liuyao/question-briefing.ts';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
        ${
          learn
            ? `<p class="ly-layer-guide">详细解读请点右侧「解读笔记」；这里可自由补充标签与一句结语。</p>`
            : renderJournalPromptsHtml()
        }
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
    /** 复原场景时用当时占卜时间 */
    castAt?: Date;
    initialTags?: string[];
    initialNoteDraft?: string;
  },
): LiuyaoResultTabsApi {
  const { cast, question, learn } = opts;
  const castAt = opts.castAt ?? new Date();
  let noteTags: string[] = [...(opts.initialTags ?? [])];
  let noteDraft = opts.initialNoteDraft ?? '';

  if (!learn) {
    host.innerHTML = `
      ${renderHexHero(cast, { castAt, askable: true, primaryGist: cast.primary.gist })}
      ${renderQuickBoard(cast, castAt, { omitHeader: true })}
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
      { id: 'teach', label: '六步学习' },
    ];
    const loop = buildFinalLoop(cast, question, castAt);
    const pattern = buildPatternSummary(cast, question, castAt);

    host.innerHTML = `
      ${renderHexHero(cast, { castAt, askable: true, primaryGist: loop.oneLiner })}
      ${renderPatternSummaryHtml(pattern)}
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
          <p class="ly-guide-tip">结果：开头点明你的问题，后面直接读分析。分域与装卦细节在「解读笔记」。</p>
          ${renderQuestionBriefingForCast(cast, question, castAt)}
          <div class="ly-briefing-actions">
            <button type="button" class="btn ly-briefing-to-notes" data-course-note-open>
              📖 打开解读笔记
            </button>
            <button type="button" class="btn ly-briefing-to-course" data-goto-teach>
              想弄懂为什么 → 去六步学习
            </button>
          </div>
        </div>
        <div class="ly-result-tab-panel" data-panel="teach" role="tabpanel" hidden>
          ${renderLearnTeachPageHtml(cast, question, castAt)}
        </div>
      </section>
      ${renderLearnNotesShellHtml(cast, question, castAt)}
      ${renderPeerNoteFold({ cast, learn, selectedTags: noteTags })}
    `;
  }

  const layersApi = bindResultLayers(host, cast, question);
  bindYaoAskButtons(host, cast, question, castAt);
  if (learn) {
    bindQinDict(host);
    bindLearnTeachPage(host, cast, question, castAt);
  }

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

  host.querySelector('[data-goto-teach]')?.addEventListener('click', () => {
    host.querySelector<HTMLButtonElement>('.ly-result-tab[data-tab="teach"]')?.click();
    host.querySelector('[data-learn-course]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

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
  const draftEl = host.querySelector<HTMLTextAreaElement>('.ly-note-draft');
  if (draftEl && noteDraft) draftEl.value = noteDraft;

  return {
    getCastAt: layersApi.getCastAt,
    getNoteTags: () => noteTags,
    getNoteDraft: () => noteDraft,
    collectPrompts: () => {
      if (!learn) return collectJournalPrompts(host);
      return mergeReflection(
        mergeReflection(collectStudyNotes(host), collectCourseNotes(cast)),
        collectJournalPrompts(host),
      );
    },
  };
}
