import { navigate } from '../router.ts';
import {
  fulfilledLabel,
  isXiaoliurenDueForReview,
  loadXiaoliurenJournal,
  updateXiaoliurenFulfilled,
  updateXiaoliurenReflection,
} from '../xiaoliuren/journal.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountXiaoliurenReviewBanner } from '../ui/xiaoliuren/review-banner.ts';

export function renderXiaoliurenJournal(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page xlr-journal-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回小六壬';
  back.addEventListener('click', () => navigate('/xiaoliuren'));

  page.append(back);

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">小六壬手札</h1>
    <p class="page-subtitle">每次起课记录 / 问题 / 农历与时辰依据 / 三天后对照</p>
  `;
  page.append(header);

  const reviewHost = document.createElement('div');
  reviewHost.className = 'xlr-journal-review-host';
  page.append(reviewHost);

  const listHost = document.createElement('div');
  listHost.className = 'xlr-journal-list';
  page.append(listHost);
  root.appendChild(page);

  function renderList(): void {
    mountXiaoliurenReviewBanner(reviewHost, {
      onOpenEntry: (entry) => {
        const el = listHost.querySelector(`[data-id="${entry.id}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      },
    });

    listHost.innerHTML = '';
    const entries = loadXiaoliurenJournal();

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'xlr-journal-empty';
      empty.innerHTML = `
        <p>还没有起课记录</p>
        <button type="button" class="btn">去起课</button>
      `;
      empty.querySelector('button')?.addEventListener('click', () => navigate('/xiaoliuren/reading'));
      listHost.appendChild(empty);
      return;
    }

    for (const entry of entries) {
      const item = document.createElement('article');
      item.className = 'xlr-journal-item';
      item.dataset.id = entry.id;
      const date = new Date(entry.createdAt);
      const due = isXiaoliurenDueForReview(entry);
      const later = fulfilledLabel(entry.fulfilled);
      item.innerHTML = `
        <div class="xlr-journal-head">
          <strong>${entry.resultName}</strong>
          <time>${date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
        </div>
        <p class="xlr-journal-q">${entry.question || '（未填写问题）'}</p>
        <p class="xlr-journal-basis">${entry.lunar.label} · ${entry.hour.label}</p>
        <p class="xlr-journal-summary">${entry.summary}</p>
        ${due ? '<p class="xlr-journal-due">待对照 · 起课已满 3 天</p>' : ''}
        ${later ? `<p class="journal-fulfilled">${later}</p>` : ''}
        <textarea class="question-input xlr-journal-reflect" rows="2" placeholder="后来的感悟…">${entry.reflection}</textarea>
        <div class="xlr-journal-actions">
          <button type="button" class="btn btn-ghost btn-sm" data-yes>应验</button>
          <button type="button" class="btn btn-ghost btn-sm" data-no>未应验</button>
        </div>
      `;
      item.querySelector('textarea')?.addEventListener('input', (e) => {
        updateXiaoliurenReflection(entry.id, (e.target as HTMLTextAreaElement).value);
      });
      item.querySelector('[data-yes]')?.addEventListener('click', () => {
        updateXiaoliurenFulfilled(entry.id, true);
        renderList();
      });
      item.querySelector('[data-no]')?.addEventListener('click', () => {
        updateXiaoliurenFulfilled(entry.id, false);
        renderList();
      });
      listHost.appendChild(item);
    }
  }

  renderList();
}
