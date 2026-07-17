import { navigate } from '../../router.ts';
import { notifyDueReviewsIfAllowed } from '../../xiaoliuren/browser-notify.ts';
import {
  listXiaoliurenDueForReview,
  type XiaoliurenJournalEntry,
} from '../../xiaoliuren/journal.ts';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatReviewWhen(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const md = `${d.getMonth() + 1}/${d.getDate()}`;
  const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  return `${md} ${hm}`;
}

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(1, Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000)));
}

export type ReviewBannerOptions = {
  onOpenEntry?: (entry: XiaoliurenJournalEntry) => void;
};

/** 满 3 天未标对照时置顶提示；卡片展示时间、落位、问题 */
export function mountXiaoliurenReviewBanner(
  host: HTMLElement,
  options: ReviewBannerOptions = {},
): void {
  host.querySelector('.xlr-review-banner')?.remove();
  const due = listXiaoliurenDueForReview();
  if (due.length === 0) return;

  const first = due[0];
  const openFirst = (): void => {
    if (options.onOpenEntry) options.onOpenEntry(first);
    else navigate('/xiaoliuren/journal');
  };

  const when = formatReviewWhen(first.createdAt);
  const age = daysSince(first.createdAt);
  const hasQ = Boolean(first.question.trim());
  const questionLine = hasQ
    ? first.question
    : '当时未填写问题 · 打开后可对照落位与解读，也可补写感悟';

  const banner = document.createElement('aside');
  banner.className = 'xlr-review-banner';
  banner.setAttribute('role', 'status');
  const more = due.length > 1 ? `（另有 ${due.length - 1} 条）` : '';
  banner.innerHTML = `
    <p class="xlr-review-banner-title">有课该对照了${more}</p>
    <div class="xlr-review-card">
      <div class="xlr-review-card-meta">
        <span>${escapeHtml(when || first.solarLabel)}</span>
        <span>·</span>
        <strong>落${escapeHtml(first.resultName)}</strong>
        <span>·</span>
        <span>已 ${age} 天</span>
      </div>
      <p class="xlr-review-card-q${hasQ ? '' : ' is-empty'}">${escapeHtml(questionLine)}</p>
      <p class="xlr-review-card-sum">${escapeHtml(first.summary)}</p>
    </div>
    <button type="button" class="btn btn-secondary btn-sm xlr-review-banner-cta">${hasQ ? '去对照' : '打开这课 · 对照落位'}</button>
  `;
  banner.querySelector('button')?.addEventListener('click', openFirst);
  host.prepend(banner);

  void notifyDueReviewsIfAllowed(due, (entry) => {
    if (options.onOpenEntry) options.onOpenEntry(entry);
    else navigate('/xiaoliuren/journal');
  });
}
