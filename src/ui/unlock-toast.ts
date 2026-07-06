import type { UnlockResult } from '../codex/collection.ts';

export function showUnlockToast(result: UnlockResult): void {
  if (!result.isFirstTime) return;

  const existing = document.querySelector('.unlock-toast');
  existing?.remove();

  const toast = document.createElement('div');
  toast.className = 'unlock-toast';
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="unlock-toast-icon">✦</span>
    <div class="unlock-toast-text">
      <strong>你第一次遇见「${result.cardName}」</strong>
      <span>已收入随心图鉴</span>
    </div>
  `;

  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('is-visible'));

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    window.setTimeout(() => toast.remove(), 400);
  }, 3200);
}
