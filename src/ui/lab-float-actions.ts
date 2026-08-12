/**
 * 解读/图鉴页悬浮动作簇：分享 · 笔记（笔）· 图鉴/知识 · 深度解读（火花）
 * 同时挂选区「追问」。
 */
import { navigate } from '../router.ts';
import { openShareSheet, type ShareDraft } from '../share/sheet.ts';
import { openLabDeepSheet, type LabDeepSystem } from './lab-deep-sheet.ts';
import { ICON_BOOK, ICON_NOTE, ICON_SHARE, ICON_SPARK } from './lab-icons.ts';
import {
  openLabNotesSheet,
  type LabNotesSurface,
  type LabNotesSystem,
} from './lab-notes-sheet.ts';
import {
  clearLabSelectionAsk,
  formatSelectionAskSeed,
  mountLabSelectionAsk,
} from './lab-selection-ask.ts';
import { clearScrollTopFab, mountScrollTopFab } from './scroll-top.ts';

export type LabFloatActionsOpts = {
  system: LabNotesSystem;
  /** 当前界面；笔记写入时记为自动标签 */
  surface: LabNotesSurface;
  /** 图鉴页：第四钮改为知识库 */
  atlasMode?: boolean;
  tujianPath?: string;
  knowledgePath?: string;
  tujianLabel?: string;
  draftShare?: () => ShareDraft | null | undefined;
  onDeep?: () => void;
  deepLabel?: string;
  notesContext?: string;
  notesLabel?: string;
  onNotes?: () => void;
  /** 选区追问；缺省用本地词库边看边问 */
  onSelectionAsk?: (text: string) => void;
  answerConcept?: (q: string) => { answer: string; hit: boolean };
  /** 关闭选区追问（默认开启） */
  disableSelectionAsk?: boolean;
  /** 长页一键回顶（默认开启） */
  showScrollTop?: boolean;
};

export function clearLabFloatDock(): void {
  document.querySelectorAll('[data-lab-float-dock]').forEach((el) => el.remove());
  document.querySelectorAll('[data-lab-deep-fab]').forEach((el) => el.remove());
  clearScrollTopFab();
  clearLabSelectionAsk();
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

function defaultSelectionAsk(opts: LabFloatActionsOpts, text: string): void {
  if (opts.onSelectionAsk) {
    opts.onSelectionAsk(text);
    return;
  }
  const seed = formatSelectionAskSeed(text);
  if (!seed) return;
  openLabDeepSheet({
    system: opts.system as LabDeepSystem,
    title: '选区追问',
    initialTab: 'ask',
    seedQuery: seed,
    answerConcept:
      opts.answerConcept ??
      ((q) => ({
        answer: `关于「${q}」：可对照本页上下文与图鉴；词库暂无精确条时，请改短词再问或记到笔记。`,
        hit: false,
      })),
    deepHint: '由正文选区带入；概念优先本地词库。',
  });
}

/** 右下悬浮（上→下）：分享 · 笔记 · 图鉴/知识库 · 深度解读 */
export function mountLabFloatActions(page: HTMLElement, opts: LabFloatActionsOpts): () => void {
  clearLabFloatDock();

  const notesTitle = opts.notesLabel ?? '笔记';
  const deepTitle = opts.deepLabel ?? '深度解读';
  const bookTitle = opts.atlasMode
    ? opts.tujianLabel ?? '知识库'
    : opts.tujianLabel ?? '图鉴';
  const bookPath = opts.atlasMode
    ? opts.knowledgePath ?? '/knowledge'
    : opts.tujianPath ?? '/knowledge';

  const dock = document.createElement('div');
  dock.className = 'lab-float-dock';
  dock.dataset.labFloatDock = '1';
  dock.innerHTML = `
    <button type="button" class="lab-float-btn" data-float-share title="分享" aria-label="分享">
      ${ICON_SHARE}
    </button>
    <button type="button" class="lab-float-btn" data-float-notes title="${escapeAttr(notesTitle)}" aria-label="${escapeAttr(notesTitle)}">
      ${ICON_NOTE}
    </button>
    <button type="button" class="lab-float-btn" data-float-tujian title="${escapeAttr(bookTitle)}" aria-label="${escapeAttr(bookTitle)}">
      ${ICON_BOOK}
    </button>
    <button type="button" class="lab-float-btn is-accent" data-float-deep title="${escapeAttr(deepTitle)}" aria-label="${escapeAttr(deepTitle)}">
      ${ICON_SPARK}
    </button>
  `;

  dock.querySelector('[data-float-tujian]')?.addEventListener('click', () => {
    navigate(bookPath);
  });

  dock.querySelector('[data-float-share]')?.addEventListener('click', () => {
    const draft = opts.draftShare?.();
    if (draft) openShareSheet(draft);
  });

  dock.querySelector('[data-float-notes]')?.addEventListener('click', () => {
    if (opts.onNotes) {
      opts.onNotes();
      return;
    }
    openLabNotesSheet({
      system: opts.system,
      surface: opts.surface,
      context: opts.notesContext,
    });
  });

  dock.querySelector('[data-float-deep]')?.addEventListener('click', () => {
    opts.onDeep?.();
  });

  const app = document.querySelector('#app') || document.body;
  app.appendChild(dock);

  const disposeSel = opts.disableSelectionAsk
    ? () => {}
    : mountLabSelectionAsk({
        root: page,
        onAsk: (text) => defaultSelectionAsk(opts, text),
      });

  const disposeTop =
    opts.showScrollTop === false ? () => {} : mountScrollTopFab();

  return () => {
    disposeSel();
    disposeTop();
    dock.remove();
    clearScrollTopFab();
    clearLabSelectionAsk();
  };
}
