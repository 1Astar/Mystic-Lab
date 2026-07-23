import { mountPersonSwitcher, type PersonSwitcherOptions } from './person-switcher.ts';

/**
 * 把「自己 ▾」挂到页面右上角。
 * 若已有 `.ly-topbar-actions` / `[data-module-actions]` 则直接用；
 * 否则把现有 `.back-link` 包进 `.module-topbar`。
 */
export function attachPersonSwitcherToPage(
  page: HTMLElement,
  options?: PersonSwitcherOptions,
): void {
  let actions =
    page.querySelector<HTMLElement>('.ly-topbar-actions') ??
    page.querySelector<HTMLElement>('[data-module-actions]');

  if (!actions) {
    const back = page.querySelector<HTMLElement>('.back-link, .life-back, .ly-home-back');
    const topbar = document.createElement('div');
    topbar.className = 'module-topbar';
    actions = document.createElement('div');
    actions.className = 'module-topbar-actions';
    actions.dataset.moduleActions = '';

    if (back?.parentElement) {
      const parent = back.parentElement;
      if (parent.classList.contains('ly-topbar') || parent.classList.contains('module-topbar')) {
        parent.appendChild(actions);
      } else {
        back.replaceWith(topbar);
        topbar.append(back, actions);
      }
    } else {
      page.prepend(topbar);
      topbar.appendChild(actions);
    }
  }

  mountPersonSwitcher(actions, options);
}
