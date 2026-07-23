import { navigate } from '../router.ts';
import { NOTE_TAG_OPTIONS } from '../liuyao/result-layers.ts';
import {
  journalMetaLine,
  loadLiuyaoJournal,
  updateLiuyaoFulfilled,
  updateLiuyaoReflection,
  updateLiuyaoTags,
} from '../liuyao/journal.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { openLiuyaoEncounterReplay } from '../ui/liuyao-encounter-replay.ts';

export function renderLiuyaoJournal(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page ly-journal-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回六爻';
  back.addEventListener('click', () => navigate('/liuyao'));

  page.append(back);

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">我的卦象</h1>
    <p class="page-subtitle">历史起卦 · 点卡片回看当时 · 标签与感悟</p>
  `;
  page.append(header);

  const filterHost = document.createElement('div');
  filterHost.className = 'ly-journal-filters';
  filterHost.innerHTML = `
    <button type="button" class="ly-note-tag is-on" data-filter="">全部</button>
    ${NOTE_TAG_OPTIONS.map((t) => `<button type="button" class="ly-note-tag" data-filter="${t}">#${t}</button>`).join('')}
  `;
  page.append(filterHost);

  const listHost = document.createElement('div');
  listHost.className = 'ly-journal-list';
  page.append(listHost);
  root.appendChild(page);

  let filter = '';

  filterHost.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter ?? '';
      filterHost.querySelectorAll('.ly-note-tag').forEach((b) => b.classList.remove('is-on'));
      btn.classList.add('is-on');
      renderList();
    });
  });

  function renderList(): void {
    listHost.innerHTML = '';
    let entries = loadLiuyaoJournal();
    if (filter) entries = entries.filter((e) => e.tags.includes(filter));

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'ly-journal-empty';
      empty.innerHTML = `
        <p>${filter ? '这个标签下还没有记录' : '还没有起卦记录'}</p>
        <button type="button" class="btn ly-btn-gold">去起卦</button>
      `;
      empty.querySelector('button')?.addEventListener('click', () => navigate('/liuyao/reading'));
      listHost.appendChild(empty);
      return;
    }

    for (const entry of entries) {
      const item = document.createElement('article');
      item.className = 'ly-journal-item ly-journal-item-clickable';
      const changed = entry.changedFullName
        ? `<span class="ly-journal-changed">变 ${entry.changedFullName}</span>`
        : '';
      const tags = entry.tags.map((t) => `<span class="ly-journal-tag">#${t}</span>`).join('');
      const fulfilledLabel =
        entry.fulfilled === true
          ? '后来觉得：有呼应'
          : entry.fulfilled === false
            ? '后来觉得：不太准'
            : '';
      item.innerHTML = `
        <div class="ly-journal-head">
          <strong>${entry.primaryFullName}</strong>
          ${changed}
          <time>${new Date(entry.createdAt).toLocaleString('zh-CN', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}</time>
        </div>
        <p class="ly-journal-meta">${journalMetaLine(entry)}</p>
        <p class="ly-journal-q">${entry.question || '（未填写问题）'}</p>
        <p class="ly-journal-summary">${entry.summary}</p>
        <p class="ly-journal-open-hint">点击查看当时卦象与解读 →</p>
        <div class="ly-journal-tag-row">${tags || '<span class="ly-guide-tip">未打标签</span>'}</div>
        <div class="ly-note-tags ly-journal-tag-edit">
          ${NOTE_TAG_OPTIONS.map(
            (t) =>
              `<button type="button" class="ly-note-tag${entry.tags.includes(t) ? ' is-on' : ''}" data-edit-tag="${t}">#${t}</button>`,
          ).join('')}
        </div>
        ${fulfilledLabel ? `<p class="ly-journal-fulfilled">${fulfilledLabel}</p>` : ''}
        <textarea class="question-input ly-journal-reflect" rows="2" placeholder="后来的感悟…">${entry.reflection}</textarea>
        <div class="ly-journal-actions">
          <button type="button" class="btn ly-btn-gold btn-sm" data-save>保存感悟</button>
          <button type="button" class="btn btn-ghost btn-sm" data-yes>有呼应</button>
          <button type="button" class="btn btn-ghost btn-sm" data-no>不太准</button>
        </div>
      `;

      item.addEventListener('click', () => {
        openLiuyaoEncounterReplay(page, entry);
      });
      item.querySelector('.ly-journal-reflect')?.addEventListener('click', (e) => e.stopPropagation());
      item.querySelector('.ly-journal-actions')?.addEventListener('click', (e) => e.stopPropagation());
      item.querySelector('.ly-journal-tag-edit')?.addEventListener('click', (e) => e.stopPropagation());
      item.querySelector('.ly-journal-tag-row')?.addEventListener('click', (e) => e.stopPropagation());

      item.querySelector('textarea')?.addEventListener('input', (e) => {
        updateLiuyaoReflection(entry.id, (e.target as HTMLTextAreaElement).value);
      });
      item.querySelectorAll<HTMLButtonElement>('[data-edit-tag]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const tag = btn.dataset.editTag!;
          const next = entry.tags.includes(tag)
            ? entry.tags.filter((t) => t !== tag)
            : [...entry.tags, tag];
          updateLiuyaoTags(entry.id, next);
          renderList();
        });
      });
      item.querySelector('[data-save]')?.addEventListener('click', () => {
        const ta = item.querySelector<HTMLTextAreaElement>('.ly-journal-reflect');
        if (ta) updateLiuyaoReflection(entry.id, ta.value);
      });
      item.querySelector('[data-yes]')?.addEventListener('click', () => {
        updateLiuyaoFulfilled(entry.id, true);
        renderList();
      });
      item.querySelector('[data-no]')?.addEventListener('click', () => {
        updateLiuyaoFulfilled(entry.id, false);
        renderList();
      });
      listHost.appendChild(item);
    }
  }

  renderList();
}
