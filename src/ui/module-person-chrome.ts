import { mountPersonSwitcher, type PersonSwitcherOptions } from './person-switcher.ts';

function ensureTopbarCenter(topbar: HTMLElement): HTMLElement {
  const centerSel = topbar.classList.contains('ly-topbar')
    ? '.ly-topbar-center'
    : '.module-topbar-center';
  let center = topbar.querySelector<HTMLElement>(centerSel);
  if (center) return center;

  center = document.createElement('div');
  center.className = topbar.classList.contains('ly-topbar')
    ? 'ly-topbar-center'
    : 'module-topbar-center';

  const back = topbar.querySelector<HTMLElement>('.back-link, .life-back, .ly-home-back');
  if (back?.nextSibling) topbar.insertBefore(center, back.nextSibling);
  else if (back) back.after(center);
  else topbar.prepend(center);
  return center;
}

/**
 * 把「自己 ▾」挂到顶栏正中。
 * 优先 `.ly-topbar-center` / `.module-topbar-center`；
 * 若只有 actions 宿主则补建 center；否则把现有 `.back-link` 包进 `.module-topbar`。
 */
export function attachPersonSwitcherToPage(
  page: HTMLElement,
  options?: PersonSwitcherOptions,
): void {
  const existingTopbar = page.querySelector<HTMLElement>('.ly-topbar, .module-topbar');
  if (existingTopbar) {
    let actions =
      existingTopbar.querySelector<HTMLElement>('.ly-topbar-actions') ??
      existingTopbar.querySelector<HTMLElement>('.module-topbar-actions') ??
      existingTopbar.querySelector<HTMLElement>('[data-module-actions]');
    if (!actions) {
      actions = document.createElement('div');
      actions.className = existingTopbar.classList.contains('ly-topbar')
        ? 'ly-topbar-actions'
        : 'module-topbar-actions';
      actions.dataset.moduleActions = '';
      existingTopbar.appendChild(actions);
    }
    const center = ensureTopbarCenter(existingTopbar);
    mountPersonSwitcher(center, options);
    return;
  }

  let actions = page.querySelector<HTMLElement>('[data-module-actions]');

  if (!actions) {
    const back = page.querySelector<HTMLElement>('.back-link, .life-back, .ly-home-back');
    const topbar = document.createElement('div');
    topbar.className = 'module-topbar';
    const center = document.createElement('div');
    center.className = 'module-topbar-center';
    actions = document.createElement('div');
    actions.className = 'module-topbar-actions';
    actions.dataset.moduleActions = '';

    if (back?.parentElement) {
      back.replaceWith(topbar);
      topbar.append(back, center, actions);
    } else {
      page.prepend(topbar);
      topbar.append(center, actions);
    }
    mountPersonSwitcher(center, options);
    return;
  }

  const topbar = actions.closest<HTMLElement>('.ly-topbar, .module-topbar');
  if (topbar) {
    mountPersonSwitcher(ensureTopbarCenter(topbar), options);
    return;
  }

  mountPersonSwitcher(actions, options);
}
