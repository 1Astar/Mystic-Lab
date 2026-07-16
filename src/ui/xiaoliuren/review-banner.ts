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

export type ReviewBannerOptions = {
  /** 点击某条待对照时；缺省则跳转小六壬手札 */
  onOpenEntry?: (entry: XiaoliurenJournalEntry) => void;
};

/** 满 3 天未标对照时置顶提示；无待办则不渲染 */
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

  const banner = document.createElement('aside');
  banner.className = 'xlr-review-banner';
  banner.setAttribute('role', 'status');
  const more = due.length > 1 ? `（另有 ${due.length - 1} 条）` : '';
  banner.innerHTML = `
    <p class="xlr-review-banner-title">有课该对照了${more}</p>
    <p class="xlr-review-banner-body">
      「${escapeHtml(first.question || '未填写问题')}」· ${escapeHtml(first.resultName)} · 起课已满 3 天
    </p>
    <button type="button" class="btn btn-secondary btn-sm xlr-review-banner-cta">去对照</button>
  `;
  banner.querySelector('button')?.addEventListener('click', openFirst);
  host.prepend(banner);

  void notifyDueReviewsIfAllowed(due, (entry) => {
    if (options.onOpenEntry) options.onOpenEntry(entry);
    else navigate('/xiaoliuren/journal');
  });
}
