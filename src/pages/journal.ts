import { navigate } from '../router.ts';
import {
  backfillJournalFromCodex,
  loadJournalEntries,
  updateJournalFulfilled,
  updateJournalReflection,
  type JournalEntry,
} from '../journal/records.ts';
import { resolveJournalReading } from '../journal/replay.ts';
import { mountJournalDetail } from '../ui/journal-detail.ts';
import { mountTarotReviewBanner } from '../ui/tarot/review-banner.ts';

export function renderJournal(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回塔罗';
  back.addEventListener('click', () => navigate('/tarot'));

  page.append(back);

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">随心手札</h1>
    <p class="page-subtitle">抽牌记录 / 当时的问题 / 后来的感悟</p>
  `;
  page.appendChild(header);

  const reviewHost = document.createElement('div');
  reviewHost.className = 'tarot-journal-review-host';
  page.appendChild(reviewHost);

  function closeDetail(): void {
    page.querySelector('.journal-detail')?.remove();
  }

  function openDetail(entry: JournalEntry): void {
    try {
      const { reading, regenerated } = resolveJournalReading(entry);
      closeDetail();
      const detail = document.createElement('aside');
      mountJournalDetail(detail, {
        entry,
        reading,
        regenerated,
        onClose: closeDetail,
      });
      page.appendChild(detail);
    } catch {
      /* 卡牌数据异常时静默跳过 */
    }
  }

  function renderList(): void {
    page.querySelector('.journal-list')?.remove();
    page.querySelector('.meditate-box')?.remove();
    backfillJournalFromCodex();
    mountTarotReviewBanner(reviewHost, {
      onOpenEntry: (entry) => openDetail(entry),
    });
    const entries = loadJournalEntries();

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'meditate-box';
      empty.innerHTML = `
        <p>还没有手札。</p>
        <p style="margin-top:10px">完成占问后，可在这里回看问题、结果，并补充后来的感悟。</p>
      `;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn';
      btn.style.marginTop = '16px';
      btn.textContent = '去占问';
      btn.addEventListener('click', () => navigate('/tarot/reading'));
      empty.appendChild(btn);
      page.appendChild(empty);
      return;
    }

    const list = document.createElement('div');
    list.className = 'journal-list';

    for (const entry of entries) {
      const item = document.createElement('article');
      item.className = 'journal-item journal-item-clickable';
      const date = new Date(entry.createdAt).toLocaleString('zh-CN');
      const isPartial = entry.status === 'partial';
      const fulfilledLabel =
        !isPartial && entry.fulfilled === true
          ? '后来觉得：有呼应'
          : !isPartial && entry.fulfilled === false
            ? '后来觉得：不太准'
            : '';

      item.innerHTML = `
        <time class="journal-date">${date}${isPartial ? ' · <span class="journal-badge">未完成</span>' : ''}</time>
        <p class="journal-question">${entry.question || '（未记录问题）'}</p>
        <p class="journal-cards">${entry.cards.map((c) => `${c.position}·${c.name}`).join(' / ')}</p>
        <p class="journal-note">${isPartial ? entry.summary : entry.learningNote}</p>
        <p class="journal-open-hint">点击查看牌面与解读 →</p>
        ${fulfilledLabel ? `<p class="journal-fulfilled">${fulfilledLabel}</p>` : ''}
        <textarea class="journal-reflection" rows="2" placeholder="后来的感悟…">${entry.reflection}</textarea>
        <div class="journal-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-save>保存感悟</button>
          ${isPartial ? '' : `
          <button type="button" class="btn btn-ghost btn-sm" data-yes>有呼应</button>
          <button type="button" class="btn btn-ghost btn-sm" data-no>不太准</button>`}
        </div>
      `;

      item.addEventListener('click', () => openDetail(entry));
      item.querySelector('.journal-reflection')?.addEventListener('click', (e) => e.stopPropagation());
      item.querySelector('.journal-actions')?.addEventListener('click', (e) => e.stopPropagation());

      item.querySelector('[data-save]')?.addEventListener('click', () => {
        const ta = item.querySelector<HTMLTextAreaElement>('.journal-reflection');
        if (ta) updateJournalReflection(entry.id, ta.value);
      });
      item.querySelector('[data-yes]')?.addEventListener('click', () => {
        updateJournalFulfilled(entry.id, true);
        renderList();
      });
      item.querySelector('[data-no]')?.addEventListener('click', () => {
        updateJournalFulfilled(entry.id, false);
        renderList();
      });

      list.appendChild(item);
    }
    page.appendChild(list);
  }

  renderList();
  root.appendChild(page);
}
