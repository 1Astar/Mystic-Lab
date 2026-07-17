import { navigate } from '../../router.ts';
import type { JournalEntry } from '../../journal/records.ts';
import {
  listTarotDueForReview,
  notifyTarotDueReviewsIfAllowed,
} from '../../journal/review-remind.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(1, Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000)));
}

export type TarotReviewBannerOptions = {
  onOpenEntry?: (entry: JournalEntry) => void;
};

/** 塔罗占问满 3 天未写感悟时的置顶提示；并复用浏览器通知权限 */
export function mountTarotReviewBanner(
  host: HTMLElement,
  options: TarotReviewBannerOptions = {},
): void {
  host.querySelector('.tarot-review-banner')?.remove();
  const due = listTarotDueForReview();
  if (due.length === 0) return;

  const first = due[0];
  const openFirst = (): void => {
    if (options.onOpenEntry) options.onOpenEntry(first);
    else navigate('/journal');
  };

  const more = due.length > 1 ? `（另有 ${due.length - 1} 条）` : '';
  const age = daysSince(first.createdAt);
  const cardHint = first.cards.map((c) => c.name).slice(0, 2).join('、') || '占问';

  const banner = document.createElement('aside');
  banner.className = 'tarot-review-banner';
  banner.setAttribute('role', 'status');
  banner.innerHTML = `
    <p class="tarot-review-banner-title">该回手札写结局了${more}</p>
    <div class="tarot-review-card">
      <p class="tarot-review-card-meta">已 ${age} 天 · ${escapeHtml(cardHint)}</p>
      <p class="tarot-review-card-q">${escapeHtml(first.question)}</p>
      <p class="tarot-review-card-sum">写下来后来怎样了，对照当时牌面会更有收获。</p>
    </div>
    <button type="button" class="btn btn-secondary btn-sm tarot-review-banner-cta">去写感悟</button>
  `;
  banner.querySelector('button')?.addEventListener('click', openFirst);
  host.prepend(banner);

  void notifyTarotDueReviewsIfAllowed(due, (entry) => {
    if (options.onOpenEntry) options.onOpenEntry(entry);
    else navigate('/journal');
  });
}
