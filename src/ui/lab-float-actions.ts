/**
 * 解读页悬浮动作簇：分享 / 深度学习 / 图鉴 / 深度解读（不占顶栏）
 */
import { navigate } from '../router.ts';
import { openShareSheet, type ShareDraft } from '../share/sheet.ts';
import { ICON_BOOK, ICON_NOTE, ICON_SHARE, ICON_SPARK } from './lab-icons.ts';
import { openLabNotesSheet, type LabNotesSystem } from './lab-notes-sheet.ts';

export type LabFloatActionsOpts = {
  tujianPath: string;
  tujianLabel?: string;
  draftShare?: () => ShareDraft | null | undefined;
  onDeep?: () => void;
  deepLabel?: string;
  /** 深度学习体系；提供后显示笔按钮 */
  notesSystem?: LabNotesSystem;
  notesContext?: string;
  notesLabel?: string;
  onNotes?: () => void;
};

function clearDock(): void {
  document.querySelectorAll('[data-lab-float-dock]').forEach((el) => el.remove());
  document.querySelectorAll('[data-lab-deep-fab]').forEach((el) => el.remove());
}

/** 右下悬浮图标（上→下）：分享 · 深度学习 · 图鉴 · 深度解读 */
export function mountLabFloatActions(_page: HTMLElement, opts: LabFloatActionsOpts): () => void {
  clearDock();

  const showNotes = Boolean(opts.notesSystem || opts.onNotes);
  const notesTitle = opts.notesLabel ?? '深度学习';
  const tujianTitle = opts.tujianLabel ?? '图鉴';

  const dock = document.createElement('div');
  dock.className = 'lab-float-dock';
  dock.dataset.labFloatDock = '1';
  dock.innerHTML = `
    <button type="button" class="lab-float-btn" data-float-share title="分享" aria-label="分享">
      ${ICON_SHARE}
    </button>
    ${
      showNotes
        ? `<button type="button" class="lab-float-btn" data-float-notes title="${notesTitle}" aria-label="${notesTitle}">
      ${ICON_NOTE}
    </button>`
        : ''
    }
    <button type="button" class="lab-float-btn" data-float-tujian title="${tujianTitle}" aria-label="${tujianTitle}">
      ${ICON_BOOK}
    </button>
    <button type="button" class="lab-float-btn is-accent" data-float-deep title="${opts.deepLabel ?? '深度解读'}" aria-label="${opts.deepLabel ?? '深度解读'}">
      ${ICON_SPARK}
    </button>
  `;

  dock.querySelector('[data-float-tujian]')?.addEventListener('click', () => {
    navigate(opts.tujianPath);
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
    if (opts.notesSystem) {
      openLabNotesSheet({
        system: opts.notesSystem,
        context: opts.notesContext,
      });
    }
  });
  dock.querySelector('[data-float-deep]')?.addEventListener('click', () => {
    opts.onDeep?.();
  });

  const app = document.querySelector('#app') || document.body;
  app.appendChild(dock);
  return () => dock.remove();
}
