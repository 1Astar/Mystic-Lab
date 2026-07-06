import { navigate } from '../router.ts';
import { TAROT_DECK } from '../tarot/deck.ts';
import {
  getAllEntries,
  getCodexEntry,
  getCodexProgress,
  isCardCollected,
  savePersonalNote,
  themeMeanings,
  toggleFavorite,
  cardOneLiner,
} from '../codex/collection.ts';
import { mountEnvBanner } from '../ui/banner.ts';

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
  back.textContent = '← 返回首页';
  back.addEventListener('click', () => navigate('/'));

  page.append(back);
  root.appendChild(page);

  function render(): void {
    page.querySelector('.codex-body')?.remove();

    const body = document.createElement('div');
    body.className = 'codex-body';

    const collected = getAllEntries();
    const collectedIds = new Set(collected.map((e) => e.cardId));
    const favoriteIds = new Set(collected.filter((e) => e.favorite).map((e) => e.cardId));

    const progress = getCodexProgress(TAROT_DECK.length);

    body.innerHTML = `
      <header>
        <h1 class="page-title">随心图鉴</h1>
        <p class="page-subtitle">已收集的牌与卦 · 点开慢慢看懂</p>
      </header>
      <div class="codex-progress">
        <p class="codex-progress-main">已收集 <strong>${progress.collected}</strong> / ${progress.total} 张塔罗牌</p>
        ${progress.topSuitLabel ? `<p class="codex-progress-sub">最近遇见最多的是：<strong>${progress.topSuitLabel}</strong></p>` : ''}
        ${progress.topThemeLabel ? `<p class="codex-progress-sub">你最近最常问的是：<strong>${progress.topThemeLabel}</strong></p>` : ''}
      </div>
      <div class="codex-tabs" role="tablist">
        <button type="button" data-f="collected" class="${filter === 'collected' ? 'is-active' : ''}">已收集</button>
        <button type="button" data-f="all" class="${filter === 'all' ? 'is-active' : ''}">全部</button>
        <button type="button" data-f="favorite" class="${filter === 'favorite' ? 'is-active' : ''}">收藏</button>
      </div>
      <div class="codex-grid"></div>
    `;

    body.querySelectorAll<HTMLButtonElement>('.codex-tabs button').forEach((btn) => {
      btn.addEventListener('click', () => {
        filter = btn.dataset.f as CodexFilter;
        selectedId = null;
        render();
      });
    });

    const grid = body.querySelector('.codex-grid')!;
    const cards = TAROT_DECK.filter((card) => {
      const isCol = collectedIds.has(card.id);
      if (filter === 'collected') return isCol;
      if (filter === 'favorite') return favoriteIds.has(card.id);
      return true;
    });

    if (cards.length === 0) {
      grid.innerHTML = `
        <div class="meditate-box">
          <p>还没有收集到牌。</p>
          <p style="margin-top:8px">完成一次「随心占问」，抽到的牌会自动解锁到这里。</p>
          <button type="button" class="btn" style="margin-top:14px">去占问</button>
        </div>`;
      grid.querySelector('button')?.addEventListener('click', () => navigate('/divination'));
    } else {
      for (const card of cards) {
        const col = isCardCollected(card.id);
        const entry = getCodexEntry(card.id);
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `codex-cell ${col ? 'is-collected' : 'is-locked'}`;
        cell.innerHTML = `
          <span class="codex-symbol" style="--card-color:${card.color}">${card.symbol}</span>
          <span class="codex-name">${card.nameZh}</span>
          ${entry && entry.count > 1 ? `<span class="codex-count">×${entry.count}</span>` : ''}
          ${entry?.favorite ? '<span class="codex-fav">★</span>' : ''}
        `;
        cell.addEventListener('click', () => {
          if (!col) return;
          selectedId = card.id;
          renderDetail();
        });
        grid.appendChild(cell);
      }
    }

    page.appendChild(body);

    if (selectedId) renderDetail();
  }

  function renderDetail(): void {
    page.querySelector('.codex-detail')?.remove();
    if (!selectedId) return;

    const card = TAROT_DECK.find((c) => c.id === selectedId);
    const entry = getCodexEntry(selectedId);
    if (!card || !entry) return;

    const themes = themeMeanings(card);
    const detail = document.createElement('aside');
    detail.className = 'codex-detail';
    detail.innerHTML = `
      <button type="button" class="codex-detail-close" aria-label="关闭">✕</button>
      <div class="codex-meet-banner">
        你已经与这张牌相遇 <strong>${entry.count}</strong> 次
      </div>
      <div class="codex-detail-head" style="--card-color:${card.color}">
        <span class="codex-detail-symbol">${card.symbol}</span>
        <div>
          <h2>${card.nameZh}</h2>
          <p>${card.nameEn} · ${card.arcana === 'major' ? '大阿卡纳' : '小阿卡纳'}</p>
          <p class="codex-keywords">关键词：${card.keywords.join(' / ')}</p>
        </div>
      </div>
      <p class="codex-oneliner">${cardOneLiner(card, false)}</p>
      <section class="codex-section">
        <h3>在不同问题里</h3>
        <ul class="codex-theme-list">
          <li>${themes.work}</li>
          <li>${themes.love}</li>
          <li>${themes.study}</li>
          <li>${themes.self}</li>
        </ul>
      </section>
      <section class="codex-section">
        <h3>相遇记录</h3>
        ${entry.encounters.map((e) => `
          <div class="codex-encounter">
            <time>${new Date(e.at).toLocaleString('zh-CN')}</time>
            <p>${e.question ? `问：${e.question}` : '（未记录问题）'}</p>
            <p>${e.spreadLabel} · ${e.reversed ? '逆位' : '正位'}</p>
          </div>`).join('')}
      </section>
      <section class="codex-section">
        <h3>我的感想</h3>
        <textarea class="codex-note-input" rows="3" placeholder="写下对这张牌的感想…">${entry.personalNote}</textarea>
        <button type="button" class="btn btn-secondary codex-save-note">保存感想</button>
      </section>
      <button type="button" class="btn btn-ghost codex-fav-btn">${entry.favorite ? '取消收藏' : '收藏此牌'}</button>
    `;

    detail.querySelector('.codex-detail-close')?.addEventListener('click', () => {
      selectedId = null;
      detail.remove();
    });

    detail.querySelector('.codex-save-note')?.addEventListener('click', () => {
      const ta = detail.querySelector<HTMLTextAreaElement>('.codex-note-input');
      if (ta) savePersonalNote(selectedId!, ta.value);
    });

    detail.querySelector('.codex-fav-btn')?.addEventListener('click', () => {
      toggleFavorite(selectedId!);
      render();
    });

    page.appendChild(detail);
  }

  render();
}
