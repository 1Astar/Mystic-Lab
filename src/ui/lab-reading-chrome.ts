/**
 * 解读/盘面顶栏：← 返回 | 居中「自己」切换 | 右侧动作位
 * 图鉴 / 分享 / 深度解读 → 改用 mountLabFloatActions 悬浮，不占顶栏
 */
import { navigate } from '../router.ts';
import type { ShareDraft } from '../share/sheet.ts';
import { attachPersonSwitcherToPage } from './module-person-chrome.ts';
import { mountPersonSwitcher, type PersonSwitcherOptions } from './person-switcher.ts';

export type LabReadingTopbarOpts = {
  backPath?: string;
  backLabel?: string;
  /** @deprecated 图鉴已改悬浮 */
  tujianPath?: string;
  tujianLabel?: string;
  draftShare?: () => ShareDraft | null | undefined;
  person?: PersonSwitcherOptions;
};

function ensureTopbar(page: HTMLElement, backPath: string, backLabel: string): void {
  let topbar = page.querySelector<HTMLElement>('.module-topbar');
  if (!topbar) {
    topbar = document.createElement('div');
    topbar.className = 'module-topbar';
    page.prepend(topbar);
  }

  let back = topbar.querySelector<HTMLButtonElement>('.back-link, .life-back');
  if (!back) {
    const orphan = page.querySelector<HTMLButtonElement>(':scope > .back-link, :scope > .life-back');
    if (orphan) {
      topbar.prepend(orphan);
      back = orphan;
    } else {
      back = document.createElement('button');
      back.type = 'button';
      back.className = 'back-link life-back';
      topbar.prepend(back);
    }
  }
  back.textContent = backLabel;
  back.onclick = () => navigate(backPath);

  if (!topbar.querySelector('[data-module-actions]')) {
    const actions = document.createElement('div');
    actions.className = 'module-topbar-actions';
    actions.dataset.moduleActions = '';
    topbar.appendChild(actions);
  }
}

/** 仅返回 + 居中切换 + 右侧动作位；探索/分享请用 mountLabFloatActions */
export function mountLabReadingTopbar(page: HTMLElement, opts: LabReadingTopbarOpts): void {
  ensureTopbar(page, opts.backPath ?? '/', opts.backLabel ?? '← Lab');

  page.querySelectorAll(':scope > .back-link, :scope > .life-back').forEach((el) => {
    if (!el.closest('.module-topbar')) el.remove();
  });

  const topbar = page.querySelector<HTMLElement>('.module-topbar');
  if (topbar) {
    let center = topbar.querySelector<HTMLElement>('[data-module-center]');
    if (!center) {
      center = document.createElement('div');
      center.className = 'module-topbar-center';
      center.dataset.moduleCenter = '';
      const actions = topbar.querySelector<HTMLElement>('[data-module-actions]');
      if (actions) topbar.insertBefore(center, actions);
      else topbar.appendChild(center);
    }
    topbar.querySelectorAll('.person-switcher').forEach((el) => {
      if (!el.closest('[data-module-center]')) el.remove();
    });
    mountPersonSwitcher(center, opts.person);
  } else {
    attachPersonSwitcherToPage(page, opts.person);
  }

  page
    .querySelector<HTMLElement>('.module-topbar [data-module-actions]')
    ?.querySelectorAll('[data-reading-chrome]')
    .forEach((el) => el.remove());
}

/** @deprecated */
export function mountReadingChrome(page: HTMLElement, opts: LabReadingTopbarOpts): void {
  mountLabReadingTopbar(page, opts);
}
