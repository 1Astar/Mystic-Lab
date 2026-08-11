import type { UnlockResult } from '../codex/collection.ts';
import { ICON_EXPLORE_STAR } from './lab-icons.ts';

export function showUnlockToast(
  result: UnlockResult & { intoLabel?: string },
): void {
  if (!result.isFirstTime) return;

  const existing = document.querySelector('.unlock-toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = 'unlock-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="unlock-toast-icon">${ICON_EXPLORE_STAR}</span>
    <div class="unlock-toast-text">
      <strong>你第一次遇见「${result.cardName}」</strong>
      <span>${result.intoLabel ?? '已收入随心探索'}</span>
    </div>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 400);
  }, 3200);
}
