/**
 * 解读页悬浮动作簇：图鉴 / 分享 / 深度解读（不占顶栏）
 */
import { navigate } from '../router.ts';
import { openShareSheet, type ShareDraft } from '../share/sheet.ts';
import { ICON_EXPLORE_STAR, ICON_SHARE, ICON_SPARK } from './lab-icons.ts';

export type LabFloatActionsOpts = {
  tujianPath: string;
  tujianLabel?: string;
  draftShare?: () => ShareDraft | null | undefined;
  onDeep?: () => void;
  deepLabel?: string;
};

function clearDock(): void {
  document.querySelectorAll('[data-lab-float-dock]').forEach((el) => el.remove());
  document.querySelectorAll('[data-lab-deep-fab]').forEach((el) => el.remove());
}

/** 右上悬浮图标：图鉴 · 分享 · 深度解读 */
export function mountLabFloatActions(_page: HTMLElement, opts: LabFloatActionsOpts): () => void {
  clearDock();

  const dock = document.createElement('div');
  dock.className = 'lab-float-dock';
  dock.dataset.labFloatDock = '1';
  dock.innerHTML = `
    <button type="button" class="lab-float-btn" data-float-tujian title="${opts.tujianLabel ?? '图鉴'}" aria-label="${opts.tujianLabel ?? '图鉴'}">
      ${ICON_EXPLORE_STAR}
    </button>
    <button type="button" class="lab-float-btn" data-float-share title="分享" aria-label="分享">
      ${ICON_SHARE}
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
  dock.querySelector('[data-float-deep]')?.addEventListener('click', () => {
    opts.onDeep?.();
  });

  const app = document.querySelector('#app') || document.body;
  app.appendChild(dock);
  return () => dock.remove();
}
