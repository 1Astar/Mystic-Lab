import type { CardDefinition } from '../tarot/deck.ts';
import { formatCardNameZh } from '../tarot/card-names.ts';
import { cardFaceImageHtml } from '../tarot/card-images.ts';
import { getCodexPreviewInfo } from '../codex/preview.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export type CodexPreviewCallbacks = {
  onClose: () => void;
  onDraw: () => void;
};

export function mountCodexPreview(
  container: HTMLElement,
  card: CardDefinition,
  callbacks: CodexPreviewCallbacks,
): void {
  const preview = getCodexPreviewInfo(card);
  const nameCn = formatCardNameZh(card);

  container.className = 'codex-detail codex-preview';
  container.innerHTML = `
    <button type="button" class="codex-detail-close" aria-label="关闭">✕</button>
    <div class="codex-preview-hero">
      <div class="codex-preview-face codex-preview-face-locked">
        ${cardFaceImageHtml(card.id, nameCn, 'codex-face-img')}
        <span class="codex-preview-face-badge">尚未相遇</span>
      </div>
      <div class="codex-preview-titles">
        <h2>${escapeHtml(preview.nameCn)}<span class="codex-preview-sep">｜</span>${escapeHtml(preview.nameEn)}</h2>
        <p class="codex-preview-status">尚未相遇</p>
      </div>
    </div>
    <p class="codex-preview-lead">
      这张牌还在等待与你相遇。<br>
      在占问里抽到它时，会记录<strong>第一次相遇</strong>的时间、问题与解读。
    </p>
    <section class="codex-preview-box">
      <h3>可预览</h3>
      <ul class="codex-preview-list">
        <li><span class="codex-preview-label">牌组</span>${escapeHtml(preview.suitLabel)}</li>
        <li><span class="codex-preview-label">主题</span>${escapeHtml(preview.theme)}</li>
        <li class="codex-preview-hint-row">
          <span class="codex-preview-label">一句话提示</span>
          <em>${escapeHtml(preview.mysteryHint)}</em>
        </li>
      </ul>
    </section>
    <p class="codex-preview-unlock">去占问，让这张牌进入你的旅程。</p>
    <button type="button" class="btn codex-preview-draw">去抽牌</button>
  `;

  container.querySelector('.codex-detail-close')?.addEventListener('click', callbacks.onClose);
  container.querySelector('.codex-preview-draw')?.addEventListener('click', callbacks.onDraw);
}
