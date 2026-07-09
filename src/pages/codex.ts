import { navigate } from '../router.ts';

import { TAROT_DECK } from '../tarot/deck.ts';

import { formatCardNameZh } from '../tarot/card-names.ts';

import { cardFaceImageHtml } from '../tarot/card-images.ts';

import {

  getAllEntries,

  getCodexEntry,

  getCodexProgress,

  isCardCollected,

  savePersonalNote,

  toggleFavorite,

} from '../codex/collection.ts';

import { mountEnvBanner } from '../ui/banner.ts';

import { mountCodexDetail } from '../ui/codex-detail.ts';

import { mountCodexPreview } from '../ui/codex-preview.ts';

import { mountCodexStoryMap } from '../ui/codex-story-map.ts';



type CodexFilter = 'all' | 'collected' | 'favorite';

type CodexView = 'collection' | 'story';



export function renderCodex(root: HTMLElement): void {

  let view: CodexView = 'collection';

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



  function renderDetail(): void {

    page.querySelector('.codex-detail')?.remove();

    if (!selectedId) return;



    const card = TAROT_DECK.find((c) => c.id === selectedId);

    if (!card) return;



    const detail = document.createElement('aside');

    const collected = isCardCollected(selectedId);

    const entry = getCodexEntry(selectedId);



    if (collected && entry) {

      mountCodexDetail(detail, card, entry, {

        onClose: () => {

          selectedId = null;

          detail.remove();

        },

        onSaveNote: (note) => savePersonalNote(selectedId!, note),

        onToggleFavorite: () => {

          toggleFavorite(selectedId!);

          render();

        },

      });

    } else {

      mountCodexPreview(detail, card, {

        onClose: () => {

          selectedId = null;

          detail.remove();

        },

        onDraw: () => navigate('/divination'),

      });

    }



    page.appendChild(detail);

  }



  function render(): void {

    page.querySelector('.codex-body')?.remove();



    const body = document.createElement('div');

    body.className = 'codex-body';



    const collected = getAllEntries();

    const collectedIds = new Set(collected.map((e) => e.cardId));

    const favoriteIds = new Set(collected.filter((e) => e.favorite).map((e) => e.cardId));

    const progress = getCodexProgress(TAROT_DECK.length);



    const subtitle =

      view === 'collection'

        ? '抽到一张，点亮一张 · 点开慢慢看懂'

        : '大阿卡那成长线 · 从愚者到世界';



    body.innerHTML = `

      <header>

        <h1 class="page-title">随心图鉴</h1>

        <p class="page-subtitle">${subtitle}</p>

      </header>

      <div class="codex-view-tabs" role="tablist">

        <button type="button" data-view="collection" class="${view === 'collection' ? 'is-active' : ''}">收集图鉴</button>

        <button type="button" data-view="story" class="${view === 'story' ? 'is-active' : ''}">愚人之旅</button>

      </div>

      <div class="codex-view-host"></div>

    `;



    body.querySelectorAll<HTMLButtonElement>('.codex-view-tabs button').forEach((btn) => {

      btn.addEventListener('click', () => {

        view = btn.dataset.view as CodexView;

        selectedId = null;

        render();

      });

    });



    const host = body.querySelector('.codex-view-host') as HTMLElement;



    if (view === 'story') {

      mountCodexStoryMap(host, {

        onSelectCard: (deckId) => {

          selectedId = deckId;

          renderDetail();

        },

      });

    } else {

      const collection = document.createElement('div');

      collection.className = 'codex-collection-view';

      collection.innerHTML = `

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



      collection.querySelectorAll<HTMLButtonElement>('.codex-tabs button').forEach((btn) => {

        btn.addEventListener('click', () => {

          filter = btn.dataset.f as CodexFilter;

          selectedId = null;

          render();

        });

      });



      const grid = collection.querySelector('.codex-grid')!;

      const cards = TAROT_DECK.filter((card) => {

        const isCol = collectedIds.has(card.id);

        if (filter === 'collected') return isCol;

        if (filter === 'favorite') return favoriteIds.has(card.id);

        return true;

      });



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



        grid.innerHTML = `

          <div class="codex-empty meditate-box">

            <p>${emptyMsg.title}</p>

            <p style="margin-top:8px">${emptyMsg.sub}</p>

            ${filter !== 'favorite' ? '<button type="button" class="btn" style="margin-top:14px">去占问</button>' : ''}

          </div>`;

        grid.querySelector('button')?.addEventListener('click', () => navigate('/divination'));

      } else {

        for (const card of cards) {

          const col = isCardCollected(card.id);

          const entry = getCodexEntry(card.id);

          const cell = document.createElement('button');

          cell.type = 'button';

          cell.className = `codex-cell ${col ? 'is-collected' : 'is-locked'}`;

          const nameCn = formatCardNameZh(card);

          cell.innerHTML = `

            <div class="codex-cell-face">

              ${cardFaceImageHtml(card.id, nameCn, 'codex-cell-img')}

              ${col ? '' : '<span class="codex-cell-lock" aria-hidden="true">未遇</span>'}

            </div>

            <span class="codex-name">${nameCn}</span>

            ${entry && entry.count > 1 ? `<span class="codex-count">×${entry.count}</span>` : ''}

            ${entry?.favorite ? '<span class="codex-fav">★</span>' : ''}

          `;

          cell.addEventListener('click', () => {

            selectedId = card.id;

            renderDetail();

          });

          grid.appendChild(cell);

        }

      }



      host.appendChild(collection);

    }



    page.appendChild(body);



    if (selectedId) renderDetail();

  }



  render();

}


