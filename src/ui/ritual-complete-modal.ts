import type { ReadingResult } from '../interpretation/types.ts';

export function showRitualCompleteModal(
  reading: ReadingResult,
  onContinue: () => void,
): void {
  const existing = document.querySelector('.ritual-complete-modal');
  existing?.remove();

  const overlay = document.createElement('div');
  overlay.className = 'ritual-complete-modal';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.innerHTML = `
    <div class="ritual-complete-backdrop"></div>
    <div class="ritual-complete-card">
      <div class="ritual-complete-stardust" aria-hidden="true"></div>
      <p class="ritual-complete-icon">✦</p>
      <h2 class="ritual-complete-title">仪式完成</h2>
      <p class="ritual-complete-summary">${escapeHtml(reading.summary)}</p>
      <p class="ritual-complete-slogan">答案不在牌里，在你心里。</p>
      <button type="button" class="btn ritual-complete-btn">查看完整解读</button>
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('is-visible'));

  const close = (): void => {
    overlay.classList.remove('is-visible');
    window.setTimeout(() => {
      overlay.remove();
      onContinue();
    }, 350);
  };

  overlay.querySelector('.ritual-complete-btn')?.addEventListener('click', close);
  overlay.querySelector('.ritual-complete-backdrop')?.addEventListener('click', close);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
