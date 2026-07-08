import { navigate } from '../router.ts';
import {
  backfillJournalFromCodex,
  loadJournalEntries,
  updateJournalFulfilled,
  updateJournalReflection,
} from '../journal/records.ts';

export function renderJournal(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page';

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回首页';
  back.addEventListener('click', () => navigate('/'));

  page.append(back);

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">随心手札</h1>
    <p class="page-subtitle">抽牌记录 / 当时的问题 / 后来的感悟</p>
  `;
  page.appendChild(header);

  backfillJournalFromCodex();
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
    btn.addEventListener('click', () => navigate('/divination'));
    empty.appendChild(btn);
    page.appendChild(empty);
  } else {
    const list = document.createElement('div');
    list.className = 'journal-list';

    for (const entry of entries) {
      const item = document.createElement('article');
      item.className = 'journal-item';
      const date = new Date(entry.createdAt).toLocaleString('zh-CN');
      const fulfilledLabel =
        entry.fulfilled === true
          ? '后来觉得：有呼应'
          : entry.fulfilled === false
            ? '后来觉得：不太准'
            : '';

      item.innerHTML = `
        <time class="journal-date">${date}</time>
        <p class="journal-question">${entry.question || '（未记录问题）'}</p>
        <p class="journal-cards">${entry.cards.map((c) => `${c.position}·${c.name}`).join(' / ')}</p>
        <p class="journal-note">${entry.learningNote}</p>
        ${fulfilledLabel ? `<p class="journal-fulfilled">${fulfilledLabel}</p>` : ''}
        <textarea class="journal-reflection" rows="2" placeholder="后来的感悟…">${entry.reflection}</textarea>
        <div class="journal-actions">
          <button type="button" class="btn btn-secondary btn-sm" data-save>保存感悟</button>
          <button type="button" class="btn btn-ghost btn-sm" data-yes>有呼应</button>
          <button type="button" class="btn btn-ghost btn-sm" data-no>不太准</button>
        </div>
      `;

      item.querySelector('[data-save]')?.addEventListener('click', () => {
        const ta = item.querySelector<HTMLTextAreaElement>('.journal-reflection');
        if (ta) updateJournalReflection(entry.id, ta.value);
      });
      item.querySelector('[data-yes]')?.addEventListener('click', () => {
        updateJournalFulfilled(entry.id, true);
        navigate('/journal');
      });
      item.querySelector('[data-no]')?.addEventListener('click', () => {
        updateJournalFulfilled(entry.id, false);
        navigate('/journal');
      });

      list.appendChild(item);
    }
    page.appendChild(list);
  }

  root.appendChild(page);
}
