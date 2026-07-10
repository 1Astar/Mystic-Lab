import { navigate } from '../router.ts';
import { loadXiaoliurenJournal, updateXiaoliurenReflection } from '../xiaoliuren/journal.ts';
import { mountEnvBanner } from '../ui/banner.ts';

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
    <p class="page-subtitle">每次起课记录 / 问题 / 农历与时辰依据</p>
  `;
  page.append(header);

  const listHost = document.createElement('div');
  listHost.className = 'xlr-journal-list';
  page.append(listHost);
  root.appendChild(page);

  function renderList(): void {
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
      const date = new Date(entry.createdAt);
      item.innerHTML = `
        <div class="xlr-journal-head">
          <strong>${entry.resultName}</strong>
          <time>${date.toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</time>
        </div>
        <p class="xlr-journal-q">${entry.question || '（未填写问题）'}</p>
        <p class="xlr-journal-basis">${entry.lunar.label} · ${entry.hour.label}</p>
        <p class="xlr-journal-summary">${entry.summary}</p>
        <textarea class="question-input xlr-journal-reflect" rows="2" placeholder="后来的感悟…">${entry.reflection}</textarea>
      `;
      item.querySelector('textarea')?.addEventListener('input', (e) => {
        updateXiaoliurenReflection(entry.id, (e.target as HTMLTextAreaElement).value);
      });
      listHost.appendChild(item);
    }
  }

  renderList();
}
