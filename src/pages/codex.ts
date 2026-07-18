import { navigate } from '../router.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import {
  getAllEntries,
  getCodexProgress,
  getCodexSuitBreakdown,
} from '../codex/collection.ts';
import { mountCodexAllView } from '../ui/codex-all-view.ts';
import { mountCodexJourneyPanel } from '../ui/codex-journey-panel.ts';
import { mountCodexFlatGrid } from '../codex/grid.ts';
import { openCodexCardDetail } from '../codex/detail-host.ts';
import { mountEnvBanner } from '../ui/banner.ts';
import { mountCodexLearnCards } from '../ui/codex-learn-cards.ts';

type CodexFilter = 'all' | 'collected' | 'favorite';

export function renderCodex(root: HTMLElement): void {
  let filter: CodexFilter = 'collected';
  let selectedId: string | null = null;

  const page = document.createElement('div');
  page.className = 'page codex-page';
  mountEnvBanner(page);

  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'back-link';
  back.textContent = '← 返回塔罗';
  back.addEventListener('click', () => navigate('/tarot'));
  page.append(back);
  root.appendChild(page);

  const detailHost = {
    page,
    get selectedId() {
      return selectedId;
    },
    set selectedId(v: string | null) {
      selectedId = v;
    },
    onClose: () => {
      selectedId = null;
    },
    onRefresh: () => render(),
  };

  function renderDetail(): void {
    if (!selectedId) return;
    openCodexCardDetail(detailHost, selectedId);
  }

  function render(): void {
    page.querySelector('.codex-body')?.remove();
    page.querySelector('.codex-detail')?.remove();

    const body = document.createElement('div');
    body.className = 'codex-body';

    const collected = getAllEntries();
    const collectedIds = new Set(collected.map((e) => e.cardId));
    const favoriteIds = new Set(collected.filter((e) => e.favorite).map((e) => e.cardId));
    const progress = getCodexProgress(TAROT_DECK.length);
    const suitBreakdown = getCodexSuitBreakdown();

    body.innerHTML = `
      <header>
        <h1 class="page-title">随心图鉴</h1>
        <p class="page-subtitle">已收集的牌与卦 · 点开慢慢看懂</p>
      </header>
      <section class="codex-section-block">
        <h2 class="codex-section-label">已收集概览</h2>
        <div class="codex-progress">
          <p class="codex-progress-main">已收集 <strong>${progress.collected}</strong> / ${progress.total} 张塔罗牌</p>
          <ul class="codex-progress-suits">
            ${suitBreakdown
              .map(
                (s) => `
              <li class="codex-progress-suit">
                <span class="codex-progress-suit-label">${s.label}</span>
                <span class="codex-progress-suit-count"><strong>${s.collected}</strong>/${s.total}</span>
                <span class="codex-progress-suit-bar" aria-hidden="true"><i style="width:${
                  s.total ? Math.round((s.collected / s.total) * 100) : 0
                }%"></i></span>
              </li>`,
              )
              .join('')}
          </ul>
          ${progress.topSuitLabel ? `<p class="codex-progress-sub">最近遇见最多的是：<strong>${progress.topSuitLabel}</strong></p>` : ''}
          ${progress.topThemeLabel ? `<p class="codex-progress-sub">你最近最常问的是：<strong>${progress.topThemeLabel}</strong></p>` : ''}
        </div>
      </section>
      <section class="codex-section-block">
        <div class="codex-journey-host"></div>
      </section>
      <section class="codex-section-block">
        <h2 class="codex-section-label">学习入口</h2>
        <div class="codex-learn-host"></div>
      </section>
      <section class="codex-section-block codex-filter-block">
        <div class="codex-tabs" role="tablist">
          <button type="button" data-f="collected" class="${filter === 'collected' ? 'is-active' : ''}">已收集</button>
          <button type="button" data-f="all" class="${filter === 'all' ? 'is-active' : ''}">全部</button>
          <button type="button" data-f="favorite" class="${filter === 'favorite' ? 'is-active' : ''}">收藏</button>
        </div>
        <div class="codex-grid-host"></div>
      </section>
    `;

    const journeyHost = body.querySelector('.codex-journey-host') as HTMLElement;
    mountCodexJourneyPanel(journeyHost);

    const learnHost = body.querySelector('.codex-learn-host') as HTMLElement;
    mountCodexLearnCards(learnHost);

    body.querySelectorAll<HTMLButtonElement>('.codex-tabs button').forEach((btn) => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.f as CodexFilter;
        selectedId = null;
        render();
      });
    });

    const gridHost = body.querySelector('.codex-grid-host') as HTMLElement;
    const cards = TAROT_DECK.filter((card) => {
      const isCol = collectedIds.has(card.id);
      if (filter === 'collected') return isCol;
      if (filter === 'favorite') return favoriteIds.has(card.id);
      return true;
    });

    const onSelect = (deckId: string) => {
      selectedId = deckId;
      renderDetail();
    };

    if (cards.length === 0) {
      const emptyMsg =
        filter === 'favorite'
          ? {
              title: '还没有收藏的牌。',
              sub: '在图鉴里点开已收集的牌，点「收藏此牌」即可加入这里。',
            }
          : filter === 'collected'
            ? {
                title: '还没有收集到牌。',
                sub: '完成一次「随心占问」，抽到的牌会自动解锁到这里。',
              }
            : {
                title: '图鉴空空如也。',
                sub: '完成占问后，抽到的牌会出现在「已收集」里。',
              };

      gridHost.innerHTML = `
        <div class="codex-empty meditate-box">
          <p>${emptyMsg.title}</p>
          <p style="margin-top:8px">${emptyMsg.sub}</p>
          ${filter !== 'favorite' ? '<button type="button" class="btn" style="margin-top:14px">去占问</button>' : ''}
        </div>`;
      gridHost.querySelector('button')?.addEventListener('click', () => navigate('/tarot/reading'));
    } else if (filter === 'all') {
      mountCodexAllView(gridHost, cards, onSelect);
    } else {
      mountCodexFlatGrid(gridHost, cards, onSelect);
    }

    page.appendChild(body);
    if (selectedId) renderDetail();
  }

  render();
}
