import { navigate } from '../router.ts';
import {
  findSiblingJourneyItems,
  otherSystemLabel,
  otherSystemReadingPath,
  stashCrossAskQuestion,
} from '../journal/cross-ask.ts';
import {
  countFavoriteCards,
  filterJourneyItems,
  loadJourneyItems,
  palmJourneyProgressLabel,
  type JourneyItem,
} from '../journal/journey.ts';
import { resolveJournalReading } from '../journal/replay.ts';
import {
  fulfilledLabel,
  getXiaoliurenJournalEntry,
  isXiaoliurenDueForReview,
  updateXiaoliurenFulfilled,
  updateXiaoliurenReflection,
} from '../xiaoliuren/journal.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountJournalDetail } from '../ui/journal-detail.ts';
import { mountXiaoliurenReviewBanner } from '../ui/xiaoliuren/review-banner.ts';

type JourneyTab = 'all' | 'tarot' | 'xiaoliuren' | 'favorites' | 'progress' | 'notes';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function systemLabel(system: JourneyItem['system']): string {
  return system === 'tarot' ? '塔罗' : '小六壬';
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function renderJourney(root: HTMLElement): void {
  const page = document.createElement('div');
  page.className = 'page journey-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回 Mystic Lab';
  back.addEventListener('click', () => navigate('/'));

  const header = document.createElement('header');
  header.innerHTML = `
    <h1 class="page-title">我的旅程</h1>
    <p class="page-subtitle">各体系占问记录 · 收藏 · 进度 · 笔记</p>
  `;

  const reviewHost = document.createElement('div');
  reviewHost.className = 'journey-review-host';

  const tabs = document.createElement('nav');
  tabs.className = 'journey-tabs';
  tabs.setAttribute('aria-label', '旅程分区');

  const listHost = document.createElement('div');
  listHost.className = 'journey-list';

  page.append(back, header, reviewHost, tabs, listHost);
  root.appendChild(page);

  let active: JourneyTab = 'all';

  function closeDetail(): void {
    page.querySelector('.journal-detail')?.remove();
    page.querySelector('.journey-xlr-detail')?.remove();
  }

  function mountSiblingSummary(host: HTMLElement, item: JourneyItem): void {
    const siblings = findSiblingJourneyItems(item, loadJourneyItems());
    const section = document.createElement('section');
    section.className = 'journey-sibling';

    if (siblings.length === 0) {
      if (!item.question.trim()) return;
      const other = otherSystemLabel(item.system);
      section.innerHTML = `
        <h3 class="journey-sibling-title">同题对照</h3>
        <p class="journey-sibling-empty">还没有${other}记录。可用同一问题再看一眼。</p>
        <button type="button" class="btn btn-secondary btn-sm" data-cross>也用${other}看一眼</button>
      `;
      section.querySelector('[data-cross]')?.addEventListener('click', () => {
        stashCrossAskQuestion(item.question);
        navigate(otherSystemReadingPath(item.system));
      });
      host.appendChild(section);
      return;
    }

    const cards = siblings
      .map(
        (sib) => `
      <button type="button" class="journey-sibling-card" data-sib="${escapeHtml(sib.id)}">
        <span class="journey-system journey-system-${sib.system}">${systemLabel(sib.system)}</span>
        <span class="journey-sibling-summary">${escapeHtml(sib.summary)}</span>
        <span class="journey-sibling-date">${escapeHtml(formatDate(sib.createdAt))}</span>
      </button>`,
      )
      .join('');

    section.innerHTML = `
      <h3 class="journey-sibling-title">同题对照 · ${otherSystemLabel(item.system)}</h3>
      <div class="journey-sibling-list">${cards}</div>
    `;
    section.querySelectorAll<HTMLButtonElement>('[data-sib]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const sib = siblings.find((s) => s.id === btn.dataset.sib);
        if (!sib) return;
        if (sib.system === 'tarot') openTarotDetail(sib);
        else openXiaoliurenDetail(sib);
      });
    });
    host.appendChild(section);
  }

  function openTarotDetail(item: JourneyItem): void {
    const entry = item.tarot;
    if (!entry) return;
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
      mountSiblingSummary(detail, item);
      page.appendChild(detail);
    } catch {
      /* 卡牌数据异常时静默跳过 */
    }
  }

  function openXiaoliurenDetail(item: JourneyItem): void {
    const entry = getXiaoliurenJournalEntry(item.xiaoliuren?.id ?? '') ?? item.xiaoliuren;
    if (!entry) return;
    closeDetail();
    const due = isXiaoliurenDueForReview(entry);
    const later = fulfilledLabel(entry.fulfilled);
    const detail = document.createElement('aside');
    detail.className = 'journey-xlr-detail';
    detail.innerHTML = `
      <button type="button" class="journal-detail-close" aria-label="关闭">✕</button>
      <header class="journal-detail-head">
        <time class="journal-detail-date">${escapeHtml(formatDate(entry.createdAt))}</time>
        <h2 class="journal-detail-question">${escapeHtml(entry.question || '（未填写问题）')}</h2>
        <p class="journal-detail-meta">${escapeHtml(entry.resultName)} · ${escapeHtml(entry.lunar.label)} · ${escapeHtml(entry.hour.label)}</p>
      </header>
      <p class="journal-detail-summary">${escapeHtml(entry.summary)}</p>
      ${due ? '<p class="xlr-journal-due">待对照 · 起课已满 3 天</p>' : ''}
      ${later ? `<p class="journal-fulfilled">${escapeHtml(later)}</p>` : ''}
      <div class="xlr-journal-actions" style="margin-top:12px">
        <button type="button" class="btn btn-ghost btn-sm" data-yes>应验</button>
        <button type="button" class="btn btn-ghost btn-sm" data-no>未应验</button>
      </div>
      <label class="journey-xlr-reflect-label">后来的感悟</label>
      <textarea class="question-input journey-xlr-reflect" rows="3" placeholder="写下对照后来发生了什么…">${escapeHtml(entry.reflection)}</textarea>
      <button type="button" class="btn btn-secondary" data-save-xlr style="margin-top:12px">保存感悟</button>
      <button type="button" class="btn btn-ghost" data-go-xlr-journal style="margin-top:8px">打开小六壬手札</button>
    `;
    detail.querySelector('.journal-detail-close')?.addEventListener('click', closeDetail);
    detail.querySelector('[data-yes]')?.addEventListener('click', () => {
      updateXiaoliurenFulfilled(entry.id, true);
      closeDetail();
      renderTabs();
      renderBody();
    });
    detail.querySelector('[data-no]')?.addEventListener('click', () => {
      updateXiaoliurenFulfilled(entry.id, false);
      closeDetail();
      renderTabs();
      renderBody();
    });
    detail.querySelector('[data-save-xlr]')?.addEventListener('click', () => {
      const ta = detail.querySelector<HTMLTextAreaElement>('.journey-xlr-reflect');
      if (ta) {
        updateXiaoliurenReflection(entry.id, ta.value);
        renderBody();
      }
    });
    detail.querySelector('[data-go-xlr-journal]')?.addEventListener('click', () => {
      navigate('/xiaoliuren/journal');
    });
    mountSiblingSummary(detail, item);
    page.appendChild(detail);
  }

  function renderTabs(): void {
    const items = loadJourneyItems();
    const favCount = countFavoriteCards();
    const defs: { id: JourneyTab; label: string; count?: number }[] = [
      { id: 'all', label: '全部', count: items.length },
      {
        id: 'tarot',
        label: '塔罗记录',
        count: items.filter((i) => i.system === 'tarot').length,
      },
      {
        id: 'xiaoliuren',
        label: '小六壬记录',
        count: items.filter((i) => i.system === 'xiaoliuren').length,
      },
      { id: 'favorites', label: '收藏牌面', count: favCount },
      { id: 'progress', label: '学习进度' },
      {
        id: 'notes',
        label: '我的笔记',
        count: filterJourneyItems(items, 'notes').length,
      },
    ];

    tabs.innerHTML = defs
      .map(
        (d) => `
      <button type="button" class="journey-tab${active === d.id ? ' is-active' : ''}" data-tab="${d.id}">
        ${d.label}${d.count !== undefined ? ` · ${d.count}` : ''}
      </button>`,
      )
      .join('');

    tabs.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab as JourneyTab;
        if (tab === 'favorites') {
          navigate('/tarot/tujian');
          return;
        }
        if (tab === 'progress') {
          navigate('/xiaoliuren/palm-journey');
          return;
        }
        active = tab;
        closeDetail();
        renderTabs();
        renderBody();
      });
    });
  }

  function renderBody(): void {
    mountXiaoliurenReviewBanner(reviewHost, {
      onOpenEntry: (entry) => {
        active = 'xiaoliuren';
        renderTabs();
        renderBody();
        const match = loadJourneyItems().find((i) => i.xiaoliuren?.id === entry.id);
        if (match) openXiaoliurenDetail(match);
      },
    });

    listHost.innerHTML = '';
    if (active === 'favorites' || active === 'progress') return;

    const items = filterJourneyItems(loadJourneyItems(), active);

    if (items.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'meditate-box journey-empty';
      const hints = {
        all: '还没有旅程记录。完成一次塔罗占问或小六壬起课后，会出现在这里。',
        tarot: '还没有塔罗记录。',
        xiaoliuren: '还没有小六壬记录。',
        notes: '还没有写下感悟的笔记。可在记录里补充「后来的感悟」。',
      } as const;
      empty.innerHTML = `<p>${hints[active]}</p>`;
      const actions = document.createElement('div');
      actions.className = 'journey-empty-actions';
      if (active === 'all' || active === 'tarot') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn';
        btn.textContent = '去塔罗占问';
        btn.addEventListener('click', () => navigate('/tarot/reading'));
        actions.appendChild(btn);
      }
      if (active === 'all' || active === 'xiaoliuren') {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-ghost';
        btn.textContent = '去小六壬起课';
        btn.addEventListener('click', () => navigate('/xiaoliuren/reading'));
        actions.appendChild(btn);
      }
      empty.appendChild(actions);
      listHost.appendChild(empty);

      const progressHint = document.createElement('p');
      progressHint.className = 'journey-progress-hint';
      progressHint.textContent = palmJourneyProgressLabel();
      listHost.appendChild(progressHint);
      return;
    }

    const allItems = loadJourneyItems();
    for (const item of items) {
      const siblingCount = findSiblingJourneyItems(item, allItems).length;
      const article = document.createElement('article');
      article.className = 'journey-item';
      article.innerHTML = `
        <div class="journey-item-head">
          <span class="journey-system journey-system-${item.system}">${systemLabel(item.system)}</span>
          <time>${escapeHtml(formatDate(item.createdAt))}</time>
        </div>
        <p class="journey-question">${escapeHtml(item.question || '（未记录问题）')}</p>
        <p class="journey-summary">${escapeHtml(item.summary)}</p>
        ${item.statusLabel ? `<p class="journey-badge">${escapeHtml(item.statusLabel)}</p>` : ''}
        ${
          siblingCount > 0
            ? `<p class="journey-sibling-hint">另有 ${otherSystemLabel(item.system)} 同题对照</p>`
            : ''
        }
        ${item.reflection.trim() ? `<p class="journey-note-preview">笔记：${escapeHtml(item.reflection.trim())}</p>` : ''}
        <p class="journey-open-hint">点击查看详情 →</p>
      `;
      article.addEventListener('click', () => {
        if (item.system === 'tarot') openTarotDetail(item);
        else openXiaoliurenDetail(item);
      });
      listHost.appendChild(article);
    }
  }

  renderTabs();
  renderBody();
}
